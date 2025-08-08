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
            switch (action) {
                case 'createNewRicevuta':
                    return await handleCreateNewRicevuta(context,  requestBody);
                
                case 'buildRicevuta':
                    return await handleBuildRicevuta(context, param1, param2, param3);
                
                case 'printNewRicevuta':
                    return await handlePrintNewRicevuta(context, request.body);
                
                case 'retrieveRicevutaForUser':
                    return await handleRetrieveRicevutaForUser(context, param1);
                
                case 'updateIncassi':
                    return await handleUpdateIncassi(context, request.body);
                
                case 'annulRicevuta':
                    return await handleAnnulRicevuta(context, request.body);
                
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



async function handleCreateNewRicevuta(context, ricevutaData) {
    try {
        const { error, value } = validateRicevutaAttivita(ricevutaData,context);
        
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
                INSERT INTO ricevuteAttività (
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
                    ricevuteAttività ra
                    INNER JOIN attività a ON ra.attivitàId = a.id
                    INNER JOIN soci s ON ra.socioId = s.id
            )
            SELECT *
            FROM ProgressiveReceipts
            WHERE socioId = @socioId;
        `;
        
        
        const result = await request.query(query);
        
        const ricevute = result.recordset.map(row => normalizeRicevutaAttivitaResponse(row));
        
        context.log(`${result.recordset.length} ricevute trovate per socio ${socioId}`);
        return createSuccessResponse({ items: ricevute });
        
    } catch (error) {
        context.log('Errore nel recupero ricevute utente:', error);
        return createErrorResponse(500, 'Errore nel recupero ricevute utente', error.message);
    }
}

async function handleUpdateIncassi(context, incassoData) {
    try {
        if (!incassoData.ricevutaId && !incassoData.id) {
            return createErrorResponse(400, 'ID ricevuta richiesto');
        }
        
        const ricevutaId = incassoData.ricevutaId || incassoData.id;
        
        const pool = await getPool();
        const request = pool.request();
        request.input('ricevutaId', sql.Int, ricevutaId);
        request.input('importoIncassato', sql.Int, incassoData.importoIncassato || 0);
        request.input('tipologiaPagamento', sql.Int, incassoData.tipologiaPagamento || 0);
        
        const updateQuery = `
            UPDATE ricevuteAttività SET 
                importoIncassato = @importoIncassato,
                tipologiaPagamento = @tipologiaPagamento
            WHERE id = @ricevutaId
        `;
        
        const result = await request.query(updateQuery);
        
        if (result.rowsAffected[0] === 0) {
            return createErrorResponse(404, 'Ricevuta non trovata');
        }
        
        context.log(`Incasso aggiornato per ricevuta ${ricevutaId}`);
        
        return createSuccessResponse({
            returnCode: true,
            message: 'Incasso aggiornato con successo'
        });
        
    } catch (error) {
        context.log.error('Errore nell\'aggiornamento incassi:', error);
        return createErrorResponse(500, 'Errore nell\'aggiornamento incassi', error.message);
    }
}

async function handleAnnulRicevuta(context, annullamentoData) {
    try {
        if (!annullamentoData.ricevutaId && !annullamentoData.id) {
            return createErrorResponse(400, 'ID ricevuta richiesto');
        }
        
        const ricevutaId = annullamentoData.ricevutaId || annullamentoData.id;
        
        const pool = await getPool();
        const request = pool.request();
        request.input('ricevutaId', sql.Int, ricevutaId);
        
        // For this new schema, we'll delete the record instead of marking as annullata
        // since the original schema doesn't have annullata fields
        const deleteQuery = `
            DELETE FROM ricevuteAttività WHERE id = @ricevutaId
        `;
        
        const result = await request.query(deleteQuery);
        
        if (result.rowsAffected[0] === 0) {
            return createErrorResponse(404, 'Ricevuta non trovata');
        }
        
        context.log(`Ricevuta ${ricevutaId} annullata (cancellata)`);
        
        return createSuccessResponse({
            returnCode: true,
            message: 'Ricevuta annullata con successo'
        });
        
    } catch (error) {
        context.log.error('Errore nell\'annullamento ricevuta:', error);
        return createErrorResponse(500, 'Errore nell\'annullamento ricevuta', error.message);
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
                (SELECT TOP 1 a.nome FROM tesserati t 
                 INNER JOIN attività a ON t.attivitàId = a.id 
                 WHERE t.socioId = s.id 
                 ORDER BY t.id DESC) as attivitaNome,
                -- Get receipt statistics
                COUNT(ra.id) as numeroRicevute,
                SUM(ra.importoIncassato) as totaleIncassato,
                SUM(ra.importoRicevuta) as totaleRicevute
            FROM soci s
            LEFT JOIN ricevuteAttività ra ON s.id = ra.socioId
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
        
        // Normalize the response
        const scheda = {
            ...normalizeSocioResponse(socio),
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