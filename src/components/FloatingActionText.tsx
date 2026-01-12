/**
 * FloatingActionText - Displays *action* text at the sides of a character
 *
 * Shows action text (like *chuckles*, *sighs*) floating near the character's head,
 * alternating between left (-50deg) and right (50deg) sides.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, StyleSheet, Platform } from 'react-native';
import { useResponsive } from '../constants/Layout';

interface FloatingActionTextProps {
  actions: string[]; // Array of action texts like ["*chuckles*", "*winks*"]
  characterColor: string;
  isVisible: boolean;
}

export function FloatingActionText({
  actions,
  characterColor,
  isVisible,
}: FloatingActionTextProps) {

  const { width: screenWidth } = useResponsive();
  const [displayState, setDisplayState] = useState<{
    text: string;
    isLeft: boolean;
    rotation: number; // -30 or 30
    show: boolean;
  }>({ text: actions[0] || '', isLeft: true, rotation: -30, show: false });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const indexRef = useRef(0);
  const positionRef = useRef(0); // 0: -30deg, 1: +30deg (both on left side)
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cycleCountRef = useRef(0); // Track number of cycles
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fontSize = Math.max(16, Math.min(24, screenWidth * 0.018));

  useEffect(() => {
    if (!isVisible || actions.length === 0) {
      fadeAnim.setValue(0);
      return;
    }

    const showNextAction = () => {
      // Stop after 5 cycles
      if (cycleCountRef.current >= 5) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        fadeAnim.setValue(0);
        return;
      }

      const currentAction = actions[indexRef.current % actions.length];
      // Position cycle: 0=-30deg, 1=+30deg, random left/right side
      const pos = positionRef.current;
      const rotation = pos === 0 ? -30 : 30;
      const isLeft = Math.random() > 0.5; // Random side each time

      // Count words (strip asterisks first)
      const wordCount = currentAction.replace(/\*/g, '').trim().split(/\s+/).length;
      const displayTime = wordCount > 2 ? 400 : 200; // Double time for longer actions

      // Increment cycle count
      cycleCountRef.current++;

      setDisplayState({
        text: currentAction,
        isLeft,
        rotation,
        show: true,
      });

      // Fade in (fast)
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: Platform.OS !== 'web',
      }).start();

      // Fade out after delay (longer for multi-word actions)
      timerRef.current = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: Platform.OS !== 'web',
        }).start(() => {
          // Advance position (2 positions per action: -30deg then +30deg)
          positionRef.current = (positionRef.current + 1) % 2;
          // Move to next action after completing both positions
          if (positionRef.current === 0) {
            indexRef.current = (indexRef.current + 1) % actions.length;
          }
        });
      }, displayTime); // Show longer for multi-word actions
    };

    // Reset cycle count for new actions
    cycleCountRef.current = 0;

    // Start animation cycle
    showNextAction();
    intervalRef.current = setInterval(showNextAction, 650);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isVisible, actions.length]); // Only depend on length, not the array itself

  if (!isVisible || actions.length === 0) return null;

  const rotation = `${displayState.rotation}deg`;
  // Use percentage positioning - character is centered at ~50% of container
  // Position close to character: ~35% for left, ~55% for right
  const horizontalPosition = displayState.isLeft
    ? { left: '15%' }  // Left side of character
    : { left: '48%' }; // Right side of character

  return (
    <Animated.View
      style={[
        styles.container,
        horizontalPosition,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      <Text
        style={[
          styles.actionText,
          {
            fontSize,
            color: characterColor,
            ...Platform.select({
              web: {
                transform: `rotate(${rotation})`,
                display: 'inline-block',
              } as any,
              default: {},
            }),
          },
        ]}
      >
        {displayState.text}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '25%', // Around lower head level
    zIndex: 150,
    pointerEvents: 'none',
  },
  actionText: {
    fontFamily: 'Inter-Bold',
    fontStyle: 'italic',
    ...Platform.select({
      web: {
        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.9)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.9)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
      },
    }),
  },
});

export default FloatingActionText;
