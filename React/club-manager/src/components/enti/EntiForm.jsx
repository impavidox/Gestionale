import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Alert } from 'react-bootstrap';
import DateField from '../forms/DateField';
import { formatDateForApi, parseDateFromBackend } from '../../utils/dateUtils';

/**
 * Form per la creazione e modifica di ricevute enti
 */
const EntiForm = ({ ricevuta, onSave, onCancel }) => {
  const [dataRicevuta, setDataRicevuta] = useState(new Date());
  const [ente, setEnte] = useState('');
  const [importo, setImporto] = useState('');
  const [errors, setErrors] = useState({});

  // Carica i dati della ricevuta se in modalità modifica
  useEffect(() => {
    if (ricevuta) {
      setDataRicevuta(parseDateFromBackend(ricevuta.dataRicevuta));
      setEnte(ricevuta.ente || '');
      // Converti da centesimi a euro per la visualizzazione
      setImporto(((ricevuta.importo || 0) / 100).toFixed(2));
    }
  }, [ricevuta]);

  /**
   * Valida il form
   */
  const validateForm = () => {
    const newErrors = {};

    if (!dataRicevuta) {
      newErrors.dataRicevuta = 'La data è obbligatoria';
    }

    if (!ente || ente.trim() === '') {
      newErrors.ente = 'L\'ente è obbligatorio';
    }

    if (!importo || parseFloat(importo) <= 0) {
      newErrors.importo = 'L\'importo deve essere maggiore di zero';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Gestisce il submit del form
   */
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Converti l'importo da euro a centesimi
    const importoCentesimi = Math.round(parseFloat(importo) * 100);

    const ricevutaData = {
      dataRicevuta: formatDateForApi(dataRicevuta),
      ente: ente.trim(),
      importo: importoCentesimi
    };

    onSave(ricevutaData);
  };

  /**
   * Gestisce il cambiamento dell'importo con validazione
   */
  const handleImportoChange = (value) => {
    // Permetti solo numeri e punto decimale
    const regex = /^\d*\.?\d{0,2}$/;
    if (value === '' || regex.test(value)) {
      setImporto(value);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Row>
        <Col md={12}>
          <DateField
            label="Data Ricevuta *"
            value={dataRicevuta}
            onChange={setDataRicevuta}
            error={errors.dataRicevuta}
            required
          />
        </Col>
      </Row>

      <Row>
        <Col md={12}>
          <Form.Group className="mb-3">
            <Form.Label>Ente *</Form.Label>
            <Form.Control
              type="text"
              value={ente}
              onChange={(e) => setEnte(e.target.value)}
              placeholder="Nome dell'ente"
              isInvalid={!!errors.ente}
              required
            />
            <Form.Control.Feedback type="invalid">
              {errors.ente}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={12}>
          <Form.Group className="mb-3">
            <Form.Label>Importo (€) *</Form.Label>
            <Form.Control
              type="text"
              value={importo}
              onChange={(e) => handleImportoChange(e.target.value)}
              placeholder="0.00"
              isInvalid={!!errors.importo}
              required
            />
            <Form.Control.Feedback type="invalid">
              {errors.importo}
            </Form.Control.Feedback>
            <Form.Text className="text-muted">
              Inserisci l'importo in euro (es. 100.50)
            </Form.Text>
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={12}>
          <Alert variant="info" className="mb-3">
            <small>
              <strong>Nota:</strong> Tutte le ricevute enti sono considerate come pagamenti tramite bonifico.
            </small>
          </Alert>
        </Col>
      </Row>

      <div className="d-flex justify-content-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Annulla
        </Button>
        <Button variant="primary" type="submit">
          {ricevuta ? 'Salva Modifiche' : 'Crea Ricevuta'}
        </Button>
      </div>
    </Form>
  );
};

export default EntiForm;
