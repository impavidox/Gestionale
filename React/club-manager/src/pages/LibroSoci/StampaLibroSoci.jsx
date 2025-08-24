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
        setSoci(response.data.data?.items || response.data.data || response.data || []);
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

  // Configura colonne dinamiche in base al tipo di socio
  const getTableColumns = () => {
    // Colonne per tesserati (senza N. Socio e Data Adesione)
    if (tipo === 3) {
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
    return [
      { key: 'numeroSocio', label: 'N. Socio', width: '8%' },
      { key: 'dataAdesione', label: 'Data Adesione', width: '12%' },
      { key: 'cognome', label: 'Cognome', width: '15%' },
      { key: 'nome', label: 'Nome', width: '15%' },
      { key: 'dataNascita', label: 'Data di Nascita', width: '12%' },
      { key: 'luogoNascita', label: 'Luogo di Nascita', width: '18%' },
      { key: 'codiceFiscale', label: 'Codice Fiscale', width: '15%' },
      { key: 'email', label: 'Email', width: '15%' }
    ];
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
            <img src='./headercso.jpg'></img>
            <h2>{titoloParam || getTipoNome(tipo)}</h2>
            <p className="mb-1">Anno Sportivo: {anno}/{anno + 1}</p>
          </div>
          
          {soci.length === 0 ? (
            <p className="text-center">Nessun socio trovato.</p>
          ) : (
            <>
              <Table bordered responsive>
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
                            column.key === 'codiceFiscale' ? 'font-monospace small' :
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

            </>
          )}
          
          {/* <div className="row mt-5 pt-5">
            <div className="col-6 text-center">
              <p><strong>Il Presidente</strong></p>
              <div className="mt-5">_______________________</div>
            </div>
            <div className="col-6 text-center">
              <p><strong>Il Segretario</strong></p>
              <div className="mt-5">_______________________</div>
            </div>
          </div> */}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default StampaLibroSoci;