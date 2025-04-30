import api from '../axios';
import endpoints from '../endpoints';

/**
 * Servizio per la gestione dei parametri
 */
const parametriService = {
  /**
   * Recupera tutti i parametri
   * @returns {Promise} Promise con i parametri
   */
  retrieveParameters: () => {
    return api.get(endpoints.PARAMS.RETRIEVE_PARAMETERS);
  },
  
  /**
   * Recupera l'anno sportivo corrente
   * @returns {Promise} Promise con l'anno sportivo
   */
  retrieveAnnoSportiva: () => {
    return api.get(endpoints.PARAMS.RETRIEVE_ANNO_SPORTIVA);
  },
  
  /**
   * Recupera i mesi di attività
   * @returns {Promise} Promise con i mesi di attività
   */
  retrieveMesiAttivita: () => {
    return api.get(endpoints.PARAMS.RETRIEVE_MESI_ATTIVITA);
  },
  
  /**
   * Aggiorna l'anno sportivo
   * @param {Object} data - Dati per l'aggiornamento
   * @returns {Promise} Promise con la risposta del server
   */
  updateAnnoSportivo: (data) => {
    return api.post(`${endpoints.PARAMS.RETRIEVE_ANNO_SPORTIVA}/update`, data);
  },
  
  /**
   * Aggiorna un parametro
   * @param {Object} data - Dati del parametro
   * @returns {Promise} Promise con la risposta del server
   */
  updateParameter: (data) => {
    return api.post(`${endpoints.PARAMS.RETRIEVE_PARAMETERS}/update`, data);
  },
  
  /**
   * Aggiunge un nuovo parametro
   * @param {Object} data - Dati del nuovo parametro
   * @returns {Promise} Promise con la risposta del server
   */
  addParameter: (data) => {
    return api.post(`${endpoints.PARAMS.RETRIEVE_PARAMETERS}/add`, data);
  },
  
  /**
   * Elimina un parametro
   * @param {number} id - ID del parametro
   * @returns {Promise} Promise con la risposta del server
   */
  deleteParameter: (id) => {
    return api.delete(`${endpoints.PARAMS.RETRIEVE_PARAMETERS}/delete/${id}`);
  }
};

export default parametriService;