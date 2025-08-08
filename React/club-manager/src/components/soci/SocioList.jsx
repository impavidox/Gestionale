import React, { useState, useEffect } from 'react';
import { Table, Button, Badge, Modal, Row, Col, Form, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { formatDateDisplay, formatDateForApi } from '../../utils/dateUtils';
import { useApp } from '../../context/AppContext';
import SelectField from '../forms/SelectField';
import TextField from '../forms/TextField';
import DateField from '../forms/DateField';
import CheckboxField from '../forms/CheckboxField';
import activityService from '../../api/services/activityService';
import ricevutaService from '../../api/services/ricevutaService';

/**
 * Componente per visualizzare una lista di soci - Updated Version
 * @param {Array} soci - Lista dei soci da visualizzare
 * @param {Function} onSelect - Callback da eseguire quando si seleziona un socio
 * @param {Function} onRefresh - Callback da eseguire per aggiornare la lista
 */
const SocioList = ({ soci = [], onSelect, onRefresh }) => {
  const navigate = useNavigate();
  const { goNewTab } = useApp();
  
  const [selectedSocio, setSelectedSocio] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showRicevutaModal, setShowRicevutaModal] = useState(false);
  const [tipologiePagamento, setTipologiePagamento]= useState([{nome:'POS',id:1}, {nome:'Contanti',id:2}, {nome:'Bonifico',id:3}]);
  
  // Stati per il form della ricevuta
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
  
  // Stati per i dati delle select
  const [sezioni, setSezioni] = useState([]);
  const [attivita, setAttivita] = useState([]);
  
  // Stati per loading e errori
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertVariant, setAlertVariant] = useState('danger');

  // Carica le sezioni all'avvio
  useEffect(() => {
    const fetchSezioni = async () => {
      try {
        const response = await activityService.retrieveSezioni();
        setSezioni(response.data.data || []);
      } catch (error) {
        console.error('Errore nel caricamento delle sezioni:', error);
        // Fallback data per testing
        setSezioni([
          { id: 1, name: 'Arti Marziali' },
          { id: 2, name: 'Sport Acquatici' },
          { id: 3, name: 'Sport di Squadra' },
          { id: 4, name: 'Ginnastica e Fitness' },
          { id: 5, name: 'Sport Individuali' }
        ]);
      }
    };
    
    fetchSezioni();
  }, []);

  // Gestione dello stato dell'abbonamento
  const getAbbonamentoStatus = (socio) => {
    if (!socio.dateCertificat) return { status: 'missing', label: 'Mancante', variant: 'danger' };
    
    const today = new Date();
    const expiryDate = new Date(socio.dateCertificat);
    
    if (expiryDate < today) {
      return { status: 'expired', label: 'Scaduto', variant: 'danger' };
    }
    
    // Calcola se scade nel prossimo mese
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    if (expiryDate < nextMonth) {
      return { status: 'expiring', label: 'In scadenza', variant: 'warning' };
    }
    
    return { status: 'valid', label: 'Valido', variant: 'success' };
  };

  // Gestione della selezione di un socio
  const handleSelectSocio = (socio) => {
    setSelectedSocio(socio);
    setShowActionModal(true);
  };

  // Chiusura dei modali
  const handleCloseModals = () => {
    setShowActionModal(false);
    setShowRicevutaModal(false);
    setSelectedSocio(null);
    resetRicevutaForm();
    setError('');
    setSuccess('');
    setShowAlert(false);
  };

  // Reset del form ricevuta
  const resetRicevutaForm = () => {
    setRicevutaData({
      somma: 0,
      sommaIncassata: 0,
      scadenzaQuota: new Date(),
      scadenzaAbbonamento: new Date(),
      sezione: null,
      attivita: null,
      quotaAssociativa: false
    });
    setAttivita([]);
  };

  // Gestione aggiornamento socio
  const handleAggiornaSocio = () => {
    if (onSelect) {
      onSelect(selectedSocio);
    } else {
      navigate(`/soci/${selectedSocio.id}`);
    }
    handleCloseModals();
  };

const handleCreaNuovaRicevuta = () => {
  setShowActionModal(false);
  setShowRicevutaModal(true);

  // Calcola la prossima scadenza (31 agosto)
  const today = new Date();
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

  // Gestione stampa domanda associativa
  const handleStampaDomandaAssociativa = () => {
    goNewTab('schede/stampa', { idsocio: selectedSocio.id });
    handleCloseModals();
  };


  // Gestione elenco ricevute
  const handleElencoRicevute = async () => {
    try {
      setLoading(true);
      
      // Navigate to the new RicevuteElenco page with URL parameters
      navigate(`/ricevute/elenco?socioId=${selectedSocio.id}&cognome=${encodeURIComponent(selectedSocio.cognome)}&nome=${encodeURIComponent(selectedSocio.nome)}`);
      
      handleCloseModals();
    } catch (error) {
      console.error('Errore nella navigazione alle ricevute:', error);
      setError('Errore nella navigazione alle ricevute del socio');
      setAlertVariant('danger');
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  // Gestione cambio sezione
  const handleSezioneChange = async (name, selectedValue) => {
    setRicevutaData(prev => ({ 
      ...prev, 
      sezione: selectedValue.value,
      attivita: null // Reset attività quando cambia sezione
    }));
    
    // Carica attività per la sezione selezionata
    try {
      setLoading(true);
      const id= sezioni.find(item=>item.nome===selectedValue.value.value).id;
      const response = await activityService.retrieveActivitiesBySezione(id);
      setAttivita(response.data.data || []);
    } catch (error) {
      console.error('Errore nel caricamento delle attività:', error);
      // Fallback data
      setAttivita([
        { id: 1, description: 'Attività 1' },
        { id: 2, description: 'Attività 2' },
        { id: 3, description: 'Attività 3' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Gestione cambio attività
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

  // Gestione cambio campi form ricevuta
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
        socioId: selectedSocio.id,
        scadenzaQuota: formatDateForApi(ricevutaData.scadenzaQuota),
        scadenzaPagamento: formatDateForApi(ricevutaData.scadenzaAbbonamento),
        importoRicevuta: parseFloat(ricevutaData.somma),
        importoIncassato: parseFloat(ricevutaData.sommaIncassata) || 0,
        tipologiaPagamento: tipologiePagamento.find(item=>item.nome===ricevutaData.tipologiaPagamento.value).id,
        quotaAss: Number(ricevutaData.quotaAssociativa),
        attivitàId: attivita.find(item=>item.nome===ricevutaData.attivita.value).id,
        sezione: sezioni.find(item=>item.nome===ricevutaData.sezione.value).id,
      };
      console.log(ricevutaPayload)
      const response = await ricevutaService.createNewRicevuta(ricevutaPayload);
      
      if (response.data.testPrint || response.data.success) {
        setSuccess('Ricevuta creata con successo');
        setAlertVariant('success');
        setShowAlert(true);
        
        // Opzionalmente, apri la ricevuta in una nuova tab
        setTimeout(() => {
          goNewTab('ricevute/stampa', {
            idsocio: selectedSocio.id,
            reprint: 1,
            ricevuta: response.data.idRicevuta || response.data.id
          });
          
          handleCloseModals();
          
          // Refresh della lista se disponibile
          if (onRefresh) {
            onRefresh();
          }
        }, 1500);
        
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

  return (
    <>
      {soci.length === 0 ? (
        <div className="text-center my-4">
          <p>Nessun socio trovato</p>
        </div>
      ) : (
        <Table striped bordered hover responsive className="mt-3">
          <thead>
            <tr>
              <th>Cognome</th>
              <th>Nome</th>
              <th>Tipo</th>
              <th>N. Socio</th>
              <th>Telefono</th>
              <th>Data di Nascita</th>
              <th>Codice Fiscale</th>
              <th>Certificato</th>
              <th>Quota Ass.</th>
            </tr>
          </thead>
          <tbody>
            {soci.map(socio => {
              const abbonamentoStatus = getAbbonamentoStatus(socio);
              
              return (
                <tr key={socio.id} onClick={() => handleSelectSocio(socio)} style={{ cursor: 'pointer' }}>
                  <td>{socio.cognome}</td>
                  <td>{socio.nome}</td>
                  <td>{socio.TipoSocio}</td>
                  <td>{socio.NSocio}</td>
                  <td>{socio.telefono}</td>
                  <td>{socio.dataNascita ? formatDateDisplay(socio.dataNascita) : '---'}</td>
                  <td>{socio.codiceFiscale}</td>
                  <td>{socio.scadenzaCertificato ? formatDateDisplay(socio.scadenzaCertificato) : '---'}</td>
                  <td>
                    <Badge bg={abbonamentoStatus.variant}>
                      {abbonamentoStatus.label}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}

      {/* Modal per azioni sul socio */}
      <Modal show={showActionModal} onHide={handleCloseModals} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedSocio && `${selectedSocio.cognome} ${selectedSocio.nome}`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col xs={12} className="mb-2">
              <Button 
                variant="primary" 
                className="w-100 mb-2"
                onClick={handleAggiornaSocio}
              >
                Aggiorna Socio
              </Button>
              <Button 
                variant="success" 
                className="w-100 mb-2"
                onClick={handleCreaNuovaRicevuta}
              >
                Crea Nuova Ricevuta
              </Button>
              <Button 
                variant="info" 
                className="w-100 mb-2"
                onClick={handleStampaDomandaAssociativa}
              >
                Stampa Domanda Associativa
              </Button>
              <Button 
                variant="outline-primary" 
                className="w-100"
                onClick={handleElencoRicevute}
                disabled={loading}
              >
                {loading ? 'Caricamento...' : 'Elenco Ricevute'}
              </Button>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModals}>
            Chiudi
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal per creazione ricevuta */}
      <Modal show={showRicevutaModal} onHide={handleCloseModals} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            Crea Nuova Ricevuta - {selectedSocio && `${selectedSocio.cognome} ${selectedSocio.nome}`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
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
                  options={tipologiePagamento.map(item=>item.nome)}
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
            
            <Row>
              <Col md={6}>
                <DateField
                  label="Scadenza Quota"
                  name="scadenzaQuota"
                  value={ricevutaData.scadenzaQuota}
                  onChange={handleRicevutaInputChange}
                  required
                />
              </Col>
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
                  options={sezioni.map(item=>item.nome)}
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
                  options={attivita.map(item=>item.nome)}
                  onChange={handleAttivitaChange}
                  placeholder={!ricevutaData.sezione ? "Prima seleziona una sezione" : "Seleziona un'attività"}
                  isDisabled={!ricevutaData.sezione}
                  required
                />
              </Col>
            </Row>
            
            <Row>
              <Col md={12}>
                <CheckboxField
                  label="Quota Associativa"
                  name="quotaAssociativa"
                  checked={ricevutaData.quotaAssociativa}
                  onChange={handleRicevutaInputChange}
                />
              </Col>
            </Row>
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
    </>
  );
};

export default SocioList;