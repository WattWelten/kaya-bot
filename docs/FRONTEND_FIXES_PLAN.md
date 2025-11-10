# Frontend Fixes Plan - Missing Functionality

## Probleme identifiziert

### 1. Sprachauswahl funktioniert nicht
- Header.tsx: `handleLanguageChange` setzt nur lokalen State
- Backend-Restaurant wird nicht benachrichtigt
- Frontend-Texte ändern sich nicht

### 2. Info-Button (i) ohne Funktion
- Header.tsx: TODO-Kommentar vorhanden
- Kein Info-Dialog implementiert

### 3. Upload-Button (Büroklammer) ohne Funktion
- ChatPane.tsx: TODO-Kommentar vorhanden
- Kein File-Upload implementiert

### 4. Design fehlt komplett
- Kein Glassmorphism
- Keine Animationen
- Keine visuellen Effekte

---

## Lösung - Phase 1: Funktionalität

### Fix 1: Sprachauswahl

**Datei:** `frontend/src/components/Header.tsx`

**Problem:** Nur lokaler State wird geändert, Backend wird nicht benachrichtigt.

**Lösung:**
```typescript
const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
  const newLanguage = event.target.value;
  
  // 1. Lokaler State aktualisieren
  onLanguageChange(newLanguage);
  
  // 2. Backend benachrichtigen (falls benötigt)
  // fetch('/api/language', { method: 'POST', body: JSON.stringify({ language: newLanguage }) });
  
  // 3. Frontend-Texte laden (über Context oder i18n)
  // setCurrentLanguage(newLanguage);
};
```

---

### Fix 2: Info-Dialog

**Datei:** `frontend/src/components/InfoDialog.tsx` (NEU erstellen)

**Inhalt:**
```typescript
import React, { useState } from 'react';
import { X } from 'lucide-react';

interface InfoDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoDialog: React.FC<InfoDialogProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-strong">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-lc-primary-700">Über KAYA</h2>
          <button onClick={onClose} className="btn-ghost">
            <X className="size-5" />
          </button>
        </div>
        
        <div className="space-y-4 text-lc-neutral-700">
          <p>
            KAYA ist Ihr digitaler Assistent für alle Anliegen rund um den Landkreis Oldenburg.
          </p>
          
          <h3 className="font-semibold text-lc-primary-600">Funktionen:</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>Bürgerservices und Anträge</li>
            <li>Terminbuchung</li>
            <li>KFZ-Anliegen</li>
            <li>Soziale Leistungen</li>
            <li>Kreistagsinformationen</li>
          </ul>
          
          <h3 className="font-semibold text-lc-primary-600">Hinweise:</h3>
          <p className="text-sm italic text-lc-neutral-600">
            KAYA nutzt öffentliche Informationen des Landkreises Oldenburg. 
            Keine Rechtsberatung. Notfälle: 112 / 110.
          </p>
        </div>
        
        <button onClick={onClose} className="btn-solid w-full mt-6">
          Schließen
        </button>
      </div>
    </div>
  );
};
```

**Integration in Header.tsx:**
```typescript
const [showInfoDialog, setShowInfoDialog] = useState(false);

<button
  className="btn-ghost"
  aria-label="Hilfe und Hinweise"
  onClick={() => setShowInfoDialog(true)}
>
  <Info className="size-5" />
</button>

<InfoDialog isOpen={showInfoDialog} onClose={() => setShowInfoDialog(false)} />
```

---

### Fix 3: Upload-Funktionalität

**Datei:** `frontend/src/components/ChatPane.tsx`

**Problem:** Upload-Button hat keine Funktion.

**Lösung:**
```typescript
const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // Validierung
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    alert('Datei zu groß. Maximal 5MB.');
    return;
  }

  // Datei-Info an User anzeigen
  const userMessage: Message = {
    id: `file_${Date.now()}`,
    content: `📎 ${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
    sender: 'user',
    timestamp: new Date(),
    type: 'file'
  };

  setMessages(prev => [...prev, userMessage]);

  // TODO: Backend-Upload (falls implementiert)
  // sendFileToBackend(file);
};
```

---

## Lösung - Phase 2: Design-Verbesserungen

### Design-Elemente fehlen

Schauen wir uns die vorhandenen Styles an:

**Datei:** `frontend/src/styles/globals.css`

**Problem:** Design ist minimal, keine "wow"-Effekte.

**Lösung - zu implementieren:**
1. Glassmorphism für Chat-Bubbles
2. Animierter Hintergrund
3. Hover-Effekte
4. Moderne Schatten und Übergänge

**Aber:** Diese Styles sind bereits in `globals.css` vorhanden!

**Prüfen ob sie angewendet werden:**
```bash
grep -n "glass\|animated-background\|message-animate" frontend/src/components/ChatPane.tsx
```

---

## Empfehlung

**Priorität:**

1. **Info-Dialog erstellen** (15 Min)
2. **Upload-Handler implementieren** (30 Min)
3. **Sprachauswahl-Fix** (Backend-Integration, 45 Min)
4. **Design prüfen** (sind Styles bereits da?)

**Alternative:**
Minimal-Fix:
- Info-Dialog: Einfacher Dialog mit i18n-Texten
- Upload: Lokale Validierung + Toast-Nachricht (ohne Backend)
- Sprache: Visuelle Feedback (keine Backend-Integration)

Welche Variante möchten Sie?

1. **Vollständig:** Alle Funktionen mit Backend-Integration
2. **Minimal:** Visuelle Feedback ohne Backend-Integration
3. **Nur Design:** Design-Verbesserungen prüfen und verbessern


