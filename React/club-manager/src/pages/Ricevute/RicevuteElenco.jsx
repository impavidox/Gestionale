import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Modal, Alert, Badge, Row, Col, Form } from 'react-bootstrap';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import ricevutaService from '../../api/services/ricevutaService';
import activityService from '../../api/services/activityService';
import { formatDateDisplay, formatDateForApi } from '../../utils/dateUtils';
import Loader from '../../components/common/Loader';
import TextField from '../../components/forms/TextField';
import DateField from '../../components/forms/DateField';
import SelectField from '../../components/forms/SelectField';
import CheckboxField from '../../components/forms/CheckboxField';

/**
 * Pagina per visualizzare l'elenco delle ricevute di un socio
 */
const RicevuteElenco = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { goNewTab } = useApp();
  
  // Estrai parametri dall'URL
  const socioId = parseInt(searchParams.get('socioId') || '0');
  const tipoSocio = parseInt(searchParams.get('tipoSocio') || '0');
  const cognome = searchParams.get('cognome') || '';
  const nome = searchParams.get('nome') || '';
  const isNewSocio = searchParams.get('isNewSocio') === 'true';
  
  // Stati per i dati
  const [attivita, setAttivita] = useState([]);
  const [sezioni, setSezioni] = useState([]);
  const [ricevute, setRicevute] = useState([]);
  const [selectedRicevuta, setSelectedRicevuta] = useState(null);
  const [tipologiePagamento] = useState([
    {nome:'POS', id:1}, 
    {nome:'Contanti', id:2}, 
    {nome:'Bonifico', id:3}
  ]);
  
  // Stati per i modali
  const [showActionModal, setShowActionModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNewRicevutaModal, setShowNewRicevutaModal] = useState(false);
  
  // Stati per il form della ricevuta (copiato da SocioList)
  const [ricevutaData, setRicevutaData] = useState({
    dataRicevuta: new Date(),
    tipologiaPagamento: 0,
    somma: 0,
    sommaIncassata: 0,
    scadenzaQuota: new Date(),
    scadenzaAbbonamento: new Date(),
    sezione: null,
    attivita: null,
    quotaAssociativa: false
  });
  
  // Stati per UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertVariant, setAlertVariant] = useState('danger');
  const [isFirstRicevuta, setIsFirstRicevuta] = useState(false);
  
  // Carica i dati necessari all'avvio
  useEffect(() => {
    if (socioId) {
      loadInitialData();
      fetchRicevute();
    }
  }, [socioId]);

  // Mostra automaticamente il modal per i nuovi soci
  useEffect(() => {
    if (isNewSocio && ricevute.length === 0) {
      // Mostra automaticamente il modal per creare la prima ricevuta
      handleShowNewRicevutaModal();
    }
  }, [isNewSocio, ricevute.length]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError('');
      setShowAlert(false);
      
      // Carica sezioni e attività
      const [sezioniResponse, attivitaResponse] = await Promise.all([
        activityService.retrieveSezioni(),
        activityService.retrieveAllActivities()
      ]);
      
      setSezioni(sezioniResponse.data.data || []);
      setAttivita(attivitaResponse.data.data || []);
      
    } catch (error) {
      console.error('Errore nel caricamento dei dati iniziali:', error);
      setError('Si è verificato un errore nel caricamento dei dati iniziali.');
      setAlertVariant('danger');
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };
  
  // Carica le ricevute dal server
  const fetchRicevute = async () => {
    try {
      setLoading(true);
      setError('');
      setShowAlert(false);
      const response = await ricevutaService.retrieveRicevutaForUser(socioId);
      // Handle different response structures
      let ricevuteData = [];
      if (response.data?.data?.items) {
        ricevuteData = response.data.data.items;
      } else if (response.data?.items) {
        ricevuteData = response.data.items;
      } else if (Array.isArray(response.data)) {
        ricevuteData = response.data;
      }
      
      setRicevute(ricevuteData);
      
    } catch (error) {
      console.error('Errore nel caricamento delle ricevute:', error);
      setError('Si è verificato un errore nel caricamento delle ricevute.');
      setAlertVariant('danger');
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  // Gestisce l'apertura del modal per nuova ricevuta
  const handleShowNewRicevutaModal = () => {
    setIsFirstRicevuta(ricevute.length === 0);
    setShowNewRicevutaModal(true);

    // Calcola la prossima scadenza (31 agosto)
    const today = new Date();
    console.log(today)
    const year = today.getFullYear();
    const august31stThisYear = new Date(year, 7, 31); // August is month 7 (0-indexed)

    const scadenzaQuota = (today > august31stThisYear)
      ? new Date(year + 1, 7, 31)
      : august31stThisYear;

    // Inizializza i valori di default
    setRicevutaData(prev => ({
      ...prev,
      dataRicevuta: today,
      scadenzaQuota: scadenzaQuota,
      scadenzaAbbonamento: new Date(new Date().getFullYear(), new Date().getMonth()+6, new Date().getDate())
    }));
  };
  
  // Gestisce il click su una riga della tabella
  const handleRowClick = (ricevuta) => {
    setSelectedRicevuta(ricevuta);
    setShowActionModal(true);
  };
  
  // Chiude i modali
  const handleCloseModals = () => {
    setShowActionModal(false);
    setShowDeleteModal(false);
    setShowNewRicevutaModal(false);
    setSelectedRicevuta(null);
    resetRicevutaForm();
  };

  // Reset del form ricevuta
  const resetRicevutaForm = () => {
    setRicevutaData({
      dataRicevuta: new Date(),
      tipologiaPagamento: 0,
      somma: 0,
      sommaIncassata: 0,
      scadenzaQuota: new Date(),
      scadenzaAbbonamento: new Date(),
      sezione: null,
      attivita: null,
      quotaAssociativa: false
    });
  };

  // Gestione cambio sezione nel form ricevuta
  const handleSezioneChange = async (name, selectedValue) => {
    setRicevutaData(prev => ({ 
      ...prev, 
      sezione: selectedValue.value,
      attivita: null // Reset attività quando cambia sezione
    }));
    
    // Carica attività per la sezione selezionata
    try {
      setLoading(true);
      const sezioneId = sezioni.find(item => item.nome === selectedValue.value.value).id;
      const response = await activityService.retrieveActivitiesBySezione(sezioneId);
      // Filtra solo le attività di questa sezione
      const attivitaSezione = response.data.data || [];
      // Aggiorna lo stato delle attività mantenendo quelle esistenti e aggiungendo quelle nuove
      setAttivita(prev => {
        const existingIds = prev.map(att => att.id);
        const newAttivita = attivitaSezione.filter(att => !existingIds.includes(att.id));
        return [...prev, ...newAttivita];
      });
    } catch (error) {
      console.error('Errore nel caricamento delle attività:', error);
    } finally {
      setLoading(false);
    }
  };

  // Gestione cambio altri campi del form
  const handleAttivitaChange = (name, selectedValue) => {
    setRicevutaData(prev => ({ 
      ...prev, 
      attivita: selectedValue.value 
    }));
  };

  const handlePagamentoChange = (name, selectedValue) => {  
    setRicevutaData(prev => ({ 
      ...prev, 
      tipologiaPagamento: selectedValue.value 
    }));
  };

  const handleRicevutaInputChange = (name, value) => {
    setRicevutaData(prev => ({ 
      ...prev, 
      [name]: value 
    }));
  };

  // Gestione salvataggio ricevuta
  const handleSalvaRicevuta = async () => {
    // Validazione
    if (!ricevutaData.sezione) {
      setError('Selezionare una sezione');
      setAlertVariant('danger');
      setShowAlert(true);
      return;
    }
    
    if (!ricevutaData.attivita) {
      setError('Selezionare un\'attività');
      setAlertVariant('danger');
      setShowAlert(true);
      return;
    }
    
    if (!ricevutaData.somma || ricevutaData.somma <= 0) {
      setError('Inserire un importo valido');
      setAlertVariant('danger');
      setShowAlert(true);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setShowAlert(false);


      const ricevutaPayload = {
        dataRicevuta: formatDateForApi(ricevutaData.dataRicevuta),
        socioId: socioId,
        scadenzaQuota: formatDateForApi(ricevutaData.scadenzaQuota),
        scadenzaPagamento: formatDateForApi(ricevutaData.scadenzaAbbonamento),
        importoRicevuta: parseFloat(ricevutaData.somma),
        importoIncassato: parseFloat(ricevutaData.sommaIncassata) || 0,
        tipologiaPagamento: tipologiePagamento.find(item => item.nome === ricevutaData.tipologiaPagamento.value).id,
        quotaAss: Number(ricevutaData.quotaAssociativa),
        attivitàId: attivita.find(item => item.nome === ricevutaData.attivita.value).id,
        sezione: sezioni.find(item => item.nome === ricevutaData.sezione.value).id,
      };
      
      const response = await ricevutaService.createNewRicevuta(ricevutaPayload);
      
      if (response.data.testPrint || response.data.success) {
        setSuccess('Ricevuta creata con successo');
        setAlertVariant('success');
        setShowAlert(true);
        
        // Chiudi il modal
        handleCloseModals();
        
        // Ricarica le ricevute
        await fetchRicevute();
        
        // Se è la prima ricevuta (per un nuovo socio), apri la stampa della domanda associativa
        if (isNewSocio && tipoSocio === 1) {
          setTimeout(() => {
            goNewTab('domanda-associativa/stampa', {
              socioId: socioId,
              attivita: ricevutaData.attivita.value,
              privacy: 1
            });
          }, 1000);
        } else if (isFirstRicevuta && tipoSocio === 1) {
            setTimeout(() => {
            goNewTab('domanda-associativa/stampa', {
              socioId: socioId,
              attivita: ricevutaData.attivita.value,
              privacy:0
            });
          }, 1000);
        } else if (isNewSocio) {
            setTimeout(() => {
            goNewTab('domanda-associativa/stampa', {
              socioId: socioId,
              attivita: ricevutaData.attivita.value,
              privacy:1,
              tesserato:1
            });
          }, 1000);
        }
        
      } else {
        throw new Error(response.data.messageError || 'Errore nella creazione della ricevuta');
      }
      
    } catch (error) {
      console.error('Errore nella creazione della ricevuta:', error);
      setError(error.message || 'Errore nella creazione della ricevuta');
      setAlertVariant('danger');
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };
  
  // Gestisce la visualizzazione di una ricevuta
  const handleVisualizeRicevuta = () => {
    if (!selectedRicevuta) return;
    
    goNewTab('ricevute/stampa', {
      reprint: 1,
      idsocio: socioId,
      abbo: selectedRicevuta.idAttivitaAbbonamentoAffiliazione || selectedRicevuta.idAbbonamento || 0,
      ricevuta: selectedRicevuta.idRicevuta || selectedRicevuta.id
    });
    
    handleCloseModals();
  };
  
  // Gestisce la modifica di una ricevuta
  const handleModifyRicevuta = () => {
    if (!selectedRicevuta) return;
    
    goNewTab('ricevute/stampa', {
      reprint: 2,
      idsocio: socioId,
      abbo: selectedRicevuta.idAttivitaAbbonamentoAffiliazione || selectedRicevuta.idAbbonamento || 0,
      ricevuta: selectedRicevuta.idRicevuta || selectedRicevuta.id
    });
    
    handleCloseModals();
  };
  
  // Apre il modal di conferma eliminazione
  const handleOpenDeleteModal = () => {
    setShowActionModal(false);
    setShowDeleteModal(true);
  };
  
  // Gestisce l'eliminazione di una ricevuta
  const handleDeleteRicevuta = async () => {
    if (!selectedRicevuta) return;
    
    try {
      setLoading(true);
      setError('');
      setShowAlert(false);
      
      const body = {
        idRicevuta: selectedRicevuta.idRicevuta || selectedRicevuta.id
      };
      
      const response = await ricevutaService.annulRicevuta(body);
      
      if (response.data.rc || response.data.success) {
        setSuccess('Ricevuta eliminata con successo.');
        setAlertVariant('success');
        setShowAlert(true);
        
        // Ricarica la lista delle ricevute
        await fetchRicevute();
        
        handleCloseModals();
      } else {
        throw new Error(response.data.message || 'Errore nell\'eliminazione della ricevuta');
      }
      
    } catch (error) {
      console.error('Errore nell\'eliminazione della ricevuta:', error);
      setError(error.message || 'Si è verificato un errore nell\'eliminazione della ricevuta.');
      setAlertVariant('danger');
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };
  
  // Torna alla pagina precedente
  const handleGoBack = () => {
    navigate(-1);
  };
  
  // Determina lo stato della ricevuta
  const getRicevutaStatus = (ricevuta) => {
    if (ricevuta.annullata || ricevuta.cancelled) {
      return { label: 'Annullata', variant: 'danger' };
    }
    
    if (ricevuta.incassata || ricevuta.paid) {
      return { label: 'Incassata', variant: 'success' };
    }
    
    return { label: 'Attiva', variant: 'primary' };
  };
  
  // Formatta l'importo
  const formatImporto = (importo) => {
    if (!importo) return '0,00 €';
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(importo);
  };
  
  return (
    <Container className="mt-4 mb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Elenco Ricevute</h2>
          <p className="text-muted mb-0">
            Socio: <strong>{cognome} {nome}</strong>
            {isNewSocio && <Badge bg="success" className="ms-2">Nuovo Socio</Badge>}
          </p>
        </div>
        <Button variant="secondary" onClick={handleGoBack}>
          <i className="bi bi-arrow-left me-1"></i>
          Torna Indietro
        </Button>
      </div>
      
      {showAlert && (
        <Alert 
          variant={alertVariant} 
          onClose={() => setShowAlert(false)} 
          dismissible
          className="mb-3"
        >
          {alertVariant === 'danger' ? error : success}
        </Alert>
      )}
      
      {loading && <Loader />}
      
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Ricevute ({ricevute.length})</h5>
          <Button 
            variant="success" 
            onClick={handleShowNewRicevutaModal}
          >
            <i className="bi bi-plus-circle me-1"></i>
            {ricevute.length === 0 ? 'Crea Prima Ricevuta' : 'Nuova Ricevuta'}
          </Button>
        </Card.Header>
        <Card.Body>
          {ricevute.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-receipt fs-1 text-muted mb-3"></i>
              <p className="text-muted">
                {isNewSocio 
                  ? 'Benvenuto! Crea la prima ricevuta per questo socio.'
                  : 'Nessuna ricevuta trovata per questo socio.'
                }
              </p>
              <Button 
                variant="primary" 
                onClick={handleShowNewRicevutaModal}
              >
                Crea Prima Ricevuta
              </Button>
            </div>
          ) : (
            <Table striped bordered hover responsive className="mb-0">
              <thead>
                <tr>
                  <th>Numero</th>
                  <th>Data</th>
                  <th>Attività</th>
                  <th>Importo</th>
                  <th>Incassato</th>
                </tr>
              </thead>
              <tbody>
                {ricevute.map((ricevuta, index) => {
                  const status = getRicevutaStatus(ricevuta);
                  
                  return (
                    <tr 
                      key={ricevuta.idRicevuta || ricevuta.id || index}
                      onClick={() => handleRowClick(ricevuta)}
                      style={{ cursor: 'pointer' }}
                      className="table-row-hover"
                    >
                      <td>
                        <strong>{ricevuta.numero || ricevuta.numeroRicevuta || `#${ricevuta.idRicevuta || ricevuta.id}`}</strong>
                      </td>
                      <td>{formatDateDisplay(ricevuta.dataRicevuta || ricevuta.data)}</td>
                      <td>{attivita.find(item=> item.id===ricevuta.attivitàId)?.nome || 'N/D'}</td>
                      <td className="text-end">
                        <strong>{formatImporto(ricevuta.importoRicevuta)}</strong>
                      </td>
                      <td className="text-end">
                        {formatImporto(ricevuta.importoIncassato)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
      
      {/* Modal per creazione nuova ricevuta */}
      <Modal show={showNewRicevutaModal} onHide={handleCloseModals} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {ricevute.length === 0 ? 'Crea Prima Ricevuta' : 'Crea Nuova Ricevuta'} - {cognome} {nome}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <DateField
                  label="Data Ricevuta"
                  name="dataRicevuta"
                  value={ricevutaData.dataRicevuta}
                  onChange={handleRicevutaInputChange}
                  required
                />
              </Col>
              <Col md={6}>
                <SelectField
                  label="Tipologia Pagamento"
                  name="tipologiaPagamento"
                  value={ricevutaData.tipologiaPagamento}
                  options={tipologiePagamento.map(item => item.nome)}
                  onChange={handlePagamentoChange}
                  placeholder="Seleziona metodo pagamento"
                  required
                />
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <TextField
                  label="Somma (€)"
                  name="somma"
                  value={ricevutaData.somma}
                  onChange={handleRicevutaInputChange}
                  type="number"
                  step="1"
                  min="0"
                  required
                />
              </Col>
              <Col md={6}>
                <TextField
                  label="Somma Incassata (€)"
                  name="sommaIncassata"
                  value={ricevutaData.sommaIncassata}
                  onChange={handleRicevutaInputChange}
                  type="number"
                  step="1"
                  min="0"
                  required
                />
              </Col>
            </Row>
            
            <Row>{tipoSocio===1&&
              <Col md={6}>
                <DateField
                  label="Scadenza Quota"
                  name="scadenzaQuota"
                  value={ricevutaData.scadenzaQuota}
                  onChange={handleRicevutaInputChange}
                  required
                />
              </Col>}
              <Col md={6}>
                <DateField
                  label="Scadenza Abbonamento"
                  name="scadenzaAbbonamento"
                  value={ricevutaData.scadenzaAbbonamento}
                  onChange={handleRicevutaInputChange}
                  required
                />
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <SelectField
                  label="Sezione"
                  name="sezione"
                  value={ricevutaData.sezione}
                  options={sezioni.map(item => item.nome)}
                  onChange={handleSezioneChange}
                  placeholder="Seleziona una sezione"
                  required
                />
              </Col>
              <Col md={6}>
                <SelectField
                  label="Attività"
                  name="attivita"
                  value={ricevutaData.attivita}
                  options={attivita.filter(att => 
                    ricevutaData.sezione ? 
                    att.sezioneId === sezioni.find(s => s.nome === ricevutaData.sezione.value)?.id :
                    true
                  ).map(item => item.nome)}
                  onChange={handleAttivitaChange}
                  placeholder={!ricevutaData.sezione ? "Prima seleziona una sezione" : "Seleziona un'attività"}
                  isDisabled={!ricevutaData.sezione}
                  required
                />
              </Col>
            </Row>
            {tipoSocio===1&&
            <Row>
              <Col md={12}>
                <CheckboxField
                  label="Quota Associativa"
                  name="quotaAssociativa"
                  checked={ricevutaData.quotaAssociativa}
                  onChange={handleRicevutaInputChange}
                />
              </Col>
            </Row>}

            {ricevute.length === 0 && (
              <Alert variant="info" className="mt-3">
                <i className="bi bi-info-circle me-2"></i>
                <strong>Prima ricevuta:</strong> Dopo la creazione verrà automaticamente aperta la stampa della domanda associativa e del modulo privacy.
              </Alert>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModals} disabled={loading}>
            Annulla
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSalvaRicevuta}
            disabled={loading}
          >
            {loading ? 'Creazione...' : 'Crea Ricevuta'}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Modal per azioni sulla ricevuta */}
      <Modal show={showActionModal} onHide={handleCloseModals} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            Azioni Ricevuta
            {selectedRicevuta && (
              <div className="text-muted fs-6 mt-1">
                N. {selectedRicevuta.numero || selectedRicevuta.numeroRicevuta || `#${selectedRicevuta.idRicevuta || selectedRicevuta.id}`}
              </div>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRicevuta && (
            <div className="mb-3">
              <div className="row">
                <div className="col-6">
                  <small className="text-muted">Data:</small><br/>
                  <strong>{formatDateDisplay(selectedRicevuta.dataRicevuta || selectedRicevuta.data)}</strong>
                </div>
                <div className="col-6">
                  <small className="text-muted">Importo:</small><br/>
                  <strong>{formatImporto(selectedRicevuta.importoRicevuta || selectedRicevuta.ammontare)}</strong>
                </div>
              </div>
              <div className="row mt-2">
                <div className="col-12">
                  <small className="text-muted">Attività:</small><br/>
                  <strong>{selectedRicevuta.attivitaNome || selectedRicevuta.attivita || 'N/D'}</strong>
                </div>
              </div>
            </div>
          )}
          
          <div className="d-grid gap-2">
            <Button variant="primary" onClick={handleVisualizeRicevuta}>
              <i className="bi bi-eye me-2"></i>
              Visualizza Ricevuta
            </Button>
            <Button variant="warning" onClick={handleModifyRicevuta}>
              <i className="bi bi-pencil me-2"></i>
              Modifica Ricevuta
            </Button>
            <Button variant="danger" onClick={handleOpenDeleteModal}>
              <i className="bi bi-trash me-2"></i>
              Elimina Ricevuta
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModals}>
            Chiudi
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Modal di conferma eliminazione */}
      <Modal show={showDeleteModal} onHide={handleCloseModals} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Conferma Eliminazione
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRicevuta && (
            <div>
              <p className="mb-3">
                Sei sicuro di voler eliminare la seguente ricevuta?
              </p>
              <div className="bg-light p-3 rounded">
                <div className="row">
                  <div className="col-6">
                    <small className="text-muted">Numero:</small><br/>
                    <strong>{selectedRicevuta.numero || selectedRicevuta.numeroRicevuta || `#${selectedRicevuta.idRicevuta || selectedRicevuta.id}`}</strong>
                  </div>
                  <div className="col-6">
                    <small className="text-muted">Data:</small><br/>
                    <strong>{formatDateDisplay(selectedRicevuta.dataRicevuta || selectedRicevuta.data)}</strong>
                  </div>
                </div>
                <div className="row mt-2">
                  <div className="col-6">
                    <small className="text-muted">Importo:</small><br/>
                    <strong>{formatImporto(selectedRicevuta.importoRicevuta || selectedRicevuta.ammontare)}</strong>
                  </div>
                  <div className="col-6">
                    <small className="text-muted">Attività:</small><br/>
                    <strong>{selectedRicevuta.attivitaNome || selectedRicevuta.attivita || 'N/D'}</strong>
                  </div>
                </div>
              </div>
              <div className="alert alert-warning mt-3 mb-0">
                <small>
                  <i className="bi bi-info-circle me-1"></i>
                  Questa azione non può essere annullata.
                </small>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModals} disabled={loading}>
            Annulla
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteRicevuta}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Eliminazione...
              </>
            ) : (
              <>
                <i className="bi bi-trash me-2"></i>
                Elimina Ricevuta
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default RicevuteElenco;