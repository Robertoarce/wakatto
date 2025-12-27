/**
 * LLM Configuration
 *
 * Centralized configuration for AI model parameters and behavior.
 * Modify these settings to control how the AI responds.
 */

export interface ModelParameters {
  temperature: number;      // Controls randomness (0.0 = deterministic, 2.0 = very random)
  maxTokens: number;        // Maximum response length
  topP?: number;            // Nucleus sampling (alternative to temperature)
  topK?: number;            // Top-K sampling (for some providers)
  frequencyPenalty?: number; // Reduces repetition (OpenAI)
  presencePenalty?: number;  // Encourages new topics (OpenAI)
}

/**
 * GLOBAL TEMPERATURE SETTING
 *
 * This single value controls the creativity/randomness of ALL character responses.
 * - 0.0-0.2: Very deterministic, focused, predictable (recommended for consistency)
 * - 0.3-0.5: Low creativity, mostly focused
 * - 0.6-0.8: Balanced creativity and consistency
 * - 0.9-1.2: High creativity, more varied responses
 * - 1.3-2.0: Very creative, potentially chaotic
 *
 * Default: 0.1 (extremely low for maximum consistency)
 */
export const DEFAULT_GLOBAL_TEMPERATURE = 0.1;

// Runtime temperature (can be changed via settings)
let globalTemperature = DEFAULT_GLOBAL_TEMPERATURE;

/**
 * Get the current global temperature
 */
export function getGlobalTemperature(): number {
  return globalTemperature;
}

/**
 * Set the global temperature (called from SettingsScreen)
 */
export function setGlobalTemperature(temperature: number): void {
  globalTemperature = Math.max(0, Math.min(2, temperature)); // Clamp between 0-2
  console.log(`[LLM Config] Global temperature set to: ${globalTemperature}`);
}

/**
 * Reset temperature to default
 */
export function resetGlobalTemperature(): void {
  globalTemperature = DEFAULT_GLOBAL_TEMPERATURE;
}

export interface ProviderConfig {
  defaultModel: string;
  parameters: ModelParameters;
}

/**
 * Configuration per provider
 *
 * You can customize these settings based on your needs:
 * - Lower temperature (0.3-0.5) = More focused, consistent responses
 * - Medium temperature (0.7-0.9) = Balanced creativity and consistency
 * - Higher temperature (1.0-1.5) = More creative, varied responses
 */
export const LLM_CONFIG: Record<string, ProviderConfig> = {
  openai: {
    defaultModel: 'gpt-4-turbo-preview',
    parameters: {
      temperature: 0.8,
      maxTokens: 1500,
      topP: 0.95,
      frequencyPenalty: 0.3,
      presencePenalty: 0.3,
    },
  },
  anthropic: {
    defaultModel: 'claude-3-5-sonnet-20241022', // Claude 3.5 Sonnet (best balance)
    parameters: {
      temperature: 0.8,
      maxTokens: 2000,
      topP: 0.95,
      topK: 40,
    },
  },
  anthropic_fast: {
    defaultModel: 'claude-3-haiku-20240307', // 3x faster than Sonnet
    parameters: {
      temperature: 0.8,
      maxTokens: 1500, // Increased from 800 - need room for 4+ responses with animations
      topP: 0.95,
      topK: 40,
    },
  },
  gemini: {
    defaultModel: 'gemini-1.5-pro',
    parameters: {
      temperature: 0.8,
      maxTokens: 2000,
      topP: 0.95,
      topK: 40,
    },
  },
  mock: {
    defaultModel: 'mock',
    parameters: {
      temperature: 0.7,
      maxTokens: 1000,
    },
  },
};

/**
 * Multi-character conversation settings
 */
export interface MultiCharacterConfig {
  enabled: boolean;
  maxCharacters: number;           // Maximum characters in one conversation
  interruptionChance: number;      // 0-1, probability a character interrupts
  reactionChance: number;          // 0-1, probability a character reacts to others
  minMessagesBeforeInterrupt: number; // Wait N messages before allowing interrupts
  enableCrossCharacterAwareness: boolean; // Characters aware of each other
}

/**
 * Multi-character conversation configuration
 *
 * Controls how characters interact with each other:
 * - enabled: Set to true to enable multi-character conversations
 * - interruptionChance: How often characters interrupt (0 = never, 1 = always)
 * - reactionChance: How often characters react to each other's messages
 */
export const MULTI_CHARACTER_CONFIG: MultiCharacterConfig = {
  enabled: true,
  maxCharacters: 5,
  interruptionChance: 0.3,        // 30% chance of interruption
  reactionChance: 0.5,            // 50% chance of reaction
  minMessagesBeforeInterrupt: 2,  // Wait 2 messages before interrupting
  enableCrossCharacterAwareness: true,
};

/**
 * Response timing settings (for multi-character mode)
 */
export interface ResponseTimingConfig {
  minDelayMs: number;           // Minimum delay before character responds
  maxDelayMs: number;           // Maximum delay before character responds
  typingIndicatorEnabled: boolean;
}

export const RESPONSE_TIMING: ResponseTimingConfig = {
  minDelayMs: 500,    // 0.5 seconds
  maxDelayMs: 2000,   // 2 seconds
  typingIndicatorEnabled: true,
};

/**
 * Orchestration Mode Configuration
 *
 * NEW: Choose between single-call (all characters in one API call)
 * or multi-call (separate API call per character)
 *
 * SINGLE-CALL BENEFITS:
 * - 33% cheaper (1 API call instead of 2-3)
 * - 40-50% faster responses
 * - Better coordinated interruptions and gestures
 * - Characters can reference each other more naturally
 *
 * MULTI-CALL BENEFITS:
 * - Slightly more distinct character voices
 * - More reliable (one failure doesn't block all)
 * - Easier to debug
 */
export interface OrchestrationModeConfig {
  mode: 'single-call' | 'multi-call' | 'auto'; // 'auto' intelligently switches
  enableFallback: boolean; // Fallback to multi-call if single-call fails
  singleCall: {
    maxResponders: number;
    includeGestures: boolean;
    includeInterruptions: boolean;
    verbosity: 'brief' | 'balanced' | 'detailed';
  };
}

export const ORCHESTRATION_CONFIG: OrchestrationModeConfig = {
  mode: 'single-call', // Default to single-call for cost/speed benefits
  enableFallback: true, // Automatically fallback to multi-call if needed
  singleCall: {
    maxResponders: 8, // Allow up to 8 for rare extended conversations (typically 3-5)
    includeGestures: true, // Enable gesture system (70+ gestures)
    includeInterruptions: true, // LLM decides when to interrupt
    verbosity: 'balanced', // 2-4 sentences per response
  },
};

/**
 * Get configuration for a specific provider
 */
export function getProviderConfig(provider: string): ProviderConfig {
  return LLM_CONFIG[provider] || LLM_CONFIG.anthropic;
}

/**
 * Get model parameters with optional overrides
 */
export function getModelParameters(
  provider: string,
  overrides?: Partial<ModelParameters>
): ModelParameters {
  const config = getProviderConfig(provider);
  return { ...config.parameters, ...overrides };
}

/**
 * Character-specific parameter overrides
 *
 * NOTE: Temperature is now controlled globally via getGlobalTemperature().
 * Only maxTokens can be customized per character.
 */
export const CHARACTER_PARAMETER_OVERRIDES: Record<string, Partial<ModelParameters>> = {
  freud: {
    maxTokens: 1800,
  },
  jung: {
    maxTokens: 2000,
  },
  adler: {
    maxTokens: 1500,
  },
  nietzsche: {
    maxTokens: 1800,
  },
  // Add more character overrides as needed
};

/**
 * Get parameters for a specific character
 * NOTE: Temperature is now set globally for ALL characters
 */
export function getCharacterParameters(
  characterId: string,
  provider: string
): ModelParameters {
  const baseParams = getModelParameters(provider);
  const overrides = CHARACTER_PARAMETER_OVERRIDES[characterId] || {};

  // Apply global temperature override (same for all characters)
  return {
    ...baseParams,
    ...overrides,
    temperature: getGlobalTemperature(), // Always use global temperature
  };
}
