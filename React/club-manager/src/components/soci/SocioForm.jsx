import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Modal } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import TextField from '../forms/TextField';
import SelectField from '../forms/SelectField';
import DateField from '../forms/DateField';
import CheckboxField from '../forms/CheckboxField';
import Alert from '../common/Alert';
import socioService from '../../api/services/socioService';
import geographicService from '../../api/services/geographicService';
import abbonamentoService from '../../api/services/abbonamentoService';
import activityService from '../../api/services/activityService';
import { formatDateForApi } from '../../utils/dateUtils';
import { isEmpty } from '../../utils/validationUtils';

/**
 * Componente per la creazione e modifica di un socio
 * @param {Object} existingSocio - Dati del socio esistente (se in modalità modifica)
 * @param {string} mode - Modalità del form (C = creazione, U = modifica)
 * @param {Function} onSave - Callback da eseguire dopo il salvataggio
 */
const SocioForm = ({ existingSocio = null, mode = 'C', onSave = null }) => {
  const navigate = useNavigate();
  const { id: socioId } = useParams();
  const { annoSportiva, goNewTab } = useApp();

  // Definizione stato locale
  const [formData, setFormData] = useState({
    id: existingSocio?.id || 0,
    nome: existingSocio?.nome || '',
    cognome: existingSocio?.cognome || '',
    codeFiscale: existingSocio?.codeFiscale || '',
    sesso: existingSocio?.sesso || 1,
    birthJJ: existingSocio?.birthJJ || '',
    birthMM: existingSocio?.birthMM || '',
    anno: existingSocio?.anno || '',
    birthProv: existingSocio?.birthProv || '',
    birthCity: existingSocio?.birthCity || '',
    birthCityCode: existingSocio?.birthCityCode || '',
    provRes: existingSocio?.provRes || '',
    citta: existingSocio?.citta || '',
    indirizzo: existingSocio?.indirizzo || '',
    cap: existingSocio?.cap || '',
    tel: existingSocio?.tel || '',
    email: existingSocio?.email || '',
    privacy: existingSocio?.privacy !== undefined ? existingSocio.privacy : true,
    tipo: existingSocio?.tipo || null,
    federazione: existingSocio?.federazione || null,
    dateCertificat: existingSocio?.dateCertificat || null,
    typeCertificat: existingSocio?.typeCertificat || false,
  });

  // Dati per le select
  const [sessoOptions] = useState([
    { id: 1, name: 'Maschio' },
    { id: 2, name: 'Femmina' },
  ]);

  // Stati per i dati di selezione
  const [tipiSocio, setTipiSocio] = useState([]);
  const [province, setProvince] = useState([]);
  const [communiNascita, setCommuniNascita] = useState([]);
  const [communiResidenza, setCommuniResidenza] = useState([]);
  const [federazioni, setFederazioni] = useState([]);

  // Stati per le selezioni
  const [selectedSesso, setSelectedSesso] = useState(
    sessoOptions.find(s => s.id === (existingSocio?.sesso || 1)) || sessoOptions[0]
  );
  const [selectedMese, setSelectedMese] = useState(null);
  const [selectedProvNascita, setSelectedProvNascita] = useState(null);
  const [selectedComuneNascita, setSelectedComuneNascita] = useState(null);
  const [selectedProvResidenza, setSelectedProvResidenza] = useState(null);
  const [selectedComuneResidenza, setSelectedComuneResidenza] = useState(null);
  const [selectedTipoSocio, setSelectedTipoSocio] = useState(null);
  const [selectedFederazione, setSelectedFederazione] = useState(null);

  // Stati per i messaggi
  const [alertMessage, setAlertMessage] = useState('');
  const [alertVariant, setAlertVariant] = useState('info');
  const [showAlert, setShowAlert] = useState(false);
  const [showConfirmTipoSocio, setShowConfirmTipoSocio] = useState(false);
  const [showConfirmFederazione, setShowConfirmFederazione] = useState(false);
  
  // Stato per la visualizzazione del campo federazione
  const [showFederazione, setShowFederazione] = useState(false);
  
  // Stati per l'abbonamento
  const [showAbbonamentoForm, setShowAbbonamentoForm] = useState(false);
  const [socioCreated, setSocioCreated] = useState(null);
  const [dataIscrizione, setDataIscrizione] = useState(null);
  const [abboFirmato, setAbboFirmato] = useState(false);
  const [numeroTessera, setNumeroTessera] = useState('...');
  const [showContinueButton, setShowContinueButton] = useState(false);

  // Carica i dati necessari all'avvio
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Carica tipi socio
        const tipiSocioResponse = await socioService.retrieveTipoSocio();
        setTipiSocio(tipiSocioResponse.data);
        
        // Se esistono dati del socio, seleziona il tipo
        if (existingSocio?.tipo) {
          const tipoFound = tipiSocioResponse.data.find(t => t.tipoId === existingSocio.tipo.tipoId);
          if (tipoFound) {
            setSelectedTipoSocio(tipoFound);
            setShowFederazione(tipoFound.tipoId === 3);
          }
        } else {
          // Default: seleziona tipo 3 (come nel codice originale)
          const defaultTipo = tipiSocioResponse.data.find(t => t.tipoId === 3);
          if (defaultTipo) {
            setSelectedTipoSocio(defaultTipo);
            setShowFederazione(true);
          }
        }
        
        // Carica province
        const provinceResponse = await geographicService.retrieveProvince();
        setProvince(provinceResponse.data);
        
        // Carica federazioni
        const federazioniResponse = await activityService.retrieveAffiliazione(0);
        setFederazioni(federazioniResponse.data);
        
        // Se esistono dati del socio, seleziona la federazione
        if (existingSocio?.federazione && federazioniResponse.data.length > 0) {
          const federazioneFound = federazioniResponse.data.find(
            f => f.descrizione.trim() === existingSocio.federazione.trim()
          );
          if (federazioneFound) {
            setSelectedFederazione(federazioneFound);
          } else {
            setSelectedFederazione(federazioniResponse.data[0]);
          }
        } else if (federazioniResponse.data.length > 0) {
          setSelectedFederazione(federazioniResponse.data[0]);
        }
        
        // Se è in modalità modifica e ci sono dati del socio
        if (mode === 'U' && existingSocio) {
          // Imposta il mese di nascita
          if (existingSocio.birthMM !== undefined) {
            const meseFound = meseOptions.find(m => m.id === existingSocio.birthMM);
            if (meseFound) {
              setSelectedMese(meseFound);
            }
          }
          
          // Carica i comuni di nascita se c'è la provincia
          if (existingSocio.birthProv) {
            const provNascitaFound = provinceResponse.data.find(
              p => p.description.trim() === existingSocio.birthProv.trim()
            );
            if (provNascitaFound) {
              setSelectedProvNascita(provNascitaFound);
              const communiNascitaResponse = await geographicService.retrieveCommune(provNascitaFound.code);
              setCommuniNascita(communiNascitaResponse.data);
              
              // Seleziona il comune di nascita
              if (existingSocio.birthCity) {
                const comuneNascitaFound = communiNascitaResponse.data.find(
                  c => c.description.trim() === existingSocio.birthCity.trim()
                );
                if (comuneNascitaFound) {
                  setSelectedComuneNascita(comuneNascitaFound);
                }
              }
            }
          }
          
          // Carica i comuni di residenza se c'è la provincia
          if (existingSocio.provRes) {
            const provResidenzaFound = provinceResponse.data.find(
              p => p.description.trim() === existingSocio.provRes.trim()
            );
            if (provResidenzaFound) {
              setSelectedProvResidenza(provResidenzaFound);
              const communiResidenzaResponse = await geographicService.retrieveCommune(provResidenzaFound.code);
              setCommuniResidenza(communiResidenzaResponse.data);
              
              // Seleziona il comune di residenza
              if (existingSocio.citta) {
                const comuneResidenzaFound = communiResidenzaResponse.data.find(
                  c => c.description.trim() === existingSocio.citta.trim()
                );
                if (comuneResidenzaFound) {
                  setSelectedComuneResidenza(comuneResidenzaFound);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Errore nel caricamento dei dati iniziali:', error);
        setAlertMessage('Errore nel caricamento dei dati. Riprova più tardi.');
        setAlertVariant('danger');
        setShowAlert(true);
      }
    };

  return (
    <Container className="mt-4 mb-5">
      <Card>
        <Card.Header as="h5">
          {mode === 'C' ? 'Creazione nuovo socio' : 'Modifica socio'}
        </Card.Header>
        <Card.Body>
          {showAlert && (
            <Alert
              variant={alertVariant}
              message={alertMessage}
              onClose={() => setShowAlert(false)}
            />
          )}

          {!showAbbonamentoForm ? (
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={6}>
                  <TextField
                    label="Cognome"
                    name="cognome"
                    value={formData.cognome}
                    onChange={handleInputChange}
                    required
                  />
                </Col>
                <Col md={6}>
                  <TextField
                    label="Nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleInputChange}
                    required
                  />
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <TextField
                    label="Codice Fiscale"
                    name="codeFiscale"
                    value={formData.codeFiscale}
                    onChange={handleInputChange}
                  />
                </Col>
                <Col md={6}>
                  <SelectField
                    label="Sesso"
                    name="sesso"
                    value={selectedSesso}
                    options={sessoOptions}
                    onChange={handleSessoChange}
                    required
                  />
                </Col>
              </Row>

              <h5 className="mt-4">Data e luogo di nascita</h5>
              <Row>
                <Col md={2}>
                  <TextField
                    label="Giorno"
                    name="birthJJ"
                    value={formData.birthJJ}
                    onChange={handleInputChange}
                    type="number"
                    min={1}
                    max={31}
                    required
                  />
                </Col>
                <Col md={4}>
                  <SelectField
                    label="Mese"
                    name="birthMM"
                    value={selectedMese}
                    options={meseOptions}
                    onChange={handleMeseChange}
                    required
                  />
                </Col>
                <Col md={6}>
                  <TextField
                    label="Anno"
                    name="anno"
                    value={formData.anno}
                    onChange={handleInputChange}
                    type="number"
                    min={1900}
                    max={new Date().getFullYear()}
                    required
                  />
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <SelectField
                    label="Provincia di nascita"
                    name="birthProv"
                    value={selectedProvNascita}
                    options={province}
                    onChange={handleProvNascitaChange}
                    required
                  />
                </Col>
                <Col md={6}>
                  <SelectField
                    label="Comune di nascita"
                    name="birthCity"
                    value={selectedComuneNascita}
                    options={communiNascita}
                    onChange={handleComuneNascitaChange}
                    isDisabled={!selectedProvNascita}
                    required
                  />
                </Col>
              </Row>

              <h5 className="mt-4">Residenza</h5>
              <Row>
                <Col md={6}>
                  <SelectField
                    label="Provincia di residenza"
                    name="provRes"
                    value={selectedProvResidenza}
                    options={province}
                    onChange={handleProvResidenzaChange}
                    required
                  />
                </Col>
                <Col md={6}>
                  <SelectField
                    label="Comune di residenza"
                    name="citta"
                    value={selectedComuneResidenza}
                    options={communiResidenza}
                    onChange={handleComuneResidenzaChange}
                    isDisabled={!selectedProvResidenza}
                    required
                  />
                </Col>
              </Row>

              <Row>
                <Col md={8}>
                  <TextField
                    label="Indirizzo"
                    name="indirizzo"
                    value={formData.indirizzo}
                    onChange={handleInputChange}
                    required
                  />
                </Col>
                <Col md={4}>
                  <TextField
                    label="CAP"
                    name="cap"
                    value={formData.cap}
                    onChange={handleInputChange}
                    required
                  />
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <TextField
                    label="Telefono"
                    name="tel"
                    value={formData.tel}
                    onChange={handleInputChange}
                  />
                </Col>
                <Col md={6}>
                  <TextField
                    label="Email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    type="email"
                  />
                </Col>
              </Row>

              <h5 className="mt-4">Informazioni associative</h5>
              <Row>
                <Col md={6}>
                  <SelectField
                    label="Tipo Socio"
                    name="tipo"
                    value={selectedTipoSocio}
                    options={tipiSocio}
                    onChange={handleTipoSocioChange}
                    required
                  />
                </Col>
                {showFederazione && (
                  <Col md={6}>
                    <SelectField
                      label="Federazione"
                      name="federazione"
                      value={selectedFederazione}
                      options={federazioni}
                      onChange={handleFederazioneChange}
                      required
                    />
                  </Col>
                )}
              </Row>

              <Row>
                <Col md={6}>
                  <DateField
                    label="Data certificato medico"
                    name="dateCertificat"
                    value={formData.dateCertificat}
                    onChange={handleInputChange}
                  />
                </Col>
                <Col md={6}>
                  <CheckboxField
                    label="Agonistico"
                    name="typeCertificat"
                    checked={formData.typeCertificat}
                    onChange={handleInputChange}
                  />
                </Col>
              </Row>

              <Row className="mt-3">
                <Col>
                  <CheckboxField
                    label="Privacy accettata"
                    name="privacy"
                    checked={formData.privacy}
                    onChange={handleInputChange}
                  />
                </Col>
              </Row>

              <div className="d-flex justify-content-between mt-4">
                <Button variant="secondary" onClick={() => navigate(-1)}>
                  Annulla
                </Button>
                <Button variant="primary" type="submit">
                  {mode === 'C' ? 'Crea Socio' : 'Aggiorna Socio'}
                </Button>
              </div>
            </Form>
          ) : (
            <div>
              <h4>Dati socio</h4>
              <Row className="mb-4">
                <Col md={6}>
                  <p><strong>Cognome:</strong> {socioCreated.cognome}</p>
                  <p><strong>Nome:</strong> {socioCreated.nome}</p>
                  <p><strong>Codice Fiscale:</strong> {socioCreated.codeFiscale}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Numero Tessera:</strong> {numeroTessera}</p>
                </Col>
              </Row>

              <h4>Abbonamento</h4>
              <Row>
                <Col md={6}>
                  <DateField
                    label="Data Iscrizione"
                    name="dataIscrizione"
                    value={dataIscrizione}
                    onChange={(name, value) => setDataIscrizione(value)}
                    required
                  />
                </Col>
                <Col md={6}>
                  <CheckboxField
                    label="Abbonamento Firmato"
                    name="abboFirmato"
                    checked={abboFirmato}
                    onChange={(name, value) => setAbboFirmato(value)}
                  />
                </Col>
              </Row>

              <div className="d-flex justify-content-between mt-4">
                {!showContinueButton ? (
                  <>
                    <Button variant="secondary" onClick={() => setShowAbbonamentoForm(false)}>
                      Indietro
                    </Button>
                    <Button variant="primary" onClick={handleCreateAbbonamento}>
                      Crea Abbonamento
                    </Button>
                  </>
                ) : (
                  <>
                    <div>
                      <Button variant="secondary" onClick={() => setShowContinueButton(false)}>
                        Chiudi
                      </Button>
                    </div>
                    <div>
                      <Button variant="info" className="me-2" onClick={handleStampaRicevuta}>
                        Stampa Ricevuta
                      </Button>
                      <Button variant="primary" onClick={handleStampaScheda}>
                        Stampa Scheda
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal di conferma tipo socio */}
      <Modal show={showConfirmTipoSocio} onHide={() => setShowConfirmTipoSocio(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Conferma Tipo Socio</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Confermi la selezione del tipo socio?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmTipoSocio(false)}>
            Annulla
          </Button>
          <Button variant="primary" onClick={() => {
          <Button variant="primary" onClick={() => {
            setShowConfirmTipoSocio(false);
            handleSubmit(new Event('submit'));
          }}>
            Conferma
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal di conferma federazione */}
      <Modal show={showConfirmFederazione} onHide={() => setShowConfirmFederazione(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Federazione non selezionata</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Non hai selezionato una federazione. Vuoi procedere comunque?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmFederazione(false)}>
            Annulla
          </Button>
          <Button variant="primary" onClick={() => {
            setShowConfirmFederazione(false);
            setSelectedFederazione(federazioni[0]);
            handleSubmit(new Event('submit'));
          }}>
            Procedi con prima federazione
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default SocioForm;

    fetchInitialData();
  }, [existingSocio, mode, meseOptions]);

  // Gestione del cambio di provincia di nascita
  const handleProvNascitaChange = async (name, selectedValue) => {
    setSelectedProvNascita(selectedValue.value);
    try {
      const response = await geographicService.retrieveCommune(selectedValue.value.code);
      setCommuniNascita(response.data);
      setSelectedComuneNascita(null);
    } catch (error) {
      console.error('Errore nel caricamento dei comuni:', error);
    }
  };

  // Gestione del cambio di comune di nascita
  const handleComuneNascitaChange = (name, selectedValue) => {
    setSelectedComuneNascita(selectedValue.value);
    setFormData(prev => ({
      ...prev,
      birthCity: selectedValue.value.description,
      birthProv: selectedValue.value.provCode,
      birthCityCode: selectedValue.value.code
    }));
  };

  // Gestione del cambio di provincia di residenza
  const handleProvResidenzaChange = async (name, selectedValue) => {
    setSelectedProvResidenza(selectedValue.value);
    try {
      const response = await geographicService.retrieveCommune(selectedValue.value.code);
      setCommuniResidenza(response.data);
      setSelectedComuneResidenza(null);
    } catch (error) {
      console.error('Errore nel caricamento dei comuni:', error);
    }
  };

  // Gestione del cambio di comune di residenza
  const handleComuneResidenzaChange = (name, selectedValue) => {
    setSelectedComuneResidenza(selectedValue.value);
    setFormData(prev => ({
      ...prev,
      citta: selectedValue.value.description,
      provRes: selectedValue.value.provCode
    }));
  };

  // Gestione del cambio di tipo socio
  const handleTipoSocioChange = (name, selectedValue) => {
    const newValue = selectedValue.value;
    setSelectedTipoSocio(newValue);
    setShowFederazione(newValue.tipoId === 3);
    
    // Mostra la conferma solo se non è tipo 3
    if (newValue.tipoId !== 3) {
      setShowConfirmTipoSocio(true);
    }
  };

  // Gestione del cambio di federazione
  const handleFederazioneChange = (name, selectedValue) => {
    setSelectedFederazione(selectedValue.value);
  };

  // Gestione del cambio di sesso
  const handleSessoChange = (name, selectedValue) => {
    setSelectedSesso(selectedValue.value);
  };

  // Gestione del cambio di mese
  const handleMeseChange = (name, selectedValue) => {
    setSelectedMese(selectedValue.value);
  };

  // Gestione del cambio di campo generico
  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validazione dei dati di base
  const validateBaseData = () => {
    if (isEmpty(formData.nome)) return false;
    if (isEmpty(formData.cognome)) return false;
    if (isEmpty(formData.birthJJ)) return false;
    if (!selectedMese) return false;
    if (isEmpty(formData.anno)) return false;
    if (!selectedComuneNascita) return false;
    if (!selectedComuneResidenza) return false;
    if (isEmpty(formData.indirizzo)) return false;
    if (isEmpty(formData.cap)) return false;
    if (!selectedTipoSocio) return false;
    
    // Se è tipo 3 (federazione), verifica che sia selezionata
    if (selectedTipoSocio.tipoId === 3 && !selectedFederazione) return false;

    return true;
  };

  // Invio del form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateBaseData()) {
      setAlertMessage('Tutti i campi obbligatori devono essere compilati.');
      setAlertVariant('danger');
      setShowAlert(true);
      return;
    }

    // Controllo preventivo solo per creazione nuovi soci
    if (mode === 'C' && selectedTipoSocio.tipoId === 3) {
      if (!selectedFederazione) {
        setShowConfirmFederazione(true);
        return;
      }
    }

    try {
      // Prepara i dati da inviare
      const socioData = {
        id: formData.id,
        nome: formData.nome.toUpperCase(),
        cognome: formData.cognome.toUpperCase(),
        sesso: selectedSesso.id,
        birthday: `${formData.birthJJ}-${selectedMese.id}-${formData.anno}`,
        birthProv: selectedComuneNascita ? selectedComuneNascita.provCode : formData.birthProv,
        birthCommune: selectedComuneNascita ? selectedComuneNascita.description : formData.birthCity,
        birthCommuneCode: selectedComuneNascita ? selectedComuneNascita.code : formData.birthCityCode,
        province: selectedComuneResidenza ? selectedComuneResidenza.provCode : formData.provRes,
        city: selectedComuneResidenza ? selectedComuneResidenza.description : formData.citta,
        corso: formData.indirizzo,
        cap: formData.cap,
        tipoSocio: selectedTipoSocio.tipoId,
        certifica: formData.dateCertificat ? formatDateForApi(formData.dateCertificat) : null,
        competition: formData.typeCertificat,
        telefono: formData.tel,
        email: formData.email,
        privacy: formData.privacy,
        federazione: selectedFederazione ? selectedFederazione.descrizione : null
      };

      let response;
      
      if (mode === 'C') {
        // Creazione nuovo socio
        response = await socioService.createSocio(socioData);
        
        if (response.data.returnCode) {
          setSocioCreated(response.data.socio);
          setShowAbbonamentoForm(true);
        } else {
          setAlertMessage(response.data.message || 'Errore durante la creazione del socio.');
          setAlertVariant('danger');
          setShowAlert(true);
        }
      } else {
        // Aggiornamento socio esistente
        response = await socioService.updateSocio(socioData);
        
        if (response.data.returnCode) {
          setSocioCreated(response.data.socio);
          setShowAbbonamentoForm(true);
          
          // Se c'è un abbonamento esistente, mostra i dati
          if (response.data.socio.abbonamento) {
            setNumeroTessera(response.data.socio.abbonamento.numeroTessara);
            if (response.data.socio.abbonamento.incription) {
              setDataIscrizione(new Date(response.data.socio.abbonamento.incription));
            }
            setAbboFirmato(response.data.socio.abbonamento.firmato);
          } else {
            setNumeroTessera('...');
          }
        } else {
          setAlertMessage(response.data.message || 'Errore durante l\'aggiornamento del socio.');
          setAlertVariant('danger');
          setShowAlert(true);
        }
      }
      
      // Esegui callback se presente
      if (onSave && response.data.returnCode) {
        onSave(response.data.socio);
      }
    } catch (error) {
      console.error('Errore durante il salvataggio:', error);
      setAlertMessage('Errore durante il salvataggio. Riprova più tardi.');
      setAlertVariant('danger');
      setShowAlert(true);
    }
  };

  // Creazione abbonamento
  const handleCreateAbbonamento = async () => {
    if (!dataIscrizione) {
      setAlertMessage('Data di iscrizione obbligatoria.');
      setAlertVariant('danger');
      setShowAlert(true);
      return;
    }

    try {
      const abboData = {
        idSocio: socioCreated.id,
        idAbonamento: 0,
        dateInscription: formatDateForApi(dataIscrizione),
        idAnno: annoSportiva.id,
        firmato: abboFirmato
      };

      const response = await abbonamentoService.updateAbonamento(abboData);
      
      if (response.data.returnCode) {
        setNumeroTessera(response.data.abbonamento.numeroTessara);
        setShowContinueButton(true);
      } else {
        setAlertMessage(response.data.message || 'Errore durante la creazione dell\'abbonamento.');
        setAlertVariant('danger');
        setShowAlert(true);
      }
    } catch (error) {
      console.error('Errore durante la creazione dell\'abbonamento:', error);
      setAlertMessage('Errore durante la creazione dell\'abbonamento. Riprova più tardi.');
      setAlertVariant('danger');
      setShowAlert(true);
    }
  };

  // Stampa ricevuta
  const handleStampaRicevuta = () => {
    goNewTab('ricevute/stampa', { idsocio: socioCreated.id, reprint: 0 });
  };

  // Stampa scheda
  const handleStampaScheda = () => {
    goNewTab('schede/stampa', { idsocio: socioCreated.id });
  };
  
  const [meseOptions] = useState([
    { id: '01', label: 'Gennaio' },
    { id: '02', label: 'Febbraio' },
    { id: '03', label: 'Marzo' },
    { id: '04', label: 'Aprile' },
    { id: '05', label: 'Maggio' },
    { id: '06', label: 'Giugno' },
    { id: '07', label: 'Luglio' },
    { id: '08', label: 'Agosto' },
    { id: '09', label: 'Settembre' },
    { id: '10', label: 'Ottobre' },
    { id: '11', label: 'Novembre' },
    { id: '12', label: 'Dicembre' },
  ]);