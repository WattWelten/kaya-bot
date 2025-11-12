# Problem: Build startet nicht nach Snapshot-Unpacking

## Aktueller Status

### Beobachtungen:
1. ✅ Snapshot wird erfolgreich empfangen (233 MB)
2. ✅ Snapshot wird erfolgreich analysiert
3. ✅ Snapshot wird erfolgreich hochgeladen
4. ✅ Snapshot wird erfolgreich abgerufen
5. ✅ Snapshot wird erfolgreich entpackt (1.4 GB)
6. ✅ Build wird geplant: "scheduling build on Metal builder"
7. ❌ **KEINE Docker Build-Logs erscheinen**
8. ❌ **Build startet nicht**

## Vergleich mit funktionierendem Commit

### Funktionierender Commit (7ce7c57):
- Verwendete **NIXPACKS** Builder (nicht Dockerfile)
- `frontend/railway.json` mit `"builder": "NIXPACKS"`
- Keine Dockerfiles vorhanden
- `.railwayignore` ignorierte Dockerfile explizit

### Aktueller Stand:
- Verwendet **DOCKERFILE** Builder
- `railway.toml` Dateien mit `builder = "DOCKERFILE"`
- Dockerfiles vorhanden
- Root `railway.toml` mit `builder = "DOCKERFILE"`

## Mögliche Ursachen

### 1. Root railway.toml überschreibt Service-Konfiguration
Die Root `railway.toml` hat:
```toml
[build]
builder = "DOCKERFILE"
```

Dies könnte die Service-spezifischen `railway.toml` Dateien überschreiben oder verwirren.

### 2. Railway erkennt Dockerfiles nicht richtig
Trotz expliziter Konfiguration könnte Railway Probleme haben, die Dockerfiles zu finden oder zu verwenden.

### 3. Builder-Konfiguration inkonsistent
Die Kombination aus Root `railway.toml` und Service `railway.toml` könnte zu Konflikten führen.

## Empfohlene Lösung

### Option 1: Root railway.toml entfernen oder anpassen
Die Root `railway.toml` sollte keine `[build]` Section haben, da jeder Service seine eigene hat.

### Option 2: Zurück zu NIXPACKS (wie funktionierend)
Da der funktionierende Commit NIXPACKS verwendete, könnte dies die zuverlässigste Lösung sein.

### Option 3: Railway Dashboard Einstellungen prüfen
Möglicherweise müssen die Builder-Einstellungen im Railway Dashboard manuell angepasst werden.

## Nächste Schritte

1. Root `railway.toml` anpassen (keine `[build]` Section)
2. Oder: Zurück zu NIXPACKS wechseln
3. Railway Dashboard Einstellungen überprüfen

