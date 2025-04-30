import React from 'react';
import { Outlet } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import Loader from '../components/common/Loader';
import { useApp } from '../context/AppContext';
import 'bootstrap/dist/css/bootstrap.min.css';

/**
 * Layout per le pagine di stampa senza header
 */
const PrintLayout = () => {
  const { loading } = useApp();

  return (
    <div className="min-vh-100 d-flex flex-column">
      <Container fluid className="flex-grow-1 py-3">
        <Outlet />
      </Container>
      
      {loading && <Loader />}
    </div>
  );
};

export default PrintLayout;