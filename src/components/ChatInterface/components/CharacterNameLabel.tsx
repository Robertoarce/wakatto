/**
 * CharacterNameLabel - Animated character name display
 * Shows character name with fade in/out animation
 */

import React, { useRef, useEffect } from 'react';
import { Animated, Platform, Text, StyleSheet } from 'react-native';
import { useResponsive } from '../../../constants/Layout';

interface CharacterNameLabelProps {
  name: string;
  color: string;
  visible: boolean;
}

export function CharacterNameLabel({ name, color, visible }: CharacterNameLabelProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { fonts } = useResponsive();

  useEffect(() => {
    let fadeOutTimer: NodeJS.Timeout | null = null;

    if (visible) {
      // Fade in quickly
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }).start();

      // Then fade out slowly after 2 seconds (3 second fade duration)
      fadeOutTimer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: Platform.OS !== 'web',
        }).start();
      }, 2000);
    }

    return () => {
      if (fadeOutTimer) {
        clearTimeout(fadeOutTimer);
      }
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.characterNameLabel, { opacity: fadeAnim }]}>
      <Text style={[styles.characterNameText, { color, fontSize: fonts.lg }]}>
        {name}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  characterNameLabel: {
    position: 'absolute',
    bottom: 5, // Position near the bottom of the character wrapper (above the edge)
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'none',
    zIndex: 100,
  },
  characterNameText: {
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
      },
    }),
  },
});

export default CharacterNameLabel;
