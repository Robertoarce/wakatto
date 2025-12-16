/**
 * Voice Configuration System
 * 
 * Defines all voice parameters that the LLM can use to orchestrate
 * character speech patterns, including basic voice description and
 * emotional/dramatic context.
 */

// ============================================
// BASIC VOICE DESCRIPTION
// ============================================

/**
 * Pitch - The frequency/height of the voice
 */
export type VoicePitch = 'high' | 'medium' | 'low' | 'deep' | 'shrill';

export const VOICE_PITCHES: VoicePitch[] = ['high', 'medium', 'low', 'deep', 'shrill'];

/**
 * Tone/Texture - The quality and character of the voice
 */
export type VoiceTone = 
  | 'smooth'    // Even, polished
  | 'warm'      // Friendly, comforting
  | 'crisp'     // Clear, precise
  | 'gravelly'  // Rough, textured
  | 'breathy'   // Airy, soft edges
  | 'nasally'   // Through the nose
  | 'husky'     // Low and slightly rough
  | 'brassy'    // Bold, projecting
  | 'raspy'     // Scratchy, worn
  | 'silky';    // Soft, flowing

export const VOICE_TONES: VoiceTone[] = [
  'smooth', 'warm', 'crisp', 'gravelly', 'breathy',
  'nasally', 'husky', 'brassy', 'raspy', 'silky'
];

/**
 * Volume - The loudness level
 */
export type VoiceVolume = 'whispered' | 'soft' | 'normal' | 'loud' | 'booming';

export const VOICE_VOLUMES: VoiceVolume[] = ['whispered', 'soft', 'normal', 'loud', 'booming'];

/**
 * Pace/Tempo - The speed of speech (affects text reveal timing)
 */
export type VoicePace = 'slow' | 'normal' | 'fast';

export const VOICE_PACES: VoicePace[] = ['slow', 'normal', 'fast'];

/**
 * Pace multipliers for text reveal speed calculation
 * Higher multiplier = faster speech = less ms per character
 * Base speed is 65ms per character (DEFAULT_TALKING_SPEED)
 */
export const PACE_MULTIPLIERS: Record<VoicePace, number> = {
  slow: 0.5,   // ~130ms per char - measured, thoughtful
  normal: 0.75, // ~87ms per char - conversational
  fast: 1.2    // ~54ms per char - energetic, urgent
};

// ============================================
// EMOTIONAL/DRAMATIC CONTEXT
// ============================================

/**
 * Mood - The emotional state
 */
export type VoiceMood = 
  | 'neutral'     // No strong emotion
  | 'angry'       // Irritated, furious
  | 'sad'         // Melancholic, down
  | 'joyful'      // Happy, upbeat
  | 'sarcastic'   // Ironic, mocking
  | 'nervous'     // Anxious, uneasy
  | 'confident'   // Self-assured
  | 'excited'     // Enthusiastic, energetic
  | 'calm'        // Relaxed, peaceful
  | 'melancholic' // Wistful, reflective
  | 'hopeful'     // Optimistic
  | 'frustrated'  // Exasperated
  | 'amused';     // Entertained, playful

export const VOICE_MOODS: VoiceMood[] = [
  'neutral', 'angry', 'sad', 'joyful', 'sarcastic', 'nervous',
  'confident', 'excited', 'calm', 'melancholic', 'hopeful',
  'frustrated', 'amused'
];

/**
 * Intent - The purpose/goal of the speech
 */
export type VoiceIntent = 
  | 'neutral'      // No specific intent
  | 'commanding'   // Authoritative, directive
  | 'pleading'     // Begging, requesting
  | 'seductive'    // Alluring, charming
  | 'mocking'      // Teasing, ridiculing
  | 'reassuring'   // Comforting, soothing
  | 'questioning'  // Curious, inquiring
  | 'explaining'   // Teaching, clarifying
  | 'warning'      // Cautioning, alerting
  | 'encouraging'  // Supportive, motivating
  | 'dismissive'   // Uninterested, brushing off
  | 'sincere';     // Genuine, heartfelt

export const VOICE_INTENTS: VoiceIntent[] = [
  'neutral', 'commanding', 'pleading', 'seductive', 'mocking',
  'reassuring', 'questioning', 'explaining', 'warning',
  'encouraging', 'dismissive', 'sincere'
];

// ============================================
// COMPOSITE TYPES
// ============================================

/**
 * Full voice profile for a character's default voice
 */
export interface CharacterVoiceProfile {
  pitch: VoicePitch;
  tone: VoiceTone;
  volume: VoiceVolume;
  pace: VoicePace;
  defaultMood: VoiceMood;
  defaultIntent: VoiceIntent;
}

/**
 * Voice parameters for a specific animation segment
 * All fields optional - uses character defaults if not specified
 */
export interface SegmentVoice {
  pitch?: VoicePitch;
  tone?: VoiceTone;
  volume?: VoiceVolume;
  pace?: VoicePace;
  mood?: VoiceMood;
  intent?: VoiceIntent;
}

// ============================================
// VALIDATION HELPERS
// ============================================

export function isValidPitch(value: string): value is VoicePitch {
  return VOICE_PITCHES.includes(value as VoicePitch);
}

export function isValidTone(value: string): value is VoiceTone {
  return VOICE_TONES.includes(value as VoiceTone);
}

export function isValidVolume(value: string): value is VoiceVolume {
  return VOICE_VOLUMES.includes(value as VoiceVolume);
}

export function isValidPace(value: string): value is VoicePace {
  return VOICE_PACES.includes(value as VoicePace);
}

export function isValidMood(value: string): value is VoiceMood {
  return VOICE_MOODS.includes(value as VoiceMood);
}

export function isValidIntent(value: string): value is VoiceIntent {
  return VOICE_INTENTS.includes(value as VoiceIntent);
}

/**
 * Parse and validate a SegmentVoice object from LLM response
 * Returns validated voice or undefined if invalid
 */
export function parseSegmentVoice(data: any): SegmentVoice | undefined {
  if (!data || typeof data !== 'object') {
    return undefined;
  }

  const voice: SegmentVoice = {};

  // Handle both compact (v.p) and full (pitch) key formats
  const pitch = data.p || data.pitch;
  const tone = data.t || data.tone;
  const volume = data.vol || data.volume;
  const pace = data.pace;
  const mood = data.mood;
  const intent = data.int || data.intent;

  if (pitch && isValidPitch(pitch)) voice.pitch = pitch;
  if (tone && isValidTone(tone)) voice.tone = tone;
  if (volume && isValidVolume(volume)) voice.volume = volume;
  if (pace && isValidPace(pace)) voice.pace = pace;
  if (mood && isValidMood(mood)) voice.mood = mood;
  if (intent && isValidIntent(intent)) voice.intent = intent;

  // Return undefined if no valid properties were found
  return Object.keys(voice).length > 0 ? voice : undefined;
}

/**
 * Get the pace multiplier for a given pace value
 * Returns 1.0 (normal) if pace is undefined or invalid
 */
export function getPaceMultiplier(pace?: VoicePace): number {
  if (!pace || !isValidPace(pace)) {
    return PACE_MULTIPLIERS.normal;
  }
  return PACE_MULTIPLIERS[pace];
}

/**
 * Merge character base voice with segment overrides
 */
export function mergeVoiceWithDefaults(
  baseVoice: CharacterVoiceProfile | undefined,
  segmentVoice: SegmentVoice | undefined
): SegmentVoice {
  const defaultVoice: SegmentVoice = baseVoice ? {
    pitch: baseVoice.pitch,
    tone: baseVoice.tone,
    volume: baseVoice.volume,
    pace: baseVoice.pace,
    mood: baseVoice.defaultMood,
    intent: baseVoice.defaultIntent
  } : {
    pitch: 'medium',
    tone: 'warm',
    volume: 'normal',
    pace: 'normal',
    mood: 'neutral',
    intent: 'neutral'
  };

  if (!segmentVoice) {
    return defaultVoice;
  }

  return {
    pitch: segmentVoice.pitch ?? defaultVoice.pitch,
    tone: segmentVoice.tone ?? defaultVoice.tone,
    volume: segmentVoice.volume ?? defaultVoice.volume,
    pace: segmentVoice.pace ?? defaultVoice.pace,
    mood: segmentVoice.mood ?? defaultVoice.mood,
    intent: segmentVoice.intent ?? defaultVoice.intent
  };
}

// ============================================
// LLM PROMPT HELPERS
// ============================================

/**
 * Get voice options formatted for LLM prompt (compact format)
 */
export function getVoiceOptionsForPrompt(): string {
  return `Voice (optional "v" object per segment):
- p (pitch): ${VOICE_PITCHES.join(', ')}
- t (tone): ${VOICE_TONES.join(', ')}
- vol (volume): ${VOICE_VOLUMES.join(', ')}
- pace: ${VOICE_PACES.join(', ')}
- mood: ${VOICE_MOODS.join(', ')}
- int (intent): ${VOICE_INTENTS.join(', ')}`;
}

/**
 * Get voice options formatted for LLM prompt (full format)
 */
export function getVoiceOptionsForPromptFull(): string {
  return `### Voice Parameters (optional per segment)

Add a "voice" object to any segment to control speech characteristics:

**Basic Voice Description:**
- pitch: ${VOICE_PITCHES.join(', ')}
- tone: ${VOICE_TONES.join(', ')}
- volume: ${VOICE_VOLUMES.join(', ')}
- pace: ${VOICE_PACES.join(', ')} (affects text reveal speed)

**Emotional/Dramatic Context:**
- mood: ${VOICE_MOODS.join(', ')}
- intent: ${VOICE_INTENTS.join(', ')}

Example:
{
  "animation": "talking",
  "duration": 3000,
  "talking": true,
  "voice": {
    "pitch": "low",
    "tone": "warm",
    "volume": "soft",
    "pace": "deliberate",
    "mood": "calm",
    "intent": "reassuring"
  }
}`;
}

