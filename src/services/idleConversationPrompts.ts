/**
 * Idle Conversation Prompts
 *
 * Contains topic pools and prompt templates for generating character-to-character
 * conversations when the user is idle.
 */

import { getCharacter } from '../config/characters';
import { OrchestrationScene, CharacterTimeline, AnimationSegment, parseOrchestrationScene } from './animationOrchestration';
import { AnimationState } from '../components/CharacterDisplay3D';
import { generateAIResponseStreaming, isStreamingSupported } from './aiService';
import { getVoiceOptionsForPrompt } from '../config/voiceConfig';

// ============================================
// TOPIC POOLS
// ============================================

/**
 * Gossip and story starters - these lead to longer, more engaging conversations
 */
const GOSSIP_STARTERS = [
  "Dude, you would NOT believe who I saw at the grocery store yesterday...",
  "Okay so I wasn't going to say anything but... I heard something WILD about one of our colleagues",
  "Wait wait wait - did you hear what happened at the psychology conference last week?",
  "So I was at this coffee shop right, and guess who walks in looking completely disheveled...",
  "I probably shouldn't tell you this but... I saw someone's browser history and OH MY GOD",
  "Okay promise you won't tell anyone but I overheard the JUICIEST conversation...",
  "You're never gonna guess what I found in my old office when I was cleaning...",
  "So remember that patient everyone thought was 'cured'? Yeah well guess what...",
  "I ran into your old rival at a party and they said THE most ridiculous thing about you",
  "Okay so hypothetically... if someone accidentally sent an email to the wrong person...",
];

/**
 * Fun debate topics that naturally lead to back-and-forth
 */
const DEBATE_TOPICS = [
  "I've been thinking... is a hot dog a sandwich? This is important.",
  "Okay settle this for me - is it okay to recline your seat on an airplane?",
  "Here's a question that's been keeping me up at night - do we have free will or not?",
  "I need your honest opinion... is my beard/hairstyle outdated?",
  "Real talk - whose psychological theory is actually more useful in the real world?",
  "Be honest with me - do you think I come across as pretentious in my writings?",
  "I've always wondered... do you actually BELIEVE everything you wrote, or were you just trying to be provocative?",
  "Let's play a game - if we had to swap theories for a week, could you actually do it?",
];

/**
 * Personal stories and memories
 */
const PERSONAL_STORIES = [
  "You know what I was just remembering? That absolutely DISASTROUS lecture I gave in Vienna...",
  "I never told anyone this, but there was this one patient who completely changed how I see everything...",
  "So there's this recurring dream I keep having and honestly it's starting to freak me out...",
  "I found my old journal from when I was just starting out... SO embarrassing",
  "Remember when we used to argue about everything? I kind of miss those days actually...",
  "I've been meaning to ask you - what did you REALLY think when you first read my work?",
  "Can I confess something? Sometimes I wonder if I got it all wrong...",
  "The other day I was people-watching and I saw this couple that reminded me of a case...",
];

/**
 * Get a random conversation starter
 */
function getRandomStarter(): string {
  const allStarters = [...GOSSIP_STARTERS, ...DEBATE_TOPICS, ...PERSONAL_STORIES];
  return allStarters[Math.floor(Math.random() * allStarters.length)];
}

// ============================================
// PROMPT BUILDING
// ============================================

/**
 * Build the LLM prompt for an idle conversation between characters
 */
export function buildIdleConversationPrompt(
  selectedCharacters: string[],
  conversationNumber: number
): string {
  const starter = getRandomStarter();

  // Build character profiles with positions
  const characterProfiles = selectedCharacters.map((charId, index) => {
    const character = getCharacter(charId);
    const pos = index === 0 ? 'L (left)' : index === 1 ? 'C (center)' : 'R (right)';

    return `### ${character.name} (${charId}, Position: ${pos})
${character.description}`;
  }).join('\n\n');

  return `# Secret Character Conversation - LONG GOSSIP SESSION

You are generating a SECRET, EXTENDED conversation between characters who think the user isn't watching.
They're having a genuine heart-to-heart, gossiping, debating, and being their authentic selves.

## CONVERSATION STYLE
- This is like overhearing two friends at a bar - LONG, meandering, entertaining
- They gossip, tease each other, share stories, change subjects naturally
- They reference their own theories, famous quotes, and history in casual/funny ways
- They can get excited, interrupt each other, go on tangents, then come back
- Include reactions like "No way!", "Wait what?!", "Oh come ON", "Okay but seriously though..."

## CRITICAL RULES
1. Characters talk TO EACH OTHER, not to the user - they think no one is watching!
2. **GENERATE 12-20 EXCHANGES** - this should be a LONG conversation (60-120 seconds total)
3. Start with the provided conversation starter, then let it evolve naturally
4. The conversation should shift through 2-3 different sub-topics organically
5. Each character MUST face the other using lookDirection:
   - LEFT position character: look "at_right_character"
   - RIGHT position character: look "at_left_character"
   - CENTER position: look at whoever they're addressing
6. Natural timing: 1500-3000ms pauses between turns (startDelay)
7. Use expressive animations - laugh, facepalm, lean_forward, cross_arms, shrug, etc.

## CONVERSATION STARTER (First character opens with this or similar):
"${starter}"

## Characters
${characterProfiles}

## Animation System
Body: idle,thinking,talking,confused,happy,excited,winning,jump,surprise_jump,surprise_happy,lean_back,lean_forward,cross_arms,nod,shake_head,shrug,wave,point,clap,bow,facepalm,dance,laugh,cry,angry,nervous,celebrate,peek
Look: center,left,right,up,down,at_left_character,at_right_character
Eye: open,closed,wink_left,wink_right,blink | Eyebrow: normal,raised,furrowed,sad,worried,one_raised
Mouth: closed,open,smile,wide_smile,surprised | Face: normal,blush,sweat_drop,sparkle_eyes

## Voice (optional "v" object per segment)
${getVoiceOptionsForPrompt()}

## Output Format (COMPACT JSON)
Use short keys: s=scene, dur=totalDuration, ch=characters, c=character, t=content, d=startDelay, tl=timeline, a=animation, ms=duration, lk=look, ey=eyes, eb=eyebrow, m=mouth, talking=true when speaking

EXAMPLE STRUCTURE (showing variety - your conversation should be LONGER with 12-20 exchanges):
{"s":{"dur":75000,"ch":[
{"c":"freud","t":"Dude, you would NOT believe who I saw at the grocery store yesterday...","d":0,"tl":[{"a":"lean_forward","ms":400,"lk":"at_right_character","eb":"raised"},{"a":"talking","ms":3500,"talking":true,"lk":"at_right_character"}]},
{"c":"jung","t":"Who? Don't leave me hanging!","d":4500,"tl":[{"a":"excited","ms":300,"lk":"at_left_character"},{"a":"talking","ms":1800,"talking":true,"lk":"at_left_character"}]},
{"c":"freud","t":"Remember that patient who kept insisting his mother was actually a lamp? THAT guy.","d":7000,"tl":[{"a":"talking","ms":4000,"talking":true,"lk":"at_right_character"}]},
{"c":"jung","t":"NO. What was he buying?","d":11500,"tl":[{"a":"surprise_jump","ms":400,"lk":"at_left_character"},{"a":"talking","ms":1500,"talking":true,"lk":"at_left_character"}]},
{"c":"freud","t":"Lightbulbs. I am NOT joking. An entire cart full of lightbulbs.","d":14000,"tl":[{"a":"facepalm","ms":600,"lk":"at_right_character"},{"a":"talking","ms":3200,"talking":true,"lk":"at_right_character"}]},
{"c":"jung","t":"Oh my god. Okay but honestly? That's kind of poetic in a weird way.","d":18500,"tl":[{"a":"laugh","ms":800,"lk":"at_left_character"},{"a":"talking","ms":3500,"talking":true,"lk":"at_left_character","m":"smile"}]},
{"c":"freud","t":"Don't you DARE try to find meaning in that. Not everything is an archetype.","d":23500,"tl":[{"a":"cross_arms","ms":500,"lk":"at_right_character","eb":"furrowed"},{"a":"talking","ms":3500,"talking":true,"lk":"at_right_character"}]},
{"c":"jung","t":"Speaking of which... okay this is totally unrelated but I've been meaning to ask you something.","d":28500,"tl":[{"a":"thinking","ms":600,"lk":"at_left_character"},{"a":"talking","ms":4500,"talking":true,"lk":"at_left_character"}]}
]}}
(Continue for 12-20 total exchanges!)

## Important
- Character ID in "c" field (like "freud"), NOT display name
- No "Freud:" prefixes in the text - just dialogue
- Make it feel REAL and LONG - like eavesdropping on actual friends
- Include emotional variety: laughing, getting defensive, being surprised, teasing
- Let the conversation BREATHE - natural pauses, reactions, topic shifts

Generate the full secret conversation now (12-20 exchanges, 60-120 seconds total).`;
}

// ============================================
// SCENE GENERATION
// ============================================

/**
 * Generate an idle conversation scene
 */
export async function generateIdleConversationScene(
  selectedCharacters: string[],
  conversationNumber: number
): Promise<OrchestrationScene> {
  console.log('[IdlePrompts] Generating idle conversation', conversationNumber, 'for', selectedCharacters);

  const prompt = buildIdleConversationPrompt(selectedCharacters, conversationNumber);

  // Anthropic API requires at least one user message - use a trigger message
  const conversationMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    { role: 'user', content: 'Generate the secret conversation between the characters now.' }
  ];

  let rawResponse = '';

  try {
    console.log('[IdlePrompts] Checking streaming support...');
    if (isStreamingSupported()) {
      console.log('[IdlePrompts] Streaming supported, calling AI...');
      rawResponse = await generateAIResponseStreaming(
        conversationMessages,
        prompt,
        'orchestrator', // Use standard orchestrator character type
        {
          onStart: () => console.log('[IdlePrompts] Stream started'),
          onDelta: (delta, accumulated) => {
            // Log progress every 500 chars
            if (accumulated.length % 500 < 50) {
              console.log('[IdlePrompts] Accumulated', accumulated.length, 'chars');
            }
          },
          onDone: (fullText, durationMs) => {
            console.log('[IdlePrompts] Stream complete in', durationMs.toFixed(0), 'ms, length:', fullText.length);
          },
          onError: (error) => {
            console.error('[IdlePrompts] Stream error:', error);
          },
        }
      );
      console.log('[IdlePrompts] AI call completed, response length:', rawResponse.length);
    } else {
      console.warn('[IdlePrompts] Streaming NOT supported!');
      throw new Error('Non-streaming not implemented for idle conversations');
    }
  } catch (error) {
    console.error('[IdlePrompts] Error generating idle conversation:', error);
    // Return a fallback scene
    return createFallbackIdleScene(selectedCharacters);
  }

  console.log('[IdlePrompts] Raw response (first 1000 chars):', rawResponse.substring(0, 1000));

  // Parse the response
  let scene = parseOrchestrationScene(rawResponse, selectedCharacters);

  if (!scene) {
    console.warn('[IdlePrompts] Failed to parse scene, raw response was:', rawResponse.substring(0, 500));
    console.warn('[IdlePrompts] Using fallback scene');
    return createFallbackIdleScene(selectedCharacters);
  }

  // Ensure all characters face each other (validation)
  scene = enforceCharacterFacing(scene, selectedCharacters);

  console.log('[IdlePrompts] Scene generated with', scene.timelines.length, 'timelines, duration:', scene.sceneDuration, 'ms');

  return scene;
}

/**
 * Enforce that characters face each other based on their positions
 */
function enforceCharacterFacing(
  scene: OrchestrationScene,
  selectedCharacters: string[]
): OrchestrationScene {
  const characterPositions: Record<string, 'left' | 'center' | 'right'> = {};
  selectedCharacters.forEach((charId, index) => {
    characterPositions[charId] = index === 0 ? 'left' : index === selectedCharacters.length - 1 ? 'right' : 'center';
  });

  // Update each timeline to ensure proper facing
  scene.timelines = scene.timelines.map(timeline => {
    const position = characterPositions[timeline.characterId];
    const defaultLook = position === 'left' ? 'at_right_character' :
                       position === 'right' ? 'at_left_character' : 'at_right_character';

    timeline.segments = timeline.segments.map(segment => {
      // If no look direction specified, set default based on position
      if (!segment.complementary?.lookDirection) {
        segment.complementary = {
          ...segment.complementary,
          lookDirection: defaultLook as any
        };
      }
      return segment;
    });

    return timeline;
  });

  return scene;
}

/**
 * Create a simple fallback scene if generation fails
 */
function createFallbackIdleScene(selectedCharacters: string[]): OrchestrationScene {
  const fallbackLines = [
    { text: "So... nice weather we're having.", animation: 'idle' as AnimationState },
    { text: "Indeed. Very... weather-like.", animation: 'nod' as AnimationState },
  ];

  const timelines: CharacterTimeline[] = selectedCharacters.slice(0, 2).map((charId, index) => {
    const line = fallbackLines[index % fallbackLines.length];
    const isLeft = index === 0;
    const lookDirection = isLeft ? 'at_right_character' : 'at_left_character';

    return {
      characterId: charId,
      content: line.text,
      totalDuration: 3000,
      startDelay: index * 4000,
      segments: [
        {
          animation: line.animation,
          duration: 800,
          isTalking: false,
          complementary: { lookDirection: lookDirection as any }
        },
        {
          animation: 'talking' as AnimationState,
          duration: 2200,
          isTalking: true,
          textReveal: { startIndex: 0, endIndex: line.text.length },
          complementary: { lookDirection: lookDirection as any, mouthState: 'open' }
        }
      ]
    };
  });

  return {
    timelines,
    sceneDuration: 8000,
    nonSpeakerBehavior: {}
  };
}

// ============================================
// EXPORTS
// ============================================

export {
  GOSSIP_STARTERS,
  DEBATE_TOPICS,
  PERSONAL_STORIES,
  getRandomStarter,
};
