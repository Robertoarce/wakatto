/**
 * Ax LLM Service
 *
 * Unified LLM service using @ax-llm/ax for type-safe AI interactions.
 * Replaces manual provider implementations with a single, clean API.
 *
 * Benefits:
 * - Type-safe outputs inferred from signatures
 * - Built-in streaming support
 * - Automatic retries and validation
 * - Single API for all providers
 *
 * @see https://axllm.dev
 */

import { ai, AxAI, AxGen } from '@ax-llm/ax';
import {
  characterResponseSignature,
  CharacterResponseOutput,
  conversationTitleSignature,
  ConversationTitleOutput,
  entityExtractionSignature,
  EntityExtractionOutput,
  orchestrationSignature,
  OrchestrationOutput,
  sentimentSignature,
  SentimentOutput,
  bobSalesSignature,
  BobSalesOutput,
} from './axSignatures';
import { getGlobalTemperature } from '../../config/llmConfig';

// ============================================
// PROVIDER CONFIGURATION
// ============================================

export type AxProvider = 'anthropic' | 'openai' | 'google-gemini';

interface AxServiceConfig {
  provider: AxProvider;
  apiKey?: string;
  model?: string;
}

// Default models per provider
const DEFAULT_MODELS: Record<AxProvider, string> = {
  anthropic: 'claude-3-5-sonnet-20241022',
  openai: 'gpt-4-turbo-preview',
  'google-gemini': 'gemini-1.5-pro',
};

// ============================================
// AI CLIENT FACTORY
// ============================================

let cachedAI: AxAI | null = null;
let cachedProvider: AxProvider | null = null;

/**
 * Get or create an AxAI client using the ai() factory function
 */
export function getAxAI(config: AxServiceConfig): AxAI {
  // Return cached client if same provider
  if (cachedAI && cachedProvider === config.provider) {
    return cachedAI;
  }

  const model = config.model || DEFAULT_MODELS[config.provider];

  // Use the ai() factory function for better type safety
  cachedAI = ai({
    name: config.provider,
    apiKey: config.apiKey,
    model,
  } as any); // Type assertion needed due to dynamic provider

  cachedProvider = config.provider;
  return cachedAI;
}

/**
 * Clear the cached AI client (call when switching providers)
 */
export function clearAxAICache(): void {
  cachedAI = null;
  cachedProvider = null;
}

// ============================================
// STREAMING CALLBACKS
// ============================================

export interface AxStreamCallbacks {
  onStart?: () => void;
  onDelta?: (text: string, accumulated: string) => void;
  onComplete?: (result: unknown, durationMs: number) => void;
  onError?: (error: Error) => void;
}

// ============================================
// CHARACTER RESPONSE
// ============================================

interface CharacterResponseInput {
  characterName: string;
  characterPersonality: string;
  conversationHistory: string;
  userMessage: string;
}

/**
 * Generate a character response with emotion and animation
 */
export async function generateCharacterResponse(
  axAI: AxAI,
  input: CharacterResponseInput,
  options?: {
    stream?: boolean;
    callbacks?: AxStreamCallbacks;
    temperature?: number;
  }
): Promise<CharacterResponseOutput> {
  const gen = new AxGen(characterResponseSignature);

  const temperature = options?.temperature ?? getGlobalTemperature();
  const startTime = Date.now();

  if (options?.stream && options.callbacks) {
    let accumulated = '';
    options.callbacks.onStart?.();

    try {
      // Use streamingForward for streaming responses
      const stream = gen.streamingForward(axAI, input, {
        modelConfig: { temperature },
      });

      let lastResult: CharacterResponseOutput | undefined;

      for await (const chunk of stream) {
        // Handle delta updates
        if (chunk.delta) {
          const deltaText = typeof chunk.delta === 'string'
            ? chunk.delta
            : (chunk.delta as any).response || '';
          if (deltaText) {
            accumulated += deltaText;
            options.callbacks?.onDelta?.(deltaText, accumulated);
          }
        }
        // Keep track of the partial result
        if (chunk.partial) {
          lastResult = chunk.partial as CharacterResponseOutput;
        }
      }

      const durationMs = Date.now() - startTime;
      const finalResult = lastResult || { response: accumulated, emotion: 'neutral', animation: 'idle' } as CharacterResponseOutput;
      options.callbacks.onComplete?.(finalResult, durationMs);
      return finalResult;
    } catch (error) {
      options.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  // Non-streaming forward
  const result = await gen.forward(axAI, input, {
    modelConfig: { temperature },
  });

  return result as CharacterResponseOutput;
}

// ============================================
// CONVERSATION TITLE
// ============================================

/**
 * Generate a discreet conversation title
 */
export async function generateTitle(
  axAI: AxAI,
  userMessage: string
): Promise<string> {
  const gen = new AxGen(conversationTitleSignature);

  const result = await gen.forward(axAI, { userMessage }) as ConversationTitleOutput;

  // Clean up the title
  let title = result.title.trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\n/g, ' ')
    .trim();

  // Enforce length limit
  if (title.length > 50) {
    title = title.substring(0, 47) + '...';
  }

  return title.length >= 3 ? title : 'New Conversation';
}

// ============================================
// ENTITY EXTRACTION
// ============================================

/**
 * Extract entities from text using AI
 */
export async function extractEntities(
  axAI: AxAI,
  text: string
): Promise<EntityExtractionOutput['entities']> {
  const gen = new AxGen(entityExtractionSignature);

  try {
    const result = await gen.forward(axAI, { text }) as EntityExtractionOutput;
    return result.entities || [];
  } catch (error) {
    console.error('[AxService] Entity extraction error:', error);
    return [];
  }
}

// ============================================
// MULTI-CHARACTER ORCHESTRATION
// ============================================

interface OrchestrationInput {
  characters: Array<{ id: string; name: string; personality: string }>;
  conversationHistory: string;
  userMessage: string;
  maxResponses?: number;
}

/**
 * Orchestrate a multi-character conversation
 */
export async function generateOrchestration(
  axAI: AxAI,
  input: OrchestrationInput,
  options?: {
    stream?: boolean;
    callbacks?: AxStreamCallbacks;
  }
): Promise<OrchestrationOutput> {
  const gen = new AxGen(orchestrationSignature);

  const startTime = Date.now();

  const axInput = {
    characters: input.characters,
    conversationHistory: input.conversationHistory,
    userMessage: input.userMessage,
    maxResponses: input.maxResponses || 4,
  };

  if (options?.stream && options.callbacks) {
    let accumulated = '';
    options.callbacks.onStart?.();

    try {
      const stream = gen.streamingForward(axAI, axInput);
      let lastResult: OrchestrationOutput | undefined;

      for await (const chunk of stream) {
        if (chunk.delta) {
          const deltaText = typeof chunk.delta === 'string'
            ? chunk.delta
            : JSON.stringify(chunk.delta);
          accumulated += deltaText;
          options.callbacks?.onDelta?.(deltaText, accumulated);
        }
        if (chunk.partial) {
          lastResult = chunk.partial as OrchestrationOutput;
        }
      }

      const durationMs = Date.now() - startTime;
      const finalResult = lastResult || { responses: [] } as OrchestrationOutput;
      options.callbacks.onComplete?.(finalResult, durationMs);
      return finalResult;
    } catch (error) {
      options.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  const result = await gen.forward(axAI, axInput);
  return result as OrchestrationOutput;
}

// ============================================
// SENTIMENT ANALYSIS
// ============================================

/**
 * Analyze sentiment of user message
 */
export async function analyzeSentiment(
  axAI: AxAI,
  text: string
): Promise<SentimentOutput> {
  const gen = new AxGen(sentimentSignature);

  const result = await gen.forward(axAI, { text });
  return result as SentimentOutput;
}

// ============================================
// BOB SALES RESPONSE
// ============================================

interface BobSalesInput {
  userMessage: string;
  userStatus: {
    tier: string;
    tokensUsed: number;
    tokenLimit: number;
    trialDaysRemaining?: number;
  };
  conversationContext: string;
}

/**
 * Generate Bob's sales response
 */
export async function generateBobResponse(
  axAI: AxAI,
  input: BobSalesInput,
  options?: {
    stream?: boolean;
    callbacks?: AxStreamCallbacks;
  }
): Promise<BobSalesOutput> {
  const gen = new AxGen(bobSalesSignature);

  const startTime = Date.now();

  if (options?.stream && options.callbacks) {
    let accumulated = '';
    options.callbacks.onStart?.();

    try {
      const stream = gen.streamingForward(axAI, input);
      let lastResult: BobSalesOutput | undefined;

      for await (const chunk of stream) {
        if (chunk.delta) {
          const deltaText = typeof chunk.delta === 'string'
            ? chunk.delta
            : (chunk.delta as any).response || '';
          if (deltaText) {
            accumulated += deltaText;
            options.callbacks?.onDelta?.(deltaText, accumulated);
          }
        }
        if (chunk.partial) {
          lastResult = chunk.partial as BobSalesOutput;
        }
      }

      const durationMs = Date.now() - startTime;
      const finalResult = lastResult || { response: accumulated, suggestedAction: 'none', emotion: 'friendly' } as BobSalesOutput;
      options.callbacks.onComplete?.(finalResult, durationMs);
      return finalResult;
    } catch (error) {
      options.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  const result = await gen.forward(axAI, input);
  return result as BobSalesOutput;
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Quick character response with default provider
 */
export async function quickCharacterResponse(
  characterName: string,
  characterPersonality: string,
  userMessage: string,
  conversationHistory: string = '',
  provider: AxProvider = 'anthropic'
): Promise<CharacterResponseOutput> {
  const axAI = getAxAI({ provider });

  return generateCharacterResponse(axAI, {
    characterName,
    characterPersonality,
    conversationHistory,
    userMessage,
  });
}

/**
 * Quick title generation with default provider
 */
export async function quickTitle(
  userMessage: string,
  provider: AxProvider = 'anthropic'
): Promise<string> {
  const axAI = getAxAI({ provider });
  return generateTitle(axAI, userMessage);
}
