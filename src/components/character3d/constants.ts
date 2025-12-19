import { AnimationState } from './types';

// One-shot animations and their durations (in seconds)
export const ONE_SHOT_ANIMATIONS: Partial<Record<AnimationState, number>> = {
  wave: 2.0,
  nod: 1.5,
  shake_head: 1.5,
  shrug: 1.2,
  celebrate: 2.5,
  bow: 2.0,
  point: 1.5,
  clap: 2.0,
};

// Global lerp speed constants for smooth animations
export const LERP_SPEED = {
  verySlow: 0.01,
  slow: 0.03,
  normal: 0.08,
  fast: 0.15,
  veryFast: 0.3,
} as const;

// Automatic blink timing constants
export const AUTO_BLINK = {
  minInterval: 2.0,   // minimum seconds between blinks
  maxInterval: 5.0,   // maximum seconds between blinks
  duration: 0.09,     // how long a single blink takes
} as const;

// Surprised blink timing (fast triple blink)
export const SURPRISED_BLINK = {
  blinkDuration: 0.08,   // very fast individual blinks
  pauseBetween: 0.1,     // short pause between blinks
  totalBlinks: 5,        // number of blinks
} as const;

// Lerp helper for smooth transitions
export function lerp(current: number, target: number, factor: number): number {
  return current + (target - current) * factor;
}

// Skin tone color mapping
export const SKIN_TONE_COLORS: Record<string, string> = {
  light: '#f4c8a8',
  medium: '#d4a574',
  tan: '#c68642',
  dark: '#8d5524',
};

// Head dimensions for different styles
export const HEAD_DIMENSIONS: Record<string, [number, number, number]> = {
  default: [0.5, 0.55, 0.5],
  bigger: [0.6, 0.70, 0.6],
};

// Head heights for animation calculations
export const HEAD_HEIGHTS: Record<string, number> = {
  default: 0.55,
  bigger: 0.70,
};
