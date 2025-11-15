import React, { useState, useEffect } from 'react';
import { Card, Table, Row, Col, Form, Button, Alert, Badge, Modal } from 'react-bootstrap';
import DateField from '../forms/DateField';
import { formatDateForApi, formatDateDisplay } from '../../utils/dateUtils';
import entiService from '../../api/services/entiService';
import Loader from '../common/Loader';
import { useApp } from '../../context/AppContext';
import EntiForm from './EntiForm';

/**
 * Componente per la visualizzazione e gestione della prima nota enti
 */
const EntiList = () => {
  const { goNewTab } = useApp();

  // Stati per i filtri
  const [beginDate, setBeginDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Stati per i dati
  const [ricevuteEnti, setRicevuteEnti] = useState([]);
  const [totaleGenerale, setTotaleGenerale] = useState(0);

  // Stati per la modale di creazione/modifica
  const [showModal, setShowModal] = useState(false);
  const [editingRicevuta, setEditingRicevuta] = useState(null);

  // Stati per la modale di eliminazione
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingRicevuta, setDeletingRicevuta] = useState(null);

  // Stati per errori e loading
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Carica i dati all'avvio
  useEffect(() => {
    loadRicevuteEnti();
  }, []);

  /**
   * Carica le ricevute enti dal server
   */
  const loadRicevuteEnti = async () => {
    try {
      setLoading(true);
      setError('');

      const startDate = beginDate ? formatDateForApi(beginDate) : null;
      const endDateFormatted = endDate ? formatDateForApi(endDate) : null;

      const response = await entiService.retrieveAllRicevuteEnti(startDate, endDateFormatted);
      console.log('Ricevute enti response:', response);

      if (response.data.data && response.data) {
        setRicevuteEnti(response.data.data.items || []);
        setTotaleGenerale(response.data.data.totaleGenerale || 0);
      }

    } catch (err) {
      console.error('Errore nel caricamento ricevute enti:', err);
      setError('Errore nel caricamento delle ricevute enti');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gestisce il filtro per date
   */
  const handleFilter = () => {
    loadRicevuteEnti();
  };

  /**
   * Reset filtri
   */
  const handleResetFilters = () => {
    setBeginDate(null);
    setEndDate(null);
    // Ricarica senza filtri
    setTimeout(() => {
      loadRicevuteEnti();
    }, 100);
  };

  /**
   * Apre la modale per creare una nuova ricevuta
   */
  const handleNuovaRicevuta = () => {
    setEditingRicevuta(null);
    setShowModal(true);
  };

  /**
   * Apre la modale per modificare una ricevuta esistente
   */
  const handleEditRicevuta = (ricevuta) => {
    setEditingRicevuta(ricevuta);
    setShowModal(true);
  };

  /**
   * Chiude la modale
   */
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRicevuta(null);
  };

  /**
   * Gestisce il salvataggio di una ricevuta (creazione o modifica)
   */
  const handleSaveRicevuta = async (ricevutaData) => {
    try {
      setLoading(true);

      if (editingRicevuta) {
        // Modifica
        await entiService.updateRicevutaEnti({ ...ricevutaData, id: editingRicevuta.id });
        setSuccessMessage('Ricevuta aggiornata con successo');
      } else {
        // Creazione
        await entiService.createRicevutaEnti(ricevutaData);
        setSuccessMessage('Ricevuta creata con successo');
      }

      setShowSuccess(true);
      handleCloseModal();
      loadRicevuteEnti(); // Ricarica la lista

      // Nascondi il messaggio dopo 3 secondi
      setTimeout(() => setShowSuccess(false), 3000);

    } catch (err) {
      console.error('Errore nel salvataggio ricevuta enti:', err);
      setError('Errore nel salvataggio della ricevuta');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Apre la modale di conferma eliminazione
   */
  const handleDeleteClick = (ricevuta) => {
    setDeletingRicevuta(ricevuta);
    setShowDeleteModal(true);
  };

  /**
   * Chiude la modale di eliminazione
   */
  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingRicevuta(null);
  };

  /**
   * Conferma ed esegue l'eliminazione di una ricevuta
   */
  const handleConfirmDelete = async () => {
    if (!deletingRicevuta) return;

    try {
      setLoading(true);
      await entiService.deleteRicevutaEnti(deletingRicevuta.id);
      setSuccessMessage('Ricevuta eliminata con successo');
      setShowSuccess(true);
      handleCloseDeleteModal();
      loadRicevuteEnti(); // Ricarica la lista

      // Nascondi il messaggio dopo 3 secondi
      setTimeout(() => setShowSuccess(false), 3000);

    } catch (err) {
      console.error('Errore nell\'eliminazione ricevuta enti:', err);
      setError('Errore nell\'eliminazione della ricevuta');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Formatta l'importo in euro
   */
  const formatImporto = (importo) => {
    return `€ ${(importo / 100).toFixed(2)}`;
  };

  /**
   * Calcola il saldo progressivo
   */
  const getRicevuteWithSaldo = () => {
    let saldoProgressivo = 0;
    return ricevuteEnti.map(ricevuta => {
      saldoProgressivo += ricevuta.importo || 0;
      return {
        ...ricevuta,
        saldoProgressivo
      };
    });
  };

  const ricevuteWithSaldo = getRicevuteWithSaldo();

  return (
    <div className="prima-nota-enti">
      {loading && <Loader />}

      {/* Alert per errori */}
      {showError && (
        <Alert variant="danger" onClose={() => setShowError(false)} dismissible>
          {error}
        </Alert>
      )}

      {/* Alert per successo */}
      {showSuccess && (
        <Alert variant="success" onClose={() => setShowSuccess(false)} dismissible>
          {successMessage}
        </Alert>
      )}

      <Card className="mb-3">
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Prima Nota Enti</h5>
            <Button variant="primary" onClick={handleNuovaRicevuta}>
              + Nuova Ricevuta
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {/* Filtri */}
          <Form>
            <Row className="mb-3">
              <Col md={4}>
                <DateField
                  label="Data Inizio"
                  value={beginDate}
                  onChange={setBeginDate}
                />
              </Col>
              <Col md={4}>
                <DateField
                  label="Data Fine"
                  value={endDate}
                  onChange={setEndDate}
                />
              </Col>
              <Col md={4} className="d-flex align-items-end">
                <Button
                  variant="primary"
                  onClick={handleFilter}
                  className="me-2"
                >
                  Filtra
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleResetFilters}
                >
                  Reset
                </Button>
              </Col>
            </Row>
          </Form>

          {/* Totale */}
          <Row className="mb-3">
            <Col>
              <Alert variant="info">
                <strong>Totale Generale: </strong>
                {formatImporto(totaleGenerale)}
              </Alert>
            </Col>
          </Row>

          {/* Tabella */}
          {ricevuteWithSaldo.length === 0 ? (
            <Alert variant="warning">Nessuna ricevuta trovata</Alert>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Data</th>
                  <th>Ente</th>
                  <th>Importo</th>
                  <th>Saldo Progressivo</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {ricevuteWithSaldo.map((ricevuta, index) => (
                  <tr key={ricevuta.id}>
                    <td>{index + 1}</td>
                    <td>{formatDateDisplay(ricevuta.dataRicevuta)}</td>
                    <td>{ricevuta.ente}</td>
                    <td className="text-end">
                      <Badge bg="success">{formatImporto(ricevuta.importo)}</Badge>
                    </td>
                    <td className="text-end">
                      <strong>{formatImporto(ricevuta.saldoProgressivo)}</strong>
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => handleEditRicevuta(ricevuta)}
                      >
                        Modifica
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteClick(ricevuta)}
                      >
                        Elimina
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Modale per creazione/modifica ricevuta */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingRicevuta ? 'Modifica Ricevuta' : 'Nuova Ricevuta'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <EntiForm
            ricevuta={editingRicevuta}
            onSave={handleSaveRicevuta}
            onCancel={handleCloseModal}
          />
        </Modal.Body>
      </Modal>

      {/* Modale di conferma eliminazione */}
      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal}>
        <Modal.Header closeButton>
          <Modal.Title>Conferma Eliminazione</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Sei sicuro di voler eliminare questa ricevuta?</p>
          {deletingRicevuta && (
            <div className="mt-3">
              <strong>Dettagli ricevuta:</strong>
              <ul className="list-unstyled mt-2">
                <li><strong>Data:</strong> {formatDateDisplay(deletingRicevuta.dataRicevuta)}</li>
                <li><strong>Ente:</strong> {deletingRicevuta.ente}</li>
                <li><strong>Importo:</strong> {formatImporto(deletingRicevuta.importo)}</li>
              </ul>
            </div>
          )}
          <Alert variant="warning" className="mt-3">
            <small>Questa azione non può essere annullata.</small>
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeleteModal}>
            Annulla
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            Elimina
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default EntiList;
