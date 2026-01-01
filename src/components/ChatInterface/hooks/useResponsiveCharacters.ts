/**
 * useResponsiveCharacters - Responsive calculations for bubbles and character sizing
 */

import { useMemo, useCallback } from 'react';

interface UseResponsiveCharactersOptions {
  characterCount: number;
  screenWidth: number;
  screenHeight: number;
  isMobile: boolean;
  isMobileLandscape: boolean;
  bubbleCount?: number;
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

// Simple bubble dimensions based on screen size and character count
function getSimpleBubbleDimensions(
  characterCount: number,
  screenWidth: number,
  isMobile: boolean
) {
  // Simple responsive sizing
  const baseWidth = isMobile ? Math.min(screenWidth - 32, 280) : Math.min(320, screenWidth * 0.3);
  const scaledWidth = characterCount > 2 ? baseWidth * 0.8 : baseWidth;

  return {
    maxWidth: Math.round(scaledWidth),
    maxHeight: isMobile ? 120 : 150,
    maxLines: 4,
    maxChars: 45,
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
  // Get simple bubble dimensions
  const bubbleDimensions = useMemo(() => {
    return getSimpleBubbleDimensions(characterCount, screenWidth, isMobile);
  }, [characterCount, screenWidth, isMobile]);

  const bubbleMaxWidth = bubbleDimensions.maxWidth;
  const bubbleMaxHeight = bubbleDimensions.maxHeight;
  const bubbleMaxLines = bubbleDimensions.maxLines;
  const bubbleMaxChars = bubbleDimensions.maxChars;

  // Helper to get dimensions for a specific bubble count
  const getBubbleDimensionsForCount = useCallback((count: number) => {
    return getSimpleBubbleDimensions(characterCount, screenWidth, isMobile);
  }, [characterCount, screenWidth, isMobile]);

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
      const baseOffset = 5;
      const staggerAmount = 4;
      return baseOffset - (index * staggerAmount / Math.max(1, characterCount * 0.5));
    }
    // Each bubble staggers based on index, scaled by character count
    // Position bubbles very close to character (just above head)
    const baseOffset = isMobile ? 10 : -15;
    const staggerAmount = isMobile ? 4 : 6;
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
