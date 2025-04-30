import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import PrimaNotaList from '../../components/primanota/PrimaNotaList';
import utilityService from '../../api/services/utilityService';

/**
 * Pagina per la gestione della prima nota
 */
const PrimaNota = () => {
  const [tesseraCheck, setTesseraCheck] = useState({
    tesseraOK: true,
    tesseraEmpty: [],
    tesseraDup: []
  });
  
  // Controlla i numeri di tessera all'avvio
  useEffect(() => {
    const checkNumeroTessera = async () => {
      try {
        const response = await utilityService.cntrlNumeroTessera(2);
        setTesseraCheck({
          tesseraOK: response.data.tesseraOK,
          tesseraEmpty: response.data.tesseraEmpty || [],
          tesseraDup: response.data.tesseraDup || []
        });
      } catch (error) {
        console.error('Errore nel controllo dei numeri di tessera:', error);
      }
    };
    
    checkNumeroTessera();
  }, []);
  
  return (
    <Container className="mt-4 mb-5">
      <h2 className="mb-4">Prima Nota</h2>
      
      <PrimaNotaList 
        showNumeroTesseraAlert={!tesseraCheck.tesseraOK} 
        tesseraEmptyList={tesseraCheck.tesseraEmpty}
        tesseraDupList={tesseraCheck.tesseraDup}
      />
    </Container>
  );
};

export default PrimaNota;