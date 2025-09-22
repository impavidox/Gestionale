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
      
    </Container>
  );
};

export default Dashboard;