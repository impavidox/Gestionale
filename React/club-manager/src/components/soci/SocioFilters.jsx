import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import SelectField from '../forms/SelectField';
import TextField from '../forms/TextField';
import CheckboxField from '../forms/CheckboxField';
import activityService from '../../api/services/activityService';
import parametriService from '../../api/services/parametriService';

/**
 * Componente per i filtri di ricerca dei soci - Fixed Version
 * @param {Object} initialFilters - Filtri iniziali
 * @param {Function} onSearch - Callback da eseguire quando si avvia la ricerca
 * @param {Function} onPrint - Callback da eseguire quando si vuole stampare la ricerca
 * @param {Function} onEmail - Callback da eseguire quando si vuole inviare email alla ricerca
 */
const SocioFilters = ({ 
  initialFilters = {}, 
  onSearch, 
  onPrint, 
  onEmail 
}) => {
  // Stato per i filtri
  const [filters, setFilters] = useState({
    cognome: initialFilters.cognome || '',
    scadenza: initialFilters.scadenza ? 1 : 0,   // 👈 forzato a 0/1
    attivita: initialFilters.attivita || 0,
    scadute: initialFilters.scadute ? 1 : 0,     // 👈 forzato a 0/1
    anno: initialFilters.anno || 0,
    sezione: initialFilters.sezione || 0,
    ...initialFilters
  });

  // Stati per loading e errori
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);

  // Stato per i dati delle select
  const [sezioni, setSezioni] = useState([]);
  const [attivita, setAttivita] = useState([]);
  const [anni, setAnni] = useState([]);
  
  // Opzioni fisse per scadenza
  const [scadenzaOptions] = useState([
    { code: 0, name: 'Tutte' },
    { code: 1, name: 'Scadute' },
    { code: 2, name: 'In scadenza' },
  ]);

  // Stato per le selezioni
  const [selectedSezione, setSelectedSezione] = useState(null);
  const [selectedAttivita, setSelectedAttivita] = useState(null);
  const [selectedAnno, setSelectedAnno] = useState(null);
  const [selectedScadenza, setSelectedScadenza] = useState(scadenzaOptions[0]);


  // Caricamento iniziale dei dati
  useEffect(() => {
    const fetchFilterData = async () => {
      setLoading(true);
      setError('');
      setShowError(false);
      
      try {
        console.log('SocioFilters - Loading filter data...');
        
        // Carica sezioni con fallback
        let sezioniData = [];
        try {
          const sezioneResponse = await activityService.retrieveSezioni();
          console.log('Sezioni response:', sezioneResponse);
          sezioniData = sezioneResponse.data.data || [];
          setSezioni(sezioniData);
        } catch (err) {
          console.warn('Failed to load sezioni, using fallback:', err);
          // Fallback sezioni
          sezioniData = [
            { id: 1, name: 'Sport' },
            { id: 2, name: 'Giovani' },
            { id: 3, name: 'Anziani' },
            { id: 4, name: 'Ricreativa' },
          ];
          setSezioni(sezioniData);
        }
        
        // Carica anni con fallback
        let anniData = [];
        try {
          const anniResponse = await parametriService.retrieveAnnoSportiva();
          console.log('Anno sportivo response:', anniResponse);
          if (anniResponse.data) {
            anniData = [anniResponse.data];
            setAnni(anniData);
            setSelectedAnno(anniResponse.data);
            setFilters(prev => ({ ...prev, anno: anniResponse.data.id }));
          }
        } catch (err) {
          console.warn('Failed to load anno sportivo, using fallback:', err);
          // Fallback anno
          const currentYear = new Date().getFullYear();
          anniData = [{ 
            id: 1, 
            annoName: `${currentYear}/${currentYear + 1}`,
            name: `${currentYear}/${currentYear + 1}`
          }];
          setAnni(anniData);
          setSelectedAnno(anniData[0]);
          setFilters(prev => ({ ...prev, anno: anniData[0].id }));
        }
        
        console.log('SocioFilters - Data loaded successfully');
        console.log('sezioni:', sezioniData);
        console.log('Anni:', anniData);
        
      } catch (error) {
        console.error('Errore nel caricamento dei dati di filtro:', error);
        setError('Errore nel caricamento dei filtri. Alcune funzionalità potrebbero non essere disponibili.');
        setShowError(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFilterData();
  }, []);

  // Gestione cambio Sezione
  const handleSezioneChange = async (name, selectedValue) => {
    console.log('Sezione selected:', selectedValue);
    let idSezione=sezioni.find(item=>item.nome===selectedValue.value.value).id
    setSelectedSezione(selectedValue.value);
    setSelectedAttivita(null);
    setAttivita([]);

    setFilters(prev => ({
      ...prev,
      sezione: idSezione,
      attivita: 0
    }));
    
    // Carica attività per la Sezione selezionata
    try {
      const response = await activityService.retrieveActivitiesBySezione(idSezione);
      console.log('Attivita loaded for sezione:', response);
      setAttivita(response.data.data || []);
    } catch (error) {
      console.error('Errore nel caricamento delle attività:', error);
      // Fallback attività
      const fallbackAttivita = [
        { id: 1, description: 'Attività Generica 1' },
        { id: 2, description: 'Attività Generica 2' }
      ];
      setAttivita(fallbackAttivita);
    }
  };

  // Gestione cambio attività
  const handleAttivitaChange = (name, selectedValue) => {
    console.log('Attivita selected:', selectedValue);
    setSelectedAttivita(selectedValue.value);
    setFilters(prev => ({ 
      ...prev, 
      attivita: attivita.find(item=>item.nome===selectedValue.value.value).id,
    }));
  };

  // Gestione cambio anno
  const handleAnnoChange = (name, selectedValue) => {
    console.log('Anno selected:', selectedValue);
    setSelectedAnno(selectedValue.value);
    setFilters(prev => ({ ...prev, anno: selectedValue.value.id }));
  };

  // Gestione cambio scadenza
  const handleScadenzaChange = (name, selectedValue) => {
    console.log('Scadenza selected:', selectedValue);
    setSelectedScadenza(selectedValue.value);
    setFilters(prev => ({ ...prev, scadenza: selectedValue.value.code }));
  };

  // Gestione cambio input generico
  const handleInputChange = (name, value) => {
    console.log(`Input changed - ${name}:`, value);
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Gestione ricerca
  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Search triggered with filters:', filters);
    
    if (!onSearch) {
      console.error('onSearch callback not provided!');
      setError('Errore: callback di ricerca non definito');
      setShowError(true);
      return;
    }

    // Validazione base
    if (!filters.cognome && filters.attivita === 0 && filters.scadenza === 0) {
      console.log('Performing search with empty filters (will return all members)');
    }

    try {
      onSearch(filters);
    } catch (error) {
      console.error('Error in search callback:', error);
      setError('Errore durante la ricerca');
      setShowError(true);
    }
  };

  // Gestione stampa
  const handlePrint = () => {
    console.log('Print triggered with filters:', filters);
    if (onPrint) {
      onPrint(filters);
    } else {
      console.warn('onPrint callback not provided');
    }
  };

  // Gestione email
  const handleEmail = () => {
    console.log('Email triggered with filters:', filters);
    if (onEmail) {
      onEmail(filters);
    } else {
      console.warn('onEmail callback not provided');
    }
  };

  return (
    <Card>
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <span>Filtri di ricerca</span>
          {loading && <small className="text-muted">Caricamento...</small>}
        </div>
      </Card.Header>
      <Card.Body>
        {showError && (
          <Alert variant="warning" onClose={() => setShowError(false)} dismissible>
            {error}
          </Alert>
        )}

        <Form onSubmit={handleSearch}>
          <Row>
            <Col md={6}>
              <TextField
                label="Cognome"
                name="cognome"
                value={filters.cognome}
                onChange={handleInputChange}
                placeholder="Cerca per cognome (es: Rossi)"
              />
            </Col>
            <Col md={6}>
              <CheckboxField
                label="Certificati medici scaduti"
                name="scadenza"
                checked={filters.scadenza}
                onChange={handleInputChange}
              />
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <SelectField
                label="Sezione"
                name="sezione"
                value={selectedSezione}
                options={sezioni.map(item=>item.nome)}
                onChange={handleSezioneChange}
                placeholder="Seleziona sezione dell' attività"
              />
            </Col>
            <Col md={6}>
              <SelectField
                label="Attività"
                name="attivita"
                value={selectedAttivita}
                options={attivita.map(item=>item.nome)}
                onChange={handleAttivitaChange}
                isDisabled={!selectedSezione}
                placeholder={!selectedSezione ? "Prima seleziona una sezione" : "Seleziona attività"}
              />
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <SelectField
                label="Anno Sportivo"
                name="anno"
                value={selectedAnno}
                options={anni}
                onChange={handleAnnoChange}
                placeholder="Anno sportivo"
              />
            </Col>
            <Col md={6}>
              <CheckboxField
                label="Mostra abbonamenti scaduti"
                name="scadute"
                checked={filters.scadute}
                onChange={handleInputChange}
              />
            </Col>
          </Row>
          
          <div className="d-flex justify-content-between mt-4">
            <div>
              <Button 
                variant="primary" 
                type="submit"
                disabled={loading}
              >
                {loading ? 'Caricamento...' : 'Cerca'}
              </Button>
            </div>
            <div>
              <Button 
                variant="info" 
                className="me-2" 
                onClick={handlePrint}
                disabled={loading}
              >
                Stampa
              </Button>
              <Button 
                variant="success" 
                onClick={handleEmail}
                disabled={loading}
              >
                Email
              </Button>
            </div>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default SocioFilters;