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
  return { audioData, visemes: visemes ?? [] };
}

let audioCtx: AudioContext | null = null;
let playingSource: AudioBufferSourceNode | null = null;

export async function speak(text: string, lipsyncEngine: any) {
  const { audioData, visemes } = await ttsWithVisemes(text, "kaya");

  // Guard: nur sprechen, wenn Audio existiert
  if (!audioData || (visemes && !visemes.length)) {
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

  // Visemes an Lipsync-Engine binden
  if (visemes?.length) {
    lipsyncEngine.setTimeline(visemes);
    lipsyncEngine.bindClock(() => audioCtx!.currentTime);
    lipsyncEngine.start();
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

