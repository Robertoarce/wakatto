/**
 * Bob Premium Pitch Service
 *
 * Handles the special "Become Premium" flow where Bob turns around
 * dramatically and delivers a premium pitch with payment options.
 */

import { OrchestrationScene, AnimationSegment } from './animationOrchestration';
import { AnimationState, LookDirection } from '../components/CharacterDisplay3D';

// ============================================
// CONFIGURATION
// ============================================

const BOB_CHARACTER_ID = 'bob-tutorial';

// Premium tier options matching UpgradePromptModal
export interface PremiumTierOption {
  tier: 'premium' | 'gold';
  name: string;
  price: string;
  features: string[];
  recommended?: boolean;
}

export const PREMIUM_TIER_OPTIONS: PremiumTierOption[] = [
  {
    tier: 'premium',
    name: 'Premium',
    price: '$9.99/mo',
    features: ['5x more tokens', 'Priority support', 'Advanced features'],
  },
  {
    tier: 'gold',
    name: 'Gold',
    price: '$24.99/mo',
    features: ['20x more tokens', 'Premium support', 'All features', 'Early access'],
    recommended: true,
  },
];

// ============================================
// PREMIUM PITCH MESSAGE
// ============================================

const PREMIUM_PITCH_MESSAGE = `Hey! Yeah... awesome!
So you want the full experience, huh?
Here's what we've got for you:`;

// Special marker to indicate payment buttons should be rendered
export const PAYMENT_BUTTONS_MARKER = '[[PAYMENT_BUTTONS]]';

// Full message with marker for payment buttons
const PREMIUM_PITCH_WITH_BUTTONS = `${PREMIUM_PITCH_MESSAGE}
${PAYMENT_BUTTONS_MARKER}`;

// ============================================
// ANIMATION TIMING
// ============================================

const TURN_AROUND_DURATION = 1200;   // Time for Bob to turn from 'away' to 'center'
const WAVE_DURATION = 800;           // Wave animation duration
const TALKING_SPEED_MS_PER_CHAR = 50; // 50ms per character when talking
const MIN_TALKING_DURATION = 1500;   // Minimum talking duration
const SENTENCE_PAUSE_DURATION = 1200; // Pause between sentences

// ============================================
// SCENE GENERATION
// ============================================

export interface PremiumPitchResult {
  scene: OrchestrationScene;
  message: string;
  paymentOptions: PremiumTierOption[];
}

/**
 * Split text into sentences by punctuation (., !, ?)
 */
function splitIntoSentences(text: string): string[] {
  const sentenceRegex = /[^.!?]*[.!?]+/g;
  const matches = text.match(sentenceRegex);
  
  if (!matches || matches.length === 0) {
    return [text.trim()];
  }
  
  return matches
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Calculate talking duration based on text length
 */
function calculateTalkingDuration(text: string): number {
  return Math.max(MIN_TALKING_DURATION, text.length * TALKING_SPEED_MS_PER_CHAR);
}

/**
 * Generate the premium pitch scene with turn-around animation
 * 
 * Animation sequence:
 * 1. Bob starts facing away (lookDirection: 'away')
 * 2. Bob turns around to face user (transition to 'center') with surprise/wave
 * 3. Bob delivers the pitch message sentence by sentence
 * 4. Payment buttons are rendered in the message
 */
export function generatePremiumPitchScene(): PremiumPitchResult {
  const segments: AnimationSegment[] = [];
  
  // Split pitch into sentences (excluding the button marker)
  const sentences = splitIntoSentences(PREMIUM_PITCH_MESSAGE);
  
  // Segment 1: Bob is facing away, brief pause for dramatic effect
  segments.push({
    animation: 'idle' as AnimationState,
    duration: 600,
    isTalking: false,
    complementary: {
      lookDirection: 'away' as LookDirection,
      eyeState: 'open',
    },
  });
  
  // Segment 2: Bob starts turning around (still 'away' but animating)
  segments.push({
    animation: 'surprise_jump' as AnimationState,
    duration: TURN_AROUND_DURATION,
    isTalking: false,
    complementary: {
      lookDirection: 'center' as LookDirection, // Smoothly transitions due to lerp
      eyeState: 'wide',
      eyebrowState: 'raised',
      mouthState: 'surprised',
    },
  });
  
  // Segment 3: Wave while facing center
  segments.push({
    animation: 'wave' as AnimationState,
    duration: WAVE_DURATION,
    isTalking: false,
    complementary: {
      lookDirection: 'center' as LookDirection,
      eyeState: 'open',
      mouthState: 'smile',
    },
  });
  
  // Build the formatted message with line breaks between sentences
  // Include the payment buttons marker at the end
  const formattedMessage = sentences.join('\n') + '\n' + PAYMENT_BUTTONS_MARKER;
  
  // Track character indices for text reveal
  let currentCharIndex = 0;
  
  // Segments 4+: Talking segments for each sentence
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const sentenceStart = currentCharIndex;
    const sentenceEnd = currentCharIndex + sentence.length;
    const sentenceDuration = calculateTalkingDuration(sentence);
    
    // Talking segment
    segments.push({
      animation: 'talking' as AnimationState,
      duration: sentenceDuration,
      isTalking: true,
      complementary: {
        lookDirection: 'center' as LookDirection,
        eyeState: 'open',
        mouthState: 'smile',
      },
      textReveal: { startIndex: sentenceStart, endIndex: sentenceEnd },
    });
    
    // Pause between sentences (except for the last one)
    if (i < sentences.length - 1) {
      segments.push({
        animation: 'idle' as AnimationState,
        duration: SENTENCE_PAUSE_DURATION,
        isTalking: false,
        complementary: {
          lookDirection: 'center' as LookDirection,
          mouthState: 'slight_smile',
        },
      });
      
      // Account for the newline character
      currentCharIndex = sentenceEnd + 1;
    } else {
      currentCharIndex = sentenceEnd;
    }
  }
  
  // Final segment: Reveal the payment buttons marker and hold
  const markerStart = currentCharIndex + 1; // +1 for newline before marker
  const markerEnd = markerStart + PAYMENT_BUTTONS_MARKER.length;
  
  segments.push({
    animation: 'idle' as AnimationState,
    duration: 500,
    isTalking: false,
    complementary: {
      lookDirection: 'center' as LookDirection,
      eyeState: 'soft',
      mouthState: 'slight_smile',
      eyebrowState: 'slightly_raised',
    },
    textReveal: { startIndex: markerStart, endIndex: markerEnd },
  });
  
  const totalDuration = segments.reduce((sum, seg) => sum + seg.duration, 0);
  
  const scene: OrchestrationScene = {
    timelines: [{
      characterId: BOB_CHARACTER_ID,
      content: formattedMessage,
      totalDuration,
      startDelay: 0,
      segments,
    }],
    sceneDuration: totalDuration,
    nonSpeakerBehavior: {},
  };
  
  return {
    scene,
    message: formattedMessage,
    paymentOptions: PREMIUM_TIER_OPTIONS,
  };
}

/**
 * Check if a message contains payment buttons marker
 */
export function hasPaymentButtons(message: string): boolean {
  return message.includes(PAYMENT_BUTTONS_MARKER);
}

/**
 * Extract display text from message (without the marker)
 */
export function getDisplayMessage(message: string): string {
  return message.replace(PAYMENT_BUTTONS_MARKER, '').trim();
}

