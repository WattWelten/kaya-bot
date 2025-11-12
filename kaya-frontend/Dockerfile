# Build Stage
FROM node:18-alpine AS builder

WORKDIR /app

# Kopiere package.json und package-lock.json
COPY package*.json ./

# Installiere Dependencies (mit Cache-Optimierung)
RUN npm ci --no-audit --no-fund --prefer-offline

# Kopiere Source Code (ohne node_modules, dist/, etc. - durch .dockerignore ausgeschlossen)
COPY . .

# Baue die Anwendung
RUN npm run build

# Production Stage
FROM node:18-alpine

WORKDIR /app

# Installiere serve global
RUN npm install -g serve --no-audit --no-fund

# Kopiere das Build-Ergebnis vom Builder
COPY --from=builder /app/dist ./dist

# Kopiere public/ Verzeichnis (für Avatar-Dateien)
COPY --from=builder /app/public ./public

# Exponiere Port
EXPOSE ${PORT:-3000}

# Starte den Server
CMD sh -c "serve -s dist -l ${PORT:-3000}"

