/**
 * Helper functions for speech bubble queue system
 * Handles text segmentation, reading pause calculation, and bubble sizing
 */

/**
 * Represents a segment of text that fits in one bubble
 */
export interface BubbleSegment {
  id: string;
  text: string;
  wordCount: number;
  startIndex: number;
  endIndex: number;
}

/**
 * Calculate reading pause duration based on word count
 * Uses average reading speed of 200 WPM
 * @param wordCount - Number of words in the text
 * @param wpm - Words per minute (default 200)
 * @returns Pause duration in milliseconds
 */
export function calculateReadingPause(wordCount: number, wpm: number = 200): number {
  // Minimum 1.5 seconds, maximum 8 seconds
  const minutes = wordCount / wpm;
  const ms = minutes * 60 * 1000;
  return Math.max(1500, Math.min(ms, 8000));
}

/**
 * Calculate maximum characters per line based on bubble width
 * Assumes Inter font at ~9.5 pixels per character average
 * @param maxWidth - Maximum bubble width in pixels
 * @param padding - Horizontal padding (default 28px = 14px each side)
 * @param charsPerPixel - Average character width (default 9.5)
 * @returns Maximum characters per line
 */
export function calculateMaxCharsForBubble(
  maxWidth: number,
  padding: number = 28,
  charsPerPixel: number = 9.5
): number {
  const usableWidth = maxWidth - padding;
  return Math.floor(usableWidth / charsPerPixel);
}

/**
 * Calculate maximum lines that fit in a bubble based on height
 * @param maxHeight - Maximum bubble height in pixels
 * @param lineHeight - Height per line (default 32px = lineHeight 28 + margin 4)
 * @param headerHeight - Height for name label (default 30px)
 * @param padding - Vertical padding (default 28px)
 * @returns Maximum number of lines
 */
export function calculateMaxLinesForBubble(
  maxHeight: number,
  lineHeight: number = 32,
  headerHeight: number = 30,
  padding: number = 28
): number {
  const usableHeight = maxHeight - headerHeight - padding;
  return Math.max(2, Math.floor(usableHeight / lineHeight));
}

/**
 * Count words in a string
 * @param text - Text to count words in
 * @returns Word count
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Wrap text into lines with specified max width
 * @param text - Text to wrap
 * @param maxChars - Maximum characters per line
 * @returns Array of lines
 */
export function wrapTextToLines(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  const paragraphs = text.split('\n');

  for (const paragraph of paragraphs) {
    if (paragraph.length === 0) {
      lines.push('');
      continue;
    }

    const words = paragraph.split(' ');
    let currentLine = '';

    for (const word of words) {
      if (currentLine.length + word.length + 1 <= maxChars) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
  }

  return lines;
}

/**
 * Find the break point in text where a new bubble should start
 * Tries to break at sentence boundaries, then at word boundaries
 * @param text - Text to find break point in
 * @param maxChars - Maximum characters per line
 * @param maxLines - Maximum lines per bubble
 * @returns Character index where to break, or -1 if text fits
 */
export function findBubbleBreakPoint(
  text: string,
  maxChars: number,
  maxLines: number
): number {
  const lines = wrapTextToLines(text, maxChars);

  // Text fits in bubble
  if (lines.length <= maxLines) {
    return -1;
  }

  // Find character position at end of maxLines
  let charCount = 0;
  for (let i = 0; i < maxLines; i++) {
    charCount += lines[i].length;
    if (i < maxLines - 1) {
      charCount += 1; // Account for space between words
    }
  }

  // Try to find a sentence boundary near the break point
  const searchStart = Math.max(0, charCount - 50);
  const searchEnd = Math.min(text.length, charCount + 20);
  const searchRegion = text.slice(searchStart, searchEnd);

  // Look for sentence endings (. ! ?)
  const sentenceMatch = searchRegion.match(/[.!?]\s+/g);
  if (sentenceMatch) {
    const lastMatch = searchRegion.lastIndexOf(sentenceMatch[sentenceMatch.length - 1]);
    if (lastMatch !== -1) {
      const breakPoint = searchStart + lastMatch + sentenceMatch[sentenceMatch.length - 1].length;
      // Only use sentence break if it's reasonably close to our target
      if (breakPoint > charCount * 0.7 && breakPoint < charCount * 1.3) {
        return breakPoint;
      }
    }
  }

  // Fall back to word boundary
  const wordBoundary = text.lastIndexOf(' ', charCount);
  return wordBoundary > 0 ? wordBoundary + 1 : charCount;
}

/**
 * Segment text into multiple bubble chunks
 * @param text - Full text to segment
 * @param maxChars - Maximum characters per line
 * @param maxLines - Maximum lines per bubble
 * @returns Array of bubble segments
 */
export function segmentTextIntoBubbles(
  text: string,
  maxChars: number,
  maxLines: number
): BubbleSegment[] {
  const segments: BubbleSegment[] = [];
  let remainingText = text;
  let currentIndex = 0;

  while (remainingText.length > 0) {
    const breakPoint = findBubbleBreakPoint(remainingText, maxChars, maxLines);

    let segmentText: string;
    if (breakPoint === -1) {
      // Remaining text fits in one bubble
      segmentText = remainingText;
      remainingText = '';
    } else {
      segmentText = remainingText.slice(0, breakPoint).trim();
      remainingText = remainingText.slice(breakPoint).trim();
    }

    if (segmentText.length > 0) {
      segments.push({
        id: `bubble-${Date.now()}-${segments.length}`,
        text: segmentText,
        wordCount: countWords(segmentText),
        startIndex: currentIndex,
        endIndex: currentIndex + segmentText.length,
      });
      currentIndex += segmentText.length + 1; // +1 for trimmed space
    }
  }

  return segments;
}

/**
 * Get dynamic bubble dimensions based on character count and bubble count
 * @param characterCount - Number of characters in conversation
 * @param bubbleCount - Number of bubbles showing (1 or 2)
 * @param screenWidth - Screen width in pixels
 * @param screenHeight - Screen height in pixels
 * @param isMobile - Whether on mobile device
 * @param isMobileLandscape - Whether in mobile landscape mode
 * @returns Object with maxWidth, maxHeight, maxLines, maxChars
 */
export function getDynamicBubbleDimensions(
  characterCount: number,
  bubbleCount: number,
  screenWidth: number,
  screenHeight: number,
  isMobile: boolean,
  isMobileLandscape: boolean
): {
  maxWidth: number;
  maxHeight: number;
  maxLines: number;
  maxChars: number;
} {
  // Base sizing lookup table - increased lines for better text visibility
  const sizingTable: Record<string, { width: number; lines: number }> = {
    '1-1': { width: 420, lines: 7}, //12 },
    '1-2': { width: 320, lines: 7}, //10 },
    '2-1': { width: 350, lines: 7}, //10 },
    '2-2': { width: 280, lines: 7}, //8 },
    '3-1': { width: 300, lines: 7}, //9 },
    '3-2': { width: 240, lines: 7}, //7 },
  };

  const key = `${Math.min(characterCount, 3)}-${Math.min(bubbleCount, 2)}`;
  const baseSizing = sizingTable[key] || { width: 280, lines: 8 };

  // Adjust for screen size
  let maxWidth = baseSizing.width;
  let maxLines = baseSizing.lines;

  if (isMobileLandscape) {
    // Landscape: wider but shorter bubbles
    maxWidth = Math.min(maxWidth, screenWidth * 0.35);
    maxLines = Math.min(maxLines, 7);
  } else if (isMobile) {
    // Portrait mobile: scale width to screen
    maxWidth = Math.min(maxWidth, screenWidth * 0.75);
    maxLines = Math.min(maxLines, 10);
  }

  // Ensure minimum width
  maxWidth = Math.max(220, Math.min(maxWidth, screenWidth - 32));

  // Calculate height based on lines (lineHeight 28 + marginBottom 4 = 32)
  const lineHeight = 32;
  const headerHeight = 30;
  const padding = 28;
  const maxHeight = (maxLines * lineHeight) + headerHeight + padding;

  // Calculate characters per line
  const maxChars = calculateMaxCharsForBubble(maxWidth);

  return {
    maxWidth,
    maxHeight,
    maxLines,
    maxChars,
  };
}

/**
 * Animation timing constants
 */
export const BUBBLE_ANIMATION_TIMING = {
  SLIDE_DURATION: 800,
  FADE_DURATION: 800,
  READING_WPM: 200,
  MIN_READING_PAUSE: 1500,
  MAX_READING_PAUSE: 8000,
  FADE_OUT_DELAY: 2000,
  FADE_OUT_DURATION: 3000,
};
