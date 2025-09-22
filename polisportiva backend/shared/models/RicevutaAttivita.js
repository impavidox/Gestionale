const Joi = require('joi');

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
      return new Date(Date.UTC(year, month, day));
    }
  }
  
  // Fallback to standard Date parsing
  return new Date(dateStr);
};

const ricevutaAttivitaSchema = Joi.object({
  attivitàId: Joi.number().integer().positive().required(),
  socioId: Joi.number().integer().positive().required(),
  importoRicevuta: Joi.number().integer().min(0).optional(),
  importoIncassato: Joi.number().integer().min(0).optional(),
  tipologiaPagamento: Joi.number().integer().valid(1, 2, 3).optional(), // 0=contanti, 1=bonifico, 2=carta, 3=altro
  quotaAss: Joi.number().integer().min(0).optional(),
  scadenzaQuota: Joi.date().optional(),
  dataRicevuta: Joi.date().optional(),
  scadenzaPagamento: Joi.date().optional(),
});

const validateRicevutaAttivita = (data,context) => {
  // Map frontend fields to backend fields before validation
  let mappedData = {
    ...data
  };


  context.log(mappedData)
  // Handle date parsing
  if (data.scadenzaQuota) {
    mappedData.scadenzaQuota = parseDateFromString(data.scadenzaQuota);
  }
  if (data.dataRicevuta) {
    mappedData.dataRicevuta = parseDateFromString(data.dataRicevuta);
  }
  if (data.scadenzaPagamento) {
    mappedData.scadenzaPagamento = parseDateFromString(data.scadenzaPagamento);
  }


  return ricevutaAttivitaSchema.validate(mappedData, { allowUnknown: true });
};

const normalizeRicevutaAttivitaResponse = (ricevuta) => {
  if (!ricevuta) return null;
  
  return {
    nrRicevuta:ricevuta.numero_ricevuta_progressivo,
    id: ricevuta.id,
    attivitàId: ricevuta.attivitàId,
    socioId: ricevuta.socioId,
    dataRicevuta: ricevuta.dataRicevuta,
    importoRicevuta: ricevuta.importoRicevuta,
    importoIncassato: ricevuta.importoIncassato,
    tipologiaPagamento: ricevuta.tipologiaPagamento,
    quotaAss: ricevuta.quotaAss,
    scadenzaQuota: ricevuta.scadenzaQuota,
    scadenzaPagamento: ricevuta.scadenzaPagamento,
  };
};

module.exports = {
  ricevutaAttivitaSchema,
  validateRicevutaAttivita,
  normalizeRicevutaAttivitaResponse,
  parseDateFromString
};