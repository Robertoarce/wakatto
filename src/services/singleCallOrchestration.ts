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
import { getVoiceOptionsForPrompt, getVoiceOptionsForPromptFull } from '../config/voiceConfig';
import { getProfiler, PROFILE_OPS } from './profilingService';

export interface OrchestrationConfig {
  maxResponders: number; // Max characters that can respond
  includeGestures: boolean; // Include gesture system
  includeInterruptions: boolean; // Allow interruptions
  verbosity: 'brief' | 'balanced' | 'detailed'; // Response length
  enableAnimatedScene: boolean; // Use new animated scene format
  useCompactFormat: boolean; // Use compact JSON response format (28% faster)
}

const DEFAULT_CONFIG: OrchestrationConfig = {
  maxResponders: 3,
  includeGestures: true,
  includeInterruptions: true,
  verbosity: 'balanced',
  enableAnimatedScene: true, // Default to new animated format
  useCompactFormat: true // Default to compact format for 28% faster responses
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
 * Uses compact JSON format by default for 28% faster responses
 */
function buildAnimatedScenePrompt(
  selectedCharacters: string[],
  messageHistory: ConversationMessage[],
  config: OrchestrationConfig
): string {
  // Get character profiles - use compact format when enabled
  const characterProfiles = config.useCompactFormat
    ? selectedCharacters.map((charId, index) => {
        const character = getCharacter(charId);
        const pos = index === 0 ? 'L' : index === 1 ? 'C' : 'R';
        return `${character.name}(${charId},${pos}): ${character.description.substring(0, 80)}`;
      }).join('\n')
    : selectedCharacters.map((charId, index) => {
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

  // Use compact format for faster responses (28% improvement)
  if (config.useCompactFormat) {
    return `# Animated Scene Orchestrator
Direct animated multi-character conversation with 3D animations.

## Characters
${characterProfiles}
${characterChangeNote}

## Animations
Body: idle,talking,thinking,nodding,waving,leaning_forward
Look: at_user,at_left_character,at_right_character,up,down
Eye: open,squint,wide | Mouth: closed,smile,open

## Voice (optional "v" object per segment)
${getVoiceOptionsForPrompt()}

## Output Format (COMPACT JSON)
Use short keys: s=scene, dur=totalDuration, ch=characters, c=character, t=content, d=startDelay, tl=timeline, a=animation, ms=duration, lk=look, v=voice

{"s":{"dur":MS,"ch":[{"c":"ID","t":"TEXT","d":MS,"tl":[{"a":"thinking","ms":1500,"lk":"up"},{"a":"talking","ms":3000,"talking":true,"lk":"at_user","v":{"p":"low","t":"warm","pace":"deliberate","mood":"calm","int":"explaining"}}]}]}}

## Rules
- 1-2 sentences per response, casual and conversational
- Use character ID (like "freud") in "c" field, NOT display name
- No name prefix in "t" field
- First character: d:0
- Include ${Math.min(config.maxResponders, selectedCharacters.length)} characters maximum
- Add "v" object to talking segments to control voice characteristics
- Vary voice by mood/intent to match content (e.g., excited = fast pace, reassuring = soft volume)
${config.includeInterruptions ? '- Characters can interrupt by overlapping d (use carefully!)' : ''}

Generate the animated scene now.`;
  }

  // Full format (legacy - for comparison/debugging)
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

${getVoiceOptionsForPromptFull()}

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
            "look": "center",
            "voice": {
              "pitch": "low",
              "tone": "warm",
              "volume": "soft",
              "pace": "deliberate",
              "mood": "calm",
              "intent": "reassuring"
            }
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
            "textRange": [0, 35],
            "voice": {
              "pitch": "medium",
              "tone": "crisp",
              "pace": "fast",
              "mood": "excited",
              "intent": "encouraging"
            }
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
