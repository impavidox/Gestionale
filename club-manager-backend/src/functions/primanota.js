const { app } = require('@azure/functions');
const { getPool, sql } = require('../../shared/database/connection');
const { createSuccessResponse, createErrorResponse } = require('../../shared/utils/responseHelper');
const moment = require('moment');

app.http('primanota', {
    methods: ['GET', 'POST', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'primanota/{action?}/{param1?}/{param2?}/{param3?}',
    handler: async (request, context) => {
        context.log(`Prima Nota API chiamata: ${request.method} ${request.url}`);

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
                        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                    }
                };
            }

            context.log(`Action: ${action}, Params: ${param1}, ${param2}, ${param3}`);

            switch (action) {
                case 'buildPrimaNota':
                    return await handleBuildPrimaNota(context, param1, param2, param3);
                
                case 'printPrimaNota':
                    return await handlePrintPrimaNota(context, param1, param2, param3);
                
                case 'statistic':
                    return await handleStatistic(context, param1);
                
                default:
                    return createErrorResponse(404, `Endpoint '${action}' non trovato`);
            }
        } catch (error) {
            context.log.error('Errore nella function primanota:', error);
            return createErrorResponse(500, 'Errore interno del server', error.message);
        }
    }
});

// Handler functions
async function handleBuildPrimaNota(context, type, startDate, endDate) {
    try {
        const primaNotaType = parseInt(type) || 0;
        context.log(`Costruzione prima nota tipo: ${primaNotaType}`);
        
        const pool = await getPool();
        const request = pool.request();
        
        // Build date filters
        let dateFilter = '';
        if (startDate && endDate) {
            const start = moment(startDate, 'DD-MM-YYYY').format('YYYY-MM-DD');
            const end = moment(endDate, 'DD-MM-YYYY').format('YYYY-MM-DD');
            
            request.input('startDate', sql.Date, start);
            request.input('endDate', sql.Date, end);
            dateFilter = 'AND r.dataRicevuta BETWEEN @startDate AND @endDate';
            
            context.log(`Periodo: dal ${startDate} al ${endDate}`);
        }
        
        let query = '';
        
        switch (primaNotaType) {
            case 0:
                // Standard prima nota - all entries
                query = `
                    SELECT 
                        r.id,
                        r.numeroRicevuta,
                        r.dataRicevuta,
                        r.importo,
                        r.causale,
                        r.tipoPagamento,
                        s.nome,
                        s.cognome,
                        s.codiceFiscale,
                        act.description as attivita,
                        'ENTRATA' as tipo
                    FROM Ricevute r
                    INNER JOIN Soci s ON r.socioId = s.id
                    INNER JOIN Abbonamenti a ON r.abbonamentoId = a.id
                    INNER JOIN Activities act ON a.attivitaId = act.id
                    WHERE r.active = 1 ${dateFilter}
                    
                    UNION ALL
                    
                    SELECT 
                        sp.id,
                        sp.numeroDocumento as numeroRicevuta,
                        sp.dataSpesa as dataRicevuta,
                        sp.importo * -1 as importo,
                        sp.descrizione as causale,
                        sp.tipoPagamento,
                        '' as nome,
                        sp.fornitore as cognome,
                        '' as codiceFiscale,
                        sp.categoria as attivita,
                        'USCITA' as tipo
                    FROM Spese sp
                    WHERE sp.active = 1 ${dateFilter.replace('r.dataRicevuta', 'sp.dataSpesa')}
                    
                    ORDER BY dataRicevuta, numeroRicevuta
                `;
                break;
                
            case 1:
                // Solo entrate (ricevute)
                query = `
                    SELECT 
                        r.id,
                        r.numeroRicevuta,
                        r.dataRicevuta,
                        r.importo,
                        r.causale,
                        r.tipoPagamento,
                        s.nome,
                        s.cognome,
                        s.codiceFiscale,
                        act.description as attivita,
                        'ENTRATA' as tipo
                    FROM Ricevute r
                    INNER JOIN Soci s ON r.socioId = s.id
                    INNER JOIN Abbonamenti a ON r.abbonamentoId = a.id
                    INNER JOIN Activities act ON a.attivitaId = act.id
                    WHERE r.active = 1 ${dateFilter}
                    ORDER BY r.dataRicevuta, r.numeroRicevuta
                `;
                break;
                
            case 2:
                // Solo uscite (spese)
                query = `
                    SELECT 
                        sp.id,
                        sp.numeroDocumento as numeroRicevuta,
                        sp.dataSpesa as dataRicevuta,
                        sp.importo * -1 as importo,
                        sp.descrizione as causale,
                        sp.tipoPagamento,
                        '' as nome,
                        sp.fornitore as cognome,
                        '' as codiceFiscale,
                        sp.categoria as attivita,
                        'USCITA' as tipo
                    FROM Spese sp
                    WHERE sp.active = 1 ${dateFilter.replace('r.dataRicevuta', 'sp.dataSpesa')}
                    ORDER BY sp.dataSpesa, sp.numeroDocumento
                `;
                break;
                
            default:
                return createErrorResponse(400, 'Tipo prima nota non valido');
        }
        
        const result = await request.query(query);
        
        // Calculate totals
        let totaleEntrate = 0;
        let totaleUscite = 0;
        
        result.recordset.forEach(record => {
            if (record.tipo === 'ENTRATA') {
                totaleEntrate += record.importo || 0;
            } else {
                totaleUscite += Math.abs(record.importo || 0);
            }
        });
        
        const saldo = totaleEntrate - totaleUscite;
        
        context.log(`Prima nota costruita: ${result.recordset.length} movimenti`);
        context.log(`Totale entrate: €${totaleEntrate.toFixed(2)}, Totale uscite: €${totaleUscite.toFixed(2)}, Saldo: €${saldo.toFixed(2)}`);
        
        return createSuccessResponse({
            movimenti: result.recordset,
            riepilogo: {
                totaleEntrate: totaleEntrate,
                totaleUscite: totaleUscite,
                saldo: saldo,
                numeroMovimenti: result.recordset.length,
                periodo: {
                    inizio: startDate,
                    fine: endDate
                },
                tipo: primaNotaType
            }
        });
        
    } catch (error) {
        context.log.error('Errore nella costruzione prima nota:', error);
        return createErrorResponse(500, 'Errore nella costruzione prima nota', error.message);
    }
}

async function handlePrintPrimaNota(context, type, startDate, endDate) {
    try {
        context.log(`Stampa prima nota tipo: ${type}, periodo: ${startDate} - ${endDate}`);
        
        // Get the data using buildPrimaNota
        const primaNotaData = await handleBuildPrimaNota(context, type, startDate, endDate);
        
        if (primaNotaData.status !== 200) {
            return primaNotaData;
        }
        
        const data = primaNotaData.body;
        
        // Add print-specific formatting
        const printData = {
            ...data,
            intestazione: {
                titolo: 'PRIMA NOTA',
                sottotitolo: getTypeDescription(parseInt(type)),
                periodo: startDate && endDate ? `Dal ${startDate} al ${endDate}` : 'Tutti i movimenti',
                dataStampa: moment().format('DD/MM/YYYY HH:mm')
            },
            movimentiFormattati: data.movimenti.map(movimento => ({
                ...movimento,
                dataRicevuta: moment(movimento.dataRicevuta).format('DD/MM/YYYY'),
                importoFormattato: `€ ${Math.abs(movimento.importo).toFixed(2)}`,
                segno: movimento.tipo === 'ENTRATA' ? '+' : '-'
            }))
        };
        
        context.log('Dati formattati per stampa prima nota');
        return createSuccessResponse(printData);
        
    } catch (error) {
        context.log.error('Errore nella stampa prima nota:', error);
        return createErrorResponse(500, 'Errore nella stampa prima nota', error.message);
    }
}

async function handleStatistic(context, type) {
    try {
        const statisticType = parseInt(type) || 0;
        context.log(`Statistiche prima nota tipo: ${statisticType}`);
        
        const pool = await getPool();
        const request = pool.request();
        
        let result = {};
        
        switch (statisticType) {
            case 0:
                // Statistiche generali
                const generalStats = await request.query(`
                    -- Totali entrate per mese corrente
                    SELECT 
                        COALESCE(SUM(r.importo), 0) as entrateDelMese
                    FROM Ricevute r
                    WHERE r.active = 1 
                    AND MONTH(r.dataRicevuta) = MONTH(GETDATE())
                    AND YEAR(r.dataRicevuta) = YEAR(GETDATE());
                    
                    -- Totali uscite per mese corrente
                    SELECT 
                        COALESCE(SUM(sp.importo), 0) as usciteDelMese
                    FROM Spese sp
                    WHERE sp.active = 1 
                    AND MONTH(sp.dataSpesa) = MONTH(GETDATE())
                    AND YEAR(sp.dataSpesa) = YEAR(GETDATE());
                    
                    -- Totali anno corrente
                    SELECT 
                        COALESCE(SUM(r.importo), 0) as entrateTotali,
                        COUNT(*) as numeroRicevute
                    FROM Ricevute r
                    WHERE r.active = 1 
                    AND YEAR(r.dataRicevuta) = YEAR(GETDATE());
                    
                    SELECT 
                        COALESCE(SUM(sp.importo), 0) as usciteTotali,
                        COUNT(*) as numeroSpese
                    FROM Spese sp
                    WHERE sp.active = 1 
                    AND YEAR(sp.dataSpesa) = YEAR(GETDATE());
                `);
                
                result = {
                    meseCorrente: {
                        entrate: generalStats.recordsets[0][0].entrateDelMese,
                        uscite: generalStats.recordsets[1][0].usciteDelMese
                    },
                    annoCorrente: {
                        entrate: generalStats.recordsets[2][0].entrateTotali,
                        uscite: generalStats.recordsets[3][0].usciteTotali,
                        numeroRicevute: generalStats.recordsets[2][0].numeroRicevute,
                        numeroSpese: generalStats.recordsets[3][0].numeroSpese
                    }
                };
                break;
                
            case 1:
                // Statistiche per attività
                const activityStats = await request.query(`
                    SELECT 
                        act.description as attivita,
                        COUNT(r.id) as numeroRicevute,
                        COALESCE(SUM(r.importo), 0) as totaleEntrate
                    FROM Activities act
                    LEFT JOIN Abbonamenti a ON act.id = a.attivitaId
                    LEFT JOIN Ricevute r ON a.id = r.abbonamentoId AND r.active = 1
                    WHERE act.active = 1
                    GROUP BY act.id, act.description
                    ORDER BY totaleEntrate DESC
                `);
                
                result = {
                    perAttivita: activityStats.recordset
                };
                break;
                
            case 2:
                // Trend mensile
                const monthlyTrend = await request.query(`
                    SELECT 
                        YEAR(r.dataRicevuta) as anno,
                        MONTH(r.dataRicevuta) as mese,
                        DATENAME(MONTH, r.dataRicevuta) as nomeMese,
                        COUNT(r.id) as numeroRicevute,
                        COALESCE(SUM(r.importo), 0) as totaleEntrate
                    FROM Ricevute r
                    WHERE r.active = 1 
                    AND r.dataRicevuta >= DATEADD(MONTH, -12, GETDATE())
                    GROUP BY YEAR(r.dataRicevuta), MONTH(r.dataRicevuta), DATENAME(MONTH, r.dataRicevuta)
                    ORDER BY anno, mese
                `);
                
                result = {
                    trendMensile: monthlyTrend.recordset
                };
                break;
                
            default:
                return createErrorResponse(400, 'Tipo statistica non valido');
        }
        
        context.log(`Statistiche calcolate per tipo ${statisticType}`);
        return createSuccessResponse(result);
        
    } catch (error) {
        context.log.error('Errore nel calcolo statistiche:', error);
        return createErrorResponse(500, 'Errore nel calcolo statistiche', error.message);
    }
}

// Helper function
function getTypeDescription(type) {
    switch (type) {
        case 0: return 'Movimenti completi (Entrate e Uscite)';
        case 1: return 'Solo Entrate';
        case 2: return 'Solo Uscite';
        default: return 'Tipo sconosciuto';
    }
}