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
import { getCharacterParameters, getModelParameters, ModelParameters } from '../config/llmConfig';

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
    localStorage.setItem('ai_provider', newConfig.provider);
  }
  if (newConfig.model) {
    localStorage.setItem('ai_model', newConfig.model);
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
  const provider = localStorage.getItem('ai_provider') as AIConfig['provider'] | null;
  const model = localStorage.getItem('ai_model');
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

  try {
    // Call Supabase Edge Function (avoids CORS issues)
    console.log('[AI] Calling Edge Function with provider:', config.provider);
    console.log('[AI] Using parameters:', finalParameters);
    console.log('[AI] Full prompt being sent:');
    console.log('=== PROMPT START ===');
    fullMessages.forEach((msg, idx) => {
      console.log(`[${idx}] ${msg.role.toUpperCase()}:`);
      console.log(msg.content);
      console.log('---');
    });
    console.log('=== PROMPT END ===');

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
          provider: config.provider,
          model: config.model,
          parameters: finalParameters,
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
    console.log('[AI] Response received:');
    console.log('=== RESPONSE START ===');
    console.log(data.content);
    console.log('=== RESPONSE END ===');
    return data.content;
  } catch (error: any) {
    console.error('[AI] Error:', error);
    throw error;
  }
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


