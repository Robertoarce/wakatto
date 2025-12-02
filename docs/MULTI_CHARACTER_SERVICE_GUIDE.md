# Multi-Character Conversation Service Guide

Complete documentation for `src/services/multiCharacterConversation.ts` - the intelligent multi-character conversation orchestrator.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Interfaces](#core-interfaces)
4. [Character Selection Logic](#character-selection-logic)
5. [Context Building](#context-building)
6. [Response Generation](#response-generation)
7. [Configuration](#configuration)
8. [Usage Examples](#usage-examples)
9. [Advanced Scenarios](#advanced-scenarios)
10. [Troubleshooting](#troubleshooting)

---

## Overview

**File Location:** `src/services/multiCharacterConversation.ts`
**Lines of Code:** ~313 lines
**Purpose:** Orchestrate intelligent multi-character conversations with interruptions, reactions, and cross-character awareness

### Key Features

- 🎭 **Dynamic Character Selection** - Intelligent probability-based selection
- 💬 **Cross-Character Awareness** - Characters reference and react to each other
- ⚡ **Natural Interruptions** - Characters can interrupt based on probability
- 🎯 **Conversation Balance** - Prevents character domination
- ⏱️ **Staggered Responses** - Natural timing with delays
- 🔄 **Sequential Context Updates** - Each character sees previous responses
- 🛡️ **Error Resilience** - Individual character failures don't block others

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│         Multi-Character Conversation Service                     │
│         (multiCharacterConversation.ts)                         │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Character Selection Layer                                 │  │
│  │  determineRespondingCharacters()                          │  │
│  │                                                            │  │
│  │  • First message detection                                │  │
│  │  • Conversation domination prevention                     │  │
│  │  • Interruption probability check (30%)                   │  │
│  │  • Reaction probability check (50%)                       │  │
│  │  • Fallback to ensure 1+ character                        │  │
│  │  • Limit to max 3 characters                              │  │
│  └───────────────────────────────────────────────────────────┘  │
│                           ↓                                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Context Building Layer                                    │  │
│  │  buildCharacterContext()                                   │  │
│  │                                                            │  │
│  │  • Base character prompt                                  │  │
│  │  • Other participants info                                │  │
│  │  • Interaction guidelines                                 │  │
│  │  • Recent conversation history (last 5 msgs)              │  │
│  │  • Speaker labels (Jung, Freud, You)                      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                           ↓                                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Response Generation Layer                                 │  │
│  │  generateMultiCharacterResponses()                         │  │
│  │                                                            │  │
│  │  FOR EACH responding character:                           │  │
│  │    1. Build context (with other chars)                    │  │
│  │    2. Format message history                              │  │
│  │    3. Add staggered delay (500-2000ms)                    │  │
│  │    4. Call generateAIResponse()                           │  │
│  │    5. Store response                                      │  │
│  │    6. Update history for next character                   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                           ↓
                    aiService.ts
                    (AI Generation)
```

---

## Core Interfaces

### ConversationMessage
**Location:** `multiCharacterConversation.ts:12-18`

Represents a message in the conversation history.

```typescript
export interface ConversationMessage {
  id: string;                    // Unique message identifier
  role: 'user' | 'assistant';    // Who sent the message
  content: string;               // Message text
  characterId?: string;          // Character ID (for assistant messages)
  timestamp: number;             // Unix timestamp
}
```

**Usage:**
```typescript
const message: ConversationMessage = {
  id: 'msg-123',
  role: 'assistant',
  content: 'This unconscious pattern may be important...',
  characterId: 'freud',
  timestamp: Date.now()
};
```

---

### CharacterResponse
**Location:** `multiCharacterConversation.ts:20-25`

Represents a response from a character with metadata.

```typescript
export interface CharacterResponse {
  characterId: string;      // Which character responded
  content: string;          // Response content
  isInterruption: boolean;  // Was this an interruption?
  isReaction: boolean;      // Was this a reaction to another character?
}
```

**Usage:**
```typescript
const response: CharacterResponse = {
  characterId: 'jung',
  content: 'Building on what Freud said...',
  isInterruption: true,
  isReaction: true
};
```

---

## Character Selection Logic

### determineRespondingCharacters()
**Location:** `multiCharacterConversation.ts:30-101`

**PRIMARY FUNCTION** - Intelligently determines which characters should respond to a user message.

```typescript
export function determineRespondingCharacters(
  selectedCharacters: string[],
  messageHistory: ConversationMessage[],
  lastSpeaker?: string
): string[]
```

**Parameters:**
- `selectedCharacters`: All characters selected for this conversation
- `messageHistory`: Full conversation history
- `lastSpeaker`: Character ID of last assistant message

**Returns:** Array of character IDs that should respond (1-3 characters)

---

### Decision Flow

#### 1. Multi-Character Mode Check
```typescript
if (!MULTI_CHARACTER_CONFIG.enabled || selectedCharacters.length === 1) {
  return selectedCharacters;  // Return all (just one) character
}
```

**Exit Early If:**
- Multi-character mode disabled
- Only one character selected

---

#### 2. First Message Detection
```typescript
const messageCount = messageHistory.filter(m => m.role === 'assistant').length;

if (messageCount === 0) {
  // First response: pick a random character to start
  const randomIdx = Math.floor(Math.random() * selectedCharacters.length);
  respondingCharacters.push(selectedCharacters[randomIdx]);
  console.log('[MultiChar] First message, selected character:', selectedCharacters[randomIdx]);
}
```

**Behavior:**
- First message in conversation → 1 random character responds
- Creates natural conversation starting point
- Prevents overwhelming user with multiple responses

---

#### 3. Subsequent Message Logic

For each character, evaluate whether they should respond:

##### a) Conversation Domination Prevention
```typescript
if (charId === lastSpeaker && selectedCharacters.length > 1) {
  // Small chance to continue (dominating the conversation)
  if (Math.random() < 0.2) {
    respondingCharacters.push(charId);
  }
  continue;
}
```

**Purpose:** Prevent one character from dominating
**Probability:** 20% chance to respond twice in a row
**Skip:** If fails check, move to next character

---

##### b) Interruption Check
```typescript
if (messageCount >= MULTI_CHARACTER_CONFIG.minMessagesBeforeInterrupt) {
  if (Math.random() < MULTI_CHARACTER_CONFIG.interruptionChance) {
    respondingCharacters.push(charId);
    continue;
  }
}
```

**Purpose:** Allow natural interruptions after conversation starts
**Requirements:**
- Must be at least `minMessagesBeforeInterrupt` messages (default: 2)
- Probability: `interruptionChance` (default: 30%)

---

##### c) Reaction Check
```typescript
if (Math.random() < MULTI_CHARACTER_CONFIG.reactionChance) {
  respondingCharacters.push(charId);
}
```

**Purpose:** Characters react to user or other characters
**Probability:** `reactionChance` (default: 50%)

---

#### 4. Fallback (Ensure Response)
```typescript
if (respondingCharacters.length === 0) {
  // Pick a character that hasn't spoken recently
  const recentSpeakers = messageHistory
    .slice(-3)
    .map(m => m.characterId)
    .filter(Boolean);

  const availableChars = selectedCharacters.filter(
    c => !recentSpeakers.includes(c)
  );

  if (availableChars.length > 0) {
    const randomIdx = Math.floor(Math.random() * availableChars.length);
    respondingCharacters.push(availableChars[randomIdx]);
  } else {
    const randomIdx = Math.floor(Math.random() * selectedCharacters.length);
    respondingCharacters.push(selectedCharacters[randomIdx]);
  }
}
```

**Purpose:** Guarantee at least 1 character responds
**Strategy:**
1. Prefer characters that haven't spoken in last 3 messages
2. Fall back to random character if all recently spoke

---

#### 5. Limit Maximum Responders
```typescript
return respondingCharacters.slice(0, 3);
```

**Purpose:** Prevent overwhelming user with too many responses
**Limit:** Maximum 3 characters per turn

---

### Selection Examples

#### Example 1: First Message
```typescript
selectedCharacters: ['freud', 'jung', 'adler']
messageHistory: []
lastSpeaker: undefined

→ Result: ['jung']  // Random selection
```

---

#### Example 2: Preventing Domination
```typescript
selectedCharacters: ['freud', 'jung', 'adler']
lastSpeaker: 'freud'

// Freud has 20% chance to continue
// Jung has 30% chance to interrupt + 50% chance to react
// Adler has 30% chance to interrupt + 50% chance to react

→ Possible Result: ['jung']  // Different character selected
```

---

#### Example 3: Multiple Responders
```typescript
selectedCharacters: ['freud', 'jung', 'adler']
lastSpeaker: 'freud'
messageHistory: [5+ messages]

// Jung interrupts (30% rolled true)
// Adler reacts (50% rolled true)

→ Result: ['jung', 'adler']  // Both respond
```

---

## Context Building

### buildCharacterContext()
**Location:** `multiCharacterConversation.ts:107-158`

Builds comprehensive system prompts with cross-character awareness.

```typescript
function buildCharacterContext(
  characterId: string,
  selectedCharacters: string[],
  messageHistory: ConversationMessage[]
): string
```

**Parameters:**
- `characterId`: Character receiving the context
- `selectedCharacters`: All characters in conversation
- `messageHistory`: Full conversation history

**Returns:** Complete system prompt with multi-character context

---

### Context Components

#### 1. Base Prompt
```typescript
const character = getCharacter(characterId);
const basePrompt = getCharacterPrompt(character);
```

**Source:** Character's therapeutic style prompt
**Examples:**
- Freud → Psychoanalytic prompt
- Jung → Jungian prompt
- Adler → Adlerian prompt

---

#### 2. Single Character Check
```typescript
if (!MULTI_CHARACTER_CONFIG.enableCrossCharacterAwareness || selectedCharacters.length === 1) {
  return basePrompt;  // Just return base prompt
}
```

**Exit Early If:**
- Cross-character awareness disabled
- Only one character in conversation

---

#### 3. Other Participants Info
```typescript
const otherCharacters = selectedCharacters
  .filter(id => id !== characterId)
  .map(id => {
    const char = getCharacter(id);
    return `- ${char.name}: ${char.description}`;
  })
  .join('\n');
```

**Output Example:**
```
- Carl Jung: Analytical psychologist focusing on archetypes and individuation
- Alfred Adler: Individual psychologist emphasizing social interest and belonging
```

---

#### 4. Interaction Guidelines

Added to every multi-character prompt:

```
## Multi-Character Conversation Context

You are in a conversation with other AI companions. Here are the other participants:
[Other participants list]

### Interaction Guidelines:

1. **Be aware of others**: You can reference, agree with, or respectfully
   disagree with what other characters have said.

2. **Natural dialogue**: Respond as you would in a real group discussion. You might:
   - Build on someone else's point: "Building on what Jung said..."
   - Offer a contrasting view: "I see it differently..."
   - Ask another character a question: "What do you think, Adler?"
   - Express agreement: "Exactly. I'd add that..."

3. **Stay in character**: Maintain your unique perspective and therapeutic
   approach while acknowledging others.

4. **Interruptions**: If you feel strongly about something, it's okay to
   interject (naturally and respectfully).

5. **User focus**: While you can engage with other characters, always keep
   the user's needs and questions at the center.

6. **Response brevity**: Keep responses brief (2-4 sentences) by default.
   Only expand when the user explicitly requests detail, the topic is
   genuinely complex, or you're introducing a concept that requires context.
```

---

#### 5. Recent Conversation History
```typescript
### Recent conversation:
${formatRecentMessages(messageHistory, characterId)}
```

**Includes:** Last 5 messages with speaker labels

**Example Output:**
```
### Recent conversation:
User: I'm feeling overwhelmed at work
Jung: This might reflect a call from your Self to integrate neglected aspects
You: Your feelings may stem from unconscious conflicts between desire and duty
User: That makes sense. What should I do?
```

---

### formatRecentMessages()
**Location:** `multiCharacterConversation.ts:163-180`

Formats conversation history with speaker labels.

```typescript
function formatRecentMessages(
  messages: ConversationMessage[],
  currentCharacterId: string
): string
```

**Logic:**
```typescript
return messages
  .slice(-5) // Last 5 messages
  .map(m => {
    if (m.role === 'user') {
      return `User: ${m.content}`;
    } else if (m.characterId) {
      const char = getCharacter(m.characterId);
      const prefix = m.characterId === currentCharacterId ? 'You' : char.name;
      return `${prefix}: ${m.content}`;
    }
    return `Assistant: ${m.content}`;
  })
  .join('\n');
```

**Key Features:**
- Shows last 5 messages only (keeps context manageable)
- Current character sees "You" for their own messages
- Other characters labeled by name
- User messages labeled "User"

---

### Complete Context Example

**For Freud in conversation with Jung and Adler:**

```
[Freud's base psychoanalytic prompt]

## Multi-Character Conversation Context

You are in a conversation with other AI companions. Here are the other participants:
- Carl Jung: Analytical psychologist focusing on archetypes and individuation
- Alfred Adler: Individual psychologist emphasizing social interest and belonging

### Interaction Guidelines:
[Full guidelines as shown above]

### Recent conversation:
User: I'm struggling with self-doubt
Jung: This may be your shadow trying to integrate
You: These feelings could stem from early childhood experiences
Adler: I'd add that comparing yourself to others exacerbates this
User: How do I overcome this?
```

---

## Response Generation

### generateMultiCharacterResponses()
**Location:** `multiCharacterConversation.ts:185-270`

**MAIN ENTRY POINT** - Generates responses from multiple characters with intelligent orchestration.

```typescript
export async function generateMultiCharacterResponses(
  userMessage: string,
  selectedCharacters: string[],
  messageHistory: ConversationMessage[]
): Promise<CharacterResponse[]>
```

**Parameters:**
- `userMessage`: New message from user
- `selectedCharacters`: All characters in this conversation
- `messageHistory`: Complete conversation history

**Returns:** Array of character responses with metadata

---

### Generation Flow

#### Step 1: Determine Responders
```typescript
const lastAssistantMessage = [...messageHistory].reverse().find(m => m.role === 'assistant');
const lastSpeaker = lastAssistantMessage?.characterId;

const respondingCharacters = determineRespondingCharacters(
  selectedCharacters,
  messageHistory,
  lastSpeaker
);

console.log('[Multi-Char] Characters responding:', respondingCharacters);
```

**Purpose:** Decide which 1-3 characters will respond

---

#### Step 2: Sequential Generation Loop

For each responding character:

##### a) Build Context
```typescript
const character = getCharacter(charId);
console.log(`[MultiChar] Retrieved character:`, character.name, character.id);

const systemPrompt = buildCharacterContext(
  charId,
  selectedCharacters,
  messageHistory
);
```

**Purpose:** Create full prompt with multi-character awareness

---

##### b) Format Message History
```typescript
const conversationMessages = messageHistory.map(m => ({
  role: m.role as 'user' | 'assistant' | 'system',
  content: m.role === 'assistant' && m.characterId
    ? `[${getCharacter(m.characterId).name}]: ${m.content}`
    : m.content,
}));
```

**Key Feature:** Assistant messages labeled with character name
**Example:** `[Jung]: This reflects your inner Self calling...`

---

##### c) Add Current User Message
```typescript
conversationMessages.push({
  role: 'user',
  content: userMessage,
});
```

---

##### d) Add Staggered Delay
```typescript
if (i > 0) {
  const delay = RESPONSE_TIMING.minDelayMs +
    Math.random() * (RESPONSE_TIMING.maxDelayMs - RESPONSE_TIMING.minDelayMs);
  await new Promise(resolve => setTimeout(resolve, delay));
}
```

**Purpose:** Create natural conversation pacing
**Default Range:** 500-2000ms
**First Character:** No delay (immediate response)
**Subsequent Characters:** Random delay within range

---

##### e) Generate Response
```typescript
const content = await generateAIResponse(
  conversationMessages,
  systemPrompt,
  charId
);
```

**See:** [AI Service Guide](AI_SERVICE_GUIDE.md) for details

---

##### f) Store Response
```typescript
responses.push({
  characterId: charId,
  content,
  isInterruption: i > 0, // First responder is not an interruption
  isReaction: messageHistory.length > 0 && i > 0,
});
```

**Metadata:**
- `isInterruption`: True if not first responder
- `isReaction`: True if not first responder AND conversation has history

---

##### g) Update History for Next Character
```typescript
messageHistory.push({
  id: `temp-${Date.now()}-${charId}`,
  role: 'assistant',
  content,
  characterId: charId,
  timestamp: Date.now(),
});
```

**Critical:** Next character sees this response in their context
**Result:** Sequential awareness and natural dialogue

---

#### Step 3: Error Handling
```typescript
catch (error) {
  console.error(`[Multi-Char] Error generating response for ${charId}:`, error);
  // Continue with other characters even if one fails
}
```

**Resilience:** Individual failures don't block other characters

---

### Complete Example Flow

```typescript
// User sends message
userMessage: "I'm anxious about work"
selectedCharacters: ['freud', 'jung', 'adler']
messageHistory: [previous conversation]

// Step 1: Determine responders
→ respondingCharacters: ['jung', 'adler']

// Step 2: Generate Jung's response
→ Build context for Jung (includes Freud, Adler info)
→ No delay (first responder)
→ Generate response: "This anxiety may reflect unintegrated shadow aspects..."
→ Add to history

// Step 3: Generate Adler's response
→ Build context for Adler (includes Freud, Jung info + Jung's response)
→ Wait 1200ms (staggered delay)
→ Generate response: "Building on Jung's point, your anxiety might also stem from..."
→ Add to history

// Return
→ [
    { characterId: 'jung', content: '...', isInterruption: false, isReaction: false },
    { characterId: 'adler', content: '...', isInterruption: true, isReaction: true }
  ]
```

---

### generateSingleCharacterResponse()
**Location:** `multiCharacterConversation.ts:275-298`

Simplified response generation for single-character mode (backward compatible).

```typescript
export async function generateSingleCharacterResponse(
  userMessage: string,
  characterId: string,
  messageHistory: ConversationMessage[]
): Promise<string>
```

**Differences from Multi-Character:**
- ❌ No cross-character awareness
- ❌ No character selection logic
- ❌ No staggered delays
- ❌ No speaker labels in history
- ✅ Simpler, faster response
- ✅ Same character-specific parameters

**Usage:**
```typescript
const response = await generateSingleCharacterResponse(
  "I feel stressed",
  "freud",
  messageHistory
);

console.log(response); // "Your stress may indicate..."
```

---

## Configuration

### MULTI_CHARACTER_CONFIG
**Location:** `src/config/llmConfig.ts`

```typescript
export const MULTI_CHARACTER_CONFIG: MultiCharacterConfig = {
  enabled: true,                        // Master toggle
  maxCharacters: 5,                     // Max in one conversation
  interruptionChance: 0.3,              // 30% chance to interrupt
  reactionChance: 0.5,                  // 50% chance to react
  minMessagesBeforeInterrupt: 2,        // Wait 2 messages before interrupting
  enableCrossCharacterAwareness: true,  // Characters aware of each other
};
```

---

### RESPONSE_TIMING
**Location:** `src/config/llmConfig.ts`

```typescript
export const RESPONSE_TIMING: ResponseTimingConfig = {
  minDelayMs: 500,                    // 0.5 seconds minimum
  maxDelayMs: 2000,                   // 2 seconds maximum
  typingIndicatorEnabled: true,       // Show typing indicator
};
```

---

### Tuning Guidelines

#### High Interaction (Lively Debate)
```typescript
{
  enabled: true,
  maxCharacters: 5,
  interruptionChance: 0.5,      // More interruptions
  reactionChance: 0.7,          // More reactions
  minMessagesBeforeInterrupt: 1, // Interrupt sooner
  enableCrossCharacterAwareness: true,
}
```

**Result:** Energetic, fast-paced conversation with frequent back-and-forth

---

#### Balanced (Default)
```typescript
{
  enabled: true,
  maxCharacters: 5,
  interruptionChance: 0.3,      // Moderate interruptions
  reactionChance: 0.5,          // Moderate reactions
  minMessagesBeforeInterrupt: 2, // Wait a bit
  enableCrossCharacterAwareness: true,
}
```

**Result:** Natural conversation flow with good balance

---

#### Low Interaction (Orderly Turns)
```typescript
{
  enabled: true,
  maxCharacters: 3,
  interruptionChance: 0.1,      // Rare interruptions
  reactionChance: 0.3,          // Fewer reactions
  minMessagesBeforeInterrupt: 3, // Wait longer
  enableCrossCharacterAwareness: true,
}
```

**Result:** More orderly, deliberate conversation with clear turns

---

#### Disabled (Single Character)
```typescript
{
  enabled: false,
  // ... other settings ignored
}
```

**Result:** Always uses `generateSingleCharacterResponse()`

---

## Usage Examples

### Example 1: Basic Multi-Character Response

```typescript
import { generateMultiCharacterResponses } from './services/multiCharacterConversation';

async function handleUserMessage(userMessage: string) {
  const selectedCharacters = ['freud', 'jung', 'adler'];
  const messageHistory = []; // Empty for first message

  const responses = await generateMultiCharacterResponses(
    userMessage,
    selectedCharacters,
    messageHistory
  );

  responses.forEach(response => {
    console.log(`${response.characterId}: ${response.content}`);
    console.log(`Interruption: ${response.isInterruption}`);
    console.log(`Reaction: ${response.isReaction}`);
  });
}

handleUserMessage("I'm feeling anxious");
```

---

### Example 2: Maintaining Conversation History

```typescript
import {
  generateMultiCharacterResponses,
  ConversationMessage
} from './services/multiCharacterConversation';

let conversationHistory: ConversationMessage[] = [];

async function continueConversation(userMessage: string) {
  // Add user message to history
  conversationHistory.push({
    id: `msg-${Date.now()}`,
    role: 'user',
    content: userMessage,
    timestamp: Date.now()
  });

  // Generate responses
  const responses = await generateMultiCharacterResponses(
    userMessage,
    ['freud', 'jung'],
    conversationHistory
  );

  // Add assistant responses to history
  responses.forEach(response => {
    conversationHistory.push({
      id: `msg-${Date.now()}-${response.characterId}`,
      role: 'assistant',
      content: response.content,
      characterId: response.characterId,
      timestamp: Date.now()
    });
  });

  return responses;
}
```

---

### Example 3: Single vs Multi Character

```typescript
import {
  generateSingleCharacterResponse,
  generateMultiCharacterResponses,
  isMultiCharacterEnabled
} from './services/multiCharacterConversation';

async function handleMessage(
  userMessage: string,
  selectedCharacters: string[],
  messageHistory: ConversationMessage[]
) {
  if (selectedCharacters.length === 1 || !isMultiCharacterEnabled()) {
    // Single character mode
    const response = await generateSingleCharacterResponse(
      userMessage,
      selectedCharacters[0],
      messageHistory
    );

    return [{
      characterId: selectedCharacters[0],
      content: response,
      isInterruption: false,
      isReaction: false
    }];
  } else {
    // Multi-character mode
    return await generateMultiCharacterResponses(
      userMessage,
      selectedCharacters,
      messageHistory
    );
  }
}
```

---

### Example 4: With UI Updates

```typescript
import {
  generateMultiCharacterResponses,
  ConversationMessage,
  CharacterResponse
} from './services/multiCharacterConversation';

async function handleUserMessageWithUI(userMessage: string) {
  try {
    // Show loading indicator
    setIsLoading(true);

    // Generate responses
    const responses = await generateMultiCharacterResponses(
      userMessage,
      selectedCharacters,
      conversationHistory
    );

    // Display each response
    responses.forEach((response, index) => {
      // Add delay for visual effect (responses already have internal delays)
      setTimeout(() => {
        addMessageToUI({
          character: getCharacter(response.characterId),
          content: response.content,
          isInterruption: response.isInterruption,
          isReaction: response.isReaction
        });
      }, index * 100); // Small additional UI delay
    });

  } catch (error) {
    console.error('Error:', error);
    showErrorMessage('Failed to generate responses');
  } finally {
    setIsLoading(false);
  }
}
```

---

### Example 5: Checking Response Metadata

```typescript
import {
  generateMultiCharacterResponses,
  CharacterResponse
} from './services/multiCharacterConversation';

async function analyzeConversation(userMessage: string) {
  const responses = await generateMultiCharacterResponses(
    userMessage,
    ['freud', 'jung', 'adler'],
    messageHistory
  );

  // Analyze response types
  const stats = {
    totalResponses: responses.length,
    interruptions: responses.filter(r => r.isInterruption).length,
    reactions: responses.filter(r => r.isReaction).length,
    characters: responses.map(r => r.characterId)
  };

  console.log('Conversation Stats:', stats);

  // Display with appropriate UI indicators
  responses.forEach(response => {
    const indicator = response.isInterruption ? '💬' : '💭';
    console.log(`${indicator} ${response.characterId}: ${response.content}`);
  });
}
```

---

### Example 6: Error Handling

```typescript
import {
  generateMultiCharacterResponses,
  generateSingleCharacterResponse
} from './services/multiCharacterConversation';

async function robustMessageHandler(userMessage: string) {
  try {
    // Try multi-character first
    const responses = await generateMultiCharacterResponses(
      userMessage,
      selectedCharacters,
      messageHistory
    );

    if (responses.length === 0) {
      // Fallback: All characters failed, try single character
      console.warn('All characters failed, falling back to single');

      const fallbackResponse = await generateSingleCharacterResponse(
        userMessage,
        selectedCharacters[0],
        messageHistory
      );

      return [{
        characterId: selectedCharacters[0],
        content: fallbackResponse,
        isInterruption: false,
        isReaction: false
      }];
    }

    return responses;

  } catch (error) {
    console.error('Complete failure:', error);

    // Last resort: Return helpful error message
    return [{
      characterId: selectedCharacters[0],
      content: "I apologize, but I'm having trouble responding right now. Please try again.",
      isInterruption: false,
      isReaction: false
    }];
  }
}
```

---

## Advanced Scenarios

### Scenario 1: Dynamic Character Addition/Removal

```typescript
// User adds a character mid-conversation
async function addCharacterToConversation(newCharacterId: string) {
  selectedCharacters.push(newCharacterId);

  // Announce new character
  const announcement: ConversationMessage = {
    id: `msg-${Date.now()}`,
    role: 'assistant',
    content: `[${getCharacter(newCharacterId).name} has joined the conversation]`,
    characterId: newCharacterId,
    timestamp: Date.now()
  };

  conversationHistory.push(announcement);

  // New character will participate in next response
}

// User removes a character
function removeCharacterFromConversation(characterId: string) {
  selectedCharacters = selectedCharacters.filter(id => id !== characterId);

  // Note: Their previous messages remain in history
}
```

---

### Scenario 2: Forced Character Response

```typescript
// Force a specific character to respond (regardless of probability)
async function forceCharacterResponse(
  characterId: string,
  userMessage: string
) {
  // Temporarily set high probabilities
  const originalConfig = { ...MULTI_CHARACTER_CONFIG };

  MULTI_CHARACTER_CONFIG.interruptionChance = 1.0;
  MULTI_CHARACTER_CONFIG.reactionChance = 1.0;

  // Use single character response to guarantee
  const response = await generateSingleCharacterResponse(
    userMessage,
    characterId,
    conversationHistory
  );

  // Restore original config
  Object.assign(MULTI_CHARACTER_CONFIG, originalConfig);

  return response;
}
```

---

### Scenario 3: Throttling Responses

```typescript
// Limit responses per user message
async function generateThrottledResponses(
  userMessage: string,
  maxResponses: number = 2
) {
  const responses = await generateMultiCharacterResponses(
    userMessage,
    selectedCharacters,
    conversationHistory
  );

  // Limit to maxResponses
  return responses.slice(0, maxResponses);
}
```

---

### Scenario 4: Conversation Analysis

```typescript
// Analyze conversation balance
function analyzeConversationBalance(
  history: ConversationMessage[]
): Record<string, number> {
  const characterCounts: Record<string, number> = {};

  history
    .filter(m => m.role === 'assistant' && m.characterId)
    .forEach(m => {
      characterCounts[m.characterId!] = (characterCounts[m.characterId!] || 0) + 1;
    });

  return characterCounts;
}

// Use analysis to adjust probabilities
function adjustProbabilitiesBasedOnBalance(
  balance: Record<string, number>
) {
  const max = Math.max(...Object.values(balance));

  // Reduce probability for over-participating characters
  // (This is conceptual - actual implementation would need custom logic)
}
```

---

### Scenario 5: Context Window Management

```typescript
// Trim old messages to keep context manageable
function trimConversationHistory(
  history: ConversationMessage[],
  maxMessages: number = 20
): ConversationMessage[] {
  if (history.length <= maxMessages) {
    return history;
  }

  // Keep most recent messages
  return history.slice(-maxMessages);
}

// Use before generating responses
async function generateWithTrimmedHistory(userMessage: string) {
  const trimmedHistory = trimConversationHistory(conversationHistory, 20);

  return await generateMultiCharacterResponses(
    userMessage,
    selectedCharacters,
    trimmedHistory
  );
}
```

---

## Troubleshooting

### Issue: Same character always responds

**Cause:** Random probabilities consistently favor one character

**Solution 1: Adjust probabilities**
```typescript
MULTI_CHARACTER_CONFIG.reactionChance = 0.7;  // Increase
MULTI_CHARACTER_CONFIG.interruptionChance = 0.5;  // Increase
```

**Solution 2: Check conversation domination logic**
```typescript
// Verify this is working correctly
if (charId === lastSpeaker && selectedCharacters.length > 1) {
  if (Math.random() < 0.2) {  // Only 20% chance to continue
    respondingCharacters.push(charId);
  }
  continue;
}
```

---

### Issue: No characters responding

**Cause:** All probability checks failed and fallback not working

**Debug:**
```typescript
const respondingCharacters = determineRespondingCharacters(
  selectedCharacters,
  messageHistory,
  lastSpeaker
);

console.log('Responding characters:', respondingCharacters);

if (respondingCharacters.length === 0) {
  console.error('ERROR: No characters selected!');
}
```

**Solution:** This should never happen due to fallback logic. If it does, check:
- `MULTI_CHARACTER_CONFIG.enabled` is true
- `selectedCharacters` array is not empty
- Message history format is correct

---

### Issue: Characters not referencing each other

**Cause:** Cross-character awareness disabled or not working

**Check Configuration:**
```typescript
console.log('Cross-char awareness:',
  MULTI_CHARACTER_CONFIG.enableCrossCharacterAwareness
);
```

**Check Context:**
```typescript
// Add logging to buildCharacterContext
function buildCharacterContext(charId, selectedChars, history) {
  const basePrompt = getCharacterPrompt(getCharacter(charId));

  if (!MULTI_CHARACTER_CONFIG.enableCrossCharacterAwareness) {
    console.log('[Context] Cross-char awareness disabled');
    return basePrompt;
  }

  const context = basePrompt + multiCharacterContext;
  console.log('[Context] Full prompt:', context);
  return context;
}
```

---

### Issue: Responses too slow

**Cause:** Staggered delays too long

**Solution: Reduce timing**
```typescript
RESPONSE_TIMING.minDelayMs = 200;   // Reduce from 500
RESPONSE_TIMING.maxDelayMs = 1000;  // Reduce from 2000
```

---

### Issue: Too many characters responding

**Cause:** High probability settings

**Solution 1: Lower probabilities**
```typescript
MULTI_CHARACTER_CONFIG.interruptionChance = 0.2;  // Lower
MULTI_CHARACTER_CONFIG.reactionChance = 0.3;      // Lower
```

**Solution 2: Check limit**
```typescript
// Ensure this is working
return respondingCharacters.slice(0, 3);  // Max 3
```

---

### Issue: Characters don't interrupt

**Cause:** Not enough messages or low probability

**Solution:**
```typescript
MULTI_CHARACTER_CONFIG.minMessagesBeforeInterrupt = 1;  // Lower threshold
MULTI_CHARACTER_CONFIG.interruptionChance = 0.5;        // Increase
```

**Verify Message Count:**
```typescript
const assistantCount = messageHistory.filter(m => m.role === 'assistant').length;
console.log('Assistant messages:', assistantCount);
console.log('Min required:', MULTI_CHARACTER_CONFIG.minMessagesBeforeInterrupt);
```

---

### Issue: Context not updating between characters

**Cause:** Message history not being updated in loop

**Verify:**
```typescript
// In generateMultiCharacterResponses loop
for (let i = 0; i < respondingCharacters.length; i++) {
  const response = await generateAIResponse(...);

  // THIS IS CRITICAL - must update history
  messageHistory.push({
    id: `temp-${Date.now()}-${charId}`,
    role: 'assistant',
    content: response,
    characterId: charId,
    timestamp: Date.now(),
  });

  console.log('Updated history, length:', messageHistory.length);
}
```

---

### Issue: Error in one character blocks others

**This should not happen** - error handling allows continuation

**Verify Error Handling:**
```typescript
try {
  const content = await generateAIResponse(...);
  responses.push(...);
} catch (error) {
  console.error(`Error for ${charId}:`, error);
  // Should continue to next character
}
```

If errors are blocking, check that you have the try-catch in place.

---

## Performance Considerations

### Timing Breakdown

**Single Character:**
- Response generation: 1-3 seconds
- No delays
- Total: ~1-3 seconds

**Multi-Character (3 characters):**
- Character 1: ~1-3 seconds (no delay)
- Character 2: ~1-3 seconds + 500-2000ms delay
- Character 3: ~1-3 seconds + 500-2000ms delay
- Total: ~4-10 seconds

---

### Optimization Strategies

#### 1. Reduce Staggered Delays
```typescript
RESPONSE_TIMING.minDelayMs = 300;   // Faster
RESPONSE_TIMING.maxDelayMs = 800;   // Faster
```

#### 2. Limit Responding Characters
```typescript
// In determineRespondingCharacters()
return respondingCharacters.slice(0, 2);  // Max 2 instead of 3
```

#### 3. Trim Conversation History
```typescript
// Keep only recent messages
const recentHistory = messageHistory.slice(-10);
```

#### 4. Use Faster Models
```typescript
// In llmConfig.ts
CHARACTER_PARAMETER_OVERRIDES: {
  freud: {
    model: 'claude-3-haiku-20240307',  // Faster than Sonnet
  }
}
```

---

## Testing

### Unit Tests

```typescript
describe('determineRespondingCharacters', () => {
  it('returns single character for first message', () => {
    const chars = ['freud', 'jung', 'adler'];
    const result = determineRespondingCharacters(chars, [], undefined);
    expect(result).toHaveLength(1);
    expect(chars).toContain(result[0]);
  });

  it('prevents same character twice in a row', () => {
    const chars = ['freud', 'jung', 'adler'];
    const history = [
      { id: '1', role: 'assistant', characterId: 'freud', content: 'test', timestamp: 0 }
    ];

    // Run multiple times due to randomness
    const results = [];
    for (let i = 0; i < 10; i++) {
      const result = determineRespondingCharacters(chars, history, 'freud');
      results.push(result);
    }

    // Freud should appear less frequently
    const freudCount = results.flat().filter(c => c === 'freud').length;
    expect(freudCount).toBeLessThan(results.flat().length / 2);
  });

  it('limits to max 3 characters', () => {
    const chars = ['a', 'b', 'c', 'd', 'e'];
    const result = determineRespondingCharacters(chars, mockHistory, 'a');
    expect(result.length).toBeLessThanOrEqual(3);
  });
});
```

---

### Integration Tests

```typescript
describe('generateMultiCharacterResponses', () => {
  it('generates responses from multiple characters', async () => {
    const responses = await generateMultiCharacterResponses(
      'Hello',
      ['freud', 'jung'],
      []
    );

    expect(responses.length).toBeGreaterThan(0);
    expect(responses[0]).toHaveProperty('characterId');
    expect(responses[0]).toHaveProperty('content');
  });

  it('maintains conversation history', async () => {
    const history = [];

    await generateMultiCharacterResponses('Message 1', ['freud', 'jung'], history);
    const historyLength1 = history.length;

    await generateMultiCharacterResponses('Message 2', ['freud', 'jung'], history);
    const historyLength2 = history.length;

    expect(historyLength2).toBeGreaterThan(historyLength1);
  });
});
```

---

## Related Documentation

- **[AI Service Guide](AI_SERVICE_GUIDE.md)** - Complete aiService.ts documentation
- **[AI Generation Layer](AI_GENERATION_LAYER.md)** - Overall AI architecture
- **[Configuration Guide](CONFIGURATION_GUIDE.md)** - LLM parameters and settings
- **[Conversation Flow](CONVERSATION_FLOW.md)** - Message flow architecture

---

## Summary

### Key Functions

| Function | Purpose | Returns |
|----------|---------|---------|
| `determineRespondingCharacters()` | Select which characters respond | `string[]` |
| `buildCharacterContext()` | Build prompt with cross-char awareness | `string` |
| `generateMultiCharacterResponses()` | Generate responses from multiple chars | `CharacterResponse[]` |
| `generateSingleCharacterResponse()` | Generate single response (backward compat) | `string` |
| `isMultiCharacterEnabled()` | Check if multi-char mode enabled | `boolean` |
| `getMaxCharacters()` | Get max character limit | `number` |

---

### Key Features

✅ **Intelligent Selection** - Probability-based character selection
✅ **Cross-Character Awareness** - Characters reference each other
✅ **Natural Timing** - Staggered delays for realistic pacing
✅ **Conversation Balance** - Prevents domination
✅ **Error Resilience** - Individual failures don't block others
✅ **Sequential Context** - Each character sees previous responses

---

**File:** `src/services/multiCharacterConversation.ts`
**Last Updated:** 2025-11-29
**Version:** 1.0
**Status:** Production Ready
