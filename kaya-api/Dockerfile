FROM node:18-alpine

WORKDIR /app

# Kopiere package.json und package-lock.json
COPY package*.json ./

# Installiere Dependencies
RUN npm ci --only=production --no-audit --no-fund

# Kopiere den Rest des Codes
COPY . .

# Exponiere Port
EXPOSE ${PORT:-3001}

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3001) + '/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Starte den Server
CMD ["node", "kaya_server.js"]



