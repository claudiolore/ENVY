# Frontend Dockerfile per ENVY React Application
# Multi-stage build: Build stage + Production stage

# === BUILD STAGE ===
FROM node:18-alpine as build

# Imposta la directory di lavoro
WORKDIR /app

# Copia package.json e package-lock.json
COPY package*.json ./

# Installa tutte le dipendenze (incluse quelle di sviluppo)
RUN npm ci

# Copia il resto del codice sorgente
COPY . .

# Build dell'applicazione per produzione
RUN npm run build

# === PRODUCTION STAGE ===
FROM nginx:alpine

# Rimuovi la configurazione nginx predefinita
RUN rm -rf /usr/share/nginx/html/*

# Copia i file buildati dalla stage precedente
COPY --from=build /app/dist /usr/share/nginx/html

# Crea configurazione nginx personalizzata per SPA React
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html index.htm; \
    \
    # Gestione del routing per Single Page Application \
    location / { \
    try_files $uri $uri/ /index.html; \
    } \
    \
    # Cache statico per asset \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ { \
    expires 1y; \
    add_header Cache-Control "public, immutable"; \
    } \
    \
    # Configurazione per il proxy API (se necessario) \
    location /api { \
    proxy_pass http://backend:3001; \
    proxy_http_version 1.1; \
    proxy_set_header Upgrade $http_upgrade; \
    proxy_set_header Connection "upgrade"; \
    proxy_set_header Host $host; \
    proxy_set_header X-Real-IP $remote_addr; \
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
    proxy_set_header X-Forwarded-Proto $scheme; \
    } \
    \
    # Security headers \
    add_header X-Frame-Options "SAMEORIGIN" always; \
    add_header X-XSS-Protection "1; mode=block" always; \
    add_header X-Content-Type-Options "nosniff" always; \
    add_header Referrer-Policy "no-referrer-when-downgrade" always; \
    add_header Content-Security-Policy "default-src '\''self'\'' http: https: data: blob: '\''unsafe-inline'\''" always; \
    }' > /etc/nginx/conf.d/default.conf

# Espone la porta 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1

# Avvia nginx
CMD ["nginx", "-g", "daemon off;"]
