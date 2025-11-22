import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface LoadingDotsProps {
  color?: string;
  size?: number;
}

export function LoadingDots({ color = '#8b5cf6', size = 8 }: LoadingDotsProps) {
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
          outputRange: [0, -10],
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
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.dot,
          { backgroundColor: color, width: size, height: size, borderRadius: size / 2 },
          animateDot(dot1),
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          { backgroundColor: color, width: size, height: size, borderRadius: size / 2 },
          animateDot(dot2),
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          { backgroundColor: color, width: size, height: size, borderRadius: size / 2 },
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
    gap: 6,
  },
  dot: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
});
