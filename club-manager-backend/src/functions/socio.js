const { app } = require('@azure/functions');
const { getPool, sql } = require('../../shared/database/connection');
const { createSuccessResponse, createErrorResponse } = require('../../shared/utils/responseHelper');
const { validateSocio, normalizeSocioResponse } = require('../../shared/models/Socio');

app.http('socio', {
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'socio/{action?}/{param1?}/{param2?}/{param3?}/{param4?}/{param5?}/{param6?}',
    handler: async (request, context) => {
        context.log(`Socio API chiamata: ${request.method} ${request.url}`);

        try {
            const action = request.params.action;
            const params = {
                param1: request.params.param1,
                param2: request.params.param2,
                param3: request.params.param3,
                param4: request.params.param4,
                param5: request.params.param5,
                param6: request.params.param6
            };

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
                case 'retrieveSocio':
                    return await handleRetrieveSocio(context, params);
                
                case 'retrieveSocioById':
                    return await handleRetrieveSocioById(context, params.param1);
                
                case 'createSocio':
                    return await handleCreateSocio(context, requestBody);
                
                case 'updateSocio':
                    return await handleUpdateSocio(context, requestBody);
                
                case 'retrieveLibroSoci':
                    return await handleRetrieveLibroSoci(context, params.param1, params.param2);
                
                case 'retrieveStats':
                    return await handleRetrieveStats(context);
                
                default:
                    return createErrorResponse(404, `Endpoint '${action}' non trovato`);
            }
        } catch (error) {
            context.log('Errore nella function socio:', error);
            return createErrorResponse(500, 'Errore interno del server', error.message);
        }
    }
});

async function handleRetrieveSocio(context, params) {
    try {
        const { 
            param1: cognome, 
            param2: scadenza, 
            param3: attivita, 
            param4: scadute, 
            param5: anno,
            param6: sezione  // Add sezione parameter
        } = params;

        context.log('Recupero soci con filtri:', { cognome, scadenza, attivita, scadute, anno, sezione });

        const pool = await getPool();
        const request = pool.request();

        let query = `
            SELECT s.*, 
                CASE 
                    WHEN s.isEffettivo = 1 THEN 'Effettivo'
                    WHEN s.isTesserato = 1 THEN 'Tesserato' 
                    WHEN s.isVolontario = 1 THEN 'Volontario'
                    ELSE 'N/D' 
                END as TipoSocio,
                -- Check if socio has paid quota associativa 
                -- For Effettivi: check quotaAss = 1, For Tesserati: check if they have any receipt
                CASE 
                    WHEN s.isEffettivo = 1 THEN 
                        CASE WHEN EXISTS (
                            SELECT 1 FROM ricevuteAttività ra 
                            WHERE ra.socioId = s.id AND ra.quotaAss = 1
                        ) THEN 1 ELSE 0 END
                    WHEN s.isTesserato = 1 THEN 
                        CASE WHEN EXISTS (
                            SELECT 1 FROM ricevuteAttività ra 
                            WHERE ra.socioId = s.id
                        ) THEN 1 ELSE 0 END
                    ELSE 0 
                END as hasQuotaAssociativa,
                -- Get payment expiry for specific activity (if attivita filter is applied)
                ${attivita && attivita !== '0' ? `
                    (SELECT TOP 1 ra.scadenzaPagamento 
                     FROM ricevuteAttività ra 
                     WHERE ra.socioId = s.id AND ra.attivitàId = @attivita 
                     ORDER BY ra.dataRicevuta DESC) as scadenzaPagamentoAttivita,
                    (SELECT TOP 1 ra.importoIncassato 
                     FROM ricevuteAttività ra 
                     WHERE ra.socioId = s.id AND ra.attivitàId = @attivita 
                     ORDER BY ra.dataRicevuta DESC) as importoIncassatoAttivita,
                    (SELECT TOP 1 ra.dataRicevuta 
                     FROM ricevuteAttività ra 
                     WHERE ra.socioId = s.id AND ra.attivitàId = @attivita 
                     ORDER BY ra.dataRicevuta DESC) as dataUltimaRicevutaAttivita
                ` : `
                    NULL as scadenzaPagamentoAttivita,
                    NULL as importoIncassatoAttivita, 
                    NULL as dataUltimaRicevutaAttivita
                `},
                -- Get latest receipt info for general display
                (SELECT TOP 1 ra.scadenzaPagamento 
                 FROM ricevuteAttività ra 
                 WHERE ra.socioId = s.id 
                 ORDER BY ra.dataRicevuta DESC) as ultimaScadenzaPagamento
            FROM soci s
            WHERE 1=1
        `;


        if (cognome && cognome !== 'null') {
            query += ` AND s.cognome LIKE @cognome`;
            request.input('cognome', sql.NVarChar, `%${cognome}%`);
        }

        if (attivita && attivita !== '0') {
            // Filter by specific activity
            query += ` AND EXISTS (
                SELECT 1 FROM ricevuteAttività r 
                WHERE r.socioId = s.id AND r.attivitàId = @attivita
            )`;
            request.input('attivita', sql.Int, parseInt(attivita));
        } else if (attivita === '0' && sezione && sezione !== 'null' && sezione !== '0') {
            // Filter by sezione when attivita is 0
            // Assuming you need to join with activities table to get sezione
            query += ` AND EXISTS (
                SELECT 1 FROM ricevuteAttività ra 
                JOIN attività a ON ra.attivitàId = a.id 
                WHERE ra.socioId = s.id AND a.sezioneId = @sezione
            )`;
            request.input('sezione', sql.Int, parseInt(sezione));
        }

        if (scadenza === '1') {
            // Show only soci with expired certificate
            query += ` AND s.scadenzaCertificato < GETDATE()`;
        }

        if (scadute === '1' && attivita && attivita !== '0') {
            // Show only soci with expired subscription for the specific activity (based on latest receipt)
            query += ` AND (
                SELECT TOP 1 ra.scadenzaPagamento 
                FROM ricevuteAttività ra 
                WHERE ra.socioId = s.id AND ra.attivitàId = @attivita 
                ORDER BY ra.dataRicevuta DESC
            ) < GETDATE()`;
        }

        query += ` ORDER BY s.created_at, s.cognome`;

        const result = await request.query(query);

        // Normalize response for frontend compatibility
        const normalizedItems = result.recordset.map(item => {
            const normalized = normalizeSocioResponse(item);
            
            // Add the new fields for quota associativa and payment expiry
            return {
                ...normalized,
                hasQuotaAssociativa: item.hasQuotaAssociativa === 1,
                quotaAssociativaPagata: item.hasQuotaAssociativa === 1, // Alternative naming for frontend
                // Only include activity-specific fields if activity filter is applied
                ...(attivita && attivita !== '0' && {
                    scadenzaPagamentoAttivita: item.scadenzaPagamentoAttivita,
                    importoIncassatoAttivita: item.importoIncassatoAttivita,
                    dataUltimaRicevutaAttivita: item.dataUltimaRicevutaAttivita,
                    // For activity-specific display
                    abbonamento: {
                        scadenza: item.scadenzaPagamentoAttivita,
                        incassato: item.importoIncassatoAttivita > 0,
                        dataRicevuta: item.dataUltimaRicevutaAttivita
                    }
                }),
                ultimaScadenzaPagamento: item.ultimaScadenzaPagamento
            };
        });

        context.log(`${result.recordset.length} soci trovati`);
        return createSuccessResponse({ items: normalizedItems });

    } catch (error) {
        context.log('Errore nel recupero soci:', error);
        return createErrorResponse(500, 'Errore nel recupero soci', error.message);
    }
}

async function handleRetrieveSocioById(context, id) {
    try {
        if (!id) {
            return createErrorResponse(400, 'ID socio richiesto');
        }
        
        const pool = await getPool();
        const request = pool.request();
        request.input('id', sql.Int, parseInt(id));
        
        const query = `
            SELECT s.*
            FROM soci s
            WHERE s.id = @id
        `;
        
        const result = await request.query(query);
        
        if (result.recordset.length === 0) {
            return createErrorResponse(404, 'Socio non trovato');
        }
        
        const normalizedSocio = normalizeSocioResponse(result.recordset[0]);
        
        context.log(`Socio ${id} recuperato`);
        return createSuccessResponse(normalizedSocio);
        
    } catch (error) {
        context.log('Errore nel recupero socio:', error);
        return createErrorResponse(500, 'Errore nel recupero socio', error.message);
    }
}

async function handleCreateSocio(context, socioData) {
    try {
        var CodiceFiscale = require('codice-fiscale-js');
        socioData.codiceFiscale = new CodiceFiscale({
                name: socioData.nome,
                surname: socioData.cognome,
                gender: socioData.sesso,
                day: parseInt(socioData.dataNascita.substring(0, 2)),
                month: parseInt(socioData.dataNascita.substring(3, 5)),
                year: parseInt(socioData.dataNascita.substring(6, 10)),
                birthplace: socioData.comuneNascita, 
                birthplaceProvincia: socioData.provinciaNascita
            }).code;
        socioData.isScaduto = 1
                  
        const { error, value } = validateSocio(socioData);
        if (error) {
            context.log('Dati socio non validi:', error.details);
            return createErrorResponse(400, 'Dati non validi', error.details);
        }
        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        
        try {
            const request = new sql.Request(transaction);
            
            // Check for duplicate codice fiscale
            request.input('codiceFiscale', sql.NVarChar, value.codiceFiscale);
            const checkResult = await request.query('SELECT id FROM soci WHERE codiceFiscale = @codiceFiscale');
            
            if (checkResult.recordset.length > 0) {
                await transaction.rollback();
                return createErrorResponse(409, 'Socio con questo codice fiscale già esistente');
            }
            
            // Insert new socio
            const insertQuery = `
                INSERT INTO soci (
                    nome, cognome, codiceFiscale, sesso, dataNascita, 
                    provinciaNascita, comuneNascita, provinciaResidenza, comuneResidenza, 
                    viaResidenza, capResidenza, telefono, email, scadenzaCertificato,
                    isAgonistico, privacy, dataPrivacy, isTesserato, isEffettivo, 
                    isVolontario, dataIscrizione, isScaduto, created_at
                ) OUTPUT INSERTED.id VALUES (
                    @nome, @cognome, @codiceFiscale, @sesso, @dataNascita,
                    @provinciaNascita, @comuneNascita, @provinciaResidenza, @comuneResidenza,
                    @viaResidenza, @capResidenza, @telefono, @email, @scadenzaCertificato,
                    @isAgonistico, @privacy, @dataPrivacy, @isTesserato, @isEffettivo,
                    @isVolontario, @dataIscrizione, @isScaduto, GETDATE()
                )
            `;
            
            // Prepare parameters
            request.input('nome', sql.NVarChar(255), value.nome);
            request.input('cognome', sql.NVarChar(255), value.cognome);
            request.input('sesso', sql.NVarChar(10), value.sesso || null);
            request.input('dataNascita', sql.Date, value.dataNascita || null);
            request.input('provinciaNascita', sql.NVarChar(255), value.provinciaNascita || null);
            request.input('comuneNascita', sql.NVarChar(255), value.comuneNascita || null);
            request.input('provinciaResidenza', sql.NVarChar(255), value.provinciaResidenza || null);
            request.input('comuneResidenza', sql.NVarChar(255), value.comuneResidenza || null);
            request.input('viaResidenza', sql.NVarChar(255), value.viaResidenza || null);
            request.input('capResidenza', sql.NVarChar(10), value.capResidenza || null);
            request.input('telefono', sql.NVarChar(20), value.telefono || null);
            request.input('email', sql.NVarChar(255), value.email || null);
            request.input('scadenzaCertificato', sql.Date, value.scadenzaCertificato || null);
            request.input('isAgonistico', sql.Int, value.isAgonistico || 0);
            request.input('privacy', sql.Int, value.privacy || 0);
            request.input('dataPrivacy', sql.Date, value.dataPrivacy || null);
            request.input('isTesserato', sql.Int, value.isTesserato || 0);
            request.input('isEffettivo', sql.Int, value.isEffettivo || 0);
            request.input('isVolontario', sql.Int, value.isVolontario || 0);
            request.input('dataIscrizione', sql.Date, value.dataIscrizione || new Date());
            request.input('isScaduto', sql.Int, value.isScaduto || 0);

            const insertResult = await request.query(insertQuery);
            const newSocioId = insertResult.recordset[0].id;
            
            // Get current sports year
            const getFiscalYear = (date = new Date()) => (date < new Date(date.getFullYear(), 8, 1) ? date.getFullYear() : date.getFullYear() + 1).toString();
            const currentYear = getFiscalYear(); 

            // Handle membership types
            if (value.isTesserato && socioData.codice) {
                const tesseratoRequest = new sql.Request(transaction);
                tesseratoRequest.input('socioId', sql.Int, newSocioId);
                tesseratoRequest.input('codice', sql.VarChar(5), socioData.codice);
                tesseratoRequest.input('annoValidità', sql.VarChar(4), currentYear);
                
                // Get attivitàId from codice
                const attivitaResult = await tesseratoRequest.query(`
                    SELECT id FROM attività WHERE codice = @codice
                `);
                
                if (attivitaResult.recordset.length > 0) {
                    
                    await tesseratoRequest.query(`
                        INSERT INTO tesserati (socioId, codice, annoValidità)
                        VALUES (@socioId, @codice, @annoValidità)
                    `);
                } else {
                    await tesseratoRequest.query(`
                        INSERT INTO tesserati (socioId, codice, annoValidità)
                        VALUES (@socioId, @codice, @annoValidità)
                    `);
                }
            }
            
            if (value.isEffettivo) {
                const effettivoRequest = new sql.Request(transaction);
                effettivoRequest.input('socioId', sql.Int, newSocioId);
                effettivoRequest.input('annoValidità', sql.VarChar(4), currentYear);
                
                await effettivoRequest.query(`
                    INSERT INTO effettivi (socioId, annoValidità)
                    VALUES (@socioId, @annoValidità)
                `);
            }
            
            if (value.isVolontario) {
                const volontarioRequest = new sql.Request(transaction);
                volontarioRequest.input('socioId', sql.Int, newSocioId);
                volontarioRequest.input('annoValidità', sql.VarChar(4), currentYear);
                
                await volontarioRequest.query(`
                    INSERT INTO volontari (socioId, annoValidità)
                    VALUES (@socioId, @annoValidità)
                `);
            }
            
            await transaction.commit();
            
            context.log(`Nuovo socio creato con ID: ${newSocioId}`);
            return createSuccessResponse({ 
                id: newSocioId, 
                returnCode: true, 
                message: 'Socio creato con successo',
                socio: { id: newSocioId, ...value }
            });
            
        } catch (dbError) {
            await transaction.rollback();
            throw dbError;
        }
        
    } catch (error) {
        context.log('Errore nella creazione socio:', error);
        return createErrorResponse(500, 'Errore nella creazione socio', error.message);
    }
}

async function handleUpdateSocio(context, socioData) {
    try {
        var CodiceFiscale = require('codice-fiscale-js');
        socioData.codiceFiscale = new CodiceFiscale({
                name: socioData.nome,
                surname: socioData.cognome,
                gender: socioData.sesso,
                day: parseInt(socioData.dataNascita.substring(0, 2)),
                month: parseInt(socioData.dataNascita.substring(3, 5)),
                year: parseInt(socioData.dataNascita.substring(6, 10)),
                birthplace: socioData.comuneNascita, 
                birthplaceProvincia: socioData.provinciaNascita
            }).code;

        socioData.isScaduto = 1;
        const { error, value } = validateSocio(socioData);
        
        if (error) {
            return createErrorResponse(400, 'Dati non validi', error.details);
        }
        
        if (!value.id) {
            return createErrorResponse(400, 'ID socio richiesto per aggiornamento');
        }
        
        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);
            
            const updateQuery = `
                UPDATE soci SET 
                    nome = @nome, cognome = @cognome, codiceFiscale = @codiceFiscale,
                    sesso = @sesso, dataNascita = @dataNascita,
                    provinciaNascita = @provinciaNascita, comuneNascita = @comuneNascita,
                    provinciaResidenza = @provinciaResidenza, comuneResidenza = @comuneResidenza,
                    viaResidenza = @viaResidenza, capResidenza = @capResidenza,
                    telefono = @telefono, email = @email, 
                    scadenzaCertificato = @scadenzaCertificato,
                    isAgonistico = @isAgonistico, privacy = @privacy, dataPrivacy = @dataPrivacy,
                    isTesserato = @isTesserato, isEffettivo = @isEffettivo, isVolontario = @isVolontario,
                    dataIscrizione = @dataIscrizione, isScaduto = @isScaduto
                WHERE id = @id
            `;
            
            // Prepare parameters
            request.input('id', sql.Int, value.id);
            request.input('nome', sql.NVarChar(255), value.nome);
            request.input('cognome', sql.NVarChar(255), value.cognome);
            request.input('codiceFiscale', sql.NVarChar(16), value.codiceFiscale);
            request.input('sesso', sql.NVarChar(10), value.sesso || null);
            request.input('dataNascita', sql.Date, value.dataNascita || null);
            request.input('provinciaNascita', sql.NVarChar(255), value.provinciaNascita || null);
            request.input('comuneNascita', sql.NVarChar(255), value.comuneNascita || null);
            request.input('provinciaResidenza', sql.NVarChar(255), value.provinciaResidenza || null);
            request.input('comuneResidenza', sql.NVarChar(255), value.comuneResidenza || null);
            request.input('viaResidenza', sql.NVarChar(255), value.viaResidenza || null);
            request.input('capResidenza', sql.NVarChar(10), value.capResidenza || null);
            request.input('telefono', sql.NVarChar(20), value.telefono || null);
            request.input('email', sql.NVarChar(255), value.email || null);
            request.input('scadenzaCertificato', sql.Date, value.scadenzaCertificato || null);
            request.input('isAgonistico', sql.Int, value.isAgonistico || 0);
            request.input('privacy', sql.Int, value.privacy || 0);
            request.input('dataPrivacy', sql.Date, value.dataPrivacy || null);
            request.input('isTesserato', sql.Int, value.isTesserato || 0);
            request.input('isEffettivo', sql.Int, value.isEffettivo || 0);
            request.input('isVolontario', sql.Int, value.isVolontario || 0);
            request.input('dataIscrizione', sql.Date, value.dataIscrizione || null);
            request.input('isScaduto', sql.Int, value.isScaduto || 0);
            
            const result = await request.query(updateQuery);
            
            if (result.rowsAffected[0] === 0) {
                await transaction.rollback();
                return createErrorResponse(404, 'Socio non trovato');
            }
            
            const getFiscalYear = (date = new Date()) => (date < new Date(date.getFullYear(), 8, 1) ? date.getFullYear() : date.getFullYear() + 1).toString();
            const currentYear = getFiscalYear(); 
            
            // Handle tesserati status
            if (value.isTesserato && socioData.codice) {
                // Check if tesserato record exists for current year
                const tesseratoCheck = new sql.Request(transaction);
                tesseratoCheck.input('socioId', sql.Int, value.id);
                tesseratoCheck.input('annoValidità', sql.VarChar(4), currentYear);
                
                const tesseratoExists = await tesseratoCheck.query(`
                    SELECT COUNT(*) as count FROM tesserati 
                    WHERE socioId = @socioId AND annoValidità = @annoValidità
                `);
                
                if (tesseratoExists.recordset[0].count === 0) {
                    tesseratoCheck.input('codice', sql.VarChar(5), socioData.codice);
                    
                    // Get attivitàId from codice
                    const attivitaResult = await tesseratoCheck.query(`
                        SELECT id FROM attività WHERE codice = @codice
                    `);
                    
                    if (attivitaResult.recordset.length > 0) {
                        tesseratoCheck.input('attivitàId', sql.Int, attivitaResult.recordset[0].id);
                        
                        await tesseratoCheck.query(`
                            INSERT INTO tesserati (socioId, codice, attivitàId, annoValidità)
                            VALUES (@socioId, @codice, @attivitàId, @annoValidità)
                        `);
                    } else {
                        await tesseratoCheck.query(`
                            INSERT INTO tesserati (socioId, codice, annoValidità)
                            VALUES (@socioId, @codice, @annoValidità)
                        `);
                    }
                } else {
                    // Update existing record
                    tesseratoCheck.input('codice', sql.VarChar(5), socioData.codice);
                    
                    const attivitaResult = await tesseratoCheck.query(`
                        SELECT id FROM attività WHERE codice = @codice
                    `);
                    
                    if (attivitaResult.recordset.length > 0) {
                        tesseratoCheck.input('attivitàId', sql.Int, attivitaResult.recordset[0].id);
                        
                        await tesseratoCheck.query(`
                            UPDATE tesserati 
                            SET codice = @codice, attivitàId = @attivitàId 
                            WHERE socioId = @socioId AND annoValidità = @annoValidità
                        `);
                    }
                }
            } else if (!value.isTesserato) {
                // Remove tesserato records if flag is false
                const removeTesserato = new sql.Request(transaction);
                removeTesserato.input('socioId', sql.Int, value.id);
                await removeTesserato.query('DELETE FROM tesserati WHERE socioId = @socioId');
            }
            
            // Handle effettivi status
            if (value.isEffettivo) {
                const effettivoCheck = new sql.Request(transaction);
                effettivoCheck.input('socioId', sql.Int, value.id);
                effettivoCheck.input('annoValidità', sql.VarChar(4), currentYear);
                
                const effettivoExists = await effettivoCheck.query(`
                    SELECT COUNT(*) as count FROM effettivi 
                    WHERE socioId = @socioId AND annoValidità = @annoValidità
                `);
                
                if (effettivoExists.recordset[0].count === 0) {
                    
                    await effettivoCheck.query(`
                        INSERT INTO effettivi (socioId, annoValidità)
                        VALUES (@socioId, @annoValidità)
                    `);
                }
            } else {
                const removeEffettivo = new sql.Request(transaction);
                removeEffettivo.input('socioId', sql.Int, value.id);
                await removeEffettivo.query('DELETE FROM effettivi WHERE socioId = @socioId');
            }
            
            // Handle volontari status
            if (value.isVolontario) {
                const volontarioCheck = new sql.Request(transaction);
                volontarioCheck.input('socioId', sql.Int, value.id);
                volontarioCheck.input('annoValidità', sql.VarChar(4), currentYear);
                
                const volontarioExists = await volontarioCheck.query(`
                    SELECT COUNT(*) as count FROM volontari 
                    WHERE socioId = @socioId AND annoValidità = @annoValidità
                `);
                
                if (volontarioExists.recordset[0].count === 0) {
                    
                    await volontarioCheck.query(`
                        INSERT INTO volontari (socioId, annoValidità)
                        VALUES (@socioId, @annoValidità)
                    `);
                }
            } else {
                const removeVolontario = new sql.Request(transaction);
                removeVolontario.input('socioId', sql.Int, value.id);
                await removeVolontario.query('DELETE FROM volontari WHERE socioId = @socioId');
            }
            
            await transaction.commit();
            
            context.log(`Socio ${value.id} aggiornato`);
            return createSuccessResponse({ 
                returnCode: true, 
                message: 'Socio aggiornato con successo' 
            });
            
        } catch (dbError) {
            await transaction.rollback();
            throw dbError;
        }
        
    } catch (error) {
        context.log('Errore nell\'aggiornamento socio:', error);
        return createErrorResponse(500, 'Errore nell\'aggiornamento socio', error.message);
    }
}

async function handleRetrieveLibroSoci(context, tipoSocio, annoValidita) {
    try {
        if (!tipoSocio) {
            return createErrorResponse(400, 'Tipo socio richiesto');
        }
        
        const tipo = parseInt(tipoSocio);
        const anno = parseInt(annoValidita) || new Date().getFullYear();
        
        context.log('Recupero libro soci:', { tipo, anno });
        
        const pool = await getPool();
        const request = pool.request();
        
        let query = '';
        
        // Determina la query in base al tipo di socio
        switch (tipo) {
            case 1: // Effettivi
                query = `
                    SELECT 
                        s.id,
                        s.nome,
                        s.cognome,
                        s.codiceFiscale,
                        s.dataNascita,
                        s.comuneNascita,
                        s.provinciaNascita,
                        s.email,
                        s.telefono,
                        s.dataIscrizione,
                        e.annoValidità,
                        ROW_NUMBER() OVER (ORDER BY s.cognome, s.nome) as numeroSocio
                    FROM soci s
                    INNER JOIN effettivi e ON s.id = e.socioId
                    WHERE e.annoValidità = @anno
                    ORDER BY e.id
                `;
                break;
                
            case 2: // Volontari
                query = `
                    SELECT 
                        s.id,
                        s.nome,
                        s.cognome,
                        s.codiceFiscale,
                        s.dataNascita,
                        s.comuneNascita,
                        s.provinciaNascita,
                        s.email,
                        s.telefono,
                        s.dataIscrizione,
                        v.annoValidità,
                        ROW_NUMBER() OVER (ORDER BY s.cognome, s.nome) as numeroSocio
                    FROM soci s
                    INNER JOIN volontari v ON s.id = v.socioId
                    WHERE v.annoValidità = @anno
                    ORDER BY s.cognome, s.nome
                `;
                break;
                
            case 3: // Tesserati
                query = `
                    SELECT 
                        s.id,
                        s.nome,
                        s.cognome,
                        s.codiceFiscale,
                        s.dataNascita,
                        s.comuneNascita,
                        s.provinciaNascita,
                        s.email,
                        s.telefono,
                        s.dataIscrizione,
                        t.annoValidità,
                        t.codice,
                        a.nome as attivitaNome,
                        ROW_NUMBER() OVER (ORDER BY s.cognome, s.nome) as numeroSocio
                    FROM soci s
                    INNER JOIN tesserati t ON s.id = t.socioId
                    LEFT JOIN mappingCodici a ON t.codice = a.codice
                    WHERE t.annoValidità = @anno
                    ORDER BY s.cognome, s.nome
                `;
                break;
                
            default:
                return createErrorResponse(400, 'Tipo socio non valido. Valori consentiti: 1=Effettivi, 2=Volontari, 3=Tesserati');
        }
        
        request.input('anno', sql.VarChar(4), anno.toString());
        
        const result = await request.query(query);
        
        // Normalize response data
        const normalizedItems = result.recordset.map(item => ({
            id: item.id,
            nome: item.nome,
            cognome: item.cognome,
            codiceFiscale: item.codiceFiscale,
            dataNascita: item.dataNascita,
            comuneNascita: item.comuneNascita,
            provinciaNascita: item.provinciaNascita,
            email: item.email,
            telefono: item.telefono,
            dataIscrizione: item.dataIscrizione,
            annoValidità: item.annoValidità,
            numeroSocio: item.numeroSocio,
            // Per i tesserati, includi anche informazioni sull'attività
            ...(tipo === 3 && {
                codice: item.codice,
                attivitaNome: item.attivitaNome
            })
        }));
        
        context.log(`${result.recordset.length} soci trovati per tipo ${tipo}, anno ${anno}`);
        return createSuccessResponse({ 
            items: normalizedItems,
            tipo: tipo,
            anno: anno,
            count: normalizedItems.length
        });
        
    } catch (error) {
        context.log('Errore nel recupero libro soci:', error);
        return createErrorResponse(500, 'Errore nel recupero libro soci', error.message);
    }
}

async function handleRetrieveStats(context) {
    try {
        const pool = await getPool();
        const request = pool.request();
        
        // Get current year
        const currentYear = new Date().getFullYear();
        
        // Get stats for current year
        const statsQuery = `
            SELECT 
                COUNT(*) as totSoci,
                SUM(CASE WHEN isEffettivo = 1 THEN 1 ELSE 0 END) as totEffettivi,
                SUM(CASE WHEN isTesserato = 1 THEN 1 ELSE 0 END) as totTesserati,
                SUM(CASE WHEN isVolontario = 1 THEN 1 ELSE 0 END) as totVolontari,
                SUM(CASE WHEN scadenzaCertificato < GETDATE() THEN 1 ELSE 0 END) as certificatiScaduti,
                SUM(CASE WHEN scadenzaCertificato BETWEEN GETDATE() AND DATEADD(MONTH, 1, GETDATE()) THEN 1 ELSE 0 END) as certificatiInScadenza
            FROM soci
            WHERE created_at >= DATEFROMPARTS(@currentYear, 9, 1) 
               OR created_at >= DATEFROMPARTS(@previousYear, 9, 1)
        `;
        
        request.input('currentYear', sql.Int, currentYear);
        request.input('previousYear', sql.Int, currentYear - 1);
        
        const statsResult = await request.query(statsQuery);
        const stats = statsResult.recordset[0];
        
        context.log('Statistiche soci recuperate:', stats);
        return createSuccessResponse({
            totSoci: stats.totSoci || 0,
            sociAttivi: (stats.totEffettivi || 0) + (stats.totTesserati || 0) + (stats.totVolontari || 0),
            totEffettivi: stats.totEffettivi || 0,
            totTesserati: stats.totTesserati || 0,
            totVolontari: stats.totVolontari || 0,
            certificatiScaduti: stats.certificatiScaduti || 0,
            certificatiInScadenza: stats.certificatiInScadenza || 0,
            tasseDaPagare: 0 // This would need to be calculated based on business logic
        });
        
    } catch (error) {
        context.log('Errore nel recupero statistiche:', error);
        return createErrorResponse(500, 'Errore nel recupero statistiche', error.message);
    }
}