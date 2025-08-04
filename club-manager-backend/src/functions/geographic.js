const { app } = require('@azure/functions');
const { createSuccessResponse, createErrorResponse } = require('../../shared/utils/responseHelper');
const geographicService = require('../../shared/services/geographicService');

app.http('geographic', {
    methods: ['GET', 'POST', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'geographic/{action?}/{param1?}',
    handler: async (request, context) => {
        context.log(`Geographic API chiamata: ${request.method} ${request.url}`);

        try {
            const action = request.params.action;
            const param1 = request.params.param1;

            // Handle CORS preflight
            if (request.method === 'OPTIONS') {
                context.log('CORS preflight request');
                return {
                    status: 200,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                    }
                };
            }

            context.log(`Action: ${action}, Param1: ${param1}`);

            switch (action) {
                case 'retrieveProvince':
                    return await handleRetrieveProvince(context);
                
                case 'retrieveCommune':
                    return await handleRetrieveCommune(context, param1);
                
                case 'retrieveCommuneByName':
                    return await handleRetrieveCommuneByName(context, param1);
                
                case 'rebuildCommunes':
                    return await handleRebuildCommunes(context);
                
                case 'rebuildStates':
                    return await handleRebuildStates(context);
                
                case 'testApi':
                    return await handleTestApi(context);
                
                case 'getCacheStats':
                    return await handleGetCacheStats(context);
                
                default:
                    context.log(`Endpoint non trovato: ${action}`);
                    return createErrorResponse(404, `Endpoint '${action}' non trovato`);
            }
        } catch (error) {
            context.log('Errore nella function geographic:', error);
            return createErrorResponse(500, 'Errore interno del server', error.message);
        }
    }
});

// Handler functions
async function handleRetrieveProvince(context) {
    try {
        context.log('Recupero province da API Samurai016...');
        const province = await geographicService.getProvince();
        context.log(`${province.length} province recuperate`);
        return createSuccessResponse(province);
    } catch (error) {
        context.log('Errore nel recupero province:', error);
        return createErrorResponse(500, 'Errore nel recupero province', error.message);
    }
}

async function handleRetrieveCommune(context, codiceProvincia) {
    try {
        if (!codiceProvincia) {
            return createErrorResponse(400, 'Codice provincia richiesto');
        }

        context.log(`Recupero comuni per provincia: ${codiceProvincia}`);
        const comuni = await geographicService.getComuniByProvincia(codiceProvincia);
        context.log(`${comuni.length} comuni recuperati per ${codiceProvincia}`);
        return createSuccessResponse(comuni);
    } catch (error) {
        context.log('Errore nel recupero comuni:', error);
        return createErrorResponse(500, 'Errore nel recupero comuni', error.message);
    }
}

async function handleRetrieveCommuneByName(context, nomeParziale) {
    try {
        if (!nomeParziale) {
            return createErrorResponse(400, 'Nome comune richiesto per la ricerca');
        }

        if (nomeParziale.length < 2) {
            return createErrorResponse(400, 'Inserire almeno 2 caratteri per la ricerca');
        }

        context.log(`Ricerca comuni per nome: ${nomeParziale}`);
        const comuni = await geographicService.searchComuniByName(nomeParziale);
        context.log(`${comuni.length} comuni trovati per "${nomeParziale}"`);
        return createSuccessResponse(comuni);
    } catch (error) {
        context.log('Errore nella ricerca comuni:', error);
        return createErrorResponse(500, 'Errore nella ricerca comuni', error.message);
    }
}

async function handleRebuildCommunes(context) {
    try {
        context.log('Ricostruzione cache comuni...');
        geographicService.clearCache();
        
        // Forza il reload di province e alcuni comuni
        await geographicService.getProvince();
        
        context.log('Cache comuni ricostruita con successo');
        return createSuccessResponse({
            returnCode: true,
            message: 'Cache comuni ricostruita con successo'
        });
    } catch (error) {
        context.log('Errore nella ricostruzione comuni:', error);
        return createErrorResponse(500, 'Errore nella ricostruzione comuni', error.message);
    }
}

async function handleRebuildStates(context) {
    try {
        context.log('Ricostruzione cache province...');
        geographicService.clearCache();
        
        // Forza il reload delle province
        await geographicService.getProvince();
        
        context.log('Cache province ricostruita con successo');
        return createSuccessResponse({
            returnCode: true,
            message: 'Cache province ricostruita con successo'
        });
    } catch (error) {
        context.log('Errore nella ricostruzione province:', error);
        return createErrorResponse(500, 'Errore nella ricostruzione province', error.message);
    }
}

async function handleTestApi(context) {
    try {
        context.log('Test connessione API Samurai016...');
        const testResult = await geographicService.testApiConnection();
        context.log('Test API completato:', testResult);
        return createSuccessResponse(testResult);
    } catch (error) {
        context.log('Errore nel test API:', error);
        return createErrorResponse(500, 'Errore nel test API', error.message);
    }
}

async function handleGetCacheStats(context) {
    try {
        context.log('Recupero statistiche cache...');
        const stats = geographicService.getCacheStats();
        return createSuccessResponse(stats);
    } catch (error) {
        context.log('Errore nel recupero statistiche:', error);
        return createErrorResponse(500, 'Errore nel recupero statistiche', error.message);
    }
}