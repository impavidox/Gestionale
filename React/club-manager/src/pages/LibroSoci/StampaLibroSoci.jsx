import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import socioService from '../../api/services/socioService';
import activityService from '../../api/services/activityService';
import { formatDateDisplay } from '../../utils/dateUtils';

/**
 * Pagina per la stampa del libro soci
 */
const StampaLibroSoci = () => {
  // Prende i parametri dall'URL
  const { affiliazione, begin, end, tipo } = useParams();
  
  // Stati per i dati
  const [soci, setSoci] = useState([]);
  const [affiliazioneData, setAffilizioneData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Titoli in base al tipo
  const getTitoloTipo = (tipoCode) => {
    return tipoCode === '1' ? 'EFFETTIVI' : 'TESSERATI';
  };
  
  const getHeaderTipo = (tipoCode) => {
    return tipoCode === '1' ? 'TIPO DI SOCIO' : 'TESSERATO';
  };
  
  // Carica i dati all'avvio
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Carica affiliazione
        const affiliazioniResponse = await activityService.retrieveAffiliazione(1);
        const foundAffiliazione = affiliazioniResponse.data.find(a => a.id.toString() === affiliazione);
        setAffilizioneData(foundAffiliazione);
        
        // Carica dati libro soci
        const response = await socioService.retrieveLibroSocio(
          parseInt(affiliazione),
          parseInt(begin),
          parseInt(end),
          parseInt(tipo)
        );
        
        setSoci(response.data);
      } catch (err) {
        console.error('Errore nel caricamento dei dati per la stampa:', err);
        setError('Si è verificato un errore nel caricamento dei dati per la stampa.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [affiliazione, begin, end, tipo]);
  
  // Gestione della stampa
  const handlePrint = () => {
    window.print();
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
            <h2>LIBRO SOCI {getTitoloTipo(tipo)}</h2>
            <p className="mb-1">
              {affiliazioneData ? `Affiliazione: ${affiliazioneData.descrizione}` : ''}
            </p>
            <p className="mb-1">
              Numeri tessera: da {begin} a {end}
            </p>
            <p>
              Data stampa: {formatDateDisplay(new Date())}
            </p>
          </div>
          
          {soci.length === 0 ? (
            <p className="text-center">Nessun socio trovato.</p>
          ) : (
            <Table bordered responsive>
              <thead>
                <tr>
                  <th>Tessera</th>
                  <th>Cognome</th>
                  <th>Nome</th>
                  <th>Codice Fiscale</th>
                  <th>Città</th>
                  <th>{getHeaderTipo(tipo)}</th>
                  {tipo === '2' && <th>Federazione</th>}
                </tr>
              </thead>
              <tbody>
                {soci.map((socio) => (
                  <tr key={socio.id}>
                    <td>{socio.tesseraNumber || '---'}</td>
                    <td>{socio.cognome}</td>
                    <td>{socio.nome}</td>
                    <td>{socio.codeFiscale}</td>
                    <td>{socio.citta}</td>
                    <td>
                      {tipo === '1' 
                        ? (socio.tipo?.descrizione || '---')
                        : (socio.tesseraNumber ? 'Sì' : 'No')
                      }
                    </td>
                    {tipo === '2' && <td>{socio.federazione || '---'}</td>}
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          
          <div className="mt-5 pt-5 text-center">
            <p>Data e firma</p>
            <div className="mt-5">_______________________</div>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default StampaLibroSoci;