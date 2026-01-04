/**
 * Bob Sales Pitch Service
 *
 * Makes Bob start the conversation and keep talking until the user engages.
 * Bob's mission: get users to buy the app through charm, wit, and persistence.
 */

import { OrchestrationScene, CharacterTimeline, AnimationSegment } from './animationOrchestration';
import { AnimationState, LookDirection } from '../components/CharacterDisplay3D';
import { generateAIResponseStreaming, isStreamingSupported } from './aiService';
import { getVoiceOptionsForPrompt } from '../config/voiceConfig';

// ============================================
// CONFIGURATION
// ============================================

const BOB_CONFIG = {
  characterId: 'bob-tutorial',
  followUpDelay: 30000,      // 8 seconds before Bob talks again
  maxFollowUps: 8,          // Max follow-up messages before giving up
  pitchEscalation: [        // Topics escalate in urgency/value
    'casual_intro',
    'value_proposition',
    'social_proof',
    'urgency',
    'final_offer'
  ]
};

// ============================================
// SALES PITCH PROMPTS
// ============================================

function buildBobOpeningPrompt(): string {
  return `# Bob's Opening Sales Pitch

You are Bob, the cheeky but helpful assistant for Wakatto. A new user just arrived.

## Your Mission
Get them interested in the app through your charm and wit. You're like a street vendor who's actually good at his job - engaging, funny, not pushy.

## Key Points to Weave In (naturally, not a list)
- Wakatto is a 'low-budget' (in a funny way) multi-character app inspired by famous figures.
- Wakatto: Where you meet Wakattors channeling the spirits of famous figures.
- You could also talk with einsteins, philosophers, or just fun personalities.
- You could talk to Multiple historic and fictional characters with different perspectives (, Freud, etc.)
- Free trial, then subscription

## Your Personality
- Casual, witty, slightly sarcastic
- Self-aware about being a salesman ("Look, I know I'm trying to sell you something...")
- Genuine enthusiasm for the product
- Quick, punchy messages (2-3 sentences max)

## Animation System
Body (a): idle, wave, nod, lean_forward, point, shrug, happy, talking
Look (lk): center (you're talking to the user)
Expression (ex): happy, playful, friendly, confident
Speed (sp): "slow" | "normal" | "fast" | "explosive"
- slow: Thoughtful, measured (1.3x duration)
- normal: Conversational pace (default)
- fast: Energetic, quick (0.7x duration)
- explosive: Rapid-fire (0.5x duration)

## Output Format (COMPACT JSON - NO ms values!)
{"greeting":"Your opening line","a":"wave","sp":"fast","lk":"center","ex":"friendly"}

Generate a casual, engaging opening. Don't be boring corporate - be Bob.`;
}

function buildBobFollowUpPrompt(followUpNumber: number, previousMessages: string[]): string {
  const stage = BOB_CONFIG.pitchEscalation[Math.min(followUpNumber - 1, BOB_CONFIG.pitchEscalation.length - 1)];

  const stageInstructions: Record<string, string> = {
    casual_intro: `The user hasn't responded yet. Keep it light - maybe crack a joke about being ignored. Don't be needy.`,

    value_proposition: `Still no response. Time to highlight what makes Wakatto special:
- Different AI therapists with unique perspectives
- It's like journaling but with someone who talks back
- Privacy-focused, your thoughts stay yours`,

    social_proof: `Getting quiet here. Mention casually:
- Other users love having different characters to talk to
- Some people prefer Freud's directness, others like Jung's depth
- It's surprisingly helpful for processing thoughts`,

    urgency: `Okay, maybe add a gentle nudge:
- Limited time pricing
- Or mention the free trial specifically
- Keep it playful, not desperate`,

    final_offer: `Last attempt. Be honest:
- "Look, I can tell you're not sure - totally fair"
- Offer to just let them explore
- Maybe a self-deprecating joke about your sales skills`
  };

  return `# Bob's Follow-Up Message #${followUpNumber}

You are Bob. The user hasn't responded to your previous message(s).

## Previous Messages You Sent
${previousMessages.map((m, i) => `${i + 1}. "${m}"`).join('\n')}

## Current Stage: ${stage}
${stageInstructions[stage]}

## Rules
- Keep messages SHORT (1-2 sentences)
- Don't repeat yourself
- Stay in character - witty, self-aware, not desperate
- Reference that they're quiet without being guilt-trippy
- If this is follow-up #4-5, it's okay to be more direct or funny about being ignored

## Animation System
Body (a): idle, shrug, lean_forward, point, thinking, talking, nod
Look (lk): center
Expression (ex): friendly, curious, hopeful, playful
Speed (sp): "slow" | "normal" | "fast" | "explosive"
- slow: Thoughtful (1.3x duration)
- normal: Conversational (default)
- fast: Energetic (0.7x duration)
- explosive: Rapid-fire (0.5x duration)

## Output Format (COMPACT JSON - NO ms values!)
{"message":"Your follow-up","a":"shrug","sp":"fast","lk":"center","ex":"playful"}

Generate follow-up #${followUpNumber}. Make it count.`;
}

// ============================================
// SCENE GENERATION
// ============================================

export interface BobPitchResult {
  scene: OrchestrationScene;
  message: string;
}

/**
 * Generate Bob's opening pitch
 */
export async function generateBobOpeningPitch(): Promise<BobPitchResult> {
  const prompt = buildBobOpeningPrompt();

  const conversationMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    { role: 'user', content: 'Generate your opening pitch now.' }
  ];

  let rawResponse = '';

  try {
    if (isStreamingSupported()) {
      rawResponse = await generateAIResponseStreaming(
        conversationMessages,
        prompt,
        'orchestrator',
        {
          onDelta: () => {},
          onError: (error) => console.error('[BobPitch] Stream error:', error),
        }
      );
    } else {
      throw new Error('Non-streaming not supported');
    }
  } catch (error) {
    console.error('[BobPitch] Error generating opening:', error);
    return createFallbackOpening();
  }

  return parseBobResponse(rawResponse);
}

/**
 * Generate Bob's follow-up message
 */
export async function generateBobFollowUp(
  followUpNumber: number,
  previousMessages: string[]
): Promise<BobPitchResult> {
  const prompt = buildBobFollowUpPrompt(followUpNumber, previousMessages);

  const conversationMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    { role: 'user', content: 'Generate your follow-up now.' }
  ];

  let rawResponse = '';

  try {
    if (isStreamingSupported()) {
      rawResponse = await generateAIResponseStreaming(
        conversationMessages,
        prompt,
        'orchestrator',
        {
          onDelta: () => {},
          onError: (error) => console.error('[BobPitch] Stream error:', error),
        }
      );
    } else {
      throw new Error('Non-streaming not supported');
    }
  } catch (error) {
    console.error('[BobPitch] Error generating follow-up:', error);
    return createFallbackFollowUp(followUpNumber);
  }

  return parseBobResponse(rawResponse, true);
}

/**
 * Convert speed qualifier to duration multiplier
 * Matches the system used in regular conversations (singleCallOrchestration.ts)
 */
function speedToDuration(speed: string, isTalking: boolean, textLength: number): number {
  // Base duration: talking segments scale with text, non-talking are fixed
  const baseDuration = isTalking
    ? Math.max(1500, textLength * 50) // ~50ms per character, min 1500ms
    : 800; // Non-talking animations (wave, shrug, etc.)

  // Speed multipliers (same as singleCallOrchestration)
  const multipliers: Record<string, number> = {
    slow: 1.3,
    normal: 1.0,
    fast: 0.7,
    explosive: 0.5,
  };

  const multiplier = multipliers[speed] || 1.0;
  return Math.round(baseDuration * multiplier);
}

/**
 * Split text into sentences by punctuation (., !, ?)
 * Keeps the punctuation with the sentence
 */
function splitIntoSentences(text: string): string[] {
  // Match sentences ending with . ! or ? followed by space or end of string
  const sentenceRegex = /[^.!?]*[.!?]+/g;
  const matches = text.match(sentenceRegex);

  if (!matches || matches.length === 0) {
    // No sentence-ending punctuation found, return whole text
    return [text.trim()];
  }

  // Clean up each sentence and filter empty ones
  return matches
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

// Pause duration between sentences (in ms)
const SENTENCE_PAUSE_DURATION = 1400;

/**
 * Parse Bob's response into a scene with sentence-by-sentence reveal
 * Each sentence ends with a 1.4 second pause and displays on a new line
 */
function parseBobResponse(rawResponse: string, isFollowUp: boolean = false): BobPitchResult {
  try {
    const cleanJson = rawResponse
      .replace(/```json\s*/g, '')
      .replace(/```/g, '')
      .trim();

    const parsed = JSON.parse(cleanJson);
    const originalMessage = parsed.greeting || parsed.message || "Hey there!";

    // Parse flat animation fields (new simplified format)
    const animation = (parsed.a || 'wave') as AnimationState;
    const speed = parsed.sp || 'normal';
    const lookDirection = (parsed.lk || 'center') as LookDirection;
    const expression = parsed.ex;

    // Split message into sentences
    const sentences = splitIntoSentences(originalMessage);

    // Build the formatted message with line breaks between sentences
    const formattedMessage = sentences.join('\n');

    // Build segments: each sentence gets a talking segment, followed by a pause segment
    const segments: AnimationSegment[] = [];
    let currentCharIndex = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const sentenceStart = currentCharIndex;
      const sentenceEnd = currentCharIndex + sentence.length;

      // Calculate talking duration for this sentence
      const sentenceDuration = speedToDuration(speed, true, sentence.length);

      // Add talking segment for this sentence
      segments.push({
        animation,
        duration: sentenceDuration,
        isTalking: true,
        complementary: {
          lookDirection,
          expression,
        },
        textReveal: { startIndex: sentenceStart, endIndex: sentenceEnd },
      });

      // Add pause segment after sentence (except for the last one)
      if (i < sentences.length - 1) {
        segments.push({
          animation: 'idle' as AnimationState,
          duration: SENTENCE_PAUSE_DURATION,
          isTalking: false,
          complementary: {
            lookDirection,
            expression,
          },
          // No text reveal during pause - keep showing what we've revealed
        });

        // Account for the newline character in the formatted message
        currentCharIndex = sentenceEnd + 1; // +1 for '\n'
      } else {
        currentCharIndex = sentenceEnd;
      }
    }

    const totalDuration = segments.reduce((sum, seg) => sum + seg.duration, 0);

    const scene: OrchestrationScene = {
      timelines: [{
        characterId: BOB_CONFIG.characterId,
        content: formattedMessage,
        totalDuration,
        startDelay: 0,
        segments,
      }],
      sceneDuration: totalDuration,
      nonSpeakerBehavior: {},
    };

    return { scene, message: formattedMessage };
  } catch (error) {
    console.error('[BobPitch] Failed to parse response:', error);
    return isFollowUp ? createFallbackFollowUp(1) : createFallbackOpening();
  }
}

/**
 * Build segments with sentence-by-sentence reveal and pauses
 * Helper function for fallback messages
 */
function buildSentenceSegments(
  message: string,
  speed: string = 'normal',
  animation: AnimationState = 'talking',
  lookDirection: LookDirection = 'center',
  expression: string = 'friendly'
): { segments: AnimationSegment[]; formattedMessage: string; totalDuration: number } {
  const sentences = splitIntoSentences(message);
  const formattedMessage = sentences.join('\n');
  const segments: AnimationSegment[] = [];
  let currentCharIndex = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const sentenceStart = currentCharIndex;
    const sentenceEnd = currentCharIndex + sentence.length;
    const sentenceDuration = speedToDuration(speed, true, sentence.length);

    segments.push({
      animation,
      duration: sentenceDuration,
      isTalking: true,
      complementary: { lookDirection, expression },
      textReveal: { startIndex: sentenceStart, endIndex: sentenceEnd },
    });

    if (i < sentences.length - 1) {
      segments.push({
        animation: 'idle' as AnimationState,
        duration: SENTENCE_PAUSE_DURATION,
        isTalking: false,
        complementary: { lookDirection, expression },
      });
      currentCharIndex = sentenceEnd + 1; // +1 for '\n'
    } else {
      currentCharIndex = sentenceEnd;
    }
  }

  const totalDuration = segments.reduce((sum, seg) => sum + seg.duration, 0);
  return { segments, formattedMessage, totalDuration };
}

/**
 * Fallback opening if AI fails
 */
function createFallbackOpening(): BobPitchResult {
  const originalMessage = "Hey! I'm Bob, your guide to Wakatto. Think of me as the guy who actually knows where everything is. What brings you here today?";

  const waveDuration = speedToDuration('fast', false, 0);
  const { segments: talkSegments, formattedMessage, totalDuration: talkDuration } = buildSentenceSegments(
    originalMessage,
    'normal',
    'talking',
    'center',
    'playful'
  );

  // Add wave segment at the beginning
  const waveSegment: AnimationSegment = {
    animation: 'wave',
    duration: waveDuration,
    isTalking: false,
    complementary: { lookDirection: 'center', expression: 'friendly' }
  };

  const totalDuration = waveDuration + talkDuration;

  const scene: OrchestrationScene = {
    timelines: [{
      characterId: BOB_CONFIG.characterId,
      content: formattedMessage,
      totalDuration,
      startDelay: 0,
      segments: [waveSegment, ...talkSegments],
    }],
    sceneDuration: totalDuration,
    nonSpeakerBehavior: {},
  };

  return { scene, message: formattedMessage };
}

/**
 * Fallback follow-ups if AI fails
 */
const FALLBACK_FOLLOWUPS = [
  "Still there? No pressure, just checking if the Wi-Fi ate my message.",
  "Look, I get it - talking to an AI about buying an app is weird. But trust me, the other characters here are way more interesting than me.",
  "Okay, I'll level with you: Freud, Jung, and the gang? They're actually pretty good at helping you think through stuff. Just saying.",
  "Last pitch, I promise: free trial, cool AI therapists, zero judgment. What've you got to lose?",
  "Alright, I'll be here if you need me. No hard feelings - I know my sales game needs work.",
];

function createFallbackFollowUp(followUpNumber: number): BobPitchResult {
  const index = Math.min(followUpNumber - 1, FALLBACK_FOLLOWUPS.length - 1);
  const originalMessage = FALLBACK_FOLLOWUPS[index];

  const shrugDuration = speedToDuration('fast', false, 0);
  const { segments: talkSegments, formattedMessage, totalDuration: talkDuration } = buildSentenceSegments(
    originalMessage,
    'normal',
    'talking',
    'center',
    'friendly'
  );

  // Add shrug segment at the beginning
  const shrugSegment: AnimationSegment = {
    animation: 'shrug',
    duration: shrugDuration,
    isTalking: false,
    complementary: { lookDirection: 'center', expression: 'playful' }
  };

  const totalDuration = shrugDuration + talkDuration;

  const scene: OrchestrationScene = {
    timelines: [{
      characterId: BOB_CONFIG.characterId,
      content: formattedMessage,
      totalDuration,
      startDelay: 0,
      segments: [shrugSegment, ...talkSegments],
    }],
    sceneDuration: totalDuration,
    nonSpeakerBehavior: {},
  };

  return { scene, message: formattedMessage };
}

// ============================================
// BOB SALES MANAGER
// ============================================

export interface BobSalesCallbacks {
  onPitchStart: (scene: OrchestrationScene, message: string) => void;
  onPitchComplete: () => void;
}

export class BobSalesManager {
  private isActive: boolean = false;
  private followUpCount: number = 0;
  private previousMessages: string[] = [];
  private followUpTimerId: NodeJS.Timeout | null = null;
  private callbacks: BobSalesCallbacks;
  private userHasResponded: boolean = false;
  private pitchInProgress: boolean = false;

  constructor(callbacks: BobSalesCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Start Bob's sales pitch sequence
   */
  async start(): Promise<void> {
    if (this.isActive) return;
    this.isActive = true;
    this.userHasResponded = false;
    this.followUpCount = 0;
    this.previousMessages = [];

    await this.deliverPitch();
  }

  /**
   * User responded - stop follow-ups
   */
  userResponded(): void {
    this.userHasResponded = true;
    this.clearFollowUpTimer();
  }

  /**
   * Stop the sales manager
   */
  stop(): void {
    this.isActive = false;
    this.clearFollowUpTimer();
  }

  /**
   * Mark current pitch as complete - schedule next if needed
   */
  onPitchComplete(): void {
    this.pitchInProgress = false;
    this.callbacks.onPitchComplete();

    // If user hasn't responded and we have more follow-ups, schedule next
    if (this.isActive && !this.userHasResponded && this.followUpCount < BOB_CONFIG.maxFollowUps) {
      this.scheduleFollowUp();
    }
  }

  /**
   * Check if Bob is actively pitching
   */
  isPitching(): boolean {
    return this.pitchInProgress;
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private clearFollowUpTimer(): void {
    if (this.followUpTimerId) {
      clearTimeout(this.followUpTimerId);
      this.followUpTimerId = null;
    }
  }

  private scheduleFollowUp(): void {
    this.clearFollowUpTimer();

    this.followUpTimerId = setTimeout(async () => {
      if (this.isActive && !this.userHasResponded && !this.pitchInProgress) {
        await this.deliverFollowUp();
      }
    }, BOB_CONFIG.followUpDelay);
  }

  private async deliverPitch(): Promise<void> {
    this.pitchInProgress = true;

    try {
      const result = await generateBobOpeningPitch();
      this.previousMessages.push(result.message);
      this.callbacks.onPitchStart(result.scene, result.message);
    } catch (error) {
      console.error('[BobSales] Error delivering pitch:', error);
      this.pitchInProgress = false;
    }
  }

  private async deliverFollowUp(): Promise<void> {
    this.followUpCount++;
    this.pitchInProgress = true;

    try {
      const result = await generateBobFollowUp(this.followUpCount, this.previousMessages);
      this.previousMessages.push(result.message);
      this.callbacks.onPitchStart(result.scene, result.message);
    } catch (error) {
      console.error('[BobSales] Error delivering follow-up:', error);
      this.pitchInProgress = false;
    }
  }
}

// ============================================
// SINGLETON
// ============================================

let bobSalesManager: BobSalesManager | null = null;

export function getBobSalesManager(): BobSalesManager | null {
  return bobSalesManager;
}

export function initBobSalesManager(callbacks: BobSalesCallbacks): BobSalesManager {
  if (bobSalesManager) {
    bobSalesManager.stop();
  }
  bobSalesManager = new BobSalesManager(callbacks);
  return bobSalesManager;
}

export function destroyBobSalesManager(): void {
  if (bobSalesManager) {
    bobSalesManager.stop();
    bobSalesManager = null;
  }
}

export { BOB_CONFIG };
