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
      </Tabs>
    </Container>
  );
};

export default Parametri;