import React, { useState, useEffect } from 'react';
import { Card, Table, Row, Col, Form, Button, Alert, Badge } from 'react-bootstrap';
import DateField from '../forms/DateField';
import SelectField from '../forms/SelectField';
import { formatDateForApi, formatDateDisplay } from '../../utils/dateUtils';
import ricevutaService from '../../api/services/ricevutaService';
import primaNotaService from '../../api/services/primaNotaService';
import Loader from '../common/Loader';
import { useApp } from '../../context/AppContext';

/**
 * Componente per la visualizzazione e gestione della prima nota
 */
const PrimaNotaList = () => {
  const { goNewTab } = useApp();
  
  // Stati per i filtri
  const [beginDate, setBeginDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  
  // Stati per la selezione delle date
  const [dateSelectionType, setDateSelectionType] = useState('range'); // 'range' o 'single'
  const [singleDate, setSingleDate] = useState(null);
  
  // Stati per i dati
  const [primaNotaData, setPrimaNotaData] = useState(null);
  const [totale, setTotale] = useState(0);
  const [raggruppamenti, setRaggruppamenti] = useState({});
  
  // Stati per visualizzazione
  const [viewPrima, setViewPrima] = useState(true);
  const [viewStat, setViewStat] = useState(false);
  const [statisticsData, setStatisticsData] = useState(null);
  
  // Stati per errori e loading
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  
  // Opzioni per il tipo di prima nota
  const typeOptions = [
    { name: 'Tutte le Ricevute', code: 0 },
    { name: 'Solo POS', code: 1 },
    { name: 'Solo Contanti', code: 2 },
    { name: 'Solo Bonifico', code: 3 }
  ];

  // Tipologie di pagamento per visualizzazione
  const tipologiePagamento = {
    1: { nome: 'POS', color: 'primary' },
    2: { nome: 'Contanti', color: 'success' },
    3: { nome: 'Bonifico', color: 'info' }
  };
  
  // Imposta tipo di default all'avvio
  useEffect(() => {
    setSelectedType(typeOptions[0]);
    
    // Imposta date di default (inizio anno corrente)
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31);
    const today = new Date();
    
    setBeginDate(startOfYear);
    setEndDate(endOfYear);
    setSingleDate(today);
  }, []);
  
  // Carica i dati della prima nota all'avvio
  useEffect(() => {
    if (selectedType) {
      if (dateSelectionType === 'range' && beginDate && endDate) {
        fetchPrimaNotaData();
      } else if (dateSelectionType === 'single' && singleDate) {
        fetchPrimaNotaData();
      }
    }
  }, [selectedType, beginDate, endDate, singleDate, dateSelectionType]);
  
  // Fetch dei dati della prima nota usando le ricevute
  const fetchPrimaNotaData = async () => {
    if (!selectedType) return;
    
    let formattedBeginDate, formattedEndDate;
    
    if (dateSelectionType === 'range') {
      if (!beginDate || !endDate) return;
      formattedBeginDate = formatDateForApi(beginDate);
      formattedEndDate = formatDateForApi(endDate);
    } else {
      if (!singleDate) return;
      formattedBeginDate = formatDateForApi(singleDate);
      formattedEndDate = formatDateForApi(singleDate);
    }
    
    setLoading(true);
    setError('');
    setShowError(false);
    
    try {
      // Chiama l'API delle ricevute invece di prima nota
      const response = await ricevutaService.retrieveAllByDateRange(
        formattedBeginDate,
        formattedEndDate,
        selectedType.code
      );
      
      console.log('Response from ricevute API:', response);
      
      // Estrai i dati dalla risposta
      const responseData = response.data.data || response;
      const ricevute = responseData.items || [];
      const totaliPerTipo = responseData.totaliPerTipo || {};
      const totaleGenerale = responseData.totaleGenerale || 0;
      
      // Processa i dati per la visualizzazione della prima nota
      const processedData = processRicevuteForPrimaNota(ricevute, totaliPerTipo, totaleGenerale);
      
      setPrimaNotaData(processedData);
      setTotale(totaleGenerale);
      setRaggruppamenti(totaliPerTipo);
      
    } catch (err) {
      console.error('Errore nel caricamento delle ricevute:', err);
      setError('Si è verificato un errore nel caricamento delle ricevute.');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  // Processa le ricevute per la visualizzazione della prima nota
  const processRicevuteForPrimaNota = (ricevute, totaliPerTipo, totaleGenerale) => {
    const tipologiePagamento = {
      1: 'POS',
      2: 'Contanti', 
      3: 'Bonifico'
    };

    const items = [];
    let saldoProgressivo = 0;

    // Processa ogni ricevuta per la visualizzazione
    ricevute.forEach(ricevuta => {
      const tipologia = ricevuta.tipologiaPagamento || 2;
      const importo = ricevuta.importoRicevutaEuro || ricevuta.importoRicevuta || 0;
      
      saldoProgressivo += importo;

      // Crea l'elemento per la visualizzazione
      items.push({
        data: ricevuta.dataRicevuta,
        description: `Ricevuta #${ricevuta.numero || ricevuta.id} - ${ricevuta.socioNome || ''} ${ricevuta.socioCognome || ''} - ${ricevuta.attivitaNome || ''}`,
        entrata: importo,
        uscita: 0,
        saldo: saldoProgressivo,
        tipologiaPagamento: tipologia,
        ricevuta: ricevuta
      });
    });

    return {
      items,
      totale: totaleGenerale,
      totaleEntrate: totaleGenerale,
      totaleUscite: 0,
      raggruppamenti: totaliPerTipo,
      tipologiePagamento
    };
  };
  
  // Gestione del cambio di tipo
  const handleTypeChange = (name, selectedValue) => {
    setSelectedType(selectedValue.value);
  };
  
  // Gestione del cambio di tipo di selezione data
  const handleDateSelectionTypeChange = (type) => {
    setDateSelectionType(type);
    // Reset degli errori quando cambia il tipo
    setError('');
    setShowError(false);
  };
  
  // Gestione dell'esecuzione della ricerca
  const handleSearch = async () => {
    fetchPrimaNotaData();
  };
  
  // Gestione della stampa
  const handlePrint = () => {
    if (!selectedType) return;
    
    let formattedBeginDate, formattedEndDate;
    
    if (dateSelectionType === 'range') {
      if (!beginDate || !endDate) return;
      formattedBeginDate = formatDateForApi(beginDate);
      formattedEndDate = formatDateForApi(endDate);
    } else {
      if (!singleDate) return;
      formattedBeginDate = formatDateForApi(singleDate);
      formattedEndDate = formatDateForApi(singleDate);
    }
    
    goNewTab('stampa-prima-nota', {
      type: selectedType.code,
      begin: formattedBeginDate,
      end: formattedEndDate
    });
  };
  
  // Gestione visualizzazione statistiche
  const handleStatisticsView = async () => {
    setLoading(true);
    setError('');
    setShowError(false);
    
    try {
      const response = await primaNotaService.getStatistic(0);
      setStatisticsData(response.data);
      setViewPrima(false);
      setViewStat(true);
    } catch (err) {
      console.error('Errore nel caricamento delle statistiche:', err);
      setError('Si è verificato un errore nel caricamento delle statistiche.');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };
  
  // Gestione ritorno alla prima nota
  const handlePrimaNotaView = () => {
    setViewPrima(true);
    setViewStat(false);
  };

  // Renderizza il riepilogo per tipologia di pagamento
  const renderPaymentTypeSummary = () => {
    if (!raggruppamenti || Object.keys(raggruppamenti).length === 0) return null;

    return (
      <Card className="mb-4">
        <Card.Header>
          <h5>Riepilogo per Tipologia di Pagamento</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            {Object.entries(raggruppamenti).map(([tipologia, dati]) => {
              // Skip if no data for this payment type
              if (!dati || (dati.totale === 0 && dati.count === 0)) return null;
              
              return (
                <Col md={4} key={tipologia} className="mb-3">
                  <Card className={`border-${tipologiePagamento[tipologia]?.color || 'secondary'}`}>
                    <Card.Body className="text-center">
                      <h6 className={`text-${tipologiePagamento[tipologia]?.color || 'secondary'}`}>
                        {dati.nome || tipologiePagamento[tipologia]?.nome || 'N/D'}
                      </h6>
                      <h4>{(dati.totale || 0).toFixed(2)} €</h4>
                      <small className="text-muted">
                        {dati.count || 0} ricevute
                      </small>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
          <Row>
            <Col className="text-center">
              <h5>Totale Generale: <strong>{totale.toFixed(2)} €</strong></h5>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    );
  };
  
  return (
    <div>
      {showError && (
        <Alert variant="danger" onClose={() => setShowError(false)} dismissible>
          {error}
        </Alert>
      )}
      
      <div className="mb-4 d-flex justify-content-end">
        {viewPrima ? (
          <Button variant="info" onClick={handleStatisticsView}>
            Visualizza Statistiche
          </Button>
        ) : (
          <Button variant="info" onClick={handlePrimaNotaView}>
            Torna alla Prima Nota
          </Button>
        )}
      </div>
      
      {viewPrima ? (
        <>
          <Card className="mb-4">
            <Card.Header>
              <h5>Filtri Prima Nota - Ricevute</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}>
                <Row>
                  <Col md={4}>
                    <SelectField
                      label="Tipologia Pagamento"
                      name="type"
                      value={selectedType}
                      options={typeOptions}
                      onChange={handleTypeChange}
                    />
                  </Col>
                  
                  {/* Selezione tipo di data */}
                  <Col md={8}>
                    <Form.Group className="mb-3">
                      <Form.Label>Selezione Data</Form.Label>
                      <div className="d-flex gap-4 align-items-center">
                        <Form.Check
                          type="radio"
                          id="date-range"
                          name="dateSelectionType"
                          label="Intervallo di date"
                          checked={dateSelectionType === 'range'}
                          onChange={() => handleDateSelectionTypeChange('range')}
                        />
                        <Form.Check
                          type="radio"
                          id="date-single"
                          name="dateSelectionType"
                          label="Data specifica"
                          checked={dateSelectionType === 'single'}
                          onChange={() => handleDateSelectionTypeChange('single')}
                        />
                      </div>
                    </Form.Group>
                  </Col>
                </Row>
                
                {/* Campi data condizionali */}
                <Row>
                  {dateSelectionType === 'range' ? (
                    <>
                      <Col md={6}>
                        <DateField
                          label="Data Inizio"
                          name="beginDate"
                          value={beginDate}
                          onChange={(name, value) => setBeginDate(value)}
                        />
                      </Col>
                      <Col md={6}>
                        <DateField
                          label="Data Fine"
                          name="endDate"
                          value={endDate}
                          onChange={(name, value) => setEndDate(value)}
                        />
                      </Col>
                    </>
                  ) : (
                    <Col md={6}>
                      <DateField
                        label="Data"
                        name="singleDate"
                        value={singleDate}
                        onChange={(name, value) => setSingleDate(value)}
                      />
                    </Col>
                  )}
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

          {/* Riepilogo per tipologie di pagamento */}
          {renderPaymentTypeSummary()}
          
          {loading ? (
            <Loader />
          ) : primaNotaData && primaNotaData.items && primaNotaData.items.length > 0 ? (
            <Card>
              <Card.Header>
                <h5>
                  Prima Nota - {selectedType?.name}
                  <span className="float-end">Totale: {totale.toFixed(2)} €</span>
                </h5>
              </Card.Header>
              <Card.Body>
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Descrizione</th>
                      <th>Tipologia</th>
                      <th>Entrata</th>
                      <th>Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {primaNotaData.items.map((item, index) => (
                      <tr key={index}>
                        <td>{formatDateDisplay(item.data)}</td>
                        <td>{item.description}</td>
                        <td>
                          <Badge bg={tipologiePagamento[item.tipologiaPagamento]?.color || 'secondary'}>
                            {tipologiePagamento[item.tipologiaPagamento]?.nome || 'N/D'}
                          </Badge>
                        </td>
                        <td className="text-end">{item.entrata ? item.entrata.toFixed(2) + ' €' : ''}</td>
                        <td className="text-end">{item.saldo ? item.saldo.toFixed(2) + ' €' : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th colSpan="3" className="text-end">Totale</th>
                      <th className="text-end">{primaNotaData.totaleEntrate?.toFixed(2) || '0.00'} €</th>
                      <th className="text-end">{totale.toFixed(2)} €</th>
                    </tr>
                  </tfoot>
                </Table>
              </Card.Body>
            </Card>
          ) : (
            <Card>
              <Card.Body className="text-center">
                <p>Nessuna ricevuta disponibile per i filtri selezionati.</p>
              </Card.Body>
            </Card>
          )}
        </>
      ) : (
        <>
          <Card>
            <Card.Header>
              <h5>Statistiche</h5>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <Loader />
              ) : statisticsData ? (
                <div>
                  <h6 className="mb-3">Riepilogo per Categoria</h6>
                  <Table striped bordered hover responsive>
                    <thead>
                      <tr>
                        <th>Categoria</th>
                        <th>Entrate</th>
                        <th>Uscite</th>
                        <th>Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statisticsData.categorieStats && statisticsData.categorieStats.map((stat, index) => (
                        <tr key={index}>
                          <td>{stat.categoria}</td>
                          <td className="text-end">{stat.entrate?.toFixed(2) || '0.00'} €</td>
                          <td className="text-end">{stat.uscite?.toFixed(2) || '0.00'} €</td>
                          <td className="text-end">{(stat.entrate - stat.uscite).toFixed(2)} €</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th className="text-end">Totale</th>
                        <th className="text-end">{statisticsData.totaleEntrate?.toFixed(2) || '0.00'} €</th>
                        <th className="text-end">{statisticsData.totaleUscite?.toFixed(2) || '0.00'} €</th>
                        <th className="text-end">{(statisticsData.totaleEntrate - statisticsData.totaleUscite)?.toFixed(2) || '0.00'} €</th>
                      </tr>
                    </tfoot>
                  </Table>
                  
                  <h6 className="my-3">Riepilogo Mensile</h6>
                  <Table striped bordered hover responsive>
                    <thead>
                      <tr>
                        <th>Mese</th>
                        <th>Entrate</th>
                        <th>Uscite</th>
                        <th>Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statisticsData.monthlyStats && statisticsData.monthlyStats.map((stat, index) => (
                        <tr key={index}>
                          <td>{stat.month}</td>
                          <td className="text-end">{stat.entrate?.toFixed(2) || '0.00'} €</td>
                          <td className="text-end">{stat.uscite?.toFixed(2) || '0.00'} €</td>
                          <td className="text-end">{(stat.entrate - stat.uscite).toFixed(2)} €</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <p className="text-center">Nessun dato statistico disponibile.</p>
              )}
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
};

export default PrimaNotaList;