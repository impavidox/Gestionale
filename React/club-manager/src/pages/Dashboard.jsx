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
  
  const [stats, setStats] = useState({
    totSoci: 0,
    sociAttivi: 0,
    tasseDaPagare: 0,
    certificatiScaduti: 0,
    totaleIncassi: 0
  });
  
  // Carica i dati statistici all'avvio
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Carica statistiche soci
        const sociResponse = await socioService.getStats();
        
        // Carica statistiche prima nota
        const primaNotaResponse = await primaNotaService.getStatistic();
        
        setStats({
          totSoci: sociResponse.data.totSoci || 0,
          sociAttivi: sociResponse.data.sociAttivi || 0,
          tasseDaPagare: sociResponse.data.tasseDaPagare || 0,
          certificatiScaduti: sociResponse.data.certificatiScaduti || 0,
          totaleIncassi: primaNotaResponse.data.totale || 0
        });
      } catch (error) {
        console.error('Errore nel caricamento delle statistiche:', error);
      }
    };
    
    fetchStats();
  }, []);

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
      
      <Row className="mt-3">
        <Col md={3} className="mb-4">
          <Card className="text-center h-100">
            <Card.Body>
              <Card.Title>Totale Soci</Card.Title>
              <h2>{stats.totSoci}</h2>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-4">
          <Card className="text-center h-100">
            <Card.Body>
              <Card.Title>Soci Attivi</Card.Title>
              <h2>{stats.sociAttivi}</h2>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-4">
          <Card className="text-center h-100">
            <Card.Body>
              <Card.Title>Certificati Scaduti</Card.Title>
              <h2>{stats.certificatiScaduti}</h2>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-4">
          <Card className="text-center h-100">
            <Card.Body>
              <Card.Title>Totale Incassi</Card.Title>
              <h2>€ {stats.totaleIncassi.toFixed(2)}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;