/**
 * SimpleSpeechBubble - A simple, stateless speech bubble component
 *
 * Design principle: Parent controls what text to display.
 * This component just renders it with fade animation.
 *
 * Uses hybrid clamp() responsive sizing for all screen sizes.
 */

import React, { useRef, useEffect, useMemo } from 'react';
import { Animated, Text, StyleSheet, Platform } from 'react-native';
import { useResponsive } from '../constants/Layout';

interface SimpleSpeechBubbleProps {
  text: string;
  characterName: string;
  characterColor: string;
  isVisible: boolean;
  position?: 'left' | 'right' | 'center';
  maxLines?: number;
  isMobileStacked?: boolean;
  // Optional override for multi-character scenarios (percentage of screen width)
  widthPercent?: number;
}

export function SimpleSpeechBubble({
  text,
  characterName,
  characterColor,
  isVisible,
  position = 'center',
  maxLines = 4,
  isMobileStacked = false,
  widthPercent,
}: SimpleSpeechBubbleProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const {
    spacing,
    borderRadius,
    components,
    width: screenWidth,
    proportionalWidth: calcProportionalWidth,
  } = useResponsive();

  // Get speech bubble sizing from responsive system
  const bubbleSizing = components.speechBubble;

  // Calculate bubble width proportionally
  const bubbleWidth = useMemo(() => {
    if (isMobileStacked) {
      return calcProportionalWidth(bubbleSizing.stackedWidthPercent);
    }
    return calcProportionalWidth(
      widthPercent ?? bubbleSizing.floatingWidthPercent,
      bubbleSizing.minWidth
    );
  }, [isMobileStacked, widthPercent, bubbleSizing, calcProportionalWidth]);

  // Font sizes from clamp system (numeric pixels)
  const nameFontSize = bubbleSizing.nameFontSize;
  const textFontSize = bubbleSizing.textFontSize;

  // Padding from clamp system (numeric pixels)
  const paddingH = bubbleSizing.paddingHorizontal;
  const paddingV = bubbleSizing.paddingVertical;

  // Line height as absolute value (font size * multiplier)
  const lineHeight = Math.round(textFontSize * bubbleSizing.lineHeightMultiplier);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isVisible ? 1 : 0,
      duration: 200,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [isVisible, fadeAnim]);

  // Don't render if no text
  if (!text) return null;

  // Calculate approximate characters per line based on actual bubble width and font size
  // Assume average character width is ~0.55 of font size for proportional fonts
  const avgCharWidth = textFontSize * 0.55;
  const usableWidth = bubbleWidth - (paddingH * 2);
  const charsPerLine = Math.max(20, Math.floor(usableWidth / avgCharWidth));

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
    return lines.slice(-maxLines);
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
            maxWidth: bubbleWidth,
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

  // Default floating layout (absolute positioning for desktop/character display)
  const getPositionStyle = () => {
    const baseStyle = {
      top: 8,
    };

    switch (position) {
      case 'left':
        return { ...baseStyle, right: screenWidth * 0.55 };
      case 'right':
        return { ...baseStyle, left: screenWidth * 0.55 };
      case 'center':
      default:
        return { ...baseStyle, left: screenWidth * 0.5, transform: [{ translateX: -bubbleWidth / 2 }] };
    }
  };

  return (
    <Animated.View
      style={[
        styles.bubble,
        {
          opacity: fadeAnim,
          borderColor: characterColor,
          width: bubbleWidth,
          borderRadius: borderRadius.lg,
          paddingHorizontal: paddingH,
          paddingVertical: paddingV,
        },
        getPositionStyle(),
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
    backgroundColor: 'rgba(30, 30, 40, 0.71)',
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
