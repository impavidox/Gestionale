import React, { useState, useEffect } from 'react';
import { Card, Table, Row, Col, Form, Button, Alert, Badge, Accordion } from 'react-bootstrap';
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

  // Dati hardcodati anno scolastico precedente (2024-2025) - Solo Entrate
  // Ordinati per anno scolastico: Settembre 2024 -> Agosto 2025
  const lastYearData = {
    monthlyStats: [
      { month: 'Settembre', entrate: 28855.00 },
      { month: 'Ottobre', entrate: 26615.00 },
      { month: 'Novembre', entrate: 5550.00 },
      { month: 'Dicembre', entrate: 1565.00 },
      { month: 'Gennaio', entrate: 4970.00 },
      { month: 'Febbraio', entrate: 7350.00 },
      { month: 'Marzo', entrate: 5415.00 },
      { month: 'Aprile', entrate: 6485.00 },
      { month: 'Maggio', entrate: 380.00 },
      { month: 'Giugno', entrate: 3975.00 },
      { month: 'Luglio', entrate: 400.00 },
      { month: 'Agosto', entrate: 0.00 }
    ]
  };

  // Calcola anno scolastico corrente
  const getCurrentSchoolYear = () => {
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // 1-12
    const currentYear = today.getFullYear();
    const schoolYearStart = currentMonth >= 9 ? currentYear : currentYear - 1;
    const schoolYearEnd = schoolYearStart + 1;
    return `${schoolYearStart}-${schoolYearEnd}`;
  };

  const currentSchoolYear = getCurrentSchoolYear();

  // Stati per errori e loading
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);

  // Opzioni per il tipo di prima nota
  const typeOptions = [
    { label: 'Tutte le Ricevute', value: 0 },
    { label: 'Solo POS', value: 1 },
    { label: 'Solo Contanti', value: 2 },
    { label: 'Solo Bonifico', value: 3 }
  ];

  // Tipologie di pagamento per visualizzazione
  const tipologiePagamento = {
    1: { nome: 'POS', color: 'primary' },
    2: { nome: 'Contanti', color: 'success' },
    3: { nome: 'Bonifico', color: 'info' }
  };

  // Helper function per calcolare la variazione percentuale
  const calculatePercentageChange = (current, previous) => {
    if (!previous || previous === 0) return null;
    return ((current - previous) / previous) * 100;
  };

  // Helper function per ottenere i dati dell'anno precedente per un mese specifico
  const getLastYearDataForMonth = (monthName) => {
    const monthData = lastYearData.monthlyStats.find(m => m.month === monthName);
    return monthData ? monthData.entrate : 0;
  };

  // Helper function per calcolare il totale anno precedente solo per i mesi presenti nell'anno corrente
  const getLastYearTotalForCurrentMonths = (currentMonthlyStats) => {
    if (!currentMonthlyStats || currentMonthlyStats.length === 0) return 0;

    // Ottieni i nomi dei mesi presenti nell'anno corrente
    const currentMonths = currentMonthlyStats.map(stat => stat.month);

    // Somma solo i mesi dell'anno precedente che corrispondono ai mesi dell'anno corrente
    return lastYearData.monthlyStats
      .filter(stat => currentMonths.includes(stat.month))
      .reduce((sum, stat) => sum + stat.entrate, 0);
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
        selectedType.value
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
      type: selectedType.value,
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
      console.log('Fetching statistics...');
      const response = await primaNotaService.getStatistic(0);
      console.log('Statistics response:', response);
      console.log('Statistics data:', response.data);
      console.log('Monthly stats:', response.data?.data?.monthlyStats);
      console.log('Category stats:', response.data?.data?.categorieStats);

      setStatisticsData(response.data.data);
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
                  {/* Summary Cards per confronto annuale */}
                  {statisticsData.monthlyStats && statisticsData.monthlyStats.length > 0 && (
                    <Row className="mb-4">
                      <Col md={4} className="d-flex align-items-stretch">
                        <Card className="text-center border-primary w-100">
                          <Card.Body className="d-flex flex-column justify-content-center py-4">
                            <Card.Title className="text-muted mb-3">Totale Entrate {currentSchoolYear}</Card.Title>
                            <div>
                              <h3 className="text-primary mb-2">
                                {statisticsData.monthlyStats.reduce((sum, stat) => sum + (stat.entrate || 0), 0).toFixed(2)} €
                              </h3>
                              <div style={{height: '26px'}}>&nbsp;</div>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={4} className="d-flex align-items-stretch">
                        <Card className="text-center border-secondary w-100">
                          <Card.Body className="d-flex flex-column justify-content-center py-4">
                            <Card.Title className="text-muted mb-3">Totale Entrate 2024-2025 (stessi mesi)</Card.Title>
                            <div>
                              <h3 className="text-secondary mb-2">
                                {getLastYearTotalForCurrentMonths(statisticsData.monthlyStats).toFixed(2)} €
                              </h3>
                              <div style={{height: '26px'}}>&nbsp;</div>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={4} className="d-flex align-items-stretch">
                        <Card className={`text-center w-100 ${
                          (statisticsData.monthlyStats.reduce((sum, stat) => sum + (stat.entrate || 0), 0) -
                           getLastYearTotalForCurrentMonths(statisticsData.monthlyStats)) >= 0
                            ? 'border-success' : 'border-danger'
                        }`}>
                          <Card.Body className="d-flex flex-column justify-content-center py-4">
                            <Card.Title className="text-muted mb-3">Variazione Annuale</Card.Title>
                            <div>
                              <h3 className={`mb-2 ${
                                (statisticsData.monthlyStats.reduce((sum, stat) => sum + (stat.entrate || 0), 0) -
                                 getLastYearTotalForCurrentMonths(statisticsData.monthlyStats)) >= 0
                                  ? 'text-success' : 'text-danger'
                              }`}>
                                {(() => {
                                  const totalCurrent = statisticsData.monthlyStats.reduce((sum, stat) => sum + (stat.entrate || 0), 0);
                                  const totalLast = getLastYearTotalForCurrentMonths(statisticsData.monthlyStats);
                                  const diff = totalCurrent - totalLast;
                                  return `${diff >= 0 ? '+' : ''}${diff.toFixed(2)} €`;
                                })()}
                              </h3>
                              <Badge bg={
                                calculatePercentageChange(
                                  statisticsData.monthlyStats.reduce((sum, stat) => sum + (stat.entrate || 0), 0),
                                  getLastYearTotalForCurrentMonths(statisticsData.monthlyStats)
                                ) >= 0 ? 'success' : 'danger'
                              }>
                                {(() => {
                                  const totalChange = calculatePercentageChange(
                                    statisticsData.monthlyStats.reduce((sum, stat) => sum + (stat.entrate || 0), 0),
                                    getLastYearTotalForCurrentMonths(statisticsData.monthlyStats)
                                  );
                                  return totalChange !== null
                                    ? `${totalChange >= 0 ? '+' : ''}${totalChange.toFixed(2)}% ${totalChange >= 0 ? '↑' : '↓'}`
                                    : 'N/A';
                                })()}
                              </Badge>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  )}

                  <Accordion defaultActiveKey="0" className="mt-4">
                    {/* PRIMO: Riepilogo Mensile */}
                    <Accordion.Item eventKey="0">
                      <Accordion.Header>
                        <strong>Riepilogo Mensile - Confronto Anno Scolastico {currentSchoolYear} vs 2024-2025</strong>
                      </Accordion.Header>
                      <Accordion.Body>
                        {statisticsData.monthlyStats && statisticsData.monthlyStats.length > 0 ? (
                          <Table striped bordered hover responsive>
                      <thead>
                        <tr>
                          <th>Mese</th>
                          <th className="text-end">Entrate {currentSchoolYear}</th>
                          <th className="text-end">Entrate 2024-2025</th>
                          <th className="text-end">Differenza</th>
                          <th className="text-end">Variazione %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statisticsData.monthlyStats.map((stat, index) => {
                        const lastYearEntrate = getLastYearDataForMonth(stat.month);
                        const currentEntrate = stat.entrate || 0;
                        const difference = currentEntrate - lastYearEntrate;
                        const percentageChange = calculatePercentageChange(currentEntrate, lastYearEntrate);

                        return (
                          <tr key={index}>
                            <td>{stat.month}</td>
                            <td className="text-end fw-bold">{currentEntrate.toFixed(2)} €</td>
                            <td className="text-end text-muted">{lastYearEntrate.toFixed(2)} €</td>
                            <td className={`text-end ${difference >= 0 ? 'text-success' : 'text-danger'}`}>
                              {difference >= 0 ? '+' : ''}{difference.toFixed(2)} €
                            </td>
                            <td className={`text-end fw-bold ${percentageChange !== null && percentageChange >= 0 ? 'text-success' : 'text-danger'}`}>
                              {percentageChange !== null ? (
                                <>
                                  {percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(2)}%
                                  {percentageChange >= 0 ? ' ↑' : ' ↓'}
                                </>
                              ) : 'N/A'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {statisticsData.monthlyStats && statisticsData.monthlyStats.length > 0 && (
                      <tfoot>
                        <tr className="table-secondary fw-bold">
                          <td>Totale</td>
                          <td className="text-end">
                            {statisticsData.monthlyStats.reduce((sum, stat) => sum + (stat.entrate || 0), 0).toFixed(2)} €
                          </td>
                          <td className="text-end">
                            {getLastYearTotalForCurrentMonths(statisticsData.monthlyStats).toFixed(2)} €
                          </td>
                          <td className={`text-end ${
                            (statisticsData.monthlyStats.reduce((sum, stat) => sum + (stat.entrate || 0), 0) -
                             getLastYearTotalForCurrentMonths(statisticsData.monthlyStats)) >= 0
                              ? 'text-success' : 'text-danger'
                          }`}>
                            {(statisticsData.monthlyStats.reduce((sum, stat) => sum + (stat.entrate || 0), 0) -
                              getLastYearTotalForCurrentMonths(statisticsData.monthlyStats)) >= 0 ? '+' : ''}
                            {(statisticsData.monthlyStats.reduce((sum, stat) => sum + (stat.entrate || 0), 0) -
                              getLastYearTotalForCurrentMonths(statisticsData.monthlyStats)).toFixed(2)} €
                          </td>
                          <td className={`text-end ${
                            calculatePercentageChange(
                              statisticsData.monthlyStats.reduce((sum, stat) => sum + (stat.entrate || 0), 0),
                              getLastYearTotalForCurrentMonths(statisticsData.monthlyStats)
                            ) >= 0 ? 'text-success' : 'text-danger'
                          }`}>
                            {(() => {
                              const totalChange = calculatePercentageChange(
                                statisticsData.monthlyStats.reduce((sum, stat) => sum + (stat.entrate || 0), 0),
                                getLastYearTotalForCurrentMonths(statisticsData.monthlyStats)
                              );
                              return totalChange !== null
                                ? `${totalChange >= 0 ? '+' : ''}${totalChange.toFixed(2)}% ${totalChange >= 0 ? '↑' : '↓'}`
                                : 'N/A';
                            })()}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                          </Table>
                        ) : (
                          <p className="text-center text-muted">Nessun dato mensile disponibile per l'anno corrente.</p>
                        )}
                      </Accordion.Body>
                    </Accordion.Item>

                    {/* SECONDO: Riepilogo per Categoria */}
                    <Accordion.Item eventKey="1">
                      <Accordion.Header>
                        <strong>Riepilogo per Categoria</strong>
                      </Accordion.Header>
                      <Accordion.Body>
                        <Table striped bordered hover responsive>
                          <thead>
                            <tr>
                              <th>Categoria</th>
                              <th className="text-end">Entrate</th>
                            </tr>
                          </thead>
                          <tbody>
                            {statisticsData.categorieStats && statisticsData.categorieStats.map((stat, index) => (
                              <tr key={index}>
                                <td>{stat.categoria}</td>
                                <td className="text-end">{stat.entrate?.toFixed(2) || '0.00'} €</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="fw-bold">
                              <th className="text-end">Totale</th>
                              <th className="text-end">{statisticsData.totaleEntrate?.toFixed(2) || '0.00'} €</th>
                            </tr>
                          </tfoot>
                        </Table>
                      </Accordion.Body>
                    </Accordion.Item>
                  </Accordion>
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