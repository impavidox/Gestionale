// club-manager-backend/shared/models/Socio.js

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

const socioSchema = Joi.object({
  nome: Joi.string().max(255).required(),
  cognome: Joi.string().max(255).required(),
  codiceFiscale: Joi.string().length(16).pattern(/^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/).required(),
  sesso: Joi.string().valid('M', 'F', 'Maschio', 'Femmina').optional(),
  dataNascita: Joi.date().max('now').optional(),
  provinciaNascita: Joi.string().max(255).optional(),
  comuneNascita: Joi.string().max(255).optional(),
  provinciaResidenza: Joi.string().max(255).optional(),
  comuneResidenza: Joi.string().max(255).optional(),
  viaResidenza: Joi.string().max(255).optional(),
  capResidenza: Joi.string().length(5).pattern(/^[0-9]{5}$/).optional(),
  telefono: Joi.string().max(20).allow('').optional(),
  email: Joi.string().email().allow('').optional(),
  scadenzaCertificato: Joi.date().optional(),
  isAgonistico: Joi.number().integer().valid(0, 1).default(0),
  privacy: Joi.number().integer().valid(0, 1).default(0),
  dataPrivacy: Joi.date().optional(),
  isTesserato: Joi.number().integer().valid(0, 1).default(0),
  isEffettivo: Joi.number().integer().valid(0, 1).default(0),
  isVolontario: Joi.number().integer().valid(0, 1).default(0),
  dataIscrizione: Joi.date().optional(),
  isScaduto: Joi.number().integer().valid(0, 1).default(0),
});

const validateSocio = (data) => {
  // Map frontend fields to backend fields before validation
  let mappedData = {
    ...data
  };

  var dateField = data.dataNascita;
  if (dateField) {
    mappedData.dataNascita = parseDateFromString(dateField);
  }

  var dateField = data.scadenzaCertificato;
  if (dateField) {
    mappedData.scadenzaCertificato = parseDateFromString(dateField);
  }

  var dateField = data.dataPrivacy;
  if (dateField) {
    mappedData.dataPrivacy = parseDateFromString(dateField);
  }
  
  var dateField = data.dataIscrizione;
  if (dateField) {
    mappedData.dataIscrizione = parseDateFromString(dateField);
  }


  return socioSchema.validate(mappedData, { allowUnknown: true });
};

const normalizeSocioResponse = (socio) => {
  if (!socio) return null;
  
  return {
    id: socio.id,
    nome: socio.nome,
    cognome: socio.cognome,
    codiceFiscale: socio.codiceFiscale,
    sesso: socio.sesso,
    dataNascita: socio.dataNascita,
    provinciaNascita: socio.provinciaNascita,
    comuneNascita: socio.comuneNascita,
    provinciaResidenza: socio.provinciaResidenza,
    comuneResidenza: socio.comuneResidenza,
    viaResidenza: socio.viaResidenza,
    capResidenza: socio.capResidenza,
    telefono: socio.telefono,
    email: socio.email,
    scadenzaCertificato: socio.scadenzaCertificato,
    isAgonistico: socio.isAgonistico,
    privacy: socio.privacy,
    dataPrivacy: socio.dataPrivacy,
    isTesserato: socio.isTesserato,
    isEffettivo: socio.isEffettivo,
    isVolontario: socio.isVolontario,
    dataIscrizione: socio.dataIscrizione,
    isScaduto: socio.isScaduto
  };
};

module.exports = {
  socioSchema,
  validateSocio,
  normalizeSocioResponse,
  parseDateFromString
};