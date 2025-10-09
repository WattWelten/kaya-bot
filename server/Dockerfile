FROM node:18-alpine

WORKDIR /app

# Kopiere Package-Dateien
COPY package*.json ./

# Installiere Dependencies
RUN npm install --production

# Kopiere Anwendung
COPY . .

# Exponiere Port
EXPOSE 3002

# Starte Anwendung
CMD ["node", "kaya_server.js"]





