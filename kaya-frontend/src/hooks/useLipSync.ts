import { useState, useEffect, useRef } from 'react';

// Viseme-Mapping (Phonem → Morph Target Index)
const VISEME_MAP: Record<string, number> = {
  'sil': 0,  // Silence
  'PP': 1,   // P, B, M
  'FF': 2,   // F, V
  'TH': 3,   // TH
  'DD': 4,   // T, D
  'kk': 5,   // K, G
  'CH': 6,   // CH, J, SH
  'SS': 7,   // S, Z
  'nn': 8,   // N, L
  'RR': 9,   // R
  'aa': 10,  // A (father)
  'E': 11,   // E (bed)
  'I': 12,   // I (bit)
  'O': 13,   // O (on)
  'U': 14    // U (book)
};

interface UseLipSyncReturn {
  visemes: number[];
  isAnalyzing: boolean;
}

export function useLipSync(audioUrl: string | null, isPlaying: boolean): UseLipSyncReturn {
  const [visemes, setVisemes] = useState<number[]>(new Array(15).fill(0));
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!audioUrl || !isPlaying) {
      setVisemes(new Array(15).fill(0));
      return;
    }

    analyzeAudio(audioUrl);
  }, [audioUrl, isPlaying]);

  const analyzeAudio = async (url: string) => {
    try {
      setIsAnalyzing(true);

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(analyser);
      analyser.connect(audioContext.destination);

      source.start(0);

      const updateVisemes = () => {
        analyser.getByteFrequencyData(dataArray);
        
        const lowFreq = dataArray.slice(0, 100).reduce((a, b) => a + b, 0) / 100;
        const midFreq = dataArray.slice(100, 200).reduce((a, b) => a + b, 0) / 100;
        const highFreq = dataArray.slice(200, 300).reduce((a, b) => a + b, 0) / 100;

        const newVisemes = new Array(15).fill(0);
        
        if (lowFreq > 150) newVisemes[10] = Math.min(lowFreq / 255, 1);
        if (midFreq > 150) newVisemes[11] = Math.min(midFreq / 255, 1);
        if (highFreq > 150) newVisemes[12] = Math.min(highFreq / 255, 1);

        setVisemes(newVisemes);

        if (isPlaying) {
          requestAnimationFrame(updateVisemes);
        }
      };

      updateVisemes();

    } catch (error) {
      console.error('Lipsync-Analyse fehlgeschlagen:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { visemes, isAnalyzing };
}

