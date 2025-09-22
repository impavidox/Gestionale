/**
 * Utility per la validazione dei dati
 */

/**
 * Verifica se una stringa è vuota o null
 * @param {string} value - Valore da verificare
 * @returns {boolean} true se la stringa è vuota, false altrimenti
 */
export const isEmpty = (value) => {
    return value === undefined || value === null || value === '';
  };
  
  /**
   * Verifica se un valore è un numero
   * @param {any} value - Valore da verificare
   * @returns {boolean} true se è un numero, false altrimenti
   */
  export const isNumber = (value) => {
    return !isNaN(parseFloat(value)) && isFinite(value);
  };
  
  /**
   * Verifica se un valore è un indirizzo email valido
   * @param {string} value - Valore da verificare
   * @returns {boolean} true se è un'email valida, false altrimenti
   */
  export const isValidEmail = (value) => {
    if (isEmpty(value)) return false;
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(value);
  };
  
  /**
   * Verifica se un valore è un codice fiscale italiano valido
   * @param {string} value - Codice fiscale da verificare
   * @returns {boolean} true se è un codice fiscale valido, false altrimenti
   */
  export const isValidCodiceFiscale = (value) => {
    if (isEmpty(value)) return false;
    
    // Rimuovi spazi e converti in maiuscolo
    const cf = value.replace(/\s/g, '').toUpperCase();
    
    // Il codice fiscale italiano è di 16 caratteri
    if (cf.length !== 16) return false;
    
    // Verifica che il formato sia corretto
    const cfRegex = /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/;
    return cfRegex.test(cf);
  };
  
  /**
   * Verifica se un valore è un CAP italiano valido
   * @param {string} value - CAP da verificare
   * @returns {boolean} true se è un CAP valido, false altrimenti
   */
  export const isValidCAP = (value) => {
    if (isEmpty(value)) return false;
    
    // Rimuovi spazi
    const cap = value.replace(/\s/g, '');
    
    // Il CAP italiano è di 5 cifre
    const capRegex = /^\d{5}$/;
    return capRegex.test(cap);
  };
  
  /**
   * Verifica se un valore è un numero di telefono valido
   * @param {string} value - Telefono da verificare
   * @returns {boolean} true se è un telefono valido, false altrimenti
   */
  export const isValidPhone = (value) => {
    if (isEmpty(value)) return false;
    
    // Rimuovi spazi e caratteri non numerici
    const phone = value.replace(/[^\d]/g, '');
    
    // Verifica che ci siano almeno 9 cifre
    return phone.length >= 9 && phone.length <= 15;
  };
  
  /**
   * Verifica se un oggetto socio ha tutti i campi obbligatori
   * @param {Object} socio - Oggetto socio da verificare
   * @returns {boolean} true se tutti i campi obbligatori sono presenti, false altrimenti
   */
  export const isValidSocio = (socio) => {
    if (!socio) return false;
    
    // Campi obbligatori
    const requiredFields = [
      'nome',
      'cognome',
      'birthday', // o giorno, mese, anno
      'birthcomuneCode',
      'province',
      'city',
      'corso', // indirizzo
      'cap',
      'tipoSocio'
    ];
    
    // Verifica che tutti i campi obbligatori siano presenti e non vuoti
    return requiredFields.every(field => !isEmpty(socio[field]));
  };
  
  /**
   * Verifica se un oggetto abbonamento ha tutti i campi obbligatori
   * @param {Object} abbonamento - Oggetto abbonamento da verificare
   * @returns {boolean} true se tutti i campi obbligatori sono presenti, false altrimenti
   */
  export const isValidAbbonamento = (abbonamento) => {
    if (!abbonamento) return false;
    
    // Campi obbligatori
    const requiredFields = [
      'idSocio',
      'dateInscription',
      'idAnno'
    ];
    
    // Verifica che tutti i campi obbligatori siano presenti e non vuoti
    return requiredFields.every(field => !isEmpty(abbonamento[field]));
  };