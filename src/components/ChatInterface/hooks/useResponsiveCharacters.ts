/**
 * useResponsiveCharacters - Responsive calculations for bubbles and character sizing
 */

import { useMemo, useCallback } from 'react';
import { getDynamicBubbleDimensions } from '../utils/bubbleQueueHelpers';

interface UseResponsiveCharactersOptions {
  characterCount: number;
  screenWidth: number;
  screenHeight: number;
  isMobile: boolean;
  isMobileLandscape: boolean;
  bubbleCount?: number; // NEW: Number of bubbles showing (1 or 2)
}

interface UseResponsiveCharactersResult {
  bubbleMaxWidth: number;
  bubbleMaxHeight: number;
  bubbleMaxLines: number;
  bubbleMaxChars: number;
  characterScaleFactor: number;
  inputAreaHeight: number;
  safeTopBoundary: number;
  getBubbleTopOffset: (index: number) => number;
  getBubbleDimensionsForCount: (count: number) => {
    maxWidth: number;
    maxHeight: number;
    maxLines: number;
    maxChars: number;
  };
}

export function useResponsiveCharacters({
  characterCount,
  screenWidth,
  screenHeight,
  isMobile,
  isMobileLandscape,
  bubbleCount = 1,
}: UseResponsiveCharactersOptions): UseResponsiveCharactersResult {
  // Get bubble dimensions using the new dynamic system
  const bubbleDimensions = useMemo(() => {
    return getDynamicBubbleDimensions(
      characterCount,
      bubbleCount,
      screenWidth,
      screenHeight,
      isMobile,
      isMobileLandscape
    );
  }, [characterCount, bubbleCount, screenWidth, screenHeight, isMobile, isMobileLandscape]);

  const bubbleMaxWidth = bubbleDimensions.maxWidth;
  const bubbleMaxHeight = bubbleDimensions.maxHeight;
  const bubbleMaxLines = bubbleDimensions.maxLines;
  const bubbleMaxChars = bubbleDimensions.maxChars;

  // Helper to get dimensions for a specific bubble count
  const getBubbleDimensionsForCount = useCallback((count: number) => {
    return getDynamicBubbleDimensions(
      characterCount,
      count,
      screenWidth,
      screenHeight,
      isMobile,
      isMobileLandscape
    );
  }, [characterCount, screenWidth, screenHeight, isMobile, isMobileLandscape]);

  // Character scale - smaller when more characters to leave room for bubbles
  const characterScaleFactor = useMemo(() => {
    // 1.0 for 1 char, 0.9 for 2, 0.8 for 3, etc. (min 0.6)
    return Math.max(0.6, 1 - (characterCount - 1) * 0.1);
  }, [characterCount]);

  // Input area protection - calculate safe zone for bubbles
  const inputAreaHeight = 120; // Approximate input container height
  const safeTopBoundary = 8; // Minimum distance from top

  // Calculate bubble vertical stagger to prevent overlap
  const getBubbleTopOffset = useCallback((index: number) => {
    // In mobile landscape, position bubbles lower (beside character, not above)
    if (isMobileLandscape) {
      // Very close to character in landscape mode
      const baseOffset = -10;
      const staggerAmount = 8;
      return baseOffset - (index * staggerAmount / Math.max(1, characterCount * 0.5));
    }
    // Each bubble staggers based on index, scaled by character count
    // Position bubbles very close to character (10-15px above) for vertical stacking
    const baseOffset = isMobile ? -12 : -15;
    const staggerAmount = isMobile ? 8 : 10;
    return baseOffset - (index * staggerAmount / Math.max(1, characterCount * 0.5));
  }, [isMobile, isMobileLandscape, characterCount]);

  return {
    bubbleMaxWidth,
    bubbleMaxHeight,
    bubbleMaxLines,
    bubbleMaxChars,
    characterScaleFactor,
    inputAreaHeight,
    safeTopBoundary,
    getBubbleTopOffset,
    getBubbleDimensionsForCount,
  };
}

export default useResponsiveCharacters;
