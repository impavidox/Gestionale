/**
 * Definizione centralizzata di tutti gli endpoint dell'API
 */
const endpoints = {
    // Soci
    SOCIO: {
      RETRIEVE: 'socio/retrieveSocio',
      RETRIEVE_BY_ID: 'socio/retrieveSocioById',
      CREATE: 'socio/createSocio',
      UPDATE: 'socio/updateSocio'
    },
    
    // Abbonamenti
    ABBONAMENTO: {
      UPDATE: 'abbonamento/updateAbbonamento',
      RETRIEVE_CURRENT: 'abbonamento/retrieveCurrentAbbonamento',
    },
    
    // Ricevute
    RICEVUTA: {
      CREATE_NEW: 'ricevuta/createNewRicevuta',
      BUILD: 'ricevuta/buildRicevuta',
      RETRIEVE_FOR_USER: 'ricevuta/retrieveRicevutaForUser',
      RETRIEVE_ALL_BY_DATE_RANGE: 'ricevuta/retrieveAllByDateRange', // New endpoint
      UPDATE_INCASSI: 'ricevuta/updateIncassi',
      ANNUL: 'ricevuta/annulRicevuta',
      PREPARE_SCHEDA: 'ricevuta/prepareScheda'
    },
    
    // Prima Nota
    PRIMA_NOTA: {
      BUILD: 'primanota/buildPrimaNota',
      PRINT: 'primanota/printPrimaNota',
      STATISTIC: 'primanota/statistic'
    },
    
    // Attività
    ACTIVITIES: {
      RETRIEVE_ALL: 'activities/retrieveAllActivities',
      RETRIEVE_BY_FAMILY: 'activities/retrieveActivitiesByFederazione',
      RETRIEVE_BY_SEZIONE:'activities/retrieveActivitiesBySezione',
      RETRIEVE_FULL_BY_FAMILY: 'activities/retrieveFullActivitiesByFamily',
      RETRIEVE_FAMILIES: 'activities/retrieveFederazioni',
      RETRIEVE_SEZIONI: 'activities/retrieveSezioni',
      UPDATE: 'activities/updateActivity',
      REMOVE: 'activities/removeActivity',
      RETRIEVE_AFFILIAZIONE: 'activities/retrieveAffiliazioneForLibro',
      RETRIEVE_CODES:'activities/retrieveCodes'
    },
    
    // Geografici
    GEOGRAPHIC: {
      RETRIEVE_PROVINCE: 'geographic/retrieveProvince',
      RETRIEVE_comune: 'geographic/retrievecomune',
      RETRIEVE_comune_BY_NAME: 'geographic/retrievecomuneByName',
      REBUILD_comuneS: 'geographic/rebuildcomunes',
      REBUILD_STATES: 'geographic/rebuildStates'
    },
    
    // Parametri
    PARAMS: {
      RETRIEVE_PARAMETERS: 'params/retrieveParameters',
      RETRIEVE_ANNO_SPORTIVA: 'params/retrieveAnnoSportiva',
      RETRIEVE_MESI_ATTIVITA: 'params/retrieveMesiAttivita'
    },
    
    // Utility
    UTILITY: {
      LOAD_NUMERO_TESSERA: 'utility/loadNumeroTessera',
      RETRIEVE_ABBONAMENTO_BY_TESSERA: 'utility/retrieveAbbonamentoByTessera',
      UPDATE_NUMERO_TESSERA: 'utility/updateNumeroTessera',
      UPDATE_NUMERO_TESSERA_ALERT: 'utility/updateNumeroTesseraAlert',
      CNTRL_NUMERO_TESSERA: 'utility/cntrlNumeroTessera'
    },
    
    // Impostazioni
    SETTING: {
      GET_SETTING: 'setting/getSetting'
    }
  };
  
  export default endpoints;