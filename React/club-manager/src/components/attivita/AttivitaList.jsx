import React, { useState } from 'react';
import { Table, Button, Badge, Modal } from 'react-bootstrap';

/**
 * Componente per visualizzare la lista delle attività
 * 
 * @param {Object} props - Props del componente
 * @param {Array} props.activities - Lista delle attività da visualizzare
 * @param {Function} props.onSelect - Callback da chiamare quando si seleziona un'attività
 */
const AttivitaList = ({ activities = [], onSelect }) => {
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Gestione della selezione di un'attività
  const handleSelectActivity = (activity) => {
    setSelectedActivity(activity);
    setShowModal(true);
  };
  
  // Chiusura del modale
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedActivity(null);
  };
  
  // Conferma selezione e passaggio al form di modifica
  const handleConfirmSelect = () => {
    if (onSelect && selectedActivity) {
      onSelect(selectedActivity);
    }
    setShowModal(false);
  };
  
  return (
    <div className="mt-4">
      <h6>Elenco Attività</h6>
      
      {activities.length === 0 ? (
        <p className="text-center mt-3">Nessuna attività trovata per questa famiglia.</p>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>ID</th>
              <th>Descrizione</th>
              <th>Affiliazioni</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity) => (
              <tr key={activity.id}>
                <td>{activity.id}</td>
                <td>{activity.description}</td>
                <td>
                  {activity.affiliazioneList && activity.affiliazioneList.map((aff, index) => (
                    <Badge 
                      key={aff.id} 
                      className="me-1" 
                      bg="primary"
                    >
                      {aff.descrizione || aff.name}
                    </Badge>
                  ))}
                  {(!activity.affiliazioneList || activity.affiliazioneList.length === 0) && (
                    <span className="text-muted">Nessuna affiliazione</span>
                  )}
                </td>
                <td>
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={() => handleSelectActivity(activity)}
                  >
                    Modifica
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      
      {/* Modal di conferma */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Conferma Modifica</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedActivity && (
            <p>
              Vuoi modificare l'attività <strong>{selectedActivity.description}</strong>?
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Annulla
          </Button>
          <Button variant="primary" onClick={handleConfirmSelect}>
            Modifica
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AttivitaList;