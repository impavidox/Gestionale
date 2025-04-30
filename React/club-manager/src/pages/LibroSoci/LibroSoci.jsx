import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Row, Col, Button, Table, Modal, Alert } from 'react-bootstrap';
import TextField from '../../components/forms/TextField';
import SelectField from '../../components/forms/SelectField';
import activityService from '../../api/services/activityService';
import socioService from '../../api/services/socioService';
import { useApp } from '../../context/AppContext';
import Loader from '../../components/common/Loader';
import { formatDateDisplay } from '../../utils/dateUtils';

/**
 * Pagina per la gestione del libro soci
 */
const LibroSoci = () => {
  const { goNewTab } = useApp();
  
  // Stati per i filtri
  const [affiliazione, setAffiliazione] = useState(0);
  const [tesseraBegin, setTesseraBegin] = useState(1);
  const [tesseraEnd, setTesseraEnd] = useState(99999);
  const [tipoLista, setTipoLista] = useState(null);
  
  // Stati per i dati
  const [affiliazioni, setAffiliazioni] = useState([]);
  const [affiliazioniSocio, setAffilizioniSocio] = useState([]);
  const [elencoTipi, setElencoTipi] = useState([
    { code: 1, name: 'Effettivi', hd: 'Tipo di Socio' },
    { code: 2, name: 'Tesserati', hd: 'Tesserato' }
  ]);
  const [soci, setSoci] = useState([]);
  const [titolo, setTitolo] = useState('');
  const [headerList, setHeaderList] = useState('');
  
  // Stati per la selezione e modifica di un socio
  const [selectedSocio, setSelectedSocio] = useState(null);
  const [selectedFederazione, setSelectedFederazione] = useState(null);
  const [showUpdate, setShowUpdate] = useState(false);
  
  // Stati per errori e loading
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertVariant, setAlertVariant] = useState('danger');
  
  // Carica i dati all'avvio
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Carica affiliazioni per libro soci
        const affiliazioniResponse = await activityService.retrieveAffiliazione(1);
        setAffiliazioni(affiliazioniResponse.data);
        if (affiliazioniResponse.data.length > 0) {
          setAffiliazione(affiliazioniResponse.data[0].id);
        }
        
        // Carica affiliazioni per soci
        const affiliazioniSocioResponse = await activityService.retrieveAffiliazione(0);
        setAffilizioniSocio(affiliazioniSocioResponse.data);
        
        // Imposta tipo di default
        setTipoLista(elencoTipi[0]);
        
        setLoading(false);
      } catch (err) {
        console.error('Errore nel caricamento dei dati iniziali:', err);
        setError('Si è verificato un errore nel caricamento dei dati.');
        setAlertVariant('danger');
        setShowAlert(true);
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);
  
  // Gestione del cambio di affiliazione
  const handleAffiliationChange = (name, selectedValue) => {
    setAffiliazione(selectedValue.value.id);
  };
  
  // Gestione del cambio di tipo lista
  const handleTipoListaChange = (name, selectedValue) => {
    setTipoLista(selectedValue.value);
    setTitolo(`Libro Socio ${selectedValue.value.name}`);
    setHeaderList(selectedValue.value.hd);
  };
  
  // Gestione della ricerca
  const handleSearch = async () => {
    if (!tipoLista) {
      setError('Selezionare il tipo di lista');
      setAlertVariant('danger');
      setShowAlert(true);
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setShowAlert(false);
      
      const response = await socioService.retrieveLibroSocio(
        affiliazione,
        tesseraBegin,
        tesseraEnd,
        tipoLista.code
      );
      
      setSoci(response.data);
      
      setLoading(false);
    } catch (err) {
      console.error('Errore nella ricerca dei soci:', err);
      setError('Si è verificato un errore nella ricerca dei soci.');
      setAlertVariant('danger');
      setShowAlert(true);
      setLoading(false);
    }
  };
  
  // Gestione della stampa
  const handlePrint = () => {
    if (!tipoLista) {
      setError('Selezionare il tipo di lista');
      setAlertVariant('danger');
      setShowAlert(true);
      return;
    }
    
    goNewTab('stampa-libro-soci', {
      affiliazione,
      begin: tesseraBegin,
      end: tesseraEnd,
      tipo: tipoLista.code
    });
  };
  
  // Gestione della selezione di un socio
  const handleSelectSocio = (socio) => {
    if (tipoLista.code !== 2) return;
    
    setSelectedSocio(socio);
    
    // Cerca la federazione del socio
    if (socio.federazione) {
      const foundFederazione = affiliazioniSocio.find(
        f => f.descrizione.trim() === socio.federazione.trim()
      );
      if (foundFederazione) {
        setSelectedFederazione(foundFederazione);
      } else {
        setSelectedFederazione(affiliazioniSocio[0]);
      }
    } else {
      setSelectedFederazione(affiliazioniSocio[0]);
    }
    
    setShowUpdate(true);
  };
  
  // Gestione del cambio di federazione
  const handleFederazioneChange = (name, selectedValue) => {
    setSelectedFederazione(selectedValue.value);
  };
  
  // Gestione del salvataggio della federazione
  const handleSaveFederazione = async () => {
    if (!selectedSocio || !selectedFederazione) return;
    
    try {
      setLoading(true);
      
      const body = {
        id: selectedSocio.id,
        federazione: selectedFederazione.descrizione
      };
      
      await socioService.updateFederazione(body);
      
      // Ricarica i dati
      await handleSearch();
      
      setSuccess('Federazione aggiornata con successo');
      setAlertVariant('success');
      setShowAlert(true);
      setShowUpdate(false);
      
      setLoading(false);
    } catch (err) {
      console.error('Errore nell\'aggiornamento della federazione:', err);
      setError('Si è verificato un errore nell\'aggiornamento della federazione.');
      setAlertVariant('danger');
      setShowAlert(true);
      setLoading(false);
    }
  };
  
  return (
    <Container className="mt-4 mb-5">
      <h2 className="mb-4">Libro Soci</h2>
      
      {showAlert && (
        <Alert 
          variant={alertVariant} 
          onClose={() => setShowAlert(false)} 
          dismissible
        >
          {alertVariant === 'danger' ? error : success}
        </Alert>
      )}
      
      {loading && <Loader />}
      
      <Card className="mb-4">
        <Card.Header>
          <h5>Filtri</h5>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}>
            <Row>
              <Col md={6}>
                <SelectField
                  label="Tipo Lista"
                  name="tipoLista"
                  value={tipoLista}
                  options={elencoTipi}
                  onChange={handleTipoListaChange}
                  required
                />
              </Col>
              <Col md={6}>
                <SelectField
                  label="Affiliazione"
                  name="affiliazione"
                  value={affiliazioni.find(a => a.id === affiliazione)}
                  options={affiliazioni}
                  onChange={handleAffiliationChange}
                />
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <TextField
                  label="Numero Tessera Da"
                  name="tesseraBegin"
                  value={tesseraBegin}
                  onChange={(name, value) => setTesseraBegin(value)}
                  type="number"
                  min={1}
                />
              </Col>
              <Col md={6}>
                <TextField
                  label="Numero Tessera A"
                  name="tesseraEnd"
                  value={tesseraEnd}
                  onChange={(name, value) => setTesseraEnd(value)}
                  type="number"
                  min={1}
                />
              </Col>
            </Row>
            <div className="d-flex justify-content-end mt-3">
              <Button variant="primary" type="submit" className="me-2">
                Cerca
              </Button>
              <Button variant="outline-primary" onClick={handlePrint}>
                Stampa
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
      
      {soci.length > 0 && (
        <Card>
          <Card.Header>
            <h5>{titolo}</h5>
          </Card.Header>
          <Card.Body>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Tessera</th>
                  <th>Cognome</th>
                  <th>Nome</th>
                  <th>Codice Fiscale</th>
                  <th>Città</th>
                  <th>{headerList}</th>
                  {tipoLista.code === 2 && <th>Federazione</th>}
                  {tipoLista.code === 2 && <th>Azioni</th>}
                </tr>
              </thead>
              <tbody>
                {soci.map((socio) => (
                  <tr key={socio.id}>
                    <td>{socio.tesseraNumber || '---'}</td>
                    <td>{socio.cognome}</td>
                    <td>{socio.nome}</td>
                    <td>{socio.codeFiscale}</td>
                    <td>{socio.citta}</td>
                    <td>
                      {tipoLista.code === 1 
                        ? (socio.tipo?.descrizione || '---')
                        : (socio.tesseraNumber ? 'Sì' : 'No')
                      }
                    </td>
                    {tipoLista.code === 2 && <td>{socio.federazione || '---'}</td>}
                    {tipoLista.code === 2 && (
                      <td>
                        <Button 
                          variant="primary" 
                          size="sm"
                          onClick={() => handleSelectSocio(socio)}
                        >
                          Modifica
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
      
      {/* Modal per la modifica della federazione */}
      <Modal show={showUpdate} onHide={() => setShowUpdate(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Modifica Federazione</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedSocio && (
            <Form>
              <p>
                <strong>Socio:</strong> {selectedSocio.cognome} {selectedSocio.nome}
              </p>
              
              <SelectField
                label="Federazione"
                name="federazione"
                value={selectedFederazione}
                options={affiliazioniSocio}
                onChange={handleFederazioneChange}
                required
              />
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUpdate(false)}>
            Annulla
          </Button>
          <Button variant="primary" onClick={handleSaveFederazione} disabled={loading}>
            Salva
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default LibroSoci;