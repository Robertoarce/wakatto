/**
 * AI Service
 *
 * This service handles AI API calls for generating responses.
 * Currently supports: OpenAI GPT, Anthropic Claude, Google Gemini
 *
 * SECURITY NOTE: API keys are now stored in secure storage with basic obfuscation.
 * For production, use Supabase Edge Functions or a backend server as a proxy.
 */

import { setSecureItem, getSecureItem, deleteSecureItem } from './secureStorage';
import { supabase, supabaseUrl } from '../lib/supabase';

// AI Provider configuration
interface AIConfig {
  provider: 'openai' | 'anthropic' | 'gemini' | 'mock';
  apiKey: string;
  model?: string;
}

// Message format for AI
interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// In-memory config (API key stored separately in secure storage)
let config: AIConfig = {
  provider: 'anthropic', // Default to Claude
  apiKey: '', // Will be loaded from secure storage or environment
  model: 'claude-3-haiku-20240307', // Claude 3 Haiku (fast and available on your tier)
};

// Load API key from secure storage on initialization
let apiKeyPromise: Promise<string | null> | null = null;

/**
 * Load API key from environment or secure storage
 * Priority: Environment variable > Secure storage
 */
async function loadAPIKey(): Promise<string> {
  // First, check environment variable (for development)
  const envKey = process.env.CLAUDE_API_KEY;
  if (envKey) {
    console.log('[AI] Using API key from environment variable');
    return envKey;
  }

  // Fall back to secure storage
  if (!apiKeyPromise) {
    apiKeyPromise = getSecureItem('ai_api_key');
  }
  const key = await apiKeyPromise;
  return key || '';
}

// Helper for non-secure storage (web only fallback)
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.localStorage) {
        // @ts-ignore
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      // Ignore errors
    }
    return null;
  },
  setItem: (key: string, value: string) => {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.localStorage) {
        // @ts-ignore
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      // Ignore errors
    }
  }
};

/**
 * Configure the AI service
 */
export async function configureAI(newConfig: Partial<AIConfig>) {
  config = { ...config, ...newConfig };

  // Store API key securely if provided
  if (newConfig.apiKey) {
    await setSecureItem('ai_api_key', newConfig.apiKey);
    apiKeyPromise = Promise.resolve(newConfig.apiKey);
  }

  // Store provider and model in regular storage (non-sensitive)
  if (newConfig.provider) {
    safeLocalStorage.setItem('ai_provider', newConfig.provider);
  }
  if (newConfig.model) {
    safeLocalStorage.setItem('ai_model', newConfig.model);
  }
}

/**
 * Get current AI configuration (without API key for security)
 */
export async function getAIConfig(): Promise<Omit<AIConfig, 'apiKey'> & { apiKey: string }> {
  // Load API key from secure storage
  const apiKey = await loadAPIKey();

  return {
    ...config,
    apiKey: apiKey || '', // Return actual key only when needed
  };
}

/**
 * Initialize AI service (load config from storage or environment)
 */
export async function initializeAI() {
  const provider = safeLocalStorage.getItem('ai_provider') as AIConfig['provider'] | null;
  const model = safeLocalStorage.getItem('ai_model');
  const apiKey = await loadAPIKey();

  // Use stored preferences, or defaults if none exist
  if (provider) config.provider = provider;
  if (model) config.model = model;
  if (apiKey) {
    config.apiKey = apiKey;
    console.log('[AI] Initialized with API key from', process.env.CLAUDE_API_KEY ? 'environment' : 'secure storage');
  }
}

/**
 * Clear API key from secure storage
 */
export async function clearAPIKey() {
  await deleteSecureItem('ai_api_key');
  config.apiKey = '';
  apiKeyPromise = null;
}

/**
 * Generate AI response using the configured provider
 * Uses Supabase Edge Function to avoid CORS issues
 */
export async function generateAIResponse(
  messages: AIMessage[],
  systemPrompt?: string,
  requestConfig?: { provider?: string; model?: string }
): Promise<string> {
  const fullMessages: AIMessage[] = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  // Use provided config or fall back to global config
  const currentProvider = requestConfig?.provider || config.provider;
  const currentModel = requestConfig?.model || config.model;

  // Use mock for testing without API
  if (currentProvider === 'mock') {
    return generateMockResponse(fullMessages);
  }

  try {
    // Call Supabase Edge Function (avoids CORS issues)
    console.log('[AI] Calling Edge Function with provider:', currentProvider);

    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/ai-chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify({
          messages: fullMessages,
          provider: currentProvider,
          model: currentModel,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('[AI] Edge Function error:', error);
      throw new Error(error.error || 'Failed to generate AI response');
    }

    const data = await response.json();
    console.log('[AI] Edge Function success!');
    return data.content;
  } catch (error: any) {
    console.error('[AI] Error:', error);
    throw error;
  }
}



/**
 * Mock AI response for development (no API key needed)
 */
async function generateMockResponse(messages: AIMessage[]): Promise<string> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const lastUserMessage = messages.filter(m => m.role === 'user').pop();

  if (!lastUserMessage) {
    return "Hello! I'm here to help you with your journaling. What's on your mind today?";
  }

  const content = lastUserMessage.content.toLowerCase();

  // Generate contextual mock responses based on user input
  if (content.includes('hello') || content.includes('hi')) {
    return "Hello! It's great to hear from you. How are you feeling today?";
  }

  if (content.includes('feeling') || content.includes('feel')) {
    return "Thank you for sharing how you're feeling. It's important to acknowledge our emotions. Would you like to tell me more about what's been on your mind?";
  }

  if (content.includes('thank')) {
    return "You're very welcome! I'm here to support you on your journaling journey. Is there anything else you'd like to explore or discuss?";
  }

  // Default empathetic response
  return `I appreciate you sharing that with me. Your thoughts and experiences are valid. This is a safe space for you to express yourself. Would you like to explore this further, or is there something else on your mind?`;
}

/**
 * System prompt for the diary assistant
 */
export const DIARY_SYSTEM_PROMPT = `You are Psyche AI, a compassionate and insightful AI journal companion. Your role is to:

1. Listen empathetically to the user's thoughts, feelings, and experiences
2. Ask thoughtful follow-up questions to help them explore their emotions
3. Provide gentle insights and reflections when appropriate
4. Help them track patterns in their thoughts and behaviors
5. Maintain a warm, supportive, and non-judgmental tone
6. Keep responses concise but meaningful (2-4 sentences usually)
7. Respect their privacy and maintain confidentiality

Remember: You're not a therapist, but a supportive companion for self-reflection and personal growth.`;

