# Club Manager

Una moderna applicazione React per la gestione di club sportivi o associazioni, evoluzione di un precedente sistema AngularJS.

## Caratteristiche

- **Gestione Soci**: Registrazione, modifica e visualizzazione dei soci
- **Ricevute**: Creazione e gestione delle ricevute per i pagamenti
- **Prima Nota**: Gestione delle entrate e uscite
- **Libro Soci**: Registro ufficiale dei soci
- **Parametri**: Configurazione di attività, affiliazioni e altri parametri

## Installazione

```bash
# Clona il repository
git clone <url-repository>

# Entra nella directory
cd club-manager

# Installa le dipendenze
npm install

# Avvia l'applicazione in modalità sviluppo
npm start
```

L'applicazione sarà disponibile all'indirizzo [http://localhost:3000](http://localhost:3000).

## Struttura del Progetto

```
/club-manager/
  ├── public/                # File statici pubblici
  ├── src/                   # Codice sorgente
  │   ├── api/               # Configurazione API e servizi
  │   │   ├── axios.js       # Configurazione Axios
  │   │   ├── endpoints.js   # Definizione degli endpoint
  │   │   └── services/      # Servizi per le chiamate API
  │   ├── components/        # Componenti riutilizzabili
  │   ├── context/           # Context API per lo stato globale
  │   ├── hooks/             # Custom hooks
  │   ├── layouts/           # Layout dell'applicazione
  │   ├── pages/             # Pagine dell'applicazione
  │   ├── router/            # Configurazione del routing
  │   ├── styles/            # CSS/SCSS styles
  │   ├── utils/             # Funzioni di utilità
  │   ├── App.jsx            # Componente root
  │   └── index.js           # Entry point
  └── package.json           # Configurazione del progetto
```

## Migrazioni principali da AngularJS a React

### 1. Gestione dello stato

- **AngularJS**: Utilizzava `$scope` e `$rootScope` per la gestione dello stato
- **React**: Utilizza React Context API (`AppContext.jsx`) e hooks per la gestione dello stato

### 2. Routing

- **AngularJS**: Utilizzava UI-Router con states
- **React**: Utilizza React Router v6 con routes e componenti

### 3. API e servizi

- **AngularJS**: Utilizzava `$resource` per le chiamate API
- **React**: Utilizza Axios con servizi organizzati per dominio

### 4. Form e validazione

- **AngularJS**: Utilizzava direttive per i form
- **React**: Utilizza componenti di form personalizzati con validazione

### 5. Componenti

- **AngularJS**: Utilizzava controller e direttive
- **React**: Utilizza componenti funzionali con hooks

## Tecnologie utilizzate

- **React 18**: Per la costruzione dell'interfaccia utente
- **React Router 6**: Per la gestione del routing
- **Axios**: Per le chiamate API
- **React Bootstrap**: Per i componenti UI
- **React-Select**: Per i campi select avanzati
- **React-DatePicker**: Per i campi data