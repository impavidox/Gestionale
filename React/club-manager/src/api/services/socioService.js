import api from '../axios';
import endpoints from '../endpoints';

/**
 * Servizio per la gestione dei soci
 */
const socioService = {
  /**
   * Recupera l'elenco dei soci in base ai filtri
   * @param {string|null} nome - Nome del socio
   * @param {string|null} cognome - Cognome del socio 
   * @param {number} scadenza - Filtro scadenza
   * @param {number} attivita - ID attività
   * @param {boolean} scadute - Flag per includere scadute
   * @param {number} anno - Anno di riferimento
   * @returns {Promise} Promise con i dati dei soci
   */
  retrieveSocio: (nome = null, cognome = null, scadenza = 0, attivita = 0, scadute = false, anno = 0) => {
    const url = `${endpoints.SOCIO.RETRIEVE}/${nome || 'null'}/${cognome || 'null'}/${scadenza}/${attivita}/${scadute}/${anno}`;
    return api.get(url);
  },
  
  /**
   * Recupera un socio in base al suo ID
   * @param {number} id - ID del socio
   * @returns {Promise} Promise con i dati del socio
   */
  retrieveSocioById: (id) => {
    return api.get(`${endpoints.SOCIO.RETRIEVE_BY_ID}/${id}`);
  },
  
  /**
   * Crea un nuovo socio
   * @param {Object} socioData - Dati del nuovo socio
   * @returns {Promise} Promise con la risposta del server
   */
  createSocio: (socioData) => {
    return api.post(endpoints.SOCIO.CREATE, socioData);
  },
  
  /**
   * Aggiorna i dati di un socio
   * @param {Object} socioData - Dati aggiornati del socio
   * @returns {Promise} Promise con la risposta del server
   */
  updateSocio: (socioData) => {
    return api.post(endpoints.SOCIO.UPDATE, socioData);
  }
  

};

export default socioService;