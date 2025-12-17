/**
 * AnimatedBubble - Single speech bubble with slide/fade animations
 * Supports sliding in from right, sliding left, and fading out
 */

import React, { useRef, useEffect, memo } from 'react';
import { Animated, Platform, View, Text, StyleSheet, Easing } from 'react-native';
import { useResponsive } from '../../../constants/Layout';
import { FadingLine } from './FadingLine';
import { wrapTextToLines, BUBBLE_ANIMATION_TIMING } from '../utils/bubbleQueueHelpers';
import { getLineOpacity } from '../utils/speechBubbleHelpers';

export type BubbleAnimationState = 'idle' | 'sliding_in' | 'sliding_left' | 'fading_out';

export interface BubbleState {
  id: string;
  text: string;
  position: 'left' | 'right';
  status: 'active' | 'reading' | 'transitioning' | 'fading';
}

interface AnimatedBubbleProps {
  bubble: BubbleState;
  characterName: string;
  characterColor: string;
  maxWidth: number;
  maxHeight: number;
  maxLines: number;
  maxChars: number;
  isTyping: boolean;
  animationState: BubbleAnimationState;
  onAnimationComplete?: (bubbleId: string, animation: BubbleAnimationState) => void;
  containerWidth: number;
}

export const AnimatedBubble = memo(function AnimatedBubble({
  bubble,
  characterName,
  characterColor,
  maxWidth,
  maxHeight,
  maxLines,
  maxChars,
  isTyping,
  animationState,
  onAnimationComplete,
  containerWidth,
}: AnimatedBubbleProps) {
  const { fonts } = useResponsive();

  // Animation values
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Track previous animation state
  const prevAnimationState = useRef<BubbleAnimationState>('idle');

  // Handle animation state changes
  useEffect(() => {
    if (animationState === prevAnimationState.current) return;

    const { SLIDE_DURATION, FADE_DURATION } = BUBBLE_ANIMATION_TIMING;

    switch (animationState) {
      case 'sliding_in':
        // Start off-screen to the right, slide in
        slideAnim.setValue(containerWidth);
        fadeAnim.setValue(1);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: SLIDE_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }).start(() => {
          onAnimationComplete?.(bubble.id, 'sliding_in');
        });
        break;

      case 'sliding_left':
        // Slide from right position to left position
        // Calculate the distance to slide (roughly half container width + gap)
        const slideDistance = -(maxWidth + 8); // width + gap
        Animated.timing(slideAnim, {
          toValue: slideDistance,
          duration: SLIDE_DURATION,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }).start(() => {
          onAnimationComplete?.(bubble.id, 'sliding_left');
        });
        break;

      case 'fading_out':
        // Fade out and slightly scale down
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: FADE_DURATION,
            easing: Easing.linear,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.95,
            duration: FADE_DURATION,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]).start(() => {
          onAnimationComplete?.(bubble.id, 'fading_out');
        });
        break;

      case 'idle':
        // Reset to default state
        slideAnim.setValue(0);
        fadeAnim.setValue(1);
        scaleAnim.setValue(1);
        break;
    }

    prevAnimationState.current = animationState;
  }, [animationState, slideAnim, fadeAnim, scaleAnim, containerWidth, maxWidth, bubble.id, onAnimationComplete]);

  // Cleanup animations on unmount
  useEffect(() => {
    return () => {
      slideAnim.stopAnimation();
      fadeAnim.stopAnimation();
      scaleAnim.stopAnimation();
    };
  }, [slideAnim, fadeAnim, scaleAnim]);

  // Wrap text and get visible lines
  const allLines = wrapTextToLines(bubble.text, maxChars);
  const visibleLines = allLines.slice(-maxLines);

  return (
    <Animated.View
      style={[
        styles.bubble,
        {
          maxWidth,
          maxHeight,
          borderColor: characterColor,
          opacity: fadeAnim,
          transform: [
            { translateX: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      {/* Character name */}
      <Text style={[styles.bubbleName, { color: characterColor, fontSize: fonts.lg }]}>
        {characterName}
      </Text>

      {/* Text lines with fading */}
      <View style={styles.linesContainer}>
        {visibleLines.map((line, index) => (
          <FadingLine
            key={`${bubble.id}-line-${index}`}
            text={line}
            opacity={getLineOpacity(index, visibleLines.length)}
            isLast={index === visibleLines.length - 1 && isTyping && bubble.status === 'active'}
            characterColor={characterColor}
          />
        ))}
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  bubble: {
    backgroundColor: 'rgba(30, 30, 40, 0.95)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 3,
    minWidth: 120,
    overflow: 'hidden',
  },
  bubbleName: {
    fontFamily: 'Inter-Bold',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  linesContainer: {
    flexDirection: 'column',
  },
});

export default AnimatedBubble;
