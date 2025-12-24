/**
 * FadingLine - Text line with opacity animation
 * Used in speech bubbles to fade older text progressively
 * Includes "hold time" - new lines stay bright for a minimum time before fading
 */

import React, { useRef, useEffect, useState, memo } from 'react';
import { Animated, Platform, Text, StyleSheet } from 'react-native';
import { useResponsive } from '../../../constants/Layout';

// How long a new line stays at full opacity before fading (ms)
const HOLD_TIME_MS = 1000;
// How long the transition from hold to target opacity takes (ms)
const FADE_TRANSITION_MS = 500;

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
  const animatedOpacity = useRef(new Animated.Value(1)).current; // Start at full opacity
  const prevTargetOpacity = useRef(opacity);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { fonts } = useResponsive();
  const [isHolding, setIsHolding] = useState(true);

  // Handle hold time expiration
  useEffect(() => {
    // Start hold timer on mount
    holdTimerRef.current = setTimeout(() => {
      setIsHolding(false);
    }, HOLD_TIME_MS);

    return () => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
    };
  }, []);

  // Handle opacity changes
  useEffect(() => {
    if (isHolding) {
      // During hold period, stay at full opacity
      // But still track what the target should be
      prevTargetOpacity.current = opacity;
      return;
    }

    // After hold period, animate to target opacity
    if (prevTargetOpacity.current !== opacity || !isHolding) {
      Animated.timing(animatedOpacity, {
        toValue: opacity,
        duration: FADE_TRANSITION_MS,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
      prevTargetOpacity.current = opacity;
    }
  }, [opacity, isHolding, animatedOpacity]);

  // When hold period ends, transition to current target opacity
  useEffect(() => {
    if (!isHolding) {
      Animated.timing(animatedOpacity, {
        toValue: prevTargetOpacity.current,
        duration: FADE_TRANSITION_MS,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }
  }, [isHolding, animatedOpacity]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      animatedOpacity.stopAnimation();
    };
  }, [animatedOpacity]);

  // Responsive line height: roughly 1.5x font size
  const lineHeight = Math.round(fonts.md * 1.5);
  // Responsive margin between lines
  const marginBottom = Math.round(fonts.md * 0.2);

  return (
    <Animated.Text
      style={[
        styles.speechBubbleText,
        {
          opacity: animatedOpacity,
          fontSize: fonts.md,
          lineHeight,
          marginBottom,
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
    letterSpacing: 0.2,
    // lineHeight and marginBottom are now set dynamically based on font size
  },
  speechBubbleCursor: {
    fontWeight: 'bold',
  },
});

export default FadingLine;
