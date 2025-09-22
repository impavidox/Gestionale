import React from 'react';
import { Form } from 'react-bootstrap';

/**
 * Componente CheckboxField personalizzato
 * @param {string} label - Etichetta del campo
 * @param {boolean} checked - Stato del checkbox
 * @param {Function} onChange - Funzione da chiamare al cambiamento
 * @param {string} name - Nome del campo
 * @param {Object} props - Altri props
 */
const CheckboxField = ({ 
  label, 
  checked, 
  onChange, 
  name,
  disabled = false,
  ...props 
}) => {
  // Gestisci il cambiamento
  const handleChange = (e) => {
    onChange(name, e.target.checked);
  };

  return (
    <Form.Group className="mb-3">
      <Form.Check
        type="checkbox"
        label={label}
        checked={checked || false}
        onChange={handleChange}
        name={name}
        disabled={disabled}
        {...props}
      />
    </Form.Group>
  );
};

export default CheckboxField;