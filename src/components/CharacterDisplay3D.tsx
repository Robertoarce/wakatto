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
  | 'bow';

// Look direction types
export type LookDirection = 'center' | 'left' | 'right' | 'up' | 'down' | 'at_left_character' | 'at_right_character';

// Eye state types
export type EyeState = 'open' | 'closed' | 'wink_left' | 'wink_right' | 'blink';

// Mouth state types
export type MouthState = 'closed' | 'open' | 'smile' | 'wide_smile' | 'surprised';

// Visual effect types
export type VisualEffect = 'none' | 'confetti' | 'spotlight' | 'sparkles' | 'hearts';

// Complementary animation configuration
export interface ComplementaryAnimation {
  lookDirection?: LookDirection;
  eyeState?: EyeState;
  mouthState?: MouthState;
  effect?: VisualEffect;
  effectColor?: string;
  speed?: number; // 0.1 to 3.0, default 1.0
  transitionDuration?: number; // milliseconds to transition
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
}

// Lerp helper for smooth transitions
function lerp(current: number, target: number, factor: number): number {
  return current + (target - current) * factor;
}

// Blocky Minecraft-style character component
function Character({ character, isActive, animation = 'idle', isTalking = false, scale = 1, complementary }: CharacterProps) {
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
          const blinkPhase = Math.sin(time * 8);
          if (blinkPhase > 0.9) {
            targetLeftEyeScaleY = 0.1;
            targetRightEyeScaleY = 0.1;
          }
          break;
      }

      // =========================================
      // COMPLEMENTARY: Mouth State (when not talking)
      // =========================================
      if (!isTalking && mouthRef.current) {
        switch (complementary?.mouthState) {
          case 'open':
            mouthRef.current.scale.y = 1.2;
            mouthRef.current.scale.x = 1.0;
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
      }

      // Apply smooth transitions using lerp
      if (meshRef.current) {
        meshRef.current.position.y = lerp(meshRef.current.position.y, targetMeshY, transitionSpeed);
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

      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [isActive, animation, isTalking, animSpeed, complementary?.lookDirection, complementary?.eyeState, complementary?.mouthState]);

  // Get customization from character config
  const customization = character.customization;
  const hasGlasses = customization.accessory === 'glasses';
  const hasTie = customization.accessory === 'tie';
  const hasHat = customization.accessory === 'hat';
  const hairType = customization.hair;
  const hairColor = customization.hairColor;

  // Skin tone mapping
  const skinToneColors = {
    light: '#f4c8a8',
    medium: '#d4a574',
    tan: '#c68642',
    dark: '#8d5524',
  };
  const skinColor = skinToneColors[customization.skinTone];

  // For single character display, center at origin
  const position: [number, number, number] = [0, 0, 0];

  return (
    <group ref={meshRef} position={position} scale={[scale * 0.7, scale * 0.7, scale * 0.7]}>
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

      {/* Tie (for Jung) */}
      {hasTie && (
        <mesh position={[0, 0.25, 0.18]} castShadow>
          <boxGeometry args={[0.15, 0.5, 0.02]} />
          <meshStandardMaterial color="#2c2c2c" roughness={0.8} />
        </mesh>
      )}

      {/* Arms */}
      <mesh ref={leftArmRef} position={[-0.425, 0.15, 0]} castShadow>
        <boxGeometry args={[0.25, 0.6, 0.25]} />
        <meshStandardMaterial color={character.model3D.bodyColor} roughness={0.7} />
      </mesh>
      <mesh ref={rightArmRef} position={[0.425, 0.15, 0]} castShadow>
        <boxGeometry args={[0.25, 0.6, 0.25]} />
        <meshStandardMaterial color={character.model3D.bodyColor} roughness={0.7} />
      </mesh>

      {/* Head Group - All facial features move with head */}
      <group ref={headRef} position={[0, 0.85, 0]}>
        {/* Head */}
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color={skinColor} roughness={0.6} />
        </mesh>

        {/* Hair - Different styles based on hairType */}
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
            {/* Left side long hair */}
            <mesh position={[-0.3, 0.0, 0]} castShadow>
              <boxGeometry args={[0.1, 0.5, 0.3]} />
              <meshStandardMaterial color={hairColor} roughness={0.8} />
            </mesh>
            {/* Right side long hair */}
            <mesh position={[0.3, 0.0, 0]} castShadow>
              <boxGeometry args={[0.1, 0.5, 0.3]} />
              <meshStandardMaterial color={hairColor} roughness={0.8} />
            </mesh>
            {/* Back long hair */}
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

        {/* Eyes with refs for blink/wink animations */}
        <mesh ref={leftEyeRef} position={[-0.12, 0.05, 0.26]}>
          <boxGeometry args={[0.08, 0.08, 0.01]} />
          <meshBasicMaterial color="#3a3a3a" />
        </mesh>
        <mesh ref={rightEyeRef} position={[0.12, 0.05, 0.26]}>
          <boxGeometry args={[0.08, 0.08, 0.01]} />
          <meshBasicMaterial color="#3a3a3a" />
        </mesh>

        {/* Glasses (for Freud) */}
        {hasGlasses && (
          <>
            {/* Left lens frame */}
            <mesh position={[-0.12, 0.05, 0.27]}>
              <torusGeometry args={[0.09, 0.015, 8, 16]} />
              <meshStandardMaterial color="#4a4a4a" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Right lens frame */}
            <mesh position={[0.12, 0.05, 0.27]}>
              <torusGeometry args={[0.09, 0.015, 8, 16]} />
              <meshStandardMaterial color="#4a4a4a" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Bridge */}
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

        {/* Mouth - always visible, controlled by complementary mouthState or isTalking */}
        <mesh ref={mouthRef} position={[0, -0.18, 0.26]} scale={[1.5, 0.3, 1]}>
          <circleGeometry args={[0.08, 16]} />
          <meshBasicMaterial color="#2a2a2a" />
        </mesh>
        
        {/* Smile curve - shown when smile mouth state is active */}
        {(complementary?.mouthState === 'smile' || complementary?.mouthState === 'wide_smile') && (
          <mesh ref={smileMeshRef} position={[0, -0.16, 0.27]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.08, 0.015, 8, 16, Math.PI]} />
            <meshBasicMaterial color="#2a2a2a" />
          </mesh>
        )}
      </group>

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
  onAnimationComplete
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

  // Calculate responsive scale based on screen width
  useEffect(() => {
    const updateScale = () => {
      const { width } = Dimensions.get('window');

      // Mobile: < 768px, Tablet: 768-1024px, Desktop: > 1024px
      if (width < 480) {
        // Very small mobile
        setResponsiveScale(0.7);
        setCameraDistance(2.5);
      } else if (width < 768) {
        // Mobile
        setResponsiveScale(0.85);
        setCameraDistance(2.8);
      } else if (width < 1024) {
        // Tablet
        setResponsiveScale(1.0);
        setCameraDistance(3);
      } else {
        // Desktop
        setResponsiveScale(1.2);
        setCameraDistance(3.2);
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
        camera={{ position: [0, 1.5, cameraDistance], fov: 50 }}
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

        <Character 
          character={character} 
          isActive={isActive} 
          animation={animation} 
          isTalking={isTalking} 
          scale={responsiveScale}
          complementary={complementary}
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
