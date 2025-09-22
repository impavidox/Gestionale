import api from '../axios';
import endpoints from '../endpoints';

/**
 * Servizio per la gestione dei dati geografici
 */
const geographicService = {
  /**
   * Recupera tutte le province
   * @returns {Promise} Promise con l'elenco delle province
   */
  retrieveProvince: () => {
    return api.get(endpoints.GEOGRAPHIC.RETRIEVE_PROVINCE);
  },
  
  /**
   * Recupera i comuni per una provincia specifica
   * @param {string} codeProvincia - Codice della provincia
   * @returns {Promise} Promise con l'elenco dei comuni
   */
  retrievecomune: (codeProvincia) => {
    return api.get(`${endpoints.GEOGRAPHIC.RETRIEVE_comune}/${codeProvincia}`);
  },
  
  /**
   * Cerca comuni per nome
   * @param {string} nomeComuneParziale - Nome parziale del comune
   * @returns {Promise} Promise con l'elenco dei comuni trovati
   */
  retrievecomuneByName: (nomeComuneParziale) => {
    return api.get(`${endpoints.GEOGRAPHIC.RETRIEVE_comune_BY_NAME}/${nomeComuneParziale}`);
  },
  
  /**
   * Aggiorna il database dei comuni
   * @returns {Promise} Promise con il risultato dell'operazione
   */
  rebuildcomunes: () => {
    return api.get(endpoints.GEOGRAPHIC.REBUILD_comuneS);
  },
  
  /**
   * Aggiorna il database degli stati
   * @returns {Promise} Promise con il risultato dell'operazione
   */
  rebuildStates: () => {
    return api.get(endpoints.GEOGRAPHIC.REBUILD_STATES);
  }
};

export default geographicService;