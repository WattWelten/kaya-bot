/**
 * Service Interface Definitions
 * These interfaces define contracts for all services
 */

import { KayaResponse, EmotionAnalysis, VisemeSegment, Session } from './index';

export interface ILLMService {
  generateResponse(query: string, context: any): Promise<KayaResponse>;
  generateResponseStream(query: string, context: any): Promise<any>;
  buildSystemPrompt(context: any): string;
  isAvailable(): boolean;
}

export interface IAudioService {
  speechToText(audioBuffer: Buffer): Promise<{ text: string; success: boolean; language?: string; latency?: number }>;
  textToSpeech(text: string, voiceId?: string): Promise<{ audio: Buffer; audioUrl?: string; visemeTimeline?: VisemeSegment[] }>;
  getMetrics(): any;
}

export interface IAvatarService {
  analyzeEmotion(text: string, avatarId?: string | null): EmotionAnalysis;
  setAvatarEmotion(avatarId: string, emotion: string, confidence?: number): boolean;
  executeGesture(avatarId: string, gestureType: string, duration?: number): boolean;
  playAnimation(avatarId: string, animationType: string, duration?: number): boolean;
  getAvatarStatus(avatarId: string): any;
  getMetrics(): any;
}

export interface IWebSocketService {
  sendToSession(sessionId: string, message: any): boolean;
  sendToClient(clientId: string, message: any): boolean;
  broadcast(message: any, room?: string): void;
  getClient(sessionId: string): any;
  getMetrics(): any;
}

export interface ISessionRepository {
  getSession(sessionId: string): Promise<Session | null>;
  createSession(sessionId: string, initialData?: any): Promise<Session>;
  updateSession(sessionId: string, updates: Partial<Session>): Promise<Session | null>;
  deleteSession(sessionId: string): Promise<boolean>;
  cleanupExpiredSessions(maxAge?: number): Promise<number>;
}

export interface ICacheRepository {
  get<T>(key: string, namespace?: string): Promise<T | null>;
  set<T>(key: string, value: T, namespace?: string, ttl?: number): Promise<boolean>;
  delete(key: string, namespace?: string): Promise<boolean>;
  clear(namespace?: string): Promise<number>;
  getStats(): Promise<any>;
}

export interface IAgentRepository {
  getAgentData(agentName: string): Promise<any>;
  getAllAgents(): Promise<string[]>;
  reloadAgentData(agentName?: string): Promise<void>;
  getLastUpdate(agentName: string): Promise<Date | null>;
}

