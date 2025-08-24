import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import PrintLayout from '../layouts/PrintLayout';

// Pages
import Dashboard from '../pages/Dashboard';
import ElencoSoci from '../pages/Soci/ElencoSoci';
import NuovoSocio from '../pages/Soci/NuovoSocio';
import DettaglioSocio from '../pages/Soci/DettaglioSocio';
import LibroSoci from '../pages/LibroSoci/LibroSoci';
import StampaLibroSoci from '../pages/LibroSoci/StampaLibroSoci';
import PrimaNota from '../pages/PrimaNota/PrimaNota';
import StampaPrimaNota from '../pages/PrimaNota/StampaPrimaNota';
import StampaRicevuta from '../pages/Ricevute/StampaRicevuta';
import GestioneRicevute from '../pages/Ricevute/GestioneRicevute';
import RicevuteElenco from '../pages/Ricevute/RicevuteElenco';
import Parametri from '../pages/Parametri/Parametri';
import EmailManager from '../pages/Email/EmailManager';
import RicercaStampa from '../pages/Soci/RicercaStampa';

/**
 * Componente per la gestione del routing dell'applicazione
 */
const AppRouter = () => {
  return (
    <Router>
      <Routes>
        {/* Route con layout principale */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          
          {/* Gestione Soci */}
          <Route path="soci">
            <Route index element={<ElencoSoci />} />
            <Route path="nuovo" element={<NuovoSocio />} />
            <Route path=":id" element={<DettaglioSocio />} />
          </Route>
          
          {/* Libro Soci */}
          <Route path="libro-soci" element={<LibroSoci />} />
          
          {/* Prima Nota */}
          <Route path="prima-nota" element={<PrimaNota />} />
          
          {/* Gestione Ricevute */}
          <Route path="ricevute">
            <Route index element={<GestioneRicevute />} />
            <Route path="elenco" element={<RicevuteElenco />} />
          </Route>
          
          {/* Parametri */}
          <Route path="parametri" element={<Parametri />} />
          
          {/* Reindirizzamento da / a /home (utile per compatibilità con la vecchia app) */}
          <Route path="home" element={<Navigate to="/" replace />} />
        </Route>
        
        {/* Route con layout per stampa */}
        <Route path="/" element={<PrintLayout />}>
          <Route path="stampa-libro-soci/:affiliazione/:begin/:end/:tipo" element={<StampaLibroSoci />} />
          {/* Updated: Prima nota print route uses query parameters instead of path parameters */}
          <Route path="stampa-prima-nota" element={<StampaPrimaNota />} />
          <Route path="ricevute/stampa" element={<StampaRicevuta />} />
          <Route path="schede/stampa" element={<StampaRicevuta isScheda={true} />} />
          <Route path="ricerca" element={<RicercaStampa />} />
          <Route path="email" element={<EmailManager />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default AppRouter;