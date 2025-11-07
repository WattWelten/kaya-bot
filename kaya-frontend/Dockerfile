# Build Stage
FROM node:18-alpine AS builder

WORKDIR /app

# Kopiere package.json und package-lock.json
COPY package*.json ./

# Installiere Dependencies
RUN npm ci

# Kopiere den Rest des Codes
COPY . .

# Baue die Anwendung
RUN npm run build

# Production Stage
FROM node:18-alpine

WORKDIR /app

# Installiere serve global
RUN npm install -g serve

# Kopiere das Build-Ergebnis vom Builder
COPY --from=builder /app/dist ./dist

# Exponiere Port
EXPOSE ${PORT:-3000}

# Starte den Server
CMD sh -c "serve -s dist -l ${PORT:-3000}"

