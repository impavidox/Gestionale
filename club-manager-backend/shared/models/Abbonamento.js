const Joi = require('joi');

const abbonamentoSchema = Joi.object({
  id: Joi.number().integer().positive().optional(),
  socioId: Joi.number().integer().positive().required(),
  numeroTessera: Joi.string().max(50).optional(),
  numeroTessara: Joi.string().max(50).optional(), // Compatibilità frontend
  dataIscrizione: Joi.date().required(),
  incription: Joi.date().optional(), // Compatibilità frontend
  dataScadenza: Joi.date().min(Joi.ref('dataIscrizione')).required(),
  attivitaId: Joi.number().integer().positive().required(),
  importo: Joi.number().precision(2).min(0).required(),
  firmato: Joi.boolean().default(false),
  annoSportivo: Joi.string().max(10).required(),
  note: Joi.string().max(500).allow('').optional(),
  attivo: Joi.boolean().default(true)
});

const validateAbbonamento = (data) => {
  return abbonamentoSchema.validate(data, { allowUnknown: true });
};

module.exports = {
  abbonamentoSchema,
  validateAbbonamento
};