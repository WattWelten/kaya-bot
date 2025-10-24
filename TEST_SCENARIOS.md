# KAYA Test-Szenarien

## 🧪 Umfassende Test-Szenarien für KAYA Production

Dieses Dokument beschreibt alle Test-Szenarien für das KAYA-System auf Railway.

---

## 📋 Test-Übersicht

### **Test-Kategorien:**
1. **Character Conformity** - KAYA's Persönlichkeit und Verhalten
2. **Agent Routing** - Automatische Weiterleitung zu spezifischen Agenten
3. **Empathetic Responses** - Emotionale und empathische Reaktionen
4. **Language Switching** - Sprachwechsel und Konsistenz
5. **WebSocket Communication** - Echtzeit-Kommunikation
6. **OpenAI Integration** - LLM-Integration und Fallback
7. **Performance & Stability** - Performance und Stabilität
8. **Accessibility** - Barrierefreiheit und Usability

---

## 🎭 Test-Szenario 1: Character Conformity

### **Ziel:** KAYA's Persönlichkeit und norddeutsche Tonalität testen

### **Test-Cases:**

#### **1.1 Begrüßung und Persönlichkeit**
```
User: "Hallo"
Expected: Freundliche, norddeutsche Begrüßung mit "Moin" oder ähnlich
Test: ✅ KAYA begrüßt freundlich und norddeutsch
```

#### **1.2 Norddeutsche Tonalität**
```
User: "Ich brauche Hilfe"
Expected: Direkte, hilfsbereite Antwort ohne Floskeln
Test: ✅ KAYA antwortet direkt und hilfsbereit
```

#### **1.3 5-Schritte-Antwortprinzip**
```
User: "Wie bekomme ich einen Führerschein?"
Expected: Strukturierte Antwort mit klaren Schritten
Test: ✅ KAYA gibt strukturierte, schrittweise Antwort
```

### **Erwartete Antworten:**
- Freundliche, direkte Kommunikation
- Keine wiederholenden Floskeln
- Strukturierte, hilfreiche Antworten
- Norddeutsche Tonalität erkennbar

---

## 🎯 Test-Szenario 2: Agent Routing

### **Ziel:** Automatische Weiterleitung zu spezifischen Agenten testen

### **Test-Cases:**

#### **2.1 Bürgerdienste Agent**
```
User: "Ich brauche eine Meldebescheinigung"
Expected: Weiterleitung zu Bürgerdienste-Agent
Test: ✅ KAYA erkennt Intention und leitet weiter
```

#### **2.2 Ratsinfo Agent**
```
User: "Wann ist die nächste Kreistagssitzung?"
Expected: Weiterleitung zu Ratsinfo-Agent
Test: ✅ KAYA erkennt politische Anfrage
```

#### **2.3 Stellenportal Agent**
```
User: "Gibt es offene Stellen im Landkreis?"
Expected: Weiterleitung zu Stellenportal-Agent
Test: ✅ KAYA erkennt Stellenanfrage
```

#### **2.4 Kontakte Agent**
```
User: "Wie kann ich das Bürgerbüro erreichen?"
Expected: Weiterleitung zu Kontakte-Agent
Test: ✅ KAYA erkennt Kontaktanfrage
```

### **Erwartete Antworten:**
- Korrekte Intention-Erkennung
- Spezifische Agent-Weiterleitung
- Relevante Informationen vom jeweiligen Agent

---

## 💝 Test-Szenario 3: Empathetic Responses

### **Ziel:** Emotionale und empathische Reaktionen testen

### **Test-Cases:**

#### **3.1 Verzweiflung erkennen**
```
User: "Ich bin verzweifelt, ich weiß nicht weiter"
Expected: Empathische, unterstützende Antwort
Test: ✅ KAYA erkennt Emotion und reagiert empathisch
```

#### **3.2 Hilflosigkeit unterstützen**
```
User: "Ich fühle mich hilflos"
Expected: Ermutigende, lösungsorientierte Antwort
Test: ✅ KAYA bietet konkrete Hilfe an
```

#### **3.3 Frustration verstehen**
```
User: "Das ist so frustrierend!"
Expected: Verständnisvolle, beruhigende Antwort
Test: ✅ KAYA zeigt Verständnis und bietet Lösungen
```

### **Erwartete Antworten:**
- Emotionale Zustände werden erkannt
- Empathische, unterstützende Reaktionen
- Konkrete Hilfe und Lösungsvorschläge
- Beruhigende, ermutigende Kommunikation

---

## 🌍 Test-Szenario 4: Language Switching

### **Ziel:** Sprachwechsel und Konsistenz testen

### **Test-Cases:**

#### **4.1 Expliziter Sprachwechsel**
```
User: "Hello, can you help me?"
Expected: Wechsel zu Englisch, konsistente englische Antworten
Test: ✅ KAYA wechselt zu Englisch und bleibt konsistent
```

#### **4.2 Gemischte Sprachen**
```
User: "Ich brauche help with my passport"
Expected: Erkennung der Hauptsprache, angemessene Antwort
Test: ✅ KAYA erkennt Hauptsprache und antwortet angemessen
```

#### **4.3 Sprachkonsistenz**
```
User: "Moin" → "Hello" → "Wie geht's?"
Expected: Konsistente Sprachbeibehaltung
Test: ✅ KAYA behält die gewählte Sprache bei
```

### **Erwartete Antworten:**
- Korrekte Spracherkennung
- Konsistente Sprachbeibehaltung
- Angemessene Reaktion auf Sprachwechsel

---

## 🔌 Test-Szenario 5: WebSocket Communication

### **Ziel:** Echtzeit-Kommunikation testen

### **Test-Cases:**

#### **5.1 WebSocket-Verbindung**
```
Action: Frontend öffnen
Expected: WebSocket-Verbindung erfolgreich
Test: ✅ WebSocket verbindet sich automatisch
```

#### **5.2 Echtzeit-Nachrichten**
```
Action: Nachricht senden
Expected: Sofortige Antwort über WebSocket
Test: ✅ Nachrichten werden in Echtzeit übertragen
```

#### **5.3 Verbindungsabbruch und Reconnect**
```
Action: Internet-Verbindung unterbrechen
Expected: Automatischer Reconnect
Test: ✅ WebSocket verbindet sich automatisch neu
```

### **Erwartete Antworten:**
- Stabile WebSocket-Verbindung
- Echtzeit-Nachrichtenübertragung
- Automatischer Reconnect bei Verbindungsabbruch

---

## 🤖 Test-Szenario 6: OpenAI Integration

### **Ziel:** LLM-Integration und Fallback testen

### **Test-Cases:**

#### **6.1 OpenAI aktiviert**
```
User: "Erkläre mir komplexe Verwaltungsprozesse"
Expected: Detaillierte, intelligente Antwort von OpenAI
Test: ✅ KAYA nutzt OpenAI für komplexe Anfragen
```

#### **6.2 OpenAI Fallback**
```
Action: OpenAI API Key entfernen
Expected: Fallback zu lokaler Antwortgenerierung
Test: ✅ KAYA funktioniert auch ohne OpenAI
```

#### **6.3 Circuit Breaker**
```
Action: OpenAI Service simulieren (Fehler)
Expected: Circuit Breaker aktiviert, Fallback aktiv
Test: ✅ Circuit Breaker verhindert Kaskadenfehler
```

### **Erwartete Antworten:**
- Intelligente Antworten mit OpenAI
- Robuster Fallback ohne OpenAI
- Circuit Breaker verhindert Systemausfälle

---

## ⚡ Test-Szenario 7: Performance & Stability

### **Ziel:** Performance und Stabilität testen

### **Test-Cases:**

#### **7.1 Response Time**
```
Action: Mehrere Anfragen gleichzeitig
Expected: Antwortzeit < 2 Sekunden
Test: ✅ Antwortzeiten sind akzeptabel
```

#### **7.2 Memory Usage**
```
Action: Längerer Chat-Verlauf
Expected: Speicherverbrauch stabil
Test: ✅ Keine Memory Leaks
```

#### **7.3 Error Handling**
```
Action: Ungültige Anfragen senden
Expected: Graceful Error Handling
Test: ✅ Fehler werden elegant behandelt
```

### **Erwartete Antworten:**
- Schnelle Antwortzeiten
- Stabile Performance
- Robuste Fehlerbehandlung

---

## ♿ Test-Szenario 8: Accessibility

### **Ziel:** Barrierefreiheit und Usability testen

### **Test-Cases:**

#### **8.1 Keyboard Navigation**
```
Action: Nur Tastatur verwenden
Expected: Vollständige Navigation möglich
Test: ✅ Alle Funktionen per Tastatur erreichbar
```

#### **8.2 Screen Reader**
```
Action: Screen Reader aktivieren
Expected: Alle Inhalte lesbar
Test: ✅ Screen Reader kann alle Inhalte lesen
```

#### **8.3 High Contrast**
```
Action: High Contrast Mode aktivieren
Expected: Alle Elemente sichtbar
Test: ✅ High Contrast funktioniert korrekt
```

### **Erwartete Antworten:**
- Vollständige Tastatur-Navigation
- Screen Reader Kompatibilität
- High Contrast Support

---

## 🚀 Test-Ausführung

### **Lokale Tests:**

```bash
# Backend starten
cd D:\Landkreis\server
npm start

# Frontend starten
cd D:\Landkreis\frontend
npm run dev

# Tests ausführen
# Browser öffnen: http://localhost:5173
```

### **Railway Production Tests:**

```bash
# Health Check
curl https://kaya.wattweiser.com/health

# WebSocket Status
curl https://kaya.wattweiser.com/ws/status

# Frontend öffnen
# Browser: https://kaya.wattweiser.com
```

---

## 📊 Test-Metriken

### **Performance-Metriken:**
- **Response Time:** < 2 Sekunden
- **WebSocket Latency:** < 100ms
- **Memory Usage:** < 100MB
- **CPU Usage:** < 50%

### **Quality-Metriken:**
- **Character Conformity:** 95%+
- **Agent Routing Accuracy:** 90%+
- **Empathy Recognition:** 85%+
- **Language Consistency:** 95%+

### **Accessibility-Metriken:**
- **Keyboard Navigation:** 100%
- **Screen Reader:** 100%
- **High Contrast:** 100%
- **WCAG Compliance:** AA Level

---

## 🐛 Debugging

### **Backend-Logs prüfen:**
```bash
# Railway Logs
railway logs --service backend

# Lokale Logs
cd D:\Landkreis\server
npm start
```

### **Frontend-Logs prüfen:**
```bash
# Browser DevTools → Console
# Network Tab für API-Calls
# WebSocket Tab für WS-Verbindung
```

### **WebSocket-Debugging:**
```bash
# WebSocket Status
curl https://kaya.wattweiser.com/ws/status

# WebSocket Test
curl https://kaya.wattweiser.com/ws/test
```

---

## ✅ Test-Checkliste

- [ ] Character Conformity Tests durchgeführt
- [ ] Agent Routing Tests durchgeführt
- [ ] Empathetic Responses Tests durchgeführt
- [ ] Language Switching Tests durchgeführt
- [ ] WebSocket Communication Tests durchgeführt
- [ ] OpenAI Integration Tests durchgeführt
- [ ] Performance & Stability Tests durchgeführt
- [ ] Accessibility Tests durchgeführt
- [ ] Alle Metriken erfüllt
- [ ] Debugging-Logs geprüft
- [ ] Production-Deployment erfolgreich

---

## 📚 Weitere Dokumentation

- **Environment Setup:** `ENV_SETUP_PRODUCTION.md`
- **Railway Deployment:** `RAILWAY_DEPLOYMENT_GUIDE.md`
- **Production-Ready:** `PRODUCTION_READY_DOCUMENTATION.md`