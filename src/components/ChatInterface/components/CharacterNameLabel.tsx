/**
 * CharacterNameLabel - Animated character name display
 * Shows character name with fade in/out animation
 * - Fast fade in on hover
 * - Slow fade out with delay when mouse leaves
 */

import React, { useRef, useEffect } from 'react';
import { Animated, Platform, Text, StyleSheet } from 'react-native';
import { useResponsive } from '../../../constants/Layout';

interface CharacterNameLabelProps {
  name: string;
  color: string;
  visible: boolean;
}

// Timing constants
const FADE_IN_DURATION = 150;    // Quick fade in for responsive feel
const FADE_OUT_DURATION = 1500;  // Slow 1.5s fade out

export function CharacterNameLabel({ name, color, visible }: CharacterNameLabelProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { fonts, spacing, isMobile } = useResponsive();

  useEffect(() => {
    // Stop any running animation
    fadeAnim.stopAnimation();

    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: visible ? FADE_IN_DURATION : FADE_OUT_DURATION,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [visible]);

  // Scale padding and border radius with screen size
  const paddingH = isMobile ? spacing.md : spacing.lg;
  const paddingV = isMobile ? spacing.xs : spacing.sm;
  const borderRadius = isMobile ? 8 : 12;

  return (
    <Animated.View style={[styles.characterNameLabel, { opacity: fadeAnim }]}>
      <Text style={[
        styles.characterNameText,
        {
          color,
          fontSize: fonts.xxxl || 24,
          paddingHorizontal: paddingH,
          paddingVertical: paddingV,
          borderRadius,
        }
      ]}>
        {name}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  characterNameLabel: {
    position: 'absolute',
    top: '15%', // Position right above the character's head
    // Center using left:50% + translateX(-50%) for reliable cross-platform centering
    left: '50%',
    pointerEvents: 'none',
    zIndex: 100,
    ...Platform.select({
      web: {
        transform: 'translateX(-50%)',
      },
      default: {
        // For native, use a fixed offset (adjust based on typical name length)
        transform: [{ translateX: -60 }],
      },
    }),
  },
  characterNameText: {
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    overflow: 'hidden',
    // paddingHorizontal, paddingVertical, borderRadius applied dynamically
    ...Platform.select({
      web: {
        textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
        whiteSpace: 'nowrap', // Ensure text doesn't wrap (web only)
      } as any,
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
      },
    }),
  },
});

export default CharacterNameLabel;
