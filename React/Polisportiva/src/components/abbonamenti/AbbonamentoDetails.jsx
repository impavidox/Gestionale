import React, { useState } from 'react';
import { getAbbonamentoById } from '../../api/services/abbonamentoService';
import Loader from '../common/Loader';
import Alert from '../common/Alert';
import AbbonamentoForm from './AbbonamentoForm';

/**
 * Componente per visualizzare i dettagli di un abbonamento
 * 
 * @param {Object} props - Props del componente
 * @param {Object} props.abbonamento - Dati dell'abbonamento
 * @param {Object} props.socio - Dati del socio associato all'abbonamento
 * @param {boolean} props.editable - Indica se l'abbonamento è modificabile
 * @param {Function} props.onUpdate - Callback da chiamare dopo l'aggiornamento
 * @param {Function} props.onCreateRicevuta - Callback per creare una ricevuta
 * @param {Function} props.onPrintScheda - Callback per stampare la scheda
 */
const AbbonamentoDetails = ({ 
  abbonamento, 
  socio, 
  editable = true, 
  onUpdate, 
  onCreateRicevuta,
  onPrintScheda
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAbbonamento, setCurrentAbbonamento] = useState(abbonamento);

  const handleOpenEdit = () => {
    setIsEditing(true);
  };

  const handleCloseEdit = () => {
    setIsEditing(false);
  };

  const handleUpdate = (updatedAbbonamento) => {
    setCurrentAbbonamento(updatedAbbonamento);
    setIsEditing(false);
    if (onUpdate) {
      onUpdate(updatedAbbonamento);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/D';
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT');
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <Alert type="danger" message={error} />;
  }

  if (isEditing) {
    return (
      <AbbonamentoForm
        socio={socio}
        abbonamento={currentAbbonamento}
        onSuccess={handleUpdate}
        onCancel={handleCloseEdit}
      />
    );
  }

  return (
    <div className="abbonamento-details p-4 border rounded">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Dettaglio Abbonamento</h3>
        {editable && (
          <div>
            <button 
              className="btn btn-outline-primary me-2" 
              onClick={handleOpenEdit}
            >
              <i className="bi bi-pencil me-1"></i> Modifica
            </button>
          </div>
        )}
      </div>

      <div className="row mb-4">
        <div className="col-md-6">
          <div className="mb-3">
            <strong>Numero Tessera:</strong> {currentAbbonamento?.numeroTessara || '...'}
          </div>
          <div className="mb-3">
            <strong>Data Iscrizione:</strong> {formatDate(currentAbbonamento?.incription)}
          </div>
          <div className="mb-3">
            <strong>Abbonamento Firmato:</strong> {currentAbbonamento?.firmato ? 'Sì' : 'No'}
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-3">
            <strong>Socio:</strong> {socio?.nome} {socio?.cognome}
          </div>
          <div className="mb-3">
            <strong>Codice Fiscale:</strong> {socio?.codeFiscale || 'N/D'}
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-end">
        {onPrintScheda && (
          <button 
            className="btn btn-outline-info me-2" 
            onClick={onPrintScheda}
          >
            <i className="bi bi-printer me-1"></i> Stampa Scheda
          </button>
        )}
        
        {onCreateRicevuta && currentAbbonamento?.id > 0 && (
          <button 
            className="btn btn-outline-success" 
            onClick={onCreateRicevuta}
          >
            <i className="bi bi-receipt me-1"></i> Crea Ricevuta
          </button>
        )}
      </div>
    </div>
  );
};

export default AbbonamentoDetails;