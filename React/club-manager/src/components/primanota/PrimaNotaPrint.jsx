import React, { useState, useEffect } from 'react';
import { Card, Table, Button } from 'react-bootstrap';
import { formatDateDisplay } from '../../utils/dateUtils';
import primaNotaService from '../../api/services/primaNotaService';
import Loader from '../common/Loader';
import Alert from '../common/Alert';

/**
 * Componente per la stampa della prima nota
 * 
 * @param {Object} props - Props del componente
 * @param {number} props.type - Tipo di prima nota
 * @param {string} props.startDate - Data inizio
 * @param {string} props.endDate - Data fine
 */
const PrimaNotaPrint = ({ type, startDate, endDate }) => {
  // Stati per i dati
  const [primaNotaData, setPrimaNotaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Titoli in base al tipo
  const getTitolo = (typeCode) => {
    switch (typeCode) {
      case 0: return 'Prima Nota';
      case 1: return 'Prima Nota Speciale';
      case 2: return 'Ricevuta Commerciale';
      case 3: return 'Fattura Commerciale';
      case 9: return 'Fattura';
      default: return 'Prima Nota';
    }
  };
  
  // Carica i dati all'avvio
  useEffect(() => {
    const fetchPrimaNotaData = async () => {
      setLoading(true);
      setError('');
      
      try {
        if (type !== undefined) {
          const response = await primaNotaService.printPrimaNota(
            type,
            startDate || '',
            endDate || ''
          );
          
          setPrimaNotaData(response.data);
        }
      } catch (err) {
        console.error('Errore nel caricamento dei dati per la stampa:', err);
        setError('Si è verificato un errore nel caricamento dei dati per la stampa.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPrimaNotaData();
  }, [type, startDate, endDate]);
  
  // Gestione della stampa
  const handlePrint = () => {
    window.print();
  };
  
  // Formattazione della data periodo
  const formatPeriodo = () => {
    if (startDate && endDate) {
      return `Dal ${formatDateDisplay(startDate)} al ${formatDateDisplay(endDate)}`;
    }
    return 'Periodo completo';
  };
  
  // Loader durante il caricamento
  if (loading) {
    return <Loader />;
  }
  
  // Mostra errore
  if (error) {
    return <Alert variant="danger" message={error} />;
  }
  
  // Se non ci sono dati
  if (!primaNotaData || !primaNotaData.items || primaNotaData.items.length === 0) {
    return <Alert variant="warning" message="Nessun dato disponibile per la stampa." />;
  }
  
  return (
    <div className="m-4">
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
            <h2>{getTitolo(type)}</h2>
            <h5>{formatPeriodo()}</h5>
            <p>Data stampa: {formatDateDisplay(new Date())}</p>
          </div>
          
          <Table bordered responsive className="mt-3">
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
                <th className="text-end">{primaNotaData.totale?.toFixed(2) || '0.00'} €</th>
              </tr>
            </tfoot>
          </Table>
          
          <div className="mt-5 pt-5 text-center">
            <p>Firma</p>
            <div className="mt-5">_______________________</div>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default PrimaNotaPrint;