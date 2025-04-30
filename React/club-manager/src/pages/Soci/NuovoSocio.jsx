import React from 'react';
import { Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import SocioForm from '../../components/soci/SocioForm';

/**
 * Pagina per la creazione di un nuovo socio
 */
const NuovoSocio = () => {
  const navigate = useNavigate();
  
  // Gestione del salvataggio
  const handleSave = (socio) => {
    // Dopo il salvataggio, l'utente rimarrà nella pagina di creazione del socio
    // poiché il form mostrerà automaticamente la possibilità di creare un abbonamento
  };

  return (
    <Container className="mt-4 mb-5">
      <h2 className="mb-4">Creazione Nuovo Socio</h2>
      <SocioForm 
        mode="C" 
        onSave={handleSave} 
      />
    </Container>
  );
};

export default NuovoSocio;