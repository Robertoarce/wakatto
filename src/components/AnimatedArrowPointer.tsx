import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

// 2D Arrow Component pointing downward using simple View components
function Arrow2D() {
  return (
    <View style={styles.arrowWrapper}>
      {/* Arrow shaft */}
      <View style={styles.arrowShaft} />
      {/* Arrow head - triangle pointing down */}
      <View style={styles.arrowHead} />
    </View>
  );
}

interface AnimatedArrowPointerProps {
  visible: boolean;
  message?: string;
}

export function AnimatedArrowPointer({ visible, message = 'Add more characters!' }: AnimatedArrowPointerProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      // Bouncing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  const translateY = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 8],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      {/* Simple 2D Text Message */}
      <View style={styles.messageContainer}>
        <Text style={styles.messageText}>{message}</Text>
      </View>

      {/* 2D Arrow pointing down */}
      <Animated.View
        style={[
          styles.arrowContainer,
          {
            transform: [{ translateY }],
          },
        ]}
      >
        <Arrow2D />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 5,
    left: 10,
    zIndex: 1000,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  arrowWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  arrowShaft: {
    width: 4,
    height: 40,
    backgroundColor: '#f97316',
    borderRadius: 2,
  },
  arrowHead: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderTopWidth: 16,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#f97316',
    marginTop: -1,
  },
  arrowContainer: {
    width: 40,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageContainer: {
    backgroundColor: 'rgba(249, 115, 22, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  messageText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
