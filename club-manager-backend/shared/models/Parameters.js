const Joi = require('joi');

/**
 * Schema di validazione per Parameter
 */
const parameterSchema = Joi.object({
    id: Joi.number().integer().min(0).optional(),
    parameterName: Joi.string().trim().min(1).max(100).required()
        .pattern(/^[a-zA-Z0-9_-]+$/)
        .messages({
            'string.empty': 'Il nome del parametro è obbligatorio',
            'string.max': 'Il nome del parametro non può superare i 100 caratteri',
            'string.pattern.base': 'Il nome del parametro può contenere solo lettere, numeri, underscore e trattini'
        }),
    parameterValue: Joi.string().allow('').max(4000).required()
        .messages({
            'string.max': 'Il valore del parametro non può superare i 4000 caratteri'
        }),
    description: Joi.string().trim().max(255).allow('').optional(),
    dataType: Joi.string().valid('string', 'number', 'integer', 'boolean', 'date', 'json').default('string'),
    category: Joi.string().trim().max(100).default('general')
        .messages({
            'string.max': 'La categoria non può superare i 100 caratteri'
        }),
    active: Joi.boolean().default(true)
});

/**
 * Valida i dati di un parametro
 * @param {Object} data - Dati del parametro da validare
 * @returns {Object} Oggetto con error (se presente) e value (dati validati)
 */
function validateParameter(data) {
    return parameterSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        convert: true
    });
}

/**
 * Schema di validazione per AnnoSportivo
 */
const annoSportivoSchema = Joi.object({
    id: Joi.number().integer().min(0).optional(),
    annoName: Joi.string().trim().min(4).max(50).required()
        .messages({
            'string.empty': 'Il nome dell\'anno sportivo è obbligatorio',
            'string.min': 'Il nome dell\'anno sportivo deve avere almeno 4 caratteri',
            'string.max': 'Il nome dell\'anno sportivo non può superare i 50 caratteri'
        }),
    dataInizio: Joi.date().required()
        .messages({
            'date.base': 'La data di inizio deve essere una data valida'
        }),
    dataFine: Joi.date().greater(Joi.ref('dataInizio')).required()
        .messages({
            'date.base': 'La data di fine deve essere una data valida',
            'date.greater': 'La data di fine deve essere successiva alla data di inizio'
        }),
    active: Joi.boolean().default(true)
});

/**
 * Valida i dati di un anno sportivo
 * @param {Object} data - Dati dell'anno sportivo da validare
 * @returns {Object} Oggetto con error (se presente) e value (dati validati)
 */
function validateAnnoSportivo(data) {
    return annoSportivoSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        convert: true
    });
}

/**
 * Schema di validazione per MesiAttivita
 */
const mesiAttivitaSchema = Joi.object({
    id: Joi.number().integer().min(0).optional(),
    mese: Joi.number().integer().min(1).max(12).required()
        .messages({
            'number.min': 'Il mese deve essere compreso tra 1 e 12',
            'number.max': 'Il mese deve essere compreso tra 1 e 12'
        }),
    nome: Joi.string().trim().min(1).max(50).required()
        .messages({
            'string.empty': 'Il nome del mese è obbligatorio',
            'string.max': 'Il nome del mese non può superare i 50 caratteri'
        }),
    abbreviazione: Joi.string().trim().min(1).max(10).optional(),
    annoSportivoId: Joi.number().integer().min(1).optional(),
    active: Joi.boolean().default(true)
});

/**
 * Valida i dati di un mese di attività
 * @param {Object} data - Dati del mese da validare
 * @returns {Object} Oggetto con error (se presente) e value (dati validati)
 */
function validateMesiAttivita(data) {
    return mesiAttivitaSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        convert: true
    });
}

module.exports = {
    validateParameter,
    validateAnnoSportivo,
    validateMesiAttivita,
    parameterSchema,
    annoSportivoSchema,
    mesiAttivitaSchema
};