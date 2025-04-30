import React from 'react';
import { Alert as BootstrapAlert } from 'react-bootstrap';

/**
 * Componente Alert riutilizzabile
 * @param {string} variant - Tipo di alert (success, danger, warning, info)
 * @param {string} message - Messaggio da visualizzare
 * @param {Function} onClose - Funzione da chiamare alla chiusura
 * @param {boolean} dismissible - Se l'alert può essere chiuso
 * @param {Object} props - Altri props
 */
const Alert = ({ 
  variant = 'info', 
  message, 
  onClose, 
  dismissible = true, 
  ...props 
}) => {
  if (!message) return null;
  
  return (
    <BootstrapAlert 
      variant={variant} 
      onClose={onClose} 
      dismissible={dismissible} 
      {...props}
    >
      {message}
    </BootstrapAlert>
  );
};

export default Alert;