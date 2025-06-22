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
  dateInscription: Joi.alternatives().try(
    Joi.date(),
    Joi.string().pattern(/^\d{1,2}-\d{1,2}-\d{4}$/) // DD-MM-YYYY format
  ).optional(), // Frontend compatibility
  incription: Joi.alternatives().try(
    Joi.date(),
    Joi.string().pattern(/^\d{1,2}-\d{1,2}-\d{4}$/) // DD-MM-YYYY format
  ).optional(), // Frontend compatibility  
  dataScadenza: Joi.date().min(Joi.ref('dataIscrizione')).optional(),
  attivitaId: Joi.number().integer().positive().required(),
  idAttivita: Joi.number().integer().positive().optional(), // Frontend compatibility
  importo: Joi.number().precision(2).min(0).required(),
  firmato: Joi.boolean().default(false),
  annoSportivo: Joi.string().max(10).optional(),
  idAnno: Joi.number().integer().positive().optional(), // Frontend compatibility
  note: Joi.string().max(500).allow('').optional(),
  attivo: Joi.boolean().default(true),
  // Additional fields for compatibility
  attivitaNome: Joi.string().max(100).optional(),
  nomeAttivita: Joi.string().max(100).optional()
});

// Helper function to parse date in DD-MM-YYYY format
const parseDateFromString = (dateStr) => {
  if (!dateStr) return null;
  
  // If it's already a Date object or ISO string, return as is
  if (dateStr instanceof Date) return dateStr;
  if (typeof dateStr === 'string' && dateStr.includes('T')) {
    return new Date(dateStr);
  }
  
  // Parse DD-MM-YYYY format
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in Date
    const year = parseInt(parts[2], 10);
    
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }
  
  // Fallback to standard Date parsing
  return new Date(dateStr);
};

const validateAbbonamento = (data) => {
  // Map frontend fields to backend fields before validation
  let mappedData = {
    ...data,
    id: data.id || data.idAbonamento,
    socioId: data.socioId || data.idSocio,
    attivitaId: data.attivitaId || data.idAttivita
  };

  // Handle date parsing
  const dateField = data.dataIscrizione || data.dateInscription || data.incription;
  if (dateField) {
    mappedData.dataIscrizione = parseDateFromString(dateField);
  }

  // Handle numeroTessera mapping
  if (data.numeroTessara) {
    mappedData.numeroTessera = data.numeroTessara;
  }

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
  normalizeAbbonamentoResponse,
  parseDateFromString
};