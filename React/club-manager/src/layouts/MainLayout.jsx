import React from 'react';
import { Outlet } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import Header from '../components/common/Header';
import Loader from '../components/common/Loader';
import { useApp } from '../context/AppContext';
import 'bootstrap/dist/css/bootstrap.min.css';

/**
 * Layout principale dell'applicazione con header e contenuto
 */
const MainLayout = () => {
  const { loading } = useApp();

  return (
    <div className="min-vh-100 d-flex flex-column">
      <Header />
      
      <Container fluid className="flex-grow-1 py-3">
        <Outlet />
      </Container>
      
      {loading && <Loader />}
    </div>
  );
};

export default MainLayout;