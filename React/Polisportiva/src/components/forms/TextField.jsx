import React from 'react';
import { Form } from 'react-bootstrap';

/**
 * Componente TextField personalizzato
 * @param {string} label - Etichetta del campo
 * @param {string} value - Valore del campo
 * @param {Function} onChange - Funzione da chiamare al cambiamento
 * @param {string} name - Nome del campo
 * @param {string} type - Tipo del campo (text, email, password, ecc.)
 * @param {boolean} required - Se il campo è obbligatorio
 * @param {Object} props - Altri props
 */
const TextField = ({ 
  label, 
  value, 
  onChange, 
  name, 
  type = 'text', 
  required = false,
  placeholder = '',
  disabled = false,
  ...props 
}) => {
  // Gestisci il cambiamento
  const handleChange = (e) => {
    onChange(name, e.target.value);
  };

  return (
    <Form.Group className="mb-3">
      {label && <Form.Label>{label}{required && <span className="text-danger"> *</span>}</Form.Label>}
      <Form.Control
        type={type}
        value={value || ''}
        onChange={handleChange}
        name={name}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        {...props}
      />
    </Form.Group>
  );
};

export default TextField;