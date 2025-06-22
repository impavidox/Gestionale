// club-manager-backend/shared/models/Abbonamento.js

const Joi = require('joi');

const abbonamentoSchema = Joi.object({
  id: Joi.number().integer().positive().optional(),
  idAbonamento: Joi.number().integer().positive().optional(), // Frontend compatibility
  socioId: Joi.number().integer().positive().required(),
  idSocio: Joi.number().integer().positive().optional(), // Frontend compatibility
  numeroTessera: Joi.string().max(50).optional(),
  numeroTessara: Joi.string().max(50).optional(), // Frontend typo compatibility
  dataIscrizione: Joi.date().required(),
  dateInscription: Joi.date().optional(), // Frontend compatibility
  incription: Joi.date().optional(), // Frontend compatibility  
  dataScadenza: Joi.date().min(Joi.ref('dataIscrizione')).required(),
  attivitaId: Joi.number().integer().positive().required(),
  idAttivita: Joi.number().integer().positive().optional(), // Frontend compatibility
  importo: Joi.number().precision(2).min(0).required(),
  firmato: Joi.boolean().default(false),
  annoSportivo: Joi.string().max(10).required(),
  idAnno: Joi.number().integer().positive().optional(), // Frontend compatibility
  note: Joi.string().max(500).allow('').optional(),
  attivo: Joi.boolean().default(true),
  // Additional fields for compatibility
  attivitaNome: Joi.string().max(100).optional(),
  nomeAttivita: Joi.string().max(100).optional()
});

const validateAbbonamento = (data) => {
  // Map frontend fields to backend fields before validation
  const mappedData = {
    ...data,
    id: data.id || data.idAbonamento,
    socioId: data.socioId || data.idSocio,
    dataIscrizione: data.dataIscrizione || data.dateInscription || data.incription,
    attivitaId: data.attivitaId || data.idAttivita
  };

  return abbonamentoSchema.validate(mappedData, { allowUnknown: true });
};

const normalizeAbbonamentoResponse = (abbonamento) => {
  if (!abbonamento) return null;
  
  return {
    id: abbonamento.id,
    idAbonamento: abbonamento.id, // Frontend compatibility
    socioId: abbonamento.socioId,
    idSocio: abbonamento.socioId, // Frontend compatibility
    numeroTessera: abbonamento.numeroTessera,
    numeroTessara: abbonamento.numeroTessera, // Frontend typo compatibility
    dataIscrizione: abbonamento.dataIscrizione,
    dateInscription: abbonamento.dataIscrizione, // Frontend compatibility
    incription: abbonamento.dataIscrizione, // Frontend compatibility
    dataScadenza: abbonamento.dataScadenza,
    attivitaId: abbonamento.attivitaId,
    idAttivita: abbonamento.attivitaId, // Frontend compatibility
    importo: abbonamento.importo,
    firmato: abbonamento.firmato,
    annoSportivo: abbonamento.annoSportivo,
    idAnno: abbonamento.idAnno,
    note: abbonamento.note,
    attivo: abbonamento.attivo,
    attivitaNome: abbonamento.attivitaNome || abbonamento.nomeAttivita
  };
};

module.exports = {
  abbonamentoSchema,
  validateAbbonamento,
  normalizeAbbonamentoResponse
};