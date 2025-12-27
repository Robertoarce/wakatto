/**
 * FloatingCharacterWrapper - Character entrance animations + floating/hover effects
 * Handles multiple entrance animation types (drop_from_sky, slide_in, bounce_in, etc.)
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Animated, Platform, View, Text, StyleSheet, Easing } from 'react-native';
import { useResponsive } from '../../../constants/Layout';
import { EntranceConfig } from '../../../services/entranceAnimations';
import { memDebug } from '../../../services/performanceLogger';

interface FloatingCharacterWrapperProps {
  children: React.ReactNode;
  index: number;
  style?: any;
  characterName: string;
  characterColor: string;
  entranceAnimation?: boolean;
  entranceKey?: number;
  isLeftSide?: boolean;
  entranceConfig?: EntranceConfig;
  onHoverChange?: (isHovered: boolean) => void;
  actionText?: string; // Comic-style action text like "slams hand on table"
}

export function FloatingCharacterWrapper({
  children,
  index,
  style,
  characterName,
  characterColor,
  entranceAnimation = false,
  entranceKey = 0,
  isLeftSide = false,
  entranceConfig,
  onHoverChange,
  actionText,
}: FloatingCharacterWrapperProps) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const hoverAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  // Additional animation values for varied entrance types
  const verticalAnim = useRef(new Animated.Value(0)).current;  // For drop_from_sky
  const scaleAnim = useRef(new Animated.Value(1)).current;     // For grow_in, spin_in
  const entranceRotateAnim = useRef(new Animated.Value(0)).current;  // For spin_in
  const opacityAnim = useRef(new Animated.Value(1)).current;   // For teleport_in
  const [isHovered, setIsHovered] = useState(false);
  const { fonts, spacing, borderRadius, components, scalePx } = useResponsive();

  // Dynamic styles based on responsive values
  const dynamicStyles = useMemo(() => ({
    actionTextContainer: {
      position: 'absolute' as const,
      top: scalePx(-30),
      left: '50%' as any, // Percentage positioning
      transform: [{ translateX: scalePx(-60) }],
      alignItems: 'center' as const,
      zIndex: 700,
      pointerEvents: 'none' as const,
    },
    actionText: {
      fontFamily: 'Inter-Bold',
      fontSize: fonts.md,
      fontStyle: 'italic' as const,
      textShadowColor: 'rgba(0, 0, 0, 0.9)',
      textShadowOffset: { width: 2, height: 2 },
      textShadowRadius: scalePx(4),
      maxWidth: scalePx(150),
      textAlign: 'center' as const,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
    },
    nameTag: {
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
      borderLeftWidth: components.speechBubble.borderWidth,
    },
    nameTagText: {
      color: '#ffffff',
      fontSize: fonts.xxl,
      fontWeight: '600' as const,
    },
  }), [fonts, spacing, borderRadius, components, scalePx]);

  // Track mount/unmount for memory debugging
  useEffect(() => {
    memDebug.trackMount(`FloatingCharacter:${characterName}`);
    console.log(`[FLOAT-DEBUG] 🎈 FloatingCharacterWrapper MOUNTED: ${characterName}`);

    return () => {
      memDebug.trackUnmount(`FloatingCharacter:${characterName}`);
      console.log(`[FLOAT-DEBUG] 🎈 FloatingCharacterWrapper UNMOUNTED: ${characterName}`);
    };
  }, [characterName]);

  useEffect(() => {
    // Different durations for different rhythms (2.5s to 4s based on index)
    const floatDuration = 2500 + (index * 400) + (Math.random() * 500);
    const rotateDuration = 3000 + (index * 500) + (Math.random() * 700);

    // Floating animation (up and down)
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: floatDuration,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: floatDuration,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );

    // Rotation animation (slight pivot)
    const rotateAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: rotateDuration,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(rotateAnim, {
          toValue: -1,
          duration: rotateDuration * 2,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: rotateDuration,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );

    floatAnimation.start();
    rotateAnimation.start();

    return () => {
      floatAnimation.stop();
      rotateAnimation.stop();
    };
  }, [index]);

  // Handle hover animation and notify parent (for name label)
  useEffect(() => {
    Animated.timing(hoverAnim, {
      toValue: isHovered ? 1 : 0,
      duration: 200,
      useNativeDriver: Platform.OS !== 'web',
    }).start();

    // Notify parent of hover change (for showing character name)
    onHoverChange?.(isHovered);
  }, [isHovered, onHoverChange]);

  // Handle mouse leave
  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // Handle entrance animation - varied types based on entranceConfig
  useEffect(() => {
    if (entranceAnimation && entranceKey > 0) {
      const entranceType = entranceConfig?.type || 'slide_in';
      const duration = entranceConfig?.duration || 800;
      const startDelay = entranceConfig?.startDelay || 0;

      // Reset all animation values
      slideAnim.setValue(0);
      verticalAnim.setValue(0);
      scaleAnim.setValue(1);
      entranceRotateAnim.setValue(0);
      opacityAnim.setValue(1);

      // Delay start based on character position in sequence
      const startTimer = setTimeout(() => {
        switch (entranceType) {
          case 'drop_from_sky':
            // Start from above, animate down with bounce
            verticalAnim.setValue(-400);
            Animated.spring(verticalAnim, {
              toValue: 0,
              tension: 40,
              friction: 7,
              useNativeDriver: Platform.OS !== 'web',
            }).start();
            break;

          case 'slide_in':
            // Current behavior - slide in from left/right
            const startPosition = isLeftSide ? -300 : 300;
            slideAnim.setValue(startPosition);
            Animated.timing(slideAnim, {
              toValue: 0,
              duration,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: Platform.OS !== 'web',
            }).start();
            break;

          case 'bounce_in':
            // Bounce in from side with spring physics
            const bounceStart = isLeftSide ? -300 : 300;
            slideAnim.setValue(bounceStart);
            Animated.spring(slideAnim, {
              toValue: 0,
              tension: 80,
              friction: 6,
              useNativeDriver: Platform.OS !== 'web',
            }).start();
            break;

          case 'grow_in':
            // Start small, grow to full size
            scaleAnim.setValue(0);
            opacityAnim.setValue(0);
            Animated.parallel([
              Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: Platform.OS !== 'web',
              }),
              Animated.timing(opacityAnim, {
                toValue: 1,
                duration: duration * 0.4,
                useNativeDriver: Platform.OS !== 'web',
              }),
            ]).start();
            break;

          case 'spin_in':
            // Spin in while appearing
            entranceRotateAnim.setValue(0);
            scaleAnim.setValue(0);
            opacityAnim.setValue(0);
            Animated.parallel([
              Animated.timing(entranceRotateAnim, {
                toValue: 1,
                duration,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: Platform.OS !== 'web',
              }),
              Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: Platform.OS !== 'web',
              }),
              Animated.timing(opacityAnim, {
                toValue: 1,
                duration: duration * 0.5,
                useNativeDriver: Platform.OS !== 'web',
              }),
            ]).start();
            break;

          case 'teleport_in':
            // Materialize with fade and slight scale pulse
            opacityAnim.setValue(0);
            scaleAnim.setValue(1.2);
            Animated.parallel([
              Animated.timing(opacityAnim, {
                toValue: 1,
                duration: duration * 0.6,
                useNativeDriver: Platform.OS !== 'web',
              }),
              Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 100,
                friction: 10,
                useNativeDriver: Platform.OS !== 'web',
              }),
            ]).start();
            break;

          default:
            // Fallback to slide_in
            const defaultStart = isLeftSide ? -300 : 300;
            slideAnim.setValue(defaultStart);
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 800,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: Platform.OS !== 'web',
            }).start();
        }
      }, startDelay);

      return () => clearTimeout(startTimer);
    }
  }, [entranceKey, entranceAnimation, isLeftSide, entranceConfig]);

  // Interpolate values using responsive animation offsets
  const floatTranslateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -components.animationOffsets.float], // Float up (responsive)
  });

  const rotateZ = rotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-3deg', '0deg', '3deg'], // Pivot up to 3 degrees
  });

  // Spin rotation for spin_in entrance
  const spinRotation = entranceRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Combine vertical animations using Animated.add
  const combinedTranslateY = Animated.add(floatTranslateY, verticalAnim);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: opacityAnim, // For teleport_in and grow_in
          transform: [
            ...(style?.transform || []),
            { translateX: slideAnim }, // Entrance slide animation
            { translateY: combinedTranslateY }, // Float + drop_from_sky
            { scale: scaleAnim }, // For grow_in, spin_in, teleport_in
            { rotate: spinRotation }, // For spin_in
            { rotateZ }, // Idle pivot animation
          ],
          // Disable pointer events on outer wrapper - use inner hitbox instead
          pointerEvents: 'box-none',
          overflow: 'visible', // Allow character to overflow wrapper bounds
        },
      ]}
    >
      {/* Inner hitbox for hover - narrower than wrapper to prevent overlap issues */}
      <View
        style={styles.characterHitbox}
        // @ts-ignore - web-specific props
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </View>

      {/* Comic-style action text overlay */}
      {actionText && (
        <View style={dynamicStyles.actionTextContainer}>
          <Text style={[dynamicStyles.actionText, { color: characterColor }]}>
            *{actionText}*
          </Text>
        </View>
      )}

      {/* Character name label on hover */}
      {isHovered && (
        <Animated.View
          style={[
            styles.nameTagContainer,
            {
              opacity: hoverAnim,
              transform: [
                { translateY: hoverAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [components.speechBubble.tailSize, 0],
                }) },
              ],
            }
          ]}
        >
          <View style={[dynamicStyles.nameTag, { borderLeftColor: characterColor }]}>
            <Text style={dynamicStyles.nameTagText}>{characterName}</Text>
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  characterHitbox: {
    // Centered hitbox that's narrower than wrapper to prevent overlap with adjacent characters
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    // Limit width to prevent overlap - characters should have their own hover zones
    width: '70%',
    alignSelf: 'center',
    overflow: 'visible', // Allow character to overflow hitbox bounds
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
      default: {},
    }),
  },
  nameTagContainer: {
    position: 'absolute',
    top: '55%', // Chest level (percentage-based)
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 800,
    pointerEvents: 'none',
  },
});

export default FloatingCharacterWrapper;
