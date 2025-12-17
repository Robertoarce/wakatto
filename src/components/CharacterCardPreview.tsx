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

  const accessories = customization.accessories || [];
  const hasGlasses = accessories.includes('glasses');
  const hasTie = accessories.includes('tie');
  const hasHat = accessories.includes('hat');
  const hasScarf = accessories.includes('scarf');
  const hasBowtie = accessories.includes('bowtie');
  const hasCape = accessories.includes('cape');
  const hasCrown = accessories.includes('crown');
  const hasHeadphones = accessories.includes('headphones');
  const hasNecklace = accessories.includes('necklace');
  const hasSuspenders = accessories.includes('suspenders');
  const hasBackpack = accessories.includes('backpack');
  const hasWings = accessories.includes('wings');
  const hasDress = customization.clothing === 'dress';
  const hasJacket = customization.clothing === 'jacket';
  const hasHoodie = customization.clothing === 'hoodie';
  const hasVest = customization.clothing === 'vest';
  const hasApron = customization.clothing === 'apron';
  const hasLabcoat = customization.clothing === 'labcoat';

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

          {/* Crown */}
          {hasCrown && (
            <View style={styles.crown}>
              <View style={[styles.crownBase, { backgroundColor: '#c9a227' }]} />
              <View style={styles.crownPoints}>
                <View style={[styles.crownPoint, { backgroundColor: '#c9a227' }]} />
                <View style={[styles.crownPointTall, { backgroundColor: '#c9a227' }]} />
                <View style={[styles.crownPoint, { backgroundColor: '#c9a227' }]} />
              </View>
              <View style={[styles.crownJewel, { backgroundColor: '#e91e63' }]} />
            </View>
          )}

          {/* Headphones */}
          {hasHeadphones && (
            <View style={styles.headphones}>
              <View style={[styles.headphoneBand, { backgroundColor: model3D.accessoryColor }]} />
              <View style={[styles.headphoneLeft, { backgroundColor: model3D.accessoryColor }]} />
              <View style={[styles.headphoneRight, { backgroundColor: model3D.accessoryColor }]} />
            </View>
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
          {/* Cape (behind body) */}
          {hasCape && (
            <View style={[styles.cape, { backgroundColor: model3D.accessoryColor }]} />
          )}

          {/* Wings (behind body) */}
          {hasWings && (
            <>
              <View style={[styles.wingLeft, { backgroundColor: model3D.accessoryColor }]} />
              <View style={[styles.wingRight, { backgroundColor: model3D.accessoryColor }]} />
            </>
          )}

          {/* Backpack (behind body) */}
          {hasBackpack && (
            <View style={[styles.backpack, { backgroundColor: model3D.accessoryColor }]} />
          )}

          {/* Left Arm */}
          <View style={[styles.leftArm, { 
            backgroundColor: (hasJacket || hasHoodie || hasLabcoat) ? model3D.accessoryColor : 
                            hasLabcoat ? '#ffffff' : model3D.bodyColor 
          }]} />

          {/* Body */}
          <View style={[
            styles.body,
            hasDress && styles.dressBody,
            hasLabcoat && styles.labcoatBody,
            { backgroundColor: 
              hasDress || hasJacket || hasHoodie || hasVest ? model3D.accessoryColor : 
              hasLabcoat ? '#ffffff' : 
              model3D.bodyColor 
            }
          ]}>
            {hasTie && (
              <View style={styles.tie} />
            )}
            {hasBowtie && (
              <View style={styles.bowtie}>
                <View style={[styles.bowtieWing, { backgroundColor: model3D.accessoryColor }]} />
                <View style={[styles.bowtieKnot, { backgroundColor: model3D.accessoryColor }]} />
                <View style={[styles.bowtieWing, { backgroundColor: model3D.accessoryColor }]} />
              </View>
            )}
            {hasScarf && (
              <>
                <View style={[styles.scarfWrap, { backgroundColor: model3D.accessoryColor }]} />
                <View style={[styles.scarfHang, { backgroundColor: model3D.accessoryColor }]} />
              </>
            )}
            {hasNecklace && (
              <>
                <View style={styles.necklaceChain} />
                <View style={[styles.necklacePendant, { backgroundColor: model3D.accessoryColor }]} />
              </>
            )}
            {hasSuspenders && (
              <>
                <View style={[styles.suspenderLeft, { backgroundColor: model3D.accessoryColor }]} />
                <View style={[styles.suspenderRight, { backgroundColor: model3D.accessoryColor }]} />
              </>
            )}
            {hasJacket && (
              <>
                <View style={styles.jacketShirt} />
                <View style={[styles.jacketLapelLeft, { backgroundColor: model3D.accessoryColor }]} />
                <View style={[styles.jacketLapelRight, { backgroundColor: model3D.accessoryColor }]} />
              </>
            )}
            {hasDress && (
              <View style={styles.dressRibbon} />
            )}
            {hasHoodie && (
              <>
                <View style={[styles.hoodiePocket, { backgroundColor: model3D.accessoryColor }]} />
                <View style={styles.hoodieDrawstringLeft} />
                <View style={styles.hoodieDrawstringRight} />
              </>
            )}
            {hasVest && (
              <>
                <View style={styles.vestShirt} />
                <View style={[styles.vestButton, { top: 15 }]} />
                <View style={[styles.vestButton, { top: 28 }]} />
              </>
            )}
            {hasApron && (
              <>
                <View style={[styles.apronBib, { backgroundColor: model3D.accessoryColor }]} />
                <View style={[styles.apronPocket, { backgroundColor: model3D.accessoryColor }]} />
              </>
            )}
            {hasLabcoat && (
              <>
                <View style={styles.labcoatLapelLeft} />
                <View style={styles.labcoatLapelRight} />
                <View style={styles.labcoatPocket} />
              </>
            )}
          </View>

          {/* Right Arm */}
          <View style={[styles.rightArm, { 
            backgroundColor: (hasJacket || hasHoodie || hasLabcoat) ? model3D.accessoryColor : 
                            hasLabcoat ? '#ffffff' : model3D.bodyColor 
          }]} />
        </View>

        {/* Hoodie Hood (behind head) */}
        {hasHoodie && (
          <View style={[styles.hoodieHood, { backgroundColor: model3D.accessoryColor }]} />
        )}

        {/* Dress Skirt (below body) */}
        {hasDress && (
          <View style={[styles.dressSkirt, { backgroundColor: model3D.accessoryColor }]} />
        )}

        {/* Apron Skirt (below body) */}
        {hasApron && (
          <View style={[styles.apronSkirt, { backgroundColor: model3D.accessoryColor }]} />
        )}

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
  bowtie: {
    position: 'absolute',
    top: 3,
    left: '50%',
    marginLeft: -15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bowtieWing: {
    width: 12,
    height: 8,
    borderRadius: 2,
  },
  bowtieKnot: {
    width: 6,
    height: 6,
    borderRadius: 1,
    marginHorizontal: -1,
    zIndex: 1,
  },
  scarfWrap: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    height: 12,
    borderRadius: 3,
  },
  scarfHang: {
    position: 'absolute',
    top: 5,
    left: 8,
    width: 10,
    height: 40,
    borderRadius: 2,
  },
  cape: {
    position: 'absolute',
    top: -10,
    left: -15,
    width: 90,
    height: 85,
    backgroundColor: '#4a0000',
    borderRadius: 4,
    zIndex: -1,
  },
  dressBody: {
    height: 50,
  },
  dressSkirt: {
    width: 75,
    height: 35,
    borderRadius: 4,
    marginTop: -10,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  dressRibbon: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    right: 5,
    height: 6,
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  jacketShirt: {
    position: 'absolute',
    top: 5,
    left: '50%',
    marginLeft: -8,
    width: 16,
    height: 30,
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  jacketLapelLeft: {
    position: 'absolute',
    top: 3,
    left: 8,
    width: 12,
    height: 25,
    borderRadius: 2,
    transform: [{ rotate: '15deg' }],
  },
  jacketLapelRight: {
    position: 'absolute',
    top: 3,
    right: 8,
    width: 12,
    height: 25,
    borderRadius: 2,
    transform: [{ rotate: '-15deg' }],
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
  // Crown styles
  crown: {
    position: 'absolute',
    top: -20,
    left: -2,
    right: -2,
  },
  crownBase: {
    height: 8,
    borderRadius: 2,
  },
  crownPoints: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -2,
    paddingHorizontal: 5,
  },
  crownPoint: {
    width: 8,
    height: 10,
    borderRadius: 1,
  },
  crownPointTall: {
    width: 10,
    height: 14,
    borderRadius: 1,
    marginTop: -4,
  },
  crownJewel: {
    position: 'absolute',
    bottom: 2,
    left: '50%',
    marginLeft: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  // Headphones styles
  headphones: {
    position: 'absolute',
    top: -8,
    left: -10,
    right: -10,
  },
  headphoneBand: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 5,
  },
  headphoneLeft: {
    position: 'absolute',
    left: 0,
    top: 4,
    width: 12,
    height: 16,
    borderRadius: 3,
  },
  headphoneRight: {
    position: 'absolute',
    right: 0,
    top: 4,
    width: 12,
    height: 16,
    borderRadius: 3,
  },
  // Wings styles
  wingLeft: {
    position: 'absolute',
    left: -30,
    top: -5,
    width: 35,
    height: 60,
    borderRadius: 15,
    transform: [{ rotate: '-15deg' }],
    zIndex: -1,
    opacity: 0.9,
  },
  wingRight: {
    position: 'absolute',
    right: -30,
    top: -5,
    width: 35,
    height: 60,
    borderRadius: 15,
    transform: [{ rotate: '15deg' }],
    zIndex: -1,
    opacity: 0.9,
  },
  // Backpack styles
  backpack: {
    position: 'absolute',
    top: -5,
    left: 5,
    width: 50,
    height: 55,
    borderRadius: 4,
    zIndex: -1,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  // Necklace styles
  necklaceChain: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -15,
    width: 30,
    height: 15,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: '#c9a227',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  necklacePendant: {
    position: 'absolute',
    top: 12,
    left: '50%',
    marginLeft: -5,
    width: 10,
    height: 12,
    borderRadius: 2,
  },
  // Suspenders styles
  suspenderLeft: {
    position: 'absolute',
    top: 0,
    left: 10,
    width: 6,
    height: 65,
    borderRadius: 2,
  },
  suspenderRight: {
    position: 'absolute',
    top: 0,
    right: 10,
    width: 6,
    height: 65,
    borderRadius: 2,
  },
  // Hoodie styles
  hoodiePocket: {
    position: 'absolute',
    bottom: 10,
    left: '50%',
    marginLeft: -18,
    width: 36,
    height: 15,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  hoodieDrawstringLeft: {
    position: 'absolute',
    top: 3,
    left: 18,
    width: 3,
    height: 20,
    backgroundColor: '#ffffff',
    borderRadius: 1,
  },
  hoodieDrawstringRight: {
    position: 'absolute',
    top: 3,
    right: 18,
    width: 3,
    height: 20,
    backgroundColor: '#ffffff',
    borderRadius: 1,
  },
  hoodieHood: {
    position: 'absolute',
    top: 20,
    left: 15,
    width: 40,
    height: 25,
    borderRadius: 4,
    zIndex: -1,
  },
  // Vest styles
  vestShirt: {
    position: 'absolute',
    top: 5,
    left: '50%',
    marginLeft: -10,
    width: 20,
    height: 55,
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  vestButton: {
    position: 'absolute',
    left: 8,
    width: 5,
    height: 5,
    backgroundColor: '#c9a227',
    borderRadius: 2,
  },
  // Apron styles
  apronBib: {
    position: 'absolute',
    top: 5,
    left: '50%',
    marginLeft: -18,
    width: 36,
    height: 30,
    borderRadius: 2,
  },
  apronPocket: {
    position: 'absolute',
    top: 30,
    left: '50%',
    marginLeft: -12,
    width: 24,
    height: 12,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  apronSkirt: {
    width: 55,
    height: 30,
    borderRadius: 4,
    marginTop: -10,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  // Lab coat styles
  labcoatBody: {
    height: 80,
  },
  labcoatLapelLeft: {
    position: 'absolute',
    top: 3,
    left: 8,
    width: 14,
    height: 20,
    backgroundColor: '#ffffff',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    transform: [{ rotate: '10deg' }],
  },
  labcoatLapelRight: {
    position: 'absolute',
    top: 3,
    right: 8,
    width: 14,
    height: 20,
    backgroundColor: '#ffffff',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    transform: [{ rotate: '-10deg' }],
  },
  labcoatPocket: {
    position: 'absolute',
    top: 25,
    left: 8,
    width: 15,
    height: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
});
