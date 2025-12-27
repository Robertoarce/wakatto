/**
 * useIdleAnimation - Per-character idle animation management
 * Handles random animation selection and independent timers for each character
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { IdleAnimationState } from '../types/chatInterface.types';
import { getRandomIdleAnimation, getRandomIdleInterval } from '../utils/idleAnimationConstants';
import { memDebug } from '../../../services/performanceLogger';

interface UseIdleAnimationOptions {
  selectedCharacters: string[];
  isPlaying: boolean;
  isLoading: boolean;
  showEntranceAnimation: boolean;
}

interface UseIdleAnimationResult {
  idleAnimations: Map<string, IdleAnimationState>;
  startIdleCycle: () => void;
  stopIdleCycle: () => void;
}

export function useIdleAnimation({
  selectedCharacters,
  isPlaying,
  isLoading,
  showEntranceAnimation,
}: UseIdleAnimationOptions): UseIdleAnimationResult {
  // Idle animations for each character when not in playback
  const [idleAnimations, setIdleAnimations] = useState<Map<string, IdleAnimationState>>(new Map());

  // Per-character timers (characterId -> timeout)
  const idleTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const idleStartDelayRef = useRef<NodeJS.Timeout | null>(null);
  const isIdleCycleActiveRef = useRef(false);

  // Update idle animation for a single character with position-aware look direction
  const updateCharacterIdleAnimation = useCallback((characterId: string) => {
    // Use the same character processing as the visual rendering:
    // - Remove duplicates with Set
    // - Limit to 5 characters
    const visualCharacters = Array.from(new Set(selectedCharacters)).slice(0, 5);
    const characterIndex = visualCharacters.indexOf(characterId);
    const totalCharacters = visualCharacters.length;

    // Only update if character is in the visual set
    if (characterIndex === -1) return;

    setIdleAnimations(prev => {
      const newMap = new Map(prev);
      newMap.set(characterId, getRandomIdleAnimation(characterIndex, totalCharacters));
      return newMap;
    });
  }, [selectedCharacters]);

  // Schedule next idle animation for a character with random delay
  const scheduleNextIdleAnimation = useCallback((characterId: string) => {
    // Clear any existing timer for this character
    const existingTimer = idleTimersRef.current.get(characterId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      memDebug.trackTimeoutClear('useIdleAnimation', existingTimer);
    }

    // Schedule next animation change with random interval (8-15 seconds)
    const interval = getRandomIdleInterval();
    const timer = setTimeout(() => {
      if (isIdleCycleActiveRef.current) {
        updateCharacterIdleAnimation(characterId);
        // Schedule the next one
        scheduleNextIdleAnimation(characterId);
      }
    }, interval);

    idleTimersRef.current.set(characterId, timer);
    memDebug.trackTimeout('useIdleAnimation', timer);
    console.log(`[IDLE-DEBUG] ⏱️ Scheduled idle animation for ${characterId} in ${(interval/1000).toFixed(1)}s (total timers: ${idleTimersRef.current.size})`);
  }, [updateCharacterIdleAnimation]);

  // Start idle animation cycle for all characters (with staggered start)
  const startIdleCycle = useCallback(() => {
    isIdleCycleActiveRef.current = true;

    // Each character starts with a random initial delay (0-5 seconds stagger)
    selectedCharacters.forEach((charId, index) => {
      // Set initial animation immediately
      updateCharacterIdleAnimation(charId);

      // Schedule first change with staggered delay
      const staggerDelay = (index * 2000) + (Math.random() * 3000); // 0-3s base + 2s per character
      const initialTimer = setTimeout(() => {
        if (isIdleCycleActiveRef.current) {
          updateCharacterIdleAnimation(charId);
          scheduleNextIdleAnimation(charId);
        }
      }, staggerDelay);

      idleTimersRef.current.set(charId, initialTimer);
    });
  }, [selectedCharacters, updateCharacterIdleAnimation, scheduleNextIdleAnimation]);

  // Stop all idle animation cycles and clear state
  const stopIdleCycle = useCallback(() => {
    const timerCount = idleTimersRef.current.size;
    console.log(`[IDLE-DEBUG] 🛑 Stopping idle cycle (${timerCount} timers to clear)`);
    isIdleCycleActiveRef.current = false;

    // Clear all character timers
    idleTimersRef.current.forEach((timer, charId) => {
      clearTimeout(timer);
      memDebug.trackTimeoutClear('useIdleAnimation', timer);
    });
    idleTimersRef.current.clear();

    // Clear the idle animations state Map to prevent memory accumulation
    setIdleAnimations(new Map());

    if (idleStartDelayRef.current) {
      clearTimeout(idleStartDelayRef.current);
      memDebug.trackTimeoutClear('useIdleAnimation', idleStartDelayRef.current);
      idleStartDelayRef.current = null;
    }
    console.log(`[IDLE-DEBUG] ✅ Idle cycle stopped, all timers cleared`);
  }, []);

  // Effect: Start/stop idle cycle based on playback and loading state
  // IMPORTANT: Always clear and restart the idle timer when someone talks
  // This prevents idle animations from interrupting responses
  useEffect(() => {
    const shouldBeIdle = !isPlaying && !isLoading && !showEntranceAnimation;

    // Always clear any pending idle start timer first
    // This restarts the idle countdown whenever playback state changes
    if (idleStartDelayRef.current) {
      clearTimeout(idleStartDelayRef.current);
      idleStartDelayRef.current = null;
    }

    if (shouldBeIdle) {
      // Start idle cycle after a 5 second delay (to let post-speaking expression show)
      idleStartDelayRef.current = setTimeout(() => {
        startIdleCycle();
      }, 5000);
    } else {
      // Stop idle cycle when playback starts or loading begins
      stopIdleCycle();
    }

    return () => {
      if (idleStartDelayRef.current) {
        clearTimeout(idleStartDelayRef.current);
        idleStartDelayRef.current = null;
      }
      stopIdleCycle();
    };
  }, [isPlaying, isLoading, showEntranceAnimation, startIdleCycle, stopIdleCycle]);

  // Effect: Cleanup on unmount
  useEffect(() => {
    return () => {
      stopIdleCycle();
    };
  }, [stopIdleCycle]);

  // Effect: Handle character selection changes - add/remove timers for new/removed characters
  useEffect(() => {
    if (!isIdleCycleActiveRef.current) return;

    // Remove timers for characters no longer selected
    idleTimersRef.current.forEach((timer, charId) => {
      if (!selectedCharacters.includes(charId)) {
        clearTimeout(timer);
        idleTimersRef.current.delete(charId);
      }
    });

    // Add timers for newly selected characters
    selectedCharacters.forEach((charId) => {
      if (!idleTimersRef.current.has(charId)) {
        // Set initial animation and schedule next
        updateCharacterIdleAnimation(charId);
        const staggerDelay = Math.random() * 3000; // Random 0-3s delay
        const timer = setTimeout(() => {
          if (isIdleCycleActiveRef.current) {
            updateCharacterIdleAnimation(charId);
            scheduleNextIdleAnimation(charId);
          }
        }, staggerDelay);
        idleTimersRef.current.set(charId, timer);
      }
    });
  }, [selectedCharacters, updateCharacterIdleAnimation, scheduleNextIdleAnimation]);

  return {
    idleAnimations,
    startIdleCycle,
    stopIdleCycle,
  };
}

export default useIdleAnimation;
