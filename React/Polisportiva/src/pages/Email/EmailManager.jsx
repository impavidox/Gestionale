import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Row, Col, Button, Alert, Table } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import socioService from '../../api/services/socioService';
import ricevutaService from '../../api/services/ricevutaService';
import { formatDateDisplay } from '../../utils/dateUtils';
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
  const [emailSubject, setEmailSubject] = useState('');
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
      const scadute = searchParams.get('scadute') || '0';
      const anno = searchParams.get('anno') || '0';
      const sezione = searchParams.get('sezione') || '0';
      const titoloParam = searchParams.get('titolo') || '';

      setTitolo(titoloParam.toUpperCase());

      try {
        setLoading(true);

        // Recupera i dati dei soci usando lo stesso metodo di ElencoSoci
        const response = await socioService.retrieveSocio(
          cognome.length > 0 ? cognome : null,
          parseInt(scadenza),
          parseInt(attivita),
          parseInt(scadute),
          parseInt(anno),
          parseInt(sezione)
        );

        // Handle different response structures (same logic as ElencoSoci)
        let socioData = [];
        if (response.data) {
          if (response.data.data && response.data.data.items) {
            socioData = response.data.data.items;
          } else if (response.data.items) {
            socioData = response.data.items;
          } else if (Array.isArray(response.data)) {
            socioData = response.data;
          } else if (response.data.success && response.data.result) {
            socioData = response.data.result;
          }
        }

        setData({ items: socioData });

        // Prepara il testo default dell'email e l'oggetto
        setEmailSubject(`${titoloParam} - Polisportiva Rivoli`);
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
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedFile({
          file: file,
          base64: reader.result.split(',')[1], // Remove data:*/*;base64, prefix
          name: file.name,
          size: file.size
        });
      };
      reader.readAsDataURL(file);
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

    if (!emailSubject) {
      setError('L\'oggetto dell\'email non può essere vuoto.');
      setAlertVariant('danger');
      setShowAlert(true);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      setShowAlert(false);

      let successCount = 0;
      let failureCount = 0;
      const errors = [];

      // Invia email a ciascun socio che ha un indirizzo email
      for (const socio of data.items) {
        if (!socio.email) {
          failureCount++;
          continue;
        }

        try {
          // Personalizza il messaggio con nome e cognome
          const personalizedMessage = myTextarea.replace('Gentile Socio', `Gentile ${socio.cognome} ${socio.nome}`);

          // Prepara i dati per la chiamata API
          const emailData = {
            recipientEmail: socio.email,
            recipientName: `${socio.cognome} ${socio.nome}`,
            subject: emailSubject,
            htmlContent: personalizedMessage.replace(/\n/g, '<br>'),
            isScheda: false,
            customMessage: true
          };

          // Aggiungi allegato se presente
          if (selectedFile) {
            emailData.pdfBase64 = selectedFile.base64;
            emailData.fileName = selectedFile.name;
          }

          // Chiamata API per inviare l'email
          const response = await ricevutaService.sendRicevutaEmail(emailData);

          if (response.success) {
            successCount++;
          } else {
            failureCount++;
            errors.push(`${socio.cognome} ${socio.nome}: ${response.message || 'Errore sconosciuto'}`);
          }
        } catch (err) {
          failureCount++;
          errors.push(`${socio.cognome} ${socio.nome}: ${err.message || 'Errore nell\'invio'}`);
        }
      }

      // Mostra i risultati
      if (successCount > 0) {
        setSuccess(`Email inviate con successo a ${successCount} soci${failureCount > 0 ? `. ${failureCount} invii falliti.` : '.'}`);
        setAlertVariant('success');
      } else {
        setError(`Impossibile inviare le email. ${failureCount} invii falliti.`);
        setAlertVariant('danger');
      }

      if (errors.length > 0 && errors.length <= 5) {
        console.error('Errori durante l\'invio:', errors);
      }

      setShowAlert(true);

    } catch (error) {
      console.error('Errore nell\'invio delle email:', error);
      setError('Si è verificato un errore nell\'invio delle email.');
      setAlertVariant('danger');
      setShowAlert(true);
    } finally {
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
                      <p className="mb-0">{data.items.length} soci selezionati</p>
                    ) : (
                      <p className="mb-0">Nessun destinatario selezionato</p>
                    )}
                  </div>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-4">
              <Col>
                <Form.Group>
                  <Form.Label>Oggetto dell'email *</Form.Label>
                  <Form.Control
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Inserisci l'oggetto dell'email"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-4">
              <Col>
                <Form.Group>
                  <Form.Label>Testo dell'email *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={6}
                    value={myTextarea}
                    onChange={(e) => setMyTextarea(e.target.value)}
                    placeholder="Inserisci il testo dell'email"
                  />
                  <Form.Text className="text-muted">
                    Il testo "Gentile Socio" verrà automaticamente sostituito con il nome e cognome di ciascun destinatario.
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-4">
              <Col>
                <Form.Group>
                  <Form.Label>Allegato (opzionale)</Form.Label>
                  <Form.Control
                    type="file"
                    onChange={handleFileUpload}
                  />
                  {selectedFile && (
                    <div className="mt-2 p-2 bg-light border rounded">
                      <p className="mb-0"><strong>File selezionato:</strong> {selectedFile.name}</p>
                      <p className="text-muted mb-0"><strong>Dimensione:</strong> {Math.round(selectedFile.size / 1024)} KB</p>
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