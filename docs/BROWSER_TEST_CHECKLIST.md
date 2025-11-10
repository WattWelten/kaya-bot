# KAYA Browser-Test Checklist

**Für Manuelle Tests durch den User**

---

## TESTEN AUF: https://app.kaya.wattweiser.com

---

## VISUELLE PRÜFUNG

### Design & UI
- [ ] Glassmorphism-Effekt sichtbar (Chat-Bubbles transluzent)
- [ ] Animierter Hintergrund läuft (Blob-Animationen)
- [ ] Farben korrekt (Teal/Türkis Primär, Gold/Rot Akzente)
- [ ] Header mit Logo und Buttons sichtbar
- [ ] Chat-Bereich rechts sichtbar
- [ ] Avatar-Placeholder links sichtbar (KAYA-Branding)

---

## BUTTON-FUNKTIONALITÄT

### Header-Buttons
- [ ] Logo klickbar (kein Link nötig, nur Visuelles)
- [ ] Language-Toggle funktioniert
- [ ] Accessibility-Toolbar öffnet sich beim Klick

### Accessibility-Toolbar
- [ ] Simple-Language-Toggle aktiviert größere Schrift?
- [ ] Font-Size-Toggle ändert Schriftgröße (100%/115%/130%)?
- [ ] High-Contrast-Toggle ändert Farben zu Schwarz-Weiß?
- [ ] Reduced-Motion-Toggle deaktiviert Animationen?
- [ ] Reset-Button setzt alle Einstellungen zurück?

### ChatPane-Buttons
- [ ] Send-Button sendet Nachricht?
- [ ] Mikrofon-Button startet Aufnahme (Browser fragt Permission)?
- [ ] Audio-Aufnahme funktioniert (visueller Pulse-Indikator)?
- [ ] Quick-Action-Buttons (4 Stück: KFZ, Bürgergeld, Kreistag, Termin) senden Messages?

---

## MESSAGE-FUNKTIONALITÄT

### Text-Chat
- [ ] Nachricht eingeben und senden
- [ ] KAYA antwortet (Response kommt nach < 2 Sekunden)?
- [ ] Response enthält Markdown-Links (klickbar)?
- [ ] Links haben Hover-Effekt (Icon bewegt sich)?
- [ ] Quellen-Fußzeile am Ende sichtbar?

### Link-Rendering
- [ ] Markdown-Links `[Text](URL)` werden zu klickbaren Buttons?
- [ ] Links öffnen in neuem Tab (target="_blank")?
- [ ] External-Link-Icon sichtbar neben Link-Text?

### Quellen-Fußzeile
- [ ] Format: "Quelle: [Bereich] • Stand: MM/JJJJ"?
- [ ] Footer in separater Box mit Border-Separator?
- [ ] Grau und italic gestylt?

---

## E2E-SZENARIEN

### Szenario 1: Text-Chat
**Schritte:**
1. Öffne https://app.kaya.wattweiser.com
2. Tippe: "Ich brauche einen Führerschein"
3. Klicke Send

**Erwartetes Ergebnis:**
- ✅ KAYA antwortet strukturiert (E-Z-O-Format)
- ✅ Mindestens 1 klickbarer Link vorhanden
- ✅ Quellen-Fußzeile am Ende
- ✅ Response-Länge: 80-220 Tokens (ca. 200-500 Zeichen)

---

### Szenario 2: Audio-Chat
**Schritte:**
1. Klicke Mikrofon-Button
2. Erlaube Mikrofon-Zugriff
3. Sprich: "Wo beantrage ich Bürgergeld?"
4. Stoppe Aufnahme
5. Warte auf Audio-Response

**Erwartetes Ergebnis:**
- ✅ Transkription erscheint als User-Message
- ✅ KAYA antwortet (Text + Audio)
- ✅ Audio-Playback funktioniert
- ✅ Dana-Voice hörbar

---

### Szenario 3: Multi-Turn-Conversation
**Schritte:**
1. Sende: "Moin, ich bin Michael"
2. Sende: "Ich brauche Hilfe beim Bauantrag"
3. Sende: "Was kostet das?"

**Erwartetes Ergebnis:**
- ✅ KAYA erkennt Namen "Michael"
- ✅ KAYA nutzt Namen in Folgenachrichten ("Michael, für dein Bauvorhaben...")
- ✅ KAYA erinnert sich an Bauantrag-Thema
- ✅ "Was kostet das?" wird im Kontext von Bauantrag beantwortet

---

## ACCESSIBILITY-FEATURES

### Keyboard-Navigation
- [ ] Tab-Order logisch (Header → Chat → Input → Send)?
- [ ] Alle Buttons mit Tab erreichbar?
- [ ] Focus-Indicator sichtbar?
- [ ] Enter sendet Nachricht?

### Screen-Reader-Tests
- [ ] Orca (Linux) oder NVDA (Windows) installieren
- [ ] Alle Texte werden vorgelesen?
- [ ] Buttons werden als "Button" erkannt?
- [ ] Links werden als "Link" erkannt?

---

## RESPONSIVE DESIGN

### Desktop (>1024px)
- [ ] Avatar links, Chat rechts (Grid-Layout)?
- [ ] Voller Screen genutzt?

### Tablet (768-1024px)
- [ ] Layout passt sich an?
- [ ] Beide Bereiche sichtbar?

### Mobile (<768px)
- [ ] Stacked Layout (Avatar oben, Chat unten)?
- [ ] Alle Buttons erreichbar?
- [ ] Input-Feld sichtbar?

---

## FEHLER-TESTS

### Negative Tests
- [ ] Leere Nachricht senden → Nichts passiert?
- [ ] Sehr lange Nachricht → Verarbeitet?
- [ ] Sonderzeichen (Emojis, Umlaute) → Korrekt verarbeitet?

### WebSocket-Verbindung
- [ ] Browser DevTools → Network → WS
- [ ] WebSocket verbunden?
- [ ] Messages gesendet/empfangen?

---

## CONSOLE-LOGS PRÜFEN

**Browser DevTools → Console:**
- [ ] Keine TypeScript-Errors?
- [ ] WebSocket "Connected" Message?
- [ ] Link-Klicks loggen ("🔗 Link geklickt: URL")?

---

## PRODUKTIONS-SPEZIFIK

### Railway-Domains prüfen
- [ ] Frontend: https://app.kaya.wattweiser.com lädt?
- [ ] Backend: https://api.kaya.wattweiser.com/health antwortet?
- [ ] WebSocket: wss://api.kaya.wattweiser.com/ws verbindet?

---

## BUG-REPORTING

**Wenn Probleme gefunden:**

1. **Screenshot erstellen**
2. **Browser-Console-Logs kopieren**
3. **Network-Tab-Analyse**
4. **Beschreibung des Schritts**

**Format:**
```
Problem: [Kurze Beschreibung]
Browser: Chrome/Firefox/Safari + Version
Schritte: [Schritt-für-Schritt]
Erwartet: [Was sollte passieren]
Tatsächlich: [Was passiert]
Console-Logs: [Falls vorhanden]
```

---

**Erfolgskriterien:** Alle Checks ✅ → Production-Ready

