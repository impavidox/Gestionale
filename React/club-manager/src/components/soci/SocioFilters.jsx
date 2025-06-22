import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col } from 'react-bootstrap';
import SelectField from '../forms/SelectField';
import TextField from '../forms/TextField';
import CheckboxField from '../forms/CheckboxField';
import activityService from '../../api/services/activityService';
import parametriService from '../../api/services/parametriService';

/**
 * Componente per i filtri di ricerca dei soci
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

  // Stato per i dati delle select
  const [famiglie, setFamiglie] = useState([]);
  const [attivita, setAttivita] = useState([]);
  const [anni, setAnni] = useState([]);
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
      try {
        // Carica famiglie
        const famiglieResponse = await activityService.retrieveFamilies();
        setFamiglie(famiglieResponse.data);
        
        // Carica anni
        const anniResponse = await parametriService.retrieveParameters();
        setAnni(anniResponse.data);
        
        // Imposta l'anno corrente
        const annoCorrente = anniResponse.data.find(anno => anno.status === 1);
        if (annoCorrente) {
          setSelectedAnno(annoCorrente);
          setFilters(prev => ({ ...prev, anno: annoCorrente.id }));
        }
        
        // Se c'è un'attività iniziale e famiglie caricate, carica le attività
        if (initialFilters.attivita && initialFilters.famiglia && famiglieResponse.data.length > 0) {
          const famigliaFound = famiglieResponse.data.find(f => f.id === initialFilters.famiglia);
          if (famigliaFound) {
            setSelectedFamiglia(famigliaFound);
            const attivitaResponse = await activityService.retrieveActivitiesByFamily(famigliaFound.id);
            setAttivita(attivitaResponse.data);
            
            // Trova l'attività selezionata
            const attivitaFound = attivitaResponse.data.find(a => a.id === initialFilters.attivita);
            if (attivitaFound) {
              setSelectedAttivita(attivitaFound);
            }
          }
        }
        
        // Se c'è una scadenza iniziale, selezionala
        if (initialFilters.scadenza !== undefined) {
          const scadenzaFound = scadenzaOptions.find(s => s.code === initialFilters.scadenza);
          if (scadenzaFound) {
            setSelectedScadenza(scadenzaFound);
          }
        }
      } catch (error) {
        console.error('Errore nel caricamento dei dati di filtro:', error);
      }
    };
    
    fetchFilterData();
  }, [initialFilters]);

  // Gestione cambio famiglia
  const handleFamigliaChange = async (name, selectedValue) => {
    setSelectedFamiglia(selectedValue.value);
    setSelectedAttivita(null);
    console.log(selectedValue)
    setFilters(prev => ({ ...prev, attivita: 0, famiglia: selectedValue.value.id }));
    
    try {
      const response = await activityService.retrieveActivitiesByFamily(selectedValue.value.value);
      setAttivita(response.data);
    } catch (error) {
      console.error('Errore nel caricamento delle attività:', error);
    }
  };

  // Gestione cambio attività
  const handleAttivitaChange = (name, selectedValue) => {
    setSelectedAttivita(selectedValue.value);
    setFilters(prev => ({ 
      ...prev, 
      attivita: selectedValue.value.id,
      attivitaDescriptionSelected: selectedValue.value.description
    }));
  };

  // Gestione cambio anno
  const handleAnnoChange = (name, selectedValue) => {
    setSelectedAnno(selectedValue.value);
    setFilters(prev => ({ ...prev, anno: selectedValue.value.id }));
  };

  // Gestione cambio scadenza
  const handleScadenzaChange = (name, selectedValue) => {
    setSelectedScadenza(selectedValue.value);
    setFilters(prev => ({ ...prev, scadenza: selectedValue.value.code }));
  };

  // Gestione cambio input generico
  const handleInputChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Gestione ricerca
  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(filters);
    }
  };

  // Gestione stampa
  const handlePrint = () => {
    if (onPrint) {
      onPrint(filters);
    }
  };

  // Gestione email
  const handleEmail = () => {
    if (onEmail) {
      onEmail(filters);
    }
  };

  return (
    <Card>
      <Card.Header>Filtri di ricerca</Card.Header>
      <Card.Body>
        <Form onSubmit={handleSearch}>
          <Row>
            <Col md={6}>
              <TextField
                label="Cognome"
                name="cognome"
                value={filters.cognome}
                onChange={handleInputChange}
                placeholder="Cerca per cognome"
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
              />
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <SelectField
                label="Anno"
                name="anno"
                value={selectedAnno}
                options={anni}
                onChange={handleAnnoChange}
              />
            </Col>
            <Col md={6}>
              <CheckboxField
                label="Includi scadute"
                name="scadute"
                checked={filters.scadute}
                onChange={handleInputChange}
              />
            </Col>
          </Row>
          <div className="d-flex justify-content-between mt-3">
            <div>
              <Button variant="primary" type="submit">
                Cerca
              </Button>
            </div>
            <div>
              <Button variant="info" className="me-2" onClick={handlePrint}>
                Stampa
              </Button>
              <Button variant="success" onClick={handleEmail}>
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