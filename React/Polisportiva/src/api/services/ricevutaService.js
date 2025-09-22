import api from '../axios';
import endpoints from '../endpoints';

/**
 * Servizio per la gestione delle ricevute
 */
const ricevutaService = {
  
  /**
   * Recupera i dati per la costruzione di una ricevuta
   * @param {number} idSocio - ID del socio
   * @param {number} idAbbo - ID dell'abbonamento
   * @param {number} idRicevuta - ID della ricevuta
   * @returns {Promise} Promise con i dati della ricevuta
   */
  buildRicevuta: (idSocio, idAbbo, idRicevuta) => {
    return api.get(`${endpoints.RICEVUTA.BUILD}/${idSocio}/${idAbbo}/${idRicevuta}`);
  },
  
  /**
   * Stampa una nuova ricevuta
   * @param {Object} ricevutaData - Dati della ricevuta
   * @returns {Promise} Promise con la risposta del server
   */
  createNewRicevuta: (ricevutaData) => {
    return api.post(endpoints.RICEVUTA.CREATE_NEW, ricevutaData);
  },
  
  /**
   * Recupera le ricevute per un utente
   * @param {number} idSocio - ID del socio
   * @returns {Promise} Promise con le ricevute dell'utente
   */
  retrieveRicevutaForUser: (idSocio) => {
    return api.get(`${endpoints.RICEVUTA.RETRIEVE_FOR_USER}/${idSocio}`);
  },

  /**
   * Recupera tutte le ricevute in un range di date
   * @param {string} startDate - Data inizio (formato DD-MM-YYYY)
   * @param {string} endDate - Data fine (formato DD-MM-YYYY)
   * @param {number} type - Tipo di ricevuta (opzionale)
   * @returns {Promise} Promise con le ricevute nel periodo
   */
  retrieveAllByDateRange: (startDate, endDate, type = 0) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (type) params.append('type', type);
    
    return api.get(`${endpoints.RICEVUTA.RETRIEVE_ALL_BY_DATE_RANGE}?${params.toString()}`);
  },
  
  /**
   * Aggiorna gli incassi di una ricevuta
   * @param {Object} data - Dati per l'aggiornamento
   * @returns {Promise} Promise con la risposta del server
   */
  updateRicevuta: (data) => {
    return api.post(endpoints.RICEVUTA.UPDATE, data);
  },
  
  /**
   * Annulla una ricevuta
   * @param {Object} data - Dati della ricevuta da annullare
   * @returns {Promise} Promise con la risposta del server
   */
  annulRicevuta: (data) => {
    return api.post(endpoints.RICEVUTA.ANNUL, data);
  },
  
  /**
   * Prepara una scheda per un socio
   * @param {number} idSocio - ID del socio
   * @returns {Promise} Promise con i dati della scheda
   */
  prepareScheda: (idSocio) => {
    return api.get(`${endpoints.RICEVUTA.PREPARE_SCHEDA}/${idSocio}`);
  },

  /**
   * Invia ricevuta o scheda via email
   * @param {Object} emailData - Dati per l'invio email
   * @param {string} emailData.recipientEmail - Email destinatario
   * @param {string} emailData.recipientName - Nome destinatario
   * @param {string} emailData.subject - Oggetto email
   * @param {string} emailData.htmlContent - Contenuto HTML email
   * @param {boolean} emailData.isScheda - Se è una scheda o ricevuta
   * @param {string} emailData.ricevutaNumber - Numero ricevuta
   * @returns {Promise} Promise con la risposta del server
   */
  sendRicevutaEmail: async (emailData) => {
    try {
      const response = await api.post('/send-email', emailData);
      return response.data;
    } catch (error) {
      console.error('Error sending ricevuta email:', error);
      if (error.response && error.response.data) {
        return {
          success: false,
          message: error.response.data.message || 'Errore nell\'invio dell\'email'
        };
      }
      return {
        success: false,
        message: 'Errore di connessione durante l\'invio dell\'email'
      };
    }
  }
};

export default ricevutaService;