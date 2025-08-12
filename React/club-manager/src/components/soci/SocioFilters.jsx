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
    scadenza: initialFilters.scadenza || 0,
    attivita: initialFilters.attivita || 0,
    scadute: initialFilters.scadute || false,
    anno: initialFilters.anno || 0,
    ...initialFilters
  });

  // Stati per loading e errori
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);

  // Stato per i dati delle select
  const [famiglie, setFamiglie] = useState([]);
  const [attivita, setAttivita] = useState([]);
  const [anni, setAnni] = useState([]);
  
  // Opzioni fisse per scadenza
  const [scadenzaOptions] = useState([
    { code: 0, name: 'Tutte' },
    { code: 1, name: 'Scadute' },
    { code: 2, name: 'In scadenza' },
  ]);

  // Stato per le selezioni
  const [selectedFamiglia, setSelectedFamiglia] = useState(null);
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
        
        // Carica famiglie con fallback
        let famiglieData = [];
        try {
          const famiglieResponse = await activityService.retrieveFamilies();
          console.log('Famiglie response:', famiglieResponse);
          famiglieData = famiglieResponse.data || [];
          setFamiglie(famiglieData);
        } catch (err) {
          console.warn('Failed to load families, using fallback:', err);
          // Fallback famiglie
          famiglieData = [
            { id: 1, name: 'Arti Marziali' },
            { id: 2, name: 'Sport Acquatici' },
            { id: 3, name: 'Sport di Squadra' },
            { id: 4, name: 'Ginnastica e Fitness' },
            { id: 5, name: 'Sport Individuali' },
            { id: 6, name: 'Attività Ricreative' }
          ];
          setFamiglie(famiglieData);
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
        console.log('Famiglie:', famiglieData);
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

  // Gestione cambio famiglia
  const handleFamigliaChange = async (name, selectedValue) => {
    console.log('Famiglia selected:', selectedValue);
    setSelectedFamiglia(selectedValue.value);
    setSelectedAttivita(null);
    setAttivita([]);
    setFilters(prev => ({ 
      ...prev, 
      attivita: 0,
      famiglia: selectedValue.value.id,
      attivitaDescriptionSelected: null
    }));
    
    // Carica attività per la famiglia selezionata
    try {
      const response = await activityService.retrieveActivitiesByFamily(selectedValue.value.value);
      console.log('Attivita loaded for family:', response);
      setAttivita(response.data || []);
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
      attivita: selectedValue.value.id,
      attivitaDescriptionSelected: selectedValue.value.description
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
              <SelectField
                label="Scadenza"
                name="scadenza"
                value={selectedScadenza}
                options={scadenzaOptions}
                onChange={handleScadenzaChange}
              />
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <SelectField
                label="Famiglia"
                name="famiglia"
                value={selectedFamiglia}
                options={famiglie}
                onChange={handleFamigliaChange}
                placeholder="Seleziona famiglia di attività"
              />
            </Col>
            <Col md={6}>
              <SelectField
                label="Attività"
                name="attivita"
                value={selectedAttivita}
                options={attivita}
                onChange={handleAttivitaChange}
                isDisabled={!selectedFamiglia}
                placeholder={!selectedFamiglia ? "Prima seleziona una famiglia" : "Seleziona attività"}
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
                label="Includi abbonamenti scaduti"
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