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
        // const annoResponse = await parametriService.retrieveAnnoSportiva();
        // const currentYear = annoResponse.data.data || annoResponse.data;
        
        // Crea array di anni (anno corrente e precedenti)
        const currentYearNum = 2025;
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
        console.log(elencoTipi  )
        // Imposta tipo di default
        setTipoSocio(elencoTipi[0]);
        
        // Set initial title
        setTitolo(`Libro ${elencoTipi[0].hd}`);
        
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
    console.log(selectedValue)
    setTitolo(`Libro ${elencoTipi[(selectedValue.value.value)-1].hd}`);
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
      
      setSoci(response.data.data.items || response.data.data || response.data || []);
      
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
    
    // Updated to match the new URL pattern expected by the router
    const printUrl = `/stampa-libro-soci?tipo=${tipoSocio.value}&anno=${annoValidita.id}&titolo=${encodeURIComponent(titolo)}`;
    window.open(printUrl, '_blank');
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

  // Configura colonne dinamiche in base al tipo di socio
  const getTableColumns = () => {
    console.log(tipoSocio)
    // Colonne per tesserati (senza N. Socio e Data Adesione)
    if (tipoSocio && tipoSocio.value === 3) {
      return [
        { key: 'cognome', label: 'Cognome', width: '18%' },
        { key: 'nome', label: 'Nome', width: '18%' },
        { key: 'dataNascita', label: 'Data di Nascita', width: '12%' },
        { key: 'luogoNascita', label: 'Luogo di Nascita', width: '20%' },
        { key: 'codiceFiscale', label: 'Codice Fiscale', width: '16%' },
        { key: 'codice', label: 'Codice', width: '8%' },
        { key: 'attivitaNome', label: 'Attività', width: '15%' },
        { key: 'email', label: 'Email', width: '13%' }
      ];
    }

    // Colonne base per effettivi e volontari
    const baseColumns = [
      { key: 'numeroSocio', label: 'N. Socio', width: '8%' },
      { key: 'dataAdesione', label: 'Data Adesione', width: '12%' },
      { key: 'cognome', label: 'Cognome', width: '15%' },
      { key: 'nome', label: 'Nome', width: '15%' },
      { key: 'dataNascita', label: 'Data di Nascita', width: '12%' },
      { key: 'luogoNascita', label: 'Luogo di Nascita', width: '18%' },
      { key: 'codiceFiscale', label: 'Codice Fiscale', width: '15%' },
      { key: 'email', label: 'Email', width: '15%' }
    ];

    return baseColumns;
  };

  // Renderizza il valore della cella in base alla colonna
  const renderCellValue = (socio, column, index) => {
    switch (column.key) {
      case 'numeroSocio':
        return <strong>{generateNumeroSocio(index)}</strong>;
      case 'dataAdesione':
        return formatDateDisplay(socio.dataAdesione || socio.dataIscrizione);
      case 'cognome':
        return <strong>{socio.cognome}</strong>;
      case 'nome':
        return socio.nome;
      case 'dataNascita':
        return formatDateDisplay(socio.dataNascita);
      case 'luogoNascita':
        return formatLuogoNascita(socio);
      case 'codiceFiscale':
        return <span className="font-monospace">{socio.codiceFiscale}</span>;
      case 'email':
        return socio.email || 'N/D';
      case 'telefono':
        return socio.telefono || 'N/D';
      case 'codice':
        return socio.codice || 'N/D';
      case 'attivitaNome':
        return socio.attivitaNome || 'N/D';
      default:
        return 'N/D';
    }
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
                  {getTableColumns().map((column) => (
                    <th key={column.key} style={{ width: column.width }}>
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {soci.map((socio, index) => (
                  <tr key={socio.id}>
                    {getTableColumns().map((column) => (
                      <td 
                        key={column.key} 
                        className={
                          column.key === 'numeroSocio' ? 'text-center' :
                          column.key === 'codiceFiscale' ? 'font-monospace' :
                          column.key === 'email' ? 'small' : ''
                        }
                      >
                        {renderCellValue(socio, column, index)}
                      </td>
                    ))}
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