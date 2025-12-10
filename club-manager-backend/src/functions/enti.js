const { app } = require('@azure/functions');
const { getPool, sql } = require('../../shared/database/connection');
const { createSuccessResponse, createErrorResponse } = require('../../shared/utils/responseHelper');
const { validateRicevutaEnti, normalizeRicevutaEntiResponse } = require('../../shared/models/RicevutaEnti');
const moment = require('moment');

app.http('enti', {
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'enti/{action?}/{param1?}/{param2?}/{param3?}',
    handler: async (request, context) => {
        context.log(`Enti API chiamata: ${request.method} ${request.url}`);

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
                        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                    }
                };
            }

            context.log(`Action: ${action}, Params: ${param1}, ${param2}, ${param3}`);

            let requestBody = null;
            // Only attempt to read body for POST/PUT/DELETE requests
            if (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE') {
                try {
                    requestBody = await request.json();
                    context.log('Request body (parsed JSON):', requestBody);
                } catch (jsonError) {
                    context.log('Error parsing JSON body:', jsonError.message);
                    return createErrorResponse(400, 'Invalid JSON body provided', jsonError.message);
                }
            }

            // Parse query parameters for GET requests
            let queryParams = {};
            if (request.method === 'GET' && request.url) {
                const url = new URL(request.url);
                queryParams = Object.fromEntries(url.searchParams);
                context.log('Query parameters:', queryParams);
            }

            switch (action) {
                case 'create':
                    return await handleCreateRicevutaEnti(context, requestBody);

                case 'retrieveAll':
                    return await handleRetrieveAllRicevuteEnti(context, queryParams);

                case 'retrieveById':
                    return await handleRetrieveRicevutaEntiById(context, param1);

                case 'update':
                    return await handleUpdateRicevutaEnti(context, requestBody);

                case 'delete':
                    return await handleDeleteRicevutaEnti(context, requestBody);

                case 'buildPrimaNota':
                    return await handleBuildPrimaNotaEnti(context, param1, param2, param3);

                default:
                    return createErrorResponse(404, `Endpoint '${action}' non trovato`);
            }
        } catch (error) {
            context.log('Errore nella function enti:', error);
            return createErrorResponse(500, 'Errore interno del server', error.message);
        }
    }
});

// Helper function to parse date from DD-MM-YYYY format
function parseDate(dateString) {
    if (!dateString) return null;

    // Handle DD-MM-YYYY format
    const parts = dateString.split('-');
    if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JS
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day);
    }

    // Fallback to standard date parsing
    return new Date(dateString);
}

async function handleCreateRicevutaEnti(context, ricevutaData) {
    try {
        const { error, value } = validateRicevutaEnti(ricevutaData, context);

        if (error) {
            context.log('Dati ricevuta enti non validi:', error.details);
            return createErrorResponse(400, 'Dati ricevuta enti non validi', error.details);
        }

        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);

            const insertQuery = `
                INSERT INTO RicevuteEnti (
                    dataRicevuta, ente, importo, descrizione, created_at
                ) OUTPUT INSERTED.id VALUES (
                    @dataRicevuta, @ente, @importo, @descrizione, GETDATE()
                )
            `;

            request.input('dataRicevuta', sql.Date, value.dataRicevuta);
            request.input('ente', sql.NVarChar(255), value.ente);
            request.input('importo', sql.Int, value.importo);
            request.input('descrizione', sql.NVarChar(255), value.descrizione || null);

            const result = await request.query(insertQuery);
            const ricevutaId = result.recordset[0].id;

            await transaction.commit();

            context.log(`Ricevuta enti creata con ID: ${ricevutaId}`);

            return createSuccessResponse({
                id: ricevutaId,
                returnCode: true,
                message: 'Ricevuta enti creata con successo'
            });

        } catch (dbError) {
            await transaction.rollback();
            throw dbError;
        }

    } catch (error) {
        context.log('Errore nella creazione ricevuta enti:', error);
        return createErrorResponse(500, 'Errore nella creazione ricevuta enti', error.message);
    }
}

async function handleRetrieveAllRicevuteEnti(context, queryParams) {
    try {
        const { startDate, endDate } = queryParams;

        const pool = await getPool();
        const request = pool.request();

        let whereClause = 'WHERE 1=1';

        // Add date range filter if provided
        if (startDate && endDate) {
            const parsedStartDate = parseDate(startDate);
            const parsedEndDate = parseDate(endDate);

            if (!parsedStartDate || !parsedEndDate) {
                return createErrorResponse(400, 'Date non valide. Usare formato DD-MM-YYYY');
            }

            whereClause += ' AND dataRicevuta >= @startDate AND dataRicevuta <= @endDate';
            request.input('startDate', sql.Date, parsedStartDate);
            request.input('endDate', sql.Date, parsedEndDate);

            context.log(`Recupero ricevute enti dal ${startDate} al ${endDate}`);
        }

        const query = `
            SELECT
                id, dataRicevuta, ente, importo, descrizione, created_at
            FROM RicevuteEnti
            ${whereClause}
            ORDER BY dataRicevuta DESC, id DESC
        `;

        const result = await request.query(query);

        const ricevute = result.recordset.map(row => normalizeRicevutaEntiResponse(row));

        // Calculate totals
        let totaleGenerale = 0;

        ricevute.forEach(ricevuta => {
            const importo = ricevuta.importo || 0;
            totaleGenerale += importo;
        });

        context.log(`${ricevute.length} ricevute enti trovate`);

        return createSuccessResponse({
            items: ricevute,
            totaleGenerale,
            periodo: startDate && endDate ? {
                inizio: startDate,
                fine: endDate
            } : null
        });

    } catch (error) {
        context.log('Errore nel recupero ricevute enti:', error);
        return createErrorResponse(500, 'Errore nel recupero ricevute enti', error.message);
    }
}

async function handleRetrieveRicevutaEntiById(context, ricevutaId) {
    try {
        if (!ricevutaId) {
            return createErrorResponse(400, 'ID ricevuta richiesto');
        }

        const pool = await getPool();
        const request = pool.request();
        request.input('ricevutaId', sql.Int, parseInt(ricevutaId));

        const query = `
            SELECT id, dataRicevuta, ente, importo, descrizione, created_at
            FROM RicevuteEnti
            WHERE id = @ricevutaId
        `;

        const result = await request.query(query);

        if (result.recordset.length === 0) {
            return createErrorResponse(404, 'Ricevuta enti non trovata');
        }

        const ricevuta = normalizeRicevutaEntiResponse(result.recordset[0]);

        context.log(`Ricevuta enti ${ricevutaId} recuperata`);
        return createSuccessResponse(ricevuta);

    } catch (error) {
        context.log('Errore nel recupero ricevuta enti:', error);
        return createErrorResponse(500, 'Errore nel recupero ricevuta enti', error.message);
    }
}

async function handleUpdateRicevutaEnti(context, ricevutaData) {
    try {
        if (!ricevutaData.id) {
            return createErrorResponse(400, 'ID ricevuta richiesto per la modifica');
        }

        const { error, value } = validateRicevutaEnti(ricevutaData, context);

        if (error) {
            context.log('Dati ricevuta enti non validi:', error.details);
            return createErrorResponse(400, 'Dati ricevuta enti non validi', error.details);
        }

        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);

            // Check if ricevuta exists
            request.input('ricevutaId', sql.Int, parseInt(ricevutaData.id));
            const checkQuery = `SELECT id FROM RicevuteEnti WHERE id = @ricevutaId`;
            const checkResult = await request.query(checkQuery);

            if (checkResult.recordset.length === 0) {
                await transaction.rollback();
                return createErrorResponse(404, 'Ricevuta enti non trovata');
            }

            // Update ricevuta
            const updateRequest = new sql.Request(transaction);
            updateRequest.input('ricevutaId', sql.Int, parseInt(ricevutaData.id));
            updateRequest.input('dataRicevuta', sql.Date, value.dataRicevuta);
            updateRequest.input('ente', sql.NVarChar(255), value.ente);
            updateRequest.input('importo', sql.Int, value.importo);
            updateRequest.input('descrizione', sql.NVarChar(255), value.descrizione || null);

            const updateQuery = `
                UPDATE RicevuteEnti
                SET
                    dataRicevuta = @dataRicevuta,
                    ente = @ente,
                    importo = @importo,
                    descrizione = @descrizione
                WHERE id = @ricevutaId
            `;

            const updateResult = await updateRequest.query(updateQuery);

            if (updateResult.rowsAffected[0] === 0) {
                await transaction.rollback();
                return createErrorResponse(404, 'Ricevuta enti non trovata o nessun aggiornamento effettuato');
            }

            await transaction.commit();

            context.log(`Ricevuta enti ${ricevutaData.id} aggiornata con successo`);

            return createSuccessResponse({
                id: parseInt(ricevutaData.id),
                returnCode: true,
                message: 'Ricevuta enti aggiornata con successo'
            });

        } catch (dbError) {
            await transaction.rollback();
            throw dbError;
        }

    } catch (error) {
        context.log('Errore nell\'aggiornamento ricevuta enti:', error);
        return createErrorResponse(500, 'Errore nell\'aggiornamento ricevuta enti', error.message);
    }
}

async function handleDeleteRicevutaEnti(context, deleteData) {
    try {
        if (!deleteData.id) {
            return createErrorResponse(400, 'ID ricevuta richiesto');
        }

        const pool = await getPool();
        const request = pool.request();
        request.input('ricevutaId', sql.Int, parseInt(deleteData.id));

        const deleteQuery = `DELETE FROM RicevuteEnti WHERE id = @ricevutaId`;

        const result = await request.query(deleteQuery);

        if (result.rowsAffected[0] === 0) {
            return createErrorResponse(404, 'Ricevuta enti non trovata');
        }

        context.log(`Ricevuta enti ${deleteData.id} eliminata`);

        return createSuccessResponse({
            returnCode: true,
            message: 'Ricevuta enti eliminata con successo'
        });

    } catch (error) {
        context.log('Errore nella cancellazione ricevuta enti:', error);
        return createErrorResponse(500, 'Errore nella cancellazione ricevuta enti', error.message);
    }
}

async function handleBuildPrimaNotaEnti(context, type, startDate, endDate) {
    try {
        const primaNotaType = parseInt(type) || 0;
        context.log(`Costruzione prima nota enti tipo: ${primaNotaType}`);

        const pool = await getPool();
        const request = pool.request();

        // Build date filters
        let dateFilter = '';
        if (startDate && endDate) {
            const start = moment(startDate, 'DD-MM-YYYY').format('YYYY-MM-DD');
            const end = moment(endDate, 'DD-MM-YYYY').format('YYYY-MM-DD');

            request.input('startDate', sql.Date, start);
            request.input('endDate', sql.Date, end);
            dateFilter = 'AND dataRicevuta BETWEEN @startDate AND @endDate';

            context.log(`Periodo: dal ${startDate} al ${endDate}`);
        }

        const query = `
            SELECT
                id,
                dataRicevuta,
                ente,
                importo,
                descrizione
            FROM RicevuteEnti
            WHERE 1=1 ${dateFilter}
            ORDER BY dataRicevuta, id
        `;

        const result = await request.query(query);

        // Calculate totals and progressive balance
        let saldoProgressivo = 0;
        const movimenti = result.recordset.map(record => {
            saldoProgressivo += record.importo || 0;
            return {
                ...record,
                saldoProgressivo
            };
        });

        const totaleEntrate = movimenti.reduce((sum, m) => sum + (m.importo || 0), 0);

        context.log(`Prima nota enti costruita: ${movimenti.length} movimenti`);
        context.log(`Totale entrate: €${totaleEntrate.toFixed(2)}`);

        return createSuccessResponse({
            movimenti: movimenti,
            riepilogo: {
                totaleEntrate: totaleEntrate,
                totaleUscite: 0,
                saldo: totaleEntrate,
                numeroMovimenti: movimenti.length,
                periodo: {
                    inizio: startDate,
                    fine: endDate
                },
                tipo: primaNotaType
            }
        });

    } catch (error) {
        context.log('Errore nella costruzione prima nota enti:', error);
        return createErrorResponse(500, 'Errore nella costruzione prima nota enti', error.message);
    }
}
