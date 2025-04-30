import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Row, Col } from 'react-bootstrap';
import { formatDateDisplay } from '../../utils/dateUtils';
import ricevutaService from '../../api/services/ricevutaService';
import Loader from '../common/Loader';
import Alert from '../common/Alert';

/**
 * Componente per la stampa di una ricevuta
 * 
 * @param {Object} props - Props del componente
 * @param {number} props.idSocio - ID del socio
 * @param {number} props.reprint - Tipo di operazione (0=nuova, 1=ristampa, 2=modifica)
 * @param {number} props.idAbbo - ID dell'abbonamento
 * @param {number} props.idRicevuta - ID della ricevuta
 * @param {boolean} props.isScheda - Indica se è una scheda invece di una ricevuta
 */
const RicevutaPrint = ({ 
  idSocio, 
  reprint = 0, 
  idAbbo = 0, 
  idRicevuta = 0,
  isScheda = false
}) => {
  // Stati per i dati
  const [ricevutaData, setRicevutaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Carica i dati all'avvio
  useEffect(() => {
    const fetchRicevutaData = async () => {
      setLoading(true);
      setError('');
      
      try {
        if (idSocio) {
          let response;
          
          if (isScheda) {
            // Carica i dati della scheda
            response = await ricevutaService.prepareScheda(idSocio);
          } else if (reprint === 0) {
            // Nuova ricevuta - questo caso non dovrebbe verificarsi qui
            // perché la stampa avviene dopo la creazione
            setError('Per stampare una nuova ricevuta, è necessario prima crearla.');
            setLoading(false);
            return;
          } else {
            // Carica i dati della ricevuta esistente
            response = await ricevutaService.buildRicevuta(idSocio, idAbbo, idRicevuta);
          }
          
          setRicevutaData(response.data);
        }
      } catch (err) {
        console.error('Errore nel caricamento dei dati per la stampa:', err);
        setError('Si è verificato un errore nel caricamento dei dati per la stampa.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRicevutaData();
  }, [idSocio, reprint, idAbbo, idRicevuta, isScheda]);
  
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
  
  // Se non ci sono dati
  if (!ricevutaData) {
    return <Alert variant="warning" message="Nessun dato disponibile per la stampa." />;
  }
  
  // Contenuto della stampa
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
          {isScheda ? (
            <SchedaContent data={ricevutaData} />
          ) : (
            <RicevutaContent data={ricevutaData} />
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

/**
 * Componente per il contenuto della ricevuta
 */
const RicevutaContent = ({ data }) => {
  return (
    <div>
      <div className="text-center mb-4">
        <h2>RICEVUTA</h2>
        <h5>N. {data.nFattura}</h5>
      </div>
      
      <Row className="mb-4">
        <Col md={6}>
          <p><strong>Data:</strong> {formatDateDisplay(data.dataRicevuta)}</p>
          <p><strong>Socio:</strong> {data.cognome} {data.nome}</p>
          <p><strong>Codice Fiscale:</strong> {data.codeFiscale}</p>
        </Col>
        <Col md={6}>
          <p><strong>Periodo:</strong> {data.dataPeriodo}</p>
          <p><strong>Data Quota:</strong> {formatDateDisplay(data.dataQuota)}</p>
          <p><strong>Attività:</strong> {data.attivitaDesc}</p>
        </Col>
      </Row>
      
      <div className="border p-3 mb-4">
        <Row>
          <Col md={6}>
            <h5>Importo Pagato</h5>
            <h3 className="mt-3">{data.pagato} €</h3>
          </Col>
          <Col md={6}>
            <h5>Importo Incassato</h5>
            <h3 className="mt-3">{data.incassato || 0} €</h3>
          </Col>
        </Row>
      </div>
      
      <div className="mt-5 pt-5 border-top">
        <Row>
          <Col md={6} className="text-center">
            <p>Firma ricevente</p>
            <div className="mt-5">_______________________</div>
          </Col>
          <Col md={6} className="text-center">
            <p>Firma per accettazione</p>
            <div className="mt-5">_______________________</div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

/**
 * Componente per il contenuto della scheda
 */
const SchedaContent = ({ data }) => {
  return (
    <div>
      <div className="text-center mb-4">
        <h2>SCHEDA SOCIO</h2>
      </div>
      
      <Row className="mb-4">
        <Col md={6}>
          <h5>Dati Anagrafici</h5>
          <p><strong>Cognome:</strong> {data.cognome}</p>
          <p><strong>Nome:</strong> {data.nome}</p>
          <p><strong>Codice Fiscale:</strong> {data.codeFiscale}</p>
          <p><strong>Data di nascita:</strong> {formatDateDisplay(data.birhDate)}</p>
          <p><strong>Luogo di nascita:</strong> {data.birthCity} ({data.birthProv})</p>
        </Col>
        <Col md={6}>
          <h5>Residenza</h5>
          <p><strong>Indirizzo:</strong> {data.indirizzo}</p>
          <p><strong>Città:</strong> {data.citta}</p>
          <p><strong>Cap:</strong> {data.cap}</p>
          <p><strong>Provincia:</strong> {data.provRes}</p>
          <p><strong>Telefono:</strong> {data.tel || 'N/D'}</p>
          <p><strong>Email:</strong> {data.email || 'N/D'}</p>
        </Col>
      </Row>
      
      <h5 className="mb-3">Dati Abbonamento</h5>
      {data.abbonamento ? (
        <div className="border p-3 mb-4">
          <Row>
            <Col md={6}>
              <p><strong>Numero Tessera:</strong> {data.abbonamento.numeroTessara}</p>
              <p><strong>Data Iscrizione:</strong> {formatDateDisplay(data.abbonamento.incription)}</p>
            </Col>
            <Col md={6}>
              <p><strong>Abbonamento Firmato:</strong> {data.abbonamento.firmato ? 'Sì' : 'No'}</p>
              <p><strong>Tipo Socio:</strong> {data.tipo?.descrizione || 'N/D'}</p>
            </Col>
          </Row>
        </div>
      ) : (
        <p>Nessun abbonamento attivo</p>
      )}
      
      <h5 className="mb-3">Certificato Medico</h5>
      <div className="border p-3 mb-4">
        <Row>
          <Col md={6}>
            <p><strong>Scadenza:</strong> {data.dateCertificat ? formatDateDisplay(data.dateCertificat) : 'N/D'}</p>
          </Col>
          <Col md={6}>
            <p><strong>Tipo:</strong> {data.typeCertificat ? 'Agonistico' : 'Non agonistico'}</p>
          </Col>
        </Row>
      </div>
      
      <div className="mt-5 pt-5 border-top">
        <Row>
          <Col className="text-center">
            <p>Data e firma</p>
            <div className="mt-5">_______________________</div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default RicevutaPrint;