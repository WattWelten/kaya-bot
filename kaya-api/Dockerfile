# Build Stage (für Dependencies)
FROM node:18-alpine AS deps

WORKDIR /app

# Kopiere package.json und package-lock.json
COPY package*.json ./

# Installiere alle Dependencies (inkl. devDependencies für Build)
RUN npm ci --no-audit --no-fund

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

# Health Check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${PORT:-3001}/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Starte den Server
CMD ["node", "kaya_server.js"]



