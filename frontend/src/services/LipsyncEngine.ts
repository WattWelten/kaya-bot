/**
 * LipsyncEngine - Zeitbasierte Viseme-Steuerung
 * 
 * Verwaltet Avatar-Lippensynchronisation basierend auf Phonem-Timeline
 * - Smooth Interpolation zwischen Visemes
 * - Web Audio API Integration
 * - RequestAnimationFrame für 60fps
 */

export interface VisemeSegment {
  phoneme: string;
  viseme: string;
  start: number;  // Sekunden
  end: number;    // Sekunden
  weight: number; // 0-1
}

export class LipsyncEngine {
  private morphTargetManager: any; // Babylon.js MorphTargetManager
  private currentSegments: VisemeSegment[] = [];
  private startTime: number = 0;
  private animationFrameId: number | null = null;
  private isPlaying = false;

  constructor(morphTargetManager: any) {
    this.morphTargetManager = morphTargetManager;
  }

  /**
   * Starte Lipsync mit Timeline
   */
  start(segments: VisemeSegment[]): void {
    this.playTimeline(segments);
  }

  /**
   * Spiele Viseme-Timeline ab
   */
  playTimeline(segments: VisemeSegment[]): void {
    if (!this.morphTargetManager) {
      console.warn('⚠️ MorphTargetManager nicht vorhanden');
      return;
    }

    this.currentSegments = segments;
    this.startTime = Date.now();
    this.isPlaying = true;

    console.log(`🎭 Lipsync gestartet: ${segments.length} Segmente`);

    this.animate();
  }

  /**
   * Animation-Loop mit requestAnimationFrame
   */
  private animate(): void {
    if (!this.isPlaying || this.currentSegments.length === 0) {
      return;
    }

    const elapsed = (Date.now() - this.startTime) / 1000;
    
    // Aktuelles Segment finden
    const activeSegment = this.findActiveSegment(elapsed);

    if (activeSegment) {
      // Viseme anwenden
      this.applyViseme(activeSegment.viseme, activeSegment.weight);
    } else {
      // Kein Segment → Neutral
      this.applyViseme('neutral', 0);
    }

    // Check ob Timeline vorbei
    const lastSegment = this.currentSegments[this.currentSegments.length - 1];
    if (elapsed > lastSegment.end) {
      this.stop();
      return;
    }

    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  /**
   * Finde aktives Viseme-Segment basierend auf Zeit
   */
  private findActiveSegment(elapsed: number): VisemeSegment | null {
    for (const segment of this.currentSegments) {
      if (elapsed >= segment.start && elapsed <= segment.end) {
        // Interpolation: Gewicht berechnen
        const duration = segment.end - segment.start;
        const t = duration > 0 ? (elapsed - segment.start) / duration : 1;
        
        // Blending zwischen benachbarten Segmenten
        const nextSegment = this.currentSegments.find(s => s.start > segment.start);
        if (nextSegment && elapsed >= nextSegment.start) {
          const blendT = (elapsed - nextSegment.start) / 0.1; // 100ms Blend
          segment.weight = Math.max(0, 1 - Math.min(1, blendT));
          nextSegment.weight = Math.min(1, blendT);
        }

        return segment;
      }
    }
    return null;
  }

  /**
   * Wende Viseme auf Morph Target an
   */
  private applyViseme(visemeName: string, weight: number): void {
    if (!this.morphTargetManager) return;

    try {
      const target = this.morphTargetManager.getTargetByName(visemeName);
      if (target) {
        target.influence = weight;
      } else {
        // Fallback: versuche direkt über Index
        const index = this.morphTargetManager.getTargetIndexByName(visemeName);
        if (index !== undefined && index >= 0) {
          const t = this.morphTargetManager.getTarget(index);
          if (t) t.influence = weight;
        }
      }
    } catch (error) {
      // Silently ignore - Viseme nicht vorhanden
    }
  }

  /**
   * Stoppe Lipsync
   */
  stop(): void {
    this.isPlaying = false;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Alle Visemes zurücksetzen
    if (this.morphTargetManager) {
      this.resetAllVisemes();
    }

    console.log('🛑 Lipsync gestoppt');
  }

  /**
   * Setze alle Visemes auf 0
   */
  private resetAllVisemes(): void {
    if (!this.morphTargetManager) return;

    try {
      const targets = [
        'mouthOpen', 'mouthO', 'mouthSmile_L', 'mouthSmile_R',
        'mouthFunnel', 'mouthClose', 'tongueOut', 'browInnerUp',
        'browDown_L', 'browDown_R', 'mouthFrown_L', 'mouthFrown_R'
      ];

      targets.forEach(name => {
        const target = this.morphTargetManager.getTargetByName(name);
        if (target) target.influence = 0;
      });
    } catch (error) {
      // Ignore
    }
  }

  /**
   * Ist Lipsync aktiv?
   */
  get isRunning(): boolean {
    return this.isPlaying;
  }
}

