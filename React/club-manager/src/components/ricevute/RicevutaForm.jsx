import React, { useState, useEffect } from 'react';
import { Card, Form, Row, Col, Button, Alert } from 'react-bootstrap';
import DateField from '../forms/DateField';
import SelectField from '../forms/SelectField';
import TextField from '../forms/TextField';
import CheckboxField from '../forms/CheckboxField';
import { useApp } from '../../context/AppContext';
import ricevutaService from '../../api/services/ricevutaService';
import activityService from '../../api/services/activityService';
import { formatDateForApi } from '../../utils/dateUtils';

/**
 * Componente per la creazione e modifica di ricevute
 * 
 * @param {Object} props - Props del componente
 * @param {number} props.idSocio - ID del socio
 * @param {number} props.reprint - Tipo di operazione (0=nuova, 1=ristampa, 2=modifica)
 * @param {number} props.idAbbo - ID dell'abbonamento
 * @param {number} props.idRicevuta - ID della ricevuta
 * @param {Function} props.onSuccess - Callback da chiamare dopo il salvataggio con successo
 * @param {Function} props.onCancel - Callback da chiamare quando si annulla l'operazione
 */
const RicevutaForm = ({ 
  idSocio, 
  reprint = 0, 
  idAbbo = 0, 
  idRicevuta = 0, 
  onSuccess, 
  onCancel 
}) => {
  const { selActiv, selAffiliazione } = useApp();
  
  // Stati per i dati
  const [socioRicevuta, setSocioRicevuta] = useState(null);
  const [dataRicevuta, setDataRicevuta] = useState(new Date());
  const [dataQuota, setDataQuota] = useState(new Date());
  const [periodo, setPeriodo] = useState('');
  const [nFattura, setNFattura] = useState('N.D.');
  const [sommaPay, setSommaPay] = useState(0);
  const [sommaIncassata, setSommaIncassata] = useState(0);
  const [attivitaDesc, setAttivitaDesc] = useState('');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedAffilia, setSelectedAffilia] = useState(null);
  const [editRicevuta, setEditRicevuta] = useState(true);
  const [registrato, setRegistrato] = useState(false);
  const [quotaAssociativa, setQuotaAssociativa] = useState(false);
  
  // Stati per errori e loading
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  
  // Carica i dati all'avvio
  useEffect(() => {
    const fetchRicevutaData = async () => {
      setLoading(true);
      setError('');
      
      try {
        if (idSocio) {
          let response;
          
          // Nuova ricevuta
          if (reprint === 0) {
            response = await ricevutaService.createNewRicevuta(idSocio);
            
            setSocioRicevuta(response.data);
            setDataRicevuta(new Date(response.data.dataRicevuta));
            setDataQuota(new Date(response.data.dataQuota));
            setPeriodo(response.data.dataPeriodo);
            setEditRicevuta(true);
          } 
          // Ristampa
          else if (reprint === 1) {
            response = await ricevutaService.buildRicevuta(idSocio, idAbbo, idRicevuta);
            
            setSocioRicevuta(response.data);
            setNFattura(response.data.nFattura);
            setDataQuota(new Date(response.data.dataQuota));
            setPeriodo(response.data.dataPeriodo);
            setSommaPay(response.data.pagato);
            setSommaIncassata(response.data.incassato);
            setAttivitaDesc(response.data.attivitaDesc);
            setEditRicevuta(false);
          } 
          // Modifica
          else if (reprint === 2) {
            response = await ricevutaService.buildRicevuta(idSocio, idAbbo, idRicevuta);
            
            setSocioRicevuta(response.data);
            setDataRicevuta(new Date(response.data.dataRicevuta));
            setNFattura(response.data.nFattura);
            setDataQuota(new Date(response.data.dataQuota));
            setPeriodo(response.data.dataPeriodo);
            setSommaPay(response.data.pagato);
            setSommaIncassata(response.data.incassato);
            setAttivitaDesc(response.data.attivitaDesc);
            setRegistrato(response.data.tipoRicevuta);
            setQuotaAssociativa(response.data.payQuota);
            
            // Cerca l'attività corrispondente
            if (selActiv) {
              const foundActivity = selActiv.find(y => 
                y.description.trim() === response.data.attivitaDesc.trim()
              );
              
              if (foundActivity) {
                setSelectedActivity(foundActivity);
              }
            }
            
            // Cerca l'affiliazione corrispondente
            if (selAffiliazione) {
              const foundAffilia = selAffiliazione.find(y => 
                y.descrizione.trim() === response.data.affiliazioneDesc.trim()
              );
              
              if (foundAffilia) {
                setSelectedAffilia(foundAffilia);
              }
            }
            
            setEditRicevuta(true);
          }
        }
      } catch (err) {
        console.error('Errore nel caricamento dei dati della ricevuta:', err);
        setError('Si è verificato un errore nel caricamento dei dati della ricevuta.');
        setShowError(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRicevutaData();
  }, [idSocio, reprint, idAbbo, idRicevuta, selActiv, selAffiliazione]);
  
  // Gestione selezione attività
  const handleActivityChange = (name, selectedValue) => {
    setSelectedActivity(selectedValue.value);
  };
  
  // Gestione selezione affiliazione
  const handleAffiliationChange = (name, selectedValue) => {
    setSelectedAffilia(selectedValue.value);
  };
  
  // Validazione dei dati
  const controlSave = () => {
    if (!selectedActivity) return false;
    if (!selectedAffilia) return false;
    if (!sommaPay) return false;
    return true;
  };
  
  // Creazione di una nuova ricevuta
  const createRicevuta = async () => {
    if (!controlSave()) {
      setError('Tutti i parametri non sono stati compilati');
      setShowError(true);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const body = {
        tipo: 0,
        dataRicevuta: formatDateForApi(dataRicevuta),
        idSocio: socioRicevuta.idSocio,
        periodo: periodo,
        dataQuota: formatDateForApi(dataQuota),
        sommaPay: sommaPay,
        sommaIncassata: sommaIncassata,
        registrato: registrato === undefined ? false : registrato,
        quotaAssociativa: quotaAssociativa === undefined ? false : quotaAssociativa,
        attivita: selectedActivity.id,
        affiliazione: selectedAffilia.id,
      };
      
      const response = await ricevutaService.printNewRicevuta(body);
      
      if (!response.data.testPrint) {
        setError(response.data.messageError);
        setShowError(true);
      } else {
        setNFattura(response.data.nFattura);
        setDataQuota(new Date(response.data.dataQuota));
        setPeriodo(response.data.dataPeriodo);
        setAttivitaDesc(response.data.attivitaDesc);
        setSommaPay(response.data.pagato);
        setEditRicevuta(false);
        
        if (onSuccess) {
          onSuccess(response.data);
        }
      }
    } catch (err) {
      console.error('Errore nella creazione della ricevuta:', err);
      setError('Si è verificato un errore nella creazione della ricevuta.');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };
  
  // Aggiornamento di una ricevuta esistente
  const updateRicevuta = async () => {
    if (!controlSave()) {
      setError('Tutti i parametri non sono stati compilati');
      setShowError(true);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const body = {
        tipo: 1,
        dataRicevuta: formatDateForApi(dataRicevuta),
        idSocio: socioRicevuta.idSocio,
        idRicevuta: socioRicevuta.idRicevuta,
        idAbbonamento: idAbbo,
        periodo: periodo,
        dataQuota: formatDateForApi(dataQuota),
        sommaPay: sommaPay,
        sommaIncassata: sommaIncassata,
        registrato: registrato === undefined ? false : registrato,
        quotaAssociativa: quotaAssociativa === undefined ? false : quotaAssociativa,
        attivita: selectedActivity.id,
        affiliazione: selectedAffilia.id,
      };
      
      const response = await ricevutaService.printNewRicevuta(body);
      
      if (!response.data.testPrint) {
        setError(response.data.messageError);
        setShowError(true);
      } else {
        setSocioRicevuta(prev => ({
          ...prev,
          dataRicevuta: dataRicevuta
        }));
        setNFattura(response.data.nFattura);
        setDataQuota(new Date(response.data.dataQuota));
        setPeriodo(response.data.dataPeriodo);
        setAttivitaDesc(response.data.attivitaDesc);
        setSommaPay(response.data.pagato);
        setEditRicevuta(false);
        
        if (onSuccess) {
          onSuccess(response.data);
        }
      }
    } catch (err) {
      console.error('Errore nell\'aggiornamento della ricevuta:', err);
      setError('Si è verificato un errore nell\'aggiornamento della ricevuta.');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };
  
  // Gestione dell'invio del form
  const handleSubmit = (e) => {
    e.preventDefault();
    if (reprint === 0) createRicevuta();
    if (reprint === 2) updateRicevuta();
  };
  
  // Rendering in base allo stato di modifica
  return (
    <Card>
      <Card.Header>
        <h5>{editRicevuta ? 'Crea Ricevuta' : 'Dettaglio Ricevuta'}</h5>
      </Card.Header>
      <Card.Body>
        {showError && (
          <Alert variant="danger" onClose={() => setShowError(false)} dismissible>
            {error}
          </Alert>
        )}
        
        {socioRicevuta && (
          <>
            <Row className="mb-4">
              <Col md={6}>
                <p><strong>Socio:</strong> {socioRicevuta.cognome} {socioRicevuta.nome}</p>
                {!editRicevuta && (
                  <>
                    <p><strong>N° Fattura:</strong> {nFattura}</p>
                    <p><strong>Attività:</strong> {attivitaDesc}</p>
                  </>
                )}
              </Col>
              <Col md={6}>
                {!editRicevuta && (
                  <>
                    <p><strong>Importo Pagato:</strong> {sommaPay} €</p>
                    <p><strong>Periodo:</strong> {periodo}</p>
                  </>
                )}
              </Col>
            </Row>
            
            {editRicevuta ? (
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <DateField 
                      label="Data Ricevuta" 
                      name="dataRicevuta" 
                      value={dataRicevuta} 
                      onChange={(name, value) => setDataRicevuta(value)}
                      required
                    />
                  </Col>
                  <Col md={6}>
                    <DateField 
                      label="Data Quota" 
                      name="dataQuota" 
                      value={dataQuota} 
                      onChange={(name, value) => setDataQuota(value)}
                      required
                    />
                  </Col>
                </Row>
                
                <Row>
                  <Col md={6}>
                    <TextField 
                      label="Periodo" 
                      name="periodo" 
                      value={periodo} 
                      onChange={(name, value) => setPeriodo(value)}
                      required
                    />
                  </Col>
                  <Col md={6}>
                    <TextField 
                      label="Importo Pagato (€)" 
                      name="sommaPay" 
                      value={sommaPay} 
                      onChange={(name, value) => setSommaPay(value)}
                      type="number"
                      step="0.01"
                      required
                    />
                  </Col>
                </Row>
                
                <Row>
                  <Col md={6}>
                    <TextField 
                      label="Importo Incassato (€)" 
                      name="sommaIncassata" 
                      value={sommaIncassata} 
                      onChange={(name, value) => setSommaIncassata(value)}
                      type="number"
                      step="0.01"
                    />
                  </Col>
                  <Col md={6}>
                    <CheckboxField 
                      label="Registrato" 
                      name="registrato" 
                      checked={registrato} 
                      onChange={(name, value) => setRegistrato(value)}
                    />
                  </Col>
                </Row>
                
                <Row>
                  <Col md={6}>
                    <CheckboxField 
                      label="Quota Associativa" 
                      name="quotaAssociativa" 
                      checked={quotaAssociativa} 
                      onChange={(name, value) => setQuotaAssociativa(value)}
                    />
                  </Col>
                </Row>
                
                <Row>
                  <Col md={6}>
                    <SelectField 
                      label="Attività" 
                      name="attivita" 
                      value={selectedActivity}
                      options={selActiv || []}
                      onChange={handleActivityChange}
                      required
                    />
                  </Col>
                  <Col md={6}>
                    <SelectField 
                      label="Affiliazione" 
                      name="affiliazione" 
                      value={selectedAffilia}
                      options={selAffiliazione || []}
                      onChange={handleAffiliationChange}
                      required
                    />
                  </Col>
                </Row>
                
                <div className="d-flex justify-content-end mt-3">
                  {onCancel && (
                    <Button 
                      variant="secondary" 
                      onClick={onCancel} 
                      className="me-2"
                      disabled={loading}
                    >
                      Annulla
                    </Button>
                  )}
                  <Button 
                    variant="primary" 
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Salvataggio...' : 'Salva'}
                  </Button>
                </div>
              </Form>
            ) : (
              <div className="d-flex justify-content-end mt-3">
                {onCancel && (
                  <Button 
                    variant="secondary" 
                    onClick={onCancel}
                  >
                    Chiudi
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default RicevutaForm;