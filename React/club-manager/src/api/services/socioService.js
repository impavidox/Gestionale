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
  },
  
  /**
   * Controlla il tipo di utente
   * @param {string} codeFiscale - Codice fiscale
   * @param {number} tipoSocio - Tipo di socio
   * @returns {Promise} Promise con risultato del controllo
   */
  controlUserType: (codeFiscale, tipoSocio) => {
    return api.get(`${endpoints.SOCIO.CONTROL_USER_TYPE}/${codeFiscale}/${tipoSocio}`);
  },
  
  /**
   * Aggiorna la federazione di un socio
   * @param {Object} data - Dati per l'aggiornamento
   * @returns {Promise} Promise con la risposta del server
   */
  updateFederazione: (data) => {
    return api.post(endpoints.SOCIO.UPDATE_FEDERAZIONE, data);
  },
  
  /**
   * Recupera i tipi di socio disponibili
   * @returns {Promise} Promise con i tipi di socio
   */
  retrieveTipoSocio: () => {
    return api.get(endpoints.SOCIO.RETRIEVE_TIPO_SOCIO);
  },
  
  /**
   * Recupera i dati per il libro soci
   * @param {number} affiliazione - ID affiliazione
   * @param {number} begin - Inizio intervallo tessere
   * @param {number} end - Fine intervallo tessere
   * @param {number} tipo - Tipo di libro
   * @returns {Promise} Promise con dati del libro soci
   */
  retrieveLibroSocio: (affiliazione, begin, end, tipo) => {
    return api.get(`${endpoints.SOCIO.RETRIEVE_LIBRO_SOCIO}/${affiliazione}/${begin}/${end}/${tipo}`);
  },
  
  /**
   * Recupera i soci per invio email
   * @param {string|null} nome - Nome del socio
   * @param {string|null} cognome - Cognome del socio 
   * @param {number} scadenza - Filtro scadenza
   * @param {number} attivita - ID attività
   * @param {boolean} scadute - Flag per includere scadute
   * @param {number} anno - Anno di riferimento
   * @returns {Promise} Promise con i dati dei soci
   */
  retrieveSocioMail: (nome = null, cognome = null, scadenza = 0, attivita = 0, scadute = false, anno = 0) => {
    const url = `${endpoints.SOCIO.RETRIEVE_MAIL}/${nome || 'null'}/${cognome || 'null'}/${scadenza}/${attivita}/${scadute}/${anno}`;
    return api.get(url);
  }
};

export default socioService;