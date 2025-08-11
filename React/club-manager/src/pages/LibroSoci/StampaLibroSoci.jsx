import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import socioService from '../../api/services/socioService';
import { formatDateDisplay } from '../../utils/dateUtils';

/**
 * Pagina per la stampa del libro soci
 */
const StampaLibroSoci = () => {
  // Prende i parametri dall'URL
  const [searchParams] = useSearchParams();
  
  const tipo = parseInt(searchParams.get('tipo') || '1');
  const anno = parseInt(searchParams.get('anno') || new Date().getFullYear());
  const titoloParam = searchParams.get('titolo') || '';
  
  // Stati per i dati
  const [soci, setSoci] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Mapping dei tipi
  const getTipoNome = (tipoCode) => {
    const tipi = {
      1: 'Soci Effettivi',
      2: 'Soci Volontari', 
      3: 'Soci Tesserati'
    };
    return tipi[tipoCode] || 'Libro Soci';
  };
  
  // Carica i dati all'avvio
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      
      try {
        const response = await socioService.retrieveLibroSoci(tipo, anno);
        setSoci(response.data.data || response.data || []);
      } catch (err) {
        console.error('Errore nel caricamento dei dati per la stampa:', err);
        setError('Si è verificato un errore nel caricamento dei dati per la stampa.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [tipo, anno]);
  
  // Gestione della stampa
  const handlePrint = () => {
    window.print();
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
  
  // Loader durante il caricamento
  if (loading) {
    return <Loader />;
  }
  
  // Mostra errore
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
      
      {/* Documento da stampare */}
      <Card className="shadow-sm">
        <Card.Body>
          <div className="text-center mb-4">
            <h2>{titoloParam || getTipoNome(tipo)}</h2>
            <p className="mb-1">Anno Sportivo: {anno}/{anno + 1}</p>
            <p className="mb-1">Totale soci: {soci.length}</p>
            <p>Data stampa: {formatDateDisplay(new Date())}</p>
          </div>
          
          {soci.length === 0 ? (
            <p className="text-center">Nessun socio trovato.</p>
          ) : (
            <Table bordered responsive>
              <thead>
                <tr>
                  <th style={{ width: '8%' }}>N. Socio</th>
                  <th style={{ width: '12%' }}>Data Adesione</th>
                  <th style={{ width: '15%' }}>Cognome</th>
                  <th style={{ width: '15%' }}>Nome</th>
                  <th style={{ width: '12%' }}>Data di Nascita</th>
                  <th style={{ width: '18%' }}>Luogo di Nascita</th>
                  <th style={{ width: '15%' }}>Codice Fiscale</th>
                  <th style={{ width: '15%' }}>Email</th>
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
                    <td className="font-monospace small">{socio.codiceFiscale}</td>
                    <td className="small">{socio.email || 'N/D'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          
          <div className="row mt-5 pt-5">
            <div className="col-6 text-center">
              <p><strong>Il Presidente</strong></p>
              <div className="mt-5">_______________________</div>
            </div>
            <div className="col-6 text-center">
              <p><strong>Il Segretario</strong></p>
              <div className="mt-5">_______________________</div>
            </div>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default StampaLibroSoci;