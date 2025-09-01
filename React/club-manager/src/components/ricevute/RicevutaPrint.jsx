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
          console.log(response)
          setRicevutaData(response.data.data);
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

  // Gestione dell'invio
  const handleSend = () => {
    // Implementa la logica per inviare la ricevuta (email, ecc.)
    console.log('Invio ricevuta...');
    // Qui puoi aggiungere la chiamata API per inviare la ricevuta via email
    alert('Funzionalità di invio da implementare');
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
    <>
      {/* Barra degli strumenti (nascosta in stampa) */}
      <div className="no-print p-3 bg-light border-bottom">
        <div className="container">
          <div className="d-flex gap-2">
            <Button variant="primary" onClick={handlePrint}>
              <i className="bi bi-printer me-1"></i> Stampa
            </Button>
            <Button variant="success" onClick={handleSend}>
              <i className="bi bi-envelope me-1"></i> Invia
            </Button>
          </div>
        </div>
      </div>
      
      <div className="m-4">
      
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
    </>
  );
};

/**
 * Componente per il contenuto della ricevuta - Struttura italiana ufficiale
 */
const RicevutaContent = ({ data }) => {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', lineHeight: '1.4' }}>
      {/* Header con logo e info club */}
      <Row className="mb-4">
        <Col md={4}>
          <img src='/headercsoric.jpg'></img>
        </Col>
        <Col md={4} className="text-end">
          <div style={{ marginTop: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
              N° {data.nrRicevuta || '___'}
            </div>
            <div style={{ marginTop: '10px' }}>
              Data {formatDateDisplay(data.dataRicevuta) || '___________'}
            </div>
          </div>
        </Col>
      </Row>

      {/* Sottoscritto */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          Il Sottoscritto <span style={{ fontWeight: 'bold' }}>PAOLO SOTTILE</span> nella qualità di Presidente Pro-tempore dell'ASD-APS Centro Sportivo Orbassano
        </div>
      </div>

      {/* Dichiarazione principale */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h5 style={{ fontWeight: 'bold', textDecoration: 'underline' }}>
            DICHIARA DI AVER RICEVUTO
          </h5>
        </div>

        <div style={{ marginBottom: '15px' }}>
          da {data.socioCognome && data.socioNome ? 
            `${data.socioCognome} ${data.socioNome}` : 
            '.................................................................................'}
        </div>
        
        {/* Sezione minore - residente in, via, e patria potestà */}
        {data.isMinore && (
          <>
            <div style={{ marginBottom: '15px' }}>
              residente in {data.citta || '...........................................................................'}
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              via {data.indirizzo || '.................................................................................'}
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              C.Fisc. {data.codiceFiscale || '................................................................'}
            </div>

            <div style={{ marginBottom: '10px' }}>
              quale esercente la patria potestà del minore{' '}
              <span style={{ fontWeight: 'bold' }}>
                {data.nomeMinore || 'AMBROSIO BIANCA'}
              </span>
            </div>
            <div style={{ marginBottom: '20px' }}>
              nato a <span style={{ fontWeight: 'bold' }}>TORINO</span> il{' '}
              <span style={{ fontWeight: 'bold' }}>10/11/2015</span>
            </div>
          </>
        )}


        {/* Importo */}
        <div style={{ marginBottom: '15px', fontSize: '14px' }}>
          la somma di <span style={{ fontWeight: 'bold' }}>{data.importoRicevuta || '80'} €</span>
        </div>

        {/* Dettagli quote */}
        <div style={{ marginBottom: '10px' }}>
          • per la quota associativa di
          fino al {formatDateDisplay(data.scadenzaQuota) || '31/08/2025'}
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          • per la quota di frequenza 
          fino al {formatDateDisplay(data.scadenzaPagamento) || '31/10/2024'}
        </div>

        {/* Attività */}
        <div style={{ marginBottom: '30px' }}>
          relativo alla pratica sportiva dilettantistica{' '}
          <span style={{ fontWeight: 'bold' }}>
            {data.attivitaNome || 'Attività Integrativa Ven Pavese'}
          </span>
        </div>
      </div>

      {/* Note legali */}
      <div style={{ 
        fontSize: '9px', 
        marginBottom: '30px', 
        padding: '10px', 
        backgroundColor: '#f8f9fa',
        borderRadius: '5px'
      }}>
        <p style={{ margin: '0 0 5px 0' }}>
          Ai sensi dell'art. 15, c.1 lett=quinquies D.P.R. 917/1986, l'importo corrisposto beneficia della
        </p>
        <p style={{ margin: '0 0 5px 0' }}>
          detrazione d'imposta IRPEF pari al 19% dell'importo pagato (calcolato su un massimo di Euro
        </p>
        <p style={{ margin: '0 0 5px 0' }}>
          210,00 per ciascuna persona che effettui il pagamento), come disposto dal c. 319 della L.
        </p>
        <p style={{ margin: '0' }}>
          27/12/2006, N° 296 e relativo decreto di attuazione del 28/03/2007
        </p>
      </div>

      {/* Firma */}
<div className="text-end" style={{ marginTop: '50px' }}>
  <div style={{ 
    marginBottom: '40px',
    position: 'relative'
  }}>
    Il presidente
    <span style={{
      borderBottom: '1px dotted #000',
      display: 'inline-block',
      width: '27%',
      marginLeft: '10px'
    }}></span>
    <img 
      src='/sign.png' 
      width='25%'
      style={{
        position: 'absolute',
        right: '0',
        top: '60%',
        transform: 'translateY(-60%)'
      }}
    />
  </div>
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