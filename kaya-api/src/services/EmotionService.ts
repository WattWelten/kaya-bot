/**
 * Emotion Service
 * ML-based emotion detection using OpenAI for improved accuracy
 */

import logger from '../utils/logger';
import { EmotionAnalysis } from '../types';

class EmotionService {
  private openaiApiKey: string;
  private keywordEmotions: Record<string, string[]> = {
    happy: ['freude', 'glücklich', 'zufrieden', 'super', 'toll', 'fantastisch', 'wunderbar', 'perfekt', 'ausgezeichnet'],
    sad: ['traurig', 'trauer', 'deprimiert', 'niedergeschlagen', 'unglücklich', 'enttäuscht'],
    angry: ['wütend', 'ärgerlich', 'frustriert', 'verärgert', 'empört', 'sauer'],
    surprised: ['überrascht', 'erstaunt', 'verblüfft', 'verwundert', 'unglaublich'],
    fearful: ['ängstlich', 'besorgt', 'nervös', 'unsicher', 'panisch', 'sorge'],
    disgusted: ['ekel', 'widerlich', 'abstoßend', 'abscheulich'],
    neutral: ['normal', 'okay', 'standard', 'üblich', 'neutral'],
  };

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
    if (!this.openaiApiKey) {
      logger.warn('OPENAI_API_KEY not set, using keyword-based emotion detection only');
    }
  }

  /**
   * Analyze emotion from text using ML (OpenAI) + Keyword fallback
   */
  async analyzeEmotion(text: string, useML: boolean = true): Promise<EmotionAnalysis> {
    const startTime = Date.now();

    try {
      // Try ML-based detection first if enabled
      if (useML && this.openaiApiKey) {
        try {
          const mlEmotion = await this.analyzeEmotionML(text);
          if (mlEmotion.confidence > 60) {
            logger.debug('ML emotion detection successful', {
              emotion: mlEmotion.emotion,
              confidence: mlEmotion.confidence,
            });
            return mlEmotion;
          }
        } catch (error) {
          logger.warn('ML emotion detection failed, falling back to keywords', error as Error);
        }
      }

      // Fallback to keyword-based detection
      return this.analyzeEmotionKeywords(text, startTime);
    } catch (error) {
      logger.error('Emotion analysis error', error as Error);
      return {
        emotion: 'neutral',
        confidence: 0,
        scores: {},
        processingTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * ML-based emotion detection using OpenAI
   */
  private async analyzeEmotionML(text: string): Promise<EmotionAnalysis> {
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: this.openaiApiKey });

    const prompt = `Analysiere die Emotion im folgenden Text. Antworte NUR mit einem JSON-Objekt im Format:
{
  "emotion": "happy|sad|angry|surprised|fearful|disgusted|neutral",
  "confidence": 0-100,
  "reason": "kurze Begründung"
}

Text: "${text.substring(0, 500)}"`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Du bist ein Experte für Emotion-Analyse. Antworte NUR mit JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 100,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

    return {
      emotion: parsed.emotion || 'neutral',
      confidence: parsed.confidence || 50,
      scores: { [parsed.emotion]: parsed.confidence },
      processingTime: Date.now(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Keyword-based emotion detection (fallback)
   */
  private analyzeEmotionKeywords(text: string, startTime: number): EmotionAnalysis {
    const textLower = text.toLowerCase();
    const emotionScores: Record<string, number> = {};

    // Score emotions based on keywords
    for (const [emotion, keywords] of Object.entries(this.keywordEmotions)) {
      emotionScores[emotion] = keywords.reduce((score, keyword) => {
        return score + (textLower.includes(keyword) ? 1 : 0);
      }, 0);
    }

    // Find best emotion
    const bestEmotion = Object.keys(emotionScores).reduce((a, b) =>
      emotionScores[a] > emotionScores[b] ? a : b
    );

    const confidence = Math.min(emotionScores[bestEmotion] * 20, 100);

    return {
      emotion: bestEmotion,
      confidence,
      scores: emotionScores,
      processingTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get emotion transition (smooth transition between emotions)
   */
  getEmotionTransition(
    currentEmotion: string,
    targetEmotion: string,
    duration: number = 1000
  ): Array<{ emotion: string; timestamp: number }> {
    if (currentEmotion === targetEmotion) {
      return [{ emotion: currentEmotion, timestamp: Date.now() }];
    }

    const steps = Math.ceil(duration / 100);
    const transitions: Array<{ emotion: string; timestamp: number }> = [];
    const now = Date.now();

    // Smooth transition: stay on current, then switch to target
    for (let i = 0; i < steps; i++) {
      const progress = i / steps;
      const emotion = progress < 0.7 ? currentEmotion : targetEmotion;
      transitions.push({
        emotion,
        timestamp: now + (i * 100),
      });
    }

    return transitions;
  }
}

export default EmotionService;

