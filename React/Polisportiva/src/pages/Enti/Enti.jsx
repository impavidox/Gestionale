import React from 'react';
import { Container } from 'react-bootstrap';
import EntiList from '../../components/enti/EntiList';

/**
 * Pagina principale per la gestione delle ricevute enti
 */
const Enti = () => {
  return (
    <Container fluid className="p-4">
      <h2 className="mb-4">Gestione Enti</h2>
      <EntiList />
    </Container>
  );
};

export default Enti;
