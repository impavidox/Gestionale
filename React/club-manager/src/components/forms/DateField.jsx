import React from 'react';
import { Form } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { registerLocale } from 'react-datepicker';
import it from 'date-fns/locale/it';

// Registra la localizzazione italiana
registerLocale('it', it);

/**
 * Componente DateField personalizzato
 * @param {string} label - Etichetta del campo
 * @param {Date} value - Valore del campo
 * @param {Function} onChange - Funzione da chiamare al cambiamento
 * @param {string} name - Nome del campo
 * @param {boolean} required - Se il campo è obbligatorio
 * @param {Object} props - Altri props
 */
const DateField = ({ 
  label, 
  value, 
  onChange, 
  name, 
  required = false,
  disabled = false,
  ...props 
}) => {
  // Gestisci il cambiamento
  const handleChange = (date) => {
    onChange(name, date);
  };

  return (
    <Form.Group className="mb-3">
      {label && <Form.Label>{label}{required && <span className="text-danger"> *</span>}</Form.Label>}
      <DatePicker
        selected={value ? new Date(value) : null}
        onChange={handleChange}
        className="form-control"
        dateFormat="dd/MM/yyyy"
        locale="it"
        disabled={disabled}
        {...props}
      />
    </Form.Group>
  );
};

export default DateField;