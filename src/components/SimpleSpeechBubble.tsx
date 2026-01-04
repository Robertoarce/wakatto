/**
 * SimpleSpeechBubble - A simple, stateless speech bubble component
 *
 * Design principle: Parent controls what text to display.
 * This component just renders it with fade animation.
 *
 * Positioned inside FloatingCharacterWrapper to inherit floating animation.
 * Centers itself within the wrapper.
 */

import React, { useRef, useEffect } from 'react';
import { Animated, Text, StyleSheet, Platform } from 'react-native';
import { useResponsive } from '../constants/Layout';

interface SimpleSpeechBubbleProps {
  text: string;
  characterName: string;
  characterColor: string;
  isVisible: boolean;
  maxLines?: number;
  isMobileStacked?: boolean;
  // Total number of characters - used to limit bubble width and prevent overlap
  characterCount?: number;
  // For chunked responses - which chunk this is (0-indexed)
  chunkIndex?: number;
  // Total number of chunks in the response
  totalChunks?: number;
}

export function SimpleSpeechBubble({
  text,
  characterName,
  characterColor,
  isVisible,
  maxLines = 4,
  isMobileStacked = false,
  characterCount = 1,
  chunkIndex = 0,
  totalChunks = 1,
}: SimpleSpeechBubbleProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const {
    spacing,
    borderRadius,
    width: screenWidth,
    isMobile,
  } = useResponsive();

  // Single character mode: wider bubbles, more screen real estate
  const isSingleCharacter = characterCount === 1;

  // Calculate max bubble width based on character count to prevent overlap
  // Each character gets an equal slice of screen width, bubble uses 85% of that slice
  const sliceWidth = screenWidth / Math.max(1, characterCount);
  const maxSliceUsage = 0.85; // Use 85% of character's allocated space

  // Wider limits for single character
  const absoluteMaxWidth = isSingleCharacter ? 500 : 350;

  // Final bubble width: min of (slice limit, absolute max, percentage of screen)
  // Wider percentage for single character
  const bubbleWidthPercent = isSingleCharacter
    ? (isMobile ? 0.5 : 0.4)
    : (isMobile ? 0.38 : 0.28);
  const bubbleWidth = Math.min(
    sliceWidth * maxSliceUsage,
    absoluteMaxWidth,
    screenWidth * bubbleWidthPercent
  );

  // Stacked mode: wider bubbles
  const stackedWidth = Math.min(screenWidth - 32, screenWidth * 0.9);

  // Final width based on mode
  const finalWidth = isMobileStacked ? stackedWidth : bubbleWidth;

  // Simple font sizing
  const textFontSize = Math.max(12, Math.min(18, screenWidth * 0.012));
  const nameFontSize = Math.max(13, Math.min(20, screenWidth * 0.014));
  const paddingH = Math.max(10, Math.min(16, screenWidth * 0.015));
  const paddingV = Math.max(8, Math.min(12, screenWidth * 0.01));
  const lineHeight = Math.round(textFontSize * 1.4);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isVisible ? 1 : 0,
      duration: 200,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [isVisible, fadeAnim]);

  // Don't render if no text
  if (!text) return null;

  // Calculate characters per line for word wrap
  const avgCharWidth = textFontSize * 0.55;
  const usableWidth = finalWidth - (paddingH * 2);
  const charsPerLine = Math.max(20, Math.floor(usableWidth / avgCharWidth));

  // For single character, allow very tall bubbles (no practical limit)
  // For multiple characters, keep the original limit
  const effectiveMaxLines = isSingleCharacter ? 50 : maxLines;

  // Simple word wrap function
  const wrapText = (str: string, maxChars: number): string[] => {
    const words = str.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length <= maxChars) {
        currentLine = (currentLine + ' ' + word).trim();
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);

    // Show last N lines (scrolling effect for long text)
    // Single character allows much more height
    return lines.slice(-effectiveMaxLines);
  };

  const lines = wrapText(text, charsPerLine);

  // Mobile stacked layout (relative positioning)
  if (isMobileStacked) {
    return (
      <Animated.View
        style={[
          styles.bubbleMobileStacked,
          {
            opacity: fadeAnim,
            borderColor: characterColor,
            borderRadius: borderRadius.md,
            paddingHorizontal: paddingH,
            paddingVertical: paddingV,
            marginBottom: spacing.xs,
            maxWidth: finalWidth,
          }
        ]}
      >
        <Text style={[styles.name, { color: characterColor, fontSize: nameFontSize, marginBottom: 4 }]}>
          {characterName}
        </Text>
        {lines.map((line, i) => (
          <Text key={i} style={[styles.text, { fontSize: textFontSize, lineHeight }]}>
            {line}
          </Text>
        ))}
      </Animated.View>
    );
  }

  // Floating layout - positioned within wrapper (inherits floating animation)
  // Single character: offset to the right of center
  // Multiple characters: centered
  const horizontalPosition = isSingleCharacter ? '65%' : '50%';

  // For chunked responses, stack bubbles vertically
  // Each chunk appears higher up (negative = up)
  const baseTop = -20;
  const chunkSpacing = 80; // Space between chunks
  const chunkVerticalOffset = chunkIndex * -chunkSpacing;

  return (
    <Animated.View
      style={[
        styles.bubble,
        {
          opacity: fadeAnim,
          borderColor: characterColor,
          width: finalWidth,
          borderRadius: borderRadius.lg,
          paddingHorizontal: paddingH,
          paddingVertical: paddingV,
          // Position horizontally - right of center for single character
          left: horizontalPosition,
          // Stack chunks vertically
          top: baseTop + chunkVerticalOffset,
          transform: [{ translateX: -finalWidth / 2 }],
        },
      ]}
    >
      <Text style={[styles.name, { color: characterColor, fontSize: nameFontSize, marginBottom: 4 }]}>
        {characterName}
      </Text>
      {lines.map((line, i) => (
        <Text key={i} style={[styles.text, { fontSize: textFontSize, lineHeight }]}>
          {line}
        </Text>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    // top is calculated dynamically based on chunkIndex
    backgroundColor: 'rgba(30, 30, 40, 0.85)',
    borderWidth: 2,
    zIndex: 100,
    pointerEvents: 'none',
  },
  bubbleMobileStacked: {
    position: 'relative',
    backgroundColor: 'rgba(30, 30, 40, 0.95)',
    borderWidth: 2,
    alignSelf: 'center',
    pointerEvents: 'none',
  },
  name: {
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.3,
  },
  text: {
    fontFamily: 'Inter-Regular',
    color: '#ffffff',
  },
});

export default SimpleSpeechBubble;
