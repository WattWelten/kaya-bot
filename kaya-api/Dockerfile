# Production Stage
FROM node:18-alpine

WORKDIR /app

# Kopiere nur package.json und package-lock.json
COPY package*.json ./

# Installiere nur Production Dependencies
RUN npm ci --only=production --no-audit --no-fund

# Kopiere Source Code (ohne node_modules, memory/, logs/, etc. - durch .dockerignore ausgeschlossen)
COPY . .

# Erstelle notwendige Verzeichnisse für Laufzeit
RUN mkdir -p memory logs

# Exponiere Port
EXPOSE ${PORT:-3001}

# Starte den Server
CMD ["node", "kaya_server.js"]



