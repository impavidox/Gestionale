import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import SocioFilters from '../../components/soci/SocioFilters';
import SocioList from '../../components/soci/SocioList';
import SocioForm from '../../components/soci/SocioForm';
import Loader from '../../components/common/Loader';
import socioService from '../../api/services/socioService';

/**
 * Pagina per l'elenco e la gestione dei soci - Updated Version
 */
const ElencoSoci = () => {
  const navigate = useNavigate();
  const { goNewTab } = useApp();
  
  // Stati per la gestione della pagina
  const [soci, setSoci] = useState([]);
  const [filtri, setFiltri] = useState({
    cognome: '',
    scadenza: 0,
    attivita: 0,
    scadute: false,
    anno: 0
  });
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showDetailSocio, setShowDetailSocio] = useState(false);
  const [selectedSocio, setSelectedSocio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);

  // Esegue la ricerca dei soci
  const fetchSoci = async (filters) => {
    setLoading(true);
    setError('');
    setShowError(false);
    
    try {
      console.log('Fetching soci with filters:', filters);
      
      const response = await socioService.retrieveSocio(
        null, // nome
        filters.cognome || null,
        filters.scadenza,
        filters.attivita,
        filters.scadute,
        filters.anno
      );
      
      console.log('API Response:', response);
      
      // Handle different response structures
      let socioData = [];
      if (response.data) {
        if (response.data.data && response.data.data.items) {
          socioData = response.data.data.items;
        } else if (response.data.items) {
          socioData = response.data.items;
        } else if (Array.isArray(response.data)) {
          socioData = response.data;
        } else if (response.data.success && response.data.result) {
          socioData = response.data.result;
        }
      }
      
      console.log('Processed soci data:', socioData);
      
      setSoci(socioData);
      setShowSearchResults(true);
      setShowDetailSocio(false);
      
    } catch (error) {
      console.error('Errore nella ricerca dei soci:', error);
      setError('Si è verificato un errore durante la ricerca dei soci. Riprova più tardi.');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  // Gestione della ricerca
  const handleSearch = (newFilters) => {
    console.log('Search triggered with filters:', newFilters);
    setFiltri(newFilters);
    fetchSoci(newFilters);
  };

  // Gestione della stampa
  const handlePrint = (filters) => {
    const titolo = filters.attivitaDescriptionSelected || 'Elenco Soci';
    
    goNewTab('ricerca', {
      cognome: filters.cognome || '',
      scadenza: filters.scadenza,
      attivita: filters.attivita,
      scadute: filters.scadute,
      anno: filters.anno,
      titolo
    });
  };

  // Gestione dell'invio email
  const handleEmail = (filters) => {
    const titolo = filters.attivitaDescriptionSelected || 'Elenco Soci';
    
    goNewTab('email', {
      cognome: filters.cognome || '',
      scadenza: filters.scadenza,
      attivita: filters.attivita,
      scadute: filters.scadute,
      anno: filters.anno,
      titolo
    });
  };

  // Gestione della selezione di un socio per modifica
  const handleSelectSocio = (socio) => {
    setSelectedSocio(socio);
    setShowDetailSocio(true);
    setShowSearchResults(false);
  };

  // Gestione del salvataggio di un socio
  const handleSaveSocio = (socio) => {
    // Aggiorna la lista dei soci
    fetchSoci(filtri);
    setShowDetailSocio(false);
    setShowSearchResults(true);
    setSelectedSocio(null);
  };

  // Gestione della chiusura del dettaglio
  const handleCloseDetail = () => {
    setShowDetailSocio(false);
    setShowSearchResults(true);
    setSelectedSocio(null);
  };

  // Gestione refresh della lista (chiamata dal SocioList dopo operazioni)
  const handleRefreshSoci = () => {
    fetchSoci(filtri);
  };

  return (
    <Container className="mt-4 mb-5">
      <h2 className="mb-4">Gestione Soci</h2>
      
      {showError && (
        <Alert variant="danger" onClose={() => setShowError(false)} dismissible>
          {error}
        </Alert>
      )}
      
      {loading && <Loader />}
      
      {!showDetailSocio && (
        <>
          <Row className="mb-4">
            <Col>
              <SocioFilters
                initialFilters={filtri}
                onSearch={handleSearch}
                onPrint={handlePrint}
                onEmail={handleEmail}
              />
            </Col>
          </Row>
          
          {showSearchResults && (
            <Row>
              <Col>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4>
                    Risultati della ricerca 
                    {soci.length > 0 && (
                      <span className="text-muted fs-6 ms-2">({soci.length} soci trovati)</span>
                    )}
                  </h4>
                  <Button
                    variant="success"
                    onClick={() => navigate('/soci/nuovo')}
                  >
                    <i className="bi bi-person-plus me-1"></i>
                    Nuovo Socio
                  </Button>
                </div>
                
                {soci.length === 0 ? (
                  <div className="text-center my-5">
                    <p className="text-muted">Nessun socio trovato con i filtri specificati.</p>
                    <p>Prova a modificare i criteri di ricerca.</p>
                  </div>
                ) : (
                  <SocioList
                    soci={soci}
                    onSelect={handleSelectSocio}
                    onRefresh={handleRefreshSoci}
                    filters={filtri}
                  />
                )}
              </Col>
            </Row>
          )}
        </>
      )}
      
      {showDetailSocio && (
        <Row>
          <Col>
            <Button
              variant="secondary"
              className="mb-3"
              onClick={handleCloseDetail}
            >
              <i className="bi bi-arrow-left me-1"></i>
              Torna all'elenco
            </Button>
            
            <SocioForm
              existingSocio={selectedSocio}
              mode="U"
              onSave={handleSaveSocio}
            />
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default ElencoSoci;