const { app } = require('@azure/functions');
const { getPool, sql } = require('../../shared/database/connection');
const { createSuccessResponse, createErrorResponse } = require('../../shared/utils/responseHelper');
const { validateRicevuta } = require('../../shared/models/Ricevuta');

app.http('ricevuta', {
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'ricevuta/{action?}/{param1?}/{param2?}/{param3?}',
    handler: async (request, context) => {
        context.log(`Ricevuta API chiamata: ${request.method} ${request.url}`);

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
                        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                    }
                };
            }

            context.log(`Action: ${action}, Params: ${param1}, ${param2}, ${param3}`);

            switch (action) {
                case 'createNewRicevuta':
                    return await handleCreateNewRicevuta(context, param1);
                
                case 'buildRicevuta':
                    return await handleBuildRicevuta(context, param1, param2, param3);
                
                case 'printNewRicevuta':
                    return await handlePrintNewRicevuta(context, request.body);
                
                case 'retrieveRicevutaForUser':
                    return await handleRetrieveRicevutaForUser(context, param1, param2);
                
                case 'updateIncassi':
                    return await handleUpdateIncassi(context, request.body);
                
                case 'annulRicevuta':
                    return await handleAnnulRicevuta(context, request.body);
                
                case 'prepareScheda':
                    return await handlePrepareScheda(context, param1);
                
                default:
                    return createErrorResponse(404, `Endpoint '${action}' non trovato`);
            }
        } catch (error) {
            context.log.error('Errore nella function ricevuta:', error);
            return createErrorResponse(500, 'Errore interno del server', error.message);
        }
    }
});

// Handler functions
async function handleCreateNewRicevuta(context, socioId) {
    try {
        if (!socioId) {
            return createErrorResponse(400, 'ID socio richiesto');
        }
        
        const pool = await getPool();
        const request = pool.request();
        request.input('socioId', sql.Int, parseInt(socioId));
        
        // Recupera dati socio e abbonamento corrente
        const query = `
            SELECT 
                s.id as socioId, s.nome, s.cognome, s.codiceFiscale,
                a.id as abbonamentoId, a.numeroTessera, a.importo, a.attivitaId,
                act.nome as attivitaNome
            FROM Soci s
            INNER JOIN Abbonamenti a ON s.id = a.socioId AND a.attivo = 1
            INNER JOIN Attivita act ON a.attivitaId = act.id
            WHERE s.id = @socioId AND s.attivo = 1
        `;
        
        const result = await request.query(query);
        
        if (result.recordset.length === 0) {
            return createErrorResponse(404, 'Socio o abbonamento non trovato');
        }
        
        const data = result.recordset[0];
        
        // Genera numero ricevuta
        const annoCorrente = new Date().getFullYear();
        const numeroRequest = pool.request();
        numeroRequest.input('anno', sql.Int, annoCorrente);
        
        const numeroQuery = `
            SELECT COUNT(*) as count FROM Ricevute 
            WHERE YEAR(data) = @anno AND annullata = 0
        `;
        
        const numeroResult = await numeroRequest.query(numeroQuery);
        const progressivo = numeroResult.recordset[0].count + 1;
        const numeroRicevuta = `${annoCorrente}/${progressivo.toString().padStart(4, '0')}`;
        
        context.log(`Preparata ricevuta ${numeroRicevuta} per socio ${socioId}`);
        
        return createSuccessResponse({
            socio: {
                id: data.socioId,
                nome: data.nome,
                cognome: data.cognome,
                codiceFiscale: data.codiceFiscale
            },
            abbonamento: {
                id: data.abbonamentoId,
                numeroTessera: data.numeroTessera,
                importo: data.importo,
                attivitaId: data.attivitaId,
                attivitaNome: data.attivitaNome
            },
            ricevuta: {
                numero: numeroRicevuta,
                data: new Date().toISOString(),
                importo: data.importo,
                causale: `Quota associativa ${data.attivitaNome}`
            }
        });
        
    } catch (error) {
        context.log.error('Errore nella creazione ricevuta:', error);
        return createErrorResponse(500, 'Errore nella creazione ricevuta', error.message);
    }
}

async function handleBuildRicevuta(context, socioId, abbonamentoId, ricevutaId) {
    try {
        if (!socioId || !abbonamentoId || !ricevutaId) {
            return createErrorResponse(400, 'ID socio, abbonamento e ricevuta richiesti');
        }
        
        const pool = await getPool();
        const request = pool.request();
        request.input('socioId', sql.Int, parseInt(socioId));
        request.input('abbonamentoId', sql.Int, parseInt(abbonamentoId));
        request.input('ricevutaId', sql.Int, parseInt(ricevutaId));
        
        const query = `
            SELECT 
                s.*, 
                a.numeroTessera, a.importo as importoAbbonamento, a.attivitaId,
                r.*, 
                act.nome as attivitaNome
            FROM Soci s
            INNER JOIN Abbonamenti a ON s.id = a.socioId
            INNER JOIN Ricevute r ON a.id = r.abbonamentoId
            INNER JOIN Attivita act ON a.attivitaId = act.id
            WHERE s.id = @socioId AND a.id = @abbonamentoId AND r.id = @ricevutaId
              AND s.attivo = 1 AND a.attivo = 1
        `;
        
        const result = await request.query(query);
        
        if (result.recordset.length === 0) {
            return createErrorResponse(404, 'Dati non trovati');
        }
        
        context.log(`Ricevuta costruita per socio ${socioId}`);
        return createSuccessResponse(result.recordset[0]);
        
    } catch (error) {
        context.log.error('Errore nella costruzione ricevuta:', error);
        return createErrorResponse(500, 'Errore nella costruzione ricevuta', error.message);
    }
}

async function handlePrintNewRicevuta(context, ricevutaData) {
    try {
        const { error, value } = validateRicevuta(ricevutaData);
        
        if (error) {
            context.log.warn('Dati ricevuta non validi:', error.details);
            return createErrorResponse(400, 'Dati ricevuta non validi', error.details);
        }
        
        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        
        try {
            const request = new sql.Request(transaction);
            
            // Verifica che il numero ricevuta non esista già
            request.input('numero', sql.NVarChar, value.numero);
            const checkResult = await request.query('SELECT id FROM Ricevute WHERE numero = @numero');
            
            if (checkResult.recordset.length > 0) {
                await transaction.rollback();
                return createErrorResponse(409, 'Numero ricevuta già esistente');
            }
            
            const insertQuery = `
                INSERT INTO Ricevute (
                    numero, socioId, abbonamentoId, data, importo, causale,
                    incassato, modalitaPagamento, note, annullata, dataCreazione
                ) OUTPUT INSERTED.id VALUES (
                    @numero, @socioId, @abbonamentoId, @data, @importo, @causale,
                    @incassato, @modalitaPagamento, @note, 0, GETDATE()
                )
            `;
            
            request.input('socioId', sql.Int, value.socioId);
            request.input('abbonamentoId', sql.Int, value.abbonamentoId);
            request.input('data', sql.Date, value.data || new Date());
            request.input('importo', sql.Decimal(10, 2), value.importo);
            request.input('causale', sql.NVarChar, value.causale);
            request.input('incassato', sql.Bit, value.incassato || false);
            request.input('modalitaPagamento', sql.NVarChar, value.modalitaPagamento || '');
            request.input('note', sql.NVarChar, value.note || '');
            
            const result = await request.query(insertQuery);
            const ricevutaId = result.recordset[0].id;
            
            await transaction.commit();
            
            context.log(`Ricevuta ${value.numero} creata con ID: ${ricevutaId}`);
            
            return createSuccessResponse({
                id: ricevutaId,
                returnCode: true,
                message: 'Ricevuta creata con successo'
            });
            
        } catch (dbError) {
            await transaction.rollback();
            throw dbError;
        }
        
    } catch (error) {
        context.log.error('Errore nella stampa ricevuta:', error);
        return createErrorResponse(500, 'Errore nella stampa ricevuta', error.message);
    }
}

async function handleRetrieveRicevutaForUser(context, socioId, numeroTessera) {
    try {
        if (!socioId) {
            return createErrorResponse(400, 'ID socio richiesto');
        }
        
        const pool = await getPool();
        const request = pool.request();
        request.input('socioId', sql.Int, parseInt(socioId));
        
        let query = `
            SELECT r.*, 
                   a.numeroTessera, 
                   act.nome as attivitaNome,
                   s.nome + ' ' + s.cognome as socioNome
            FROM Ricevute r
            INNER JOIN Abbonamenti a ON r.abbonamentoId = a.id
            INNER JOIN Attivita act ON a.attivitaId = act.id
            INNER JOIN Soci s ON r.socioId = s.id
            WHERE r.socioId = @socioId AND r.annullata = 0
        `;
        
        if (numeroTessera) {
            query += ` AND a.numeroTessera = @numeroTessera`;
            request.input('numeroTessera', sql.NVarChar, numeroTessera);
        }
        
        query += ` ORDER BY r.data DESC`;
        
        const result = await request.query(query);
        
        context.log(`${result.recordset.length} ricevute trovate per socio ${socioId}`);
        return createSuccessResponse({ items: result.recordset });
        
    } catch (error) {
        context.log.error('Errore nel recupero ricevute utente:', error);
        return createErrorResponse(500, 'Errore nel recupero ricevute utente', error.message);
    }
}

async function handleUpdateIncassi(context, incassoData) {
    try {
        if (!incassoData.ricevutaId) {
            return createErrorResponse(400, 'ID ricevuta richiesto');
        }
        
        const pool = await getPool();
        const request = pool.request();
        request.input('ricevutaId', sql.Int, incassoData.ricevutaId);
        request.input('incassato', sql.Bit, incassoData.incassato || false);
        request.input('dataIncasso', sql.DateTime, incassoData.dataIncasso || new Date());
        request.input('modalitaPagamento', sql.NVarChar, incassoData.modalitaPagamento || '');
        
        const updateQuery = `
            UPDATE Ricevute SET 
                incassato = @incassato,
                dataIncasso = @dataIncasso,
                modalitaPagamento = @modalitaPagamento,
                dataModifica = GETDATE()
            WHERE id = @ricevutaId
        `;
        
        const result = await request.query(updateQuery);
        
        if (result.rowsAffected[0] === 0) {
            return createErrorResponse(404, 'Ricevuta non trovata');
        }
        
        context.log(`Incasso aggiornato per ricevuta ${incassoData.ricevutaId}`);
        
        return createSuccessResponse({
            returnCode: true,
            message: 'Incasso aggiornato con successo'
        });
        
    } catch (error) {
        context.log.error('Errore nell\'aggiornamento incassi:', error);
        return createErrorResponse(500, 'Errore nell\'aggiornamento incassi', error.message);
    }
}

async function handleAnnulRicevuta(context, annullamentoData) {
    try {
        if (!annullamentoData.ricevutaId) {
            return createErrorResponse(400, 'ID ricevuta richiesto');
        }
        
        const pool = await getPool();
        const request = pool.request();
        request.input('ricevutaId', sql.Int, annullamentoData.ricevutaId);
        request.input('motivoAnnullamento', sql.NVarChar, annullamentoData.motivo || '');
        request.input('dataAnnullamento', sql.DateTime, new Date());
        
        const updateQuery = `
            UPDATE Ricevute SET 
                annullata = 1,
                dataAnnullamento = @dataAnnullamento,
                motivoAnnullamento = @motivoAnnullamento,
                dataModifica = GETDATE()
            WHERE id = @ricevutaId
        `;
        
        const result = await request.query(updateQuery);
        
        if (result.rowsAffected[0] === 0) {
            return createErrorResponse(404, 'Ricevuta non trovata');
        }
        
        context.log(`Ricevuta ${annullamentoData.ricevutaId} annullata`);
        
        return createSuccessResponse({
            returnCode: true,
            message: 'Ricevuta annullata con successo'
        });
        
    } catch (error) {
        context.log.error('Errore nell\'annullamento ricevuta:', error);
        return createErrorResponse(500, 'Errore nell\'annullamento ricevuta', error.message);
    }
}

async function handlePrepareScheda(context, socioId) {
    try {
        if (!socioId) {
            return createErrorResponse(400, 'ID socio richiesto');
        }
        
        const pool = await getPool();
        const request = pool.request();
        request.input('socioId', sql.Int, parseInt(socioId));
        
        const query = `
            SELECT 
                s.*, 
                a.numeroTessera, a.dataIscrizione, a.dataScadenza,
                act.nome as attivitaNome, 
                COUNT(r.id) as numeroRicevute,
                SUM(CASE WHEN r.incassato = 1 THEN r.importo ELSE 0 END) as totaleIncassato
            FROM Soci s
            LEFT JOIN Abbonamenti a ON s.id = a.socioId AND a.attivo = 1
            LEFT JOIN Attivita act ON a.attivitaId = act.id
            LEFT JOIN Ricevute r ON a.id = r.abbonamentoId AND r.annullata = 0
            WHERE s.id = @socioId AND s.attivo = 1
            GROUP BY s.id, s.nome, s.cognome, s.codiceFiscale, s.dataNascita, s.luogoNascita,
                     s.provinciaNascita, s.indirizzo, s.civico, s.cap, s.comune, s.provincia,
                     s.telefono, s.cellulare, s.email, s.tipoSocio, s.privacy, s.federazione,
                     s.numeroTesseraFederale, a.numeroTessera, a.dataIscrizione, a.dataScadenza,
                     act.nome
        `;
        
        const result = await request.query(query);
        
        if (result.recordset.length === 0) {
            return createErrorResponse(404, 'Socio non trovato');
        }
        
        context.log(`Scheda preparata per socio ${socioId}`);
        return createSuccessResponse(result.recordset[0]);
        
    } catch (error) {
        context.log.error('Errore nella preparazione scheda:', error);
        return createErrorResponse(500, 'Errore nella preparazione scheda', error.message);
    }
}