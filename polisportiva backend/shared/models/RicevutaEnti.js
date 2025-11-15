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

const ricevutaEntiSchema = Joi.object({
  dataRicevuta: Joi.date().required(),
  ente: Joi.string().min(1).max(255).required(),
  importo: Joi.number().integer().min(0).required(),
});

const validateRicevutaEnti = (data, context) => {
  // Map and validate data
  let mappedData = {
    ...data
  };

  context.log('Validating Ricevuta Enti:', mappedData);

  // Handle date parsing
  if (data.dataRicevuta) {
    mappedData.dataRicevuta = parseDateFromString(data.dataRicevuta);
  }

  return ricevutaEntiSchema.validate(mappedData, { allowUnknown: true });
};

const normalizeRicevutaEntiResponse = (ricevuta) => {
  if (!ricevuta) return null;

  return {
    id: ricevuta.id,
    dataRicevuta: ricevuta.dataRicevuta,
    ente: ricevuta.ente,
    importo: ricevuta.importo,
    created_at: ricevuta.created_at
  };
};

module.exports = {
  ricevutaEntiSchema,
  validateRicevutaEnti,
  normalizeRicevutaEntiResponse,
  parseDateFromString
};
