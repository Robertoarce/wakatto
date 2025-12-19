import React, { useRef, useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { getCharacter, CharacterBehavior } from '../config/characters';

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
export type LookDirection = 'center' | 'left' | 'right' | 'up' | 'down' | 'at_left_character' | 'at_right_character';

// Eye state types
export type EyeState =
  | 'open'              // Default, auto-blink
  | 'closed'            // Eyes shut
  | 'wink_left'         // Left eye winks
  | 'wink_right'        // Right eye winks
  | 'blink'             // Controlled blinking
  | 'surprised_blink'   // Fast triple blink
  // NEW:
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
  // NEW:
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
  // NEW:
  | 'smirk'             // Asymmetrical torus
  | 'slight_smile'      // Subtle smile
  | 'pout'              // Protruding lips
  | 'grimace'           // Tense wide mouth
  | 'tense'             // Pressed thin line
  | 'pursed'            // Small tight circle
  | 'teeth_showing'     // Smile with visible teeth
  | 'big_grin'          // Extra wide smile
  | 'o_shape';          // Perfect O

// Face state types (anime-style decorations)
export type FaceState =
  | 'normal'            // Default
  | 'sweat_drop'        // Nervous sweat drop
  | 'sparkle_eyes'      // Excited star eyes
  | 'heart_eyes'        // Love/admiration
  | 'spiral_eyes'       // Dizzy/confused
  | 'tears'             // Crying streams
  | 'anger_vein'        // Anime anger mark
  | 'shadow_face';      // Dark aura/disappointment
  // NOTE: 'blush' migrated to CheekState as 'flushed'

// Nose state types (NEW)
export type NoseState =
  | 'neutral'           // Default (no animation)
  | 'wrinkled'          // Disgust (squashed)
  | 'flared'            // Anger (widened)
  | 'twitching';        // Nervous (oscillating)

// Cheek state types (NEW - migrated from FaceState 'blush')
export type CheekState =
  | 'neutral'           // No markers
  | 'flushed'           // Pink ovals (migrated from FaceState 'blush')
  | 'sunken'            // Dark shadows
  | 'puffed'            // Enlarged
  | 'dimpled';          // Small dots

// Forehead state types (NEW)
export type ForeheadState =
  | 'smooth'            // Default (no lines)
  | 'wrinkled'          // Worry lines
  | 'tense'             // Deep crease
  | 'raised';           // Stretched appearance

// Jaw state types (NEW)
export type JawState =
  | 'relaxed'           // Default
  | 'clenched'          // Tense (compressed)
  | 'protruding'        // Forward thrust
  | 'slack';            // Hanging open

// Visual effect types
export type VisualEffect = 'none' | 'confetti' | 'spotlight' | 'sparkles' | 'hearts';

// 3D Model style types
export type ModelStyle = 'blocky';

// Head style types
export type HeadStyle = 'default' | 'bigger';

// Complementary animation configuration
export interface ComplementaryAnimation {
  lookDirection?: LookDirection;
  eyeState?: EyeState;
  eyebrowState?: EyebrowState;
  headStyle?: HeadStyle; // Head shape/size (default: 'default')
  mouthState?: MouthState;
  faceState?: FaceState;
  // NEW facial features:
  noseState?: NoseState;
  cheekState?: CheekState;
  foreheadState?: ForeheadState;
  jawState?: JawState;
  // Effects and timing:
  effect?: VisualEffect;
  effectColor?: string;
  speed?: number; // 0.1 to 3.0, default 1.0
  transitionDuration?: number; // milliseconds to transition
  // Blink timing (only used when eyeState is 'blink')
  blinkDuration?: number; // seconds for one blink (default 0.2)
  blinkPeriod?: number; // seconds between blinks (default 2.5)
}

// Full props interface
interface CharacterDisplay3DProps {
  characterId?: string;
  character?: CharacterBehavior;
  isActive?: boolean;
  animation?: AnimationState;
  isTalking?: boolean;
  showName?: boolean;
  nameKey?: number;
  // New complementary animation props
  complementary?: ComplementaryAnimation;
  onAnimationComplete?: () => void;
  // 3D model style
  modelStyle?: ModelStyle;
  // Camera field of view (lower = closer/bigger)
  fov?: number;
  // Camera position (x = left/right, y = up/down)
  cameraX?: number;
  cameraY?: number;
  // Character position offsets
  characterX?: number;  // left/right (negative = left)
  characterY?: number;  // up/down (negative = down)
  characterZ?: number;  // forward/back (negative = away from camera)
}

// ============================================
// VISUAL EFFECTS COMPONENTS
// ============================================

// Confetti particle effect
function ConfettiEffect({ color = '#8b5cf6', speed = 1 }: { color?: string; speed?: number }) {
  const particlesRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0); // Accumulate time instead of calling Date.now() each frame
  const particleCount = 100;

  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 4;
      pos[i * 3 + 1] = Math.random() * 4 + 1;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    return pos;
  }, []);

  const colors = useMemo(() => {
    const cols = new Float32Array(particleCount * 3);
    const confettiColors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', color];
    for (let i = 0; i < particleCount; i++) {
      const c = new THREE.Color(confettiColors[Math.floor(Math.random() * confettiColors.length)]);
      cols[i * 3] = c.r;
      cols[i * 3 + 1] = c.g;
      cols[i * 3 + 2] = c.b;
    }
    return cols;
  }, [color]);

  // Cleanup geometry and material on unmount
  useEffect(() => {
    return () => {
      if (particlesRef.current) {
        particlesRef.current.geometry?.dispose();
        const material = particlesRef.current.material as THREE.Material;
        material?.dispose();
      }
    };
  }, []);

  useFrame((_, delta) => {
    if (!particlesRef.current) return;
    timeRef.current += delta * 1000; // Accumulate time in ms
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      // Fall down
      positions[i * 3 + 1] -= delta * 2 * speed;
      // Sway side to side - use accumulated time instead of Date.now()
      positions[i * 3] += Math.sin(timeRef.current * 0.003 * speed + i) * delta * 0.5;

      // Reset if below ground
      if (positions[i * 3 + 1] < -1) {
        positions[i * 3 + 1] = 4;
        positions[i * 3] = (Math.random() - 0.5) * 4;
      }
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={particleCount} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.08} vertexColors transparent opacity={0.9} />
    </points>
  );
}

// Spotlight/concert light effect
function SpotlightEffect({ color = '#ffd700', speed = 1 }: { color?: string; speed?: number }) {
  const lightRef = useRef<THREE.SpotLight>(null);
  const coneRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0); // Accumulate time instead of calling Date.now() each frame

  // Cleanup geometry and material on unmount
  useEffect(() => {
    return () => {
      if (coneRef.current) {
        coneRef.current.geometry?.dispose();
        const material = coneRef.current.material as THREE.Material;
        material?.dispose();
      }
    };
  }, []);

  useFrame((_, delta) => {
    timeRef.current += delta * speed;
    const time = timeRef.current;
    if (lightRef.current) {
      lightRef.current.position.x = Math.sin(time * 0.5) * 1.5;
      lightRef.current.intensity = 2 + Math.sin(time * 2) * 0.5;
    }
    if (coneRef.current) {
      coneRef.current.rotation.z = Math.sin(time * 0.5) * 0.3;
      coneRef.current.position.x = Math.sin(time * 0.5) * 1.5;
    }
  });

  return (
    <group>
      <spotLight
        ref={lightRef}
        position={[0, 5, 2]}
        angle={0.4}
        penumbra={0.8}
        intensity={2.5}
        color={color}
        target-position={[0, 0, 0]}
        castShadow
      />
      {/* Visible light cone */}
      <mesh ref={coneRef} position={[0, 3, 1]} rotation={[Math.PI / 6, 0, 0]}>
        <coneGeometry args={[1.5, 4, 32, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// Sparkles effect
function SparklesEffect({ color = '#ffd700', speed = 1 }: { color?: string; speed?: number }) {
  const particlesRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0); // Accumulate time instead of calling Date.now() each frame
  const particleCount = 50;

  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.5 + Math.random() * 1.5;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = Math.random() * 2;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return pos;
  }, []);

  // Cleanup geometry and material on unmount
  useEffect(() => {
    return () => {
      if (particlesRef.current) {
        particlesRef.current.geometry?.dispose();
        const material = particlesRef.current.material as THREE.Material;
        material?.dispose();
      }
    };
  }, []);

  useFrame((_, delta) => {
    if (!particlesRef.current) return;
    timeRef.current += delta * 1000 * speed; // Accumulate time in ms
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const time = timeRef.current * 0.002;

    for (let i = 0; i < particleCount; i++) {
      const baseAngle = time + i * 0.5;
      const radius = 0.5 + Math.sin(time + i) * 0.5 + 1;
      positions[i * 3] = Math.cos(baseAngle) * radius;
      positions[i * 3 + 1] = 0.5 + Math.sin(time * 2 + i) * 0.8 + Math.sin(i) * 0.5;
      positions[i * 3 + 2] = Math.sin(baseAngle) * radius * 0.5;
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.1} color={color} transparent opacity={0.8} />
    </points>
  );
}

// Hearts effect
function HeartsEffect({ color = '#ff6b6b', speed = 1 }: { color?: string; speed?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0); // Accumulate time instead of calling Date.now() each frame
  const heartCount = 8;

  const heartPositions = useMemo(() => {
    return Array.from({ length: heartCount }, (_, i) => ({
      x: (Math.random() - 0.5) * 2,
      y: Math.random() * 0.5,
      z: (Math.random() - 0.5) * 1,
      speed: 0.5 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
    }));
  }, []);

  // Cleanup all heart geometries and materials on unmount
  useEffect(() => {
    return () => {
      if (groupRef.current) {
        groupRef.current.children.forEach((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry?.dispose();
            const material = child.material as THREE.Material;
            material?.dispose();
          }
        });
      }
    };
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    timeRef.current += delta * 1000; // Accumulate time in ms
    groupRef.current.children.forEach((child, i) => {
      const data = heartPositions[i];
      child.position.y += delta * data.speed * speed;
      child.position.x = data.x + Math.sin(timeRef.current * 0.002 * speed + data.phase) * 0.3;
      child.rotation.z = Math.sin(timeRef.current * 0.003 * speed + data.phase) * 0.2;

      if (child.position.y > 3) {
        child.position.y = -0.5;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {heartPositions.map((pos, i) => (
        <mesh key={i} position={[pos.x, pos.y, pos.z]} scale={0.15}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  );
}

// ============================================
// MAIN CHARACTER COMPONENT
// ============================================

interface CharacterProps {
  character: CharacterBehavior;
  isActive: boolean;
  animation?: AnimationState;
  isTalking?: boolean;
  scale?: number;
  complementary?: ComplementaryAnimation;
  modelStyle?: ModelStyle;
  positionX?: number;
  positionY?: number;
  positionZ?: number;
  onAnimationComplete?: () => void;
}

// One-shot animations and their durations (in seconds)
const ONE_SHOT_ANIMATIONS: Partial<Record<AnimationState, number>> = {
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
const LERP_SPEED = {
  verySlow: 0.01,
  slow: 0.03,
  normal: 0.08,
  fast: 0.15,
  veryFast: 0.3,
} as const;

// Automatic blink timing constants
const AUTO_BLINK = {
  minInterval: 2.0,   // minimum seconds between blinks
  maxInterval: 5.0,   // maximum seconds between blinks
  duration: 0.09,     // how long a single blink takes
} as const;

// Surprised blink timing (fast triple blink)
const SURPRISED_BLINK = {
  blinkDuration: 0.08,   // very fast individual blinks
  pauseBetween: 0.1,     // short pause between blinks
  totalBlinks: 5,        // triple blink
} as const;

// Lerp helper for smooth transitions 
function lerp(current: number, target: number, factor: number): number {
  return current + (target - current) * factor;
}

// Character component with switchable 3D style
function Character({ character, isActive, animation = 'idle', isTalking = false, scale = 1, complementary, modelStyle = 'blocky', positionX = 0, positionY = 0, positionZ = 0, onAnimationComplete }: CharacterProps) {
  const meshRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  // Limbs as groups (for articulated joints)
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  // Forearms as groups (contain hands)
  const leftForearmRef = useRef<THREE.Group>(null);
  const rightForearmRef = useRef<THREE.Group>(null);
  // Lower legs as groups (contain feet)
  const leftLowerLegRef = useRef<THREE.Group>(null);
  const rightLowerLegRef = useRef<THREE.Group>(null);
  // Hands and feet as meshes
  const leftHandRef = useRef<THREE.Mesh>(null);
  const rightHandRef = useRef<THREE.Mesh>(null);
  const leftFootRef = useRef<THREE.Mesh>(null);
  const rightFootRef = useRef<THREE.Mesh>(null);
  // Face refs
  const mouthRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const smileMeshRef = useRef<THREE.Mesh>(null);
  const leftEyebrowRef = useRef<THREE.Mesh>(null);
  const rightEyebrowRef = useRef<THREE.Mesh>(null);
  // NEW refs for facial features:
  const noseRef = useRef<THREE.Mesh>(null);
  const leftCheekRef = useRef<THREE.Mesh>(null);
  const rightCheekRef = useRef<THREE.Mesh>(null);

  // Animation completion tracking
  const animationStartTime = useRef<number>(0);
  const animationCompleted = useRef<boolean>(false);
  const lastAnimation = useRef<AnimationState>(animation);
  
  // Automatic blink timing
  const nextBlinkTime = useRef<number>(Date.now() / 1000 + AUTO_BLINK.minInterval + Math.random() * (AUTO_BLINK.maxInterval - AUTO_BLINK.minInterval));
  const blinkStartTime = useRef<number | null>(null);
  
  // Reset tracking when animation changes
  useEffect(() => {
    if (animation !== lastAnimation.current) {
      animationStartTime.current = Date.now() / 1000;
      animationCompleted.current = false;
      lastAnimation.current = animation;
    }
  }, [animation]);
  
  // Animation speed from complementary settings
  const animSpeed = complementary?.speed ?? 1.0;
  
  // Transition speed (higher = faster transitions)
  const transitionSpeed = LERP_SPEED.slow;

  // Animation system
  React.useEffect(() => {
    if (!meshRef.current || !headRef.current) return;

    let animationId: number;

    const animate = () => {
      const time = Date.now() * 0.001 * animSpeed;

      // Target values - we'll lerp towards these
      let targetMeshY = 0;
      let targetMeshRotX = 0;
      let targetMeshRotY = 0;  // Body Y rotation (for turning toward others)
      let targetHeadRotX = 0;
      let targetHeadRotY = 0;
      let targetHeadRotZ = 0;
      let targetLeftArmRotX = 0;
      let targetLeftArmRotZ = 0;
      let targetRightArmRotX = 0;
      let targetRightArmRotZ = 0;
      let targetLeftLegRotX = 0;
      let targetRightLegRotX = 0;
      // NEW: Forearm bend (elbow) targets
      let targetLeftForearmRotX = 0;
      let targetRightForearmRotX = 0;
      // NEW: Lower leg bend (knee) targets
      let targetLeftLowerLegRotX = 0;
      let targetRightLowerLegRotX = 0;
      // NEW: Foot rotation (ankle) targets
      let targetLeftFootRotX = 0;
      let targetRightFootRotX = 0;
      let targetLeftEyeScaleY = 1;
      let targetRightEyeScaleY = 1;
      // NEW: Eye X-scale targets for wide/narrow states
      let targetLeftEyeScaleX = 1;
      let targetRightEyeScaleX = 1;
      // Eyebrow animation targets
      let targetLeftEyebrowRotZ = 0;
      let targetRightEyebrowRotZ = 0;
      let targetLeftEyebrowPosY = 0;  // Offset from default position
      let targetRightEyebrowPosY = 0;
      // NEW: Nose targets for facial feature states
      let targetNoseScaleX = 1;
      let targetNoseScaleY = 1;
      let targetNoseRotZ = 0;
      // NEW: Head scale/position targets for jaw states
      let targetHeadScaleY = 1;
      let targetJawPosZ = 0;

      // Head style calculations for eyebrow positioning
      const headStyleVal = complementary?.headStyle || 'bigger';
      const headHeights: Record<HeadStyle, number> = {
        default: 0.55,
        bigger: 0.70,
      };
      const headH = headHeights[headStyleVal];
      const faceYOffsetAnim = (0.5 - headH) / 2;
      const eyebrowBaseY = 0.14 + faceYOffsetAnim;

      // =========================================
      // COMPLEMENTARY: Look Direction
      // =========================================
      let lookYOffset = 0;    // Head Y rotation offset
      let lookXOffset = 0;    // Head X rotation offset

      switch (complementary?.lookDirection) {
        case 'left':
          lookYOffset = -0.5; //<<< DONT TOUCH THIS! es NEgativo 
          break;
        case 'right':
          lookYOffset = 0.5; //<<< DONT TOUCH THIS! es Positron
          break;
        case 'up':
          lookXOffset = -0.3;  
          break;
        case 'down':
          lookXOffset = 0.3;
          break;
        case 'at_left_character':
          // Look at character to my LEFT = turn toward screen-RIGHT (positive Y)
          lookYOffset = -0.7; //<<< DONT TOUCH THIS! es Positron
          lookXOffset = 0.1;
          targetMeshRotY = -0.65;
          break;
        case 'at_right_character':
          // Look at character to my RIGHT = turn toward screen-LEFT (negative Y)
          lookYOffset = 0.7; //<<< DONT TOUCH THIS! es Positron
          lookXOffset = 0.1;
          targetMeshRotY = 0.65;
          break;
      }

      // =========================================
      // COMPLEMENTARY: Eye State
      // =========================================
      const currentTime = Date.now() / 1000;
      
      // Helper function to calculate blink openness
      const calculateBlinkOpenness = (blinkProgress: number): number => {
        const closePhase = 0.4;   // 40% of time to close
        const holdPhase = 0.4;    // 40% of time held closed
        const openPhase = 0.2;    // 20% of time to open
        
        if (blinkProgress < closePhase) {
          // Closing: 1.0 -> 0.1
          const closeProgress = blinkProgress / closePhase;
          return 1.0 - (0.9 * closeProgress);
        } else if (blinkProgress < closePhase + holdPhase) {
          // Held closed
          return 0.1;
        } else {
          // Opening: 0.1 -> 1.0
          const openProgress = (blinkProgress - closePhase - holdPhase) / openPhase;
          return 0.1 + (0.9 * openProgress);
        }
      };
      
      switch (complementary?.eyeState) {
        case 'closed':
          targetLeftEyeScaleY = 0.1;
          targetRightEyeScaleY = 0.1;
          // Reset blink timing when eyes are explicitly closed
          blinkStartTime.current = null;
          break;
        case 'wink_left':
          targetLeftEyeScaleY = 0.1;
          break;
        case 'wink_right':
          targetRightEyeScaleY = 0.1;
          break;
        case 'blink':
          // Natural blink: eyes open most of the time, quick close-open blink
          // LLM can override blinkPeriod (time between blinks) and blinkDuration (how long each blink takes)
          {
            const blinkPeriod = complementary?.blinkPeriod ?? 2.5; // seconds between blinks (default 2.5)
            const blinkDuration = complementary?.blinkDuration ?? 0.3; // how long the blink takes (default 0.3)
            const timeInCycle = time % blinkPeriod;
            
            let eyeOpenness = 1.0; // fully open by default
            
            if (timeInCycle < blinkDuration) {
              const blinkProgress = timeInCycle / blinkDuration; // 0 to 1
              eyeOpenness = calculateBlinkOpenness(blinkProgress);
            }
            
            targetLeftEyeScaleY = eyeOpenness;
            targetRightEyeScaleY = eyeOpenness;
          }
          break;
        case 'surprised_blink':
          // Fast triple blink for surprised reactions
          {
            const singleBlinkCycle = SURPRISED_BLINK.blinkDuration + SURPRISED_BLINK.pauseBetween;
            const totalCycleDuration = singleBlinkCycle * SURPRISED_BLINK.totalBlinks;
            const timeInCycle = time % (totalCycleDuration + 1.5); // Add pause before repeating
            
            let eyeOpenness = 1.0;
            
            if (timeInCycle < totalCycleDuration) {
              const currentBlinkIndex = Math.floor(timeInCycle / singleBlinkCycle);
              const timeInCurrentBlink = timeInCycle - (currentBlinkIndex * singleBlinkCycle);
              
              if (timeInCurrentBlink < SURPRISED_BLINK.blinkDuration) {
                // During a blink
                const blinkProgress = timeInCurrentBlink / SURPRISED_BLINK.blinkDuration;
                eyeOpenness = calculateBlinkOpenness(blinkProgress);
              }
              // During pause between blinks, eyes stay open (eyeOpenness = 1.0)
            }
            
            targetLeftEyeScaleY = eyeOpenness;
            targetRightEyeScaleY = eyeOpenness;
          }
          break;
        // NEW: Additional eye states
        case 'wide':
          targetLeftEyeScaleY = 1.3;
          targetRightEyeScaleY = 1.3;
          targetLeftEyeScaleX = 1.3;
          targetRightEyeScaleX = 1.3;
          break;
        case 'narrow':
          targetLeftEyeScaleY = 0.3;
          targetRightEyeScaleY = 0.3;
          targetLeftEyeScaleX = 1.0; // Keep width
          targetRightEyeScaleX = 1.0;
          break;
        case 'soft':
          targetLeftEyeScaleY = 0.85;
          targetRightEyeScaleY = 0.85;
          break;
        case 'half_closed':
          targetLeftEyeScaleY = 0.5;
          targetRightEyeScaleY = 0.5;
          break;
        case 'tearful':
          targetLeftEyeScaleY = 1.0;
          targetRightEyeScaleY = 1.0;
          // Tears handled by conditional rendering in renderFaceDecorations
          break;
        case 'open':
        default:
          // Automatic random blinking when eyes are "open" or no state specified
          {
            let eyeOpenness = 1.0;
            
            // Check if we should start a new blink
            if (blinkStartTime.current === null && currentTime >= nextBlinkTime.current) {
              blinkStartTime.current = currentTime;
            }
            
            // If we're in a blink
            if (blinkStartTime.current !== null) {
              const timeSinceBlinkStart = currentTime - blinkStartTime.current;
              
              if (timeSinceBlinkStart < AUTO_BLINK.duration) {
                const blinkProgress = timeSinceBlinkStart / AUTO_BLINK.duration;
                eyeOpenness = calculateBlinkOpenness(blinkProgress);
              } else {
                // Blink finished, schedule next one
                blinkStartTime.current = null;
                const randomInterval = AUTO_BLINK.minInterval + Math.random() * (AUTO_BLINK.maxInterval - AUTO_BLINK.minInterval);
                nextBlinkTime.current = currentTime + randomInterval;
              }
            }
            
            targetLeftEyeScaleY = eyeOpenness;
            targetRightEyeScaleY = eyeOpenness;
          }
          break;
      }

      // =========================================
      // COMPLEMENTARY: Eyebrow State
      // =========================================
      switch (complementary?.eyebrowState) {
        case 'raised':
          // Surprised, interested - eyebrows move up and rotate slightly inward
          targetLeftEyebrowPosY = 0.03;
          targetRightEyebrowPosY = 0.03;
          targetLeftEyebrowRotZ = 0.1;  // Slight inward tilt
          targetRightEyebrowRotZ = -0.1;
          break;
        case 'furrowed':
          // Angry, frustrated - eyebrows tilt inward and down
          targetLeftEyebrowPosY = -0.01;
          targetRightEyebrowPosY = -0.01;
          targetLeftEyebrowRotZ = -0.3;  // Inner edge down
          targetRightEyebrowRotZ = 0.3;
          break;
        case 'sad':
          // Drooping at outer edges - eyebrows tilt outward
          targetLeftEyebrowRotZ = 0.25;   // Outer edge down
          targetRightEyebrowRotZ = -0.25;
          targetLeftEyebrowPosY = -0.01;
          targetRightEyebrowPosY = -0.01;
          break;
        case 'worried':
          // Inner edges raised - opposite of furrowed
          targetLeftEyebrowRotZ = 0.2;   // Inner edge up
          targetRightEyebrowRotZ = -0.2;
          targetLeftEyebrowPosY = 0.02;
          targetRightEyebrowPosY = 0.02;
          break;
        case 'one_raised':
          // Skeptical, questioning - left normal, right raised
          targetLeftEyebrowPosY = 0;
          targetLeftEyebrowRotZ = 0;
          targetRightEyebrowPosY = 0.04;
          targetRightEyebrowRotZ = -0.15;
          break;
        case 'wiggle':
          // Playful animation - oscillating movement
          const wiggleSpeed = 6;
          const wiggleAmount = 0.2;
          targetLeftEyebrowRotZ = Math.sin(time * wiggleSpeed) * wiggleAmount;
          targetRightEyebrowRotZ = Math.sin(time * wiggleSpeed + Math.PI) * wiggleAmount;
          targetLeftEyebrowPosY = Math.abs(Math.sin(time * wiggleSpeed * 0.5)) * 0.02;
          targetRightEyebrowPosY = Math.abs(Math.sin(time * wiggleSpeed * 0.5 + Math.PI)) * 0.02;
          break;
        // NEW: Additional eyebrow states
        case 'asymmetrical':
          targetLeftEyebrowRotZ = -0.3;
          targetRightEyebrowRotZ = 0.2;
          targetRightEyebrowPosY = 0.03;
          break;
        case 'slightly_raised':
          targetLeftEyebrowPosY = 0.015;
          targetRightEyebrowPosY = 0.015;
          break;
        case 'deeply_furrowed':
          targetLeftEyebrowRotZ = -0.5;
          targetRightEyebrowRotZ = 0.5;
          targetLeftEyebrowPosY = -0.02;
          targetRightEyebrowPosY = -0.02;
          break;
        case 'arched_high':
          targetLeftEyebrowPosY = 0.05;
          targetRightEyebrowPosY = 0.05;
          targetLeftEyebrowRotZ = 0.15;
          targetRightEyebrowRotZ = -0.15;
          break;
        case 'relaxed_upward':
          targetLeftEyebrowPosY = 0.02;
          targetRightEyebrowPosY = 0.02;
          targetLeftEyebrowRotZ = 0;
          targetRightEyebrowRotZ = 0;
          break;
        case 'normal':
        default:
          // Default position - no offset
          targetLeftEyebrowPosY = 0;
          targetRightEyebrowPosY = 0;
          targetLeftEyebrowRotZ = 0;
          targetRightEyebrowRotZ = 0;
          break;
      }

      // =========================================
      // COMPLEMENTARY: Nose State (NEW)
      // =========================================
      switch (complementary?.noseState) {
        case 'wrinkled':
          targetNoseScaleY = 0.7;
          break;
        case 'flared':
          targetNoseScaleX = 1.3;
          break;
        case 'twitching':
          targetNoseRotZ = Math.sin(time * 8) * 0.1; // Rapid oscillation
          break;
        case 'neutral':
        default:
          targetNoseScaleX = 1.0;
          targetNoseScaleY = 1.0;
          targetNoseRotZ = 0;
          break;
      }

      // =========================================
      // COMPLEMENTARY: Jaw State (NEW)
      // =========================================
      switch (complementary?.jawState) {
        case 'clenched':
          targetHeadScaleY = 1.97;
          break;
        case 'protruding':
          targetJawPosZ = 0.05;
          break;
        case 'slack':
          targetHeadScaleY = 1.05;
          break;
        case 'relaxed':
        default:
          targetHeadScaleY = 1.0;
          targetJawPosZ = 0;
          break;
      }

      // =========================================
      // COMPLEMENTARY: Mouth State (when not talking)
      // =========================================
      if (!isTalking && mouthRef.current) {
        switch (complementary?.mouthState) {
          case 'open':
            // Small circle - equal scales for circular shape
            mouthRef.current.scale.y = 0.8;
            mouthRef.current.scale.x = 0.8;
            break;
          case 'smile':
            mouthRef.current.scale.y = 0.4;
            mouthRef.current.scale.x = 1.8;
            break;
          case 'wide_smile':
            mouthRef.current.scale.y = 0.6;
            mouthRef.current.scale.x = 2.2;
            break;
          case 'surprised':
            mouthRef.current.scale.y = 0.85;
            mouthRef.current.scale.x = 2.0;
            break;
          case 'closed':
          default:
            mouthRef.current.scale.y = 0.1;
            mouthRef.current.scale.x = 1.5;
            break;
        }
      }

      // Independent mouth animation when talking (overrides mouthState)
      if (mouthRef.current && isTalking) {
        const mouthCycle = Math.sin(time * 6 * Math.PI);
        const mouthScale = 0.3 + (mouthCycle * 0.5 + 0.5) * 0.7;
        mouthRef.current.scale.y = mouthScale;
      }

      // Calculate target values based on animation state (with complementary look direction applied)
      switch (animation) {
        case 'idle':
          targetMeshY = Math.sin(time * 0.5) * 0.05;
          targetHeadRotY = (isActive ? Math.sin(time * 1.5) * 0.15 : 0) + lookYOffset;
          targetHeadRotX = lookXOffset;
          break;

        case 'thinking':
          // Hand on chin, head tilted, slight sway
          targetMeshY = Math.sin(time * 0.3) * 0.03;
          targetHeadRotZ = Math.sin(time * 0.5) * 0.1 - 0.2;
          targetHeadRotY = -0.3 + lookYOffset;
          targetHeadRotX = lookXOffset;
          targetRightArmRotX = -1.5;
          targetRightArmRotZ = 0.3;
          // Forearm bent to bring hand to chin
          targetRightForearmRotX = -1.2;
          break;

        case 'talking':
          // Animated head bobbing, hand gestures
          targetMeshY = Math.sin(time * 2) * 0.02;
          targetHeadRotX = Math.sin(time * 4) * 0.1 + lookXOffset;
          targetHeadRotY = lookYOffset;
          targetLeftArmRotX = Math.sin(time * 3) * 0.3 - 0.3;
          targetRightArmRotX = Math.sin(time * 3 + Math.PI) * 0.3 - 0.3;
          // Alternating forearm bends for gestures
          targetLeftForearmRotX = Math.sin(time * 3) * 0.4 - 0.3;
          targetRightForearmRotX = Math.sin(time * 3 + Math.PI) * 0.4 - 0.3;
          break;

        case 'confused':
          // Head tilting side to side, scratching head
          targetHeadRotZ = Math.sin(time * 2) * 0.3;
          targetHeadRotY = Math.sin(time * 1.5) * 0.2 + lookYOffset;
          targetHeadRotX = lookXOffset;
          targetRightArmRotX = -1.8 + Math.sin(time * 3) * 0.2;
          targetRightArmRotZ = 0.5;
          break;

        case 'happy':
          // Bouncing, swaying arms
          targetMeshY = Math.abs(Math.sin(time * 3)) * 0.15;
          targetHeadRotZ = Math.sin(time * 2) * 0.15;
          targetHeadRotY = lookYOffset;
          targetHeadRotX = lookXOffset;
          targetLeftArmRotZ = -0.3 + Math.sin(time * 2) * 0.2;
          targetRightArmRotZ = 0.3 + Math.sin(time * 2 + Math.PI) * 0.2;
          break;

        case 'excited':
          // Fast bouncing, waving arms
          targetMeshY = Math.abs(Math.sin(time * 5)) * 0.2;
          targetHeadRotY = Math.sin(time * 4) * 0.2 + lookYOffset;
          targetHeadRotX = lookXOffset;
          targetLeftArmRotX = Math.sin(time * 6) * 0.5 - 0.5;
          targetLeftArmRotZ = -0.5;
          targetRightArmRotX = Math.sin(time * 6 + Math.PI) * 0.5 - 0.5;
          targetRightArmRotZ = 0.5;
          // Bent elbows with waving forearms
          targetLeftForearmRotX = Math.sin(time * 6) * 0.6 - 0.5;
          targetRightForearmRotX = Math.sin(time * 6 + Math.PI) * 0.6 - 0.5;
          break;

        case 'winning':
          // High jump, arms up, celebration
          const jumpPhase = (time * 4) % (Math.PI * 2);
          targetMeshY = Math.max(0, Math.sin(jumpPhase) * 0.5);
          targetHeadRotZ = Math.sin(time * 3) * 0.2;
          targetLeftArmRotX = -2.8; // Arms up
          targetLeftArmRotZ = -0.8;
          targetRightArmRotX = -2.8; // Arms up
          targetRightArmRotZ = 0.8;
          // Forearms bent for fist pump celebration
          targetLeftForearmRotX = -0.5 + Math.sin(time * 6) * 0.3;
          targetRightForearmRotX = -0.5 + Math.sin(time * 6 + Math.PI) * 0.3;
          // Alternating leg kicks during jump
          targetLeftLegRotX = Math.sin(time * 4) * 0.5;
          targetRightLegRotX = Math.sin(time * 4 + Math.PI) * 0.5;
          // Feet flex on jump
          targetLeftFootRotX = Math.sin(time * 4) * 0.4;
          targetRightFootRotX = Math.sin(time * 4 + Math.PI) * 0.4;
          break;

        case 'walking':
          // Walking animation - swinging arms and legs
          targetMeshY = Math.abs(Math.sin(time * 4)) * 0.05;
          targetHeadRotY = Math.sin(time * 2) * 0.05;
          targetLeftArmRotX = Math.sin(time * 4) * 0.6;
          targetRightArmRotX = Math.sin(time * 4 + Math.PI) * 0.6;
          targetLeftLegRotX = Math.sin(time * 4 + Math.PI) * 0.5;
          targetRightLegRotX = Math.sin(time * 4) * 0.5;
          // Slight forearm counter-swing
          targetLeftForearmRotX = Math.sin(time * 4) * 0.2;
          targetRightForearmRotX = Math.sin(time * 4 + Math.PI) * 0.2;
          // Feet flex at ankle during walk cycle
          targetLeftFootRotX = Math.sin(time * 4 + Math.PI) * 0.3;
          targetRightFootRotX = Math.sin(time * 4) * 0.3;
          break;

        case 'jump':
          // Simple jump animation
          const jumpCycle = Math.sin(time * 2) * 0.5 + 0.5; // 0 to 1
          targetMeshY = jumpCycle * 0.4;
          targetLeftArmRotX = -0.5;
          targetLeftArmRotZ = -0.3;
          targetRightArmRotX = -0.5;
          targetRightArmRotZ = 0.3;
          break;

        case 'surprise_jump':
          // Surprised jump - sudden upward movement with hands out
          const surpriseJump = Math.abs(Math.sin(time * 6)) * 0.6;
          targetMeshY = surpriseJump;
          targetHeadRotX = -0.2; // Head tilted back
          targetLeftArmRotX = -1.5; // Arms out to sides
          targetLeftArmRotZ = -1.2;
          targetRightArmRotX = -1.5;
          targetRightArmRotZ = 1.2;
          targetLeftLegRotX = -0.3;
          targetRightLegRotX = -0.3;
          break;

        case 'surprise_happy':
          // Surprised and happy - bouncing with hands to face
          targetMeshY = Math.abs(Math.sin(time * 4)) * 0.2;
          targetHeadRotZ = Math.sin(time * 3) * 0.2;
          targetHeadRotX = -0.1;
          targetLeftArmRotX = -2.0; // Hands near face
          targetLeftArmRotZ = -0.5;
          targetRightArmRotX = -2.0;
          targetRightArmRotZ = 0.5;
          break;

        case 'lean_back':
          // Leaning back - skeptical/contemplative pose
          targetMeshRotX = -0.15; // Lean back (negative X = backward)
          targetMeshY = Math.sin(time * 0.5) * 0.02;
          targetHeadRotX = -0.1; // Head tilted up slightly
          targetHeadRotY = Math.sin(time * 0.8) * 0.1;
          targetLeftArmRotX = 0.2;
          targetLeftArmRotZ = -0.3;
          targetRightArmRotX = 0.2;
          targetRightArmRotZ = 0.3;
          break;

        case 'lean_forward':
          // Leaning forward - interested/engaged pose
          targetMeshRotX = 0.2; // Lean forward (positive X = forward)
          targetMeshY = Math.sin(time * 0.8) * 0.02;
          targetHeadRotX = 0.15; // Head tilted forward
          targetHeadRotY = Math.sin(time * 1.2) * 0.08;
          targetLeftArmRotX = -0.4;
          targetRightArmRotX = -0.4;
          break;

        case 'cross_arms':
          // Arms crossed - reserved/defensive pose
          targetMeshY = Math.sin(time * 0.4) * 0.02;
          targetHeadRotY = Math.sin(time * 0.6) * 0.1;
          targetHeadRotZ = Math.sin(time * 0.4) * 0.05;
          targetLeftArmRotX = -1.5; // Arm bent across chest
          targetLeftArmRotZ = 0.8;
          targetRightArmRotX = -1.5;
          targetRightArmRotZ = -0.8;
          break;

        case 'nod':
          // Nodding - agreement animation
          targetMeshY = Math.sin(time * 0.5) * 0.02;
          // Continuous nodding motion
          targetHeadRotX = Math.sin(time * 4) * 0.2;
          targetLeftArmRotX = Math.sin(time * 2) * 0.1;
          targetRightArmRotX = Math.sin(time * 2 + Math.PI) * 0.1;
          break;

        case 'shake_head':
          // Shaking head - disagreement animation
          targetMeshY = Math.sin(time * 0.5) * 0.02;
          // Side to side shaking
          targetHeadRotY = Math.sin(time * 5) * 0.3;
          targetLeftArmRotZ = -0.2;
          targetRightArmRotZ = 0.2;
          break;

        case 'shrug':
          // Shrugging - uncertainty animation
          targetMeshY = Math.sin(time * 0.5) * 0.02;
          targetHeadRotZ = Math.sin(time * 1.5) * 0.15;
          // Shoulders up motion via arms
          const shrugPhase = Math.sin(time * 2) * 0.5 + 0.5;
          targetLeftArmRotX = -0.3;
          targetLeftArmRotZ = -0.5 - shrugPhase * 0.3;
          targetRightArmRotX = -0.3;
          targetRightArmRotZ = 0.5 + shrugPhase * 0.3;
          break;

        case 'wave':
          // Waving - greeting/farewell animation
          targetMeshY = Math.sin(time * 0.5) * 0.03;
          targetHeadRotZ = Math.sin(time * 1.5) * 0.1;
          targetLeftArmRotX = 0;
          targetRightArmRotX = -2.5; // Arm raised
          targetRightArmRotZ = 0.3;
          // Forearm does the actual waving motion
          targetRightForearmRotX = -0.8 + Math.sin(time * 8) * 0.5;
          break;

        case 'point':
          // Pointing - emphasis/direction animation
          targetMeshY = Math.sin(time * 0.5) * 0.02;
          targetHeadRotY = 0.2;
          targetHeadRotX = Math.sin(time * 2) * 0.05;
          targetLeftArmRotX = 0;
          targetRightArmRotX = -1.5; // Arm extended forward
          targetRightArmRotZ = 0.2;
          // Forearm extended straight for pointing
          targetRightForearmRotX = 0;
          break;

        case 'clap':
          // Clapping - celebration/applause animation
          targetMeshY = Math.abs(Math.sin(time * 3)) * 0.08;
          targetHeadRotZ = Math.sin(time * 2) * 0.1;
          // Clapping motion - arms come together
          const clapPhase = Math.sin(time * 6);
          targetLeftArmRotX = -1.5;
          targetLeftArmRotZ = clapPhase * 0.4;
          targetRightArmRotX = -1.5;
          targetRightArmRotZ = -clapPhase * 0.4;
          // Forearms bent inward for clapping
          targetLeftForearmRotX = -0.8 + clapPhase * 0.3;
          targetRightForearmRotX = -0.8 + clapPhase * 0.3;
          break;

        case 'bow':
          // Bowing - respect/gratitude animation
          const bowCycle = (Math.sin(time * 1.5) + 1) / 2; // 0 to 1
          targetMeshRotX = bowCycle * 0.5; // Bow forward (positive X = forward)
          targetHeadRotX = bowCycle * 0.3; // Head follows bow
          targetLeftArmRotX = bowCycle * 0.3;
          targetLeftArmRotZ = -0.2;
          targetRightArmRotX = bowCycle * 0.3;
          targetRightArmRotZ = 0.2;
          break;

        // =========================================
        // NEW ANIMATIONS
        // =========================================
        case 'facepalm':
          // Facepalm - hand to face in frustration
          targetHeadRotX = 0.2 + lookXOffset;
          targetHeadRotY = lookYOffset;
          targetHeadRotZ = -0.1;
          targetRightArmRotX = -2.2; // Hand to face
          targetRightArmRotZ = 0.4;
          targetMeshY = Math.sin(time * 0.5) * 0.02; // Subtle sigh movement
          break;

        case 'dance':
          // Dance - celebratory bouncing and swaying
          targetMeshY = Math.abs(Math.sin(time * 6)) * 0.2;
          targetHeadRotZ = Math.sin(time * 4) * 0.2;
          targetHeadRotY = Math.sin(time * 2) * 0.15 + lookYOffset;
          targetHeadRotX = lookXOffset;
          targetLeftArmRotX = Math.sin(time * 6) * 0.8;
          targetLeftArmRotZ = -0.5 + Math.sin(time * 3) * 0.3;
          targetRightArmRotX = Math.sin(time * 6 + Math.PI) * 0.8;
          targetRightArmRotZ = 0.5 + Math.sin(time * 3 + Math.PI) * 0.3;
          targetLeftLegRotX = Math.sin(time * 6) * 0.3;
          targetRightLegRotX = Math.sin(time * 6 + Math.PI) * 0.3;
          break;

        case 'laugh':
          // Laugh - bouncing with head thrown back
          targetMeshY = Math.abs(Math.sin(time * 8)) * 0.1;
          targetHeadRotX = -0.3 + Math.sin(time * 8) * 0.1 + lookXOffset;
          targetHeadRotY = lookYOffset;
          targetHeadRotZ = Math.sin(time * 4) * 0.1;
          targetLeftArmRotZ = -0.2 + Math.sin(time * 8) * 0.1;
          targetRightArmRotZ = 0.2 + Math.sin(time * 8) * 0.1;
          break;

        case 'cry':
          // Cry - hunched over, hands to face
          targetMeshY = Math.sin(time * 2) * 0.03;
          targetMeshRotX = 0.15; // Hunched forward (positive X = forward)
          targetHeadRotX = 0.3 + Math.sin(time * 3) * 0.05;
          targetHeadRotY = lookYOffset;
          targetLeftArmRotX = -2.0;
          targetLeftArmRotZ = -0.3;
          targetRightArmRotX = -2.0;
          targetRightArmRotZ = 0.3;
          break;

        case 'angry':
          // Angry - tense posture, clenched fists
          targetMeshY = Math.sin(time * 4) * 0.02;
          targetHeadRotX = 0.15 + lookXOffset;
          targetHeadRotY = lookYOffset;
          targetHeadRotZ = Math.sin(time * 6) * 0.05;
          targetLeftArmRotX = -0.5;
          targetLeftArmRotZ = -0.4;
          targetRightArmRotX = -0.5;
          targetRightArmRotZ = 0.4;
          break;

        case 'nervous':
          // Nervous - fidgeting, looking around
          targetMeshY = Math.sin(time * 4) * 0.03;
          targetHeadRotX = Math.sin(time * 3) * 0.1 + lookXOffset;
          targetHeadRotY = Math.sin(time * 2) * 0.3 + lookYOffset;
          targetHeadRotZ = Math.sin(time * 2.5) * 0.1;
          targetLeftArmRotX = Math.sin(time * 5) * 0.2;
          targetLeftArmRotZ = -0.1;
          targetRightArmRotX = Math.sin(time * 5 + 1) * 0.2;
          targetRightArmRotZ = 0.1;
          break;

        case 'celebrate':
          // Celebrate - arms up, jumping
          const celebrateBounce = Math.abs(Math.sin(time * 4));
          targetMeshY = celebrateBounce * 0.25;
          targetHeadRotX = -0.2 + lookXOffset;
          targetHeadRotY = Math.sin(time * 3) * 0.1 + lookYOffset;
          targetLeftArmRotX = -2.8; // Arms up
          targetLeftArmRotZ = -0.3;
          targetRightArmRotX = -2.8;
          targetRightArmRotZ = 0.3;
          // Forearms bent for fist pump
          targetLeftForearmRotX = -0.6 + Math.sin(time * 5) * 0.4;
          targetRightForearmRotX = -0.6 + Math.sin(time * 5 + Math.PI) * 0.4;
          // Feet flex on bounces
          targetLeftFootRotX = celebrateBounce * 0.3;
          targetRightFootRotX = celebrateBounce * 0.3;
          break;

        case 'peek':
          // Peek - curious looking to the side
          targetHeadRotY = 0.6 + Math.sin(time * 2) * 0.1 + lookYOffset;
          targetHeadRotX = Math.sin(time * 1.5) * 0.1 + lookXOffset;
          targetHeadRotZ = -0.15;
          targetMeshY = Math.sin(time * 0.5) * 0.02;
          targetRightArmRotX = -0.3;
          break;

        case 'doze':
          // Doze - sleepy, head drooping
          // Reduced head tilt to prevent chin clipping into body
          const dozeHead = Math.sin(time * 0.3) * 0.5;
          targetHeadRotX = 0.2 + dozeHead + lookXOffset; // Reduced from 0.4 to 0.2
          targetHeadRotY = Math.sin(time * 0.5) * 0.1 + lookYOffset;
          targetMeshY = Math.sin(time * 0.3) * 0.02;
          targetMeshRotX = 0.1; // Slight body lean forward for natural sleepy posture (positive X = forward)
          targetLeftArmRotZ = -0.1;
          targetRightArmRotZ = 0.1;
          targetLeftEyeScaleY = 0.1; // Eyes mostly closed
          targetRightEyeScaleY = 0.1;
          break;

        case 'stretch':
          // Stretch - arms up, yawning
          const stretchPhase = (Math.sin(time * 0.8) + 1) / 2;
          targetMeshY = stretchPhase * 0.1;
          targetHeadRotX = -0.3 * stretchPhase + lookXOffset;
          targetHeadRotY = lookYOffset;
          targetLeftArmRotX = -2.5 * stretchPhase;
          targetLeftArmRotZ = -0.4 * stretchPhase;
          targetRightArmRotX = -2.5 * stretchPhase;
          targetRightArmRotZ = 0.4 * stretchPhase;
          break;

        // =========================================
        // IDLE ANIMATIONS
        // =========================================
        case 'kick_ground':
          // Kick ground - looking down, kicking at something
          targetHeadRotX = 0.4 + Math.sin(time * 2) * 0.05 + lookXOffset; // Looking down
          targetHeadRotY = Math.sin(time * 0.5) * 0.1 + lookYOffset;
          targetMeshY = Math.sin(time * 0.5) * 0.02;
          // Right leg kicks forward periodically
          const kickPhase = (Math.sin(time * 2) + 1) / 2;
          targetRightLegRotX = -kickPhase * 0.6; // Kick forward
          targetLeftLegRotX = kickPhase * 0.1; // Slight counterbalance
          // Arms hang loosely
          targetLeftArmRotZ = -0.15;
          targetRightArmRotZ = 0.15;
          targetLeftArmRotX = Math.sin(time * 0.8) * 0.1;
          targetRightArmRotX = Math.sin(time * 0.8 + Math.PI) * 0.1;
          break;

        case 'meh':
          // Meh - bored shrug, disinterested posture
          targetMeshY = Math.sin(time * 0.3) * 0.01;
          targetHeadRotX = 0.1 + lookXOffset; // Slightly looking down
          targetHeadRotY = Math.sin(time * 0.4) * 0.05 + lookYOffset;
          targetHeadRotZ = 0.1; // Slight head tilt
          // Droopy shoulders via arms
          targetLeftArmRotZ = -0.1;
          targetRightArmRotZ = 0.1;
          targetLeftArmRotX = 0.1;
          targetRightArmRotX = 0.1;
          // Periodic small shrug
          const mehShrug = Math.sin(time * 0.5) * 0.5 + 0.5;
          if (mehShrug > 0.8) {
            targetLeftArmRotZ = -0.3;
            targetRightArmRotZ = 0.3;
          }
          break;

        case 'foot_tap':
          // Foot tap - impatient tapping with crossed arms
          targetMeshY = Math.sin(time * 0.5) * 0.01;
          targetHeadRotX = lookXOffset;
          targetHeadRotY = Math.sin(time * 0.8) * 0.1 + lookYOffset;
          // Crossed arms
          targetLeftArmRotX = -1.5;
          targetLeftArmRotZ = 0.7;
          targetRightArmRotX = -1.5;
          targetRightArmRotZ = -0.7;
          // Fast foot tapping
          const tapPhase = Math.sin(time * 8);
          targetRightLegRotX = tapPhase > 0 ? -0.15 : 0;
          break;

        case 'look_around':
          // Look around - curious head movements
          targetMeshY = Math.sin(time * 0.5) * 0.02;
          // Slow sweeping look left to right
          const lookPhase = Math.sin(time * 0.8);
          targetHeadRotY = lookPhase * 0.5 + lookYOffset;
          targetHeadRotX = Math.sin(time * 1.2) * 0.15 + lookXOffset;
          // Slight body turn following head
          targetMeshRotX = lookPhase * 0.05;
          // Arms relaxed with slight movement
          targetLeftArmRotZ = -0.1 + Math.sin(time * 0.5) * 0.05;
          targetRightArmRotZ = 0.1 + Math.sin(time * 0.5 + Math.PI) * 0.05;
          break;

        case 'yawn':
          // Yawn - mouth wide, covering with hand
          const yawnCycle = (Math.sin(time * 0.6) + 1) / 2; // 0 to 1
          targetMeshY = yawnCycle * 0.05;
          targetHeadRotX = -0.2 * yawnCycle + lookXOffset; // Head tilts back during yawn
          targetHeadRotY = lookYOffset;
          // Right hand covers mouth during yawn
          targetRightArmRotX = -1.8 * yawnCycle;
          targetRightArmRotZ = 0.3 * yawnCycle;
          // Left arm stretches slightly
          targetLeftArmRotX = -0.5 * yawnCycle;
          targetLeftArmRotZ = -0.3 * yawnCycle;
          // Eyes close during peak yawn
          if (yawnCycle > 0.6) {
            targetLeftEyeScaleY = 0.2;
            targetRightEyeScaleY = 0.2;
          }
          break;

        case 'fidget':
          // Fidget - restless shifting, small random movements
          targetMeshY = Math.sin(time * 2) * 0.02 + Math.sin(time * 3.7) * 0.01;
          targetHeadRotX = Math.sin(time * 1.5) * 0.1 + lookXOffset;
          targetHeadRotY = Math.sin(time * 2.3) * 0.15 + lookYOffset;
          targetHeadRotZ = Math.sin(time * 1.8) * 0.08;
          // Arms fidgeting
          targetLeftArmRotX = Math.sin(time * 2.5) * 0.2;
          targetLeftArmRotZ = -0.1 + Math.sin(time * 3) * 0.1;
          targetRightArmRotX = Math.sin(time * 2.5 + 1) * 0.2;
          targetRightArmRotZ = 0.1 + Math.sin(time * 3 + 1) * 0.1;
          // Legs shifting
          targetLeftLegRotX = Math.sin(time * 1.5) * 0.1;
          targetRightLegRotX = Math.sin(time * 1.5 + Math.PI) * 0.1;
          break;

        case 'rub_eyes':
          // Rub eyes - tiredly rubbing eyes with both hands
          const rubCycle = (Math.sin(time * 1.5) + 1) / 2;
          targetMeshY = Math.sin(time * 0.5) * 0.01;
          targetHeadRotX = 0.15 + rubCycle * 0.1 + lookXOffset; // Head slightly down
          targetHeadRotY = lookYOffset;
          // Both hands to eyes
          targetLeftArmRotX = -2.0 - rubCycle * 0.2;
          targetLeftArmRotZ = -0.3 + Math.sin(time * 4) * 0.1; // Rubbing motion
          targetRightArmRotX = -2.0 - rubCycle * 0.2;
          targetRightArmRotZ = 0.3 + Math.sin(time * 4 + Math.PI) * 0.1; // Rubbing motion
          // Eyes closed while rubbing
          targetLeftEyeScaleY = 0.1;
          targetRightEyeScaleY = 0.1;
          break;

        case 'weight_shift':
          // Weight shift - shifting weight from foot to foot
          const shiftPhase = Math.sin(time * 1.2);
          // Body sways side to side
          targetMeshY = Math.abs(shiftPhase) * 0.03;
          targetHeadRotY = shiftPhase * 0.1 + lookYOffset;
          targetHeadRotX = lookXOffset;
          targetHeadRotZ = shiftPhase * 0.05;
          // Legs alternate weight
          targetLeftLegRotX = shiftPhase > 0 ? 0 : 0.15;
          targetRightLegRotX = shiftPhase > 0 ? 0.15 : 0;
          // Arms sway slightly with body
          targetLeftArmRotZ = -0.1 + shiftPhase * 0.1;
          targetRightArmRotZ = 0.1 + shiftPhase * 0.1;
          break;

        // =========================================
        // PROCESSING/THINKING ANIMATIONS
        // =========================================
        case 'head_tilt':
          // Head tilt - curious/contemplative head tilt to the side
          const tiltPhase = (Math.sin(time * 0.8) + 1) / 2; // 0 to 1
          targetMeshY = Math.sin(time * 0.5) * 0.02;
          targetHeadRotZ = 0.25 + Math.sin(time * 0.6) * 0.05; // Tilted to side
          targetHeadRotY = Math.sin(time * 0.4) * 0.1 + lookYOffset;
          targetHeadRotX = lookXOffset;
          // Slight eyebrow raise effect via subtle movements
          targetLeftArmRotZ = -0.1;
          targetRightArmRotZ = 0.1;
          // Occasional small movement
          targetLeftArmRotX = Math.sin(time * 0.5) * 0.05;
          break;

        case 'chin_stroke':
          // Chin stroke - thoughtful pose with hand on chin
          targetMeshY = Math.sin(time * 0.4) * 0.02;
          targetHeadRotX = 0.1 + Math.sin(time * 0.5) * 0.03 + lookXOffset; // Slightly down
          targetHeadRotY = -0.15 + Math.sin(time * 0.3) * 0.05 + lookYOffset; // Slight turn
          targetHeadRotZ = Math.sin(time * 0.4) * 0.05;
          // Right hand to chin
          targetRightArmRotX = -1.8 + Math.sin(time * 2) * 0.05; // Hand near chin with subtle movement
          targetRightArmRotZ = 0.4;
          // Left arm relaxed
          targetLeftArmRotZ = -0.15;
          targetLeftArmRotX = 0.1;
          break;
      }

      // Apply smooth transitions using lerp
      if (meshRef.current) {
        meshRef.current.position.y = lerp(meshRef.current.position.y, positionY + targetMeshY, transitionSpeed);
        meshRef.current.rotation.x = lerp(meshRef.current.rotation.x, targetMeshRotX, transitionSpeed);
        meshRef.current.rotation.y = lerp(meshRef.current.rotation.y, targetMeshRotY, transitionSpeed);
      }
      if (headRef.current) {
        headRef.current.rotation.x = lerp(headRef.current.rotation.x, targetHeadRotX, transitionSpeed);
        headRef.current.rotation.y = lerp(headRef.current.rotation.y, targetHeadRotY, transitionSpeed);
        headRef.current.rotation.z = lerp(headRef.current.rotation.z, targetHeadRotZ, transitionSpeed);
      }
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = lerp(leftArmRef.current.rotation.x, targetLeftArmRotX, transitionSpeed);
        leftArmRef.current.rotation.z = lerp(leftArmRef.current.rotation.z, targetLeftArmRotZ, transitionSpeed);
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = lerp(rightArmRef.current.rotation.x, targetRightArmRotX, transitionSpeed);
        rightArmRef.current.rotation.z = lerp(rightArmRef.current.rotation.z, targetRightArmRotZ, transitionSpeed);
      }
      if (leftLegRef.current) {
        leftLegRef.current.rotation.x = lerp(leftLegRef.current.rotation.x, targetLeftLegRotX, transitionSpeed);
      }
      if (rightLegRef.current) {
        rightLegRef.current.rotation.x = lerp(rightLegRef.current.rotation.x, targetRightLegRotX, transitionSpeed);
      }
      // Forearm animations (elbow bend)
      if (leftForearmRef.current) {
        leftForearmRef.current.rotation.x = lerp(leftForearmRef.current.rotation.x, targetLeftForearmRotX, transitionSpeed);
      }
      if (rightForearmRef.current) {
        rightForearmRef.current.rotation.x = lerp(rightForearmRef.current.rotation.x, targetRightForearmRotX, transitionSpeed);
      }
      // Lower leg animations (knee bend)
      if (leftLowerLegRef.current) {
        leftLowerLegRef.current.rotation.x = lerp(leftLowerLegRef.current.rotation.x, targetLeftLowerLegRotX, transitionSpeed);
      }
      if (rightLowerLegRef.current) {
        rightLowerLegRef.current.rotation.x = lerp(rightLowerLegRef.current.rotation.x, targetRightLowerLegRotX, transitionSpeed);
      }
      // Foot animations (ankle flex)
      if (leftFootRef.current) {
        leftFootRef.current.rotation.x = lerp(leftFootRef.current.rotation.x, targetLeftFootRotX, transitionSpeed);
      }
      if (rightFootRef.current) {
        rightFootRef.current.rotation.x = lerp(rightFootRef.current.rotation.x, targetRightFootRotX, transitionSpeed);
      }
      if (leftEyeRef.current) {
        // Use faster lerp for blinks (explicit or automatic) vs normal transitions
        const isBlinking = complementary?.eyeState === 'blink' || 
                          complementary?.eyeState === 'surprised_blink' || 
                          blinkStartTime.current !== null;
        const eyeLerpSpeed = isBlinking ? LERP_SPEED.veryFast : transitionSpeed;
        leftEyeRef.current.scale.y = lerp(leftEyeRef.current.scale.y, targetLeftEyeScaleY, eyeLerpSpeed);
      }
      if (rightEyeRef.current) {
        const isBlinking = complementary?.eyeState === 'blink' || 
                          complementary?.eyeState === 'surprised_blink' || 
                          blinkStartTime.current !== null;
        const eyeLerpSpeed = isBlinking ? LERP_SPEED.veryFast : transitionSpeed;
        rightEyeRef.current.scale.y = lerp(rightEyeRef.current.scale.y, targetRightEyeScaleY, eyeLerpSpeed);
      }
      // Eyebrow animations
      if (leftEyebrowRef.current) {
        leftEyebrowRef.current.rotation.z = lerp(leftEyebrowRef.current.rotation.z, targetLeftEyebrowRotZ, transitionSpeed);
        leftEyebrowRef.current.position.y = lerp(leftEyebrowRef.current.position.y, eyebrowBaseY + targetLeftEyebrowPosY, transitionSpeed);
      }
      if (rightEyebrowRef.current) {
        rightEyebrowRef.current.rotation.z = lerp(rightEyebrowRef.current.rotation.z, targetRightEyebrowRotZ, transitionSpeed);
        rightEyebrowRef.current.position.y = lerp(rightEyebrowRef.current.position.y, eyebrowBaseY + targetRightEyebrowPosY, transitionSpeed);
      }

      // NEW: Eye X-scale lerping (for wide/narrow states)
      if (leftEyeRef.current) {
        leftEyeRef.current.scale.x = lerp(leftEyeRef.current.scale.x, targetLeftEyeScaleX, LERP_SPEED.fast);
      }
      if (rightEyeRef.current) {
        rightEyeRef.current.scale.x = lerp(rightEyeRef.current.scale.x, targetRightEyeScaleX, LERP_SPEED.fast);
      }

      // NEW: Nose lerping
      if (noseRef.current) {
        noseRef.current.scale.x = lerp(noseRef.current.scale.x, targetNoseScaleX, transitionSpeed);
        noseRef.current.scale.y = lerp(noseRef.current.scale.y, targetNoseScaleY, transitionSpeed);
        noseRef.current.rotation.z = lerp(noseRef.current.rotation.z, targetNoseRotZ, transitionSpeed);
      }

      // NEW: Jaw/Head lerping (via headRef)
      if (headRef.current) {
        headRef.current.scale.y = lerp(headRef.current.scale.y, targetHeadScaleY, transitionSpeed);
        headRef.current.position.z = lerp(headRef.current.position.z, targetJawPosZ, transitionSpeed);
      }

      // Check for one-shot animation completion
      const duration = ONE_SHOT_ANIMATIONS[animation];
      if (duration && !animationCompleted.current && onAnimationComplete) {
        const elapsed = (Date.now() / 1000) - animationStartTime.current;
        if (elapsed >= duration) {
          animationCompleted.current = true;
          onAnimationComplete();
        }
      }

      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [isActive, animation, isTalking, animSpeed, complementary?.lookDirection, complementary?.eyeState, complementary?.eyebrowState, complementary?.headStyle, complementary?.mouthState, complementary?.noseState, complementary?.cheekState, complementary?.foreheadState, complementary?.jawState, onAnimationComplete, positionY]);

  // Get customization from character config
  const customization = character.customization;
  const accessories = customization.accessories || [];

  // Head accessories
  const hasGlasses = accessories.includes('glasses');
  const hasHat = accessories.includes('hat');
  const hasCrown = accessories.includes('crown');
  const hasHeadphones = accessories.includes('headphones');
  const hasTopHat = accessories.includes('top_hat');
  const hasMonocle = accessories.includes('monocle');

  // Facial accessories
  const hasBeard = accessories.includes('beard');
  const hasMoustache = accessories.includes('moustache');
  const hasEyePatch = accessories.includes('eye_patch');

  // Body/clothing accessories
  const hasTie = accessories.includes('tie');
  const hasScarf = accessories.includes('scarf');
  const hasBowtie = accessories.includes('bowtie');
  const hasCape = accessories.includes('cape');
  const hasNecklace = accessories.includes('necklace');
  const hasSuspenders = accessories.includes('suspenders');
  const hasBackpack = accessories.includes('backpack');
  const hasWings = accessories.includes('wings');

  // Hand/arm accessories
  const hasCane = accessories.includes('cane');
  const hasHook = accessories.includes('hook');

  // Other accessories
  const hasParrot = accessories.includes('parrot');
  const hasPegLeg = accessories.includes('peg_leg');
  const hasWheelchair = accessories.includes('wheelchair');
  const hairType = customization.hair;
  const hairColor = customization.hairColor;
  const clothingType = customization.clothing;

  // Skin tone mapping
  const skinToneColors = {
    light: '#f4c8a8',
    medium: '#d4a574',
    tan: '#c68642',
    dark: '#8d5524',
  };
  const skinColor = skinToneColors[customization.skinTone];

  // For single character display, center at origin with optional offsets
  const position: [number, number, number] = [positionX, positionY, positionZ];

  // =========================================
  // ANIME FACE DECORATIONS (for all styles)
  // =========================================
  const renderFaceDecorations = (faceOffset: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 }) => {
    const faceState = complementary?.faceState;
    if (!faceState || faceState === 'normal') return null;

    return (
      <>
        {/* NEW: Cheek States - render cheeks based on cheekState */}
        {complementary?.cheekState === 'flushed' && (
          <>
            <mesh position={[-0.18 + faceOffset.x, -0.02 + faceOffset.y, 0.24 + faceOffset.z]}>
              <circleGeometry args={[0.06, 16]} />
              <meshBasicMaterial color="#ffb3d9" transparent opacity={0.6} />
            </mesh>
            <mesh position={[0.18 + faceOffset.x, -0.02 + faceOffset.y, 0.24 + faceOffset.z]}>
              <circleGeometry args={[0.06, 16]} />
              <meshBasicMaterial color="#ffb3d9" transparent opacity={0.6} />
            </mesh>
          </>
        )}

        {complementary?.cheekState === 'sunken' && (
          <>
            <mesh position={[-0.18 + faceOffset.x, -0.05 + faceOffset.y, 0.23 + faceOffset.z]}>
              <boxGeometry args={[0.08, 0.06, 0.01]} />
              <meshBasicMaterial color="#1a1a1a" transparent opacity={0.4} />
            </mesh>
            <mesh position={[0.18 + faceOffset.x, -0.05 + faceOffset.y, 0.23 + faceOffset.z]}>
              <boxGeometry args={[0.08, 0.06, 0.01]} />
              <meshBasicMaterial color="#1a1a1a" transparent opacity={0.4} />
            </mesh>
          </>
        )}

        {complementary?.cheekState === 'puffed' && (
          <>
            <mesh position={[-0.20 + faceOffset.x, -0.02 + faceOffset.y, 0.26 + faceOffset.z]}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshStandardMaterial color="#d4a5a5" roughness={0.6} />
            </mesh>
            <mesh position={[0.20 + faceOffset.x, -0.02 + faceOffset.y, 0.26 + faceOffset.z]}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshStandardMaterial color="#d4a5a5" roughness={0.6} />
            </mesh>
          </>
        )}

        {complementary?.cheekState === 'dimpled' && (
          <>
            <mesh position={[-0.18 + faceOffset.x, -0.08 + faceOffset.y, 0.26 + faceOffset.z]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshBasicMaterial color="#3a3a3a" />
            </mesh>
            <mesh position={[0.18 + faceOffset.x, -0.08 + faceOffset.y, 0.26 + faceOffset.z]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshBasicMaterial color="#3a3a3a" />
            </mesh>
          </>
        )}

        {/* NEW: Forehead States - render lines/effects on forehead */}
        {complementary?.foreheadState === 'wrinkled' && (
          <>
            <mesh position={[0 + faceOffset.x, 0.18 + faceOffset.y, 0.24 + faceOffset.z]}>
              <boxGeometry args={[0.3, 0.01, 0.01]} />
              <meshBasicMaterial color="#2a2a2a" transparent opacity={0.5} />
            </mesh>
            <mesh position={[0 + faceOffset.x, 0.20 + faceOffset.y, 0.24 + faceOffset.z]}>
              <boxGeometry args={[0.25, 0.01, 0.01]} />
              <meshBasicMaterial color="#2a2a2a" transparent opacity={0.5} />
            </mesh>
            <mesh position={[0 + faceOffset.x, 0.22 + faceOffset.y, 0.24 + faceOffset.z]}>
              <boxGeometry args={[0.28, 0.01, 0.01]} />
              <meshBasicMaterial color="#2a2a2a" transparent opacity={0.5} />
            </mesh>
          </>
        )}

        {complementary?.foreheadState === 'tense' && (
          <mesh position={[0 + faceOffset.x, 0.20 + faceOffset.y, 0.24 + faceOffset.z]}>
            <boxGeometry args={[0.3, 0.02, 0.01]} />
            <meshBasicMaterial color="#2a2a2a" transparent opacity={0.6} />
          </mesh>
        )}

        {/* NEW: Tearful State - add tear drops */}
        {complementary?.eyeState === 'tearful' && (
          <>
            <mesh position={[-0.12 + faceOffset.x, -0.02 + faceOffset.y, 0.27 + faceOffset.z]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshBasicMaterial color="#4dd0e1" transparent opacity={0.7} />
            </mesh>
            <mesh position={[0.12 + faceOffset.x, -0.02 + faceOffset.y, 0.27 + faceOffset.z]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshBasicMaterial color="#4dd0e1" transparent opacity={0.7} />
            </mesh>
          </>
        )}

        {/* Sweat Drop - Nervous anime sweat */}
        {faceState === 'sweat_drop' && (
          <mesh position={[0.22 + faceOffset.x, 0.15 + faceOffset.y, 0.2 + faceOffset.z]} rotation={[0, 0, -0.3]}>
            <coneGeometry args={[0.03, 0.08, 8]} />
            <meshBasicMaterial color="#87ceeb" transparent opacity={0.8} />
          </mesh>
        )}

        {/* Sparkle Eyes - Excited star eyes (replace normal eyes) */}
        {faceState === 'sparkle_eyes' && (
          <>
            {/* Left star */}
            <mesh position={[-0.1 + faceOffset.x, 0.05 + faceOffset.y, 0.26 + faceOffset.z]}>
              <sphereGeometry args={[0.045, 4, 2]} />
              <meshBasicMaterial color="#ffff00" />
            </mesh>
            {/* Right star */}
            <mesh position={[0.1 + faceOffset.x, 0.05 + faceOffset.y, 0.26 + faceOffset.z]}>
              <sphereGeometry args={[0.045, 4, 2]} />
              <meshBasicMaterial color="#ffff00" />
            </mesh>
            {/* Sparkle effects */}
            <mesh position={[-0.15 + faceOffset.x, 0.12 + faceOffset.y, 0.22 + faceOffset.z]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.02, 0.06, 0.01]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0.15 + faceOffset.x, 0.12 + faceOffset.y, 0.22 + faceOffset.z]} rotation={[0, 0, -Math.PI / 4]}>
              <boxGeometry args={[0.02, 0.06, 0.01]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </>
        )}

        {/* Heart Eyes - Love/admiration */}
        {faceState === 'heart_eyes' && (
          <>
            {/* Left heart (using two spheres) */}
            <group position={[-0.1 + faceOffset.x, 0.05 + faceOffset.y, 0.26 + faceOffset.z]}>
              <mesh position={[-0.015, 0.015, 0]}>
                <sphereGeometry args={[0.025, 8, 8]} />
                <meshBasicMaterial color="#ff69b4" />
              </mesh>
              <mesh position={[0.015, 0.015, 0]}>
                <sphereGeometry args={[0.025, 8, 8]} />
                <meshBasicMaterial color="#ff69b4" />
              </mesh>
              <mesh position={[0, -0.015, 0]} rotation={[0, 0, Math.PI / 4]}>
                <boxGeometry args={[0.035, 0.035, 0.02]} />
                <meshBasicMaterial color="#ff69b4" />
              </mesh>
            </group>
            {/* Right heart */}
            <group position={[0.1 + faceOffset.x, 0.05 + faceOffset.y, 0.26 + faceOffset.z]}>
              <mesh position={[-0.015, 0.015, 0]}>
                <sphereGeometry args={[0.025, 8, 8]} />
                <meshBasicMaterial color="#ff69b4" />
              </mesh>
              <mesh position={[0.015, 0.015, 0]}>
                <sphereGeometry args={[0.025, 8, 8]} />
                <meshBasicMaterial color="#ff69b4" />
              </mesh>
              <mesh position={[0, -0.015, 0]} rotation={[0, 0, Math.PI / 4]}>
                <boxGeometry args={[0.035, 0.035, 0.02]} />
                <meshBasicMaterial color="#ff69b4" />
              </mesh>
            </group>
          </>
        )}

        {/* Spiral Eyes - Dizzy/confused */}
        {faceState === 'spiral_eyes' && (
          <>
            <mesh position={[-0.1 + faceOffset.x, 0.05 + faceOffset.y, 0.26 + faceOffset.z]} rotation={[0, 0, 0]}>
              <torusGeometry args={[0.03, 0.008, 8, 16, Math.PI * 3]} />
              <meshBasicMaterial color="#1a1a1a" />
            </mesh>
            <mesh position={[0.1 + faceOffset.x, 0.05 + faceOffset.y, 0.26 + faceOffset.z]} rotation={[0, 0, 0]}>
              <torusGeometry args={[0.03, 0.008, 8, 16, Math.PI * 3]} />
              <meshBasicMaterial color="#1a1a1a" />
            </mesh>
          </>
        )}

        {/* Tears - Crying streams */}
        {faceState === 'tears' && (
          <>
            {/* Left tear stream */}
            <mesh position={[-0.12 + faceOffset.x, -0.05 + faceOffset.y, 0.24 + faceOffset.z]}>
              <cylinderGeometry args={[0.015, 0.02, 0.12, 8]} />
              <meshBasicMaterial color="#87ceeb" transparent opacity={0.7} />
            </mesh>
            {/* Right tear stream */}
            <mesh position={[0.12 + faceOffset.x, -0.05 + faceOffset.y, 0.24 + faceOffset.z]}>
              <cylinderGeometry args={[0.015, 0.02, 0.12, 8]} />
              <meshBasicMaterial color="#87ceeb" transparent opacity={0.7} />
            </mesh>
            {/* Tear drops */}
            <mesh position={[-0.12 + faceOffset.x, -0.12 + faceOffset.y, 0.24 + faceOffset.z]}>
              <sphereGeometry args={[0.025, 8, 8]} />
              <meshBasicMaterial color="#87ceeb" transparent opacity={0.8} />
            </mesh>
            <mesh position={[0.12 + faceOffset.x, -0.12 + faceOffset.y, 0.24 + faceOffset.z]}>
              <sphereGeometry args={[0.025, 8, 8]} />
              <meshBasicMaterial color="#87ceeb" transparent opacity={0.8} />
            </mesh>
          </>
        )}

        {/* Anger Vein - Anime anger mark */}
        {faceState === 'anger_vein' && (
          <group position={[0.18 + faceOffset.x, 0.18 + faceOffset.y, 0.2 + faceOffset.z]}>
            {/* Cross shape anger vein */}
            <mesh rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.06, 0.015, 0.01]} />
              <meshBasicMaterial color="#ff3333" />
            </mesh>
            <mesh rotation={[0, 0, -Math.PI / 4]}>
              <boxGeometry args={[0.06, 0.015, 0.01]} />
              <meshBasicMaterial color="#ff3333" />
            </mesh>
            {/* Additional smaller crosses for traditional anger mark */}
            <mesh position={[0.02, 0.02, 0]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.04, 0.012, 0.01]} />
              <meshBasicMaterial color="#ff3333" />
            </mesh>
            <mesh position={[0.02, 0.02, 0]} rotation={[0, 0, -Math.PI / 4]}>
              <boxGeometry args={[0.04, 0.012, 0.01]} />
              <meshBasicMaterial color="#ff3333" />
            </mesh>
          </group>
        )}

        {/* Shadow Face - Dark aura/disappointment */}
        {faceState === 'shadow_face' && (
          <>
            {/* Dark overlay on upper face */}
            <mesh position={[0 + faceOffset.x, 0.08 + faceOffset.y, 0.23 + faceOffset.z]}>
              <boxGeometry args={[0.4, 0.15, 0.02]} />
              <meshBasicMaterial color="#1a1a2e" transparent opacity={0.7} />
            </mesh>
            {/* Glowing eyes through shadow */}
            <mesh position={[-0.1 + faceOffset.x, 0.05 + faceOffset.y, 0.25 + faceOffset.z]}>
              <circleGeometry args={[0.02, 8]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0.1 + faceOffset.x, 0.05 + faceOffset.y, 0.25 + faceOffset.z]}>
              <circleGeometry args={[0.02, 8]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </>
        )}
      </>
    );
  };

  // =========================================
  // BLOCKY STYLE (Minecraft-like)
  // =========================================

  // Body dimensions configuration - all positions derived from these
  const body = useMemo(() => {
    // === TORSO ===
    const torso = {
      width: 0.9,
      height: 0.6,
      depth: 0.5,
      y: 0.25,
    };
    // Derived torso positions
    const torsoTop = torso.y + torso.height / 2;
    const torsoBottom = torso.y - torso.height / 2;
    const torsoFront = torso.depth / 2;
    const torsoBack = -torso.depth / 2;

    // === ARMS ===
    const armDiameter = { width: 0.2, depth: 0.25 };
    const upperArm = { ...armDiameter, height: 0.25 };
    const forearm = { ...armDiameter, height: 0.25 };
    const hand = { ...armDiameter, height: 0.1 };
    const armX = torso.width / 2 + armDiameter.width / 2 + 0.025;
    const armY = 0.45;
    const forearmY = -upperArm.height;
    const handY = -(forearm.height / 2 + hand.height / 2);

    // === LEGS ===
    const legDiameter = { width: 0.25, depth: 0.25 };
    const upperLeg = { ...legDiameter, height: 0.22 };
    const lowerLeg = { ...legDiameter, height: 0.22 };
    const foot = { width: 0.25, height: 0.06, depth: 0.35 };
    const legX = 0.15;
    const legY = torsoBottom;
    const lowerLegY = -upperLeg.height;
    const footY = -(lowerLeg.height / 2 + foot.height / 2);
    const footZ = 0.05;

    // === NECK / COLLAR ===
    const neckY = torsoTop - 0.05;
    const collarY = torsoTop;

    // === CLOTHING OVERLAYS (slightly larger than torso) ===
    const clothingOffset = 0.02;
    const clothing = {
      width: torso.width + clothingOffset,
      height: torso.height + clothingOffset,
      depth: torso.depth + clothingOffset,
    };

    // === ACCESSORY Z POSITIONS ===
    const frontZ = torsoFront - 0.02; // On front surface
    const frontZOuter = torsoFront + 0.01; // Just in front of torso
    const backZ = torsoBack + 0.02; // On back surface
    const backZOuter = torsoBack - 0.05; // Behind torso

    return {
      // Torso
      torso, torsoTop, torsoBottom, torsoFront, torsoBack,
      // Arms
      upperArm, forearm, hand, armX, armY, forearmY, handY,
      // Legs
      upperLeg, lowerLeg, foot, legX, legY, lowerLegY, footY, footZ,
      // Neck/collar
      neckY, collarY,
      // Clothing
      clothing,
      // Accessory Z positions
      frontZ, frontZOuter, backZ, backZOuter,
    };
  }, []);

  const renderBlockyBody = () => (
    <>
      {/* Legs - articulated with upper leg, lower leg, and foot */}
      {/* Left Leg */}
      <group ref={leftLegRef} position={[-body.legX, body.legY, 0]}>
        {/* Upper Leg */}
        <mesh castShadow>
          <boxGeometry args={[body.upperLeg.width, body.upperLeg.height, body.upperLeg.depth]} />
          <meshStandardMaterial color={character.model3D.bodyColor} roughness={0.7} />
        </mesh>
        {/* Lower Leg group */}
        <group ref={leftLowerLegRef} position={[0, body.lowerLegY, 0]}>
          <mesh castShadow>
            <boxGeometry args={[body.lowerLeg.width, body.lowerLeg.height, body.lowerLeg.depth]} />
            <meshStandardMaterial color={character.model3D.bodyColor} roughness={0.7} />
          </mesh>
          {/* Foot */}
          <mesh ref={leftFootRef} position={[0, body.footY, body.footZ]} castShadow>
            <boxGeometry args={[body.foot.width, body.foot.height, body.foot.depth]} />
            <meshStandardMaterial color={character.model3D.bodyColor} roughness={0.7} />
          </mesh>
        </group>
      </group>
      {/* Right Leg OR Peg Leg */}
      {hasPegLeg ? (
        <group ref={rightLegRef} position={[body.legX, body.legY, 0]}>
          {/* Stump/attachment at hip */}
          <mesh castShadow>
            <boxGeometry args={[body.upperLeg.width * 0.5, body.upperLeg.height * 0.4, body.upperLeg.depth * 0.5]} />
            <meshStandardMaterial color={character.model3D.bodyColor} roughness={0.7} />
          </mesh>
          {/* Wooden peg - positioned below stump */}
          <group ref={rightLowerLegRef} position={[0, body.lowerLegY * 0.5, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.08, body.upperLeg.height + body.lowerLeg.height, 0.08]} />
              <meshStandardMaterial color="#5c4a3a" roughness={0.8} />
            </mesh>
            {/* Metal cap at bottom */}
            <mesh ref={rightFootRef} position={[0, -(body.upperLeg.height + body.lowerLeg.height) / 2, 0]} castShadow>
              <boxGeometry args={[0.09, 0.02, 0.09]} />
              <meshStandardMaterial color="#4a4a4a" metalness={0.7} roughness={0.3} />
            </mesh>
          </group>
        </group>
      ) : (
        <group ref={rightLegRef} position={[body.legX, body.legY, 0]}>
          {/* Upper Leg */}
          <mesh castShadow>
            <boxGeometry args={[body.upperLeg.width, body.upperLeg.height, body.upperLeg.depth]} />
            <meshStandardMaterial color={character.model3D.bodyColor} roughness={0.7} />
          </mesh>
          {/* Lower Leg group */}
          <group ref={rightLowerLegRef} position={[0, body.lowerLegY, 0]}>
            <mesh castShadow>
              <boxGeometry args={[body.lowerLeg.width, body.lowerLeg.height, body.lowerLeg.depth]} />
              <meshStandardMaterial color={character.model3D.bodyColor} roughness={0.7} />
            </mesh>
            {/* Foot */}
            <mesh ref={rightFootRef} position={[0, body.footY, body.footZ]} castShadow>
              <boxGeometry args={[body.foot.width, body.foot.height, body.foot.depth]} />
              <meshStandardMaterial color={character.model3D.bodyColor} roughness={0.7} />
            </mesh>
          </group>
        </group>
      )}

      {/* Body/Torso */}
      <mesh position={[0, body.torso.y, 0]} castShadow>
        <boxGeometry args={[body.torso.width, body.torso.height, body.torso.depth]} />
        <meshStandardMaterial color={character.model3D.bodyColor} roughness={0.7} />
      </mesh>

      {/* Tie */}
      {hasTie && (
        <mesh position={[0, body.torso.y + 0.1, body.frontZOuter]} castShadow>
          <boxGeometry args={[0.15, body.torso.height * 0.7, 0.02]} />
          <meshStandardMaterial color="#2c2c2c" roughness={0.8} />
        </mesh>
      )}

      {/* Bow Tie */}
      {hasBowtie && (
        <>
          {/* Center knot */}
          <mesh position={[0, body.neckY, body.frontZOuter]} castShadow>
            <boxGeometry args={[0.06, 0.06, 0.02]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.7} />
          </mesh>
          {/* Left wing */}
          <mesh position={[-0.08, body.neckY, body.frontZOuter]} castShadow>
            <boxGeometry args={[0.1, 0.08, 0.02]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.7} />
          </mesh>
          {/* Right wing */}
          <mesh position={[0.08, body.neckY, body.frontZOuter]} castShadow>
            <boxGeometry args={[0.1, 0.08, 0.02]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.7} />
          </mesh>
        </>
      )}

      {/* Scarf */}
      {hasScarf && (
        <>
          {/* Scarf wrap around neck */}
          <mesh position={[0, body.collarY, 0]} castShadow>
            <boxGeometry args={[body.torso.width * 0.85, 0.12, body.torso.depth]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.9} />
          </mesh>
          {/* Scarf hanging piece - left side */}
          <mesh position={[-body.torso.width * 0.25, body.torso.y - 0.05, body.frontZOuter]} castShadow>
            <boxGeometry args={[0.12, body.torso.height * 0.7, 0.04]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.9} />
          </mesh>
          {/* Scarf hanging piece - right side */}
          <mesh position={[body.torso.width * 0.2, body.torso.y + 0.03, body.frontZOuter]} castShadow>
            <boxGeometry args={[0.12, body.torso.height * 0.5, 0.04]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.9} />
          </mesh>
        </>
      )}

      {/* Cape */}
      {hasCape && (
        <>
          {/* Cape collar */}
          <mesh position={[0, body.collarY, body.torsoBack]} castShadow>
            <boxGeometry args={[body.torso.width * 0.9, 0.1, 0.2]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.8} />
          </mesh>
          {/* Cape back - main body */}
          <mesh position={[0, body.torso.y - 0.15, body.backZOuter]} castShadow>
            <boxGeometry args={[body.torso.width, body.torso.height * 1.3, 0.04]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.8} />
          </mesh>
          {/* Cape inner lining (slightly visible) */}
          <mesh position={[0, body.torso.y - 0.15, body.backZOuter + 0.03]} castShadow>
            <boxGeometry args={[body.torso.width * 0.93, body.torso.height * 1.2, 0.01]} />
            <meshStandardMaterial color="#8b0000" roughness={0.7} />
          </mesh>
        </>
      )}

      {/* Dress (overwrites torso when clothing is 'dress') */}
      {clothingType === 'dress' && (
        <>
          {/* Dress top */}
          <mesh position={[0, body.torso.y, 0.01]} castShadow>
            <boxGeometry args={[body.clothing.width * 0.82, body.clothing.height, body.clothing.depth * 0.9]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.7} />
          </mesh>
          {/* Dress skirt - flared */}
          <mesh position={[0, body.torsoBottom - 0.1, 0]} castShadow>
            <boxGeometry args={[body.torso.width, 0.4, body.torso.depth * 1.1]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.7} />
          </mesh>
          {/* Dress waist ribbon */}
          <mesh position={[0, body.torsoBottom + 0.1, body.frontZOuter]} castShadow>
            <boxGeometry args={[body.clothing.width * 0.85, 0.08, 0.02]} />
            <meshStandardMaterial color="#ffffff" roughness={0.6} />
          </mesh>
        </>
      )}

      {/* Jacket (overlay on torso when clothing is 'jacket') */}
      {clothingType === 'jacket' && (
        <>
          {/* Jacket body */}
          <mesh position={[0, body.torso.y, 0.01]} castShadow>
            <boxGeometry args={[body.clothing.width * 0.85, body.clothing.height, body.clothing.depth * 0.92]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.7} />
          </mesh>
          {/* Jacket lapel left */}
          <mesh position={[-body.torso.width * 0.24, body.torso.y + 0.15, body.frontZOuter - 0.01]} rotation={[0, 0, 0.2]} castShadow>
            <boxGeometry args={[0.15, 0.3, 0.02]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.7} />
          </mesh>
          {/* Jacket lapel right */}
          <mesh position={[body.torso.width * 0.24, body.torso.y + 0.15, body.frontZOuter - 0.01]} rotation={[0, 0, -0.2]} castShadow>
            <boxGeometry args={[0.15, 0.3, 0.02]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.7} />
          </mesh>
          {/* Shirt visible underneath */}
          <mesh position={[0, body.torso.y + 0.1, body.frontZOuter - 0.02]} castShadow>
            <boxGeometry args={[0.12, 0.35, 0.02]} />
            <meshStandardMaterial color="#ffffff" roughness={0.6} />
          </mesh>
          {/* Jacket buttons */}
          <mesh position={[0, body.torso.y - 0.05, body.frontZOuter]} castShadow>
            <boxGeometry args={[0.04, 0.04, 0.02]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
          </mesh>
          <mesh position={[0, body.torso.y - 0.17, body.frontZOuter]} castShadow>
            <boxGeometry args={[0.04, 0.04, 0.02]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
          </mesh>
        </>
      )}

      {/* Hoodie */}
      {clothingType === 'hoodie' && (
        <>
          {/* Hoodie body */}
          <mesh position={[0, body.torso.y, 0.01]} castShadow>
            <boxGeometry args={[body.clothing.width * 0.85, body.clothing.height, body.clothing.depth * 0.92]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.9} />
          </mesh>
          {/* Hoodie pocket */}
          <mesh position={[0, body.torso.y - 0.2, body.frontZOuter - 0.01]} castShadow>
            <boxGeometry args={[body.torso.width * 0.53, 0.18, 0.02]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.9} />
          </mesh>
          {/* Pocket line */}
          <mesh position={[0, body.torso.y - 0.11, body.frontZOuter]} castShadow>
            <boxGeometry args={[body.torso.width * 0.47, 0.02, 0.01]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
          </mesh>
          {/* Hood (behind head) */}
          <mesh position={[0, body.torsoTop + 0.1, body.torsoBack + 0.05]} castShadow>
            <boxGeometry args={[body.torso.width * 0.73, 0.35, 0.2]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.9} />
          </mesh>
          {/* Drawstrings */}
          <mesh position={[-0.1, body.torso.y + 0.2, body.frontZOuter - 0.01]} castShadow>
            <boxGeometry args={[0.03, 0.2, 0.02]} />
            <meshStandardMaterial color="#ffffff" roughness={0.7} />
          </mesh>
          <mesh position={[0.1, body.torso.y + 0.2, body.frontZOuter - 0.01]} castShadow>
            <boxGeometry args={[0.03, 0.2, 0.02]} />
            <meshStandardMaterial color="#ffffff" roughness={0.7} />
          </mesh>
        </>
      )}

      {/* Vest */}
      {clothingType === 'vest' && (
        <>
          {/* Vest body (open front) */}
          <mesh position={[-body.torso.width * 0.27, body.torso.y, body.frontZOuter - 0.02]} castShadow>
            <boxGeometry args={[0.2, body.torso.height * 0.93, 0.04]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.7} />
          </mesh>
          <mesh position={[body.torso.width * 0.27, body.torso.y, body.frontZOuter - 0.02]} castShadow>
            <boxGeometry args={[0.2, body.torso.height * 0.93, 0.04]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.7} />
          </mesh>
          {/* Vest back */}
          <mesh position={[0, body.torso.y, body.backZ]} castShadow>
            <boxGeometry args={[body.torso.width * 0.77, body.torso.height * 0.93, 0.04]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.7} />
          </mesh>
          {/* Shirt underneath */}
          <mesh position={[0, body.torso.y, body.frontZOuter - 0.03]} castShadow>
            <boxGeometry args={[0.18, body.torso.height * 0.86, 0.02]} />
            <meshStandardMaterial color="#ffffff" roughness={0.6} />
          </mesh>
          {/* Vest buttons */}
          <mesh position={[-0.12, body.torso.y + 0.1, body.frontZOuter]} castShadow>
            <boxGeometry args={[0.03, 0.03, 0.02]} />
            <meshStandardMaterial color="#c9a227" metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh position={[-0.12, body.torso.y - 0.03, body.frontZOuter]} castShadow>
            <boxGeometry args={[0.03, 0.03, 0.02]} />
            <meshStandardMaterial color="#c9a227" metalness={0.5} roughness={0.4} />
          </mesh>
        </>
      )}

      {/* Apron */}
      {clothingType === 'apron' && (
        <>
          {/* Apron bib */}
          <mesh position={[0, body.torso.y + 0.1, body.frontZOuter - 0.02]} castShadow>
            <boxGeometry args={[body.torso.width * 0.6, 0.45, 0.02]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.9} />
          </mesh>
          {/* Apron skirt */}
          <mesh position={[0, body.torsoBottom - 0.2, body.frontZOuter - 0.02]} castShadow>
            <boxGeometry args={[body.torso.width * 0.73, 0.5, 0.02]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.9} />
          </mesh>
          {/* Apron pocket */}
          <mesh position={[0, body.torsoBottom, body.frontZOuter]} castShadow>
            <boxGeometry args={[body.torso.width * 0.4, 0.15, 0.02]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.9} />
          </mesh>
          {/* Neck strap */}
          <mesh position={[0, body.torsoTop, 0.02]} castShadow>
            <boxGeometry args={[0.06, 0.08, 0.02]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.9} />
          </mesh>
          {/* Waist ties */}
          <mesh position={[-body.torso.width * 0.47, body.torsoBottom + 0.22, -0.05]} castShadow>
            <boxGeometry args={[0.15, 0.06, 0.02]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.9} />
          </mesh>
          <mesh position={[body.torso.width * 0.47, body.torsoBottom + 0.22, -0.05]} castShadow>
            <boxGeometry args={[0.15, 0.06, 0.02]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.9} />
          </mesh>
        </>
      )}

      {/* Lab Coat */}
      {clothingType === 'labcoat' && (
        <>
          {/* Lab coat body - long */}
          <mesh position={[0, body.torso.y - 0.15, 0.01]} castShadow>
            <boxGeometry args={[body.clothing.width * 0.9, body.torso.height * 1.4, body.clothing.depth * 0.95]} />
            <meshStandardMaterial color="#ffffff" roughness={0.6} />
          </mesh>
          {/* Coat collar left */}
          <mesh position={[-body.torso.width * 0.27, body.neckY - 0.03, body.frontZOuter - 0.01]} rotation={[0, 0, 0.15]} castShadow>
            <boxGeometry args={[0.18, 0.2, 0.02]} />
            <meshStandardMaterial color="#ffffff" roughness={0.6} />
          </mesh>
          {/* Coat collar right */}
          <mesh position={[body.torso.width * 0.27, body.neckY - 0.03, body.frontZOuter - 0.01]} rotation={[0, 0, -0.15]} castShadow>
            <boxGeometry args={[0.18, 0.2, 0.02]} />
            <meshStandardMaterial color="#ffffff" roughness={0.6} />
          </mesh>
          {/* Coat pockets */}
          <mesh position={[-body.torso.width * 0.27, body.torsoBottom, body.frontZOuter]} castShadow>
            <boxGeometry args={[0.2, 0.25, 0.02]} />
            <meshStandardMaterial color="#f5f5f5" roughness={0.6} />
          </mesh>
          <mesh position={[body.torso.width * 0.27, body.torsoBottom, body.frontZOuter]} castShadow>
            <boxGeometry args={[0.2, 0.25, 0.02]} />
            <meshStandardMaterial color="#f5f5f5" roughness={0.6} />
          </mesh>
          {/* Breast pocket */}
          <mesh position={[-body.torso.width * 0.24, body.torso.y + 0.1, body.frontZOuter]} castShadow>
            <boxGeometry args={[0.12, 0.1, 0.02]} />
            <meshStandardMaterial color="#f5f5f5" roughness={0.6} />
          </mesh>
          {/* Pen in pocket */}
          <mesh position={[-body.torso.width * 0.24, body.torso.y + 0.13, body.frontZOuter + 0.02]} castShadow>
            <boxGeometry args={[0.02, 0.08, 0.02]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
          </mesh>
          {/* Buttons */}
          <mesh position={[0, body.torso.y + 0.05, body.frontZOuter]} castShadow>
            <boxGeometry args={[0.04, 0.04, 0.02]} />
            <meshStandardMaterial color="#e0e0e0" roughness={0.5} />
          </mesh>
          <mesh position={[0, body.torso.y - 0.1, body.frontZOuter]} castShadow>
            <boxGeometry args={[0.04, 0.04, 0.02]} />
            <meshStandardMaterial color="#e0e0e0" roughness={0.5} />
          </mesh>
          <mesh position={[0, body.torso.y - 0.25, body.frontZOuter]} castShadow>
            <boxGeometry args={[0.04, 0.04, 0.02]} />
            <meshStandardMaterial color="#e0e0e0" roughness={0.5} />
          </mesh>
        </>
      )}

      {/* Suspenders */}
      {hasSuspenders && (
        <>
          {/* Left suspender - front */}
          <mesh position={[-body.torso.width * 0.24, body.torso.y + 0.05, body.frontZOuter - 0.02]} castShadow>
            <boxGeometry args={[0.06, body.torso.height * 0.86, 0.02]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.8} />
          </mesh>
          {/* Right suspender - front */}
          <mesh position={[body.torso.width * 0.24, body.torso.y + 0.05, body.frontZOuter - 0.02]} castShadow>
            <boxGeometry args={[0.06, body.torso.height * 0.86, 0.02]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.8} />
          </mesh>
          {/* Left suspender - back */}
          <mesh position={[-body.torso.width * 0.24, body.torso.y + 0.05, body.backZ + 0.03]} castShadow>
            <boxGeometry args={[0.06, body.torso.height * 0.86, 0.02]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.8} />
          </mesh>
          {/* Right suspender - back */}
          <mesh position={[body.torso.width * 0.24, body.torso.y + 0.05, body.backZ + 0.03]} castShadow>
            <boxGeometry args={[0.06, body.torso.height * 0.86, 0.02]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.8} />
          </mesh>
          {/* Connector clips */}
          <mesh position={[-body.torso.width * 0.24, body.torsoBottom + 0.1, body.frontZOuter - 0.01]} castShadow>
            <boxGeometry args={[0.08, 0.05, 0.02]} />
            <meshStandardMaterial color="#c9a227" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[body.torso.width * 0.24, body.torsoBottom + 0.1, body.frontZOuter - 0.01]} castShadow>
            <boxGeometry args={[0.08, 0.05, 0.02]} />
            <meshStandardMaterial color="#c9a227" metalness={0.6} roughness={0.3} />
          </mesh>
        </>
      )}

      {/* Necklace */}
      {hasNecklace && (
        <>
          {/* Chain around neck */}
          <mesh position={[0, body.collarY, body.frontZ - 0.04]} castShadow>
            <torusGeometry args={[0.15, 0.015, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#c9a227" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Pendant */}
          <mesh position={[0, body.torso.y + 0.17, body.frontZOuter]} castShadow>
            <boxGeometry args={[0.08, 0.1, 0.02]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Gem in pendant */}
          <mesh position={[0, body.torso.y + 0.17, body.frontZOuter + 0.02]} castShadow>
            <boxGeometry args={[0.04, 0.04, 0.02]} />
            <meshStandardMaterial color="#e91e63" metalness={0.3} roughness={0.2} />
          </mesh>
        </>
      )}

      {/* Backpack */}
      {hasBackpack && (
        <>
          {/* Main bag body */}
          <mesh position={[0, body.torso.y - 0.05, body.backZOuter - 0.1]} castShadow>
            <boxGeometry args={[body.torso.width * 0.67, body.torso.height * 0.86, 0.25]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.8} />
          </mesh>
          {/* Top flap */}
          <mesh position={[0, body.torsoTop - 0.08, body.backZOuter - 0.05]} castShadow>
            <boxGeometry args={[body.torso.width * 0.64, 0.08, 0.3]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.8} />
          </mesh>
          {/* Front pocket */}
          <mesh position={[0, body.torso.y - 0.15, body.backZOuter + 0.03]} castShadow>
            <boxGeometry args={[body.torso.width * 0.47, 0.3, 0.04]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.8} />
          </mesh>
          {/* Straps - left */}
          <mesh position={[-body.torso.width * 0.2, body.torso.y, body.torsoBack + 0.15]} castShadow>
            <boxGeometry args={[0.08, body.torso.height * 0.79, 0.04]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.8} />
          </mesh>
          {/* Straps - right */}
          <mesh position={[body.torso.width * 0.2, body.torso.y, body.torsoBack + 0.15]} castShadow>
            <boxGeometry args={[0.08, body.torso.height * 0.79, 0.04]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.8} />
          </mesh>
          {/* Buckles */}
          <mesh position={[-body.torso.width * 0.2, body.torsoBottom + 0.1, body.frontZ - 0.05]} castShadow>
            <boxGeometry args={[0.06, 0.04, 0.02]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
          </mesh>
          <mesh position={[body.torso.width * 0.2, body.torsoBottom + 0.1, body.frontZ - 0.05]} castShadow>
            <boxGeometry args={[0.06, 0.04, 0.02]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
          </mesh>
        </>
      )}

      {/* Wings */}
      {hasWings && (
        <>
          {/* Left wing - main */}
          <mesh position={[-body.armX - 0.05, body.torso.y + 0.1, body.torsoBack + 0.05]} rotation={[0, 0.3, 0.2]} castShadow>
            <boxGeometry args={[body.torso.width * 0.67, body.torso.height, 0.03]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.6} transparent opacity={0.9} />
          </mesh>
          {/* Left wing - secondary feathers */}
          <mesh position={[-body.armX - 0.2, body.torso.y - 0.05, body.torsoBack + 0.02]} rotation={[0, 0.4, 0.3]} castShadow>
            <boxGeometry args={[body.torso.width * 0.47, body.torso.height * 0.71, 0.02]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.6} transparent opacity={0.85} />
          </mesh>
          {/* Right wing - main */}
          <mesh position={[body.armX + 0.05, body.torso.y + 0.1, body.torsoBack + 0.05]} rotation={[0, -0.3, -0.2]} castShadow>
            <boxGeometry args={[body.torso.width * 0.67, body.torso.height, 0.03]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.6} transparent opacity={0.9} />
          </mesh>
          {/* Right wing - secondary feathers */}
          <mesh position={[body.armX + 0.2, body.torso.y - 0.05, body.torsoBack + 0.02]} rotation={[0, -0.4, -0.3]} castShadow>
            <boxGeometry args={[body.torso.width * 0.47, body.torso.height * 0.71, 0.02]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.6} transparent opacity={0.85} />
          </mesh>
        </>
      )}

      {/* CANE - Walking stick */}
      {hasCane && (
        <group position={[body.armX - 0.25, body.armY - 0.05, body.torsoFront * 0.25]}>
          {/* Main shaft */}
          <mesh position={[0, -0.15, 0]} castShadow>
            <boxGeometry args={[0.03, 0.6, 0.03]} />
            <meshStandardMaterial color="#5c4a3a" roughness={0.6} />
          </mesh>
          {/* Curved handle at top */}
          <mesh position={[0, 0.15, -0.04]} rotation={[Math.PI / 4, 0, 0]} castShadow>
            <boxGeometry args={[0.03, 0.12, 0.03]} />
            <meshStandardMaterial color="#5c4a3a" roughness={0.6} />
          </mesh>
          {/* Rubber tip at bottom */}
          <mesh position={[0, -0.46, 0]} castShadow>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
          </mesh>
        </group>
      )}


      {/* PARROT - Pirate's companion */}
      {hasParrot && (
        <group position={[-body.armX + 0.15, body.torsoTop, 0]}>
          {/* Body */}
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.08, 0.12, 0.08]} />
            <meshStandardMaterial color="#e74c3c" roughness={0.6} />
          </mesh>
          {/* Head */}
          <mesh position={[0, 0.08, 0.02]} castShadow>
            <boxGeometry args={[0.06, 0.06, 0.06]} />
            <meshStandardMaterial color="#e74c3c" roughness={0.6} />
          </mesh>
          {/* Beak */}
          <mesh position={[0, 0.08, 0.06]} castShadow>
            <boxGeometry args={[0.03, 0.02, 0.04]} />
            <meshStandardMaterial color="#f39c12" roughness={0.7} />
          </mesh>
          {/* Tail feathers */}
          <mesh position={[0, -0.08, -0.06]} rotation={[Math.PI / 6, 0, 0]} castShadow>
            <boxGeometry args={[0.06, 0.12, 0.02]} />
            <meshStandardMaterial color="#3498db" roughness={0.6} />
          </mesh>
          {/* Wing */}
          <mesh position={[-0.05, 0, 0]} rotation={[0, 0, -Math.PI / 4]} castShadow>
            <boxGeometry args={[0.04, 0.08, 0.02]} />
            <meshStandardMaterial color="#2ecc71" roughness={0.6} />
          </mesh>
        </group>
      )}


      {/* WHEELCHAIR - Full wheelchair model */}
      {hasWheelchair && (
        <group position={[0, body.torsoBottom - 0.2, 0]}>
          {/* Seat */}
          <mesh position={[0, 0.05, 0]} castShadow>
            <boxGeometry args={[body.torso.width * 0.67, 0.08, body.torso.width * 0.67]} />
            <meshStandardMaterial color="#2c2c2c" roughness={0.7} />
          </mesh>
          {/* Backrest */}
          <mesh position={[0, 0.25, -body.torso.width * 0.27]} castShadow>
            <boxGeometry args={[body.torso.width * 0.67, 0.4, 0.05]} />
            <meshStandardMaterial color="#2c2c2c" roughness={0.7} />
          </mesh>
          {/* Left wheel */}
          <group position={[-body.torso.width * 0.37, -0.05, body.torso.width * 0.13]}>
            <mesh rotation={[0, Math.PI / 2, 0]} castShadow>
              <torusGeometry args={[0.15, 0.03, 8, 16]} />
              <meshStandardMaterial color="#3a3a3a" roughness={0.5} />
            </mesh>
            {/* Spokes */}
            <mesh rotation={[0, 0, 0]}>
              <boxGeometry args={[0.02, 0.24, 0.02]} />
              <meshStandardMaterial color="#5a5a5a" metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <boxGeometry args={[0.02, 0.24, 0.02]} />
              <meshStandardMaterial color="#5a5a5a" metalness={0.6} roughness={0.4} />
            </mesh>
          </group>
          {/* Right wheel */}
          <group position={[body.torso.width * 0.37, -0.05, body.torso.width * 0.13]}>
            <mesh rotation={[0, Math.PI / 2, 0]} castShadow>
              <torusGeometry args={[0.15, 0.03, 8, 16]} />
              <meshStandardMaterial color="#3a3a3a" roughness={0.5} />
            </mesh>
            {/* Spokes */}
            <mesh rotation={[0, 0, 0]}>
              <boxGeometry args={[0.02, 0.24, 0.02]} />
              <meshStandardMaterial color="#5a5a5a" metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <boxGeometry args={[0.02, 0.24, 0.02]} />
              <meshStandardMaterial color="#5a5a5a" metalness={0.6} roughness={0.4} />
            </mesh>
          </group>
          {/* Front caster wheels */}
          <mesh position={[-body.torso.width * 0.27, -0.15, body.torso.width * 0.47]} rotation={[0, Math.PI / 2, 0]} castShadow>
            <torusGeometry args={[0.06, 0.02, 6, 12]} />
            <meshStandardMaterial color="#3a3a3a" roughness={0.5} />
          </mesh>
          <mesh position={[body.torso.width * 0.27, -0.15, body.torso.width * 0.47]} rotation={[0, Math.PI / 2, 0]} castShadow>
            <torusGeometry args={[0.06, 0.02, 6, 12]} />
            <meshStandardMaterial color="#3a3a3a" roughness={0.5} />
          </mesh>
          {/* Frame */}
          <mesh position={[0, 0.05, body.torso.width * 0.33]} castShadow>
            <boxGeometry args={[body.torso.width * 0.67, 0.03, 0.03]} />
            <meshStandardMaterial color="#4a4a4a" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      )}

      {/* Arms - articulated with upper arm, forearm, and hand */}
      {/* Left Arm */}
      <group ref={leftArmRef} position={[-body.armX, body.armY, 0]}>
        {/* Upper Arm */}
        <mesh castShadow>
          <boxGeometry args={[body.upperArm.width, body.upperArm.height, body.upperArm.depth]} />
          <meshStandardMaterial color={character.model3D.bodyColor} roughness={0.7} />
        </mesh>
        {/* Forearm group */}
        <group ref={leftForearmRef} position={[0, body.forearmY, 0]}>
          <mesh castShadow>
            <boxGeometry args={[body.forearm.width, body.forearm.height, body.forearm.depth]} />
            <meshStandardMaterial color={character.model3D.bodyColor} roughness={0.7} />
          </mesh>
          {/* Hand - skin color */}
          <mesh ref={leftHandRef} position={[0, body.handY, 0]} castShadow>
            <boxGeometry args={[body.hand.width, body.hand.height, body.hand.depth]} />
            <meshStandardMaterial color={skinColor} roughness={0.6} />
          </mesh>
        </group>
      </group>
      {/* Right Arm */}
      <group ref={rightArmRef} position={[body.armX, body.armY, 0]}>
        {/* Upper Arm */}
        <mesh castShadow>
          <boxGeometry args={[body.upperArm.width, body.upperArm.height, body.upperArm.depth]} />
          <meshStandardMaterial color={character.model3D.bodyColor} roughness={0.7} />
        </mesh>
        {/* Forearm group */}
        <group ref={rightForearmRef} position={[0, body.forearmY, 0]}>
          <mesh castShadow>
            <boxGeometry args={[body.forearm.width, body.forearm.height, body.forearm.depth]} />
            <meshStandardMaterial color={character.model3D.bodyColor} roughness={0.7} />
          </mesh>
          {/* Hand OR Hook - conditionally rendered */}
          {hasHook ? (
            <group position={[0, body.handY, 0]}>
              {/* Cuff/bracelet */}
              <mesh castShadow>
                <boxGeometry args={[0.08, 0.06, 0.08]} />
                <meshStandardMaterial color="#4a4a4a" metalness={0.7} roughness={0.3} />
              </mesh>
              {/* Hook curve */}
              <mesh position={[0, -0.08, 0]} rotation={[0, 0, Math.PI / 6]} castShadow>
                <torusGeometry args={[0.06, 0.02, 8, 16, Math.PI * 1.5]} />
                <meshStandardMaterial color="#6a6a6a" metalness={0.8} roughness={0.2} />
              </mesh>
              {/* Hook point */}
              <mesh position={[-0.04, -0.14, 0]} rotation={[0, 0, -Math.PI / 3]} castShadow>
                <boxGeometry args={[0.02, 0.08, 0.02]} />
                <meshStandardMaterial color="#6a6a6a" metalness={0.8} roughness={0.2} />
              </mesh>
            </group>
          ) : (
            <mesh ref={rightHandRef} position={[0, body.handY, 0]} castShadow>
              <boxGeometry args={[body.hand.width, body.hand.height, body.hand.depth]} />
              <meshStandardMaterial color={skinColor} roughness={0.6} />
            </mesh>
          )}
        </group>
      </group>

      {/* Head Group */}
      {(() => {
        // Head style configuration
        const headStyle = complementary?.headStyle || 'bigger';

        // Head dimensions: [width, height, depth]
        const headDimensions: Record<HeadStyle, [number, number, number]> = {
          default: [0.5, 0.55, 0.5],
          bigger: [0.6, 0.70, 0.6],
        };

        const [headW, headH, headD] = headDimensions[headStyle];

        // Calculate head group Y position - head sits on top of torso
        const headGroupY = body.torsoTop + headH / 2;
        
        // Calculate face Y offset: taller heads get more forehead space
        // Features stay at same absolute distance from bottom of head
        // Default: features centered at y=0 relative to head center
        // Taller: features shift down relative to new center
        const faceYOffset = (0.5 - headH) / 2; // Negative for taller heads
        
        // Scale factor for accessories/hair based on head size
        const headScale = headW / 0.5;
        
        return (
          <group ref={headRef} position={[0, headGroupY, 0]}>
            {/* Head */}
            <mesh castShadow>
              <boxGeometry args={[headW, headH, headD]} />
              <meshStandardMaterial color={skinColor} roughness={0.6} />
            </mesh>

        {/* Hair - Different styles */}
        {hairType === 'short' && (
          <mesh position={[0, 0.25 * headScale, 0]} castShadow>
            <boxGeometry args={[0.52 * headScale, 0.15 * headScale, 0.52 * headScale]} />
            <meshStandardMaterial color={hairColor} roughness={0.8} />
          </mesh>
        )}
        {hairType === 'medium' && (
          <>
            <mesh position={[0, 0.25 * headScale, 0]} castShadow>
              <boxGeometry args={[0.52 * headScale, 0.15 * headScale, 0.52 * headScale]} />
              <meshStandardMaterial color={hairColor} roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.20 * headScale, -0.28 * headScale]} castShadow>
              <boxGeometry args={[0.5 * headScale, 0.25 * headScale, 0.08 * headScale]} />
              <meshStandardMaterial color={hairColor} roughness={0.8} />
            </mesh>
          </>
        )}
        {hairType === 'long' && (
          <>
            <mesh position={[0, 0.25 * headScale, 0]} castShadow>
              <boxGeometry args={[0.52 * headScale, 0.15 * headScale, 0.52 * headScale]} />
              <meshStandardMaterial color={hairColor} roughness={0.8} />
            </mesh>
            <mesh position={[-0.3 * headScale, 0.05 * headScale, 0]} castShadow>
              <boxGeometry args={[0.1 * headScale, 0.5 * headScale, 0.3 * headScale]} />
              <meshStandardMaterial color={hairColor} roughness={0.8} />
            </mesh>
            <mesh position={[0.3 * headScale, 0.05 * headScale, 0]} castShadow>
              <boxGeometry args={[0.1 * headScale, 0.5 * headScale, 0.3 * headScale]} />
              <meshStandardMaterial color={hairColor} roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.05 * headScale, -0.3 * headScale]} castShadow>
              <boxGeometry args={[0.5 * headScale, 0.5 * headScale, 0.1 * headScale]} />
              <meshStandardMaterial color={hairColor} roughness={0.8} />
            </mesh>
          </>
        )}

        {/* Hat accessory */}
        {hasHat && (
          <>
            <mesh position={[0, 0.35 * headScale, 0]} castShadow>
              <boxGeometry args={[0.55 * headScale, 0.12 * headScale, 0.55 * headScale]} />
              <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.45 * headScale, 0]} castShadow>
              <boxGeometry args={[0.4 * headScale, 0.15 * headScale, 0.4 * headScale]} />
              <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.7} />
            </mesh>
          </>
        )}

        {/* Crown */}
        {hasCrown && (
          <>
            {/* Crown base band */}
            <mesh position={[0, 0.32 * headScale, 0]} castShadow>
              <boxGeometry args={[0.54 * headScale, 0.1 * headScale, 0.54 * headScale]} />
              <meshStandardMaterial color="#c9a227" metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Crown points */}
            <mesh position={[-0.18 * headScale, 0.45 * headScale, 0.18 * headScale]} castShadow>
              <boxGeometry args={[0.08 * headScale, 0.18 * headScale, 0.08 * headScale]} />
              <meshStandardMaterial color="#c9a227" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0.18 * headScale, 0.45 * headScale, 0.18 * headScale]} castShadow>
              <boxGeometry args={[0.08 * headScale, 0.18 * headScale, 0.08 * headScale]} />
              <meshStandardMaterial color="#c9a227" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.5 * headScale, 0.18 * headScale]} castShadow>
              <boxGeometry args={[0.08 * headScale, 0.25 * headScale, 0.08 * headScale]} />
              <meshStandardMaterial color="#c9a227" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[-0.18 * headScale, 0.45 * headScale, -0.18 * headScale]} castShadow>
              <boxGeometry args={[0.08 * headScale, 0.18 * headScale, 0.08 * headScale]} />
              <meshStandardMaterial color="#c9a227" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0.18 * headScale, 0.45 * headScale, -0.18 * headScale]} castShadow>
              <boxGeometry args={[0.08 * headScale, 0.18 * headScale, 0.08 * headScale]} />
              <meshStandardMaterial color="#c9a227" metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Jewels */}
            <mesh position={[0, 0.35 * headScale, 0.28 * headScale]} castShadow>
              <boxGeometry args={[0.06 * headScale, 0.06 * headScale, 0.02 * headScale]} />
              <meshStandardMaterial color="#e91e63" metalness={0.5} roughness={0.2} />
            </mesh>
            <mesh position={[-0.22 * headScale, 0.35 * headScale, 0.08 * headScale]} castShadow>
              <boxGeometry args={[0.02 * headScale, 0.06 * headScale, 0.06 * headScale]} />
              <meshStandardMaterial color="#2196f3" metalness={0.5} roughness={0.2} />
            </mesh>
            <mesh position={[0.22 * headScale, 0.35 * headScale, 0.08 * headScale]} castShadow>
              <boxGeometry args={[0.02 * headScale, 0.06 * headScale, 0.06 * headScale]} />
              <meshStandardMaterial color="#4caf50" metalness={0.5} roughness={0.2} />
            </mesh>
          </>
        )}

        {/* Headphones */}
        {hasHeadphones && (
          <>
            {/* Headband */}
            <mesh position={[0, 0.32 * headScale, 0]} castShadow>
              <boxGeometry args={[0.56 * headScale, 0.06 * headScale, 0.08 * headScale]} />
              <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.6} />
            </mesh>
            {/* Headband top curve */}
            <mesh position={[0, 0.35 * headScale, 0]} castShadow>
              <boxGeometry args={[0.4 * headScale, 0.04 * headScale, 0.06 * headScale]} />
              <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.6} />
            </mesh>
            {/* Left ear cup */}
            <mesh position={[-0.3 * headScale, 0.05 * headScale, 0]} castShadow>
              <boxGeometry args={[0.08 * headScale, 0.2 * headScale, 0.22 * headScale]} />
              <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.6} />
            </mesh>
            {/* Left ear cushion */}
            <mesh position={[-0.27 * headScale, 0.05 * headScale, 0]} castShadow>
              <boxGeometry args={[0.04 * headScale, 0.16 * headScale, 0.18 * headScale]} />
              <meshStandardMaterial color="#2a2a2a" roughness={0.9} />
            </mesh>
            {/* Right ear cup */}
            <mesh position={[0.3 * headScale, 0.05 * headScale, 0]} castShadow>
              <boxGeometry args={[0.08 * headScale, 0.2 * headScale, 0.22 * headScale]} />
              <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.6} />
            </mesh>
            {/* Right ear cushion */}
            <mesh position={[0.27 * headScale, 0.05 * headScale, 0]} castShadow>
              <boxGeometry args={[0.04 * headScale, 0.16 * headScale, 0.18 * headScale]} />
              <meshStandardMaterial color="#2a2a2a" roughness={0.9} />
            </mesh>
          </>
        )}

        {/* Eyes */}
        <mesh ref={leftEyeRef} position={[-0.12 * headScale, 0.05 + faceYOffset, 0.26 * headScale]}>
          <boxGeometry args={[0.08 * headScale, 0.08 * headScale, 0.01]} />
          <meshBasicMaterial color="#3a3a3a" />
        </mesh>
        <mesh ref={rightEyeRef} position={[0.12 * headScale, 0.05 + faceYOffset, 0.26 * headScale]}>
          <boxGeometry args={[0.08 * headScale, 0.08 * headScale, 0.01]} />
          <meshBasicMaterial color="#3a3a3a" />
        </mesh>

        {/* Eyebrows - Blocky style */}
        {(() => {
          const eyebrowColor = hairColor || '#3a3a3a';
          const eyebrowY = 0.14 + faceYOffset;
          const eyebrowX = 0.12 * headScale;
          const eyebrowZ = 0.26 * headScale;
          
          return (
            <>
              <mesh ref={leftEyebrowRef} position={[-eyebrowX, eyebrowY, eyebrowZ]}>
                <boxGeometry args={[0.12 * headScale, 0.03 * headScale, 0.02]} />
                <meshStandardMaterial color={eyebrowColor} roughness={0.8} />
              </mesh>
              <mesh ref={rightEyebrowRef} position={[eyebrowX, eyebrowY, eyebrowZ]}>
                <boxGeometry args={[0.12 * headScale, 0.03 * headScale, 0.02]} />
                <meshStandardMaterial color={eyebrowColor} roughness={0.8} />
              </mesh>
            </>
          );
        })()}

        {/* Glasses */}
        {hasGlasses && (
          <>
            <mesh position={[-0.12 * headScale, 0.05 + faceYOffset, 0.27 * headScale]}>
              <torusGeometry args={[0.09 * headScale, 0.015 * headScale, 8, 16]} />
              <meshStandardMaterial color="#4a4a4a" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0.12 * headScale, 0.05 + faceYOffset, 0.27 * headScale]}>
              <torusGeometry args={[0.09 * headScale, 0.015 * headScale, 8, 16]} />
              <meshStandardMaterial color="#4a4a4a" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0.05 + faceYOffset, 0.27 * headScale]}>
              <boxGeometry args={[0.06 * headScale, 0.015 * headScale, 0.015 * headScale]} />
              <meshStandardMaterial color="#4a4a4a" metalness={0.8} roughness={0.2} />
            </mesh>
          </>
        )}

        {/* BEARD - Blocky style */}
        {hasBeard && (
          <>
            {/* Main beard body */}
            <mesh position={[0, -0.22 + faceYOffset, 0.22 * headScale]} castShadow>
              <boxGeometry args={[0.35 * headScale, 0.25 * headScale, 0.15 * headScale]} />
              <meshStandardMaterial color={hairColor} roughness={0.8} />
            </mesh>
            {/* Left side extension */}
            <mesh position={[-0.15 * headScale, -0.15 + faceYOffset, 0.18 * headScale]} castShadow>
              <boxGeometry args={[0.12 * headScale, 0.18 * headScale, 0.12 * headScale]} />
              <meshStandardMaterial color={hairColor} roughness={0.8} />
            </mesh>
            {/* Right side extension */}
            <mesh position={[0.15 * headScale, -0.15 + faceYOffset, 0.18 * headScale]} castShadow>
              <boxGeometry args={[0.12 * headScale, 0.18 * headScale, 0.12 * headScale]} />
              <meshStandardMaterial color={hairColor} roughness={0.8} />
            </mesh>
            {/* Bottom point/goatee style */}
            <mesh position={[0, -0.35 + faceYOffset, 0.24 * headScale]} castShadow>
              <boxGeometry args={[0.18 * headScale, 0.08 * headScale, 0.08 * headScale]} />
              <meshStandardMaterial color={hairColor} roughness={0.8} />
            </mesh>
          </>
        )}

        {/* MOUSTACHE - Bushy blocky style */}
        {hasMoustache && (
          <>
            {/* Left side */}
            <mesh position={[-0.1 * headScale, -0.12 + faceYOffset, 0.26 * headScale]} castShadow>
              <boxGeometry args={[0.15 * headScale, 0.08 * headScale, 0.06 * headScale]} />
              <meshStandardMaterial color={hairColor} roughness={0.8} />
            </mesh>
            {/* Right side */}
            <mesh position={[0.1 * headScale, -0.12 + faceYOffset, 0.26 * headScale]} castShadow>
              <boxGeometry args={[0.15 * headScale, 0.08 * headScale, 0.06 * headScale]} />
              <meshStandardMaterial color={hairColor} roughness={0.8} />
            </mesh>
            {/* Center connector */}
            <mesh position={[0, -0.11 + faceYOffset, 0.26 * headScale]} castShadow>
              <boxGeometry args={[0.08 * headScale, 0.05 * headScale, 0.06 * headScale]} />
              <meshStandardMaterial color={hairColor} roughness={0.8} />
            </mesh>
          </>
        )}

        {/* MONOCLE - Single lens on right eye */}
        {hasMonocle && (
          <>
            {/* Lens (right eye) */}
            <mesh position={[0.12 * headScale, 0.05 + faceYOffset, 0.27 * headScale]}>
              <torusGeometry args={[0.09 * headScale, 0.015 * headScale, 8, 16]} />
              <meshStandardMaterial color="#4a4a4a" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Chain/cord going up and around */}
            <mesh position={[0.12 * headScale, 0.15 + faceYOffset, 0.20 * headScale]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.02 * headScale, 0.15 * headScale, 0.01 * headScale]} />
              <meshStandardMaterial color="#2a2a2a" roughness={0.6} />
            </mesh>
          </>
        )}

        {/* EYE PATCH - Pirate style */}
        {hasEyePatch && (
          <>
            {/* Patch (over right eye) */}
            <mesh position={[0.12 * headScale, 0.05 + faceYOffset, 0.27 * headScale]}>
              <boxGeometry args={[0.12 * headScale, 0.12 * headScale, 0.01]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
            </mesh>
            {/* Strap going around head */}
            <mesh position={[0, 0.05 + faceYOffset, 0]} rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[0.28 * headScale, 0.01 * headScale, 8, 32, Math.PI]} />
              <meshStandardMaterial color="#2a2a2a" roughness={0.7} />
            </mesh>
          </>
        )}

        {/* TOP HAT - Tall gentleman's hat */}
        {hasTopHat && (
          <>
            {/* Wide brim */}
            <mesh position={[0, 0.35 * headScale, 0]} castShadow>
              <boxGeometry args={[0.60 * headScale, 0.05 * headScale, 0.60 * headScale]} />
              <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.7} />
            </mesh>
            {/* Tall cylinder body */}
            <mesh position={[0, 0.55 * headScale, 0]} castShadow>
              <boxGeometry args={[0.45 * headScale, 0.35 * headScale, 0.45 * headScale]} />
              <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.7} />
            </mesh>
            {/* Top */}
            <mesh position={[0, 0.73 * headScale, 0]} castShadow>
              <boxGeometry args={[0.45 * headScale, 0.03 * headScale, 0.45 * headScale]} />
              <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.7} />
            </mesh>
            {/* Hat band */}
            <mesh position={[0, 0.40 * headScale, 0.24 * headScale]} castShadow>
              <boxGeometry args={[0.46 * headScale, 0.06 * headScale, 0.02 * headScale]} />
              <meshStandardMaterial color="#8b0000" roughness={0.6} />
            </mesh>
          </>
        )}

        {/* Nose */}
        <mesh ref={noseRef} position={[0, -0.05 + faceYOffset, 0.26 * headScale]}>
          <boxGeometry args={[0.08 * headScale, 0.12 * headScale, 0.08 * headScale]} />
          <meshStandardMaterial color={skinColor} roughness={0.6} />
        </mesh>

        {/* Mouth - hidden when smiling */}
        {/* Blocky mouth - scale controlled by animation loop in useFrame (mouthRef.current.scale) */}
        {complementary?.mouthState !== 'smile' && complementary?.mouthState !== 'wide_smile' && (
          <mesh ref={mouthRef} position={[0, -0.18 + faceYOffset, 0.26 * headScale]}>
            <circleGeometry args={[0.07 * headScale, 20]} />
            <meshBasicMaterial color="#2a2a2a" />
          </mesh>
        )}
        
        {/* Smile curve - regular smile */}
        {complementary?.mouthState === 'smile' && (
          <mesh ref={smileMeshRef} position={[0, -0.14 + faceYOffset, 0.27 * headScale]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.08 * headScale, 0.015 * headScale, 8, 16, Math.PI]} />
            <meshBasicMaterial color="#2a2a2a" />
          </mesh>
        )}
        
        {/* Wide smile - half circle (filled) */}
        {complementary?.mouthState === 'wide_smile' && (
          <mesh ref={smileMeshRef} position={[0, -0.14 + faceYOffset, 0.27 * headScale]} rotation={[0, 0, Math.PI]}>
            <circleGeometry args={[0.1 * headScale, 16, 0, Math.PI]} />
            <meshBasicMaterial color="#2a2a2a" />
          </mesh>
        )}

        {/* NEW: Smirk - asymmetrical smile */}
        {complementary?.mouthState === 'smirk' && (
          <mesh position={[0, -0.14 + faceYOffset, 0.27 * headScale]} rotation={[0, 0, Math.PI + 0.2]}>
            <torusGeometry args={[0.08 * headScale, 0.015 * headScale, 8, 16, Math.PI]} />
            <meshBasicMaterial color="#2a2a2a" />
          </mesh>
        )}

        {/* NEW: Slight smile - subtle */}
        {complementary?.mouthState === 'slight_smile' && (
          <mesh position={[0, -0.14 + faceYOffset, 0.27 * headScale]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.06 * headScale, 0.012 * headScale, 8, 16, Math.PI]} />
            <meshBasicMaterial color="#2a2a2a" />
          </mesh>
        )}

        {/* NEW: Pout - protruding lips */}
        {complementary?.mouthState === 'pout' && (
          <mesh position={[0, -0.16 + faceYOffset, 0.29 * headScale]}>
            <circleGeometry args={[0.07 * headScale, 20]} />
            <meshBasicMaterial color="#2a2a2a" />
          </mesh>
        )}

        {/* NEW: Grimace - wide tense mouth */}
        {complementary?.mouthState === 'grimace' && (
          <mesh position={[0, -0.18 + faceYOffset, 0.26 * headScale]}>
            <boxGeometry args={[0.16 * headScale, 0.03 * headScale, 0.01]} />
            <meshBasicMaterial color="#2a2a2a" />
          </mesh>
        )}

        {/* NEW: Tense - very thin line */}
        {complementary?.mouthState === 'tense' && (
          <mesh position={[0, -0.18 + faceYOffset, 0.26 * headScale]}>
            <boxGeometry args={[0.14 * headScale, 0.01 * headScale, 0.01]} />
            <meshBasicMaterial color="#2a2a2a" />
          </mesh>
        )}

        {/* NEW: Pursed - small tight circle */}
        {complementary?.mouthState === 'pursed' && (
          <mesh position={[0, -0.18 + faceYOffset, 0.26 * headScale]}>
            <circleGeometry args={[0.04 * headScale, 20]} />
            <meshBasicMaterial color="#2a2a2a" />
          </mesh>
        )}

        {/* NEW: Teeth showing - smile with teeth */}
        {complementary?.mouthState === 'teeth_showing' && (
          <>
            <mesh position={[0, -0.14 + faceYOffset, 0.27 * headScale]} rotation={[0, 0, Math.PI]}>
              <torusGeometry args={[0.08 * headScale, 0.015 * headScale, 8, 16, Math.PI]} />
              <meshBasicMaterial color="#2a2a2a" />
            </mesh>
            <mesh position={[0, -0.16 + faceYOffset, 0.27 * headScale]}>
              <boxGeometry args={[0.12 * headScale, 0.04 * headScale, 0.01]} />
              <meshBasicMaterial color="#f5f5f5" />
            </mesh>
          </>
        )}

        {/* NEW: Big grin - extra wide smile */}
        {complementary?.mouthState === 'big_grin' && (
          <mesh position={[0, -0.14 + faceYOffset, 0.27 * headScale]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.12 * headScale, 0.015 * headScale, 8, 16, Math.PI]} />
            <meshBasicMaterial color="#2a2a2a" />
          </mesh>
        )}

        {/* NEW: O-shape - perfect circle */}
        {complementary?.mouthState === 'o_shape' && (
          <mesh position={[0, -0.18 + faceYOffset, 0.26 * headScale]}>
            <circleGeometry args={[0.06 * headScale, 20]} />
            <meshBasicMaterial color="#2a2a2a" />
          </mesh>
        )}

        {/* Anime Face Decorations */}
        {renderFaceDecorations()}
          </group>
        );
      })()}
    </>
  );

  // Select the appropriate render function based on style
  const renderBody = () => {
    switch (modelStyle) {
      case 'blocky':
      default:
        return renderBlockyBody();
    }
  };

  return (
    <group ref={meshRef} position={position} scale={[scale * 0.5, scale * 0.5, scale * 0.5]}>
      {renderBody()}
      
      {/* Glow when active */}
      {isActive && (
        <pointLight position={[0, 0.5, 1]} intensity={1.5} color={character.color} distance={4} />
      )}
    </group>
  );
}

export function CharacterDisplay3D({ 
  characterId, 
  character: passedCharacter, 
  isActive = false, 
  animation = 'idle', 
  isTalking = false,
  complementary,
  onAnimationComplete,
  modelStyle = 'blocky',
  fov = 45,
  cameraX = 0,
  cameraY = 1,
  characterX = 0,
  characterY = 0,
  characterZ = 0
}: CharacterDisplay3DProps) {
  // Use passed character or fetch by ID
  const character = useMemo(() => {
    if (passedCharacter) return passedCharacter;
    if (characterId) return getCharacter(characterId);
    return getCharacter(); // Returns default character
  }, [characterId, passedCharacter]);
  const [responsiveScale, setResponsiveScale] = useState(1);
  const [cameraDistance, setCameraDistance] = useState(3);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Effect color with fallback
  const effectColor = complementary?.effectColor || character.color;

  // Calculate responsive scale based on screen width ( CHARACTER DISTANCE FROM CAMERA)
  // Proportional scaling - characters scale smoothly with screen width
  // Small on mobile, normal/big on tablet and desktop
  useEffect(() => {
    const updateScale = () => {
      const { width } = Dimensions.get('window');

      // Reference points for proportional scaling:
      // - 320px (min mobile) -> scale 0.4, camera 3.8 (small)
      // - 768px (tablet) -> scale 0.7, camera 2.6 (medium)
      // - 1440px (desktop) -> scale 0.85, camera 2.4 (normal)

      // Clamp width to reasonable range
      const minWidth = 280;
      const maxWidth = 1440;
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, width));

      // Calculate proportional scale
      let scale: number;
      let camera: number;

      if (clampedWidth < 768) {
        // Mobile range: 320px -> 768px maps to 0.4 -> 0.7
        const t = (clampedWidth - minWidth) / (768 - minWidth);
        scale = 0.4 + t * 0.3; // 0.4 to 0.7
        camera = 3.8 - t * 1.2; // 3.8 to 2.6
      } else {
        // Desktop range: 768px -> 1440px maps to 0.7 -> 0.85
        const t = (clampedWidth - 768) / (maxWidth - 768);
        scale = 0.7 + t * 0.15; // 0.7 to 0.85
        camera = 2.6 - t * 0.2; // 2.6 to 2.4
      }

      setResponsiveScale(scale);
      setCameraDistance(camera);
    };

    updateScale();
    const subscription = Dimensions.addEventListener('change', updateScale);
    return () => subscription?.remove();
  }, []);

  // Cleanup WebGL resources on unmount
  useEffect(() => {
    return () => {
      // React-three-fiber automatically disposes geometries and materials
    };
  }, [character.name]);

  return (
    <View style={styles.container}>
      <Canvas
        camera={{ position: [cameraX, cameraY, cameraDistance], fov }}
        gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <spotLight position={[5, 10, 5]} angle={0.3} penumbra={1} intensity={1} castShadow />
        <directionalLight position={[-5, 5, 5]} intensity={0.5} />
        {/* Top light for better character illumination */}
        <directionalLight position={[0, 10, 0]} intensity={0.8} color="#ffffff" />
        {/* Frontal light for face illumination */}
        <directionalLight position={[0, 2, 5]} intensity={1.2} color="#ffffff" />
        {/* Frontal light for body illumination */}
        <directionalLight position={[0, -2, 5]} intensity={1} color="#ffffff" />

        <Character 
          character={character} 
          isActive={isActive} 
          animation={animation} 
          isTalking={isTalking} 
          scale={responsiveScale}
          complementary={complementary}
          modelStyle={modelStyle}
          positionX={characterX}
          positionY={characterY}
          positionZ={characterZ}
          onAnimationComplete={onAnimationComplete}
        />

        {/* Visual Effects */}
        {complementary?.effect === 'confetti' && (
          <ConfettiEffect color={effectColor} speed={complementary?.speed} />
        )}
        {complementary?.effect === 'spotlight' && (
          <SpotlightEffect color={effectColor} speed={complementary?.speed} />
        )}
        {complementary?.effect === 'sparkles' && (
          <SparklesEffect color={effectColor} speed={complementary?.speed} />
        )}
        {complementary?.effect === 'hearts' && (
          <HeartsEffect color={effectColor} speed={complementary?.speed} />
        )}

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
    width: '100%',
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
});
