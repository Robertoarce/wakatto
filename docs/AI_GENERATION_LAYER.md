# AI Generation Layer Documentation

## Overview

The AI Generation Layer is the core intelligence system of Wakatto that handles all interactions with Large Language Models (LLMs). It orchestrates character-based AI responses, manages multiple AI providers, and implements sophisticated multi-character conversation logic with interruptions, reactions, and cross-character awareness.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI GENERATION LAYER                           │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │   Multi-Character Conversation Service                  │    │
│  │   (multiCharacterConversation.ts)                       │    │
│  │                                                          │    │
│  │  ┌─────────────────────────────────────────────────┐  │    │
│  │  │  Character Selection & Response Logic           │  │    │
│  │  │  - determineRespondingCharacters()              │  │    │
│  │  │  - Interruption probability (30%)               │  │    │
│  │  │  - Reaction probability (50%)                   │  │    │
│  │  │  - Conversation dominance prevention            │  │    │
│  │  └─────────────────────────────────────────────────┘  │    │
│  │                                                          │    │
│  │  ┌─────────────────────────────────────────────────┐  │    │
│  │  │  Context Building & Character Awareness         │  │    │
│  │  │  - buildCharacterContext()                      │  │    │
│  │  │  - Cross-character interaction guidelines       │  │    │
│  │  │  - Recent conversation history                  │  │    │
│  │  │  - Dynamic prompt assembly                      │  │    │
│  │  └─────────────────────────────────────────────────┘  │    │
│  │                                                          │    │
│  │  ┌─────────────────────────────────────────────────┐  │    │
│  │  │  Response Generation & Timing                   │  │    │
│  │  │  - generateMultiCharacterResponses()            │  │    │
│  │  │  - generateSingleCharacterResponse()            │  │    │
│  │  │  - Staggered delays (500-2000ms)                │  │    │
│  │  │  - Sequential awareness (char sees prev)        │  │    │
│  │  └─────────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────┘    │
│                              ↓                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │             AI Service (aiService.ts)                   │    │
│  │                                                          │    │
│  │  ┌─────────────────────────────────────────────────┐  │    │
│  │  │  Configuration & API Key Management             │  │    │
│  │  │  - configureAI() / initializeAI()               │  │    │
│  │  │  - Secure storage integration                   │  │    │
│  │  │  - Environment variable support                 │  │    │
│  │  │  - Provider & model selection                   │  │    │
│  │  └─────────────────────────────────────────────────┘  │    │
│  │                                                          │    │
│  │  ┌─────────────────────────────────────────────────┐  │    │
│  │  │  Request Orchestration                          │  │    │
│  │  │  - generateAIResponse()                         │  │    │
│  │  │  - Parameter assembly & overrides               │  │    │
│  │  │  - Message formatting                           │  │    │
│  │  │  - System prompt injection                      │  │    │
│  │  └─────────────────────────────────────────────────┘  │    │
│  │                                                          │    │
│  │  ┌─────────────────────────────────────────────────┐  │    │
│  │  │  Provider Integration                           │  │    │
│  │  │  - Supabase Edge Function proxy (primary)       │  │    │
│  │  │  - Direct API calls (legacy, deprecated)        │  │    │
│  │  │  - Mock provider (development/testing)          │  │    │
│  │  └─────────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────┘    │
│                              ↓                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │      Configuration Layer (llmConfig.ts)                 │    │
│  │                                                          │    │
│  │  - Provider-specific parameters                         │    │
│  │  - Character parameter overrides                        │    │
│  │  - Multi-character behavior settings                    │    │
│  │  - Response timing configuration                        │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   SUPABASE EDGE FUNCTION                         │
│                     (ai-chat/index.ts)                           │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Security Layer                                           │  │
│  │  - User authentication verification                       │  │
│  │  - API key retrieval from server secrets                 │  │
│  │  - Rate limiting (ready for implementation)              │  │
│  │  - CORS handling                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Provider Routing                                         │  │
│  │  - callAnthropic() - Claude API integration              │  │
│  │  - callOpenAI() - OpenAI API integration                 │  │
│  │  - Parameter transformation                              │  │
│  │  - Response normalization                                │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────┬──────────────┬──────────────────────────────────┐
│   OpenAI     │  Anthropic   │   Google Gemini                  │
│   GPT-4      │  Claude 3.5  │   Gemini 1.5                     │
└──────────────┴──────────────┴──────────────────────────────────┘
```

---

## Core Components

### 1. Multi-Character Conversation Service

**File:** `src/services/multiCharacterConversation.ts`

This service orchestrates complex multi-character conversations with intelligent character selection, cross-character awareness, and natural dialogue flow.

> 🎭 **Complete Documentation:** See [Multi-Character Service Guide](MULTI_CHARACTER_SERVICE_GUIDE.md) for comprehensive documentation including all functions, decision logic, usage examples, and troubleshooting.

#### Key Functions

##### `determineRespondingCharacters()`
**Location:** `multiCharacterConversation.ts:30-98`

Intelligently selects which characters should respond to a user message based on conversation state and probability algorithms.

**Decision Logic:**
```typescript
// First message in conversation
if (messageCount === 0) {
  return [randomCharacter];
}

// Subsequent messages - evaluate each character
for (const charId of selectedCharacters) {
  // Prevent conversation domination
  if (charId === lastSpeaker && selectedCharacters.length > 1) {
    if (Math.random() < 0.2) respond(); // 20% chance to continue
    continue;
  }

  // Interruption check (after 2+ messages)
  if (messageCount >= minMessagesBeforeInterrupt) {
    if (Math.random() < 0.3) respond(); // 30% chance to interrupt
    continue;
  }

  // Reaction check
  if (Math.random() < 0.5) respond(); // 50% chance to react
}

// Ensure at least 1 character responds
if (respondingCharacters.length === 0) {
  return [leastRecentSpeaker || randomCharacter];
}

// Limit to max 3 characters
return respondingCharacters.slice(0, 3);
```

**Configuration:**
- `minMessagesBeforeInterrupt`: 2 messages
- `interruptionChance`: 0.3 (30%)
- `reactionChance`: 0.5 (50%)
- `maxSimultaneousResponders`: 3

---

##### `buildCharacterContext()`
**Location:** `multiCharacterConversation.ts:104-155`

Builds comprehensive system prompts for characters with awareness of other participants.

**Context Components:**

1. **Base Prompt:** Character's therapeutic style from `prompts/` directory
2. **Other Participants:** Names and descriptions of other characters
3. **Interaction Guidelines:**
   - Building on others' points
   - Offering contrasting views
   - Asking other characters questions
   - Expressing agreement/disagreement
   - Natural interruptions
   - User focus
   - Response brevity (2-4 sentences default)

4. **Recent Conversation:** Last 5 messages with speaker labels

**Example Output:**
```
[Base Psychoanalytic Prompt for Freud]

## Multi-Character Conversation Context

You are in a conversation with other AI companions:
- Jung: Analytical psychologist focusing on archetypes and individuation
- Adler: Individual psychologist emphasizing social interest

### Interaction Guidelines:
1. Be aware of others: Reference, agree with, or respectfully disagree
2. Natural dialogue: "Building on what Jung said..." or "I see it differently..."
3. Stay in character: Maintain your unique perspective
4. Interruptions: Okay to interject naturally and respectfully
5. User focus: Keep the user's needs at the center
6. Response brevity: 2-4 sentences by default

### Recent conversation:
User: I'm feeling overwhelmed at work
Jung: This might reflect a call from your Self to integrate neglected aspects
You: Your feelings may stem from unconscious conflicts between desire and duty
```

---

##### `generateMultiCharacterResponses()`
**Location:** `multiCharacterConversation.ts:182-264`

Generates responses from multiple characters with staggered timing and sequential awareness.

**Process Flow:**

```typescript
async function generateMultiCharacterResponses(
  userMessage: string,
  selectedCharacters: string[],
  messageHistory: ConversationMessage[]
): Promise<CharacterResponse[]> {

  // 1. Determine which characters should respond
  const lastSpeaker = getLastAssistantCharacter(messageHistory);
  const respondingCharacters = determineRespondingCharacters(
    selectedCharacters,
    messageHistory,
    lastSpeaker
  );

  // 2. Generate responses sequentially
  const responses: CharacterResponse[] = [];

  for (let i = 0; i < respondingCharacters.length; i++) {
    const charId = respondingCharacters[i];

    // Build context with awareness of other characters
    const systemPrompt = buildCharacterContext(
      charId,
      selectedCharacters,
      messageHistory
    );

    // Convert history with speaker labels
    const conversationMessages = formatMessagesWithSpeakers(messageHistory);
    conversationMessages.push({ role: 'user', content: userMessage });

    // Add staggered delay (except for first responder)
    if (i > 0) {
      const delay = randomDelay(500, 2000); // 500ms - 2s
      await sleep(delay);
    }

    // Generate response
    const content = await generateAIResponse(
      conversationMessages,
      systemPrompt,
      charId
    );

    // Store response
    responses.push({
      characterId: charId,
      content,
      isInterruption: i > 0,
      isReaction: messageHistory.length > 0 && i > 0,
    });

    // Update history so next character sees this response
    messageHistory.push({
      id: `temp-${Date.now()}-${charId}`,
      role: 'assistant',
      content,
      characterId: charId,
      timestamp: Date.now(),
    });
  }

  return responses;
}
```

**Key Features:**
- Sequential generation ensures characters see previous responses
- Staggered delays create natural conversation flow
- First responder has no delay (immediate response)
- Subsequent responders wait 500-2000ms
- Each character gets updated context
- Failures don't block other characters

---

##### `generateSingleCharacterResponse()`
**Location:** `multiCharacterConversation.ts:269-292`

Simplified response generation for single-character mode.

**Process:**
```typescript
async function generateSingleCharacterResponse(
  userMessage: string,
  characterId: string,
  messageHistory: ConversationMessage[]
): Promise<string> {

  // Get character configuration
  const character = getCharacter(characterId);
  const systemPrompt = getCharacterPrompt(character);

  // Format conversation history
  const conversationMessages = messageHistory.map(m => ({
    role: m.role,
    content: m.content,
  }));

  // Add current user message
  conversationMessages.push({
    role: 'user',
    content: userMessage,
  });

  // Generate response
  return await generateAIResponse(
    conversationMessages,
    systemPrompt,
    characterId
  );
}
```

**Differences from Multi-Character:**
- No cross-character awareness context
- No staggered delays
- No speaker labels in history
- Simpler system prompt
- Faster response time

---

### 2. AI Service

**File:** `src/services/aiService.ts`

Central service for AI provider integration, configuration management, and request orchestration.

> 📘 **Complete Documentation:** See [AI Service Guide](AI_SERVICE_GUIDE.md) for comprehensive documentation of aiService.ts including all functions, parameters, usage examples, and troubleshooting.

#### Configuration Management

##### `configureAI()`
**Location:** `aiService.ts:61-77`

Updates AI configuration and stores API keys securely.

```typescript
async function configureAI(newConfig: Partial<AIConfig>) {
  // Merge with existing config
  config = { ...config, ...newConfig };

  // Store API key securely
  if (newConfig.apiKey) {
    await setSecureItem('ai_api_key', newConfig.apiKey);
  }

  // Store non-sensitive preferences
  if (newConfig.provider) {
    localStorage.setItem('ai_provider', newConfig.provider);
  }
  if (newConfig.model) {
    localStorage.setItem('ai_model', newConfig.model);
  }
}
```

**Supported Providers:**
- `openai` - OpenAI GPT models
- `anthropic` - Anthropic Claude models (default)
- `gemini` - Google Gemini models
- `mock` - Development/testing mode

---

##### `initializeAI()`
**Location:** `aiService.ts:95-107`

Loads configuration from storage and environment variables on startup.

```typescript
async function initializeAI() {
  // Load preferences from localStorage
  const provider = localStorage.getItem('ai_provider');
  const model = localStorage.getItem('ai_model');

  // Load API key from environment or secure storage
  const apiKey = await loadAPIKey();

  // Apply loaded config
  if (provider) config.provider = provider;
  if (model) config.model = model;
  if (apiKey) config.apiKey = apiKey;
}
```

**Priority Order:**
1. Environment variable (`process.env.CLAUDE_API_KEY`)
2. Secure storage (sessionStorage with obfuscation)
3. Default values

---

#### Request Generation

##### `generateAIResponse()`
**Location:** `aiService.ts:122-185`

Main function for generating AI responses. Routes requests through Supabase Edge Function.

```typescript
async function generateAIResponse(
  messages: AIMessage[],
  systemPrompt?: string,
  characterId?: string,
  parameterOverrides?: Partial<ModelParameters>
): Promise<string> {

  // Inject system prompt
  const fullMessages = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  // Get parameters (character-specific or provider default)
  const parameters = characterId
    ? getCharacterParameters(characterId, config.provider)
    : getModelParameters(config.provider);

  // Apply overrides
  const finalParameters = { ...parameters, ...parameterOverrides };

  // Mock provider (development)
  if (config.provider === 'mock') {
    return generateMockResponse(fullMessages);
  }

  // Get user authentication
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session) {
    throw new Error('User not authenticated');
  }

  // Call Supabase Edge Function
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
    throw new Error(error.error || 'Failed to generate AI response');
  }

  const data = await response.json();
  return data.content;
}
```

**Security Features:**
- API keys never sent from client
- User authentication required
- Supabase auth token used for authorization
- Server-side API key retrieval

**Parameter Handling:**
- Character-specific overrides applied
- Provider-specific defaults
- Runtime parameter overrides supported
- Complete control over LLM behavior

---

#### Legacy Direct API Calls

**Note:** Direct API calls to OpenAI/Anthropic/Gemini are deprecated but still present in the codebase for backward compatibility.

##### `generateOpenAIResponse()` - `aiService.ts:190-242`
##### `generateAnthropicResponse()` - `aiService.ts:247-304`
##### `generateGeminiResponse()` - `aiService.ts:309-374`

**Issues with Direct Calls:**
- CORS errors in browser environments
- API keys exposed client-side
- No rate limiting
- No user authentication
- Security vulnerabilities

**Current Status:** Inactive, all requests routed through Edge Function

---

### 3. Supabase Edge Function

**File:** `supabase/functions/ai-chat/index.ts`

Server-side proxy for AI API calls with authentication, security, and provider abstraction.

#### Request Flow

```typescript
serve(async (req) => {
  // 1. Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // 2. Retrieve API keys from server secrets
  const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY');
  if (!CLAUDE_API_KEY) {
    throw new Error('API key not configured');
  }

  // 3. Verify user authentication
  const supabaseClient = createClient(...);
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // 4. Parse request
  const { messages, provider, model, parameters } = await req.json();

  // 5. Route to provider
  let response;
  if (provider === 'anthropic') {
    response = await callAnthropic(messages, model, CLAUDE_API_KEY, parameters);
  } else if (provider === 'openai') {
    response = await callOpenAI(messages, model, OPENAI_API_KEY, parameters);
  }

  // 6. Return response
  return new Response(
    JSON.stringify({ content: response }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
```

---

#### Provider Implementations

##### `callAnthropic()`
**Location:** `ai-chat/index.ts:86-121`

```typescript
async function callAnthropic(
  messages: any[],
  model: string,
  apiKey: string,
  parameters: any = {}
): Promise<string> {

  // Separate system message
  const systemMessage = messages.find(m => m.role === 'system');
  const conversationMessages = messages.filter(m => m.role !== 'system');

  // Build request with parameters
  const requestBody = {
    model: model,
    max_tokens: parameters.maxTokens || 1000,
    system: systemMessage?.content,
    messages: conversationMessages,
    temperature: parameters.temperature,
    top_p: parameters.topP,
    top_k: parameters.topK,
  };

  // Call Anthropic API
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();
  return data.content[0]?.text || 'Sorry, I could not generate a response.';
}
```

**Supported Parameters:**
- `temperature` - Randomness (0.0-1.0)
- `maxTokens` - Response length limit
- `topP` - Nucleus sampling
- `topK` - Top-K sampling

---

##### `callOpenAI()`
**Location:** `ai-chat/index.ts:123-153`

```typescript
async function callOpenAI(
  messages: any[],
  model: string,
  apiKey: string,
  parameters: any = {}
): Promise<string> {

  // Build request with parameters
  const requestBody = {
    model: model,
    messages: messages,
    temperature: parameters.temperature ?? 0.7,
    max_tokens: parameters.maxTokens || 1000,
    top_p: parameters.topP,
    frequency_penalty: parameters.frequencyPenalty,
    presence_penalty: parameters.presencePenalty,
  };

  // Call OpenAI API
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();
  return data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
}
```

**Supported Parameters:**
- `temperature` - Randomness (0.0-2.0)
- `maxTokens` - Response length limit
- `topP` - Nucleus sampling
- `frequencyPenalty` - Repetition reduction
- `presencePenalty` - Topic diversity

---

### 4. Configuration Layer

**File:** `src/config/llmConfig.ts`

Centralized configuration for all LLM parameters, multi-character behavior, and character-specific overrides.

#### Model Parameters

```typescript
interface ModelParameters {
  temperature: number;      // Randomness (0.0-2.0)
  maxTokens: number;        // Maximum response length
  topP?: number;            // Nucleus sampling (0.0-1.0)
  topK?: number;            // Top-K sampling
  frequencyPenalty?: number; // Repetition reduction (OpenAI)
  presencePenalty?: number;  // Topic diversity (OpenAI)
}
```

---

#### Provider Configurations

```typescript
const LLM_CONFIG: Record<string, ProviderConfig> = {
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
    defaultModel: 'claude-3-5-sonnet-20241022',
    parameters: {
      temperature: 0.8,
      maxTokens: 2000,
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
};
```

**Temperature Guidelines:**
- **0.3-0.5:** Focused, consistent, analytical
- **0.7-0.9:** Balanced creativity and consistency (default)
- **1.0-1.5:** Creative, varied, exploratory

---

#### Multi-Character Configuration

```typescript
const MULTI_CHARACTER_CONFIG: MultiCharacterConfig = {
  enabled: true,                        // Enable multi-char mode
  maxCharacters: 5,                     // Max in one conversation
  interruptionChance: 0.3,              // 30% chance to interrupt
  reactionChance: 0.5,                  // 50% chance to react
  minMessagesBeforeInterrupt: 2,        // Wait 2 msgs before interrupting
  enableCrossCharacterAwareness: true,  // Characters aware of each other
};
```

**Tuning Recommendations:**

- **High Interaction** (lively debate):
  - `interruptionChance: 0.5`
  - `reactionChance: 0.7`
  - `minMessagesBeforeInterrupt: 1`

- **Balanced** (default):
  - `interruptionChance: 0.3`
  - `reactionChance: 0.5`
  - `minMessagesBeforeInterrupt: 2`

- **Low Interaction** (orderly turns):
  - `interruptionChance: 0.1`
  - `reactionChance: 0.3`
  - `minMessagesBeforeInterrupt: 3`

---

#### Response Timing Configuration

```typescript
const RESPONSE_TIMING: ResponseTimingConfig = {
  minDelayMs: 500,                    // 0.5 seconds
  maxDelayMs: 2000,                   // 2 seconds
  typingIndicatorEnabled: true,
};
```

**Purpose:**
- Creates natural conversation pacing
- Prevents overwhelming user
- Simulates "thinking" time
- Allows sequential context updates

---

#### Character Parameter Overrides

```typescript
const CHARACTER_PARAMETER_OVERRIDES: Record<string, Partial<ModelParameters>> = {
  freud: {
    temperature: 0.85,  // Analytical yet creative
    maxTokens: 1800,
  },
  jung: {
    temperature: 0.95,  // Creative, symbolic
    maxTokens: 2000,
  },
  adler: {
    temperature: 0.75,  // Practical, direct
    maxTokens: 1500,
  },
  nietzsche: {
    temperature: 1.0,   // Bold, provocative
    maxTokens: 1800,
  },
  nhathanh: {
    temperature: 0.7,   // Calm, measured
    maxTokens: 1200,
  },
};
```

**Usage:**
```typescript
// Get character-specific parameters
const params = getCharacterParameters('jung', 'anthropic');
// Returns: { temperature: 0.95, maxTokens: 2000, topP: 0.95, topK: 40 }
```

---

### 5. Secure Storage Service

**File:** `src/services/secureStorage.ts`

Handles secure storage of sensitive data like API keys with client-side obfuscation.

#### Security Model

```typescript
// XOR obfuscation (NOT cryptographically secure)
// Prevents casual inspection in DevTools
const OBFUSCATION_KEY = 'psyche-ai-2025';

function obfuscate(text: string): string {
  return Buffer.from(
    text.split('').map((char, i) =>
      char.charCodeAt(0) ^ OBFUSCATION_KEY.charCodeAt(i % OBFUSCATION_KEY.length)
    )
  ).toString('base64');
}
```

**Storage Location:**
- **Web:** `sessionStorage` (cleared on browser close)
- **Mobile:** Would use `expo-secure-store` (not implemented)

**Important Note:** This is still client-side storage. For production, API keys should ONLY be stored server-side in Supabase secrets.

---

#### API Functions

```typescript
// Store sensitive data
await setSecureItem('ai_api_key', 'sk-...');

// Retrieve sensitive data
const apiKey = await getSecureItem('ai_api_key');

// Delete sensitive data
await deleteSecureItem('ai_api_key');

// Check if exists
const hasKey = await hasSecureItem('ai_api_key');

// Clear all secure items
await clearSecureStorage();
```

---

### 6. Prompt System Integration

**File:** `src/prompts/index.ts`

The AI Generation Layer integrates with the prompt system to provide character-specific therapeutic styles.

#### Prompt Style Configuration

```typescript
interface PromptStyle {
  id: string;           // Unique identifier
  name: string;         // Display name
  description: string;  // User-facing description
  prompt: string;       // Full system prompt
  icon: string;         // Emoji icon
}
```

**Available Styles:**
- `compassionate` - Warm, empathetic support
- `psychoanalytic` - Freudian unconscious exploration
- `jungian` - Archetypes and individuation
- `adlerian` - Social interest and belonging
- `cognitive` - CBT thought examination
- `mindfulness` - Present-focused awareness
- `socratic` - Philosophical questioning
- `creative` - Literary and expressive
- `existential` - Meaning and purpose
- `positive` - Strengths-based
- `narrative` - Story re-authoring

---

#### Integration with Characters

**Character Configuration:**
```typescript
// characters.ts
const FREUD: CharacterBehavior = {
  id: 'freud',
  name: 'Freud',
  promptStyleId: 'psychoanalytic',  // Links to prompt
  // ... other properties
};
```

**Prompt Retrieval:**
```typescript
// multiCharacterConversation.ts
function buildCharacterContext(characterId: string): string {
  const character = getCharacter(characterId);
  const basePrompt = getCharacterPrompt(character);

  // basePrompt contains the full psychoanalytic prompt
  // Multi-character context appended if needed

  return basePrompt + multiCharacterContext;
}
```

---

## Message Flow Through AI Generation Layer

### Single Character Flow

```
User sends message
       ↓
MainTabs.handleSendMessage()
       ↓
Save user message to DB
       ↓
generateSingleCharacterResponse()
   ├─ getCharacter(characterId)
   ├─ getCharacterPrompt(character)
   └─ Format conversation history
       ↓
generateAIResponse()
   ├─ Get character parameters
   ├─ Inject system prompt
   └─ Prepare request payload
       ↓
Supabase Edge Function
   ├─ Verify authentication
   ├─ Retrieve API key from secrets
   ├─ Route to provider (Anthropic/OpenAI)
   └─ Call external API
       ↓
Anthropic/OpenAI API
       ↓
Response returned
       ↓
Save assistant message to DB
       ↓
Display in UI
```

---

### Multi-Character Flow

```
User sends message
       ↓
MainTabs.handleSendMessage()
       ↓
Save user message to DB
       ↓
generateMultiCharacterResponses()
       ↓
determineRespondingCharacters()
   ├─ Check if first message → 1 random char
   ├─ Check conversation dominance
   ├─ Apply interruption probability (30%)
   ├─ Apply reaction probability (50%)
   └─ Ensure 1-3 characters respond
       ↓
FOR EACH responding character:
   ├─ buildCharacterContext()
   │  ├─ Get base prompt
   │  ├─ Add other participants info
   │  ├─ Add interaction guidelines
   │  └─ Add recent conversation history
   │
   ├─ Format messages with speaker labels
   │
   ├─ Apply staggered delay (500-2000ms)
   │
   ├─ generateAIResponse()
   │  └─ [Same as single character flow]
   │
   ├─ Store response
   │
   └─ Update message history (next char sees this)
       ↓
Return all responses
       ↓
Save each response to DB
       ↓
Display in UI with character labels
```

---

## Parameter Configuration Examples

### Example 1: Creative Exploration Character

```typescript
// llmConfig.ts
CHARACTER_PARAMETER_OVERRIDES: {
  creative_explorer: {
    temperature: 1.2,           // High creativity
    maxTokens: 2500,            // Longer responses
    topP: 0.98,                 // More diverse vocabulary
    frequencyPenalty: 0.5,      // Reduce repetition
  }
}
```

**Result:** Character generates creative, varied responses with rich vocabulary and longer explorations.

---

### Example 2: Focused Analytical Character

```typescript
// llmConfig.ts
CHARACTER_PARAMETER_OVERRIDES: {
  analyst: {
    temperature: 0.4,           // Low randomness
    maxTokens: 1200,            // Concise responses
    topP: 0.85,                 // Focused vocabulary
    frequencyPenalty: 0.2,      // Some variation
  }
}
```

**Result:** Character provides focused, consistent, analytical responses with less variation.

---

### Example 3: Balanced Conversationalist

```typescript
// llmConfig.ts
CHARACTER_PARAMETER_OVERRIDES: {
  balanced: {
    temperature: 0.8,           // Medium creativity
    maxTokens: 1500,            // Standard length
    topP: 0.95,                 // Balanced vocab
    frequencyPenalty: 0.3,      // Standard repetition control
  }
}
```

**Result:** Well-rounded character suitable for general conversations.

---

## Runtime Parameter Overrides

The system supports runtime parameter overrides for dynamic behavior:

```typescript
// Example: Generate response with custom parameters
const response = await generateAIResponse(
  messages,
  systemPrompt,
  characterId,
  {
    temperature: 0.5,        // Override: More focused
    maxTokens: 800,          // Override: Shorter response
  }
);
```

**Use Cases:**
- User requests brief vs detailed responses
- Context-specific behavior (urgent vs exploratory)
- Testing different parameters
- Dynamic difficulty adjustment

---

## Error Handling

### Client-Side Error Handling

**Location:** `aiService.ts:145-185`

```typescript
try {
  const response = await fetch(edgeFunctionUrl, { ... });

  if (!response.ok) {
    const error = await response.json();
    console.error('[AI] Edge Function error:', error);
    throw new Error(error.error || 'Failed to generate AI response');
  }

  const data = await response.json();
  return data.content;
} catch (error: any) {
  console.error('[AI] Error:', error);
  throw error;
}
```

**Error Types:**
- Authentication errors (401)
- Configuration errors (API key missing)
- Network errors
- Provider API errors
- Timeout errors

---

### Multi-Character Error Handling

**Location:** `multiCharacterConversation.ts:227-260`

```typescript
try {
  const content = await generateAIResponse(...);
  responses.push({ characterId, content, ... });
} catch (error) {
  console.error(`[Multi-Char] Error for ${characterId}:`, error);
  // Continue with other characters even if one fails
}
```

**Behavior:**
- Individual character failures don't block others
- Errors logged for debugging
- At least one character will respond (if any succeed)
- User sees responses from successful characters

---

### Edge Function Error Handling

**Location:** `ai-chat/index.ts:74-83`

```typescript
catch (error) {
  console.error('[AI-Chat] Error:', error);
  return new Response(
    JSON.stringify({ error: error.message }),
    {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}
```

**Error Types:**
- API key not configured
- User authentication failed
- Provider API errors
- Invalid request format

---

## Performance Considerations

### 1. Response Timing

**Single Character:**
- Typical latency: 1-3 seconds
- No artificial delays
- Depends on provider and model

**Multi-Character:**
- First character: 1-3 seconds
- Additional characters: +500-2000ms each
- Total time: 2-8 seconds for 3 characters
- Sequential generation with staggered delays

---

### 2. Token Usage Optimization

**Max Token Settings:**
```typescript
// Conservative defaults
maxTokens: 1500-2000

// Brief responses (multi-character)
maxTokens: 1200

// Detailed exploration (single-character)
maxTokens: 2500
```

**Cost Impact:**
- Claude 3.5 Sonnet: ~$3/million input tokens, ~$15/million output
- Setting `maxTokens: 1500` limits output cost
- Prompt engineering for brevity reduces tokens further

---

### 3. Caching Strategies

**Current Implementation:**
- Character configurations cached in memory
- Prompt styles loaded once at startup
- Provider parameters cached per session

**Future Enhancements:**
- Response caching for identical queries
- Conversation summary caching
- Prompt template caching

---

### 4. Parallel vs Sequential

**Why Sequential Generation:**
```typescript
// Characters generated sequentially so each sees previous responses
for (let i = 0; i < respondingCharacters.length; i++) {
  const response = await generateAIResponse(...);

  // Update history so next character is aware
  messageHistory.push({
    role: 'assistant',
    content: response,
    characterId: respondingCharacters[i],
  });
}
```

**Benefits:**
- Cross-character awareness
- Natural conversation flow
- Characters can reference each other
- More coherent multi-character dialogue

**Tradeoff:**
- Slower total response time
- Acceptable for quality improvement

---

## Security Architecture

### 1. API Key Protection

```
┌─────────────────────────────────────┐
│  Client (Browser)                   │
│                                     │
│  ❌ NO API Keys                     │
│  ✅ Supabase Auth Token             │
│  ✅ Provider/Model Selection        │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Supabase Edge Function             │
│                                     │
│  ✅ API Keys (Server Secrets)       │
│  ✅ User Authentication Check       │
│  ✅ Rate Limiting Ready             │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  AI Provider (Anthropic/OpenAI)     │
└─────────────────────────────────────┘
```

---

### 2. Authentication Flow

```typescript
// Client side
const { data: session } = await supabase.auth.getSession();
const response = await fetch(edgeFunctionUrl, {
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
  },
});

// Edge Function
const supabaseClient = createClient(...);
const { data: { user } } = await supabaseClient.auth.getUser();

if (!user) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401
  });
}
```

**Security Benefits:**
- Every request authenticated
- User context available for rate limiting
- Prevents unauthorized API usage
- Audit trail of API calls

---

### 3. Rate Limiting (Ready for Implementation)

**Current Status:** Infrastructure ready, not yet implemented

**Implementation Plan:**
```typescript
// Edge Function
const userId = user.id;
const rateLimitKey = `rate_limit:${userId}`;

// Check Redis or Supabase for rate limit
const requestCount = await getRateLimitCount(rateLimitKey);

if (requestCount > MAX_REQUESTS_PER_HOUR) {
  return new Response(JSON.stringify({
    error: 'Rate limit exceeded'
  }), {
    status: 429
  });
}

// Increment counter
await incrementRateLimitCount(rateLimitKey);
```

**Recommended Limits:**
- Free tier: 50 requests/hour
- Pro tier: 500 requests/hour
- Enterprise: Unlimited

---

## Mock Provider for Development

**Location:** `aiService.ts:379-406`

The mock provider enables development and testing without API keys.

```typescript
async function generateMockResponse(messages: AIMessage[]): Promise<string> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const lastUserMessage = messages.filter(m => m.role === 'user').pop();

  // Context-aware mock responses
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

**Usage:**
```typescript
await configureAI({ provider: 'mock' });
```

**Features:**
- No API key required
- Instant responses (1s simulated delay)
- Context-aware based on keywords
- Perfect for UI development

---

## Monitoring and Debugging

### Console Logging

The AI Generation Layer includes comprehensive logging:

```typescript
// Provider selection
console.log('[AI] Calling Edge Function with provider:', config.provider);
console.log('[AI] Using parameters:', finalParameters);

// Multi-character decisions
console.log('[Multi-Char] Characters responding:', respondingCharacters);

// Edge Function
console.log(`[AI-Chat] User: ${user.id}, Provider: ${provider}, Messages: ${messages.length}`);
console.log(`[AI-Chat] Parameters:`, parameters);
```

---

### Error Tracking

```typescript
// Client-side
console.error('[AI] Edge Function error:', error);
console.error('[Multi-Char] Error generating response for ${charId}:', error);

// Edge Function
console.error('[AI-Chat] Error:', error);
```

---

### Performance Metrics

```typescript
// Track response times
const startTime = Date.now();
const response = await generateAIResponse(...);
const duration = Date.now() - startTime;
console.log(`[AI] Response generated in ${duration}ms`);
```

---

## Configuration Best Practices

### 1. Temperature Tuning

**Conservative (0.3-0.5):**
- Use for: Medical advice, factual queries, consistency
- Character types: Analysts, scientists, historians
- Risk: May feel robotic

**Balanced (0.7-0.9):**
- Use for: General conversation, therapy, coaching
- Character types: Most therapeutic styles
- Risk: Minimal, good default

**Creative (1.0-1.5):**
- Use for: Creative writing, brainstorming, exploration
- Character types: Artists, philosophers, visionaries
- Risk: May be inconsistent or off-topic

---

### 2. Max Tokens Strategy

**Brief (800-1200):**
- Multi-character conversations
- Quick responses
- Cost-sensitive applications

**Standard (1500-2000):**
- Single-character conversations
- Balanced depth and brevity
- Default recommendation

**Detailed (2500-3000):**
- Deep explorations
- Educational content
- When user explicitly requests detail

---

### 3. Multi-Character Tuning

**For Group Therapy Feel:**
```typescript
MULTI_CHARACTER_CONFIG = {
  enabled: true,
  maxCharacters: 3,
  interruptionChance: 0.2,        // Low interruptions
  reactionChance: 0.6,            // High reactions
  minMessagesBeforeInterrupt: 3,  // Patient
  enableCrossCharacterAwareness: true,
};
```

**For Lively Debate:**
```typescript
MULTI_CHARACTER_CONFIG = {
  enabled: true,
  maxCharacters: 5,
  interruptionChance: 0.5,        // Frequent interruptions
  reactionChance: 0.7,            // Very reactive
  minMessagesBeforeInterrupt: 1,  // Immediate
  enableCrossCharacterAwareness: true,
};
```

---

## Testing

### Unit Tests (Recommended)

```typescript
// Test character selection
describe('determineRespondingCharacters', () => {
  it('should return 1 character for first message', () => {
    const characters = ['freud', 'jung', 'adler'];
    const result = determineRespondingCharacters(characters, [], undefined);
    expect(result).toHaveLength(1);
  });

  it('should not exceed max 3 characters', () => {
    const characters = ['a', 'b', 'c', 'd', 'e'];
    const result = determineRespondingCharacters(characters, mockHistory, 'a');
    expect(result.length).toBeLessThanOrEqual(3);
  });
});
```

---

### Integration Tests

```typescript
// Test Edge Function integration
describe('generateAIResponse', () => {
  it('should generate response using Edge Function', async () => {
    const messages = [
      { role: 'user', content: 'Hello' }
    ];
    const response = await generateAIResponse(messages);
    expect(response).toBeTruthy();
    expect(typeof response).toBe('string');
  });
});
```

---

### Manual Testing Scenarios

1. **Single Character:**
   - ✓ Response generated
   - ✓ Character parameters applied
   - ✓ System prompt included
   - ✓ Conversation history maintained

2. **Multi-Character:**
   - ✓ Multiple characters respond
   - ✓ Staggered delays observed
   - ✓ Cross-character references work
   - ✓ Interruption/reaction probabilities working
   - ✓ No character dominance

3. **Error Handling:**
   - ✓ Invalid API key handled
   - ✓ Network errors don't crash
   - ✓ Authentication errors caught
   - ✓ Individual character failures don't block others

4. **Configuration:**
   - ✓ Provider switching works
   - ✓ Model selection persists
   - ✓ Character overrides applied
   - ✓ Runtime overrides work

---

## Future Enhancements

### 1. Streaming Responses

**Current:** Responses return all at once after generation
**Future:** Stream tokens in real-time

```typescript
async function* generateAIResponseStream(
  messages: AIMessage[],
  systemPrompt?: string
): AsyncGenerator<string> {
  const response = await fetch(edgeFunctionUrl, {
    // Enable streaming
  });

  const reader = response.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    yield decoder.decode(value);
  }
}
```

**Benefits:**
- Faster perceived response time
- Better UX for long responses
- Reduced wait time for user

---

### 2. Context Window Management

**Current:** Full conversation history sent each time
**Future:** Intelligent context pruning

```typescript
function pruneConversationHistory(
  messages: ConversationMessage[],
  maxTokens: number
): ConversationMessage[] {
  // Keep most recent messages
  // Summarize older messages
  // Preserve important entities
}
```

**Benefits:**
- Reduced token costs
- Support for very long conversations
- Maintain conversation quality

---

### 3. Response Caching

```typescript
// Cache identical queries
const cacheKey = hash(messages + systemPrompt);
const cached = await getCache(cacheKey);
if (cached) return cached;

const response = await generateAIResponse(...);
await setCache(cacheKey, response, TTL_1_HOUR);
```

**Benefits:**
- Reduced API costs
- Faster responses for repeated queries
- Lower server load

---

### 4. Advanced Rate Limiting

```typescript
// Per-user tiered limits
interface RateLimits {
  requestsPerHour: number;
  tokensPerDay: number;
  concurrentRequests: number;
}

const limits = getUserTierLimits(user.id);
await enforceRateLimits(user.id, limits);
```

---

### 5. A/B Testing Framework

```typescript
// Test different parameters
const experiment = getActiveExperiment(user.id);
const parameters = experiment?.parameters || defaultParameters;

await generateAIResponse(messages, systemPrompt, characterId, parameters);
await logExperimentResult(experiment.id, response);
```

**Use Cases:**
- Test different temperature values
- Compare response lengths
- Optimize multi-character probabilities
- Measure user satisfaction

---

## Troubleshooting

### Issue: "User not authenticated"

**Cause:** Supabase auth session expired or invalid

**Solution:**
```typescript
// Check auth status
const { data: { session } } = await supabase.auth.getSession();
console.log('Auth session:', session);

// Re-authenticate if needed
await supabase.auth.signInWithPassword({ ... });
```

---

### Issue: "API key not configured"

**Cause:** Edge Function can't retrieve API key from secrets

**Solution:**
```bash
# Set Supabase secrets
supabase secrets set CLAUDE_API_KEY=sk-ant-...
supabase secrets set OPENAI_API_KEY=sk-...

# Verify
supabase secrets list
```

---

### Issue: Characters not interrupting

**Cause:** Interruption probability too low or not enough messages

**Solution:**
```typescript
// Increase interruption chance
MULTI_CHARACTER_CONFIG.interruptionChance = 0.5;

// Reduce minimum messages
MULTI_CHARACTER_CONFIG.minMessagesBeforeInterrupt = 1;
```

---

### Issue: Responses too long/short

**Cause:** Max tokens setting

**Solution:**
```typescript
// Adjust max tokens
LLM_CONFIG.anthropic.parameters.maxTokens = 1200; // Shorter

// Or use character overrides
CHARACTER_PARAMETER_OVERRIDES.mychar = {
  maxTokens: 2500, // Longer
};
```

---

### Issue: Same character always responding

**Cause:** Conversation dominance not prevented

**Solution:**
```typescript
// Check character selection logic
if (charId === lastSpeaker && selectedCharacters.length > 1) {
  // Only 20% chance to continue
  if (Math.random() < 0.2) {
    respondingCharacters.push(charId);
  }
}
```

---

## Key Files Reference

| File | Purpose | Lines of Code |
|------|---------|---------------|
| `src/services/multiCharacterConversation.ts` | Multi-character orchestration | 307 |
| `src/services/aiService.ts` | AI provider integration | 422 |
| `supabase/functions/ai-chat/index.ts` | Edge Function proxy | 154 |
| `src/config/llmConfig.ts` | Configuration & parameters | 171 |
| `src/services/secureStorage.ts` | Secure key storage | 125 |
| `src/prompts/index.ts` | Prompt style management | 142 |

**Total Lines:** ~1,321 lines of core AI generation code

---

## Related Documentation

- **AI Service Guide:** [AI_SERVICE_GUIDE.md](AI_SERVICE_GUIDE.md) - Complete aiService.ts documentation 📘
- **Multi-Character Service Guide:** [MULTI_CHARACTER_SERVICE_GUIDE.md](MULTI_CHARACTER_SERVICE_GUIDE.md) - Complete multiCharacterConversation.ts documentation 🎭
- **Configuration Guide:** [CONFIGURATION_GUIDE.md](CONFIGURATION_GUIDE.md) - LLM parameters and settings
- **Conversation Flow:** [CONVERSATION_FLOW.md](CONVERSATION_FLOW.md) - Message flow architecture
- **Adaptive Response Length:** [ADAPTIVE_RESPONSE_LENGTH.md](ADAPTIVE_RESPONSE_LENGTH.md) - Dynamic response sizing
- **LLM Interaction Flow:** [llm-interaction-flow.md](llm-interaction-flow.md) - Request/response flow diagrams

---

*Last Updated: 2025-11-29*
*Version: 1.0*
