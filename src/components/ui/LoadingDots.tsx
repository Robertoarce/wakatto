import React, { useRef, useEffect, useMemo } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import { useResponsive } from '../../constants/Layout';

interface LoadingDotsProps {
  color?: string;
  size?: number;
}

export function LoadingDots({ color = '#8b5cf6', size }: LoadingDotsProps) {
  const { spacing, scalePx, components } = useResponsive();
  const dotSize = size ?? scalePx(8);
  const bounceOffset = components.animationOffsets.float;

  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.spring(animValue, {
            toValue: 1,
            tension: 100,
            friction: 3,
            useNativeDriver: true,
          }),
          Animated.spring(animValue, {
            toValue: 0,
            tension: 100,
            friction: 3,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animations = Animated.parallel([
      createAnimation(dot1, 0),
      createAnimation(dot2, 200),
      createAnimation(dot3, 400),
    ]);

    animations.start();

    return () => animations.stop();
  }, []);

  const animateDot = (animValue: Animated.Value) => ({
    transform: [
      {
        translateY: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -bounceOffset],
        }),
      },
      {
        scale: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.2],
        }),
      },
    ],
    opacity: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 1],
    }),
  });

  return (
    <View style={[styles.container, { gap: spacing.sm }]}>
      <Animated.View
        style={[
          styles.dot,
          { backgroundColor: color, width: dotSize, height: dotSize, borderRadius: dotSize / 2 },
          animateDot(dot1),
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          { backgroundColor: color, width: dotSize, height: dotSize, borderRadius: dotSize / 2 },
          animateDot(dot2),
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          { backgroundColor: color, width: dotSize, height: dotSize, borderRadius: dotSize / 2 },
          animateDot(dot3),
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
});
