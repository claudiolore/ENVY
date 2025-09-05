# ENVY Frontend

Frontend React per la gestione di template e generazione di file `.env` personalizzati.

## Tecnologie

- **React 18** con Vite
- **Material UI v5** (tema bianco e nero minimalista)
- **React Router** per navigazione
- **Axios** per chiamate API (tutte POST)
- **Material Icons** per icone

## Installazione e Avvio

```bash
# Installa le dipendenze
npm install

# Avvia il server di sviluppo
npm run dev

# Oppure
npm start

# Build per produzione
npm run build
```

Il frontend sarà disponibile su `http://localhost:3000`

⚠️ **Importante**: Assicurati che il backend sia in esecuzione su `http://localhost:3001`

## Struttura del Progetto

```
src/
├── components/
│   └── Layout.jsx           # Layout principale con navbar
├── context/
│   └── NotificationContext.jsx  # Context per notifiche globali
├── pages/
│   ├── TemplatesPage.jsx    # Gestione template
│   ├── ClientsPage.jsx      # Gestione clienti
│   ├── VariablesPage.jsx    # Gestione variabili
│   └── GeneratePage.jsx     # Generazione .env e ZIP
├── services/
│   └── api.js              # Servizio API centralizzato
├── theme.js                # Tema Material UI personalizzato
├── App.jsx                 # Componente root con routing
└── main.jsx               # Entry point dell'app
```

## Funzionalità

### 📋 **Template Management** (`/templates`)

- Visualizza tutti i template in tabella
- Crea, modifica e elimina template
- **🆕 Interfaccia semplificata con variabili**:
  - **📋 Input separati**: Un campo per nome variabile, placeholder generato automaticamente
  - **➕ Gestione dinamica**: Aggiungi/rimuovi variabili con pulsanti
  - **🔄 Auto-conversione**: `DB_HOST` → `{{DB_HOST}}` automatico
- **👁️ Anteprima live** del template generato in tempo reale
- **📤 Import da file .env esistente**:
  - Incolla contenuto .env e crea automaticamente lista variabili
  - Conversione intelligente: `DB_HOST=localhost` → `DB_HOST` con placeholder `{{DB_HOST}}`
- **💡 User-friendly**: Niente più errori di sintassi nei placeholder
- Supporto completo placeholder `{{NOME_VARIABILE}}`

### 👥 **Client Management** (`/clients`)

- Gestisce la lista dei clienti
- Operazioni CRUD complete
- Visualizza numero di variabili per cliente

### ⚙️ **Variables Management** (`/variables`)

- Selettore cliente
- Tabella variabili client-specific
- Editor chiave-valore con validazione
- Font monospace per chiavi e valori

### 🔧 **Generate & Export** (`/generate`)

- Selettore cliente e template
- Anteprima live del file .env generato
- Copia negli appunti con un click
- Download ZIP di tutti i client
- Visualizzazione template e variabili selezionate

## Caratteristiche UX/UI

- **Tema minimalista**: Schema colori bianco e nero
- **Responsive design**: Ottimizzato per desktop e mobile
- **Feedback utente**: Notifiche Snackbar per successo/errori
- **Loading states**: Indicatori di caricamento per tutte le operazioni
- **Form validation**: Validazione real-time con messaggi di errore
- **Consistent iconography**: Material Design Icons

## API Integration

- **Tutte le chiamate sono POST**: Come richiesto dal backend
- **Gestione errori centralizzata**: Con messaggi user-friendly
- **Interceptor per logging**: Solo in development
- **Download gestito**: Blob + URL.createObjectURL per file ZIP

## Configurazione

### Backend URL

Modifica in `src/services/api.js`:

```javascript
const api = axios.create({
  baseURL: "http://localhost:3001", // Cambia se necessario
  // ...
});
```

### Tema Personalizzazione

Modifica in `src/theme.js` per personalizzare colori e stili.

## Scripts Disponibili

- `npm run dev` - Avvia server di sviluppo
- `npm run build` - Build per produzione
- `npm run preview` - Anteprima build di produzione

## Dipendenze Principali

```json
{
  "react": "^18.2.0",
  "@mui/material": "^5.15.0",
  "@mui/icons-material": "^5.15.0",
  "react-router-dom": "^6.20.0",
  "axios": "^1.6.0"
}
```

## Note Sviluppatori

- **Convenzioni**: Componenti in PascalCase, file JSX con estensione `.jsx`
- **State Management**: Hooks locali, no Redux (tool interno semplice)
- **Error Handling**: Tutti gli errori passano attraverso il NotificationContext
- **API Calls**: Sempre POST, headers JSON, gestione response/error standardizzata
- **File Structure**: Separazione logica per type (pages, components, services)

Questo frontend è ottimizzato per essere un tool interno semplice ma completo per la gestione di template e generazione file .env.
