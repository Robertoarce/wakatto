/**
 * Animation Orchestration System
 * 
 * Provides types, parsing, validation, and gap-filling for LLM-generated
 * multi-character animation timelines.
 */

import {
  AnimationState,
  LookDirection,
  EyeState,
  EyebrowState,
  MouthState,
  FaceState,
  NoseState,
  CheekState,
  ForeheadState,
  JawState,
  VisualEffect,
  ComplementaryAnimation
} from '../components/CharacterDisplay3D';
import { getCharacter } from '../config/characters';
import { SegmentVoice, parseSegmentVoice } from '../config/voiceConfig';
import { resolveEffect } from './emojiAnimations';

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Single animation segment within a character's timeline
 */
export interface AnimationSegment {
  animation: AnimationState;
  duration: number; // Milliseconds
  complementary?: {
    lookDirection?: LookDirection;
    eyeState?: EyeState;
    eyebrowState?: EyebrowState;
    mouthState?: MouthState;
    faceState?: FaceState;
    effect?: VisualEffect;
    speed?: number;
    // Blink timing (only used when eyeState is 'blink')
    blinkDuration?: number; // seconds for one blink (default 0.2)
    blinkPeriod?: number; // seconds between blinks (default 2.5)
  };
  isTalking?: boolean;
  textReveal?: {
    startIndex: number;
    endIndex: number;
  };
  voice?: SegmentVoice; // Voice characteristics for this segment (pitch, tone, volume, pace, mood, intent)
  actionText?: string; // Comic-style action text like "slams hand on table" (extracted from *asterisks*)
}

/**
 * Full character timeline for one response
 */
export interface CharacterTimeline {
  characterId: string;
  content: string;
  totalDuration: number;
  segments: AnimationSegment[];
  startDelay: number; // Ms delay before this character starts
  isInterruption?: boolean; // If true, this timeline can overlap with previous
}

/**
 * Complete orchestrated scene with all characters
 */
export interface OrchestrationScene {
  timelines: CharacterTimeline[];
  sceneDuration: number;
  nonSpeakerBehavior: {
    [characterId: string]: AnimationSegment[];
  };
}

/**
 * Current animation state for a character (used by playback engine)
 */
export interface CharacterAnimationState {
  characterId: string;
  animation: AnimationState;
  complementary: ComplementaryAnimation;
  isTalking: boolean;
  revealedText: string;
  isActive: boolean; // Whether character has started their timeline
  isComplete: boolean; // Whether character has finished their timeline
}

/**
 * Raw LLM response format for a single character
 */
interface LLMCharacterResponse {
  character: string;
  content: string;
  startDelay: number;
  interrupts?: boolean; // If true, this character is interrupting the previous speaker
  timeline: Array<{
    animation: string;
    duration: number;
    look?: string;
    eyes?: string;
    eyebrow?: string;
    mouth?: string;
    face?: string;
    effect?: string;
    talking?: boolean;
    textRange?: [number, number];
    voice?: any; // Voice parameters (parsed via parseSegmentVoice)
    v?: any; // Compact voice parameters
  }>;
}

/**
 * ARQ (Attentive Reasoning Query) reasoning from LLM
 * Used for enforcement and debugging
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
 * Raw LLM response format for the entire scene
 */
interface LLMSceneResponse {
  reasoning?: ARQReasoning;
  scene: {
    totalDuration: number;
    characters: LLMCharacterResponse[];
  };
}

// ============================================
// CONSTANTS
// ============================================

// Valid animation states (must match AnimationState type)
const VALID_ANIMATIONS: AnimationState[] = [
  // Core animations
  'idle', 'thinking', 'talking', 'confused', 'happy', 'excited',
  'winning', 'walking', 'jump', 'surprise_jump', 'surprise_happy',
  'lean_back', 'lean_forward', 'cross_arms', 'nod', 'shake_head',
  'shrug', 'wave', 'point', 'clap', 'bow',
  // Expressive animations
  'facepalm', 'dance', 'laugh', 'cry', 'angry', 'nervous',
  'celebrate', 'peek', 'doze', 'stretch',
  // Idle animations
  'kick_ground', 'meh', 'foot_tap', 'look_around', 'yawn',
  'fidget', 'rub_eyes', 'weight_shift',
  // Processing/thinking animations
  'head_tilt', 'chin_stroke'
];

const VALID_LOOK_DIRECTIONS: LookDirection[] = [
  'center', 'left', 'right', 'up', 'down', 'at_left_character', 'at_right_character'
];

const VALID_EYE_STATES: EyeState[] = [
  'open', 'closed', 'wink_left', 'wink_right', 'blink', 'surprised_blink',
  // NEW:
  'wide', 'narrow', 'soft', 'half_closed', 'tearful'
];

const VALID_EYEBROW_STATES: EyebrowState[] = [
  'normal', 'raised', 'furrowed', 'sad', 'worried', 'one_raised', 'wiggle',
  // NEW:
  'asymmetrical', 'slightly_raised', 'deeply_furrowed', 'arched_high', 'relaxed_upward'
];

const VALID_MOUTH_STATES: MouthState[] = [
  'closed', 'open', 'smile', 'wide_smile', 'surprised',
  // NEW:
  'smirk', 'slight_smile', 'pout', 'grimace', 'tense', 'pursed', 'teeth_showing', 'big_grin', 'o_shape'
];

const VALID_FACE_STATES: FaceState[] = [
  'normal', 'sweat_drop', 'sparkle_eyes', 'heart_eyes',
  'spiral_eyes', 'tears', 'anger_vein', 'shadow_face'
  // NOTE: 'blush' migrated to CheekState as 'flushed'
];

// NEW: Nose states
const VALID_NOSE_STATES: NoseState[] = [
  'neutral', 'wrinkled', 'flared', 'twitching'
];

// NEW: Cheek states (migrated 'blush' from FaceState)
const VALID_CHEEK_STATES: CheekState[] = [
  'neutral', 'flushed', 'sunken', 'puffed', 'dimpled'
];

// NEW: Forehead states
const VALID_FOREHEAD_STATES: ForeheadState[] = [
  'smooth', 'wrinkled', 'tense', 'raised'
];

// NEW: Jaw states
const VALID_JAW_STATES: JawState[] = [
  'relaxed', 'clenched', 'protruding', 'slack'
];

const VALID_EFFECTS: VisualEffect[] = [
  'none', 'confetti', 'spotlight', 'sparkles', 'hearts',
  // New emoji-triggered effects
  'fire', 'stars', 'music_notes', 'tears', 'anger', 'snow', 'rainbow'
];

// ============================================
// EXPRESSION PRESETS (Compiled face combinations)
// ============================================

/**
 * Expression presets - pre-compiled combinations of eye, eyebrow, mouth, etc.
 * LLM uses "ex":"joyful" instead of manually specifying each state
 * Individual states can still override: "ex":"joyful","m":"smirk"
 */
export interface ExpressionPreset {
  ey?: EyeState;
  eb?: EyebrowState;
  m?: MouthState;
  fc?: FaceState;
  n?: NoseState;
  ck?: CheekState;
  fh?: ForeheadState;
  j?: JawState;
}

export const EXPRESSION_PRESETS: Record<string, ExpressionPreset> = {
  // Positive emotions
  joyful: { ey: 'wide', eb: 'relaxed_upward', m: 'big_grin', ck: 'flushed' },
  happy: { ey: 'soft', eb: 'relaxed_upward', m: 'smile', ck: 'dimpled' },
  excited: { ey: 'wide', eb: 'raised', m: 'big_grin', ck: 'flushed' },
  loving: { ey: 'soft', m: 'smile', fc: 'heart_eyes', ck: 'flushed' },
  proud: { ey: 'soft', eb: 'slightly_raised', m: 'slight_smile', fh: 'raised' },
  playful: { ey: 'wink_left', eb: 'one_raised', m: 'smirk' },
  amused: { ey: 'soft', eb: 'one_raised', m: 'smirk' },

  // Negative emotions
  sad: { ey: 'tearful', eb: 'sad', m: 'pout' },
  angry: { ey: 'narrow', eb: 'furrowed', m: 'tense', n: 'flared', j: 'clenched', fc: 'anger_vein' },
  frustrated: { ey: 'narrow', eb: 'deeply_furrowed', m: 'grimace', n: 'flared' },
  annoyed: { ey: 'half_closed', eb: 'furrowed', m: 'tense' },
  disappointed: { ey: 'soft', eb: 'sad', m: 'slight_smile', fh: 'wrinkled' },

  // Thinking/Processing
  thoughtful: { ey: 'half_closed', eb: 'slightly_raised', m: 'pursed', fh: 'wrinkled' },
  curious: { ey: 'wide', eb: 'one_raised', m: 'open' },
  confused: { ey: 'wide', eb: 'one_raised', m: 'open', fh: 'wrinkled' },
  skeptical: { ey: 'narrow', eb: 'one_raised', m: 'pursed' },

  // Surprise/Shock
  surprised: { ey: 'wide', eb: 'raised', m: 'o_shape' },
  shocked: { ey: 'wide', eb: 'arched_high', m: 'o_shape', j: 'slack' },
  amazed: { ey: 'wide', eb: 'raised', m: 'open', fc: 'sparkle_eyes' },

  // Anxiety/Discomfort
  nervous: { ey: 'blink', eb: 'worried', fc: 'sweat_drop', n: 'twitching' },
  worried: { ey: 'soft', eb: 'worried', m: 'slight_smile', fh: 'wrinkled' },
  embarrassed: { ey: 'half_closed', eb: 'worried', m: 'slight_smile', ck: 'flushed' },
  shy: { ey: 'half_closed', eb: 'slightly_raised', m: 'slight_smile', ck: 'flushed' },

  // Neutral/Calm
  neutral: { ey: 'open', eb: 'normal', m: 'closed' },
  calm: { ey: 'soft', eb: 'normal', m: 'slight_smile' },
  serious: { ey: 'narrow', eb: 'normal', m: 'closed', j: 'clenched' },
  focused: { ey: 'narrow', eb: 'slightly_raised', m: 'closed', fh: 'tense' },

  // Other
  sleepy: { ey: 'half_closed', eb: 'normal', m: 'open', j: 'slack' },
  bored: { ey: 'half_closed', eb: 'normal', m: 'pursed' },
  smug: { ey: 'half_closed', eb: 'one_raised', m: 'smirk' },
  mischievous: { ey: 'narrow', eb: 'one_raised', m: 'smirk' },

  // Sassy/Attitude
  sassy: { ey: 'half_closed', eb: 'one_raised', m: 'smirk', ck: 'dimpled' },
  unimpressed: { ey: 'half_closed', eb: 'furrowed', m: 'pursed' },
  judging: { ey: 'narrow', eb: 'one_raised', m: 'tense' },
  teasing: { ey: 'soft', eb: 'one_raised', m: 'smirk', ck: 'dimpled' },
  eye_roll: { ey: 'half_closed', eb: 'raised', m: 'pursed', fh: 'raised' },
  whatever: { ey: 'half_closed', eb: 'normal', m: 'slight_smile' },
  side_eye: { ey: 'narrow', eb: 'one_raised', m: 'closed' },
  deadpan: { ey: 'half_closed', eb: 'normal', m: 'closed' },

  // Confident/Assertive
  confident: { ey: 'soft', eb: 'slightly_raised', m: 'slight_smile', fh: 'raised' },
  defiant: { ey: 'narrow', eb: 'furrowed', m: 'tense', j: 'protruding', fh: 'tense' },
  triumphant: { ey: 'wide', eb: 'raised', m: 'big_grin', ck: 'flushed' },
  cocky: { ey: 'half_closed', eb: 'one_raised', m: 'smirk', fh: 'raised' },
  superior: { ey: 'half_closed', eb: 'raised', m: 'slight_smile' },

  // Threatening/Dark
  threatening: { ey: 'narrow', eb: 'deeply_furrowed', m: 'tense', fc: 'shadow_face', j: 'clenched' },
  sinister: { ey: 'narrow', eb: 'furrowed', m: 'smirk', fc: 'shadow_face' },
  menacing: { ey: 'wide', eb: 'furrowed', m: 'teeth_showing', fc: 'shadow_face', j: 'clenched' },
  vengeful: { ey: 'narrow', eb: 'deeply_furrowed', m: 'grimace', fc: 'anger_vein', n: 'flared' },
  intimidating: { ey: 'narrow', eb: 'furrowed', m: 'closed', fh: 'tense', j: 'clenched' },

  // Romantic/Flirty
  flirty: { ey: 'wink_left', eb: 'one_raised', m: 'smirk', ck: 'flushed' },
  longing: { ey: 'soft', eb: 'sad', m: 'slight_smile', fc: 'heart_eyes' },
  seductive: { ey: 'half_closed', eb: 'relaxed_upward', m: 'smirk', ck: 'flushed' },
  adoring: { ey: 'soft', eb: 'relaxed_upward', m: 'smile', fc: 'heart_eyes', ck: 'flushed' },
  swooning: { ey: 'closed', eb: 'relaxed_upward', m: 'smile', fc: 'heart_eyes', ck: 'flushed' },

  // Distress/Pain
  heartbroken: { ey: 'tearful', eb: 'sad', m: 'pout', fc: 'tears', ck: 'sunken' },
  devastated: { ey: 'tearful', eb: 'worried', m: 'grimace', fc: 'tears' },
  desperate: { ey: 'wide', eb: 'worried', m: 'open', fc: 'sweat_drop', fh: 'wrinkled' },
  pleading: { ey: 'tearful', eb: 'worried', m: 'pout', fh: 'wrinkled' },
  horrified: { ey: 'wide', eb: 'arched_high', m: 'o_shape', fc: 'sweat_drop', j: 'slack' },
  terrified: { ey: 'wide', eb: 'raised', m: 'o_shape', fc: 'sweat_drop', n: 'twitching' },
  pained: { ey: 'closed', eb: 'furrowed', m: 'grimace', fh: 'wrinkled', j: 'clenched' },

  // Disgust/Disapproval
  disgusted: { ey: 'narrow', eb: 'furrowed', m: 'grimace', n: 'wrinkled', ck: 'sunken' },
  repulsed: { ey: 'half_closed', eb: 'furrowed', m: 'pout', n: 'wrinkled' },
  contempt: { ey: 'half_closed', eb: 'one_raised', m: 'smirk', n: 'wrinkled' },
  disdain: { ey: 'narrow', eb: 'raised', m: 'pursed', fh: 'raised' },

  // Extreme emotions
  ecstatic: { ey: 'wide', eb: 'raised', m: 'big_grin', fc: 'sparkle_eyes', ck: 'flushed' },
  hysterical: { ey: 'wide', eb: 'raised', m: 'big_grin', fc: 'tears' },
  enraged: { ey: 'wide', eb: 'deeply_furrowed', m: 'teeth_showing', fc: 'anger_vein', n: 'flared', j: 'clenched' },
  panicked: { ey: 'wide', eb: 'arched_high', m: 'o_shape', fc: 'sweat_drop', n: 'twitching', fh: 'wrinkled' },
  manic: { ey: 'wide', eb: 'raised', m: 'big_grin', n: 'twitching' },
  deranged: { ey: 'wide', eb: 'asymmetrical', m: 'teeth_showing', fc: 'spiral_eyes' },

  // Subtle/Complex
  suspicious: { ey: 'narrow', eb: 'one_raised', m: 'pursed', fh: 'wrinkled' },
  intrigued: { ey: 'wide', eb: 'one_raised', m: 'slight_smile' },
  wistful: { ey: 'soft', eb: 'sad', m: 'slight_smile' },
  melancholic: { ey: 'half_closed', eb: 'sad', m: 'slight_smile', ck: 'sunken' },
  nostalgic: { ey: 'soft', eb: 'relaxed_upward', m: 'slight_smile' },
  indifferent: { ey: 'half_closed', eb: 'normal', m: 'closed' },
  resigned: { ey: 'half_closed', eb: 'sad', m: 'slight_smile', fh: 'wrinkled' },
  conflicted: { ey: 'soft', eb: 'worried', m: 'tense', fh: 'wrinkled' },

  // Surprise variations
  stunned: { ey: 'wide', eb: 'raised', m: 'open', j: 'slack' },
  bewildered: { ey: 'wide', eb: 'asymmetrical', m: 'open', fh: 'wrinkled' },
  astonished: { ey: 'wide', eb: 'arched_high', m: 'o_shape', fc: 'sparkle_eyes' },
  dumbfounded: { ey: 'wide', eb: 'raised', m: 'o_shape', j: 'slack', fh: 'wrinkled' },

  // Physical states
  exhausted: { ey: 'half_closed', eb: 'sad', m: 'open', j: 'slack', ck: 'sunken' },
  dizzy: { ey: 'half_closed', eb: 'worried', fc: 'spiral_eyes' },
  sick: { ey: 'half_closed', eb: 'worried', m: 'grimace', ck: 'sunken', fc: 'sweat_drop' },
  drunk: { ey: 'half_closed', eb: 'relaxed_upward', m: 'big_grin', ck: 'flushed' },

  // Innocent/Cute
  innocent: { ey: 'wide', eb: 'slightly_raised', m: 'slight_smile', ck: 'flushed' },
  puppy_eyes: { ey: 'tearful', eb: 'worried', m: 'pout', fc: 'sparkle_eyes' },
  pouting: { ey: 'half_closed', eb: 'sad', m: 'pout', ck: 'puffed' },
  uwu: { ey: 'closed', eb: 'relaxed_upward', m: 'smile', ck: 'flushed' },
};

export type ExpressionName = keyof typeof EXPRESSION_PRESETS;

/**
 * Expression aliases - maps synonyms and variations to canonical expression names
 * Helps LLMs match expressions even when they hallucinate or use natural language
 */
export const EXPRESSION_ALIASES: Record<string, string> = {
  // Happy variants → happy/joyful
  glad: 'happy',
  cheerful: 'happy',
  content: 'happy',
  pleased: 'happy',
  delighted: 'joyful',
  elated: 'joyful',
  overjoyed: 'ecstatic',
  thrilled: 'ecstatic',
  blissful: 'ecstatic',

  // Sad variants → sad
  unhappy: 'sad',
  sorrowful: 'sad',
  melancholy: 'melancholic',
  gloomy: 'melancholic',
  depressed: 'devastated',
  miserable: 'devastated',
  grief: 'heartbroken',
  grieving: 'heartbroken',

  // Angry variants → angry/enraged
  mad: 'angry',
  furious: 'enraged',
  irate: 'enraged',
  livid: 'enraged',
  outraged: 'enraged',
  annoying: 'annoyed',
  irritated: 'annoyed',
  aggravated: 'frustrated',

  // Fear variants → terrified/nervous
  scared: 'terrified',
  afraid: 'terrified',
  frightened: 'terrified',
  fearful: 'terrified',
  spooked: 'nervous',
  anxious: 'nervous',
  uneasy: 'nervous',
  apprehensive: 'worried',
  concerned: 'worried',

  // Surprise variants → surprised/shocked
  astonished: 'shocked',
  startled: 'surprised',
  flabbergasted: 'dumbfounded',
  speechless: 'stunned',

  // Confused variants → confused/bewildered
  puzzled: 'confused',
  perplexed: 'confused',
  baffled: 'bewildered',
  lost: 'confused',
  uncertain: 'confused',

  // Thinking variants → thoughtful
  pondering: 'thoughtful',
  contemplating: 'thoughtful',
  considering: 'thoughtful',
  reflecting: 'thoughtful',
  wondering: 'curious',
  inquisitive: 'curious',
  interested: 'intrigued',
  fascinated: 'intrigued',

  // Smug/confident variants → smug/confident
  arrogant: 'superior',
  haughty: 'superior',
  self_satisfied: 'smug',
  sly: 'mischievous',
  cunning: 'mischievous',
  devious: 'mischievous',
  sneaky: 'mischievous',

  // Embarrassed variants → embarrassed/shy
  ashamed: 'embarrassed',
  humiliated: 'embarrassed',
  flustered: 'embarrassed',
  bashful: 'shy',
  timid: 'shy',

  // Tired variants → sleepy/exhausted
  tired: 'sleepy',
  drowsy: 'sleepy',
  fatigued: 'exhausted',
  weary: 'exhausted',
  drained: 'exhausted',

  // Love variants → loving/adoring
  smitten: 'loving',
  infatuated: 'loving',
  enchanted: 'loving',
  charmed: 'adoring',
  romantic: 'flirty',
  attracted: 'flirty',

  // Disgust variants → disgusted
  grossed_out: 'disgusted',
  revolted: 'repulsed',
  nauseated: 'sick',
  queasy: 'sick',

  // Neutral variants → neutral/calm
  blank: 'neutral',
  expressionless: 'neutral',
  stoic: 'serious',
  composed: 'calm',
  serene: 'calm',
  peaceful: 'calm',
  relaxed: 'calm',
  tranquil: 'calm',

  // Bored variants → bored
  disinterested: 'bored',
  uninterested: 'bored',
  apathetic: 'indifferent',
  uncaring: 'indifferent',

  // Playful variants → playful/teasing
  silly: 'playful',
  goofy: 'playful',
  joking: 'teasing',
  kidding: 'teasing',

  // Pain variants → pained
  hurting: 'pained',
  aching: 'pained',
  suffering: 'pained',
  agonized: 'pained',

  // Crazy variants → manic/deranged
  crazy: 'manic',
  insane: 'deranged',
  unhinged: 'deranged',
  wild: 'manic',
  frantic: 'panicked',
  hyper: 'excited',

  // Cute variants → innocent/uwu
  adorable: 'innocent',
  sweet: 'innocent',
  wholesome: 'innocent',
  kawaii: 'uwu',

  // Dark variants → threatening/sinister
  evil: 'sinister',
  villainous: 'sinister',
  malicious: 'sinister',
  wicked: 'sinister',
  scary: 'menacing',
  ominous: 'threatening',

  // Crying variants → sad/heartbroken
  crying: 'sad',
  weeping: 'heartbroken',
  sobbing: 'devastated',
  tearful: 'sad',

  // Winning variants → triumphant
  victorious: 'triumphant',
  champion: 'triumphant',
  successful: 'proud',
  accomplished: 'proud',

  // Common typos/variations
  hapyy: 'happy',
  happpy: 'happy',
  suprised: 'surprised',
  suprise: 'surprised',
  exited: 'excited',
  angery: 'angry',
  scarred: 'terrified',
  confussed: 'confused',
  embarassed: 'embarrassed',
};

/**
 * Get list of valid expression names for LLM prompt (includes aliases)
 */
export function getExpressionsList(): string {
  const presets = Object.keys(EXPRESSION_PRESETS);
  const aliases = Object.keys(EXPRESSION_ALIASES);
  const all = [...new Set([...presets, ...aliases])];
  return all.join(', ');
}

/**
 * Get canonical expression names only (for UI display)
 */
export function getCanonicalExpressions(): string[] {
  return Object.keys(EXPRESSION_PRESETS);
}

/**
 * Expand an expression preset into complementary animation states
 * Allows individual overrides: "ex":"joyful","m":"smirk" → joyful but with smirk mouth
 * Supports aliases: "glad" → "happy", "scared" → "terrified"
 */
export function expandExpression(
  expressionName: string,
  overrides?: Partial<ExpressionPreset>
): ExpressionPreset {
  const normalized = expressionName.toLowerCase().trim().replace(/\s+/g, '_');

  // Check alias first, then use normalized name
  const canonical = EXPRESSION_ALIASES[normalized] || normalized;

  const preset = EXPRESSION_PRESETS[canonical];
  if (!preset) {
    console.warn(`[AnimOrch] Unknown expression "${expressionName}" (tried alias: ${canonical}), returning empty`);
    return overrides || {};
  }

  // Merge preset with overrides (overrides take precedence)
  return {
    ...preset,
    ...overrides
  };
}

// Timing constraints
const MIN_SEGMENT_DURATION = 300; // ms
const MAX_SEGMENT_DURATION = 10000; // ms
export const DEFAULT_TALKING_SPEED = 60; // ms per character of text
const DEFAULT_THINKING_DURATION = 1500; // ms

// ============================================
// TEXT CLEANING (Strip asterisk actions)
// ============================================

/**
 * Remove asterisk actions from text content
 * LLM sometimes writes *raises eyebrow* instead of using animations
 * This strips those out so only dialogue remains
 *
 * Examples:
 * - "*smiles* Hello there" → "Hello there"
 * - "I think *pauses* that's right" → "I think that's right"
 * - "*nods thoughtfully* Yes, exactly." → "Yes, exactly."
 */
export function stripAsteriskActions(text: string): string {
  if (!text) return text;

  // Remove *action* patterns (including multi-word actions)
  // Handles: *smiles*, *raises eyebrow*, *pauses thoughtfully*, etc.
  let cleaned = text.replace(/\*[^*]+\*/g, '');

  // Clean up resulting whitespace issues
  cleaned = cleaned.replace(/\s{2,}/g, ' '); // Multiple spaces → single space
  cleaned = cleaned.replace(/^\s+/, ''); // Leading whitespace
  cleaned = cleaned.replace(/\s+$/, ''); // Trailing whitespace
  cleaned = cleaned.replace(/\s+([.,!?])/g, '$1'); // Space before punctuation

  return cleaned;
}

/**
 * Extract asterisk action text from content for comic-style display
 * Returns array of actions like ["slams hand on table", "burp"]
 * @example extractAsteriskActions("*slams hand* Hello *waves*") → ["slams hand", "waves"]
 */
export function extractAsteriskActions(text: string): string[] {
  if (!text) return [];

  const matches = text.match(/\*([^*]+)\*/g);
  if (!matches) return [];

  // Remove the asterisks and return just the action text
  return matches.map(m => m.slice(1, -1).trim());
}

// ============================================
// SPEED QUALIFIER SYSTEM (Client-side timing)
// ============================================

/**
 * Speed qualifiers that the LLM outputs instead of ms values
 * Client calculates actual durations based on these
 */
export type SpeedQualifier = 'slow' | 'normal' | 'fast' | 'explosive';

/**
 * Multipliers applied to base durations based on speed qualifier
 */
const SPEED_MULTIPLIERS: Record<SpeedQualifier, number> = {
  slow: 1.3,       // 1.3x longer - thoughtful, emotional moments
  normal: 1.0,     // Base duration - conversational pace
  fast: 0.7,       // 0.7x = faster - energetic, quick reactions
  explosive: 0.5   // 0.5x = very fast - rapid-fire, intense moments
};

/**
 * Default durations for non-talking animations (in ms)
 */
const DEFAULT_ANIMATION_DURATIONS: Record<string, number> = {
  thinking: 1500,
  idle: 1000,
  nod: 700,
  shake_head: 800,
  shrug: 900,
  wave: 1200,
  clap: 1000,
  bow: 1200,
  facepalm: 1200,
  dance: 2000,
  laugh: 1500,
  cry: 2000,
  angry: 1500,
  nervous: 1200,
  celebrate: 2000,
  peek: 800,
  doze: 1500,
  stretch: 1500,
  kick_ground: 800,
  meh: 1000,
  foot_tap: 1000,
  look_around: 1200,
  yawn: 1500,
  fidget: 1000,
  rub_eyes: 1200,
  weight_shift: 800,
  head_tilt: 600,
  chin_stroke: 1200,
  lean_forward: 800,
  lean_back: 800,
  cross_arms: 1000,
  point: 800,
  jump: 800,
  surprise_jump: 1000,
  surprise_happy: 1200,
  walking: 2000,
  confused: 1200,
  happy: 1000,
  excited: 1500,
  winning: 2000,
  _default: 1000
};

/**
 * Gap between character turns (ms)
 */
const CHARACTER_TURN_GAP = 500;

// ============================================
// SENTENCE PAUSE SYSTEM
// ============================================

/**
 * Pause duration range between sentences (in ms)
 * Varies based on speed qualifier
 */
const SENTENCE_PAUSE_RANGE = {
  min: 700,   // 0.7 seconds minimum
  max: 2000,  // 2.0 seconds maximum
};

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

/**
 * Calculate a random pause duration between sentences
 * Takes into account the speed qualifier
 * @param speed - Speed qualifier (slow/normal/fast/explosive)
 * @returns Pause duration in milliseconds
 */
function calculateSentencePauseDuration(speed: SpeedQualifier): number {
  const { min, max } = SENTENCE_PAUSE_RANGE;

  // Base random pause between min and max
  const basePause = min + Math.random() * (max - min);

  // Apply speed multiplier (faster speeds = shorter pauses)
  const multiplier = SPEED_MULTIPLIERS[speed];

  return Math.round(basePause * multiplier);
}

// ============================================
// CLIENT-SIDE TIMING CALCULATIONS
// ============================================

/**
 * Calculate duration for a talking segment based on text length and speed
 */
function calculateTalkingDuration(textLength: number, speed: SpeedQualifier = 'normal'): number {
  const multiplier = SPEED_MULTIPLIERS[speed];
  const duration = Math.round(textLength * DEFAULT_TALKING_SPEED * multiplier);
  return clampDuration(Math.max(MIN_SEGMENT_DURATION, duration));
}

/**
 * Calculate duration for a non-talking animation based on animation type and speed
 */
function calculateNonTalkingDuration(animation: string, speed: SpeedQualifier = 'normal'): number {
  const baseDuration = DEFAULT_ANIMATION_DURATIONS[animation] || DEFAULT_ANIMATION_DURATIONS._default;
  return clampDuration(Math.round(baseDuration * SPEED_MULTIPLIERS[speed]));
}

/**
 * Calculate text range for a talking segment
 * Distributes text evenly across talking segments
 */
function calculateTextRange(
  segmentIndex: number,
  totalTalkingSegments: number,
  contentLength: number
): { startIndex: number; endIndex: number } {
  const charsPerSegment = Math.ceil(contentLength / totalTalkingSegments);
  return {
    startIndex: segmentIndex * charsPerSegment,
    endIndex: Math.min((segmentIndex + 1) * charsPerSegment, contentLength)
  };
}

/**
 * Validate and parse speed qualifier from LLM output
 */
function parseSpeedQualifier(sp?: string): SpeedQualifier {
  if (sp === 'slow' || sp === 'normal' || sp === 'fast' || sp === 'explosive') {
    return sp;
  }
  return 'normal'; // Default fallback
}

/**
 * Convert speed qualifier string to numeric animation speed multiplier
 * Used by CharacterDisplay3D for animation timing
 */
function speedToNumber(speed: SpeedQualifier): number {
  switch (speed) {
    case 'slow': return 0.7;
    case 'normal': return 1.0;
    case 'fast': return 1.3;
    case 'explosive': return 1.8;
    default: return 1.0;
  }
}

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate and normalize animation name
 */
function validateAnimation(animation: string): AnimationState {
  const normalized = animation.toLowerCase().trim();
  if (VALID_ANIMATIONS.includes(normalized as AnimationState)) {
    return normalized as AnimationState;
  }
  
  // Try to find closest match
  const closeMatch = VALID_ANIMATIONS.find(a => 
    a.includes(normalized) || normalized.includes(a)
  );
  
  if (closeMatch) {
    console.warn(`[AnimOrch] Mapped unknown animation "${animation}" to "${closeMatch}"`);
    return closeMatch;
  }
  
  console.warn(`[AnimOrch] Unknown animation "${animation}", defaulting to "idle"`);
  return 'idle';
}

/**
 * Validate look direction
 */
function validateLookDirection(look?: string): LookDirection | undefined {
  if (!look) return undefined;
  
  const normalized = look.toLowerCase().trim().replace(/\s+/g, '_');
  if (VALID_LOOK_DIRECTIONS.includes(normalized as LookDirection)) {
    return normalized as LookDirection;
  }
  
  // Handle common variations
  if (normalized === 'at_other' || normalized === 'at_speaker') {
    return 'at_left_character';
  }
  
  return undefined;
}

/**
 * Validate eye state
 */
function validateEyeState(eyes?: string): EyeState | undefined {
  if (!eyes) return undefined;
  
  const normalized = eyes.toLowerCase().trim().replace(/\s+/g, '_');
  if (VALID_EYE_STATES.includes(normalized as EyeState)) {
    return normalized as EyeState;
  }
  
  return undefined;
}

/**
 * Validate mouth state
 */
function validateMouthState(mouth?: string): MouthState | undefined {
  if (!mouth) return undefined;
  
  const normalized = mouth.toLowerCase().trim().replace(/\s+/g, '_');
  if (VALID_MOUTH_STATES.includes(normalized as MouthState)) {
    return normalized as MouthState;
  }
  
  return undefined;
}

/**
 * Validate visual effect
 */
function validateEffect(effect?: string): VisualEffect | undefined {
  if (!effect) return undefined;

  const normalized = effect.toLowerCase().trim();
  if (VALID_EFFECTS.includes(normalized as VisualEffect)) {
    return normalized as VisualEffect;
  }

  return undefined;
}

/**
 * Validate and normalize eyebrow state
 */
function validateEyebrowState(eyebrow?: string): EyebrowState | undefined {
  if (!eyebrow) return undefined;

  const normalized = eyebrow.toLowerCase().trim().replace(/\s+/g, '_');
  if (VALID_EYEBROW_STATES.includes(normalized as EyebrowState)) {
    return normalized as EyebrowState;
  }

  return undefined;
}

/**
 * Validate and normalize face state
 */
function validateFaceState(face?: string): FaceState | undefined {
  if (!face) return undefined;

  const normalized = face.toLowerCase().trim().replace(/\s+/g, '_');
  if (VALID_FACE_STATES.includes(normalized as FaceState)) {
    return normalized as FaceState;
  }

  return undefined;
}

/**
 * Validate and normalize nose state (NEW)
 */
function validateNoseState(nose?: string): NoseState | undefined {
  if (!nose) return undefined;

  const normalized = nose.toLowerCase().trim().replace(/\s+/g, '_');
  if (VALID_NOSE_STATES.includes(normalized as NoseState)) {
    return normalized as NoseState;
  }

  return undefined;
}

/**
 * Validate and normalize cheek state (NEW)
 */
function validateCheekState(cheek?: string): CheekState | undefined {
  if (!cheek) return undefined;

  const normalized = cheek.toLowerCase().trim().replace(/\s+/g, '_');
  if (VALID_CHEEK_STATES.includes(normalized as CheekState)) {
    return normalized as CheekState;
  }

  return undefined;
}

/**
 * Validate and normalize forehead state (NEW)
 */
function validateForeheadState(forehead?: string): ForeheadState | undefined {
  if (!forehead) return undefined;

  const normalized = forehead.toLowerCase().trim().replace(/\s+/g, '_');
  if (VALID_FOREHEAD_STATES.includes(normalized as ForeheadState)) {
    return normalized as ForeheadState;
  }

  return undefined;
}

/**
 * Validate and normalize jaw state (NEW)
 */
function validateJawState(jaw?: string): JawState | undefined {
  if (!jaw) return undefined;

  const normalized = jaw.toLowerCase().trim().replace(/\s+/g, '_');
  if (VALID_JAW_STATES.includes(normalized as JawState)) {
    return normalized as JawState;
  }

  return undefined;
}

/**
 * Clamp duration to valid range
 */
function clampDuration(duration: number): number {
  if (typeof duration !== 'number' || isNaN(duration)) {
    return DEFAULT_THINKING_DURATION;
  }
  return Math.max(MIN_SEGMENT_DURATION, Math.min(MAX_SEGMENT_DURATION, duration));
}

// ============================================
// PARSING FUNCTIONS
// ============================================

/**
 * Split combined content that contains multiple character responses
 * Detects patterns like "[Character Name]: text" and splits them
 */
function splitCombinedContent(
  content: string,
  selectedCharacters: string[]
): Array<{ characterId: string; content: string }> | null {
  // Pattern to detect character responses embedded in content
  // Matches [Character Name]: or Character Name: at start of lines
  const characterPattern = /\[([^\]]+)\]:\s*|\n([A-Z][a-zA-Z\s]+):\s*/g;
  
  // Check if content has multiple character prefixes
  const matches = content.match(/\[([^\]]+)\]:/g);
  if (!matches || matches.length <= 1) {
    return null; // Not a combined response
  }
  
  console.log('[AnimOrch] Detected combined response with', matches.length, 'characters');
  
  // Split by character prefix patterns
  const splitResponses: Array<{ characterId: string; content: string }> = [];
  
  // Build a regex that matches character names in brackets
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
        // Resolve character name to ID
        const characterId = resolveCharacterId(characterName, selectedCharacters);
        if (characterId) {
          splitResponses.push({
            characterId,
            content: responseText
          });
        }
      }
    } else if (splitResponses.length === 0 && trimmedPart) {
      // First part without prefix - might be the main character's content
      // We'll handle this in the caller
    }
  }
  
  return splitResponses.length > 1 ? splitResponses : null;
}

// ============================================
// SIMPLIFIED FORMAT (Client-side timing calculation)
// ============================================

/**
 * Simplified JSON format where LLM outputs speed qualifiers instead of ms values
 * Client calculates actual durations based on text length and speed multipliers
 * Uses flat animation fields at character level (simpler than timeline arrays)
 *
 * Keys: s=scene, ch=characters, c=character, t=content, ord=speakerOrder
 *       a=animation, sp=speed, lk=look, ex=expression, ey=eyes, eb=eyebrow
 *       m=mouth, fc=face, fx=effect, n=nose, ck=cheek, fh=forehead, j=jaw, v=voice
 */
interface SimplifiedSceneResponse {
  s: {
    ch: Array<{
      c: string;       // character ID
      t: string;       // content text
      ord: number;     // speaker order (1, 2, 3...)
      int?: boolean;   // interruption flag
      reactsTo?: string; // reacts to character
      // Flat animation fields (one animation per response)
      a?: string;      // animation (body)
      sp?: string;     // speed: 'slow' | 'normal' | 'fast' | 'explosive'
      lk?: string;     // look direction
      ex?: string;     // expression preset (expands to face components)
      ey?: string;     // eyes (override)
      eb?: string;     // eyebrow (override)
      m?: string;      // mouth (override)
      fc?: string;     // face (override)
      fx?: string;     // effect
      n?: string;      // nose (override)
      ck?: string;     // cheek (override)
      fh?: string;     // forehead (override)
      j?: string;      // jaw (override)
      v?: any;         // voice
    }>;
  };
}

/**
 * Detect if response is in simplified format (no ms values, has ord instead of d)
 */
function isSimplifiedFormat(parsed: any): parsed is SimplifiedSceneResponse {
  const firstChar = parsed?.s?.ch?.[0];
  // Simplified format has 'ord' (speaker order) but no 'd' (startDelay in ms)
  return firstChar && typeof firstChar.ord === 'number' && firstChar.d === undefined;
}

/**
 * Convert a single simplified segment to AnimationSegment with calculated timing
 * Supports expression presets: "ex":"joyful" expands to eye, eyebrow, mouth, etc.
 * Individual states override expression preset: "ex":"joyful","m":"smirk"
 */
function convertSimplifiedSegment(
  seg: SimplifiedSceneResponse['s']['ch'][0]['tl'][0],
  contentLength: number,
  segmentIndex: number,
  totalTalkingSegments: number
): AnimationSegment {
  const animation = validateAnimation(seg.a || 'idle');
  const speed = parseSpeedQualifier(seg.sp);

  // Calculate duration based on whether this is a talking segment
  let duration: number;
  if (seg.talking) {
    // For talking segments, calculate based on text portion and speed
    const charsInSegment = Math.ceil(contentLength / totalTalkingSegments);
    duration = calculateTalkingDuration(charsInSegment, speed);
  } else {
    // For non-talking segments, use animation-based duration
    duration = calculateNonTalkingDuration(animation, speed);
  }

  const complementary: AnimationSegment['complementary'] = {};

  // First, expand expression preset if provided
  // Expression gives base states which can be overridden by individual keys
  if (seg.ex) {
    const expanded = expandExpression(seg.ex);
    // Apply expanded expression states
    if (expanded.ey) complementary.eyeState = expanded.ey;
    if (expanded.eb) complementary.eyebrowState = expanded.eb;
    if (expanded.m) complementary.mouthState = expanded.m;
    if (expanded.fc) complementary.faceState = expanded.fc;
    if (expanded.n) complementary.noseState = expanded.n;
    if (expanded.ck) complementary.cheekState = expanded.ck;
    if (expanded.fh) complementary.foreheadState = expanded.fh;
    if (expanded.j) complementary.jawState = expanded.j;
  }

  // Now apply individual overrides (these take precedence over expression)
  const lookDir = validateLookDirection(seg.lk);
  if (lookDir) complementary.lookDirection = lookDir;

  const eyeState = validateEyeState(seg.ey);
  if (eyeState) complementary.eyeState = eyeState;

  const eyebrowState = validateEyebrowState(seg.eb);
  if (eyebrowState) complementary.eyebrowState = eyebrowState;

  const mouthState = validateMouthState(seg.m);
  if (mouthState) complementary.mouthState = mouthState;

  const faceState = validateFaceState(seg.fc);
  if (faceState) complementary.faceState = faceState;

  const noseState = validateNoseState(seg.n);
  if (noseState) complementary.noseState = noseState;

  const cheekState = validateCheekState(seg.ck);
  if (cheekState) complementary.cheekState = cheekState;

  const foreheadState = validateForeheadState(seg.fh);
  if (foreheadState) complementary.foreheadState = foreheadState;

  const jawState = validateJawState(seg.j);
  if (jawState) complementary.jawState = jawState;

  const effect = validateEffect(seg.fx);
  if (effect && effect !== 'none') complementary.effect = effect;

  const segment: AnimationSegment = {
    animation,
    duration,
    isTalking: seg.talking === true
  };

  if (Object.keys(complementary).length > 0) {
    segment.complementary = complementary;
  }

  // Parse voice parameters if provided
  if (seg.v) {
    const parsedVoice = parseSegmentVoice(seg.v);
    if (parsedVoice) {
      segment.voice = parsedVoice;
    }
  }

  return segment;
}

/**
 * Convert simplified scene format to OrchestrationScene
 * Calculates all timing client-side based on speed qualifiers
 */
function convertSimplifiedScene(
  simplified: SimplifiedSceneResponse,
  selectedCharacters: string[]
): OrchestrationScene {
  console.log('[AnimOrch] Converting simplified format - calculating timing client-side');

  // Sort characters by speaker order
  const sorted = [...simplified.s.ch].sort((a, b) => a.ord - b.ord);

  // Log each character's input from the LLM
  console.log('\n---------- CHARACTER INPUTS (Animated Scene) ----------');
  sorted.forEach((char, index) => {
    console.log(`[${index + 1}] ${char.c} (order: ${char.ord}):`);
    console.log(`    Text: "${char.t}"`);
    console.log(`    Animation: ${char.a || 'talking'}, Speed: ${char.sp || 'normal'}, Look: ${char.lk || 'center'}, Expression: ${char.ex || 'neutral'}`);
  });
  console.log('-------------------------------------------------------\n');

  const timelines: CharacterTimeline[] = [];
  let previousEndTime = 0;

  for (const char of sorted) {
    // Extract action text BEFORE stripping (for comic-style display)
    const actionTexts = extractAsteriskActions(char.t);
    if (actionTexts.length > 0) {
      console.log(`[AnimOrch] Extracted action text from ${char.c}:`, actionTexts);
    }

    // Clean content: strip asterisk actions like *smiles* or *raises eyebrow*
    const cleanedContent = stripAsteriskActions(char.t);
    if (cleanedContent !== char.t) {
      console.log(`[AnimOrch] Stripped asterisk actions from ${char.c}: "${char.t}" → "${cleanedContent}"`);
    }

    // Check if this contains combined [Character]: responses that need splitting
    const splitResponses = splitCombinedContent(cleanedContent, selectedCharacters);
    if (splitResponses && splitResponses.length > 1) {
      console.log(`[AnimOrch] Split combined content into ${splitResponses.length} character responses`);

      // Process each split response as a separate timeline
      for (let splitIndex = 0; splitIndex < splitResponses.length; splitIndex++) {
        const split = splitResponses[splitIndex];
        // Extract action text from this split's content (may have its own *actions*)
        const splitActionTexts = extractAsteriskActions(split.content);
        const splitCleanContent = stripAsteriskActions(split.content);
        const splitContentLength = splitCleanContent.length;

        // Create default talking segment for this split
        const splitDuration = Math.round(splitContentLength * DEFAULT_TALKING_SPEED);
        const splitSegments: AnimationSegment[] = [{
          animation: 'talking' as AnimationState,
          duration: splitDuration,
          isTalking: true,
          textReveal: {
            startIndex: 0,
            endIndex: splitContentLength
          },
          // Add action text if present
          actionText: splitActionTexts.length > 0 ? splitActionTexts.join(' ') : undefined
        }];

        // Calculate start delay - first split continues from previous, rest are sequential
        let splitStartDelay: number;
        if (timelines.length === 0 && splitIndex === 0) {
          splitStartDelay = 0;
        } else {
          splitStartDelay = previousEndTime + CHARACTER_TURN_GAP;
        }

        timelines.push({
          characterId: split.characterId,
          content: splitCleanContent,
          totalDuration: splitDuration,
          segments: splitSegments,
          startDelay: splitStartDelay,
          isInterruption: false
        });

        previousEndTime = splitStartDelay + splitDuration;
      }
      continue; // Skip normal processing since we handled it
    }

    // Use flat animation fields directly (simplified format)
    const animation = validateAnimation(char.a || 'talking');
    const speed = parseSpeedQualifier(char.sp);

    // Build complementary animation from expression and overrides
    const complementary: AnimationSegment['complementary'] = {};

    // Expand expression preset if provided
    if (char.ex) {
      const expanded = expandExpression(char.ex);
      if (expanded.ey) complementary.eyeState = expanded.ey;
      if (expanded.eb) complementary.eyebrowState = expanded.eb;
      if (expanded.m) complementary.mouthState = expanded.m;
      if (expanded.fc) complementary.faceState = expanded.fc;
    }

    // Apply individual overrides
    if (char.lk) complementary.lookDirection = char.lk as LookDirection;
    if (char.ey) complementary.eyeState = char.ey as EyeState;
    if (char.eb) complementary.eyebrowState = char.eb as EyebrowState;
    if (char.m) complementary.mouthState = char.m as MouthState;
    if (char.fc) complementary.faceState = char.fc as FaceState;
    if (char.fx) complementary.effect = char.fx as VisualEffect;
    if (char.n) complementary.noseState = char.n as NoseState;
    if (char.ck) complementary.cheekState = char.ck as CheekState;
    if (char.fh) complementary.foreheadState = char.fh as ForeheadState;
    if (char.j) complementary.jawState = char.j as JawState;
    complementary.speed = speedToNumber(speed);

    // Split content into sentences for sentence-by-sentence display with pauses
    const sentences = splitIntoSentences(cleanedContent);
    const formattedContent = sentences.join('\n');
    const segments: AnimationSegment[] = [];
    let currentCharIndex = 0;

    // Build segments: each sentence gets a talking segment, followed by a pause segment
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const sentenceStart = currentCharIndex;
      const sentenceEnd = currentCharIndex + sentence.length;

      // Calculate talking duration for this sentence
      const sentenceDuration = calculateTalkingDuration(sentence.length, speed);

      // Add talking segment for this sentence
      const talkingSegment: AnimationSegment = {
        animation,
        duration: sentenceDuration,
        isTalking: true,
        complementary: { ...complementary },
        textReveal: { startIndex: sentenceStart, endIndex: sentenceEnd },
        voice: i === 0 && char.v ? parseSegmentVoice(char.v) : undefined,
      };

      // Add action text to the first segment only (if any extracted)
      if (i === 0 && actionTexts.length > 0) {
        talkingSegment.actionText = actionTexts.join(' ');
      }

      segments.push(talkingSegment);

      // Add pause segment after sentence (except for the last one)
      if (i < sentences.length - 1) {
        const pauseDuration = calculateSentencePauseDuration(speed);
        segments.push({
          animation: 'idle' as AnimationState,
          duration: pauseDuration,
          isTalking: false,
          complementary: { ...complementary },
          // No text reveal during pause - keep showing what we've revealed
        });

        // Account for the newline character in the formatted content
        currentCharIndex = sentenceEnd + 1; // +1 for '\n'
      } else {
        currentCharIndex = sentenceEnd;
      }
    }

    const totalDuration = segments.reduce((sum, s) => sum + s.duration, 0);

    // Use the formatted content with newlines between sentences
    const finalContent = sentences.length > 1 ? formattedContent : cleanedContent;

    // Calculate start delay based on speaker order
    let startDelay: number;
    if (char.ord === 1) {
      // First speaker starts immediately
      startDelay = 0;
    } else if (char.int) {
      // Interruption: start slightly before previous ends
      startDelay = Math.max(0, previousEndTime - 500);
    } else {
      // Normal: start after previous ends with gap
      startDelay = previousEndTime + CHARACTER_TURN_GAP;
    }

    // Resolve character ID
    const characterId = resolveCharacterId(char.c, selectedCharacters);
    if (!characterId) {
      console.warn(`[AnimOrch] Could not resolve character: ${char.c}`);
      continue;
    }

    timelines.push({
      characterId,
      content: finalContent,
      totalDuration,
      segments,
      startDelay,
      isInterruption: char.int || false
    });

    previousEndTime = startDelay + totalDuration;
  }

  // Calculate total scene duration
  const sceneDuration = timelines.reduce((max, t) =>
    Math.max(max, t.startDelay + t.totalDuration), 0
  );

  return {
    timelines,
    sceneDuration,
    nonSpeakerBehavior: {} // Will be filled by fillGapsForNonSpeakers
  };
}

/**
 * Extract balanced JSON from a string that may contain extra text
 * Uses brace counting to find the complete JSON object
 */
function extractBalancedJson(input: string): string | null {
  const startIdx = input.indexOf('{');
  if (startIdx === -1) return null;

  let braceCount = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = startIdx; i < input.length; i++) {
    const char = input[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\' && inString) {
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{') braceCount++;
      else if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          return input.substring(startIdx, i + 1);
        }
      }
    }
  }

  return null; // Unbalanced braces
}

/**
 * Parse raw LLM response into OrchestrationScene
 *
 * Uses SIMPLIFIED format only - all timing is calculated client-side
 * based on text length and speed qualifiers (slow/normal/fast/explosive)
 */
export function parseOrchestrationScene(
  rawResponse: string,
  selectedCharacters: string[]
): OrchestrationScene | null {
  try {
    // Clean and extract JSON
    let cleaned = rawResponse.trim();
    cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*/g, '');

    // Extract balanced JSON object (handles extra text after JSON)
    const jsonString = extractBalancedJson(cleaned);
    if (!jsonString) {
      console.error('[AnimOrch] Could not find valid JSON in response');
      return null;
    }
    cleaned = jsonString;

    const parsed: any = JSON.parse(cleaned);

    // Use simplified format - all timing calculated client-side
    if (isSimplifiedFormat(parsed)) {
      console.log('[AnimOrch] Parsing simplified format - calculating timing client-side');
      const scene = convertSimplifiedScene(parsed, selectedCharacters);
      return fillGapsForNonSpeakers(scene, selectedCharacters);
    }

    // If not simplified format, log warning and return null
    // The caller (singleCallOrchestration.ts) will create a fallback scene
    console.warn('[AnimOrch] Response is not in simplified format (missing ord field or has d field)');
    console.warn('[AnimOrch] Expected format: {"s":{"ch":[{"c":"ID","t":"TEXT","ord":1,"a":"talking","sp":"normal","lk":"center","ex":"happy"}]}}');
    return null;

  } catch (error) {
    console.error('[AnimOrch] Failed to parse scene:', error);
    return null;
  }
}

/**
 * Enforce minimum gap between character turns
 * Ensures there's at least `minGapMs` milliseconds between when one character
 * finishes speaking and the next character starts (unless marked as interruption)
 */
function enforceMinimumGaps(timelines: CharacterTimeline[], minGapMs: number): CharacterTimeline[] {
  if (timelines.length <= 1) return timelines;

  // Sort by startDelay to process in order
  const sorted = [...timelines].sort((a, b) => a.startDelay - b.startDelay);
  const adjusted: CharacterTimeline[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const timeline = { ...sorted[i] };

    if (i === 0) {
      // First timeline stays as-is
      adjusted.push(timeline);
      continue;
    }

    // Skip gap enforcement for interruptions
    if (timeline.isInterruption) {
      adjusted.push(timeline);
      continue;
    }

    // Find when the previous timeline ends
    const prevTimeline = adjusted[adjusted.length - 1];
    const prevEndTime = prevTimeline.startDelay + prevTimeline.totalDuration;

    // Calculate minimum start time with gap
    const minStartTime = prevEndTime + minGapMs;

    // If current startDelay is before minStartTime, adjust it
    if (timeline.startDelay < minStartTime) {
      const adjustment = minStartTime - timeline.startDelay;
      console.log(`[AnimOrch] Adjusting timeline for ${timeline.characterId}: adding ${adjustment}ms gap`);
      timeline.startDelay = minStartTime;
    }

    adjusted.push(timeline);
  }

  return adjusted;
}

/**
 * Clean character name prefix from content
 */
function cleanCharacterPrefix(content: string): string {
  // Remove [Character Name]: prefix
  let cleaned = content.replace(/^\[[\w\s]+\]:\s*/i, '');
  // Remove Character Name: prefix at the start
  cleaned = cleaned.replace(/^[\w\s]+:\s*(?=\*|[A-Z])/i, '');
  return cleaned.trim();
}

/**
 * Validate parsed timelines for guideline violations
 * Logs warnings for debugging but doesn't block processing
 */
function validateTimelines(
  timelines: CharacterTimeline[],
  selectedCharacters: string[]
): void {
  const violations: string[] = [];
  const characterIds = new Set<string>();
  
  for (const timeline of timelines) {
    // Check for duplicate character IDs (might indicate improper splitting)
    if (characterIds.has(timeline.characterId)) {
      violations.push(`Duplicate character ID: ${timeline.characterId} appears multiple times`);
    }
    characterIds.add(timeline.characterId);
    
    // Check if content still contains character name prefixes
    if (/^\[[\w\s]+\]:/.test(timeline.content)) {
      violations.push(`Content for ${timeline.characterId} starts with [Name]: prefix - should be clean text`);
    }
    
    // Check if content contains multiple character responses
    const multiCharPattern = /\[[\w\s]+\]:/g;
    const matches = timeline.content.match(multiCharPattern);
    if (matches && matches.length > 1) {
      violations.push(`Content for ${timeline.characterId} contains ${matches.length} character prefixes - responses not properly split`);
    }
    
    // Check if character ID is valid (in selected characters)
    if (!selectedCharacters.includes(timeline.characterId)) {
      violations.push(`Character ID "${timeline.characterId}" not in selected characters list`);
    }
    
    // Check for empty content
    if (!timeline.content || timeline.content.trim().length === 0) {
      violations.push(`Empty content for character ${timeline.characterId}`);
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
 * Parse a single character's timeline from LLM response
 */
function parseCharacterTimeline(
  response: LLMCharacterResponse,
  selectedCharacters: string[]
): CharacterTimeline | null {
  if (!response.character || !response.content) {
    return null;
  }
  
  // Resolve character ID
  const characterId = resolveCharacterId(response.character, selectedCharacters);
  if (!characterId) {
    console.warn(`[AnimOrch] Could not resolve character: ${response.character}`);
    return null;
  }
  
  // Parse segments
  const segments: AnimationSegment[] = [];
  let totalDuration = 0;
  
  if (Array.isArray(response.timeline) && response.timeline.length > 0) {
    for (const seg of response.timeline) {
      const segment = parseSegment(seg, response.content);
      segments.push(segment);
      totalDuration += segment.duration;
    }
  } else {
    // Create default timeline if none provided
    const defaultSegments = createDefaultTimeline(response.content);
    segments.push(...defaultSegments);
    totalDuration = defaultSegments.reduce((sum, s) => sum + s.duration, 0);
  }
  
  // Validate and fix text reveal ranges
  validateTextRanges(segments, response.content.length);

  return {
    characterId,
    content: response.content,
    totalDuration,
    segments,
    startDelay: Math.max(0, response.startDelay || 0),
    isInterruption: response.interrupts || false
  };
}

/**
 * Parse a single animation segment
 * For talking segments, recalculates duration based on text length to ensure consistent speed
 * Also detects emojis in text content to automatically trigger visual effects
 */
function parseSegment(
  raw: LLMCharacterResponse['timeline'][0],
  content: string
): AnimationSegment {
  const contentLength = content.length;
  const animation = validateAnimation(raw.animation || 'idle');
  const isTalking = raw.talking === true;

  // For talking segments, calculate duration based on text length for consistent speed
  // LLM-provided durations are often too short, causing text to appear too fast
  let duration: number;
  if (isTalking && Array.isArray(raw.textRange) && raw.textRange.length === 2) {
    const [start, end] = raw.textRange;
    const textLength = Math.max(0, end - start);
    // Use DEFAULT_TALKING_SPEED to ensure consistent text reveal speed
    duration = Math.max(MIN_SEGMENT_DURATION, textLength * DEFAULT_TALKING_SPEED);
  } else if (isTalking) {
    // Talking segment without text range - estimate from content length
    duration = Math.max(MIN_SEGMENT_DURATION, contentLength * DEFAULT_TALKING_SPEED);
  } else {
    // Non-talking segment - use LLM duration (clamped)
    duration = clampDuration(raw.duration);
  }
  
  const complementary: AnimationSegment['complementary'] = {};

  const lookDir = validateLookDirection(raw.look);
  if (lookDir) complementary.lookDirection = lookDir;

  const eyeState = validateEyeState(raw.eyes);
  if (eyeState) complementary.eyeState = eyeState;

  const eyebrowState = validateEyebrowState(raw.eyebrow);
  if (eyebrowState) complementary.eyebrowState = eyebrowState;

  const mouthState = validateMouthState(raw.mouth);
  if (mouthState) complementary.mouthState = mouthState;

  const faceState = validateFaceState(raw.face);
  if (faceState) complementary.faceState = faceState;

  // NEW: Parse new facial feature states
  const noseState = validateNoseState(raw.nose);
  if (noseState) complementary.noseState = noseState;

  const cheekState = validateCheekState(raw.cheek);
  if (cheekState) complementary.cheekState = cheekState;

  const foreheadState = validateForeheadState(raw.forehead);
  if (foreheadState) complementary.foreheadState = foreheadState;

  const jawState = validateJawState(raw.jaw);
  if (jawState) complementary.jawState = jawState;

  // Resolve effect: explicit fx takes priority, then emoji detection
  const explicitEffect = validateEffect(raw.effect);
  const resolvedEffect = resolveEffect(explicitEffect, content);
  if (resolvedEffect && resolvedEffect !== 'none') complementary.effect = resolvedEffect;

  const segment: AnimationSegment = {
    animation,
    duration,
    isTalking
  };

  if (Object.keys(complementary).length > 0) {
    segment.complementary = complementary;
  }
  
  // Parse text range if provided
  if (Array.isArray(raw.textRange) && raw.textRange.length === 2) {
    const [start, end] = raw.textRange;
    if (typeof start === 'number' && typeof end === 'number') {
      segment.textReveal = {
        startIndex: Math.max(0, Math.min(start, contentLength)),
        endIndex: Math.max(0, Math.min(end, contentLength))
      };
    }
  }
  
  // Parse voice parameters if provided (supports both "voice" and compact "v")
  const voiceData = raw.voice || raw.v;
  if (voiceData) {
    const parsedVoice = parseSegmentVoice(voiceData);
    if (parsedVoice) {
      segment.voice = parsedVoice;
    }
  }
  
  return segment;
}

/**
 * Resolve character name/ID to valid character ID
 */
function resolveCharacterId(
  characterRef: string,
  selectedCharacters: string[]
): string | null {
  // Direct match
  if (selectedCharacters.includes(characterRef)) {
    return characterRef;
  }
  
  // Try lowercase match
  const lowerRef = characterRef.toLowerCase().replace(/\s+/g, '_');
  
  for (const charId of selectedCharacters) {
    try {
      const character = getCharacter(charId);
      const charNameLower = character.name.toLowerCase().replace(/\s+/g, '_');
      
      if (charNameLower === lowerRef || 
          charId.toLowerCase().includes(lowerRef) ||
          lowerRef.includes(charId.toLowerCase())) {
        return charId;
      }
    } catch {
      continue;
    }
  }
  
  return selectedCharacters[0] || null;
}

// ============================================
// TIMELINE GENERATION
// ============================================

/**
 * Create default timeline when LLM doesn't provide one
 * Uses sentence-by-sentence display with pauses between sentences
 */
export function createDefaultTimeline(content: string): AnimationSegment[] {
  const segments: AnimationSegment[] = [
    {
      animation: 'thinking',
      duration: DEFAULT_THINKING_DURATION,
      isTalking: false,
      complementary: { lookDirection: 'up' }
    }
  ];

  // Split content into sentences for sentence-by-sentence display
  const sentences = splitIntoSentences(content);
  let currentCharIndex = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const sentenceStart = currentCharIndex;
    const sentenceEnd = currentCharIndex + sentence.length;

    // Calculate talking duration for this sentence
    const sentenceDuration = calculateTalkingDuration(sentence.length, 'normal');

    // Add talking segment for this sentence
    segments.push({
      animation: 'talking',
      duration: sentenceDuration,
      isTalking: true,
      textReveal: { startIndex: sentenceStart, endIndex: sentenceEnd }
    });

    // Add pause segment after sentence (except for the last one)
    if (i < sentences.length - 1) {
      const pauseDuration = calculateSentencePauseDuration('normal');
      segments.push({
        animation: 'idle',
        duration: pauseDuration,
        isTalking: false,
        // No text reveal during pause
      });

      // Account for the newline character
      currentCharIndex = sentenceEnd + 1; // +1 for '\n'
    } else {
      currentCharIndex = sentenceEnd;
    }
  }

  // End with idle
  segments.push({
    animation: 'idle',
    duration: 1000,
    isTalking: false,
    complementary: { mouthState: 'smile' }
  });

  return segments;
}

/**
 * Format content with newlines between sentences
 * Used when creating default timelines
 */
export function formatContentWithSentenceBreaks(content: string): string {
  const sentences = splitIntoSentences(content);
  return sentences.join('\n');
}

/**
 * Create simple fallback timeline from plain text responses
 */
export function createFallbackScene(
  responses: Array<{ characterId: string; content: string }>,
  selectedCharacters: string[]
): OrchestrationScene {
  let currentDelay = 0;
  const timelines: CharacterTimeline[] = [];

  for (const response of responses) {
    const segments = createDefaultTimeline(response.content);
    const totalDuration = segments.reduce((sum, s) => sum + s.duration, 0);
    // Format content with newlines between sentences
    const formattedContent = formatContentWithSentenceBreaks(response.content);

    timelines.push({
      characterId: response.characterId,
      content: formattedContent,
      totalDuration,
      segments,
      startDelay: currentDelay
    });

    currentDelay += totalDuration + 500; // 500ms gap between characters
  }

  return {
    timelines,
    sceneDuration: currentDelay,
    nonSpeakerBehavior: {}
  };
}

/**
 * Validate and fix text reveal ranges to ensure full coverage
 */
function validateTextRanges(segments: AnimationSegment[], contentLength: number): void {
  // Find segments with text reveal
  const talkingSegments = segments.filter(s => s.isTalking);
  
  if (talkingSegments.length === 0) {
    // No talking segments, assign text to first segment
    if (segments.length > 0) {
      segments[0].textReveal = { startIndex: 0, endIndex: contentLength };
    }
    return;
  }
  
  // Check if text ranges are provided
  const hasRanges = talkingSegments.some(s => s.textReveal);
  
  if (!hasRanges) {
    // Distribute text evenly across talking segments
    const charsPerSegment = Math.ceil(contentLength / talkingSegments.length);
    let currentIndex = 0;
    
    for (const segment of talkingSegments) {
      const endIndex = Math.min(currentIndex + charsPerSegment, contentLength);
      segment.textReveal = {
        startIndex: currentIndex,
        endIndex
      };
      currentIndex = endIndex;
    }
  } else {
    // Validate existing ranges
    let lastEnd = 0;
    for (const segment of talkingSegments) {
      if (segment.textReveal) {
        // Ensure no gaps
        if (segment.textReveal.startIndex > lastEnd) {
          segment.textReveal.startIndex = lastEnd;
        }
        lastEnd = segment.textReveal.endIndex;
      }
    }
    
    // Ensure last segment covers remaining text
    const lastSegment = talkingSegments[talkingSegments.length - 1];
    if (lastSegment.textReveal && lastSegment.textReveal.endIndex < contentLength) {
      lastSegment.textReveal.endIndex = contentLength;
    }
  }
}

// ============================================
// GAP FILLING FOR NON-SPEAKERS
// ============================================

/**
 * Generate listening animations for non-speaking characters
 */
export function fillGapsForNonSpeakers(
  scene: OrchestrationScene,
  allCharacters: string[]
): OrchestrationScene {
  const speakingCharacters = new Set(scene.timelines.map(t => t.characterId));
  const nonSpeakers = allCharacters.filter(id => !speakingCharacters.has(id));
  
  const nonSpeakerBehavior: OrchestrationScene['nonSpeakerBehavior'] = {};
  
  for (const characterId of nonSpeakers) {
    nonSpeakerBehavior[characterId] = generateListeningTimeline(
      scene,
      characterId,
      allCharacters
    );
  }
  
  return {
    ...scene,
    nonSpeakerBehavior
  };
}

/**
 * Generate listening/reaction timeline for a non-speaking character
 */
function generateListeningTimeline(
  scene: OrchestrationScene,
  characterId: string,
  allCharacters: string[]
): AnimationSegment[] {
  const segments: AnimationSegment[] = [];
  let currentTime = 0;
  
  // Build timeline based on who's speaking when
  const speakerEvents = buildSpeakerEvents(scene);
  
  for (const event of speakerEvents) {
    if (currentTime < event.startTime) {
      // Gap before this speaker - idle
      segments.push({
        animation: 'idle',
        duration: event.startTime - currentTime,
        isTalking: false,
        complementary: {
          eyeState: Math.random() < 0.3 ? 'blink' : 'open'
        }
      });
    }
    
    // During speaker's timeline
    // If speaker is to my LEFT (lower index), look toward them using 'at_left_character'
    // If speaker is to my RIGHT (higher index), look toward them using 'at_right_character'
    const speakerPosition = getSpeakerPosition(event.characterId, characterId, allCharacters);
    const lookDirection = speakerPosition === 'left' ? 'at_left_character' :
                          speakerPosition === 'right' ? 'at_right_character' : 'center';
    
    // Check if this character is mentioned in the content
    const isMentioned = checkIfMentioned(characterId, event.content);
    
    // Generate listening segments for this speaker's duration
    let remainingDuration = event.duration;
    let segmentStart = event.startTime;
    
    while (remainingDuration > 0) {
      const segmentDuration = Math.min(remainingDuration, 2000 + Math.random() * 1000);
      
      // Decide on reaction
      let animation: AnimationState = 'idle';
      let mouthState: MouthState | undefined;
      
      if (isMentioned && segmentStart === event.startTime) {
        // React to being mentioned
        animation = 'lean_forward';
        mouthState = 'smile';
      } else if (Math.random() < 0.2) {
        // Occasional nod
        animation = 'nod';
      } else if (Math.random() < 0.1) {
        // Occasional smile
        mouthState = 'smile';
      }
      
      segments.push({
        animation,
        duration: segmentDuration,
        isTalking: false,
        complementary: {
          lookDirection,
          mouthState,
          eyeState: Math.random() < 0.15 ? 'blink' : 'open'
        }
      });
      
      remainingDuration -= segmentDuration;
      segmentStart += segmentDuration;
    }
    
    currentTime = event.startTime + event.duration;
  }
  
  // Fill remaining time with idle
  if (currentTime < scene.sceneDuration) {
    segments.push({
      animation: 'idle',
      duration: scene.sceneDuration - currentTime,
      isTalking: false
    });
  }
  
  return segments;
}

/**
 * Build list of speaker events from timelines
 */
interface SpeakerEvent {
  characterId: string;
  startTime: number;
  duration: number;
  content: string;
}

function buildSpeakerEvents(scene: OrchestrationScene): SpeakerEvent[] {
  const events: SpeakerEvent[] = [];
  
  for (const timeline of scene.timelines) {
    events.push({
      characterId: timeline.characterId,
      startTime: timeline.startDelay,
      duration: timeline.totalDuration,
      content: timeline.content
    });
  }
  
  // Sort by start time
  events.sort((a, b) => a.startTime - b.startTime);
  
  return events;
}

/**
 * Determine speaker's relative position
 */
function getSpeakerPosition(
  speakerId: string,
  listenerId: string,
  allCharacters: string[]
): 'left' | 'right' | 'center' {
  const speakerIndex = allCharacters.indexOf(speakerId);
  const listenerIndex = allCharacters.indexOf(listenerId);
  
  if (speakerIndex < listenerIndex) return 'left';
  if (speakerIndex > listenerIndex) return 'right';
  return 'center';
}

/**
 * Check if a character is mentioned by name in the content
 */
function checkIfMentioned(characterId: string, content: string): boolean {
  try {
    const character = getCharacter(characterId);
    const nameLower = character.name.toLowerCase();
    const contentLower = content.toLowerCase();
    
    // Check for name mention
    if (contentLower.includes(nameLower)) return true;
    
    // Check for first name only
    const firstName = nameLower.split(' ')[0];
    if (firstName.length > 2 && contentLower.includes(firstName)) return true;
    
    return false;
  } catch {
    return false;
  }
}

// ============================================
// EXPORTS FOR PROMPT BUILDING
// ============================================

/**
 * Get list of valid animations for LLM prompt
 */
export function getAnimationsList(): string {
  return VALID_ANIMATIONS.join(', ');
}

/**
 * Get list of valid look directions for LLM prompt
 */
export function getLookDirectionsList(): string {
  return VALID_LOOK_DIRECTIONS.join(', ');
}

/**
 * Get list of valid eye states for LLM prompt
 */
export function getEyeStatesList(): string {
  return VALID_EYE_STATES.join(', ');
}

/**
 * Get list of valid eyebrow states for LLM prompt (anime-style)
 */
export function getEyebrowStatesList(): string {
  return VALID_EYEBROW_STATES.join(', ');
}

/**
 * Get list of valid mouth states for LLM prompt
 */
export function getMouthStatesList(): string {
  return VALID_MOUTH_STATES.join(', ');
}

/**
 * Get list of valid face states for LLM prompt (anime-style)
 */
export function getFaceStatesList(): string {
  return VALID_FACE_STATES.join(', ');
}

/**
 * Get list of valid nose states for LLM prompt (NEW)
 */
export function getNoseStatesList(): string {
  return VALID_NOSE_STATES.join(', ');
}

/**
 * Get list of valid cheek states for LLM prompt (NEW)
 */
export function getCheekStatesList(): string {
  return VALID_CHEEK_STATES.join(', ');
}

/**
 * Get list of valid forehead states for LLM prompt (NEW)
 */
export function getForeheadStatesList(): string {
  return VALID_FOREHEAD_STATES.join(', ');
}

/**
 * Get list of valid jaw states for LLM prompt (NEW)
 */
export function getJawStatesList(): string {
  return VALID_JAW_STATES.join(', ');
}

/**
 * Get list of valid effects for LLM prompt
 */
export function getEffectsList(): string {
  return VALID_EFFECTS.join(', ');
}

/**
 * Get timing guidelines for LLM
 */
export function getTimingGuidelines(): string {
  return `
- Minimum segment duration: ${MIN_SEGMENT_DURATION}ms
- Maximum segment duration: ${MAX_SEGMENT_DURATION}ms
- Talking speed: approximately ${DEFAULT_TALKING_SPEED}ms per character of text
- Default thinking duration: ${DEFAULT_THINKING_DURATION}ms
- Add 500-1000ms gaps between character responses for natural pacing
`;
}

/**
 * Adjust a timeline's duration to match a target duration (e.g., TTS duration)
 * Scales all segment durations proportionally
 *
 * @param timeline - The timeline to adjust
 * @param targetDuration - Target total duration in milliseconds
 * @returns New timeline with adjusted durations
 */
export function adjustTimelineToTargetDuration(
  timeline: CharacterTimeline,
  targetDuration: number
): CharacterTimeline {
  // Don't adjust if current duration is 0 or very small
  if (timeline.totalDuration <= 0) {
    return timeline;
  }

  // Calculate scale factor
  const scaleFactor = targetDuration / timeline.totalDuration;

  // Scale all segment durations
  const adjustedSegments = timeline.segments.map((segment) => ({
    ...segment,
    duration: Math.max(MIN_SEGMENT_DURATION, Math.round(segment.duration * scaleFactor)),
  }));

  // Calculate actual new duration (sum of adjusted segments)
  const actualDuration = adjustedSegments.reduce((sum, seg) => sum + seg.duration, 0);

  return {
    ...timeline,
    totalDuration: actualDuration,
    segments: adjustedSegments,
  };
}

/**
 * Adjust an entire scene's timelines to match TTS durations
 *
 * @param scene - The scene to adjust
 * @param ttsDurations - Map of characterId to target TTS duration in ms
 * @returns New scene with adjusted timeline durations
 */
export function adjustSceneForTTS(
  scene: OrchestrationScene,
  ttsDurations: Map<string, number>
): OrchestrationScene {
  const adjustedTimelines = scene.timelines.map((timeline) => {
    const targetDuration = ttsDurations.get(timeline.characterId);
    if (targetDuration && targetDuration > 0) {
      return adjustTimelineToTargetDuration(timeline, targetDuration);
    }
    return timeline;
  });

  // Recalculate scene duration
  const maxEndTime = Math.max(
    ...adjustedTimelines.map((t) => t.startDelay + t.totalDuration)
  );

  return {
    ...scene,
    timelines: adjustedTimelines,
    sceneDuration: maxEndTime,
  };
}

