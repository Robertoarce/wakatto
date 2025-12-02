/**
 * Single-Call Multi-Character Orchestration
 *
 * Alternative approach: Generate ALL character responses in a single LLM call.
 * The LLM orchestrates the entire conversation including interruptions, gestures,
 * and character interactions.
 *
 * BENEFITS:
 * - Cost efficient (1 API call instead of 2-3)
 * - Faster (no sequential delays)
 * - Better coordination (LLM plans entire conversation)
 * - Natural interruptions
 * - Coordinated gestures between characters
 *
 * TRADE-OFFS:
 * - Less distinct character voices (single context)
 * - More complex prompting
 * - All-or-nothing (if call fails, no responses)
 */

import { generateAIResponse } from './aiService';
import { getCharacter, getCharacterPrompt } from '../config/characters';
import { formatGesturesForPrompt } from '../config/characterGestures';
import { ConversationMessage, CharacterResponse } from './multiCharacterConversation';

export interface OrchestrationConfig {
  maxResponders: number; // Max characters that can respond
  includeGestures: boolean; // Include gesture system
  includeInterruptions: boolean; // Allow interruptions
  verbosity: 'brief' | 'balanced' | 'detailed'; // Response length
}

const DEFAULT_CONFIG: OrchestrationConfig = {
  maxResponders: 3,
  includeGestures: true,
  includeInterruptions: true,
  verbosity: 'balanced'
};

interface OrchestrationResponse {
  character: string;
  content: string;
  gesture?: string;
  interrupts: boolean;
  reactsTo?: string;
  timing: 'immediate' | 'delayed';
}

interface OrchestrationResult {
  responses: OrchestrationResponse[];
  conversationFlow: string; // Explanation of who speaks when
}

/**
 * Generate multi-character responses in a single LLM call
 */
export async function generateSingleCallOrchestration(
  userMessage: string,
  selectedCharacters: string[],
  messageHistory: ConversationMessage[],
  config: Partial<OrchestrationConfig> = {}
): Promise<CharacterResponse[]> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Set available characters for parsing (to resolve names to IDs)
  setAvailableCharactersForParsing(selectedCharacters);

  // Build the orchestration prompt
  const orchestrationPrompt = buildOrchestrationPrompt(
    selectedCharacters,
    messageHistory,
    finalConfig
  );

  // Format message history for context
  const conversationMessages = formatConversationHistory(messageHistory);

  // Add user's current message
  conversationMessages.push({
    role: 'user',
    content: userMessage
  });

  console.log('[SingleCall] Generating orchestrated response for', selectedCharacters.length, 'characters');

  try {
    // Single API call generates ALL responses
    const rawResponse = await generateAIResponse(
      conversationMessages,
      orchestrationPrompt,
      'orchestrator' // Special ID for orchestration
    );

    console.log('[SingleCall] Raw response:', rawResponse);

    // Parse the structured response
    const orchestrationResult = parseOrchestrationResponse(rawResponse);

    // Convert to standard CharacterResponse format
    const characterResponses: CharacterResponse[] = orchestrationResult.responses.map(resp => ({
      characterId: resp.character,
      content: resp.content,
      gesture: resp.gesture,
      isInterruption: resp.interrupts,
      isReaction: !!resp.reactsTo,
      timing: resp.timing
    }));

    console.log('[SingleCall] Generated', characterResponses.length, 'responses');

    return characterResponses;

  } catch (error) {
    console.error('[SingleCall] Orchestration failed:', error);
    throw new Error(`Failed to generate orchestrated responses: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Build the orchestration system prompt
 */
function buildOrchestrationPrompt(
  selectedCharacters: string[],
  messageHistory: ConversationMessage[],
  config: OrchestrationConfig
): string {
  // Get character profiles
  const characterProfiles = selectedCharacters.map(charId => {
    const character = getCharacter(charId);
    const basePrompt = getCharacterPrompt(character);
    return `
### ${character.name} (ID: ${charId})
${character.description}

Therapeutic Approach:
${basePrompt}
`;
  }).join('\n');

  // Build gesture section
  const gestureSection = config.includeGestures ? `
## Available Gestures

Characters can use these physical/verbal gestures to add non-verbal communication:

${formatGesturesForPrompt()}

Include ONE gesture per response using the gesture ID (e.g., "thinking_hand_on_chin").
` : '';

  // Build character change notification
  const characterChangeNote = buildCharacterChangeNotification(messageHistory, selectedCharacters);

  const verbosityGuide = {
    brief: '1-2 sentences per response',
    balanced: '2-4 sentences per response',
    detailed: '3-5 sentences per response'
  }[config.verbosity];

  // Main orchestration prompt
  return `# Multi-Character Conversation Orchestrator

You are orchestrating a casual, friendly conversation between multiple AI characters and a user.

## Characters in This Conversation

${characterProfiles}

${characterChangeNote}

## Your Task

Generate responses for the characters in this conversation. Consider:

1. **Character Voice**: Each character should maintain their unique perspective but keep it CASUAL and conversational
2. **Casual Tone**: 
   - Talk like friends chatting, not like therapists in a session.
   - Use contractions (I'm, you're, that's, etc.)
   - Be warm, relaxed, joyful and natural
   - It's okay to use casual expressions and light humor
   - Avoid overly formal or clinical language
3. **Natural Dialogue**: Characters can:
   - Build on each other's points
   - Respectfully disagree
   - Ask each other questions
   - React to what others say
   - Joke around or be playful when appropriate
${config.includeInterruptions ? '   - Interrupt when they feel strongly (mark as interruption)' : ''}

4. **Response Length**: ${verbosityGuide} - Keep it snappy and conversational!

5. **User Focus**: Keep the user's needs at the center while being friendly and approachable

6. **Selective Responses**: NOT all characters need to respond to every message:
   - If the user explicitly addresses a specific character by name, ONLY that character should respond
   - Other characters should stay silent UNLESS they strongly disagree, want to add something important, or the addressed character invites them
   - When the user speaks generally, 1-3 characters may respond based on relevance to their expertise
   - Characters should not feel obligated to speak if they have nothing meaningful to add

${gestureSection}

## Response Format

Respond with VALID JSON only (no markdown code blocks):

{
  "responses": [
    {
      "character": "THE_CHARACTER_ID_NOT_NAME",
      "content": "Just the response text - NO character name prefix!",
      ${config.includeGestures ? '"gesture": "gesture_id",' : ''}
      "interrupts": false,
      "reactsTo": null,
      "timing": "immediate"
    }
  ]
}

**CRITICAL FORMAT RULES:**
- "character" field must be the CHARACTER ID (like "marie_curie" or "sigmund_freud"), NOT the display name
- "content" field should contain ONLY the response text - do NOT include character names like "[Marie Curie]:" at the start
- Each response is from ONE character only - do not combine multiple characters in one response

**Rules:**
- Include ${Math.min(config.maxResponders, selectedCharacters.length)} characters maximum, but fewer is often better
- If user addresses a specific character, include ONLY that character (unless others interrupt)
- First response: "timing": "immediate", "interrupts": false
- Subsequent responses: "timing": "delayed", may have "interrupts": true
- Use "reactsTo": "character_id" when building on another's point
- Maintain distinct voices for each character
- Keep responses SHORT, casual, and friendly - like texting a friend!
- Return an empty "responses" array [] if no character has something meaningful to add
${config.includeGestures ? '- Choose gestures that match the character\'s emotional state and message' : ''}

Generate the orchestrated conversation now.`;
}

/**
 * Build notification about character changes in conversation
 */
function buildCharacterChangeNotification(
  messageHistory: ConversationMessage[],
  currentCharacters: string[]
): string {
  // Check if characters have changed during conversation
  const historicalCharacters = new Set(
    messageHistory
      .filter(m => m.role === 'assistant' && m.characterId)
      .map(m => m.characterId!)
  );

  const addedCharacters = currentCharacters.filter(id => !historicalCharacters.has(id));
  const removedCharacters = Array.from(historicalCharacters).filter(id => !currentCharacters.includes(id));

  if (addedCharacters.length === 0 && removedCharacters.length === 0) {
    return ''; // No changes
  }

  let notification = '## Character Changes\n\n';

  if (addedCharacters.length > 0) {
    const names = addedCharacters.map(id => getCharacter(id).name).join(', ');
    notification += `**New participants:** ${names} has joined the conversation.\n`;
  }

  if (removedCharacters.length > 0) {
    const names = removedCharacters.map(id => getCharacter(id).name).join(', ');
    notification += `**Note:** ${names} is no longer participating (do not generate responses for them).\n`;
  }

  return notification;
}

/**
 * Format conversation history for LLM
 */
function formatConversationHistory(
  messageHistory: ConversationMessage[]
): Array<{ role: 'user' | 'assistant' | 'system'; content: string }> {
  return messageHistory.map(m => ({
    role: m.role as 'user' | 'assistant' | 'system',
    content: m.role === 'assistant' && m.characterId
      ? `[${getCharacter(m.characterId).name}]: ${m.content}`
      : m.content,
  }));
}

/**
 * Clean content by removing character name prefixes
 */
function cleanResponseContent(content: string): string {
  // Remove patterns like "[Character Name]: " or "[Character Name]: *action*"
  let cleaned = content.replace(/^\[[\w\s]+\]:\s*/i, '');
  // Also remove patterns like "Character Name: " at the start
  cleaned = cleaned.replace(/^[\w\s]+:\s*(?=\*|[A-Z])/i, '');
  return cleaned.trim();
}

/**
 * Try to resolve character name to ID
 */
function resolveCharacterId(characterRef: string, availableCharacters: string[]): string {
  // If it's already a valid ID, return it
  if (availableCharacters.includes(characterRef)) {
    return characterRef;
  }
  
  // Try to find by name (case-insensitive)
  const lowerRef = characterRef.toLowerCase().replace(/\s+/g, '_');
  
  for (const charId of availableCharacters) {
    try {
      const character = getCharacter(charId);
      const charNameLower = character.name.toLowerCase().replace(/\s+/g, '_');
      
      // Match by name or partial ID
      if (charNameLower === lowerRef || 
          charId.toLowerCase().includes(lowerRef) ||
          lowerRef.includes(charId.toLowerCase())) {
        return charId;
      }
    } catch (e) {
      // Character not found, continue
    }
  }
  
  // Fallback: return first available character if no match
  console.warn(`[SingleCall] Could not resolve character "${characterRef}", using first available`);
  return availableCharacters[0] || characterRef;
}

// Store available characters for resolution
let currentAvailableCharacters: string[] = [];

export function setAvailableCharactersForParsing(characters: string[]) {
  currentAvailableCharacters = characters;
}

/**
 * Parse the orchestration response
 */
function parseOrchestrationResponse(rawResponse: string): OrchestrationResult {
  try {
    // Clean response (remove markdown code blocks if present)
    let cleaned = rawResponse.trim();

    // Remove markdown JSON code blocks
    cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*/g, '');

    // Try to extract JSON if wrapped in other text
    const jsonMatch = cleaned.match(/\{[\s\S]*"responses"[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }

    const parsed = JSON.parse(cleaned);

    // Validate structure
    if (!parsed.responses || !Array.isArray(parsed.responses)) {
      throw new Error('Invalid response structure: missing responses array');
    }

    // Process and clean each response
    const cleanedResponses = parsed.responses.map((resp: any, idx: number) => {
      if (!resp.character || !resp.content) {
        throw new Error(`Invalid response at index ${idx}: missing character or content`);
      }
      
      return {
        ...resp,
        // Resolve character name to ID if needed
        character: resolveCharacterId(resp.character, currentAvailableCharacters),
        // Clean content to remove character name prefixes
        content: cleanResponseContent(resp.content)
      };
    });

    return {
      responses: cleanedResponses,
      conversationFlow: parsed.conversationFlow || 'Generated in single call'
    };

  } catch (error) {
    console.error('[SingleCall] Failed to parse response:', rawResponse);
    throw new Error(`Failed to parse orchestration response: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Check if single-call orchestration is available
 */
export function isSingleCallOrchestrationSupported(): boolean {
  // Always supported with modern LLMs
  return true;
}

/**
 * Estimate cost comparison
 */
export function estimateCostComparison(
  numCharacters: number,
  avgResponsesPerCall: number = 2
): { singleCall: number; multiCall: number; savings: number } {
  // Rough estimate (actual costs vary by model and token count)
  const baseCost = 1.0; // Arbitrary unit

  const singleCall = baseCost * 1.2; // Slightly more tokens in prompt
  const multiCall = baseCost * avgResponsesPerCall; // Multiple API calls

  return {
    singleCall,
    multiCall,
    savings: ((multiCall - singleCall) / multiCall) * 100 // Percentage saved
  };
}
