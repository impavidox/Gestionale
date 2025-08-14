import React from 'react';
import { Navbar, Container, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

/**
 * Componente Header dell'applicazione
 */
const Header = () => {
  const { annoSportiva } = useApp();

  return (
    <Navbar bg="primary" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/"><img src='/logo.png' width={150}></img></Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/prima-nota">Prima Nota</Nav.Link>
            <Nav.Link as={Link} to="/soci/nuovo">Nuovo Socio</Nav.Link>
            <Nav.Link as={Link} to="/soci">Elenco Soci</Nav.Link>
            <Nav.Link as={Link} to="/libro-soci">Libro Soci</Nav.Link>
            <Nav.Link as={Link} to="/parametri">Parametri</Nav.Link>
          </Nav>
          <Nav>
            {annoSportiva && (
              <Navbar.Text className="text-white">
                Anno Sportivo: {annoSportiva.annoName}
              </Navbar.Text>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;