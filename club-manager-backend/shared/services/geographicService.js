const axios = require('axios');

class GeographicService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 ore in milliseconds
    this.apiTimeout = 10000; // 10 secondi timeout per API calls
    this.baseUrl = 'https://axqvoqvbfjpaamphztgd.functions.supabase.co/';
  }

  /**
   * Recupera tutte le province italiane da API Samurai016
   */
  async getProvince() {
    const cacheKey = 'province';
    
    // Controlla cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('Province recuperate da cache');
        return cached.data;
      }
    }

    try {
      console.log('Recupero province da API Samurai016/Comuni-ITA...');
      
      const response = await axios.get(`${this.baseUrl}/province`, {
        timeout: this.apiTimeout,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Club-Manager-Backend/1.0'
        }
      });
      
      const province = response.data.map(p => ({
        code: p.sigla,
        nome: p.nome,
        regione: p.regione,
        provCode: p.sigla // Compatibilità con frontend
      }));

      // Ordina alfabeticamente
      province.sort((a, b) => a.nome.localeCompare(b.nome));

      // Salva in cache
      this.cache.set(cacheKey, {
        data: province,
        timestamp: Date.now()
      });

      console.log(`${province.length} province recuperate e cachedate`);
      return province;

    } catch (error) {
      console.error('Errore nel recupero province da API:', error.message);
      
      // Fallback con dati minimi essenziali
      const fallbackProvince = [
        { code: 'AG', nome: 'Agrigento', regione: 'Sicilia', provCode: 'AG' },
        { code: 'AL', nome: 'Alessandria', regione: 'Piemonte', provCode: 'AL' },
        { code: 'AN', nome: 'Ancona', regione: 'Marche', provCode: 'AN' },
        { code: 'BA', nome: 'Bari', regione: 'Puglia', provCode: 'BA' },
        { code: 'BG', nome: 'Bergamo', regione: 'Lombardia', provCode: 'BG' },
        { code: 'BO', nome: 'Bologna', regione: 'Emilia-Romagna', provCode: 'BO' },
        { code: 'FI', nome: 'Firenze', regione: 'Toscana', provCode: 'FI' },
        { code: 'GE', nome: 'Genova', regione: 'Liguria', provCode: 'GE' },
        { code: 'MI', nome: 'Milano', regione: 'Lombardia', provCode: 'MI' },
        { code: 'NA', nome: 'Napoli', regione: 'Campania', provCode: 'NA' },
        { code: 'PA', nome: 'Palermo', regione: 'Sicilia', provCode: 'PA' },
        { code: 'RM', nome: 'Roma', regione: 'Lazio', provCode: 'RM' },
        { code: 'TO', nome: 'Torino', regione: 'Piemonte', provCode: 'TO' },
        { code: 'VE', nome: 'Venezia', regione: 'Veneto', provCode: 'VE' }
      ];

      console.log('Utilizzo dati fallback per province');
      return fallbackProvince;
    }
  }

  /**
   * Recupera i comuni di una specifica provincia usando API Samurai016
   */
  async getComuniByProvincia(siglaProvincia) {
    if (!siglaProvincia) {
      throw new Error('Sigla provincia richiesta');
    }

    const cacheKey = `comuni_${siglaProvincia.toUpperCase()}`;
    
    // Controlla cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log(`Comuni ${siglaProvincia} recuperati da cache`);
        return cached.data;
      }
    }

    try {
      console.log(`Recupero comuni per provincia ${siglaProvincia} da API Samurai016...`);
      
      const response = await axios.get(`${this.baseUrl}/comuni/provincia/${siglaProvincia.toUpperCase()}`, {
        timeout: this.apiTimeout,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Club-Manager-Backend/1.0'
        }
      });
      
      const comuni = response.data.map(c => ({
        code: c.codiceCatastale || c.codiceIstat || c.nome, // Usa codiceCatastale se disponibile
        nome: c.nome,
        description: c.nome, // Compatibilità con frontend
        provinciaCode: c.provincia?.sigla || siglaProvincia,
        provCode: c.provincia?.sigla || siglaProvincia, // Compatibilità con frontend
        cap: c.cap || '',
        codiceCatastale: c.codiceCatastale || '',
        codiceIstat: c.codiceIstat || '',
        coordinate: {
          lat: c.coordinate?.lat || null,
          lng: c.coordinate?.lng || null
        }
      }));

      // Ordina alfabeticamente
      comuni.sort((a, b) => a.nome.localeCompare(b.nome));

      // Salva in cache
      this.cache.set(cacheKey, {
        data: comuni,
        timestamp: Date.now()
      });

      console.log(`${comuni.length} comuni trovati per provincia ${siglaProvincia}`);
      return comuni;

    } catch (error) {
      console.error(`Errore nel recupero comuni per ${siglaProvincia}:`, error.message);
      
      // Se l'API non trova la provincia, ritorna array vuoto
      if (error.response && error.response.status === 404) {
        console.log(`Provincia ${siglaProvincia} non trovata`);
        return [];
      }
      
      // Per altri errori, ritorna array vuoto
      return [];
    }
  }

  /**
   * Cerca comuni per nome usando l'endpoint dedicato di Samurai016
   */
  async searchComuniByName(nomeParziale) {
    if (!nomeParziale || nomeParziale.length < 2) {
      throw new Error('Inserire almeno 2 caratteri per la ricerca');
    }

    const cacheKey = `search_${nomeParziale.toLowerCase()}`;
    
    // Per ricerche brevi, usa cache più breve (1 ora)
    const shortCacheTimeout = 60 * 60 * 1000; // 1 ora
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < shortCacheTimeout) {
        console.log(`Risultati ricerca "${nomeParziale}" da cache`);
        return cached.data;
      }
    }

    try {
      console.log(`Ricerca comuni per nome: ${nomeParziale} tramite API Samurai016...`);
      
      // Usa l'endpoint generale e filtra localmente per migliori risultati
      const response = await axios.get(`${this.baseUrl}/comuni`, {
        timeout: this.apiTimeout,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Club-Manager-Backend/1.0'
        }
      });

      const searchTerm = nomeParziale.toLowerCase();
      
      const risultati = response.data
        .filter(c => c.nome.toLowerCase().includes(searchTerm))
        .map(c => ({
          code: c.codiceCatastale || c.codiceIstat || c.nome,
          nome: c.nome,
          description: c.nome,
          provinciaCode: c.provincia?.sigla || '',
          provCode: c.provincia?.sigla || '',
          cap: c.cap || '',
          regione: c.regione?.nome || '',
          provincia: c.provincia?.nome || '',
          codiceCatastale: c.codiceCatastale || '',
          codiceIstat: c.codiceIstat || '',
          coordinate: {
            lat: c.coordinate?.lat || null,
            lng: c.coordinate?.lng || null
          }
        }))
        .slice(0, 50) // Limita a 50 risultati per performance
        .sort((a, b) => {
          // Priorità ai comuni che iniziano con il termine cercato
          const aStarts = a.nome.toLowerCase().startsWith(searchTerm);
          const bStarts = b.nome.toLowerCase().startsWith(searchTerm);
          
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          
          return a.nome.localeCompare(b.nome);
        });

      // Salva in cache con timeout ridotto per ricerche
      this.cache.set(cacheKey, {
        data: risultati,
        timestamp: Date.now()
      });

      console.log(`${risultati.length} comuni trovati per ricerca "${nomeParziale}"`);
      return risultati;

    } catch (error) {
      console.error('Errore nella ricerca comuni:', error.message);
      
      // Fallback: ricerca in cache locale se disponibile
      const allCachedKeys = Array.from(this.cache.keys()).filter(key => key.startsWith('comuni_'));
      if (allCachedKeys.length > 0) {
        console.log('Utilizzo cache locale per ricerca di fallback');
        const allCachedComuni = [];
        
        allCachedKeys.forEach(key => {
          const cached = this.cache.get(key);
          if (cached && cached.data) {
            allCachedComuni.push(...cached.data);
          }
        });
        
        const searchTerm = nomeParziale.toLowerCase();
        return allCachedComuni
          .filter(c => c.nome.toLowerCase().includes(searchTerm))
          .slice(0, 20);
      }
      
      return [];
    }
  }

  /**
   * Recupera un singolo comune per codice (utility aggiuntiva)
   */
  async getComuneByCodice(codiceComune) {
    try {
      console.log(`Recupero comune per codice: ${codiceComune}`);
      
      const response = await axios.get(`${this.baseUrl}/comuni`, {
        timeout: this.apiTimeout,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Club-Manager-Backend/1.0'
        }
      });

      const comune = response.data.find(c => 
        c.codiceCatastale === codiceComune || 
        c.codiceIstat === codiceComune ||
        c.nome.toLowerCase() === codiceComune.toLowerCase()
      );

      if (!comune) {
        return null;
      }

      return {
        code: comune.codiceCatastale || comune.codiceIstat || comune.nome,
        nome: comune.nome,
        description: comune.nome,
        provinciaCode: comune.provincia?.sigla || '',
        provCode: comune.provincia?.sigla || '',
        cap: comune.cap || '',
        regione: comune.regione?.nome || '',
        provincia: comune.provincia?.nome || '',
        codiceCatastale: comune.codiceCatastale || '',
        codiceIstat: comune.codiceIstat || '',
        coordinate: {
          lat: comune.coordinate?.lat || null,
          lng: comune.coordinate?.lng || null
        }
      };

    } catch (error) {
      console.error(`Errore nel recupero comune ${codiceComune}:`, error.message);
      return null;
    }
  }

  /**
   * Test connessione API (utility per debugging)
   */
  async testApiConnection() {
    try {
      console.log('Test connessione API Samurai016/Comuni-ITA...');
      
      const response = await axios.get(`${this.baseUrl}/province`, {
        timeout: 5000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Club-Manager-Backend/1.0'
        }
      });

      const status = {
        connected: true,
        responseTime: Date.now(),
        provinceCount: response.data?.length || 0,
        apiUrl: this.baseUrl
      };

      console.log('Test API completato:', status);
      return status;

    } catch (error) {
      const status = {
        connected: false,
        error: error.message,
        apiUrl: this.baseUrl
      };

      console.error('Test API fallito:', status);
      return status;
    }
  }

  /**
   * Pulisce la cache (utility per manutenzione)
   */
  clearCache() {
    this.cache.clear();
    console.log('Cache geographic service pulita');
  }

  /**
   * Recupera statistiche cache
   */
  getCacheStats() {
    const stats = {
      entries: this.cache.size,
      keys: Array.from(this.cache.keys()),
      cacheTimeout: this.cacheTimeout,
      apiUrl: this.baseUrl
    };
    
    console.log('Stats cache geographic:', stats);
    return stats;
  }
}

// Export singleton instance
module.exports = new GeographicService();