const Joi = require('joi');

const ricevutaSchema = Joi.object({
  id: Joi.number().integer().positive().optional(),
  numero: Joi.string().max(50).required(),
  socioId: Joi.number().integer().positive().required(),
  abbonamentoId: Joi.number().integer().positive().required(),
  data: Joi.date().required(),
  importo: Joi.number().precision(2).positive().required(),
  causale: Joi.string().max(200).required(),
  incassato: Joi.boolean().default(false),
  dataIncasso: Joi.date().allow(null).optional(),
  modalitaPagamento: Joi.string().max(50).allow('').optional(),
  note: Joi.string().max(500).allow('').optional(),
  annullata: Joi.boolean().default(false),
  dataAnnullamento: Joi.date().allow(null).optional(),
  motivoAnnullamento: Joi.string().max(200).allow('').optional()
});

const validateRicevuta = (data) => {
  return ricevutaSchema.validate(data, { allowUnknown: true });
};

module.exports = {
  ricevutaSchema,
  validateRicevuta
};