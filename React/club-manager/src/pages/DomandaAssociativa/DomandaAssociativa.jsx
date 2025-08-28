// React/club-manager/src/pages/DomandaAssociativa/DomandaAssociativa.jsx
import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Row, Col, Table } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import socioService from '../../api/services/socioService';
import activityService from '../../api/services/activityService';
import ricevutaService from '../../api/services/ricevutaService';
import { formatDateDisplay, calculateAge } from '../../utils/dateUtils';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';

/**
 * Componente per la stampa della Domanda Associativa
 * Viene generata automaticamente per soci effettivi e volontari maggiorenni
 */
const DomandaAssociativa = () => {
  const [searchParams] = useSearchParams();
  
  // Estrai parametri dall'URL
  const socioId = parseInt(searchParams.get('socioId') || '0');
  const attivitaId = parseInt(searchParams.get('attivitaId') || '0');
  const ricevutaId = parseInt(searchParams.get('ricevutaId') || '0');
  
  // Stati per i dati
  const [socio, setSocio] = useState(null);
  const [attivita, setAttivita] = useState(null);
  const [ricevuta, setRicevuta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Carica i dati all'avvio
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Carica dati del socio
        const socioResponse = await socioService.retrieveSocioById(socioId);
        const socioData = socioResponse.data;
        setSocio(socioData);
        
        // Verifica che il socio sia maggiorenne
        const age = calculateAge(socioData.dataNascita || socioData.birhDate);
        if (age < 18) {
          setError('La domanda associativa è richiesta solo per soci maggiorenni.');
          setLoading(false);
          return;
        }
        
        // Verifica che sia effettivo o volontario
        const isEffettivoOrVolontario = socioData.isEffettivo || socioData.isVolontario;
        if (!isEffettivoOrVolontario) {
          setError('La domanda associativa è richiesta solo per soci effettivi e volontari.');
          setLoading(false);
          return;
        }
        
        // Carica dati dell'attività se specificata
        if (attivitaId) {
          try {
            const attivitaResponse = await activityService.retrieveAllActivities();
            const attivitaData = attivitaResponse.data.data.find(a => a.id === attivitaId);
            setAttivita(attivitaData);
          } catch (error) {
            console.warn('Errore nel caricamento dell\'attività:', error);
          }
        }
        
        // Carica dati della ricevuta se specificata
        if (ricevutaId) {
          try {
            // Assuming there's an endpoint to get ricevuta by ID
            const ricevutaResponse = await ricevutaService.retrieveRicevutaForUser(socioId);
            const ricevutaData = ricevutaResponse.data.data.items?.find(r => r.id === ricevutaId || r.idRicevuta === ricevutaId);
            setRicevuta(ricevutaData);
          } catch (error) {
            console.warn('Errore nel caricamento della ricevuta:', error);
          }
        }
        
      } catch (err) {
        console.error('Errore nel caricamento dei dati:', err);
        setError('Si è verificato un errore nel caricamento dei dati.');
      } finally {
        setLoading(false);
      }
    };
    
    if (socioId) {
      fetchData();
    } else {
      setError('ID socio mancante.');
      setLoading(false);
    }
  }, [socioId, attivitaId, ricevutaId]);
  
  // Gestione della stampa
  const handlePrint = () => {
    window.print();
  };
  
  // Determina il tipo di socio
  const getTipoSocio = () => {
    if (!socio) return 'N/D';
    
    const tipi = [];
    if (socio.isEffettivo) tipi.push('Effettivo');
    if (socio.isVolontario) tipi.push('Volontario');
    if (socio.isTesserato) tipi.push('Tesserato');
    
    return tipi.length > 0 ? tipi.join(', ') : 'N/D';
  };
  
  // Formatta il luogo di nascita
  const formatLuogoNascita = () => {
    if (!socio) return '';
    
    let luogo = socio.comuneNascita || '';
    if (socio.provinciaNascita) {
      luogo += ` (${socio.provinciaNascita})`;
    }
    return luogo;
  };
  
  // Formatta l'indirizzo di residenza
  const formatIndirizzoResidenza = () => {
    if (!socio) return '';
    
    let indirizzo = socio.viaResidenza || socio.indirizzo || '';
    if (socio.capResidenza || socio.cap) {
      indirizzo += ` - ${socio.capResidenza || socio.cap}`;
    }
    if (socio.comuneResidenza) {
      indirizzo += ` ${socio.comuneResidenza}`;
    }
    if (socio.provinciaResidenza) {
      indirizzo += ` (${socio.provinciaResidenza})`;
    }
    return indirizzo;
  };
  
  // Calcola l'età
  const getAge = () => {
    if (!socio) return 0;
    return calculateAge(socio.dataNascita || socio.birhDate);
  };
  
  if (loading) {
    return <Loader />;
  }
  
  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger" message={error} />
        <Button variant="secondary" onClick={() => window.close()}>
          Chiudi
        </Button>
      </Container>
    );
  }
  
  if (!socio) {
    return (
      <Container className="mt-4">
        <Alert variant="warning" message="Dati del socio non trovati." />
        <Button variant="secondary" onClick={() => window.close()}>
          Chiudi
        </Button>
      </Container>
    );
  }
  
  return (
    <Container className="mt-4 mb-5">
      {/* Barra degli strumenti (nascosta in stampa) */}
      <div className="mb-4 no-print d-flex justify-content-between align-items-center">
        <h2>Domanda Associativa</h2>
        <div>
          <Button variant="primary" onClick={handlePrint} className="me-2">
            <i className="bi bi-printer me-1"></i> Stampa
          </Button>
          <Button variant="secondary" onClick={() => window.close()}>
            Chiudi
          </Button>
        </div>
      </div>
      
      {/* Documento da stampare */}
      <Card className="shadow-sm print-document">
        <Card.Body>
          {/* Intestazione */}
          <div className="text-center mb-4 document-header">
            <img src='./headercso.jpg' alt="Header CSO" className="img-fluid mb-3" />
            <h2 className="document-title">DOMANDA DI AMMISSIONE A SOCIO</h2>
            <p className="document-subtitle">Anno Sportivo {new Date().getFullYear()}/{new Date().getFullYear() + 1}</p>
          </div>
          
          {/* Sezione principale */}
          <div className="main-content">
            <p className="lead text-center mb-4">
              <strong>Il/La sottoscritto/a chiede di essere ammesso/a a socio del</strong><br/>
              <strong>CENTRO SPORTIVO ORBETELLO A.S.D.</strong>
            </p>
            
            {/* Dati anagrafici */}
            <div className="section-block mb-4">
              <h5 className="section-title">DATI ANAGRAFICI</h5>
              
              <Table bordered className="info-table">
                <tbody>
                  <tr>
                    <td className="label-cell"><strong>Cognome:</strong></td>
                    <td className="value-cell">{socio.cognome}</td>
                    <td className="label-cell"><strong>Nome:</strong></td>
                    <td className="value-cell">{socio.nome}</td>
                  </tr>
                  <tr>
                    <td className="label-cell"><strong>Codice Fiscale:</strong></td>
                    <td className="value-cell font-monospace">{socio.codiceFiscale || 'N/D'}</td>
                    <td className="label-cell"><strong>Sesso:</strong></td>
                    <td className="value-cell">{socio.sesso}</td>
                  </tr>
                  <tr>
                    <td className="label-cell"><strong>Data di nascita:</strong></td>
                    <td className="value-cell">{formatDateDisplay(socio.dataNascita || socio.birhDate)}</td>
                    <td className="label-cell"><strong>Età:</strong></td>
                    <td className="value-cell">{getAge()} anni</td>
                  </tr>
                  <tr>
                    <td className="label-cell"><strong>Luogo di nascita:</strong></td>
                    <td className="value-cell" colSpan={3}>{formatLuogoNascita()}</td>
                  </tr>
                  <tr>
                    <td className="label-cell"><strong>Residenza:</strong></td>
                    <td className="value-cell" colSpan={3}>{formatIndirizzoResidenza()}</td>
                  </tr>
                  <tr>
                    <td className="label-cell"><strong>Telefono:</strong></td>
                    <td className="value-cell">{socio.telefono || socio.tel || 'N/D'}</td>
                    <td className="label-cell"><strong>Email:</strong></td>
                    <td className="value-cell">{socio.email || 'N/D'}</td>
                  </tr>
                </tbody>
              </Table>
            </div>
            
            {/* Tipo di socio */}
            <div className="section-block mb-4">
              <h5 className="section-title">TIPOLOGIA DI SOCIO</h5>
              <div className="tipo-socio-container">
                <div className="row">
                  <div className="col-md-4">
                    <div className={`tipo-box ${socio.isEffettivo ? 'selected' : ''}`}>
                      <div className="checkbox-container">
                        <span className="checkbox">{socio.isEffettivo ? '☑' : '☐'}</span>
                        <span className="tipo-label">SOCIO EFFETTIVO</span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className={`tipo-box ${socio.isVolontario ? 'selected' : ''}`}>
                      <div className="checkbox-container">
                        <span className="checkbox">{socio.isVolontario ? '☑' : '☐'}</span>
                        <span className="tipo-label">SOCIO VOLONTARIO</span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className={`tipo-box ${socio.isTesserato ? 'selected' : ''}`}>
                      <div className="checkbox-container">
                        <span className="checkbox">{socio.isTesserato ? '☑' : '☐'}</span>
                        <span className="tipo-label">SOCIO TESSERATO</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Attività sportiva */}
            {attivita && (
              <div className="section-block mb-4">
                <h5 className="section-title">ATTIVITÀ SPORTIVA</h5>
                <Table bordered className="info-table">
                  <tbody>
                    <tr>
                      <td className="label-cell"><strong>Attività:</strong></td>
                      <td className="value-cell">{attivita.nome}</td>
                      <td className="label-cell"><strong>Codice:</strong></td>
                      <td className="value-cell">{attivita.codice || 'N/D'}</td>
                    </tr>
                    <tr>
                      <td className="label-cell"><strong>Sezione:</strong></td>
                      <td className="value-cell">{attivita.sezioneNome || 'N/D'}</td>
                      <td className="label-cell"><strong>Federazione:</strong></td>
                      <td className="value-cell">{attivita.federazioneNome || 'N/D'}</td>
                    </tr>
                  </tbody>
                </Table>
              </div>
            )}
            
            {/* Certificato medico */}
            <div className="section-block mb-4">
              <h5 className="section-title">CERTIFICATO MEDICO</h5>
              <Table bordered className="info-table">
                <tbody>
                  <tr>
                    <td className="label-cell"><strong>Scadenza certificato:</strong></td>
                    <td className="value-cell">
                      {socio.scadenzaCertificato || socio.dateCertificat 
                        ? formatDateDisplay(socio.scadenzaCertificato || socio.dateCertificat)
                        : 'Da presentare'
                      }
                    </td>
                    <td className="label-cell"><strong>Tipo:</strong></td>
                    <td className="value-cell">
                      {socio.isAgonistico || socio.competition ? 'Agonistico' : 'Non agonistico'}
                    </td>
                  </tr>
                </tbody>
              </Table>
            </div>
            
            {/* Dichiarazioni */}
            <div className="section-block mb-4">
              <h5 className="section-title">DICHIARAZIONI</h5>
              <div className="declarations">
                <p className="declaration-text">
                  ☑ Il/La sottoscritto/a dichiara di conoscere e accettare integralmente lo Statuto 
                  e i Regolamenti del Centro Sportivo Orbetello A.S.D.
                </p>
                <p className="declaration-text">
                  ☑ Autorizza il trattamento dei dati personali ai sensi del D.Lgs. 196/2003 e del 
                  Regolamento UE 2016/679 (GDPR) per le finalità istituzionali dell'associazione.
                </p>
                <p className="declaration-text">
                  ☑ Si impegna al rispetto delle norme statutarie e regolamentari dell'associazione 
                  e al pagamento delle quote associative stabilite.
                </p>
                {ricevuta && (
                  <p className="declaration-text">
                    ☑ Ha versato la quota associativa di € {ricevuta.importoRicevuta || ricevuta.importo} 
                    in data {formatDateDisplay(ricevuta.dataRicevuta || ricevuta.data)} 
                    con ricevuta n. {ricevuta.numero || ricevuta.id}.
                  </p>
                )}
              </div>
            </div>
            
            {/* Firme */}
            <div className="signatures-section mt-5 pt-4">
              <div className="row">
                <div className="col-md-6">
                  <div className="signature-box">
                    <p className="signature-label">Data e luogo</p>
                    <div className="signature-line">
                      Orbetello, {formatDateDisplay(new Date())}
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="signature-box">
                    <p className="signature-label">Firma del richiedente</p>
                    <div className="signature-line">
                      _________________________________
                    </div>
                    <p className="signature-name">{socio.cognome} {socio.nome}</p>
                  </div>
                </div>
              </div>
              
              <div className="row mt-5">
                <div className="col-md-6">
                  <div className="signature-box">
                    <p className="signature-label">Per accettazione - Il Presidente</p>
                    <div className="signature-line mt-3">
                      _________________________________
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="signature-box">
                    <p className="signature-label">Data di ammissione</p>
                    <div className="signature-line mt-3">
                      _________________________________
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>
      
      {/* Stili CSS per la stampa */}
      <style jsx>{`
        .print-document {
          max-width: 210mm;
          margin: 0 auto;
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.4;
        }
        
        .document-header {
          border-bottom: 2px solid #333;
          padding-bottom: 15px;
          margin-bottom: 30px;
        }
        
        .document-title {
          font-size: 18px;
          font-weight: bold;
          color: #333;
          margin: 15px 0 5px 0;
        }
        
        .document-subtitle {
          font-size: 14px;
          color: #666;
          margin: 0;
        }
        
        .section-title {
          font-size: 14px;
          font-weight: bold;
          color: #333;
          border-bottom: 1px solid #ccc;
          padding-bottom: 5px;
          margin-bottom: 15px;
        }
        
        .section-block {
          page-break-inside: avoid;
          margin-bottom: 20px;
        }
        
        .info-table {
          width: 100%;
          font-size: 11px;
        }
        
        .info-table .label-cell {
          background-color: #f8f9fa;
          font-weight: bold;
          width: 20%;
          padding: 8px;
          vertical-align: middle;
        }
        
        .info-table .value-cell {
          padding: 8px;
          vertical-align: middle;
        }
        
        .tipo-socio-container {
          padding: 15px 0;
        }
        
        .tipo-box {
          border: 2px solid #ddd;
          border-radius: 8px;
          padding: 15px;
          text-align: center;
          margin-bottom: 10px;
          transition: all 0.3s ease;
        }
        
        .tipo-box.selected {
          border-color: #007bff;
          background-color: #f8f9ff;
        }
        
        .checkbox-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        .checkbox {
          font-size: 16px;
          font-weight: bold;
          color: #007bff;
        }
        
        .tipo-label {
          font-size: 12px;
          font-weight: bold;
          color: #333;
        }
        
        .declarations {
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 5px;
        }
        
        .declaration-text {
          margin: 10px 0;
          font-size: 11px;
          line-height: 1.5;
        }
        
        .signatures-section {
          border-top: 1px solid #ccc;
          page-break-inside: avoid;
        }
        
        .signature-box {
          text-align: center;
          margin: 20px 0;
        }
        
        .signature-label {
          font-size: 11px;
          font-weight: bold;
          color: #666;
          margin-bottom: 10px;
        }
        
        .signature-line {
          border-bottom: 1px solid #333;
          min-height: 20px;
          margin: 15px 0;
          font-size: 11px;
          display: flex;
          align-items: end;
          justify-content: center;
          padding-bottom: 5px;
        }
        
        .signature-name {
          font-size: 10px;
          color: #666;
          margin-top: 5px;
          font-style: italic;
        }
        
        /* Print styles */
        @media print {
          .no-print {
            display: none !important;
          }
          
          body {
            margin: 0;
            padding: 0;
            font-size: 11px;
          }
          
          .print-document {
            max-width: none;
            margin: 0;
            box-shadow: none;
            border: none;
          }
          
          .document-header img {
            max-height: 80px;
            width: auto;
          }
          
          .section-block {
            page-break-inside: avoid;
          }
          
          .signatures-section {
            page-break-inside: avoid;
          }
          
          .info-table,
          .info-table th,
          .info-table td {
            border: 1px solid #000 !important;
          }
          
          .tipo-box {
            border: 2px solid #000 !important;
          }
          
          .tipo-box.selected {
            background-color: #f0f0f0 !important;
          }
          
          @page {
            size: A4;
            margin: 15mm;
          }
        }
        
        /* Screen-only styles */
        @media screen {
          .print-document {
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
          }
        }
      `}</style>
    </Container>
  );
};

export default DomandaAssociativa;