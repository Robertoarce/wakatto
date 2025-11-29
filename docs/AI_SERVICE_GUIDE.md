# AI Service Guide (aiService.ts)

Complete documentation for `src/services/aiService.ts` - the core AI integration service.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
4. [Configuration Management](#configuration-management)
5. [Request Generation](#request-generation)
6. [Provider Integrations](#provider-integrations)
7. [Security](#security)
8. [Debugging & Logging](#debugging--logging)
9. [Usage Examples](#usage-examples)
10. [Troubleshooting](#troubleshooting)

---

## Overview

**File Location:** `src/services/aiService.ts`
**Lines of Code:** ~430 lines
**Purpose:** Central service for AI provider integration, configuration management, and request orchestration

### Key Responsibilities

1. **Configuration Management**
   - Store and retrieve AI provider settings
   - Manage API keys securely
   - Handle environment variables
   - Persist user preferences

2. **Request Orchestration**
   - Format messages for AI providers
   - Inject system prompts
   - Apply character-specific parameters
   - Route requests through Supabase Edge Function

3. **Provider Abstraction**
   - Support multiple AI providers (OpenAI, Anthropic, Gemini)
   - Normalize provider differences
   - Handle provider-specific parameters
   - Mock provider for development

4. **Security**
   - Secure API key storage
   - User authentication verification
   - Server-side API key retrieval
   - Request authorization

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     aiService.ts                             │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Configuration Layer                                   │  │
│  │  - configureAI()                                       │  │
│  │  - initializeAI()                                      │  │
│  │  - getAIConfig()                                       │  │
│  │  - clearAPIKey()                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                           ↓                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Request Generation                                    │  │
│  │  - generateAIResponse() ← Main entry point            │  │
│  │  - Message formatting                                  │  │
│  │  - System prompt injection                             │  │
│  │  - Parameter assembly                                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                           ↓                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Provider Routing                                      │  │
│  │  - Supabase Edge Function (PRIMARY)                    │  │
│  │  - Direct API calls (DEPRECATED)                       │  │
│  │  - Mock provider (DEVELOPMENT)                         │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│          Supabase Edge Function (ai-chat)                    │
│          → Anthropic/OpenAI/Gemini APIs                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. Type Definitions

#### AIConfig Interface
**Location:** `aiService.ts:16-20`

```typescript
interface AIConfig {
  provider: 'openai' | 'anthropic' | 'gemini' | 'mock';
  apiKey: string;
  model?: string;
}
```

**Fields:**
- `provider`: AI service to use
- `apiKey`: Authentication key (stored securely)
- `model`: Optional model specification (e.g., `claude-3-5-sonnet-20241022`)

---

#### AIMessage Interface
**Location:** `aiService.ts:23-26`

```typescript
interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
```

**Usage:**
```typescript
const messages: AIMessage[] = [
  { role: 'system', content: 'You are a helpful assistant' },
  { role: 'user', content: 'Hello!' },
  { role: 'assistant', content: 'Hi! How can I help?' },
  { role: 'user', content: 'What is 2+2?' }
];
```

---

### 2. Configuration State

#### In-Memory Configuration
**Location:** `aiService.ts:29-33`

```typescript
let config: AIConfig = {
  provider: 'anthropic',                    // Default to Claude
  apiKey: '',                               // Loaded from storage
  model: 'claude-3-haiku-20240307',        // Fast model
};
```

**Notes:**
- Default provider is Anthropic Claude
- API key initially empty (loaded on initialization)
- Default model is Claude 3 Haiku (fast, cost-effective)
- Config persists in memory during session

---

#### API Key Loading
**Location:** `aiService.ts:36-56`

```typescript
async function loadAPIKey(): Promise<string> {
  // Priority 1: Environment variable (development)
  const envKey = process.env.CLAUDE_API_KEY;
  if (envKey) {
    console.log('[AI] Using API key from environment variable');
    return envKey;
  }

  // Priority 2: Secure storage (production)
  if (!apiKeyPromise) {
    apiKeyPromise = getSecureItem('ai_api_key');
  }
  const key = await apiKeyPromise;
  return key || '';
}
```

**Priority Order:**
1. Environment variable (`CLAUDE_API_KEY`)
2. Secure storage (sessionStorage with obfuscation)
3. Empty string (no key configured)

**Why This Order?**
- Environment variables useful for local development
- Secure storage for production web app
- Fail gracefully if no key available

---

## Configuration Management

### configureAI()
**Location:** `aiService.ts:61-77`

Updates AI configuration and stores settings persistently.

```typescript
export async function configureAI(newConfig: Partial<AIConfig>)
```

**Parameters:**
- `newConfig`: Partial configuration to merge with existing config

**Behavior:**
```typescript
// Example usage
await configureAI({
  provider: 'anthropic',
  apiKey: 'sk-ant-...',
  model: 'claude-3-5-sonnet-20241022'
});
```

**Storage:**
- `apiKey` → Secure storage (sessionStorage with obfuscation)
- `provider` → localStorage (non-sensitive)
- `model` → localStorage (non-sensitive)

**Implementation:**
```typescript
export async function configureAI(newConfig: Partial<AIConfig>) {
  // Merge with existing config
  config = { ...config, ...newConfig };

  // Store API key securely if provided
  if (newConfig.apiKey) {
    await setSecureItem('ai_api_key', newConfig.apiKey);
    apiKeyPromise = Promise.resolve(newConfig.apiKey);
  }

  // Store provider and model in regular storage
  if (newConfig.provider) {
    localStorage.setItem('ai_provider', newConfig.provider);
  }
  if (newConfig.model) {
    localStorage.setItem('ai_model', newConfig.model);
  }
}
```

---

### initializeAI()
**Location:** `aiService.ts:95-107`

Loads configuration from storage and environment on app startup.

```typescript
export async function initializeAI()
```

**Usage:**
```typescript
// In app initialization (App.tsx or similar)
import { initializeAI } from './services/aiService';

useEffect(() => {
  initializeAI();
}, []);
```

**Implementation:**
```typescript
export async function initializeAI() {
  const provider = localStorage.getItem('ai_provider') as AIConfig['provider'] | null;
  const model = localStorage.getItem('ai_model');
  const apiKey = await loadAPIKey();

  // Apply loaded config
  if (provider) config.provider = provider;
  if (model) config.model = model;
  if (apiKey) {
    config.apiKey = apiKey;
    console.log('[AI] Initialized with API key from',
      process.env.CLAUDE_API_KEY ? 'environment' : 'secure storage'
    );
  }
}
```

---

### getAIConfig()
**Location:** `aiService.ts:82-90`

Retrieves current configuration including API key.

```typescript
export async function getAIConfig(): Promise<Omit<AIConfig, 'apiKey'> & { apiKey: string }>
```

**Usage:**
```typescript
const config = await getAIConfig();
console.log('Provider:', config.provider);
console.log('Model:', config.model);
console.log('Has API Key:', !!config.apiKey);
```

**Security Note:** Only use this when you need to verify API key presence. Never log the actual key value.

---

### clearAPIKey()
**Location:** `aiService.ts:112-116`

Removes API key from secure storage.

```typescript
export async function clearAPIKey()
```

**Usage:**
```typescript
// When user logs out or wants to remove API key
await clearAPIKey();
```

**Implementation:**
```typescript
export async function clearAPIKey() {
  await deleteSecureItem('ai_api_key');
  config.apiKey = '';
  apiKeyPromise = null;
}
```

---

## Request Generation

### generateAIResponse()
**Location:** `aiService.ts:122-196`

**PRIMARY FUNCTION** - Main entry point for generating AI responses.

```typescript
export async function generateAIResponse(
  messages: AIMessage[],
  systemPrompt?: string,
  characterId?: string,
  parameterOverrides?: Partial<ModelParameters>
): Promise<string>
```

**Parameters:**
- `messages`: Conversation history (user/assistant messages)
- `systemPrompt`: Optional system prompt to inject at start
- `characterId`: Optional character ID for parameter overrides
- `parameterOverrides`: Optional runtime parameter overrides

**Returns:** String containing AI-generated response

---

#### Message Format

**Input Format:**
```typescript
const messages: AIMessage[] = [
  { role: 'user', content: 'I feel anxious about my job' },
  { role: 'assistant', content: 'Tell me more about what worries you' },
  { role: 'user', content: 'I might get laid off' }
];
```

**After System Prompt Injection:**
```typescript
const fullMessages: AIMessage[] = [
  {
    role: 'system',
    content: 'You are a compassionate therapist...'
  },
  { role: 'user', content: 'I feel anxious about my job' },
  { role: 'assistant', content: 'Tell me more about what worries you' },
  { role: 'user', content: 'I might get laid off' }
];
```

---

#### Parameter Assembly

**Step 1: Get Base Parameters**
```typescript
// Get parameters from config (character-specific or provider default)
const parameters = characterId
  ? getCharacterParameters(characterId, config.provider)
  : getModelParameters(config.provider);
```

**Step 2: Apply Overrides**
```typescript
// Apply any additional overrides
const finalParameters = { ...parameters, ...parameterOverrides };
```

**Example:**
```typescript
// Base parameters for 'freud' character with 'anthropic' provider
{
  temperature: 0.85,
  maxTokens: 1800,
  topP: 0.95,
  topK: 40
}

// Runtime override
parameterOverrides = { maxTokens: 1200 }

// Final parameters
{
  temperature: 0.85,
  maxTokens: 1200,    // Overridden
  topP: 0.95,
  topK: 40
}
```

---

#### Request Flow

**1. Mock Provider Check**
```typescript
if (config.provider === 'mock') {
  return generateMockResponse(fullMessages);
}
```

**2. Authentication**
```typescript
const { data: session } = await supabase.auth.getSession();
if (!session?.session) {
  throw new Error('User not authenticated');
}
```

**3. Console Logging (Debug)**
```typescript
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
```

**4. Edge Function Call**
```typescript
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
```

**5. Response Handling**
```typescript
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
```

---

#### Complete Example

```typescript
import { generateAIResponse } from './services/aiService';

async function handleUserMessage() {
  try {
    const messages = [
      { role: 'user', content: 'I feel stressed' },
      { role: 'assistant', content: 'What is causing your stress?' },
      { role: 'user', content: 'Work deadlines' }
    ];

    const systemPrompt = `You are a compassionate therapist...`;

    const response = await generateAIResponse(
      messages,
      systemPrompt,
      'freud',              // Use Freud's parameters
      { maxTokens: 1200 }   // Override to shorter response
    );

    console.log('AI Response:', response);
  } catch (error) {
    console.error('Error:', error);
    // Handle error (show user message, retry, etc.)
  }
}
```

---

## Provider Integrations

### Supabase Edge Function (Primary)

**Current Implementation:** All requests routed through Edge Function

**Endpoint:** `{supabaseUrl}/functions/v1/ai-chat`

**Request Payload:**
```typescript
{
  messages: AIMessage[],
  provider: 'anthropic' | 'openai' | 'gemini',
  model: string,
  parameters: ModelParameters
}
```

**Response:**
```typescript
{
  content: string  // AI-generated response
}
```

**Error Response:**
```typescript
{
  error: string  // Error message
}
```

**Benefits:**
- ✅ API keys stored server-side only
- ✅ No CORS issues
- ✅ User authentication enforced
- ✅ Rate limiting ready
- ✅ Audit trail possible
- ✅ Centralized error handling

---

### Direct API Calls (Deprecated)

**Status:** Present in codebase but not used

**Functions:**
- `generateOpenAIResponse()` - `aiService.ts:202-242`
- `generateAnthropicResponse()` - `aiService.ts:259-304`
- `generateGeminiResponse()` - `aiService.ts:321-374`

**Why Deprecated:**
- ❌ CORS errors in browser
- ❌ API keys exposed client-side
- ❌ No rate limiting
- ❌ No authentication
- ❌ Security vulnerabilities

**Current Status:** Kept for backward compatibility, but all production requests use Edge Function

---

### Mock Provider (Development)

**Location:** `aiService.ts:390-406`

**Purpose:** Enable development without API keys

**Usage:**
```typescript
await configureAI({ provider: 'mock' });
```

**Implementation:**
```typescript
async function generateMockResponse(messages: AIMessage[]): Promise<string> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const lastUserMessage = messages.filter(m => m.role === 'user').pop();

  if (!lastUserMessage) {
    return "Hello! I'm here to help you. What's on your mind?";
  }

  const content = lastUserMessage.content.toLowerCase();

  // Context-aware responses
  if (content.includes('hello') || content.includes('hi')) {
    return "Hello! It's great to hear from you. How are you feeling today?";
  }

  if (content.includes('feeling') || content.includes('feel')) {
    return "Thank you for sharing how you're feeling. Would you like to tell me more?";
  }

  // Default empathetic response
  return `I appreciate you sharing that with me. This is a safe space for you to express yourself.`;
}
```

**Features:**
- No API key required
- 1 second simulated delay
- Context-aware based on keywords
- Perfect for UI development
- Always returns a response

---

## Security

### API Key Storage

**Client-Side Protection:**
```typescript
// API keys stored in sessionStorage with XOR obfuscation
await setSecureItem('ai_api_key', 'sk-ant-...');
```

**Server-Side Storage:**
```bash
# Supabase secrets (production)
supabase secrets set CLAUDE_API_KEY=sk-ant-...
supabase secrets set OPENAI_API_KEY=sk-...
```

**Security Model:**
```
┌─────────────────────────────────────┐
│  Browser (Client)                   │
│  ❌ NO DIRECT API CALLS             │
│  ❌ NO API KEYS IN REQUESTS         │
│  ✅ Auth token only                 │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Supabase Edge Function             │
│  ✅ API keys in server secrets      │
│  ✅ User authentication verified    │
│  ✅ Rate limiting ready             │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  AI Provider API                    │
└─────────────────────────────────────┘
```

---

### Authentication Flow

**Client Side:**
```typescript
// Get session
const { data: session } = await supabase.auth.getSession();

// Include auth token in request
const response = await fetch(edgeFunctionUrl, {
  headers: {
    'Authorization': `Bearer ${session.session.access_token}`,
  },
});
```

**Server Side (Edge Function):**
```typescript
// Verify user
const supabaseClient = createClient(...);
const { data: { user } } = await supabaseClient.auth.getUser();

if (!user) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401
  });
}
```

**Benefits:**
- Every request authenticated
- User context available for logging
- Prevents unauthorized API usage
- Audit trail possible

---

## Debugging & Logging

### Console Output

**Request Logging:**
```
[AI] Calling Edge Function with provider: anthropic
[AI] Using parameters: { temperature: 0.85, maxTokens: 1800, ... }
[AI] Full prompt being sent:
=== PROMPT START ===
[0] SYSTEM:
You are Sigmund Freud, a compassionate psychoanalytic companion...
---
[1] USER:
I feel anxious about work
---
[2] ASSISTANT:
Tell me more about what concerns you
---
[3] USER:
I might lose my job
---
=== PROMPT END ===
```

**Response Logging:**
```
[AI] Edge Function success!
[AI] Response received:
=== RESPONSE START ===
This anxiety you're experiencing may be connected to deeper unconscious fears.
The threat of job loss often represents more than financial concerns—it can
touch on our sense of identity and self-worth. What emotions arise when you
imagine this scenario?
=== RESPONSE END ===
```

**Error Logging:**
```
[AI] Edge Function error: { error: 'API key not configured' }
[AI] Error: Failed to generate AI response
```

---

### Debugging Checklist

**When response fails:**

1. **Check Authentication:**
   ```typescript
   const { data: { session } } = await supabase.auth.getSession();
   console.log('Session:', session);
   ```

2. **Check Provider Configuration:**
   ```typescript
   const config = await getAIConfig();
   console.log('Provider:', config.provider);
   console.log('Model:', config.model);
   console.log('Has Key:', !!config.apiKey);
   ```

3. **Check Edge Function Logs:**
   ```bash
   # Terminal
   supabase functions logs ai-chat --follow
   ```

4. **Check Browser Console:**
   - Look for `[AI]` prefixed logs
   - Check Network tab for failed requests
   - Verify auth token present

5. **Test with Mock Provider:**
   ```typescript
   await configureAI({ provider: 'mock' });
   // Test if issue is with provider or app logic
   ```

---

## Usage Examples

### Example 1: Basic Response Generation

```typescript
import { generateAIResponse } from './services/aiService';

async function sendMessage(userMessage: string) {
  const messages = [
    { role: 'user', content: userMessage }
  ];

  const response = await generateAIResponse(messages);
  console.log('Response:', response);
}

sendMessage('Hello, how are you?');
```

---

### Example 2: With System Prompt

```typescript
import { generateAIResponse } from './services/aiService';

async function getTherapyResponse(userMessage: string) {
  const systemPrompt = `You are a compassionate therapist specializing in
  cognitive behavioral therapy. Help users identify and challenge negative
  thought patterns. Keep responses warm, brief (2-3 sentences), and
  encourage self-reflection.`;

  const messages = [
    { role: 'user', content: userMessage }
  ];

  const response = await generateAIResponse(messages, systemPrompt);
  return response;
}
```

---

### Example 3: With Conversation History

```typescript
import { generateAIResponse } from './services/aiService';

async function continueConversation(
  conversationHistory: AIMessage[],
  newUserMessage: string
) {
  // Add new message to history
  const messages = [
    ...conversationHistory,
    { role: 'user', content: newUserMessage }
  ];

  const response = await generateAIResponse(messages);

  // Update history with assistant response
  conversationHistory.push({ role: 'user', content: newUserMessage });
  conversationHistory.push({ role: 'assistant', content: response });

  return response;
}
```

---

### Example 4: With Character-Specific Parameters

```typescript
import { generateAIResponse } from './services/aiService';

async function getCharacterResponse(
  messages: AIMessage[],
  characterId: string
) {
  // Automatically uses character's parameter overrides
  const response = await generateAIResponse(
    messages,
    undefined,      // No custom system prompt
    characterId     // Use character config
  );

  return response;
}

// Example usage
getCharacterResponse(messages, 'freud');   // Uses Freud's parameters
getCharacterResponse(messages, 'jung');    // Uses Jung's parameters
```

---

### Example 5: With Runtime Overrides

```typescript
import { generateAIResponse } from './services/aiService';

async function getBriefResponse(messages: AIMessage[]) {
  // Override to get shorter response
  const response = await generateAIResponse(
    messages,
    undefined,
    undefined,
    {
      maxTokens: 500,      // Override: shorter
      temperature: 0.7     // Override: more focused
    }
  );

  return response;
}

async function getDetailedResponse(messages: AIMessage[]) {
  // Override to get longer, more creative response
  const response = await generateAIResponse(
    messages,
    undefined,
    undefined,
    {
      maxTokens: 3000,     // Override: longer
      temperature: 1.2     // Override: more creative
    }
  );

  return response;
}
```

---

### Example 6: Complete Flow with Error Handling

```typescript
import {
  configureAI,
  initializeAI,
  generateAIResponse
} from './services/aiService';

async function setupAndChat() {
  try {
    // 1. Initialize service on app start
    await initializeAI();
    console.log('AI service initialized');

    // 2. Configure provider (if not already configured)
    const config = await getAIConfig();
    if (!config.apiKey) {
      await configureAI({
        provider: 'anthropic',
        apiKey: 'sk-ant-...',
        model: 'claude-3-5-sonnet-20241022'
      });
    }

    // 3. Generate response
    const messages = [
      { role: 'user', content: 'I need help with stress' }
    ];

    const systemPrompt = `You are a stress management coach...`;

    const response = await generateAIResponse(
      messages,
      systemPrompt
    );

    console.log('Response:', response);

  } catch (error) {
    console.error('Error:', error);

    // Handle specific errors
    if (error.message.includes('not authenticated')) {
      console.log('User needs to log in');
    } else if (error.message.includes('API key')) {
      console.log('API key not configured');
    } else {
      console.log('Unknown error occurred');
    }
  }
}
```

---

## Troubleshooting

### Issue: "User not authenticated"

**Cause:** Supabase auth session expired or invalid

**Solution:**
```typescript
// Check auth status
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);

// Re-authenticate if needed
if (!session) {
  await supabase.auth.signInWithPassword({
    email: 'user@example.com',
    password: 'password'
  });
}
```

---

### Issue: "Failed to generate AI response"

**Possible Causes:**
1. Network error
2. Edge Function error
3. Provider API error
4. Invalid parameters

**Debug Steps:**
```typescript
try {
  const response = await generateAIResponse(messages);
} catch (error) {
  console.error('Full error:', error);

  // Check network
  console.log('Online:', navigator.onLine);

  // Check config
  const config = await getAIConfig();
  console.log('Config:', config);

  // Try with mock provider
  await configureAI({ provider: 'mock' });
  const mockResponse = await generateAIResponse(messages);
  console.log('Mock works:', !!mockResponse);
}
```

---

### Issue: Responses are too short/long

**Cause:** `maxTokens` parameter

**Solution:**
```typescript
// For longer responses
const response = await generateAIResponse(
  messages,
  systemPrompt,
  characterId,
  { maxTokens: 3000 }  // Increase
);

// For shorter responses
const response = await generateAIResponse(
  messages,
  systemPrompt,
  characterId,
  { maxTokens: 800 }   // Decrease
);
```

---

### Issue: Responses are too random/inconsistent

**Cause:** High `temperature` value

**Solution:**
```typescript
// For more focused responses
const response = await generateAIResponse(
  messages,
  systemPrompt,
  characterId,
  { temperature: 0.5 }  // Lower = more focused
);
```

---

### Issue: API key not loading

**Debug:**
```typescript
// Check environment
console.log('Env key:', process.env.CLAUDE_API_KEY);

// Check secure storage
const storedKey = await getSecureItem('ai_api_key');
console.log('Stored key:', storedKey ? 'Present' : 'Missing');

// Check localStorage
console.log('Provider:', localStorage.getItem('ai_provider'));
console.log('Model:', localStorage.getItem('ai_model'));
```

---

### Issue: Edge Function not responding

**Check:**
```bash
# Verify Edge Function is deployed
supabase functions list

# Check logs
supabase functions logs ai-chat --follow

# Test directly
curl -X POST https://your-project.supabase.co/functions/v1/ai-chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}],"provider":"anthropic"}'
```

---

## Related Files

| File | Description | Documentation |
|------|-------------|---------------|
| `src/services/secureStorage.ts` | Secure API key storage | See [AI Generation Layer](AI_GENERATION_LAYER.md) |
| `src/config/llmConfig.ts` | LLM parameters and configuration | See [Configuration Guide](CONFIGURATION_GUIDE.md) |
| `supabase/functions/ai-chat/index.ts` | Edge Function implementation | See [AI Generation Layer](AI_GENERATION_LAYER.md) |
| `src/services/multiCharacterConversation.ts` | Multi-character orchestration | See [Multi-Character Service Guide](MULTI_CHARACTER_SERVICE_GUIDE.md) 🎭 |
| `src/config/characters.ts` | Character configurations | See [Configuration Guide](CONFIGURATION_GUIDE.md) |

---

## Best Practices

### 1. Always Initialize

```typescript
// In App.tsx or main entry point
useEffect(() => {
  initializeAI();
}, []);
```

---

### 2. Handle Errors Gracefully

```typescript
try {
  const response = await generateAIResponse(messages);
} catch (error) {
  // Show user-friendly error
  showAlert('Failed to get response. Please try again.');
  // Log for debugging
  console.error('AI Error:', error);
}
```

---

### 3. Use Character Parameters

```typescript
// Better: Use character config
await generateAIResponse(messages, systemPrompt, 'freud');

// Instead of: Manual parameters
await generateAIResponse(messages, systemPrompt, undefined, {
  temperature: 0.85,
  maxTokens: 1800,
  // ...
});
```

---

### 4. Keep Conversation History Reasonable

```typescript
// Don't send entire conversation every time
// Keep last N messages
function pruneHistory(messages: AIMessage[], maxMessages = 20) {
  if (messages.length <= maxMessages) return messages;
  return messages.slice(-maxMessages);
}

const prunedMessages = pruneHistory(conversationHistory);
const response = await generateAIResponse(prunedMessages);
```

---

### 5. Log for Debugging

```typescript
// The service now includes comprehensive logging
// Check browser console for [AI] prefixed logs
// These logs show:
// - Full prompts being sent
// - Responses received
// - Parameters used
// - Errors
```

---

## Summary

### Key Takeaways

1. **generateAIResponse()** is the main entry point
2. All production requests go through **Supabase Edge Function**
3. **API keys stored server-side only** for security
4. **Character parameters** automatically applied
5. **Runtime overrides** available for flexibility
6. **Mock provider** available for development
7. **Comprehensive logging** for debugging
8. **Error handling** at multiple levels

---

**File:** `src/services/aiService.ts`
**Last Updated:** 2025-11-29
**Version:** 1.0
**Status:** Production Ready
