import React, { useState, useEffect } from 'react';
import { Container, Button } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import socioService from '../../api/services/socioService';
import ricevutaService from '../../api/services/ricevutaService';
import { formatDateDisplay } from '../../utils/dateUtils';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';

/**
 * Componente per la stampa della domanda associativa e del consenso privacy
 * Replica i documenti originali del Centro Sportivo Orbassano in 2 pagine
 */
const DomandaAssociativaPrint = () => {
  const [searchParams] = useSearchParams();
  
  const socioId = parseInt(searchParams.get('socioId') || '0');
  const ricevutaId = parseInt(searchParams.get('ricevutaId') || '0');
  
  // Stati per i dati
  const [socio, setSocio] = useState(null);
  const [ricevuta, setRicevuta] = useState(null);
  const [attivita, setAttivita] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

const calculateAge = (birthdate) => {
    if (!birthdate) return null;
    const today = new Date();
    const dob = new Date(birthdate);
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    return age;
};
  
  // Carica i dati all'avvio
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Carica dati del socio
        const socioResponse = await socioService.retrieveSocioById(socioId);
        setSocio(socioResponse.data.data);
 
        
        // Se c'è una ricevuta, caricala
        if (ricevutaId) {
          try {
            const ricevutaResponse = await ricevutaService.retrieveRicevutaForUser(socioId);
            const ricevute = ricevutaResponse.data?.data?.items || ricevutaResponse.data?.items || [];
            const ricevutaTrovata = ricevute.find(r => (r.idRicevuta || r.id) === ricevutaId);
            setRicevuta(ricevutaTrovata);
          } catch (ricevutaError) {
            console.warn('Errore nel caricamento della ricevuta:', ricevutaError);
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
    }
  }, [socioId, ricevutaId]);
  
  // Gestione della stampa
  const handlePrint = () => {
    window.print();
  };
  
  // Determina i tipi di socio selezionati
  const getTipoSocioCheckboxes = () => {
    return {
      effettivo: socio?.isEffettivo || false,
      tesserato: socio?.isTesserato || false,
      direttivo: false
    };
  };
  
  if (loading) {
    return <Loader />;
  }
  
  if (error) {
    return <Alert variant="danger" message={error} />;
  }
  
  if (!socio) {
    return <Alert variant="warning" message="Dati del socio non trovati." />;
  }
  
  return (
    <>
      {/* Barra degli strumenti (nascosta in stampa) */}
      <div className="no-print p-3 bg-light border-bottom">
        <Container>
          <Button variant="primary" onClick={handlePrint}>
            <i className="bi bi-printer me-1"></i> Stampa Domanda Associazione e Privacy
          </Button>
        </Container>
      </div>
      
      {/* Documenti da stampare */}
      <div className="print-container">
        {/* PAGINA 1: DOMANDA DI ASSOCIAZIONE */}
        <div className="print-page">
          {/* Header con loghi */}
          <div className="page-header">
            <img src='/headercso.jpg' width='100%'></img>
            <h2 className="document-title">DOMANDA DI ASSOCIAZIONE</h2>
          </div>
          
          {/* Dati anagrafici compilati automaticamente */}
          <div className="socio-data">
            <div className="field-row">
              <span>Il Sottoscritto:</span>
            </div>
            
            <div className="field-row">
              <span>Cognome: <strong>{socio.cognome || '______________________________'}</strong></span>
              <span className="ml-4">Nome: <strong>{socio.nome || '______________________________'}</strong></span>
            </div>
            
            <div className="field-row">
              <span>Nato il: <strong>{socio.dataNascita || socio.birhDate ? formatDateDisplay(socio.dataNascita || socio.birhDate) : '______________________________'}</strong></span>
              <span className="ml-4">a: <strong>{socio.comuneNascita || '______________________________'}</strong></span>
              <span className="ml-2">codice fiscale: <strong>{socio.codiceFiscale?.toUpperCase() || '______________________________'}</strong></span>
            </div>
            
            <div className="field-row">
              <span>Residente in: <strong>{(() => {
                const indirizzo = socio.viaResidenza || socio.indirizzo || '';
                const cap = socio.capResidenza || socio.cap || '';
                const comune = socio.comuneResidenza || '';
                const provincia = socio.provinciaResidenza || '';
                
                if (indirizzo || cap || comune || provincia) {
                  return `${indirizzo}${cap ? ', ' + cap : ''}${comune ? ' ' + comune : ''}${provincia ? ' (' + provincia + ')' : ''}`;
                }
                return '__________________________________________________________________';
              })()}</strong></span>
            </div>
            
            <div className="field-row">
              <span>Telefono: <strong>{socio.telefono || socio.tel || '______________________________'}</strong></span>
              <span className="ml-4">Mail: <strong>{socio.email || '______________________________'}</strong></span>
            </div>
          </div>
          
          {/* Richiesta di associazione */}
          <div className="association-request">
            <p>
              Fa domanda di associazione per l'anno sportivo <strong>2024/25</strong> al ASD-APS Centro Sportivo Orbassano in qualità di <strong>Socio Effettivo</strong>
            </p>
            
            <p className="statute-text">
              Presa visione dello STATUTO e del regolamento del ASD-APS Centro Sportivo Orbassano.
            </p>
          </div>
          
          {/* Data e Firma */}
          <div className="signature-section">
            <div className="signature-row">
              <span>Data: <strong>{formatDateDisplay(new Date())}</strong></span>
              <div className="signature-box">
                <span>Firma:</span>
                <div >______________________</div>
                <small>(Genitore in caso di minore)</small>
              </div>
            </div>
          </div>
          
          
          {/* Consenso informativa GDPR */}
          <div className="gdpr-consent">
            <label className="checkbox-label">
              <span className="checkbox"></span>
              Ricevuta l'informativa sull'utilizzazione dei miei dati, ai sensi dell'art. 13 del Regolamentno UE n 2016/679, consento, 
              ai sensi del Regolamentno UE n 2016/679 al loro trattamento nella misura necessaria per il perseguimento degli scopi 
              statutari.
            </label>
            
            <div className="signature-box-small">
              <span>Firma: ______________________</span>
            </div>
          </div>
          
          <h2 className="page2-title">CONSENSO AL TRATTAMENTO DEI DATI PERSONALI</h2>
          
            {/* Identificazione del soggetto */}
            <div className="subject-identification">
            <p>
                Io sottoscritto/a <em>(cognome-nome)</em>{" "}
                {calculateAge(socio.dataNascita) >= 18 && <strong>{socio.cognome} {socio.nome}</strong>}
            </p>

            <div className="subject-checkboxes">
                <label className="checkbox-label">
                <span className={`checkbox ${calculateAge(socio.dataNascita) >= 18 ? "checked" : ""}`}></span>
                per me stesso
                </label>
                <label className="checkbox-label">
                <span className={`checkbox ${calculateAge(socio.dataNascita) < 18 ? "checked" : ""}`}></span>
                titolare della potestà genitoriale/ tutore legale del minore <em>(cognome-nome)</em>
                </label>
            </div>

            <div className="minor-name-line">
                {calculateAge(socio.dataNascita) < 18 
                ? "__________________________________________________________________________________" 
                : ""}
            </div>
            </div>

          
          {/* Dichiarazione principale */}
          <div className="main-declaration">
            <p>
              <strong>dichiaro di aver preso visione dell'Informativa del CENTRO SPORTIVO ORBASSANO e di averne ricevuto copia.</strong>
            </p>
            
            <p>
              In particolare, in relazione al trattamento dei <strong>dati personali di natura sia comune che identificativa e non pubblica</strong> 
              (es. dati anagrafici, n. di cellulare, dati fiscali, certificati di idoneità sportiva), della cessione dei dati stessi a terzi, 
              al fine esclusivo dell'adempimento della gestione amministrativa e contabile, sono stato informato dal Titolare del trattamento, 
              che la raccolta dei dati sopracitati è <strong>necessaria per la finalità di assolvere al presente contratto.</strong>
            </p>
            
            <div className="important-notice">
              <strong>IN CASO NON FORNISSI IL CONSENSO AL TRATTAMENTO NON POTRÀ ESSERE ACCETTATA L'ISCRIZIONE.</strong>
            </div>
            
            {/* Consenso obbligatorio */}
            <div className="consent-section">
              <label className="checkbox-label">
                <span className="checkbox"></span>
                do il consenso
              </label>
              <label className="checkbox-label">
                <span className="checkbox"></span>
                nego il consenso
              </label>
            </div>
            
            {/* Consenso marketing */}
            <p>in relazione al trattamento dei <strong>dati personali</strong> di natura sia comune che identificativa per finalità di 
            <strong>marketing</strong> come l'invio di materiale e informazioni commerciali o comunicazioni relative a iniziative promozionali,</p>
            
            <div className="consent-section">
              <label className="checkbox-label">
                <span className="checkbox"></span>
                do il consenso
              </label>
              <label className="checkbox-label">
                <span className="checkbox"></span>
                nego il consenso
              </label>
            </div>
          </div>
          
          {/* Sezione foto/video compatta */}
          <div className="photo-consent-section">
            <p>inoltre, affinché il <strong>CENTRO SPORTIVO ORBASSANO:</strong></p>
            
            <ul className="photo-permissions-compact">
              <li>possa effettuare fotografie e riprese audio/video, in qualsiasi formato, che ritraggono la mia persona o quella del minore;</li>
              <li>che le riprese audio, video e fotografiche vengano utilizzate dal CENTRO SPORTIVO ORBASSANO per la pubblicazione all'interno del sito internet societario o di altri siti ad esso riconducibili o nei Social Network;</li>
              <li>che le immagini fotografiche e riprese audio/video vengano utilizzate dal CENTRO SPORTIVO ORBASSANO per fini promo-pubblicitari e orientativi (volantini, articoli su giornali e riviste, ecc.);</li>
              <li>che le immagini fotografiche e le riprese audio/video siano oggetto di eventuali modifiche e variazioni; che vengano utilizzate singolarmente e/o abbinandole con altre immagini;</li>
              <li>possa utilizzare e diffondere le immagini contenute nelle fotografie e riprese audio/video a fini di cui sopra;</li>
              <li>la cessione e l'utilizzo delle immagini fotografiche e riprese audio/video siano da considerarsi effettuate in forma completamente gratuita.</li>
            </ul>
            
            {/* Consenso foto/video */}
            <div className="consent-section">
              <label className="checkbox-label">
                <span className="checkbox"></span>
                do il consenso
              </label>
              <label className="checkbox-label">
                <span className="checkbox"></span>
                nego il consenso
              </label>
            </div>
            
            {/* Firma finale */}
            <div className="final-signature">
              <div class="signature-row">
                <span>Orbassano, ______________________</span>
                <span>Firma _________________________</span>
              </div>
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
          padding: 12mm 15mm;
          min-height: 277mm;
          box-sizing: border-box;
          page-break-after: always;
          font-family: Arial, sans-serif;
          font-size: 11px;
          line-height: 1.3;
        }
        
        .print-page:last-child {
          page-break-after: auto;
        }
        
        /* PAGINA 1 - Domanda di Associazione */
        .page-header {
          text-align: center;
          margin-bottom: 20px;
        }
        
        .header-logos {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .logo-left, .logo-right {
          font-size: 20px;
          width: 50px;
        }
        
        .header-center {
          flex-grow: 1;
          text-align: center;
        }
        
        .club-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 3px;
        }
        
        .club-title {
          font-size: 14px;
          font-weight: bold;
        }
        
        .document-title {
          font-size: 14px;
          font-weight: bold;
          margin: 15px 0;
          text-decoration: underline;
        }
        
        .tessera-number {
          text-align: right;
          font-weight: bold;
          margin-top: -30px;
          font-size: 10px;
        }
        
        .socio-data {
          margin: 20px 0;
        }
        
        .field-row {
          margin: 8px 0;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          font-size: 10px;
        }
        
        .ml-2 { margin-left: 8px; }
        .ml-4 { margin-left: 15px; }
        
        .association-request {
          margin: 15px 0;
          font-size: 10px;
        }
        
        .socio-type-checkboxes {
          margin: 10px 0;
          display: flex;
          gap: 12px;
        }
        
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
        }
        
        .checkbox {
          width: 10px;
          height: 10px;
          border: 1px solid #000;
          display: inline-block;
          position: relative;
          background: white;
        }
        
        .checkbox.checked::after {
          content: "✓";
          position: absolute;
          left: 1px;
          top: -2px;
          font-size: 8px;
          font-weight: bold;
        }
        
        .statute-text {
          margin: 12px 0;
          text-align: justify;
          font-size: 10px;
        }
        
        .underline {
          border-bottom: 1px solid #000;
          padding-bottom: 1px;
        }
        
        .signature-section {
          margin: 20px 0;
        }
        
        .signature-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10px;
        }
        
        .signature-box {
          text-align: center;
        }
        
        .signature-line {
          border-bottom: 1px solid #000;
          width: 150px;
          height: 15px;
          margin: 8px 0 3px 0;
        }
        
        .signature-box small {
          font-size: 8px;
        }
        
        .activity-section {
          margin: 20px 0;
          border: 1px solid #000;
          padding: 8px;
        }
        
        .activity-section h3 {
          text-align: center;
          font-size: 12px;
          margin-bottom: 10px;
        }
        
        .activity-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
        }
        
        .activity-table th,
        .activity-table td {
          border: 1px solid #000;
          padding: 6px;
          text-align: center;
        }
        
        .activity-table th {
          background-color: #f0f0f0;
          font-weight: bold;
        }
        
        .gdpr-consent {
          margin-top: 15px;
        }
        
        .signature-box-small {
          margin-top: 10px;
          text-align: center;
          font-size: 10px;
        }
        
        /* PAGINA 2 - Consenso Privacy + Foto */
        .page2-header {
          margin-bottom: 15px;
        }
        
        .header-table {
          display: flex;
          border: 2px solid #0066cc;
          height: 50px;
        }
        
        .header-cell {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3px;
          text-align: center;
          font-size: 9px;
        }
        
        .logo-cell {
          flex: 1;
          background-color: #f0f8ff;
          font-weight: bold;
          border-right: 2px solid #0066cc;
        }
        
        .title-cell {
          flex: 1;
          font-size: 12px;
          font-weight: bold;
          border-right: 2px solid #0066cc;
        }
        
        .version-cell {
          flex: 1;
          font-size: 8px;
        }
        
        .page2-title {
          text-align: center;
          font-size: 14px;
          font-weight: bold;
          margin: 15px 0;
        }
        
        .subject-identification {
          margin: 15px 0;
          font-size: 10px;
        }
        
        .subject-checkboxes {
          margin: 8px 0;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        
        .minor-name-line {
          margin: 8px 0;
          font-size: 10px;
        }
        
        .main-declaration {
          margin: 15px 0;
          text-align: justify;
          font-size: 9px;
        }
        
        .main-declaration p {
          margin: 8px 0;
        }
        
        .important-notice {
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          padding: 6px;
          margin: 10px 0;
          font-size: 9px;
          text-align: center;
        }
        
        .consent-section {
          display: flex;
          gap: 15px;
          margin: 10px 0;
          font-size: 9px;
        }
        
        .photo-consent-section {
          margin-top: 15px;
          font-size: 9px;
        }
        
        .photo-permissions-compact {
          margin: 10px 0;
          padding-left: 15px;
        }
        
        .photo-permissions-compact li {
          margin: 4px 0;
          text-align: justify;
          line-height: 1.2;
        }
        
        .final-signature {
          margin-top: 20px;
          font-size: 10px;
        }
        
        .final-signature .signature-row {
          display: flex;
          justify-content: space-between;
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
          
          .no-print {
            display: none !important;
          }
          
          .print-container {
            max-width: none !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
          
          .print-page {
            padding: 8mm 12mm !important;
            margin: 0 !important;
            min-height: auto !important;
            page-break-after: always;
          }
          
          .print-page:last-child {
            page-break-after: auto;
          }
          
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </>
  );
};

export default DomandaAssociativaPrint;