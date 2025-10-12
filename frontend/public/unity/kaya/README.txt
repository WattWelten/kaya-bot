Unity WebGL Build für KAYA Avatar
=====================================

Lege hier den Unity WebGL Build (Avatar Neo) ab:

Erforderliche Dateien:
- Build.loader.js          (Unity Loader Script)
- Build.framework.js       (Unity Framework)
- Build.data               (Unity Data File)
- Build.wasm               (WebAssembly Binary)
- StreamingAssets/         (Streaming Assets Ordner, falls vorhanden)

Build-Konfiguration:
- Target: WebGL
- Compression: Brotli (empfohlen) oder Gzip
- Memory: 512MB (empfohlen)
- Code Stripping: Minimal (für Debugging)

Pfade in src/pages/KayaPage.tsx anpassen falls nötig.

Hinweise:
- Stelle sicher, dass der Server korrekt konfiguriert ist für .wasm Dateien
- Content-Type: application/wasm
- Content-Encoding: br (für Brotli) oder gzip
- CORS-Header müssen gesetzt sein

Performance-Tipps:
- Verwende Texture Compression
- Reduziere Polygon-Count
- Optimiere Shader
- Verwende LOD-Systeme

Troubleshooting:
- Browser-Konsole auf Fehler prüfen
- Network-Tab für fehlgeschlagene Requests prüfen
- Unity-Logs in Browser-Konsole anzeigen
