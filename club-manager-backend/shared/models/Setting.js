const Joi = require('joi');

/**
 * Schema di validazione per ApplicationSettings
 */
const settingSchema = Joi.object({
    id: Joi.number().integer().min(0).optional(),
    
    // Dati associazione
    nomeAssociazione: Joi.string().trim().max(255).allow('').optional(),
    indirizzoAssociazione: Joi.string().trim().max(255).allow('').optional(),
    cittaAssociazione: Joi.string().trim().max(100).allow('').optional(),
    capAssociazione: Joi.string().trim().max(10).allow('').optional()
        .pattern(/^[0-9]{5}$/)
        .messages({
            'string.pattern.base': 'Il CAP deve essere di 5 cifre'
        }),
    provinciaAssociazione: Joi.string().trim().max(5).allow('').optional()
        .uppercase(),
    telefonoAssociazione: Joi.string().trim().max(50).allow('').optional()
        .pattern(/^[\d\s\-\+\(\)]+$/)
        .messages({
            'string.pattern.base': 'Il telefono contiene caratteri non validi'
        }),
    emailAssociazione: Joi.string().trim().email().max(255).allow('').optional()
        .messages({
            'string.email': 'L\'email dell\'associazione non è valida'
        }),
    websiteAssociazione: Joi.string().trim().uri().max(255).allow('').optional()
        .messages({
            'string.uri': 'Il sito web deve essere un URL valido'
        }),
    codiceFiscaleAssociazione: Joi.string().trim().max(16).allow('').optional()
        .pattern(/^[A-Z0-9]{11,16}$/)
        .uppercase()
        .messages({
            'string.pattern.base': 'Il codice fiscale non è nel formato corretto'
        }),
    partitaIvaAssociazione: Joi.string().trim().max(11).allow('').optional()
        .pattern(/^[0-9]{11}$/)
        .messages({
            'string.pattern.base': 'La partita IVA deve essere di 11 cifre'
        }),
    
    // Dirigenti
    presidente: Joi.string().trim().max(255).allow('').optional(),
    segretario: Joi.string().trim().max(255).allow('').optional(),
    tesoriere: Joi.string().trim().max(255).allow('').optional(),
    
    // Configurazione visuale
    logoPath: Joi.string().trim().max(500).allow('').optional(),
    
    // Configurazione bollettini e ricevute
    intestazioneBollettini: Joi.string().trim().max(255).allow('').optional(),
    causaleDefault: Joi.string().trim().max(255).allow('').optional(),
    importoDefaultTessera: Joi.number().precision(2).min(0).max(999999.99).optional()
        .messages({
            'number.min': 'L\'importo non può essere negativo',
            'number.max': 'L\'importo è troppo elevato'
        }),
    scadenzaDefaultTessera: Joi.number().integer().min(1).max(60).optional()
        .messages({
            'number.min': 'La scadenza deve essere almeno 1 mese',
            'number.max': 'La scadenza non può superare i 60 mesi'
        }),
    
    // Numerazione ricevute
    numeroRicevutaCounter: Joi.number().integer().min(1).max(999999).optional()
        .messages({
            'number.min': 'Il contatore ricevute deve essere almeno 1'
        }),
    formatoNumeroRicevuta: Joi.string().trim().max(100).allow('').optional()
        .pattern(/.*\{NUMBER\}.*/)
        .messages({
            'string.pattern.base': 'Il formato deve contenere il placeholder {NUMBER}'
        }),
    
    // Configurazione stampa
    abilitaStampaAutomatica: Joi.boolean().default(false),
    templateRicevuta: Joi.string().trim().max(100).valid('default', 'modern', 'classic', 'minimal').default('default'),
    templateScheda: Joi.string().trim().max(100).valid('default', 'modern', 'classic', 'minimal').default('default'),
    
    // Configurazione email
    emailSmtpServer: Joi.string().trim().max(255).allow('').optional(),
    emailSmtpPort: Joi.number().integer().min(1).max(65535).default(587)
        .messages({
            'number.min': 'La porta SMTP deve essere maggiore di 0',
            'number.max': 'La porta SMTP deve essere minore di 65536'
        }),
    emailSmtpUsername: Joi.string().trim().max(255).allow('').optional(),
    emailSmtpPassword: Joi.string().trim().max(255).allow('').optional(),
    emailSmtpUseSSL: Joi.boolean().default(true),
    emailFromAddress: Joi.string().trim().email().max(255).allow('').optional()
        .messages({
            'string.email': 'L\'indirizzo email mittente non è valido'
        }),
    emailFromName: Joi.string().trim().max(255).allow('').optional(),
    
    // Campi di sistema
    active: Joi.boolean().default(true)
});

/**
 * Valida i dati delle impostazioni
 * @param {Object} data - Dati delle impostazioni da validare
 * @returns {Object} Oggetto con error (se presente) e value (dati validati)
 */
function validateSetting(data) {
    return settingSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        convert: true
    });
}

/**
 * Schema di validazione per configurazione email
 */
const emailConfigSchema = Joi.object({
    emailSmtpServer: Joi.string().trim().min(1).max(255).required()
        .messages({
            'string.empty': 'Il server SMTP è obbligatorio'
        }),
    emailSmtpPort: Joi.number().integer().min(1).max(65535).default(587),
    emailSmtpUsername: Joi.string().trim().max(255).allow('').optional(),
    emailSmtpPassword: Joi.string().trim().max(255).allow('').optional(),
    emailSmtpUseSSL: Joi.boolean().default(true),
    emailFromAddress: Joi.string().trim().email().max(255).required()
        .messages({
            'string.empty': 'L\'indirizzo email mittente è obbligatorio',
            'string.email': 'L\'indirizzo email mittente non è valido'
        }),
    emailFromName: Joi.string().trim().max(255).allow('').optional()
});

/**
 * Valida la configurazione email
 * @param {Object} data - Dati della configurazione email da validare
 * @returns {Object} Oggetto con error (se presente) e value (dati validati)
 */
function validateEmailConfig(data) {
    return emailConfigSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        convert: true
    });
}

/**
 * Schema di validazione per configurazione stampa
 */
const printConfigSchema = Joi.object({
    templateRicevuta: Joi.string().trim().max(100).valid('default', 'modern', 'classic', 'minimal').required(),
    templateScheda: Joi.string().trim().max(100).valid('default', 'modern', 'classic', 'minimal').required(),
    abilitaStampaAutomatica: Joi.boolean().default(false),
    formatoNumeroRicevuta: Joi.string().trim().max(100).required()
        .pattern(/.*\{NUMBER\}.*/)
        .messages({
            'string.pattern.base': 'Il formato deve contenere il placeholder {NUMBER}'
        }),
    logoPath: Joi.string().trim().max(500).allow('').optional()
});

/**
 * Valida la configurazione di stampa
 * @param {Object} data - Dati della configurazione di stampa da validare
 * @returns {Object} Oggetto con error (se presente) e value (dati validati)
 */
function validatePrintConfig(data) {
    return printConfigSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        convert: true
    });
}

/**
 * Schema per validazione rapida dei dati associazione (solo campi essenziali)
 */
const associationBasicSchema = Joi.object({
    nomeAssociazione: Joi.string().trim().min(1).max(255).required()
        .messages({
            'string.empty': 'Il nome dell\'associazione è obbligatorio'
        }),
    indirizzoAssociazione: Joi.string().trim().max(255).allow('').optional(),
    cittaAssociazione: Joi.string().trim().max(100).allow('').optional(),
    emailAssociazione: Joi.string().trim().email().max(255).allow('').optional()
        .messages({
            'string.email': 'L\'email dell\'associazione non è valida'
        }),
    telefonoAssociazione: Joi.string().trim().max(50).allow('').optional()
});

/**
 * Valida i dati base dell'associazione
 * @param {Object} data - Dati base da validare
 * @returns {Object} Oggetto con error (se presente) e value (dati validati)
 */
function validateAssociationBasic(data) {
    return associationBasicSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        convert: true
    });
}

module.exports = {
    validateSetting,
    validateEmailConfig,
    validatePrintConfig,
    validateAssociationBasic,
    settingSchema,
    emailConfigSchema,
    printConfigSchema,
    associationBasicSchema
};