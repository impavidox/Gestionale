import axios from 'axios';

// Base URL configuration based on environment
const getBaseURL = () => {
    return 'https://backend-cso.azurewebsites.net/api/';
};

// Configurazione di base di Axios
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor per gestire errori
api.interceptors.response.use(
  response => response,
  error => {
    // Gestione centralizzata degli errori
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor per mostrare/nascondere loader
let requestCount = 0;

api.interceptors.request.use(
  config => {
    requestCount++;
    document.dispatchEvent(new CustomEvent('api-loading', { detail: { loading: true } }));
    return config;
  },
  error => {
    requestCount--;
    if (requestCount === 0) {
      document.dispatchEvent(new CustomEvent('api-loading', { detail: { loading: false } }));
    }
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  response => {
    requestCount--;
    if (requestCount === 0) {
      document.dispatchEvent(new CustomEvent('api-loading', { detail: { loading: false } }));
    }
    return response;
  },
  error => {
    requestCount--;
    if (requestCount === 0) {
      document.dispatchEvent(new CustomEvent('api-loading', { detail: { loading: false } }));
    }
    return Promise.reject(error);
  }
);

export default api;