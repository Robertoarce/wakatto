/**
 * AnimatedBubble - Single speech bubble with slide/fade animations
 * Supports sliding in from right, sliding left, and fading out
 */

import React, { useRef, useEffect, memo, useMemo } from 'react';
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
  const { fonts, spacing, borderRadius, components, isMobile } = useResponsive();

  // Scale character name font size based on screen
  const nameFontSize = isMobile ? fonts.md : fonts.lg;

  // Dynamic styles based on responsive values
  const dynamicStyles = useMemo(() => ({
    bubble: {
      backgroundColor: 'rgba(30, 30, 40, 0.95)',
      borderRadius: borderRadius.lg,
      padding: components.speechBubble.padding,
      borderWidth: components.speechBubble.borderWidth,
      minWidth: components.speechBubble.minWidth,
      overflow: 'hidden' as const,
    },
    bubbleName: {
      fontFamily: 'Inter-Bold',
      marginBottom: spacing.xs,
      letterSpacing: 0.5,
    },
    // Gap value for slide animation calculation
    bubbleGap: spacing.sm,
  }), [borderRadius, components, spacing]);

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
        const slideDistance = -(maxWidth + dynamicStyles.bubbleGap); // width + gap
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
  }, [animationState, slideAnim, fadeAnim, scaleAnim, containerWidth, maxWidth, bubble.id, onAnimationComplete, dynamicStyles.bubbleGap]);

  // Cleanup animations on unmount
  useEffect(() => {
    return () => {
      slideAnim.stopAnimation();
      fadeAnim.stopAnimation();
      scaleAnim.stopAnimation();
    };
  }, [slideAnim, fadeAnim, scaleAnim]);

  // Wrap text and get visible lines
  const visibleLines = wrapTextToLines(bubble.text, maxChars).slice(-maxLines);

  return (
    <Animated.View
      style={[
        dynamicStyles.bubble,
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
      <Text style={[dynamicStyles.bubbleName, { color: characterColor, fontSize: nameFontSize }]}>
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
  linesContainer: {
    flexDirection: 'column',
  },
});

export default AnimatedBubble;
