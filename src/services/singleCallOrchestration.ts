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

import { generateAIResponse, generateAIResponseStreaming, isStreamingSupported } from './aiService';
import { getCharacter, getCharacterPrompt } from '../config/characters';
import { formatGesturesForPrompt } from '../config/characterGestures';
import { getCombinedResponseStyle } from '../config/responseStyles';
import { ConversationMessage, CharacterResponse } from './multiCharacterConversation';
import {
  OrchestrationScene,
  parseOrchestrationScene,
  createFallbackScene,
  fillGapsForNonSpeakers,
  getAnimationsList,
  getLookDirectionsList,
  getExpressionsList,
  getEffectsList
} from './animationOrchestration';
import { getVoiceOptionsForPrompt } from '../config/voiceConfig';
import { getProfiler, PROFILE_OPS } from './profilingService';
import { STATIC_ORCHESTRATION_IDENTITY_RULES } from '../config/characterIdentity';

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
  enableAnimatedScene: true // Default to animated format
};

/**
 * Get position label for a character based on index and total count
 * Positions characters left-to-right as they appear on screen
 */
function getPositionLabel(index: number, total: number): string {
  if (total === 1) return 'center';
  if (total === 2) return index === 0 ? 'left' : 'right';
  if (total === 3) return index === 0 ? 'left' : index === 1 ? 'center' : 'right';
  if (total === 4) {
    const labels = ['far-left', 'left-center', 'right-center', 'far-right'];
    return labels[index];
  }
  // 5 characters
  const labels = ['far-left', 'left', 'center', 'right', 'far-right'];
  return labels[index] || 'right';
}

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

  // Log the full prompt (collapsed)
  console.groupCollapsed('[SingleCall] Full Orchestration Prompt');
  console.log('System Prompt:', orchestrationPrompt);
  console.log('Conversation Messages:', conversationMessages);
  console.groupEnd();

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
  const profiler = getProfiler();
  const finalConfig = { ...DEFAULT_CONFIG, ...config, enableAnimatedScene: true };

  // Set available characters for parsing
  setAvailableCharactersForParsing(selectedCharacters);

  // Profile prompt building
  const promptTimer = profiler.start(PROFILE_OPS.PROMPT_BUILD);
  const animatedPrompt = buildAnimatedScenePrompt(
    selectedCharacters,
    messageHistory,
    finalConfig
  );
  promptTimer.stop({ 
    promptLength: animatedPrompt.length,
    characterCount: selectedCharacters.length 
  });

  // Format message history for context
  const conversationMessages = formatConversationHistory(messageHistory);

  // Add user's current message
  conversationMessages.push({
    role: 'user',
    content: userMessage
  });

  console.log('[AnimatedOrch] Generating animated scene for', selectedCharacters.length, 'characters');
  console.log('[AnimatedOrch] Prompt size:', animatedPrompt.length, 'chars, ~', profiler.estimateTokens(animatedPrompt), 'tokens');

  // Log the full prompt (collapsed)
  console.groupCollapsed('[AnimatedOrch] Full Animated Scene Prompt');
  console.log('System Prompt:', animatedPrompt);
  console.log('Conversation Messages:', conversationMessages);
  console.groupEnd();

  try {
    // Single API call generates the entire scene (profiled inside generateAIResponse)
    const rawResponse = await generateAIResponse(
      conversationMessages,
      animatedPrompt,
      'orchestrator'
    );

    console.log('[AnimatedOrch] Raw response:', rawResponse.substring(0, 500) + '...');

    // Profile scene parsing
    const parseTimer = profiler.start(PROFILE_OPS.SCENE_PARSE);
    let scene = parseOrchestrationScene(rawResponse, selectedCharacters);

    if (!scene) {
      console.warn('[AnimatedOrch] Failed to parse animated scene, falling back to simple format');
      
      // Try to parse as old format and convert
      const oldFormatResult = parseOrchestrationResponse(rawResponse);
      const responses = oldFormatResult.responses.map(resp => ({
        characterId: resp.character,
        content: resp.content
      }));
      
      const fallbackTimer = profiler.start(PROFILE_OPS.FALLBACK_SCENE_CREATE);
      scene = createFallbackScene(responses, selectedCharacters);
      fallbackTimer.stop();
    }

    // Fill gaps for non-speaking characters
    scene = fillGapsForNonSpeakers(scene, selectedCharacters);
    parseTimer.stop({ 
      timelinesCount: scene.timelines.length,
      sceneDuration: scene.sceneDuration 
    });

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

// ============================================
// STREAMING ANIMATED SCENE ORCHESTRATION
// ============================================

export interface EarlyAnimationSetup {
  detectedCharacters: string[];  // Character IDs detected so far
  estimatedDuration?: number;     // Estimated scene duration if available
  canStartThinkingAnimation: boolean; // True when we know enough to start
}

export interface StreamingOrchestrationCallbacks {
  onStart?: () => void;
  onProgress?: (accumulated: string, percentage: number) => void;
  onEarlySetup?: (setup: EarlyAnimationSetup) => void; // Called when we can start animations early
  onComplete?: (scene: OrchestrationScene, responses: CharacterResponse[]) => void;
  onError?: (error: Error) => void;
}

/**
 * Generate animated scene with streaming for faster perceived response
 * 
 * Benefits:
 * - Faster time-to-first-byte (connection established immediately)
 * - Progress callbacks during generation
 * - Same result format as non-streaming version
 * 
 * Note: Since we need complete JSON for animations, text is shown after
 * full response is received. The streaming benefit is faster initial response.
 */
export async function generateAnimatedSceneOrchestrationStreaming(
  userMessage: string,
  selectedCharacters: string[],
  messageHistory: ConversationMessage[],
  callbacks?: StreamingOrchestrationCallbacks,
  config: Partial<OrchestrationConfig> = {}
): Promise<{ scene: OrchestrationScene; responses: CharacterResponse[] }> {
  const profiler = getProfiler();
  const finalConfig = { ...DEFAULT_CONFIG, ...config, enableAnimatedScene: true };

  // Check if streaming is supported
  if (!isStreamingSupported()) {
    console.log('[AnimatedOrch-Stream] Streaming not supported, falling back to regular');
    return generateAnimatedSceneOrchestration(userMessage, selectedCharacters, messageHistory, config);
  }

  // Set available characters for parsing
  setAvailableCharactersForParsing(selectedCharacters);

  // Build prompt
  const promptTimer = profiler.start(PROFILE_OPS.PROMPT_BUILD);
  const animatedPrompt = buildAnimatedScenePrompt(
    selectedCharacters,
    messageHistory,
    finalConfig
  );
  promptTimer.stop({ 
    promptLength: animatedPrompt.length,
    characterCount: selectedCharacters.length 
  });

  // Format message history
  const conversationMessages = formatConversationHistory(messageHistory);
  conversationMessages.push({
    role: 'user',
    content: userMessage
  });

  console.log('[AnimatedOrch-Stream] Starting streaming generation for', selectedCharacters.length, 'characters');

  // Log the full prompt (collapsed)
  console.groupCollapsed('[AnimatedOrch-Stream] Full Animated Scene Prompt');
  console.log('System Prompt:', animatedPrompt);
  console.log('Conversation Messages:', conversationMessages);
  console.groupEnd();

  // Notify start
  callbacks?.onStart?.();

  try {
    let estimatedTotalLength = 500; // Estimate for progress calculation
    let earlySetupSent = false;
    let detectedCharacters: string[] = [];
    
    // Use streaming API
    const rawResponse = await generateAIResponseStreaming(
      conversationMessages,
      animatedPrompt,
      'orchestrator',
      {
        onStart: () => {
          console.log('[AnimatedOrch-Stream] Stream started');
        },
        onDelta: (delta, accumulated) => {
          // Update estimated total based on accumulated length
          if (accumulated.length > estimatedTotalLength * 0.8) {
            estimatedTotalLength = accumulated.length * 1.5;
          }
          const percentage = Math.min(95, (accumulated.length / estimatedTotalLength) * 100);
          callbacks?.onProgress?.(accumulated, percentage);
          
          // Try to detect characters early for animation setup
          if (!earlySetupSent && callbacks?.onEarlySetup) {
            const earlyData = tryDetectEarlyCharacters(accumulated, selectedCharacters);
            if (earlyData.canStartThinkingAnimation) {
              earlySetupSent = true;
              detectedCharacters = earlyData.detectedCharacters;
              console.log('[AnimatedOrch-Stream] Early setup triggered for:', detectedCharacters);
              callbacks.onEarlySetup(earlyData);
            }
          }
        },
        onDone: (fullText, durationMs) => {
          console.log('[AnimatedOrch-Stream] Stream complete in', durationMs.toFixed(0), 'ms');
          callbacks?.onProgress?.(fullText, 100);
        },
        onError: (error) => {
          callbacks?.onError?.(error);
        },
      }
    );

    console.log('[AnimatedOrch-Stream] Raw response:', rawResponse.substring(0, 500) + '...');

    // Parse scene
    const parseTimer = profiler.start(PROFILE_OPS.SCENE_PARSE);
    let scene = parseOrchestrationScene(rawResponse, selectedCharacters);

    if (!scene) {
      console.warn('[AnimatedOrch-Stream] Failed to parse, falling back');
      const oldFormatResult = parseOrchestrationResponse(rawResponse);
      const responses = oldFormatResult.responses.map(resp => ({
        characterId: resp.character,
        content: resp.content
      }));
      scene = createFallbackScene(responses, selectedCharacters);
    }

    scene = fillGapsForNonSpeakers(scene, selectedCharacters);
    parseTimer.stop({ 
      timelinesCount: scene.timelines.length,
      sceneDuration: scene.sceneDuration 
    });

    // Extract CharacterResponse
    const characterResponses: CharacterResponse[] = scene.timelines.map(timeline => ({
      characterId: timeline.characterId,
      content: timeline.content,
      gesture: timeline.segments[0]?.animation,
      isInterruption: false,
      isReaction: false,
      timing: timeline.startDelay === 0 ? 'immediate' : 'delayed'
    }));

    console.log('[AnimatedOrch-Stream] Generated scene with', scene.timelines.length, 'timelines');
    
    // Notify complete
    callbacks?.onComplete?.(scene, characterResponses);

    return { scene, responses: characterResponses };

  } catch (error) {
    console.error('[AnimatedOrch-Stream] Orchestration failed:', error);
    const err = error instanceof Error ? error : new Error(String(error));
    callbacks?.onError?.(err);
    throw new Error(`Failed to generate animated scene: ${err.message}`);
  }
}

/**
 * Build the animated scene prompt for LLM
 *
 * Uses SIMPLIFIED format only - all timing is calculated client-side
 * based on text length and speed qualifiers (slow/normal/fast/explosive)
 */
function buildAnimatedScenePrompt(
  selectedCharacters: string[],
  messageHistory: ConversationMessage[],
  config: OrchestrationConfig
): string {
  // Get character profiles - enhanced with full systemPrompt + temperament modifiers
  const characterProfiles = selectedCharacters.map((charId, index) => {
    const character = getCharacter(charId);
    const pos = index === 0 ? 'L' : index === 1 ? 'C' : 'R';

    // Build enhanced profile with systemPrompt and temperament
    let profile = `### ${character.name} (${charId}, Position: ${pos})\n`;
    profile += `${character.description}\n\n`;
    profile += `**Approach:**\n${character.systemPrompt}\n`;

    // Add temperament modifiers if available
    if (character.temperaments && character.temperaments.length > 0) {
      const styleModifier = getCombinedResponseStyle(character.temperaments);
      profile += `\n${styleModifier}`;
    }

    return profile;
  }).join('\n\n---\n\n');

  // Build character change notification
  const characterChangeNote = buildCharacterChangeNotification(messageHistory, selectedCharacters);

  // SIMPLIFIED format (no ms values - client calculates timing)
  // IMPORTANT: Static content (identity rules, animation system) goes FIRST for prompt caching
  // Dynamic content (character profiles) goes LAST
  return `# Animated Scene Orchestrator

${STATIC_ORCHESTRATION_IDENTITY_RULES}
## Animation System
Body (a): ${getAnimationsList()}
Look (lk): ${getLookDirectionsList()}
Expression (ex): ${getExpressionsList()}
Effect (fx): ${getEffectsList()}

Use "ex" for compiled face expressions (eyes, eyebrows, mouth, etc. combined).
Override specific parts if needed: "ex":"joyful","m":"smirk" (joyful expression but with smirk mouth)

## Voice (optional "v" object per segment)
${getVoiceOptionsForPrompt()}

## Output Format (SIMPLIFIED - NO ms/duration values!)
Keys: s=scene, ch=characters, c=character, t=content, ord=speakerOrder, tl=timeline, a=animation, sp=speed, lk=look, ex=expression, fx=effect, v=voice
Override keys (optional, override ex): ey=eyes, eb=eyebrow, m=mouth, fc=face, n=nose, ck=cheek, fh=forehead, j=jaw

Speed (sp): "slow" | "normal" | "fast" | "explosive"
- slow: Thoughtful, measured - important/emotional moments (1.3x duration)
- normal: Conversational pace (default, 1.0x duration)
- fast: Energetic, quick reactions (0.7x duration)
- explosive: Rapid-fire, intense energy (0.5x duration)

EXAMPLES (use "a" for body + "ex" for expression):
Excited greeting: {"a":"wave","sp":"fast","lk":"center","ex":"excited","fx":"sparkles"}
Deep thinking: {"a":"chin_stroke","sp":"slow","lk":"up","ex":"thoughtful"}
Frustrated: {"a":"cross_arms","sp":"normal","ex":"frustrated"}
Sympathetic: {"a":"nod","sp":"slow","lk":"at_left_character","ex":"sad","m":"slight_smile"}
Playful tease: {"a":"lean_forward","sp":"fast","lk":"center","ex":"playful"}
Nervous: {"a":"fidget","sp":"fast","lk":"down","ex":"nervous"}
With override: {"a":"happy","ex":"joyful","m":"smirk"} (joyful but with smirk instead of big_grin)

Full scene: {"s":{"ch":[{"c":"ID","t":"TEXT","ord":1,"tl":[{"a":"thinking","sp":"slow","lk":"up","ex":"thoughtful"},{"a":"talking","sp":"normal","talking":true,"lk":"center","ex":"happy"}]}]}}

## CRITICAL FORMAT RULES
- DO NOT include: ms, duration, dur, d, startDelay, textRange
- Use "ord" for speaker order (1, 2, 3...) - first speaker is ord:1
- Use "sp" for speed qualifier (slow/normal/fast/explosive)
- Use "int": true for interruptions (optional)

## Rules
- NO ASTERISK ACTIONS: NEVER write *action* or *emotion* in text! Use "a" and "ex" keys instead.
  BAD: "*raises eyebrow*" or "*smiles warmly*" in "t" field
  GOOD: {"a":"idle","ex":"skeptical"} or {"a":"happy","ex":"loving"}
- USE EXPRESSIONS: Every segment should have an "ex" (expression). Pick the one that matches the emotional tone.
- VARY EXPRESSIONS: Each segment should feel emotionally distinct. Don't repeat the same expression.
- OVERRIDE WHEN NEEDED: Use override keys (ey, eb, m, etc.) to tweak expressions for nuance.
- 1-2 sentences per response - SHORT, punchy, like texting friends
- Be SASSY and FUNNY, not supportive and preachy. Roast > comfort.
- Max 1 question per response (99%), 2 questions extremely rare (1%)
- Look direction when addressing another character (based on their position relative to YOU):
  * If target is to YOUR LEFT (lower index): look "at_left_character"
  * If target is to YOUR RIGHT (higher index): look "at_right_character"
  * Example: If you're at position 2 and addressing someone at position 4, look "at_right_character"
- Use character ID (like "freud") in "c" field, NOT display name
- No name prefix in "t" field
- Include ${Math.min(config.maxResponders, selectedCharacters.length)} characters maximum
- Add "v" object to talking segments to control voice characteristics
- If asked personal questions (birthday, history), characters answer AS THEMSELVES based on their real history
${config.includeInterruptions ? '- Characters can interrupt by setting "int": true' : ''}

## Characters in This Scene (DYNAMIC - answer personal questions based on their history)
${characterProfiles}
${characterChangeNote}

CRITICAL: Your ENTIRE response must be ONLY valid JSON. No text before or after.
Start with { and end with }. Example: {"s":{"ch":[...]}}`;
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
  // IMPORTANT: Static content (identity rules) goes FIRST for prompt caching
  return `# Multi-Character Conversation Orchestrator

${STATIC_ORCHESTRATION_IDENTITY_RULES}
You are orchestrating a casual conversation between multiple characters and a user.

## Your Task

Generate responses for the characters in this conversation. Consider:

1. **Character Voice**: Each character has a unique perspective, but DON'T overdo it:
   - Let your viewpoint come through naturally, not forced
   - Don't constantly reference your famous ideas or catchphrases
   - Be a person first, a "character" second
   - Sometimes a simple "yeah, that makes sense!" is perfect
   - Not everything needs deep analysis or your signature spin

2. **Casual Tone & Simple Words**: 
   - Talk like texting, not like giving a lecture
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

5. **User Focus**: Keep the user's needs at the center.

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
- 1 SHORT sentence only (max 10-15 words) - like a text message!
- Max 1 question per response (99%), 2 questions extremely rare (1%)
- Include ${Math.min(config.maxResponders, selectedCharacters.length)} characters maximum, but fewer is often better
- If user addresses a specific character, include ONLY that character (unless others interrupt)
- First response: "timing": "immediate", "interrupts": false
- Subsequent responses: "timing": "delayed", may have "interrupts": true
- Use "reactsTo": "character_id" when building on another's point
- Maintain distinct voices for each character
- Return an empty "responses" array [] if no character has something meaningful to add
- If asked personal questions (birthday, history), characters answer AS THEMSELVES based on their real history
${config.includeGestures ? '- Choose gestures that match the character\'s emotional state and message' : ''}

## Characters in This Conversation (DYNAMIC - answer personal questions based on their history)

${characterProfiles}

${characterChangeNote}

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
 * Try to detect character information early from partial JSON stream
 * This allows starting "thinking" animations before the full response is complete
 */
function tryDetectEarlyCharacters(
  partialJson: string,
  availableCharacters: string[]
): EarlyAnimationSetup {
  const result: EarlyAnimationSetup = {
    detectedCharacters: [],
    canStartThinkingAnimation: false
  };
  
  // We need at least 100 chars to have meaningful structure
  if (partialJson.length < 100) {
    return result;
  }
  
  try {
    // Look for character patterns in both compact and full formats
    // Compact: "c":"freud" or "c": "freud"
    // Full: "character":"freud" or "character": "freud"
    
    const compactPattern = /"c"\s*:\s*"([^"]+)"/g;
    const fullPattern = /"character"\s*:\s*"([^"]+)"/g;
    
    const foundCharacters = new Set<string>();
    
    let match;
    while ((match = compactPattern.exec(partialJson)) !== null) {
      const charId = match[1];
      if (availableCharacters.includes(charId)) {
        foundCharacters.add(charId);
      } else {
        // Try to resolve the character ID
        const resolved = resolveCharacterId(charId, availableCharacters);
        if (resolved !== charId || availableCharacters.includes(resolved)) {
          foundCharacters.add(resolved);
        }
      }
    }
    
    while ((match = fullPattern.exec(partialJson)) !== null) {
      const charId = match[1];
      if (availableCharacters.includes(charId)) {
        foundCharacters.add(charId);
      } else {
        const resolved = resolveCharacterId(charId, availableCharacters);
        if (resolved !== charId || availableCharacters.includes(resolved)) {
          foundCharacters.add(resolved);
        }
      }
    }
    
    result.detectedCharacters = Array.from(foundCharacters);
    
    // Try to detect duration from partial JSON
    // Compact: "dur":12000 or Full: "totalDuration":12000
    const durationMatch = partialJson.match(/"(?:dur|totalDuration)"\s*:\s*(\d+)/);
    if (durationMatch) {
      result.estimatedDuration = parseInt(durationMatch[1], 10);
    }
    
    // We can start thinking animations if:
    // 1. We've detected at least one character
    // 2. We're past the initial "reasoning" section (indicates characters are being defined)
    const hasCharacters = result.detectedCharacters.length > 0;
    const pastReasoning = partialJson.includes('"ch"') || partialJson.includes('"characters"');
    
    result.canStartThinkingAnimation = hasCharacters && pastReasoning;
    
  } catch (e) {
    // Ignore parsing errors - partial JSON is expected to be incomplete
  }
  
  return result;
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
