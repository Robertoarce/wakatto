/**
 * CharacterCardPreview - Lightweight 2D character preview for cards
 *
 * This component provides a simple 2D representation of characters without
 * using WebGL, preventing the "too many contexts" error when displaying
 * many character cards.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CharacterBehavior } from '../config/characters';

interface CharacterCardPreviewProps {
  character: CharacterBehavior;
}

export function CharacterCardPreview({ character }: CharacterCardPreviewProps) {
  const { customization, model3D, color } = character;

  // Skin tone colors
  const skinToneColors = {
    light: '#f4c8a8',
    medium: '#d4a574',
    tan: '#c68642',
    dark: '#8d5524',
  };
  const skinColor = skinToneColors[customization.skinTone];

  const hasGlasses = customization.accessory === 'glasses';
  const hasTie = customization.accessory === 'tie';
  const hasHat = customization.accessory === 'hat';

  return (
    <View style={styles.container}>
      {/* Character silhouette */}
      <View style={styles.character}>
        {/* Head */}
        <View style={[styles.head, { backgroundColor: skinColor }]}>
          {/* Hair */}
          <View style={[
            styles.hair,
            customization.hair === 'long' && styles.hairLong,
            customization.hair === 'medium' && styles.hairMedium,
            { backgroundColor: customization.hairColor }
          ]} />

          {/* Hat */}
          {hasHat && (
            <View style={[styles.hat, { backgroundColor: model3D.accessoryColor }]} />
          )}

          {/* Eyes */}
          <View style={styles.eyes}>
            <View style={styles.eye} />
            <View style={styles.eye} />
          </View>

          {/* Glasses */}
          {hasGlasses && (
            <View style={styles.glasses}>
              <View style={styles.glassLens} />
              <View style={styles.glassBridge} />
              <View style={styles.glassLens} />
            </View>
          )}
        </View>

        {/* Body with Arms */}
        <View style={styles.bodyContainer}>
          {/* Left Arm */}
          <View style={[styles.leftArm, { backgroundColor: model3D.bodyColor }]} />

          {/* Body */}
          <View style={[styles.body, { backgroundColor: model3D.bodyColor }]}>
            {hasTie && (
              <View style={styles.tie} />
            )}
          </View>

          {/* Right Arm */}
          <View style={[styles.rightArm, { backgroundColor: model3D.bodyColor }]} />
        </View>

        {/* Legs */}
        <View style={styles.legs}>
          <View style={[styles.leg, { backgroundColor: model3D.bodyColor }]} />
          <View style={[styles.leg, { backgroundColor: model3D.bodyColor }]} />
        </View>
      </View>

      {/* Glow effect using character color */}
      <View style={[styles.glow, { backgroundColor: color, opacity: 0.1 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: '80%',
    height: '80%',
    borderRadius: 999,
  },
  character: {
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ scale: 0.7 }],
  },
  head: {
    width: 50,
    height: 50,
    borderRadius: 4,
    marginBottom: 5,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  hair: {
    position: 'absolute',
    top: -8,
    left: -2,
    right: -2,
    height: 12,
    backgroundColor: '#4a3f35',
    borderRadius: 2,
  },
  hairMedium: {
    height: 15,
    top: -10,
  },
  hairLong: {
    height: 20,
    top: -12,
    left: -5,
    right: -5,
  },
  hat: {
    position: 'absolute',
    top: -15,
    left: -5,
    right: -5,
    height: 20,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.3)',
  },
  eyes: {
    position: 'absolute',
    top: 15,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eye: {
    width: 8,
    height: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 1,
  },
  glasses: {
    position: 'absolute',
    top: 13,
    left: 5,
    right: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  glassLens: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#4a4a4a',
    backgroundColor: 'rgba(200,200,255,0.2)',
  },
  glassBridge: {
    width: 8,
    height: 2,
    backgroundColor: '#4a4a4a',
    marginHorizontal: 2,
  },
  bodyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  body: {
    width: 60,
    height: 70,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  tie: {
    position: 'absolute',
    top: 5,
    left: '50%',
    marginLeft: -6,
    width: 12,
    height: 45,
    backgroundColor: '#2c2c2c',
    borderRadius: 2,
  },
  leftArm: {
    width: 20,
    height: 60,
    borderRadius: 4,
    marginRight: 5,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  rightArm: {
    width: 20,
    height: 60,
    borderRadius: 4,
    marginLeft: 5,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  legs: {
    flexDirection: 'row',
    gap: 8,
  },
  leg: {
    width: 24,
    height: 50,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.2)',
  },
});
