# KAYA Frontend - Landkreis Oldenburg

Das moderne Frontend für KAYA, den digitalen Assistenten des Landkreises Oldenburg.

## 🚀 Features

- **React + TypeScript** - Moderne, typsichere Entwicklung
- **Unity WebGL Integration** - Live-Avatar mit Emotionen und Gesten
- **WebSocket-Kommunikation** - Real-time Chat mit Backend
- **Audio-System** - STT/TTS für Sprachinteraktion
- **Accessibility-First** - WCAG 2.1 AA/AAA konform
- **Responsive Design** - Mobile-first Ansatz
- **CI-Integration** - Landkreis Oldenburg Corporate Design

## 🏗️ Architektur

```
frontend/
├── src/
│   ├── components/     # React-Komponenten
│   ├── hooks/         # Custom React Hooks
│   ├── services/      # Service-Klassen
│   ├── types/         # TypeScript-Typen
│   ├── styles/        # CSS-Styles
│   └── pages/         # Seiten-Komponenten
├── public/
│   └── unity/         # Unity WebGL Build
└── dist/              # Build-Ausgabe
```

## 🛠️ Installation

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev

# Build erstellen
npm run build

# Build preview
npm run preview
```

## 🎮 Unity Integration

1. Unity WebGL Build in `public/unity/kaya/` ablegen
2. Erforderliche Dateien:
   - `Build.loader.js`
   - `Build.framework.js`
   - `Build.data`
   - `Build.wasm`
   - `StreamingAssets/` (optional)

## 🔧 Konfiguration

### Environment Variables

```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
VITE_UNITY_PATH=/unity/kaya/Build/
```

### Tailwind CSS

Das Projekt verwendet Tailwind CSS mit Landkreis Oldenburg CI-Farben:

- **Primary**: Teal/Grün (#0F766E)
- **Accent**: Blau (#2563EB)
- **Neutral**: Grau-Palette

## ♿ Accessibility

- **WCAG 2.1 AA/AAA** konform
- **Keyboard Navigation** vollständig unterstützt
- **Screen Reader** optimiert
- **High Contrast** Mode
- **Font Size** Anpassung (100%, 115%, 130%)
- **Simple Language** Toggle
- **Reduced Motion** Support

## 🌐 Mehrsprachigkeit

Unterstützte Sprachen:
- Deutsch (Standard)
- English
- Türkçe
- العربية
- Polski
- Русский

## 📱 Responsive Design

- **Mobile First** Ansatz
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Touch-optimiert** für mobile Geräte
- **Progressive Web App** (PWA) Support

## 🔌 Backend-Integration

### WebSocket-Verbindung

```typescript
const { sendMessage, isConnected } = useWebSocket(sessionId);
```

### Audio-System

```typescript
const { startRecording, stopRecording, textToSpeech } = useAudio();
```

### Unity-Kommunikation

```typescript
const { setEmotion, setSpeaking, playGesture } = useUnity();
```

## 🧪 Testing

```bash
# Linting
npm run lint

# Type-Checking
npm run type-check

# Tests (geplant)
npm run test
```

## 🚀 Deployment

### Vercel (empfohlen)

```bash
# Vercel CLI installieren
npm i -g vercel

# Deployment
vercel --prod
```

### Railway

```bash
# Railway CLI installieren
npm i -g @railway/cli

# Deployment
railway up
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## 📊 Performance

- **Lighthouse Score**: 95+ (Performance, Accessibility, Best Practices)
- **Bundle Size**: < 500KB (gzipped)
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s

## 🔒 Sicherheit

- **Content Security Policy** (CSP) implementiert
- **HTTPS** erforderlich für Production
- **CORS** korrekt konfiguriert
- **XSS-Schutz** durch React

## 🤝 Contributing

1. Fork das Repository
2. Feature-Branch erstellen (`git checkout -b feature/AmazingFeature`)
3. Changes committen (`git commit -m 'Add some AmazingFeature'`)
4. Branch pushen (`git push origin feature/AmazingFeature`)
5. Pull Request erstellen

## 📄 Lizenz

MIT License - siehe [LICENSE](LICENSE) für Details.

## 📞 Support

- **Email**: kaya@landkreis-oldenburg.de
- **Telefon**: 04431 85-0
- **Website**: https://www.oldenburg-kreis.de

## 🗺️ Roadmap

- [ ] PWA-Features erweitern
- [ ] Offline-Modus
- [ ] Erweiterte Unity-Features
- [ ] Voice-Commands
- [ ] Multi-User-Support
- [ ] Analytics-Integration

---

**KAYA Frontend v2.0.0** - Landkreis Oldenburg 2025
