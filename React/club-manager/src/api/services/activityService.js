import api from '../axios';
import endpoints from '../endpoints';

/**
 * Servizio per la gestione delle attività
 */
const activityService = {
  /**
   * Recupera tutte le attività
   * @returns {Promise} Promise con le attività
   */
  retrieveAllActivities: () => {
    return api.get(endpoints.ACTIVITIES.RETRIEVE_ALL);
  },
  
  /**
   * Recupera le attività per una famiglia specifica
   * @param {number} familyId - ID della famiglia
   * @returns {Promise} Promise con le attività della famiglia
   */
  retrieveActivitiesByFamily: (familyId) => {
    return api.get(`${endpoints.ACTIVITIES.RETRIEVE_BY_FAMILY}/${familyId}`);
  },
  
  /**
   * Recupera tutte le informazioni sulle attività per una famiglia
   * @param {number} familyId - ID della famiglia
   * @returns {Promise} Promise con le informazioni complete sulle attività
   */
  retrieveFullActivitiesByFamily: (familyId) => {
    return api.get(`${endpoints.ACTIVITIES.RETRIEVE_FULL_BY_FAMILY}/${familyId}`);
  },
  
  /**
   * Recupera le famiglie di attività
   * @returns {Promise} Promise con le famiglie
   */
  retrieveFamilies: () => {
    return api.get(endpoints.ACTIVITIES.RETRIEVE_FAMILIES);
  },

  retrieveActivitiesCodes: () => {
    return api.get(endpoints.ACTIVITIES.RETRIEVE_CODES);
  },
  
  /**
   * Aggiorna un'attività
   * @param {Object} data - Dati dell'attività
   * @returns {Promise} Promise con la risposta del server
   */
  updateActivity: (data) => {
    return api.post(endpoints.ACTIVITIES.UPDATE, data);
  },
  
  /**
   * Rimuove un'attività
   * @param {Object} data - Dati per la rimozione
   * @returns {Promise} Promise con la risposta del server
   */
  removeActivity: (data) => {
    return api.post(endpoints.ACTIVITIES.REMOVE, data);
  },
  
  /**
   * Recupera le affiliazioni per il libro soci
   * @param {number} type - Tipo di affiliazione
   * @returns {Promise} Promise con le affiliazioni
   */
  retrieveAffiliazione: (type) => {
    return api.get(`${endpoints.ACTIVITIES.RETRIEVE_AFFILIAZIONE}/${type}`);
  }
};

export default activityService;