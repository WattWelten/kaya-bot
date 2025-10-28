import { VisemeSegment } from './LipsyncEngine';

type VisemeEvent = { t: number; id: string; w?: number };

export async function ttsWithVisemes(text: string, voice = "kaya") {
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      voice,
      format: "audio/mp3",
      sample_rate: 48000,
      return_visemes: true
    })
  });
  
  if (!res.ok) throw new Error("TTS failed");
  
  const { audio_base64, visemes } = await res.json() as { 
    audio_base64: string; 
    visemes: VisemeEvent[] 
  };

  const audioData = Uint8Array.from(atob(audio_base64), c => c.charCodeAt(0)).buffer;
  
  // Konvertiere Backend-Format zu LipsyncEngine-Format
  const segments: VisemeSegment[] = (visemes ?? []).map((v, i, arr) => ({
    phoneme: v.id,
    viseme: v.id,
    start: v.t,
    end: arr[i + 1]?.t ?? v.t + 0.1,
    weight: v.w ?? 1.0
  }));
  
  return { audioData, segments };
}

let audioCtx: AudioContext | null = null;
let playingSource: AudioBufferSourceNode | null = null;

export async function speak(text: string, lipsyncEngine: any) {
  const { audioData, segments } = await ttsWithVisemes(text, "kaya");

  // Guard: nur sprechen, wenn Audio existiert
  if (!audioData || !segments || segments.length === 0) {
    console.debug("[speak] timeline empty or audio missing – skip");
    return;
  }

  audioCtx ??= new (window.AudioContext || (window as any).webkitAudioContext)();
  const buf = await audioCtx.decodeAudioData(audioData.slice(0));
  
  // Stop eventuell laufendes Audio
  try { playingSource?.stop(0); } catch {}
  
  playingSource = audioCtx.createBufferSource();
  playingSource.buffer = buf;
  playingSource.connect(audioCtx.destination);

  // Lipsync starten (LipsyncEngine nutzt Date.now() intern)
  if (segments.length > 0) {
    lipsyncEngine.start(segments);
  }

  playingSource.onended = () => {
    lipsyncEngine.stop?.();
  };
  
  playingSource.start(0);
}

export function stopSpeaking(lipsyncEngine: any) {
  try { playingSource?.stop(0); } catch {}
  lipsyncEngine.stop?.();
}

