// Draco-Kompression für GLB via glTF-Transform
// Usage:
//   node scripts/compress_glb.mjs [--in <input.glb>] [--out <output.glb>] [--level 5]

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync } from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { DracoMeshCompression } from '@gltf-transform/extensions';
import { dracoCompress } from '@gltf-transform/functions';

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const args = { in: 'frontend/public/avatar/Kayanew.glb', out: 'frontend/public/avatar/Kayanew_mouth-draco.glb', level: 5 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--in' && argv[i + 1]) args.in = argv[++i];
    else if (a === '--out' && argv[i + 1]) args.out = argv[++i];
    else if (a === '--level' && argv[i + 1]) args.level = Number(argv[++i]) || 5;
  }
  return args;
}

async function compressDraco(inputPath, outputPath, level = 5) {
  const absIn = resolve(process.cwd(), inputPath);
  const absOut = resolve(process.cwd(), outputPath);

  if (!existsSync(absIn)) {
    throw new Error(`Input GLB nicht gefunden: ${absIn}`);
  }

  const outDir = dirname(absOut);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const io = new NodeIO().registerExtensions([DracoMeshCompression]);

  console.log(`📦 Lade GLB: ${absIn}`);
  const doc = io.read(absIn);

  console.log(`🧩 Wende Draco-Kompression an (Level ${level})...`);
  await doc.transform(dracoCompress({ encoderOptions: { method: 'edgebreaker', quantizationVolume: 'boundingBox', encodeSpeed: 4, decodeSpeed: 4, quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12, quantizeColor: 8, quantizeGeneric: 12, compressionLevel: level } }));

  console.log(`💾 Schreibe: ${absOut}`);
  io.write(absOut, doc);

  // Ausgabegröße loggen
  try {
    const sizeMb = (readFileSync(absOut).byteLength / (1024 * 1024)).toFixed(2);
    console.log(`✅ Fertig. Größe: ${sizeMb} MB`);
  } catch {}
}

// Main
(async () => {
  try {
    const { in: input, out: output, level } = parseArgs(process.argv.slice(2));
    await compressDraco(input, output, level);
  } catch (err) {
    console.error('❌ Fehler bei Draco-Kompression:', err?.message || err);
    process.exit(1);
  }
})();



