import React from 'react';
import { Container } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import PrimaNotaPrint from '../../components/primanota/PrimaNotaPrint';

/**
 * Pagina per la stampa della prima nota
 */
const StampaPrimaNota = () => {
  // Prende i parametri dall'URL
  const [searchParams] = useSearchParams();
  
  const type = parseInt(searchParams.get('type') || '0');
  const beginDate = searchParams.get('begin') || null;
  const endDate = searchParams.get('end') || null;
  
  return (
    <Container className="mt-4 mb-5">
      <h2 className="mb-4">Stampa Prima Nota</h2>
      
      <PrimaNotaPrint 
        type={type}
        startDate={beginDate}
        endDate={endDate}
      />
    </Container>
  );
};

export default StampaPrimaNota;