import React, { useState, useEffect } from 'react';
import { Container, Button, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import SocioForm from '../../components/soci/SocioForm';
import socioService from '../../api/services/socioService';
import Alert from '../../components/common/Alert';

/**
 * Pagina per la visualizzazione e modifica di un socio esistente
 */
const DettaglioSocio = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [socio, setSocio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Caricamento dei dati del socio
  useEffect(() => {
    const fetchSocio = async () => {
      setLoading(true);
      try {
        const response = await socioService.retrieveSocioById(id);
        
        // Converti i dati del socio dal formato API al formato del form
        const socioData = {
          ...response.data,
          // Estrai i dati di data di nascita
          birthJJ: new Date(response.data.birhDate).getDate(),
          birthMM: (new Date(response.data.birhDate).getMonth() + 1).toString().padStart(2, '0'),
          anno: new Date(response.data.birhDate).getFullYear()
        };
        
        setSocio(socioData);
      } catch (error) {
        console.error('Errore nel caricamento del socio:', error);
        setError('Non è stato possibile caricare i dati del socio. Riprova più tardi.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSocio();
    }
  }, [id]);

  // Gestione del salvataggio
  const handleSave = (updatedSocio) => {
    setSocio(updatedSocio);
  };

  // Torna alla lista dei soci
  const handleBack = () => {
    navigate('/soci');
  };

  return (
    <Container className="mt-4 mb-5">
      <h2 className="mb-4">Dettaglio Socio</h2>
      
      <Button
        variant="secondary"
        onClick={handleBack}
        className="mb-3"
      >
        Torna all'elenco
      </Button>
      
      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Caricamento...</span>
          </Spinner>
        </div>
      ) : error ? (
        <Alert
          variant="danger"
          message={error}
        />
      ) : socio ? (
        <SocioForm
          existingSocio={socio}
          mode="U"
          onSave={handleSave}
        />
      ) : (
        <Alert
          variant="warning"
          message="Socio non trovato"
        />
      )}
    </Container>
  );
};

export default DettaglioSocio;