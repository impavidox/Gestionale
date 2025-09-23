const { app } = require('@azure/functions');
const { getPool, sql } = require('../../shared/database/connection');
const { createSuccessResponse, createErrorResponse } = require('../../shared/utils/responseHelper');
const { validateRicevutaAttivita, normalizeRicevutaAttivitaResponse } = require('../../shared/models/RicevutaAttivita');

app.http('ricevuta', {
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'ricevuta/{action?}/{param1?}/{param2?}/{param3?}',
    handler: async (request, context) => {
        context.log(`Ricevuta API chiamata: ${request.method} ${request.url}`);

        try {
            const action = request.params.action;
            const param1 = request.params.param1;
            const param2 = request.params.param2;
            const param3 = request.params.param3;

            // Handle CORS preflight
            if (request.method === 'OPTIONS') {
                return {
                    status: 200,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                    }
                };
            }

            context.log(`Action: ${action}, Params: ${param1}, ${param2}, ${param3}`);
            let requestBody = null;
            // Only attempt to read body for POST/PUT requests
            if (request.method === 'POST' || request.method === 'PUT') {
                try {
                    // This reads the entire stream ONCE and parses it as JSON
                    requestBody = await request.json();
                    context.log('Request body (parsed JSON):', requestBody);
                } catch (jsonError) {
                    context.log('Error parsing JSON body:', jsonError.message);
                    return createErrorResponse(400, 'Invalid JSON body provided', jsonError.message);
                }
            }

            // Parse query parameters for GET requests
            let queryParams = {};
            if (request.method === 'GET' && request.url) {
                const url = new URL(request.url);
                queryParams = Object.fromEntries(url.searchParams);
                context.log('Query parameters:', queryParams);
            }

            switch (action) {
                case 'createNewRicevuta':
                    return await handleCreateNewRicevuta(context, requestBody);
                
                case 'buildRicevuta':
                    return await handleBuildRicevuta(context, param1, param2, param3);
                
                case 'printNewRicevuta':
                    return await handlePrintNewRicevuta(context, requestBody);
                
                case 'retrieveRicevutaForUser':
                    return await handleRetrieveRicevutaForUser(context, param1);
                
                case 'retrieveAllByDateRange':
                    return await handleRetrieveAllByDateRange(context, queryParams);
                
                case 'updateRicevuta':
                    return await handleUpdateRicevuta(context, requestBody);
                
                case 'annulRicevuta':
                    return await handleAnnulRicevuta(context, requestBody);
                
                case 'prepareScheda':
                    return await handlePrepareScheda(context, param1);
                
                default:
                    return createErrorResponse(404, `Endpoint '${action}' non trovato`);
            }
        } catch (error) {
            context.log('Errore nella function ricevuta:', error);
            return createErrorResponse(500, 'Errore interno del server', error.message);
        }
    }
});

// Helper function to parse date from DD-MM-YYYY format
function parseDate(dateString) {
    if (!dateString) return null;
    
    // Handle DD-MM-YYYY format
    const parts = dateString.split('-');
    if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JS
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day);
    }
    
    // Fallback to standard date parsing
    return new Date(dateString);
}

async function handleRetrieveAllByDateRange(context, queryParams) {
    try {
        const { startDate, endDate, type } = queryParams;
        
        if (!startDate || !endDate) {
            return createErrorResponse(400, 'startDate e endDate sono richiesti (formato DD-MM-YYYY)');
        }
        
        // Parse dates from DD-MM-YYYY format
        const parsedStartDate = parseDate(startDate);
        const parsedEndDate = parseDate(endDate);
        
        if (!parsedStartDate || !parsedEndDate) {
            return createErrorResponse(400, 'Date non valide. Usare formato DD-MM-YYYY');
        }
        
        context.log(`Recupero ricevute dal ${startDate} al ${endDate}, tipo: ${type || 'tutti'}`);
        
        const pool = await getPool();
        const request = pool.request();
        
        // Build the query
        let whereClause = 'WHERE ra.dataRicevuta >= @startDate AND ra.dataRicevuta <= @endDate';
        
        // Add type filter if specified
        if (type && parseInt(type) > 0) {
            whereClause += ' AND ra.tipologiaPagamento = @tipoPagamento';
            request.input('tipoPagamento', sql.Int, parseInt(type));
        }
        
        request.input('startDate', sql.Date, parsedStartDate);
        request.input('endDate', sql.Date, parsedEndDate);
        
        const query = `
            WITH ProgressiveReceipts AS (
                SELECT
                    ra.*,
                    a.nome AS attivitaNome,
                    s.nome AS socioNome,
                    s.cognome AS socioCognome,
                    ROW_NUMBER() OVER (
                        PARTITION BY
                        CASE
                            WHEN MONTH(ra.dataRicevuta) >= 9 THEN YEAR(ra.dataRicevuta)
                            ELSE YEAR(ra.dataRicevuta) - 1
                        END
                        ORDER BY
                        ra.dataRicevuta, ra.id
                    ) AS numero_ricevuta_progressivo
                FROM
                    ricevuteAttivitàrivoli ra
                    INNER JOIN attivitàrivoli a ON ra.attivitàId = a.id
                    INNER JOIN socirivoli s ON ra.socioId = s.id
                ${whereClause}
            )
            SELECT *
            FROM ProgressiveReceipts
            ORDER BY dataRicevuta, id;
        `;
        
        const result = await request.query(query);
        
        // Process the results
        const ricevute = result.recordset.map(row => {
            const normalized = normalizeRicevutaAttivitaResponse(row);
            
            // Add additional fields needed for Prima Nota
            return {
                ...normalized,
                numero: row.numero_ricevuta_progressivo,
                attivitaNome: row.attivitaNome,
                socioNome: row.socioNome,
                socioCognome: row.socioCognome,
                // Convert amounts from cents to euros for display
                importoRicevutaEuro: (row.importoRicevuta || 0),
                importoIncassatoEuro: (row.importoIncassato || 0)
            };
        });
        
        // Calculate totals by payment type
        const totaliPerTipo = {
            1: { nome: 'POS', totale: 0, count: 0 },
            2: { nome: 'Contanti', totale: 0, count: 0 },
            3: { nome: 'Bonifico', totale: 0, count: 0 }
        };
        
        let totaleGenerale = 0;
        
        ricevute.forEach(ricevuta => {
            const tipo = ricevuta.tipologiaPagamento || 2; // Default to Contanti
            const importo = ricevuta.importoRicevutaEuro || 0;
            
            if (totaliPerTipo[tipo]) {
                totaliPerTipo[tipo].totale += importo;
                totaliPerTipo[tipo].count += 1;
            }
            
            totaleGenerale += importo;
        });
        
        context.log(`${ricevute.length} ricevute trovate nel periodo ${startDate} - ${endDate}`);
        
        return createSuccessResponse({
            items: ricevute,
            totaleGenerale,
            totaliPerTipo,
            periodo: {
                inizio: startDate,
                fine: endDate
            },
            filtro: {
                tipo: type ? parseInt(type) : 0,
                descrizione: type ? totaliPerTipo[parseInt(type)]?.nome || 'Tutti' : 'Tutti'
            }
        });
        
    } catch (error) {
        context.log('Errore nel recupero ricevute per data range:', error);
        return createErrorResponse(500, 'Errore nel recupero ricevute per data range', error.message);
    }
}

async function handleCreateNewRicevuta(context, ricevutaData) {
    try {
        const { error, value } = validateRicevutaAttivita(ricevutaData, context);
        
        if (error) {
            context.log('Dati ricevuta non validi:', error.details);
            return createErrorResponse(400, 'Dati ricevuta non validi', error.details);
        }
        
        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        
        try {
            const request = new sql.Request(transaction);
            
            const insertQuery = `
                INSERT INTO ricevuteAttivitàrivoli (
                    attivitàId, socioId, importoRicevuta, importoIncassato, 
                    tipologiaPagamento, quotaAss, scadenzaQuota, 
                    dataRicevuta, scadenzaPagamento, created_at
                ) OUTPUT INSERTED.id VALUES (
                    @attivitaId, @socioId, @importoRicevuta, @importoIncassato,
                    @tipologiaPagamento, @quotaAss, @scadenzaQuota,
                    @dataRicevuta, @scadenzaPagamento, GETDATE()
                )
            `;
            request.input('attivitaId', sql.Int, value.attivitàId);
            request.input('socioId', sql.Int, value.socioId);
            request.input('importoRicevuta', sql.Int, value.importoRicevuta || 0);
            request.input('importoIncassato', sql.Int, value.importoIncassato || 0);
            request.input('tipologiaPagamento', sql.Int, value.tipologiaPagamento || 0);
            request.input('quotaAss', sql.Int, value.quotaAss || 0);
            request.input('scadenzaQuota', sql.Date, value.scadenzaQuota || null);
            request.input('dataRicevuta', sql.Date, value.dataRicevuta || new Date());
            request.input('scadenzaPagamento', sql.Date, value.scadenzaPagamento || null);
            
            const result = await request.query(insertQuery);
            const ricevutaId = result.recordset[0].id;
            
            await transaction.commit();
            
            context.log(`Ricevuta attività creata con ID: ${ricevutaId}`);
            
            return createSuccessResponse({
                id: ricevutaId,
                returnCode: true,
                testPrint: true,
                message: 'Ricevuta creata con successo'
            });
            
        } catch (dbError) {
            await transaction.rollback();
            throw dbError;
        }
        
    } catch (error) {
        context.log('Errore nella creazione ricevuta:', error);
        return createErrorResponse(500, 'Errore nella creazione ricevuta', error.message);
    }
}

async function handleUpdateRicevuta(context, ricevutaData) {
    try {
        // Validate required fields
        if (!ricevutaData.idRicevuta && !ricevutaData.id) {
            return createErrorResponse(400, 'ID ricevuta richiesto per la modifica');
        }

        const ricevutaId = ricevutaData.idRicevuta || ricevutaData.id;
        
        // Validate the incoming data
        const { error, value } = validateRicevutaAttivita(ricevutaData, context);
        
        if (error) {
            context.log('Dati ricevuta non validi per l\'aggiornamento:', error.details);
            return createErrorResponse(400, 'Dati ricevuta non validi per l\'aggiornamento', error.details);
        }

        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        
        try {
            const request = new sql.Request(transaction);
            
            // First, check if the receipt exists
            request.input('ricevutaId', sql.Int, parseInt(ricevutaId));
            
            const checkQuery = `SELECT id FROM ricevuteAttivitàrivoli WHERE id = @ricevutaId`;
            const checkResult = await request.query(checkQuery);
            
            if (checkResult.recordset.length === 0) {
                await transaction.rollback();
                return createErrorResponse(404, 'Ricevuta non trovata');
            }

            // Update all fields with the complete receipt data
            const requestUpdate = new sql.Request(transaction);
            requestUpdate.input('ricevutaId', sql.Int, parseInt(ricevutaId));
            requestUpdate.input('attivitaId', sql.Int, value.attivitàId);
            requestUpdate.input('socioId', sql.Int, value.socioId);
            requestUpdate.input('importoRicevuta', sql.Int, value.importoRicevuta || 0);
            requestUpdate.input('importoIncassato', sql.Int, value.importoIncassato || 0);
            requestUpdate.input('tipologiaPagamento', sql.Int, value.tipologiaPagamento || 0);
            requestUpdate.input('quotaAss', sql.Int, value.quotaAss || 0);
            requestUpdate.input('scadenzaQuota', sql.Date, value.scadenzaQuota || null);
            requestUpdate.input('dataRicevuta', sql.Date, value.dataRicevuta || new Date());
            requestUpdate.input('scadenzaPagamento', sql.Date, value.scadenzaPagamento || null);

            const updateQuery = `
                UPDATE ricevuteAttivitàrivoli 
                SET 
                    attivitàId = @attivitaId,
                    socioId = @socioId,
                    importoRicevuta = @importoRicevuta,
                    importoIncassato = @importoIncassato,
                    tipologiaPagamento = @tipologiaPagamento,
                    quotaAss = @quotaAss,
                    scadenzaQuota = @scadenzaQuota,
                    dataRicevuta = @dataRicevuta,
                    scadenzaPagamento = @scadenzaPagamento
                WHERE id = @ricevutaId
            `;

            context.log(`Aggiornamento completo ricevuta ${ricevutaId}`);
            
            const updateResult = await requestUpdate.query(updateQuery);
            
            if (updateResult.rowsAffected[0] === 0) {
                await transaction.rollback();
                return createErrorResponse(404, 'Ricevuta non trovata o nessun aggiornamento effettuato');
            }

            await transaction.commit();
            
            context.log(`Ricevuta ${ricevutaId} aggiornata completamente con successo`);
            
            return createSuccessResponse({
                id: parseInt(ricevutaId),
                returnCode: true,
                success: true,
                testPrint: true,
                message: 'Ricevuta aggiornata con successo'
            });
            
        } catch (dbError) {
            await transaction.rollback();
            throw dbError;
        }
        
    } catch (error) {
        context.log('Errore nell\'aggiornamento ricevuta:', error);
        return createErrorResponse(500, 'Errore nell\'aggiornamento ricevuta', error.message);
    }
}

async function handleBuildRicevuta(context, socioId, abboId, ricevutaId) {
    try {
        if (!socioId || !ricevutaId) {
            return createErrorResponse(400, 'socioId e ricevutaId sono richiesti');
        }
        
        const pool = await getPool();
        const request = pool.request();
        request.input('socioId', sql.Int, parseInt(socioId));
        request.input('ricevutaId', sql.Int, parseInt(ricevutaId));
        
        const query = `
            WITH RicevuteConNumeroProgressivo AS (
                SELECT 
                    ra.*,
                    s.nome AS socioNome,
                    s.cognome AS socioCognome,
                    s.codiceFiscale,
                    s.dataNascita,
                    s.email,
                    CASE 
                        WHEN s.isEffettivo = 1 THEN '1'
                        WHEN s.isTesserato = 1 THEN '3' 
                    END as tipoSocio,
                    a.nome AS attivitaNome,
                    ROW_NUMBER() OVER (
                        PARTITION BY
                        CASE
                            WHEN MONTH(ra.dataRicevuta) >= 9 THEN YEAR(ra.dataRicevuta)
                            ELSE YEAR(ra.dataRicevuta) - 1
                        END
                        ORDER BY
                        ra.dataRicevuta, ra.id
                    ) AS numero_ricevuta_progressivo
                FROM ricevuteAttivitàrivoli ra
                INNER JOIN socirivoli s ON ra.socioId = s.id
                INNER JOIN attivitàrivoli a ON ra.attivitàId = a.id
            )
            SELECT *
            FROM RicevuteConNumeroProgressivo
            WHERE socioId = @socioId AND id = @ricevutaId
        `;
        
        const result = await request.query(query);
        
        if (result.recordset.length === 0) {
            return createErrorResponse(404, 'Ricevuta non trovata');
        }
        
        const ricevuta = result.recordset[0];
        const normalized = normalizeRicevutaAttivitaResponse(ricevuta);
        
        // Add additional fields for receipt display
        const ricevutaCompleta = {
            ...normalized,
            numero: ricevuta.numero_ricevuta_progressivo,
            nFattura: `${new Date().getFullYear()}-${ricevuta.numero_ricevuta_progressivo}`,
            socioNome: ricevuta.socioNome,
            socioCognome: ricevuta.socioCognome,
            codiceFiscale: ricevuta.codiceFiscale,
            dataNascita: ricevuta.dataNascita,
            email:ricevuta.email,
            attivitaNome: ricevuta.attivitaNome,
            tipoSocio: ricevuta.tipoSocio,
            // Convert amounts from cents to euros
            pagato: (ricevuta.importoRicevuta || 0) / 100,
            incassato: (ricevuta.importoIncassato || 0) / 100
        };
        
        context.log(`Ricevuta ${ricevutaId} recuperata per socio ${socioId}`);
        return createSuccessResponse(ricevutaCompleta);
        
    } catch (error) {
        context.log('Errore nel build ricevuta:', error);
        return createErrorResponse(500, 'Errore nel build ricevuta', error.message);
    }
}

async function handlePrintNewRicevuta(context, ricevutaData) {
    try {
        // This endpoint is used for both creating and updating receipts for printing
        // For now, we'll delegate to the create function
        return await handleCreateNewRicevuta(context, ricevutaData);
        
    } catch (error) {
        context.log('Errore nella stampa ricevuta:', error);
        return createErrorResponse(500, 'Errore nella stampa ricevuta', error.message);
    }
}

async function handleRetrieveRicevutaForUser(context, socioId) {
    try {
        if (!socioId) {
            return createErrorResponse(400, 'ID socio richiesto');
        }
        
        const pool = await getPool();
        const request = pool.request();
        request.input('socioId', sql.Int, parseInt(socioId));
        
        let query = `
            WITH ProgressiveReceipts AS (
                SELECT
                    ra.*,
                    a.nome AS attivitaNome,
                    s.nome + ' ' + s.cognome AS socioNome,
                    ROW_NUMBER() OVER (
                        PARTITION BY
                        CASE
                            WHEN MONTH(ra.dataRicevuta) >= 9 THEN YEAR(ra.dataRicevuta)
                            ELSE YEAR(ra.dataRicevuta) - 1
                        END
                        ORDER BY
                        ra.dataRicevuta, ra.id
                    ) AS numero_ricevuta_progressivo
                FROM
                    ricevuteAttivitàrivoli ra
                    INNER JOIN attivitàrivoli a ON ra.attivitàId = a.id
                    INNER JOIN socirivoli s ON ra.socioId = s.id
            )
            SELECT *
            FROM ProgressiveReceipts
            WHERE socioId = @socioId
            ORDER BY dataRicevuta DESC;
        `;
        
        const result = await request.query(query);
        
        const ricevute = result.recordset.map(row => {
            const normalized = normalizeRicevutaAttivitaResponse(row);
            return {
                ...normalized,
                numero: row.numero_ricevuta_progressivo,
                attivitaNome: row.attivitaNome,
                socioNome: row.socioNome
            };
        });
        
        context.log(`${result.recordset.length} ricevute trovate per socio ${socioId}`);
        return createSuccessResponse({ items: ricevute });
        
    } catch (error) {
        context.log('Errore nel recupero ricevute utente:', error);
        return createErrorResponse(500, 'Errore nel recupero ricevute utente', error.message);
    }
}

async function handleAnnulRicevuta(context, annullamentoData) {
    try {
        if (!annullamentoData.ricevutaId && !annullamentoData.id && !annullamentoData.idRicevuta) {
            return createErrorResponse(400, 'ID ricevuta richiesto');
        }
        
        const ricevutaId = annullamentoData.ricevutaId || annullamentoData.id || annullamentoData.idRicevuta;
        
        const pool = await getPool();
        const request = pool.request();
        request.input('ricevutaId', sql.Int, ricevutaId);
        
        // For this new schema, we'll delete the record instead of marking as annullata
        // since the original schema doesn't have annullata fields
        const deleteQuery = `
            DELETE FROM ricevuteAttivitàrivoli WHERE id = @ricevutaId
        `;
        
        const result = await request.query(deleteQuery);
        
        if (result.rowsAffected[0] === 0) {
            return createErrorResponse(404, 'Ricevuta non trovata');
        }
        
        context.log(`Ricevuta ${ricevutaId} annullata (cancellata)`);
        
        return createSuccessResponse({
            returnCode: true,
            rc: true,
            success: true,
            message: 'Ricevuta annullata con successo'
        });
        
    } catch (error) {
        context.log('Errore nella preparazione scheda:', error);
        return createErrorResponse(500, 'Errore nella preparazione scheda', error.message);
    }
}

async function handlePrepareScheda(context, socioId) {
    try {
        if (!socioId) {
            return createErrorResponse(400, 'ID socio richiesto');
        }
        
        const pool = await getPool();
        const request = pool.request();
        request.input('socioId', sql.Int, parseInt(socioId));
        
        const query = `
            SELECT 
                s.*, 
                -- Get tesserato info
                (SELECT TOP 1 a.nome FROM tesseratirivoli t 
                 INNER JOIN attivitàrivoli a ON t.attivitàId = a.id 
                 WHERE t.socioId = s.id 
                 ORDER BY t.id DESC) as attivitaNome,
                -- Get receipt statistics
                COUNT(ra.id) as numeroRicevute,
                SUM(ra.importoIncassato) as totaleIncassato,
                SUM(ra.importoRicevuta) as totaleRicevute
            FROM socirivoli s
            LEFT JOIN ricevuteAttivitàrivoli ra ON s.id = ra.socioId
            WHERE s.id = @socioId
            GROUP BY s.id, s.nome, s.cognome, s.codiceFiscale, s.sesso, s.dataNascita, 
                     s.provinciaNascita, s.comuneNascita, s.provinciaResidenza, s.comuneResidenza,
                     s.viaResidenza, s.capResidenza, s.telefono, s.email, s.scadenzaCertificato,
                     s.isAgonistico, s.privacy, s.dataPrivacy, s.isTesserato, s.isEffettivo,
                     s.isVolontario, s.dataIscrizione, s.created_at
        `;
        
        const result = await request.query(query);
        
        if (result.recordset.length === 0) {
            return createErrorResponse(404, 'Socio non trovato');
        }
        
        const socio = result.recordset[0];
        
        // Normalize the response (you'll need to implement normalizeSocioResponse)
        const scheda = {
            id: socio.id,
            nome: socio.nome,
            cognome: socio.cognome,
            codiceFiscale: socio.codiceFiscale,
            dataNascita: socio.dataNascita,
            provinciaNascita: socio.provinciaNascita,
            comuneNascita: socio.comuneNascita,
            provinciaResidenza: socio.provinciaResidenza,
            comuneResidenza: socio.comuneResidenza,
            viaResidenza: socio.viaResidenza,
            capResidenza: socio.capResidenza,
            telefono: socio.telefono,
            email: socio.email,
            scadenzaCertificato: socio.scadenzaCertificato,
            isAgonistico: socio.isAgonistico,
            attivitaNome: socio.attivitaNome,
            numeroRicevute: socio.numeroRicevute || 0,
            totaleIncassato: (socio.totaleIncassato || 0) / 100, // Convert from cents
            totaleRicevute: (socio.totaleRicevute || 0) / 100    // Convert from cents
        };
        
        context.log(`Scheda preparata per socio ${socioId}`);
        return createSuccessResponse(scheda);
        
    } catch (error) {
        context.log.error('Errore nella preparazione scheda:', error);
        return createErrorResponse(500, 'Errore nella preparazione scheda', error.message);
    }
}