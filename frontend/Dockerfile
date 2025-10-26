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

# Static-Server starten
CMD ["npx", "serve", "dist", "-s", "-l", "tcp://0.0.0.0:$PORT"]
