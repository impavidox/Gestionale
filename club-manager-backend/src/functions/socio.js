const { app } = require('@azure/functions');
const { getPool, sql } = require('../../shared/database/connection');
const { createSuccessResponse, createErrorResponse } = require('../../shared/utils/responseHelper');
const { validateSocio } = require('../../shared/models/Socio');

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

            context.log(`Action: ${action}, Params:`, params);

            switch (action) {
                case 'retrieveSocio':
                    return await handleRetrieveSocio(context, params);
                
                case 'retrieveSocioById':
                    return await handleRetrieveSocioById(context, params.param1);
                
                case 'createSocio':
                    return await handleCreateSocio(context, request.body);
                
                case 'updateSocio':
                    return await handleUpdateSocio(context, request.body);
                
                case 'retrieveTipoSocio':
                    return await handleRetrieveTipoSocio(context);
                
                case 'retrieveSocioMail':
                    return await handleRetrieveSocioMail(context, params);
                
                case 'controlUserType':
                    return await handleControlUserType(context, params.param1, params.param2);
                
                default:
                    return createErrorResponse(404, `Endpoint '${action}' non trovato`);
            }
        } catch (error) {
            context.log.error('Errore nella function socio:', error);
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
            SELECT s.*, 
                   a.numeroTessera, 
                   a.dataScadenza, 
                   act.nome as nomeAttivita,
                   ts.nome as tipoSocioNome
            FROM Soci s
            LEFT JOIN Abbonamenti a ON s.id = a.socioId AND a.attivo = 1
            LEFT JOIN Attivita act ON a.attivitaId = act.id
            LEFT JOIN TipiSocio ts ON s.tipoSocio = ts.tipoId
            WHERE s.attivo = 1
        `;
        
        // Applica filtri
        if (nome && nome !== 'null') {
            query += ` AND s.nome LIKE @nome`;
            request.input('nome', sql.NVarChar, `%${nome}%`);
        }
        
        if (cognome && cognome !== 'null') {
            query += ` AND s.cognome LIKE @cognome`;
            request.input('cognome', sql.NVarChar, `%${cognome}%`);
        }
        
        if (attivita && attivita !== '0') {
            query += ` AND a.attivitaId = @attivita`;
            request.input('attivita', sql.Int, parseInt(attivita));
        }
        
        if (scadenza && scadenza !== '0') {
            const dataScadenza = new Date();
            dataScadenza.setMonth(dataScadenza.getMonth() + parseInt(scadenza));
            query += ` AND a.dataScadenza <= @dataScadenza`;
            request.input('dataScadenza', sql.DateTime, dataScadenza);
        }
        
        if (scadute === 'true') {
            query += ` AND a.dataScadenza < GETDATE()`;
        }
        
        query += ` ORDER BY s.cognome, s.nome`;
        
        const result = await request.query(query);
        
        context.log(`${result.recordset.length} soci trovati`);
        return createSuccessResponse({ items: result.recordset });
        
    } catch (error) {
        context.log.error('Errore nel recupero soci:', error);
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
            SELECT s.*, 
                   a.numeroTessera, 
                   a.dataIscrizione, 
                   a.dataScadenza, 
                   a.attivitaId, 
                   a.firmato,
                   act.nome as nomeAttivita,
                   ts.nome as tipoSocioNome
            FROM Soci s
            LEFT JOIN Abbonamenti a ON s.id = a.socioId AND a.attivo = 1
            LEFT JOIN Attivita act ON a.attivitaId = act.id
            LEFT JOIN TipiSocio ts ON s.tipoSocio = ts.tipoId
            WHERE s.id = @id AND s.attivo = 1
        `;
        
        const result = await request.query(query);
        
        if (result.recordset.length === 0) {
            return createErrorResponse(404, 'Socio non trovato');
        }
        
        context.log(`Socio ${id} recuperato`);
        return createSuccessResponse(result.recordset[0]);
        
    } catch (error) {
        context.log.error('Errore nel recupero socio:', error);
        return createErrorResponse(500, 'Errore nel recupero socio', error.message);
    }
}

async function handleCreateSocio(context, socioData) {
    try {
        const { error, value } = validateSocio(socioData);
        
        if (error) {
            context.log.warn('Dati socio non validi:', error.details);
            return createErrorResponse(400, 'Dati non validi', error.details);
        }
        
        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        
        try {
            const request = new sql.Request(transaction);
            
            // Controlla codice fiscale duplicato
            request.input('codiceFiscale', sql.NVarChar, value.codiceFiscale);
            const checkResult = await request.query('SELECT id FROM Soci WHERE codiceFiscale = @codiceFiscale AND attivo = 1');
            
            if (checkResult.recordset.length > 0) {
                await transaction.rollback();
                return createErrorResponse(409, 'Socio con questo codice fiscale già esistente');
            }
            
            // Inserisci nuovo socio
            const insertQuery = `
                INSERT INTO Soci (
                    nome, cognome, codiceFiscale, dataNascita, birhDate, luogoNascita, 
                    provinciaNascita, indirizzo, civico, cap, comune, provincia, 
                    telefono, cellulare, email, tipoSocio, privacy, federazione, 
                    numeroTesseraFederale, attivo, dataCreazione
                ) OUTPUT INSERTED.id VALUES (
                    @nome, @cognome, @codiceFiscale, @dataNascita, @dataNascita, @luogoNascita,
                    @provinciaNascita, @indirizzo, @civico, @cap, @comune, @provincia,
                    @telefono, @cellulare, @email, @tipoSocio, @privacy, @federazione,
                    @numeroTesseraFederale, 1, GETDATE()
                )
            `;
            
            // Prepara parametri
            request.input('nome', sql.NVarChar, value.nome);
            request.input('cognome', sql.NVarChar, value.cognome);
            request.input('dataNascita', sql.Date, value.dataNascita || value.birhDate);
            request.input('luogoNascita', sql.NVarChar, value.luogoNascita || '');
            request.input('provinciaNascita', sql.NVarChar, value.provinciaNascita || '');
            request.input('indirizzo', sql.NVarChar, value.indirizzo || '');
            request.input('civico', sql.NVarChar, value.civico || '');
            request.input('cap', sql.NVarChar, value.cap || '');
            request.input('comune', sql.NVarChar, value.comune || '');
            request.input('provincia', sql.NVarChar, value.provincia || '');
            request.input('telefono', sql.NVarChar, value.telefono || '');
            request.input('cellulare', sql.NVarChar, value.cellulare || '');
            request.input('email', sql.NVarChar, value.email || '');
            request.input('tipoSocio', sql.Int, value.tipoSocio || 1);
            request.input('privacy', sql.Bit, value.privacy || false);
            request.input('federazione', sql.NVarChar, value.federazione || '');
            request.input('numeroTesseraFederale', sql.NVarChar, value.numeroTesseraFederale || '');
            
            const insertResult = await request.query(insertQuery);
            const newSocioId = insertResult.recordset[0].id;
            
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
        context.log.error('Errore nella creazione socio:', error);
        return createErrorResponse(500, 'Errore nella creazione socio', error.message);
    }
}

async function handleUpdateSocio(context, socioData) {
    try {
        const { error, value } = validateSocio(socioData);
        
        if (error) {
            return createErrorResponse(400, 'Dati non validi', error.details);
        }
        
        if (!value.id) {
            return createErrorResponse(400, 'ID socio richiesto per aggiornamento');
        }
        
        const pool = await getPool();
        const request = pool.request();
        
        const updateQuery = `
            UPDATE Soci SET 
                nome = @nome, cognome = @cognome, codiceFiscale = @codiceFiscale,
                dataNascita = @dataNascita, birhDate = @dataNascita,
                luogoNascita = @luogoNascita, provinciaNascita = @provinciaNascita,
                indirizzo = @indirizzo, civico = @civico, cap = @cap, 
                comune = @comune, provincia = @provincia,
                telefono = @telefono, cellulare = @cellulare, email = @email, 
                tipoSocio = @tipoSocio, privacy = @privacy, 
                federazione = @federazione, numeroTesseraFederale = @numeroTesseraFederale,
                dataModifica = GETDATE()
            WHERE id = @id AND attivo = 1
        `;
        
        // Prepara parametri
        request.input('id', sql.Int, value.id);
        request.input('nome', sql.NVarChar, value.nome);
        request.input('cognome', sql.NVarChar, value.cognome);
        request.input('codiceFiscale', sql.NVarChar, value.codiceFiscale);
        request.input('dataNascita', sql.Date, value.dataNascita || value.birhDate);
        request.input('luogoNascita', sql.NVarChar, value.luogoNascita || '');
        request.input('provinciaNascita', sql.NVarChar, value.provinciaNascita || '');
        request.input('indirizzo', sql.NVarChar, value.indirizzo || '');
        request.input('civico', sql.NVarChar, value.civico || '');
        request.input('cap', sql.NVarChar, value.cap || '');
        request.input('comune', sql.NVarChar, value.comune || '');
        request.input('provincia', sql.NVarChar, value.provincia || '');
        request.input('telefono', sql.NVarChar, value.telefono || '');
        request.input('cellulare', sql.NVarChar, value.cellulare || '');
        request.input('email', sql.NVarChar, value.email || '');
        request.input('tipoSocio', sql.Int, value.tipoSocio);
        request.input('privacy', sql.Bit, value.privacy || false);
        request.input('federazione', sql.NVarChar, value.federazione || '');
        request.input('numeroTesseraFederale', sql.NVarChar, value.numeroTesseraFederale || '');
        
        const result = await request.query(updateQuery);
        
        if (result.rowsAffected[0] === 0) {
            return createErrorResponse(404, 'Socio non trovato');
        }
        
        context.log(`Socio ${value.id} aggiornato`);
        return createSuccessResponse({ 
            returnCode: true, 
            message: 'Socio aggiornato con successo' 
        });
        
    } catch (error) {
        context.log.error('Errore nell\'aggiornamento socio:', error);
        return createErrorResponse(500, 'Errore nell\'aggiornamento socio', error.message);
    }
}

async function handleRetrieveTipoSocio(context) {
    try {
        const pool = await getPool();
        const request = pool.request();
        
        const query = 'SELECT * FROM TipiSocio WHERE attivo = 1 ORDER BY nome';
        const result = await request.query(query);
        
        context.log(`${result.recordset.length} tipi socio recuperati`);
        return createSuccessResponse(result.recordset);
        
    } catch (error) {
        context.log.error('Errore nel recupero tipi socio:', error);
        return createErrorResponse(500, 'Errore nel recupero tipi socio', error.message);
    }
}

async function handleRetrieveSocioMail(context, params) {
    try {
        const { param1: nome, param2: cognome, param3: scadenza, param4: attivita, param5: scadute, param6: anno } = params;
        
        const pool = await getPool();
        const request = pool.request();
        
        let query = `
            SELECT s.id, s.nome, s.cognome, s.email, 
                   a.numeroTessera, a.dataScadenza
            FROM Soci s
            LEFT JOIN Abbonamenti a ON s.id = a.socioId AND a.attivo = 1
            WHERE s.attivo = 1 AND s.email IS NOT NULL AND s.email != ''
        `;
        
        // Applica stessi filtri di retrieveSocio
        if (nome && nome !== 'null') {
            query += ` AND s.nome LIKE @nome`;
            request.input('nome', sql.NVarChar, `%${nome}%`);
        }
        
        if (cognome && cognome !== 'null') {
            query += ` AND s.cognome LIKE @cognome`;
            request.input('cognome', sql.NVarChar, `%${cognome}%`);
        }
        
        query += ` ORDER BY s.cognome, s.nome`;
        
        const result = await request.query(query);
        
        context.log(`${result.recordset.length} soci con email trovati`);
        return createSuccessResponse({ items: result.recordset });
        
    } catch (error) {
        context.log.error('Errore nel recupero soci per email:', error);
        return createErrorResponse(500, 'Errore nel recupero soci per email', error.message);
    }
}

async function handleControlUserType(context, codiceFiscale, tipoSocio) {
    try {
        if (!codiceFiscale || !tipoSocio) {
            return createErrorResponse(400, 'Codice fiscale e tipo socio richiesti');
        }
        
        const pool = await getPool();
        const request = pool.request();
        request.input('codiceFiscale', sql.NVarChar, codiceFiscale);
        request.input('tipoSocio', sql.Int, parseInt(tipoSocio));
        
        const query = `
            SELECT id, nome, cognome FROM Soci 
            WHERE codiceFiscale = @codiceFiscale AND tipoSocio = @tipoSocio AND attivo = 1
        `;
        
        const result = await request.query(query);
        
        return createSuccessResponse({
            exists: result.recordset.length > 0,
            data: result.recordset[0] || null
        });
        
    } catch (error) {
        context.log.error('Errore nel controllo tipo utente:', error);
        return createErrorResponse(500, 'Errore nel controllo tipo utente', error.message);
    }
}