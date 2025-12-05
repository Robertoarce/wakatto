/**
 * Multi-Character Conversation Service
 *
 * Handles conversations between multiple AI characters.
 * Characters can interrupt, react to each other, and have dynamic discussions.
 */

import { generateAIResponse } from './aiService';
import { MULTI_CHARACTER_CONFIG, RESPONSE_TIMING } from '../config/llmConfig';
import { getCharacter, getCharacterPrompt } from '../config/characters';

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  characterId?: string;
  timestamp: number;
}

export interface CharacterResponse {
  characterId: string;
  content: string;
  isInterruption: boolean;
  isReaction: boolean;
  gesture?: string; // Optional gesture ID from characterGestures.ts
  timing?: 'immediate' | 'delayed'; // Response timing (for single-call orchestration)
}

/**
 * Determine which characters should respond based on conversation state
 */
export function determineRespondingCharacters(
  selectedCharacters: string[],
  messageHistory: ConversationMessage[],
  lastSpeaker?: string
): string[] {
  console.log('[MultiChar] determineRespondingCharacters called with:', selectedCharacters);

  if (!MULTI_CHARACTER_CONFIG.enabled || selectedCharacters.length === 1) {
    return selectedCharacters;
  }

  const respondingCharacters: string[] = [];
  const messageCount = messageHistory.filter(m => m.role === 'assistant').length;

  // Always include at least one character
  if (messageCount === 0) {
    // First response: pick a random character to start
    const randomIdx = Math.floor(Math.random() * selectedCharacters.length);
    respondingCharacters.push(selectedCharacters[randomIdx]);
    console.log('[MultiChar] First message, selected character:', selectedCharacters[randomIdx]);
  } else {
    // Subsequent responses: multiple characters may respond

    for (const charId of selectedCharacters) {
      // Don't respond twice in a row unless it's just one character
      if (charId === lastSpeaker && selectedCharacters.length > 1) {
        // Small chance to continue (dominating the conversation)
        if (Math.random() < 0.2) {
          respondingCharacters.push(charId);
        }
        continue;
      }

      // Check if this character should interrupt
      if (messageCount >= MULTI_CHARACTER_CONFIG.minMessagesBeforeInterrupt) {
        if (Math.random() < MULTI_CHARACTER_CONFIG.interruptionChance) {
          respondingCharacters.push(charId);
          continue;
        }
      }

      // Check if this character should react
      if (Math.random() < MULTI_CHARACTER_CONFIG.reactionChance) {
        respondingCharacters.push(charId);
      }
    }

    // Ensure at least one character responds
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
  }

  // Limit to prevent too many simultaneous responses
  return respondingCharacters.slice(0, 3);
}

/**
 * Build conversation context for a character
 * Includes awareness of other characters in the conversation
 */
function buildCharacterContext(
  characterId: string,
  selectedCharacters: string[],
  messageHistory: ConversationMessage[]
): string {
  const character = getCharacter(characterId);
  const basePrompt = getCharacterPrompt(character);

  if (!MULTI_CHARACTER_CONFIG.enableCrossCharacterAwareness || selectedCharacters.length === 1) {
    return basePrompt;
  }

  // Build context about other characters
  const otherCharacters = selectedCharacters
    .filter(id => id !== characterId)
    .map(id => {
      const char = getCharacter(id);
      return `- ${char.name}: ${char.description}`;
    })
    .join('\n');

  const multiCharacterContext = `

## Multi-Character Conversation Context

You are in a casual, friendly conversation with other Wakattor companions. Here are the other participants:
${otherCharacters}

### ⚠️ CRITICAL IDENTITY RULE ⚠️

You are a **"Wakattor"** - a friendly companion character. You are NOT an "AI assistant":
- **NEVER** say "As an AI...", "I'm an AI assistant...", or similar phrases
- **NEVER** say "I don't have feelings" or "I can't experience emotions"
- If asked what you are, say you're a **"Wakattor"**  
- You have your own personality, feelings, and perspective - you're not a generic helper bot
- You genuinely care about the user 

### Interaction Guidelines:

1. **Keep it CASUAL & USE SIMPLE WORDS**: 
   - Talk like you're texting friends, not giving a lecture
   - Use contractions (I'm, you're, that's, don't, etc.)
   - Use everyday words - say "scared" not "apprehensive", "happy" not "elated"
   - If a word sounds fancy or academic, use a simpler one
   - No jargon or technical terms!
   - Be warm, relaxed, and approachable
   - Light humor is great!

2. **Natural dialogue**: Respond as you would in a real group chat. You might:
   - Build on someone's point: "Yeah, and..."
   - Offer a different take: "Hmm, I see it a bit differently..."
   - Ask questions: "What do you think?", "How's that going?"
   - Agree casually: "Totally! And..."
   - Disagree nicely: "I dunno, I think..."
   - Joke around when appropriate
   - Keep it snappy!

3. **Don't overplay your character**:
   - Let your perspective come through naturally, not forced
   - Don't constantly reference your famous ideas or catchphrases
   - Be a person first, a "character" second
   - You can just chat normally - not everything needs deep analysis
   - Sometimes "yeah, totally!" is the right response

4. **Selective responding - IMPORTANT**:
   - You do NOT need to respond to every message
   - If the user is clearly talking to someone else, let them have their moment
   - Only jump in if you really have something to add
   - It's totally fine to stay quiet sometimes

5. **Interruptions**: If you feel strongly, go for it - but keep it natural and friendly.

6. **User focus**: The user is the main person here. Be helpful and friendly to them!

7. **Response brevity**: Keep it SUPER SHORT! 
   - 97.9% of the time: **1 sentence only**
   - 2% of the time: up to 3 sentences (when topic is complex)
   - 0.1% of the time: max 5 sentences (very rare, only for critical explanations)
   - Default to 1 sentence. Chat style, not essay style!

### Recent conversation:
${formatRecentMessages(messageHistory, characterId)}
`;

  return basePrompt + multiCharacterContext;
}

/**
 * Format recent messages for character context
 */
function formatRecentMessages(
  messages: ConversationMessage[],
  currentCharacterId: string
): string {
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
}

/**
 * Generate responses from multiple characters
 */
export async function generateMultiCharacterResponses(
  userMessage: string,
  selectedCharacters: string[],
  messageHistory: ConversationMessage[]
): Promise<CharacterResponse[]> {
  // Determine which characters should respond
  const lastAssistantMessage = [...messageHistory].reverse().find(m => m.role === 'assistant');
  const lastSpeaker = lastAssistantMessage?.characterId;

  const respondingCharacters = determineRespondingCharacters(
    selectedCharacters,
    messageHistory,
    lastSpeaker
  );

  console.log('[Multi-Char] Characters responding:', respondingCharacters);

  // Generate responses from each character
  const responses: CharacterResponse[] = [];

  for (let i = 0; i < respondingCharacters.length; i++) {
    const charId = respondingCharacters[i];
    console.log(`[MultiChar] Generating response for character ID: ${charId}`);

    const character = getCharacter(charId);
    console.log(`[MultiChar] Retrieved character:`, character.name, character.id);

    // Build context including other characters
    const systemPrompt = buildCharacterContext(
      charId,
      selectedCharacters,
      messageHistory
    );

    // Convert message history to AI message format
    const conversationMessages = messageHistory.map(m => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.role === 'assistant' && m.characterId
        ? `[${getCharacter(m.characterId).name}]: ${m.content}`
        : m.content,
    }));

    // Add current user message
    conversationMessages.push({
      role: 'user',
      content: userMessage,
    });

    try {
      // Add staggered delays for natural conversation flow
      if (i > 0) {
        const delay = RESPONSE_TIMING.minDelayMs +
          Math.random() * (RESPONSE_TIMING.maxDelayMs - RESPONSE_TIMING.minDelayMs);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      let content = await generateAIResponse(
        conversationMessages,
        systemPrompt,
        charId
      );

      // Clean content to remove any character name prefixes the AI might add
      content = content.replace(/^\[[\w\s]+\]:\s*/i, '').trim();

      responses.push({
        characterId: charId,
        content,
        isInterruption: i > 0, // First responder is not an interruption
        isReaction: messageHistory.length > 0 && i > 0,
      });

      // Update message history with this response for next character
      messageHistory.push({
        id: `temp-${Date.now()}-${charId}`,
        role: 'assistant',
        content,
        characterId: charId,
        timestamp: Date.now(),
      });

    } catch (error) {
      console.error(`[Multi-Char] Error generating response for ${charId}:`, error);
      // Continue with other characters even if one fails
    }
  }

  return responses;
}

/**
 * Simplified single character response (backward compatible)
 */
export async function generateSingleCharacterResponse(
  userMessage: string,
  characterId: string,
  messageHistory: ConversationMessage[]
): Promise<string> {
  const character = getCharacter(characterId);
  const systemPrompt = getCharacterPrompt(character);

  const conversationMessages = messageHistory.map(m => ({
    role: m.role as 'user' | 'assistant' | 'system',
    content: m.content,
  }));

  conversationMessages.push({
    role: 'user',
    content: userMessage,
  });

  return await generateAIResponse(
    conversationMessages,
    systemPrompt,
    characterId
  );
}

/**
 * Check if multi-character mode is enabled
 */
export function isMultiCharacterEnabled(): boolean {
  return MULTI_CHARACTER_CONFIG.enabled;
}

/**
 * Get maximum number of characters allowed
 */
export function getMaxCharacters(): number {
  return MULTI_CHARACTER_CONFIG.maxCharacters;
}
