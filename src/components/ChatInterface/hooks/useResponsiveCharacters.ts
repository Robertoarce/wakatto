/**
 * useResponsiveCharacters - Responsive calculations for bubbles and character sizing
 *
 * Uses proportional width (percentage of screen) instead of fixed pixels.
 * SimpleSpeechBubble handles its own sizing via the responsive hook.
 */

import { useMemo, useCallback } from 'react';
import { clampVw, proportionalWidth, BREAKPOINTS } from '../../../constants/Layout';

interface UseResponsiveCharactersOptions {
  characterCount: number;
  screenWidth: number;
  screenHeight: number;
  isMobile: boolean;
  isMobileLandscape: boolean;
  bubbleCount?: number;
  containerHeight?: number;  // Actual character display area height
  containerWidth?: number;   // Actual character display area width
}

interface UseResponsiveCharactersResult {
  bubbleMaxWidth: number;
  bubbleMaxHeight: number;
  bubbleMaxLines: number;
  bubbleMaxChars: number;
  bubbleWidthPercent: number;  // Proportional width for SimpleSpeechBubble
  characterScaleFactor: number;
  inputAreaHeight: number;
  safeTopBoundary: number;
  getBubbleTopOffset: (index: number) => number;
  getBubbleDimensionsForCount: (count: number) => {
    maxWidth: number;
    maxHeight: number;
    maxLines: number;
    maxChars: number;
    widthPercent: number;
  };
}

// Proportional bubble dimensions based on screen size and character count
function getProportionalBubbleDimensions(
  characterCount: number,
  screenWidth: number,
  screenHeight: number,
  isMobile: boolean
) {
  // Base width as percentage of screen (NOT fixed pixels)
  // Single character: larger bubble, multiple: smaller
  const isMobileSize = screenWidth < BREAKPOINTS.tablet;
  const baseWidthPercent = isMobileSize
    ? (characterCount > 2 ? 0.28 : 0.35)
    : (characterCount > 2 ? 0.28 : 0.38);

  const maxWidth = proportionalWidth(baseWidthPercent, screenWidth, 120);

  // Height scales with screen using clamp
  const maxHeight = clampVw(100, 15, 200, screenWidth);

  // Font size for calculating chars (using same clamp as Layout.ts)
  const fontSize = clampVw(12, 3.2, 24, screenWidth);
  const avgCharWidth = fontSize * 0.55;
  const paddingH = clampVw(8, 2.5, 24, screenWidth);
  const usableWidth = maxWidth - (paddingH * 2);
  const maxChars = Math.max(20, Math.floor(usableWidth / avgCharWidth));

  // Max lines based on height
  const lineHeight = fontSize * 1.45;
  const maxLines = Math.max(2, Math.floor((maxHeight - 40) / lineHeight));

  return {
    maxWidth,
    maxHeight,
    maxLines: Math.min(maxLines, 6),
    maxChars,
    widthPercent: baseWidthPercent,
  };
}

export function useResponsiveCharacters({
  characterCount,
  screenWidth,
  screenHeight,
  isMobile,
  isMobileLandscape,
  bubbleCount = 1,
  containerHeight,
  containerWidth,
}: UseResponsiveCharactersOptions): UseResponsiveCharactersResult {
  // Get proportional bubble dimensions
  const bubbleDimensions = useMemo(() => {
    return getProportionalBubbleDimensions(characterCount, screenWidth, screenHeight, isMobile);
  }, [characterCount, screenWidth, screenHeight, isMobile]);

  const bubbleMaxWidth = bubbleDimensions.maxWidth;
  const bubbleMaxHeight = bubbleDimensions.maxHeight;
  const bubbleMaxLines = bubbleDimensions.maxLines;
  const bubbleMaxChars = bubbleDimensions.maxChars;
  const bubbleWidthPercent = bubbleDimensions.widthPercent;

  // Helper to get dimensions for a specific bubble count
  const getBubbleDimensionsForCount = useCallback((count: number) => {
    return getProportionalBubbleDimensions(count, screenWidth, screenHeight, isMobile);
  }, [screenWidth, screenHeight, isMobile]);

  // Character scale - based on container size and character count
  const characterScaleFactor = useMemo(() => {
    // Base scale from character count
    const countFactor = Math.max(0.6, 1 - (characterCount - 1) * 0.1);

    // Container-based scale factor
    // Reference: 400px height = 1.0 scale
    const heightReference = 400;
    const heightFactor = containerHeight
      ? Math.min(1.2, Math.max(0.5, containerHeight / heightReference))
      : 1.0;

    // Reference: 600px width = 1.0 scale
    const widthReference = 600;
    const widthFactor = containerWidth
      ? Math.min(1.2, Math.max(0.5, containerWidth / widthReference))
      : 1.0;

    // Combine: use smaller of width/height factor, then apply count factor
    const containerFactor = Math.min(heightFactor, widthFactor);
    return countFactor * containerFactor;
  }, [characterCount, containerHeight, containerWidth]);

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
    bubbleWidthPercent,
    characterScaleFactor,
    inputAreaHeight,
    safeTopBoundary,
    getBubbleTopOffset,
    getBubbleDimensionsForCount,
  };
}

export default useResponsiveCharacters;
