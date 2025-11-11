# Railway Auto-Detect Problem - Fix

## 🔍 Problem

**Symptom:** Railway verwendet Railpack/Nixpacks statt Dockerfile, obwohl `railway.toml` `builder = "DOCKERFILE"` enthält.

**Ursache:** Im Railway Dashboard ist "Auto-detect" als Builder gesetzt, was die `railway.toml` überschreibt.

---

## ✅ Lösung

### Schritt 1: railway.toml Dateien angleichen

**Beide Services müssen konsistent konfiguriert sein:**

#### kaya-api/railway.toml:
```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"
```

#### kaya-frontend/railway.toml:
```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"
```

**Status:** ✅ Beide Dateien sind jetzt konsistent

### Schritt 2: Root-Level railway.toml

**railway.toml (Root):**
```toml
[build]
builder = "DOCKERFILE"
```

**Zweck:** Verhindert, dass Railway auf Projekt-Ebene Railpack/Nixpacks verwendet

**Status:** ✅ Root railway.toml aktualisiert

### Schritt 3: Railway Dashboard (MANUELL)

**WICHTIG:** Die Dashboard-Einstellungen überschreiben die `railway.toml`!

**Für kaya-api:**
1. Railway Dashboard → Service `kaya-api`
2. Settings → **Build**
3. Builder: Ändere von "Auto-detect" auf **"Dockerfile"**
4. Dockerfile Path: Setze auf `Dockerfile`
5. Speichere

**Für kaya-frontend:**
1. Service `kaya-frontend`
2. Settings → **Build**
3. Builder: Ändere von "Auto-detect" auf **"Dockerfile"**
4. Dockerfile Path: Setze auf `Dockerfile`
5. Speichere

---

## 📋 Warum beide notwendig sind

1. **railway.toml:** Wird von Railway gelesen, aber kann überschrieben werden
2. **Dashboard-Einstellungen:** Überschreiben die `railway.toml` wenn "Auto-detect" aktiv ist

**Lösung:** Beide müssen auf "Dockerfile" gesetzt sein!

---

## 🔧 Checkliste

- [x] kaya-api/railway.toml: `builder = "DOCKERFILE"` + `dockerfilePath = "Dockerfile"`
- [x] kaya-frontend/railway.toml: `builder = "DOCKERFILE"` + `dockerfilePath = "Dockerfile"`
- [x] Root railway.toml: `builder = "DOCKERFILE"`
- [ ] Railway Dashboard kaya-api: Builder auf "Dockerfile" (nicht Auto-detect)
- [ ] Railway Dashboard kaya-frontend: Builder auf "Dockerfile" (nicht Auto-detect)

---

## 🎯 Erwartetes Ergebnis

Nach den Änderungen:
1. Railway verwendet Dockerfile statt Railpack/Nixpacks
2. Build startet korrekt
3. Docker-Build-Logs erscheinen

**WICHTIG:** Die Dashboard-Einstellungen müssen manuell geändert werden - das kann nicht automatisiert werden!


