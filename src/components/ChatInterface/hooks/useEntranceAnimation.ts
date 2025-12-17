/**
 * useEntranceAnimation - Manage character entrance animations
 * Handles entrance sequence generation and timing
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { EntranceConfig, generateEntranceSequence, getTotalEntranceDuration } from '../../../services/entranceAnimations';

interface UseEntranceAnimationOptions {
  conversationStarterInProgress: boolean;
}

interface UseEntranceAnimationResult {
  showEntranceAnimation: boolean;
  setShowEntranceAnimation: React.Dispatch<React.SetStateAction<boolean>>;
  entranceAnimationKey: React.MutableRefObject<number>;
  entranceSequence: Map<string, EntranceConfig>;
  setEntranceSequence: React.Dispatch<React.SetStateAction<Map<string, EntranceConfig>>>;
  triggerEntranceAnimation: (characterIds: string[]) => { sequence: Map<string, EntranceConfig>; duration: number };
  clearEntranceAnimation: () => void;
}

export function useEntranceAnimation({
  conversationStarterInProgress,
}: UseEntranceAnimationOptions): UseEntranceAnimationResult {
  const [showEntranceAnimation, setShowEntranceAnimation] = useState(false);
  const entranceAnimationKey = useRef(0);
  const [entranceSequence, setEntranceSequence] = useState<Map<string, EntranceConfig>>(new Map());

  // Trigger entrance animation for a set of characters
  const triggerEntranceAnimation = useCallback((characterIds: string[]) => {
    const sequence = generateEntranceSequence(characterIds);
    const duration = getTotalEntranceDuration(sequence);

    setEntranceSequence(sequence);
    entranceAnimationKey.current += 1;
    setShowEntranceAnimation(true);

    return { sequence, duration };
  }, []);

  // Clear entrance animation state
  const clearEntranceAnimation = useCallback(() => {
    setShowEntranceAnimation(false);
    setEntranceSequence(new Map());
  }, []);

  // Auto-clear entrance animation after duration (fallback if not cleared by conversation starter)
  useEffect(() => {
    if (showEntranceAnimation && !conversationStarterInProgress) {
      const duration = entranceSequence.size > 0
        ? getTotalEntranceDuration(entranceSequence) + 200 // Add small buffer
        : 1200;

      const timeout = setTimeout(() => {
        setShowEntranceAnimation(false);
        setEntranceSequence(new Map());
      }, duration);

      return () => clearTimeout(timeout);
    }
  }, [showEntranceAnimation, entranceSequence, conversationStarterInProgress]);

  return {
    showEntranceAnimation,
    setShowEntranceAnimation,
    entranceAnimationKey,
    entranceSequence,
    setEntranceSequence,
    triggerEntranceAnimation,
    clearEntranceAnimation,
  };
}

export default useEntranceAnimation;
