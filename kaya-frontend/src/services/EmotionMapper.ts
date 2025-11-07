/**
 * EmotionMapper - Emotion → Avatar Mimik/Gestik
 * 
 * Mappt Emotions (frustrated, anxious, positive, neutral) auf
 * Morph Target Kombinationen + Glow Intensity
 */

export type EmotionType = 'neutral' | 'positive' | 'anxious' | 'frustrated';

export interface EmotionConfig {
  faceExpression: {
    [morphTarget: string]: number; // 0-1 influence
  };
  glowIntensity: number; // 0-1
}

// Emotion-Target Mapping: Unterstützung für verschiedene Namensvarianten
const EMOTION_TARGET_PATTERNS: { [key: string]: RegExp[] } = {
  'mouthSmile_L': [/mouthsmile.*left/i, /mouth.*smile.*l/i, /smile.*left/i],
  'mouthSmile_R': [/mouthsmile.*right/i, /mouth.*smile.*r/i, /smile.*right/i],
  'mouthFrown_L': [/mouthfrown.*left/i, /mouth.*frown.*l/i, /frown.*left/i],
  'mouthFrown_R': [/mouthfrown.*right/i, /mouth.*frown.*r/i, /frown.*right/i],
  'browInnerUp': [/brow.*inner.*up/i, /brow.*up/i, /eyebrow.*up/i],
  'browDown_L': [/brow.*down.*left/i, /brow.*down.*l/i, /eyebrow.*down.*left/i],
  'browDown_R': [/brow.*down.*right/i, /brow.*down.*r/i, /eyebrow.*down.*right/i],
  'mouthOpen': [/mouth.*open/i, /jaw.*open/i, /open.*mouth/i],
  'mouthFunnel': [/mouth.*funnel/i, /funnel/i, /pucker/i]
};

export class EmotionMapper {
  private morphTargetManager: any;
  private glowLayer: any;
  private currentEmotion: EmotionType = 'neutral';
  private transitionDuration = 500; // ms
  private startTime = 0;
  private animationFrameId: number | null = null;
  private emotionTargetMapping: { [key: string]: any } = {}; // Auto-detected mapping

  constructor(morphTargetManager: any, glowLayer: any) {
    this.morphTargetManager = morphTargetManager;
    this.glowLayer = glowLayer;
    this.autoDetectEmotionTargets();
  }

  /**
   * Auto-Detection: Finde MorphTargets für Emotion-Targets
   */
  private autoDetectEmotionTargets(): void {
    if (!this.morphTargetManager) {
      console.warn('⚠️ MorphTargetManager nicht vorhanden - kein Auto-Mapping für Emotionen möglich');
      return;
    }

    // Alle verfügbaren MorphTargets auflisten
    const allTargets: Array<{ name: string; target: any }> = [];
    try {
      const numTargets = this.morphTargetManager.numTargets || 0;
      for (let i = 0; i < numTargets; i++) {
        const target = this.morphTargetManager.getTarget(i);
        if (target) {
          const name = target.name || `morph_${i}`;
          allTargets.push({ name, target });
        }
      }
    } catch (error) {
      console.error('❌ Fehler beim Auflisten der MorphTargets für Emotionen:', error);
      return;
    }

    // Für jedes Emotion-Target: Bestes Matching finden
    const emotionTargetKeys = Object.keys(EMOTION_TARGET_PATTERNS);
    
    for (const emotionKey of emotionTargetKeys) {
      const nameLower = emotionKey.toLowerCase();
      let bestMatch: { name: string; target: any } | null = null;

      for (const targetInfo of allTargets) {
        const targetNameLower = targetInfo.name.toLowerCase();
        
        // Exakte Übereinstimmung (höchste Priorität)
        if (targetNameLower === nameLower) {
          bestMatch = { name: targetInfo.name, target: targetInfo.target };
          break;
        }

        // Fallback: Unterstützung für _L/_R vs Left/Right
        const leftRightVariants = [
          targetNameLower.replace(/left/i, 'l'),
          targetNameLower.replace(/right/i, 'r'),
          targetNameLower.replace(/_l$/, 'left'),
          targetNameLower.replace(/_r$/, 'right')
        ];
        
        if (leftRightVariants.some(v => v === nameLower)) {
          bestMatch = { name: targetInfo.name, target: targetInfo.target };
          continue;
        }

        // Pattern-Matching
        const patterns = EMOTION_TARGET_PATTERNS[emotionKey] || [];
        for (const pattern of patterns) {
          if (pattern.test(targetInfo.name)) {
            if (!bestMatch) {
              bestMatch = { name: targetInfo.name, target: targetInfo.target };
            }
            break;
          }
        }
      }

      if (bestMatch) {
        this.emotionTargetMapping[emotionKey] = bestMatch.target;
        console.log(`😊 Emotion-Target gemappt: ${emotionKey} → ${bestMatch.name}`);
      } else {
        console.warn(`⚠️ Emotion-Target nicht gefunden: ${emotionKey}`);
      }
    }
  }

  /**
   * Finde Morph Target für Emotion-Target-Name (mit Auto-Detection)
   */
  private findEmotionTarget(targetName: string): any | null {
    // Versuche direktes Mapping
    if (this.emotionTargetMapping[targetName]) {
      return this.emotionTargetMapping[targetName];
    }

    // Fallback: Direkte Suche nach Name
    if (this.morphTargetManager) {
      try {
        const target = this.morphTargetManager.getTargetByName(targetName);
        if (target) return target;
      } catch (error) {
        // Ignore
      }

      // Fallback: Unterstützung für Namensvarianten
      const nameLower = targetName.toLowerCase();
      const variants = [
        nameLower.replace(/_l$/, 'left'),
        nameLower.replace(/_r$/, 'right'),
        nameLower.replace(/left/i, '_l'),
        nameLower.replace(/right/i, '_r')
      ];

      for (const variant of variants) {
        try {
          const target = this.morphTargetManager.getTargetByName(variant);
          if (target) return target;
        } catch (error) {
          // Ignore
        }
      }
    }

    return null;
  }

  /**
   * Wende Emotion mit Smooth Transition an
   */
  async applyEmotion(emotion: EmotionType, confidence: number): Promise<void> {
    const config = this.getEmotionConfig(emotion, confidence);
    
    console.log(`😊 Emotion: ${emotion} (${Math.round(confidence)}%)`);

    // Smooth Transition von currentEmotion zu neuem Emotion
    await this.transitionToEmotion(emotion, config);

    this.currentEmotion = emotion;
  }

  /**
   * Hole Emotion-Konfiguration
   */
  private getEmotionConfig(emotion: EmotionType, confidence: number): EmotionConfig {
    const normalizedConfidence = confidence / 100;

    switch (emotion) {
      case 'positive':
        return {
          faceExpression: {
            mouthSmile_L: 0.6 * normalizedConfidence,
            mouthSmile_R: 0.6 * normalizedConfidence,
            browInnerUp: 0.3 * normalizedConfidence,
            mouthOpen: 0.2 * normalizedConfidence
          },
          glowIntensity: 0.6 * normalizedConfidence
        };

      case 'anxious':
        return {
          faceExpression: {
            browDown_L: 0.5 * normalizedConfidence,
            browDown_R: 0.5 * normalizedConfidence,
            mouthFunnel: 0.3 * normalizedConfidence
          },
          glowIntensity: 0.4 * normalizedConfidence
        };

      case 'frustrated':
        return {
          faceExpression: {
            mouthFrown_L: 0.4 * normalizedConfidence,
            mouthFrown_R: 0.4 * normalizedConfidence,
            browDown_L: 0.6 * normalizedConfidence,
            browDown_R: 0.6 * normalizedConfidence,
            mouthOpen: 0.2 * normalizedConfidence
          },
          glowIntensity: 1.0 * normalizedConfidence
        };

      case 'neutral':
      default:
        return {
          faceExpression: {},
          glowIntensity: 0
        };
    }
  }

  /**
   * Smooth Transition zu neuer Emotion
   */
  private async transitionToEmotion(emotion: EmotionType, config: EmotionConfig): Promise<void> {
    const startConfig = this.getEmotionConfig(this.currentEmotion, 100);
    const endConfig = config;
    
    this.startTime = Date.now();
    
    return new Promise((resolve) => {
      const animate = (timestamp: number) => {
        const elapsed = timestamp - this.startTime;
        const progress = Math.min(elapsed / this.transitionDuration, 1);

        // Ease-In-Out für smooth Transition
        const t = progress * (2 - progress);

        // Interpolate Face Expression
        this.interpolateFaceExpression(startConfig.faceExpression, endConfig.faceExpression, t);
        
        // Interpolate Glow
        const glowStart = startConfig.glowIntensity;
        const glowEnd = endConfig.glowIntensity;
        const glowCurrent = glowStart + (glowEnd - glowStart) * t;
        
        if (this.glowLayer) {
          this.glowLayer.intensity = glowCurrent;
          // Update Glow Layer nur wenn > 0
          if (glowCurrent > 0.1 && this.morphTargetManager) {
            // Get main mesh for glow
            const meshes = [];
            // Add meshes to glow layer
            this.glowLayer.addIncludedOnlyMesh = (mesh: any) => {
              const includedOnlyMeshes = (this.glowLayer as any).includedOnlyMeshes || [];
              if (includedOnlyMeshes.indexOf(mesh) === -1) {
                includedOnlyMeshes.push(mesh);
                (this.glowLayer as any).includedOnlyMeshes = includedOnlyMeshes;
              }
            };
          }
        }

        if (progress < 1) {
          this.animationFrameId = requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      this.animationFrameId = requestAnimationFrame(animate);
    });
  }

  /**
   * Interpoliere Face Expression zwischen zwei Configs
   */
  private interpolateFaceExpression(start: { [key: string]: number }, end: { [key: string]: number }, t: number): void {
    if (!this.morphTargetManager) return;

    // Alle unique keys sammeln
    const allKeys = new Set([...Object.keys(start), ...Object.keys(end)]);

    allKeys.forEach(key => {
      const startValue = start[key] || 0;
      const endValue = end[key] || 0;
      const currentValue = startValue + (endValue - startValue) * t;

      // Auf Morph Target anwenden (mit Auto-Detection)
      const target = this.findEmotionTarget(key);
      if (target) {
        try {
          target.influence = currentValue;
        } catch (error) {
          // Silently ignore
        }
      }
    });
  }

  /**
   * Stoppe Emotion-Animation
   */
  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Neutral zurücksetzen
    this.resetToNeutral();
  }

  /**
   * Setze Avatar auf Neutral
   */
  private resetToNeutral(): void {
    if (!this.morphTargetManager) return;

    // Alle Targets auf 0 (mit Auto-Detection)
    const targets = [
      'mouthSmile_L', 'mouthSmile_R', 'browInnerUp', 'mouthOpen',
      'mouthFunnel', 'mouthFrown_L', 'mouthFrown_R',
      'browDown_L', 'browDown_R'
    ];

    targets.forEach(name => {
      const target = this.findEmotionTarget(name);
      if (target) {
        try {
          target.influence = 0;
        } catch (error) {
          // Ignore
        }
      }
    });

    // Glow zurücksetzen
    if (this.glowLayer) {
      this.glowLayer.intensity = 0;
    }

    this.currentEmotion = 'neutral';
  }
}

