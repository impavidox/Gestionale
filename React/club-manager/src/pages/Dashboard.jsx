import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import socioService from '../api/services/socioService';
import primaNotaService from '../api/services/primaNotaService';

/**
 * Dashboard principale dell'applicazione
 */
const Dashboard = () => {
  const { annoSportiva } = useApp();
  

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Dashboard</h2>
      
      {annoSportiva && (
        <Card className="mb-4">
          <Card.Body>
            <Card.Title>Anno Sportivo: {annoSportiva.annoName}</Card.Title>
            <Card.Text>
              Benvenuto nel sistema di gestione del club. Utilizza il menu in alto per navigare tra le diverse funzionalità.
            </Card.Text>
          </Card.Body>
        </Card>
      )}
      
      <Row>
        <Col md={4} className="mb-4">
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Gestione Soci</Card.Title>
              <Card.Text>
                Gestisci i soci del club, crea nuovi soci, rinnova le iscrizioni e stampa le ricevute.
              </Card.Text>
              <div className="d-grid gap-2">
                <Button as={Link} to="/soci" variant="primary">
                  Elenco Soci
                </Button>
                <Button as={Link} to="/soci/nuovo" variant="outline-primary">
                  Nuovo Socio
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4} className="mb-4">
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Prima Nota</Card.Title>
              <Card.Text>
                Gestisci la prima nota, registra incassi e pagamenti, stampa i report.
              </Card.Text>
              <div className="d-grid gap-2">
                <Button as={Link} to="/prima-nota" variant="primary">
                  Prima Nota
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4} className="mb-4">
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Libro Soci</Card.Title>
              <Card.Text>
                Gestisci il libro soci, effettua ricerche e stampa i report.
              </Card.Text>
              <div className="d-grid gap-2">
                <Button as={Link} to="/libro-soci" variant="primary">
                  Libro Soci
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;