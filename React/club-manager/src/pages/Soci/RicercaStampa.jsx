import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import socioService from '../../api/services/socioService';
import { formatDateDisplay } from '../../utils/dateUtils';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';

/**
 * Pagina per la stampa dei risultati di ricerca dei soci
 */
const RicercaStampa = () => {
  // Stati per i dati
  const [searchParams] = useSearchParams();
  const [data, setData] = useState([]);
  const [titolo, setTitolo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [incassato, setIncassato] = useState(false);
  
  // Carica i dati all'avvio
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
      
      // Imposta incassato se c'è un'attività selezionata
      setIncassato(parseInt(attivita) > 0);
      
      try {
        setLoading(true);
        
        // Carica i dati dei soci
        const response = await socioService.retrieveSocio(
          null, // nome
          cognome.length > 0 ? cognome : null,
          parseInt(scadenza),
          parseInt(attivita),
          scadute === 'true',
          parseInt(anno)
        );
        
        setData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Errore nel caricamento dei dati:', err);
        setError('Si è verificato un errore nel caricamento dei dati.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [searchParams]);
  
  // Gestione della stampa
  const handlePrint = () => {
    window.print();
  };
  
  // Determina lo stato del certificato medico
  const getCertificatoStatus = (socio) => {
    if (!socio.dateCertificat) return { status: 'missing', label: 'Mancante', variant: 'danger' };
    
    const today = new Date();
    const expiryDate = new Date(socio.dateCertificat);
    
    if (expiryDate < today) {
      return { status: 'expired', label: 'Scaduto', variant: 'danger' };
    }
    
    // Calcola se scade nel prossimo mese
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    if (expiryDate < nextMonth) {
      return { status: 'expiring', label: 'In scadenza', variant: 'warning' };
    }
    
    return { status: 'valid', label: 'Valido', variant: 'success' };
  };
  
  if (loading) {
    return <Loader />;
  }
  
  if (error) {
    return <Alert variant="danger" message={error} />;
  }
  
  return (
    <Container className="mt-4 mb-5">
      {/* Barra degli strumenti (nascosta in stampa) */}
      <div className="mb-4 no-print">
        <Button variant="primary" onClick={handlePrint}>
          <i className="bi bi-printer me-1"></i> Stampa
        </Button>
      </div>
      
      <Card className="mb-4">
        <Card.Header className="text-center">
          <h2 className="mb-0">{titolo}</h2>
          <p className="mb-0">Data: {formatDateDisplay(new Date())}</p>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Tessera</th>
                <th>Cognome</th>
                <th>Nome</th>
                <th>Telefono</th>
                <th>Email</th>
                <th>Certificato</th>
                {incassato && <th>Abbonamento</th>}
                {incassato && <th>Incassato</th>}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={incassato ? 8 : 6} className="text-center">
                    Nessun socio trovato
                  </td>
                </tr>
              ) : (
                data.map((socio) => {
                  const certificatoStatus = getCertificatoStatus(socio);
                  
                  return (
                    <tr key={socio.id}>
                      <td>{socio.tesseraNumber || '---'}</td>
                      <td>{socio.cognome}</td>
                      <td>{socio.nome}</td>
                      <td>{socio.tel || '---'}</td>
                      <td>{socio.email || '---'}</td>
                      <td className={`table-${certificatoStatus.variant}`}>
                        {socio.dateCertificat 
                          ? `${formatDateDisplay(socio.dateCertificat)} (${certificatoStatus.label})`
                          : 'Mancante'
                        }
                      </td>
                      {incassato && (
                        <td>
                          {socio.abbonamento 
                            ? formatDateDisplay(socio.abbonamento.scadenza)
                            : '---'
                          }
                        </td>
                      )}
                      {incassato && (
                        <td>
                          {socio.abbonamento && socio.abbonamento.incassato 
                            ? 'Sì'
                            : 'No'
                          }
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
          
          <div className="mt-4">
            <p className="text-end">
              <strong>Totale soci:</strong> {data.length}
            </p>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default RicercaStampa;