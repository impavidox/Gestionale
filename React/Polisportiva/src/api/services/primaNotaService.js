import api from '../axios';
import endpoints from '../endpoints';

/**
 * Servizio per la gestione della prima nota
 */
const primaNotaService = {
  /**
   * Recupera i dati per la prima nota utilizzando le ricevute
   * @param {number} type - Tipo di prima nota
   * @param {string} startDate - Data inizio (formato DD-MM-YYYY)
   * @param {string} endDate - Data fine (formato DD-MM-YYYY)
   * @returns {Promise} Promise con i dati della prima nota
   */
  buildPrimaNota: async (type = 0, startDate = null, endDate = null) => {
    try {
      // Se non ci sono date, usa il range dell'anno corrente
      if (!startDate || !endDate) {
        const currentYear = new Date().getFullYear();
        startDate = `01-01-${currentYear}`;
        endDate = `31-12-${currentYear}`;
      }

      // Chiamata API per recuperare tutte le ricevute nel periodo
      const response = await api.get(`${endpoints.RICEVUTA.RETRIEVE_ALL_BY_DATE_RANGE}`, {
        params: {
          startDate,
          endDate,
          type
        }
      });

      // Processa i dati delle ricevute per la prima nota
      const ricevute = response.data.data || response.data || [];
      console.log(ricevute)
      return {
        data: this.processRicevuteForPrimaNota(ricevute, type)
      };
    } catch (error) {
      console.error('Error in buildPrimaNota:', error);
      // Fallback: usa il metodo originale se la nuova API non è disponibile
      if (startDate && endDate) {
        return api.get(`${endpoints.PRIMA_NOTA.BUILD}/${type}/${startDate}/${endDate}`);
      }
      return api.get(`${endpoints.PRIMA_NOTA.BUILD}/${type}`);
    }
  },
  
  /**
   * Processa le ricevute per creare i dati della prima nota
   * @param {Array} ricevute - Array delle ricevute
   * @param {number} type - Tipo di prima nota
   * @returns {Object} Dati processati per la prima nota
   */
  processRicevuteForPrimaNota: (ricevute, type) => {
    // Tipologie di pagamento
    const tipologiePagamento = {
      1: 'POS',
      2: 'Contanti', 
      3: 'Bonifico'
    };

    // Raggruppa per tipologia di pagamento
    const raggruppamenti = {
      1: { nome: 'POS', ricevute: [], totale: 0 },
      2: { nome: 'Contanti', ricevute: [], totale: 0 },
      3: { nome: 'Bonifico', ricevute: [], totale: 0 }
    };

    let totaleGenerale = 0;
    const items = [];

    // Processa ogni ricevuta
    ricevute.forEach(ricevuta => {
      const tipologia = ricevuta.tipologiaPagamento || 2; // Default: Contanti
      const importo = parseFloat(ricevuta.importoRicevuta || ricevuta.importo || 0);
      
      if (raggruppamenti[tipologia]) {
        raggruppamenti[tipologia].ricevute.push(ricevuta);
        raggruppamenti[tipologia].totale += importo;
      }
      
      totaleGenerale += importo;

      // Crea l'elemento per la visualizzazione
      items.push({
        data: ricevuta.dataRicevuta,
        description: `Ricevuta #${ricevuta.numero || ricevuta.id} - ${ricevuta.socioNome || ''} ${ricevuta.socioCognome || ''} - ${tipologiePagamento[tipologia] || 'N/D'}`,
        entrata: importo,
        uscita: 0,
        saldo: importo,
        tipologiaPagamento: tipologia,
        ricevuta: ricevuta
      });
    });

    // Ordina per data
    items.sort((a, b) => new Date(a.data) - new Date(b.data));

    // Calcola saldi progressivi
    let saldoProgressivo = 0;
    items.forEach(item => {
      saldoProgressivo += item.entrata - item.uscita;
      item.saldo = saldoProgressivo;
    });

    return {
      items,
      totale: totaleGenerale,
      totaleEntrate: totaleGenerale,
      totaleUscite: 0,
      raggruppamenti,
      tipologiePagamento
    };
  },
  
  /**
   * Stampa la prima nota
   * @param {number} type - Tipo di prima nota
   * @param {string} startDate - Data inizio (formato DD-MM-YYYY)
   * @param {string} endDate - Data fine (formato DD-MM-YYYY)
   * @returns {Promise} Promise con i dati per la stampa
   */
  printPrimaNota: (type, startDate, endDate) => {
    return this.buildPrimaNota(type, startDate, endDate);
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