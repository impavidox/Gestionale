import axios from '../axios';
import { API_ENDPOINTS } from '../endpoints';

/**
 * Crea un nuovo abbonamento
 * 
 * @param {Object} abbonamentoData - Dati dell'abbonamento da creare
 * @returns {Promise<Object>} - La risposta dal server
 */
export const createAbbonamento = async (abbonamentoData) => {
  try {
    const response = await axios.post(API_ENDPOINTS.ABBONAMENTO.CREATE, abbonamentoData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Errore durante la creazione dell\'abbonamento');
  }
};

/**
 * Aggiorna un abbonamento esistente
 * 
 * @param {Object} abbonamentoData - Dati dell'abbonamento da aggiornare
 * @returns {Promise<Object>} - La risposta dal server
 */
export const updateAbbonamento = async (abbonamentoData) => {
  try {
    const response = await axios.post(API_ENDPOINTS.ABBONAMENTO.UPDATE, abbonamentoData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Errore durante l\'aggiornamento dell\'abbonamento');
  }
};

/**
 * Recupera l'abbonamento corrente di un socio
 * 
 * @param {number} socioId - ID del socio
 * @returns {Promise<Object>} - La risposta dal server contenente l'abbonamento
 */
export const getCurrentAbbonamento = async (socioId) => {
  try {
    const response = await axios.get(`${API_ENDPOINTS.ABBONAMENTO.GET_CURRENT}/${socioId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Errore durante il recupero dell\'abbonamento corrente');
  }
};

/**
 * Recupera un abbonamento per ID
 * 
 * @param {number} abbonamentoId - ID dell'abbonamento
 * @returns {Promise<Object>} - La risposta dal server contenente l'abbonamento
 */
export const getAbbonamentoById = async (abbonamentoId) => {
  try {
    const response = await axios.get(`${API_ENDPOINTS.ABBONAMENTO.GET_BY_ID}/${abbonamentoId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Errore durante il recupero dell\'abbonamento');
  }
};

/**
 * Recupera tutti gli abbonamenti di un socio
 * 
 * @param {number} socioId - ID del socio
 * @returns {Promise<Array>} - La risposta dal server contenente gli abbonamenti
 */
export const getAbbonamentiBySocio = async (socioId) => {
  try {
    const response = await axios.get(`${API_ENDPOINTS.ABBONAMENTO.GET_BY_SOCIO}/${socioId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Errore durante il recupero degli abbonamenti');
  }
};

/**
 * Recupera gli abbonamenti per numero di tessera
 * 
 * @param {string} numeroTessera - Numero tessera
 * @returns {Promise<Array>} - La risposta dal server contenente gli abbonamenti
 */
export const getAbbonamentoByTessera = async (numeroTessera) => {
  try {
    const response = await axios.get(`${API_ENDPOINTS.ABBONAMENTO.GET_BY_TESSERA}/${numeroTessera}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Errore durante il recupero degli abbonamenti per tessera');
  }
};