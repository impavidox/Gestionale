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
  const [sezioni, setSezioni] = useState([]);
  const [selectedSezione, setSelectedSezione] = useState(null);
  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [updateMode, setUpdateMode] = useState(false);
  
  // Stati per la ricerca comune
  const [nomecomune, setNomecomune] = useState('');
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
        
        // Carica sezioni
        const sezioniResponse = await activityService.retrieveSezioni();
        setSezioni(sezioniResponse.data.data);
        
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
    setSelectedSezione(null);
    setSelectedActivity(null);
    setActivities([]);
    setNomecomune('');
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
  
  // Gestione selezione sezione
  const handleSezioneChange = async (name, selectedValue) => {
    setSelectedSezione(selectedValue.value);
    setSelectedActivity(null);
    
    try {
      setLoading(true);
      const response = await activityService.retrieveActivitiesBySezione(sezioni.find(item=>item.nome===selectedValue.value.value).id);
      setActivities(response.data.data);
      console.log(response.data.data)
      
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
    if (selectedSezione) {
      try {
        const response = await activityService.retrieveActivitiesBySezione(selectedSezione.id);
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
                <h5>Gestione Attività per Sezione</h5>
                <Button 
                  variant="success" 
                  onClick={handleCreateAttivita}
                  disabled={!selectedSezione}
                >
                  Nuova Attività
                </Button>
              </Card.Header>
              <Card.Body>
                <Form>
                  <SelectField
                    label="Sezione"
                    name="sezione"
                    value={selectedSezione}
                    options={sezioni.map(sezione => sezione.nome)}
                    onChange={handleSezioneChange}
                    placeholder="Seleziona una sezione"
                    required
                  />
                </Form>
                
                {selectedSezione && (
                  <div className="mt-3">
                    <h6>Sezione selezionata: <strong>{selectedSezione.nome}</strong></h6>
                    <p className="text-muted">
                      {activities.length} attività trovate
                    </p>
                  </div>
                )}
                
                {selectedSezione && activities.length > 0 && (
                  <div className="mt-4">
                    <Table striped bordered hover responsive>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Nome</th>
                          <th>Codice</th>
                          <th>Email Referente</th>
                          <th>Azioni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activities.map((activity) => (
                          <tr key={activity.id}>
                            <td>{activity.id}</td>
                            <td>{activity.nome}</td>
                            <td>
                              {activity.codice ? (
                                <span className="badge bg-secondary">{activity.codice}</span>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              {activity.emailReferente ? (
                                <a href={`mailto:${activity.emailReferente}`}>
                                  {activity.emailReferente}
                                </a>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                <Button 
                                  variant="primary" 
                                  size="sm"
                                  onClick={() => handleActivitySelected(activity)}
                                >
                                  Modifica
                                </Button>
                                <Button 
                                  variant="outline-danger" 
                                  size="sm"
                                  onClick={() => handleDeleteActivity(activity)}
                                >
                                  Elimina
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
                
                {selectedSezione && activities.length === 0 && (
                  <div className="text-center mt-4">
                    <p className="text-muted">Nessuna attività trovata per questa sezione.</p>
                    <p className="text-muted">Clicca su "Nuova Attività" per crearne una.</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}
          
          {showAttivitaForm && (
            <AttivitaFormSezione 
              activity={selectedActivity}
              sezione={selectedSezione}
              updateMode={updateMode}
              onClose={handleCloseAttivitaForm}
              onSuccess={(message) => {
                setSuccess(message);
                setAlertVariant('success');
                setShowAlert(true);
              }}
              onError={(message) => {
                setError(message);
                setAlertVariant('danger');
                setShowAlert(true);
              }}
            />
          )}
        </Tab> 
      </Tabs>
    </Container>
  );
  
  // Gestione eliminazione attività
  const handleDeleteActivity = async (activity) => {
    if (!window.confirm(`Sei sicuro di voler eliminare l'attività "${activity.nome}"?`)) {
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await activityService.removeActivity({ attId: activity.id });
      
      if (response.data.rc) {
        setSuccess('Attività eliminata con successo.');
        setAlertVariant('success');
        setShowAlert(true);
        
        // Ricarica le attività
        const activitiesResponse = await activityService.retrieveActivitiesBySezione(selectedSezione.id);
        setActivities(activitiesResponse.data);
      } else {
        throw new Error(response.data.message || 'Errore durante l\'eliminazione');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Errore nell\'eliminazione dell\'attività:', err);
      setError(err.message || 'Si è verificato un errore durante l\'eliminazione dell\'attività.');
      setAlertVariant('danger');
      setShowAlert(true);
      setLoading(false);
    }
  };
};

/**
 * Componente per il form di creazione/modifica attività per sezione
 */
const AttivitaFormSezione = ({ activity, sezione, updateMode = false, onClose, onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    nome: '',
    codice: '',
    emailReferente: ''
  });
  
  const [federazioni, setFederazioni] = useState([]);
  const [selectedFederazione, setSelectedFederazione] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Carica federazioni
  useEffect(() => {
    const fetchFederazioni = async () => {
      try {
        const response = await activityService.retrieveFamilies();
        setFederazioni(response.data.data);
      } catch (error) {
        console.error('Errore nel caricamento delle federazioni:', error);
        onError('Errore nel caricamento delle federazioni.');
      }
    };
    
    fetchFederazioni();
  }, []);
  
  // Imposta i dati iniziali
  useEffect(() => {
    if (activity && updateMode) {
      setFormData({
        nome: activity.nome || '',
        codice: activity.codice || '',
        emailReferente: activity.emailReferente || ''
      });
      
      // Trova la federazione corrispondente
      if (activity.federazioneId && federazioni.length > 0) {
        const federazione = federazioni.find(f => f.id === activity.federazioneId);
        setSelectedFederazione(federazione);
      }
    }
  }, [activity, updateMode, federazioni]);
  
  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFederazioneChange = (name, selectedValue) => {
    setSelectedFederazione(selectedValue.value);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nome) {
      onError('Il nome dell\'attività è obbligatorio.');
      return;
    }
    
    if (!selectedFederazione) {
      onError('Selezionare una federazione per l\'attività.');
      return;
    }
    
    try {
      setLoading(true);
      
      const body = {
        nome: formData.nome,
        federazioneId: selectedFederazione.id,
        sezioneId: sezione.id,
        codice: formData.codice || null,
        emailReferente: formData.emailReferente || null
      };
      
      if (updateMode && activity) {
        body.id = activity.id;
      }
      
      const response = await activityService.updateActivity(body);
      
      if (response.data.rc) {
        onSuccess(updateMode ? 'Attività aggiornata con successo.' : 'Attività creata con successo.');
        
        if (!updateMode) {
          // Reset form per nuova creazione
          setFormData({
            nome: '',
            codice: '',
            emailReferente: ''
          });
          setSelectedFederazione(null);
        }
      } else {
        throw new Error(response.data.message || 'Errore durante il salvataggio');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Errore nel salvataggio dell\'attività:', error);
      onError(error.message || 'Si è verificato un errore durante il salvataggio dell\'attività.');
      setLoading(false);
    }
  };
  
  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5>{updateMode ? 'Modifica Attività' : 'Nuova Attività'}</h5>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Chiudi
        </Button>
      </Card.Header>
      <Card.Body>
        <div className="mb-3">
          <strong>Sezione:</strong> {sezione.nome}
        </div>
        
        <Form onSubmit={handleSubmit}>
          <Row className="mb-3">
            <Col>
              <SelectField
                label="Federazione"
                name="federazione"
                value={selectedFederazione ? { value: selectedFederazione } : null}
                options={federazioni.map(fed => ({
                  value: fed,
                  label: fed.nome
                }))}
                onChange={handleFederazioneChange}
                placeholder="Seleziona una federazione"
                required
              />
            </Col>
          </Row>
          
          <Row className="mb-3">
            <Col>
              <TextField
                label="Nome Attività"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
              />
            </Col>
          </Row>
          
          <Row className="mb-3">
            <Col md={6}>
              <TextField
                label="Codice"
                name="codice"
                value={formData.codice}
                onChange={handleChange}
                placeholder="Codice identificativo (opzionale)"
              />
            </Col>
            <Col md={6}>
              <TextField
                label="Email Referente"
                name="emailReferente"
                type="email"
                value={formData.emailReferente}
                onChange={handleChange}
                placeholder="email@esempio.it (opzionale)"
              />
            </Col>
          </Row>
          
          <div className="d-flex justify-content-end mt-4">
            <Button 
              variant="primary" 
              type="submit"
              disabled={loading}
            >
              {loading ? 'Salvataggio...' : (updateMode ? 'Aggiorna' : 'Crea')}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default Parametri;