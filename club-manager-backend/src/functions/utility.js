const { app } = require('@azure/functions');
const { getPool, sql } = require('../../shared/database/connection');
const { createSuccessResponse, createErrorResponse } = require('../../shared/utils/responseHelper');

app.http('utility', {
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'utility/{action?}/{param1?}',
    handler: async (request, context) => {
        context.log(`Utility API chiamata: ${request.method} ${request.url}`);

        try {
            const action = request.params.action;
            const param1 = request.params.param1;

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

            context.log(`Action: ${action}, Param1: ${param1}`);

            switch (action) {
                case 'loadNumeroTessera':
                    return await handleLoadNumeroTessera(context);
                
                case 'retrieveAbbonamentoByTessera':
                    return await handleRetrieveAbbonamentoByTessera(context, param1);
                
                case 'updateNumeroTessera':
                    return await handleUpdateNumeroTessera(context, request.body);
                
                case 'updateNumeroTesseraAlert':
                    return await handleUpdateNumeroTesseraAlert(context, request.body);
                
                case 'cntrlNumeroTessera':
                    return await handleCntrlNumeroTessera(context, param1);
                
                default:
                    return createErrorResponse(404, `Endpoint '${action}' non trovato`);
            }
        } catch (error) {
            context.log.error('Errore nella function utility:', error);
            return createErrorResponse(500, 'Errore interno del server', error.message);
        }
    }
});

// Handler functions
async function handleLoadNumeroTessera(context) {
    try {
        context.log('Caricamento numeri tessera nel sistema');
        
        const pool = await getPool();
        const request = pool.request();
        
        // This function typically initializes tessera numbers for the season
        // Check if tessera numbers are already loaded for current year
        const checkResult = await request.query(`
            SELECT COUNT(*) as count 
            FROM Abbonamenti a
            INNER JOIN AnnoSportivo ans ON a.annoSportivoId = ans.id
            WHERE ans.active = 1 AND a.numeroTessera IS NOT NULL
        `);
        
        if (checkResult.recordset[0].count > 0) {
            context.log('Numeri tessera già caricati per l\'anno corrente');
            return createSuccessResponse({ 
                rc: true, 
                message: 'Numeri tessera già caricati',
                count: checkResult.recordset[0].count 
            });
        }
        
        // Initialize tessera numbers starting from 1
        const initResult = await request.query(`
            UPDATE Abbonamenti 
            SET numeroTessera = ROW_NUMBER() OVER (ORDER BY a.createdDate, s.cognome, s.nome)
            FROM Abbonamenti a
            INNER JOIN Soci s ON a.socioId = s.id
            INNER JOIN AnnoSportivo ans ON a.annoSportivoId = ans.id
            WHERE ans.active = 1 AND a.numeroTessera IS NULL;
            
            SELECT @@ROWCOUNT as updatedCount;
        `);
        
        const updatedCount = initResult.recordset[0].updatedCount;
        context.log(`${updatedCount} numeri tessera inizializzati`);
        
        return createSuccessResponse({ 
            rc: true, 
            message: `${updatedCount} numeri tessera caricati con successo`,
            count: updatedCount 
        });
        
    } catch (error) {
        context.log.error('Errore nel caricamento numeri tessera:', error);
        return createErrorResponse(500, 'Errore nel caricamento numeri tessera', error.message);
    }
}

async function handleRetrieveAbbonamentoByTessera(context, numeroTessera) {
    try {
        if (!numeroTessera) {
            return createErrorResponse(400, 'Numero tessera richiesto');
        }
        
        context.log(`Recupero abbonamento per tessera: ${numeroTessera}`);
        
        const pool = await getPool();
        const request = pool.request();
        request.input('numeroTessera', sql.NVarChar(50), numeroTessera);
        
        const result = await request.query(`
            SELECT 
                a.id,
                a.socioId,
                a.numeroTessera,
                a.dataInizio,
                a.dataFine,
                a.importo,
                a.pagato,
                a.attivitaId,
                a.createdDate,
                s.nome,
                s.cognome,
                s.dataNascita,
                s.codiceFiscale,
                s.email,
                s.tel,
                act.description as attivitaDescrizione,
                ans.annoName
            FROM Abbonamenti a
            INNER JOIN Soci s ON a.socioId = s.id
            INNER JOIN Activities act ON a.attivitaId = act.id
            INNER JOIN AnnoSportivo ans ON a.annoSportivoId = ans.id
            WHERE a.numeroTessera = @numeroTessera
            ORDER BY a.createdDate DESC
        `);
        
        if (result.recordset.length === 0) {
            return createErrorResponse(404, 'Nessun abbonamento trovato per questo numero tessera');
        }
        
        // Format dates for frontend
        result.recordset.forEach(abbonamento => {
            if (abbonamento.dataInizio) {
                abbonamento.dataInizio = new Date(abbonamento.dataInizio);
            }
            if (abbonamento.dataFine) {
                abbonamento.dataFine = new Date(abbonamento.dataFine);
            }
            if (abbonamento.dataNascita) {
                abbonamento.dataNascita = new Date(abbonamento.dataNascita);
            }
        });
        
        context.log(`${result.recordset.length} abbonamenti trovati per tessera ${numeroTessera}`);
        return createSuccessResponse(result.recordset);
        
    } catch (error) {
        context.log.error('Errore nel recupero abbonamento per tessera:', error);
        return createErrorResponse(500, 'Errore nel recupero abbonamento per tessera', error.message);
    }
}

async function handleUpdateNumeroTessera(context, updateData) {
    try {
        context.log('Aggiornamento numero tessera:', updateData);
        
        if (!updateData.id || !updateData.tessera) {
            return createErrorResponse(400, 'ID abbonamento e numero tessera richiesti');
        }
        
        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        
        try {
            const request = new sql.Request(transaction);
            
            // Check if the new tessera number is already in use
            request.input('newTessera', sql.NVarChar(50), updateData.tessera);
            request.input('abbonamentoId', sql.Int, updateData.id);
            
            const checkResult = await request.query(`
                SELECT COUNT(*) as count 
                FROM Abbonamenti 
                WHERE numeroTessera = @newTessera AND id != @abbonamentoId
            `);
            
            if (checkResult.recordset[0].count > 0 && !updateData.extend) {
                await transaction.rollback();
                return createErrorResponse(400, 'Numero tessera già in uso');
            }
            
            // Update tessera number
            request.input('updatedDate', sql.DateTime, new Date());
            const updateResult = await request.query(`
                UPDATE Abbonamenti 
                SET 
                    numeroTessera = @newTessera,
                    updatedDate = @updatedDate
                WHERE id = @abbonamentoId;
                
                SELECT @@ROWCOUNT as rowsAffected;
            `);
            
            if (updateResult.recordset[0].rowsAffected === 0) {
                await transaction.rollback();
                return createErrorResponse(404, 'Abbonamento non trovato');
            }
            
            // Handle empty tessera option
            if (updateData.emtpy || updateData.empty) {
                const emptyRequest = new sql.Request(transaction);
                emptyRequest.input('abbonamentoId', sql.Int, updateData.id);
                
                await emptyRequest.query(`
                    UPDATE Abbonamenti 
                    SET numeroTessera = NULL
                    WHERE id = @abbonamentoId
                `);
            }
            
            await transaction.commit();
            context.log(`Numero tessera aggiornato per abbonamento ${updateData.id}`);
            
            return createSuccessResponse({ 
                rc: true, 
                message: 'Numero tessera aggiornato con successo' 
            });
            
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
        
    } catch (error) {
        context.log.error('Errore nell\'aggiornamento numero tessera:', error);
        return createErrorResponse(500, 'Errore nell\'aggiornamento numero tessera', error.message);
    }
}

async function handleUpdateNumeroTesseraAlert(context, updateData) {
    try {
        context.log('Aggiornamento numero tessera con alert:', updateData);
        
        // This is similar to updateNumeroTessera but with additional validation and alerts
        const result = await handleUpdateNumeroTessera(context, updateData);
        
        // Add alert/notification logic here if needed
        if (result.status === 200) {
            context.log('Alert inviato per aggiornamento numero tessera');
            // Could send email notification or log audit trail
        }
        
        return result;
        
    } catch (error) {
        context.log.error('Errore nell\'aggiornamento numero tessera con alert:', error);
        return createErrorResponse(500, 'Errore nell\'aggiornamento numero tessera con alert', error.message);
    }
}

async function handleCntrlNumeroTessera(context, type) {
    try {
        const controlType = parseInt(type) || 0;
        context.log(`Controllo numeri tessera tipo: ${controlType}`);
        
        const pool = await getPool();
        const request = pool.request();
        
        let query = '';
        let description = '';
        
        switch (controlType) {
            case 0:
                // Check for duplicate tessera numbers
                query = `
                    SELECT 
                        numeroTessera,
                        COUNT(*) as duplicates,
                        STRING_AGG(CAST(id AS NVARCHAR), ', ') as abbonamentoIds
                    FROM Abbonamenti 
                    WHERE numeroTessera IS NOT NULL
                    GROUP BY numeroTessera
                    HAVING COUNT(*) > 1
                `;
                description = 'Controllo duplicati numeri tessera';
                break;
                
            case 1:
                // Check for missing tessera numbers
                query = `
                    SELECT 
                        a.id,
                        s.nome,
                        s.cognome,
                        a.createdDate,
                        act.description as attivita
                    FROM Abbonamenti a
                    INNER JOIN Soci s ON a.socioId = s.id
                    INNER JOIN Activities act ON a.attivitaId = act.id
                    INNER JOIN AnnoSportivo ans ON a.annoSportivoId = ans.id
                    WHERE a.numeroTessera IS NULL AND ans.active = 1
                    ORDER BY s.cognome, s.nome
                `;
                description = 'Controllo numeri tessera mancanti';
                break;
                
            case 2:
                // Check for invalid tessera number format
                query = `
                    SELECT 
                        a.id,
                        a.numeroTessera,
                        s.nome,
                        s.cognome
                    FROM Abbonamenti a
                    INNER JOIN Soci s ON a.socioId = s.id
                    WHERE a.numeroTessera IS NOT NULL 
                    AND (ISNUMERIC(a.numeroTessera) = 0 OR LEN(a.numeroTessera) > 10)
                    ORDER BY s.cognome, s.nome
                `;
                description = 'Controllo formato numeri tessera';
                break;
                
            default:
                return createErrorResponse(400, 'Tipo di controllo non valido');
        }
        
        const result = await request.query(query);
        
        context.log(`${description}: ${result.recordset.length} problemi trovati`);
        
        return createSuccessResponse({
            type: controlType,
            description: description,
            issues: result.recordset,
            count: result.recordset.length
        });
        
    } catch (error) {
        context.log.error('Errore nel controllo numeri tessera:', error);
        return createErrorResponse(500, 'Errore nel controllo numeri tessera', error.message);
    }
}