# KAYA Frontend

## 🚀 Schnellstart

```bash
# Dependencies installieren
npm install

# Entwicklungsserver starten
npm run dev

# Frontend läuft auf http://localhost:3000
```

## 📁 Dateien

### Komponenten
- `src/pages/KayaPage.tsx` - Hauptkomponente
- `src/components/Header.tsx` - Header-Komponente
- `src/components/AvatarPane.tsx` - Avatar-Bereich
- `src/components/ChatPane.tsx` - Chat-Bereich

### Services
- `src/services/WebSocketService.ts` - WebSocket-Client
- `src/services/UnityService.ts` - Unity-Integration
- `src/services/AudioService.ts` - Audio-System

### Hooks
- `src/hooks/useWebSocket.ts` - WebSocket-Hook
- `src/hooks/useUnity.ts` - Unity-Hook
- `src/hooks/useAudio.ts` - Audio-Hook

### Styles
- `src/styles/globals.css` - Globale CSS mit CI-Farben

## 🔧 Konfiguration

### Environment Variables
```bash
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
VITE_UNITY_PATH=/unity/kaya/Build/
```

### Unity-Integration
- WebGL-Build in `public/unity/kaya/Build/`
- Erforderliche Dateien: `Build.loader.js`, `Build.framework.js`, `Build.data`, `Build.wasm`

## 🧪 Testing

```bash
# Type-Checking
npm run type-check

# Linting
npm run lint

# Build testen
npm run build
```

## 🌐 Deployment

### Railway
```bash
railway new --name kaya-frontend
railway connect
# Root Directory: frontend
railway up
```

### Docker
```bash
docker build -t kaya-frontend .
docker run -p 3000:3000 kaya-frontend
```

## 📊 Performance

- **Lighthouse Score**: 95+
- **Bundle Size**: < 500KB
- **First Paint**: < 1.5s

## ♿ Accessibility

- WCAG 2.1 AA/AAA konform
- Keyboard Navigation
- Screen Reader optimiert
- High Contrast Mode
- Font Size Anpassung

---

**KAYA Frontend v2.0.0** - 2025