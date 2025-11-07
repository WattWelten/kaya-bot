import React, { useEffect, useRef, useState } from 'react';

interface AudioWaveformProps {
  audioLevel: number; // 0-100%
  isRecording: boolean;
}

/**
 * AudioWaveform - Live Wellenform-Visualisierung
 * 
 * Zeigt Echtzeit Audio-Level während Recording
 * - Canvas-basierte Wellenform
 * - Pulsing Animation
 * - Smooth Audio-Level-Anzeige
 */
export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  audioLevel,
  isRecording
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const [pulseScale, setPulseScale] = useState(1);

  useEffect(() => {
    if (!isRecording || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Waveform-Daten für Animation
    let frameCount = 0;
    const waves: Array<{ phase: number; amplitude: number }> = Array.from({ length: 3 }, () => ({
      phase: Math.random() * Math.PI * 2,
      amplitude: 0
    }));

    const animate = () => {
      if (!isRecording) return;

      frameCount++;

      // Clear canvas
      ctx.fillStyle = 'transparent';
      ctx.fillRect(0, 0, width, height);

      // Update wave amplitudes basierend auf audioLevel
      waves.forEach((wave, i) => {
        wave.amplitude = audioLevel / 100;
        wave.phase += 0.1 + i * 0.05;
      });

      // Draw waveform
      ctx.beginPath();
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.6 + audioLevel / 100 * 0.4})`;
      ctx.lineWidth = 2;

      for (let x = 0; x < width; x += 2) {
        const normalizedX = x / width;
        let y = height / 2;

        // Combine multiple waves for complex waveform
        waves.forEach((wave, i) => {
          const frequency = (i + 1) * 3;
          const amp = wave.amplitude * (height * 0.25) * (1 / (i + 1));
          y += Math.sin(normalizedX * frequency + wave.phase) * amp;
        });

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();

      // Pulse scale animation
      const targetScale = 1 + (audioLevel / 100) * 0.3;
      setPulseScale(targetScale);

      animationFrameId.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isRecording, audioLevel]);

  if (!isRecording) return null;

  return (
    <div className="relative flex items-center justify-center w-full h-16 mb-2">
      {/* Audio-Level Bar */}
      <div className="absolute w-full h-2 bg-red-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-red-400 via-red-500 to-red-600 transition-all duration-75 ease-out"
          style={{ width: `${audioLevel}%` }}
        />
      </div>

      {/* Waveform Canvas */}
      <canvas
        ref={canvasRef}
        width={200}
        height={60}
        className="w-full h-14"
        style={{
          transform: `scale(${pulseScale})`,
          transition: 'transform 0.1s ease-out'
        }}
      />

      {/* Recording Indicator */}
      <div className="absolute -bottom-1 text-xs text-red-600 font-medium">
        Aufnahme... • {Math.round(audioLevel)}%
      </div>
    </div>
  );
};

