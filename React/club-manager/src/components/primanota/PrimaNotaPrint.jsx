import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge } from 'react-bootstrap';
import { formatDateDisplay, formatDateForApi } from '../../utils/dateUtils';
import ricevutaService from '../../api/services/ricevutaService';
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
  const [totale, setTotale] = useState(0);
  const [raggruppamenti, setRaggruppamenti] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Tipologie di pagamento per visualizzazione
  const tipologiePagamento = {
    1: { nome: 'POS', color: 'primary' },
    2: { nome: 'Contanti', color: 'success' },
    3: { nome: 'Bonifico', color: 'info' }
  };
  
  // Titoli in base al tipo
  const getTitolo = (typeCode) => {
    switch (typeCode) {
      case 0: return 'Prima Nota - Tutte le Ricevute';
      case 1: return 'Prima Nota - Solo POS';
      case 2: return 'Prima Nota - Solo Contanti';
      case 3: return 'Prima Nota - Solo Bonifico';
      default: return 'Prima Nota';
    }
  };
  
  // Processa le ricevute per la visualizzazione della prima nota
  const processRicevuteForPrimaNota = (ricevute, totaliPerTipo, totaleGenerale) => {
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
  
  // Carica i dati all'avvio
  useEffect(() => {
    const fetchPrimaNotaData = async () => {
      setLoading(true);
      setError('');
      
      try {
        if (type !== undefined && startDate && endDate) {
          // Usa il servizio ricevute invece di prima nota
          const response = await ricevutaService.retrieveAllByDateRange(
            startDate,
            endDate,
            type
          );
          
          console.log('Response from ricevute API for print:', response);
          
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
      let correctstart=formatDateDisplay(startDate);
      let correctend=formatDateDisplay(endDate);
      return `Dal ${correctstart} al ${correctend}`;
    }
    return 'Periodo completo';
  };

  // Renderizza il riepilogo per tipologia di pagamento
  const renderPaymentTypeSummary = () => {
    if (!raggruppamenti || Object.keys(raggruppamenti).length === 0) return null;

    return (
      <>
        <h6>Riepilogo per Tipologia di Pagamento</h6>
        <Table bordered className="summary-table">
          <thead>
            <tr>
              <th width="40%">Tipologia</th>
              <th width="30%">Numero Ricevute</th>
              <th width="30%">Importo</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(raggruppamenti).map(([tipologia, dati]) => {
              // Skip if no data for this payment type
              if (!dati || (dati.totale === 0 && dati.count === 0)) return null;
              
              return (
                <tr key={tipologia}>
                  <td className="summary-type-cell">
                    <span className="payment-type-summary">
                      {dati.nome || tipologiePagamento[tipologia]?.nome || 'N/D'}
                    </span>
                  </td>
                  <td className="summary-count-cell">{dati.count || 0}</td>
                  <td className="summary-amount-cell">{(dati.totale || 0).toFixed(2)} €</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="summary-total-row">
              <th>Totale Generale</th>
              <th className="summary-count-cell">
                {Object.values(raggruppamenti).reduce((sum, dati) => sum + (dati.count || 0), 0)}
              </th>
              <th className="summary-amount-cell">{totale.toFixed(2)} €</th>
            </tr>
          </tfoot>
        </Table>
      </>
    );
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
    <>
      {/* Barra degli strumenti (nascosta in stampa) */}
      <div className="no-print p-3 bg-light border-bottom">
        <Button variant="primary" onClick={handlePrint}>
          <i className="bi bi-printer me-1"></i> Stampa
        </Button>
      </div>
      
      {/* Documento da stampare */}
      <div className="print-container">
        <div className="print-page">
          {/* Intestazione documento */}
          <div className="document-header">
            <h1 className="document-title">{getTitolo(type)}</h1>
            <h3 className="document-subtitle">{formatPeriodo()}</h3>
            <p className="print-date">Data stampa: {formatDateDisplay(new Date())}</p>
          </div>
          
          {/* Riepilogo per tipologie di pagamento */}
          <div className="summary-section">
            {renderPaymentTypeSummary()}
          </div>
          
          {/* Tabella principale */}
          <div className="table-section">
            <Table bordered className="main-table">
              <thead>
                <tr>
                  <th width="12%">Data</th>
                  <th width="48%">Descrizione</th>
                  <th width="15%">Tipologia</th>
                  <th width="12%">Entrata</th>
                  <th width="13%">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {primaNotaData.items.map((item, index) => (
                  <tr key={index} className="table-row">
                    <td className="date-cell">{formatDateDisplay(item.data)}</td>
                    <td className="description-cell">{item.description}</td>
                    <td className="type-cell">
                      <span className="payment-type">
                        {tipologiePagamento[item.tipologiaPagamento]?.nome || 'N/D'}
                      </span>
                    </td>
                    <td className="amount-cell">{item.entrata ? item.entrata.toFixed(2) + ' €' : ''}</td>
                    <td className="balance-cell">{item.saldo ? item.saldo.toFixed(2) + ' €' : ''}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="total-row">
                  <th colSpan="3">Totale</th>
                  <th className="amount-cell">{primaNotaData.totaleEntrate?.toFixed(2) || '0.00'} €</th>
                  <th className="balance-cell">{totale.toFixed(2)} €</th>
                </tr>
              </tfoot>
            </Table>
          </div>
          
          {/* Firma */}
          <div className="signature-section">
            <div className="signature-box">
              <p>Firma</p>
              <div className="signature-line">_______________________</div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Screen styles */
        .print-container {
          max-width: 210mm;
          margin: 0 auto;
          background: white;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        
        .print-page {
          padding: 20mm;
          min-height: 297mm;
          box-sizing: border-box;
        }
        
        .document-header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
        }
        
        .document-title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #333;
        }
        
        .document-subtitle {
          font-size: 18px;
          margin-bottom: 8px;
          color: #666;
        }
        
        .print-date {
          font-size: 14px;
          color: #888;
          margin: 0;
        }
        
        .summary-section {
          margin-bottom: 25px;
        }
        
        .summary-section h6 {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 15px;
          color: #333;
        }
        
        .summary-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          margin-bottom: 20px;
        }
        
        .summary-table th {
          background-color: #f8f9fa;
          font-weight: bold;
          padding: 8px 6px;
          text-align: center;
          border: 1px solid #333;
        }
        
        .summary-table td {
          padding: 6px;
          border: 1px solid #333;
        }
        
        .summary-type-cell {
          text-align: left;
        }
        
        .payment-type-summary {
          font-size: 11px;
          font-weight: bold;
          padding: 2px 6px;
          border: 1px solid #333;
          border-radius: 3px;
        }
        
        .summary-count-cell {
          text-align: center;
          font-weight: bold;
        }
        
        .summary-amount-cell {
          text-align: right;
          font-weight: bold;
        }
        
        .summary-total-row th {
          background-color: #e9ecef;
          font-weight: bold;
          padding: 8px 6px;
          border: 1px solid #333;
        }
        
        .table-section {
          margin-bottom: 40px;
        }
        
        .main-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        
        .main-table th {
          background-color: #f8f9fa;
          font-weight: bold;
          padding: 8px 6px;
          text-align: center;
          border: 1px solid #333;
        }
        
        .table-row td {
          padding: 6px;
          border: 1px solid #333;
          vertical-align: top;
        }
        
        .date-cell {
          text-align: center;
          font-size: 11px;
        }
        
        .description-cell {
          font-size: 11px;
          line-height: 1.3;
        }
        
        .type-cell {
          text-align: center;
        }
        
        .payment-type {
          font-size: 10px;
          font-weight: bold;
          padding: 2px 6px;
          border: 1px solid #333;
          border-radius: 3px;
        }
        
        .amount-cell,
        .balance-cell {
          text-align: right;
          font-weight: bold;
          font-size: 11px;
        }
        
        .total-row th {
          background-color: #e9ecef;
          font-weight: bold;
          padding: 10px 6px;
          border: 1px solid #333;
        }
        
        .signature-section {
          margin-top: auto;
          padding-top: 50px;
        }
        
        .signature-box {
          text-align: center;
        }
        
        .signature-line {
          margin-top: 30px;
          font-size: 14px;
        }

        /* Print styles */
        @media print {
          * {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          body {
            margin: 0 !important;
            padding: 0 !important;
            font-family: Arial, sans-serif;
          }
          
          /* Hide all non-document elements */
          .no-print,
          header,
          nav,
          .navbar,
          .breadcrumb,
          .page-header,
          h2:first-child,
          .container h2:first-child,
          .mt-4.mb-5 h2:first-child {
            display: none !important;
          }
          
          /* Hide React container elements that might contain headers */
          body > div > div > div > h2:first-child,
          .container > h2:first-child {
            display: none !important;
          }
          
          .print-container {
            max-width: none !important;
            margin: 0 !important;
            box-shadow: none !important;
            background: white !important;
          }
          
          .print-page {
            padding: 15mm 20mm 20mm 20mm !important;
            margin: 0 !important;
            min-height: auto !important;
            page-break-after: always;
          }
          
          .print-page:last-child {
            page-break-after: auto;
          }
          
          .document-header {
            margin-bottom: 20px;
            padding-bottom: 15px;
          }
          
          .document-title {
            font-size: 20px;
          }
          
          .document-subtitle {
            font-size: 16px;
          }
          
          .summary-section {
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          
          .main-table,
          .summary-table {
            page-break-inside: auto;
          }
          
          .table-row {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          
          .total-row,
          .summary-total-row {
            page-break-inside: avoid;
          }
          
          .signature-section {
            page-break-inside: avoid;
            margin-top: 40px;
          }
          
          /* Ensure proper page sizing */
          @page {
            size: A4;
            margin: 0;
          }
          
          /* Override any potential Bootstrap or external styles */
          .container,
          .container-fluid {
            padding: 0 !important;
            margin: 0 !important;
            max-width: none !important;
          }
        }
      `}</style>
    </>
  );
};

export default PrimaNotaPrint;