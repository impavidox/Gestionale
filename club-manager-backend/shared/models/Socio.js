// club-manager-backend/shared/models/Socio.js

const Joi = require('joi');

const socioSchema = Joi.object({
  id: Joi.number().integer().positive().optional(),
  nome: Joi.string().max(100).required(),
  cognome: Joi.string().max(100).required(),
  codiceFiscale: Joi.string().length(16).pattern(/^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/).required(),
  dataNascita: Joi.date().max('now').optional(),
  birhDate: Joi.date().max('now').optional(), // Frontend typo compatibility
  birthDate: Joi.date().max('now').optional(), // Correct spelling compatibility
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
  attivo: Joi.boolean().default(true),
  // Additional frontend compatibility fields
  competition: Joi.boolean().optional(),
  certifica: Joi.date().optional()
});

const validateSocio = (data) => {
  // Map frontend fields to backend fields before validation
  const mappedData = {
    ...data,
    dataNascita: data.dataNascita || data.birhDate || data.birthDate
  };

  return socioSchema.validate(mappedData, { allowUnknown: true });
};

const normalizeSocioResponse = (socio) => {
  if (!socio) return null;
  
  return {
    id: socio.id,
    nome: socio.nome,
    cognome: socio.cognome,
    codiceFiscale: socio.codiceFiscale,
    dataNascita: socio.dataNascita,
    birhDate: socio.dataNascita, // Frontend typo compatibility
    birthDate: socio.dataNascita, // Correct spelling
    luogoNascita: socio.luogoNascita,
    provinciaNascita: socio.provinciaNascita,
    indirizzo: socio.indirizzo,
    civico: socio.civico,
    cap: socio.cap,
    comune: socio.comune,
    provincia: socio.provincia,
    telefono: socio.telefono,
    cellulare: socio.cellulare,
    email: socio.email,
    tipoSocio: socio.tipoSocio,
    privacy: socio.privacy,
    federazione: socio.federazione,
    numeroTesseraFederale: socio.numeroTesseraFederale,
    attivo: socio.attivo,
    competition: socio.competition,
    certifica: socio.certifica
  };
};

module.exports = {
  socioSchema,
  validateSocio,
  normalizeSocioResponse
};