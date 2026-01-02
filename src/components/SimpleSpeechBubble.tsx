/**
 * SimpleSpeechBubble - A simple, stateless speech bubble component
 *
 * Design principle: Parent controls what text to display.
 * This component just renders it with fade animation.
 */

import React, { useRef, useEffect } from 'react';
import { Animated, View, Text, StyleSheet, Platform } from 'react-native';
import { useResponsive } from '../constants/Layout';

interface SimpleSpeechBubbleProps {
  text: string;
  characterName: string;
  characterColor: string;
  isVisible: boolean;
  position?: 'left' | 'right' | 'center';
  maxLines?: number;
  maxWidth?: number;
  isMobileStacked?: boolean;
}

export function SimpleSpeechBubble({
  text,
  characterName,
  characterColor,
  isVisible,
  position = 'center',
  maxLines = 4,
  maxWidth = 280,
  isMobileStacked = false,
}: SimpleSpeechBubbleProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { fonts, spacing, borderRadius, scalePx, isMobile, width: screenWidth } = useResponsive();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isVisible ? 1 : 0,
      duration: 200,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [isVisible, fadeAnim]);

  // Don't render if no text
  if (!text) return null;

  // Responsive sizing based on screen width
  // Small screens (<400): smaller text/padding
  // Medium screens (400-800): normal
  // Large screens (>800): larger text/padding
  const isSmallScreen = screenWidth < 400;
  const isLargeScreen = screenWidth > 800;



  // Dynamic font sizes (compact, using scales)
 const nameFontSize = '100%';
  const textFontSize = '80%';

  // Dynamic padding (compact, using scales)
  const bubblePadding = '6%';

  // Dynamic line height (tight, using scales)
  const lineHeight = '150%';

  // Dynamic chars per line based on screen width
  const charsPerLine = isSmallScreen ? 35 : (isLargeScreen ? 55 : 45);

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
            padding: bubblePadding,
            marginBottom: spacing.xs,
          }
        ]}
      >
        <Text style={[styles.name, { color: characterColor, fontSize: nameFontSize }]}>
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
  // Position bubble from 10% top down, with horizontal alignment based on position prop
  const getPositionStyle = () => {
    const baseStyle = {
      top: '1%',
    };

    switch (position) {
      case 'left':
        return { ...baseStyle, right: '60%' };
      case 'right':
        return { ...baseStyle, left: '60%' };
      case 'center':
      default:
        return { ...baseStyle, left: '50%', transform: [{ translateX: -maxWidth / 2 }] };
    }
  };

  return (
    <Animated.View
      style={[
        styles.bubble,
        {
          opacity: fadeAnim,
          borderColor: characterColor,
          maxWidth,
          borderRadius: borderRadius.lg,
          padding: bubblePadding,
        },
        getPositionStyle(),
      ]}
    >
      <Text style={[styles.name, { color: characterColor, fontSize: nameFontSize }]}>
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
    minWidth: '50%',
    zIndex: 100,
    pointerEvents: 'none',
  },
  bubbleMobileStacked: {
    position: 'relative',
    backgroundColor: 'rgba(30, 30, 40, 0.95)',
    borderWidth: 2,
    alignSelf: 'stretch',
    width: '100%',
    pointerEvents: 'none',
  },
  name: {
    fontFamily: 'Inter-Bold',
    margin: '3%',
    letterSpacing: 0.3,
  },
  text: {
    fontFamily: 'Inter-Regular',
    color: '#ffffff',
  },
});

export default SimpleSpeechBubble;
