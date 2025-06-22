const { app } = require('@azure/functions');
const { getPool, sql } = require('../../shared/database/connection');
const { createSuccessResponse, createErrorResponse } = require('../../shared/utils/responseHelper');
const { validateSetting } = require('../../shared/models/Setting');

app.http('setting', {
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'setting/{action?}',
    handler: async (request, context) => {
        context.log(`Setting API chiamata: ${request.method} ${request.url}`);

        try {
            const action = request.params.action;

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

            context.log(`Action: ${action}`);

            switch (action) {
                case 'getSetting':
                    return await handleGetSetting(context);
                
                case 'updateSetting':
                    return await handleUpdateSetting(context, request.body);
                
                case 'resetSetting':
                    return await handleResetSetting(context);
                
                default:
                    return createErrorResponse(404, `Endpoint '${action}' non trovato`);
            }
        } catch (error) {
            context.log.error('Errore nella function setting:', error);
            return createErrorResponse(500, 'Errore interno del server', error.message);
        }
    }
});

// Handler functions
async function handleGetSetting(context) {
    try {
        context.log('Recupero impostazioni dell\'applicazione');
        
        const pool = await getPool();
        const request = pool.request();
        
        // Get main application settings
        const settingsResult = await request.query(`
            SELECT 
                id,
                nomeAssociazione,
                indirizzoAssociazione,
                cittaAssociazione,
                capAssociazione,
                provinciaAssociazione,
                telefonoAssociazione,
                emailAssociazione,
                websiteAssociazione,
                codiceFiscaleAssociazione,
                partitaIvaAssociazione,
                presidente,
                segretario,
                tesoriere,
                logoPath,
                intestazioneBollettini,
                causaleDefault,
                importoDefaultTessera,
                scadenzaDefaultTessera,
                numeroRicevutaCounter,
                formatoNumeroRicevuta,
                abilitaStampaAutomatica,
                templateRicevuta,
                templateScheda,
                emailSmtpServer,
                emailSmtpPort,
                emailSmtpUsername,
                emailSmtpPassword,
                emailSmtpUseSSL,
                emailFromAddress,
                emailFromName,
                createdDate,
                updatedDate
            FROM ApplicationSettings 
            WHERE active = 1
        `);
        
        if (settingsResult.recordset.length === 0) {
            // Return default settings if none exist
            context.log('Nessuna impostazione trovata, restituendo valori di default');
            return createSuccessResponse({
                id: 0,
                nomeAssociazione: 'Club Sportivo',
                indirizzoAssociazione: '',
                cittaAssociazione: '',
                capAssociazione: '',
                provinciaAssociazione: '',
                telefonoAssociazione: '',
                emailAssociazione: '',
                websiteAssociazione: '',
                codiceFiscaleAssociazione: '',
                partitaIvaAssociazione: '',
                presidente: '',
                segretario: '',
                tesoriere: '',
                logoPath: '',
                intestazioneBollettini: 'Bollettino di Pagamento',
                causaleDefault: 'Quota associativa',
                importoDefaultTessera: 50.00,
                scadenzaDefaultTessera: 12, // months
                numeroRicevutaCounter: 1,
                formatoNumeroRicevuta: 'R-{YEAR}-{NUMBER}',
                abilitaStampaAutomatica: false,
                templateRicevuta: 'default',
                templateScheda: 'default',
                emailSmtpServer: '',
                emailSmtpPort: 587,
                emailSmtpUsername: '',
                emailSmtpPassword: '',
                emailSmtpUseSSL: true,
                emailFromAddress: '',
                emailFromName: '',
                isDefault: true
            });
        }
        
        const settings = settingsResult.recordset[0];
        
        // Add computed fields
        settings.isDefault = false;
        settings.hasLogo = !!settings.logoPath;
        settings.emailConfigured = !!(settings.emailSmtpServer && settings.emailFromAddress);
        
        
        context.log('Impostazioni recuperate con successo');
        return createSuccessResponse(settings);
        
    } catch (error) {
        context.log.error('Errore nel recupero impostazioni:', error);
        return createErrorResponse(500, 'Errore nel recupero impostazioni', error.message);
    }
}

async function handleUpdateSetting(context, settingData) {
    try {
        context.log('Aggiornamento impostazioni:', JSON.stringify(settingData, null, 2));
        
        // Validate input data
        const { error, value } = validateSetting(settingData);
        if (error) {
            context.log.warn('Dati impostazioni non validi:', error.details);
            return createErrorResponse(400, 'Dati non validi', error.details);
        }
        
        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        
        try {
            const request = new sql.Request(transaction);
            
            // Check if settings record exists
            const checkResult = await request.query(`
                SELECT COUNT(*) as count FROM ApplicationSettings WHERE active = 1
            `);
            
            const settingsExist = checkResult.recordset[0].count > 0;
            
            if (settingsExist) {
                // Update existing settings
                request.input('nomeAssociazione', sql.NVarChar(255), value.nomeAssociazione || '');
                request.input('indirizzoAssociazione', sql.NVarChar(255), value.indirizzoAssociazione || '');
                request.input('cittaAssociazione', sql.NVarChar(100), value.cittaAssociazione || '');
                request.input('capAssociazione', sql.NVarChar(10), value.capAssociazione || '');
                request.input('provinciaAssociazione', sql.NVarChar(5), value.provinciaAssociazione || '');
                request.input('telefonoAssociazione', sql.NVarChar(50), value.telefonoAssociazione || '');
                request.input('emailAssociazione', sql.NVarChar(255), value.emailAssociazione || '');
                request.input('websiteAssociazione', sql.NVarChar(255), value.websiteAssociazione || '');
                request.input('codiceFiscaleAssociazione', sql.NVarChar(16), value.codiceFiscaleAssociazione || '');
                request.input('partitaIvaAssociazione', sql.NVarChar(11), value.partitaIvaAssociazione || '');
                request.input('presidente', sql.NVarChar(255), value.presidente || '');
                request.input('segretario', sql.NVarChar(255), value.segretario || '');
                request.input('tesoriere', sql.NVarChar(255), value.tesoriere || '');
                request.input('logoPath', sql.NVarChar(500), value.logoPath || '');
                request.input('intestazioneBollettini', sql.NVarChar(255), value.intestazioneBollettini || '');
                request.input('causaleDefault', sql.NVarChar(255), value.causaleDefault || '');
                request.input('importoDefaultTessera', sql.Decimal(10, 2), value.importoDefaultTessera || 0);
                request.input('scadenzaDefaultTessera', sql.Int, value.scadenzaDefaultTessera || 12);
                request.input('numeroRicevutaCounter', sql.Int, value.numeroRicevutaCounter || 1);
                request.input('formatoNumeroRicevuta', sql.NVarChar(100), value.formatoNumeroRicevuta || 'R-{YEAR}-{NUMBER}');
                request.input('abilitaStampaAutomatica', sql.Bit, value.abilitaStampaAutomatica || false);
                request.input('templateRicevuta', sql.NVarChar(100), value.templateRicevuta || 'default');
                request.input('templateScheda', sql.NVarChar(100), value.templateScheda || 'default');
                request.input('emailSmtpServer', sql.NVarChar(255), value.emailSmtpServer || '');
                request.input('emailSmtpPort', sql.Int, value.emailSmtpPort || 587);
                request.input('emailSmtpUsername', sql.NVarChar(255), value.emailSmtpUsername || '');
                request.input('emailSmtpPassword', sql.NVarChar(255), value.emailSmtpPassword || '');
                request.input('emailSmtpUseSSL', sql.Bit, value.emailSmtpUseSSL || true);
                request.input('emailFromAddress', sql.NVarChar(255), value.emailFromAddress || '');
                request.input('emailFromName', sql.NVarChar(255), value.emailFromName || '');
                request.input('updatedDate', sql.DateTime, new Date());
                
                await request.query(`
                    UPDATE ApplicationSettings 
                    SET 
                        nomeAssociazione = @nomeAssociazione,
                        indirizzoAssociazione = @indirizzoAssociazione,
                        cittaAssociazione = @cittaAssociazione,
                        capAssociazione = @capAssociazione,
                        provinciaAssociazione = @provinciaAssociazione,
                        telefonoAssociazione = @telefonoAssociazione,
                        emailAssociazione = @emailAssociazione,
                        websiteAssociazione = @websiteAssociazione,
                        codiceFiscaleAssociazione = @codiceFiscaleAssociazione,
                        partitaIvaAssociazione = @partitaIvaAssociazione,
                        presidente = @presidente,
                        segretario = @segretario,
                        tesoriere = @tesoriere,
                        logoPath = @logoPath,
                        intestazioneBollettini = @intestazioneBollettini,
                        causaleDefault = @causaleDefault,
                        importoDefaultTessera = @importoDefaultTessera,
                        scadenzaDefaultTessera = @scadenzaDefaultTessera,
                        numeroRicevutaCounter = @numeroRicevutaCounter,
                        formatoNumeroRicevuta = @formatoNumeroRicevuta,
                        abilitaStampaAutomatica = @abilitaStampaAutomatica,
                        templateRicevuta = @templateRicevuta,
                        templateScheda = @templateScheda,
                        emailSmtpServer = @emailSmtpServer,
                        emailSmtpPort = @emailSmtpPort,
                        emailSmtpUsername = @emailSmtpUsername,
                        emailSmtpPassword = @emailSmtpPassword,
                        emailSmtpUseSSL = @emailSmtpUseSSL,
                        emailFromAddress = @emailFromAddress,
                        emailFromName = @emailFromName,
                        updatedDate = @updatedDate
                    WHERE active = 1
                `);
                
                context.log('Impostazioni aggiornate');
                
            } else {
                // Create new settings record
                request.input('nomeAssociazione', sql.NVarChar(255), value.nomeAssociazione || '');
                request.input('indirizzoAssociazione', sql.NVarChar(255), value.indirizzoAssociazione || '');
                request.input('cittaAssociazione', sql.NVarChar(100), value.cittaAssociazione || '');
                request.input('capAssociazione', sql.NVarChar(10), value.capAssociazione || '');
                request.input('provinciaAssociazione', sql.NVarChar(5), value.provinciaAssociazione || '');
                request.input('telefonoAssociazione', sql.NVarChar(50), value.telefonoAssociazione || '');
                request.input('emailAssociazione', sql.NVarChar(255), value.emailAssociazione || '');
                request.input('websiteAssociazione', sql.NVarChar(255), value.websiteAssociazione || '');
                request.input('codiceFiscaleAssociazione', sql.NVarChar(16), value.codiceFiscaleAssociazione || '');
                request.input('partitaIvaAssociazione', sql.NVarChar(11), value.partitaIvaAssociazione || '');
                request.input('presidente', sql.NVarChar(255), value.presidente || '');
                request.input('segretario', sql.NVarChar(255), value.segretario || '');
                request.input('tesoriere', sql.NVarChar(255), value.tesoriere || '');
                request.input('logoPath', sql.NVarChar(500), value.logoPath || '');
                request.input('intestazioneBollettini', sql.NVarChar(255), value.intestazioneBollettini || '');
                request.input('causaleDefault', sql.NVarChar(255), value.causaleDefault || '');
                request.input('importoDefaultTessera', sql.Decimal(10, 2), value.importoDefaultTessera || 0);
                request.input('scadenzaDefaultTessera', sql.Int, value.scadenzaDefaultTessera || 12);
                request.input('numeroRicevutaCounter', sql.Int, value.numeroRicevutaCounter || 1);
                request.input('formatoNumeroRicevuta', sql.NVarChar(100), value.formatoNumeroRicevuta || 'R-{YEAR}-{NUMBER}');
                request.input('abilitaStampaAutomatica', sql.Bit, value.abilitaStampaAutomatica || false);
                request.input('templateRicevuta', sql.NVarChar(100), value.templateRicevuta || 'default');
                request.input('templateScheda', sql.NVarChar(100), value.templateScheda || 'default');
                request.input('emailSmtpServer', sql.NVarChar(255), value.emailSmtpServer || '');
                request.input('emailSmtpPort', sql.Int, value.emailSmtpPort || 587);
                request.input('emailSmtpUsername', sql.NVarChar(255), value.emailSmtpUsername || '');
                request.input('emailSmtpPassword', sql.NVarChar(255), value.emailSmtpPassword || '');
                request.input('emailSmtpUseSSL', sql.Bit, value.emailSmtpUseSSL || true);
                request.input('emailFromAddress', sql.NVarChar(255), value.emailFromAddress || '');
                request.input('emailFromName', sql.NVarChar(255), value.emailFromName || '');
                request.input('active', sql.Bit, true);
                request.input('createdDate', sql.DateTime, new Date());
                
                const result = await request.query(`
                    INSERT INTO ApplicationSettings 
                    (nomeAssociazione, indirizzoAssociazione, cittaAssociazione, capAssociazione, 
                     provinciaAssociazione, telefonoAssociazione, emailAssociazione, websiteAssociazione,
                     codiceFiscaleAssociazione, partitaIvaAssociazione, presidente, segretario, tesoriere,
                     logoPath, intestazioneBollettini, causaleDefault, importoDefaultTessera, 
                     scadenzaDefaultTessera, numeroRicevutaCounter, formatoNumeroRicevuta,
                     abilitaStampaAutomatica, templateRicevuta, templateScheda,
                     emailSmtpServer, emailSmtpPort, emailSmtpUsername, emailSmtpPassword,
                     emailSmtpUseSSL, emailFromAddress, emailFromName, active, createdDate)
                    VALUES 
                    (@nomeAssociazione, @indirizzoAssociazione, @cittaAssociazione, @capAssociazione, 
                     @provinciaAssociazione, @telefonoAssociazione, @emailAssociazione, @websiteAssociazione,
                     @codiceFiscaleAssociazione, @partitaIvaAssociazione, @presidente, @segretario, @tesoriere,
                     @logoPath, @intestazioneBollettini, @causaleDefault, @importoDefaultTessera, 
                     @scadenzaDefaultTessera, @numeroRicevutaCounter, @formatoNumeroRicevuta,
                     @abilitaStampaAutomatica, @templateRicevuta, @templateScheda,
                     @emailSmtpServer, @emailSmtpPort, @emailSmtpUsername, @emailSmtpPassword,
                     @emailSmtpUseSSL, @emailFromAddress, @emailFromName, @active, @createdDate);
                     
                    SELECT SCOPE_IDENTITY() as newId;
                `);
                
                const newId = result.recordset[0].newId;
                context.log(`Nuove impostazioni create con ID: ${newId}`);
            }
            
            await transaction.commit();
            return createSuccessResponse({ 
                rc: true, 
                message: 'Impostazioni salvate con successo' 
            });
            
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
        
    } catch (error) {
        context.log.error('Errore nell\'aggiornamento impostazioni:', error);
        return createErrorResponse(500, 'Errore nell\'aggiornamento impostazioni', error.message);
    }
}

async function handleResetSetting(context) {
    try {
        context.log('Reset impostazioni ai valori di default');
        
        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        
        try {
            const request = new sql.Request(transaction);
            
            // Backup current settings before reset
            await request.query(`
                UPDATE ApplicationSettings 
                SET active = 0, updatedDate = GETDATE()
                WHERE active = 1
            `);
            
            // Create new default settings
            request.input('nomeAssociazione', sql.NVarChar(255), 'Club Sportivo');
            request.input('intestazioneBollettini', sql.NVarChar(255), 'Bollettino di Pagamento');
            request.input('causaleDefault', sql.NVarChar(255), 'Quota associativa');
            request.input('importoDefaultTessera', sql.Decimal(10, 2), 50.00);
            request.input('scadenzaDefaultTessera', sql.Int, 12);
            request.input('numeroRicevutaCounter', sql.Int, 1);
            request.input('formatoNumeroRicevuta', sql.NVarChar(100), 'R-{YEAR}-{NUMBER}');
            request.input('abilitaStampaAutomatica', sql.Bit, false);
            request.input('templateRicevuta', sql.NVarChar(100), 'default');
            request.input('templateScheda', sql.NVarChar(100), 'default');
            request.input('emailSmtpPort', sql.Int, 587);
            request.input('emailSmtpUseSSL', sql.Bit, true);
            request.input('active', sql.Bit, true);
            request.input('createdDate', sql.DateTime, new Date());
            
            const result = await request.query(`
                INSERT INTO ApplicationSettings 
                (nomeAssociazione, intestazioneBollettini, causaleDefault, importoDefaultTessera, 
                 scadenzaDefaultTessera, numeroRicevutaCounter, formatoNumeroRicevuta,
                 abilitaStampaAutomatica, templateRicevuta, templateScheda,
                 emailSmtpPort, emailSmtpUseSSL, active, createdDate)
                VALUES 
                (@nomeAssociazione, @intestazioneBollettini, @causaleDefault, @importoDefaultTessera, 
                 @scadenzaDefaultTessera, @numeroRicevutaCounter, @formatoNumeroRicevuta,
                 @abilitaStampaAutomatica, @templateRicevuta, @templateScheda,
                 @emailSmtpPort, @emailSmtpUseSSL, @active, @createdDate);
                 
                SELECT SCOPE_IDENTITY() as newId;
            `);
            
            await transaction.commit();
            
            const newId = result.recordset[0].newId;
            context.log(`Impostazioni ripristinate ai valori di default con ID: ${newId}`);
            
            return createSuccessResponse({ 
                rc: true, 
                message: 'Impostazioni ripristinate ai valori di default',
                id: newId
            });
            
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
        
    } catch (error) {
        context.log.error('Errore nel reset impostazioni:', error);
        return createErrorResponse(500, 'Errore nel reset impostazioni', error.message);
    }
}