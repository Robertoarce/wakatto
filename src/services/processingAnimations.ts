/**
 * Processing/Thinking Animations
 * 
 * Generates varied animation segments for characters while waiting for AI response.
 * Used to make characters appear engaged and thoughtful during processing.
 */

import { AnimationState, LookDirection, MouthState, EyeState, EyebrowState } from '../components/CharacterDisplay3D';
import { AnimationSegment } from './animationOrchestration';

/**
 * Processing animation preset - defines a complete animation behavior
 */
interface ProcessingAnimationPreset {
  animation: AnimationState;
  duration: number; // Base duration in ms
  durationVariance?: number; // Random variance to add (0-1 multiplier)
  complementary?: {
    lookDirection?: LookDirection;
    eyeState?: EyeState;
    eyebrowState?: EyebrowState;
    mouthState?: MouthState;
    speed?: number;
  };
  description: string;
}

/**
 * Available processing animation presets
 * These are cycled through randomly while waiting for AI response
 * ENHANCED: Faster cycling and more dynamic animations for better visibility
 */
const PROCESSING_PRESETS: ProcessingAnimationPreset[] = [
  {
    animation: 'thinking',
    duration: 1500, // Reduced from 2500
    durationVariance: 0.2,
    complementary: {
      lookDirection: 'up',
      eyeState: 'open',
      mouthState: 'closed',
    },
    description: 'Classic thinking pose with hand on chin',
  },
  {
    animation: 'look_around',
    duration: 1200, // Fast look around
    durationVariance: 0.2,
    complementary: {
      eyeState: 'open',
      eyebrowState: 'raised',
    },
    description: 'Looking around as if searching for answer',
  },
  {
    animation: 'nod',
    duration: 1000, // Reduced from 1500
    durationVariance: 0.2,
    complementary: {
      eyeState: 'blink',
      mouthState: 'closed',
    },
    description: 'Nodding in thought',
  },
  {
    animation: 'head_tilt',
    duration: 1200, // Reduced from 2000
    durationVariance: 0.2,
    complementary: {
      eyebrowState: 'raised',
      eyeState: 'open',
    },
    description: 'Curious head tilt to the side',
  },
  {
    animation: 'chin_stroke',
    duration: 1500, // Reduced from 2500
    durationVariance: 0.2,
    complementary: {
      lookDirection: 'down',
      mouthState: 'closed',
    },
    description: 'Thoughtfully stroking chin',
  },
  {
    animation: 'lean_forward',
    duration: 1200, // Reduced from 2000
    durationVariance: 0.2,
    complementary: {
      mouthState: 'open',
      eyeState: 'open',
    },
    description: 'Leaning forward with interest',
  },
  {
    animation: 'weight_shift',
    duration: 1000, // New: subtle movement
    durationVariance: 0.3,
    complementary: {
      eyeState: 'open',
    },
    description: 'Shifting weight while thinking',
  },
  {
    animation: 'idle',
    duration: 1000, // Reduced from 1500
    durationVariance: 0.3,
    complementary: {
      lookDirection: 'up',
      eyebrowState: 'raised',
      eyeState: 'blink',
    },
    description: 'Glancing up thoughtfully',
  },
  {
    animation: 'fidget',
    duration: 1200, // New: shows processing
    durationVariance: 0.2,
    complementary: {
      eyeState: 'open',
      mouthState: 'closed',
    },
    description: 'Slight fidgeting while processing',
  },
  {
    animation: 'peek',
    duration: 1000, // Reduced from 1500
    durationVariance: 0.2,
    complementary: {
      eyeState: 'open',
    },
    description: 'Curious peeking to the side',
  },
  {
    animation: 'excited',
    duration: 1500, // Occasional excitement (10% chance due to array position)
    durationVariance: 0.2,
    complementary: {
      eyeState: 'open',
      eyebrowState: 'raised',
      mouthState: 'smile',
    },
    description: 'Excited about forming an idea',
  },
];

/**
 * Look at other character presets - used when multiple characters are present
 */
const LOOK_AT_OTHER_PRESETS: ProcessingAnimationPreset[] = [
  {
    animation: 'idle',
    duration: 2000,
    durationVariance: 0.3,
    complementary: {
      lookDirection: 'at_left_character',
      eyeState: 'open',
      mouthState: 'smile',
    },
    description: 'Looking at character to the left',
  },
  {
    animation: 'idle',
    duration: 2000,
    durationVariance: 0.3,
    complementary: {
      lookDirection: 'at_right_character',
      eyeState: 'open',
      mouthState: 'smile',
    },
    description: 'Looking at character to the right',
  },
  {
    animation: 'nod',
    duration: 1500,
    durationVariance: 0.2,
    complementary: {
      lookDirection: 'at_left_character',
      eyeState: 'blink',
    },
    description: 'Nodding while looking at left character',
  },
  {
    animation: 'nod',
    duration: 1500,
    durationVariance: 0.2,
    complementary: {
      lookDirection: 'at_right_character',
      eyeState: 'blink',
    },
    description: 'Nodding while looking at right character',
  },
];

/**
 * Get the position of one character relative to another
 */
function getRelativePosition(
  characterId: string,
  allCharacters: string[]
): 'left' | 'right' | 'center' {
  const index = allCharacters.indexOf(characterId);
  if (index === -1 || allCharacters.length === 1) return 'center';
  if (index === 0) return 'left';
  if (index === allCharacters.length - 1) return 'right';
  return 'center';
}

/**
 * Pick a random preset from an array
 */
function pickRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Calculate duration with variance
 */
function calculateDuration(preset: ProcessingAnimationPreset): number {
  const variance = preset.durationVariance || 0;
  const randomFactor = 1 + (Math.random() - 0.5) * 2 * variance;
  return Math.round(preset.duration * randomFactor);
}

/**
 * Generate varied processing animation segments for a character
 * 
 * @param characterId - The character to generate animations for
 * @param allCharacters - All characters in the scene (for look direction logic)
 * @param totalDuration - Total duration to fill with animations (ms)
 * @returns Array of animation segments
 */
export function generateProcessingSegments(
  characterId: string,
  allCharacters: string[],
  totalDuration: number
): AnimationSegment[] {
  const segments: AnimationSegment[] = [];
  let remainingDuration = totalDuration;
  let lastPreset: ProcessingAnimationPreset | null = null;
  
  const hasOtherCharacters = allCharacters.length > 1;
  const position = getRelativePosition(characterId, allCharacters);
  
  while (remainingDuration > 500) { // Minimum segment of 500ms
    let preset: ProcessingAnimationPreset;
    
    // 30% chance to look at other characters if there are multiple
    if (hasOtherCharacters && Math.random() < 0.3) {
      // Filter look presets based on position
      const availableLookPresets = LOOK_AT_OTHER_PRESETS.filter(p => {
        const lookDir = p.complementary?.lookDirection;
        // If we're on the left, we can only look right
        if (position === 'left' && lookDir === 'at_left_character') return false;
        // If we're on the right, we can only look left
        if (position === 'right' && lookDir === 'at_right_character') return false;
        return true;
      });
      
      if (availableLookPresets.length > 0) {
        preset = pickRandom(availableLookPresets);
      } else {
        preset = pickRandom(PROCESSING_PRESETS);
      }
    } else {
      // Pick a random processing preset, avoiding immediate repeats
      let attempts = 0;
      do {
        preset = pickRandom(PROCESSING_PRESETS);
        attempts++;
      } while (
        lastPreset && 
        preset.animation === lastPreset.animation && 
        attempts < 5
      );
    }
    
    const duration = Math.min(calculateDuration(preset), remainingDuration);
    
    segments.push({
      animation: preset.animation,
      duration,
      isTalking: false,
      complementary: preset.complementary ? {
        lookDirection: preset.complementary.lookDirection,
        eyeState: preset.complementary.eyeState,
        mouthState: preset.complementary.mouthState,
        speed: preset.complementary.speed,
      } : undefined,
    });
    
    remainingDuration -= duration;
    lastPreset = preset;
  }
  
  // If there's a tiny bit of remaining time, add idle
  if (remainingDuration > 0) {
    segments.push({
      animation: 'idle',
      duration: remainingDuration,
      isTalking: false,
    });
  }
  
  return segments;
}

/**
 * Generate a complete processing scene for all characters
 * 
 * @param allCharacters - All character IDs to animate
 * @param estimatedDuration - Estimated total duration (will be long, replaced when real scene arrives)
 * @returns OrchestrationScene-compatible object
 */
export function generateProcessingScene(
  allCharacters: string[],
  estimatedDuration: number = 15000
): {
  sceneDuration: number;
  timelines: Array<{
    characterId: string;
    content: string;
    totalDuration: number;
    startDelay: number;
    segments: AnimationSegment[];
  }>;
  nonSpeakerBehavior: Record<string, never>;
} {
  return {
    sceneDuration: estimatedDuration,
    timelines: allCharacters.map((charId, index) => {
      const segments = generateProcessingSegments(charId, allCharacters, estimatedDuration);
      const totalDuration = segments.reduce((sum, seg) => sum + seg.duration, 0);
      return {
        characterId: charId,
        content: '', // No text during processing
        totalDuration,
        startDelay: index * 150, // Slight stagger for natural feel
        segments,
      };
    }),
    nonSpeakerBehavior: {},
  };
}

