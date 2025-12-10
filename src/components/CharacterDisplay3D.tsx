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
  | 'stretch';

// Look direction types
export type LookDirection = 'center' | 'left' | 'right' | 'up' | 'down' | 'at_left_character' | 'at_right_character';

// Eye state types
export type EyeState = 'open' | 'closed' | 'wink_left' | 'wink_right' | 'blink';

// Eyebrow state types (anime-style)
export type EyebrowState = 
  | 'normal'
  | 'raised'           // Surprised, interested
  | 'furrowed'         // Angry, frustrated
  | 'sad'              // Drooping down at outer edges
  | 'worried'          // Inner edges raised
  | 'one_raised'       // Skeptical, questioning
  | 'wiggle';          // Playful animation

// Mouth state types
export type MouthState = 'closed' | 'open' | 'smile' | 'wide_smile' | 'surprised';

// Face state types (anime-style decorations)
export type FaceState = 
  | 'normal'
  | 'blush'            // Pink cheeks
  | 'sweat_drop'       // Nervous sweat drop
  | 'sparkle_eyes'     // Excited star eyes
  | 'heart_eyes'       // Love/admiration
  | 'spiral_eyes'      // Dizzy/confused
  | 'tears'            // Crying streams
  | 'anger_vein'       // Anime anger mark
  | 'shadow_face';     // Dark aura/disappointment

// Visual effect types
export type VisualEffect = 'none' | 'confetti' | 'spotlight' | 'sparkles' | 'hearts';

// 3D Model style types
export type ModelStyle = 'blocky' | 'chibi' | 'robot' | 'lowpoly';

// Complementary animation configuration
export interface ComplementaryAnimation {
  lookDirection?: LookDirection;
  eyeState?: EyeState;
  eyebrowState?: EyebrowState;
  mouthState?: MouthState;
  faceState?: FaceState;
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

  useFrame((_, delta) => {
    if (!particlesRef.current) return;
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < particleCount; i++) {
      // Fall down
      positions[i * 3 + 1] -= delta * 2 * speed;
      // Sway side to side
      positions[i * 3] += Math.sin(Date.now() * 0.003 * speed + i) * delta * 0.5;
      
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
  
  useFrame(() => {
    const time = Date.now() * 0.001 * speed;
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

  useFrame(() => {
    if (!particlesRef.current) return;
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const time = Date.now() * 0.002 * speed;
    
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

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, i) => {
      const data = heartPositions[i];
      child.position.y += delta * data.speed * speed;
      child.position.x = data.x + Math.sin(Date.now() * 0.002 * speed + data.phase) * 0.3;
      child.rotation.z = Math.sin(Date.now() * 0.003 * speed + data.phase) * 0.2;
      
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

// Lerp helper for smooth transitions
function lerp(current: number, target: number, factor: number): number {
  return current + (target - current) * factor;
}

// Character component with switchable 3D style
function Character({ character, isActive, animation = 'idle', isTalking = false, scale = 1, complementary, modelStyle = 'blocky', positionX = 0, positionY = 0, positionZ = 0, onAnimationComplete }: CharacterProps) {
  const meshRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const smileMeshRef = useRef<THREE.Mesh>(null);
  
  // Animation completion tracking
  const animationStartTime = useRef<number>(0);
  const animationCompleted = useRef<boolean>(false);
  const lastAnimation = useRef<AnimationState>(animation);
  
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
  const transitionSpeed = 0.03;

  // Animation system
  React.useEffect(() => {
    if (!meshRef.current || !headRef.current) return;

    let animationId: number;
    const animate = () => {
      const time = Date.now() * 0.001 * animSpeed;

      // Target values - we'll lerp towards these
      let targetMeshY = 0;
      let targetMeshRotX = 0;
      let targetHeadRotX = 0;
      let targetHeadRotY = 0;
      let targetHeadRotZ = 0;
      let targetLeftArmRotX = 0;
      let targetLeftArmRotZ = 0;
      let targetRightArmRotX = 0;
      let targetRightArmRotZ = 0;
      let targetLeftLegRotX = 0;
      let targetRightLegRotX = 0;
      let targetLeftEyeScaleY = 1;
      let targetRightEyeScaleY = 1;

      // =========================================
      // COMPLEMENTARY: Look Direction
      // =========================================
      let lookYOffset = 0;
      let lookXOffset = 0;
      
      switch (complementary?.lookDirection) {
        case 'left':
          lookYOffset = 0.5;
          break;
        case 'right':
          lookYOffset = -0.5;
          break;
        case 'up':
          lookXOffset = -0.3;
          break;
        case 'down':
          lookXOffset = 0.3;
          break;
        case 'at_left_character':
          lookYOffset = 0.7;
          lookXOffset = 0.1;
          break;
        case 'at_right_character':
          lookYOffset = -0.7;
          lookXOffset = 0.1;
          break;
      }

      // =========================================
      // COMPLEMENTARY: Eye State
      // =========================================
      switch (complementary?.eyeState) {
        case 'closed':
          targetLeftEyeScaleY = 0.1;
          targetRightEyeScaleY = 0.1;
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
          const blinkPeriod = complementary?.blinkPeriod ?? 2.5; // seconds between blinks (default 2.5)
          const blinkDuration = complementary?.blinkDuration ?? 0.2; // how long the blink takes (default 0.2)
          const timeInCycle = time % blinkPeriod;
          
          let eyeOpenness = 1.0; // fully open by default
          
          if (timeInCycle < blinkDuration) {
            // During the blink
            const blinkProgress = timeInCycle / blinkDuration; // 0 to 1
            // Use sine curve for smooth close-open: starts at 1, goes to 0 at middle, back to 1
            eyeOpenness = Math.cos(blinkProgress * Math.PI * 2); 

            // This goes: 1.0 -> 0.1 -> 1.0 smoothly
          }
          
          targetLeftEyeScaleY = eyeOpenness;
          targetRightEyeScaleY = eyeOpenness;
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
            mouthRef.current.scale.y = 1.5;
            mouthRef.current.scale.x = 1.2;
            break;
          case 'closed':
          default:
            mouthRef.current.scale.y = 0.3;
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
          break;

        case 'talking':
          // Animated head bobbing, hand gestures
          targetMeshY = Math.sin(time * 2) * 0.02;
          targetHeadRotX = Math.sin(time * 4) * 0.1 + lookXOffset;
          targetHeadRotY = lookYOffset;
          targetLeftArmRotX = Math.sin(time * 3) * 0.3 - 0.3;
          targetRightArmRotX = Math.sin(time * 3 + Math.PI) * 0.3 - 0.3;
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
          // Alternating leg kicks during jump
          targetLeftLegRotX = Math.sin(time * 4) * 0.5;
          targetRightLegRotX = Math.sin(time * 4 + Math.PI) * 0.5;
          break;

        case 'walking':
          // Walking animation - swinging arms and legs
          targetMeshY = Math.abs(Math.sin(time * 4)) * 0.05;
          targetHeadRotY = Math.sin(time * 2) * 0.05;
          targetLeftArmRotX = Math.sin(time * 4) * 0.6;
          targetRightArmRotX = Math.sin(time * 4 + Math.PI) * 0.6;
          targetLeftLegRotX = Math.sin(time * 4 + Math.PI) * 0.5;
          targetRightLegRotX = Math.sin(time * 4) * 0.5;
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
          targetMeshRotX = 0.15; // Lean back
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
          targetMeshRotX = -0.2; // Lean forward
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
          targetRightArmRotZ = 0.3 + Math.sin(time * 8) * 0.4; // Wave motion
          break;

        case 'point':
          // Pointing - emphasis/direction animation
          targetMeshY = Math.sin(time * 0.5) * 0.02;
          targetHeadRotY = 0.2;
          targetHeadRotX = Math.sin(time * 2) * 0.05;
          targetLeftArmRotX = 0;
          targetRightArmRotX = -1.5; // Arm extended forward
          targetRightArmRotZ = 0.2;
          break;

        case 'clap':
          // Clapping - celebration/applause animation
          targetMeshY = Math.abs(Math.sin(time * 3)) * 0.08;
          targetHeadRotZ = Math.sin(time * 2) * 0.1;
          // Clapping motion - arms come together
          const clapPhase = Math.sin(time * 6);
          targetLeftArmRotX = -1.5;
          targetLeftArmRotZ = clapPhase * 0.5;
          targetRightArmRotX = -1.5;
          targetRightArmRotZ = -clapPhase * 0.5;
          break;

        case 'bow':
          // Bowing - respect/gratitude animation
          const bowCycle = (Math.sin(time * 1.5) + 1) / 2; // 0 to 1
          targetMeshRotX = -bowCycle * 0.5; // Bow forward
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
          targetMeshRotX = 0.15; // Hunched forward
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
          const dozeHead = Math.sin(time * 0.3) * 0.1;
          targetHeadRotX = 0.4 + dozeHead + lookXOffset;
          targetHeadRotY = Math.sin(time * 0.5) * 0.1 + lookYOffset;
          targetMeshY = Math.sin(time * 0.3) * 0.02;
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
      }

      // Apply smooth transitions using lerp
      if (meshRef.current) {
        meshRef.current.position.y = lerp(meshRef.current.position.y, positionY + targetMeshY, transitionSpeed);
        meshRef.current.rotation.x = lerp(meshRef.current.rotation.x, targetMeshRotX, transitionSpeed);
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
      if (leftEyeRef.current) {
        leftEyeRef.current.scale.y = lerp(leftEyeRef.current.scale.y, targetLeftEyeScaleY, transitionSpeed);
      }
      if (rightEyeRef.current) {
        rightEyeRef.current.scale.y = lerp(rightEyeRef.current.scale.y, targetRightEyeScaleY, transitionSpeed);
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
  }, [isActive, animation, isTalking, animSpeed, complementary?.lookDirection, complementary?.eyeState, complementary?.mouthState, onAnimationComplete, positionY]);

  // Get customization from character config
  const customization = character.customization;
  const hasGlasses = customization.accessory === 'glasses';
  const hasTie = customization.accessory === 'tie';
  const hasHat = customization.accessory === 'hat';
  const hasScarf = customization.accessory === 'scarf';
  const hasBowtie = customization.accessory === 'bowtie';
  const hasCape = customization.accessory === 'cape';
  const hasCrown = customization.accessory === 'crown';
  const hasHeadphones = customization.accessory === 'headphones';
  const hasNecklace = customization.accessory === 'necklace';
  const hasSuspenders = customization.accessory === 'suspenders';
  const hasBackpack = customization.accessory === 'backpack';
  const hasWings = customization.accessory === 'wings';
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
        {/* Blush - Pink cheeks */}
        {faceState === 'blush' && (
          <>
            <mesh position={[-0.18 + faceOffset.x, -0.02 + faceOffset.y, 0.24 + faceOffset.z]}>
              <circleGeometry args={[0.06, 16]} />
              <meshBasicMaterial color="#ff9999" transparent opacity={0.6} />
            </mesh>
            <mesh position={[0.18 + faceOffset.x, -0.02 + faceOffset.y, 0.24 + faceOffset.z]}>
              <circleGeometry args={[0.06, 16]} />
              <meshBasicMaterial color="#ff9999" transparent opacity={0.6} />
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
  const renderBlockyBody = () => (
    <>
      {/* Legs */}
      <mesh ref={leftLegRef} position={[-0.15, -0.25, 0]} castShadow>
        <boxGeometry args={[0.25, 0.5, 0.25]} />
        <meshStandardMaterial color={character.model3D.bodyColor} roughness={0.7} />
      </mesh>
      <mesh ref={rightLegRef} position={[0.15, -0.25, 0]} castShadow>
        <boxGeometry args={[0.25, 0.5, 0.25]} />
        <meshStandardMaterial color={character.model3D.bodyColor} roughness={0.7} />
      </mesh>

      {/* Body/Torso */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[0.6, 0.7, 0.35]} />  
        <meshStandardMaterial color={character.model3D.bodyColor} roughness={0.7} />
      </mesh>

      {/* Tie */}
      {hasTie && (
        <mesh position={[0, 0.35, 0.18]} castShadow>
          <boxGeometry args={[0.15, 0.5, 0.02]} />
          <meshStandardMaterial color="#2c2c2c" roughness={0.8} />
        </mesh>
      )}

      {/* Bow Tie */}
      {hasBowtie && (
        <>
          {/* Center knot */}
          {/* X=0 (centered), Y=0.35 (above torso center), Z=0.18 (in front of body) */}
          <mesh position={[0, 0.52, 0.18]} castShadow> 
            <boxGeometry args={[0.06, 0.06, 0.02]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.7} />
          </mesh>
          {/* Left wing */}
          <mesh position={[-0.08, 0.52, 0.18]} castShadow>
            <boxGeometry args={[0.1, 0.08, 0.02]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.7} />
          </mesh>
          {/* Right wing */}
          <mesh position={[0.08, 0.52, 0.18]} castShadow>
            <boxGeometry args={[0.1, 0.08, 0.02]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.7} />
          </mesh>
        </>
      )}

      {/* Scarf */}
      {hasScarf && (
        <>
          {/* Scarf wrap around neck */}
          <mesh position={[0, 0.55, 0]} castShadow>
            <boxGeometry args={[0.65, 0.12, 0.4]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.9} />
          </mesh>
          {/* Scarf hanging piece - left side */}
          <mesh position={[-0.2, 0.2, 0.2]} castShadow>
            <boxGeometry args={[0.12, 0.5, 0.04]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.9} />
          </mesh>
          {/* Scarf hanging piece - right side */}
          <mesh position={[0.15, 0.28, 0.2]} castShadow>
            <boxGeometry args={[0.12, 0.35, 0.04]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.9} />
          </mesh>
        </>
      )}

      {/* Cape */}
      {hasCape && (
        <>
          {/* Cape collar */}
          <mesh position={[0, 0.55, -0.1]} castShadow>
            <boxGeometry args={[0.7, 0.1, 0.2]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.8} />
          </mesh>
          {/* Cape back - main body */}
          <mesh position={[0, 0.1, -0.25]} castShadow>
            <boxGeometry args={[0.75, 0.9, 0.04]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.8} />
          </mesh>
          {/* Cape inner lining (slightly visible) */}
          <mesh position={[0, 0.1, -0.22]} castShadow>
            <boxGeometry args={[0.7, 0.85, 0.01]} />
            <meshStandardMaterial color="#8b0000" roughness={0.7} />
          </mesh>
        </>
      )}

      {/* Dress (overwrites torso when clothing is 'dress') */}
      {clothingType === 'dress' && (
        <>
          {/* Dress top */}
          <mesh position={[0, 0.25, 0.01]} castShadow>
            <boxGeometry args={[0.62, 0.72, 0.36]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.7} />
          </mesh>
          {/* Dress skirt - flared */}
          <mesh position={[0, -0.2, 0]} castShadow>
            <boxGeometry args={[0.75, 0.4, 0.45]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.7} />
          </mesh>
          {/* Dress waist ribbon */}
          <mesh position={[0, 0.0, 0.19]} castShadow>
            <boxGeometry args={[0.64, 0.08, 0.02]} />
            <meshStandardMaterial color="#ffffff" roughness={0.6} />
          </mesh>
        </>
      )}

      {/* Jacket (overlay on torso when clothing is 'jacket') */}
      {clothingType === 'jacket' && (
        <>
          {/* Jacket body */}
          <mesh position={[0, 0.25, 0.01]} castShadow>
            <boxGeometry args={[0.64, 0.72, 0.37]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.7} />
          </mesh>
          {/* Jacket lapel left */}
          <mesh position={[-0.18, 0.4, 0.19]} rotation={[0, 0, 0.2]} castShadow>
            <boxGeometry args={[0.15, 0.3, 0.02]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.7} />
          </mesh>
          {/* Jacket lapel right */}
          <mesh position={[0.18, 0.4, 0.19]} rotation={[0, 0, -0.2]} castShadow>
            <boxGeometry args={[0.15, 0.3, 0.02]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.7} />
          </mesh>
          {/* Shirt visible underneath */}
          <mesh position={[0, 0.35, 0.18]} castShadow>
            <boxGeometry args={[0.12, 0.35, 0.02]} />
            <meshStandardMaterial color="#ffffff" roughness={0.6} />
          </mesh>
          {/* Jacket buttons */}
          <mesh position={[0, 0.2, 0.2]} castShadow>
            <boxGeometry args={[0.04, 0.04, 0.02]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.08, 0.2]} castShadow>
            <boxGeometry args={[0.04, 0.04, 0.02]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
          </mesh>
        </>
      )}

      {/* Hoodie */}
      {clothingType === 'hoodie' && (
        <>
          {/* Hoodie body */}
          <mesh position={[0, 0.25, 0.01]} castShadow>
            <boxGeometry args={[0.64, 0.72, 0.37]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.9} />
          </mesh>
          {/* Hoodie pocket */}
          <mesh position={[0, 0.05, 0.19]} castShadow>
            <boxGeometry args={[0.4, 0.18, 0.02]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.9} />
          </mesh>
          {/* Pocket line */}
          <mesh position={[0, 0.14, 0.2]} castShadow>
            <boxGeometry args={[0.35, 0.02, 0.01]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
          </mesh>
          {/* Hood (behind head) */}
          <mesh position={[0, 0.7, -0.15]} castShadow>
            <boxGeometry args={[0.55, 0.35, 0.2]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.9} />
          </mesh>
          {/* Drawstrings */}
          <mesh position={[-0.1, 0.45, 0.19]} castShadow>
            <boxGeometry args={[0.03, 0.2, 0.02]} />
            <meshStandardMaterial color="#ffffff" roughness={0.7} />
          </mesh>
          <mesh position={[0.1, 0.45, 0.19]} castShadow>
            <boxGeometry args={[0.03, 0.2, 0.02]} />
            <meshStandardMaterial color="#ffffff" roughness={0.7} />
          </mesh>
        </>
      )}

      {/* Vest */}
      {clothingType === 'vest' && (
        <>
          {/* Vest body (open front) */}
          <mesh position={[-0.2, 0.25, 0.18]} castShadow>
            <boxGeometry args={[0.2, 0.65, 0.04]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.7} />
          </mesh>
          <mesh position={[0.2, 0.25, 0.18]} castShadow>
            <boxGeometry args={[0.2, 0.65, 0.04]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.7} />
          </mesh>
          {/* Vest back */}
          <mesh position={[0, 0.25, -0.17]} castShadow>
            <boxGeometry args={[0.58, 0.65, 0.04]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.7} />
          </mesh>
          {/* Shirt underneath */}
          <mesh position={[0, 0.25, 0.17]} castShadow>
            <boxGeometry args={[0.18, 0.6, 0.02]} />
            <meshStandardMaterial color="#ffffff" roughness={0.6} />
          </mesh>
          {/* Vest buttons */}
          <mesh position={[-0.12, 0.35, 0.2]} castShadow>
            <boxGeometry args={[0.03, 0.03, 0.02]} />
            <meshStandardMaterial color="#c9a227" metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh position={[-0.12, 0.22, 0.2]} castShadow>
            <boxGeometry args={[0.03, 0.03, 0.02]} />
            <meshStandardMaterial color="#c9a227" metalness={0.5} roughness={0.4} />
          </mesh>
        </>
      )}

      {/* Apron */}
      {clothingType === 'apron' && (
        <>
          {/* Apron bib */}
          <mesh position={[0, 0.35, 0.18]} castShadow>
            <boxGeometry args={[0.45, 0.45, 0.02]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.9} />
          </mesh>
          {/* Apron skirt */}
          <mesh position={[0, -0.1, 0.18]} castShadow>
            <boxGeometry args={[0.55, 0.5, 0.02]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.9} />
          </mesh>
          {/* Apron pocket */}
          <mesh position={[0, 0.0, 0.2]} castShadow>
            <boxGeometry args={[0.3, 0.15, 0.02]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.9} />
          </mesh>
          {/* Neck strap */}
          <mesh position={[0, 0.6, 0.02]} castShadow>
            <boxGeometry args={[0.06, 0.08, 0.02]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.9} />
          </mesh>
          {/* Waist ties */}
          <mesh position={[-0.35, 0.12, -0.05]} castShadow>
            <boxGeometry args={[0.15, 0.06, 0.02]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.9} />
          </mesh>
          <mesh position={[0.35, 0.12, -0.05]} castShadow>
            <boxGeometry args={[0.15, 0.06, 0.02]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.9} />
          </mesh>
        </>
      )}

      {/* Lab Coat */}
      {clothingType === 'labcoat' && (
        <>
          {/* Lab coat body - long */}
          <mesh position={[0, 0.1, 0.01]} castShadow>
            <boxGeometry args={[0.68, 1.0, 0.38]} />
            <meshStandardMaterial color="#ffffff" roughness={0.6} />
          </mesh>
          {/* Coat collar left */}
          <mesh position={[-0.2, 0.52, 0.19]} rotation={[0, 0, 0.15]} castShadow>
            <boxGeometry args={[0.18, 0.2, 0.02]} />
            <meshStandardMaterial color="#ffffff" roughness={0.6} />
          </mesh>
          {/* Coat collar right */}
          <mesh position={[0.2, 0.52, 0.19]} rotation={[0, 0, -0.15]} castShadow>
            <boxGeometry args={[0.18, 0.2, 0.02]} />
            <meshStandardMaterial color="#ffffff" roughness={0.6} />
          </mesh>
          {/* Coat pockets */}
          <mesh position={[-0.2, 0.0, 0.2]} castShadow>
            <boxGeometry args={[0.2, 0.25, 0.02]} />
            <meshStandardMaterial color="#f5f5f5" roughness={0.6} />
          </mesh>
          <mesh position={[0.2, 0.0, 0.2]} castShadow>
            <boxGeometry args={[0.2, 0.25, 0.02]} />
            <meshStandardMaterial color="#f5f5f5" roughness={0.6} />
          </mesh>
          {/* Breast pocket */}
          <mesh position={[-0.18, 0.35, 0.2]} castShadow>
            <boxGeometry args={[0.12, 0.1, 0.02]} />
            <meshStandardMaterial color="#f5f5f5" roughness={0.6} />
          </mesh>
          {/* Pen in pocket */}
          <mesh position={[-0.18, 0.38, 0.22]} castShadow>
            <boxGeometry args={[0.02, 0.08, 0.02]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
          </mesh>
          {/* Buttons */}
          <mesh position={[0, 0.3, 0.2]} castShadow>
            <boxGeometry args={[0.04, 0.04, 0.02]} />
            <meshStandardMaterial color="#e0e0e0" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.15, 0.2]} castShadow>
            <boxGeometry args={[0.04, 0.04, 0.02]} />
            <meshStandardMaterial color="#e0e0e0" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.0, 0.2]} castShadow>
            <boxGeometry args={[0.04, 0.04, 0.02]} />
            <meshStandardMaterial color="#e0e0e0" roughness={0.5} />
          </mesh>
        </>
      )}

      {/* Suspenders */}
      {hasSuspenders && (
        <>
          {/* Left suspender - front */}
          <mesh position={[-0.18, 0.3, 0.18]} castShadow>
            <boxGeometry args={[0.06, 0.6, 0.02]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.8} />
          </mesh>
          {/* Right suspender - front */}
          <mesh position={[0.18, 0.3, 0.18]} castShadow>
            <boxGeometry args={[0.06, 0.6, 0.02]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.8} />
          </mesh>
          {/* Left suspender - back */}
          <mesh position={[-0.18, 0.3, -0.17]} castShadow>
            <boxGeometry args={[0.06, 0.6, 0.02]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.8} />
          </mesh>
          {/* Right suspender - back */}
          <mesh position={[0.18, 0.3, -0.17]} castShadow>
            <boxGeometry args={[0.06, 0.6, 0.02]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.8} />
          </mesh>
          {/* Connector clips */}
          <mesh position={[-0.18, 0.0, 0.19]} castShadow>
            <boxGeometry args={[0.08, 0.05, 0.02]} />
            <meshStandardMaterial color="#c9a227" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0.18, 0.0, 0.19]} castShadow>
            <boxGeometry args={[0.08, 0.05, 0.02]} />
            <meshStandardMaterial color="#c9a227" metalness={0.6} roughness={0.3} />
          </mesh>
        </>
      )}

      {/* Necklace */}
      {hasNecklace && (
        <>
          {/* Chain around neck */}
          <mesh position={[0, 0.55, 0.16]} castShadow>
            <torusGeometry args={[0.15, 0.015, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#c9a227" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Pendant */}
          <mesh position={[0, 0.42, 0.2]} castShadow>
            <boxGeometry args={[0.08, 0.1, 0.02]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Gem in pendant */}
          <mesh position={[0, 0.42, 0.22]} castShadow>
            <boxGeometry args={[0.04, 0.04, 0.02]} />
            <meshStandardMaterial color="#e91e63" metalness={0.3} roughness={0.2} />
          </mesh>
        </>
      )}

      {/* Backpack */}
      {hasBackpack && (
        <>
          {/* Main bag body */}
          <mesh position={[0, 0.2, -0.3]} castShadow>
            <boxGeometry args={[0.5, 0.6, 0.25]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.8} />
          </mesh>
          {/* Top flap */}
          <mesh position={[0, 0.52, -0.25]} castShadow>
            <boxGeometry args={[0.48, 0.08, 0.3]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.8} />
          </mesh>
          {/* Front pocket */}
          <mesh position={[0, 0.1, -0.17]} castShadow>
            <boxGeometry args={[0.35, 0.3, 0.04]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.8} />
          </mesh>
          {/* Straps - left */}
          <mesh position={[-0.15, 0.25, -0.05]} castShadow>
            <boxGeometry args={[0.08, 0.55, 0.04]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.8} />
          </mesh>
          {/* Straps - right */}
          <mesh position={[0.15, 0.25, -0.05]} castShadow>
            <boxGeometry args={[0.08, 0.55, 0.04]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.8} />
          </mesh>
          {/* Buckles */}
          <mesh position={[-0.15, 0.0, 0.15]} castShadow>
            <boxGeometry args={[0.06, 0.04, 0.02]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
          </mesh>
          <mesh position={[0.15, 0.0, 0.15]} castShadow>
            <boxGeometry args={[0.06, 0.04, 0.02]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
          </mesh>
        </>
      )}

      {/* Wings */}
      {hasWings && (
        <>
          {/* Left wing - main */}
          <mesh position={[-0.45, 0.35, -0.15]} rotation={[0, 0.3, 0.2]} castShadow>
            <boxGeometry args={[0.5, 0.7, 0.03]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.6} transparent opacity={0.9} />
          </mesh>
          {/* Left wing - secondary feathers */}
          <mesh position={[-0.6, 0.2, -0.18]} rotation={[0, 0.4, 0.3]} castShadow>
            <boxGeometry args={[0.35, 0.5, 0.02]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.6} transparent opacity={0.85} />
          </mesh>
          {/* Right wing - main */}
          <mesh position={[0.45, 0.35, -0.15]} rotation={[0, -0.3, -0.2]} castShadow>
            <boxGeometry args={[0.5, 0.7, 0.03]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.6} transparent opacity={0.9} />
          </mesh>
          {/* Right wing - secondary feathers */}
          <mesh position={[0.6, 0.2, -0.18]} rotation={[0, -0.4, -0.3]} castShadow>
            <boxGeometry args={[0.35, 0.5, 0.02]} />
            <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.6} transparent opacity={0.85} />
          </mesh>
        </>
      )}

      {/* Arms */}
      <mesh ref={leftArmRef} position={[-0.425, 0.15, 0]} castShadow>
        <boxGeometry args={[0.2, 0.6, 0.3]} />
        <meshStandardMaterial color={character.model3D.bodyColor} roughness={0.7} />
      </mesh>
      <mesh ref={rightArmRef} position={[0.425, 0.15, 0]} castShadow>
        <boxGeometry args={[0.2, 0.6, 0.3]} />
        <meshStandardMaterial color={character.model3D.bodyColor} roughness={0.7} />
      </mesh>

      {/* Head Group */}
      <group ref={headRef} position={[0, 0.85, 0]}>
        {/* Head */}
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color={skinColor} roughness={0.6} />
        </mesh>

        {/* Hair - Different styles */}
        {hairType === 'short' && (
          <mesh position={[0, 0.2, 0]} castShadow>
            <boxGeometry args={[0.52, 0.15, 0.52]} />
            <meshStandardMaterial color={hairColor} roughness={0.8} />
          </mesh>
        )}
        {hairType === 'medium' && (
          <>
            <mesh position={[0, 0.2, 0]} castShadow>
              <boxGeometry args={[0.52, 0.15, 0.52]} />
              <meshStandardMaterial color={hairColor} roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.15, -0.28]} castShadow>
              <boxGeometry args={[0.5, 0.25, 0.08]} />
              <meshStandardMaterial color={hairColor} roughness={0.8} />
            </mesh>
          </>
        )}
        {hairType === 'long' && (
          <>
            <mesh position={[0, 0.2, 0]} castShadow>
              <boxGeometry args={[0.52, 0.15, 0.52]} />
              <meshStandardMaterial color={hairColor} roughness={0.8} />
            </mesh>
            <mesh position={[-0.3, 0.0, 0]} castShadow>
              <boxGeometry args={[0.1, 0.5, 0.3]} />
              <meshStandardMaterial color={hairColor} roughness={0.8} />
            </mesh>
            <mesh position={[0.3, 0.0, 0]} castShadow>
              <boxGeometry args={[0.1, 0.5, 0.3]} />
              <meshStandardMaterial color={hairColor} roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.0, -0.3]} castShadow>
              <boxGeometry args={[0.5, 0.5, 0.1]} />
              <meshStandardMaterial color={hairColor} roughness={0.8} />
            </mesh>
          </>
        )}

        {/* Hat accessory */}
        {hasHat && (
          <>
            <mesh position={[0, 0.35, 0]} castShadow>
              <boxGeometry args={[0.55, 0.12, 0.55]} />
              <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.45, 0]} castShadow>
              <boxGeometry args={[0.4, 0.15, 0.4]} />
              <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.7} />
            </mesh>
          </>
        )}

        {/* Crown */}
        {hasCrown && (
          <>
            {/* Crown base band */}
            <mesh position={[0, 0.32, 0]} castShadow>
              <boxGeometry args={[0.54, 0.1, 0.54]} />
              <meshStandardMaterial color="#c9a227" metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Crown points */}
            <mesh position={[-0.18, 0.45, 0.18]} castShadow>
              <boxGeometry args={[0.08, 0.18, 0.08]} />
              <meshStandardMaterial color="#c9a227" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0.18, 0.45, 0.18]} castShadow>
              <boxGeometry args={[0.08, 0.18, 0.08]} />
              <meshStandardMaterial color="#c9a227" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.5, 0.18]} castShadow>
              <boxGeometry args={[0.08, 0.25, 0.08]} />
              <meshStandardMaterial color="#c9a227" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[-0.18, 0.45, -0.18]} castShadow>
              <boxGeometry args={[0.08, 0.18, 0.08]} />
              <meshStandardMaterial color="#c9a227" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0.18, 0.45, -0.18]} castShadow>
              <boxGeometry args={[0.08, 0.18, 0.08]} />
              <meshStandardMaterial color="#c9a227" metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Jewels */}
            <mesh position={[0, 0.35, 0.28]} castShadow>
              <boxGeometry args={[0.06, 0.06, 0.02]} />
              <meshStandardMaterial color="#e91e63" metalness={0.5} roughness={0.2} />
            </mesh>
            <mesh position={[-0.22, 0.35, 0.08]} castShadow>
              <boxGeometry args={[0.02, 0.06, 0.06]} />
              <meshStandardMaterial color="#2196f3" metalness={0.5} roughness={0.2} />
            </mesh>
            <mesh position={[0.22, 0.35, 0.08]} castShadow>
              <boxGeometry args={[0.02, 0.06, 0.06]} />
              <meshStandardMaterial color="#4caf50" metalness={0.5} roughness={0.2} />
            </mesh>
          </>
        )}

        {/* Headphones */}
        {hasHeadphones && (
          <>
            {/* Headband */}
            <mesh position={[0, 0.32, 0]} castShadow>
              <boxGeometry args={[0.56, 0.06, 0.08]} />
              <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.6} />
            </mesh>
            {/* Headband top curve */}
            <mesh position={[0, 0.35, 0]} castShadow>
              <boxGeometry args={[0.4, 0.04, 0.06]} />
              <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.6} />
            </mesh>
            {/* Left ear cup */}
            <mesh position={[-0.3, 0.05, 0]} castShadow>
              <boxGeometry args={[0.08, 0.2, 0.22]} />
              <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.6} />
            </mesh>
            {/* Left ear cushion */}
            <mesh position={[-0.27, 0.05, 0]} castShadow>
              <boxGeometry args={[0.04, 0.16, 0.18]} />
              <meshStandardMaterial color="#2a2a2a" roughness={0.9} />
            </mesh>
            {/* Right ear cup */}
            <mesh position={[0.3, 0.05, 0]} castShadow>
              <boxGeometry args={[0.08, 0.2, 0.22]} />
              <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.6} />
            </mesh>
            {/* Right ear cushion */}
            <mesh position={[0.27, 0.05, 0]} castShadow>
              <boxGeometry args={[0.04, 0.16, 0.18]} />
              <meshStandardMaterial color="#2a2a2a" roughness={0.9} />
            </mesh>
          </>
        )}

        {/* Eyes */}
        <mesh ref={leftEyeRef} position={[-0.12, 0.05, 0.26]}>
          <boxGeometry args={[0.08, 0.08, 0.01]} />
          <meshBasicMaterial color="#3a3a3a" />
        </mesh>
        <mesh ref={rightEyeRef} position={[0.12, 0.05, 0.26]}>
          <boxGeometry args={[0.08, 0.08, 0.01]} />
          <meshBasicMaterial color="#3a3a3a" />
        </mesh>

        {/* Glasses */}
        {hasGlasses && (
          <>
            <mesh position={[-0.12, 0.05, 0.27]}>
              <torusGeometry args={[0.09, 0.015, 8, 16]} />
              <meshStandardMaterial color="#4a4a4a" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0.12, 0.05, 0.27]}>
              <torusGeometry args={[0.09, 0.015, 8, 16]} />
              <meshStandardMaterial color="#4a4a4a" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0.05, 0.27]}>
              <boxGeometry args={[0.06, 0.015, 0.015]} />
              <meshStandardMaterial color="#4a4a4a" metalness={0.8} roughness={0.2} />
            </mesh>
          </>
        )}

        {/* Nose */}
        <mesh position={[0, -0.05, 0.26]}>
          <boxGeometry args={[0.08, 0.12, 0.08]} />
          <meshStandardMaterial color={skinColor} roughness={0.6} />
        </mesh>

        {/* Mouth - hidden when smiling */}
        {complementary?.mouthState !== 'smile' && complementary?.mouthState !== 'wide_smile' && (
          <mesh ref={mouthRef} position={[0, -0.18, 0.26]} scale={[1.5, 0.3, 1]}>
            <circleGeometry args={[0.08, 16]} />
            <meshBasicMaterial color="#2a2a2a" />
          </mesh>
        )}
        
        {/* Smile curve - regular smile */}
        {complementary?.mouthState === 'smile' && (
          <mesh ref={smileMeshRef} position={[0, -0.16, 0.27]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.08, 0.015, 8, 16, Math.PI]} />
            <meshBasicMaterial color="#2a2a2a" />
          </mesh>
        )}
        
        {/* Wide smile - half circle (filled) */}
        {complementary?.mouthState === 'wide_smile' && (
          <mesh ref={smileMeshRef} position={[0, -0.16, 0.27]} rotation={[0, 0, Math.PI]}>
            <circleGeometry args={[0.1, 16, 0, Math.PI]} />
            <meshBasicMaterial color="#2a2a2a" />
          </mesh>
        )}

        {/* Anime Face Decorations */}
        {renderFaceDecorations()}
      </group>
    </>
  );

  // =========================================
  // CHIBI STYLE (Rounded, toy-like)
  // =========================================
  const renderChibiBody = () => (
    <>
      {/* Legs - Rounded cylinders */}
      <mesh ref={leftLegRef} position={[-0.18, -0.25, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.11, 0.5, 16]} />
        <meshStandardMaterial color={character.model3D.bodyColor} roughness={0.7} />
      </mesh>
      <mesh ref={rightLegRef} position={[0.18, -0.25, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.11, 0.5, 16]} />
        <meshStandardMaterial color={character.model3D.bodyColor} roughness={0.7} />
      </mesh>

      {/* Shoes - Rounded */}
      <mesh position={[-0.18, -0.55, 0.05]} castShadow>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
      </mesh>
      <mesh position={[0.18, -0.55, 0.05]} castShadow>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
      </mesh>

      {/* Body/Torso - Rounded cylinder */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.35, 0.7, 32]} />
        <meshStandardMaterial color={character.model3D.bodyColor} roughness={0.7} />
      </mesh>

      {/* Collar/Shirt visible at neck */}
      <mesh position={[0, 0.55, 0.15]} castShadow>
        <boxGeometry args={[0.25, 0.12, 0.08]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} />
      </mesh>

      {/* Tie */}
      {hasTie && (
        <mesh position={[0, 0.35, 0.34]} castShadow>
          <boxGeometry args={[0.08, 0.3, 0.02]} />
          <meshStandardMaterial color="#2c2c2c" roughness={0.8} />
        </mesh>
      )}

      {/* Arms - Rounded cylinders */}
      <mesh ref={leftArmRef} position={[-0.42, 0.2, 0]} rotation={[0, 0, 0.1]} castShadow>
        <cylinderGeometry args={[0.09, 0.08, 0.55, 16]} />
        <meshStandardMaterial color={character.model3D.bodyColor} roughness={0.7} />
      </mesh>
      <mesh ref={rightArmRef} position={[0.42, 0.2, 0]} rotation={[0, 0, -0.1]} castShadow>
        <cylinderGeometry args={[0.09, 0.08, 0.55, 16]} />
        <meshStandardMaterial color={character.model3D.bodyColor} roughness={0.7} />
      </mesh>

      {/* Hands - Rounded spheres */}
      <mesh position={[-0.45, -0.1, 0]} castShadow>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.4} />
      </mesh>
      <mesh position={[0.45, -0.1, 0]} castShadow>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.4} />
      </mesh>

      {/* Head Group */}
      <group ref={headRef} position={[0, 0.95, 0]}>
        {/* Head - Rounded sphere */}
        <mesh castShadow>
          <sphereGeometry args={[0.35, 32, 32]} />
          <meshStandardMaterial color={skinColor} roughness={0.4} metalness={0.1} />
        </mesh>

        {/* Ears */}
        <mesh position={[-0.35, 0, 0]} castShadow>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color={skinColor} roughness={0.4} />
        </mesh>
        <mesh position={[0.35, 0, 0]} castShadow>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color={skinColor} roughness={0.4} />
        </mesh>

        {/* Hair - Different styles (spherical caps) */}
        {hairType === 'short' && (
          <mesh position={[0, 0.2, 0]} castShadow>
            <sphereGeometry args={[0.36, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={hairColor} roughness={0.9} />
          </mesh>
        )}
        {hairType === 'medium' && (
          <>
            <mesh position={[0, 0.2, 0]} castShadow>
              <sphereGeometry args={[0.36, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color={hairColor} roughness={0.9} />
            </mesh>
            <mesh position={[0, 0, -0.25]} castShadow>
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshStandardMaterial color={hairColor} roughness={0.9} />
            </mesh>
          </>
        )}
        {hairType === 'long' && (
          <>
            <mesh position={[0, 0.2, 0]} castShadow>
              <sphereGeometry args={[0.36, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color={hairColor} roughness={0.9} />
            </mesh>
            <mesh position={[-0.28, 0, 0]} castShadow>
              <sphereGeometry args={[0.15, 16, 16]} />
              <meshStandardMaterial color={hairColor} roughness={0.9} />
            </mesh>
            <mesh position={[0.28, 0, 0]} castShadow>
              <sphereGeometry args={[0.15, 16, 16]} />
              <meshStandardMaterial color={hairColor} roughness={0.9} />
            </mesh>
            <mesh position={[0, 0, -0.28]} castShadow>
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshStandardMaterial color={hairColor} roughness={0.9} />
            </mesh>
          </>
        )}

        {/* Hat accessory */}
        {hasHat && (
          <>
            <mesh position={[0, 0.35, 0]} castShadow>
              <cylinderGeometry args={[0.3, 0.35, 0.08, 32]} />
              <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.45, 0]} castShadow>
              <cylinderGeometry args={[0.2, 0.22, 0.15, 32]} />
              <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.7} />
            </mesh>
          </>
        )}

        {/* Eyes - Spherical */}
        <mesh ref={leftEyeRef} position={[-0.12, 0.03, 0.3]}>
          <sphereGeometry args={[0.045, 16, 16]} />
          <meshBasicMaterial color="#2a2a2a" />
        </mesh>
        <mesh ref={rightEyeRef} position={[0.12, 0.03, 0.3]}>
          <sphereGeometry args={[0.045, 16, 16]} />
          <meshBasicMaterial color="#2a2a2a" />
        </mesh>

        {/* Eyebrows */}
        <mesh position={[-0.12, 0.1, 0.32]} rotation={[0, 0, -0.15]}>
          <boxGeometry args={[0.12, 0.025, 0.025]} />
          <meshStandardMaterial color={hairColor} roughness={0.9} />
        </mesh>
        <mesh position={[0.12, 0.1, 0.32]} rotation={[0, 0, 0.15]}>
          <boxGeometry args={[0.12, 0.025, 0.025]} />
          <meshStandardMaterial color={hairColor} roughness={0.9} />
        </mesh>

        {/* Glasses */}
        {hasGlasses && (
          <>
            <mesh position={[-0.12, 0.03, 0.33]}>
              <torusGeometry args={[0.1, 0.012, 16, 32]} />
              <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.3} />
            </mesh>
            <mesh position={[0.12, 0.03, 0.33]}>
              <torusGeometry args={[0.1, 0.012, 16, 32]} />
              <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.03, 0.33]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.01, 0.01, 0.06, 8]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.3} />
            </mesh>
          </>
        )}

        {/* Nose - Small sphere */}
        <mesh position={[0, -0.05, 0.34]}>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshStandardMaterial color={skinColor} roughness={0.5} />
        </mesh>

        {/* Mouth - hidden when smiling */}
        {complementary?.mouthState !== 'smile' && complementary?.mouthState !== 'wide_smile' && (
          <mesh ref={mouthRef} position={[0, -0.14, 0.32]} scale={[1.2, 0.3, 1]}>
            <circleGeometry args={[0.06, 16]} />
            <meshBasicMaterial color="#2a2a2a" />
          </mesh>
        )}

        {/* Smile curve - regular smile */}
        {complementary?.mouthState === 'smile' && (
          <mesh ref={smileMeshRef} position={[0, -0.12, 0.33]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.06, 0.012, 8, 16, Math.PI]} />
            <meshBasicMaterial color="#2a2a2a" />
          </mesh>
        )}
        
        {/* Wide smile - half circle (filled) */}
        {complementary?.mouthState === 'wide_smile' && (
          <mesh ref={smileMeshRef} position={[0, -0.12, 0.33]} rotation={[0, 0, Math.PI]}>
            <circleGeometry args={[0.08, 16, 0, Math.PI]} />
            <meshBasicMaterial color="#2a2a2a" />
          </mesh>
        )}

        {/* Anime Face Decorations */}
        {renderFaceDecorations({ x: 0, y: 0, z: 0.06 })}
      </group>
    </>
  );

  // =========================================
  // ROBOT STYLE (Metallic, mechanical)
  // =========================================
  const renderRobotBody = () => (
    <>
      {/* Legs - Mechanical pistons */}
      <mesh ref={leftLegRef} position={[-0.15, -0.2, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 0.45, 8]} />
        <meshStandardMaterial color="#555555" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh ref={rightLegRef} position={[0.15, -0.2, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 0.45, 8]} />
        <meshStandardMaterial color="#555555" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Leg joints */}
      <mesh position={[-0.15, 0, 0]} castShadow>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0.15, 0, 0]} castShadow>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Feet - Metal blocks */}
      <mesh position={[-0.15, -0.48, 0.05]} castShadow>
        <boxGeometry args={[0.18, 0.08, 0.25]} />
        <meshStandardMaterial color="#444444" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[0.15, -0.48, 0.05]} castShadow>
        <boxGeometry args={[0.18, 0.08, 0.25]} />
        <meshStandardMaterial color="#444444" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* Body - Boxy metal torso */}
      <mesh position={[0, 0.28, 0]} castShadow>
        <boxGeometry args={[0.55, 0.6, 0.35]} />
        <meshStandardMaterial color={character.model3D.bodyColor} metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Chest panel */}
      <mesh position={[0, 0.3, 0.18]} castShadow>
        <boxGeometry args={[0.35, 0.35, 0.02]} />
        <meshStandardMaterial color="#222222" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Chest light */}
      <mesh position={[0, 0.32, 0.2]}>
        <circleGeometry args={[0.08, 16]} />
        <meshBasicMaterial color={character.color} />
      </mesh>

      {/* Shoulder joints */}
      <mesh position={[-0.35, 0.45, 0]} castShadow>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0.35, 0.45, 0]} castShadow>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Arms - Mechanical */}
      <mesh ref={leftArmRef} position={[-0.42, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.07, 0.5, 8]} />
        <meshStandardMaterial color="#555555" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh ref={rightArmRef} position={[0.42, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.07, 0.5, 8]} />
        <meshStandardMaterial color="#555555" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Hands - Mechanical claws */}
      <mesh position={[-0.42, -0.08, 0]} castShadow>
        <boxGeometry args={[0.12, 0.12, 0.1]} />
        <meshStandardMaterial color="#444444" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[0.42, -0.08, 0]} castShadow>
        <boxGeometry args={[0.12, 0.12, 0.1]} />
        <meshStandardMaterial color="#444444" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* Neck */}
      <mesh position={[0, 0.65, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 0.12, 8]} />
        <meshStandardMaterial color="#555555" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Head Group */}
      <group ref={headRef} position={[0, 0.85, 0]}>
        {/* Head - Boxy robot head */}
        <mesh castShadow>
          <boxGeometry args={[0.45, 0.4, 0.4]} />
          <meshStandardMaterial color="#666666" metalness={0.85} roughness={0.25} />
        </mesh>

        {/* Visor/Face plate */}
        <mesh position={[0, 0, 0.21]} castShadow>
          <boxGeometry args={[0.38, 0.25, 0.02]} />
          <meshStandardMaterial color="#111111" metalness={0.9} roughness={0.1} />
        </mesh>

        {/* Eyes - LED lights */}
        <mesh ref={leftEyeRef} position={[-0.1, 0.02, 0.22]}>
          <circleGeometry args={[0.05, 8]} />
          <meshBasicMaterial color="#00ffff" />
        </mesh>
        <mesh ref={rightEyeRef} position={[0.1, 0.02, 0.22]}>
          <circleGeometry args={[0.05, 8]} />
          <meshBasicMaterial color="#00ffff" />
        </mesh>

        {/* Antenna */}
        <mesh position={[0, 0.28, 0]} castShadow>
          <cylinderGeometry args={[0.015, 0.015, 0.15, 6]} />
          <meshStandardMaterial color="#777777" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.38, 0]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color={character.color} />
        </mesh>

        {/* Mouth - LED bar */}
        <mesh ref={mouthRef} position={[0, -0.08, 0.22]} scale={[1, 0.3, 1]}>
          <boxGeometry args={[0.2, 0.03, 0.01]} />
          <meshBasicMaterial color="#00ff00" />
        </mesh>

        {/* Anime Face Decorations */}
        {renderFaceDecorations({ x: 0, y: 0, z: -0.02 })}
      </group>
    </>
  );

  // =========================================
  // LOWPOLY STYLE (Geometric, faceted)
  // =========================================
  const renderLowpolyBody = () => (
    <>
      {/* Legs - Octagonal prisms */}
      <mesh ref={leftLegRef} position={[-0.14, -0.22, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.12, 0.45, 6]} />
        <meshStandardMaterial color={character.model3D.bodyColor} roughness={0.8} flatShading />
      </mesh>
      <mesh ref={rightLegRef} position={[0.14, -0.22, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.12, 0.45, 6]} />
        <meshStandardMaterial color={character.model3D.bodyColor} roughness={0.8} flatShading />
      </mesh>

      {/* Feet - Pyramids */}
      <mesh position={[-0.14, -0.48, 0.05]} rotation={[Math.PI, 0, 0]} castShadow>
        <coneGeometry args={[0.12, 0.1, 4]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0.14, -0.48, 0.05]} rotation={[Math.PI, 0, 0]} castShadow>
        <coneGeometry args={[0.12, 0.1, 4]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.9} flatShading />
      </mesh>

      {/* Body - Low poly torso (hexagonal prism) */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.32, 0.65, 6]} />
        <meshStandardMaterial color={character.model3D.bodyColor} roughness={0.8} flatShading />
      </mesh>

      {/* Tie */}
      {hasTie && (
        <mesh position={[0, 0.25, 0.3]} castShadow>
          <coneGeometry args={[0.05, 0.3, 3]} />
          <meshStandardMaterial color="#2c2c2c" roughness={0.9} flatShading />
        </mesh>
      )}

      {/* Arms - Low poly cylinders */}
      <mesh ref={leftArmRef} position={[-0.38, 0.2, 0]} rotation={[0, 0, 0.15]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 0.5, 5]} />
        <meshStandardMaterial color={character.model3D.bodyColor} roughness={0.8} flatShading />
      </mesh>
      <mesh ref={rightArmRef} position={[0.38, 0.2, 0]} rotation={[0, 0, -0.15]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 0.5, 5]} />
        <meshStandardMaterial color={character.model3D.bodyColor} roughness={0.8} flatShading />
      </mesh>

      {/* Hands - Small icosahedrons */}
      <mesh position={[-0.42, -0.08, 0]} castShadow>
        <icosahedronGeometry args={[0.08, 0]} />
        <meshStandardMaterial color={skinColor} roughness={0.7} flatShading />
      </mesh>
      <mesh position={[0.42, -0.08, 0]} castShadow>
        <icosahedronGeometry args={[0.08, 0]} />
        <meshStandardMaterial color={skinColor} roughness={0.7} flatShading />
      </mesh>

      {/* Head Group */}
      <group ref={headRef} position={[0, 0.85, 0]}>
        {/* Head - Icosahedron (low poly sphere) */}
        <mesh castShadow>
          <icosahedronGeometry args={[0.3, 1]} />
          <meshStandardMaterial color={skinColor} roughness={0.6} flatShading />
        </mesh>

        {/* Hair - Pyramidal spikes */}
        {hairType !== 'none' && (
          <>
            <mesh position={[0, 0.25, 0]} castShadow>
              <coneGeometry args={[0.15, 0.2, 5]} />
              <meshStandardMaterial color={hairColor} roughness={0.9} flatShading />
            </mesh>
            <mesh position={[-0.12, 0.2, 0.05]} rotation={[0.3, 0, -0.3]} castShadow>
              <coneGeometry args={[0.08, 0.15, 4]} />
              <meshStandardMaterial color={hairColor} roughness={0.9} flatShading />
            </mesh>
            <mesh position={[0.12, 0.2, 0.05]} rotation={[0.3, 0, 0.3]} castShadow>
              <coneGeometry args={[0.08, 0.15, 4]} />
              <meshStandardMaterial color={hairColor} roughness={0.9} flatShading />
            </mesh>
          </>
        )}

        {/* Hat */}
        {hasHat && (
          <>
            <mesh position={[0, 0.3, 0]} castShadow>
              <cylinderGeometry args={[0.25, 0.3, 0.08, 6]} />
              <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.8} flatShading />
            </mesh>
            <mesh position={[0, 0.4, 0]} castShadow>
              <cylinderGeometry args={[0.18, 0.2, 0.15, 6]} />
              <meshStandardMaterial color={character.model3D.accessoryColor} roughness={0.8} flatShading />
            </mesh>
          </>
        )}

        {/* Eyes - Triangular */}
        <mesh ref={leftEyeRef} position={[-0.1, 0.02, 0.26]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.04, 0.06, 3]} />
          <meshBasicMaterial color="#1a1a1a" />
        </mesh>
        <mesh ref={rightEyeRef} position={[0.1, 0.02, 0.26]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.04, 0.06, 3]} />
          <meshBasicMaterial color="#1a1a1a" />
        </mesh>

        {/* Glasses */}
        {hasGlasses && (
          <>
            <mesh position={[-0.1, 0.02, 0.28]}>
              <torusGeometry args={[0.08, 0.012, 4, 6]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.3} flatShading />
            </mesh>
            <mesh position={[0.1, 0.02, 0.28]}>
              <torusGeometry args={[0.08, 0.012, 4, 6]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.3} flatShading />
            </mesh>
            <mesh position={[0, 0.02, 0.28]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.01, 0.01, 0.05, 4]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.3} flatShading />
            </mesh>
          </>
        )}

        {/* Nose - Small pyramid */}
        <mesh position={[0, -0.03, 0.28]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <coneGeometry args={[0.04, 0.1, 4]} />
          <meshStandardMaterial color={skinColor} roughness={0.6} flatShading />
        </mesh>

        {/* Mouth - Diamond shape, hidden when smiling */}
        {complementary?.mouthState !== 'smile' && complementary?.mouthState !== 'wide_smile' && (
          <mesh ref={mouthRef} position={[0, -0.12, 0.26]} rotation={[0, 0, Math.PI / 4]} scale={[1.5, 0.3, 1]}>
            <planeGeometry args={[0.08, 0.08]} />
            <meshBasicMaterial color="#2a2a2a" />
          </mesh>
        )}

        {/* Smile curve - regular smile */}
        {complementary?.mouthState === 'smile' && (
          <mesh ref={smileMeshRef} position={[0, -0.11, 0.27]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.05, 0.01, 4, 8, Math.PI]} />
            <meshBasicMaterial color="#2a2a2a" />
          </mesh>
        )}
        
        {/* Wide smile - half circle (filled) */}
        {complementary?.mouthState === 'wide_smile' && (
          <mesh ref={smileMeshRef} position={[0, -0.11, 0.27]} rotation={[0, 0, Math.PI]}>
            <circleGeometry args={[0.07, 8, 0, Math.PI]} />
            <meshBasicMaterial color="#2a2a2a" />
          </mesh>
        )}

        {/* Anime Face Decorations */}
        {renderFaceDecorations({ x: 0, y: 0, z: 0.02 })}
      </group>
    </>
  );

  // Select the appropriate render function based on style
  const renderBody = () => {
    switch (modelStyle) {
      case 'chibi':
        return renderChibiBody();
      case 'robot':
        return renderRobotBody();
      case 'lowpoly':
        return renderLowpolyBody();
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
  useEffect(() => {
    const updateScale = () => {
      const { width } = Dimensions.get('window');

      // Mobile: < 768px, Tablet: 768-1024px, Desktop: > 1024px
      if (width < 480) {
        // Very small mobile
        setResponsiveScale(0.7);
        setCameraDistance(100.0);
      } else if (width < 768) {
        // Mobile
        setResponsiveScale(0.85);
        setCameraDistance(2.2);
      } else if (width < 1024) {
        // Tablet
        setResponsiveScale(1.0);
        setCameraDistance(2.4);
      } else {
        // Desktop
        setResponsiveScale(1.2);
        setCameraDistance(2.6);
      }
    };

    updateScale();
    const subscription = Dimensions.addEventListener('change', updateScale);
    return () => subscription?.remove();
  }, []);

  // Cleanup WebGL resources on unmount
  useEffect(() => {
    return () => {
      // React-three-fiber automatically disposes geometries and materials
      // but we ensure canvas is properly cleaned up
      console.log(`[CharacterDisplay3D] Cleanup for character ${character.name}`);
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
  },
});
