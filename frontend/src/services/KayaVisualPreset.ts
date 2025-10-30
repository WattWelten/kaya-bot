// Kaya Visual Preset – HD/Photoreal Runtime for Babylon.js
// Drop-in: init preset, load GLB, upgrade materials, quality toggle.

import * as B from "@babylonjs/core";

export type KayaPresetOpts = {
  hdrUrl?: string;          // e.g. "/hdr/studio.env" (prefiltered .env)
  quality?: "hd" | "mobile" | "performance";
  dof?: boolean;
  bloom?: boolean;
  ssao?: boolean;
  msaaSamples?: 4 | 2 | 1;
  exposure?: number;        // default 1.05
  contrast?: number;        // default 1.08
  envIntensity?: number;    // default 1.2
};

export type KayaPreset = {
  engine: B.Engine;
  scene: B.Scene;
  camera: B.ArcRotateCamera;
  pipeline: B.DefaultRenderingPipeline;
  setQuality: (q: "hd" | "mobile" | "performance") => void;
  dispose: () => void;
};

/** Initialize scene + camera + HD render pipeline */
export function initKayaVisualPreset(
  canvas: HTMLCanvasElement,
  opts: KayaPresetOpts = {}
): KayaPreset {
  const engine = new B.Engine(canvas, true, { 
    preserveDrawingBuffer: true, 
    stencil: true, 
    antialias: true 
  });

  // HiDPI scharf, aber nicht übertreiben
  const maxDPR = (opts.quality === "performance") ? 1.25 : (opts.quality === "mobile" ? 1.5 : 2);
  engine.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio || 1, maxDPR));

  const scene = new B.Scene(engine);
  const camera = new B.ArcRotateCamera("cam", 0, 0, 2, B.Vector3.Zero(), scene);
  camera.attachControl(canvas, true);

  // Environment + ACES Tonemapping
  const hdrUrl = opts.hdrUrl ?? "/hdr/studio.env"; // prefiltered .env
  try {
    scene.environmentTexture = B.CubeTexture.CreateFromPrefilteredData(hdrUrl, scene);
  } catch (e) {
    console.warn("⚠️ HDR Environment nicht gefunden, verwende Standard:", hdrUrl, e);
    // Fallback: Hemispheric Light
    const hdrLight = new B.HemisphericLight("hdr", new B.Vector3(0, 1, 0), scene);
    hdrLight.intensity = 0.8;
  }
  
  scene.environmentIntensity = opts.envIntensity ?? 1.2;
  scene.imageProcessingConfiguration.toneMappingEnabled = true;
  scene.imageProcessingConfiguration.toneMappingType = B.ImageProcessingConfiguration.TONEMAPPING_ACES;
  scene.imageProcessingConfiguration.exposure = opts.exposure ?? 1.05;
  scene.imageProcessingConfiguration.contrast = opts.contrast ?? 1.08;

  // Keys & Shadows
  const sun = new B.DirectionalLight("sun", new B.Vector3(-0.35, -1, -0.2), scene);
  sun.intensity = 1.15;
  const sg = new B.ShadowGenerator(2048, sun);
  sg.useContactHardeningShadow = true;
  sg.contactHardeningLightSizeUVRatio = 0.15;
  sg.forceBackFacesOnly = true;

  // Default pipeline (MSAA + DOF + Bloom + Sharpen)
  const pipeline = new B.DefaultRenderingPipeline("drp", true, scene, [camera]);
  pipeline.samples = opts.msaaSamples ?? 4;
  pipeline.imageProcessingEnabled = true;
  pipeline.sharpenEnabled = true;
  pipeline.sharpen.edgeAmount = 0.25;
  pipeline.bloomEnabled = (opts.bloom ?? true);
  pipeline.bloomThreshold = 0.92;
  pipeline.bloomWeight = 0.08;
  pipeline.bloomKernel = 8;
  pipeline.depthOfFieldEnabled = (opts.dof ?? true);
  pipeline.depthOfField.focusDistance = 1200;   // ~1.2 m
  pipeline.depthOfField.fStop = 2.8;
  pipeline.depthOfField.focalLength = 50;

  // SSAO (dezent)
  let ssao: B.SSAO2RenderingPipeline | null = null;
  try {
    ssao = new B.SSAO2RenderingPipeline("ssao", scene, { ssaoRatio: 0.75, blurRatio: 0.5 });
    ssao.radius = 1.1; 
    ssao.totalStrength = 0.45; 
    ssao.base = 0.5;

    if (opts.ssao ?? true) {
      scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline("ssao", camera);
    }
  } catch (e) {
    console.warn("⚠️ SSAO nicht verfügbar:", e);
  }

  // Quality toggle
  const setQuality = (q: "hd" | "mobile" | "performance") => {
    if (q === "performance") {
      pipeline.bloomEnabled = false;
      pipeline.depthOfFieldEnabled = false;
      pipeline.sharpenEnabled = true; 
      pipeline.sharpen.edgeAmount = 0.18;
      if (ssao) {
        try { 
          scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline("ssao", camera); 
        } catch {}
      }
      engine.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio || 1, 1.25));
      scene.environmentIntensity = 1.0;
    } else if (q === "mobile") {
      pipeline.bloomEnabled = false;
      pipeline.depthOfFieldEnabled = true; 
      pipeline.depthOfField.fStop = 4.0;
      pipeline.sharpenEnabled = true; 
      pipeline.sharpen.edgeAmount = 0.2;
      if (ssao) {
        try { 
          scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline("ssao", camera); 
        } catch {}
      }
      engine.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio || 1, 1.5));
      scene.environmentIntensity = 1.05;
    } else {
      pipeline.bloomEnabled = true;
      pipeline.depthOfFieldEnabled = true; 
      pipeline.depthOfField.fStop = 2.8;
      if (ssao) {
        try { 
          scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline("ssao", camera); 
        } catch {}
      }
      engine.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio || 1, 2));
      scene.environmentIntensity = 1.2;
    }
  };

  // Default quality decision
  const isMobileUA = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  setQuality(opts.quality ?? (isMobileUA ? "mobile" : "hd"));

  engine.runRenderLoop(() => scene.render());
  window.addEventListener("resize", () => engine.resize());

  return {
    engine, 
    scene, 
    camera, 
    pipeline,
    setQuality,
    dispose: () => { 
      engine.stopRenderLoop(); 
      engine.dispose(); 
    }
  };
}

/** Quick material polish for common PBR parts (names via regex) */
export function upgradeKayaMaterials(root: B.AbstractMesh) {
  const scene = root.getScene();

  root.getChildMeshes().forEach(m => {
    const p = m.material as B.PBRMaterial;
    if (!p || p.getClassName?.() !== "PBRMaterial") return;

    p.usePhysicalLightFalloff = true;
    p.environmentIntensity = 1.0;

    if (/(skin|face|head|neck)/i.test(p.name ?? m.name)) {
      scene.enablePrePassRenderer();
      p.metallic = 0.0;
      p.roughness = 0.42;
      p.specularIntensity = 0.6;
      // Runtime-SSS (einfach, performant)
      p.subSurface.isTranslucencyEnabled = true;
      p.subSurface.translucencyIntensity = 0.35;
      p.subSurface.minimumThickness = 0.2;
      p.subSurface.maximumThickness = 1.2;
    }

    if (/hair/i.test(p.name ?? m.name)) {
      p.anisotropy.isEnabled = true;
      p.anisotropy.intensity = 0.8;
      p.roughness = 0.33;
      p.useAlphaFromAlbedoTexture = true;
      p.alphaMode = B.Engine.ALPHA_COMBINE;
      p.needsDepthPrePass = true;
    }

    if (/(eye|iris|cornea)/i.test(p.name ?? m.name)) {
      p.clearCoat.isEnabled = true;
      p.clearCoat.intensity = 1.0;
      p.clearCoat.roughness = 0.0;
      p.indexOfRefraction = 1.376;
      p.specularIntensity = 0.9;
    }

    if (/(teeth|tooth|gum|mouth)/i.test(p.name ?? m.name)) {
      p.metallic = 0.0;
      p.roughness = 0.22;
      p.specularIntensity = 0.95;
    }

    if (/(cloth|fabric|sweater|hoodie)/i.test(p.name ?? m.name)) {
      p.sheen.isEnabled = true;
      p.sheen.intensity = 0.35;
      p.roughness = 0.55;
    }

    m.receiveShadows = true;
  });
}

/** Simple portrait framing helper (keep your current values if already done) */
export function framePortrait(
  scene: B.Scene,
  root: B.AbstractMesh,
  cam: B.ArcRotateCamera,
  dial: {
    yawDeg?: number;
    fovDeg?: number;
    padding?: number;
    eyeLine?: number;
    xShift?: number;
    betaMin?: number;
    betaMax?: number;
  } = {}
) {
  const yawDeg = dial.yawDeg ?? -18;
  const fovDeg = dial.fovDeg ?? 30;
  const padding = dial.padding ?? 1.10;
  const eyeLine = dial.eyeLine ?? 0.62;
  const xShift = dial.xShift ?? -0.055;
  const betaMin = dial.betaMin ?? 60;
  const betaMax = dial.betaMax ?? 88;

  const { min, max } = root.getHierarchyBoundingVectors(true);
  const size = max.subtract(min);
  const h = size.y;
  const r = size.length() * 0.5;

  const vFov = B.Tools.ToRadians(fovDeg);
  const aspect = scene.getEngine().getRenderWidth() / scene.getEngine().getRenderHeight();
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
  const dist = (r * padding) / Math.sin(Math.min(vFov, hFov) / 2);

  const target = root.position.add(new B.Vector3(size.x * xShift, 0, 0));
  const pos = target.add(new B.Vector3(0, 0, dist));
  const v = pos.subtract(target);

  const baseAlpha = Math.atan2(v.x, v.z) + B.Tools.ToRadians(yawDeg);
  const beta = Math.atan2(v.y, Math.sqrt(v.x * v.x + v.z * v.z));

  cam.setTarget(target);
  cam.alpha = baseAlpha;
  cam.beta = B.Scalar.Clamp(beta, B.Tools.ToRadians(betaMin), B.Tools.ToRadians(betaMax));
  cam.radius = v.length();
  cam.fov = vFov;

  cam.target = (cam as any)._target.add(new B.Vector3(0, h * (eyeLine - 0.5), 0));

  cam.panningSensibility = 0;
  cam.useAutoRotationBehavior = false;

  const band = B.Tools.ToRadians(20);
  cam.lowerAlphaLimit = baseAlpha - band;
  cam.upperAlphaLimit = baseAlpha + band;
  cam.lowerRadiusLimit = dist * 0.75;
  cam.upperRadiusLimit = dist * 1.35;
  cam.wheelPrecision = 80;
  cam.inertia = 0.15;
  cam.minZ = 0.05; 
  cam.maxZ = dist * 10;
}


