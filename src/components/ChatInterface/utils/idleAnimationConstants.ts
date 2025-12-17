/**
 * Constants and helpers for idle animation system
 */

import { AnimationState, ComplementaryAnimation } from '../../CharacterDisplay3D';
import { IdleAnimationState } from '../types/chatInterface.types';

// Available idle animations pool
export const IDLE_ANIMATIONS: AnimationState[] = [
  'idle', 'kick_ground', 'meh', 'foot_tap',
  'look_around', 'yawn', 'fidget', 'rub_eyes', 'weight_shift'
];

// Complementary states for idle animations
export const IDLE_COMPLEMENTARY_OPTIONS: ComplementaryAnimation[] = [
  { mouthState: 'closed' },
  { mouthState: 'closed', eyeState: 'blink' },
  { mouthState: 'smile' },
  { eyeState: 'open' },
  { lookDirection: 'left' },
  { lookDirection: 'right' },
  { lookDirection: 'up' },
  {},
];

/**
 * Get a random idle animation with complementary state
 */
export function getRandomIdleAnimation(): IdleAnimationState {
  const animation = IDLE_ANIMATIONS[Math.floor(Math.random() * IDLE_ANIMATIONS.length)];
  const complementary = IDLE_COMPLEMENTARY_OPTIONS[Math.floor(Math.random() * IDLE_COMPLEMENTARY_OPTIONS.length)];
  return { animation, complementary };
}

/**
 * Get random interval between idle animation changes (8-15 seconds)
 */
export function getRandomIdleInterval(): number {
  return 8000 + Math.random() * 7000; // 8000-15000ms
}
