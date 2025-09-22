import React, { useState } from 'react';
import { Table, Button, Badge, Modal } from 'react-bootstrap';

/**
 * Componente per visualizzare la lista delle attività per sezioni
 * 
 * @param {Object} props - Props del componente
 * @param {Array} props.activities - Lista delle attività da visualizzare
 * @param {Function} props.onSelect - Callback da chiamare quando si seleziona un'attività per la modifica
 * @param {Function} props.onDelete - Callback da chiamare quando si elimina un'attività
 * @param {Boolean} props.loading - Stato di caricamento
 */
const AttivitaList = ({ activities = [], onSelect, onDelete, loading = false }) => {
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionType, setActionType] = useState('');
  
  // Gestione della selezione di un'attività per la modifica
  const handleSelectActivity = (activity, action = 'edit') => {
    setSelectedActivity(activity);
    setActionType(action);
    
    if (action === 'edit') {
      setShowEditModal(true);
    } else if (action === 'delete') {
      setShowDeleteModal(true);
    }
  };
  
  // Chiusura dei modali
  const handleCloseModals = () => {
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedActivity(null);
    setActionType('');
  };
  
  // Conferma modifica
  const handleConfirmEdit = () => {
    if (onSelect && selectedActivity) {
      onSelect(selectedActivity);
    }
    handleCloseModals();
  };
  
  // Conferma eliminazione
  const handleConfirmDelete = () => {
    if (onDelete && selectedActivity) {
      onDelete(selectedActivity);
    }
    handleCloseModals();
  };
  
  return (
    <div className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6>Elenco Attività</h6>
        <span className="text-muted">
          {activities.length} attività trovate
        </span>
      </div>
      
      {activities.length === 0 ? (
        <div className="text-center mt-4 p-4">
          <i className="fas fa-clipboard-list fa-3x text-muted mb-3"></i>
          <p className="text-muted">Nessuna attività trovata per questa sezione.</p>
          <p className="text-muted small">Le attività create appariranno qui.</p>
        </div>
      ) : (
        <Table striped bordered hover responsive>
          <thead className="table-dark">
            <tr>
              <th width="60">ID</th>
              <th>Nome Attività</th>
              <th width="120">Codice</th>
              <th width="200">Federazione</th>
              <th width="250">Email Referente</th>
              <th width="150" className="text-center">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity) => (
              <tr key={activity.id} className={loading ? 'opacity-50' : ''}>
                <td className="text-center">
                  <Badge bg="outline-secondary">{activity.id}</Badge>
                </td>
                <td>
                  <strong>{activity.nome}</strong>
                  {activity.sezioneNome && (
                    <div className="small text-muted">
                      Sezione: {activity.sezioneNome}
                    </div>
                  )}
                </td>
                <td className="text-center">
                  {activity.codice ? (
                    <Badge bg="info">{activity.codice}</Badge>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>
                <td>
                  {activity.federazioneNome ? (
                    <Badge bg="primary" className="px-2 py-1">
                      {activity.federazioneNome}
                    </Badge>
                  ) : (
                    <span className="text-muted">Non assegnata</span>
                  )}
                </td>
                <td>
                  {activity.emailReferente ? (
                    <a 
                      href={`mailto:${activity.emailReferente}`} 
                      className="text-decoration-none"
                      title={`Invia email a ${activity.emailReferente}`}
                    >
                      <i className="fas fa-envelope me-1"></i>
                      {activity.emailReferente}
                    </a>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>
                <td className="text-center">
                  <div className="btn-group" role="group">
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => handleSelectActivity(activity, 'edit')}
                      disabled={loading}
                      title="Modifica attività"
                    >
                      <i className="fas fa-edit"></i>
                    </Button>
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => handleSelectActivity(activity, 'delete')}
                      disabled={loading}
                      title="Elimina attività"
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      
      {/* Modal di conferma modifica */}
      <Modal show={showEditModal} onHide={handleCloseModals} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-edit text-primary me-2"></i>
            Conferma Modifica
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedActivity && (
            <div>
              <p className="mb-2">
                Vuoi modificare l'attività <strong>{selectedActivity.nome}</strong>?
              </p>
              <div className="bg-light p-3 rounded">
                <div className="row">
                  <div className="col-6">
                    <strong>ID:</strong> {selectedActivity.id}
                  </div>
                  <div className="col-6">
                    <strong>Codice:</strong> {selectedActivity.codice || 'Non assegnato'}
                  </div>
                </div>
                <div className="row mt-2">
                  <div className="col-12">
                    <strong>Federazione:</strong> {selectedActivity.federazioneNome || 'Non assegnata'}
                  </div>
                </div>
                {selectedActivity.emailReferente && (
                  <div className="row mt-2">
                    <div className="col-12">
                      <strong>Email:</strong> {selectedActivity.emailReferente}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModals}>
            Annulla
          </Button>
          <Button variant="primary" onClick={handleConfirmEdit}>
            <i className="fas fa-edit me-1"></i>
            Modifica
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Modal di conferma eliminazione */}
      <Modal show={showDeleteModal} onHide={handleCloseModals} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title>
            <i className="fas fa-exclamation-triangle text-warning me-2"></i>
            Conferma Eliminazione
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedActivity && (
            <div>
              <div className="alert alert-warning d-flex align-items-center" role="alert">
                <i className="fas fa-exclamation-triangle me-2"></i>
                <div>
                  <strong>Attenzione!</strong> Questa azione non può essere annullata.
                </div>
              </div>
              
              <p className="mb-2">
                Sei sicuro di voler eliminare l'attività <strong>{selectedActivity.nome}</strong>?
              </p>
              
              <div className="bg-light p-3 rounded border-start border-warning border-4">
                <div className="row">
                  <div className="col-6">
                    <strong>ID:</strong> {selectedActivity.id}
                  </div>
                  <div className="col-6">
                    <strong>Codice:</strong> {selectedActivity.codice || 'Non assegnato'}
                  </div>
                </div>
                <div className="row mt-2">
                  <div className="col-12">
                    <strong>Federazione:</strong> {selectedActivity.federazioneNome || 'Non assegnata'}
                  </div>
                </div>
                {selectedActivity.emailReferente && (
                  <div className="row mt-2">
                    <div className="col-12">
                      <strong>Email:</strong> {selectedActivity.emailReferente}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-3">
                <small className="text-muted">
                  <i className="fas fa-info-circle me-1"></i>
                  L'eliminazione sarà possibile solo se l'attività non è utilizzata da tesserati o ricevute esistenti.
                </small>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModals}>
            <i className="fas fa-times me-1"></i>
            Annulla
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            <i className="fas fa-trash me-1"></i>
            Elimina Attività
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AttivitaList;