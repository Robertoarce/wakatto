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
  VisualEffect,
  ComplementaryAnimation 
} from '../components/CharacterDisplay3D';
import { getCharacter } from '../config/characters';
import { SegmentVoice, parseSegmentVoice } from '../config/voiceConfig';

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
    mouthState?: MouthState;
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
  timeline: Array<{
    animation: string;
    duration: number;
    look?: string;
    eyes?: string;
    mouth?: string;
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
  'idle', 'thinking', 'talking', 'confused', 'happy', 'excited',
  'winning', 'walking', 'jump', 'surprise_jump', 'surprise_happy',
  'lean_back', 'lean_forward', 'cross_arms', 'nod', 'shake_head',
  'shrug', 'wave', 'point', 'clap', 'bow',
  // New animations
  'facepalm', 'dance', 'laugh', 'cry', 'angry', 'nervous',
  'celebrate', 'peek', 'doze', 'stretch'
];

const VALID_LOOK_DIRECTIONS: LookDirection[] = [
  'center', 'left', 'right', 'up', 'down', 'at_left_character', 'at_right_character'
];

const VALID_EYE_STATES: EyeState[] = [
  'open', 'closed', 'wink_left', 'wink_right', 'blink'
];

const VALID_EYEBROW_STATES: EyebrowState[] = [
  'normal', 'raised', 'furrowed', 'sad', 'worried', 'one_raised', 'wiggle'
];

const VALID_MOUTH_STATES: MouthState[] = [
  'closed', 'open', 'smile', 'wide_smile', 'surprised'
];

const VALID_FACE_STATES: FaceState[] = [
  'normal', 'blush', 'sweat_drop', 'sparkle_eyes', 'heart_eyes', 
  'spiral_eyes', 'tears', 'anger_vein', 'shadow_face'
];

const VALID_EFFECTS: VisualEffect[] = [
  'none', 'confetti', 'spotlight', 'sparkles', 'hearts'
];

// Timing constraints
const MIN_SEGMENT_DURATION = 300; // ms
const MAX_SEGMENT_DURATION = 10000; // ms
export const DEFAULT_TALKING_SPEED = 65; // ms per character of text
const DEFAULT_THINKING_DURATION = 1500; // ms 

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
// COMPACT JSON SUPPORT
// ============================================

/**
 * Compact JSON key mappings:
 * s -> scene, dur -> totalDuration, ch -> characters
 * c -> character, t -> content, d -> startDelay
 * tl -> timeline, a -> animation, ms -> duration, lk -> look
 */
interface CompactSceneResponse {
  s: {
    dur: number;
    ch: Array<{
      c: string;
      t: string;
      d: number;
      tl: Array<{
        a: string;
        ms: number;
        lk?: string;
        talking?: boolean;
        eyes?: string;
        mouth?: string;
      }>;
    }>;
  };
}

/**
 * Detect if response is in compact JSON format
 */
function isCompactFormat(parsed: any): parsed is CompactSceneResponse {
  return parsed && typeof parsed.s === 'object' && Array.isArray(parsed.s?.ch);
}

/**
 * Normalize compact JSON response to full format
 * Converts short keys to full key names for processing
 */
function normalizeCompactJSON(compact: CompactSceneResponse): LLMSceneResponse {
  console.log('[AnimOrch] Converting compact JSON format to full format');
  
  return {
    scene: {
      totalDuration: compact.s.dur,
      characters: compact.s.ch.map(ch => ({
        character: ch.c,
        content: ch.t,
        startDelay: ch.d,
        timeline: ch.tl.map(seg => ({
          animation: seg.a,
          duration: seg.ms,
          look: seg.lk,
          talking: seg.talking,
          eyes: seg.eyes,
          mouth: seg.mouth,
        }))
      }))
    }
  };
}

/**
 * Parse raw LLM response into OrchestrationScene
 */
export function parseOrchestrationScene(
  rawResponse: string,
  selectedCharacters: string[]
): OrchestrationScene | null {
  try {
    // Clean and extract JSON
    let cleaned = rawResponse.trim();
    cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Try to find the full JSON object (may include reasoning)
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }
    
    let parsed: any = JSON.parse(cleaned);
    
    // Check if this is compact format and normalize it
    if (isCompactFormat(parsed)) {
      parsed = normalizeCompactJSON(parsed);
    }
    
    // Cast to expected type after potential normalization
    const normalizedParsed: LLMSceneResponse = parsed;
    
    // Extract and log ARQ reasoning if present
    if (normalizedParsed.reasoning) {
      console.log('[ARQ] ===== Reasoning Analysis =====');
      console.log('[ARQ] Context:', normalizedParsed.reasoning.context || 'Not provided');
      console.log('[ARQ] Character Selection:', normalizedParsed.reasoning.characterSelection || 'Not provided');
      if (normalizedParsed.reasoning.voiceCheck) {
        console.log('[ARQ] Voice Check:', JSON.stringify(normalizedParsed.reasoning.voiceCheck, null, 2));
      }
      if (normalizedParsed.reasoning.formatValidation) {
        const fv = normalizedParsed.reasoning.formatValidation;
        console.log('[ARQ] Format Validation:', {
          usingCharacterIds: fv.usingCharacterIds ?? 'Not checked',
          separateObjects: fv.separateObjects ?? 'Not checked',
          noNamePrefixes: fv.noNamePrefixes ?? 'Not checked',
          cleanContent: fv.cleanContent ?? 'Not checked'
        });
      }
      console.log('[ARQ] Decision:', normalizedParsed.reasoning.decision || 'Not provided');
      console.log('[ARQ] ================================');
    } else {
      console.warn('[ARQ] No reasoning provided by LLM - enforcement may be weaker');
    }
    
    if (!normalizedParsed.scene || !Array.isArray(normalizedParsed.scene.characters)) {
      console.error('[AnimOrch] Invalid scene structure');
      return null;
    }
    
    // Parse each character timeline, checking for combined responses
    const timelines: CharacterTimeline[] = [];
    
    for (const charResponse of normalizedParsed.scene.characters) {
      // Check if this response contains multiple character responses combined
      const splitResponses = splitCombinedContent(charResponse.content, selectedCharacters);
      
      if (splitResponses && splitResponses.length > 1) {
        // LLM combined multiple responses - split them
        console.log('[AnimOrch] Splitting combined response into', splitResponses.length, 'separate timelines');
        
        let currentDelay = charResponse.startDelay || 0;
        for (const resp of splitResponses) {
          const segments = createDefaultTimeline(resp.content);
          const totalDuration = segments.reduce((sum, s) => sum + s.duration, 0);
          
          timelines.push({
            characterId: resp.characterId,
            content: resp.content,
            totalDuration,
            segments,
            startDelay: currentDelay
          });
          
          currentDelay += totalDuration + 500; // 500ms gap between
        }
      } else {
        // Normal single-character response
        const timeline = parseCharacterTimeline(charResponse, selectedCharacters);
        if (timeline) {
          // Also check if content has character prefix and clean it
          timeline.content = cleanCharacterPrefix(timeline.content);
          timelines.push(timeline);
        }
      }
    }
    
    if (timelines.length === 0) {
      console.error('[AnimOrch] No valid timelines parsed');
      return null;
    }
    
    // Validate parsed timelines for guideline violations
    validateTimelines(timelines, selectedCharacters);
    
    // Calculate scene duration
    const sceneDuration = Math.max(
      parsed.scene.totalDuration || 0,
      ...timelines.map(t => t.startDelay + t.totalDuration)
    );
    
    return {
      timelines,
      sceneDuration,
      nonSpeakerBehavior: {} // Will be filled by fillGapsForNonSpeakers
    };
    
  } catch (error) {
    console.error('[AnimOrch] Failed to parse scene:', error);
    return null;
  }
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
      const segment = parseSegment(seg, response.content.length);
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
    startDelay: Math.max(0, response.startDelay || 0)
  };
}

/**
 * Parse a single animation segment
 */
function parseSegment(
  raw: LLMCharacterResponse['timeline'][0],
  contentLength: number
): AnimationSegment {
  const animation = validateAnimation(raw.animation || 'idle');
  const duration = clampDuration(raw.duration);
  
  const complementary: AnimationSegment['complementary'] = {};
  
  const lookDir = validateLookDirection(raw.look);
  if (lookDir) complementary.lookDirection = lookDir;
  
  const eyeState = validateEyeState(raw.eyes);
  if (eyeState) complementary.eyeState = eyeState;
  
  const mouthState = validateMouthState(raw.mouth);
  if (mouthState) complementary.mouthState = mouthState;
  
  const effect = validateEffect(raw.effect);
  if (effect && effect !== 'none') complementary.effect = effect;
  
  const segment: AnimationSegment = {
    animation,
    duration,
    isTalking: raw.talking === true
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
 */
export function createDefaultTimeline(content: string): AnimationSegment[] {
  const talkingDuration = Math.max(
    2000,
    content.length * DEFAULT_TALKING_SPEED
  );
  
  return [
    {
      animation: 'thinking',
      duration: DEFAULT_THINKING_DURATION,
      isTalking: false,
      complementary: { lookDirection: 'up' }
    },
    {
      animation: 'talking',
      duration: talkingDuration,
      isTalking: true,
      textReveal: { startIndex: 0, endIndex: content.length }
    },
    {
      animation: 'idle',
      duration: 1000,
      isTalking: false,
      complementary: { mouthState: 'smile' }
    }
  ];
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
    
    timelines.push({
      characterId: response.characterId,
      content: response.content,
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

