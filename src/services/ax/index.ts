/**
 * Ax LLM Integration
 *
 * Type-safe LLM interactions using @ax-llm/ax
 *
 * Usage:
 *   import { getAxAI, generateCharacterResponse } from '../services/ax';
 *
 *   const ai = getAxAI({ provider: 'anthropic' });
 *   const result = await generateCharacterResponse(ai, {
 *     characterName: 'Dr. Freud',
 *     characterPersonality: 'Psychoanalyst with deep insights...',
 *     conversationHistory: '',
 *     userMessage: 'I had a strange dream last night...'
 *   });
 *
 *   console.log(result.response);  // Type-safe string
 *   console.log(result.emotion);   // Type-safe: 'joyful' | 'thoughtful' | ...
 *   console.log(result.animation); // Type-safe: 'thinking' | 'nod' | ...
 */

// Re-export signatures and types
export {
  // Signatures
  characterResponseSignature,
  conversationTitleSignature,
  entityExtractionSignature,
  orchestrationSignature,
  sentimentSignature,
  bobSalesSignature,

  // Types
  type Emotion,
  type Animation,
  type CharacterResponseOutput,
  type ConversationTitleOutput,
  type EntityExtractionOutput,
  type ExtractedEntity,
  type OrchestrationOutput,
  type OrchestrationResponse,
  type SentimentOutput,
  type BobSalesOutput,

  // Constants
  EMOTIONS,
  ANIMATIONS,
} from './axSignatures';

// Re-export service functions
export {
  // Provider config
  type AxProvider,
  getAxAI,
  clearAxAICache,

  // Streaming
  type AxStreamCallbacks,

  // Core functions
  generateCharacterResponse,
  generateTitle,
  extractEntities,
  generateOrchestration,
  analyzeSentiment,
  generateBobResponse,

  // Convenience functions
  quickCharacterResponse,
  quickTitle,
} from './axService';
