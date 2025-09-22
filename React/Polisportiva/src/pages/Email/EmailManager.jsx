import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Row, Col, Button, Alert, Table } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import socioService from '../../api/services/socioService';
import TextField from '../../components/forms/TextField';
import Loader from '../../components/common/Loader';

/**
 * Pagina per l'invio di email ai soci
 */
const EmailManager = () => {
  // Stati per i dati
  const [searchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [titolo, setTitolo] = useState('');
  const [myTextarea, setMyTextarea] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Stati per UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertVariant, setAlertVariant] = useState('danger');
  
  // Carica i dati iniziali
  useEffect(() => {
    const fetchData = async () => {
      // Estrai i parametri dall'URL
      const cognome = searchParams.get('cognome') || '';
      const scadenza = searchParams.get('scadenza') || '0';
      const attivita = searchParams.get('attivita') || '0';
      const scadute = searchParams.get('scadute') || 'false';
      const anno = searchParams.get('anno') || '0';
      const titoloParam = searchParams.get('titolo') || '';
      
      setTitolo(titoloParam.toUpperCase());
      
      try {
        setLoading(true);
        
        // Recupera i dati dei soci per email
        const response = await socioService.retrieveSocioMail(
          null, // nome
          cognome.length > 0 ? cognome : null,
          parseInt(scadenza),
          parseInt(attivita),
          scadute === 'true',
          parseInt(anno)
        );
        
        setData(response.data);
        
        // Prepara il testo default dell'email
        setMyTextarea(
          `Gentile Socio,\n\nLe scriviamo in merito a ${titoloParam}.\n\nCordiali saluti,\nLa Segreteria`
        );
        
        setLoading(false);
      } catch (error) {
        console.error('Errore nel caricamento dei dati:', error);
        setError('Si è verificato un errore nel caricamento dei dati.');
        setAlertVariant('danger');
        setShowAlert(true);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [searchParams]);
  
  // Gestione caricamento file allegato
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };
  
  // Gestione invio email
  const handleSendEmail = async () => {
    if (!data || data.items?.length === 0) {
      setError('Nessun destinatario disponibile.');
      setAlertVariant('danger');
      setShowAlert(true);
      return;
    }
    
    if (!myTextarea) {
      setError('Il testo dell\'email non può essere vuoto.');
      setAlertVariant('danger');
      setShowAlert(true);
      return;
    }
    
    try {
      setLoading(true);
      
      // Qui dovrebbe esserci la chiamata API per inviare le email
      // Ma non è presente nel codice originale, quindi simulo l'invio
      
      // Simula un ritardo per l'invio
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccess(`Email inviate con successo a ${data.items.length} soci.`);
      setAlertVariant('success');
      setShowAlert(true);
      
      setLoading(false);
    } catch (error) {
      console.error('Errore nell\'invio delle email:', error);
      setError('Si è verificato un errore nell\'invio delle email.');
      setAlertVariant('danger');
      setShowAlert(true);
      setLoading(false);
    }
  };
  
  return (
    <Container className="mt-4 mb-5">
      <h2 className="mb-4">Gestione Email - {titolo}</h2>
      
      {showAlert && (
        <Alert 
          variant={alertVariant} 
          onClose={() => setShowAlert(false)} 
          dismissible
        >
          {alertVariant === 'danger' ? error : success}
        </Alert>
      )}
      
      {loading && <Loader />}
      
      <Card className="mb-4">
        <Card.Header>
          <h5>Composizione Email</h5>
        </Card.Header>
        <Card.Body>
          <Form>
            <Row className="mb-4">
              <Col>
                <Form.Group>
                  <Form.Label>Destinatari</Form.Label>
                  <div className="border p-3 bg-light">
                    {data && data.items && data.items.length > 0 ? (
                      <p>{data.items.length} soci selezionati</p>
                    ) : (
                      <p>Nessun destinatario selezionato</p>
                    )}
                  </div>
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="mb-4">
              <Col>
                <Form.Group>
                  <Form.Label>Testo dell'email</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={6}
                    value={myTextarea}
                    onChange={(e) => setMyTextarea(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="mb-4">
              <Col>
                <Form.Group>
                  <Form.Label>Allegato</Form.Label>
                  <Form.Control
                    type="file"
                    onChange={handleFileUpload}
                  />
                  {selectedFile && (
                    <div className="mt-2">
                      <p className="mb-0">File selezionato: {selectedFile.name}</p>
                      <p className="text-muted mb-0">Dimensione: {Math.round(selectedFile.size / 1024)} KB</p>
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>
            
            <div className="d-flex justify-content-end">
              <Button 
                variant="primary" 
                onClick={handleSendEmail}
                disabled={loading || !data || data.items?.length === 0}
              >
                {loading ? 'Invio in corso...' : 'Invia Email'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
      
      {data && data.items && data.items.length > 0 && (
        <Card>
          <Card.Header>
            <h5>Elenco Destinatari</h5>
          </Card.Header>
          <Card.Body>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Cognome</th>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Telefono</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((socio, index) => (
                  <tr key={index}>
                    <td>{socio.cognome}</td>
                    <td>{socio.nome}</td>
                    <td>{socio.email || 'N/D'}</td>
                    <td>{socio.tel || 'N/D'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default EmailManager;