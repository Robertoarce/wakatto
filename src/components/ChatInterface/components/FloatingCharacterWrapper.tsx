/**
 * FloatingCharacterWrapper - Character entrance animations + floating/hover effects
 * Handles multiple entrance animation types (drop_from_sky, slide_in, bounce_in, etc.)
 */

import React, { useState, useRef, useEffect } from 'react';
import { Animated, Platform, View, Text, StyleSheet, Easing } from 'react-native';
import { useResponsive } from '../../../constants/Layout';
import { EntranceConfig } from '../../../services/entranceAnimations';

interface FloatingCharacterWrapperProps {
  children: React.ReactNode;
  index: number;
  style?: any;
  characterName: string;
  characterColor: string;
  entranceAnimation?: boolean;
  entranceKey?: number;
  isLeftSide?: boolean;
  lastMessage?: string;
  entranceConfig?: EntranceConfig;
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
  lastMessage,
  entranceConfig,
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
  const { fonts } = useResponsive();

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

  // Handle hover animation
  useEffect(() => {
    Animated.timing(hoverAnim, {
      toValue: isHovered ? 1 : 0,
      duration: 200,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [isHovered]);

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

  // Interpolate values
  const floatTranslateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8], // Float up 8 pixels
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

  const nameOpacity = hoverAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const nameTranslateY = hoverAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 0], // Slide down from above
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
        },
      ]}
      // @ts-ignore - web-specific props
      onMouseDown={() => setIsHovered(true)}
      onMouseUp={() => setIsHovered(false)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      {/* Click-and-hold tooltip - shows last message if available */}
      {lastMessage && (
        <Animated.View
          style={[
            styles.hoverMessageContainer,
            {
              opacity: nameOpacity,
              transform: [{ translateY: nameTranslateY }],
              pointerEvents: 'none',
            }
          ]}
        >
          <View style={[styles.hoverMessageBubble, { borderColor: characterColor }]}>
            <Text style={[styles.hoverMessageName, { color: characterColor, fontSize: fonts.sm }]}>{characterName}</Text>
            <Text style={[styles.hoverMessageText, { fontSize: fonts.sm }]} numberOfLines={4}>
              {lastMessage}
            </Text>
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hoverMessageContainer: {
    position: 'absolute',
    bottom: '100%',
    left: -50,
    right: -50,
    alignItems: 'center',
    zIndex: 1000,
  },
  hoverMessageBubble: {
    backgroundColor: 'rgba(30, 30, 40, 0.95)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    maxWidth: 280,
    // Web shadow
    ...(Platform.OS === 'web' && {
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    }),
    // Native shadow
    ...(Platform.OS !== 'web' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
    }),
  },
  hoverMessageName: {
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  hoverMessageText: {
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
  },
});

export default FloatingCharacterWrapper;
