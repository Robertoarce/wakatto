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
 * Single-Call Orchestration Configuration
 *
 * All conversations use single-call orchestration:
 * - One API call generates all character responses
 * - Works for 1 or more characters
 * - Better coordinated animations and gestures
 * - 33% cheaper and 40-50% faster than multi-call
 */
export interface OrchestrationConfig {
  maxResponders: number;
  includeGestures: boolean;
  includeInterruptions: boolean;
  verbosity: 'brief' | 'balanced' | 'detailed';
}

export const ORCHESTRATION_CONFIG: OrchestrationConfig = {
  maxResponders: 8, // Allow up to 8 for rare extended conversations (typically 3-5)
  includeGestures: true, // Enable gesture system (70+ gestures)
  includeInterruptions: true, // LLM decides when to interrupt
  verbosity: 'balanced', // 2-4 sentences per response
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
