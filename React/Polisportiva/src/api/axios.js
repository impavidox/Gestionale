import axios from 'axios';

// Base URL configuration based on environment
const getBaseURL = () => {
    //return 'https://backend-polisportiva-cyd8cjbyg0b2c5hg.westeurope-01.azurewebsites.net/api/';
    return 'http://localhost:7071/api/';
};

// Configurazione di base di Axios
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Keep track of pending requests
let pendingRequests = new Set();

// Helper function to dispatch loading events
const dispatchLoadingEvent = (loading) => {
  try {
    document.dispatchEvent(new CustomEvent('api-loading', { 
      detail: { loading } 
    }));
  } catch (error) {
    console.warn('Failed to dispatch loading event:', error);
  }
};

// Request interceptor
api.interceptors.request.use(
  config => {
    // Create a unique identifier for this request
    const requestId = `${config.method}-${config.url}_${Date.now()}`;
    config.requestId = requestId;
    
    pendingRequests.add(requestId);
    
    // Only dispatch loading event if this is the first pending request
    if (pendingRequests.size === 1) {
      dispatchLoadingEvent(true);
    }
    
    console.log(`Request started: ${requestId}, pending: ${pendingRequests.size}`);
    return config;
  },
  error => {
    // If request setup fails, ensure loading stops
    if (pendingRequests.size === 0) {
      dispatchLoadingEvent(false);
    }
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  response => {
    // Remove this request from pending
    if (response.config.requestId) {
      pendingRequests.delete(response.config.requestId);
    }
    
    // Stop loading if no more pending requests
    if (pendingRequests.size === 0) {
      dispatchLoadingEvent(false);
    }
    
    console.log(`Request completed: ${response.config.requestId}, pending: ${pendingRequests.size}`);
    return response;
  },
  error => {
    // Remove this request from pending
    if (error.config?.requestId) {
      pendingRequests.delete(error.config.requestId);
    }
    
    // Stop loading if no more pending requests
    if (pendingRequests.size === 0) {
      dispatchLoadingEvent(false);
    }
    
    console.log(`Request failed: ${error.config?.requestId}, pending: ${pendingRequests.size}`);
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Add a method to manually reset the loading state if it gets stuck
api.resetLoading = () => {
  pendingRequests.clear();
  dispatchLoadingEvent(false);
  console.log('Loading state manually reset');
};

// Add a method to check current loading state
api.getLoadingState = () => {
  return {
    pendingRequests: pendingRequests.size,
    requestIds: Array.from(pendingRequests)
  };
};

export default api;