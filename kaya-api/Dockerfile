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

# Starte den Server
CMD ["node", "kaya_server.js"]



