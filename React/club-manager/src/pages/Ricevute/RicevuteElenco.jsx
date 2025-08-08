import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Modal, Alert, Badge } from 'react-bootstrap';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import ricevutaService from '../../api/services/ricevutaService';
import activityService from '../../api/services/activityService';
import { formatDateDisplay } from '../../utils/dateUtils';
import Loader from '../../components/common/Loader';

/**
 * Pagina per visualizzare l'elenco delle ricevute di un socio
 */
const RicevuteElenco = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { goNewTab } = useApp();
  
  // Estrai parametri dall'URL
  const socioId = parseInt(searchParams.get('socioId') || '0');
  const cognome = searchParams.get('cognome') || '';
  const nome = searchParams.get('nome') || '';
  
  // Stati per i dati
  const [attivita, setAttivita] = useState([]);
  const [ricevute, setRicevute] = useState([]);
  const [selectedRicevuta, setSelectedRicevuta] = useState(null);
  
  // Stati per i modali
  const [showActionModal, setShowActionModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Stati per UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertVariant, setAlertVariant] = useState('danger');
  
  // Carica le ricevute all'avvio
  useEffect(() => {
    if (socioId) {
      getAttivitaMapping();
      fetchRicevute();
    }
  }, [socioId]);


  const getAttivitaMapping = async ()=>{
    try {
      setLoading(true);
      setError('');
      setShowAlert(false);
      const response = await activityService.retrieveAllActivities();
      // Handle different response structures
      let attivitaData = response.data.data;
      setAttivita(attivitaData);
      
    } catch (error) {
      console.error('Errore nel caricamento delle attività:', error);
      setError('Si è verificato un errore nel caricamento delle attività.');
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
      let ricevuteData = response.data.data.items;
      setRicevute(ricevuteData);
      console.log(ricevute)
      
    } catch (error) {
      console.error('Errore nel caricamento delle ricevute:', error);
      setError('Si è verificato un errore nel caricamento delle ricevute.');
      setAlertVariant('danger');
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
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
    setSelectedRicevuta(null);
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
            onClick={() => goNewTab('ricevute/stampa', { idsocio: socioId, reprint: 0 })}
          >
            <i className="bi bi-plus-circle me-1"></i>
            Nuova Ricevuta
          </Button>
        </Card.Header>
        <Card.Body>
          {ricevute.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-receipt fs-1 text-muted mb-3"></i>
              <p className="text-muted">Nessuna ricevuta trovata per questo socio.</p>
              <Button 
                variant="primary" 
                onClick={() => goNewTab('ricevute/stampa', { idsocio: socioId, reprint: 0 })}
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
                      <td>{attivita.find(item=> item.id===ricevuta.attivitàId).nome}</td>
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
                  <strong>{formatImporto(selectedRicevuta.importo || selectedRicevuta.ammontare)}</strong>
                </div>
              </div>
              <div className="row mt-2">
                <div className="col-12">
                  <small className="text-muted">Attività:</small><br/>
                  <strong>{selectedRicevuta.attivitaDesc || selectedRicevuta.attivita || 'N/D'}</strong>
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
                    <strong>{formatImporto(selectedRicevuta.importo || selectedRicevuta.ammontare)}</strong>
                  </div>
                  <div className="col-6">
                    <small className="text-muted">Attività:</small><br/>
                    <strong>{selectedRicevuta.attivitaDesc || selectedRicevuta.attivita || 'N/D'}</strong>
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