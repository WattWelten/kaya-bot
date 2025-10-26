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

# Preview-Server starten
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]
