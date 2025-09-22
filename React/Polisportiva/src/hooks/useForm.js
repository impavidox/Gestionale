import { useState } from 'react';

/**
 * Custom hook per gestire i form
 * 
 * @param {Object} initialState - Stato iniziale del form
 * @returns {Object} Metodi e stato del form
 */
export const useForm = (initialState = {}) => {
  const [values, setValues] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Gestisce il cambiamento dei campi di input standard
  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Una volta modificato, contrassegna il campo come toccato
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
  };

  // Gestisce il cambiamento dei campi select
  const handleSelectChange = (name, selectedOption) => {
    setValues(prev => ({
      ...prev,
      [name]: selectedOption.value
    }));
    
    // Una volta modificato, contrassegna il campo come toccato
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
  };

  // Gestisce il cambiamento dei campi data
  const handleDateChange = (name, date) => {
    setValues(prev => ({
      ...prev,
      [name]: date
    }));
    
    // Una volta modificato, contrassegna il campo come toccato
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
  };

  // Gestisce il cambiamento dei campi checkbox
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setValues(prev => ({
      ...prev,
      [name]: checked
    }));
    
    // Una volta modificato, contrassegna il campo come toccato
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
  };

  // Imposta direttamente un valore
  const setValue = (name, value) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Resetta il form allo stato iniziale
  const reset = () => {
    setValues(initialState);
    setErrors({});
    setTouched({});
  };

  // Funzione per impostare eventuali errori di validazione
  const setError = (name, errorMessage) => {
    setErrors(prev => ({
      ...prev,
      [name]: errorMessage
    }));
  };

  // Funzione per validare i campi
  const validate = (validationRules) => {
    let isValid = true;
    const newErrors = {};

    // Esegue ogni regola di validazione
    Object.keys(validationRules).forEach(fieldName => {
      const value = values[fieldName];
      const error = validationRules[fieldName](value, values);
      
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleSelectChange,
    handleDateChange,
    handleCheckboxChange,
    setValue,
    setValues,
    reset,
    setError,
    validate,
    setTouched
  };
};

export default useForm;