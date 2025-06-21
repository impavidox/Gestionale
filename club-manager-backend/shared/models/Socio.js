const Joi = require('joi');

const socioSchema = Joi.object({
  id: Joi.number().integer().positive().optional(),
  nome: Joi.string().max(100).required(),
  cognome: Joi.string().max(100).required(),
  codiceFiscale: Joi.string().length(16).pattern(/^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/).required(),
  dataNascita: Joi.date().max('now').optional(),
  birhDate: Joi.date().max('now').optional(), // Compatibilità frontend
  luogoNascita: Joi.string().max(100).optional(),
  provinciaNascita: Joi.string().max(2).optional(),
  indirizzo: Joi.string().max(200).optional(),
  civico: Joi.string().max(10).optional(),
  cap: Joi.string().length(5).pattern(/^[0-9]{5}$/).optional(),
  comune: Joi.string().max(100).optional(),
  provincia: Joi.string().max(2).optional(),
  telefono: Joi.string().max(20).allow('').optional(),
  cellulare: Joi.string().max(20).allow('').optional(),
  email: Joi.string().email().allow('').optional(),
  tipoSocio: Joi.number().integer().default(1),
  privacy: Joi.boolean().default(false),
  federazione: Joi.string().max(100).allow('').optional(),
  numeroTesseraFederale: Joi.string().max(50).allow('').optional(),
  attivo: Joi.boolean().default(true)
});

const validateSocio = (data) => {
  return socioSchema.validate(data, { allowUnknown: true });
};

module.exports = {
  socioSchema,
  validateSocio
};