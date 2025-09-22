import React from 'react';
import { Container } from 'react-bootstrap';
import PrimaNotaList from '../../components/primanota/PrimaNotaList';

/**
 * Pagina per la gestione della prima nota
 */
const PrimaNota = () => {
  return (
    <Container className="mt-4 mb-5">
      <h2 className="mb-4">Prima Nota</h2>
      
      <PrimaNotaList />
    </Container>
  );
};

export default PrimaNota;