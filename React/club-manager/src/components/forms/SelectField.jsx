import React from 'react';
import { Form } from 'react-bootstrap';
import Select from 'react-select';

/**
 * Componente SelectField personalizzato
 * @param {string} label - Etichetta del campo
 * @param {Object} value - Valore selezionato
 * @param {Array} options - Opzioni disponibili
 * @param {Function} onChange - Funzione da chiamare al cambiamento
 * @param {string} name - Nome del campo
 * @param {boolean} isMulti - Se è una selezione multipla
 * @param {boolean} required - Se il campo è obbligatorio
 * @param {Object} props - Altri props
 */
const SelectField = ({ 
  label, 
  value, 
  options, 
  onChange, 
  name, 
  isMulti = false, 
  required = false,
  isDisabled = false,
  placeholder = 'Seleziona...',
  ...props 
}) => {
  // Adatta il formato dei valori per react-select
  const getOptions = () => {
    if (!options) return [];

    let optionsArray = [];

    // Handle both array and object
    if (Array.isArray(options)) {
      optionsArray = options;
    } else if (typeof options === 'object' && options !== null) {
      optionsArray = options.data;
    }

    if (optionsArray.length === 0) return [];

    // If already in correct format
    if (optionsArray[0] && optionsArray[0].value !== undefined && optionsArray[0].label !== undefined) {
      return optionsArray;
    }
    // Convert to correct format
    return optionsArray.map(option => {
      if (option.id !== undefined) {
        return {
          value: option.id,
          label: option.name || option.description || option.descrizione || option.label || option.id,
        };
      } else if (option.code !== undefined) {
        return {
          value: option.code,
          label: option.name || option.description || option.descrizione || option.label || option.code,
        };
      } else {
        return {
          value: option,
          label: option,
        };
      }
    });
  };


  // Gestisci il cambiamento
  const handleChange = (selectedOption) => {
    if (isMulti) {
      onChange(name, selectedOption || []);
    } else {
      // Per compatibilità con il vecchio codice, restituisci un oggetto { value: option }
      onChange(name, { value: selectedOption });
    }
  };

  return (
    <Form.Group className="mb-3">
      {label && <Form.Label>{label}{required && <span className="text-danger"> *</span>}</Form.Label>}
      <Select
        value={value}
        onChange={handleChange}
        options={getOptions()}
        isMulti={isMulti}
        className="basic-select"
        classNamePrefix="select"
        placeholder={placeholder}
        isDisabled={isDisabled}
        {...props}
      />
    </Form.Group>
  );
};

export default SelectField;