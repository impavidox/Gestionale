import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import endpoints from '../api/endpoints';

// Creazione del contesto
const AppContext = createContext();

// Custom hook per utilizzare il contesto
export const useApp = () => useContext(AppContext);

/**
 * Provider del contesto dell'applicazione
 * Contiene lo stato globale e le funzioni comuni
 */
export const AppProvider = ({ children }) => {
  const [loading, setLoading] = useState(0);
  const [conf, setConf] = useState(null);
  const [annoSportiva, setAnnoSportiva] = useState(null);
  const [selActiv, setSelActiv] = useState([]);
  const [selAffiliazione, setSelAffiliazione] = useState([]);

  // Gestione del loading indicator
  useEffect(() => {
    const handleLoading = (event) => {
      if (event.detail.loading) {
        setLoading(prevLoading => prevLoading + 1);
      } else {
        setLoading(prevLoading => Math.max(0, prevLoading - 1));
      }
    };

    document.addEventListener('api-loading', handleLoading);
    return () => {
      document.removeEventListener('api-loading', handleLoading);
    };
  }, []);

  // Caricamento delle impostazioni all'avvio
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get(endpoints.SETTING.GET_SETTING);
        setConf(response.data);
      } catch (error) {
        console.error('Errore nel caricamento delle impostazioni:', error);
      }
    };

    fetchSettings();
  }, []);

  // Caricamento dell'anno sportivo attuale
  useEffect(() => {
    const fetchAnnoSportiva = async () => {
      try {
        const response = await api.get(endpoints.PARAMS.RETRIEVE_ANNO_SPORTIVA);
        setAnnoSportiva(response.data);
        console.log('Anno sportiva:', response.data.annoName);
      } catch (error) {
        console.error('Errore nel caricamento dell\'anno sportivo:', error);
      }
    };

    fetchAnnoSportiva();
  }, []);

  // Caricamento delle attività
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await api.get(endpoints.ACTIVITIES.RETRIEVE_ALL);
        setSelActiv(response.data);
      } catch (error) {
        console.error('Errore nel caricamento delle attività:', error);
      }
    };

    fetchActivities();
  }, []);

  // Caricamento delle affiliazioni
  useEffect(() => {
    const fetchAffiliazioni = async () => {
      try {
        const response = await api.get(`${endpoints.ACTIVITIES.RETRIEVE_AFFILIAZIONE}/0`);
        setSelAffiliazione(response.data);
      } catch (error) {
        console.error('Errore nel caricamento delle affiliazioni:', error);
      }
    };

    fetchAffiliazioni();
  }, []);

  // Funzione per aprire una nuova tab
  const goNewTab = (route, params = {}) => {
    const queryParams = new URLSearchParams();
    
    // Aggiungi i parametri all'URL
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    });
    
    const queryString = queryParams.toString();
    const url = `/${route}${queryString ? `?${queryString}` : ''}`;
    
    window.open(url, '_blank');
  };
  
  // Funzione per recuperare e formattare date
  const retrieveDate = (date) => {
    if (!date) return { jj: 0, mm: 0, yyyy: 0 };
    
    const myDate = new Date(date);
    return {
      jj: myDate.getDate(),
      mm: myDate.getMonth(),
      yyyy: myDate.getFullYear()
    };
  };
  
  // Funzione per formattare le date
  const formatDate = (date) => {
    if (!date) return '';
    
    const myDate = new Date(date);
    return `${myDate.getDate()}/${myDate.getMonth() + 1}/${myDate.getFullYear()}`;
  };

  // Valori che verranno condivisi tramite il contesto
  const value = {
    loading: loading > 0,
    conf,
    annoSportiva,
    selActiv,
    selAffiliazione,
    goNewTab,
    retrieveDate,
    formatDate
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;