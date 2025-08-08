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
   * @param {number} tesseraNumber - Numero tessera
   * @returns {Promise} Promise con le ricevute dell'utente
   */
  retrieveRicevutaForUser: (idSocio) => {
    return api.get(`${endpoints.RICEVUTA.RETRIEVE_FOR_USER}/${idSocio}`);
  },
  
  /**
   * Aggiorna gli incassi di una ricevuta
   * @param {Object} data - Dati per l'aggiornamento
   * @returns {Promise} Promise con la risposta del server
   */
  updateIncassi: (data) => {
    return api.post(endpoints.RICEVUTA.UPDATE_INCASSI, data);
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
  }
};

export default ricevutaService;