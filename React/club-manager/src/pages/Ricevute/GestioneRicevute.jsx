import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { useApp } from '../../context/AppContext';
import TextField from '../../components/forms/TextField';
import RicevutaList from '../../components/ricevute/RicevutaList';
import Loader from '../../components/common/Loader';
import SocioList from '../../components/soci/SocioList';
import socioService from '../../api/services/socioService';
import ricevutaService from '../../api/services/ricevutaService';

/**
 * Pagina per la gestione delle ricevute
 */
const GestioneRicevute = () => {
  // Stati per la gestione della pagina
  const [viewSociList, setViewSociList] = useState(true);
  const [viewRicevuteList, setViewRicevuteList] = useState(false);
  const [viewScelta, setViewScelta] = useState(false);
  
  // Stati per i dati
  const [cognome, setCognome] = useState('');
  const [soci, setSoci] = useState([]);
  const [ricevute, setRicevute] = useState([]);
  const [selectedSocio, setSelectedSocio] = useState(null);
  
  // Stati per il caricamento e gli errori
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  
  const { goNewTab } = useApp();
  
  // Gestione della ricerca dei soci
  const handleSearch = async () => {
    if (!cognome) {
      setError('Inserisci un cognome per la ricerca');
      setShowError(true);
      return;
    }
    
    setLoading(true);
    setError('');
    setShowError(false);
    
    try {
      const response = await socioService.retrieveSocio(null, cognome, 0, 0, false, 0);
      setSoci(response.data);
    } catch (err) {
      console.error('Errore nella ricerca dei soci:', err);
      setError('Si è verificato un errore nella ricerca dei soci.');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };
  
  // Gestione della selezione di un socio
  const handleSocioSelect = (socio) => {
    if (socio.tesseraNumber === 0) {
      setError(`Il socio ${socio.nome} ${socio.cognome} non è iscritto per l'anno corrente.`);
      setShowError(true);
      return;
    }
    
    setSelectedSocio(socio);
    setViewScelta(true);
  };
  
  // Chiude il modale di selezione
  const handleCloseScelta = () => {
    setViewScelta(false);
    setSelectedSocio(null);
  };
  
  // Gestione della creazione di una nuova ricevuta
  const handleNuovaRicevuta = () => {
    goNewTab('ricevute/stampa', {
      idsocio: selectedSocio.id,
      reprint: 0
    });
    
    setViewScelta(false);
  };
  
  // Gestione della stampa della scheda
  const handleStampaScheda = () => {
    goNewTab('schede/stampa', {
      idsocio: selectedSocio.id
    });
    
    setViewScelta(false);
  };
  
  // Gestione della visualizzazione delle ricevute
  const handleViewRicevute = async () => {
    setLoading(true);
    setError('');
    setShowError(false);
    
    try {
      const response = await ricevutaService.retrieveRicevutaForUser(
        selectedSocio.id,
        selectedSocio.tesseraNumber
      );
      
      setRicevute(response.data);
      setViewSociList(false);
      setViewScelta(false);
      setViewRicevuteList(true);
    } catch (err) {
      console.error('Errore nel recupero delle ricevute:', err);
      setError('Si è verificato un errore nel recupero delle ricevute.');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };
  
  // Gestione del ritorno alla lista dei soci
  const handleBackToSoci = () => {
    setViewSociList(true);
    setViewRicevuteList(false);
    setSelectedSocio(null);
  };
  
  // Aggiorna la lista delle ricevute
  const handleUpdateRicevute = async () => {
    if (!selectedSocio) return;
    
    setLoading(true);
    
    try {
      const response = await ricevutaService.retrieveRicevutaForUser(
        selectedSocio.id,
        selectedSocio.tesseraNumber
      );
      
      setRicevute(response.data);
    } catch (err) {
      console.error('Errore nell\'aggiornamento delle ricevute:', err);
      setError('Si è verificato un errore nell\'aggiornamento delle ricevute.');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container className="mt-4 mb-5">
      <h2 className="mb-4">Gestione Ricevute</h2>
      
      {showError && (
        <Alert variant="danger" onClose={() => setShowError(false)} dismissible>
          {error}
        </Alert>
      )}
      
      {loading && <Loader />}
      
      {viewSociList && (
        <>
          <Card className="mb-4">
            <Card.Header>Ricerca Socio</Card.Header>
            <Card.Body>
              <Form onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}>
                <Row className="align-items-end">
                  <Col md={9}>
                    <TextField
                      label="Cognome"
                      name="cognome"
                      value={cognome}
                      onChange={(name, value) => setCognome(value)}
                      placeholder="Inserisci il cognome del socio"
                    />
                  </Col>
                  <Col md={3}>
                    <Button 
                      variant="primary" 
                      type="submit" 
                      className="w-100"
                      disabled={loading}
                    >
                      Cerca
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
          
          {soci.length > 0 && (
            <Card>
              <Card.Header>Risultati della ricerca</Card.Header>
              <Card.Body>
                <SocioList 
                  soci={soci}
                  onSelect={handleSocioSelect}
                />
              </Card.Body>
            </Card>
          )}
          
          {/* Modal per la scelta dell'operazione */}
          {viewScelta && selectedSocio && (
            <div className="modal show d-block" tabIndex="-1">
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">
                      {selectedSocio.cognome} {selectedSocio.nome}
                    </h5>
                    <button 
                      type="button" 
                      className="btn-close" 
                      onClick={handleCloseScelta}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <div className="d-grid gap-2">
                      <Button variant="primary" onClick={handleNuovaRicevuta}>
                        Nuova Ricevuta
                      </Button>
                      <Button variant="info" onClick={handleStampaScheda}>
                        Stampa Scheda
                      </Button>
                      <Button variant="success" onClick={handleViewRicevute}>
                        Visualizza Ricevute
                      </Button>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <Button variant="secondary" onClick={handleCloseScelta}>
                      Chiudi
                    </Button>
                  </div>
                </div>
              </div>
              <div className="modal-backdrop show"></div>
            </div>
          )}
        </>
      )}
      
      {viewRicevuteList && (
        <RicevutaList 
          ricevute={ricevute}
          onBack={handleBackToSoci}
          onUpdate={handleUpdateRicevute}
        />
      )}
    </Container>
  );
};

export default GestioneRicevute;