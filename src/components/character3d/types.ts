import * as THREE from 'three';
import { CharacterBehavior } from '../../config/characters';

// ============================================
// TYPE DEFINITIONS
// ============================================

export type AnimationState =
  | 'idle'
  | 'thinking'
  | 'talking'
  | 'confused'
  | 'happy'
  | 'excited'
  | 'winning'
  | 'walking'
  | 'jump'
  | 'surprise_jump'
  | 'surprise_happy'
  | 'lean_back'
  | 'lean_forward'
  | 'cross_arms'
  | 'nod'
  | 'shake_head'
  | 'shrug'
  | 'wave'
  | 'point'
  | 'clap'
  | 'bow'
  // New animations
  | 'facepalm'
  | 'dance'
  | 'laugh'
  | 'cry'
  | 'angry'
  | 'nervous'
  | 'celebrate'
  | 'peek'
  | 'doze'
  | 'stretch'
  // Idle animations
  | 'kick_ground'
  | 'meh'
  | 'foot_tap'
  | 'look_around'
  | 'yawn'
  | 'fidget'
  | 'rub_eyes'
  | 'weight_shift'
  // Processing/thinking animations
  | 'head_tilt'
  | 'chin_stroke';

// Look direction types
export type LookDirection = 'center' | 'left' | 'right' | 'up' | 'down' | 'at_left_character' | 'at_right_character' | 'away';

// Eye state types
export type EyeState =
  | 'open'              // Default, auto-blink
  | 'closed'            // Eyes shut
  | 'wink_left'         // Left eye winks
  | 'wink_right'        // Right eye winks
  | 'blink'             // Controlled blinking
  | 'surprised_blink'   // Fast triple blink
  | 'wide'              // Eyes enlarged (scale X&Y 1.3)
  | 'narrow'            // Squinting (scaleY 0.3, keep scaleX 1.0)
  | 'soft'              // Relaxed/warm (scaleY 0.85)
  | 'half_closed'       // Drowsy (scaleY 0.5)
  | 'tearful';          // Wet eyes with tear drops

// Eyebrow state types (anime-style)
export type EyebrowState =
  | 'normal'            // Default
  | 'raised'            // Surprised, interested
  | 'furrowed'          // Angry, frustrated
  | 'sad'               // Drooping down at outer edges
  | 'worried'           // Inner edges raised
  | 'one_raised'        // Skeptical, questioning
  | 'wiggle'            // Playful animation
  | 'asymmetrical'      // Different angles per brow
  | 'slightly_raised'   // Subtle raise
  | 'deeply_furrowed'   // Extreme anger
  | 'arched_high'       // High arch with rotation
  | 'relaxed_upward';   // Raised with no rotation

// Mouth state types
export type MouthState =
  | 'closed'            // Default
  | 'open'              // Small circle
  | 'smile'             // Happy curve (torus)
  | 'wide_smile'        // Big smile
  | 'surprised'         // O-shape
  | 'smirk'             // Asymmetrical torus
  | 'slight_smile'      // Subtle smile
  | 'grimace'           // Tense wide mouth
  | 'tense'             // Pressed thin line
  | 'kiss'              // Kiss lips (puckered)
  | 'teeth_showing'     // Smile with visible teeth
  | 'big_grin'          // Extra wide smile
  | 'o_shape'           // Perfect O
  | 'sad_smile';        // Inverted smile (frown)

// Face state types (anime-style decorations)
export type FaceState =
  | 'normal'            // Default
  | 'sweat_drop'        // Nervous sweat drop
  | 'sparkle_eyes'      // Excited star eyes
  | 'heart_eyes'        // Love/admiration
  | 'spiral_eyes'       // Dizzy/confused
  | 'tears'             // Crying streams
  | 'anger_vein';       // Anime anger mark

// Nose state types
export type NoseState =
  | 'neutral'           // Default (no animation)
  | 'wrinkled'          // Disgust (squashed)
  | 'flared'            // Anger (widened)
  | 'twitching';        // Nervous (oscillating)

// Cheek state types
export type CheekState =
  | 'neutral'           // No markers
  | 'flushed'           // Pink ovals
  | 'sunken'            // Dark shadows
  | 'puffed'            // Enlarged
  | 'dimpled';          // Small dots

// Forehead state types
export type ForeheadState =
  | 'smooth'            // Default (no lines)
  | 'wrinkled'          // Worry lines
  | 'tense'             // Deep crease
  | 'raised';           // Stretched appearance

// Jaw state types
export type JawState =
  | 'relaxed'           // Default
  | 'clenched'          // Tense (compressed)
  | 'protruding'        // Forward thrust
  | 'slack';            // Hanging open

// Visual effect types
export type VisualEffect = 
  | 'none' 
  | 'confetti' 
  | 'spotlight' 
  | 'sparkles' 
  | 'hearts'
  // New emoji-triggered effects
  | 'fire'         // 🔥💥💪 - Rising flame particles
  | 'stars'        // ⭐🌟💫 - Twinkling star shapes
  | 'music_notes'  // 🎵🎶🎤🎸 - Floating musical notes
  | 'tears'        // 😢😭💧 - Falling tear drops
  | 'anger'        // 😡😤💢 - Anime-style anger steam
  | 'snow'         // ❄️🥶☃️ - Falling snowflakes
  | 'rainbow';     // 🌈 - Arcing rainbow bands

// 3D Model style types
export type ModelStyle = 'blocky';

// Head style types
export type HeadStyle = 'default' | 'bigger';

// Complementary animation configuration
export interface ComplementaryAnimation {
  lookDirection?: LookDirection;
  eyeState?: EyeState;
  eyebrowState?: EyebrowState;
  headStyle?: HeadStyle;
  mouthState?: MouthState;
  faceState?: FaceState;
  noseState?: NoseState;
  cheekState?: CheekState;
  foreheadState?: ForeheadState;
  jawState?: JawState;
  effect?: VisualEffect;
  effectColor?: string;
  speed?: number;
  transitionDuration?: number;
  blinkDuration?: number;
  blinkPeriod?: number;
}

// Full props interface for CharacterDisplay3D
export interface CharacterDisplay3DProps {
  characterId?: string;
  character?: CharacterBehavior;
  isActive?: boolean;
  animation?: AnimationState;
  isTalking?: boolean;
  showName?: boolean;
  nameKey?: number;
  complementary?: ComplementaryAnimation;
  onAnimationComplete?: () => void;
  modelStyle?: ModelStyle;
  fov?: number;
  cameraX?: number;
  cameraY?: number;
  characterX?: number;
  characterY?: number;
  characterZ?: number;
}

// Internal Character component props
export interface CharacterProps {
  character: CharacterBehavior;
  isActive: boolean;
  animation: AnimationState;
  isTalking: boolean;
  scale: number;
  complementary?: ComplementaryAnimation;
  modelStyle: ModelStyle;
  positionX: number;
  positionY: number;
  positionZ: number;
  onAnimationComplete?: () => void;
}

// Body configuration type
export interface BodyConfig {
  torso: { width: number; height: number; depth: number; y: number };
  torsoTop: number;
  torsoBottom: number;
  torsoFront: number;
  torsoBack: number;
  upperArm: { width: number; height: number; depth: number };
  forearm: { width: number; height: number; depth: number };
  hand: { width: number; height: number; depth: number };
  armX: number;
  armY: number;
  forearmY: number;
  handY: number;
  upperLeg: { width: number; height: number; depth: number };
  lowerLeg: { width: number; height: number; depth: number };
  foot: { width: number; height: number; depth: number };
  legX: number;
  legY: number;
  lowerLegY: number;
  footY: number;
  footZ: number;
  neckY: number;
  collarY: number;
  shoulderY: number;
  clothing: { width: number; height: number; depth: number };
  frontZ: number;
  frontZOuter: number;
  backZ: number;
  backZOuter: number;
}

// Animation refs type
export interface AnimationRefs {
  meshRef: React.RefObject<THREE.Group>;
  headRef: React.RefObject<THREE.Group>;
  leftArmRef: React.RefObject<THREE.Group>;
  rightArmRef: React.RefObject<THREE.Group>;
  leftLegRef: React.RefObject<THREE.Group>;
  rightLegRef: React.RefObject<THREE.Group>;
  leftForearmRef: React.RefObject<THREE.Group>;
  rightForearmRef: React.RefObject<THREE.Group>;
  leftLowerLegRef: React.RefObject<THREE.Group>;
  rightLowerLegRef: React.RefObject<THREE.Group>;
  leftHandRef: React.RefObject<THREE.Mesh>;
  rightHandRef: React.RefObject<THREE.Mesh>;
  leftFootRef: React.RefObject<THREE.Mesh>;
  rightFootRef: React.RefObject<THREE.Mesh>;
}
