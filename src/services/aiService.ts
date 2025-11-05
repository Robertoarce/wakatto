/**
 * AI Service
 * 
 * This service handles AI API calls for generating responses.
 * Currently supports: OpenAI GPT, Anthropic Claude, Google Gemini
 * 
 * SECURITY NOTE: In production, API keys should NEVER be in client code.
 * Use Supabase Edge Functions or a backend server as a proxy.
 */

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

// Default to mock mode for development (no API key needed)
let config: AIConfig = {
  provider: 'mock',
  apiKey: '',
  model: 'gpt-4',
};

/**
 * Configure the AI service
 */
export function configureAI(newConfig: Partial<AIConfig>) {
  config = { ...config, ...newConfig };
}

/**
 * Get current AI configuration
 */
export function getAIConfig() {
  return { ...config };
}

/**
 * Generate AI response using the configured provider
 */
export async function generateAIResponse(
  messages: AIMessage[],
  systemPrompt?: string
): Promise<string> {
  const fullMessages: AIMessage[] = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  switch (config.provider) {
    case 'openai':
      return generateOpenAIResponse(fullMessages);
    case 'anthropic':
      return generateAnthropicResponse(fullMessages);
    case 'gemini':
      return generateGeminiResponse(fullMessages);
    case 'mock':
    default:
      return generateMockResponse(fullMessages);
  }
}

/**
 * OpenAI GPT API integration
 */
async function generateOpenAIResponse(messages: AIMessage[]): Promise<string> {
  if (!config.apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
}

/**
 * Anthropic Claude API integration
 */
async function generateAnthropicResponse(messages: AIMessage[]): Promise<string> {
  if (!config.apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  // Convert messages format for Claude
  const systemMessage = messages.find(m => m.role === 'system');
  const conversationMessages = messages.filter(m => m.role !== 'system');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model || 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      system: systemMessage?.content,
      messages: conversationMessages,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.content[0]?.text || 'Sorry, I could not generate a response.';
}

/**
 * Google Gemini API integration
 */
async function generateGeminiResponse(messages: AIMessage[]): Promise<string> {
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

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${config.model || 'gemini-pro'}:generateContent?key=${config.apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.candidates[0]?.content?.parts[0]?.text || 'Sorry, I could not generate a response.';
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

