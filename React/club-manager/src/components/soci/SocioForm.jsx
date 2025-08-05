import React, { useState, useEffect } from 'react';
import { Card, Form, Row, Col, Button, Alert, Nav, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import TextField from '../forms/TextField';
import DateField from '../forms/DateField';
import SelectField from '../forms/SelectField';
import CheckboxField from '../forms/CheckboxField';
import socioService from '../../api/services/socioService';
import geographicService from '../../api/services/geographicService';
import activityService from '../../api/services/activityService';
import AbbonamentoForm from '../abbonamenti/AbbonamentoForm';
import { formatDateForApi } from '../../utils/dateUtils';
import { isValidCodiceFiscale, isValidCAP, isValidPhone, isValidEmail } from '../../utils/validationUtils';

/**
 * Componente per la creazione e modifica di un socio
 * 
 * @param {Object} props - Props del componente
 * @param {Object} props.existingSocio - Dati del socio esistente (solo in modalità modifica)
 * @param {string} props.mode - Modalità del form: 'C' per creazione, 'U' per update
 * @param {Function} props.onSave - Callback da chiamare dopo il salvataggio con successo
 */
const SocioForm = ({ existingSocio, mode = 'C', onSave }) => {
  const navigate = useNavigate();
  const { goNewTab } = useApp();
  
  // Stati per il form
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    sesso: 1,
    privacy: 0,
    birthJJ: '',
    birthMM: '',
    anno: '',
    address: '',
    cap: '',
    // Changed: tipoSocio is now an object with multiple selections
    tipoSocio: {
      effettivo: false,
      tesserato: false,
      volontario: false
    },
    certifica: null,
    competition: 0,
    telefono: '',
    email: '',
    federazione: '',
    activityId: null
  });
  
  // Stati per dati correlati
  const [birthProv, setBirthProv] = useState(null);
  const [birthcomune, setBirthcomune] = useState(null);
  const [birthCode, setBirthCode] = useState(null);
  const [resProv, setResProv] = useState(null);
  const [rescomune, setRescomune] = useState(null);
  
  // Stati per dati di selezione
  const [listProvNascita, setListProvNascita] = useState([]);
  const [listProv, setListProv] = useState([]);
  const [listCodes,setListProvCodes]=useState([]);
  const [listCommNascita, setListCommNascita] = useState([]);
  const [listCommRes, setListCommRes] = useState([]);
  const [listTipiSocio, setListTipiSocio] = useState([]);
  const [federazioneList, setFederazioneList] = useState([]);
  const [activitiesList, setActivitiesList] = useState([]);
  
  // Stati per i selettori
  const [selectedSesso, setSelectedSesso] = useState({ value: { id: 1, name: 'Maschio' } });
  const [selectedProv, setSelectedProv] = useState(null);
  const [selectedComm, setSelectedComm] = useState(null);
  const [provRes, setProvRes] = useState(null);
  const [commRes, setCommRes] = useState(null);
  const [selectedMM, setSelectedMM] = useState(null);
  const [selectedFederazione, setSelectedFederazione] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  
  // Stati per la UI
  const [viewFede, setViewFede] = useState(false);
  const [viewAlert, setViewAlert] = useState(false);
  const [viewAlert1, setViewAlert1] = useState(false);
  const [viewAbo, setViewAbo] = useState(false);
  const [viewContinue, setViewContinue] = useState(false);
  const [viewError, setViewError] = useState(false);
  
  // Stati per notifiche ed errori
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [socioCreated, setSocioCreated] = useState(null);
  
  // Stati per la scheda
  const [activeTab, setActiveTab] = useState('anagrafica');
  
  // Opzioni per selettori
  const sessoArray = [
    { id: 1, name: 'M' },
    { id: 2, name: 'F' },
  ];
  
  const mmvalue = [
    { label: "Gennaio", id: "01" },
    { label: "Febbraio", id: "02" },
    { label: "Marzo", id: "03" },
    { label: "Aprile", id: "04" },
    { label: "Maggio", id: "05" },
    { label: "Giugno", id: "06" },
    { label: "Luglio", id: "07" },
    { label: "Agosto", id: "08" },
    { label: "Settembre", id: "09" },
    { label: "Ottobre", id: "10" },
    { label: "Novembre", id: "11" },
    { label: "Dicembre", id: "12" }
  ];
  
  // Carica i dati iniziali
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Carica province
        const provinceNascitaResponse = await geographicService.retrieveProvince();
        const province = provinceNascitaResponse.data.data.map(item => item.nome);
        const provinceCodes= provinceNascitaResponse.data.data;
        setListProvCodes(provinceCodes);
        setListProvNascita(province);
        setListProv(province);
        
        // Carica tipi socio (now just for reference, not used in selector)
        const tipiSocioResponse = ['Effettivo','Tesserato','Volontario'];
        setListTipiSocio(tipiSocioResponse);
        
        // Carica federazioni
        const federazioniResponse = await activityService.retrieveFamilies(); 
        setFederazioneList(federazioniResponse.data.data);
        
        setLoading(false);
      } catch (error) {
        console.error('Errore nel caricamento dei dati iniziali:', error);
        setError('Si è verificato un errore nel caricamento dei dati iniziali.');
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [mode]);
  
  // Carica i dati del socio esistente
  useEffect(() => {
    if (mode === 'U' && existingSocio) {
      try {
        const loadExistingSocio = async () => {
          setLoading(true);
          
          // Estrai dati di nascita
          const dObj = {};
          if (existingSocio.birhDate) {
            const birthDate = new Date(existingSocio.birhDate);
            dObj.jj = birthDate.getDate();
            dObj.mm = birthDate.getMonth();
            dObj.yyyy = birthDate.getFullYear();
          }
          
          // Convert existing tipo socio to checkbox format
          const tipoSocioCheckboxes = {
            effettivo: existingSocio.isEffettivo ? 1 : 0,
            tesserato: existingSocio.isTesserato ? 1 : 0,
            volontario: existingSocio.isVolontario ? 1 : 0
          };
          
          // Show federation dropdown if tesserato is selected
          if (existingSocio.isTesserato) {
            setViewFede(true);
          }
          
          // Imposta i dati del form
          setFormData({
            nome: existingSocio.nome || '',
            cognome: existingSocio.cognome || '',
            privacy: existingSocio.privacy === undefined ? true : existingSocio.privacy,
            birthJJ: dObj.jj || '',
            anno: dObj.yyyy || '',
            address: existingSocio.indirizzo || '',
            cap: existingSocio.cap || '',
            telefono: existingSocio.tel || '',
            email: existingSocio.email || '',
            certifica: existingSocio.dateCertificat ? new Date(existingSocio.dateCertificat) : null,
            competition: existingSocio.typeCertificat || false,
            federazione: existingSocio.federazione || '',
            tipoSocio: tipoSocioCheckboxes,
            activityId: existingSocio.activityId || null
          });
          
          // Imposta il sesso
          const sessoIndex = (existingSocio.sesso || 1) - 1;
          setSelectedSesso({ value: sessoArray[sessoIndex] });
          
          // Imposta il mese di nascita
          if (dObj.mm !== undefined) {
            setSelectedMM({ value: mmvalue[dObj.mm] });
          }
          
          // Imposta i dati di nascita
          setBirthcomune(existingSocio.birthCity);
          setBirthCode(existingSocio.birthCityCode);
          setBirthProv(existingSocio.birthProv);
          
          // Carica i comuni di nascita
          if (existingSocio.birthProv) {
            const communiResponse = await geographicService.retrievecomune(existingSocio.birthProv.trim());
            setListCommNascita(communiResponse.data);
            
            // Seleziona il comune di nascita
            const foundcomune = communiResponse.data.find(comm => 
              comm.description.trim() === existingSocio.birthCity.trim()
            );
            if (foundcomune) {
              setSelectedComm({ value: foundcomune });
            }
            
            // Seleziona la provincia di nascita
            const foundProv = listProvNascita.find(prov => 
              prov.description.trim() === existingSocio.birthProv.trim()
            );
            if (foundProv) {
              setSelectedProv({ value: foundProv });
            }
          }
          
          // Imposta i dati di residenza
          setResProv(existingSocio.provRes);
          setRescomune(existingSocio.citta);
          
          // Carica i comuni di residenza
          if (existingSocio.provRes) {
            const communiResResponse = await geographicService.retrievecomune(existingSocio.provRes.trim());
            setListCommRes(communiResResponse.data);
            
            // Seleziona il comune di residenza
            const foundCommRes = communiResResponse.data.find(comm => 
              comm.description.trim() === existingSocio.citta.trim()
            );
            if (foundCommRes) {
              setCommRes({ value: foundCommRes });
            }
            
            // Seleziona la provincia di residenza
            const foundProvRes = listProv.find(prov => 
              prov.description.trim() === existingSocio.provRes.trim()
            );
            if (foundProvRes) {
              setProvRes({ value: foundProvRes });
            }
          }
          
          // Seleziona la federazione se tesserato
          if (tipoSocioCheckboxes.tesserato && existingSocio.federazione) {
            const foundFederazione = federazioneList.find(fed => 
              fed === existingSocio.federazione || fed.descrizione === existingSocio.federazione
            );
            if (foundFederazione) {
              setSelectedFederazione({ value: foundFederazione });
              
              // Load activities for the existing federation
              try {
                const federationId = foundFederazione.id || foundFederazione;
                const activitiesResponse = await activityService.retrieveActivitiesByFederation(federationId);
                const activities = activitiesResponse.data || activitiesResponse;
                setActivitiesList(activities);
                
                // Select existing activity if present
                if (existingSocio.activityId) {
                  const foundActivity = activities.find(activity => 
                    activity.id === existingSocio.activityId
                  );
                  if (foundActivity) {
                    setSelectedActivity({ value: foundActivity });
                  }
                }
              } catch (error) {
                console.error('Errore nel caricamento delle attività:', error);
                // Fallback data for testing
                const fallbackActivities = [
                  { id: 1, name: 'Pallavolo', description: 'Pallavolo' },
                  { id: 2, name: 'Calcio', description: 'Calcio' },
                  { id: 3, name: 'Tennis', description: 'Tennis' }
                ];
                setActivitiesList(fallbackActivities);
                
                if (existingSocio.activityId) {
                  const foundActivity = fallbackActivities.find(activity => 
                    activity.id === existingSocio.activityId
                  );
                  if (foundActivity) {
                    setSelectedActivity({ value: foundActivity });
                  }
                }
              }
            }
          }
          
          setLoading(false);
        };
        
        loadExistingSocio();
      } catch (error) {
        console.error('Errore nel caricamento dei dati del socio esistente:', error);
        setError('Si è verificato un errore nel caricamento dei dati del socio.');
        setLoading(false);
      }
    }
  }, [existingSocio, mode, listProvNascita, listProv, federazioneList]);
  
  // Gestione cambiamento dei campi
  const handleChange = (name, value) => {
    // Check if it's a tipoSocio checkbox
    if (name.startsWith('tipoSocio.')) {
      const tipoKey = name.split('.')[1]; // Get 'effettivo', 'tesserato', or 'volontario'
      const numericValue = value ? 1 : 0;
      
      setFormData(prev => ({
        ...prev,
        tipoSocio: {
          ...prev.tipoSocio,
          [tipoKey]: numericValue
        }
      }));
      
      // Show/hide federation dropdown based on tesserato checkbox
      if (tipoKey === 'tesserato') {
        setViewFede(value);
        if (!value) {
          // Clear federation if tesserato is unchecked
          setSelectedFederazione(null);
          setSelectedActivity(null);
          setActivitiesList([]);
          setFormData(prev => ({ ...prev, federazione: '', activityId: null }));
        }
      }
    } else if (typeof value === 'boolean') {
      // Convert the boolean to 1 (true) or 0 (false) for other checkboxes
      const numericValue = value ? 1 : 0;
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else {
      // For all other inputs, use the value as is
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // Gestione selezione mese di nascita
  const handleBirthMMS = (name, selectedOption) => {
    setSelectedMM(selectedOption.value);
  };
  
  // Gestione selezione provincia di nascita
  const handleProvNascitaSelected = async (name, selectedOption) => {
    setSelectedProv(selectedOption.value);
    setBirthProv(selectedOption.value.value);
    
    try {
      const response = await geographicService.retrievecomune(selectedOption.value.value);
      const comuni =  response.data.data.map(item => item.nome);
      setListCommNascita(comuni);
    } catch (error) {
      console.error('Errore nel caricamento dei comuni:', error);
    }
  };
  
  // Gestione selezione provincia di residenza
  const handleProvResSelected = async (name, selectedOption) => {
    setProvRes(selectedOption.value);
    setResProv(selectedOption.value.value);
    
    try {
      const response = await geographicService.retrievecomune(selectedOption.value.value);
      const comuni =  response.data.data.map(item => item.nome);
      setListCommRes(comuni);
    } catch (error) {
      console.error('Errore nel caricamento dei comuni:', error);
    }
  };
  
  // Gestione selezione comune di nascita
  const handlecomuneNascitaSelected = (name, selectedOption) => {
    setSelectedComm(selectedOption.value);
    setBirthcomune(selectedOption.value.value);
  };
  
  // Gestione selezione comune di residenza
  const handlecomuneResSelected = (name, selectedOption) => {
    setCommRes(selectedOption.value);
    setRescomune(selectedOption.value.value);
  };
  
  // Gestione selezione sesso
  const handleSessoSelected = (name, selectedOption) => {
    setSelectedSesso(selectedOption.value);
    setFormData(prev => ({ ...prev, sesso: selectedOption.value.id }));
  };
  
  // Gestione selezione federazione
  const handleFedeSelected = async (name, selectedOption) => {
    
    setSelectedFederazione(selectedOption.value);
    setFormData(prev => ({ ...prev, federazione: selectedOption.value.descrizione || selectedOption.value }));
    // Clear previous activity selection
    setSelectedActivity(null);
    setFormData(prev => ({ ...prev, activityId: null }));
    setActivitiesList([]);
    
    // Load activities for the selected federation
    try {
      const federationId = federazioneList.find(item=> item.nome === selectedOption.value.value).id;
      const activitiesResponse = await activityService.retrieveActivitiesByFamily(federationId);
      // Assuming the response contains an array of activities with id and name/description
      setActivitiesList(activitiesResponse.data || activitiesResponse);
    } catch (error) {
      console.error('Errore nel caricamento delle attività:', error);
      // Fallback data for testing
      setActivitiesList([
        { id: 1, name: 'Pallavolo', description: 'Pallavolo' },
        { id: 2, name: 'Calcio', description: 'Calcio' },
        { id: 3, name: 'Tennis', description: 'Tennis' }
      ]);
    }
  };
  
  // Gestione selezione attività
  const handleActivitySelected = (name, selectedOption) => {
    setSelectedActivity(selectedOption.value);
    setFormData(prev => ({ ...prev, activityId: selectedOption.value.id }));
  };
  
  // Validazione dei parametri
  const controlParameters = () => {
    if (!formData.nome) return false;
    if (!formData.cognome) return false;
    if (!formData.birthJJ) return false;
    if (!selectedMM) return false;
    if (!birthProv) return false;
    if (!birthcomune) return false;
    if (!resProv) return false;
    if (!rescomune) return false;
    if (!formData.anno) return false;
    if (!formData.address) return false;
    if (!formData.cap) return false;
    
    // Check if at least one tipo socio is selected
    const hasSelectedTipo = Object.values(formData.tipoSocio).some(value => value);
    if (!hasSelectedTipo) return false;
    
    return true;
  };
  
  // Controllo prima della creazione
  const cnntrlCreate = () => {
    if (formData.tipoSocio.tesserato) {
      if (!formData.federazione) {
        setViewAlert1(true);
      } else if (!formData.activityId) {
        setError('È necessario selezionare un\'attività per il socio tesserato.');
        return;
      } else {
        handleCreate();
      }
    } else {
      setViewAlert(true);
    }
  };
  
  // Creazione o aggiornamento del socio
  const handleCreate = async () => {
    setViewAlert(false);
    setViewAlert1(false);
    
    if (!controlParameters()) {
      setError('Tutti i parametri non sono stati compilati');
      return;
    }
    
    try {
      setLoading(true);
      
      const body = {
        nome: formData.nome.toUpperCase(),
        cognome: formData.cognome.toUpperCase(),
        sesso: selectedSesso.label,
        dataNascita: `${formData.birthJJ}-${selectedMM?.value}-${formData.anno}`,
        provinciaNascita: listCodes.find(p => p.nome === birthProv).provCode,
        comuneNascita: birthcomune,
        provinciaResidenza: listCodes.find(p => p.nome === resProv).provCode,
        comuneResidenza: rescomune,
        viaResidenza: formData.address,
        capResidenza: formData.cap,
        // Send individual boolean flags for each tipo socio
        isTesserato: formData.tipoSocio.tesserato ? 1 : 0,
        isEffettivo: formData.tipoSocio.effettivo ? 1 : 0,
        isVolontario: formData.tipoSocio.volontario ? 1 : 0,
        scadenzaCertificato: formData.certifica ? formatDateForApi(formData.certifica) : null,
        isAgonistico: formData.competition === undefined ? false : formData.competition,
        telefono: formData.telefono || null,
        email: formData.email || null,
        privacy: formData.privacy === undefined ? true : formData.privacy,
        federazione: formData.federazione || null,
        activityId: formData.activityId || null
      };
      
      let response;
      console.log(body)
      if (mode === 'C') {
        // Crea un nuovo socio
        response = await socioService.createSocio(body);
      } else {
        // Aggiorna un socio esistente
        body.id = existingSocio.id;
        response = await socioService.updateSocio(body);
      }
      
      if (!response.data.returnCode) {
        throw new Error(response.data.message);
      }
      
      setSocioCreated(response.data.socio);
      setViewAbo(true);
      
      // Se c'è una callback di successo, chiamala
      if (onSave) {
        onSave(response.data.socio);
      }
      
      // Passa alla tab abbonamento
      setActiveTab('abbonamento');
      
    } catch (error) {
      console.error('Errore nella creazione/aggiornamento del socio:', error);
      setError(error.message || 'Si è verificato un errore.');
    } finally {
      setLoading(false);
    }
  };
  
  // Gestisce la creazione di una ricevuta
  const handleRicevuta = () => {
    const socioId = socioCreated?.id || existingSocio?.id;
    if (socioId) {
      goNewTab('ricevute/stampa', {
        idsocio: socioId,
        reprint: 0
      });
    }
  };
  
  // Gestisce la stampa della scheda
  const handleScheda = () => {
    const socioId = socioCreated?.id || existingSocio?.id;
    if (socioId) {
      goNewTab('schede/stampa', {
        idsocio: socioId
      });
    }
  };
  
  return (
    <div>
      {/* Avvisi e messaggi */}
      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}
      
      {viewAlert && (
        <Modal show={viewAlert} onHide={() => setViewAlert(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Conferma Creazione</Modal.Title>
          </Modal.Header>
          <Modal.Body>Sei sicuro di voler creare questo socio?</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setViewAlert(false)}>
              Annulla
            </Button>
            <Button variant="primary" onClick={handleCreate}>
              Conferma
            </Button>
          </Modal.Footer>
        </Modal>
      )}
      
      {viewAlert1 && (
        <Modal show={viewAlert1} onHide={() => setViewAlert1(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Selezione Federazione</Modal.Title>
          </Modal.Header>
          <Modal.Body>È necessario selezionare una federazione per il socio tesserato.</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setViewAlert1(false)}>
              Chiudi
            </Button>
          </Modal.Footer>
        </Modal>
      )}
      
      {viewError && (
        <Modal show={viewError} onHide={() => setViewError(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Errore</Modal.Title>
          </Modal.Header>
          <Modal.Body>Si è verificato un errore durante la creazione del socio.</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setViewError(false)}>
              Chiudi
            </Button>
          </Modal.Footer>
        </Modal>
      )}
      
      {/* Card principale */}
      <Card>
        <Card.Header>
          <h5>{mode === 'C' ? 'Creazione nuovo socio' : 'Modifica socio'}</h5>
        </Card.Header>
        <Card.Body>
          <Nav variant="tabs" activeKey={activeTab} onSelect={setActiveTab} className="mb-3">
            <Nav.Item>
              <Nav.Link eventKey="anagrafica">Dati Anagrafici</Nav.Link>
            </Nav.Item>
            {(socioCreated || mode === 'U') && (
              <Nav.Item>
                <Nav.Link eventKey="abbonamento">Abbonamento</Nav.Link>
              </Nav.Item>
            )}
          </Nav>
          
          {activeTab === 'anagrafica' && (
            <Form onSubmit={(e) => {
              e.preventDefault();
              cnntrlCreate();
            }}>
              <Row>
                <Col md={6}>
                  <TextField
                    label="Cognome"
                    name="cognome"
                    value={formData.cognome}
                    onChange={handleChange}
                    required
                  />
                </Col>
                <Col md={6}>
                  <TextField
                    label="Nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    required
                  />
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <SelectField
                    label="Sesso"
                    name="sesso"
                    value={selectedSesso}
                    options={sessoArray}
                    onChange={handleSessoSelected}
                    required
                  />
                </Col>
                <Col md={6}>
                  <CheckboxField
                    label="Privacy"
                    name="privacy"
                    checked={formData.privacy}
                    onChange={handleChange}
                  />
                </Col>
              </Row>
              
              <h5 className="mt-4">Data e luogo di nascita</h5>
              <Row>
                <Col md={4}>
                  <TextField
                    label="Giorno"
                    name="birthJJ"
                    value={formData.birthJJ}
                    onChange={handleChange}
                    type="number"
                    min="1"
                    max="31"
                    required
                  />
                </Col>
                <Col md={4}>
                  <SelectField
                    label="Mese"
                    name="birthMM"
                    value={selectedMM}
                    options={mmvalue}
                    onChange={handleBirthMMS}
                    required
                  />
                </Col>
                <Col md={4}>
                  <TextField
                    label="Anno"
                    name="anno"
                    value={formData.anno}
                    onChange={handleChange}
                    type="number"
                    min="1900"
                    max="2100"
                    required
                  />
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <SelectField
                    label="Provincia di nascita"
                    name="birthProv"
                    value={selectedProv}
                    options={listProvNascita}
                    onChange={handleProvNascitaSelected}
                    required
                  />
                </Col>
                <Col md={6}>
                  <SelectField
                    label="Comune di nascita"
                    name="birthComm"
                    value={selectedComm}
                    options={listCommNascita}
                    onChange={handlecomuneNascitaSelected}
                    isDisabled={!selectedProv}
                    required
                  />
                </Col>
              </Row>
              
              <h5 className="mt-4">Residenza</h5>
              <Row>
                <Col md={6}>
                  <SelectField
                    label="Provincia"
                    name="provRes"
                    value={provRes}
                    options={listProv}
                    onChange={handleProvResSelected}
                    required
                  />
                </Col>
                <Col md={6}>
                  <SelectField
                    label="Comune"
                    name="commRes"
                    value={commRes}
                    options={listCommRes}
                    onChange={handlecomuneResSelected}
                    isDisabled={!provRes}
                    required
                  />
                </Col>
              </Row>
              
              <Row>
                <Col md={8}>
                  <TextField
                    label="Indirizzo"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                  />
                </Col>
                <Col md={4}>
                  <TextField
                    label="CAP"
                    name="cap"
                    value={formData.cap}
                    onChange={handleChange}
                    required
                  />
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <TextField
                    label="Telefono"
                    name="telefono"
                    value={formData.telefono || ''}
                    onChange={handleChange}
                  />
                </Col>
                <Col md={6}>
                  <TextField
                    label="Email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleChange}
                    type="email"
                  />
                </Col>
              </Row>
              
              <h5 className="mt-4">Tipo Socio</h5>
              <Row>
                <Col md={4}>
                  <CheckboxField
                    label="Effettivo"
                    name="tipoSocio.effettivo"
                    checked={formData.tipoSocio.effettivo}
                    onChange={handleChange}
                  />
                </Col>
                <Col md={4}>
                  <CheckboxField
                    label="Tesserato"
                    name="tipoSocio.tesserato"
                    checked={formData.tipoSocio.tesserato}
                    onChange={handleChange}
                  />
                </Col>
                <Col md={4}>
                  <CheckboxField
                    label="Volontario"
                    name="tipoSocio.volontario"
                    checked={formData.tipoSocio.volontario}
                    onChange={handleChange}
                  />
                </Col>
              </Row>
              
              {viewFede && (
                <Row>
                  <Col md={6}>
                    <SelectField
                      label="Federazione"
                      name="federazione"
                      value={selectedFederazione}
                      options={federazioneList.map(item => item.nome)}
                      onChange={handleFedeSelected}
                      required={viewFede}
                    />
                  </Col>
                  <Col md={6}>
                    <SelectField
                      label="Attività"
                      name="activity"
                      value={selectedActivity}
                      options={activitiesList}
                      onChange={handleActivitySelected}
                      isDisabled={!selectedFederazione}
                      required={viewFede && selectedFederazione}
                    />
                  </Col>
                </Row>
              )}
              
              <h5 className="mt-4">Certificato Medico</h5>
              <Row>
                <Col md={6}>
                  <DateField
                    label="Scadenza Certificato"
                    name="certifica"
                    value={formData.certifica}
                    onChange={handleChange}
                  />
                </Col>
                <Col md={6}>
                  <CheckboxField
                    label="Certificato per attività agonistica"
                    name="competition"
                    checked={formData.competition}
                    onChange={handleChange}
                  />
                </Col>
              </Row>
              
              <div className="d-flex justify-content-end mt-4">
                <Button variant="primary" type="submit" disabled={loading}>
                  {loading ? 'Salvataggio...' : (mode === 'C' ? 'Crea Socio' : 'Aggiorna Socio')}
                </Button>
              </div>
            </Form>
          )}
          
          {activeTab === 'abbonamento' && (
            <div>
              {socioCreated || existingSocio ? (
                <AbbonamentoForm
                  socio={socioCreated || existingSocio}
                  onSuccess={() => setViewContinue(true)}
                />
              ) : (
                <Alert variant="info">
                  Salvare prima i dati anagrafici per gestire l'abbonamento.
                </Alert>
              )}
              
              {viewContinue && (
                <div className="mt-4">
                  <Alert variant="success">
                    <Alert.Heading>Abbonamento creato con successo</Alert.Heading>
                    <p>
                      Puoi ora creare una ricevuta o stampare la scheda del socio.
                    </p>
                    <div className="d-flex">
                      <Button 
                        variant="outline-success" 
                        onClick={handleRicevuta}
                        className="me-2"
                      >
                        Crea Ricevuta
                      </Button>
                      <Button 
                        variant="outline-success" 
                        onClick={handleScheda}
                      >
                        Stampa Scheda
                      </Button>
                    </div>
                  </Alert>
                </div>
              )}
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default SocioForm;