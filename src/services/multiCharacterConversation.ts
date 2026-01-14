/**
 * Multi-Character Conversation Types
 *
 * Type definitions for multi-character conversations.
 * All orchestration logic is now handled by singleCallOrchestration.ts.
 */

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  characterId?: string;
  timestamp: number;
}

export interface CharacterResponse {
  characterId: string;
  content: string;
  isInterruption: boolean;
  isReaction: boolean;
  gesture?: string; // Optional gesture ID from characterGestures.ts
  timing?: 'immediate' | 'delayed'; // Response timing (for single-call orchestration)
}
