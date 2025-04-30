/**
 * Definizione centralizzata di tutti gli endpoint dell'API
 */
const endpoints = {
    // Soci
    SOCIO: {
      RETRIEVE: 'socio/retrieveSocio',
      RETRIEVE_BY_ID: 'socio/retrieveSocioById',
      CREATE: 'socio/createSocio',
      UPDATE: 'socio/updateSocio',
      CONTROL_USER_TYPE: 'socio/controlUserType',
      UPDATE_FEDERAZIONE: 'socio/updateFederazione',
      RETRIEVE_TIPO_SOCIO: 'socio/retrieveTipoSocio',
      RETRIEVE_LIBRO_SOCIO: 'socio/retrieveLibroSocio',
      RETRIEVE_MAIL: 'socio/retrieveSocioMail'
    },
    
    // Abbonamenti
    ABBONAMENTO: {
      UPDATE: 'abbonamento/updateAbonamento',
      RETRIEVE_CURRENT: 'abbonamento/retrieveCurrentAbbonemanto',
    },
    
    // Ricevute
    RICEVUTA: {
      CREATE_NEW: 'ricevuta/createNewRicevuta',
      BUILD: 'ricevuta/buildRicevuta',
      PRINT_NEW: 'ricevuta/printNewRicevuta',
      RETRIEVE_FOR_USER: 'ricevuta/retrieveRicevutaForUser',
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
      RETRIEVE_BY_FAMILY: 'activities/retrieveActivitiesByFamily',
      RETRIEVE_FULL_BY_FAMILY: 'activities/retrieveFullActivitiesByFamily',
      RETRIEVE_FAMILIES: 'activities/retrieveFamilies',
      UPDATE: 'activities/updateActivity',
      REMOVE: 'activities/removeActivity',
      RETRIEVE_AFFILIAZIONE: 'activities/retrieveAffiliazioneForLibro'
    },
    
    // Geografici
    GEOGRAPHIC: {
      RETRIEVE_PROVINCE: 'geographic/retrieveProvince',
      RETRIEVE_COMMUNE: 'geographic/retrieveCommune',
      RETRIEVE_COMMUNE_BY_NAME: 'geographic/retrieveCommuneByName',
      REBUILD_COMMUNES: 'geographic/rebuildCommunes',
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