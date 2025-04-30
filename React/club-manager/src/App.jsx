import React from 'react';
import { AppProvider } from './context/AppContext';
import AppRouter from './router/AppRouter';

/**
 * Componente principale dell'applicazione
 */
const App = () => {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
};

export default App;