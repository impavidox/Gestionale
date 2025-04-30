import React, { useState, useEffect } from 'react';
import { Card, Table, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import DateField from '../forms/DateField';
import SelectField from '../forms/SelectField';
import { formatDateForApi, formatDateDisplay } from '../../utils/dateUtils';
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
  
  // Stati per i dati
  const [primaNotaData, setPrimaNotaData] = useState(null);
  const [totale, setTotale] = useState(0);
  
  // Stati per visualizzazione
  const [viewPrima, setViewPrima] = useState(true);
  const [viewStat, setViewStat] = useState(false);
  const [viewNumeroTessera, setViewNumeroTessera] = useState(false);
  const [statisticsData, setStatisticsData] = useState(null);
  
  // Stati per errori e loading
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  
  // Opzioni per il tipo di prima nota
  const typeOptions = [
    { name: 'Normale', code: 0 },
    { name: 'Speciale', code: 1 },
    { name: 'Ricevuta Commerciale', code: 2 },
    { name: 'Fattura Commerciale', code: 3 },
    { name: 'Fattura', code: 9 }
  ];
  
  // Imposta tipo di default all'avvio
  useEffect(() => {
    setSelectedType(typeOptions[0]);
  }, []);
  
  // Carica i dati della prima nota all'avvio
  useEffect(() => {
    const fetchPrimaNotaData = async () => {
      if (!selectedType) return;
      
      setLoading(true);
      setError('');
      setShowError(false);
      
      try {
        const response = await primaNotaService.buildPrimaNota(selectedType.code);
        setPrimaNotaData(response.data);
        setTotale(response.data.totale || 0);
      } catch (err) {
        console.error('Errore nel caricamento della prima nota:', err);
        setError('Si è verificato un errore nel caricamento della prima nota.');
        setShowError(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPrimaNotaData();
  }, [selectedType]);
  
  // Gestione del cambio di tipo
  const handleTypeChange = (name, selectedValue) => {
    setSelectedType(selectedValue.value);
  };
  
  // Gestione dell'esecuzione della ricerca
  const handleSearch = async () => {
    if (!selectedType) return;
    
    setLoading(true);
    setError('');
    setShowError(false);
    
    try {
      const formattedBeginDate = beginDate ? formatDateForApi(beginDate) : null;
      const formattedEndDate = endDate ? formatDateForApi(endDate) : null;
      
      let response;
      
      if (formattedBeginDate && formattedEndDate) {
        response = await primaNotaService.buildPrimaNota(
          selectedType.code,
          formattedBeginDate,
          formattedEndDate
        );
      } else {
        response = await primaNotaService.buildPrimaNota(selectedType.code);
      }
      
      setPrimaNotaData(response.data);
      setTotale(response.data.totale || 0);
    } catch (err) {
      console.error('Errore nell\'esecuzione della ricerca:', err);
      setError('Si è verificato un errore nell\'esecuzione della ricerca.');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };
  
  // Gestione della stampa
  const handlePrint = () => {
    if (!selectedType) return;
    
    const formattedBeginDate = beginDate ? formatDateForApi(beginDate) : null;
    const formattedEndDate = endDate ? formatDateForApi(endDate) : null;
    
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
  
  // Chiusura alert numero tessera
  const handleCloseNumeroTessera = () => {
    setViewNumeroTessera(false);
  };
  
  return (
    <div>
      {showError && (
        <Alert variant="danger" onClose={() => setShowError(false)} dismissible>
          {error}
        </Alert>
      )}
      
      {viewNumeroTessera && (
        <Alert variant="warning" onClose={handleCloseNumeroTessera} dismissible>
          <Alert.Heading>Attenzione Numero Tessera</Alert.Heading>
          <p>
            Ci sono problemi con i numeri di tessera.
            Si prega di verificare e correggere nel pannello Parametri.
          </p>
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
              <h5>Filtri Prima Nota</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}>
                <Row>
                  <Col md={4}>
                    <SelectField
                      label="Tipo"
                      name="type"
                      value={selectedType}
                      options={typeOptions}
                      onChange={handleTypeChange}
                    />
                  </Col>
                  <Col md={4}>
                    <DateField
                      label="Data Inizio"
                      name="beginDate"
                      value={beginDate}
                      onChange={(name, value) => setBeginDate(value)}
                    />
                  </Col>
                  <Col md={4}>
                    <DateField
                      label="Data Fine"
                      name="endDate"
                      value={endDate}
                      onChange={(name, value) => setEndDate(value)}
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
                      <th>Entrata</th>
                      <th>Uscita</th>
                      <th>Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {primaNotaData.items.map((item, index) => (
                      <tr key={index}>
                        <td>{formatDateDisplay(item.data)}</td>
                        <td>{item.description}</td>
                        <td className="text-end">{item.entrata ? item.entrata.toFixed(2) + ' €' : ''}</td>
                        <td className="text-end">{item.uscita ? item.uscita.toFixed(2) + ' €' : ''}</td>
                        <td className="text-end">{item.saldo ? item.saldo.toFixed(2) + ' €' : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th colSpan="2" className="text-end">Totale</th>
                      <th className="text-end">{primaNotaData.totaleEntrate?.toFixed(2) || '0.00'} €</th>
                      <th className="text-end">{primaNotaData.totaleUscite?.toFixed(2) || '0.00'} €</th>
                      <th className="text-end">{totale.toFixed(2)} €</th>
                    </tr>
                  </tfoot>
                </Table>
              </Card.Body>
            </Card>
          ) : (
            <Card>
              <Card.Body className="text-center">
                <p>Nessun dato disponibile per i filtri selezionati.</p>
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