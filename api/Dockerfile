# Backend Dockerfile per ENVY API Server
FROM node:18-alpine

# Imposta la directory di lavoro
WORKDIR /app

# Copia package.json e package-lock.json
COPY package*.json ./

# Installa le dipendenze
RUN npm ci --only=production

# Copia il resto del codice sorgente
COPY . .

# Crea la directory per il database se non esiste
RUN mkdir -p /app/data

# Espone la porta 3001
EXPOSE 3001

# Imposta le variabili d'ambiente
ENV NODE_ENV=production
ENV PORT=3001

# Crea un utente non-root per sicurezza
RUN addgroup -g 1001 -S nodejs
RUN adduser -S envy -u 1001

# Cambia ownership della directory dell'app
RUN chown -R envy:nodejs /app
USER envy

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "const http = require('http'); \
    const options = { hostname: 'localhost', port: 3001, path: '/health', method: 'POST', timeout: 2000 }; \
    const req = http.request(options, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); \
    req.on('error', () => { process.exit(1); }); \
    req.on('timeout', () => { req.destroy(); process.exit(1); }); \
    req.write('{}'); \
    req.end();"

# Comando per avviare l'applicazione
CMD ["node", "server.js"]
