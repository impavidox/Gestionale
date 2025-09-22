import React, { useState, useEffect } from 'react';
import { Card, Form, Row, Col, Button, Alert } from 'react-bootstrap';
import TextField from '../forms/TextField';
import CheckboxField from '../forms/CheckboxField';
import SelectField from '../forms/SelectField';
import activityService from '../../api/services/activityService';

/**
 * Componente per la creazione e modifica delle attività
 * 
 * @param {Object} props - Props del componente
 * @param {Object} props.activity - Attività da modificare (solo in modalità update)
 * @param {Object} props.famiglia - Famiglia dell'attività
 * @param {Boolean} props.updateMode - True se è in modalità aggiornamento
 * @param {Function} props.onClose - Callback da chiamare alla chiusura
 */
const AttivitaForm = ({ activity, famiglia, updateMode = false, onClose }) => {
  // Stati per il form
  const [formData, setFormData] = useState({
    description: '',
    libertas: false,
    fgi: false,
    fita: false,
    filkjm: false
  });
  
  // Stati per dati correlati
  const [familyId, setFamilyId] = useState(0);
  const [families, setFamilies] = useState([]);
  const [selectedFamily, setSelectedFamily] = useState(null);
  
  // Stati per notifiche ed errori
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertVariant, setAlertVariant] = useState('danger');
  
  // Carica i dati della famiglia se non fornita
  useEffect(() => {
    const fetchFamilies = async () => {
      if (!famiglia) {
        try {
          setLoading(true);
          const response = await activityService.retrieveFamilies();
          setFamilies(response.data);
          setLoading(false);
        } catch (error) {
          console.error('Errore nel caricamento delle famiglie:', error);
          setError('Si è verificato un errore nel caricamento delle famiglie.');
          setAlertVariant('danger');
          setShowAlert(true);
          setLoading(false);
        }
      }
    };
    
    fetchFamilies();
  }, [famiglia]);
  
  // Imposta i dati iniziali quando disponibili
  useEffect(() => {
    if (famiglia) {
      setSelectedFamily(famiglia);
      setFamilyId(famiglia.id);
    }
    
    if (activity && updateMode) {
      setFormData({
        description: activity.description || '',
        libertas: hasAffiliazione(activity, 1),
        fgi: hasAffiliazione(activity, 2),
        fita: hasAffiliazione(activity, 3),
        filkjm: hasAffiliazione(activity, 4)
      });
    }
  }, [activity, famiglia, updateMode]);
  
  // Verifica se un'attività ha una specifica affiliazione
  const hasAffiliazione = (activity, affiliazioneId) => {
    if (!activity || !activity.affiliazioneList) return false;
    
    return activity.affiliazioneList.some(aff => aff.id === affiliazioneId);
  };
  
  // Gestione cambiamento dei campi
  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Gestione selezione famiglia
  const handleFamilyChange = (name, selectedOption) => {
    setSelectedFamily(selectedOption.value);
    setFamilyId(selectedOption.value.id);
  };
  
  // Creazione o aggiornamento dell'attività
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.description) {
      setError('La descrizione è obbligatoria.');
      setAlertVariant('danger');
      setShowAlert(true);
      return;
    }
    
    if (!familyId) {
      setError('Selezionare una famiglia per l\'attività.');
      setAlertVariant('danger');
      setShowAlert(true);
      return;
    }
    
    try {
      setLoading(true);
      
      const body = {
        familyId: familyId,
        description: formData.description,
        libertas: formData.libertas,
        fgi: formData.fgi,
        fita: formData.fita,
        filkjm: formData.filkjm
      };
      
      // Aggiunge l'ID dell'attività se in modalità update
      if (updateMode && activity) {
        body.attId = activity.id;
      }
      
      const response = await activityService.updateActivity(body);
      
      if (response.data.rc) {
        setSuccess(updateMode ? 'Attività aggiornata con successo.' : 'Attività creata con successo.');
        setAlertVariant('success');
        setShowAlert(true);
        
        // Reset del form dopo il successo
        if (!updateMode) {
          setFormData({
            description: '',
            libertas: false,
            fgi: false,
            fita: false,
            filkjm: false
          });
        }
      } else {
        throw new Error(response.data.message || 'Si è verificato un errore durante il salvataggio dell\'attività.');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Errore nel salvataggio dell\'attività:', error);
      setError(error.message || 'Si è verificato un errore durante il salvataggio dell\'attività.');
      setAlertVariant('danger');
      setShowAlert(true);
      setLoading(false);
    }
  };
  
  // Rimuove un'attività
  const handleRemove = async () => {
    if (!activity || !activity.id) return;
    
    if (!window.confirm('Sei sicuro di voler eliminare questa attività?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      const body = {
        attId: activity.id
      };
      
      const response = await activityService.removeActivity(body);
      
      if (response.data.rc) {
        setSuccess('Attività eliminata con successo.');
        setAlertVariant('success');
        setShowAlert(true);
        
        // Chiude il form dopo un breve ritardo
        setTimeout(() => {
          if (onClose) onClose();
        }, 1500);
      } else {
        throw new Error(response.data.message || 'Si è verificato un errore durante l\'eliminazione dell\'attività.');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Errore nell\'eliminazione dell\'attività:', error);
      setError(error.message || 'Si è verificato un errore durante l\'eliminazione dell\'attività.');
      setAlertVariant('danger');
      setShowAlert(true);
      setLoading(false);
    }
  };
  
  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5>{updateMode ? 'Modifica Attività' : 'Nuova Attività'}</h5>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Chiudi
        </Button>
      </Card.Header>
      <Card.Body>
        {showAlert && (
          <Alert 
            variant={alertVariant} 
            onClose={() => setShowAlert(false)} 
            dismissible
          >
            {alertVariant === 'danger' ? error : success}
          </Alert>
        )}
        
        <Form onSubmit={handleSubmit}>
          {!famiglia && (
            <Row className="mb-3">
              <Col>
                <SelectField
                  label="Famiglia"
                  name="famiglia"
                  value={selectedFamily ? { value: selectedFamily } : null}
                  options={families}
                  onChange={handleFamilyChange}
                  required
                />
              </Col>
            </Row>
          )}
          
          <Row className="mb-3">
            <Col>
              <TextField
                label="Descrizione"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </Col>
          </Row>
          
          <h6 className="mb-3">Affiliazioni</h6>
          <Row>
            <Col md={3}>
              <CheckboxField
                label="Libertas"
                name="libertas"
                checked={formData.libertas}
                onChange={handleChange}
              />
            </Col>
            <Col md={3}>
              <CheckboxField
                label="FGI"
                name="fgi"
                checked={formData.fgi}
                onChange={handleChange}
              />
            </Col>
            <Col md={3}>
              <CheckboxField
                label="FITA"
                name="fita"
                checked={formData.fita}
                onChange={handleChange}
              />
            </Col>
            <Col md={3}>
              <CheckboxField
                label="FILKJM"
                name="filkjm"
                checked={formData.filkjm}
                onChange={handleChange}
              />
            </Col>
          </Row>
          
          <div className="d-flex justify-content-between mt-4">
            <div>
              {updateMode && (
                <Button 
                  variant="danger" 
                  type="button"
                  onClick={handleRemove}
                  disabled={loading}
                >
                  Elimina
                </Button>
              )}
            </div>
            <div>
              <Button 
                variant="primary" 
                type="submit"
                disabled={loading}
              >
                {loading ? 'Salvataggio...' : (updateMode ? 'Aggiorna' : 'Crea')}
              </Button>
            </div>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default AttivitaForm;