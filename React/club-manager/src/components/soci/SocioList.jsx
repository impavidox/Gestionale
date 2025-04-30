import React, { useState } from 'react';
import { Table, Button, Badge, Modal, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { formatDateDisplay } from '../../utils/dateUtils';
import { useApp } from '../../context/AppContext';

/**
 * Componente per visualizzare una lista di soci
 * @param {Array} soci - Lista dei soci da visualizzare
 * @param {Function} onSelect - Callback da eseguire quando si seleziona un socio
 * @param {Function} onRefresh - Callback da eseguire per aggiornare la lista
 */
const SocioList = ({ soci = [], onSelect, onRefresh }) => {
  const navigate = useNavigate();
  const { goNewTab } = useApp();
  
  const [selectedSocio, setSelectedSocio] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);

  // Gestione dello stato dello stato dell'abbonamento
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

  // Chiusura del modal
  const handleCloseModal = () => {
    setShowActionModal(false);
    setSelectedSocio(null);
  };

  // Gestione dettaglio socio
  const handleDettaglio = () => {
    if (onSelect) {
      onSelect(selectedSocio);
    } else {
      navigate(`/soci/${selectedSocio.id}`);
    }
    handleCloseModal();
  };

  // Gestione stampa ricevuta
  const handleStampaRicevuta = () => {
    if (selectedSocio.tesseraNumber === 0) {
      alert(`Il socio ${selectedSocio.nome} ${selectedSocio.cognome} non è iscritto per l'anno corrente.`);
      return;
    }
    
    goNewTab('ricevute/stampa', { idsocio: selectedSocio.id, reprint: 0 });
    handleCloseModal();
  };

  // Gestione stampa scheda
  const handleStampaScheda = () => {
    if (selectedSocio.tesseraNumber === 0) {
      alert(`Il socio ${selectedSocio.nome} ${selectedSocio.cognome} non è iscritto per l'anno corrente.`);
      return;
    }
    
    goNewTab('schede/stampa', { idsocio: selectedSocio.id });
    handleCloseModal();
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
              <th>Tessera</th>
              <th>Cognome</th>
              <th>Nome</th>
              <th>Residenza</th>
              <th>Telefono</th>
              <th>Certificato</th>
              <th>Stato</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {soci.map(socio => {
              const abbonamentoStatus = getAbbonamentoStatus(socio);
              
              return (
                <tr key={socio.id}>
                  <td>{socio.tesseraNumber || '---'}</td>
                  <td>{socio.cognome}</td>
                  <td>{socio.nome}</td>
                  <td>{socio.citta}</td>
                  <td>{socio.tel || '---'}</td>
                  <td>{socio.dateCertificat ? formatDateDisplay(socio.dateCertificat) : '---'}</td>
                  <td>
                    <Badge bg={abbonamentoStatus.variant}>
                      {abbonamentoStatus.label}
                    </Badge>
                  </td>
                  <td>
                    <Button 
                      variant="primary"
                      size="sm"
                      onClick={() => handleSelectSocio(socio)}
                    >
                      Azioni
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}

      {/* Modal per azioni sul socio */}
      <Modal show={showActionModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedSocio && `${selectedSocio.cognome} ${selectedSocio.nome}`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedSocio && (
            <Row>
              <Col xs={12} className="mb-2">
                <Button 
                  variant="primary" 
                  block 
                  className="w-100"
                  onClick={handleDettaglio}
                >
                  Dettaglio Socio
                </Button>
              </Col>
              <Col xs={12} className="mb-2">
                <Button 
                  variant="info" 
                  block 
                  className="w-100"
                  onClick={handleStampaRicevuta}
                >
                  Stampa Ricevuta
                </Button>
              </Col>
              <Col xs={12}>
                <Button 
                  variant="success" 
                  block 
                  className="w-100"
                  onClick={handleStampaScheda}
                >
                  Stampa Scheda
                </Button>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Chiudi
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default SocioList;