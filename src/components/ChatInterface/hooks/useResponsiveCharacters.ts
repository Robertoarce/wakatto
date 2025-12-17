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
}

interface UseResponsiveCharactersResult {
  bubbleMaxWidth: number;
  bubbleMaxHeight: number;
  characterScaleFactor: number;
  inputAreaHeight: number;
  safeTopBoundary: number;
  getBubbleTopOffset: (index: number) => number;
}

export function useResponsiveCharacters({
  characterCount,
  screenWidth,
  screenHeight,
  isMobile,
  isMobileLandscape,
}: UseResponsiveCharactersOptions): UseResponsiveCharactersResult {
  // Bubble sizing - scales proportionally with screen width
  const bubbleMaxWidth = useMemo(() => {
    // In mobile landscape, use more horizontal space (wider bubbles)
    if (isMobileLandscape) {
      const landscapeWidth = screenWidth * 0.35; // 35% of wider screen
      return Math.min(landscapeWidth, 350);
    }
    // Proportional width: 80% at 320px, 55% at 768px, 40% at 1200px+
    // Linear interpolation based on screen width
    const minScreenWidth = 280;
    const maxScreenWidth = 1200;
    const clampedWidth = Math.max(minScreenWidth, Math.min(maxScreenWidth, screenWidth));

    // Calculate percentage (80% -> 40% as screen gets wider)
    const widthPercent = 0.8 - ((clampedWidth - minScreenWidth) / (maxScreenWidth - minScreenWidth)) * 0.4;
    const baseWidth = screenWidth * widthPercent;

    // Minimum width scales with screen (no less than 85% of screen - 20px padding)
    const minWidth = Math.min(220, screenWidth * 0.85 - 20);
    const scaledWidth = Math.max(minWidth, baseWidth - (characterCount - 1) * 15);
    return Math.min(scaledWidth, 420); // Cap at 420px
  }, [isMobileLandscape, screenWidth, characterCount]);

  const bubbleMaxHeight = useMemo(() => {
    // In mobile landscape, severely limit height due to constrained vertical space
    if (isMobileLandscape) {
      return Math.floor(screenHeight * 0.4); // Max 40% of limited height
    }
    return Math.floor(screenHeight * 0.5); // Max 50% of screen height for better text visibility
  }, [isMobileLandscape, screenHeight]);

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
      // Much smaller offset in landscape - bubbles sit beside characters
      const baseOffset = -20;
      const staggerAmount = 15;
      return baseOffset - (index * staggerAmount / Math.max(1, characterCount * 0.5));
    }
    // Each bubble staggers based on index, scaled by character count
    // Position bubbles partially above character but still visible (-40 to -60 base)
    // Less aggressive offset so bubbles stay within viewport
    const baseOffset = isMobile ? -40 : -60;
    const staggerAmount = isMobile ? 20 : 25;
    return baseOffset - (index * staggerAmount / Math.max(1, characterCount * 0.5));
  }, [isMobile, isMobileLandscape, characterCount]);

  return {
    bubbleMaxWidth,
    bubbleMaxHeight,
    characterScaleFactor,
    inputAreaHeight,
    safeTopBoundary,
    getBubbleTopOffset,
  };
}

export default useResponsiveCharacters;
