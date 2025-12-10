import api from '../axios';
import endpoints from '../endpoints';

/**
 * Servizio per la gestione delle ricevute enti
 */
const entiService = {

  /**
   * Crea una nuova ricevuta enti
   * @param {Object} ricevutaData - Dati della ricevuta (dataRicevuta, ente, importo, descrizione)
   * @returns {Promise} Promise con la risposta del server
   */
  createRicevutaEnti: (ricevutaData) => {
    return api.post(endpoints.ENTI.CREATE, ricevutaData);
  },

  /**
   * Recupera tutte le ricevute enti
   * @param {string} startDate - Data inizio (formato DD-MM-YYYY) (opzionale)
   * @param {string} endDate - Data fine (formato DD-MM-YYYY) (opzionale)
   * @returns {Promise} Promise con le ricevute enti
   */
  retrieveAllRicevuteEnti: (startDate = null, endDate = null) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const queryString = params.toString();
    const url = queryString
      ? `${endpoints.ENTI.RETRIEVE_ALL}?${queryString}`
      : endpoints.ENTI.RETRIEVE_ALL;

    return api.get(url);
  },

  /**
   * Recupera una ricevuta enti per ID
   * @param {number} id - ID della ricevuta
   * @returns {Promise} Promise con la ricevuta
   */
  retrieveRicevutaEntiById: (id) => {
    return api.get(`${endpoints.ENTI.RETRIEVE_BY_ID}/${id}`);
  },

  /**
   * Aggiorna una ricevuta enti
   * @param {Object} ricevutaData - Dati della ricevuta (deve includere id)
   * @returns {Promise} Promise con la risposta del server
   */
  updateRicevutaEnti: (ricevutaData) => {
    return api.put(endpoints.ENTI.UPDATE, ricevutaData);
  },

  /**
   * Elimina una ricevuta enti
   * @param {number} id - ID della ricevuta da eliminare
   * @returns {Promise} Promise con la risposta del server
   */
  deleteRicevutaEnti: (id) => {
    return api.delete(endpoints.ENTI.DELETE, { data: { id } });
  },

  /**
   * Costruisce la prima nota per le ricevute enti
   * @param {number} type - Tipo (sempre 0 per enti - nessun filtro tipo pagamento)
   * @param {string} startDate - Data inizio (formato DD-MM-YYYY)
   * @param {string} endDate - Data fine (formato DD-MM-YYYY)
   * @returns {Promise} Promise con i dati della prima nota
   */
  buildPrimaNotaEnti: (type, startDate, endDate) => {
    return api.get(`${endpoints.ENTI.BUILD_PRIMA_NOTA}/${type}/${startDate}/${endDate}`);
  }
};

export default entiService;
