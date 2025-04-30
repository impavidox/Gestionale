/**
 * Utility per la gestione delle date
 */

/**
 * Formatta una data nel formato dd-mm-yyyy
 * @param {Date} date - Data da formattare
 * @returns {string} Data formattata
 */
export const formatDateForApi = (date) => {
    if (!date) return null;
    
    const d = new Date(date);
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    
    return `${day}-${month}-${year}`;
  };
  
  /**
   * Formatta una data nel formato dd/mm/yyyy
   * @param {Date|string} date - Data da formattare
   * @returns {string} Data formattata
   */
  export const formatDateDisplay = (date) => {
    if (!date) return '';
    
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}/${month}/${year}`;
  };
  
  /**
   * Scompone una data in giorno, mese e anno
   * @param {Date|string} date - Data da scomporre
   * @returns {Object} Oggetto con giorno, mese e anno
   */
  export const extractDateParts = (date) => {
    if (!date) return { day: null, month: null, year: null };
    
    const d = new Date(date);
    return {
      day: d.getDate(),
      month: d.getMonth(),
      year: d.getFullYear()
    };
  };
  
  /**
   * Verifica se una data è scaduta
   * @param {Date|string} date - Data da verificare
   * @returns {boolean} true se la data è scaduta, false altrimenti
   */
  export const isExpired = (date) => {
    if (!date) return false;
    
    const today = new Date();
    const compareDate = new Date(date);
    
    return compareDate < today;
  };
  
  /**
   * Aggiunge un numero di giorni a una data
   * @param {Date} date - Data di base
   * @param {number} days - Numero di giorni da aggiungere
   * @returns {Date} Nuova data
   */
  export const addDays = (date, days) => {
    if (!date) return null;
    
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };
  
  /**
   * Aggiunge un numero di mesi a una data
   * @param {Date} date - Data di base
   * @param {number} months - Numero di mesi da aggiungere
   * @returns {Date} Nuova data
   */
  export const addMonths = (date, months) => {
    if (!date) return null;
    
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  };
  
  /**
   * Confronta due date
   * @param {Date} date1 - Prima data
   * @param {Date} date2 - Seconda data
   * @returns {number} 0 se uguali, 1 se date1 > date2, -1 se date1 < date2
   */
  export const compareDates = (date1, date2) => {
    if (!date1 || !date2) return null;
    
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    // Resetta ore, minuti, secondi e millisecondi per confrontare solo la data
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    
    if (d1.getTime() === d2.getTime()) return 0;
    if (d1.getTime() > d2.getTime()) return 1;
    return -1;
  };