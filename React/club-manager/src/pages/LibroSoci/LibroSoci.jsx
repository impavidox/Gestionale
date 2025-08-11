import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Row, Col, Button, Table, Modal, Alert } from 'react-bootstrap';
import TextField from '../../components/forms/TextField';
import SelectField from '../../components/forms/SelectField';
import parametriService from '../../api/services/parametriService';
import socioService from '../../api/services/socioService';
import { useApp } from '../../context/AppContext';
import Loader from '../../components/common/Loader';
import { formatDateDisplay } from '../../utils/dateUtils';

/**
 * Pagina per la gestione del libro soci
 */
const LibroSoci = () => {
  const { goNewTab } = useApp();
  
  // Stati per i filtri
  const [tipoSocio, setTipoSocio] = useState(null);
  const [annoValidita, setAnnoValidita] = useState(null);
  
  // Stati per i dati
  const [anni, setAnni] = useState([]);
  const [elencoTipi, setElencoTipi] = useState([
    { code: 1, name: 'Effettivi', hd: 'Soci Effettivi' },
    { code: 2, name: 'Volontari', hd: 'Soci Volontari' },
    { code: 3, name: 'Tesserati', hd: 'Soci Tesserati' }
  ]);
  const [soci, setSoci] = useState([]);
  const [titolo, setTitolo] = useState('');
  
  // Stati per loading e errori
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertVariant, setAlertVariant] = useState('danger');
  
  // Carica i dati all'avvio
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Carica anno sportivo corrente
        //const annoResponse = await parametriService.retrieveAnnoSportiva();
        //const currentYear = annoResponse.data.data || annoResponse.data;
        const currentYear='2024/2025'
        // Crea array di anni (anno corrente e precedenti)
        const currentYearNum = parseInt(currentYear.split('/')[0]);
        const yearsArray = [];
        for (let i = 0; i < 5; i++) {
          const year = currentYearNum - i;
          yearsArray.push({
            id: year,
            name: `${year}/${year + 1}`,
            annoName: `${year}/${year + 1}`
          });
        }
        
        setAnni(yearsArray);
        setAnnoValidita(yearsArray[0]); // Imposta anno corrente come default
        
        // Imposta tipo di default
        setTipoSocio(elencoTipi[0]);
        
        setLoading(false);
      } catch (err) {
        console.error('Errore nel caricamento dei dati iniziali:', err);
        setError('Si è verificato un errore nel caricamento dei dati.');
        setAlertVariant('danger');
        setShowAlert(true);
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);
  
  // Gestione del cambio di tipo socio
  const handleTipoSocioChange = (name, selectedValue) => {
    setTipoSocio(selectedValue.value);
    setTitolo(`Libro ${selectedValue.value.hd}`);
  };
  
  // Gestione del cambio di anno
  const handleAnnoChange = (name, selectedValue) => {
    setAnnoValidita(selectedValue.value);
  };
  
  // Gestione della ricerca
  const handleSearch = async () => {
    if (!tipoSocio || !annoValidita) {
      setError('Selezionare il tipo di socio e l\'anno di validità');
      setAlertVariant('danger');
      setShowAlert(true);
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setShowAlert(false);
      
      const response = await socioService.retrieveLibroSoci(
        tipoSocio.value,
        annoValidita.id
      );
      setSoci(response.data.data.items);
      
      setLoading(false);
    } catch (err) {
      console.error('Errore nella ricerca dei soci:', err);
      setError('Si è verificato un errore nella ricerca dei soci.');
      setAlertVariant('danger');
      setShowAlert(true);
      setLoading(false);
    }
  };
  
  // Gestione della stampa
  const handlePrint = () => {
    if (!tipoSocio || !annoValidita) {
      setError('Selezionare il tipo di socio e l\'anno di validità');
      setAlertVariant('danger');
      setShowAlert(true);
      return;
    }
    
    goNewTab('stampa-libro-soci', {
      tipo: tipoSocio.code,
      anno: annoValidita.id,
      titolo: titolo
    });
  };

  // Genera numero socio progressivo
  const generateNumeroSocio = (index) => {
    return (index + 1).toString().padStart(4, '0');
  };

  // Formatta luogo di nascita
  const formatLuogoNascita = (socio) => {
    if (socio.comuneNascita && socio.provinciaNascita) {
      return `${socio.comuneNascita} (${socio.provinciaNascita})`;
    }
    return socio.comuneNascita || 'N/D';
  };
  
  return (
    <Container className="mt-4 mb-5">
      <h2 className="mb-4">Libro Soci</h2>
      
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
          <h5>Filtri</h5>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}>
            <Row>
              <Col md={6}>
                <SelectField
                  label="Tipo Socio"
                  name="tipoSocio"
                  value={tipoSocio}
                  options={elencoTipi}
                  onChange={handleTipoSocioChange}
                  required
                />
              </Col>
              <Col md={6}>
                <SelectField
                  label="Anno Sportivo"
                  name="annoValidita"
                  value={annoValidita}
                  options={anni}
                  onChange={handleAnnoChange}
                  required
                />
              </Col>
            </Row>
            <div className="d-flex justify-content-end mt-3">
              <Button variant="primary" type="submit" className="me-2">
                Cerca
              </Button>
              <Button variant="outline-primary" onClick={handlePrint}>
                Stampa
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
      
      {soci.length > 0 && (
        <Card>
          <Card.Header>
            <div className="d-flex justify-content-between align-items-center">
              <h5>{titolo}</h5>
              <span className="text-muted">
                Anno {annoValidita?.name} - {soci.length} soci
              </span>
            </div>
          </Card.Header>
          <Card.Body>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>N. Socio</th>
                  <th>Data Adesione</th>
                  <th>Cognome</th>
                  <th>Nome</th>
                  <th>Data di Nascita</th>
                  <th>Luogo di Nascita</th>
                  <th>Codice Fiscale</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {soci.map((socio, index) => (
                  <tr key={socio.id}>
                    <td className="text-center">
                      <strong>{generateNumeroSocio(index)}</strong>
                    </td>
                    <td>{formatDateDisplay(socio.dataAdesione || socio.dataIscrizione)}</td>
                    <td><strong>{socio.cognome}</strong></td>
                    <td>{socio.nome}</td>
                    <td>{formatDateDisplay(socio.dataNascita)}</td>
                    <td>{formatLuogoNascita(socio)}</td>
                    <td className="font-monospace">{socio.codiceFiscale}</td>
                    <td>{socio.email || 'N/D'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
      
      {soci.length === 0 && titolo && (
        <Card>
          <Card.Body className="text-center py-5">
            <i className="bi bi-people fs-1 text-muted mb-3"></i>
            <p className="text-muted">Nessun socio trovato per i filtri selezionati.</p>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default LibroSoci;