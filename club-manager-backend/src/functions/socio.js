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
                
                default:
                    return createErrorResponse(404, `Endpoint '${action}' non trovato`);
            }
        } catch (error) {
            context.log('Errore nella function socio:', error);
            return createErrorResponse(500, 'Errore interno del server', error.message);
        }
    }
});

// Handler functions
async function handleRetrieveSocio(context, params) {
    try {
        const { param1: nome, param2: cognome, param3: scadenza, param4: attivita, param5: scadute, param6: anno } = params;
        
        context.log('Recupero soci con filtri:', { nome, cognome, scadenza, attivita, scadute, anno });
        
        const pool = await getPool();
        const request = pool.request();
        
        let query = `
            SELECT s.*
            FROM soci s
            WHERE 1=1
        `;
        
        // Apply filters
        if (nome && nome !== 'null') {
            query += ` AND s.nome LIKE @nome`;
            request.input('nome', sql.NVarChar, `%${nome}%`);
        }
        
        if (cognome && cognome !== 'null') {
            query += ` AND s.cognome LIKE @cognome`;
            request.input('cognome', sql.NVarChar, `%${cognome}%`);
        }
        
        if (attivita && attivita !== '0') {
            query += ` AND EXISTS(SELECT 1 FROM tesserati t WHERE t.socioId = s.id AND t.attivitàId = @attivita)`;
            request.input('attivita', sql.Int, parseInt(attivita));
        }
        
        if (scadenza && scadenza !== '0') {
            const dataScadenza = new Date();
            dataScadenza.setMonth(dataScadenza.getMonth() + parseInt(scadenza));
            query += ` AND s.scadenzaCertificato <= @dataScadenza`;
            request.input('dataScadenza', sql.DateTime, dataScadenza);
        }
        
        if (scadute === 'true') {
            query += ` AND s.scadenzaCertificato < GETDATE()`;
        }
        
        query += ` ORDER BY s.cognome, s.nome`;
        
        const result = await request.query(query);
        
        // Normalize response for frontend compatibility
        const normalizedItems = result.recordset.map(item => normalizeSocioResponse(item));
        
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

//a posto

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
            request.input('isScaduto', sql.Int, value.isVolontario || 0);

            const insertResult = await request.query(insertQuery);
            const newSocioId = insertResult.recordset[0].id;
            
            // If socio is marked as tesserato, effettivo, or volontario, create corresponding records
            const getFiscalYear = (date = new Date()) => (date < new Date(date.getFullYear(), 8, 1) ? date.getFullYear() : date.getFullYear() + 1).toString();  //make function to take from 2024/2025 2025
            const currentYear = getFiscalYear(); 

            if (value.isTesserato && socioData.codice) {
                const tesseratoRequest = new sql.Request(transaction);
                tesseratoRequest.input('socioId', sql.Int, newSocioId);
                tesseratoRequest.input('codice', sql.VarChar(5), socioData.codice);
                tesseratoRequest.input('annoValidità', sql.VarChar(4), currentYear);
                
                await tesseratoRequest.query(`
                    INSERT INTO tesserati (socioId, codice, annoValidità)
                    VALUES (@socioId, @codice, @annoValidità)
                `);
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
                message: 'Socio creato con successo' 
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

        socioData.isScaduto=1;
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
            request.input('isScaduto', sql.Int, value.isVolontario || 0);
            
            const result = await request.query(updateQuery);
            
            if (result.rowsAffected[0] === 0) {
                await transaction.rollback();
                return createErrorResponse(404, 'Socio non trovato');
            }
            
            const getFiscalYear = (date = new Date()) => (date < new Date(date.getFullYear(), 8, 1) ? date.getFullYear() : date.getFullYear() + 1).toString();  //make function to take from 2024/2025 2025
            const currentYear = getFiscalYear(); 
            
            // Handle tesserati status
            if (value.isTesserato && socioData.codice) {
                // Ensure tesserato record exists
                const tesseratoCheck = new sql.Request(transaction);
                tesseratoCheck.input('socioId', sql.Int, value.id);
                tesseratoCheck.input('codice', sql.VarChar(5), socioData.attivitaId);
                tesseratoCheck.input('annoValidità', sql.VarChar(4), currentYear);
                
                const tesseratoExists = await tesseratoCheck.query(`
                    SELECT COUNT(*) as count FROM tesserati 
                    WHERE socioId = @socioId AND annoValidità = @annoValidità
                `);
                
                if (tesseratoExists.recordset[0].count === 0) {
                    await tesseratoCheck.query(`
                        INSERT INTO tesserati (socioId, codice, annoValidità)
                        VALUES (@socioId, @attivitàId, @annoValidità)
                    `);
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

