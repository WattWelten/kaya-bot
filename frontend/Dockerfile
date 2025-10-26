FROM node:18-alpine

WORKDIR /app

# Package files kopieren
COPY package*.json ./

# Dependencies installieren (inkl. devDependencies für Build)
RUN npm ci

# Source code kopieren
COPY . .

# Build erstellen
RUN npm run build

# Port freigeben
EXPOSE 3000

# Static-Server starten (Port wird von Railway gesetzt)
CMD ["sh", "-c", "npx serve dist -s -l ${PORT:-3000}"]
