/**
 * LipsyncEngine - Zeitbasierte Viseme-Steuerung
 * 
 * Verwaltet Avatar-Lippensynchronisation basierend auf Phonem-Timeline
 * - Smooth Interpolation zwischen Visemes
 * - Web Audio API Integration
 * - RequestAnimationFrame für 60fps
 * - Auto-Detection der MorphTargets (unabhängig von Namen)
 */

export interface VisemeSegment {
  phoneme: string;
  viseme: string;
  start: number;  // Sekunden
  end: number;    // Sekunden
  weight: number; // 0-1
}

// Standard-Viseme-Namen (für Auto-Mapping)
const VISEME_NAMES = [
  'aa', 'ih', 'ou', 'ee', 'oh', 'F', 'V', 'TH', 'M', 'B', 'P', 'D', 'T',
  'S', 'Z', 'SH', 'ZH', 'CH', 'J', 'K', 'G', 'L', 'N', 'R', 'W', 'Y'
];

// MorphTarget-Heuristik-Patterns (für Auto-Detection)
const MORPH_PATTERNS: { [viseme: string]: RegExp[] } = {
  'aa': [/aa/i, /open/i, /jaw/i, /mouth.*open/i, /oh.*wide/i],
  'ih': [/ih/i, /ee/i, /smile/i, /mouth.*smile/i],
  'ou': [/ou/i, /round/i, /funnel/i, /pucker/i],
  'ee': [/ee/i, /smile.*wide/i, /cheek.*up/i],
  'oh': [/oh/i, /round/i, /funnel/i],
  'F': [/f/i, /bite.*lip/i, /lip.*bite/i, /teeth.*lower/i],
  'V': [/v/i, /bite.*lip/i, /lip.*bite/i],
  'TH': [/th/i, /tongue.*out/i, /tongue.*between/i],
  'M': [/m/i, /close/i, /mouth.*closed/i, /pursed/i],
  'B': [/b/i, /close/i, /pursed/i],
  'P': [/p/i, /close/i, /pursed/i],
  'D': [/d/i, /tongue.*up/i, /tip.*roof/i],
  'T': [/t/i, /tongue.*up/i, /tip.*roof/i],
  'S': [/s/i, /narrow/i, /tight/i],
  'Z': [/z/i, /narrow/i],
  'SH': [/sh/i, /round/i, /protruded/i],
  'ZH': [/zh/i, /round/i],
  'CH': [/ch/i, /round/i, /protruded/i],
  'J': [/j/i, /wide/i],
  'K': [/k/i, /back/i],
  'G': [/g/i, /back/i],
  'L': [/l/i, /tongue.*up/i],
  'N': [/n/i, /tongue.*up/i],
  'R': [/r/i, /round/i],
  'W': [/w/i, /round/i, /pucker/i],
  'Y': [/y/i, /wide/i]
};

interface MorphMapping {
  [viseme: string]: any; // MorphTarget
}

export class LipsyncEngine {
  private morphTargetManager: any; // Babylon.js MorphTargetManager
  private currentSegments: VisemeSegment[] = [];
  private startTime: number = 0;
  private animationFrameId: number | null = null;
  private isPlaying = false;
  private visemeToMorph: MorphMapping = {}; // Auto-detected mapping
  private mappingReport: { [viseme: string]: string | null } = {};

  constructor(morphTargetManager: any) {
    this.morphTargetManager = morphTargetManager;
    this.autoDetectMorphTargets();
  }

  /**
   * Auto-Detection: Finde MorphTargets für alle Visemes
   */
  private autoDetectMorphTargets(): void {
    if (!this.morphTargetManager) {
      console.warn('⚠️ MorphTargetManager nicht vorhanden - kein Auto-Mapping möglich');
      return;
    }

    // 1. Lade optionales Override-Mapping aus localStorage oder JSON
    const overrideMap = this.loadOverrideMapping();
    
    // 2. Alle verfügbaren MorphTargets auflisten
    const allTargets: Array<{ name: string; target: any; index: number }> = [];
    try {
      const numTargets = this.morphTargetManager.numTargets || 0;
      for (let i = 0; i < numTargets; i++) {
        const target = this.morphTargetManager.getTarget(i);
        if (target) {
          const name = target.name || `morph_${i}`;
          allTargets.push({ name, target, index: i });
        }
      }
    } catch (error) {
      console.error('❌ Fehler beim Auflisten der MorphTargets:', error);
      return;
    }

    console.log(`🔍 Auto-Detection: ${allTargets.length} MorphTargets gefunden`);
    console.log('📋 MorphTarget-Namen:', allTargets.map(t => t.name).join(', '));

    // 3. Für jedes Viseme: Bestes Matching finden
    const unmapped: string[] = [];
    
    for (const viseme of VISEME_NAMES) {
      // Override hat Priorität
      if (overrideMap[viseme]) {
        const overrideName = overrideMap[viseme];
        const found = allTargets.find(t => 
          t.name.toLowerCase() === overrideName.toLowerCase()
        );
        if (found) {
          this.visemeToMorph[viseme] = found.target;
          this.mappingReport[viseme] = found.name;
          continue;
        } else {
          console.warn(`⚠️ Override-Mapping für "${viseme}" → "${overrideName}" nicht gefunden`);
        }
      }

      // Heuristik: Pattern-Matching
      const patterns = MORPH_PATTERNS[viseme] || [];
      let bestMatch: { name: string; target: any; score: number } | null = null;

      for (const targetInfo of allTargets) {
        const nameLower = targetInfo.name.toLowerCase();
        
        // Exakte Übereinstimmung (höchste Priorität)
        if (nameLower === viseme.toLowerCase()) {
          bestMatch = { name: targetInfo.name, target: targetInfo.target, score: 100 };
          break;
        }

        // Pattern-Matching
        for (const pattern of patterns) {
          if (pattern.test(targetInfo.name)) {
            const score = this.calculateMatchScore(viseme, targetInfo.name, pattern);
            if (!bestMatch || score > bestMatch.score) {
              bestMatch = { name: targetInfo.name, target: targetInfo.target, score };
            }
          }
        }
      }

      if (bestMatch) {
        this.visemeToMorph[viseme] = bestMatch.target;
        this.mappingReport[viseme] = bestMatch.name;
      } else {
        unmapped.push(viseme);
        this.mappingReport[viseme] = null;
      }
    }

    // 4. Mapping-Report ausgeben
    console.log('📊 MorphTarget Mapping-Report:');
    for (const viseme of VISEME_NAMES) {
      const mapped = this.mappingReport[viseme];
      if (mapped) {
        console.log(`  ✅ ${viseme} → ${mapped}`);
      }
    }
    if (unmapped.length > 0) {
      console.warn(`⚠️ ${unmapped.length} Visemes ohne Mapping:`, unmapped.join(', '));
    }

    // 5. Mapping im localStorage cachen (für Performance)
    this.cacheMapping(this.mappingReport);
  }

  /**
   * Match-Score berechnen (für Ranking)
   */
  private calculateMatchScore(viseme: string, targetName: string, pattern: RegExp): number {
    const nameLower = targetName.toLowerCase();
    const visemeLower = viseme.toLowerCase();

    // Exakte Übereinstimmung (nach Pattern-Match)
    if (nameLower.includes(visemeLower)) return 80;

    // Pattern-Match mit Länge-Bonus (kürzere Namen = spezifischer)
    let score = 50;
    if (targetName.length < 10) score += 10;
    if (targetName.length < 6) score += 10;

    return score;
  }

  /**
   * Lade optionales Override-Mapping (localStorage oder JSON)
   */
  private loadOverrideMapping(): { [viseme: string]: string } {
    const override: { [viseme: string]: string } = {};

    // 1. Versuche localStorage (vom Caching)
    try {
      const cached = localStorage.getItem('kaya_morph_override');
      if (cached) {
        const parsed = JSON.parse(cached);
        Object.assign(override, parsed);
        console.log('📦 Override-Mapping aus localStorage geladen');
      }
    } catch (e) {
      // Ignore
    }

    // 2. Versuche JSON-Datei (wird asynchron geladen, hier nur Platzhalter)
    // TODO: Asynchrones Laden von /avatar/morphmap.json implementieren

    return override;
  }

  /**
   * Cache Mapping im localStorage
   */
  private cacheMapping(mapping: { [viseme: string]: string | null }): void {
    try {
      localStorage.setItem('kaya_morph_mapping', JSON.stringify(mapping));
    } catch (e) {
      // Ignore (z. B. private browsing)
    }
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
   * Wende Viseme auf Morph Target an (mit Auto-Mapping)
   */
  private applyViseme(visemeName: string, weight: number): void {
    if (!this.morphTargetManager) return;

    // Normalisiere Viseme-Name (Groß-/Kleinschreibung)
    const visemeKey = visemeName.toLowerCase();

    // Versuche Auto-Mapping
    const mappedTarget = this.visemeToMorph[visemeKey];
    if (mappedTarget) {
      try {
        mappedTarget.influence = Math.max(0, Math.min(1, weight));
        return;
      } catch (error) {
        console.warn(`⚠️ Fehler beim Anwenden von ${visemeName} auf ${this.mappingReport[visemeKey]}:`, error);
      }
    }

    // Fallback 1: Direkte Suche nach Name
    try {
      const target = this.morphTargetManager.getTargetByName(visemeName);
      if (target) {
        target.influence = Math.max(0, Math.min(1, weight));
        return;
      }
    } catch (error) {
      // Ignore
    }

    // Fallback 2: Index-basiert
    try {
      const index = this.morphTargetManager.getTargetIndexByName(visemeName);
      if (index !== undefined && index >= 0) {
        const t = this.morphTargetManager.getTarget(index);
        if (t) t.influence = Math.max(0, Math.min(1, weight));
        return;
      }
    } catch (error) {
      // Ignore
    }

    // Silent fail - Viseme nicht gefunden (wird in Debug-Logs sichtbar)
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
   * Setze alle Visemes auf 0 (mit Auto-Mapping)
   */
  private resetAllVisemes(): void {
    if (!this.morphTargetManager) return;

    // Reset über Auto-Mapping (viel robuster)
    for (const viseme in this.visemeToMorph) {
      try {
        const target = this.visemeToMorph[viseme];
        if (target) target.influence = 0;
      } catch (error) {
        // Ignore
      }
    }

    // Fallback: Hardcoded Namen (für kompatibilität)
    const fallbackNames = [
      'mouthOpen', 'mouthO', 'mouthSmile_L', 'mouthSmile_R',
      'mouthFunnel', 'mouthClose', 'tongueOut', 'browInnerUp',
      'browDown_L', 'browDown_R', 'mouthFrown_L', 'mouthFrown_R'
    ];

    for (const name of fallbackNames) {
      try {
        const target = this.morphTargetManager.getTargetByName(name);
        if (target) target.influence = 0;
      } catch (error) {
        // Ignore
      }
    }
  }

  /**
   * Ist Lipsync aktiv?
   */
  get isRunning(): boolean {
    return this.isPlaying;
  }

  /**
   * Mapping-Report abrufen (für Debug)
   */
  getMappingReport(): { [viseme: string]: string | null } {
    return { ...this.mappingReport };
  }
}
