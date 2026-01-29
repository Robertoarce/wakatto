import React, { useRef, useMemo, useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { getCharacter, CharacterBehavior } from '../config/characters';
import { performanceLogger, memDebug } from '../services/performanceLogger';
import { fpsMonitor } from '../services/fpsMonitor';

// Global counter to ensure only one performance monitor logs at a time
let activeMonitorCount = 0;

// Component to invalidate canvas for continuous animation rendering with frameloop="demand"
// This is much more efficient than frameloop="always" as it only renders when needed
function AnimationInvalidator({ isAnimating }: { isAnimating: boolean }) {
  const { invalidate } = useThree();

  useEffect(() => {
    if (!isAnimating) return;

    let animationId: number;
    let lastTime = 0;
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;

    const tick = (time: number) => {
      if (time - lastTime >= frameInterval) {
        lastTime = time;
        invalidate();
      }
      animationId = requestAnimationFrame(tick);
    };

    animationId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isAnimating, invalidate]);

  return null;
}

// Component to monitor actual Three.js render FPS (using circular buffer for O(1) operations)
function ThreeJSPerformanceMonitor() {
  const lastTime = useRef(performance.now());
  const lastLogTime = useRef(performance.now());
  const frameCount = useRef(0);
  const monitorId = useRef(-1);
  // Use circular buffer instead of array shift (O(1) vs O(n))
  const fpsBuffer = useRef(new Float32Array(300)); // 5 seconds worth at 60fps
  const bufferIndex = useRef(0);
  const bufferCount = useRef(0);

  // Register this monitor on mount, unregister on unmount
  useEffect(() => {
    monitorId.current = activeMonitorCount++;
    return () => {
      activeMonitorCount--;
    };
  }, []);

  useFrame(() => {
    const now = performance.now();
    const delta = now - lastTime.current;
    lastTime.current = now;
    frameCount.current++;

    // Calculate instantaneous FPS and store in circular buffer
    const fps = delta > 0 ? 1000 / delta : 60;
    fpsBuffer.current[bufferIndex.current] = fps;
    bufferIndex.current = (bufferIndex.current + 1) % 300;
    if (bufferCount.current < 300) bufferCount.current++;

    // Log every 15 seconds - only from monitor 0 to avoid duplicate logs
    if (monitorId.current === 0 && now - lastLogTime.current >= 15000 && bufferCount.current > 0) {
      lastLogTime.current = now;
      let sum = 0;
      let minFps = Infinity;
      for (let i = 0; i < bufferCount.current; i++) {
        const val = fpsBuffer.current[i];
        sum += val;
        if (val < minFps) minFps = val;
      }
      const avgFps = sum / bufferCount.current;
      console.log(`[Three.js] Render FPS: ${avgFps.toFixed(1)} (min: ${minFps.toFixed(1)}, frames: ${frameCount.current})`);
    }
  });

  return null;
}

// Import from character3d modules
import {
  AnimationState,
  LookDirection,
  EyeState,
  EyebrowState,
  MouthState,
  FaceState,
  NoseState,
  CheekState,
  ForeheadState,
  JawState,
  VisualEffect,
  ModelStyle,
  HeadStyle,
  ComplementaryAnimation,
  CharacterDisplay3DProps,
} from './character3d/types';
import { useBodyConfig } from './character3d/bodyConfig';
import {
  ONE_SHOT_ANIMATIONS,
  LERP_SPEED,
  AUTO_BLINK,
  SURPRISED_BLINK,
  lerp,
  SKIN_TONE_COLORS,
  HEAD_HEIGHTS,
  HEAD_DIMENSIONS,
} from './character3d/constants';
import {
  ConfettiEffect,
  SpotlightEffect,
  SparklesEffect,
  HeartsEffect,
  // New emoji-triggered effects
  FireEffect,
  StarsEffect,
  MusicNotesEffect,
  TearsEffect,
  AngerEffect,
  SnowEffect,
  RainbowEffect,
} from './character3d/VisualEffects';
import { FaceDecorations } from './character3d/parts/FaceDecorations';
import { Clothing } from './character3d/parts/Clothing';
import { BodyAccessories } from './character3d/parts/BodyAccessories';
import { HeadAccessories } from './character3d/parts/HeadAccessories';
import { BodyAccessories2 } from './character3d/parts/BodyAccessories2';
import { HandProps } from './character3d/parts/HandProps';
import { Companions } from './character3d/parts/Companions';

// Re-export types for backward compatibility
export type { AnimationState, ComplementaryAnimation, CharacterDisplay3DProps } from './character3d/types';
export type {
  LookDirection,
  EyeState,
  EyebrowState,
  MouthState,
  FaceState,
  NoseState,
  CheekState,
  ForeheadState,
  JawState,
  VisualEffect,
  ModelStyle,
  HeadStyle,
} from './character3d/types';

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

// Character component with switchable 3D style - memoized to prevent unnecessary re-renders
const Character = React.memo(function Character({ character, isActive, animation = 'idle', isTalking = false, scale = 1, complementary, modelStyle = 'blocky', positionX = 0, positionY = 0, positionZ = 0, onAnimationComplete }: CharacterProps) {
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
  const unibrowRef = useRef<THREE.Mesh>(null);
  // NEW refs for facial features:
  const noseRef = useRef<THREE.Mesh>(null);
  const leftCheekRef = useRef<THREE.Mesh>(null);
  const rightCheekRef = useRef<THREE.Mesh>(null);

  // Animation completion tracking
  const animationStartTime = useRef<number>(0);
  const animationCompleted = useRef<boolean>(false);
  const lastAnimation = useRef<AnimationState>(animation);

  // Compute hasWheelchair early for animation loop access
  const hasWheelchairEarly = useMemo(() => {
    const customization = character.customization;
    const accessories = customization.accessories ||
      (customization.accessory && customization.accessory !== 'none' ? [customization.accessory] : []);
    return accessories.includes('wheelchair');
  }, [character.customization]);

  // Store props in refs to avoid restarting animation loop on every prop change
  const complementaryRef = useRef(complementary);
  const isTalkingRef = useRef(isTalking);
  const animSpeedRef = useRef(complementary?.speed ?? 1.0);
  const positionYRef = useRef(positionY);
  const onAnimationCompleteRef = useRef(onAnimationComplete);
  const animationRef = useRef(animation);
  const isActiveRef = useRef(isActive);
  const hasWheelchairRef = useRef(hasWheelchairEarly);

  // Track if component is mounted to prevent RAF scheduling after unmount
  const isMountedRef = useRef(true);

  // Sync refs when props change (doesn't restart animation loop)
  useEffect(() => {
    complementaryRef.current = complementary;
    isTalkingRef.current = isTalking;
    animSpeedRef.current = complementary?.speed ?? 1.0;
    positionYRef.current = positionY;
    onAnimationCompleteRef.current = onAnimationComplete;
    animationRef.current = animation;
    isActiveRef.current = isActive;
    hasWheelchairRef.current = hasWheelchairEarly;
  }, [complementary, isTalking, positionY, onAnimationComplete, animation, isActive, hasWheelchairEarly]);

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

  // Transition speed (higher = faster transitions)
  // Use faster speed for more responsive complementary animations
  const transitionSpeed = LERP_SPEED.normal;

  // Animation system with frame throttling for performance
  React.useEffect(() => {
    const charId = character?.id || 'unknown';
    if (!meshRef.current || !headRef.current) return;

    // Reset mounted flag when effect runs
    isMountedRef.current = true;
    performanceLogger.registerAnimationLoop();
    memDebug.trackMount(`Character:${charId}`);
    // console.log(`[CHAR-DEBUG] 🎭 Animation loop STARTED for ${charId}`);

    let animationId: number;
    let lastFrameTime = 0;
    // Higher FPS for active characters, lower for inactive/background to save GPU
    const targetFPS = isActiveRef.current ? 60 : 30;
    const frameInterval = 1000 / targetFPS;

    const animate = (frameTime: number = 0) => {
      // Don't schedule if component unmounted (prevents orphaned frames)
      if (!isMountedRef.current) return;

      // Throttle animation to target FPS
      const deltaTime = frameTime - lastFrameTime;
      if (deltaTime < frameInterval) {
        animationId = requestAnimationFrame(animate);
        return;
      }
      lastFrameTime = frameTime - (deltaTime % frameInterval);

      const perfStart = performanceLogger.frameStart();
      const time = Date.now() * 0.001 * animSpeedRef.current;

      // Target values - we'll lerp towards these
      let targetMeshY = 0;
      let targetMeshRotX = 0;
      let targetMeshRotY = 0;  // Body Y rotation (for turning toward others)
      let targetHeadRotX = 0;
      let targetHeadRotY = 0;
      let targetHeadRotZ = 0;
      let targetHeadPosZ = 0; // Head moves forward when nodding to prevent chin clipping
      let targetLeftArmRotX = 0;
      let targetLeftArmRotY = 0;
      let targetLeftArmRotZ = 0;
      let targetLeftArmPosX = 0; // Shoulder left/right offset
      let targetLeftArmPosY = 0; // Shoulder up/down offset
      let targetLeftArmPosZ = 0; // Shoulder forward/backward offset
      let targetRightArmRotX = 0;
      let targetRightArmRotY = 0;
      let targetRightArmRotZ = 0;
      let targetRightArmPosX = 0; // Shoulder left/right offset
      let targetRightArmPosY = 0; // Shoulder up/down offset
      let targetRightArmPosZ = 0; // Shoulder forward/backward offset
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
      // Unibrow animation targets
      let targetUnibrowRotZ = 0;
      let targetUnibrowPosY = 0;
      // NEW: Nose targets for facial feature states
      let targetNoseScaleX = 1;
      let targetNoseScaleY = 1;
      let targetNoseRotZ = 0;
      // NEW: Head scale/position targets for jaw states
      let targetHeadScaleY = 1;
      let targetJawPosZ = 0;

      // Head style calculations for eyebrow positioning
      const headStyleVal = complementaryRef.current?.headStyle || 'bigger';
      // Use imported constant instead of creating object per frame
      const headH = HEAD_HEIGHTS[headStyleVal] || 0.70;
      const faceYOffsetAnim = (0.5 - headH) / 2;
      const eyebrowBaseY = 0.14 + faceYOffsetAnim;

      // =========================================
      // COMPLEMENTARY: Look Direction
      // =========================================
      let lookYOffset = 0;    // Head Y rotation offset
      let lookXOffset = 0;    // Head X rotation offset

      switch (complementaryRef.current?.lookDirection) {
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
        case 'away':
          // Character turned away from viewer (back facing camera)
          targetMeshRotY = 2.8; // Almost fully turned away (~160 degrees)
          lookYOffset = 0;
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

      switch (complementaryRef.current?.eyeState) {
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
            const blinkPeriod = complementaryRef.current?.blinkPeriod ?? 2.5; // seconds between blinks (default 2.5)
            const blinkDuration = complementaryRef.current?.blinkDuration ?? 0.3; // how long the blink takes (default 0.3)
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
      switch (complementaryRef.current?.eyebrowState) {
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

      // Calculate unibrow targets from averaged left/right values
      targetUnibrowPosY = (targetLeftEyebrowPosY + targetRightEyebrowPosY) / 2;
      targetUnibrowRotZ = (targetLeftEyebrowRotZ + targetRightEyebrowRotZ) / 4;

      // =========================================
      // COMPLEMENTARY: Nose State (NEW)
      // =========================================
      switch (complementaryRef.current?.noseState) {
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
      switch (complementaryRef.current?.jawState) {
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
      if (!isTalkingRef.current && mouthRef.current) {
        switch (complementaryRef.current?.mouthState) {
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
      if (mouthRef.current && isTalkingRef.current) {
        const mouthCycle = Math.sin(time * 6 * Math.PI);
        const mouthScale = 0.3 + (mouthCycle * 0.5 + 0.5) * 0.7;
        mouthRef.current.scale.y = mouthScale;
      }

      // Calculate target values based on animation state (with complementary look direction applied)
      // Use ref to avoid restarting animation loop on every idle animation change
      const currentAnimation = animationRef.current;
      switch (currentAnimation) {
        case 'idle':
          targetMeshY = Math.sin(time * 0.5) * 0.05;
          targetHeadRotY = (isActiveRef.current ? Math.sin(time * 1.5) * 0.15 : 0) + lookYOffset;
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
          // Left arm crosses over to right side
          targetLeftArmRotX = -1.8; //hand height
          targetLeftArmRotY = 0.8;
          targetLeftArmRotZ = 0.5;

          targetLeftArmPosX = 0.3; // Move toward center
          targetLeftArmPosZ = 0.4; // Move forward

          targetLeftForearmRotX = -1.6; // Bend elbow
          // Right arm crosses under to left side
          targetRightArmRotX = -0.5;
          targetRightArmRotY = -0.8; // to interior rotation
          targetRightArmRotZ = -0.6;

          targetRightArmPosX = -0.3; // Move toward center
          targetRightArmPosZ = 0.4; // Move forward (slightly less, it's under)

          targetRightForearmRotX = -1.6; // Bend elbow
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
          const clapPhase = Math.sin(time * 12);
          const clapTogether = (clapPhase) / 2; // 0 to 1, peaks when hands meet
          // Both arms raised in front
          targetLeftArmRotX = -1.2;
          targetLeftArmRotZ = 0.3 - clapTogether * 3; // Swing inward on clap
          targetLeftArmPosX = 0.14; // Move toward center
          targetLeftArmPosZ = 0.35; // Move forward
          targetLeftArmPosY = -0.07; // Move arm down
          targetLeftForearmRotX = -0.5;
          targetRightArmPosY = -0.07; // Move arm down
          targetRightArmRotX = -1.3; //shoulder pos in horizontal x
          targetRightArmRotZ = -0.3 + clapTogether * 3; // Swing inward on clap
          targetRightArmPosX = -0.14; // Move toward center
          targetRightArmPosZ = 0.35; // Move forward
          targetRightForearmRotX = -0.5;
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
          targetHeadRotX = 0.5 + lookXOffset;
          targetHeadRotY = Math.sin(time * 9) * 0.15 + 0.5 * lookYOffset; // Subtle "no" shake
          targetHeadRotZ = -0.1;
          targetHeadPosZ = 0.3; // Head moved forward
          targetRightArmRotX = -2.2; // ok hand level Upper arm raised
          targetRightArmPosZ = 0.4; // ok Shoulder moved forward toward face
          targetRightArmRotZ = -0.8; //ok
          targetRightArmPosX = -0.2;
          targetRightForearmRotX = -0.2; // Forearm bent to bring hand to face
          targetMeshY = Math.sin(time * 0.5) * 0.02; // Subtle sigh movement
          targetLeftEyeScaleY = 0.1; // Eyes closed
          targetRightEyeScaleY = 0.1;
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
          // targetMeshY = stretchPhase * 0.1;
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
          const rubCycle = (Math.sin(time * 3) + 1) / 2;
          targetMeshY = Math.sin(time * 0.5) * 0.01;
          targetHeadRotX = 0.2 + lookXOffset; // Head slightly down
          targetHeadRotY = lookYOffset;
          targetHeadPosZ = 0.15; // Head slightly forward
          // Both hands to eyes - need position offsets to reach face
          targetLeftArmRotX = -2.3;
          targetLeftArmRotZ = -0.4 + Math.sin(time * 4) * 0.15; // Rubbing motion
          targetLeftArmPosX = 0.25; // Move toward center/face
          targetLeftArmPosZ = 0.4; // Move forward to face
          targetLeftArmPosY = 0.1; // Lift slightly
          targetLeftForearmRotX = -1.3; // Bend elbow to bring hand to eye
          targetRightArmRotX = -2.3;
          targetRightArmRotZ = 0.4 + Math.sin(time * 4 + Math.PI) * 0.15; // Rubbing motion
          targetRightArmPosX = -0.25; // Move toward center/face
          targetRightArmPosZ = 0.4; // Move forward to face
          targetRightArmPosY = 0.1; // Lift slightly
          targetRightForearmRotX = -1.3; // Bend elbow to bring hand to eye
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

      // WHEELCHAIR OVERRIDE: Keep legs in seated position, no leg movement
      if (hasWheelchairRef.current) {
        // Thighs horizontal (bent at hip ~90 degrees forward)
        targetLeftLegRotX = -Math.PI / 2;  // -90 degrees (forward/horizontal)
        targetRightLegRotX = -Math.PI / 2;
        // Lower legs hanging down (bent at knee ~90 degrees)
        targetLeftLowerLegRotX = Math.PI / 2;  // 90 degrees (down)
        targetRightLowerLegRotX = Math.PI / 2;
        // Feet flat on footrest
        targetLeftFootRotX = 0;
        targetRightFootRotX = 0;
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
        // Move head forward when nodding down to prevent chin clipping into body
        // Add automatic chin adjustment to any explicit head position offset
        const chinAdjustment = Math.max(0, targetHeadRotX) * 0.45;
        headRef.current.position.z = lerp(headRef.current.position.z, targetHeadPosZ + chinAdjustment, transitionSpeed);
      }
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = lerp(leftArmRef.current.rotation.x, targetLeftArmRotX, transitionSpeed);
        leftArmRef.current.rotation.y = lerp(leftArmRef.current.rotation.y, targetLeftArmRotY, transitionSpeed);
        leftArmRef.current.rotation.z = lerp(leftArmRef.current.rotation.z, targetLeftArmRotZ, transitionSpeed);
        // Position offsets are relative to base arm position (note: left arm X is negative)
        leftArmRef.current.position.x = lerp(leftArmRef.current.position.x, -body.armX + targetLeftArmPosX, transitionSpeed);
        leftArmRef.current.position.y = lerp(leftArmRef.current.position.y, body.armY + targetLeftArmPosY, transitionSpeed);
        leftArmRef.current.position.z = lerp(leftArmRef.current.position.z, targetLeftArmPosZ, transitionSpeed);
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = lerp(rightArmRef.current.rotation.x, targetRightArmRotX, transitionSpeed);
        rightArmRef.current.rotation.y = lerp(rightArmRef.current.rotation.y, targetRightArmRotY, transitionSpeed);
        rightArmRef.current.rotation.z = lerp(rightArmRef.current.rotation.z, targetRightArmRotZ, transitionSpeed);
        // Position offsets are relative to base arm position
        rightArmRef.current.position.x = lerp(rightArmRef.current.position.x, body.armX + targetRightArmPosX, transitionSpeed);
        rightArmRef.current.position.y = lerp(rightArmRef.current.position.y, body.armY + targetRightArmPosY, transitionSpeed);
        rightArmRef.current.position.z = lerp(rightArmRef.current.position.z, targetRightArmPosZ, transitionSpeed);
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
        const isBlinking = complementaryRef.current?.eyeState === 'blink' ||
          complementaryRef.current?.eyeState === 'surprised_blink' ||
          blinkStartTime.current !== null;
        const eyeLerpSpeed = isBlinking ? LERP_SPEED.veryFast : transitionSpeed;
        leftEyeRef.current.scale.y = lerp(leftEyeRef.current.scale.y, targetLeftEyeScaleY, eyeLerpSpeed);
      }
      if (rightEyeRef.current) {
        const isBlinking = complementaryRef.current?.eyeState === 'blink' ||
          complementaryRef.current?.eyeState === 'surprised_blink' ||
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
      // Unibrow animation
      if (unibrowRef.current) {
        unibrowRef.current.rotation.z = lerp(unibrowRef.current.rotation.z, targetUnibrowRotZ, transitionSpeed);
        unibrowRef.current.position.y = lerp(unibrowRef.current.position.y, eyebrowBaseY + targetUnibrowPosY, transitionSpeed);
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
      const duration = ONE_SHOT_ANIMATIONS[currentAnimation];
      if (duration && !animationCompleted.current && onAnimationCompleteRef.current) {
        const elapsed = (Date.now() / 1000) - animationStartTime.current;
        if (elapsed >= duration) {
          animationCompleted.current = true;
          onAnimationCompleteRef.current();
        }
      }

      performanceLogger.frameEnd(perfStart, `Character:${charId}`);

      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      // Mark as unmounted first to prevent any in-flight RAF from scheduling more
      isMountedRef.current = false;
      performanceLogger.unregisterAnimationLoop();
      memDebug.trackUnmount(`Character:${charId}`);
      // console.log(`[CHAR-DEBUG] 🎭 Animation loop STOPPED for ${charId}`);
      if (animationId) {
        cancelAnimationFrame(animationId);
        memDebug.trackRAFCancel(`Character:${charId}`, animationId);
      }
    };
    // Only restart animation loop when character changes
    // All other props (animation, isActive, complementary, isTalking, etc.) are read from refs
    // This prevents loop restarts when idle animation system cycles through animations
  }, [character?.id]);

  // Get customization from character config
  const customization = character.customization;
  // Support both old format (accessory: string) and new format (accessories: array)
  const accessories = customization.accessories ||
    (customization.accessory && customization.accessory !== 'none' ? [customization.accessory] : []);

  // Head accessories
  const hasGlasses = accessories.includes('glasses');
  const hasHat = accessories.includes('hat');
  const hasCrown = accessories.includes('crown');
  const hasHeadphones = accessories.includes('headphones');
  const hasTopHat = accessories.includes('top_hat');
  const hasRangerHat = accessories.includes('ranger_hat');
  const hasBatMask = accessories.includes('bat_mask');
  const hasVaderMask = accessories.includes('vader_mask');
  const hasMonocle = accessories.includes('monocle');
  const hasSunglasses = accessories.includes('sunglasses');
  const hasGoggles = accessories.includes('goggles');
  const hasTurban = accessories.includes('turban');
  const hasBeret = accessories.includes('beret');
  const hasBandana = accessories.includes('bandana');
  const hasHelmet = accessories.includes('helmet');
  const hasTiara = accessories.includes('tiara');
  const hasHalo = accessories.includes('halo');
  const hasHorns = accessories.includes('horns');

  // Facial accessories
  const hasBeard = accessories.includes('beard');
  const hasThinBeard = accessories.includes('thin_beard');
  const hasMoustache = accessories.includes('moustache');
  const hasEyePatch = accessories.includes('eye_patch');
  const hasScar = accessories.includes('scar');
  const hasPipe = accessories.includes('pipe');
  const hasCigar = accessories.includes('cigar');

  // Body/clothing accessories
  const hasTie = accessories.includes('tie');
  const hasScarf = accessories.includes('scarf');
  const hasBowtie = accessories.includes('bowtie');
  const hasCape = accessories.includes('cape');
  const hasNecklace = accessories.includes('necklace');
  const hasSuspenders = accessories.includes('suspenders');
  const hasBackpack = accessories.includes('backpack');
  const hasWings = accessories.includes('wings');
  const hasMedal = accessories.includes('medal');
  const hasStethoscope = accessories.includes('stethoscope');
  const hasBadge = accessories.includes('badge');
  const hasDogTags = accessories.includes('dog_tags');
  const hasChain = accessories.includes('chain');
  const hasLabCoat = accessories.includes('lab_coat');
  const hasToga = accessories.includes('toga');

  // Hand/arm accessories
  const hasCane = accessories.includes('cane');
  const hasHook = accessories.includes('hook');
  const hasSword = accessories.includes('sword');
  const hasStaff = accessories.includes('staff');
  const hasWand = accessories.includes('wand');
  const hasShield = accessories.includes('shield');
  const hasBook = accessories.includes('book');
  const hasGun = accessories.includes('gun');
  const hasPapyrus = accessories.includes('papyrus');

  // Companions
  const hasParrot = accessories.includes('parrot');
  const hasLion = accessories.includes('lion');
  const hasDog = accessories.includes('dog');
  const hasCat = accessories.includes('cat');
  const hasOwl = accessories.includes('owl');
  const hasSnake = accessories.includes('snake');
  const hasFalcon = accessories.includes('falcon');
  const hasRaven = accessories.includes('raven');

  // Other accessories
  const hasPegLeg = accessories.includes('peg_leg');
  const hasWheelchair = accessories.includes('wheelchair');
  const hasPortalGun = accessories.includes('portal_gun');
  const hairType = customization.hair;
  const hairColor = customization.hairColor;
  const clothingType = customization.clothing;
  const hasUnibrow = customization.hasUnibrow === true;

  // Cape color - defaults to accessoryColor if not specified
  const capeColor = customization.capeColor || character.model3D.accessoryColor;

  // Skin tone mapping
  const skinToneColors = {
    light: '#f4c8a8',
    medium: '#d4a574',
    tan: '#c68642',
    dark: '#8d5524',
  };
  const skinColor = skinToneColors[customization.skinTone];

  // Pants color - defaults to a darker shade of bodyColor if not specified
  const pantsColor = character.model3D.pantsColor ||
    customization.pantsColor ||
    (() => {
      // Generate a default darker shade for pants based on bodyColor
      const bodyColor = character.model3D.bodyColor;
      // Convert hex to darker shade by reducing brightness
      const hex = bodyColor.replace('#', '');
      const r = Math.max(0, parseInt(hex.substring(0, 2), 16) - 40);
      const g = Math.max(0, parseInt(hex.substring(2, 4), 16) - 40);
      const b = Math.max(0, parseInt(hex.substring(4, 6), 16) - 40);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    })();

  // For single character display, center at origin with optional offsets
  const position: [number, number, number] = [positionX, positionY, positionZ];

  // =========================================
  // BLOCKY STYLE (Minecraft-like)
  // =========================================

  // Body dimensions configuration - imported from character3d/bodyConfig
  const body = useBodyConfig();

  const renderBlockyBody = () => (
    <>
      {/* Legs - articulated with upper leg, lower leg, and foot */}
      {/* Left Leg */}
      <group ref={leftLegRef} position={[-body.legX, body.legY, 0]}>
        {/* Upper Leg (pants) */}
        <mesh castShadow>
          <boxGeometry args={[body.upperLeg.width, body.upperLeg.height, body.upperLeg.depth]} />
          <meshStandardMaterial color={pantsColor} roughness={0.7} />
        </mesh>
        {/* Lower Leg group (pants) */}
        <group ref={leftLowerLegRef} position={[0, body.lowerLegY, 0]}>
          <mesh castShadow>
            <boxGeometry args={[body.lowerLeg.width, body.lowerLeg.height, body.lowerLeg.depth]} />
            <meshStandardMaterial color={pantsColor} roughness={0.7} />
          </mesh>
          {/* Foot (shoes) */}
          <mesh ref={leftFootRef} position={[0, body.footY, body.footZ]} castShadow>
            <boxGeometry args={[body.foot.width, body.foot.height, body.foot.depth]} />
            <meshStandardMaterial color={pantsColor} roughness={0.7} />
          </mesh>
        </group>
      </group>
      {/* Right Leg OR Peg Leg */}
      {hasPegLeg ? (
        <group ref={rightLegRef} position={[body.legX, body.legY, 0]}>
          {/* Stump/attachment at hip (pants) */}
          <mesh castShadow>
            <boxGeometry args={[body.upperLeg.width * 0.5, body.upperLeg.height * 0.4, body.upperLeg.depth * 0.5]} />
            <meshStandardMaterial color={pantsColor} roughness={0.7} />
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
          {/* Upper Leg (pants) */}
          <mesh castShadow>
            <boxGeometry args={[body.upperLeg.width, body.upperLeg.height, body.upperLeg.depth]} />
            <meshStandardMaterial color={pantsColor} roughness={0.7} />
          </mesh>
          {/* Lower Leg group (pants) */}
          <group ref={rightLowerLegRef} position={[0, body.lowerLegY, 0]}>
            <mesh castShadow>
              <boxGeometry args={[body.lowerLeg.width, body.lowerLeg.height, body.lowerLeg.depth]} />
              <meshStandardMaterial color={pantsColor} roughness={0.7} />
            </mesh>
            {/* Foot (shoes) */}
            <mesh ref={rightFootRef} position={[0, body.footY, body.footZ]} castShadow>
              <boxGeometry args={[body.foot.width, body.foot.height, body.foot.depth]} />
              <meshStandardMaterial color={pantsColor} roughness={0.7} />
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
            <meshStandardMaterial color={capeColor} roughness={0.8} />
          </mesh>
          {/* Cape back - main body */}
          <mesh position={[0, body.torso.y - 0.15, body.backZOuter]} castShadow>
            <boxGeometry args={[body.torso.width, body.torso.height * 1.3, 0.04]} />
            <meshStandardMaterial color={capeColor} roughness={0.8} />
          </mesh>
          {/* Cape inner lining (slightly visible) */}
          <mesh position={[0, body.torso.y - 0.15, body.backZOuter + 0.03]} castShadow>
            <boxGeometry args={[body.torso.width * 0.93, body.torso.height * 1.2, 0.01]} />
            <meshStandardMaterial color="#8b0000" roughness={0.7} />
          </mesh>
        </>
      )}

      {/* Clothing - extracted component */}
      <Clothing body={body} accessoryColor={character.model3D.accessoryColor} clothingType={clothingType} />

      {/* Body Accessories - extracted component */}
      <BodyAccessories
        body={body}
        accessoryColor={character.model3D.accessoryColor}
        hasSuspenders={hasSuspenders}
        hasNecklace={hasNecklace}
        hasBackpack={hasBackpack}
        hasWings={hasWings}
        hasCane={hasCane}
        hasParrot={hasParrot}
        hasWheelchair={hasWheelchair}
        hasLion={hasLion}
        hasLabCoat={hasLabCoat}
        hasToga={hasToga}
      />

      {/* Body Accessories 2 - medal, stethoscope, badge, dog_tags, chain */}
      <BodyAccessories2
        body={body}
        hasMedal={hasMedal}
        hasStethoscope={hasStethoscope}
        hasBadge={hasBadge}
        hasDogTags={hasDogTags}
        hasChain={hasChain}
      />

      {/* Hand Props - sword, staff, wand, shield, book, gun, portal_gun, pipe, cigar */}
      <HandProps
        body={body}
        hasSword={hasSword}
        hasStaff={hasStaff}
        hasWand={hasWand}
        hasShield={hasShield}
        hasBook={hasBook}
        hasGun={hasGun}
        hasPortalGun={hasPortalGun}
        hasPipe={hasPipe}
        hasCigar={hasCigar}
      />

      {/* Companions - dog, cat, owl, snake, falcon, raven */}
      <Companions
        body={body}
        hasDog={hasDog}
        hasCat={hasCat}
        hasOwl={hasOwl}
        hasSnake={hasSnake}
        hasFalcon={hasFalcon}
        hasRaven={hasRaven}
      />

      {/* Arms - articulated with upper arm, forearm, and hand */}
      {/* Left Arm */}
      <group ref={leftArmRef} position={[-body.armX, body.armY, 0]}>
        {/* Upper Arm */}
        <mesh castShadow>
          <boxGeometry args={[body.upperArm.width, body.upperArm.height, body.upperArm.depth]} />
          <meshStandardMaterial color={character.model3D.bodyColor} roughness={0.7} />
        </mesh>
        {/* Lab coat sleeve - follows arm */}
        {hasLabCoat && (
          <mesh position={[-0.02, -0.05, 0]} castShadow>
            <boxGeometry args={[0.18, 0.32, 0.22]} />
            <meshStandardMaterial color="#f5f5f5" roughness={0.8} />
          </mesh>
        )}
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

          {/* STAFF - wizard/monk staff (moves with left arm) */}
          {hasStaff && (
            <group position={[-0.1, body.handY + 0.1, 0.1]}>
              {/* Main shaft */}
              <mesh position={[0, 0.1, 0]} castShadow>
                <boxGeometry args={[0.04, 1.0, 0.04]} />
                <meshStandardMaterial color="#5c4a3a" roughness={0.8} />
              </mesh>
              {/* Top ornament */}
              <mesh position={[0, 0.65, 0]} castShadow>
                <sphereGeometry args={[0.06, 8, 8]} />
                <meshStandardMaterial color="#9333ea" emissive="#9333ea" emissiveIntensity={0.3} roughness={0.3} />
              </mesh>
              {/* Crystal holder */}
              <mesh position={[0, 0.55, 0]} castShadow>
                <boxGeometry args={[0.08, 0.05, 0.08]} />
                <meshStandardMaterial color="#c9a227" metalness={0.6} roughness={0.4} />
              </mesh>
              {/* Bottom cap */}
              <mesh position={[0, -0.4, 0]} castShadow>
                <boxGeometry args={[0.05, 0.03, 0.05]} />
                <meshStandardMaterial color="#3a2a1a" roughness={0.7} />
              </mesh>
            </group>
          )}

          {/* SHIELD - held on left arm (moves with left arm) */}
          {hasShield && (
            <group position={[-0.1, body.handY, 0.15]} rotation={[Math.PI / 2, 0, Math.PI / 3]}>

              {/* 1. Outer Red Ring */}
              <mesh castShadow>
                <cylinderGeometry args={[0.45, 0.45, 0.02, 32]} />
                <meshStandardMaterial color="#b11313" metalness={0.8} roughness={0.2} />
              </mesh>

              {/* 2. Middle White/Silver Ring */}
              <mesh position={[0, 0.005, 0]} castShadow>
                <cylinderGeometry args={[0.33, 0.33, 0.02, 32]} />
                <meshStandardMaterial color="#e2e2e2" metalness={0.9} roughness={0.1} />
              </mesh>

              {/* 3. Inner Red Ring */}
              <mesh position={[0, 0.01, 0]} castShadow>
                <cylinderGeometry args={[0.22, 0.22, 0.02, 32]} />
                <meshStandardMaterial color="#b11313" metalness={0.8} roughness={0.2} />
              </mesh>

              {/* 4. Center Blue Circle */}
              <mesh position={[0, 0.015, 0]} castShadow>
                <cylinderGeometry args={[0.12, 0.12, 0.02, 32]} />
                <meshStandardMaterial color="#002868" metalness={0.8} roughness={0.2} />
              </mesh>

              {/* 5. The Star (Simplified using a 5-pointed cylinder) */}
              <mesh position={[0, 0.02, 0]} rotation={[0, 0, 0]} castShadow>
                <cylinderGeometry args={[0.07, 0.07, 0.01, 5]} />
                <meshStandardMaterial color="#ffffff" metalness={1} roughness={0.1} />
              </mesh>

            </group>
          )}

        </group>
      </group>
      {/* Right Arm */}
      <group ref={rightArmRef} position={[body.armX, body.armY, 0]}>
        {/* Upper Arm */}
        <mesh castShadow>
          <boxGeometry args={[body.upperArm.width, body.upperArm.height, body.upperArm.depth]} />
          <meshStandardMaterial color={character.model3D.bodyColor} roughness={0.7} />
        </mesh>
        {/* Lab coat sleeve - follows arm */}
        {hasLabCoat && (
          <mesh position={[0.02, -0.05, 0]} castShadow>
            <boxGeometry args={[0.18, 0.32, 0.22]} />
            <meshStandardMaterial color="#f5f5f5" roughness={0.8} />
          </mesh>
        )}
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
          {/* Portal Gun - follows arm/hand */}
          {hasPortalGun && (
            <group position={[0.05, body.handY - 0.05, 0.15]} rotation={[0, -0.3, -0.3]}>
              {/* Main body */}
              <mesh castShadow>
                <boxGeometry args={[0.08, 0.06, 0.15]} />
                <meshStandardMaterial color="#a0a0a0" metalness={0.6} roughness={0.4} />
              </mesh>
              {/* Barrel */}
              <mesh position={[0, 0, 0.12]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.04, 0.05, 0.1, 8]} />
                <meshStandardMaterial color="#606060" metalness={0.7} roughness={0.3} />
              </mesh>
              {/* Portal opening - glowing green */}
              <mesh position={[0, 0, 0.18]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.035, 0.035, 0.02, 16]} />
                <meshStandardMaterial color="#22ff22" emissive="#22ff22" emissiveIntensity={0.8} />
              </mesh>
              {/* Handle */}
              <mesh position={[0, -0.06, -0.02]} castShadow>
                <boxGeometry args={[0.04, 0.08, 0.04]} />
                <meshStandardMaterial color="#5a5a5a" roughness={0.6} />
              </mesh>
              {/* Side tubes */}
              <mesh position={[0.05, 0.02, 0.05]} castShadow>
                <cylinderGeometry args={[0.01, 0.01, 0.08, 6]} />
                <meshStandardMaterial color="#22ff22" emissive="#22ff22" emissiveIntensity={0.4} transparent opacity={0.8} />
              </mesh>
              <mesh position={[-0.05, 0.02, 0.05]} castShadow>
                <cylinderGeometry args={[0.01, 0.01, 0.08, 6]} />
                <meshStandardMaterial color="#22ff22" emissive="#22ff22" emissiveIntensity={0.4} transparent opacity={0.8} />
              </mesh>
            </group>
          )}

          {/* SWORD - held in right hand (moves with right arm) */}
          {hasSword && (
            <group position={[0.1, body.handY, 0.1]}>
              {/* Handle */}
              <mesh position={[0, 0, 0]} castShadow>
                <boxGeometry args={[0.04, 0.15, 0.04]} />
                <meshStandardMaterial color="#5c4a3a" roughness={0.7} />
              </mesh>
              {/* Guard */}
              <mesh position={[0, 0.1, 0]} castShadow>
                <boxGeometry args={[0.15, 0.02, 0.03]} />
                <meshStandardMaterial color="#c9a227" metalness={0.7} roughness={0.3} />
              </mesh>
              {/* Blade */}
              <mesh position={[0, 0.4, 0]} castShadow>
                <boxGeometry args={[0.05, 0.5, 0.01]} />
                <meshStandardMaterial color="#d4d4d4" metalness={0.9} roughness={0.2} />
              </mesh>
              {/* Blade tip */}
              <mesh position={[0, 0.68, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
                <boxGeometry args={[0.035, 0.05, 0.01]} />
                <meshStandardMaterial color="#d4d4d4" metalness={0.9} roughness={0.2} />
              </mesh>
              {/* Pommel */}
              <mesh position={[0, -0.1, 0]} castShadow>
                <sphereGeometry args={[0.03, 8, 8]} />
                <meshStandardMaterial color="#c9a227" metalness={0.7} roughness={0.3} />
              </mesh>
            </group>
          )}

          {/* WAND - small magical wand in right hand (moves with right arm) */}
          {hasWand && (
            <group position={[0.05, body.handY - 0.05, 0.1]} rotation={[0.3, 0, -0.5]}>
              {/* Handle */}
              <mesh position={[0, 0, 0]} castShadow>
                <boxGeometry args={[0.025, 0.12, 0.025]} />
                <meshStandardMaterial color="#5c4a3a" roughness={0.7} />
              </mesh>
              {/* Shaft */}
              <mesh position={[0, 0.15, 0]} castShadow>
                <boxGeometry args={[0.02, 0.2, 0.02]} />
                <meshStandardMaterial color="#8B7355" roughness={0.6} />
              </mesh>
              {/* Tip glow */}
              <mesh position={[0, 0.28, 0]} castShadow>
                <sphereGeometry args={[0.02, 8, 8]} />
                <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.5} />
              </mesh>
            </group>
          )}

          {/* GUN - held in right hand (moves with right arm) */}
          {hasGun && (
            <group position={[0.05, body.handY - 0.02, 0.1]} rotation={[0, 0, -0.2]}>
              {/* Handle */}
              <mesh position={[0, 0, 0]} castShadow>
                <boxGeometry args={[0.03, 0.1, 0.025]} />
                <meshStandardMaterial color="#5c4a3a" roughness={0.7} />
              </mesh>
              {/* Barrel */}
              <mesh position={[0, 0.08, 0.04]} castShadow>
                <boxGeometry args={[0.025, 0.06, 0.12]} />
                <meshStandardMaterial color="#4a4a4a" metalness={0.8} roughness={0.3} />
              </mesh>
              {/* Trigger guard */}
              <mesh position={[0, 0.02, 0.02]} castShadow>
                <boxGeometry args={[0.02, 0.04, 0.03]} />
                <meshStandardMaterial color="#3a3a3a" metalness={0.7} roughness={0.4} />
              </mesh>
            </group>
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

            {/* New Head Accessories - sunglasses, goggles, turban, beret, bandana, helmet, tiara, halo, horns */}
            <HeadAccessories
              headScale={headScale}
              hasSunglasses={hasSunglasses}
              hasGoggles={hasGoggles}
              hasTurban={hasTurban}
              hasBeret={hasBeret}
              hasBandana={hasBandana}
              hasHelmet={hasHelmet}
              hasTiara={hasTiara}
              hasHalo={hasHalo}
              hasHorns={hasHorns}
              accessoryColor={character.model3D.accessoryColor}
            />

            {/* Eyes - hidden when special eye face states are active */}
            {complementary?.faceState !== 'spiral_eyes' &&
              complementary?.faceState !== 'sparkle_eyes' &&
              complementary?.faceState !== 'heart_eyes' && (
                <>
                  <mesh ref={leftEyeRef} position={[-0.12 * headScale, 0.05 + faceYOffset, 0.26 * headScale]}>
                    <boxGeometry args={[0.08 * headScale, 0.08 * headScale, 0.01]} />
                    <meshBasicMaterial color="#3a3a3a" />
                  </mesh>
                  <mesh ref={rightEyeRef} position={[0.12 * headScale, 0.05 + faceYOffset, 0.26 * headScale]}>
                    <boxGeometry args={[0.08 * headScale, 0.08 * headScale, 0.01]} />
                    <meshBasicMaterial color="#3a3a3a" />
                  </mesh>
                </>
              )}

            {/* Eyebrows - Blocky style (or Unibrow) */}
            {(() => {
              const eyebrowColor = hairColor || '#3a3a3a';
              const eyebrowY = 0.14 + faceYOffset;
              const eyebrowX = 0.12 * headScale;
              const eyebrowZ = 0.26 * headScale;

              if (hasUnibrow) {
                // Single connected unibrow spanning both eye positions
                const unibrowWidth = (eyebrowX * 2) + (0.12 * headScale);
                return (
                  <mesh ref={unibrowRef} position={[0, eyebrowY, eyebrowZ]}>
                    <boxGeometry args={[unibrowWidth, 0.03 * headScale, 0.02]} />
                    <meshStandardMaterial color={eyebrowColor} roughness={0.8} />
                  </mesh>
                );
              }

              // Default: Two separate eyebrows
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

            {/* THIN BEARD - Follows jawline and around mouth */}
            {hasThinBeard && (
              <>
                {/* Left jaw line */}
                <mesh position={[-0.23 * headScale, -0.18 + faceYOffset, 0.24 * headScale]} castShadow>
                  <boxGeometry args={[0.08 * headScale, 0.16 * headScale, 0.08 * headScale]} />
                  <meshStandardMaterial color={hairColor} roughness={0.8} />
                </mesh>
                {/* Right jaw line */}
                <mesh position={[0.24 * headScale, -0.18 + faceYOffset, 0.24 * headScale]} castShadow>
                  <boxGeometry args={[0.08 * headScale, 0.16 * headScale, 0.08 * headScale]} />
                  <meshStandardMaterial color={hairColor} roughness={0.8} />
                </mesh>
                {/* Chin center */}
                <mesh position={[0, -0.28 + faceYOffset, 0.24 * headScale]} castShadow>
                  <boxGeometry args={[0.22 * headScale, 0.06 * headScale, 0.06 * headScale]} />
                  <meshStandardMaterial color={hairColor} roughness={0.8} />
                </mesh>
                {/* Left down corner connecting jaw to chin */}
                <mesh position={[-0.15 * headScale, -0.25 + faceYOffset, 0.24 * headScale]} castShadow>
                  <boxGeometry args={[0.08 * headScale, 0.06 * headScale, 0.06 * headScale]} />
                  <meshStandardMaterial color={hairColor} roughness={0.8} />
                </mesh>
                {/* Right down corner connecting jaw to chin */}
                <mesh position={[0.15 * headScale, -0.25 + faceYOffset, 0.24 * headScale]} castShadow>
                  <boxGeometry args={[0.08 * headScale, 0.06 * headScale, 0.06 * headScale]} />
                  <meshStandardMaterial color={hairColor} roughness={0.8} />
                </mesh>
                {/* Thin moustache - left */}
                <mesh position={[-0.06 * headScale, -0.11 + faceYOffset, 0.24 * headScale]} castShadow>
                  <boxGeometry args={[0.08 * headScale, 0.03 * headScale, 0.03 * headScale]} />
                  <meshStandardMaterial color={hairColor} roughness={0.8} />
                </mesh>
                {/* Thin moustache - right */}
                <mesh position={[0.06 * headScale, -0.11 + faceYOffset, 0.24 * headScale]} castShadow>
                  <boxGeometry args={[0.08 * headScale, 0.03 * headScale, 0.03 * headScale]} />
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
                <mesh position={[0.12 * headScale, 0.1 + faceYOffset, 0.27 * headScale]}>
                  <boxGeometry args={[0.12 * headScale, 0.1 * headScale, 0.01]} />
                  <meshStandardMaterial color="#2a2a2a" roughness={0.9} />
                </mesh>

                {/* Patch (over right eye) - Demi-circle shape */}
                <mesh position={[0.12 * headScale, 0.06 + faceYOffset, 0.27 * headScale]} rotation={[Math.PI / 2, -Math.PI / 2, 0]}>
                  <cylinderGeometry
                    args={[0.06 * headScale, 0.06 * headScale, 0.01, 32, 1, false, 0, Math.PI]}
                  />
                  <meshStandardMaterial color="#2a2a2a" roughness={0.9} side={THREE.DoubleSide} />
                </mesh>

                {/* Flat strap across face - diagonal from patch to left side */}
                <mesh position={[-faceYOffset, 0.18 + faceYOffset, 0.27 * headScale]} rotation={[0, 0, -Math.PI / 6]}>
                  <boxGeometry args={[0.47 * headScale, 0.025 * headScale, 0.01]} />
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

            {/* RANGER HAT - Flat-topped campaign/Rough Rider style */}
            {hasRangerHat && (
              <>
                {/* Wide flat brim */}
                <mesh position={[0, 0.32 * headScale, 0]} castShadow>
                  <boxGeometry args={[0.70 * headScale, 0.04 * headScale, 0.70 * headScale]} />
                  <meshStandardMaterial color="#8B7355" roughness={0.8} />
                </mesh>
                {/* Brim front upturn */}
                <mesh position={[0, 0.35 * headScale, 0.32 * headScale]} rotation={[0.3, 0, 0]} castShadow>
                  <boxGeometry args={[0.35 * headScale, 0.04 * headScale, 0.12 * headScale]} />
                  <meshStandardMaterial color="#8B7355" roughness={0.8} />
                </mesh>
                {/* Crown base - flat top (campaign style) */}
                <mesh position={[0, 0.42 * headScale, 0]} castShadow>
                  <boxGeometry args={[0.48 * headScale, 0.16 * headScale, 0.48 * headScale]} />
                  <meshStandardMaterial color="#8B7355" roughness={0.8} />
                </mesh>
                {/* Flat top */}
                <mesh position={[0, 0.51 * headScale, 0]} castShadow>
                  <boxGeometry args={[0.44 * headScale, 0.03 * headScale, 0.44 * headScale]} />
                  <meshStandardMaterial color="#8B7355" roughness={0.8} />
                </mesh>
                {/* Four dents/pinches in crown (campaign hat style) */}
                {/* Front pinch */}
                <mesh position={[0, 0.48 * headScale, 0.20 * headScale]} castShadow>
                  <boxGeometry args={[0.08 * headScale, 0.08 * headScale, 0.08 * headScale]} />
                  <meshStandardMaterial color="#7a6548" roughness={0.8} />
                </mesh>
                {/* Back pinch */}
                <mesh position={[0, 0.48 * headScale, -0.20 * headScale]} castShadow>
                  <boxGeometry args={[0.08 * headScale, 0.08 * headScale, 0.08 * headScale]} />
                  <meshStandardMaterial color="#7a6548" roughness={0.8} />
                </mesh>
                {/* Left pinch */}
                <mesh position={[-0.20 * headScale, 0.48 * headScale, 0]} castShadow>
                  <boxGeometry args={[0.08 * headScale, 0.08 * headScale, 0.08 * headScale]} />
                  <meshStandardMaterial color="#7a6548" roughness={0.8} />
                </mesh>
                {/* Right pinch */}
                <mesh position={[0.20 * headScale, 0.48 * headScale, 0]} castShadow>
                  <boxGeometry args={[0.08 * headScale, 0.08 * headScale, 0.08 * headScale]} />
                  <meshStandardMaterial color="#7a6548" roughness={0.8} />
                </mesh>
                {/* Hat band - leather strap */}
                <mesh position={[0, 0.36 * headScale, 0.25 * headScale]} castShadow>
                  <boxGeometry args={[0.50 * headScale, 0.05 * headScale, 0.02 * headScale]} />
                  <meshStandardMaterial color="#5c4a3a" roughness={0.7} />
                </mesh>
                {/* Band around sides */}
                <mesh position={[-0.25 * headScale, 0.36 * headScale, 0]} castShadow>
                  <boxGeometry args={[0.02 * headScale, 0.05 * headScale, 0.50 * headScale]} />
                  <meshStandardMaterial color="#5c4a3a" roughness={0.7} />
                </mesh>
                <mesh position={[0.25 * headScale, 0.36 * headScale, 0]} castShadow>
                  <boxGeometry args={[0.02 * headScale, 0.05 * headScale, 0.50 * headScale]} />
                  <meshStandardMaterial color="#5c4a3a" roughness={0.7} />
                </mesh>
                {/* Cord/strap detail */}
                <mesh position={[0, 0.38 * headScale, 0.26 * headScale]} castShadow>
                  <boxGeometry args={[0.06 * headScale, 0.03 * headScale, 0.02 * headScale]} />
                  <meshStandardMaterial color="#c9a227" metalness={0.5} roughness={0.4} />
                </mesh>
              </>
            )}

            {/* BAT MASK - Batman cowl style */}
            {hasBatMask && (
              <>
                {/* Main cowl - covers top and sides of head */}
                <mesh position={[0, 0.15 * headScale, -0.02 * headScale]} castShadow>
                  <boxGeometry args={[0.52 * headScale, 0.45 * headScale, 0.50 * headScale]} />
                  <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
                </mesh>
                {/* Forehead piece - extends down */}
                <mesh position={[0, 0.08 * headScale, 0.22 * headScale]} castShadow>
                  <boxGeometry args={[0.48 * headScale, 0.25 * headScale, 0.08 * headScale]} />
                  <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
                </mesh>
                {/* Left ear - pointed bat ear */}
                <mesh position={[-0.18 * headScale, 0.45 * headScale, 0]} rotation={[0, 0, 0.2]} castShadow>
                  <boxGeometry args={[0.08 * headScale, 0.25 * headScale, 0.08 * headScale]} />
                  <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
                </mesh>
                {/* Left ear tip */}
                <mesh position={[-0.20 * headScale, 0.58 * headScale, 0]} rotation={[0, 0, 0.3]} castShadow>
                  <boxGeometry args={[0.05 * headScale, 0.12 * headScale, 0.05 * headScale]} />
                  <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
                </mesh>
                {/* Right ear - pointed bat ear */}
                <mesh position={[0.18 * headScale, 0.45 * headScale, 0]} rotation={[0, 0, -0.2]} castShadow>
                  <boxGeometry args={[0.08 * headScale, 0.25 * headScale, 0.08 * headScale]} />
                  <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
                </mesh>
                {/* Right ear tip */}
                <mesh position={[0.20 * headScale, 0.58 * headScale, 0]} rotation={[0, 0, -0.3]} castShadow>
                  <boxGeometry args={[0.05 * headScale, 0.12 * headScale, 0.05 * headScale]} />
                  <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
                </mesh>
                {/* Eye socket left - angular cut */}
                <mesh position={[-0.12 * headScale, 0.05 * headScale, 0.26 * headScale]} castShadow>
                  <boxGeometry args={[0.14 * headScale, 0.10 * headScale, 0.02 * headScale]} />
                  <meshStandardMaterial color="#2a2a2a" roughness={0.5} />
                </mesh>
                {/* Eye socket right - angular cut */}
                <mesh position={[0.12 * headScale, 0.05 * headScale, 0.26 * headScale]} castShadow>
                  <boxGeometry args={[0.14 * headScale, 0.10 * headScale, 0.02 * headScale]} />
                  <meshStandardMaterial color="#2a2a2a" roughness={0.5} />
                </mesh>
                {/* Nose bridge piece */}
                <mesh position={[0, 0.02 * headScale, 0.27 * headScale]} castShadow>
                  <boxGeometry args={[0.06 * headScale, 0.12 * headScale, 0.02 * headScale]} />
                  <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
                </mesh>
                {/* Cheek pieces - left */}
                <mesh position={[-0.22 * headScale, -0.05 * headScale, 0.18 * headScale]} castShadow>
                  <boxGeometry args={[0.08 * headScale, 0.15 * headScale, 0.15 * headScale]} />
                  <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
                </mesh>
                {/* Cheek pieces - right */}
                <mesh position={[0.22 * headScale, -0.05 * headScale, 0.18 * headScale]} castShadow>
                  <boxGeometry args={[0.08 * headScale, 0.15 * headScale, 0.15 * headScale]} />
                  <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
                </mesh>
                {/* Neck piece */}
                <mesh position={[0, -0.15 * headScale, 0]} castShadow>
                  <boxGeometry args={[0.40 * headScale, 0.10 * headScale, 0.40 * headScale]} />
                  <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
                </mesh>
              </>
            )}

            {/* VADER MASK - Improved Primitive Style */}
            {hasVaderMask && (
              <group name="VaderHelmetContainer">
                {/* --- GLOSSY HELMET SECTION --- */}

                {/* Main helmet dome - Stretched Sphere for roundness */}
                <mesh position={[0, 0.3 * headScale, -0.05 * headScale]} scale={[1, 1.2, 1.1]} castShadow>
                  {/* args: [radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength] */}
                  {/* Cut sphere in half to sit on head */}
                  <sphereGeometry args={[0.42 * headScale, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
                  <meshStandardMaterial color="#050505" metalness={0.8} roughness={0.1} envMapIntensity={1.2} />
                </mesh>

                {/* Helmet Side/Back Flange (The "hair" shape) - Approximated with angled boxes */}
                {/* Back piece */}
                <mesh position={[0, -0.1 * headScale, -0.25 * headScale]} rotation={[-0.3, 0, 0]} castShadow>
                  <boxGeometry args={[0.7 * headScale, 0.6 * headScale, 0.1 * headScale]} />
                  <meshStandardMaterial color="#050505" metalness={0.8} roughness={0.1} />
                </mesh>
                {/* Left Side Flange */}
                <mesh position={[-0.32 * headScale, -0.1 * headScale, -0.05 * headScale]} rotation={[0, 0.4, 0.2]} castShadow>
                  <boxGeometry args={[0.1 * headScale, 0.6 * headScale, 0.5 * headScale]} />
                  <meshStandardMaterial color="#050505" metalness={0.8} roughness={0.1} />
                </mesh>
                {/* Right Side Flange */}
                <mesh position={[0.32 * headScale, -0.1 * headScale, -0.05 * headScale]} rotation={[0, -0.4, -0.2]} castShadow>
                  <boxGeometry args={[0.1 * headScale, 0.6 * headScale, 0.5 * headScale]} />
                  <meshStandardMaterial color="#050505" metalness={0.8} roughness={0.1} />
                </mesh>

                {/* Forehead ridge - The connecting strip */}
                <mesh position={[0, 0.38 * headScale, 0.22 * headScale]} rotation={[0.2, 0, 0]} castShadow>
                  <boxGeometry args={[0.15 * headScale, 0.35 * headScale, 0.05 * headScale]} />
                  <meshStandardMaterial color="#050505" metalness={0.8} roughness={0.1} />
                </mesh>

                {/* --- MATTE FACE MASK SECTION --- */}

                {/* Main Face Triangle base */}
                <mesh position={[0, -0.05 * headScale, 0.2 * headScale]} rotation={[0, Math.PI / 4, Math.PI]} scale={[1, 1, 0.5]} castShadow>
                  {/* A cone pointing down makes a good triangular face shape */}
                  <coneGeometry args={[0.35 * headScale, 0.5 * headScale, 4]} />
                  <meshStandardMaterial color="#151515" metalness={0.3} roughness={0.6} />
                </mesh>

                {/* Eye lens left - Flattened Sphere */}
                <mesh position={[-0.14 * headScale, 0.1 * headScale, 0.28 * headScale]} rotation={[0.1, -0.2, 0]} scale={[1, 0.7, 0.3]} castShadow>
                  <sphereGeometry args={[0.1 * headScale, 16, 16]} />
                  {/* Reddish black lenses */}
                  <meshStandardMaterial color="#1a0000" metalness={0.9} roughness={0.05} />
                </mesh>
                {/* Eye lens right - Flattened Sphere */}
                <mesh position={[0.14 * headScale, 0.1 * headScale, 0.28 * headScale]} rotation={[0.1, 0.2, 0]} scale={[1, 0.7, 0.3]} castShadow>
                  <sphereGeometry args={[0.1 * headScale, 16, 16]} />
                  <meshStandardMaterial color="#1a0000" metalness={0.9} roughness={0.05} />
                </mesh>

                {/* Nose/mouth grille main block - Triangular Prism */}
                <mesh position={[0, -0.15 * headScale, 0.32 * headScale]} rotation={[Math.PI / 2, Math.PI / 2, 0]} castShadow>
                  {/* Cylinder with 3 radial segments is a triangular prism */}
                  <cylinderGeometry args={[0.12 * headScale, 0.12 * headScale, 0.15 * headScale, 3]} />
                  <meshStandardMaterial color="#101010" metalness={0.5} roughness={0.5} />
                </mesh>

                {/* Grille lines - keep these as thin boxes, they work well */}
                {[-0.04, 0, 0.04].map((offset, i) => (
                  <mesh key={i} position={[0, (-0.15 + offset * 1.5) * headScale, 0.38 * headScale]} castShadow>
                    <boxGeometry args={[0.12 * headScale, 0.01 * headScale, 0.01 * headScale]} />
                    <meshStandardMaterial color="#333333" metalness={0.7} roughness={0.3} />
                  </mesh>
                ))}

                {/* Cheek Vents/Tusks - Cylinders instead of boxes */}
                {/* Left */}
                <mesh position={[-0.22 * headScale, -0.18 * headScale, 0.25 * headScale]} rotation={[Math.PI / 2, 0, -0.2]} castShadow>
                  <cylinderGeometry args={[0.04 * headScale, 0.05 * headScale, 0.15 * headScale, 8]} />
                  <meshStandardMaterial color="#151515" metalness={0.4} roughness={0.5} />
                </mesh>
                {/* Right */}
                <mesh position={[0.22 * headScale, -0.18 * headScale, 0.25 * headScale]} rotation={[Math.PI / 2, 0, 0.2]} castShadow>
                  <cylinderGeometry args={[0.04 * headScale, 0.05 * headScale, 0.15 * headScale, 8]} />
                  <meshStandardMaterial color="#151515" metalness={0.4} roughness={0.5} />
                </mesh>

                {/* Chin guard */}
                <mesh position={[0, -0.3 * headScale, 0.22 * headScale]} rotation={[-0.2, 0, 0]} castShadow>
                  <boxGeometry args={[0.2 * headScale, 0.1 * headScale, 0.12 * headScale]} />
                  <meshStandardMaterial color="#151515" metalness={0.3} roughness={0.6} />
                </mesh>
              </group>
            )}

            {/* Nose */}
            <mesh ref={noseRef} position={[0, -0.05 + faceYOffset, 0.26 * headScale]}>
              <boxGeometry args={[0.08 * headScale, 0.12 * headScale, 0.08 * headScale]} />
              <meshStandardMaterial color={skinColor} roughness={0.6} />
            </mesh>

            {/* Mouth - hidden when other mouth states are active (except smile/wide_smile which use the ref) */}
            {/* Default mouth - only show when no special mouth state is set */}
            {!complementary?.mouthState && (
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
              <mesh
                position={[-0.05, -0.12 + faceYOffset, 0.28 * headScale]}
                rotation-z={Math.PI + 0.1}
                scale={headScale}
              >
                <torusGeometry args={[0.07, 0.012, 10, 20, Math.PI * 0.7]} />
                <meshBasicMaterial color="#1a1a1a" />
              </mesh>
            )}

            {/* Open mouth - small open circle */}
            {complementary?.mouthState === 'open' && (
              <mesh position={[0, -0.17 + faceYOffset, 0.27 * headScale]}>
                <circleGeometry args={[0.05 * headScale, 20]} />
                <meshBasicMaterial color="#2a2a2a" />
              </mesh>
            )}

            {/* Surprised mouth - larger O shape */}
            {complementary?.mouthState === 'surprised' && (
              <group position={[0, -0.2 + faceYOffset, 0.28 * headScale]}>
                {/* Outer lip ring */}

                {/* Dark interior */}
                <mesh position={[0, 0, -0.01]}>
                  <circleGeometry args={[0.055 * headScale, 20]} />
                  <meshBasicMaterial color="#1a1a1a" />
                </mesh>
              </group>
            )}

            {/* NEW: Slight smile - subtle */}
            {complementary?.mouthState === 'slight_smile' && (
              <mesh position={[0, -0.14 + faceYOffset, 0.3 * headScale]} rotation={[0, 0, Math.PI]}>
                <torusGeometry args={[0.05 * headScale, 0.012 * headScale, 8, 50, Math.PI]} />
                <meshBasicMaterial color="#2a2a2a" />
              </mesh>
            )}

            {/* Sad smile - inverted slight smile (frown) */}
            {complementary?.mouthState === 'sad_smile' && (
              <mesh position={[0, -0.18 + faceYOffset, 0.3 * headScale]} rotation={[0, 0, 0]}>
                <torusGeometry args={[0.05 * headScale, 0.012 * headScale, 8, 50, Math.PI]} />
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

            {/* Kiss lips (puckered) */}
            {complementary?.mouthState === 'kiss' && (
              <group position={[0, -0.16 + faceYOffset, 0.30 * headScale]}>
                {/* upper lip BIG */}
                <mesh position={[0.019 * headScale, 0.02, 0]} rotation={[0, 0, -0.5]}>
                  <boxGeometry args={[0.05 * headScale, 0.012 * headScale, 0.005]} />
                  <meshBasicMaterial color="#2a2a2a" />
                </mesh>
                {/* Upper lip - low part */}
                <mesh position={[0.019 * headScale, 0, 0]} rotation={[0, 0, 0.45]}>
                  <boxGeometry args={[0.035 * headScale, 0.010 * headScale, 0.005]} />
                  <meshBasicMaterial color="#2a2a2a" />
                </mesh>


                {/* low lip - upper part */}
                <mesh position={[0.02 * headScale, -0.01, 0]} rotation={[0, 0, -0.6]}>
                  <boxGeometry args={[0.027 * headScale, 0.010 * headScale, 0.005]} />
                  <meshBasicMaterial color="#2a2a2a" />
                </mesh>

                {/* LOW lip - low part */}
                <mesh position={[0.015 * headScale, -0.03, 0.005]} rotation={[0, 0, 0.5]}>
                  <boxGeometry args={[0.05 * headScale, 0.012 * headScale, 0.006]} />
                  <meshBasicMaterial color="#2a2a2a" />
                </mesh>
              </group>
            )}

            {/* NEW: Grimacing Smile - Wide rectangular teeth show */}
            {complementary?.mouthState === 'teeth_showing' && (
              <group position={[0, -0.14 + faceYOffset, 0.26 * headScale]}>

                {/* Optional: Thin upper lip edge for tension (dark line above teeth) */}
                <mesh position={[0, -0.02, 0.005]} rotation={[0, 0, Math.PI / 2]}>
                  {/* Capsule: radius, length, radialSegments, heightSegments */}
                  <capsuleGeometry args={[0.04 * headScale, 0.12 * headScale, 16, 4]} />
                  {/* <boxGeometry args={[0.2 * headScale, 0.007 * headScale, 0.005]} /> */}
                  <meshBasicMaterial color="#2a2a2a" />
                </mesh>





                {/* The Teeth Block (Main white area) — wider and slightly taller */}
                <mesh position={[0, -0.015, 0]}>
                  <boxGeometry args={[0.18 * headScale, 0.06 * headScale, 0.005]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>

                {/* Vertical Tooth Dividers — more subtle, slightly inset */}
                {[-0.06, -0.02, 0.02, 0].map((xPos, i) => (
                  <mesh key={i} position={[xPos * headScale, -0.015, 0]}>
                    <boxGeometry args={[0.003 * headScale, 0.06 * headScale, 0.005]} />
                    <meshBasicMaterial color="#e0e0e0" />
                  </mesh>
                ))}



              </group>
            )}

            {/* NEW: Big grin - extra wide smile */}
            {complementary?.mouthState === 'big_grin' && (
              <mesh position={[0, -0.14 + faceYOffset, 0.27 * headScale]} rotation={[0, 0, Math.PI]}>
                <torusGeometry args={[0.12 * headScale, 0.015 * headScale, 8, 16, Math.PI]} />
                <meshBasicMaterial color="#2a2a2a" />
              </mesh>
            )}

            {/* NEW: O-shape - open mouth (surprised/wow) */}
            {complementary?.mouthState === 'o_shape' && (
              <group position={[0, -0.16 + faceYOffset, 0.28 * headScale]}>
                <mesh position={[0, -0.02, 0.005]} rotation={[0, 0, Math.PI / 2]}>
                  {/* Capsule: radius, length, radialSegments, heightSegments */}
                  <capsuleGeometry args={[0.04 * headScale, 0.12 * headScale, 16, 4]} />
                  <meshBasicMaterial color="#2a2a2a" />
                </mesh>
              </group>
            )}

            {/* PIPE - smoking pipe in mouth (moves with head) */}
            {hasPipe && (
              <group position={[0.06 + 0.1 * headScale, -0.09 - 0.12 + faceYOffset, 0.07 + 0.3 * headScale]} rotation={[0.3, -2.5, 0]}>
                {/* Bowl */}
                <mesh position={[0, 0.03, 0]} castShadow>
                  <cylinderGeometry args={[0.025 * headScale, 0.02 * headScale, 0.05 * headScale, 8]} />
                  <meshStandardMaterial color="#5c4a3a" roughness={0.7} />
                </mesh>
                {/* Stem */}
                <mesh position={[0, 0, 0.05 * headScale]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                  <cylinderGeometry args={[0.008 * headScale, 0.008 * headScale, 0.1 * headScale, 6]} />
                  <meshStandardMaterial color="#3a2a1a" roughness={0.6} />
                </mesh>
                {/* Mouthpiece */}
                <mesh position={[0, -0.01, 0.1 * headScale]} castShadow>
                  <boxGeometry args={[0.015 * headScale, 0.01 * headScale, 0.02 * headScale]} />
                  <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
                </mesh>
              </group>
            )}

            {/* CIGAR - in mouth (moves with head) */}
            {hasCigar && (
              <group position={[0.12 * headScale, -0.12 + faceYOffset, 0.32 * headScale]} rotation={[0, 0.4, 0.1]}>
                {/* Main cigar body */}
                <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                  <cylinderGeometry args={[0.012 * headScale, 0.015 * headScale, 0.12 * headScale, 8]} />
                  <meshStandardMaterial color="#8B4513" roughness={0.8} />
                </mesh>
                {/* Burning tip */}
                <mesh position={[0.07 * headScale, 0, 0]} castShadow>
                  <sphereGeometry args={[0.015 * headScale, 6, 6]} />
                  <meshStandardMaterial color="#ff4500" emissive="#ff4500" emissiveIntensity={0.5} />
                </mesh>
                {/* Ash */}
                <mesh position={[0.055 * headScale, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                  <cylinderGeometry args={[0.013 * headScale, 0.012 * headScale, 0.02 * headScale, 6]} />
                  <meshStandardMaterial color="#808080" roughness={0.9} />
                </mesh>
              </group>
            )}

            {/* Anime Face Decorations */}
            <FaceDecorations complementary={complementary} headScale={headScale} />
          </group>
        );
      })()}

      {/* BOOKS - pile on the ground next to character */}
      {hasBook && (
        <group position={[-body.armX - 0.35, body.legY - body.upperLeg.height - 0.32, 0.15]}>
          {/* Book 1 - closed, bottom of pile */}
          <mesh position={[0, 0, 0]} rotation={[0, 0.1, 0]} castShadow>
            <boxGeometry args={[0.18, 0.03, 0.24]} />
            <meshStandardMaterial color="#8B4513" roughness={0.8} />
          </mesh>
          {/* Book 2 - closed, slightly rotated */}
          <mesh position={[0.02, 0.035, 0.01]} rotation={[0, -0.15, 0]} castShadow>
            <boxGeometry args={[0.17, 0.025, 0.22]} />
            <meshStandardMaterial color="#2d5a27" roughness={0.8} />
          </mesh>
          {/* Book 3 - closed, different angle */}
          <mesh position={[-0.01, 0.065, -0.02]} rotation={[0, 0.25, 0]} castShadow>
            <boxGeometry args={[0.16, 0.028, 0.21]} />
            <meshStandardMaterial color="#8b1a1a" roughness={0.8} />
          </mesh>
          {/* Book 4 - OPEN book on top */}
          <group position={[0, 0.1, 0.02]} rotation={[0, -0.1, 0]}>
            {/* Left page spread */}
            <mesh position={[-0.085, 0.005, 0]} rotation={[0, 0, 0.08]} castShadow>
              <boxGeometry args={[0.15, 0.015, 0.2]} />
              <meshStandardMaterial color="#f5f5dc" roughness={0.95} />
            </mesh>
            {/* Right page spread */}
            <mesh position={[0.085, 0.005, 0]} rotation={[0, 0, -0.08]} castShadow>
              <boxGeometry args={[0.15, 0.015, 0.2]} />
              <meshStandardMaterial color="#f5f5dc" roughness={0.95} />
            </mesh>
            {/* Spine (center crease) */}
            <mesh position={[0, -0.005, 0]} castShadow>
              <boxGeometry args={[0.02, 0.02, 0.2]} />
              <meshStandardMaterial color="#654321" roughness={0.7} />
            </mesh>
            {/* Text lines on left page */}
            {[-0.06, -0.03, 0, 0.03, 0.06].map((z, i) => (
              <mesh key={`left-${i}`} position={[-0.08, 0.015, z]} castShadow>
                <boxGeometry args={[0.1, 0.002, 0.015]} />
                <meshStandardMaterial color="#2a2a2a" roughness={0.9} />
              </mesh>
            ))}
            {/* Text lines on right page */}
            {[-0.06, -0.03, 0, 0.03, 0.06].map((z, i) => (
              <mesh key={`right-${i}`} position={[0.08, 0.015, z]} castShadow>
                <boxGeometry args={[0.1, 0.002, 0.015]} />
                <meshStandardMaterial color="#2a2a2a" roughness={0.9} />
              </mesh>
            ))}
          </group>
          {/* Scattered book - lying flat beside pile */}
          <mesh position={[0.22, 0.015, 0.08]} rotation={[0, 0.6, 0]} castShadow>
            <boxGeometry args={[0.14, 0.025, 0.18]} />
            <meshStandardMaterial color="#1e3a5f" roughness={0.8} />
          </mesh>
        </group>
      )}

      {/* PAPYRUS - long scroll held, almost touching ground */}
      {hasPapyrus && (
        <group position={[body.armX + 0.15, body.armY - 0.2, 0.15]} rotation={[0.1, -0.3, 0]}>
          {/* Main scroll body - long and curved slightly */}
          <mesh position={[0, -0.3, 0]} castShadow>
            <boxGeometry args={[0.18, 0.9, 0.02]} />
            <meshStandardMaterial color="#d4b896" roughness={0.95} />
          </mesh>
          {/* Top roll */}
          <mesh position={[0, 0.15, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.025, 0.025, 0.2, 8]} />
            <meshStandardMaterial color="#c4a876" roughness={0.85} />
          </mesh>
          {/* Top roll end caps */}
          <mesh position={[-0.11, 0.15, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.02, 8]} />
            <meshStandardMaterial color="#8B4513" roughness={0.7} />
          </mesh>
          <mesh position={[0.11, 0.15, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.02, 8]} />
            <meshStandardMaterial color="#8B4513" roughness={0.7} />
          </mesh>
          {/* Bottom curl - slightly rolled */}
          <mesh position={[0, -0.78, 0.02]} rotation={[0.3, 0, 0]} castShadow>
            <boxGeometry args={[0.17, 0.08, 0.025]} />
            <meshStandardMaterial color="#d4b896" roughness={0.95} />
          </mesh>
          {/* Written text lines */}
          {[-0.25, -0.18, -0.11, -0.04, 0.03, 0.1, -0.32, -0.39, -0.46, -0.53, -0.6].map((y, i) => (
            <mesh key={`text-${i}`} position={[0, y, 0.012]} castShadow>
              <boxGeometry args={[0.12 - (i % 3) * 0.02, 0.008, 0.002]} />
              <meshStandardMaterial color="#3a2a1a" roughness={0.9} />
            </mesh>
          ))}
          {/* Decorative hieroglyph-style marks */}
          <mesh position={[-0.06, -0.67, 0.012]} castShadow>
            <boxGeometry args={[0.015, 0.015, 0.002]} />
            <meshStandardMaterial color="#3a2a1a" roughness={0.9} />
          </mesh>
          <mesh position={[0.04, -0.67, 0.012]} castShadow>
            <boxGeometry args={[0.02, 0.012, 0.002]} />
            <meshStandardMaterial color="#3a2a1a" roughness={0.9} />
          </mesh>
        </group>
      )}
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
        <pointLight position={[0, 0.5, 1]} intensity={0.8} color={character.color} distance={4} />
      )}
    </group>
  );
}, (prev, next) => {
  // Custom comparison to prevent unnecessary re-renders
  // Only re-render when essential visual properties change
  return (
    prev.character?.id === next.character?.id &&
    prev.isActive === next.isActive &&
    prev.animation === next.animation &&
    prev.isTalking === next.isTalking &&
    prev.scale === next.scale &&
    prev.positionX === next.positionX &&
    prev.positionY === next.positionY &&
    prev.positionZ === next.positionZ &&
    // Complementary properties - all need comparison for proper updates
    prev.complementary?.mouthState === next.complementary?.mouthState &&
    prev.complementary?.effect === next.complementary?.effect &&
    prev.complementary?.effectColor === next.complementary?.effectColor &&
    prev.complementary?.eyeState === next.complementary?.eyeState &&
    prev.complementary?.eyebrowState === next.complementary?.eyebrowState &&
    prev.complementary?.lookDirection === next.complementary?.lookDirection &&
    prev.complementary?.headStyle === next.complementary?.headStyle &&
    prev.complementary?.faceState === next.complementary?.faceState &&
    prev.complementary?.noseState === next.complementary?.noseState &&
    prev.complementary?.cheekState === next.complementary?.cheekState &&
    prev.complementary?.foreheadState === next.complementary?.foreheadState &&
    prev.complementary?.jawState === next.complementary?.jawState &&
    prev.complementary?.speed === next.complementary?.speed
  );
});

export function CharacterDisplay3D({
  characterId,
  character: passedCharacter,
  isActive = false,
  animation = 'idle',
  isTalking = false,
  showName = false,
  nameKey,
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
  const [shiftPressed, setShiftPressed] = useState(false);

  // Track shift key for zoom control (shift + scroll to zoom)
  useEffect(() => {
    if (Platform.OS !== 'web') return; // Only on web

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleKeyDown = (e: any) => {
      if (e.key === 'Shift') setShiftPressed(true);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleKeyUp = (e: any) => {
      if (e.key === 'Shift') setShiftPressed(false);
    };

    // @ts-ignore - DOM APIs only available on web
    window.addEventListener('keydown', handleKeyDown);
    // @ts-ignore - DOM APIs only available on web
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      // @ts-ignore - DOM APIs only available on web
      window.removeEventListener('keydown', handleKeyDown);
      // @ts-ignore - DOM APIs only available on web
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

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

  // Store GL context for disposal
  const glRef = useRef<THREE.WebGLRenderer | null>(null);

  // Mobile-specific rendering optimizations
  const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';
  const glConfig = useMemo(() => ({
    alpha: true,
    antialias: !isMobile, // Disable antialias on mobile for better performance
    preserveDrawingBuffer: false,
    powerPreference: isMobile ? 'low-power' : 'default' as const,
    precision: isMobile ? 'mediump' : 'highp' as const,
  }), [isMobile]);

  const sceneRef = useRef<THREE.Scene | null>(null);

  // Track mount/unmount for debugging memory leaks
  useEffect(() => {
    const charName = character?.id || characterId || 'unknown';
    memDebug.trackMount(`CharacterDisplay3D:${charName}`);
    // console.log(`[CHAR3D-DEBUG] 🖼️ CharacterDisplay3D MOUNTED: ${charName}`);
    memDebug.checkMemory(`CharacterDisplay3D:${charName} mount`);

    return () => {
      memDebug.trackUnmount(`CharacterDisplay3D:${charName}`);
      // console.log(`[CHAR3D-DEBUG] 🖼️ CharacterDisplay3D UNMOUNTED: ${charName}`);
    };
  }, [character?.id, characterId]);

  // Cleanup WebGL resources on unmount
  useEffect(() => {
    return () => {
      // console.log(`[CHAR3D-DEBUG] 🧹 Disposing WebGL resources for ${character?.id || characterId || 'unknown'}`);
      // Traverse scene and dispose all geometries, materials, textures
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            if (object.geometry) {
              object.geometry.dispose();
            }
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach((mat) => {
                  disposeMaterial(mat);
                });
              } else {
                disposeMaterial(object.material);
              }
            }
          }
        });
        sceneRef.current = null;
      }
      // Explicitly dispose WebGL renderer to free GPU memory
      if (glRef.current) {
        glRef.current.dispose();
        glRef.current = null;
      }
    };
  }, []);

  // Helper to dispose material and its textures
  const disposeMaterial = (material: THREE.Material) => {
    material.dispose();
    // Dispose textures if any
    const mat = material as THREE.MeshStandardMaterial;
    if (mat.map) mat.map.dispose();
    if (mat.normalMap) mat.normalMap.dispose();
    if (mat.roughnessMap) mat.roughnessMap.dispose();
    if (mat.metalnessMap) mat.metalnessMap.dispose();
    if (mat.aoMap) mat.aoMap.dispose();
    if (mat.emissiveMap) mat.emissiveMap.dispose();
  };

  // Handle Canvas creation - store GL and scene references
  const handleCreated = ({ gl, scene }: { gl: THREE.WebGLRenderer; scene: THREE.Scene }) => {
    glRef.current = gl;
    sceneRef.current = scene;
  };

  return (
    <View style={styles.container}>
      <Canvas
        camera={{ position: [cameraX, cameraY, cameraDistance], fov }}
        gl={glConfig}
        dpr={isMobile ? [1, 1.5] : [1, 2]} // Lower pixel ratio on mobile
        style={{ background: 'transparent' }}
        onCreated={handleCreated}
        frameloop="demand" // Only render when invalidated - much better performance with multiple characters
      >
        {/* Simplified lighting for mobile, full lighting for web */}
        <ambientLight intensity={isMobile ? 0.5 : 0.3} />
        {!isMobile && (
          <spotLight position={[5, 10, 5]} angle={0.3} penumbra={1} intensity={0.5} castShadow />
        )}
        {!isMobile && (
          <directionalLight position={[-5, 5, 5]} intensity={0.3} />
        )}
        {/* Top light for better character illumination */}
        <directionalLight position={[0, 10, 0]} intensity={isMobile ? 0.6 : 0.4} color="#ffffff" />
        {/* Frontal light for face illumination */}
        <directionalLight position={[0, 2, 5]} intensity={isMobile ? 0.8 : 0.6} color="#ffffff" />
        {/* Frontal light for body illumination - only on desktop */}
        {!isMobile && (
          <directionalLight position={[0, -2, 5]} intensity={0.5} color="#ffffff" />
        )}

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
        {/* New emoji-triggered effects */}
        {complementary?.effect === 'fire' && (
          <FireEffect color={effectColor} speed={complementary?.speed} />
        )}
        {complementary?.effect === 'stars' && (
          <StarsEffect color={effectColor} speed={complementary?.speed} />
        )}
        {complementary?.effect === 'music_notes' && (
          <MusicNotesEffect color={effectColor} speed={complementary?.speed} />
        )}
        {complementary?.effect === 'tears' && (
          <TearsEffect color={effectColor} speed={complementary?.speed} />
        )}
        {complementary?.effect === 'anger' && (
          <AngerEffect color={effectColor} speed={complementary?.speed} />
        )}
        {complementary?.effect === 'snow' && (
          <SnowEffect color={effectColor} speed={complementary?.speed} />
        )}
        {complementary?.effect === 'rainbow' && (
          <RainbowEffect color={effectColor} speed={complementary?.speed} />
        )}

        <OrbitControls
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 2}
          minDistance={0.5}
          maxDistance={8}
          zoomSpeed={0.8}
        />

        {/* Performance monitoring - only for active characters to avoid overhead */}
        {isActive && <ThreeJSPerformanceMonitor />}

        {/* Invalidate canvas for animations - enables efficient frameloop="demand" */}
        <AnimationInvalidator isAnimating={isActive || animation !== 'idle' || isTalking} />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
    width: '200%', // Extend beyond parent to allow character overflow
    marginLeft: '-25%', // Center the extended container
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
});
