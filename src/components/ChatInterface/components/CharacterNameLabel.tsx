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
    // Fade in/out based on hover state
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 150, // Quick fade for responsive hover feel
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [visible, fadeAnim]);

  return (
    <Animated.View style={[styles.characterNameLabel, { opacity: fadeAnim }]}>
      <Text style={[styles.characterNameText, { color, fontSize: fonts.xxxl || 24 }]}>
        {name}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  characterNameLabel: {
    position: 'absolute',
    top: '15%', // Position right above the character's head
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'none',
    zIndex: 100,
  },
  characterNameText: {
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
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
