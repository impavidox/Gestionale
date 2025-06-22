import React, { useState, useEffect } from 'react';
import { Container, Tabs, Tab, Card, Button, Row, Col, Form, Alert, Table } from 'react-bootstrap';
import activityService from '../../api/services/activityService';
import parametriService from '../../api/services/parametriService';
import geographicService from '../../api/services/geographicService';
import utilityService from '../../api/services/utilityService';
import TextField from '../../components/forms/TextField';
import SelectField from '../../components/forms/SelectField';
import CheckboxField from '../../components/forms/CheckboxField';
import Loader from '../../components/common/Loader';
import AttivitaList from '../../components/attivita/AttivitaList';
import AttivitaForm from '../../components/attivita/AttivitaForm';
import { formatDateDisplay } from '../../utils/dateUtils';

/**
 * Pagina per la gestione dei parametri dell'applicazione
 */
const Parametri = () => {
  // Stato per la tab corrente
  const [activeTab, setActiveTab] = useState('attivita');
  
  // Stati per le diverse sezioni
  const [showAttivitaList, setShowAttivitaList] = useState(true);
  const [showAttivitaForm, setShowAttivitaForm] = useState(false);
  const [showComuneSearch, setShowComuneSearch] = useState(false);
  const [showNumeroTessera, setShowNumeroTessera] = useState(false);
  
  // Stati per i dati
  const [parameters, setParameters] = useState([]);
  const [families, setFamilies] = useState([]);
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [updateMode, setUpdateMode] = useState(false);
  
  // Stati per la ricerca comune
  const [nomeCommune, setNomeCommune] = useState('');
  const [comuni, setComuni] = useState([]);
  
  // Stati per numero tessera
  const [numeroTesseraSearch, setNumeroTesseraSearch] = useState('');
  const [abbonamenti, setAbbonamenti] = useState([]);
  const [selectedAbbonamento, setSelectedAbbonamento] = useState(null);
  const [numeroTesseraUpdate, setNumeroTesseraUpdate] = useState('');
  const [updateOptions, setUpdateOptions] = useState({
    updCtr: false,
    updEmpty: true
  });
  const [showUpdateTessera, setShowUpdateTessera] = useState(false);
  
  // Stati per errori e loading
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertVariant, setAlertVariant] = useState('danger');
  
  // Carica i dati iniziali
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // // Carica parametri
        // const paramsResponse = await parametriService.retrieveParameters();
        // setParameters(paramsResponse.data);
        
        // Carica famiglie
        const familiesResponse = await activityService.retrieveFamilies();
        setFamilies(familiesResponse.data);
        
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
  
  // Gestione del cambio tab
  const handleTabChange = (key) => {
    setActiveTab(key);
    
    // Reset stati
    setShowAttivitaList(true);
    setShowAttivitaForm(false);
    setShowComuneSearch(false);
    setShowNumeroTessera(false);
    setSelectedFamily(null);
    setSelectedActivity(null);
    setActivities([]);
    setNomeCommune('');
    setComuni([]);
    setNumeroTesseraSearch('');
    setAbbonamenti([]);
    setSelectedAbbonamento(null);
    setNumeroTesseraUpdate('');
    setShowUpdateTessera(false);
    
    if (key === 'comune') {
      setShowComuneSearch(true);
    } else if (key === 'numeroTessera') {
      setShowNumeroTessera(true);
    }
  };
  
  // Gestione selezione famiglia
  const handleFamilyChange = async (name, selectedValue) => {
    setSelectedFamily(selectedValue.value);
    console.log(selectedValue.value)
    setSelectedActivity(null);
    
    try {
      setLoading(true);
      
      const response = await activityService.retrieveFullActivitiesByFamily(selectedValue.value.value);
      setActivities(response.data.data);
      
      setLoading(false);
    } catch (err) {
      console.error('Errore nel caricamento delle attività:', err);
      setError('Si è verificato un errore nel caricamento delle attività.');
      setAlertVariant('danger');
      setShowAlert(true);
      setLoading(false);
    }
  };
  
  // Gestione creazione attività
  const handleCreateAttivita = () => {
    setSelectedActivity(null);
    setUpdateMode(false);
    setShowAttivitaList(false);
    setShowAttivitaForm(true);
  };
  
  // Gestione chiusura form attività
  const handleCloseAttivitaForm = async () => {
    setShowAttivitaForm(false);
    setShowAttivitaList(true);
    
    // Ricarica le attività
    if (selectedFamily) {
      try {
        const response = await activityService.retrieveFullActivitiesByFamily(selectedFamily.id);
        setActivities(response.data);
      } catch (err) {
        console.error('Errore nel ricaricamento delle attività:', err);
      }
    }
  };
  
  // Gestione selezione attività
  const handleActivitySelected = (activity) => {
    setSelectedActivity(activity);
    setUpdateMode(true);
    setShowAttivitaList(false);
    setShowAttivitaForm(true);
  };
  
  // Gestione ricerca comune
  const handleSearchComune = async () => {
    if (!nomeCommune) return;
    
    try {
      setLoading(true);
      
      const response = await geographicService.retrieveCommuneByName(nomeCommune);
      setComuni(response.data);
      
      setLoading(false);
    } catch (err) {
      console.error('Errore nella ricerca del comune:', err);
      setError('Si è verificato un errore nella ricerca del comune.');
      setAlertVariant('danger');
      setShowAlert(true);
      setLoading(false);
    }
  };
  
  // Gestione ricaricamento comuni
  const handleReloadCommuni = async () => {
    try {
      setLoading(true);
      
      await geographicService.rebuildCommunes();
      
      setSuccess('Comuni ricaricati con successo.');
      setAlertVariant('success');
      setShowAlert(true);
      setLoading(false);
    } catch (err) {
      console.error('Errore nel ricaricamento dei comuni:', err);
      setError('Si è verificato un errore nel ricaricamento dei comuni.');
      setAlertVariant('danger');
      setShowAlert(true);
      setLoading(false);
    }
  };
  
  // Gestione ricaricamento stati
  const handleReloadStati = async () => {
    try {
      setLoading(true);
      
      await geographicService.rebuildStates();
      
      setSuccess('Stati ricaricati con successo.');
      setAlertVariant('success');
      setShowAlert(true);
      setLoading(false);
    } catch (err) {
      console.error('Errore nel ricaricamento degli stati:', err);
      setError('Si è verificato un errore nel ricaricamento degli stati.');
      setAlertVariant('danger');
      setShowAlert(true);
      setLoading(false);
    }
  };
  
  // Gestione ricerca numero tessera
  const handleSearchNumeroTessera = async () => {
    if (!numeroTesseraSearch) return;
    
    try {
      setLoading(true);
      
      const response = await utilityService.retrieveAbbonamentoByTessera(numeroTesseraSearch);
      setAbbonamenti(response.data);
      
      setLoading(false);
    } catch (err) {
      console.error('Errore nella ricerca del numero tessera:', err);
      setError('Si è verificato un errore nella ricerca del numero tessera.');
      setAlertVariant('danger');
      setShowAlert(true);
      setLoading(false);
    }
  };
  
  // Gestione selezione abbonamento
  const handleSelectAbbonamento = (abbonamento) => {
    setSelectedAbbonamento(abbonamento);
    setNumeroTesseraUpdate(abbonamento.numeroTessera);
    setUpdateOptions({
      updCtr: false,
      updEmpty: true
    });
    setShowUpdateTessera(true);
  };
  
  // Gestione aggiornamento numero tessera
  const handleUpdateNumeroTessera = async () => {
    if (!selectedAbbonamento) return;
    
    try {
      setLoading(true);
      
      const body = {
        id: selectedAbbonamento.id,
        extend: updateOptions.updCtr,
        emtpy: updateOptions.updEmpty,
        tessera: numeroTesseraUpdate
      };
      
      const response = await utilityService.updateNumeroTessera(body);
      
      if (response.data.rc) {
        // Ricarica gli abbonamenti
        const abboResponse = await utilityService.retrieveAbbonamentoByTessera(numeroTesseraSearch);
        setAbbonamenti(abboResponse.data);
        
        setSuccess('Numero tessera aggiornato con successo.');
        setAlertVariant('success');
        setShowUpdateTessera(false);
      } else {
        setError(response.data.message || 'Si è verificato un errore nell\'aggiornamento del numero tessera.');
        setAlertVariant('danger');
      }
      
      setShowAlert(true);
      setLoading(false);
    } catch (err) {
      console.error('Errore nell\'aggiornamento del numero tessera:', err);
      setError('Si è verificato un errore nell\'aggiornamento del numero tessera.');
      setAlertVariant('danger');
      setShowAlert(true);
      setLoading(false);
    }
  };
  
  return (
    <Container className="mt-4 mb-5">
      <h2 className="mb-4">Parametri</h2>
      
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
      
      <Tabs
        activeKey={activeTab}
        onSelect={handleTabChange}
        className="mb-4"
      >
        <Tab eventKey="attivita" title="Attività">
          {showAttivitaList && (
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5>Gestione Attività</h5>
                <Button 
                  variant="success" 
                  onClick={handleCreateAttivita}
                >
                  Nuova Attività
                </Button>
              </Card.Header>
              <Card.Body>
                <Form>
                  <SelectField
                    label="Famiglia"
                    name="famiglia"
                    value={selectedFamily}
                    options={families}
                    onChange={handleFamilyChange}
                    placeholder="Seleziona una famiglia"
                  />
                </Form>
                
                {selectedFamily && activities.length > 0 && (
                  <AttivitaList 
                    activities={activities} 
                    onSelect={handleActivitySelected} 
                  />
                )}
              </Card.Body>
            </Card>
          )}
          
          {showAttivitaForm && (
            <AttivitaForm 
              activity={selectedActivity}
              famiglia={selectedFamily}
              updateMode={updateMode}
              onClose={handleCloseAttivitaForm} 
            />
          )}
        </Tab>
        
        <Tab eventKey="comune" title="Comuni">
          {showComuneSearch && (
            <Card>
              <Card.Header>
                <h5>Gestione Comuni</h5>
              </Card.Header>
              <Card.Body>
                <Row className="mb-4">
                  <Col md={6}>
                    <Button 
                      variant="primary" 
                      onClick={handleReloadCommuni}
                      className="me-2"
                    >
                      Ricarica Comuni
                    </Button>
                    <Button 
                      variant="outline-primary" 
                      onClick={handleReloadStati}
                    >
                      Ricarica Stati
                    </Button>
                  </Col>
                </Row>
                
                <Form onSubmit={(e) => {
                  e.preventDefault();
                  handleSearchComune();
                }}>
                  <Row className="align-items-end">
                    <Col md={9}>
                      <TextField
                        label="Nome Comune"
                        name="nomeCommune"
                        value={nomeCommune}
                        onChange={(name, value) => setNomeCommune(value)}
                        placeholder="Inserisci il nome del comune"
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
                
                {comuni.length > 0 && (
                  <div className="mt-4">
                    <h6>Risultati della ricerca</h6>
                    <Table striped bordered hover responsive>
                      <thead>
                        <tr>
                          <th>Codice</th>
                          <th>Comune</th>
                          <th>Provincia</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comuni.map((comune, index) => (
                          <tr key={index}>
                            <td>{comune.code}</td>
                            <td>{comune.description}</td>
                            <td>{comune.provCode}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}
        </Tab>
        
        <Tab eventKey="numeroTessera" title="Numero Tessera">
          {showNumeroTessera && (
            <Card>
              <Card.Header>
                <h5>Gestione Numero Tessera</h5>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={(e) => {
                  e.preventDefault();
                  handleSearchNumeroTessera();
                }}>
                  <Row className="align-items-end">
                    <Col md={9}>
                      <TextField
                        label="Numero Tessera"
                        name="numeroTesseraSearch"
                        value={numeroTesseraSearch}
                        onChange={(name, value) => setNumeroTesseraSearch(value)}
                        placeholder="Inserisci il numero di tessera"
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
                
                {abbonamenti.length > 0 && (
                  <div className="mt-4">
                    <h6>Abbonamenti trovati</h6>
                    <Table striped bordered hover responsive>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Numero Tessera</th>
                          <th>Socio</th>
                          <th>Data Iscrizione</th>
                          <th>Azioni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {abbonamenti.map((abbonamento) => (
                          <tr key={abbonamento.id}>
                            <td>{abbonamento.id}</td>
                            <td>{abbonamento.numeroTessera}</td>
                            <td>{abbonamento.nomeSocio} {abbonamento.cognomeSocio}</td>
                            <td>{formatDateDisplay(abbonamento.dataIscrizione)}</td>
                            <td>
                              <Button 
                                variant="primary" 
                                size="sm"
                                onClick={() => handleSelectAbbonamento(abbonamento)}
                              >
                                Modifica
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                    
                    {/* Modal per l'aggiornamento del numero tessera */}
                    {showUpdateTessera && selectedAbbonamento && (
                      <div className="modal show d-block" tabIndex="-1">
                        <div className="modal-dialog">
                          <div className="modal-content">
                            <div className="modal-header">
                              <h5 className="modal-title">Aggiorna Numero Tessera</h5>
                              <button 
                                type="button" 
                                className="btn-close" 
                                onClick={() => setShowUpdateTessera(false)}
                              ></button>
                            </div>
                            <div className="modal-body">
                              <Form>
                                <TextField
                                  label="Nuovo Numero Tessera"
                                  name="numeroTesseraUpdate"
                                  value={numeroTesseraUpdate}
                                  onChange={(name, value) => setNumeroTesseraUpdate(value)}
                                  required
                                />
                                
                                <CheckboxField
                                  label="Aggiorna controllo"
                                  name="updCtr"
                                  checked={updateOptions.updCtr}
                                  onChange={(name, value) => setUpdateOptions(prev => ({ ...prev, updCtr: value }))}
                                />
                                
                                <CheckboxField
                                  label="Aggiorna campo vuoto"
                                  name="updEmpty"
                                  checked={updateOptions.updEmpty}
                                  onChange={(name, value) => setUpdateOptions(prev => ({ ...prev, updEmpty: value }))}
                                />
                              </Form>
                            </div>
                            <div className="modal-footer">
                              <Button 
                                variant="secondary" 
                                onClick={() => setShowUpdateTessera(false)}
                              >
                                Annulla
                              </Button>
                              <Button 
                                variant="primary" 
                                onClick={handleUpdateNumeroTessera}
                                disabled={loading}
                              >
                                Aggiorna
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="modal-backdrop show"></div>
                      </div>
                    )}
                  </div>
                )}
              </Card.Body>
            </Card>
          )}
        </Tab>
      </Tabs>
    </Container>
  );
};

export default Parametri;