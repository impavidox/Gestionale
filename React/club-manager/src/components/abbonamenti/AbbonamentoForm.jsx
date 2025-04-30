import React, { useState, useEffect } from 'react';
import { useForm } from '../../hooks/useForm';
import TextField from '../forms/TextField';
import DateField from '../forms/DateField';
import CheckboxField from '../forms/CheckboxField';
import Alert from '../common/Alert';
import { createAbbonamento, updateAbbonamento } from '../../api/services/abbonamentoService';

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

  // Valori iniziali del form
  const initialState = {
    idSocio: socio?.id || 0,
    idAbonamento: abbonamento?.id || 0,
    dateInscription: abbonamento?.incription ? new Date(abbonamento.incription) : new Date(),
    idAnno: 0, // Verrà impostato dall'API
    firmato: abbonamento?.firmato || false,
    numeroTessera: abbonamento?.numeroTessara || '...'
  };

  const { values, handleChange, handleDateChange, handleCheckboxChange, setValues } = useForm(initialState);

  // Recupero dell'anno sportivo corrente
  useEffect(() => {
    // In un'implementazione reale, questo potrebbe provenire da un context o da un'API
    // Simuliamo il comportamento di $rootScope.annoSportiva nel codice originale
    const fetchAnnoSportivo = async () => {
      try {
        // Questo dovrebbe essere sostituito con una chiamata API reale
        const anno = { id: 1, annoName: '2025/2026' }; // Esempio
        setAnnoSportivo(anno);
        setValues(prev => ({ ...prev, idAnno: anno.id }));
      } catch (err) {
        setError('Errore nel caricamento dell\'anno sportivo');
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
      // Formattiamo la data come richiesto dal backend
      const formattedDate = formatDate(values.dateInscription);
      
      const requestBody = {
        idSocio: values.idSocio,
        idAbonamento: values.idAbonamento,
        dateInscription: formattedDate,
        idAnno: values.idAnno,
        firmato: values.firmato
      };

      let response;
      if (values.idAbonamento === 0) {
        response = await createAbbonamento(requestBody);
      } else {
        response = await updateAbbonamento(requestBody);
      }

      if (!response.returnCode) {
        throw new Error(response.message);
      }

      setSuccessMessage('Abbonamento salvato con successo');
      
      // Aggiorniamo il numero di tessera se presente nella risposta
      if (response.abbonamento?.numeroTessara) {
        setValues(prev => ({ 
          ...prev, 
          numeroTessera: response.abbonamento.numeroTessara,
          idAbonamento: response.abbonamento.id
        }));
      }

      if (onSuccess) {
        onSuccess(response.abbonamento);
      }
    } catch (err) {
      setError(err.message || 'Si è verificato un errore durante il salvataggio dell\'abbonamento');
    } finally {
      setLoading(false);
    }
  };

  // Funzione per formattare la data nel formato richiesto dal backend (DD-MM-YYYY)
  const formatDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    return `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
  };

  return (
    <div className="abbonamento-form p-4 border rounded">
      <h3 className="mb-4">{values.idAbonamento === 0 ? "Nuovo Abbonamento" : "Modifica Abbonamento"}</h3>
      
      {error && (
        <Alert 
          type="danger" 
          message={error} 
          onClose={() => setError(null)} 
        />
      )}
      
      {successMessage && (
        <Alert 
          type="success" 
          message={successMessage} 
          onClose={() => setSuccessMessage(null)} 
        />
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <DateField 
            label="Data Iscrizione" 
            name="dateInscription" 
            value={values.dateInscription} 
            onChange={handleDateChange}
            required
          />
          <small className="form-text text-muted">
            Data di registrazione dell'abbonamento
          </small>
        </div>
        
        <div className="mb-3">
          <CheckboxField 
            label="Abbonamento Firmato" 
            name="firmato" 
            checked={values.firmato} 
            onChange={handleCheckboxChange}
          />
        </div>

        {values.idAbonamento !== 0 && (
          <div className="mb-3">
            <TextField 
              label="Numero Tessera" 
              name="numeroTessera"
              value={values.numeroTessera} 
              onChange={handleChange}
              disabled={true}
            />
          </div>
        )}

        {annoSportivo && (
          <div className="mb-3">
            <p><strong>Anno Sportivo:</strong> {annoSportivo.annoName}</p>
          </div>
        )}
        
        <div className="d-flex justify-content-end mt-4">
          <button 
            type="button" 
            className="btn btn-secondary me-2" 
            onClick={onCancel}
            disabled={loading}
          >
            Annulla
          </button>
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading || !values.dateInscription}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Salvataggio...
              </>
            ) : (
              "Salva"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AbbonamentoForm;