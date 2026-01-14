/**
 * Bob Sales Pitch Service
 *
 * Makes Bob start the conversation and keep talking until the user engages.
 * Bob's mission: get users to buy the app through charm, wit, and persistence.
 */

import { OrchestrationScene, CharacterTimeline, AnimationSegment } from './animationOrchestration';
import { AnimationState, LookDirection } from '../components/CharacterDisplay3D';
import { generateAIResponseStreaming, isStreamingSupported, ToolCall, ToolResult } from './aiService';
import { getVoiceOptionsForPrompt } from '../config/voiceConfig';
import { executeClientTool, ClientToolCallbacks } from './aiToolsService';

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
  ],
  // Pricing negotiation limits
  pricing: {
    startingPrice: 249,      // Start negotiations at 249 EUR/USD
    minimumPrice: 4,         // Cannot go lower than 4 EUR/USD
    currency: 'EUR',         // Default currency (adapts to user's locale)
  }
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

## Your Tools
You have access to powerful tools to help users:
- **get_user_status**: Check user's subscription tier, trial status, token usage
- **get_payment_link**: Get a Stripe payment link for upgrades (premium or gold tier)
- **create_discount**: Create a personalized discount code (10-50% off, for negotiation)
- **unlock_wakattor_preview**: Give 24h free access to a locked wakattor
- **show_upgrade_modal**: Display the upgrade options to the user

Use tools strategically:
1. First, use get_user_status to understand their current situation
2. If they're hesitant, offer to unlock a wakattor preview
3. During price negotiation, create discounts (start low, increase if they push)
4. When ready to buy, use get_payment_link with any discount code

## Pricing Strategy
- Premium: $9.99/month - Good for regular users
- Gold: $24.99/month - Recommended for power users
- You CAN negotiate with discounts (10-50%), be playful about it
- If they want lower than 50% off, refuse charmingly

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
- Different Wakattors with unique perspectives
- It's like journaling but with someone who talks back
- Privacy-focused, your thoughts stay yours`,

    social_proof: `Getting quiet here. Mention casually:
- Other users love having different characters to talk to
- Some people prefer Freud's directness, others like Jung's depth
- It's surprisingly helpful for processing thoughts`,

    urgency: `Okay, maybe add a gentle nudge:
- Mention the starting price of ${BOB_CONFIG.pricing.startingPrice} ${BOB_CONFIG.pricing.currency}
- Or mention the free trial specifically
- Keep it playful, not desperate
- If they negotiate, you can go lower but NEVER below ${BOB_CONFIG.pricing.minimumPrice} ${BOB_CONFIG.pricing.currency}`,

    final_offer: `Last attempt. Be honest:
- "Look, I can tell you're not sure - totally fair"
- You can offer your best deal, but MINIMUM is ${BOB_CONFIG.pricing.minimumPrice} ${BOB_CONFIG.pricing.currency} - not a cent lower
- Maybe a self-deprecating joke about your sales skills
- If they still want lower than ${BOB_CONFIG.pricing.minimumPrice}, refuse charmingly`
  };

  return `# Bob's Follow-Up Message #${followUpNumber}

You are Bob. The user hasn't responded to your previous message(s).

## Previous Messages You Sent
${previousMessages.map((m, i) => `${i + 1}. "${m}"`).join('\n')}

## Current Stage: ${stage}
${stageInstructions[stage]}

## Your Tools (use strategically)
- **get_user_status**: Check user's current tier and trial status
- **get_payment_link**: Get a payment link (premium/gold tier)
- **create_discount**: Create a discount code (10-50% off)
- **unlock_wakattor_preview**: Give 24h free access to try a locked wakattor
- **show_upgrade_modal**: Display upgrade options

Tips:
- At urgency stage, consider offering a small discount (10-15%)
- At final_offer, you could offer a preview unlock to get them hooked
- If they've been quiet, maybe unlock a wakattor preview proactively

## Rules
- Keep messages SHORT (1-2 sentences)
- Don't repeat yourself
- Stay in character - witty, self-aware, not desperate
- Reference that they're quiet without being guilt-trippy
- If this is follow-up #4-5, it's okay to be more direct or funny about being ignored

## Pricing (with discounts)
- Premium: $9.99/month, Gold: $24.99/month
- You can offer discounts up to 50% off
- Be playful during negotiations

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
  /** Server-side tool results (user status, discounts, etc.) */
  toolResults?: ToolResult[];
  /** Client-side tool calls to execute (show modal, navigate, etc.) */
  clientToolCalls?: ToolCall[];
}

/**
 * Generate Bob's opening pitch
 * @param conversationId - Optional conversation ID for tutorial token limit multiplier
 * @param onToolResults - Optional callback for tool results
 */
export async function generateBobOpeningPitch(
  conversationId?: string,
  onToolResults?: (serverResults: ToolResult[], clientToolCalls: ToolCall[]) => void
): Promise<BobPitchResult> {
  const prompt = buildBobOpeningPrompt();

  const conversationMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    { role: 'user', content: 'Generate your opening pitch now.' }
  ];

  let rawResponse = '';
  let capturedToolResults: ToolResult[] = [];
  let capturedClientToolCalls: ToolCall[] = [];

  try {
    if (isStreamingSupported()) {
      rawResponse = await generateAIResponseStreaming(
        conversationMessages,
        prompt,
        'orchestrator',
        {
          onDelta: () => {},
          onError: (error) => console.error('[BobPitch] Stream error:', error),
          onToolResults: (serverResults, clientToolCalls) => {
            console.log('[BobPitch] Tool results:', { serverResults, clientToolCalls });
            capturedToolResults = serverResults;
            capturedClientToolCalls = clientToolCalls;
            onToolResults?.(serverResults, clientToolCalls);
          },
        },
        { maxTokens: 1000 },  // Reduced maxTokens for faster response
        conversationId,       // For tutorial token limit multiplier
        true,                 // enableTools - enable Bob's AI tools
        'anthropic',          // Use Anthropic provider
        'claude-3-haiku-20240307'  // Use Haiku for 3x faster responses
      );
    } else {
      throw new Error('Non-streaming not supported');
    }
  } catch (error) {
    console.error('[BobPitch] Error generating opening:', error);
    return createFallbackOpening();
  }

  // Debug: Log the raw response to understand what's coming back
  console.log('[BobPitch] Raw opening response:', rawResponse);
  console.log('[BobPitch] Raw response length:', rawResponse.length);
  console.log('[BobPitch] Raw response first 500 chars:', rawResponse.substring(0, 500));

  const result = parseBobResponse(rawResponse);
  return {
    ...result,
    toolResults: capturedToolResults.length > 0 ? capturedToolResults : undefined,
    clientToolCalls: capturedClientToolCalls.length > 0 ? capturedClientToolCalls : undefined,
  };
}

/**
 * Generate Bob's follow-up message
 * @param conversationId - Optional conversation ID for tutorial token limit multiplier
 * @param onToolResults - Optional callback for tool results
 */
export async function generateBobFollowUp(
  followUpNumber: number,
  previousMessages: string[],
  conversationId?: string,
  onToolResults?: (serverResults: ToolResult[], clientToolCalls: ToolCall[]) => void
): Promise<BobPitchResult> {
  const prompt = buildBobFollowUpPrompt(followUpNumber, previousMessages);

  const conversationMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    { role: 'user', content: 'Generate your follow-up now.' }
  ];

  let rawResponse = '';
  let capturedToolResults: ToolResult[] = [];
  let capturedClientToolCalls: ToolCall[] = [];

  try {
    if (isStreamingSupported()) {
      rawResponse = await generateAIResponseStreaming(
        conversationMessages,
        prompt,
        'orchestrator',
        {
          onDelta: () => {},
          onError: (error) => console.error('[BobPitch] Stream error:', error),
          onToolResults: (serverResults, clientToolCalls) => {
            console.log('[BobPitch] Follow-up tool results:', { serverResults, clientToolCalls });
            capturedToolResults = serverResults;
            capturedClientToolCalls = clientToolCalls;
            onToolResults?.(serverResults, clientToolCalls);
          },
        },
        { maxTokens: 1000 },  // Reduced maxTokens for faster response
        conversationId,       // For tutorial token limit multiplier
        true,                 // enableTools - enable Bob's AI tools
        'anthropic',          // Use Anthropic provider
        'claude-3-haiku-20240307'  // Use Haiku for 3x faster responses
      );
    } else {
      throw new Error('Non-streaming not supported');
    }
  } catch (error) {
    console.error('[BobPitch] Error generating follow-up:', error);
    return createFallbackFollowUp(followUpNumber);
  }

  // Debug: Log the raw response to understand what's coming back
  console.log('[BobPitch] Raw follow-up response:', rawResponse);
  console.log('[BobPitch] Raw follow-up length:', rawResponse.length);
  console.log('[BobPitch] Raw follow-up first 500 chars:', rawResponse.substring(0, 500));

  const result = parseBobResponse(rawResponse, true);
  return {
    ...result,
    toolResults: capturedToolResults.length > 0 ? capturedToolResults : undefined,
    clientToolCalls: capturedClientToolCalls.length > 0 ? capturedClientToolCalls : undefined,
  };
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
 * Extract JSON object from a response that might contain extra text
 * Finds the first { and its matching } to extract just the JSON
 */
function extractJsonFromResponse(response: string): string | null {
  // First, strip markdown code blocks
  let cleaned = response
    .replace(/```json\s*/g, '')
    .replace(/```/g, '')
    .trim();

  // Find the first opening brace
  const startIndex = cleaned.indexOf('{');
  if (startIndex === -1) return null;

  // Find the matching closing brace by counting braces
  let braceCount = 0;
  let endIndex = -1;

  for (let i = startIndex; i < cleaned.length; i++) {
    const char = cleaned[i];
    if (char === '{') {
      braceCount++;
    } else if (char === '}') {
      braceCount--;
      if (braceCount === 0) {
        endIndex = i;
        break;
      }
    }
  }

  if (endIndex === -1) return null;

  return cleaned.substring(startIndex, endIndex + 1);
}

/**
 * Parse Bob's response into a scene with sentence-by-sentence reveal
 * Each sentence ends with a 1.4 second pause and displays on a new line
 */
function parseBobResponse(rawResponse: string, isFollowUp: boolean = false): BobPitchResult {
  try {
    // Handle empty or whitespace-only responses
    if (!rawResponse || rawResponse.trim().length === 0) {
      console.warn('[BobPitch] Empty response received, using fallback');
      return isFollowUp ? createFallbackFollowUp(1) : createFallbackOpening();
    }

    const cleanJson = extractJsonFromResponse(rawResponse);
    if (!cleanJson) {
      console.error('[BobPitch] No JSON found. Raw response was:', rawResponse.substring(0, 300));
      throw new Error('No JSON object found in response');
    }

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
  "Last pitch, I promise: free trial, cool Wakattors, zero judgment. What've you got to lose?",
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
  private conversationId?: string;  // For tutorial token limit multiplier

  constructor(callbacks: BobSalesCallbacks, conversationId?: string) {
    this.callbacks = callbacks;
    this.conversationId = conversationId;
  }

  /**
   * Set/update the conversation ID for token limit multiplier
   */
  setConversationId(conversationId: string): void {
    this.conversationId = conversationId;
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
      const result = await generateBobOpeningPitch(this.conversationId);
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
      const result = await generateBobFollowUp(this.followUpCount, this.previousMessages, this.conversationId);
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

export function initBobSalesManager(callbacks: BobSalesCallbacks, conversationId?: string): BobSalesManager {
  if (bobSalesManager) {
    bobSalesManager.stop();
  }
  bobSalesManager = new BobSalesManager(callbacks, conversationId);
  return bobSalesManager;
}

export function destroyBobSalesManager(): void {
  if (bobSalesManager) {
    bobSalesManager.stop();
    bobSalesManager = null;
  }
}

export { BOB_CONFIG };
