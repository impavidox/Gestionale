// React/club-manager/src/components/soci/SocioForm.jsx
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
import ricevutaService from '../../api/services/ricevutaService';
import AbbonamentoForm from '../abbonamenti/AbbonamentoForm';
import { formatDateForApi, calculateAge } from '../../utils/dateUtils';
import { isValidCodiceFiscale, isValidCAP, isValidPhone, isValidEmail } from '../../utils/validationUtils';

/**
 * Componente per la creazione e modifica di un socio
 * Enhanced with automatic receipt creation and domanda associativa flow
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
    tipoSocio: {
      effettivo: false,
      tesserato: false,
      volontario: false
    },
    certifica: null,
    competition: 0,
    telefono: '',
    email: '',
    codice: null
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
  const [listCodes, setListProvCodes] = useState([]);
  const [listCommNascita, setListCommNascita] = useState([]);
  const [listCommRes, setListCommRes] = useState([]);
  const [listTipiSocio, setListTipiSocio] = useState([]);
  const [activitiesList, setActivitiesList] = useState([]);
  const [sezioni, setSezioni] = useState([]);
  const [attivita, setAttivita] = useState([]);
  
  // Stati per i selettori
  const [selectedSesso, setSelectedSesso] = useState(null);
  const [selectedProv, setSelectedProv] = useState(null);
  const [selectedComm, setSelectedComm] = useState(null);
  const [provRes, setProvRes] = useState(null);
  const [commRes, setCommRes] = useState(null);
  const [selectedMM, setSelectedMM] = useState(null);
  const [selectedFederazione, setSelectedFederazione] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  
  // Stati per la ricevuta automatica
  const [selectedSezioneForReceipt, setSelectedSezioneForReceipt] = useState(null);
  const [selectedAttivitaForReceipt, setSelectedAttivitaForReceipt] = useState(null);
  const [importoQuotaAssociativa, setImportoQuotaAssociativa] = useState(50); // Default amount
  
  // Stati per la UI
  const [viewFede, setViewFede] = useState(false);
  const [viewAlert, setViewAlert] = useState(false);
  const [viewAlert1, setViewAlert1] = useState(false);
  const [viewAbo, setViewAbo] = useState(false);
  const [viewContinue, setViewContinue] = useState(false);
  const [viewError, setViewError] = useState(false);
  const [showReceiptCreationModal, setShowReceiptCreationModal] = useState(false);
  
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

  // Tipologie di pagamento
  const tipologiePagamento = [
    { nome: 'POS', id: 1 },
    { nome: 'Contanti', id: 2 },
    { nome: 'Bonifico', id: 3 }
  ];
  
  // Carica i dati iniziali
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Carica province
        const provinceNascitaResponse = await geographicService.retrieveProvince();
        const province = provinceNascitaResponse.data.data.map(item => item.nome);
        const provinceCodes = provinceNascitaResponse.data.data;
        setListProvCodes(provinceCodes);
        setListProvNascita(province);
        setListProv(province);
        
        // Carica sezioni per la ricevuta
        const sezioniResponse = await activityService.retrieveSezioni();
        setSezioni(sezioniResponse.data.data || []);
        
        // Carica federazioni
        const activityResponse = await activityService.retrieveActivitiesCodes();
        setActivitiesList(activityResponse.data.data);
        
        setLoading(false);
      } catch (error) {
        console.error('Errore nel caricamento dei dati iniziali:', error);
        setError('Si è verificato un errore nel caricamento dei dati iniziali.');
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [mode]);

  // Load existing socio data (keeping existing implementation)
  useEffect(() => {
    const loadExistingSocio = async () => {
      if (mode !== 'U' || !existingSocio) return;
      
      try {
        setLoading(true);
        console.log('Loading existing socio:', existingSocio);
        
        // Estrai dati di nascita
        let birthDay = '';
        let birthMonth = null;
        let birthYear = '';
        
        if (existingSocio.dataNascita) {
          const birthDate = new Date(existingSocio.dataNascita);
          birthDay = birthDate.getDate().toString().padStart(2, '0');
          birthMonth = (birthDate.getMonth() + 1).toString().padStart(2, '0');
          birthYear = birthDate.getFullYear().toString();
        }
        
        // Convert existing tipo socio to the new checkbox format with numeric values
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
          sesso: existingSocio.sesso || 1,
          privacy: existingSocio.privacy ? 1 : 0,
          birthJJ: birthDay,
          birthMM: birthMonth,
          anno: birthYear,
          address: existingSocio.viaResidenza || existingSocio.indirizzo || '',
          cap: existingSocio.capResidenza || existingSocio.cap || '',
          tipoSocio: tipoSocioCheckboxes,
          certifica: existingSocio.scadenzaCertificato ? new Date(existingSocio.scadenzaCertificato) : null,
          dataIscrizione: existingSocio.dataIscrizione,
          competition: existingSocio.isAgonistico ? 1 : 0,
          telefono: existingSocio.telefono || existingSocio.tel || '',
          email: existingSocio.email || '',
          codice: existingSocio.codice || null
        });
        
        // Set sesso selector with correct format
        const sessoValue = existingSocio.sesso === 'F' ? 
          { id: 2, label: 'F' } : 
          { id: 1, label: 'M' };
        setSelectedSesso(sessoValue);
        
        // Set month selector with correct format
        if (birthMonth) {
          const monthOption = mmvalue.find(m => m.id === birthMonth);
          if (monthOption) {
            setSelectedMM(monthOption);
          }
        }
        
        // Handle provincia di nascita with proper async loading
        if (existingSocio.provinciaNascita && listCodes.length > 0) {
          const provNascitaCode = existingSocio.provinciaNascita;
          const provNascitaObj = listCodes.find(p => p.provCode === provNascitaCode);
          
          if (provNascitaObj) {
            const provNascitaNome = provNascitaObj.nome;
            setBirthProv(provNascitaNome);
            setSelectedProv({label: provNascitaNome});
            
            // Load comuni for the provincia
            try {
              const communiResponse = await geographicService.retrievecomune(provNascitaNome);
              const comuni = communiResponse.data.data.map(item => item.nome);
              setListCommNascita(comuni);
              
              // Set comune di nascita after comuni are loaded
              if (existingSocio.comuneNascita) {
                const comuneNascita = existingSocio.comuneNascita;
                setBirthcomune(comuneNascita);
                setSelectedComm({label: comuneNascita});
              }
            } catch (error) {
              console.error('Errore nel caricamento dei comuni di nascita:', error);
            }
          }
        }
        
        // Handle provincia di residenza with proper async loading
        if (existingSocio.provinciaResidenza && listCodes.length > 0) {
          const provResCode = existingSocio.provinciaResidenza;
          const provResObj = listCodes.find(p => p.provCode === provResCode);
          if (provResObj) {
            const provResNome = provResObj.nome;
            setResProv(provResNome);
            setProvRes({label: provResNome});
            
            // Load comuni for the provincia
            try {
              const communiResResponse = await geographicService.retrievecomune(provResNome);
              const comuni = communiResResponse.data.data.map(item => item.nome);
              setListCommRes(comuni);
              
              // Set comune di residenza after comuni are loaded
              if (existingSocio.comuneResidenza) {
                const comuneRes = existingSocio.comuneResidenza;
                setRescomune(comuneRes);
                setCommRes({label: comuneRes});
              }
            } catch (error) {
              console.error('Errore nel caricamento dei comuni di residenza:', error);
            }
          }
        }
        
        // Handle activity selection if tesserato
        if (tipoSocioCheckboxes.tesserato && existingSocio.codice && activitiesList.length > 0) {
          const foundActivity = activitiesList.find(activity => 
            activity.codice === existingSocio.codice
          );
          
          if (foundActivity) {
            setSelectedActivity(foundActivity.nome);
            setFormData(prev => ({ ...prev, codice: foundActivity.codice }));
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Errore nel caricamento dei dati del socio esistente:', error);
        setError('Si è verificato un errore nel caricamento dei dati del socio.');
        setLoading(false);
      }
    };
    
    // Only run when all required data is loaded
    if (listCodes.length > 0 && listProvNascita.length > 0 && listProv.length > 0 && activitiesList.length > 0) {
      loadExistingSocio();
    }
  }, [existingSocio, mode, listCodes, listProvNascita, listProv, activitiesList]);

  // All existing handlers remain the same...
  const handleChange = (name, value) => {
    if (name.startsWith('tipoSocio.')) {
      const tipoKey = name.split('.')[1];
      const numericValue = value ? 1 : 0;
      
      setFormData(prev => ({
        ...prev,
        tipoSocio: {
          [tipoKey]: numericValue
        }
      }));
      
      if (tipoKey === 'tesserato') {
        setViewFede(value);
        if (!value) {
          setSelectedActivity(null);
          setActivitiesList([]);
          setFormData(prev => ({ ...prev, activityId: null }));
        }
      } else {
        setViewFede(false);
        setSelectedActivity(null);
        setActivitiesList([]);
        setFormData(prev => ({ ...prev, activityId: null }));
      }
    } else if (typeof value === 'boolean') {
      const numericValue = value ? 1 : 0;
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Keep all existing handlers (handleBirthMMS, handleProvNascitaSelected, etc.)
  const handleBirthMMS = (name, selectedOption) => {
    setSelectedMM(selectedOption.value);
  };
  
  const handleProvNascitaSelected = async (name, selectedOption) => {
    setSelectedProv(selectedOption.value);
    setBirthProv(selectedOption.value.value);
    
    try {
      const response = await geographicService.retrievecomune(selectedOption.value.value);
      const comuni = response.data.data.map(item => item.nome);
      setListCommNascita(comuni);
    } catch (error) {
      console.error('Errore nel caricamento dei comuni:', error);
    }
  };
  
  const handleProvResSelected = async (name, selectedOption) => {
    setProvRes(selectedOption.value);
    setResProv(selectedOption.value.value);
    
    try {
      const response = await geographicService.retrievecomune(selectedOption.value.value);
      const comuni = response.data.data.map(item => item.nome);
      setListCommRes(comuni);
    } catch (error) {
      console.error('Errore nel caricamento dei comuni:', error);
    }
  };
  
  const handlecomuneNascitaSelected = (name, selectedOption) => {
    setSelectedComm(selectedOption.value);
    setBirthcomune(selectedOption.value.value);
  };
  
  const handlecomuneResSelected = (name, selectedOption) => {
    setCommRes(selectedOption.value);
    setRescomune(selectedOption.value.value);
  };
  
  const handleSessoSelected = (name, selectedOption) => {
    setSelectedSesso(selectedOption.value);
    setFormData(prev => ({ ...prev, sesso: selectedOption.value }));
  };
  
  const handleActivitySelected = (name, selectedOption) => {
    setSelectedActivity(selectedOption.value);
    setFormData(prev => ({ ...prev, codice: activitiesList.find(p => p.nome === selectedOption.value.value).codice }));
  };

  // NEW: Handlers for receipt creation
  const handleSezioneForReceiptChange = async (name, selectedValue) => {
    const sezioneSelezionata = sezioni.find(s => s.nome === selectedValue.value.value);
    setSelectedSezioneForReceipt(selectedValue.value);
    setSelectedAttivitaForReceipt(null);
    
    try {
      setLoading(true);
      const response = await activityService.retrieveActivitiesBySezione(sezioneSelezionata.id);
      setAttivita(response.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Errore nel caricamento delle attività:', error);
      setError('Si è verificato un errore nel caricamento delle attività.');
      setLoading(false);
    }
  };

  const handleAttivitaForReceiptChange = (name, selectedValue) => {
    setSelectedAttivitaForReceipt(selectedValue.value);
  };

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
    
    const hasSelectedTipo = Object.values(formData.tipoSocio).some(value => value);
    if (!hasSelectedTipo) return false;
    
    return true;
  };

  const cnntrlCreate = () => {
    if (formData.tipoSocio.tesserato) {
      if (!formData.codice) {
        setError('È necessario selezionare un\'attività per il socio tesserato.');
        return;
      } else {
        handleCreate();
      }
    } else {
      setViewAlert(true);
    }
  };

  // Enhanced create function with automatic receipt creation
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
        dataIscrizione: formData.dataIscrizione,
        isTesserato: formData.tipoSocio.tesserato ? 1 : 0,
        isEffettivo: formData.tipoSocio.effettivo ? 1 : 0,
        isVolontario: formData.tipoSocio.volontario ? 1 : 0,
        scadenzaCertificato: formData.certifica ? formatDateForApi(formData.certifica) : null,
        isAgonistico: formData.competition === undefined ? false : formData.competition,
        telefono: formData.telefono || null,
        email: formData.email || null,
        privacy: formData.privacy === undefined ? true : formData.privacy,
        codice: formData.codice || null
      };
      
      let response;
      if (mode === 'C') {
        response = await socioService.createSocio(body);
      } else {
        body.id = existingSocio.id;
        response = await socioService.updateSocio(body);
      }
      
      if (!response.data.returnCode) {
        throw new Error(response.data.message);
      }
      
      const createdSocio = response.data.socio;
      setSocioCreated(createdSocio);
      
      if (onSave) {
        onSave(createdSocio);
      }

      // NEW: For new socio creation, show receipt creation modal
      if (mode === 'C') {
        setShowReceiptCreationModal(true);
      } else {
        setViewAbo(true);
        setActiveTab('abbonamento');
      }
      
    } catch (error) {
      console.error('Errore nella creazione/aggiornamento del socio:', error);
      setError(error.message || 'Si è verificato un errore.');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced create function with complete first receipt creation
  const handleCreateReceipt = async () => {
    if (!selectedSezioneForReceipt || !selectedAttivitaForReceipt) {
      setError('Selezionare sezione e attività per la ricevuta.');
      return;
    }

    try {
      setLoading(true);
      
      // Get selected activity and sezione details
      const selectedActivityData = attivita.find(item => item.nome === selectedAttivitaForReceipt.value);
      const selectedSezioneData = sezioni.find(item => item.nome === selectedSezioneForReceipt.value);

      // Prepare complete first receipt using the enhanced service
      const activityData = {
        id: selectedActivityData.id,
        nome: selectedActivityData.nome,
        sezioneId: selectedSezioneData.id,
        importo: selectedActivityData.importo || selectedActivityData.costo || 30
      };

      const paymentData = {
        quotaAssociativa: parseFloat(importoQuotaAssociativa),
        tipologiaPagamento: 2, // Default to cash
        sezioneId: selectedSezioneData.id
      };

      // Use the enhanced service method for first receipt
      const response = await ricevutaService.createFirstReceipt(
        socioCreated, 
        activityData, 
        paymentData
      );
      
      if (response.data.testPrint || response.data.success) {
        // Open enhanced receipt in new tab
        goNewTab('ricevute/stampa', {
          idsocio: socioCreated.id,
          reprint: 1,
          ricevuta: response.data.idRicevuta || response.data.id
        });

        // Calculate age for domanda associativa eligibility
        const birthDate = new Date(`${formData.anno}-${selectedMM?.value}-${formData.birthJJ}`);
        const age = calculateAge(birthDate);
        const isEffettivoOrVolontario = formData.tipoSocio.effettivo || formData.tipoSocio.volontario;

        // Open domanda associativa if eligible
        if (age >= 18 && isEffettivoOrVolontario) {
          setTimeout(() => {
            goNewTab('domanda-associativa', {
              socioId: socioCreated.id,
              attivitaId: selectedActivityData.id,
              ricevutaId: response.data.idRicevuta || response.data.id
            });
          }, 1000);
        }

        setShowReceiptCreationModal(false);
        setViewContinue(true);
        setActiveTab('abbonamento');
      } else {
        throw new Error(response.data.messageError || 'Errore nella creazione della ricevuta completa');
      }
      
    } catch (error) {
      console.error('Errore nella creazione della ricevuta completa:', error);
      setError(error.message || 'Errore nella creazione della ricevuta completa');
    } finally {
      setLoading(false);
    }
  };

  // Keep existing handlers
  const handleRicevuta = () => {
    const socioId = socioCreated?.id || existingSocio?.id;
    if (socioId) {
      goNewTab('ricevute/stampa', {
        idsocio: socioId,
        reprint: 0
      });
    }
  };

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
      {/* Existing alerts and modals */}
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

      {/* NEW: Receipt Creation Modal */}
      <Modal show={showReceiptCreationModal} onHide={() => setShowReceiptCreationModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Crea Prima Ricevuta con Quota Associativa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-3">
            <strong>Socio creato:</strong> {formData.cognome} {formData.nome}
          </p>
          
          <Form>
            <Row>
              <Col md={6}>
                <SelectField
                  label="Sezione"
                  name="sezione"
                  value={selectedSezioneForReceipt}
                  options={sezioni.map(item => item.nome)}
                  onChange={handleSezioneForReceiptChange}
                  placeholder="Seleziona una sezione"
                  required
                />
              </Col>
              <Col md={6}>
                <SelectField
                  label="Attività"
                  name="attivita"
                  value={selectedAttivitaForReceipt}
                  options={attivita.map(item => item.nome)}
                  onChange={handleAttivitaForReceiptChange}
                  placeholder={!selectedSezioneForReceipt ? "Prima seleziona una sezione" : "Seleziona un'attività"}
                  isDisabled={!selectedSezioneForReceipt}
                  required
                />
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <TextField
                  label="Importo Quota Associativa (€)"
                  name="importoQuota"
                  value={importoQuotaAssociativa}
                  onChange={(name, value) => setImportoQuotaAssociativa(value)}
                  type="number"
                  step="1"
                  min="0"
                  required
                />
              </Col>
              <Col md={6}>
                <div className="mt-4 pt-2">
                  <small className="text-muted">
                    <i className="bi bi-info-circle me-1"></i>
                    La ricevuta includerà automaticamente la quota associativa
                  </small>
                </div>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReceiptCreationModal(false)}>
            Salta per ora
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCreateReceipt}
            disabled={loading || !selectedSezioneForReceipt || !selectedAttivitaForReceipt}
          >
            {loading ? 'Creazione...' : 'Crea Ricevuta'}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Keep all existing modals and form content */}
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
                      label="Attività"
                      name="activity"
                      value={selectedActivity}
                      options={activitiesList.map(item => item.nome)}
                      onChange={handleActivitySelected}
                      required={viewFede}
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

              <h5 className="mt-4">Data Iscrizione</h5>
              <Row>
                <Col md={6}>
                  <DateField
                    label="Data Iscrizione"
                    name="dataIscrizione"
                    value={formData.dataIscrizione}
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
                    <Alert.Heading>Operazione completata con successo</Alert.Heading>
                    <p>
                      Il socio è stato creato e la prima ricevuta con quota associativa è stata generata.
                    </p>
                    <div className="d-flex">
                      <Button 
                        variant="outline-success" 
                        onClick={handleRicevuta}
                        className="me-2"
                      >
                        Crea Altra Ricevuta
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