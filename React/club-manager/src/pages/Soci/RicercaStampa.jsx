import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Badge } from 'react-bootstrap';
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
  const [hasActivityFilter, setHasActivityFilter] = useState(false);
  const [showQuotaAssociativa, setShowQuotaAssociativa] = useState(false);
  
  // Carica i dati all'avvio
  useEffect(() => {
    const fetchData = async () => {
      // Estrai i parametri dall'URL
      const cognome = searchParams.get('cognome') || '';
      const scadenza = searchParams.get('scadenza') || '0';
      const attivita = searchParams.get('attivita') || '0';
      const scadute = searchParams.get('scadute') || '0';
      const anno = searchParams.get('anno') || '0';
      const sezione=searchParams.get('sezione') || '0';
      const titoloParam = searchParams.get('titolo') || 'Elenco Soci';
      
      setTitolo(titoloParam.toUpperCase());
      
      // Imposta flag per mostrare colonne specifiche
      setHasActivityFilter(parseInt(attivita) > 0);
      setShowQuotaAssociativa(true); // Always show quota associativa status
      
      try {
        setLoading(true);
        setError('');
        
        console.log('Fetching soci for print with params:', {
          cognome, scadenza, attivita, scadute, anno
        });
        
        // Carica i dati dei soci usando la stessa logica di ElencoSoci
        const response = await socioService.retrieveSocio(
          cognome.length > 0 ? cognome : null,
          parseInt(scadenza),
          parseInt(attivita),
          parseInt(scadute),
          parseInt(anno),
          parseInt(sezione)
        );
        
        console.log('API Response for print:', response);
        
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
        
        console.log('Processed soci data for print:', socioData);
        
        setData(socioData);
        
      } catch (err) {
        console.error('Errore nel caricamento dei dati:', err);
        setError('Si è verificato un errore nel caricamento dei dati.');
      } finally {
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
    if (!socio.dateCertificat && !socio.scadenzaCertificato) return { status: 'missing', label: 'Mancante', variant: 'danger' };
    
    const today = new Date();
    const expiryDate = new Date(socio.dateCertificat || socio.scadenzaCertificato);
    
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
  
  // Determina lo stato del pagamento dell'attività
  const getPagamentoStatus = (socio) => {
    if (!socio.abbonamento) return { status: 'missing', label: 'Non pagato', variant: 'danger' };
    
    const { scadenza, incassato } = socio.abbonamento;
    
    if (!incassato) {
      return { status: 'unpaid', label: 'Non incassato', variant: 'warning' };
    }
    
    if (!scadenza) {
      return { status: 'paid', label: 'Pagato', variant: 'success' };
    }
    
    const today = new Date();
    const expiryDate = new Date(scadenza);
    
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
          <img src='./headercso.jpg'></img>
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
                {showQuotaAssociativa && <th>Quota Ass.</th>}
                {hasActivityFilter && <th>Scadenza Attività</th>}
                {hasActivityFilter && <th>Stato Pagamento</th>}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={6 + (showQuotaAssociativa ? 1 : 0) + (hasActivityFilter ? 2 : 0)} className="text-center">
                    Nessun socio trovato
                  </td>
                </tr>
              ) : (
                data.map((socio) => {
                  const certificatoStatus = getCertificatoStatus(socio);
                  const pagamentoStatus = hasActivityFilter ? getPagamentoStatus(socio) : null;
                  
                  return (
                    <tr key={socio.id}>
                      <td>{socio.tesseraNumber || socio.NSocio || '---'}</td>
                      <td>{socio.cognome}</td>
                      <td>{socio.nome}</td>
                      <td>{socio.tel || socio.telefono || '---'}</td>
                      <td>{socio.email || '---'}</td>
                      <td className={`table-${certificatoStatus.variant}`}>
                        {socio.dateCertificat || socio.scadenzaCertificato
                          ? `${formatDateDisplay(socio.dateCertificat || socio.scadenzaCertificato)} (${certificatoStatus.label})`
                          : 'Mancante'
                        }
                      </td>
                      {showQuotaAssociativa && (
                        <td>
                          <Badge 
                            bg={socio.hasQuotaAssociativa || socio.quotaAssociativaPagata ? 'success' : 'danger'}
                            className="w-100"
                          >
                            {socio.hasQuotaAssociativa || socio.quotaAssociativaPagata ? 'Pagata' : 'Non Pagata'}
                          </Badge>
                        </td>
                      )}
                      {hasActivityFilter && (
                        <td>
                          {socio.abbonamento?.scadenza 
                            ? formatDateDisplay(socio.abbonamento.scadenza)
                            : socio.scadenzaPagamentoAttivita
                            ? formatDateDisplay(socio.scadenzaPagamentoAttivita)
                            : '---'
                          }
                        </td>
                      )}
                      {hasActivityFilter && (
                        <td className={pagamentoStatus ? `table-${pagamentoStatus.variant}` : ''}>
                          <Badge 
                            bg={pagamentoStatus ? pagamentoStatus.variant : 'secondary'}
                            className="w-100"
                          >
                            {pagamentoStatus ? pagamentoStatus.label : 'N/D'}
                          </Badge>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default RicercaStampa;