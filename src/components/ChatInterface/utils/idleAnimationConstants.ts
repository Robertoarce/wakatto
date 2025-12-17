/**
 * Constants and helpers for idle animation system
 */

import { AnimationState, ComplementaryAnimation, LookDirection } from '../../CharacterDisplay3D';
import { IdleAnimationState } from '../types/chatInterface.types';

// Available idle animations pool
export const IDLE_ANIMATIONS: AnimationState[] = [
  'idle', 'kick_ground', 'meh', 'foot_tap',
  'look_around', 'yawn', 'fidget', 'rub_eyes', 'weight_shift'
];

// Base complementary states (without look direction - that's handled separately)
export const IDLE_COMPLEMENTARY_BASE: ComplementaryAnimation[] = [
  { mouthState: 'closed' },
  { mouthState: 'closed', eyeState: 'blink' },
  { mouthState: 'smile' },
  { eyeState: 'open' },
  {},
];

/**
 * Get appropriate look direction based on character's position in the scene
 * Characters on the left should look right (toward center/others)
 * Characters on the right should look left (toward center/others)
 * Center characters can look either way
 */
function getPositionAwareLookDirection(
  characterIndex: number,
  totalCharacters: number
): LookDirection | undefined {
  // 50% chance of having a look direction at all
  if (Math.random() > 0.5) {
    return undefined;
  }

  // Single character - can look anywhere
  if (totalCharacters === 1) {
    const directions: (LookDirection | undefined)[] = ['left', 'right', 'up', 'center', undefined];
    return directions[Math.floor(Math.random() * directions.length)];
  }

  // Calculate position: -1 = left side, 0 = center, 1 = right side
  const centerIndex = (totalCharacters - 1) / 2;
  const positionFromCenter = characterIndex - centerIndex;

  if (positionFromCenter < -0.1) {
    // Character is on the LEFT side of screen - use 'right' to look toward screen-RIGHT (toward center)
    const directions: LookDirection[] = ['right', 'at_right_character', 'center', 'up'];
    return directions[Math.floor(Math.random() * directions.length)];
  } else if (positionFromCenter > 0.1) {
    // Character is on the RIGHT side of screen - use 'left' to look toward screen-LEFT (toward center)
    const directions: LookDirection[] = ['left', 'at_left_character', 'center', 'up'];
    return directions[Math.floor(Math.random() * directions.length)];
  } else {
    // Character is in the CENTER - can look either direction
    const directions: LookDirection[] = ['left', 'right', 'at_left_character', 'at_right_character', 'center', 'up'];
    return directions[Math.floor(Math.random() * directions.length)];
  }
}

/**
 * Get a random idle animation with position-aware complementary state
 * @param characterIndex - Index of the character in the scene (0-based)
 * @param totalCharacters - Total number of characters in the scene
 */
export function getRandomIdleAnimation(
  characterIndex: number = 0,
  totalCharacters: number = 1
): IdleAnimationState {
  const animation = IDLE_ANIMATIONS[Math.floor(Math.random() * IDLE_ANIMATIONS.length)];
  const baseComplementary = IDLE_COMPLEMENTARY_BASE[Math.floor(Math.random() * IDLE_COMPLEMENTARY_BASE.length)];

  // Get position-aware look direction
  const lookDirection = getPositionAwareLookDirection(characterIndex, totalCharacters);

  const complementary: ComplementaryAnimation = {
    ...baseComplementary,
    ...(lookDirection && { lookDirection }),
  };

  return { animation, complementary };
}

/**
 * Get random interval between idle animation changes (8-15 seconds)
 */
export function getRandomIdleInterval(): number {
  return 8000 + Math.random() * 7000; // 8000-15000ms
}
