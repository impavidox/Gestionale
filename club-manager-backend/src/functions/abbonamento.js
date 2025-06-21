const { app } = require('@azure/functions');
const { getPool, sql } = require('../../shared/database/connection');
const { createSuccessResponse, createErrorResponse } = require('../../shared/utils/responseHelper');
const { validateAbbonamento } = require('../../shared/models/Abbonamento');

app.http('abbonamento', {
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'abbonamento/{action?}/{param1?}',
    handler: async (request, context) => {
        context.log(`Abbonamento API chiamata: ${request.method} ${request.url}`);

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
                case 'updateAbbonamento':
                    return await handleUpdateAbbonamento(context, request.body);
                
                case 'retrieveCurrentAbbonamento':
                    return await handleRetrieveCurrentAbbonamento(context, param1);
                
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
async function handleUpdateAbbonamento(context, abbonamentoData) {
    try {
        const { error, value } = validateAbbonamento(abbonamentoData);
        
        if (error) {
            context.log.warn('Dati abbonamento non validi:', error.details);
            return createErrorResponse(400, 'Dati non validi', error.details);
        }
        
        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        
        try {
            const request = new sql.Request(transaction);
            
            // Genera numero tessera se non presente
            let numeroTessera = value.numeroTessera || value.numeroTessara;
            
            if (!numeroTessera) {
                const tessereResult = await request.query(`
                    SELECT TOP 1 numeroTessera FROM Abbonamenti 
                    WHERE numeroTessera IS NOT NULL AND ISNUMERIC(numeroTessera) = 1
                    ORDER BY CAST(numeroTessera AS INT) DESC
                `);
                
                const ultimoNumero = tessereResult.recordset.length > 0 
                    ? parseInt(tessereResult.recordset[0].numeroTessera) 
                    : 1000; // Numero iniziale
                
                numeroTessera = (ultimoNumero + 1).toString();
                context.log(`Generato nuovo numero tessera: ${numeroTessera}`);
            }
            
            let abbonamentoId;
            
            if (value.id) {
                // Aggiorna abbonamento esistente
                const updateQuery = `
                    UPDATE Abbonamenti SET 
                        numeroTessera = @numeroTessera,
                        numeroTessara = @numeroTessera,
                        dataIscrizione = @dataIscrizione,
                        incription = @dataIscrizione,
                        dataScadenza = @dataScadenza,
                        attivitaId = @attivitaId,
                        importo = @importo,
                        firmato = @firmato,
                        annoSportivo = @annoSportivo,
                        note = @note,
                        dataModifica = GETDATE()
                    WHERE id = @id AND attivo = 1
                `;
                
                request.input('id', sql.Int, value.id);
                request.input('numeroTessera', sql.NVarChar, numeroTessera);
                request.input('dataIscrizione', sql.Date, value.dataIscrizione || value.incription);
                request.input('dataScadenza', sql.Date, value.dataScadenza);
                request.input('attivitaId', sql.Int, value.attivitaId);
                request.input('importo', sql.Decimal(10, 2), value.importo);
                request.input('firmato', sql.Bit, value.firmato || false);
                request.input('annoSportivo', sql.NVarChar, value.annoSportivo);
                request.input('note', sql.NVarChar, value.note || '');
                
                const updateResult = await request.query(updateQuery);
                
                if (updateResult.rowsAffected[0] === 0) {
                    await transaction.rollback();
                    return createErrorResponse(404, 'Abbonamento non trovato');
                }
                
                abbonamentoId = value.id;
                context.log(`Abbonamento ${abbonamentoId} aggiornato`);
                
            } else {
                // Crea nuovo abbonamento
                const insertQuery = `
                    INSERT INTO Abbonamenti (
                        socioId, numeroTessera, numeroTessara, dataIscrizione, incription,
                        dataScadenza, attivitaId, importo, firmato, annoSportivo, 
                        note, attivo, dataCreazione
                    ) OUTPUT INSERTED.id VALUES (
                        @socioId, @numeroTessera, @numeroTessera, @dataIscrizione, @dataIscrizione,
                        @dataScadenza, @attivitaId, @importo, @firmato, @annoSportivo,
                        @note, 1, GETDATE()
                    )
                `;
                
                request.input('socioId', sql.Int, value.socioId);
                request.input('numeroTessera', sql.NVarChar, numeroTessera);
                request.input('dataIscrizione', sql.Date, value.dataIscrizione || value.incription);
                request.input('dataScadenza', sql.Date, value.dataScadenza);
                request.input('attivitaId', sql.Int, value.attivitaId);
                request.input('importo', sql.Decimal(10, 2), value.importo);
                request.input('firmato', sql.Bit, value.firmato || false);
                request.input('annoSportivo', sql.NVarChar, value.annoSportivo);
                request.input('note', sql.NVarChar, value.note || '');
                
                const insertResult = await request.query(insertQuery);
                abbonamentoId = insertResult.recordset[0].id;
                context.log(`Nuovo abbonamento creato con ID: ${abbonamentoId}`);
            }
            
            await transaction.commit();
            
            return createSuccessResponse({
                returnCode: true,
                abbonamento: { 
                    id: abbonamentoId, 
                    numeroTessara: numeroTessera, // Compatibilità frontend
                    numeroTessera: numeroTessera
                },
                message: 'Abbonamento salvato con successo'
            });
            
        } catch (dbError) {
            await transaction.rollback();
            throw dbError;
        }
        
    } catch (error) {
        context.log.error('Errore nella gestione abbonamento:', error);
        return createErrorResponse(500, 'Errore nella gestione abbonamento', error.message);
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
            SELECT a.*, 
                   act.nome as attivitaNome, 
                   act.importo as importoAttivita,
                   s.nome as socioNome,
                   s.cognome as socioCognome
            FROM Abbonamenti a
            INNER JOIN Attivita act ON a.attivitaId = act.id
            INNER JOIN Soci s ON a.socioId = s.id
            WHERE a.socioId = @socioId AND a.attivo = 1
            ORDER BY a.dataCreazione DESC
        `;
        
        const result = await request.query(query);
        
        if (result.recordset.length === 0) {
            return createErrorResponse(404, 'Nessun abbonamento trovato per questo socio');
        }
        
        const abbonamento = result.recordset[0];
        
        // Assicura compatibilità frontend
        abbonamento.numeroTessara = abbonamento.numeroTessera;
        abbonamento.incription = abbonamento.dataIscrizione;
        
        context.log(`Abbonamento recuperato per socio ${socioId}`);
        return createSuccessResponse(abbonamento);
        
    } catch (error) {
        context.log.error('Errore nel recupero abbonamento:', error);
        return createErrorResponse(500, 'Errore nel recupero abbonamento', error.message);
    }
}