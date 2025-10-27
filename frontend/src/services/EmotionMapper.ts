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

export class EmotionMapper {
  private morphTargetManager: any;
  private glowLayer: any;
  private currentEmotion: EmotionType = 'neutral';
  private transitionDuration = 500; // ms
  private startTime = 0;
  private animationFrameId: number | null = null;

  constructor(morphTargetManager: any, glowLayer: any) {
    this.morphTargetManager = morphTargetManager;
    this.glowLayer = glowLayer;
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

      // Auf Morph Target anwenden
      try {
        const target = this.morphTargetManager.getTargetByName(key);
        if (target) {
          target.influence = currentValue;
        }
      } catch (error) {
        // Silently ignore
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

    // Alle Targets auf 0
    const targets = [
      'mouthSmile_L', 'mouthSmile_R', 'browInnerUp', 'mouthOpen',
      'mouthFunnel', 'mouthFrown_L', 'mouthFrown_R',
      'browDown_L', 'browDown_R'
    ];

    targets.forEach(name => {
      try {
        const target = this.morphTargetManager.getTargetByName(name);
        if (target) target.influence = 0;
      } catch (error) {
        // Ignore
      }
    });

    // Glow zurücksetzen
    if (this.glowLayer) {
      this.glowLayer.intensity = 0;
    }

    this.currentEmotion = 'neutral';
  }
}

