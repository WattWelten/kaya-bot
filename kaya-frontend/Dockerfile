# Build Stage
FROM node:18-alpine AS builder

WORKDIR /app

# Kopiere package.json und package-lock.json
COPY package*.json ./

# Installiere Dependencies
RUN npm ci --no-audit --no-fund

# Kopiere den Rest des Codes
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

# Exponiere Port
EXPOSE ${PORT:-3000}

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Starte den Server
CMD sh -c "serve -s dist -l ${PORT:-3000}"

