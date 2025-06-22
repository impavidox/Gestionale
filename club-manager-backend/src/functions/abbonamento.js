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

        // Validate the data using the improved validation
        const { error, value } = validateAbbonamento(requestBody);
        if (error) {
            context.log.error('Validation error:', error.details);
            return createErrorResponse(400, 'Dati abbonamento non validi', error.details[0].message);
        }

        const pool = await getPool();
        const request = pool.request();

        // Determine if creating or updating
        const isUpdate = value.id && value.id > 0;

        if (isUpdate) {
            // Update existing abbonamento
            request.input('id', sql.Int, value.id);
            request.input('socioId', sql.Int, value.socioId);
            request.input('dataIscrizione', sql.DateTime, value.dataIscrizione);
            request.input('firmato', sql.Bit, value.firmato);
            
            if (value.numeroTessera) {
                request.input('numeroTessera', sql.VarChar(50), value.numeroTessera);
            }

            const updateQuery = `
                UPDATE Abbonamenti 
                SET dataIscrizione = @dataIscrizione,
                    firmato = @firmato,
                    ${value.numeroTessera ? 'numeroTessera = @numeroTessera,' : ''}
                    dataModifica = GETDATE()
                WHERE id = @id AND socioId = @socioId;
                
                SELECT a.*, at.nome as attivitaNome
                FROM Abbonamenti a
                LEFT JOIN Attivita at ON a.attivitaId = at.id
                WHERE a.id = @id;
            `;

            const result = await request.query(updateQuery);
            
            if (result.recordset.length === 0) {
                return createErrorResponse(404, 'Abbonamento non trovato');
            }

            const abbonamento = normalizeAbbonamentoResponse(result.recordset[0]);
            context.log('Abbonamento aggiornato:', abbonamento);
            
            return createSuccessResponse({
                abbonamento,
                message: 'Abbonamento aggiornato con successo'
            });

        } else {
            // Create new abbonamento
            request.input('socioId', sql.Int, value.socioId);
            request.input('dataIscrizione', sql.DateTime, value.dataIscrizione);
            request.input('attivitaId', sql.Int, value.attivitaId);
            request.input('importo', sql.Decimal(10, 2), value.importo);
            request.input('firmato', sql.Bit, value.firmato);
            request.input('idAnno', sql.Int, value.idAnno);

            // Generate numero tessera if not provided
            let numeroTessera = value.numeroTessera;
            if (!numeroTessera || numeroTessera === '...') {
                // Generate new numero tessera based on business logic
                const tesseraRequest = pool.request();
                tesseraRequest.input('annoSportivo', sql.VarChar(10), new Date().getFullYear().toString());
                
                const tesseraQuery = `
                    SELECT COUNT(*) as count
                    FROM Abbonamenti a
                    INNER JOIN AnnoSportivo ans ON a.idAnno = ans.id
                    WHERE ans.annoName LIKE '%' + @annoSportivo + '%'
                `;
                
                const tesseraResult = await tesseraRequest.query(tesseraQuery);
                const progressivo = (tesseraResult.recordset[0].count || 0) + 1;
                numeroTessera = `${new Date().getFullYear()}/${progressivo.toString().padStart(4, '0')}`;
            }

            request.input('numeroTessera', sql.VarChar(50), numeroTessera);

            const insertQuery = `
                INSERT INTO Abbonamenti (socioId, dataIscrizione, attivitaId, importo, firmato, idAnno, numeroTessera, dataCreazione)
                OUTPUT INSERTED.*
                VALUES (@socioId, @dataIscrizione, @attivitaId, @importo, @firmato, @idAnno, @numeroTessera, GETDATE());
                
                SELECT a.*, at.nome as attivitaNome
                FROM Abbonamenti a
                LEFT JOIN Attivita at ON a.attivitaId = at.id
                WHERE a.id = (SELECT id FROM INSERTED);
            `;

            const result = await request.query(insertQuery);
            const abbonamento = normalizeAbbonamentoResponse(result.recordset[0]);
            
            context.log('Nuovo abbonamento creato:', abbonamento);
            
            return createSuccessResponse({
                abbonamento,
                message: 'Abbonamento creato con successo'
            });
        }

    } catch (error) {
        context.log.error('Errore nell\'aggiornamento abbonamento:', error);
        return createErrorResponse(500, 'Errore nell\'aggiornamento abbonamento', error.message);
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
            SELECT TOP 1 a.*, at.nome as attivitaNome
            FROM Abbonamenti a
            LEFT JOIN Attivita at ON a.attivitaId = at.id
            WHERE a.socioId = @socioId AND a.attivo = 1
            ORDER BY a.dataIscrizione DESC, a.id DESC
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
        return createErrorResponse(500, 'Errore nel recupero abbonamento', error.message);
    }
}

async function handleRetrieveAbbonamentoById(context, abbonamentoId) {
    try {
        if (!abbonamentoId) {
            return createErrorResponse(400, 'ID abbonamento richiesto');
        }

        const pool = await getPool();
        const request = pool.request();
        request.input('id', sql.Int, parseInt(abbonamentoId));

        const query = `
            SELECT a.*, at.nome as attivitaNome
            FROM Abbonamenti a
            LEFT JOIN Attivita at ON a.attivitaId = at.id
            WHERE a.id = @id
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
        context.log.error('Errore nel recupero abbonamento per ID:', error);
        return createErrorResponse(500, 'Errore nel recupero abbonamento', error.message);
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
            SELECT a.*, at.nome as attivitaNome
            FROM Abbonamenti a
            LEFT JOIN Attivita at ON a.attivitaId = at.id
            WHERE a.socioId = @socioId
            ORDER BY a.dataIscrizione DESC, a.id DESC
        `;

        const result = await request.query(query);
        
        const abbonamenti = result.recordset.map(row => normalizeAbbonamentoResponse(row));
        
        return createSuccessResponse({
            abbonamenti,
            count: abbonamenti.length,
            message: `${abbonamenti.length} abbonamenti recuperati`
        });

    } catch (error) {
        context.log.error('Errore nel recupero abbonamenti per socio:', error);
        return createErrorResponse(500, 'Errore nel recupero abbonamenti', error.message);
    }
}