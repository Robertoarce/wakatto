/**
 * AI Service
 *
 * This service handles AI API calls for generating responses.
 * Currently supports: OpenAI GPT, Anthropic Claude, Google Gemini
 *
 * SECURITY NOTE: API keys are now stored in secure storage with basic obfuscation.
 * For production, use Supabase Edge Functions or a backend server as a proxy.
 */

import { Platform } from 'react-native';
import { setSecureItem, getSecureItem, deleteSecureItem } from './secureStorage';
import { setItem as setStorageItem, getItem as getStorageItem } from './platformStorage';
import { supabase, supabaseUrl } from '../lib/supabase';
import { getCharacterParameters, getModelParameters, ModelParameters } from '../config/llmConfig';
import { getProfiler, PROFILE_OPS } from './profilingService';
import {
  UsageInfo,
  WarningLevel,
  parseUsageFromResponse,
  isLimitExceededError,
  getUsageFromLimitError,
} from './usageTrackingService';

// Cross-platform timing helper
const getTimestamp = (): number => {
  const perf = typeof globalThis !== 'undefined' ? (globalThis as any).performance : undefined;
  if (perf && typeof perf.now === 'function') {
    return perf.now() as number;
  }
  return Date.now();
};

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
  model: 'claude-3-5-haiku-20241022', // Claude 3.5 Haiku (fastest and cheapest)
};

// Load API key from secure storage on initialization
let apiKeyPromise: Promise<string | null> | null = null;

// ============================================
// Auth Session Caching
// ============================================

interface CachedSession {
  session: any;
  expiresAt: number;
}

let cachedAuthSession: CachedSession | null = null;
const AUTH_CACHE_DURATION_MS = 5 * 60 * 1000; // Cache auth for 5 minutes

/**
 * Get cached auth session or fetch a new one
 * Dramatically reduces auth overhead on repeated requests
 */
async function getCachedAuthSession(): Promise<any> {
  const now = Date.now();
  
  // Return cached session if valid
  if (cachedAuthSession && cachedAuthSession.expiresAt > now) {
    return cachedAuthSession.session;
  }

  // Fetch new session
  const { data } = await supabase.auth.getSession();
  
  if (data?.session) {
    cachedAuthSession = {
      session: data.session,
      expiresAt: now + AUTH_CACHE_DURATION_MS,
    };
    return data.session;
  }
  
  return null;
}

/**
 * Clear the cached auth session (call on logout)
 */
export function clearCachedAuthSession(): void {
  cachedAuthSession = null;
}

/**
 * Pre-warm the auth cache (call on app startup or before heavy usage)
 */
export async function warmupAuthCache(): Promise<void> {
  await getCachedAuthSession();
}

/**
 * Warm up the Edge Function to prevent cold start latency
 * Fire-and-forget - doesn't wait for response
 * Call on app startup and when returning from background
 */
export function warmupEdgeFunction(): void {
  getCachedAuthSession().then(session => {
    if (!session) return;

    fetch(`${supabaseUrl}/functions/v1/ai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ type: 'warmup' }),
    }).catch(() => {}); // Ignore errors - this is best-effort
  });
}

/**
 * Load API key from environment or secure storage
 * Priority: Environment variable > Secure storage
 */
async function loadAPIKey(): Promise<string> {
  // First, check environment variable (for development)
  const envKey = process.env.CLAUDE_API_KEY;
  if (envKey) {
    return envKey;
  }

  // Fall back to secure storage
  if (!apiKeyPromise) {
    apiKeyPromise = getSecureItem('ai_api_key');
  }
  const key = await apiKeyPromise;
  return key || '';
}

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
    await setStorageItem('ai_provider', newConfig.provider);
  }
  if (newConfig.model) {
    await setStorageItem('ai_model', newConfig.model);
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
  const provider = await getStorageItem('ai_provider') as AIConfig['provider'] | null;
  const model = await getStorageItem('ai_model');
  const apiKey = await loadAPIKey();

  // Use stored preferences, or defaults if none exist
  if (provider) config.provider = provider;
  if (model) config.model = model;
  if (apiKey) {
    config.apiKey = apiKey;
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
  characterId?: string,
  parameterOverrides?: Partial<ModelParameters>
): Promise<string> {
  const fullMessages: AIMessage[] = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  // Get parameters from config (with character-specific overrides if provided)
  const parameters = characterId
    ? getCharacterParameters(characterId, config.provider)
    : getModelParameters(config.provider);

  // Apply any additional overrides
  const finalParameters = { ...parameters, ...parameterOverrides };

  // Use mock for testing without API
  if (config.provider === 'mock') {
    return generateMockResponse(fullMessages);
  }

  const profiler = getProfiler();
  
  // Estimate prompt tokens for profiling
  const promptText = fullMessages.map(m => m.content).join(' ');
  const estimatedPromptTokens = profiler.estimateTokens(promptText);

  try {
    // Profile auth session fetch (using cache for speed)
    const authTimer = profiler.start(PROFILE_OPS.AUTH_SESSION);
    const session = await getCachedAuthSession();
    authTimer.stop({ cached: cachedAuthSession !== null });
    
    if (!session) {
      throw new Error('User not authenticated');
    }

    // Profile Edge Function call (includes LLM inference)
    const edgeTimer = profiler.start(PROFILE_OPS.EDGE_FUNCTION_CALL);
    const response = await fetch(
      `${supabaseUrl}/functions/v1/ai-chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: fullMessages,
          provider: config.provider,
          model: config.model,
          parameters: finalParameters,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      edgeTimer.stop({ error: error.error || 'Unknown error' });
      console.error('[AI] Edge Function error:', error);

      // Handle token limit exceeded error (429)
      if (response.status === 429 && isLimitExceededError(error)) {
        const usageInfo = getUsageFromLimitError(error);
        if (usageInfo) {
          throw new TokenLimitExceededError(
            error.message || 'Token limit exceeded',
            usageInfo
          );
        }
      }

      throw new Error(error.error || 'Failed to generate AI response');
    }

    const data = await response.json();
    const estimatedResponseTokens = profiler.estimateTokens(data.content || '');
    edgeTimer.stop({
      promptTokens: estimatedPromptTokens,
      responseTokens: estimatedResponseTokens,
      model: config.model,
      provider: config.provider,
    });

    // Parse usage info from response (if available)
    const usage = parseUsageFromResponse(data);
    if (usage) {
      // Dispatch a custom event for usage updates (web only)
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ai:usage-update', { detail: usage }));

        // Dispatch warning event if needed
        if (usage.warningLevel) {
          window.dispatchEvent(new CustomEvent('ai:limit-warning', {
            detail: { warningLevel: usage.warningLevel, usage }
          }));
        }
      }
    }

    return data.content;
  } catch (error: any) {
    console.error('[AI] Error:', error);
    throw error;
  }
}

// ============================================
// Streaming AI Response
// ============================================

export interface StreamingCallbacks {
  onStart?: (timestamp: number) => void;
  onDelta?: (text: string, accumulated: string) => void;
  onDone?: (fullText: string, durationMs: number) => void;
  onError?: (error: Error) => void;
  // Usage tracking callbacks
  onUsageUpdate?: (usage: Partial<UsageInfo>) => void;
  onLimitWarning?: (warningLevel: WarningLevel, usage: Partial<UsageInfo>) => void;
  onLimitExceeded?: (usage: UsageInfo) => void;
}

// Custom error class for limit exceeded
export class TokenLimitExceededError extends Error {
  public usage: UsageInfo;

  constructor(message: string, usage: UsageInfo) {
    super(message);
    this.name = 'TokenLimitExceededError';
    this.usage = usage;
  }
}

/**
 * Generate AI response with streaming (text appears as it's generated)
 * 
 * This provides a much better user experience as text appears immediately
 * rather than waiting for the full response.
 * 
 * Usage:
 *   await generateAIResponseStreaming(messages, systemPrompt, characterId, {
 *     onDelta: (text, accumulated) => updateUI(accumulated),
 *     onDone: (fullText) => saveToDatabase(fullText),
 *   });
 */
export async function generateAIResponseStreaming(
  messages: AIMessage[],
  systemPrompt?: string,
  characterId?: string,
  callbacks?: StreamingCallbacks,
  parameterOverrides?: Partial<ModelParameters>
): Promise<string> {
  const fullMessages: AIMessage[] = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  const parameters = characterId
    ? getCharacterParameters(characterId, config.provider)
    : getModelParameters(config.provider);

  const finalParameters = { ...parameters, ...parameterOverrides };

  // Use mock for testing without API
  if (config.provider === 'mock') {
    const mockResponse = await generateMockResponse(fullMessages);
    callbacks?.onDone?.(mockResponse, 1000);
    return mockResponse;
  }

  const profiler = getProfiler();
  const startTime = getTimestamp();
  let accumulatedText = '';
  let timeToFirstToken: number | null = null;
  let edgeTimerStopped = false;

  // Profile auth session fetch
  const authTimer = profiler.start(PROFILE_OPS.AUTH_SESSION);

  // Declare edgeTimer outside try so it can be stopped in catch
  let edgeTimer: ReturnType<typeof profiler.start> | null = null;

  try {
    // Get cached auth session
    const session = await getCachedAuthSession();
    authTimer.stop({ cached: cachedAuthSession !== null });

    if (!session) {
      throw new Error('User not authenticated');
    }

    // Profile edge function call (time to establish connection + first token)
    edgeTimer = profiler.start(PROFILE_OPS.EDGE_FUNCTION_CALL);

    // Make streaming request
    const response = await fetch(
      `${supabaseUrl}/functions/v1/ai-chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: fullMessages,
          provider: config.provider,
          model: config.model,
          parameters: finalParameters,
          stream: true, // Enable streaming
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();

      // Handle token limit exceeded error (429)
      if (response.status === 429 && isLimitExceededError(error)) {
        const usageInfo = getUsageFromLimitError(error);
        if (usageInfo) {
          callbacks?.onLimitExceeded?.(usageInfo);
          throw new TokenLimitExceededError(
            error.message || 'Token limit exceeded',
            usageInfo
          );
        }
      }

      throw new Error(error.error || 'Failed to generate AI response');
    }

    // Check if response is SSE (streaming) or regular JSON
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('text/event-stream')) {
      // Process SSE stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'start') {
                callbacks?.onStart?.(parsed.timestamp);
              } else if (parsed.type === 'delta') {
                // Track time to first token
                if (timeToFirstToken === null) {
                  timeToFirstToken = getTimestamp() - startTime;
                }
                accumulatedText += parsed.text;
                callbacks?.onDelta?.(parsed.text, accumulatedText);
              } else if (parsed.type === 'usage') {
                // Handle usage update from Edge Function
                const usage = parsed.usage as Partial<UsageInfo>;
                callbacks?.onUsageUpdate?.(usage);

                // Dispatch warning if at threshold
                if (usage.warningLevel) {
                  callbacks?.onLimitWarning?.(usage.warningLevel as WarningLevel, usage);
                }

                // Also dispatch global events for Redux integration (web only)
                if (Platform.OS === 'web' && typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('ai:usage-update', { detail: usage }));
                  if (usage.warningLevel) {
                    window.dispatchEvent(new CustomEvent('ai:limit-warning', {
                      detail: { warningLevel: usage.warningLevel, usage }
                    }));
                  }
                }
              } else if (parsed.type === 'done') {
                // Stop edge function timer when streaming completes
                if (edgeTimer && !edgeTimerStopped) {
                  edgeTimer.stop({
                    streaming: true,
                    timeToFirstToken: timeToFirstToken || 0,
                    responseLength: accumulatedText.length,
                    model: config.model,
                    provider: config.provider,
                  });
                  edgeTimerStopped = true;
                }
                const durationMs = getTimestamp() - startTime;
                callbacks?.onDone?.(accumulatedText, durationMs);
              } else if (parsed.type === 'error') {
                if (edgeTimer && !edgeTimerStopped) {
                  edgeTimer.stop({ error: parsed.message, streaming: true });
                  edgeTimerStopped = true;
                }
                throw new Error(parsed.message);
              }
            } catch (e) {
              // Skip non-JSON data
              if (data !== '[DONE]') {
                console.warn('[AI-Stream] Failed to parse SSE data:', data);
              }
            }
          }
        }
      }

      return accumulatedText;
    } else {
      // Fallback: Edge Function returned non-streaming JSON response
      // This happens when streaming isn't deployed or enabled on the server
      const json = await response.json();
      const content = json.content || '';

      // Stop edge timer for non-streaming fallback
      if (edgeTimer && !edgeTimerStopped) {
        edgeTimer.stop({
          streaming: false,
          fallback: true,
          responseLength: content.length,
          model: config.model,
          provider: config.provider,
        });
        edgeTimerStopped = true;
      }

      callbacks?.onStart?.(Date.now());
      callbacks?.onDelta?.(content, content);
      const durationMs = getTimestamp() - startTime;
      callbacks?.onDone?.(content, durationMs);

      return content;
    }

  } catch (error: any) {
    // Stop edge timer if it was started but not yet stopped
    if (edgeTimer && !edgeTimerStopped) {
      edgeTimer.stop({
        error: error.message || String(error),
        streaming: true
      });
    }
    console.error('[AI-Stream] Error:', error);
    callbacks?.onError?.(error);
    throw error;
  }
}

/**
 * Check if streaming is supported for the current provider
 */
export function isStreamingSupported(): boolean {
  return config.provider === 'anthropic';
}

/**
 * OpenAI GPT API integration
 */
async function generateOpenAIResponse(messages: AIMessage[]): Promise<string> {
  console.log('[OpenAI] Starting request with config:', {
    hasApiKey: !!config.apiKey,
    keyPrefix: config.apiKey?.substring(0, 7),
    model: config.model || 'gpt-4',
    messageCount: messages.length
  });

  if (!config.apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const requestBody = {
    model: config.model || 'gpt-4',
    messages: messages,
    temperature: 0.7,
    max_tokens: 1000,
  };

  console.log('[OpenAI] Request body:', JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[OpenAI] Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[OpenAI] Error response:', errorText);
      let error;
      try {
        error = JSON.parse(errorText);
      } catch (e) {
        throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
      }
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('[OpenAI] Success! Response data:', data);
    return data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
  } catch (error: any) {
    console.error('[OpenAI] Fetch error:', error);
    throw error;
  }
}

/**
 * Anthropic Claude API integration
 */
async function generateAnthropicResponse(messages: AIMessage[]): Promise<string> {
  console.log('[Anthropic] Starting request with config:', {
    hasApiKey: !!config.apiKey,
    keyPrefix: config.apiKey?.substring(0, 7),
    model: config.model || 'claude-3-sonnet-20240229',
    messageCount: messages.length
  });

  if (!config.apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  // Convert messages format for Claude
  const systemMessage = messages.find(m => m.role === 'system');
  const conversationMessages = messages.filter(m => m.role !== 'system');

  const requestBody = {
    model: config.model || 'claude-3-sonnet-20240229',
    max_tokens: 1000,
    system: systemMessage?.content,
    messages: conversationMessages,
  };

  console.log('[Anthropic] Request body:', JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[Anthropic] Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Anthropic] Error response:', errorText);
      let error;
      try {
        error = JSON.parse(errorText);
      } catch (e) {
        throw new Error(`Anthropic API error (${response.status}): ${errorText}`);
      }
      throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('[Anthropic] Success! Response data:', data);
    return data.content[0]?.text || 'Sorry, I could not generate a response.';
  } catch (error: any) {
    console.error('[Anthropic] Fetch error:', error);
    throw error;
  }
}

/**
 * Google Gemini API integration
 */
async function generateGeminiResponse(messages: AIMessage[]): Promise<string> {
  console.log('[Gemini] Starting request with config:', {
    hasApiKey: !!config.apiKey,
    keyPrefix: config.apiKey?.substring(0, 10),
    model: config.model || 'gemini-1.5-flash',
    messageCount: messages.length
  });

  if (!config.apiKey) {
    throw new Error('Gemini API key not configured');
  }

  // Convert messages to Gemini format
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const requestBody = {
    contents: contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1000,
    },
  };

  console.log('[Gemini] Request body:', JSON.stringify(requestBody, null, 2));

  const modelName = config.model || 'gemini-1.5-flash';
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${config.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    console.log('[Gemini] Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Gemini] Error response:', errorText);
      let error;
      try {
        error = JSON.parse(errorText);
      } catch (e) {
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
      }
      throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('[Gemini] Success! Response data:', data);
    return data.candidates[0]?.content?.parts[0]?.text || 'Sorry, I could not generate a response.';
  } catch (error: any) {
    console.error('[Gemini] Fetch error:', error);
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


