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
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  
  // Funzione per calcolare se è minore
  const isMinor = (birthDate) => {
    if (!birthDate) return false;
    
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    // Se non ha ancora compiuto anni quest'anno
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return (age - 1) < 18;
    }
    
    return age < 18;
  };
  
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

  // Genera PDF usando html2pdf
  const generatePDF = async () => {
    try {
      // Importa html2pdf dinamicamente
      const html2pdf = (await import('html2pdf.js')).default;
      
      // Crea un elemento temporaneo con il contenuto da convertire
      const element = document.createElement('div');
      element.innerHTML = generatePrintableHTML(ricevutaData, isScheda);
      
      // Applica gli stili per il PDF
      element.style.fontFamily = 'Arial, sans-serif';
      element.style.fontSize = '12px';
      element.style.lineHeight = '1.4';
      element.style.color = '#000';
      
      const opt = {
        margin: [10, 10, 10, 10],
        filename: isScheda ? 
          `scheda_socio_${ricevutaData.cognome}_${ricevutaData.nome}.pdf` : 
          `ricevuta_${ricevutaData.nrRicevuta}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      return await html2pdf().set(opt).from(element).outputPdf('datauristring');
    } catch (error) {
      console.error('Errore nella generazione del PDF:', error);
      throw new Error('Impossibile generare il PDF');
    }
  };

  // Gestione dell'invio
  const handleSend = async () => {
    if (!ricevutaData || !ricevutaData.email) {
      setError('Email del socio non disponibile. Impossibile inviare la ricevuta.');
      return;
    }

    setSending(true);
    setSendSuccess(false);
    setError('');

    try {
      // Genera il PDF
      const pdfDataUri = await generatePDF();
      const pdfBase64 = pdfDataUri.split(',')[1]; // Rimuove il prefisso data:application/pdf;base64,
      
      const fileName = isScheda ? 
        `scheda_socio_${ricevutaData.cognome}_${ricevutaData.nome}.pdf` : 
        `ricevuta_${ricevutaData.nrRicevuta}.pdf`;
      
      // Chiamata API per inviare l'email con PDF allegato
      const response = await ricevutaService.sendRicevutaEmail({
        recipientEmail: ricevutaData.email,
        recipientName: `${ricevutaData.socioCognome || ricevutaData.cognome} ${ricevutaData.socioNome || ricevutaData.nome}`,
        subject: isScheda ? 'Scheda Socio - Centro Sportivo Orbassano' : `Ricevuta N° ${ricevutaData.nrRicevuta} - Centro Sportivo Orbassano`,
        pdfBase64: pdfBase64,
        fileName: fileName,
        isScheda: isScheda,
        ricevutaNumber: ricevutaData.nrRicevuta
      });

      if (response.success) {
        setSendSuccess(true);
        setTimeout(() => setSendSuccess(false), 5000); // Nascondi il messaggio dopo 5 secondi
      } else {
        throw new Error(response.message || 'Errore nell\'invio dell\'email');
      }
    } catch (err) {
      console.error('Errore nell\'invio della ricevuta:', err);
      setError('Si è verificato un errore nell\'invio della ricevuta via email.');
    } finally {
      setSending(false);
    }
  };

  // Genera HTML per il PDF (uguale al contenuto stampabile)
  const generatePrintableHTML = (data, isScheda) => {
    if (isScheda) {
      return generateSchedaHTML(data);
    } else {
      return generateRicevutaHTML(data);
    }
  };

  // Genera HTML per ricevuta
  const generateRicevutaHTML = (data) => {
    const isMinorPerson = isMinor(data.dataNascita || data.birhDate);
    
    return `
      <div style="font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; color: #000;">
        <!-- Header con logo e numero ricevuta -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
          <div style="flex: 1;">
            <img src="/headercsoric.jpg" style="max-width: 200px;" alt="Centro Sportivo Orbassano">
          </div>
          <div style="text-align: right; margin-top: 20px;">
            <div style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">
              N° ${data.nrRicevuta || '___'}
            </div>
            <div>
              Data ${formatDateDisplay(data.dataRicevuta) || '___________'}
            </div>
          </div>
        </div>

        <!-- Sottoscritto -->
        <div style="margin-bottom: 20px;">
          <div>
            Il Sottoscritto <span style="font-weight: bold;">PAOLO SOTTILE</span> nella qualità di Presidente Pro-tempore dell'ASD-APS Centro Sportivo Orbassano
          </div>
        </div>

        <!-- Dichiarazione principale -->
        <div style="margin-bottom: 30px;">
          <div style="text-align: center; margin: 20px 0;">
            <h3 style="font-weight: bold; text-decoration: underline; margin: 0;">
              DICHIARA DI AVER RICEVUTO
            </h3>
          </div>

          <div style="margin-bottom: 15px;">
            da ${data.socioCognome && data.socioNome&&!isMinorPerson ? 
              `${data.socioCognome} ${data.socioNome}` : 
              '.................................................................................'}
          </div>
          
          <!-- Sezione minore -->
          ${isMinorPerson ? `
            <div style="margin-bottom: 15px;">
              residente in ${data.citta || '...........................................................................'}
            </div>
            <div style="margin-bottom: 15px;">
              via ${data.indirizzo || '.................................................................................'}
            </div>
            <div style="margin-bottom: 20px;">
              C.Fisc. ${data.codiceFiscale || '................................................................'}
            </div>
            <div style="margin-bottom: 10px;">
              quale esercente la patria potestà del minore 
              <span style="font-weight: bold;">${data.socioCognome + ' ' + data.socioNome}</span>
            </div>
            <div style="margin-bottom: 20px;">
              nato a <span style="font-weight: bold;">${data.birthCity || 'TORINO'}</span> il 
              <span style="font-weight: bold;">${formatDateDisplay(data.dataNascita || data.birhDate) || '10/11/2015'}</span>
            </div>
          ` : ''}

          <!-- Importo -->
          <div style="margin-bottom: 15px; font-size: 14px;">
            la somma di <span style="font-weight: bold;">${data.importoRicevuta || '80'} €</span>
          </div>

          <!-- Dettagli quote -->
          ${data.tipoSocio === 1 ? `
          <div style="margin-bottom: 10px;">
            • per la quota associativa di fino al ${formatDateDisplay(data.scadenzaQuota) || '31/08/2025'}
          </div>` : ''}
          <div style="margin-bottom: 15px;">
            • per la quota di frequenza fino al ${formatDateDisplay(data.scadenzaPagamento) || '31/10/2024'}
          </div>

          <!-- Attività -->
          <div style="margin-bottom: 30px;">
            relativo alla pratica sportiva dilettantistica 
            <span style="font-weight: bold;">${data.attivitaNome || 'Attività Integrativa Ven Pavese'}</span>
          </div>
        </div>

        <!-- Note legali -->
        <div style="font-size: 9px; margin-bottom: 30px; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
          <p style="margin: 0;">
            Ai sensi dell'art. 15, c.1 lett=quinquies D.P.R. 917/1986, l'importo corrisposto beneficia della detrazione d'imposta IRPEF pari al 19% dell'importo pagato (calcolato su un massimo di Euro 210,00 per ciascuna persona che effettui il pagamento), come disposto dal c. 319 della L. 27/12/2006, N° 296 e relativo decreto di attuazione del 28/03/2007
          </p>
        </div>

        <!-- Firma -->
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
    `;
  };

  // Genera HTML per scheda
  const generateSchedaHTML = (data) => {
    return `
      <div style="font-family: Arial, sans-serif; color: #000;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1>SCHEDA SOCIO</h1>
        </div>
        
        <div style="margin-bottom: 20px; border: 1px solid #ddd; padding: 15px;">
          <h3 style="margin-top: 0; color: #333;">Dati Anagrafici</h3>
          <div style="display: flex; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 250px; margin-right: 20px;">
              <p><strong>Cognome:</strong> ${data.cognome}</p>
              <p><strong>Nome:</strong> ${data.nome}</p>
              <p><strong>Codice Fiscale:</strong> ${data.codeFiscale}</p>
              <p><strong>Data di nascita:</strong> ${formatDateDisplay(data.dataNascita || data.birhDate)}</p>
              <p><strong>Luogo di nascita:</strong> ${data.birthCity} (${data.birthProv})</p>
            </div>
            <div style="flex: 1; min-width: 250px;">
              <p><strong>Indirizzo:</strong> ${data.indirizzo}</p>
              <p><strong>Città:</strong> ${data.citta}</p>
              <p><strong>Cap:</strong> ${data.cap}</p>
              <p><strong>Provincia:</strong> ${data.provRes}</p>
              <p><strong>Telefono:</strong> ${data.tel || 'N/D'}</p>
              <p><strong>Email:</strong> ${data.email || 'N/D'}</p>
            </div>
          </div>
        </div>
        
        <div style="margin-bottom: 20px; border: 1px solid #ddd; padding: 15px;">
          <h3 style="margin-top: 0; color: #333;">Dati Abbonamento</h3>
          ${data.abbonamento ? `
            <div style="display: flex; flex-wrap: wrap;">
              <div style="flex: 1; min-width: 250px; margin-right: 20px;">
                <p><strong>Numero Tessera:</strong> ${data.abbonamento.numeroTessara}</p>
                <p><strong>Data Iscrizione:</strong> ${formatDateDisplay(data.abbonamento.incription)}</p>
              </div>
              <div style="flex: 1; min-width: 250px;">
                <p><strong>Abbonamento Firmato:</strong> ${data.abbonamento.firmato ? 'Sì' : 'No'}</p>
                <p><strong>Tipo Socio:</strong> ${data.tipo?.descrizione || 'N/D'}</p>
              </div>
            </div>
          ` : '<p>Nessun abbonamento attivo</p>'}
        </div>
        
        <div style="margin-bottom: 20px; border: 1px solid #ddd; padding: 15px;">
          <h3 style="margin-top: 0; color: #333;">Certificato Medico</h3>
          <div style="display: flex; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 250px; margin-right: 20px;">
              <p><strong>Scadenza:</strong> ${data.dateCertificat ? formatDateDisplay(data.dateCertificat) : 'N/D'}</p>
            </div>
            <div style="flex: 1; min-width: 250px;">
              <p><strong>Tipo:</strong> ${data.typeCertificat ? 'Agonistico' : 'Non agonistico'}</p>
            </div>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 50px; padding-top: 30px; border-top: 1px solid #ddd;">
          <p>Data e firma</p>
          <p style="margin-top: 30px;">_______________________</p>
        </div>
      </div>
    `;
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
            <Button 
              variant="success" 
              onClick={handleSend}
              disabled={sending || !ricevutaData.email}
            >
              {sending ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                  Invio...
                </>
              ) : (
                <>
                  <i className="bi bi-envelope me-1"></i> Invia PDF
                </>
              )}
            </Button>
          </div>
          
          {/* Messaggi di feedback */}
          {sendSuccess && (
            <div className="alert alert-success mt-2 mb-0" role="alert">
              <i className="bi bi-check-circle me-1"></i>
              {isScheda ? 'Scheda' : 'Ricevuta'} PDF inviata con successo a {ricevutaData.email}
            </div>
          )}
          {error && (
            <div className="alert alert-danger mt-2 mb-0" role="alert">
              <i className="bi bi-exclamation-triangle me-1"></i>
              {error}
            </div>
          )}
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
  // Funzione per calcolare se è minore
  const isMinor = (birthDate) => {
    if (!birthDate) return false;
    
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    // Se non ha ancora compiuto anni quest'anno
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return (age - 1) < 18;
    }
    
    return age < 18;
  };

  const isMinorPerson = isMinor(data.dataNascita || data.birhDate);

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
          da {data.socioCognome && data.socioNome&&!isMinorPerson ? 
            `${data.socioCognome} ${data.socioNome}` : 
            '.................................................................................'}
        </div>
        
        {/* Sezione minore - residente in, via, e patria potestà */}
        {isMinorPerson && (
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
                {data.socioCognome + ' ' + data.socioNome}
              </span>
            </div>
            <div style={{ marginBottom: '20px' }}>
              nato a <span style={{ fontWeight: 'bold' }}>{data.birthCity || 'TORINO'}</span> il{' '}
              <span style={{ fontWeight: 'bold' }}>{formatDateDisplay(data.dataNascita || data.birhDate) || '10/11/2015'}</span>
            </div>
          </>
        )}


        {/* Importo */}
        <div style={{ marginBottom: '15px', fontSize: '14px' }}>
          la somma di <span style={{ fontWeight: 'bold' }}>{data.importoRicevuta || '80'} €</span>
        </div>

        {/* Dettagli quote */}
        {data.tipoSocio===1&&
        <div style={{ marginBottom: '10px' }}>
          • per la quota associativa di
          fino al {formatDateDisplay(data.scadenzaQuota) || '31/08/2025'}
        </div>}
        
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
          <p><strong>Data di nascita:</strong> {formatDateDisplay(data.dataNascita || data.birhDate)}</p>
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