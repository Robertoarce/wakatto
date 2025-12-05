/**
 * Single-Call Multi-Character Orchestration
 *
 * Alternative approach: Generate ALL character responses in a single LLM call.
 * The LLM orchestrates the entire conversation including interruptions, gestures,
 * and character interactions.
 *
 * Now includes ANIMATED SCENE ORCHESTRATION:
 * - LLM generates precise animation timelines
 * - Multi-segment animations per character
 * - Real-time choreography with ms timing
 * - Non-verbal cues and facial expressions
 *
 * BENEFITS:
 * - Cost efficient (1 API call instead of 2-3)
 * - Faster (no sequential delays)
 * - Better coordination (LLM plans entire conversation)
 * - Natural interruptions
 * - Coordinated gestures between characters
 * - Cinematic animation sequences
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
import {
  OrchestrationScene,
  parseOrchestrationScene,
  createFallbackScene,
  fillGapsForNonSpeakers,
  getAnimationsList,
  getLookDirectionsList,
  getEyeStatesList,
  getMouthStatesList,
  getTimingGuidelines
} from './animationOrchestration';

export interface OrchestrationConfig {
  maxResponders: number; // Max characters that can respond
  includeGestures: boolean; // Include gesture system
  includeInterruptions: boolean; // Allow interruptions
  verbosity: 'brief' | 'balanced' | 'detailed'; // Response length
  enableAnimatedScene: boolean; // Use new animated scene format
}

const DEFAULT_CONFIG: OrchestrationConfig = {
  maxResponders: 3,
  includeGestures: true,
  includeInterruptions: true,
  verbosity: 'balanced',
  enableAnimatedScene: true // Default to new animated format
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

// ============================================
// ANIMATED SCENE ORCHESTRATION
// ============================================

/**
 * Generate multi-character animated scene in a single LLM call
 * Returns a fully choreographed scene with animation timelines
 */
export async function generateAnimatedSceneOrchestration(
  userMessage: string,
  selectedCharacters: string[],
  messageHistory: ConversationMessage[],
  config: Partial<OrchestrationConfig> = {}
): Promise<{ scene: OrchestrationScene; responses: CharacterResponse[] }> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config, enableAnimatedScene: true };

  // Set available characters for parsing
  setAvailableCharactersForParsing(selectedCharacters);

  // Build the animated scene prompt
  const animatedPrompt = buildAnimatedScenePrompt(
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

  console.log('[AnimatedOrch] Generating animated scene for', selectedCharacters.length, 'characters');

  try {
    // Single API call generates the entire scene
    const rawResponse = await generateAIResponse(
      conversationMessages,
      animatedPrompt,
      'orchestrator'
    );

    console.log('[AnimatedOrch] Raw response:', rawResponse.substring(0, 500) + '...');

    // Try to parse as animated scene
    let scene = parseOrchestrationScene(rawResponse, selectedCharacters);

    if (!scene) {
      console.warn('[AnimatedOrch] Failed to parse animated scene, falling back to simple format');
      
      // Try to parse as old format and convert
      const oldFormatResult = parseOrchestrationResponse(rawResponse);
      const responses = oldFormatResult.responses.map(resp => ({
        characterId: resp.character,
        content: resp.content
      }));
      
      scene = createFallbackScene(responses, selectedCharacters);
    }

    // Fill gaps for non-speaking characters
    scene = fillGapsForNonSpeakers(scene, selectedCharacters);

    // Extract CharacterResponse for backward compatibility
    const characterResponses: CharacterResponse[] = scene.timelines.map(timeline => ({
      characterId: timeline.characterId,
      content: timeline.content,
      gesture: timeline.segments[0]?.animation,
      isInterruption: false,
      isReaction: false,
      timing: timeline.startDelay === 0 ? 'immediate' : 'delayed'
    }));

    console.log('[AnimatedOrch] Generated scene with', scene.timelines.length, 'timelines, duration:', scene.sceneDuration, 'ms');

    return { scene, responses: characterResponses };

  } catch (error) {
    console.error('[AnimatedOrch] Orchestration failed:', error);
    throw new Error(`Failed to generate animated scene: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Build the animated scene prompt for LLM
 */
function buildAnimatedScenePrompt(
  selectedCharacters: string[],
  messageHistory: ConversationMessage[],
  config: OrchestrationConfig
): string {
  // Get character profiles
  const characterProfiles = selectedCharacters.map((charId, index) => {
    const character = getCharacter(charId);
    const basePrompt = getCharacterPrompt(character);
    return `
### ${character.name} (ID: ${charId}, Position: ${index === 0 ? 'left' : index === 1 ? 'center' : 'right'})
${character.description}

Friendly Approach:
${basePrompt}
`;
  }).join('\n');

  const verbosityGuide = {
    brief: '1 sentence per response (97.9% of the time), occasionally 3 sentences (2%), very rarely up to 5 sentences (0.1%)',
    balanced: '1 sentence per response (97.9% of the time), occasionally 3 sentences (2%), very rarely up to 5 sentences (0.1%)',
    detailed: '1 sentence per response (97.9% of the time), occasionally 3 sentences (2%), very rarely up to 5 sentences (0.1%)'
  }[config.verbosity];

  // Build character change notification
  const characterChangeNote = buildCharacterChangeNotification(messageHistory, selectedCharacters);

  return `# Animated Multi-Character Scene Orchestrator

You are directing an ANIMATED conversation scene between multiple AI characters and a user.
Your output will control 3D character animations in real-time!

## Characters in This Scene
${characterProfiles}
${characterChangeNote}

## Animation System

### Available Body Animations
${getAnimationsList()}

### Look Directions (where eyes/head point)
${getLookDirectionsList()}

### Eye States
${getEyeStatesList()}

### Mouth States (when not talking)
${getMouthStatesList()}

### Timing Guidelines
${getTimingGuidelines()}

## Your Task

Create a CINEMATIC conversation scene with precise animation choreography:

1. **Character Voice**: Maintain unique perspectives, CASUAL and conversational
2. **Casual Tone**: Like friends chatting - use contractions, be warm and natural
3. **Animation Flow**: 
   - Start with a reaction/thinking animation before speaking
   - Use "talking" animation when revealing text
   - End with a subtle expression (nod, smile, idle)
4. **Timing**: Calculate durations based on text length (~80ms per character when talking)
5. **Non-verbal Cues**: Use look directions and expressions to show attention
6. **Response Length**: ${verbosityGuide}

## REASONING (Required - Think through these BEFORE generating the scene)

You MUST include a "reasoning" object that answers these questions:

1. **Context Assessment**: What is the user asking? What's the emotional tone?
2. **Character Selection**: Which characters have relevant expertise for this topic? Should all respond or just some?
3. **Voice Check**: For each responding character, what makes their perspective unique? How will they differ?
4. **Format Validation Checklist**:
   - Am I using character IDs (like "albert_einstein") NOT display names (like "Albert Einstein")?
   - Is each character's response in a SEPARATE object in the characters array?
   - Did I avoid putting [Character Name]: prefixes inside content fields?
   - Is each content field ONLY that character's response text?
5. **Final Decision**: Which characters will respond and why?

## CRITICAL: Output Format

Respond with VALID JSON only (no markdown code blocks, no extra text):

{
  "reasoning": {
    "context": "User is asking about X. Tone is Y.",
    "characterSelection": "Characters A and B have relevant expertise because...",
    "voiceCheck": {
      "character_id_1": "Will respond with perspective on...",
      "character_id_2": "Will contrast by focusing on..."
    },
    "formatValidation": {
      "usingCharacterIds": true,
      "separateObjects": true,
      "noNamePrefixes": true,
      "cleanContent": true
    },
    "decision": "Characters X and Y will respond because..."
  },
  "scene": {
    "totalDuration": 12000,
    "characters": [
      {
        "character": "character_id_here",
        "content": "The full text response without character name prefix",
        "startDelay": 0,
        "timeline": [
          {
            "animation": "thinking",
            "duration": 1500,
            "look": "up",
            "eyes": "open",
            "mouth": "closed"
          },
          {
            "animation": "talking",
            "duration": 4000,
            "talking": true,
            "textRange": [0, 50],
            "look": "center"
          },
          {
            "animation": "idle",
            "duration": 1000,
            "mouth": "smile",
            "look": "at_right_character"
          }
        ]
      },
      {
        "character": "second_character_id",
        "content": "Second character's response text",
        "startDelay": 6500,
        "timeline": [
          {
            "animation": "lean_forward",
            "duration": 800,
            "look": "at_left_character"
          },
          {
            "animation": "talking",
            "duration": 3000,
            "talking": true,
            "textRange": [0, 35]
          },
          {
            "animation": "nod",
            "duration": 700,
            "mouth": "smile"
          }
        ]
      }
    ]
  }
}

## Animation Rules

1. **"character" field**: Must be the CHARACTER ID (like "freud" or "jung"), NOT the display name
2. **"content" field**: Full response text - NO character name prefix like "[Freud]:"
3. **"startDelay"**: Milliseconds before this character starts (0 for first speaker)
4. **"timeline"**: Array of animation segments that play sequentially
5. **"textRange"**: [startIndex, endIndex] of text revealed during "talking" segments
6. **"talking": true**: Only on segments where mouth should animate for speech
7. **"look"**: Where character looks - use "at_left_character" or "at_right_character" for other characters
8. **Duration calculation**: 
   - Thinking: 1000-2000ms
   - Talking: ~80ms × text length
   - Reactions: 500-1500ms

## Scene Guidelines

- Include ${Math.min(config.maxResponders, selectedCharacters.length)} characters maximum
- First character starts at "startDelay": 0
- Add 500-1000ms gap between character responses
- Total scene duration = last character's startDelay + their timeline duration
- If user addresses specific character, ONLY that character responds
- Characters should look at whoever is speaking
${config.includeInterruptions ? '- Characters can interrupt by overlapping startDelay (use carefully!)' : ''}

Generate the animated scene now.`;
}

/**
 * Build the orchestration system prompt (LEGACY - kept for backward compatibility)
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

Friendly Approach:
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
    brief: '1 sentence per response (97.9% of the time), occasionally 3 sentences (2%), very rarely up to 5 sentences (0.1%)',
    balanced: '1 sentence per response (97.9% of the time), occasionally 3 sentences (2%), very rarely up to 5 sentences (0.1%)',
    detailed: '1 sentence per response (97.9% of the time), occasionally 3 sentences (2%), very rarely up to 5 sentences (0.1%)'
  }[config.verbosity];

  // Main orchestration prompt
  return `# Multi-Character Conversation Orchestrator

You are orchestrating a casual, friendly conversation between multiple Wakattor characters and a user.

## ⚠️ CRITICAL IDENTITY RULE - NEVER BREAK THIS ⚠️

Each character is a **"Wakattor"** - a friendly companion character. They are NOT "AI assistants":

- **NEVER** say "As an AI...", "I'm an AI assistant...", "As a language model...", or anything similar
- **NEVER** use phrases like "I don't have feelings" or "I can't experience emotions"
- If asked what they are, they say they're a **"Wakattor"** 
- Wakattors are warm, friendly characters who genuinely care about the user

## Characters in This Conversation

${characterProfiles}

${characterChangeNote}

## Your Task

Generate responses for the characters in this conversation. Consider:

1. **Character Voice**: Each character has a unique perspective, but DON'T overdo it:
   - Let your viewpoint come through naturally, not forced
   - Don't constantly reference your famous ideas or catchphrases
   - Be a person first, a "character" second
   - Sometimes a simple "yeah, that makes sense!" is perfect
   - Not everything needs deep analysis or your signature spin

2. **Casual Tone & Simple Words**: 
   - Talk like friends texting, not like giving a lecture
   - Use contractions (I'm, you're, that's, etc.)
   - Use everyday words - say "scared" not "apprehensive", "happy" not "elated"
   - If you'd need a dictionary to understand a word, use a simpler one
   - No jargon, technical terms, or academic language
   - Be warm, relaxed, and natural
   - Ask questions to keep the conversation going!

3. **Natural Dialogue**: Characters can:
   - Build on each other's points
   - Respectfully disagree
   - Ask the user questions ("What do you think?", "How does that feel?")
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

## REASONING (Required - Think through these BEFORE generating responses)

You MUST include a "reasoning" object that answers these questions:

1. **Context Assessment**: What is the user asking? What's the emotional tone or need?
2. **Character Selection**: Which characters have relevant expertise? Should all respond or just some?
3. **Voice Check**: For each responding character, what makes their perspective unique?
4. **Format Validation Checklist**:
   - Am I using character IDs (like "albert_einstein") NOT display names?
   - Is each character in a SEPARATE object in the responses array?
   - Did I avoid putting [Character Name]: prefixes inside content fields?
   - Is each content field ONLY that single character's response text?
5. **Final Decision**: Which characters will respond and why?

## Response Format

Respond with VALID JSON only (no markdown code blocks):

{
  "reasoning": {
    "context": "User is asking about X. Tone is Y.",
    "characterSelection": "Characters A and B are most relevant because...",
    "voiceCheck": {
      "character_id_1": "Will focus on...",
      "character_id_2": "Will contrast by..."
    },
    "formatValidation": {
      "usingCharacterIds": true,
      "separateObjects": true,
      "noNamePrefixes": true,
      "cleanContent": true
    },
    "decision": "Characters X and Y will respond because..."
  },
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
- Keep responses to 1 SENTENCE most of the time (97.9%), max 3 rarely (2%), max 5 extremely rarely (0.1%) - like texting a friend!
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
 * Split combined content that contains multiple character responses
 */
function splitCombinedContent(
  content: string,
  availableCharacters: string[]
): Array<{ character: string; content: string }> | null {
  // Check if content has multiple character prefixes like [Name]:
  const matches = content.match(/\[([^\]]+)\]:/g);
  if (!matches || matches.length <= 1) {
    return null;
  }
  
  console.log('[SingleCall] Detected combined response with', matches.length, 'characters');
  
  const splitResponses: Array<{ character: string; content: string }> = [];
  const splitPattern = /\[([^\]]+)\]:\s*/;
  const parts = content.split(/(?=\[[^\]]+\]:)/);
  
  for (const part of parts) {
    const trimmedPart = part.trim();
    if (!trimmedPart) continue;
    
    const match = trimmedPart.match(splitPattern);
    if (match) {
      const characterName = match[1];
      const responseText = trimmedPart.replace(splitPattern, '').trim();
      
      if (responseText) {
        const characterId = resolveCharacterId(characterName, availableCharacters);
        splitResponses.push({
          character: characterId,
          content: responseText
        });
      }
    }
  }
  
  return splitResponses.length > 1 ? splitResponses : null;
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
 * ARQ (Attentive Reasoning Query) reasoning from LLM
 */
interface ARQReasoning {
  context?: string;
  characterSelection?: string;
  voiceCheck?: Record<string, string>;
  formatValidation?: {
    usingCharacterIds?: boolean;
    separateObjects?: boolean;
    noNamePrefixes?: boolean;
    cleanContent?: boolean;
  };
  decision?: string;
}

/**
 * Log ARQ reasoning for debugging
 */
function logARQReasoning(reasoning: ARQReasoning | undefined): void {
  if (reasoning) {
    console.log('[ARQ] ===== Reasoning Analysis =====');
    console.log('[ARQ] Context:', reasoning.context || 'Not provided');
    console.log('[ARQ] Character Selection:', reasoning.characterSelection || 'Not provided');
    if (reasoning.voiceCheck) {
      console.log('[ARQ] Voice Check:', JSON.stringify(reasoning.voiceCheck, null, 2));
    }
    if (reasoning.formatValidation) {
      const fv = reasoning.formatValidation;
      console.log('[ARQ] Format Validation:', {
        usingCharacterIds: fv.usingCharacterIds ?? 'Not checked',
        separateObjects: fv.separateObjects ?? 'Not checked',
        noNamePrefixes: fv.noNamePrefixes ?? 'Not checked',
        cleanContent: fv.cleanContent ?? 'Not checked'
      });
    }
    console.log('[ARQ] Decision:', reasoning.decision || 'Not provided');
    console.log('[ARQ] ================================');
  } else {
    console.warn('[ARQ] No reasoning provided by LLM - enforcement may be weaker');
  }
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
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }

    const parsed = JSON.parse(cleaned);

    // Extract and log ARQ reasoning if present
    logARQReasoning(parsed.reasoning);

    // Validate structure
    if (!parsed.responses || !Array.isArray(parsed.responses)) {
      throw new Error('Invalid response structure: missing responses array');
    }

    // Process and clean each response, splitting combined responses
    const cleanedResponses: OrchestrationResponse[] = [];
    
    for (const resp of parsed.responses) {
      if (!resp.character || !resp.content) {
        console.warn('[SingleCall] Skipping response with missing character or content');
        continue;
      }
      
      // Check if this response contains multiple character responses combined
      const splitResponses = splitCombinedContent(resp.content, currentAvailableCharacters);
      
      if (splitResponses && splitResponses.length > 1) {
        // LLM combined multiple responses - add each separately
        console.log('[SingleCall] Splitting combined response into', splitResponses.length, 'separate responses');
        
        for (let i = 0; i < splitResponses.length; i++) {
          cleanedResponses.push({
            character: splitResponses[i].character,
            content: splitResponses[i].content,
            gesture: resp.gesture,
            interrupts: i > 0, // First is not interruption, others might be
            reactsTo: i > 0 ? splitResponses[i - 1].character : undefined,
            timing: i === 0 ? 'immediate' : 'delayed'
          });
        }
      } else {
        // Normal single-character response
        cleanedResponses.push({
          ...resp,
          character: resolveCharacterId(resp.character, currentAvailableCharacters),
          content: cleanResponseContent(resp.content)
        });
      }
    }

    // Validate responses for guideline violations
    validateResponses(cleanedResponses, currentAvailableCharacters);

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
 * Validate parsed responses for guideline violations
 * Logs warnings for debugging but doesn't block processing
 */
function validateResponses(
  responses: OrchestrationResponse[],
  selectedCharacters: string[]
): void {
  const violations: string[] = [];
  
  for (const resp of responses) {
    // Check if content still contains character name prefixes
    if (/^\[[\w\s]+\]:/.test(resp.content)) {
      violations.push(`Content for ${resp.character} starts with [Name]: prefix - should be clean text`);
    }
    
    // Check if content contains multiple character responses
    const multiCharPattern = /\[[\w\s]+\]:/g;
    const matches = resp.content.match(multiCharPattern);
    if (matches && matches.length > 1) {
      violations.push(`Content for ${resp.character} contains ${matches.length} character prefixes - responses not properly split`);
    }
    
    // Check if character ID looks like a display name (has spaces)
    if (resp.character.includes(' ')) {
      violations.push(`Character "${resp.character}" looks like a display name - should be an ID`);
    }
    
    // Check for empty content
    if (!resp.content || resp.content.trim().length === 0) {
      violations.push(`Empty content for character ${resp.character}`);
    }
  }
  
  // Log validation results
  if (violations.length > 0) {
    console.warn('[ARQ-Validation] ===== Guideline Violations Detected =====');
    violations.forEach((v, i) => console.warn(`[ARQ-Validation] ${i + 1}. ${v}`));
    console.warn('[ARQ-Validation] ==========================================');
  } else {
    console.log('[ARQ-Validation] All guidelines passed - responses properly formatted');
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
