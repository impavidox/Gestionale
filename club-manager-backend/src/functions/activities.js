const { app } = require('@azure/functions');
const { getPool, sql } = require('../../shared/database/connection');
const { createSuccessResponse, createErrorResponse } = require('../../shared/utils/responseHelper');
const { validateActivity } = require('../../shared/models/Activity');

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

            switch (action) {
                case 'retrieveAllActivities':
                    return await handleRetrieveAllActivities(context);
                
                case 'retrieveActivitiesByFamily':
                    return await handleRetrieveActivitiesByFamily(context, param1);
                
                case 'retrieveFullActivitiesByFamily':
                    return await handleRetrieveFullActivitiesByFamily(context, param1);
                
                case 'retrieveFamilies':
                    return await handleRetrieveFamilies(context);
                
                case 'updateActivity':
                    return await handleUpdateActivity(context, request.body);
                
                case 'removeActivity':
                    return await handleRemoveActivity(context, request.body);
                
                case 'retrieveAffiliazioneForLibro':
                    return await handleRetrieveAffiliazioneForLibro(context, param1);
                
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
                a.description,
                a.familyId,
                f.description as familyDescription,
                a.libertas,
                a.fgi,
                a.fita,
                a.filkjm,
                a.active
            FROM Activities a
            LEFT JOIN ActivityFamilies f ON a.familyId = f.id
            WHERE a.active = 1
            ORDER BY f.description, a.description
        `);
        
        context.log(`${result.recordset.length} attività recuperate`);
        return createSuccessResponse(result.recordset);
        
    } catch (error) {
        context.log('Errore nel recupero attività:', error);
        return createErrorResponse(500, 'Errore nel recupero attività', error.message);
    }
}

async function handleRetrieveActivitiesByFamily(context, familyId) {
    try {
        if (!familyId) {
            return createErrorResponse(400, 'ID famiglia richiesto');
        }
        
        context.log(`Recupero attività per famiglia: ${familyId}`);
        
        const pool = await getPool();
        const request = pool.request();
        request.input('familyId', sql.Int, parseInt(familyId));
        
        const result = await request.query(`
            SELECT 
                id,
                description,
                familyId,
                libertas,
                fgi,
                fita,
                filkjm,
                active
            FROM Activities 
            WHERE familyId = @familyId AND active = 1
            ORDER BY description
        `);
        
        context.log(`${result.recordset.length} attività recuperate per famiglia ${familyId}`);
        return createSuccessResponse(result.recordset);
        
    } catch (error) {
        context.log('Errore nel recupero attività per famiglia:', error);
        return createErrorResponse(500, 'Errore nel recupero attività per famiglia', error.message);
    }
}

async function handleRetrieveFullActivitiesByFamily(context, familyId) {
    try {
        if (!familyId) {
            return createErrorResponse(400, 'ID famiglia richiesto');
        }
        
        context.log(`Recupero attività complete per famiglia: ${familyId}`);
        
        const pool = await getPool();
        const request = pool.request();
        request.input('familyId', sql.Int, parseInt(familyId));
        
        const result = await request.query(`
            SELECT 
                a.id,
                a.description,
                a.familyId,
                f.description as familyDescription,
                a.libertas,
                a.fgi,
                a.fita,
                a.filkjm,
                a.active,
                a.createdDate,
                a.updatedDate
            FROM Activities a
            LEFT JOIN ActivityFamilies f ON a.familyId = f.id
            WHERE a.familyId = @familyId
            ORDER BY a.description
        `);
        
        // Include affiliation details
        for (let activity of result.recordset) {
            const affiliationRequest = pool.request();
            affiliationRequest.input('activityId', sql.Int, activity.id);
            
            const affiliations = await affiliationRequest.query(`
                SELECT 
                    af.id,
                    af.descrizione,
                    af.active
                FROM ActivityAffiliations af
                WHERE af.activityId = @activityId
            `);
            
            activity.affiliations = affiliations.recordset;
        }
        
        context.log(`${result.recordset.length} attività complete recuperate per famiglia ${familyId}`);
        return createSuccessResponse(result.recordset);
        
    } catch (error) {
        context.log('Errore nel recupero attività complete per famiglia:', error);
        return createErrorResponse(500, 'Errore nel recupero attività complete per famiglia', error.message);
    }
}

async function handleRetrieveFamilies(context) {
    try {
        context.log('Recupero famiglie di attività');
        
        const pool = await getPool();
        const request = pool.request();
        
        const result = await request.query(`
            SELECT 
                id,
                description,
                active,
                createdDate
            FROM ActivityFamilies 
            WHERE active = 1
            ORDER BY description
        `);
        
        context.log(`${result.recordset.length} famiglie recuperate`);
        return createSuccessResponse(result.recordset);
        
    } catch (error) {
        context.log('Errore nel recupero famiglie:', error);
        return createErrorResponse(500, 'Errore nel recupero famiglie', error.message);
    }
}

async function handleUpdateActivity(context, activityData) {
    try {
        context.log('Aggiornamento/creazione attività:', activityData);
        
        // Validate input data
        const { error, value } = validateActivity(activityData);
        if (error) {
            context.log('Dati attività non validi:', error.details);
            return createErrorResponse(400, 'Dati non validi', error.details);
        }
        
        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        
        try {
            const request = new sql.Request(transaction);
            
            // Check if it's an update or create
            if (value.attId && value.attId > 0) {
                // Update existing activity
                request.input('id', sql.Int, value.attId);
                request.input('description', sql.NVarChar(255), value.description);
                request.input('familyId', sql.Int, value.familyId);
                request.input('libertas', sql.Bit, value.libertas || false);
                request.input('fgi', sql.Bit, value.fgi || false);
                request.input('fita', sql.Bit, value.fita || false);
                request.input('filkjm', sql.Bit, value.filkjm || false);
                request.input('updatedDate', sql.DateTime, new Date());
                
                await request.query(`
                    UPDATE Activities 
                    SET 
                        description = @description,
                        familyId = @familyId,
                        libertas = @libertas,
                        fgi = @fgi,
                        fita = @fita,
                        filkjm = @filkjm,
                        updatedDate = @updatedDate
                    WHERE id = @id
                `);
                
                context.log(`Attività ${value.attId} aggiornata`);
                
            } else {
                // Create new activity
                request.input('description', sql.NVarChar(255), value.description);
                request.input('familyId', sql.Int, value.familyId);
                request.input('libertas', sql.Bit, value.libertas || false);
                request.input('fgi', sql.Bit, value.fgi || false);
                request.input('fita', sql.Bit, value.fita || false);
                request.input('filkjm', sql.Bit, value.filkjm || false);
                request.input('active', sql.Bit, true);
                request.input('createdDate', sql.DateTime, new Date());
                
                const result = await request.query(`
                    INSERT INTO Activities 
                    (description, familyId, libertas, fgi, fita, filkjm, active, createdDate)
                    VALUES 
                    (@description, @familyId, @libertas, @fgi, @fita, @filkjm, @active, @createdDate);
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
        
        context.log(`Rimozione attività: ${activityData.attId}`);
        
        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        
        try {
            const request = new sql.Request(transaction);
            request.input('id', sql.Int, activityData.attId);
            
            // Check if activity is in use
            const checkResult = await request.query(`
                SELECT COUNT(*) as count 
                FROM Abbonamenti 
                WHERE attivitaId = @id
            `);
            
            if (checkResult.recordset[0].count > 0) {
                await transaction.rollback();
                return createErrorResponse(400, 'Impossibile cancellare: attività in uso da abbonamenti esistenti');
            }
            
            // Soft delete - set active to false
            request.input('updatedDate', sql.DateTime, new Date());
            await request.query(`
                UPDATE Activities 
                SET active = 0, updatedDate = @updatedDate
                WHERE id = @id
            `);
            
            await transaction.commit();
            context.log(`Attività ${activityData.attId} rimossa`);
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

async function handleRetrieveAffiliazioneForLibro(context, param) {
    try {
        context.log(`Recupero affiliazioni per libro: ${param}`);
        
        const pool = await getPool();
        const request = pool.request();
        
        // param could be 0 for all or specific activity ID
        let query = `
            SELECT DISTINCT
                af.id,
                af.descrizione,
                af.active,
                a.description as activityDescription
            FROM ActivityAffiliations af
            LEFT JOIN Activities a ON af.activityId = a.id
            WHERE af.active = 1
        `;
        
        if (param && param !== '0') {
            request.input('activityId', sql.Int, parseInt(param));
            query += ` AND af.activityId = @activityId`;
        }
        
        query += ` ORDER BY af.descrizione`;
        
        const result = await request.query(query);
        
        context.log(`${result.recordset.length} affiliazioni recuperate`);
        return createSuccessResponse(result.recordset);
        
    } catch (error) {
        context.log('Errore nel recupero affiliazioni:', error);
        return createErrorResponse(500, 'Errore nel recupero affiliazioni', error.message);
    }
}