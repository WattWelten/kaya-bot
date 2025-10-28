# 📋 KAYA Avatar-Projekt - ChatGPT Dokumentation

## 🎯 Kontext

Ich arbeite an einem virtuellen Assistenten "KAYA" (Landkreis Oldenburg) mit React Frontend, Node.js Backend und Babylon.js für einen 3D-Avatar. **Das Problem: Der Avatar wird aktuell nicht korrekt gerahmt und steht im falschen Winkel.**

---

## 🖼️ Aktuelle Situation (Screenshot-Beschreibung)

Der Avatar erscheint im Screenshot:
- **Profil-Ansicht** (seitlich, zur Kamera schauend)
- **Nicht nah genug** (zu viel Luft um Kopf/Schultern)
- **Falsche Position** (Avatar ist in der Mitte positioniert, sollte aber leicht nach rechts gedreht sein, um zur Kamera zu blicken)
- **Chat-Fade** funktioniert technisch, aber das Layout wirkt nicht perfekt

---

## 📁 Projekt-Struktur

```
D:\Landkreis\
├── frontend\                  (React + Vite + Tailwind)
│   ├── src\
│   │   ├── components\
│   │   │   └── BabylonAvatar.tsx  ← Fokus: Avatar-Rendering
│   │   ├── pages\
│   │   │   └── KayaPage.tsx   ← Layout-Container
│   │   ├── styles\
│   │   │   └── globals.css     ← CSS-Layout
│   │   └── services\
│   │       ├── LipsyncEngine.ts
│   │       └── EmotionMapper.ts
│   └── public\
│       └── avatar\
│           └── Kayanew.glb     ← 3D-Modell
└── server\                     (Node.js Backend)
    ├── kaya_server.js
    ├── kaya_audio_service_v2.js
    └── kaya_websocket_service_v2.js
```

---

## 🔧 Aktueller Code-Stand (Problem)

### BabylonAvatar.tsx (Frontend)

**Helper-Funktionen (aktuell implementiert):**

```typescript
// ---- Dials: HIER nur Zahlen anpassen, wenn nötig ----
const DIAL = {
  yawDeg: -18,        // negative Werte = nach rechts zur Mitte drehen
  fovDeg: 30,         // 28–34 = porträtig; kleiner = näher
  padding: 1.10,      // 1.06..1.20 Luft um Kopf/Schultern (kleiner = näher)
  eyeLine: 0.64,      // 0..1, Augenlinie im Bild (etwas höher = dialogischer)
  betaMin: 60,        // Kamerakipp-Limits (in Grad)
  betaMax: 88
};

/** Pivot auf Brustbein setzen + Vorwärtsachse auf -Z normalisieren */
function normalizePivotAndForward(root: BABYLON.AbstractMesh) {
  const { min, max } = root.getHierarchyBoundingVectors(true);
  const size = max.subtract(min);
  const h = size.y;
  const center = min.add(size.scale(0.5));
  const sternum = new BABYLON.Vector3(center.x, min.y + h * 0.58, center.z);

  const pivot = new BABYLON.TransformNode("kaya_pivot", root.getScene());
  pivot.position = sternum.clone();
  root.setParent(pivot);

  // Falls Modell nach +Z schaut → um Y 180° drehen, damit "nach vorne" = -Z
  const looksPlusZ = size.z > size.x && max.z > Math.abs(min.z);
  if (looksPlusZ) pivot.rotate(BABYLON.Axis.Y, BABYLON.Tools.ToRadians(180));

  // Rotation vereinheitlichen
  if (pivot.rotationQuaternion) {
    pivot.rotation = pivot.rotationQuaternion.toEulerAngles();
    pivot.rotationQuaternion = null;
  }
  pivot.scaling = BABYLON.Vector3.One();
  return pivot;
}

/** Portrait-Framing (9:16), Augenlinie ~62%, kein "von unten" */
function framePortrait(scene: BABYLON.Scene, pivot: BABYLON.TransformNode, cam: BABYLON.ArcRotateCamera, dial = DIAL) {
  const { min, max } = (pivot as any).getHierarchyBoundingVectors(true);
  const size = max.subtract(min);
  const h = size.y;
  const r = size.length() * 0.5;
  const target = pivot.position.clone();

  const vFov = BABYLON.Tools.ToRadians(dial.fovDeg);
  const aspect = scene.getEngine().getRenderWidth() / scene.getEngine().getRenderHeight();
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
  const dist = (r * dial.padding) / Math.sin(Math.min(vFov, hFov) / 2);

  // Avatar schaut −Z → Kamera auf +Z
  const pos = target.add(new BABYLON.Vector3(0, 0, dist));
  const v = pos.subtract(target);
  const alpha = Math.atan2(v.x, v.z) + BABYLON.Tools.ToRadians(dial.yawDeg < 0 ? 0 : dial.yawDeg);
  const beta = Math.atan2(v.y, Math.sqrt(v.x * v.x + v.z * v.z));

  cam.setTarget(target);
  cam.alpha = alpha;
  cam.beta = BABYLON.Scalar.Clamp(beta, BABYLON.Tools.ToRadians(dial.betaMin), BABYLON.Tools.ToRadians(dial.betaMax));
  cam.radius = v.length();
  cam.fov = vFov;

  // Augenlinie höher
  const offsetY = h * (dial.eyeLine - 0.5);
  cam.target = (cam as any)._target.add(new BABYLON.Vector3(0, offsetY, 0));

  cam.minZ = 0.05;
  cam.maxZ = dist * 10;
  scene.getEngine().setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio || 1, 2));
}

/** Kamera-Interaktionsgrenzen setzen */
function limitInteraction(cam: BABYLON.ArcRotateCamera, dial = DIAL) {
  cam.panningSensibility = 0; // kein Panning
  cam.useAutoRotationBehavior = false;
  cam.lowerRadiusLimit = 0.55; // Zoom enger erlaubt, weil FOV klein
  cam.upperRadiusLimit = 2.2;
  cam.wheelPrecision = 70;
  cam.inertia = 0.2;

  cam.lowerBetaLimit = BABYLON.Tools.ToRadians(dial.betaMin);
  cam.upperBetaLimit = BABYLON.Tools.ToRadians(dial.betaMax);
  cam.lowerAlphaLimit = -BABYLON.Tools.ToRadians(25);
  cam.upperAlphaLimit = BABYLON.Tools.ToRadians(25);
}
```

**GLB-Load-Logik (aktuell implementiert):**

```typescript
BABYLON.SceneLoader.Append('/avatar/', 'Kayanew.glb', scene, () => {
  console.log('✅ GLB erfolgreich geladen!');
  setIsLoading(false);
  
  // Skinned Mesh mit MorphTargets finden
  const skinned = scene.meshes.find(m => (m as any).morphTargetManager) as BABYLON.AbstractMesh;
  
  if (skinned) {
    // 1) Normalisierung: Pivot + Vorwärtsachse
    const pivot = normalizePivotAndForward(skinned);
    meshRef.current = skinned;
    
    // 2) Zuwendung zur Mitte (yawDeg aus DIAL)
    pivot.rotation.y += BABYLON.Tools.ToRadians(DIAL.yawDeg);
    
    // 3) Portrait-Framing + Interaktionsgrenzen
    framePortrait(scene, pivot, camera, DIAL);
    limitInteraction(camera, DIAL);
    
    // 4) Morph Targets + Engines initialisieren
    const mtm = (skinned as any).morphTargetManager as BABYLON.MorphTargetManager | undefined;
    morphTargetManagerRef.current = mtm || null;
    
    if (mtm && glowLayerRef.current) {
      console.log('📦 Babylon Avatar geladen:', scene.meshes.length, 'Meshes, Morph Targets:', mtm.numTargets);
      
      lipsyncEngineRef.current = new LipsyncEngine(mtm);
      emotionMapperRef.current = new EmotionMapper(mtm, glowLayerRef.current);
      avatarReadyRef.current = true;
      
      console.log('🎭 Lipsync Engine & Emotion Mapper initialisiert');
      console.log('✅ Avatar Ready-Flag gesetzt');
    }
    
    // 5) Resize-Handler mit Reframing
    const onResize = () => {
      engine.resize();
      framePortrait(scene, pivot, camera, DIAL);
    };
    window.addEventListener('resize', onResize);
    
    // Event für Chat-Wheel (stoppt Zoom beim Scrollen im Chat)
    const chat = document.getElementById("chatPane");
    if (chat) {
      chat.addEventListener("wheel", (e) => e.stopPropagation(), { passive: true });
    }
  }
}, (progressEvent) => {
  // Progress-Handler
}, (scene, message, exception) => {
  // Error-Handler
});
```

---

### globals.css (Layout)

```css
/* 9:16-Wrapper */
.kaya-portrait {
  position: relative;
  width: min(100vw, 540px);
  height: 100svh;
  aspect-ratio: 9/16;
  margin: 0 auto;
  border-radius: 20px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 12px 40px rgba(0,0,0,.08);
  display: grid;
  grid-template-rows: 62% 38%;
}

/* AVATAR-BEREICH (oben) */
#avatarPane {
  position: relative;
  background: radial-gradient(1200px 600px at 30% 35%, #eef5f7, #e8eef2 60%, #e6eaee);
}

#babylon-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  z-index: 1;
}

.avatar-shadow {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 40px;
  pointer-events: none;
  background: linear-gradient(to bottom, rgba(0,0,0,.08), rgba(0,0,0,0));
  z-index: 2;
}

/* CHAT-BEREICH (unten) */
#chatPane {
  position: relative;
  display: grid;
  grid-template-rows: 1fr auto;
  background: #fff;
  z-index: 1;
}

/* Weiches Ausblenden nach oben (wirkt "hinter Avatar") */
.chat-fade {
  position: absolute;
  left: 0;
  right: 0;
  top: -1px;
  height: 64px;
  z-index: 2;
  pointer-events: none;
  -webkit-mask-image: linear-gradient(to top, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 100%);
  mask-image: linear-gradient(to top, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 100%);
  background: linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%);
}

.chat-surface {
  position: absolute;
  inset: 0;
  border-top: 1px solid rgba(0,0,0,.06);
  background: rgba(255,255,255,.82);
  backdrop-filter: saturate(1.1) blur(12px);
  -webkit-backdrop-filter: saturate(1.1) blur(12px);
  box-shadow: 0 -8px 24px rgba(0,0,0,.08) inset;
  pointer-events: none;
  z-index: 0;
}
```

---

## 🐛 Problem-Analyse

**Was funktioniert NICHT:**

1. **Avatar erscheint im Profil** statt frontal → `yawDeg: -18` wird nicht korrekt angewandt
2. **Zu viel Luft** um Avatar → `padding: 1.10` und `fovDeg: 30` reichen nicht
3. **Falsche Achsen** → Pivot-Normalisierung funktioniert nicht wie erwartet
4. **Drehung wird nicht visuell umgesetzt** → `pivot.rotation.y += BABYLON.Tools.ToRadians(DIAL.yawDeg)` greift nicht

**Technische Details:**

- Babylon.js ArcRotateCamera wird im GLB-Load-Callback mit `framePortrait()` konfiguriert
- Aber die Kamera wird VOR dem GLB-Load im Haupt-useEffect schon angelegt
- `limitInteraction()` wird AUF bereits existierende Kamera angewendet
- Das könnte zu Race Conditions führen

---

## 💡 Erwartetes Verhalten

**Ziel-Bild:**

```
┌─────────────────────┐
│   [Avatar-Kopf]     │  ← Nah, frontal, leicht nach rechts gedreht
│   [Schultern]       │      (richtet sich zur Kamera aus)
│                     │
├─────────────────────┤  ← Weicher Fade zum Chat
│  [Chat-Nachrichten] │
│  [Eingabefeld]      │
└─────────────────────┘
```

**Zielwerte:**
- Avatar-Ansicht: **frontal** (kein Profil)
- Blick: **zur Kamera** (leicht nach rechts gedreht, ~-18°)
- Framing: **nah** (Kopf + Oberkörper, wenig Luft)
- FOV: **30°** (aktuell gesetzt, aber nicht sichtbar)
- Padding: **1.10** (aktuell gesetzt, aber nicht sichtbar)

---

## 🔍 Code-Analyse

**Aktueller GLB-Load (Zeile 252-289):**

```typescript
const pivot = normalizePivotAndForward(skinned);
pivot.rotation.y += BABYLON.Tools.ToRadians(DIAL.yawDeg);  // ← Problem?
framePortrait(scene, pivot, camera, DIAL);
```

**Problem:** Die Drehung `yawDeg: -18` wird auf den Pivot angewendet, aber dann überschreibt `framePortrait()` die Kamerawinkel:

```typescript
const alpha = Math.atan2(v.x, v.z) + BABYLON.Tools.ToRadians(dial.yawDeg < 0 ? 0 : dial.yawDeg);
```

**⚠️ BUG:** `dial.yawDeg < 0 ? 0 : dial.yawDeg` → Wenn negativ, wird 0 verwendet! Das ist falsch!

---

## 📝 User-Anweisung (Original)

> Avatar **näher**, **leicht nach rechts gedreht** (zur Mitte),
> 9:16-**Portrait**: Avatar oben, Chat unten,
> **sauberer Chat-Fade** nach oben (wirkt, als verschwände er hinter dem Avatar),
> harte **Kamera-Limits** (kein „von unten“),
> alles **copy-paste**.

**Gegebener Code (User-example):**

```typescript
const alpha = Math.atan2(v.x, v.z) + BABYLON.Tools.ToRadians(dial.yawDeg < 0 ? 0 : dial.yawDeg);
```

**Hier ist das Problem:** Diese Zeile ignoriert `yawDeg` wenn negativ!

**Korrektur:**

```typescript
const alpha = Math.atan2(v.x, v.z) + BABYLON.Tools.ToRadians(dial.yawDeg);
```

Aber warum funktioniert es nicht? Die Kamera wird im **Haupt-useEffect** angelegt, aber `framePortrait()` wird im **GLB-Callback** aufgerufen. Könnte zu Race Conditions führen.

---

## 🛠️ Hypothesen

**Hypothese 1:** Kamera-Animation überlappt sich mit Reframing
- `limitInteraction()` wird auf Kamera angewendet → überschreibt Framing
- Lösung: `limitInteraction()` NACH `framePortrait()` aufrufen (aktuell schon so)

**Hypothese 2:** `yawDeg` wird nicht visuell umgesetzt
- Die Drehung wird auf Pivot angewendet, aber Kamera ignoriert sie
- Lösung: Kamera-Alpha muss die Drehung berücksichtigen

**Hypothese 3:** GLB hat falsche Orientierung
- `normalizePivotAndForward()` dreht das Modell 180°, aber Avatar schaut trotzdem falsch
- Lösung: `looksPlusZ` Logik prüfen

---

## 💻 Was funktionieren SOLLTE

```
DIAL.yawDeg = -18          → Avatar dreht sich 18° nach rechts
DIAL.fovDeg = 30           → Kamera näher (FOV 30°)
DIAL.padding = 1.10        → Weniger Luft (kleiner)
DIAL.eyeLine = 0.64        → Augenlinie etwas höher im Bild
```

**Erwartetes Ergebnis:**
- Avatar steht **frontal**, leicht nach rechts gedreht (zur Kamera)
- **Nah** gerahmt (Kopf + Schultern)
- **Kein Profil** mehr
- Chat verblendet nach oben

**Aktuelles Ergebnis:**
- Avatar im **Profil**
- **Zu viel Luft**
- Drehung **ignoriert**

---

## 🎯 Was ChatGPT tun soll

**TASK 1:** Analysiere die `framePortrait()` Funktion

- Warum wird `dial.yawDeg < 0 ? 0 : dial.yawDeg` verwendet?
- Soll `yawDeg` die Kamera-Rotation oder die Modell-Rotation beeinflussen?
- Wie berechnet Babylon.js `alpha` und `beta` für ArcRotateCamera?

**TASK 2:** Prüfe die Kamera-Setup-Reihenfolge

```typescript
// Haupt-useEffect (Zeile ~169-197)
const camera = new BABYLON.ArcRotateCamera(...);
camera.attachControl(canvasRef.current, true);
// ... Limits werden hier gesetzt

// GLB-Load-Callback (Zeile ~252-289)
framePortrait(scene, pivot, camera, DIAL);    // ← Framing
limitInteraction(camera, DIAL);               // ← Limits (müsste schon gesetzt sein)
```

**Problem:** `limitInteraction()` setzt Limits, aber `framePortrait()` könnte sie überschreiben.

**TASK 3:** Debugging-Strategie

1. Console-Logs in `framePortrait()` hinzufügen:
   ```typescript
   console.log('🎥 Frame Portrait:', { 
     alpha: BABYLON.Tools.ToDegrees(alpha), 
     beta: BABYLON.Tools.ToDegrees(beta),
     yawDeg: dial.yawDeg 
   });
   ```

2. Prüfen, ob `alpha` korrekt gesetzt wird

3. Prüfen, ob Modell-Rotation (Pivot) greift

---

## 📦 Dependencies

- **React** 18.2.0
- **Babylon.js** 8.0.0 (`@babylonjs/core`, `@babylonjs/loaders`)
- **TypeScript** 5.x
- **Vite** 4.x

---

## 🔍 Nächste Schritte

1. **ChatGPT soll analysieren:** Warum greift `yawDeg` nicht?
2. **Fixes vorschlagen:** Kode-Änderungen mit Erklärung
3. **Alternative implementieren:** Falls User-Ansatz nicht funktioniert

**Beachte:** Der Code muss **production-ready** sein (keine Console-Logs in Production, Error-Handling, etc.)

---

## 📊 Technisches Setup

**Development:**
- `npm run dev` → `http://localhost:3000`
- HMR aktiv
- Vite 4.5.14
- Terminal-Logs zeigen: `[vite] hmr update` → Build funktioniert

**Deployment:**
- Railway (Frontend)
- `app.kaya.wattweiser.com`
- Service Worker v2.x

**Git:**
- Branch: `main`
- No uncommitted changes (working tree clean)

---

**Diese Dokumentation ist vollständig kopierbar für ChatGPT. Alle relevanten Code-Snippets, Kontext und Probleme sind enthalten.**

