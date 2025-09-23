const { app } = require('@azure/functions');
const { getPool, sql } = require('../../shared/database/connection');
const { createSuccessResponse, createErrorResponse } = require('../../shared/utils/responseHelper');
const { validateAttivita, validateFederazione, validateSezione, normalizeAttivitaResponse } = require('../../shared/models/Activity');

app.http('activities', {
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'activities/{action?}/{param1?}',
    handler: async (request, context) => {
        context.log(`Activities API chiamata: ${request.method} ${request.url}`);

        try {
            const action = request.params.action;
            const param1 = request.params.param1;

            // Handle CORS preflight
            if (request.method === 'OPTIONS') {
                return {
                    status: 200,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                    }
                };
            }

            context.log(`Action: ${action}, Param1: ${param1}`);

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
                case 'retrieveAllActivities':
                    return await handleRetrieveAllActivities(context);
                
                case 'retrieveCodes':
                    return await handleRetrieveCodes(context);
                
                case 'retrieveActivitiesByFederazione':
                    return await handleRetrieveActivitiesByFederazione(context, param1);

                case 'retrieveActivitiesBySezione':
                    return await handleRetrieveActivitiesBySezione(context, param1);
                
                case 'retrieveFullActivitiesByFederazione':
                    return await handleRetrieveFullActivitiesByFederazione(context, param1);
                
                case 'retrieveFederazioni':
                    return await handleRetrieveFederazioni(context);
                
                case 'retrieveSezioni':
                    return await handleRetrieveSezioni(context);
                
                case 'updateActivity':
                    return await handleUpdateActivity(context, requestBody);
                
                case 'removeActivity':
                    return await handleRemoveActivity(context, requestBody);
                
                case 'createFederazione':
                    return await handleCreateFederazione(context, requestBody);
                
                case 'createSezione':
                    return await handleCreateSezione(context, requestBody);
                
                default:
                    return createErrorResponse(404, `Endpoint '${action}' non trovato`);
            }
        } catch (error) {
            context.log('Errore nella function activities:', error);
            return createErrorResponse(500, 'Errore interno del server', error.message);
        }
    }
});

// Handler functions
async function handleRetrieveAllActivities(context) {
    try {
        context.log('Recupero tutte le attività');
        
        const pool = await getPool();
        const request = pool.request();
        
        const result = await request.query(`
            SELECT 
                a.id,
                a.nome,
                a.federazioneId,
                f.nome as federazioneNome,
                a.sezioneId,
                s.nome as sezioneNome,
                a.codice,
                a.emailReferente
            FROM attivitàrivoli a
            LEFT JOIN federazionirivoli f ON a.federazioneId = f.id
            LEFT JOIN sezionirivoli s ON a.sezioneId = s.id
            ORDER BY f.nome, a.nome
        `);
        
        // Normalize response for frontend compatibility
        const normalizedActivities = result.recordset.map(activity => normalizeAttivitaResponse(activity));
        
        context.log(`${result.recordset.length} attività recuperate`);
        return createSuccessResponse(normalizedActivities);
        
    } catch (error) {
        context.log('Errore nel recupero attività:', error);
        return createErrorResponse(500, 'Errore nel recupero attività', error.message);
    }
}

async function handleRetrieveCodes(context) {
    try {
        context.log('Recupero tutte le attività con codice');
        
        const pool = await getPool();
        const request = pool.request();
        
        const result = await request.query(`
            SELECT DISTINCT
                a.codice,
                f.nome
            FROM attivitàrivoli a
            LEFT JOIN mappingCodicirivoli f ON a.codice = f.codice
            WHERE a.codice IS NOT NULL
        `);
        
        // Normalize response for frontend compatibility
        const normalizedActivities = result.recordset.map(activity => normalizeAttivitaResponse(activity));
        
        context.log(`${result.recordset.length} attività recuperate`);
        return createSuccessResponse(normalizedActivities);
        
    } catch (error) {
        context.log('Errore nel recupero attività:', error);
        return createErrorResponse(500, 'Errore nel recupero attività', error.message);
    }
}

async function handleRetrieveActivitiesByFederazione(context, federazioneId) {
    try {
        if (!federazioneId) {
            return createErrorResponse(400, 'ID federazione richiesto');
        }
        
        context.log(`Recupero attività per federazione: ${federazioneId}`);
        
        const pool = await getPool();
        const request = pool.request();
        request.input('federazioneId', sql.Int, parseInt(federazioneId));
        
        const result = await request.query(`
            SELECT 
                a.id,
                a.nome,
                a.federazioneId,
                f.nome as federazioneNome,
                a.sezioneId,
                s.nome as sezioneNome,
                a.codice,
                a.emailReferente
            FROM attivitàrivoli a
            LEFT JOIN federazionirivoli f ON a.federazioneId = f.id
            LEFT JOIN sezionirivoli s ON a.sezioneId = s.id
            WHERE a.federazioneId = @federazioneId
            ORDER BY a.nome
        `);
        
        const normalizedActivities = result.recordset.map(activity => normalizeAttivitaResponse(activity));
        
        context.log(`${result.recordset.length} attività recuperate per federazione ${federazioneId}`);
        return createSuccessResponse(normalizedActivities);
        
    } catch (error) {
        context.log('Errore nel recupero attività per federazione:', error);
        return createErrorResponse(500, 'Errore nel recupero attività per federazione', error.message);
    }
}

async function handleRetrieveActivitiesBySezione(context, sezioneId) {
    try {
        if (!sezioneId) {
            return createErrorResponse(400, 'ID sezione richiesto');
        }
        
        context.log(`Recupero attività per federazione: ${sezioneId}`);
        
        const pool = await getPool();
        const request = pool.request();
        request.input('sezioneId', sql.Int, parseInt(sezioneId));
        
        const result = await request.query(`
            SELECT 
                a.id,
                a.nome,
                a.federazioneId,
                a.sezioneId,
                s.nome as sezioneNome,
                a.codice,
                a.emailReferente
            FROM attivitàrivoli a
            LEFT JOIN sezionirivoli s ON a.sezioneId = s.id
            WHERE a.sezioneId = @sezioneId
            ORDER BY a.nome
        `);
        
        const normalizedActivities = result.recordset.map(activity => normalizeAttivitaResponse(activity));
        
        context.log(`${result.recordset.length} attività recuperate per sezione ${sezioneId}`);
        return createSuccessResponse(normalizedActivities);
        
    } catch (error) {
        context.log('Errore nel recupero attività per sezione:', error);
        return createErrorResponse(500, 'Errore nel recupero attività per sezione', error.message);
    }
}


async function handleRetrieveFullActivitiesByFederazione(context, federazioneId) {
    try {
        if (!federazioneId) {
            return createErrorResponse(400, 'ID federazione richiesto');
        }
        
        context.log(`Recupero attività complete per federazione: ${federazioneId}`);
        
        const pool = await getPool();
        const request = pool.request();
        request.input('federazioneId', sql.Int, parseInt(federazioneId));
        
        const result = await request.query(`
            SELECT 
                a.id,
                a.nome,
                a.federazioneId,
                f.nome as federazioneNome,
                a.sezioneId,
                s.nome as sezioneNome,
                a.codice,
                a.emailReferente,
                -- Get count of tesserati for this activity
                (SELECT COUNT(*) FROM tesseratirivoli t WHERE t.attivitàId = a.id) as numeroTesserati,
                -- Get recent activity
                (SELECT COUNT(*) FROM ricevuteAttivitàrivoli ra WHERE ra.attivitàId = a.id AND ra.created_at >= DATEADD(month, -6, GETDATE())) as ricevuteRecenti
            FROM attivitàrivoli a
            LEFT JOIN federazionirivoli f ON a.federazioneId = f.id
            LEFT JOIN sezionirivoli s ON a.sezioneId = s.id
            WHERE a.federazioneId = @federazioneId
            ORDER BY a.nome
        `);
        
        const normalizedActivities = result.recordset.map(activity => {
            const normalized = normalizeAttivitaResponse(activity);
            return {
                ...normalized,
                numeroTesserati: activity.numeroTesserati || 0,
                ricevuteRecenti: activity.ricevuteRecenti || 0,
                active: true
            };
        });
        
        context.log(`${result.recordset.length} attività complete recuperate per federazione ${federazioneId}`);
        return createSuccessResponse(normalizedActivities);
        
    } catch (error) {
        context.log('Errore nel recupero attività complete per federazione:', error);
        return createErrorResponse(500, 'Errore nel recupero attività complete per federazione', error.message);
    }
}

async function handleRetrieveFederazioni(context) {
    try {
        context.log('Recupero federazioni');
        
        const pool = await getPool();
        const request = pool.request();
        
        const result = await request.query(`
            SELECT 
                f.id,
                f.nome
            FROM federazionirivoli f
            ORDER BY f.nome
        `);
        
        // Add frontend compatibility fields
        const federazioni = result.recordset.map(fed => ({
            id: fed.id,
            nome: fed.nome
        }));
        
        context.log(`${result.recordset.length} federazioni recuperate`);
        return createSuccessResponse(federazioni);
        
    } catch (error) {
        context.log('Errore nel recupero federazioni:', error);
        return createErrorResponse(500, 'Errore nel recupero federazioni', error.message);
    }
}

async function handleRetrieveSezioni(context) {
    try {
        context.log('Recupero sezioni');
        
        const pool = await getPool();
        const request = pool.request();
        
        const result = await request.query(`
            SELECT 
                s.id,
                s.nome
            FROM sezionirivoli s
            ORDER BY s.nome
        `);
        
        // Add frontend compatibility fields
        const sezioni = result.recordset.map(sez => ({
            id: sez.id,
            nome: sez.nome
        }));
        
        context.log(`${result.recordset.length} sezioni recuperate`);
        return createSuccessResponse(sezioni);
        
    } catch (error) {
        context.log('Errore nel recupero sezioni:', error);
        return createErrorResponse(500, 'Errore nel recupero sezioni', error.message);
    }
}

async function handleUpdateActivity(context, activityData) {
    try {
        context.log('Aggiornamento/creazione attività:', activityData);
        
        // Validate input data
        const { error, value } = validateAttivita(activityData);
        if (error) {
            context.log('Dati attività non validi:', error.details);
            return createErrorResponse(400, 'Dati non validi', error.details);
        }
        context.log('Aggiornamento/creazione attività:', value);
        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        
        try {
            const request = new sql.Request(transaction);
            
            // Check if it's an update or create
            if (value.id && value.id > 0) {
                // Update existing activity
                request.input('id', sql.Int, value.id);
                request.input('nome', sql.NVarChar(255), value.nome);
                request.input('federazioneId', sql.Int, value.federazioneId);
                request.input('sezioneId', sql.Int, value.sezioneId);
                request.input('codice', sql.NVarChar(255), value.codice || null);
                request.input('emailReferente', sql.NVarChar(255), value.emailReferente || null);
                
                await request.query(`
                    UPDATE attivitàrivoli 
                    SET 
                        nome = @nome,
                        federazioneId = @federazioneId,
                        sezioneId = @sezioneId,
                        codice = @codice,
                        emailReferente = @emailReferente
                    WHERE id = @id
                `);
                
                context.log(`Attività ${value.id} aggiornata`);
                
            } else {
                // Create new activity
                request.input('nome', sql.NVarChar(255), value.nome);
                request.input('federazioneId', sql.Int, value.federazioneId);
                request.input('sezioneId', sql.Int, value.sezioneId);
                request.input('codice', sql.NVarChar(255), value.codice || null);
                request.input('emailReferente', sql.NVarChar(255), value.emailReferente || null);
                
                const result = await request.query(`
                    INSERT INTO attivitàrivoli 
                    (nome, federazioneId, sezioneId, codice, emailReferente)
                    VALUES 
                    (@nome, @federazioneId, @sezioneId, @codice, @emailReferente);
                    SELECT SCOPE_IDENTITY() as newId;
                `);
                
                const newId = result.recordset[0].newId;
                context.log(`Nuova attività creata con ID: ${newId}`);
            }
            
            await transaction.commit();
            return createSuccessResponse({ rc: true, message: 'Attività salvata con successo' });
            
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
        
    } catch (error) {
        context.log('Errore nell\'aggiornamento attività:', error);
        return createErrorResponse(500, 'Errore nell\'aggiornamento attività', error.message);
    }
}

async function handleRemoveActivity(context, activityData) {
    try {
        if (!activityData.attId) {
            return createErrorResponse(400, 'ID attività richiesto per la cancellazione');
        }
        
        const activityId = activityData.attId;
        context.log(`Rimozione attività: ${activityId}`);
        
        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        
        try {
            const request = new sql.Request(transaction);
            request.input('id', sql.Int, activityId);
            
            // Check if activity is in use
            const checkResult = await request.query(`
                SELECT 
                    (SELECT COUNT(*) FROM ricevuteAttivitàrivoli WHERE attivitàId = @id) as ricevute
            `);
            
            const usage = checkResult.recordset[0];
            if (usage.tesserati > 0 || usage.ricevute > 0) {
                await transaction.rollback();
                return createErrorResponse(400, 'Impossibile cancellare: attività in uso da tesserati o ricevute esistenti');
            }
            
            // Delete the activity
            const deleteResult = await request.query(`
                DELETE FROM attivitàrivoli WHERE id = @id;
                SELECT @@ROWCOUNT as deletedRows;
            `);
            
            if (deleteResult.recordset[0].deletedRows === 0) {
                await transaction.rollback();
                return createErrorResponse(404, 'Attività non trovata');
            }
            
            await transaction.commit();
            context.log(`Attività ${activityId} rimossa`);
            return createSuccessResponse({ rc: true, message: 'Attività rimossa con successo' });
            
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
        
    } catch (error) {
        context.log('Errore nella rimozione attività:', error);
        return createErrorResponse(500, 'Errore nella rimozione attività', error.message);
    }
}

async function handleCreateFederazione(context, federazioneData) {
    try {
        context.log('Creazione federazione:', federazioneData);
        
        const { error, value } = validateFederazione(federazioneData);
        if (error) {
            return createErrorResponse(400, 'Dati federazione non validi', error.details);
        }
        
        const pool = await getPool();
        const request = pool.request();
        
        // Check if name already exists
        request.input('nome', sql.NVarChar(255), value.nome);
        const checkResult = await request.query(`
            SELECT COUNT(*) as count FROM federazionirivoli WHERE nome = @nome
        `);
        
        if (checkResult.recordset[0].count > 0) {
            return createErrorResponse(400, 'Una federazione con questo nome esiste già');
        }
        
        // Create new federazione
        const result = await request.query(`
            INSERT INTO federazionirivoli (nome)
            VALUES (@nome);
            SELECT SCOPE_IDENTITY() as newId;
        `);
        
        const newId = result.recordset[0].newId;
        context.log(`Nuova federazione creata con ID: ${newId}`);
        
        return createSuccessResponse({ 
            rc: true, 
            message: 'Federazione creata con successo', 
            id: newId 
        });
        
    } catch (error) {
        context.log('Errore nella creazione federazione:', error);
        return createErrorResponse(500, 'Errore nella creazione federazione', error.message);
    }
}

async function handleCreateSezione(context, sezioneData) {
    try {
        context.log('Creazione sezione:', sezioneData);
        
        const { error, value } = validateSezione(sezioneData);
        if (error) {
            return createErrorResponse(400, 'Dati sezione non validi', error.details);
        }
        
        const pool = await getPool();
        const request = pool.request();
        
        // Check if name already exists
        request.input('nome', sql.NVarChar(255), value.nome);
        const checkResult = await request.query(`
            SELECT COUNT(*) as count FROM sezionirivoli WHERE nome = @nome
        `);
        
        if (checkResult.recordset[0].count > 0) {
            return createErrorResponse(400, 'Una sezione con questo nome esiste già');
        }
        
        // Create new sezione
        const result = await request.query(`
            INSERT INTO sezionirivoli (nome)
            VALUES (@nome);
            SELECT SCOPE_IDENTITY() as newId;
        `);
        
        const newId = result.recordset[0].newId;
        context.log(`Nuova sezione creata con ID: ${newId}`);
        
        return createSuccessResponse({ 
            rc: true, 
            message: 'Sezione creata con successo', 
            id: newId 
        });
        
    } catch (error) {
        context.log('Errore nella creazione sezione:', error);
        return createErrorResponse(500, 'Errore nella creazione sezione', error.message);
    }
}