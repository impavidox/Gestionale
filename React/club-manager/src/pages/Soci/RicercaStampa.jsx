import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Badge, Modal, Form, Row, Col } from 'react-bootstrap';
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
  
  // Stati per il modal di selezione colonne
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState({
    tessera: true,
    cognome: true,
    nome: true,
    telefono: true,
    email: true,
    certificato: true,
    quotaAssociativa: true,
    scadenzaAttivita: false,
    statoPagamento: false,
    tesseraConsegnata: false,
    coperturaAssicurativa: false
  });
  
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
      const hasActivity = parseInt(attivita) > 0;
      setHasActivityFilter(hasActivity);
      setShowQuotaAssociativa(true);
      
      // Aggiorna la selezione delle colonne basata sui filtri
      setSelectedColumns(prev => ({
        ...prev,
        scadenzaAttivita: hasActivity,
        statoPagamento: hasActivity
      }));
      
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
  
  // Gestione della stampa con modal
  const handlePrint = () => {
    setShowColumnModal(true);
  };
  
  // Conferma stampa dopo selezione colonne
  const confirmPrint = () => {
    setShowColumnModal(false);
    // Piccolo delay per permettere al modal di chiudersi prima della stampa
    setTimeout(() => {
      window.print();
    }, 100);
  };
  
  // Gestione cambio selezione colonne
  const handleColumnChange = (columnKey) => {
    setSelectedColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
  };
  
  // Seleziona/Deseleziona tutte le colonne
  const toggleAllColumns = (selectAll) => {
    const newState = {};
    Object.keys(selectedColumns).forEach(key => {
      newState[key] = selectAll;
    });
    setSelectedColumns(newState);
  };
  
  // Determina lo stato del certificato medico
  const getCertificatoStatus = (socio) => {
    // Calculate age from dataNascita
    const today = new Date();
    const birthDate = new Date(socio.dataNascita);
    const ageInYears = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    
    // Adjust age if birthday hasn't occurred this year yet
    const actualAge = (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) 
      ? ageInYears - 1 
      : ageInYears;
    
    // For children under 6 years old
    if (actualAge < 6) {
      const isMissing = !socio.dateCertificat && !socio.scadenzaCertificato;
      return { 
        status: 'valid', 
        label: isMissing ? 'Valido*' : 'Valido', 
        variant: 'success' 
      };
    }
    
    // Original logic for 6+ years old
    if (!socio.dateCertificat && !socio.scadenzaCertificato) {
      return { status: 'missing', label: 'Mancante', variant: 'danger' };
    }
    
    const expiryDate = new Date(socio.dateCertificat || socio.scadenzaCertificato);
    
    if (expiryDate < today) {
      return { status: 'expired', label: 'Scaduto', variant: 'danger' };
    }
    
    // Calculate if expires in the next month
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
    
    if (socio.importoIncassatoAttivita) {
      return { status: 'paid', label: socio.importoIncassatoAttivita, variant: 'success' };
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
  
  // Calcola il numero di colonne totali per il colspan
  const getTotalColumns = () => {
    return Object.values(selectedColumns).filter(Boolean).length;
  };
  
  if (loading) {
    return <Loader />;
  }
  
  if (error) {
    return <Alert variant="danger" message={error} />;
  }
  
  return (
    <>      <style>{`
        @media print {
          .table {
            font-size: 10pt !important;
          }
          .table td, .table th {
            padding: 0.4rem !important;
            word-wrap: break-word;
            max-width: 150px;
          }
        }
        .table {
          table-layout: fixed;
          width: 100%;
          font-size: 1rem;
        }
        .table td, .table th {
          word-wrap: break-word;
          overflow-wrap: break-word;
          padding: 0.5rem;
        }
      `}</style>
      <Container className="mt-4 mb-5">
        {/* Barra degli strumenti (nascosta in stampa) */}
        <div className="mb-4 no-print">
          <Button variant="primary" onClick={handlePrint}>
            <i className="bi bi-printer me-1"></i> Stampa
          </Button>
        </div>
        
        <Card className="mb-4">
          <Card.Header className="text-center">
            <img src='./headercso.jpg' alt="Header" />
            <h2 className="mb-0">{titolo + (data.length > 0 && data[0].nomeAttivita ? ' ' + data[0].nomeAttivita : '')}</h2>
            <p className="mb-0">Data: {formatDateDisplay(new Date())}</p>
          </Card.Header>
          <Card.Body>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  {selectedColumns.tessera && <th>Tessera</th>}
                  {selectedColumns.cognome && <th>Cognome</th>}
                  {selectedColumns.nome && <th>Nome</th>}
                  {selectedColumns.telefono && <th>Telefono</th>}
                  {selectedColumns.email && <th>Email</th>}
                  {selectedColumns.certificato && <th>Certificato</th>}
                  {selectedColumns.quotaAssociativa && <th>Quota Ass.</th>}
                  {selectedColumns.scadenzaAttivita && hasActivityFilter && <th>Scadenza Attività</th>}
                  {selectedColumns.statoPagamento && hasActivityFilter && <th>Stato Pagamento</th>}
                  {selectedColumns.tesseraConsegnata && <th>Tessera Consegnata</th>}
                  {selectedColumns.coperturaAssicurativa && <th>Copertura Assicurativa</th>}
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={getTotalColumns()} className="text-center">
                      Nessun socio trovato
                    </td>
                  </tr>
                ) : (
                  data.map((socio) => {
                    const certificatoStatus = getCertificatoStatus(socio);
                    const pagamentoStatus = hasActivityFilter ? getPagamentoStatus(socio) : null;
                    
                    return (
                      <tr key={socio.id}>
                        {selectedColumns.tessera && (
                          <td>{socio.tesseraNumber || socio.NSocio || '---'}</td>
                        )}
                        {selectedColumns.cognome && (
                          <td>{socio.cognome}</td>
                        )}
                        {selectedColumns.nome && (
                          <td>{socio.nome}</td>
                        )}
                        {selectedColumns.telefono && (
                          <td>{socio.tel || socio.telefono || '---'}</td>
                        )}
                        {selectedColumns.email && (
                          <td>{socio.email || '---'}</td>
                        )}
                        {selectedColumns.certificato && (
                          <td className={`table-${certificatoStatus.variant}`}>
                            {socio.dateCertificat || socio.scadenzaCertificato
                              ? `${formatDateDisplay(socio.dateCertificat || socio.scadenzaCertificato)} (${certificatoStatus.label})`
                              : 'Mancante'
                            }
                          </td>
                        )}
                        {selectedColumns.quotaAssociativa && (
                          <td>
                            <Badge 
                              bg={socio.hasQuotaAssociativa || socio.quotaAssociativaPagata ? 'success' : 'danger'}
                              className="w-100"
                            >
                              {socio.hasQuotaAssociativa || socio.quotaAssociativaPagata ? 'Pagata' : 'Non Pagata'}
                            </Badge>
                          </td>
                        )}
                        {selectedColumns.scadenzaAttivita && hasActivityFilter && (
                          <td>
                            {socio.abbonamento?.scadenza 
                              ? formatDateDisplay(socio.abbonamento.scadenza)
                              : socio.scadenzaPagamentoAttivita
                              ? formatDateDisplay(socio.scadenzaPagamentoAttivita)
                              : '---'
                            }
                          </td>
                        )}
                        {selectedColumns.statoPagamento && hasActivityFilter && (
                          <td className={pagamentoStatus ? `table-${pagamentoStatus.variant}` : ''}>
                            <Badge 
                              bg={pagamentoStatus ? pagamentoStatus.variant : 'secondary'}
                              className="w-100"
                            >
                              {pagamentoStatus ? pagamentoStatus.label : 'N/D'}
                            </Badge>
                          </td>
                        )}
                        {selectedColumns.tesseraConsegnata && (
                          <td className="text-center">
                            <input type="checkbox" style={{ transform: 'scale(1.2)' }} />
                          </td>
                        )}
                        {selectedColumns.coperturaAssicurativa && (
                          <td className="text-center">
                            <input type="checkbox" style={{ transform: 'scale(1.2)' }} />
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

      {/* Modal per selezione colonne */}
      <Modal show={showColumnModal} onHide={() => setShowColumnModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Seleziona Colonne da Stampare</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <Button 
              variant="outline-primary" 
              size="sm" 
              className="me-2"
              onClick={() => toggleAllColumns(true)}
            >
              Seleziona Tutto
            </Button>
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={() => toggleAllColumns(false)}
            >
              Deseleziona Tutto
            </Button>
          </div>
          
          <Row>
            <Col md={6}>
              <h6 className="text-muted mb-3">Colonne Base</h6>
              <Form.Check
                type="checkbox"
                label="Tessera"
                checked={selectedColumns.tessera}
                onChange={() => handleColumnChange('tessera')}
                className="mb-2"
              />
              <Form.Check
                type="checkbox"
                label="Cognome"
                checked={selectedColumns.cognome}
                onChange={() => handleColumnChange('cognome')}
                className="mb-2"
              />
              <Form.Check
                type="checkbox"
                label="Nome"
                checked={selectedColumns.nome}
                onChange={() => handleColumnChange('nome')}
                className="mb-2"
              />
              <Form.Check
                type="checkbox"
                label="Telefono"
                checked={selectedColumns.telefono}
                onChange={() => handleColumnChange('telefono')}
                className="mb-2"
              />
              <Form.Check
                type="checkbox"
                label="Email"
                checked={selectedColumns.email}
                onChange={() => handleColumnChange('email')}
                className="mb-2"
              />
            </Col>
            
            <Col md={6}>
              <h6 className="text-muted mb-3">Colonne Aggiuntive</h6>
              <Form.Check
                type="checkbox"
                label="Certificato Medico"
                checked={selectedColumns.certificato}
                onChange={() => handleColumnChange('certificato')}
                className="mb-2"
              />
              <Form.Check
                type="checkbox"
                label="Quota Associativa"
                checked={selectedColumns.quotaAssociativa}
                onChange={() => handleColumnChange('quotaAssociativa')}
                className="mb-2"
              />
              {hasActivityFilter && (
                <>
                  <Form.Check
                    type="checkbox"
                    label="Scadenza Attività"
                    checked={selectedColumns.scadenzaAttivita}
                    onChange={() => handleColumnChange('scadenzaAttivita')}
                    className="mb-2"
                  />
                  <Form.Check
                    type="checkbox"
                    label="Stato Pagamento"
                    checked={selectedColumns.statoPagamento}
                    onChange={() => handleColumnChange('statoPagamento')}
                    className="mb-2"
                  />
                </>
              )}
              
              <hr className="my-3" />
              <h6 className="text-muted mb-3">Colonne per Controllo Manuale</h6>
              <Form.Check
                type="checkbox"
                label="Tessera Consegnata"
                checked={selectedColumns.tesseraConsegnata}
                onChange={() => handleColumnChange('tesseraConsegnata')}
                className="mb-2"
              />
              <Form.Check
                type="checkbox"
                label="Copertura Assicurativa"
                checked={selectedColumns.coperturaAssicurativa}
                onChange={() => handleColumnChange('coperturaAssicurativa')}
                className="mb-2"
              />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowColumnModal(false)}>
            Annulla
          </Button>
          <Button variant="primary" onClick={confirmPrint}>
            <i className="bi bi-printer me-1"></i>
            Stampa con Colonne Selezionate
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default RicercaStampa;