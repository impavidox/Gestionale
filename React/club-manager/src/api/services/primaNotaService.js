import api from '../axios';
import endpoints from '../endpoints';

/**
 * Servizio per la gestione della prima nota
 */
const primaNotaService = {
  /**
   * Recupera i dati per la prima nota
   * @param {number} type - Tipo di prima nota
   * @param {string} startDate - Data inizio (formato DD-MM-YYYY)
   * @param {string} endDate - Data fine (formato DD-MM-YYYY)
   * @returns {Promise} Promise con i dati della prima nota
   */
  buildPrimaNota: (type = 0, startDate = null, endDate = null) => {
    if (startDate && endDate) {
      return api.get(`${endpoints.PRIMA_NOTA.BUILD}/${type}/${startDate}/${endDate}`);
    }
    return api.get(`${endpoints.PRIMA_NOTA.BUILD}/${type}`);
  },
  
  /**
   * Stampa la prima nota
   * @param {number} type - Tipo di prima nota
   * @param {string} startDate - Data inizio (formato DD-MM-YYYY)
   * @param {string} endDate - Data fine (formato DD-MM-YYYY)
   * @returns {Promise} Promise con i dati per la stampa
   */
  printPrimaNota: (type, startDate, endDate) => {
    return api.get(`${endpoints.PRIMA_NOTA.PRINT}/${type}/${startDate}/${endDate}`);
  },
  
  /**
   * Recupera le statistiche della prima nota
   * @param {number} type - Tipo di statistica
   * @returns {Promise} Promise con i dati statistici
   */
  getStatistic: (type = 0) => {
    return api.get(`${endpoints.PRIMA_NOTA.STATISTIC}/${type}`);
  }
};

export default primaNotaService;