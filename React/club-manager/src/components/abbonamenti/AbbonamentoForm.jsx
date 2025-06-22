import React, { useState, useEffect } from 'react';
import { useForm } from '../../hooks/useForm';
import TextField from '../forms/TextField';
import DateField from '../forms/DateField';
import CheckboxField from '../forms/CheckboxField';
import Alert from '../common/Alert';
import { createAbbonamento, updateAbbonamento } from '../../api/services/abbonamentoService';
import  parametriService  from '../../api/services/parametriService';

/**
 * Componente per la creazione e modifica di abbonamenti
 * 
 * @param {Object} props - Props del componente
 * @param {Object} props.socio - Dati del socio
 * @param {Object} props.abbonamento - Dati dell'abbonamento esistente (solo in modalità modifica)
 * @param {Function} props.onSuccess - Callback da chiamare dopo il salvataggio con successo
 * @param {Function} props.onCancel - Callback da chiamare quando si annulla l'operazione
 */
const AbbonamentoForm = ({ socio, abbonamento, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [annoSportivo, setAnnoSportivo] = useState(null);

  // Helper function to parse date from various formats
  const parseDate = (dateValue) => {
    if (!dateValue) return new Date();
    
    // If it's already a Date object, return it
    if (dateValue instanceof Date) return dateValue;
    
    // If it's a string in DD-MM-YYYY format, parse it
    if (typeof dateValue === 'string' && dateValue.includes('-')) {
      const parts = dateValue.split('-');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
        const year = parseInt(parts[2], 10);
        
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          return new Date(year, month, day);
        }
      }
    }
    
    // Fallback to standard Date parsing
    return new Date(dateValue);
  };

  // Valori iniziali del form con gestione migliorata delle date
  const initialState = {
    idSocio: socio?.id || 0,
    idAbonamento: abbonamento?.id || abbonamento?.idAbonamento || 0,
    // Handle multiple date field names from backend
    dateInscription: abbonamento ? 
      parseDate(abbonamento.incription || abbonamento.dateInscription || abbonamento.dataIscrizione) 
      : new Date(),
    idAnno: abbonamento?.idAnno || 0,
    firmato: abbonamento?.firmato || false,
    // Handle both numeroTessera and numeroTessara (typo compatibility)
    numeroTessera: abbonamento?.numeroTessera || abbonamento?.numeroTessara || '...',
    attivitaId: abbonamento?.attivitaId || abbonamento?.idAttivita || 0,
    importo: abbonamento?.importo || 0,
    note: abbonamento?.note || ''
  };

  const { values, handleChange, handleDateChange, handleCheckboxChange, setValues } = useForm(initialState);

  // Recupero dell'anno sportivo corrente
  useEffect(() => {
    const fetchAnnoSportivo = async () => {
      try {
        const response = await parametriService.retrieveAnnoSportiva();
        if (response.data.success || response.data.returnCode) {
          const anno = response.data.data || response.data;
          setAnnoSportivo(anno);
          setValues(prev => ({ ...prev, idAnno: anno.id }));
        } else {
          // Fallback to current year if API fails
          const currentYear = new Date().getFullYear();
          const fallbackAnno = { 
            id: 1, 
            annoName: `${currentYear}/${currentYear + 1}` 
          };
          setAnnoSportivo(fallbackAnno);
          setValues(prev => ({ ...prev, idAnno: fallbackAnno.id }));
        }
      } catch (err) {
        console.error('Errore nel caricamento dell\'anno sportivo:', err);
        // Use fallback year
        const currentYear = new Date().getFullYear();
        const fallbackAnno = { 
          id: 1, 
          annoName: `${currentYear}/${currentYear + 1}` 
        };
        setAnnoSportivo(fallbackAnno);
        setValues(prev => ({ ...prev, idAnno: fallbackAnno.id }));
      }
    };

    fetchAnnoSportivo();
  }, [setValues]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Format date properly with zero-padding
      const formattedDate = formatDateForBackend(values.dateInscription);
      
      // Create request body with both new and legacy field names for maximum compatibility
      const requestBody = {
        // Primary fields
        id: values.idAbonamento,
        socioId: values.idSocio,
        dataIscrizione: formattedDate,
        attivitaId: values.attivitaId,
        importo: values.importo,
        firmato: values.firmato,
        idAnno: values.idAnno,
        note: values.note,
        
        // Legacy compatibility fields
        idAbonamento: values.idAbonamento,
        idSocio: values.idSocio,
        dateInscription: formattedDate,
        incription: formattedDate, // Handle typo in frontend
        idAttivita: values.attivitaId,
        numeroTessera: values.numeroTessera,
        numeroTessara: values.numeroTessera, // Handle typo compatibility
      };

      let response;
      if (values.idAbonamento === 0) {
        response = await createAbbonamento(requestBody);
      } else {
        response = await updateAbbonamento(requestBody);
      }

      // Handle different response structures
      const responseData = response.data || response;
      const isSuccess = responseData.success || responseData.returnCode;
      
      if (!isSuccess) {
        throw new Error(responseData.message || 'Errore nel salvataggio');
      }

      setSuccessMessage('Abbonamento salvato con successo');
      
      // Update form with response data
      const abbonamentoData = responseData.data || responseData.abbonamento || responseData;
      if (abbonamentoData) {
        setValues(prev => ({ 
          ...prev, 
          numeroTessera: abbonamentoData.numeroTessera || abbonamentoData.numeroTessara || prev.numeroTessera,
          idAbonamento: abbonamentoData.id || abbonamentoData.idAbonamento || prev.idAbonamento
        }));
      }

      if (onSuccess) {
        onSuccess(abbonamentoData);
      }
    } catch (err) {
      console.error('Errore nel salvataggio abbonamento:', err);
      setError(err.message || 'Si è verificato un errore durante il salvataggio dell\'abbonamento');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Format date for backend with proper zero-padding (DD-MM-YYYY)
   * @param {Date} date - Date to format
   * @returns {string} Formatted date string
   */
  const formatDateForBackend = (date) => {
    if (!date) return null;
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}-${month}-${year}`;
  };

  /**
   * Format date for display (Italian format)
   * @param {Date} date - Date to format
   * @returns {string} Formatted date string
   */
  const formatDateForDisplay = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('it-IT');
  };

  return (
    <div className="abbonamento-form p-4 border rounded">
      <h3 className="mb-4">
        {values.idAbonamento === 0 ? 'Nuovo Abbonamento' : 'Modifica Abbonamento'}
      </h3>

      {error && (
        <Alert type="danger" message={error} onClose={() => setError(null)} />
      )}

      {successMessage && (
        <Alert type="success" message={successMessage} onClose={() => setSuccessMessage(null)} />
      )}

      <form onSubmit={handleSubmit}>
        {/* Informazioni Socio (Read-only) */}
        <div className="row mb-3">
          <div className="col-md-6">
            <TextField
              label="Nome Socio"
              name="nomeSocio"
              value={`${socio?.nome || ''} ${socio?.cognome || ''}`}
              disabled
              readOnly
            />
          </div>
          <div className="col-md-6">
            <TextField
              label="Codice Fiscale"
              name="codiceFiscale"
              value={socio?.codiceFiscale || ''}
              disabled
              readOnly
            />
          </div>
        </div>

        {/* Informazioni Abbonamento */}
        <div className="row mb-3">
          <div className="col-md-6">
            <TextField
              label="Numero Tessera"
              name="numeroTessera"
              value={values.numeroTessera}
              onChange={handleChange}
              placeholder="Numero tessera (generato automaticamente)"
            />
          </div>
          <div className="col-md-6">
            <DateField
              label="Data Iscrizione"
              name="dateInscription"
              value={values.dateInscription}
              onChange={handleDateChange}
              required
            />
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-md-6">
            <TextField
              label="Anno Sportivo"
              name="annoSportivo"
              value={annoSportivo?.annoName || 'Caricamento...'}
              disabled
              readOnly
            />
          </div>
          <div className="col-md-6">
            <CheckboxField
              label="Abbonamento Firmato"
              name="firmato"
              checked={values.firmato}
              onChange={handleCheckboxChange}
            />
          </div>
        </div>

        {/* Note */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="form-group">
              <label htmlFor="note" className="form-label">Note</label>
              <textarea
                id="note"
                name="note"
                className="form-control"
                rows="3"
                value={values.note}
                onChange={handleChange}
                placeholder="Note aggiuntive (opzionale)"
              />
            </div>
          </div>
        </div>

        {/* Debug info (remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-3 p-2 bg-light border rounded">
            <small className="text-muted">
              <strong>Debug:</strong> Data formattata: {formatDateForBackend(values.dateInscription)}
            </small>
          </div>
        )}

        {/* Buttons */}
        <div className="d-flex justify-content-end gap-2">
          {onCancel && (
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Annulla
            </button>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Salvataggio...
              </>
            ) : (
              values.idAbonamento === 0 ? 'Crea Abbonamento' : 'Aggiorna Abbonamento'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AbbonamentoForm;