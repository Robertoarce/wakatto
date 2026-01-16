/**
 * Conversation Starter Prompts
 *
 * Generates AI-powered opening conversations when a new chat starts.
 * For single character: personalized greeting directed at user
 * For multiple characters: multi-character banter (5-8 exchanges) that user can join
 */

import { getCharacter } from '../config/characters';
import { OrchestrationScene, CharacterTimeline, AnimationSegment, parseOrchestrationScene } from './animationOrchestration';
import { AnimationState, LookDirection } from '../components/CharacterDisplay3D';
import { generateAIResponseStreaming, isStreamingSupported } from './aiService';
import { getVoiceOptionsForPrompt } from '../config/voiceConfig';
import { Story } from './storyLibrary';

// ============================================
// STARTER THEMES
// ============================================

/**
 * Themes for multi-character conversation starters
 */
const STARTER_THEMES = [
  'greeting_the_user',     // Characters notice user and welcome them
  'mid_conversation',      // User walks in on characters chatting
  'curious_about_user',    // Characters wonder about the user
  'debating_topic',        // Characters are debating something
  'sharing_observation',   // One character shares something interesting
  'story_discussion',      // Characters discuss a specific story/topic (from story library)
] as const;

type StarterTheme = typeof STARTER_THEMES[number];

/**
 * Get a random starter theme
 */
function getRandomStarterTheme(): StarterTheme {
  return STARTER_THEMES[Math.floor(Math.random() * STARTER_THEMES.length)];
}

// ============================================
// SINGLE CHARACTER PROMPT
// ============================================

/**
 * Build prompt for single-character greeting
 */
function buildSingleCharacterStarterPrompt(characterId: string): string {
  const character = getCharacter(characterId);

  return `# Character Greeting - First Impression

You are ${character.name}. A user has just started a new conversation with you.

## Character Profile
${character.description}
Role: ${character.role}

## Instructions
Generate a warm, engaging opening that:
1. Reflects ${character.name}'s unique personality and speaking style
2. Invites the user to share what's on their mind
3. Is 2-3 sentences long
4. Feels natural, not scripted or robotic

## Animation System
Available animations: wave, nod, lean_forward, happy, idle, bow
Look directions: center

## Output Format (COMPACT JSON)
{"greeting":"Your greeting text","a":"wave","sp":"normal","lk":"center","ex":"happy"}

Generate the greeting now.`;
}

// ============================================
// MULTI-CHARACTER PROMPT
// ============================================

/**
 * Build prompt for multi-character conversation starter
 * Creates 5-8 exchanges (~30-45 seconds) ending with user invitation
 * If a story is provided, characters will discuss that topic instead of random themes
 */
function buildMultiCharacterStarterPrompt(characterIds: string[], story?: Story): string {
  // If story is provided, use 'story_discussion' theme instead of random
  const theme = story ? 'story_discussion' as StarterTheme : getRandomStarterTheme();

  // Build character profiles with positions
  const characterProfiles = characterIds.map((charId, index) => {
    const character = getCharacter(charId);
    const pos = index === 0 ? 'L (left)' : index === characterIds.length - 1 ? 'R (right)' : 'C (center)';

    return `### ${character.name} (${charId}, Position: ${pos})
${character.description}
Role: ${character.role}`;
  }).join('\n\n');

  // Theme-specific instructions
  const themeInstructions: Record<StarterTheme, string> = {
    greeting_the_user: `The characters notice the user has arrived and welcome them warmly:
- One character spots the user first
- They alert the other(s) excitedly
- Both/all greet the user with genuine enthusiasm
- End by asking what the user would like to talk about`,

    mid_conversation: `The user "walks in" on the characters mid-conversation:
- Characters are discussing something interesting (a memory, an idea, a story)
- One character notices the user and pauses
- They welcome the user and briefly mention what they were discussing
- Invite user to join or share their thoughts`,

    curious_about_user: `The characters were wondering about the user:
- One character mentions they've been curious about who might visit
- They express interest in meeting new people
- Notice the user has arrived with pleasant surprise
- Ask warm, engaging questions to get to know the user`,

    debating_topic: `The characters were in a friendly debate:
- They're disagreeing about something light/fun (psychology topic, life question)
- Debate is good-natured with teasing
- Notice user and decide to settle it
- Ask for user's opinion to break the tie`,

    sharing_observation: `One character shares something interesting:
- One character brings up an observation or thought
- Other(s) react with interest or questions
- They notice the user arriving
- Welcome user and include them in the discussion`,

    story_discussion: story
      ? `The characters are engaged in a discussion about: "${story.toastText}"

STORY CONTEXT: ${story.fullContext}

Instructions:
- One character brings up this topic with genuine interest
- The other(s) respond with their perspective on the matter
- They have a brief but engaging exchange about the topic (2-4 exchanges)
- Then they notice the user has arrived
- They welcome the user warmly and invite them to share their thoughts
- The conversation should feel natural, as if the user caught them mid-discussion`
      : `Default conversation starter`,
  };

  // Build story context section if provided
  const storySection = story ? `
## Story Context
The characters should be discussing this topic when the user arrives:
- Toast shown to user: "${story.toastText}"
- Full context: ${story.fullContext}
- Story type: ${story.type}

Characters should naturally weave this topic into their conversation, showing genuine interest and their unique perspectives.
` : '';

  return `# Conversation Starter - Multi-Character Welcome Scene

Generate a SHORT, engaging opening scene between characters. The user just opened a new conversation and will see this exchange.

## Scene Theme: ${theme}
${themeInstructions[theme]}

## Characters
${characterProfiles}
${storySection}
## CRITICAL RULES
1. **EVERY CHARACTER MUST SPEAK AT LEAST ONCE** - mandatory, do not skip any character (${characterIds.length} characters total)
2. **GENERATE ${Math.max(5, characterIds.length + 2)}-${Math.max(8, characterIds.length + 4)} EXCHANGES** (30-45 seconds total)
3. Characters start by talking TO EACH OTHER
4. Then they notice the user and WELCOME THEM
5. End with characters ready to engage with user
6. Make it feel natural and inviting, not rehearsed
7. Characters should face each other initially, then toward user at end:
   - LEFT position character: look "at_right_character" → then "center" when noticing user
   - RIGHT position character: look "at_left_character" → then "center" when noticing user
   - CENTER position: look at whoever they're addressing → "center" for user

## Animation System
Body: idle,thinking,talking,wave,nod,lean_forward,lean_back,excited,happy,surprise_happy,shrug,point
Look: center,left,right,at_left_character,at_right_character
Eye: open,blink | Eyebrow: normal,raised
Mouth: closed,smile,open | Face: normal,blush

## Voice (optional "v" object per segment)
${getVoiceOptionsForPrompt()}

## Output Format (COMPACT JSON - SIMPLIFIED)
Use short keys: s=scene, ch=characters, c=character, t=content, ord=speaker order (1,2,3...), a=animation, sp=speed, lk=look, ex=expression, ey=eyes, eb=eyebrow, m=mouth
CRITICAL: Use "ord" for speaker order (1, 2, 3...), NOT "d" for delays. Timing is calculated automatically.

EXAMPLE (5 exchanges, yours should have ${Math.max(5, characterIds.length + 2)}-${Math.max(8, characterIds.length + 4)}):
{"s":{"ch":[
{"c":"freud","t":"You know, I was just thinking about something interesting...","ord":1,"a":"thinking","sp":"slow","lk":"at_right_character","ex":"thoughtful"},
{"c":"jung","t":"Oh? Do tell. You have that look in your eyes.","ord":2,"a":"lean_forward","sp":"normal","lk":"at_left_character","ex":"curious","eb":"raised"},
{"c":"freud","t":"Wait - I think someone's here!","ord":3,"a":"surprise_happy","sp":"fast","lk":"center","ex":"surprised"},
{"c":"jung","t":"Oh wonderful! Hello there! Welcome!","ord":4,"a":"wave","sp":"fast","lk":"center","ex":"happy","m":"smile"},
{"c":"freud","t":"Yes, please join us! What's on your mind today?","ord":5,"a":"happy","sp":"normal","lk":"center","ex":"welcoming","m":"smile"}
]}}

## Important
- Character ID in "c" field (like "freud"), NOT display name
- No "Freud:" prefixes in the text - just dialogue
- Keep it WARM and WELCOMING - this is the user's first impression
- Natural conversation flow
- Use "ord" for order (1, 2, 3...) - DO NOT use "d" for delays
- Last 1-2 exchanges should be directed at the user (lookDirection: "center")

Generate the conversation starter now (5-8 exchanges, 30-45 seconds total).`;
}

// ============================================
// SCENE GENERATION
// ============================================

/**
 * Result type for conversation starter generation
 */
export interface ConversationStarterResult {
  scene: OrchestrationScene;
  responses: Array<{ characterId: string; content: string }>;
  storyContext?: string; // The story context if a story was used, for later reference
}

/**
 * Generate a conversation starter scene
 *
 * @param characterIds - Array of character IDs to generate starter for
 * @param onProgress - Optional callback for streaming progress (0-100)
 * @param story - Optional story to use as conversation topic
 * @returns Promise with scene and character responses
 */
export async function generateConversationStarter(
  characterIds: string[],
  onProgress?: (percentage: number) => void,
  story?: Story
): Promise<ConversationStarterResult> {
  console.log('[ConversationStarter] Starting generation for', characterIds.length, 'characters:', characterIds);
  console.log('[ConversationStarter] Story:', story?.toastText || 'none');

  const isSingleCharacter = characterIds.length === 1;

  const prompt = isSingleCharacter
    ? buildSingleCharacterStarterPrompt(characterIds[0])
    : buildMultiCharacterStarterPrompt(characterIds, story);

  // Anthropic API requires at least one user message
  const conversationMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    { role: 'user', content: 'Generate the conversation starter now.' }
  ];

  let rawResponse = '';

  try {
    if (isStreamingSupported()) {
      rawResponse = await generateAIResponseStreaming(
        conversationMessages,
        prompt,
        'orchestrator',
        {
          onDelta: (_text, accumulated) => {
            // Calculate rough progress based on accumulated length
            const progress = Math.min(accumulated.length / 2000 * 100, 95);
            onProgress?.(progress);
          },
          onError: (error) => {
            console.error('[ConversationStarter] Stream error:', error);
          },
        }
      );
    } else {
      throw new Error('Non-streaming not implemented for conversation starters');
    }
  } catch (error) {
    console.error('[ConversationStarter] Error generating conversation starter:', error);
    return createFallbackStarter(characterIds);
  }

  console.log('[ConversationStarter] AI response received, length:', rawResponse.length);

  // Parse response based on character count
  let result: ConversationStarterResult;
  if (isSingleCharacter) {
    result = parseSingleCharacterResponse(rawResponse, characterIds[0]);
  } else {
    result = parseMultiCharacterResponse(rawResponse, characterIds);
  }

  console.log('[ConversationStarter] Result:', {
    sceneTimelines: result.scene?.timelines?.length,
    sceneDuration: result.scene?.sceneDuration,
    responsesCount: result.responses?.length,
    responseCharacters: result.responses?.map(r => r.characterId)
  });

  // Add story context if a story was used
  if (story) {
    result.storyContext = story.fullContext;
  }

  return result;
}

/**
 * Parse single character greeting response
 */
function parseSingleCharacterResponse(
  rawResponse: string,
  characterId: string
): ConversationStarterResult {
  try {
    // Clean up JSON from markdown if present
    const cleanJson = rawResponse
      .replace(/```json\s*/g, '')
      .replace(/```/g, '')
      .trim();

    const parsed = JSON.parse(cleanJson);
    const greeting = parsed.greeting || "Hello! What's on your mind today?";

    // Parse flat animation fields (new format)
    const animation = (parsed.a || 'wave') as AnimationState;
    const speed = parsed.sp || 'normal';
    const lookDirection = (parsed.lk || 'center') as LookDirection;
    const expression = parsed.ex;

    // Calculate duration based on speed and text length
    const speedMultiplier = speed === 'slow' ? 1.3 : speed === 'fast' ? 0.7 : speed === 'explosive' ? 0.5 : 1.0;
    const baseDuration = Math.max(1500, greeting.length * 50); // ~50ms per character
    const duration = Math.round(baseDuration * speedMultiplier);

    // Build single talking segment from flat fields
    const segments: AnimationSegment[] = [{
      animation,
      duration,
      isTalking: true,
      complementary: {
        lookDirection,
        ...(expression && { faceState: expression }),
      },
      textReveal: { startIndex: 0, endIndex: greeting.length },
    }];

    const totalDuration = segments.reduce((sum, seg) => sum + seg.duration, 0);

    const scene: OrchestrationScene = {
      timelines: [{
        characterId,
        content: greeting,
        totalDuration,
        startDelay: 0,
        segments,
      }],
      sceneDuration: totalDuration,
      nonSpeakerBehavior: {},
    };

    return {
      scene,
      responses: [{ characterId, content: greeting }],
    };
  } catch (error) {
    console.error('[ConversationStarter] Failed to parse single character response:', error);
    return createFallbackStarter([characterId]);
  }
}

/**
 * Parse multi-character conversation response
 */
function parseMultiCharacterResponse(
  rawResponse: string,
  characterIds: string[]
): ConversationStarterResult {
  console.log('[ConversationStarter] Parsing multi-character response for', characterIds.length, 'characters');

  // Use the existing orchestration parser
  const scene = parseOrchestrationScene(rawResponse, characterIds);

  if (!scene) {
    console.warn('[ConversationStarter] Failed to parse multi-character response, using fallback');
    return createFallbackStarter(characterIds);
  }

  // Sort timelines by startDelay to ensure correct speaking order
  const sortedTimelines = [...scene.timelines].sort((a, b) => a.startDelay - b.startDelay);

  // Log timeline order for debugging
  console.log('[ConversationStarter] Timeline order (sorted by startDelay):');
  sortedTimelines.forEach((t, idx) => {
    console.log(`  [${idx + 1}] ${t.characterId}: startDelay=${t.startDelay}ms, content="${t.content.substring(0, 50)}..."`);
  });

  // Extract ALL responses from timelines in speaking order (no deduplication)
  // This ensures every exchange in the conversation is saved
  const responses: Array<{ characterId: string; content: string }> = sortedTimelines.map(t => ({
    characterId: t.characterId,
    content: t.content,
  }));

  // Check if any characters are missing from the response (didn't speak at all)
  const seenCharacters = new Set(sortedTimelines.map(t => t.characterId));
  const missingCharacters = characterIds.filter(id => !seenCharacters.has(id));
  if (missingCharacters.length > 0) {
    console.warn('[ConversationStarter] Missing characters in AI response:', missingCharacters);
    // Add simple greeting for missing characters at the end
    for (const charId of missingCharacters) {
      const char = getCharacter(charId);
      responses.push({
        characterId: charId,
        content: `Hello! I'm ${char.name}. Nice to meet you!`,
      });
    }
  }

  console.log('[ConversationStarter] Extracted', responses.length, 'responses in order:', 
    responses.map((r, i) => `[${i + 1}] ${r.characterId}`).join(', '));
  console.log('[ConversationStarter] Scene has', scene.timelines.length, 'timelines');

  return { scene, responses };
}

/**
 * Create fallback starter when generation fails
 */
function createFallbackStarter(characterIds: string[]): ConversationStarterResult {
  if (characterIds.length === 1) {
    // Single character fallback
    const character = getCharacter(characterIds[0]);
    const greeting = `Hello there! I'm ${character.name}. What would you like to talk about today?`;

    const scene: OrchestrationScene = {
      timelines: [{
        characterId: characterIds[0],
        content: greeting,
        totalDuration: 3500,
        startDelay: 0,
        segments: [
          {
            animation: 'wave' as AnimationState,
            duration: 800,
            isTalking: false,
            complementary: { lookDirection: 'center' as LookDirection },
          },
          {
            animation: 'talking' as AnimationState,
            duration: 2700,
            isTalking: true,
            complementary: { lookDirection: 'center' as LookDirection, mouthState: 'open' },
            textReveal: { startIndex: 0, endIndex: greeting.length },
          },
        ],
      }],
      sceneDuration: 3500,
      nonSpeakerBehavior: {},
    };

    return {
      scene,
      responses: [{ characterId: characterIds[0], content: greeting }],
    };
  }

  // Multi-character fallback
  const char1 = getCharacter(characterIds[0]);
  const char2 = getCharacter(characterIds[1] || characterIds[0]);

  const lines = [
    { charId: characterIds[0], text: `Oh look, someone's here!`, lookDir: 'center' as LookDirection },
    { charId: characterIds[1] || characterIds[0], text: `Welcome! Great to see you!`, lookDir: 'center' as LookDirection },
    { charId: characterIds[0], text: `What would you like to talk about today?`, lookDir: 'center' as LookDirection },
  ];

  const timelines: CharacterTimeline[] = lines.map((line, index) => ({
    characterId: line.charId,
    content: line.text,
    totalDuration: 2500,
    startDelay: index * 3000,
    segments: [
      {
        animation: (index === 0 ? 'surprise_happy' : index === 1 ? 'wave' : 'happy') as AnimationState,
        duration: 600,
        isTalking: false,
        complementary: { lookDirection: line.lookDir },
      },
      {
        animation: 'talking' as AnimationState,
        duration: 1900,
        isTalking: true,
        complementary: { lookDirection: line.lookDir, mouthState: 'open' },
        textReveal: { startIndex: 0, endIndex: line.text.length },
      },
    ],
  }));

  const scene: OrchestrationScene = {
    timelines,
    sceneDuration: 9000,
    nonSpeakerBehavior: {},
  };

  const responses = lines.map((line) => ({
    characterId: line.charId,
    content: line.text,
  }));

  return { scene, responses };
}

// ============================================
// EXPORTS
// ============================================

export { buildSingleCharacterStarterPrompt, buildMultiCharacterStarterPrompt };
