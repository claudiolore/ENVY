# ENVY Backend

Backend Node.js per la gestione di template e generazione di file `.env` personalizzati per clienti.

## Funzionalità

- **Gestione Template**: Crea, modifica, elimina template per file .env
- **Gestione Clienti**: Gestisce i clienti del sistema
- **Gestione Variabili**: Associa variabili d'ambiente specifiche a ogni cliente
- **Generazione .env**: Genera file .env personalizzati combinando template e variabili cliente
- **Export ZIP**: Esporta tutti i file .env dei clienti in un archivio ZIP

## Stack Tecnologico

- **Node.js** con **Express.js**
- **SQLite** come database
- **Sequelize** come ORM
- **Archiver** per generazione file ZIP
- **CORS** per connessioni frontend

## Installazione

```bash
# Installa le dipendenze
npm install

# Avvia il server in modalità sviluppo
npm run dev

# Oppure avvia il server in produzione
npm start
```

Il server sarà disponibile su `http://localhost:3001`

## Struttura del Progetto

```
api/
├── config/
│   └── database.js          # Configurazione database SQLite
├── models/
│   ├── Template.js          # Modello Template
│   ├── Client.js            # Modello Client
│   ├── Variable.js          # Modello Variable
│   └── index.js             # Associazioni modelli
├── controllers/
│   ├── templateController.js # Logica template
│   ├── clientController.js   # Logica clienti
│   ├── variableController.js # Logica variabili
│   └── envController.js      # Generazione .env e ZIP
├── routes/
│   ├── templateRoutes.js    # Routes template
│   ├── clientRoutes.js      # Routes clienti
│   ├── variableRoutes.js    # Routes variabili
│   └── envRoutes.js         # Routes generazione
├── server.js                # Server principale
├── package.json
└── README.md
```

## API Endpoints

⚠️ **IMPORTANTE**: Tutte le API utilizzano esclusivamente il metodo **POST**, anche per operazioni di lettura ed eliminazione.

### Template Management

- `POST /template/list` - Lista tutti i template
- `POST /template/create` - Crea template
  ```json
  {
    "name": "Nome Template",
    "content": "DB_HOST={{DB_HOST}}\nDB_USER={{DB_USER}}"
  }
  ```
- `POST /template/update` - Aggiorna template
  ```json
  {
    "id": 1,
    "name": "Nome Aggiornato",
    "content": "Contenuto aggiornato"
  }
  ```
- `POST /template/delete` - Elimina template
  ```json
  {
    "id": 1
  }
  ```

### Client Management

- `POST /client/list` - Lista tutti i clienti
- `POST /client/create` - Crea cliente
  ```json
  {
    "name": "Nome Cliente"
  }
  ```
- `POST /client/update` - Aggiorna cliente
  ```json
  {
    "id": 1,
    "name": "Nome Aggiornato"
  }
  ```
- `POST /client/delete` - Elimina cliente
  ```json
  {
    "id": 1
  }
  ```

### Variable Management

- `POST /variable/list` - Lista variabili di un cliente
  ```json
  {
    "clientId": 1
  }
  ```
- `POST /variable/create` - Crea variabile
  ```json
  {
    "clientId": 1,
    "key": "DB_HOST",
    "value": "localhost"
  }
  ```
- `POST /variable/update` - Aggiorna variabile
  ```json
  {
    "id": 1,
    "key": "DB_HOST",
    "value": "127.0.0.1"
  }
  ```
- `POST /variable/delete` - Elimina variabile
  ```json
  {
    "id": 1
  }
  ```

### File Generation

- `POST /generate-env` - Genera file .env singolo

  ```json
  {
    "clientId": 1,
    "templateId": 1
  }
  ```

- `POST /export-zip` - Esporta ZIP con tutti i .env (restituisce file binario)
  ```json
  {
    "templateId": 1
  }
  ```

### Utility

- `POST /health` - Health check del server

## Formato Template

I template utilizzano il formato `{{NOME_VARIABILE}}` per i placeholder:

```env
# Template esempio
DB_HOST={{DB_HOST}}
DB_PORT={{DB_PORT}}
DB_NAME={{DB_NAME}}
API_KEY={{API_KEY}}
DEBUG={{DEBUG}}
```

## Database

Il database SQLite viene creato automaticamente in `database.sqlite` nella cartella del progetto.

### Schema

- **templates**: id, name, content, createdAt, updatedAt
- **clients**: id, name, createdAt, updatedAt
- **variables**: id, clientId, key, value, createdAt, updatedAt

## Note di Sicurezza

⚠️ **ATTENZIONE**: Questo backend è progettato come tool interno senza autenticazione o misure di sicurezza. Non utilizzare in produzione su reti pubbliche.

## Sviluppo

Per aggiungere nuove funzionalità:

1. Creare/modificare modelli in `models/`
2. Implementare logica nei controller in `controllers/`
3. Aggiungere routes in `routes/`
4. Montare le routes nel `server.js`

Il database si sincronizza automaticamente all'avvio del server.
