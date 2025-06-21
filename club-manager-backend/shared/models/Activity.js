const Joi = require('joi');

/**
 * Schema di validazione per Activity
 */
const activitySchema = Joi.object({
    attId: Joi.number().integer().min(0).optional(),
    description: Joi.string().trim().min(1).max(255).required()
        .messages({
            'string.empty': 'La descrizione è obbligatoria',
            'string.max': 'La descrizione non può superare i 255 caratteri'
        }),
    familyId: Joi.number().integer().min(1).required()
        .messages({
            'number.base': 'La famiglia di attività deve essere un numero',
            'number.min': 'La famiglia di attività è obbligatoria'
        }),
    libertas: Joi.boolean().default(false),
    fgi: Joi.boolean().default(false),
    fita: Joi.boolean().default(false),
    filkjm: Joi.boolean().default(false),
    active: Joi.boolean().default(true)
});

/**
 * Valida i dati di un'attività
 * @param {Object} data - Dati dell'attività da validare
 * @returns {Object} Oggetto con error (se presente) e value (dati validati)
 */
function validateActivity(data) {
    return activitySchema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        convert: true
    });
}

/**
 * Schema di validazione per ActivityFamily
 */
const activityFamilySchema = Joi.object({
    id: Joi.number().integer().min(0).optional(),
    description: Joi.string().trim().min(1).max(255).required()
        .messages({
            'string.empty': 'La descrizione della famiglia è obbligatoria',
            'string.max': 'La descrizione non può superare i 255 caratteri'
        }),
    active: Joi.boolean().default(true)
});

/**
 * Valida i dati di una famiglia di attività
 * @param {Object} data - Dati della famiglia da validare
 * @returns {Object} Oggetto con error (se presente) e value (dati validati)
 */
function validateActivityFamily(data) {
    return activityFamilySchema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        convert: true
    });
}

module.exports = {
    validateActivity,
    validateActivityFamily,
    activitySchema,
    activityFamilySchema
};