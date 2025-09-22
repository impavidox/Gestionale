import api from '../axios';
import endpoints from '../endpoints';

/**
 * Servizio per le utilità di sistema
 */
const utilityService = {
  /**
   * Carica i numeri di tessera nel sistema
   * @returns {Promise} Promise con la risposta del server
   */
  loadNumeroTessera: () => {
    return api.get(endpoints.UTILITY.LOAD_NUMERO_TESSERA);
  },
  
  /**
   * Recupera gli abbonamenti per numero di tessera
   * @param {string} numeroTessera - Numero di tessera da cercare
   * @returns {Promise} Promise con gli abbonamenti trovati
   */
  retrieveAbbonamentoByTessera: (numeroTessera) => {
    return api.get(`${endpoints.UTILITY.RETRIEVE_ABBONAMENTO_BY_TESSERA}/${numeroTessera}`);
  },
  
  /**
   * Aggiorna un numero di tessera
   * @param {Object} data - Dati per l'aggiornamento
   * @returns {Promise} Promise con la risposta del server
   */
  updateNumeroTessera: (data) => {
    return api.post(endpoints.UTILITY.UPDATE_NUMERO_TESSERA, data);
  },
  
  /**
   * Aggiorna un numero di tessera con alert
   * @param {Object} data - Dati per l'aggiornamento
   * @returns {Promise} Promise con la risposta del server
   */
  updateNumeroTesseraAlert: (data) => {
    return api.post(endpoints.UTILITY.UPDATE_NUMERO_TESSERA_ALERT, data);
  },
  
  /**
   * Controlla i numeri di tessera
   * @param {number} type - Tipo di controllo
   * @returns {Promise} Promise con i risultati del controllo
   */
  cntrlNumeroTessera: (type) => {
    return api.get(`${endpoints.UTILITY.CNTRL_NUMERO_TESSERA}/${type}`);
  }
};

export default utilityService;