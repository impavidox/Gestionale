const { app } = require('@azure/functions');
const { getPool, sql } = require('../../shared/database/connection');
const { createSuccessResponse, createErrorResponse } = require('../../shared/utils/responseHelper');
const { validateParameter } = require('../../shared/models/Parameter');

app.http('params', {
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'params/{action?}/{param1?}',
    handler: async (request, context) => {
        context.log(`Params API chiamata: ${request.method} ${request.url}`);

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
                case 'retrieveParameters':
                    return await handleRetrieveParameters(context);
                
                case 'retrieveAnnoSportiva':
                    return await handleRetrieveAnnoSportiva(context);
                
                case 'retrieveMesiAttivita':
                    return await handleRetrieveMesiAttivita(context);
                
                case 'updateParameter':
                    return await handleUpdateParameter(context, request.body);
                
                case 'addParameter':
                    return await handleAddParameter(context, request.body);
                
                case 'deleteParameter':
                    return await handleDeleteParameter(context, param1);
                
                default:
                    return createErrorResponse(404, `Endpoint '${action}' non trovato`);
            }
        } catch (error) {
            context.log.error('Errore nella function params:', error);
            return createErrorResponse(500, 'Errore interno del server', error.message);
        }
    }
});

// Handler functions
async function handleRetrieveParameters(context) {
    try {
        context.log('Recupero parametri di sistema');
        
        const pool = await getPool();
        const request = pool.request();
        
        const result = await request.query(`
            SELECT 
                id,
                parameterName,
                parameterValue,
                description,
                dataType,
                category,
                active,
                createdDate,
                updatedDate
            FROM SystemParameters 
            WHERE active = 1
            ORDER BY category, parameterName
        `);
        
        // Group parameters by category for easier frontend handling
        const groupedParams = {};
        result.recordset.forEach(param => {
            if (!groupedParams[param.category]) {
                groupedParams[param.category] = [];
            }
            groupedParams[param.category].push(param);
        });
        
        context.log(`${result.recordset.length} parametri recuperati`);
        return createSuccessResponse({
            parameters: result.recordset,
            grouped: groupedParams
        });
        
    } catch (error) {
        context.log.error('Errore nel recupero parametri:', error);
        return createErrorResponse(500, 'Errore nel recupero parametri', error.message);
    }
}

async function handleRetrieveAnnoSportiva(context) {
    try {
        context.log('Recupero anno sportivo corrente');
        
        const pool = await getPool();
        const request = pool.request();
        
        const result = await request.query(`
            SELECT 
                id,
                annoName,
                dataInizio,
                dataFine,
                active,
                createdDate
            FROM AnnoSportivo 
            WHERE active = 1
            ORDER BY dataInizio DESC
        `);
        
        if (result.recordset.length === 0) {
            context.log.warn('Nessun anno sportivo attivo trovato');
            return createSuccessResponse({
                id: 0,
                annoName: new Date().getFullYear().toString(),
                dataInizio: new Date(new Date().getFullYear(), 8, 1), // 1 settembre
                dataFine: new Date(new Date().getFullYear() + 1, 7, 31), // 31 agosto
                active: false
            });
        }
        
        const annoSportiva = result.recordset[0];
        
        // Format dates for frontend
        if (annoSportiva.dataInizio) {
            annoSportiva.dataInizio = new Date(annoSportiva.dataInizio);
        }
        if (annoSportiva.dataFine) {
            annoSportiva.dataFine = new Date(annoSportiva.dataFine);
        }
        
        context.log(`Anno sportivo recuperato: ${annoSportiva.annoName}`);
        return createSuccessResponse(annoSportiva);
        
    } catch (error) {
        context.log.error('Errore nel recupero anno sportivo:', error);
        return createErrorResponse(500, 'Errore nel recupero anno sportivo', error.message);
    }
}

async function handleRetrieveMesiAttivita(context) {
    try {
        context.log('Recupero mesi di attività');
        
        const pool = await getPool();
        const request = pool.request();
        
        const result = await request.query(`
            SELECT 
                id,
                mese,
                nome,
                abbreviazione,
                active,
                annoSportivoId
            FROM MesiAttivita 
            WHERE active = 1
            ORDER BY mese
        `);
        
        // Add Italian month names if not in database
        const mesiDefault = [
            { mese: 1, nome: 'Gennaio', abbreviazione: 'Gen' },
            { mese: 2, nome: 'Febbraio', abbreviazione: 'Feb' },
            { mese: 3, nome: 'Marzo', abbreviazione: 'Mar' },
            { mese: 4, nome: 'Aprile', abbreviazione: 'Apr' },
            { mese: 5, nome: 'Maggio', abbreviazione: 'Mag' },
            { mese: 6, nome: 'Giugno', abbreviazione: 'Giu' },
            { mese: 7, nome: 'Luglio', abbreviazione: 'Lug' },
            { mese: 8, nome: 'Agosto', abbreviazione: 'Ago' },
            { mese: 9, nome: 'Settembre', abbreviazione: 'Set' },
            { mese: 10, nome: 'Ottobre', abbreviazione: 'Ott' },
            { mese: 11, nome: 'Novembre', abbreviazione: 'Nov' },
            { mese: 12, nome: 'Dicembre', abbreviazione: 'Dic' }
        ];
        
        const mesiResult = result.recordset.length > 0 ? result.recordset : mesiDefault;
        
        context.log(`${mesiResult.length} mesi recuperati`);
        return createSuccessResponse(mesiResult);
        
    } catch (error) {
        context.log.error('Errore nel recupero mesi:', error);
        return createErrorResponse(500, 'Errore nel recupero mesi', error.message);
    }
}

async function handleUpdateParameter(context, paramData) {
    try {
        context.log('Aggiornamento parametro:', paramData);
        
        // Validate input data
        const { error, value } = validateParameter(paramData);
        if (error) {
            context.log.warn('Dati parametro non validi:', error.details);
            return createErrorResponse(400, 'Dati non validi', error.details);
        }
        
        const pool = await getPool();
        const request = pool.request();
        
        request.input('id', sql.Int, value.id);
        request.input('parameterValue', sql.NVarChar(sql.MAX), value.parameterValue);
        request.input('description', sql.NVarChar(255), value.description);
        request.input('updatedDate', sql.DateTime, new Date());
        
        const result = await request.query(`
            UPDATE SystemParameters 
            SET 
                parameterValue = @parameterValue,
                description = @description,
                updatedDate = @updatedDate
            WHERE id = @id AND active = 1;
            
            SELECT @@ROWCOUNT as rowsAffected;
        `);
        
        if (result.recordset[0].rowsAffected === 0) {
            return createErrorResponse(404, 'Parametro non trovato');
        }
        
        context.log(`Parametro ${value.id} aggiornato`);
        return createSuccessResponse({ rc: true, message: 'Parametro aggiornato con successo' });
        
    } catch (error) {
        context.log.error('Errore nell\'aggiornamento parametro:', error);
        return createErrorResponse(500, 'Errore nell\'aggiornamento parametro', error.message);
    }
}

async function handleAddParameter(context, paramData) {
    try {
        context.log('Aggiunta nuovo parametro:', paramData);
        
        // Validate input data
        const { error, value } = validateParameter(paramData);
        if (error) {
            context.log.warn('Dati parametro non validi:', error.details);
            return createErrorResponse(400, 'Dati non validi', error.details);
        }
        
        const pool = await getPool();
        const request = pool.request();
        
        // Check if parameter name already exists
        request.input('parameterName', sql.NVarChar(100), value.parameterName);
        const checkResult = await request.query(`
            SELECT COUNT(*) as count 
            FROM SystemParameters 
            WHERE parameterName = @parameterName AND active = 1
        `);
        
        if (checkResult.recordset[0].count > 0) {
            return createErrorResponse(400, 'Un parametro con questo nome esiste già');
        }
        
        // Add new parameter
        request.input('parameterValue', sql.NVarChar(sql.MAX), value.parameterValue);
        request.input('description', sql.NVarChar(255), value.description || '');
        request.input('dataType', sql.NVarChar(50), value.dataType || 'string');
        request.input('category', sql.NVarChar(100), value.category || 'general');
        request.input('active', sql.Bit, true);
        request.input('createdDate', sql.DateTime, new Date());
        
        const result = await request.query(`
            INSERT INTO SystemParameters 
            (parameterName, parameterValue, description, dataType, category, active, createdDate)
            VALUES 
            (@parameterName, @parameterValue, @description, @dataType, @category, @active, @createdDate);
            
            SELECT SCOPE_IDENTITY() as newId;
        `);
        
        const newId = result.recordset[0].newId;
        context.log(`Nuovo parametro creato con ID: ${newId}`);
        return createSuccessResponse({ 
            rc: true, 
            message: 'Parametro aggiunto con successo', 
            id: newId 
        });
        
    } catch (error) {
        context.log.error('Errore nell\'aggiunta parametro:', error);
        return createErrorResponse(500, 'Errore nell\'aggiunta parametro', error.message);
    }
}

async function handleDeleteParameter(context, parameterId) {
    try {
        if (!parameterId) {
            return createErrorResponse(400, 'ID parametro richiesto');
        }
        
        context.log(`Cancellazione parametro: ${parameterId}`);
        
        const pool = await getPool();
        const request = pool.request();
        
        request.input('id', sql.Int, parseInt(parameterId));
        request.input('updatedDate', sql.DateTime, new Date());
        
        // Soft delete - set active to false
        const result = await request.query(`
            UPDATE SystemParameters 
            SET active = 0, updatedDate = @updatedDate
            WHERE id = @id;
            
            SELECT @@ROWCOUNT as rowsAffected;
        `);
        
        if (result.recordset[0].rowsAffected === 0) {
            return createErrorResponse(404, 'Parametro non trovato');
        }
        
        context.log(`Parametro ${parameterId} cancellato`);
        return createSuccessResponse({ rc: true, message: 'Parametro cancellato con successo' });
        
    } catch (error) {
        context.log.error('Errore nella cancellazione parametro:', error);
        return createErrorResponse(500, 'Errore nella cancellazione parametro', error.message);
    }
}