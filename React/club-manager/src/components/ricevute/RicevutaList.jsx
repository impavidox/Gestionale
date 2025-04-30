import React, { useState } from 'react';
import { Card, Table, Button, Modal, Form, Alert, Row, Col } from 'react-bootstrap';
import { useApp } from '../../context/AppContext';
import { formatDateDisplay } from '../../utils/dateUtils';
import ricevutaService from '../../api/services/ricevutaService';
import Loader from '../common/Loader';

/**
 * Componente per la visualizzazione e gestione delle ricevute
 * 
 * @param {Object} props - Props del componente
 * @param {Array} props.ricevute - Lista delle ricevute da visualizzare
 * @param {Function} props.onBack - Callback da chiamare per tornare indietro
 * @param {Function} props.onUpdate - Callback da chiamare dopo l'aggiornamento delle ricevute
 */
const RicevutaList = ({ ricevute = [], onBack, onUpdate }) => {
  const { goNewTab } = useApp();
  
  // Stati per la selezione e modifica di una ricevuta
  const [selectedRicevuta, setSelectedRicevuta] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showIncassoModal, setShowIncassoModal] = useState(false);
  
  // Stati per UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertVariant, setAlertVariant] = useState('danger');
  
  // Gestione della selezione di una ricevuta
  const handleRicevutaSelect = (ricevuta) => {
    setSelectedRicevuta(ricevuta);
    setShowActionModal(true);
  };
  
  // Chiude i modali
  const handleCloseModals = () => {
    setShowActionModal(false);
    setShowIncassoModal(false);
    setSelectedRicevuta(null);
  };
  
  // Gestione visualizzazione ricevuta
  const handleVisuRicevuta = () => {
    if (!selectedRicevuta) return;
    
    goNewTab('ricevute/stampa', {
      reprint: 1,
      idsocio: selectedRicevuta.idSocio,
      abbo: selectedRicevuta.idAttivitaAbbonamentoAffiliazione,
      ricevuta: selectedRicevuta.idRicevuta
    });
    
    handleCloseModals();
  };
  
  // Gestione modifica ricevuta
  const handleEditRicevuta = () => {
    if (!selectedRicevuta) return;
    
    goNewTab('ricevute/stampa', {
      reprint: 2,
      idsocio: selectedRicevuta.idSocio,
      abbo: selectedRicevuta.idAttivitaAbbonamentoAffiliazione,
      ricevuta: selectedRicevuta.idRicevuta
    });
    
    handleCloseModals();
  };
  
  // Gestione apertura modale incasso
  const handleOpenIncassoModal = () => {
    setShowActionModal(false);
    setShowIncassoModal(true);
  };
  
  // Gestione conferma incasso
  const handleConfirmIncasso = async () => {
    if (!selectedRicevuta) return;
    
    try {
      setLoading(true);
      
      const body = {
        idRicevuta: selectedRicevuta.idRicevuta,
        sommaIncassato: selectedRicevuta.importoIncassato
      };
      
      const response = await ricevutaService.updateIncassi(body);
      
      setSuccess('La ricevuta è stata aggiornata.');
      setAlertVariant('success');
      setShowAlert(true);
      
      // Chiude i modali
      handleCloseModals();
      
      // Aggiorna la lista delle ricevute
      if (onUpdate) {
        onUpdate();
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Errore nell\'aggiornamento dell\'incasso:', error);
      setError('Si è verificato un errore nell\'aggiornamento dell\'incasso.');
      setAlertVariant('danger');
      setShowAlert(true);
      setLoading(false);
    }
  };
  
  // Gestione annullamento ricevuta
  const handleRemoveRicevuta = async () => {
    if (!selectedRicevuta) return;
    
    if (!window.confirm('Sei sicuro di voler annullare questa ricevuta?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      const body = {
        idRicevuta: selectedRicevuta.idRicevuta
      };
      
      const response = await ricevutaService.annulRicevuta(body);
      
      if (!response.data.rc) {
        throw new Error(response.data.message || 'Si è verificato un errore durante l\'annullamento della ricevuta.');
      }
      
      setSuccess('La ricevuta è stata annullata.');
      setAlertVariant('success');
      setShowAlert(true);
      
      // Chiude i modali
      handleCloseModals();
      
      // Aggiorna la lista delle ricevute
      if (onUpdate) {
        onUpdate();
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Errore nell\'annullamento della ricevuta:', error);
      setError(error.message || 'Si è verificato un errore nell\'annullamento della ricevuta.');
      setAlertVariant('danger');
      setShowAlert(true);
      setLoading(false);
    }
  };
  
  // Gestione cambio importo incassato
  const handleImportoIncassatoChange = (e) => {
    if (!selectedRicevuta) return;
    
    const value = e.target.value;
    setSelectedRicevuta({
      ...selectedRicevuta,
      importoIncassato: value
    });
  };
  
  return (
    <div>
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
      
      <div className="mb-4">
        <Button variant="secondary" onClick={onBack}>
          &laquo; Torna all'elenco
        </Button>
      </div>
      
      <Card>
        <Card.Header>
          <h5>Elenco Ricevute</h5>
        </Card.Header>
        <Card.Body>
          {ricevute.length === 0 ? (
            <p className="text-center">Nessuna ricevuta trovata.</p>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Numero</th>
                  <th>Data</th>
                  <th>Attività</th>
                  <th>Periodo</th>
                  <th>Importo</th>
                  <th>Incassato</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {ricevute.map((ricevuta) => (
                  <tr key={ricevuta.idRicevuta}>
                    <td>{ricevuta.numero}</td>
                    <td>{formatDateDisplay(ricevuta.dataRicevuta)}</td>
                    <td>{ricevuta.attivitaDesc}</td>
                    <td>{ricevuta.periodoDesc}</td>
                    <td className="text-end">{ricevuta.importo} €</td>
                    <td className="text-end">{ricevuta.importoIncassato || '0.00'} €</td>
                    <td>
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => handleRicevutaSelect(ricevuta)}
                      >
                        Azioni
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
      
      {/* Modal per azioni sulla ricevuta */}
      <Modal show={showActionModal} onHide={handleCloseModals} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedRicevuta && `Ricevuta n. ${selectedRicevuta.numero}`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRicevuta && (
            <Row>
              <Col xs={12} className="mb-2">
                <Button 
                  variant="primary" 
                  block 
                  className="w-100 mb-2"
                  onClick={handleVisuRicevuta}
                >
                  Visualizza Ricevuta
                </Button>
                <Button 
                  variant="info" 
                  block 
                  className="w-100 mb-2"
                  onClick={handleEditRicevuta}
                >
                  Modifica Ricevuta
                </Button>
                <Button 
                  variant="success" 
                  block 
                  className="w-100 mb-2"
                  onClick={handleOpenIncassoModal}
                >
                  Registra Incasso
                </Button>
                <Button 
                  variant="danger" 
                  block 
                  className="w-100"
                  onClick={handleRemoveRicevuta}
                >
                  Annulla Ricevuta
                </Button>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModals}>
            Chiudi
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Modal per registrazione incasso */}
      <Modal show={showIncassoModal} onHide={handleCloseModals} centered>
        <Modal.Header closeButton>
          <Modal.Title>Registra Incasso</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRicevuta && (
            <Form>
              <Form.Group>
                <Form.Label>Importo Incassato</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  value={selectedRicevuta.importoIncassato || ''}
                  onChange={handleImportoIncassatoChange}
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModals}>
            Annulla
          </Button>
          <Button 
            variant="primary" 
            onClick={handleConfirmIncasso}
            disabled={loading}
          >
            {loading ? 'Salvataggio...' : 'Conferma'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default RicevutaList;