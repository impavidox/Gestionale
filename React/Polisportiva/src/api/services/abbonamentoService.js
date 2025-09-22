import api from '../axios';
import endpoints from '../endpoints';
import { formatDateForApi, parseDateFromBackend } from '../../utils/dateUtils';

/**
 * Servizio per la gestione degli abbonamenti
 * Handles compatibility between frontend and backend data formats
 */
const abbonamentoService = {
  /**
   * Aggiorna o crea un abbonamento
   * @param {Object} abbonamentoData - Dati dell'abbonamento
   * @returns {Promise} Promise con la risposta del server
   */
  updateAbbonamento: async (abbonamentoData) => {
    try {
      // Normalize the data before sending to backend
      const normalizedData = normalizeAbbonamentoData(abbonamentoData);
      
      console.log('Sending abbonamento data:', normalizedData);
      
      const response = await api.post(endpoints.ABBONAMENTO.UPDATE, normalizedData);
      
      // Normalize the response data
      const normalizedResponse = normalizeAbbonamentoResponse(response);
      
      console.log('Received abbonamento response:', normalizedResponse);
      
      return normalizedResponse;
    } catch (error) {
      console.error('Error in updateAbbonamento:', error);
      throw error;
    }
  },

  /**
   * Recupera l'abbonamento corrente per un socio
   * @param {number} socioId - ID del socio
   * @returns {Promise} Promise con i dati dell'abbonamento
   */
  retrieveCurrentAbbonamento: async (socioId) => {
    try {
      const response = await api.get(`${endpoints.ABBONAMENTO.RETRIEVE_CURRENT}/${socioId}`);
      return normalizeAbbonamentoResponse(response);
    } catch (error) {
      console.error('Error in retrieveCurrentAbbonamento:', error);
      throw error;
    }
  },

  /**
   * Recupera un abbonamento per ID
   * @param {number} abbonamentoId - ID dell'abbonamento
   * @returns {Promise} Promise con i dati dell'abbonamento
   */
  retrieveAbbonamentoById: async (abbonamentoId) => {
    try {
      const response = await api.get(`${endpoints.ABBONAMENTO.RETRIEVE_BY_ID}/${abbonamentoId}`);
      return normalizeAbbonamentoResponse(response);
    } catch (error) {
      console.error('Error in retrieveAbbonamentoById:', error);
      throw error;
    }
  },

  /**
   * Recupera tutti gli abbonamenti di un socio
   * @param {number} socioId - ID del socio
   * @returns {Promise} Promise con l'elenco degli abbonamenti
   */
  retrieveAbbonamentiBySocio: async (socioId) => {
    try {
      const response = await api.get(`${endpoints.ABBONAMENTO.RETRIEVE_BY_SOCIO}/${socioId}`);
      return normalizeAbbonamentoResponse(response);
    } catch (error) {
      console.error('Error in retrieveAbbonamentiBySocio:', error);
      throw error;
    }
  }
};

/**
 * Normalize abbonamento data before sending to backend
 * Handles field mapping and date formatting
 * @param {Object} data - Raw abbonamento data
 * @returns {Object} Normalized data for backend
 */
const normalizeAbbonamentoData = (data) => {
  if (!data) return {};

  // Create normalized object with both old and new field names for compatibility
  const normalized = {
    // Primary fields (backend preference)
    id: data.id || data.idAbonamento || 0,
    socioId: data.socioId || data.idSocio,
    attivitaId: data.attivitaId || data.idAttivita,
    importo: data.importo || 0,
    firmato: Boolean(data.firmato),
    note: data.note || '',
    
    // Legacy compatibility fields
    idAbonamento: data.id || data.idAbonamento || 0,
    idSocio: data.socioId || data.idSocio,
    idAttivita: data.attivitaId || data.idAttivita,
    idAnno: data.idAnno || 0,
    
    // Date fields - handle multiple possible field names and formats
    dataIscrizione: formatDateForApi(data.dateInscription || data.dataIscrizione || data.incription),
    dateInscription: formatDateForApi(data.dateInscription || data.dataIscrizione || data.incription),
    incription: formatDateForApi(data.dateInscription || data.dataIscrizione || data.incription),
    
    // Tessera fields - handle typo compatibility
    numeroTessera: data.numeroTessera || data.numeroTessara || '',
    numeroTessara: data.numeroTessera || data.numeroTessara || ''
  };

  // Remove null/undefined values
  Object.keys(normalized).forEach(key => {
    if (normalized[key] === null || normalized[key] === undefined) {
      delete normalized[key];
    }
  });

  return normalized;
};

/**
 * Normalize response data from backend
 * Handles different response structures and field mapping
 * @param {Object} response - Axios response object
 * @returns {Object} Normalized response
 */
const normalizeAbbonamentoResponse = (response) => {
  if (!response) return { success: false, data: null };

  // Handle different response structures
  const responseData = response.data || response;
  
  // Check for success indicators
  const isSuccess = responseData.success || responseData.returnCode || responseData.rc;
  
  let abbonamentoData = null;
  
  if (isSuccess) {
    // Extract abbonamento data from various possible locations
    abbonamentoData = responseData.data || 
                     responseData.abbonamento || 
                     responseData.result ||
                     (responseData.items && responseData.items[0]) ||
                     responseData;

    // If we have abbonamento data, normalize the date fields
    if (abbonamentoData && typeof abbonamentoData === 'object') {
      abbonamentoData = normalizeAbbonamentoFields(abbonamentoData);
    }
  }

  return {
    success: isSuccess,
    returnCode: isSuccess, // For compatibility
    data: abbonamentoData,
    message: responseData.message || null,
    error: responseData.error || null
  };
};

/**
 * Normalize abbonamento fields from backend response
 * Handles date parsing and field mapping
 * @param {Object} abbonamento - Raw abbonamento data from backend
 * @returns {Object} Normalized abbonamento
 */
const normalizeAbbonamentoFields = (abbonamento) => {
  if (!abbonamento || typeof abbonamento !== 'object') return abbonamento;

  return {
    ...abbonamento,
    
    // Ensure consistent ID field
    id: abbonamento.id || abbonamento.idAbonamento,
    idAbonamento: abbonamento.id || abbonamento.idAbonamento,
    
    // Ensure consistent socio ID field
    socioId: abbonamento.socioId || abbonamento.idSocio,
    idSocio: abbonamento.socioId || abbonamento.idSocio,
    
    // Ensure consistent activity ID field
    attivitaId: abbonamento.attivitaId || abbonamento.idAttivita,
    idAttivita: abbonamento.attivitaId || abbonamento.idAttivita,
    
    // Parse date fields from various formats
    dataIscrizione: parseDateFromBackend(
      abbonamento.dataIscrizione || 
      abbonamento.dateInscription || 
      abbonamento.incription
    ),
    dateInscription: parseDateFromBackend(
      abbonamento.dataIscrizione || 
      abbonamento.dateInscription || 
      abbonamento.incription
    ),
    incription: parseDateFromBackend(
      abbonamento.dataIscrizione || 
      abbonamento.dateInscription || 
      abbonamento.incription
    ),
    
    // Handle tessera number with typo compatibility
    numeroTessera: abbonamento.numeroTessera || abbonamento.numeroTessara,
    numeroTessara: abbonamento.numeroTessera || abbonamento.numeroTessara,
    
    // Ensure boolean values
    firmato: Boolean(abbonamento.firmato),
    attivo: abbonamento.attivo !== false, // Default to true if not specified
    
    // Handle numeric fields
    importo: parseFloat(abbonamento.importo) || 0,
    idAnno: parseInt(abbonamento.idAnno) || 0
  };
};

// Legacy function names for backward compatibility
export const createAbbonamento = abbonamentoService.updateAbbonamento;
export const updateAbbonamento = abbonamentoService.updateAbbonamento;
export const getAbbonamentoById = abbonamentoService.retrieveAbbonamentoById;

export default abbonamentoService;