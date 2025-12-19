/**
 * Character3D Component System
 *
 * This module provides 3D character rendering with animations.
 *
 * Structure:
 * - types.ts: Type definitions
 * - bodyConfig.ts: Body dimensions and measurements
 * - constants.ts: Animation constants and helpers
 * - VisualEffects.tsx: Particle and lighting effects
 * - index.tsx: Main exports
 *
 * Usage:
 * import { CharacterDisplay3D, AnimationState } from './character3d';
 */

// Re-export types
export * from './types';

// Re-export constants
export * from './constants';

// Re-export body config
export { useBodyConfig } from './bodyConfig';

// Re-export visual effects
export {
  ConfettiEffect,
  SpotlightEffect,
  SparklesEffect,
  HeartsEffect,
  VisualEffectRenderer
} from './VisualEffects';

// Re-export the main component from the original file
// This maintains backward compatibility while we refactor
export { CharacterDisplay3D } from '../CharacterDisplay3D';
