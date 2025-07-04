import React, { useState, useEffect } from 'react';
import { Container, Card } from 'react-bootstrap';
import { useParams, useSearchParams } from 'react-router-dom';
import RicevutaForm from '../../components/ricevute/RicevutaForm';
import RicevutaPrint from '../../components/ricevute/RicevutaPrint';

/**
 * Pagina per la stampa o modifica di una ricevuta
 * 
 * Può essere usata in diverse modalità:
 * - Creazione nuova ricevuta (reprint=0)
 * - Ristampa ricevuta esistente (reprint=1)
 * - Modifica ricevuta esistente (reprint=2)
 * - Stampa scheda socio (isScheda=true)
 */
const StampaRicevuta = ({ isScheda = false }) => {
  // Prende i parametri dall'URL
  const [searchParams] = useSearchParams();
  
  const idSocio = parseInt(searchParams.get('idsocio') || '0');
  const reprint = parseInt(searchParams.get('reprint') || '0');
  const idAbbo = parseInt(searchParams.get('abbo') || '0');
  const idRicevuta = parseInt(searchParams.get('ricevuta') || '0');
  
  // Stati per gestire il flusso
  const [showPrint, setShowPrint] = useState(reprint === 1 || isScheda);
  const [success, setSuccess] = useState(false);
  
  // Gestisce il successo del salvataggio
  const handleSuccess = () => {
    setSuccess(true);
    setShowPrint(true);
  };
  
  return (
    <Container className="mt-4 mb-5">
      <h2 className="mb-4">
        {isScheda 
          ? 'Scheda Socio' 
          : reprint === 0 
            ? 'Nuova Ricevuta' 
            : reprint === 1 
              ? 'Visualizza Ricevuta' 
              : 'Modifica Ricevuta'
        }
      </h2>
      
      {showPrint ? (
        <RicevutaPrint 
          idSocio={idSocio}
          reprint={reprint}
          idAbbo={idAbbo}
          idRicevuta={idRicevuta}
          isScheda={isScheda}
        />
      ) : (
        <RicevutaForm 
          idSocio={idSocio}
          reprint={reprint}
          idAbbo={idAbbo}
          idRicevuta={idRicevuta}
          onSuccess={handleSuccess}
        />
      )}
    </Container>
  );
};

export default StampaRicevuta;