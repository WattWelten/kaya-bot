# KAYA Lokaler Test - Checkliste

## 🎯 Vorbereitung

- [ ] Backend läuft auf Port 3001
- [ ] Frontend läuft auf Port 5173
- [ ] Browser DevTools geöffnet (Console + Network + React DevTools)
- [ ] Mikrofon-Berechtigung erteilt (falls Audio-Test)
- [ ] Keine alten Tab-Fenster (Cache leeren)

## 📱 Frontend-Tests

### ✅ Basis-Tests
- [ ] Frontend lädt ohne Fehler
- [ ] Header mit Logo/Buttons sichtbar
- [ ] KAYA Avatar sichtbar (Three.js Canvas)
- [ ] Chat-Bereich sichtbar
- [ ] Keine Console-Errors oder -Warnings

### 🔗 WebSocket-Tests
- [ ] WebSocket-Status zeigt "Connected"
- [ ] Network-Tab: WebSocket-Verbindung zu localhost:3001
- [ ] Keine "WebSocket closed" Fehler

## 💬 Chat-Tests

### 📝 Text-Messages
- [ ] Nachricht eingeben und senden
- [ ] KAYA antwortet (Response visible)
- [ ] Markdown-Links werden gerendert: [Text](URL)
- [ ] Mehrere Nachrichten im Chat-Verlauf
- [ ] Scroll funktioniert (lange Chats)

### 🎙️ Audio-Chat
- [ ] Mikrofon-Button klicken → Aufnahme startet
- [ ] Aufnahme stoppen → Request wird gesendet
- [ ] Transkription erscheint im Chat
- [ ] KAYA antwortet mit Text
- [ ] Audio-Wiedergabe (falls TTS aktiv)

### 🔊 Audio-Koordination
- [ ] Nur 1 Audio gleichzeitig möglich
- [ ] Chat-Audio hat Priorität > Avatar-Audio
- [ ] Keine Audio-Overlaps

## 👤 Avatar-Tests

### 🎨 Three.js Avatar
- [ ] Avatar lädt (kein "Avatar nicht verfügbar")
- [ ] Kein ErrorBoundary-Fehler
- [ ] Sprech-Animation beim TTS
- [ ] Emotion-Änderungen sichtbar

### 📱 Mobile-Simulation
- [ ] DevTools → Device Toolbar (Ctrl+Shift+M)
- [ ] Mobile Viewport (< 768px)
- [ ] Performance-Tab: 30+ FPS
- [ ] Avatar läuft flüssig

## ⚡ Performance-Tests

### 🔍 React Profiler
- [ ] React DevTools → Profiler → "Start profiling"
- [ ] ChatPane re-rendert NICHT bei jedem Parent-State-Change
- [ ] AvatarPane re-rendert NICHT bei jedem Parent-State-Change
- [ ] AvatarCanvas re-rendert minimal

### 📊 Lighthouse (optional)
- [ ] F12 → Lighthouse-Tab
- [ ] Performance Score > 80
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 4s

## 🐛 Error-Tests

### ❌ Robustheit
- [ ] Backend stoppen → Fehlermeldung erscheint
- [ ] Backend wieder starten → Reconnect funktioniert
- [ ] WebSocket-Timeouts → UI bleibt responsiv
- [ ] Lange Nachrichten (1000+ Zeichen)
- [ ] Spezielle Zeichen (Umlaute, Emojis)

## 📸 Screenshots (optional)

- [ ] DevTools Console (keine Errors)
- [ ] Network-Tab (WebSocket-Connections)
- [ ] React Profiler (wenige Re-Renders)
- [ ] Lighthouse-Report

## ✅ Success Criteria

### Must-Have (Kritisch)
- ✅ Keine Console-Errors
- ✅ WebSocket Connected
- ✅ Chat-Messages funktionieren
- ✅ Avatar lädt korrekt
- ✅ Performance stabil

### Nice-to-Have
- ✅ Audio-Chat funktioniert
- ✅ React Profiler: wenig Re-Renders
- ✅ Mobile Performance gut
- ✅ Lighthouse Score > 80

## 🐞 Bekannte Issues (Notizen)

_Zum Notieren von Fehlern während der Tests:_

Issue 1: _______________________
Issue 2: _______________________
Issue 3: _______________________

## 📝 Test-Datum

**Datum:** _______________
**Tester:** _______________
**Umgebung:** Windows + Chrome/Firefox
**Backend-Version:** Server v2.0.0
**Frontend-Version:** Frontend v2.0.1

