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
  const [loadingCount, setLoadingCount] = useState(0);
  const [conf, setConf] = useState(null);
  const [annoSportiva, setAnnoSportiva] = useState(null);
  const [selActiv, setSelActiv] = useState([]);
  const [selAffiliazione, setSelAffiliazione] = useState([]);

  // Gestione del loading indicator
  useEffect(() => {
    const handleLoading = (event) => {
      if (event.detail.loading) {
        setLoadingCount(prevCount => {
          const newCount = prevCount + 1;
          console.log('Loading started, count:', newCount);
          return newCount;
        });
      } else {
        setLoadingCount(prevCount => {
          const newCount = Math.max(0, prevCount - 1);
          console.log('Loading ended, count:', newCount);
          return newCount;
        });
      }
    };

    document.addEventListener('api-loading', handleLoading);
    
    return () => {
      document.removeEventListener('api-loading', handleLoading);
    };
  }, []);


  // Caricamento dell'anno sportivo attuale
  useEffect(() => {
    const fetchAnnoSportiva = async () => {
      try {
        const response = await api.get(endpoints.PARAMS.RETRIEVE_ANNO_SPORTIVA);
        const annoData = response.data?.data || response.data;
        setAnnoSportiva(annoData);
        console.log('Anno sportiva:', annoData?.annoName);
      } catch (error) {
        console.error('Errore nel caricamento dell\'anno sportivo:', error);
        // Set fallback year
        const currentYear = new Date().getFullYear();
        setAnnoSportiva({
          id: 1,
          annoName: `${currentYear}/${currentYear + 1}`
        });
      }
    };

    fetchAnnoSportiva();
  }, []);

  // Caricamento delle attività
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await api.get(endpoints.ACTIVITIES.RETRIEVE_ALL);
        const activitiesData = response.data?.data || response.data || [];
        setSelActiv(activitiesData);
      } catch (error) {
        console.error('Errore nel caricamento delle attività:', error);
        setSelActiv([]);
      }
    };

    fetchActivities();
  }, []);

  // Caricamento delle affiliazioni
  useEffect(() => {
    const fetchAffiliazioni = async () => {
      try {
        const response = await api.get(`${endpoints.ACTIVITIES.RETRIEVE_AFFILIAZIONE}/0`);
        const affiliazioniData = response.data?.data || response.data || [];
        setSelAffiliazione(affiliazioniData);
      } catch (error) {
        console.error('Errore nel caricamento delle affiliazioni:', error);
        setSelAffiliazione([]);
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

  // Manual loading control functions
  const startLoading = () => {
    setLoadingCount(prev => prev + 1);
  };

  const stopLoading = () => {
    setLoadingCount(prev => Math.max(0, prev - 1));
  };

  // Valori che verranno condivisi tramite il contesto
  const value = {
    loading: loadingCount > 0,
    loadingCount,
    conf,
    annoSportiva,
    selActiv,
    selAffiliazione,
    goNewTab,
    retrieveDate,
    formatDate,
    startLoading,
    stopLoading
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;