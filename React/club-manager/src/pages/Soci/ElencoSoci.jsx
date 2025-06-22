import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import SocioFilters from '../../components/soci/SocioFilters';
import SocioList from '../../components/soci/SocioList';
import SocioForm from '../../components/soci/SocioForm';
import socioService from '../../api/services/socioService';

/**
 * Pagina per l'elenco e la gestione dei soci
 */
const ElencoSoci = () => {
  const navigate = useNavigate();
  const { goNewTab } = useApp();
  
  // Stati per la gestione della pagina
  const [soci, setSoci] = useState([]);
  const [filtri, setFiltri] = useState({
    cognome: null,
    scadenza: 0,
    attivita: 0,
    scadute: false,
    anno: 0
  });
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showDetailSocio, setShowDetailSocio] = useState(false);
  const [selectedSocio, setSelectedSocio] = useState(null);
  const [loading, setLoading] = useState(false);

  // Esegue la ricerca dei soci
  const fetchSoci = async (filters) => {
    setLoading(true);
    try {
      const response = await socioService.retrieveSocio(
        null, // nome
        filters.cognome,
        filters.scadenza,
        filters.attivita,
        filters.scadute,
        filters.anno
      );
      console.log(response.data)
      setSoci(response.data.data.items);
      console.log(soci)
      setShowSearchResults(true);
      setShowDetailSocio(false);
    } catch (error) {
      console.error('Errore nella ricerca dei soci:', error);
      alert('Si è verificato un errore durante la ricerca dei soci. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  // Gestione della ricerca
  const handleSearch = (newFilters) => {
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

  // Gestione della selezione di un socio
  const handleSelectSocio = (socio) => {
    setSelectedSocio(socio);
    setShowDetailSocio(true);
    setShowSearchResults(false);
  };

  // Gestione del salvataggio di un socio
  const handleSaveSocio = (socio) => {
    // Aggiorna la lista dei soci
    fetchSoci(filtri);
  };

  // Gestione della chiusura del dettaglio
  const handleCloseDetail = () => {
    setShowDetailSocio(false);
    setShowSearchResults(true);
    setSelectedSocio(null);
  };

  return (
    <Container className="mt-4 mb-5">
      <h2 className="mb-4">Gestione Soci</h2>
      
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
                  <h4>Risultati della ricerca</h4>
                  <Button
                    variant="success"
                    onClick={() => navigate('/soci/nuovo')}
                  >
                    Nuovo Socio
                  </Button>
                </div>
                
                <SocioList
                  soci={soci}
                  onSelect={handleSelectSocio}
                  onRefresh={() => fetchSoci(filtri)}
                />
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