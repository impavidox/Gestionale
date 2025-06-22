// club-manager-backend/src/functions/abbonamento.js

const { app } = require('@azure/functions');
const { getPool, sql } = require('../../shared/database/connection');
const { createSuccessResponse, createErrorResponse } = require('../../shared/utils/responseHelper');
const { validateAbbonamento, normalizeAbbonamentoResponse } = require('../../shared/models/Abbonamento');

app.http('abbonamento', {
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'abbonamento/{action?}/{param1?}/{param2?}',
    handler: async (request, context) => {
        context.log(`Abbonamento API chiamata: ${request.method} ${request.url}`);

        try {
            const action = request.params.action;
            const param1 = request.params.param1;
            const param2 = request.params.param2;

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

            context.log(`Action: ${action}, Params: ${param1}, ${param2}`);

            switch (action) {
                case 'updateAbbonamento':
                    return await handleUpdateAbbonamento(context, request.body);
                
                case 'retrieveCurrentAbbonamento':
                    return await handleRetrieveCurrentAbbonamento(context, param1);
                
                case 'retrieveAbbonamentoById':
                    return await handleRetrieveAbbonamentoById(context, param1);
                
                case 'retrieveAbbonamentiBySocio':
                    return await handleRetrieveAbbonamentiBySocio(context, param1);
                
                default:
                    return createErrorResponse(404, `Endpoint '${action}' non trovato`);
            }
        } catch (error) {
            context.log.error('Errore nella function abbonamento:', error);
            return createErrorResponse(500, 'Errore interno del server', error.message);
        }
    }
});

// Handler functions
async function handleUpdateAbbonamento(context, requestBody) {
    try {
        if (!requestBody) {
            return createErrorResponse(400, 'Dati abbonamento richiesti');
        }

        context.log('Dati ricevuti per abbonamento:', JSON.stringify(requestBody, null, 2));

        // Normalize field names from frontend to backend
        const normalizedData = {
            id: requestBody.idAbonamento || requestBody.id || 0,
            socioId: requestBody.idSocio || requestBody.socioId,
            dataIscrizione: requestBody.dateInscription || requestBody.incription || requestBody.dataIscrizione,
            idAnno: requestBody.idAnno,
            firmato: requestBody.firmato || false,
            numeroTessera: requestBody.numeroTessera || requestBody.numeroTessara
        };

        // Validate the normalized data
        const { error, value } = validateAbbonamento(normalizedData);
        if (error) {
            context.log.error('Validation error:', error.details);
            return createErrorResponse(400, 'Dati abbonamento non validi', error.details[0].message);
        }

        const pool = await getPool();
        const request = pool.request();

        // Determine if creating or updating
        const isUpdate = normalizedData.id && normalizedData.id > 0;

        if (isUpdate) {
            // Update existing abbonamento
            request.input('id', sql.Int, normalizedData.id);
            request.input('socioId', sql.Int, normalizedData.socioId);
            request.input('dataIscrizione', sql.DateTime, new Date(normalizedData.dataIscrizione));
            request.input('firmato', sql.Bit, normalizedData.firmato);

            const updateQuery = `
                UPDATE Abbonamenti 
                SET dataIscrizione = @dataIscrizione,
                    firmato = @firmato,
                    dataModifica = GETDATE()
                WHERE id = @id AND socioId = @socioId;
                
                SELECT a.*, att.descrizione as attivitaNome 
                FROM Abbonamenti a
                LEFT JOIN Attivita att ON a.attivitaId = att.id
                WHERE a.id = @id;
            `;

            const result = await request.query(updateQuery);
            
            if (result.recordset.length === 0) {
                return createErrorResponse(404, 'Abbonamento non trovato');
            }

            const updatedAbbonamento = normalizeAbbonamentoResponse(result.recordset[0]);

            return createSuccessResponse({
                abbonamento: updatedAbbonamento,
                message: 'Abbonamento aggiornato con successo'
            });

        } else {
            // Create new abbonamento
            request.input('socioId', sql.Int, normalizedData.socioId);
            request.input('dataIscrizione', sql.DateTime, new Date(normalizedData.dataIscrizione));
            request.input('idAnno', sql.Int, normalizedData.idAnno);
            request.input('firmato', sql.Bit, normalizedData.firmato);

            // Get anno sportivo info and default activity
            const annoQuery = `
                SELECT id, annoName, dataInizio, dataFine 
                FROM AnniSportivi 
                WHERE id = @idAnno;
                
                SELECT TOP 1 id, descrizione, importo 
                FROM Attivita 
                WHERE attiva = 1 
                ORDER BY id;
            `;

            const annoResult = await request.query(annoQuery);
            
            if (annoResult.recordsets[0].length === 0) {
                return createErrorResponse(400, 'Anno sportivo non valido');
            }

            const annoSportivo = annoResult.recordsets[0][0];
            const defaultActivity = annoResult.recordsets[1][0];

            if (!defaultActivity) {
                return createErrorResponse(400, 'Nessuna attività disponibile');
            }

            // Generate numero tessera
            const tesseraQuery = `
                SELECT COUNT(*) as count 
                FROM Abbonamenti 
                WHERE YEAR(dataIscrizione) = YEAR(@dataIscrizione)
            `;
            
            const tesseraResult = await request.query(tesseraQuery);
            const progressivo = tesseraResult.recordset[0].count + 1;
            const numeroTessera = `${new Date().getFullYear()}/${progressivo.toString().padStart(4, '0')}`;

            // Calculate data scadenza
            const dataScadenza = new Date(annoSportivo.dataFine);

            // Insert new abbonamento
            request.input('numeroTessera', sql.VarChar(50), numeroTessera);
            request.input('dataScadenza', sql.DateTime, dataScadenza);
            request.input('attivitaId', sql.Int, defaultActivity.id);
            request.input('importo', sql.Decimal(10, 2), defaultActivity.importo);
            request.input('annoSportivo', sql.VarChar(10), annoSportivo.annoName);

            const insertQuery = `
                INSERT INTO Abbonamenti (
                    socioId, numeroTessera, dataIscrizione, dataScadenza, 
                    attivitaId, importo, firmato, annoSportivo, 
                    dataCreazione, dataModifica, attivo
                ) 
                OUTPUT INSERTED.*
                VALUES (
                    @socioId, @numeroTessera, @dataIscrizione, @dataScadenza,
                    @attivitaId, @importo, @firmato, @annoSportivo,
                    GETDATE(), GETDATE(), 1
                );
            `;

            const insertResult = await request.query(insertQuery);
            const newAbbonamento = insertResult.recordset[0];
            newAbbonamento.attivitaNome = defaultActivity.descrizione;

            const normalizedAbbonamento = normalizeAbbonamentoResponse(newAbbonamento);

            return createSuccessResponse({
                abbonamento: normalizedAbbonamento,
                message: 'Abbonamento creato con successo'
            });
        }

    } catch (error) {
        context.log.error('Errore nella gestione abbonamento:', error);
        return createErrorResponse(500, 'Errore durante l\'operazione sull\'abbonamento', error.message);
    }
}

async function handleRetrieveCurrentAbbonamento(context, socioId) {
    try {
        if (!socioId) {
            return createErrorResponse(400, 'ID socio richiesto');
        }

        const pool = await getPool();
        const request = pool.request();
        request.input('socioId', sql.Int, parseInt(socioId));

        const query = `
            SELECT TOP 1 a.*, att.descrizione as attivitaNome
            FROM Abbonamenti a
            LEFT JOIN Attivita att ON a.attivitaId = att.id
            WHERE a.socioId = @socioId 
            AND a.attivo = 1
            ORDER BY a.dataIscrizione DESC;
        `;

        const result = await request.query(query);

        if (result.recordset.length === 0) {
            return createSuccessResponse({
                abbonamento: null,
                message: 'Nessun abbonamento trovato per questo socio'
            });
        }

        const abbonamento = normalizeAbbonamentoResponse(result.recordset[0]);

        return createSuccessResponse({
            abbonamento,
            message: 'Abbonamento recuperato con successo'
        });

    } catch (error) {
        context.log.error('Errore nel recupero abbonamento corrente:', error);
        return createErrorResponse(500, 'Errore nel recupero dell\'abbonamento corrente', error.message);
    }
}

async function handleRetrieveAbbonamentoById(context, abbonamentoId) {
    try {
        if (!abbonamentoId) {
            return createErrorResponse(400, 'ID abbonamento richiesto');
        }

        const pool = await getPool();
        const request = pool.request();
        request.input('abbonamentoId', sql.Int, parseInt(abbonamentoId));

        const query = `
            SELECT a.*, att.descrizione as attivitaNome
            FROM Abbonamenti a
            LEFT JOIN Attivita att ON a.attivitaId = att.id
            WHERE a.id = @abbonamentoId;
        `;

        const result = await request.query(query);

        if (result.recordset.length === 0) {
            return createErrorResponse(404, 'Abbonamento non trovato');
        }

        const abbonamento = normalizeAbbonamentoResponse(result.recordset[0]);

        return createSuccessResponse({
            abbonamento,
            message: 'Abbonamento recuperato con successo'
        });

    } catch (error) {
        context.log.error('Errore nel recupero abbonamento:', error);
        return createErrorResponse(500, 'Errore nel recupero dell\'abbonamento', error.message);
    }
}

async function handleRetrieveAbbonamentiBySocio(context, socioId) {
    try {
        if (!socioId) {
            return createErrorResponse(400, 'ID socio richiesto');
        }

        const pool = await getPool();
        const request = pool.request();
        request.input('socioId', sql.Int, parseInt(socioId));

        const query = `
            SELECT a.*, att.descrizione as attivitaNome
            FROM Abbonamenti a
            LEFT JOIN Attivita att ON a.attivitaId = att.id
            WHERE a.socioId = @socioId
            ORDER BY a.dataIscrizione DESC;
        `;

        const result = await request.query(query);

        const abbonamenti = result.recordset.map(abb => normalizeAbbonamentoResponse(abb));

        return createSuccessResponse({
            abbonamenti,
            count: abbonamenti.length,
            message: 'Abbonamenti recuperati con successo'
        });

    } catch (error) {
        context.log.error('Errore nel recupero abbonamenti:', error);
        return createErrorResponse(500, 'Errore nel recupero degli abbonamenti', error.message);
    }
}