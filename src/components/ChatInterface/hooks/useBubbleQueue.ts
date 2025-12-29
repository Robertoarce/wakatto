/**
 * useBubbleQueue - Manages per-character bubble queue state
 * Handles text segmentation, reading pauses, and bubble transitions
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  segmentTextIntoBubbles,
  calculateReadingPause,
  getDynamicBubbleDimensions,
  BUBBLE_ANIMATION_TIMING,
} from '../utils/bubbleQueueHelpers';
import type { BubbleState, BubbleAnimationState } from '../components/AnimatedBubble';
import { memDebug } from '../../../services/performanceLogger';

interface CharacterBubbleQueue {
  bubbles: BubbleState[];
  lastProcessedText: string;
  pendingSegments: Array<{ id: string; text: string; wordCount: number }>;
  isTransitioning: boolean;
  readingTimer: NodeJS.Timeout | null;
}

interface UseBubbleQueueOptions {
  characterCount: number;
  screenWidth: number;
  screenHeight: number;
  isMobile: boolean;
  isMobileLandscape: boolean;
}

interface UseBubbleQueueResult {
  getBubblesForCharacter: (characterId: string) => BubbleState[];
  getAnimationState: (characterId: string, bubbleId: string) => BubbleAnimationState;
  updateCharacterText: (characterId: string, text: string, isTyping: boolean, fullText?: string) => void;
  isTransitioning: (characterId: string) => boolean;
  onBubbleAnimationComplete: (characterId: string, bubbleId: string, animation: BubbleAnimationState) => void;
  clearCharacterBubbles: (characterId: string) => void;
  clearAllBubbles: () => void;
  getBubbleDimensions: (bubbleCount: number) => {
    maxWidth: number;
    maxHeight: number;
    maxLines: number;
    maxChars: number;
  };
}

export function useBubbleQueue({
  characterCount,
  screenWidth,
  screenHeight,
  isMobile,
  isMobileLandscape,
}: UseBubbleQueueOptions): UseBubbleQueueResult {
  // Store bubble queues per character
  const [queues, setQueues] = useState<Map<string, CharacterBubbleQueue>>(new Map());

  // Store animation states separately to avoid re-renders during text updates
  const animationStates = useRef<Map<string, Map<string, BubbleAnimationState>>>(new Map());

  // Timer refs for cleanup
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Get bubble dimensions based on bubble count
  const getBubbleDimensions = useCallback((bubbleCount: number) => {
    return getDynamicBubbleDimensions(
      characterCount,
      bubbleCount,
      screenWidth,
      screenHeight,
      isMobile,
      isMobileLandscape
    );
  }, [characterCount, screenWidth, screenHeight, isMobile, isMobileLandscape]);

  // Initialize or get queue for a character
  const getOrCreateQueue = useCallback((characterId: string): CharacterBubbleQueue => {
    const existing = queues.get(characterId);
    if (existing) return existing;

    return {
      bubbles: [],
      lastProcessedText: '',
      pendingSegments: [],
      isTransitioning: false,
      readingTimer: null,
    };
  }, [queues]);

  // Get bubbles for a character
  const getBubblesForCharacter = useCallback((characterId: string): BubbleState[] => {
    const queue = queues.get(characterId);
    return queue?.bubbles || [];
  }, [queues]);

  // Get animation state for a specific bubble
  const getAnimationState = useCallback((characterId: string, bubbleId: string): BubbleAnimationState => {
    const charAnimations = animationStates.current.get(characterId);
    return charAnimations?.get(bubbleId) || 'idle';
  }, []);

  // Set animation state for a bubble
  const setAnimationState = useCallback((characterId: string, bubbleId: string, state: BubbleAnimationState) => {
    if (!animationStates.current.has(characterId)) {
      animationStates.current.set(characterId, new Map());
    }
    animationStates.current.get(characterId)!.set(bubbleId, state);
  }, []);

  // Check if character is transitioning
  const isTransitioning = useCallback((characterId: string): boolean => {
    return queues.get(characterId)?.isTransitioning || false;
  }, [queues]);

  // Process pending segments into bubbles with transitions
  const processPendingSegments = useCallback((characterId: string) => {
    setQueues(prev => {
      const newQueues = new Map(prev);
      const queue = { ...getOrCreateQueue(characterId) };

      if (queue.pendingSegments.length === 0 || queue.isTransitioning) {
        return prev;
      }

      const nextSegment = queue.pendingSegments[0];
      const currentBubbleCount = queue.bubbles.length;

      if (currentBubbleCount < 2) {
        // Can add a new bubble directly
        const newBubble: BubbleState = {
          id: nextSegment.id,
          text: nextSegment.text,
          position: currentBubbleCount === 0 ? 'left' : 'right',
          status: 'active',
        };

        queue.bubbles = [...queue.bubbles, newBubble];
        queue.pendingSegments = queue.pendingSegments.slice(1);

        // Trigger slide-in animation for new bubble
        setAnimationState(characterId, newBubble.id, 'sliding_in');
      } else {
        // Need to transition: fade out left, slide right to left, slide in new
        queue.isTransitioning = true;

        // Mark left bubble for fading
        const leftBubble = queue.bubbles[0];
        const rightBubble = queue.bubbles[1];

        setAnimationState(characterId, leftBubble.id, 'fading_out');
        setAnimationState(characterId, rightBubble.id, 'sliding_left');

        // Store the pending segment to add after transition
        // (will be handled in onBubbleAnimationComplete)
      }

      newQueues.set(characterId, queue);
      return newQueues;
    });
  }, [getOrCreateQueue, setAnimationState]);

  // Schedule processing of next segment after reading pause
  const scheduleNextSegment = useCallback((characterId: string, wordCount: number) => {
    // Clear existing timer
    const existingTimer = timersRef.current.get(characterId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      memDebug.trackTimeoutClear('useBubbleQueue', existingTimer);
    }

    const pauseDuration = calculateReadingPause(wordCount);

    const timer = setTimeout(() => {
      processPendingSegments(characterId);
      timersRef.current.delete(characterId);
    }, pauseDuration);

    timersRef.current.set(characterId, timer);
    memDebug.trackTimeout('useBubbleQueue', timer);
  }, [processPendingSegments]);

  // Update text for a character - this is called frequently during text reveal
  // fullText: The complete message for pre-calculated segmentation (prevents word jumping)
  const updateCharacterText = useCallback((characterId: string, text: string, isTyping: boolean, fullText?: string) => {
    if (!text) return;

    setQueues(prev => {
      const newQueues = new Map(prev);
      const queue = { ...getOrCreateQueue(characterId) };

      // Skip if text hasn't changed
      if (text === queue.lastProcessedText) {
        return prev;
      }

      // Get current bubble dimensions (assume 1 bubble for initial segmentation)
      const dimensions = getBubbleDimensions(Math.max(1, queue.bubbles.length));

      // Use fullText for segmentation if available (prevents words jumping between lines)
      // This pre-calculates segment boundaries based on final text
      const textToSegment = fullText || text;
      const segments = segmentTextIntoBubbles(
        textToSegment,
        dimensions.maxChars,
        dimensions.maxLines
      );

      // If this is the first update or text is completely new
      if (queue.bubbles.length === 0) {
        if (segments.length > 0) {
          const firstSegment = segments[0];
          const newBubble: BubbleState = {
            id: firstSegment.id,
            text: firstSegment.text,
            position: 'left',
            status: 'active',
          };
          queue.bubbles = [newBubble];
          setAnimationState(characterId, newBubble.id, 'sliding_in');

          // Queue remaining segments
          if (segments.length > 1) {
            queue.pendingSegments = segments.slice(1);
            scheduleNextSegment(characterId, firstSegment.wordCount);
          }
        }
      } else {
        // Update existing bubble text (for progressive text reveal)
        const activeBubble = queue.bubbles.find(b => b.status === 'active');
        if (activeBubble) {
          // Find which segment corresponds to the active bubble
          const currentSegmentIndex = queue.bubbles.length - 1 + queue.pendingSegments.length;
          const newSegments = segmentTextIntoBubbles(text, dimensions.maxChars, dimensions.maxLines);

          if (newSegments.length > currentSegmentIndex + 1) {
            // Text has grown beyond current bubble capacity
            // Update active bubble with its segment
            const activeSegmentIndex = queue.bubbles.length - 1;
            if (newSegments[activeSegmentIndex]) {
              activeBubble.text = newSegments[activeSegmentIndex].text;
              activeBubble.status = 'reading';

              // Add new segments to pending
              const newPending = newSegments.slice(activeSegmentIndex + 1);
              queue.pendingSegments = newPending;

              // Schedule transition after reading pause
              if (!queue.isTransitioning && queue.pendingSegments.length > 0) {
                scheduleNextSegment(characterId, newSegments[activeSegmentIndex].wordCount);
              }
            }
          } else if (newSegments.length > 0) {
            // Text still fits, just update the active bubble
            const activeSegmentIndex = queue.bubbles.length - 1;
            if (newSegments[activeSegmentIndex]) {
              activeBubble.text = newSegments[activeSegmentIndex].text;
            }
          }
        }
      }

      queue.lastProcessedText = text;
      newQueues.set(characterId, queue);
      return newQueues;
    });
  }, [getOrCreateQueue, getBubbleDimensions, setAnimationState, scheduleNextSegment]);

  // Handle animation completion
  const onBubbleAnimationComplete = useCallback((
    characterId: string,
    bubbleId: string,
    animation: BubbleAnimationState
  ) => {
    setQueues(prev => {
      const newQueues = new Map(prev);
      const queue = { ...getOrCreateQueue(characterId) };

      switch (animation) {
        case 'sliding_in':
          // Animation complete, bubble is now idle
          setAnimationState(characterId, bubbleId, 'idle');
          break;

        case 'fading_out':
          // Remove the faded bubble
          queue.bubbles = queue.bubbles.filter(b => b.id !== bubbleId);
          animationStates.current.get(characterId)?.delete(bubbleId);
          break;

        case 'sliding_left':
          // Update position and reset animation
          const movedBubble = queue.bubbles.find(b => b.id === bubbleId);
          if (movedBubble) {
            movedBubble.position = 'left';
            movedBubble.status = 'active';
          }
          setAnimationState(characterId, bubbleId, 'idle');

          // Now add the pending segment as new right bubble
          if (queue.pendingSegments.length > 0) {
            const nextSegment = queue.pendingSegments[0];
            const newBubble: BubbleState = {
              id: nextSegment.id,
              text: nextSegment.text,
              position: 'right',
              status: 'active',
            };
            queue.bubbles = [...queue.bubbles, newBubble];
            queue.pendingSegments = queue.pendingSegments.slice(1);
            setAnimationState(characterId, newBubble.id, 'sliding_in');
          }

          queue.isTransitioning = false;
          break;
      }

      newQueues.set(characterId, queue);
      return newQueues;
    });
  }, [getOrCreateQueue, setAnimationState]);

  // Clear bubbles for a character
  const clearCharacterBubbles = useCallback((characterId: string) => {
    // Clear timers
    const timer = timersRef.current.get(characterId);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(characterId);
    }

    // Clear animation states
    animationStates.current.delete(characterId);

    setQueues(prev => {
      const newQueues = new Map(prev);
      newQueues.delete(characterId);
      return newQueues;
    });
  }, []);

  // Clear all bubbles
  const clearAllBubbles = useCallback(() => {
    // Clear all timers
    timersRef.current.forEach(timer => {
      clearTimeout(timer);
      memDebug.trackTimeoutClear('useBubbleQueue', timer);
    });
    timersRef.current.clear();

    // Clear all animation states
    animationStates.current.clear();

    setQueues(new Map());
  }, []);

  // Track mount/unmount and cleanup timers
  useEffect(() => {
    memDebug.trackMount('useBubbleQueue');

    return () => {
      timersRef.current.forEach(timer => {
        clearTimeout(timer);
        memDebug.trackTimeoutClear('useBubbleQueue', timer);
      });
      timersRef.current.clear();
      memDebug.trackUnmount('useBubbleQueue');
    };
  }, []);

  return {
    getBubblesForCharacter,
    getAnimationState,
    updateCharacterText,
    isTransitioning,
    onBubbleAnimationComplete,
    clearCharacterBubbles,
    clearAllBubbles,
    getBubbleDimensions,
  };
}

export default useBubbleQueue;
