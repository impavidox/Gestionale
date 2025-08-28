const Joi = require('joi');

/**
 * Schema di validazione per Attività
 */
const attivitaSchema = Joi.object({
    nome: Joi.string().trim().min(1).max(255).required()
        .messages({
            'string.empty': 'Il nome dell\'attività è obbligatorio',
            'string.max': 'Il nome non può superare i 255 caratteri'
        }),
    federazioneId: Joi.number().integer().min(1).required()
        .messages({
            'number.base': 'La federazione deve essere un numero',
            'number.min': 'La federazione è obbligatoria'
        }),
    codice: Joi.string().allow(null).trim().max(255).optional(),
    emailReferente: Joi.string().allow(null).email().max(255).optional()
        .messages({
            'string.email': 'L\'email del referente non è valida'
        }),
    sezioneId: Joi.number().integer().min(1).required()
        .messages({
            'number.base': 'La sezione deve essere un numero',
            'number.min': 'La sezione è obbligatoria'
        }),
    id: Joi.number().integer().min(1).optional()
        .messages({
            'number.base': 'L id deve essere un numero',
            'number.min': 'L id  è obbligatorio'
        }),
    
});

/**
 * Valida i dati di un'attività
 * @param {Object} data - Dati dell'attività da validare
 * @returns {Object} Oggetto con error (se presente) e value (dati validati)
 */
function validateAttivita(data) {
    // Map frontend fields to backend fields
    let mappedData = {
        ...data,
        nome: data.nome || data.description,
        federazioneId: data.federazioneId || data.familyId,
        sezioneId: data.sezioneId || 1 // Default section if not provided
    };

    return attivitaSchema.validate(mappedData, {
        abortEarly: false,
        stripUnknown: true,
        convert: true
    });
}

/**
 * Schema di validazione per Federazione
 */
const federazioneSchema = Joi.object({
    nome: Joi.string().trim().min(1).max(255).required()
        .messages({
            'string.empty': 'Il nome della federazione è obbligatorio',
            'string.max': 'Il nome non può superare i 255 caratteri'
        })
});

/**
 * Valida i dati di una federazione
 * @param {Object} data - Dati della federazione da validare
 * @returns {Object} Oggetto con error (se presente) e value (dati validati)
 */
function validateFederazione(data) {
    return federazioneSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        convert: true
    });
}

/**
 * Schema di validazione per Sezione
 */
const sezioneSchema = Joi.object({
    nome: Joi.string().trim().min(1).max(255).required()
        .messages({
            'string.empty': 'Il nome della sezione è obbligatorio',
            'string.max': 'Il nome non può superare i 255 caratteri'
        })
});

/**
 * Valida i dati di una sezione
 * @param {Object} data - Dati della sezione da validare
 * @returns {Object} Oggetto con error (se presente) e value (dati validati)
 */
function validateSezione(data) {
    return sezioneSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        convert: true
    });
}

/**
 * Normalizza la risposta dell'attività per compatibilità frontend
 */
const normalizeAttivitaResponse = (attivita) => {
    if (!attivita) return null;
    
    return {
        id: attivita.id,
        nome: attivita.nome,
        federazioneId: attivita.federazioneId,
        federazioneNome: attivita.federazioneNome,
        sezioneId: attivita.sezioneId,
        codice: attivita.codice,
        emailReferente: attivita.emailReferente,
    };
};

module.exports = {
    validateAttivita,
    validateFederazione,
    validateSezione,
    normalizeAttivitaResponse,
    attivitaSchema,
    federazioneSchema,
    sezioneSchema
};