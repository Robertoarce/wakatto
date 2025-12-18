/**
 * FadingLine - Text line with opacity animation
 * Used in speech bubbles to fade older text progressively
 */

import React, { useRef, useEffect, memo } from 'react';
import { Animated, Platform, Text, StyleSheet } from 'react-native';
import { useResponsive } from '../../../constants/Layout';

interface FadingLineProps {
  text: string;
  opacity: number;
  isLast: boolean;
  characterColor: string;
}

export const FadingLine = memo(function FadingLine({
  text,
  opacity,
  isLast,
  characterColor
}: FadingLineProps) {
  const animatedOpacity = useRef(new Animated.Value(opacity)).current;
  const prevOpacity = useRef(opacity);
  const { fonts } = useResponsive();

  useEffect(() => {
    // Only animate if opacity actually changed
    if (prevOpacity.current !== opacity) {
      Animated.timing(animatedOpacity, {
        toValue: opacity,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
      prevOpacity.current = opacity;
    }
  }, [opacity, animatedOpacity]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      animatedOpacity.stopAnimation();
    };
  }, [animatedOpacity]);

  return (
    <Animated.Text
      style={[
        styles.speechBubbleText,
        {
          opacity: animatedOpacity,
          fontSize: fonts.md,
        }
      ]}
    >
      {text}
      {isLast && <Text style={[styles.speechBubbleCursor, { color: characterColor }]}>|</Text>}
    </Animated.Text>
  );
});

const styles = StyleSheet.create({
  speechBubbleText: {
    fontFamily: 'Inter-Regular',
    color: 'white',
    lineHeight: 26,
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  speechBubbleCursor: {
    fontWeight: 'bold',
  },
});

export default FadingLine;
