# Frontend Test Checklist - Manuelle Tests

## Phase 2: Frontend-Tests

**Status:** BEREIT ZUM TESTEN
**URL lokal:** http://localhost:5173
**URL Production:** https://app.kaya.wattweiser.com

---

## 2.1 Chat-UI Tests (8 Checkpoints)

- [ ] 1. Begruessung erscheint korrekt: "Moin! Ich bin KAYA, die KI-basierte Assistenz des Landkreis Oldenburg. Wie kann ich dir helfen?"
- [ ] 2. Nachricht senden funktioniert (Enter oder Button)
- [ ] 3. User-Nachricht erscheint im Chat (rechts, weiss)
- [ ] 4. KAYA-Antwort erscheint mit korrektem Charakter (links, farbig)
- [ ] 5. Markdown-Links werden als klickbare Buttons gerendert (nicht als Text)
- [ ] 6. Quellen-Footer sind collapsible (Zeilenumbruch-Button funktioniert)
- [ ] 7. Keine Metadaten sichtbar (Emotion, Urgency sind versteckt)
- [ ] 8. Scrolling funktioniert bei langen Chats (keine Layout-Brüche)

**Notizen:**
- 
- 

---

## 2.2 Voice-Dialog Tests (14 Checkpoints) - KRITISCH

### Happy Path (8 Checkpoints)
- [ ] 9. Voice-Button erscheint korrekt (Mikrofon-Icon rechts im Input)
- [ ] 10. Klick startet Aufnahme (Icon wechselt zu Pulsing Mic)
- [ ] 11. VoiceStatusBar erscheint: "Ich hoere zu..." (rote Bar oben)
- [ ] 12. Auto-Stop nach 1.5s Stille funktioniert
- [ ] 13. Processing-State (Spinner-Icon) erscheint
- [ ] 14. Transkription erscheint im Chat als User-Nachricht
- [ ] 15. KAYA-Antwort erscheint im Chat
- [ ] 16. Audio wird automatisch abgespielt

### States & Feedback (3 Checkpoints)
- [ ] 17. Playing-State (Volume-Icon) erscheint waehrend Audio
- [ ] 18. Nach Audio: Zurueck zu Idle-State (Mikrofon-Icon)
- [ ] 19. Abbrechen-Button funktioniert (in VoiceStatusBar)

### Error-Handling (3 Checkpoints)
- [ ] 20. Mikrofon verweigert → Tooltip: "Mikrofon-Zugriff verweigert. Bitte erlauben."
- [ ] 21. Aufnahme zu kurz (< 500ms) → Error-Message: "Aufnahme zu kurz. Bitte erneut versuchen."
- [ ] 22. API-Fehler → Error-Message: "Fehler beim Audio-Upload. Bitte erneut versuchen."

**Notizen:**
- 
- 

---

## 2.3 Responsive Design Tests (7 Checkpoints)

### Mobile (320px-767px)
- [ ] 23. Layout: Chat oben (volle Breite), Avatar unten (klein, 20vh)
- [ ] 24. Avatar-Placeholder zeigt norddeutschen Humor: "Moin! Avatar macht grad Pause - Dat kriegen wir auch so hin!"
- [ ] 25. Quick-Actions auf Mobile unsichtbar (unteres z-Breakpoint)
- [ ] 26. Input-Area responsive (Mikrofon + Send-Button passen)

### Tablet (768px-1023px)
- [ ] 27. Chat 2/3 Breite, Avatar 1/3 Breite (nebeneinander)

### Desktop (1024px+)
- [ ] 28. Chat 3/5 Breite, Avatar 2/5 Breite
- [ ] 29. Keine horizontalen Scrollbars auf allen Groessen

**Notizen:**
- 
- 

---

## 2.4 Quick-Actions Tests (4 Checkpoints)

### Initial Suggestions
- [ ] 30. Initial-Suggestions erscheinen: KFZ zulassen, Wohnsitz anmelden, Termin buchen, Buergergeld

### Kontext-basierte Suggestions
- [ ] 31. Nach KFZ-Frage: KFZ-Termin, Kosten?, Unterlagen?, Online?
- [ ] 32. Suggestions verschwinden auf Mobile (unter md-Breakpoint)

### Funktionalitaet
- [ ] 33. Klick auf Suggestion sendet Query automatisch

**Notizen:**
- 
- 

---

## 2.5 Accessibility Tests (7 Checkpoints)

### Keyboard-Navigation
- [ ] 34. Tab-Navigation: Input → Voice-Button → Send-Button → Quick-Actions
- [ ] 35. Enter sendet Nachricht (auch aus Quick-Actions)

### ARIA & Screen-Reader
- [ ] 36. ARIA-Labels vorhanden (Voice-Button, Send-Button, Input)
- [ ] 37. Screen-Reader kann Chat vorlesen (Navigation VoiceOver/NVDA)

### Design
- [ ] 38. Hoher Kontrast funktioniert (Text gut lesbar)
- [ ] 39. Grosse Schrift funktioniert (Zoom 200% noetig)

### Escape-Handling
- [ ] 40. Escape schliesst Dialoge/Tooltips (falls vorhanden)

**Notizen:**
- 
- 

---

## Test-Ergebnisse

**Tester:** _________________
**Datum:** _________________
**Browser:** _________________
**Version:** _________________

**Gesamt-Ergebnis:** __ / 40 Checkpoints bestanden

**Gefundene Bugs:**
- 
- 

**Screenshots:**
- Screenshot_Chat.jpg
- Screenshot_Voice.jpg
- Screenshot_Mobile.jpg

---

## Naechste Schritte

- [ ] Bugs dokumentieren
- [ ] Screenshots speichern
- [ ] Production-Tests durchfuehren

