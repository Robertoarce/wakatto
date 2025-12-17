/**
 * Entrance Animations Service
 *
 * Manages character entrance animations when new conversations start.
 * Provides various entrance styles with staggered timing for multiple characters.
 */

import { AnimationState } from '../components/CharacterDisplay3D';

/**
 * Types of entrance animations available
 */
export type EntranceAnimationType =
  | 'drop_from_sky'   // Falls from above with bounce
  | 'slide_in'        // Walks in from side (current default)
  | 'bounce_in'       // Bounces in from side with spring physics
  | 'grow_in'         // Starts small, grows to full size
  | 'spin_in'         // Spins in while appearing
  | 'teleport_in';    // Materializes with fade effect

/**
 * Configuration for a single character's entrance
 */
export interface EntranceConfig {
  type: EntranceAnimationType;
  bodyAnimation: AnimationState;  // What the 3D character does during entrance
  duration: number;               // Total duration in ms
  startDelay: number;             // Delay before this character starts (for staggering)
}

/**
 * Animation configurations for each entrance type
 */
const ENTRANCE_CONFIGS: Record<EntranceAnimationType, Omit<EntranceConfig, 'startDelay'>> = {
  drop_from_sky: {
    type: 'drop_from_sky',
    bodyAnimation: 'surprise_happy',
    duration: 1200,
  },
  slide_in: {
    type: 'slide_in',
    bodyAnimation: 'walking',
    duration: 800,
  },
  bounce_in: {
    type: 'bounce_in',
    bodyAnimation: 'excited',
    duration: 1000,
  },
  grow_in: {
    type: 'grow_in',
    bodyAnimation: 'wave',
    duration: 900,
  },
  spin_in: {
    type: 'spin_in',
    bodyAnimation: 'celebrate',
    duration: 1100,
  },
  teleport_in: {
    type: 'teleport_in',
    bodyAnimation: 'surprised_jump',
    duration: 800,
  },
};

/**
 * All available entrance types for random selection
 */
const ENTRANCE_TYPES: EntranceAnimationType[] = [
  'drop_from_sky',
  'slide_in',
  'bounce_in',
  'grow_in',
  'spin_in',
  'teleport_in',
];

/**
 * Get a random entrance type
 */
function getRandomEntranceType(): EntranceAnimationType {
  const index = Math.floor(Math.random() * ENTRANCE_TYPES.length);
  return ENTRANCE_TYPES[index];
}

/**
 * Generate entrance sequence for multiple characters
 * Each character gets a random entrance type with staggered timing
 *
 * @param characterIds - Array of character IDs to generate entrances for
 * @param staggerDelay - Delay between each character's entrance start (default 250ms)
 * @returns Map of characterId -> EntranceConfig
 */
export function generateEntranceSequence(
  characterIds: string[],
  staggerDelay: number = 250
): Map<string, EntranceConfig> {
  const sequence = new Map<string, EntranceConfig>();

  characterIds.forEach((charId, index) => {
    const entranceType = getRandomEntranceType();
    const config = ENTRANCE_CONFIGS[entranceType];

    sequence.set(charId, {
      ...config,
      startDelay: index * staggerDelay,
    });
  });

  return sequence;
}

/**
 * Generate entrance sequence with a specific entrance type for all characters
 * Useful for testing or when a uniform entrance is desired
 *
 * @param characterIds - Array of character IDs
 * @param entranceType - The entrance type to use for all characters
 * @param staggerDelay - Delay between each character's entrance start
 * @returns Map of characterId -> EntranceConfig
 */
export function generateUniformEntranceSequence(
  characterIds: string[],
  entranceType: EntranceAnimationType,
  staggerDelay: number = 250
): Map<string, EntranceConfig> {
  const sequence = new Map<string, EntranceConfig>();
  const config = ENTRANCE_CONFIGS[entranceType];

  characterIds.forEach((charId, index) => {
    sequence.set(charId, {
      ...config,
      startDelay: index * staggerDelay,
    });
  });

  return sequence;
}

/**
 * Calculate total duration of an entrance sequence
 * This is the time when the last character finishes their entrance
 *
 * @param sequence - The entrance sequence map
 * @returns Total duration in milliseconds
 */
export function getTotalEntranceDuration(sequence: Map<string, EntranceConfig>): number {
  let maxEndTime = 0;

  sequence.forEach((config) => {
    const endTime = config.startDelay + config.duration;
    if (endTime > maxEndTime) {
      maxEndTime = endTime;
    }
  });

  return maxEndTime;
}

/**
 * Get the entrance config for a specific entrance type
 * Useful for debugging or creating custom sequences
 *
 * @param entranceType - The entrance type to get config for
 * @returns The entrance config (without startDelay)
 */
export function getEntranceConfig(entranceType: EntranceAnimationType): Omit<EntranceConfig, 'startDelay'> {
  return { ...ENTRANCE_CONFIGS[entranceType] };
}

/**
 * Get all available entrance types
 * @returns Array of entrance type names
 */
export function getAvailableEntranceTypes(): EntranceAnimationType[] {
  return [...ENTRANCE_TYPES];
}
