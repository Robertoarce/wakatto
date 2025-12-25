import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { useResponsive } from '../constants/Layout';

// useNativeDriver is not fully supported on web
const useNativeDriver = Platform.OS !== 'web';

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
  const { fonts, spacing, borderRadius, scalePx, components } = useResponsive();

  const dynamicStyles = useMemo(() => ({
    container: {
      top: spacing.xs,
      left: spacing.md,
    },
    arrowShaft: {
      width: scalePx(4),
      height: scalePx(40),
      borderRadius: scalePx(2),
    },
    arrowHead: {
      borderLeftWidth: scalePx(12),
      borderRightWidth: scalePx(12),
      borderTopWidth: scalePx(16),
    },
    arrowContainer: {
      width: scalePx(40),
      height: scalePx(60),
    },
    messageContainer: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.sm,
      marginBottom: spacing.xs,
    },
    messageText: {
      fontSize: fonts.xs,
    },
    bounceOffset: scalePx(8),
  }), [fonts, spacing, borderRadius, scalePx, components]);

  useEffect(() => {
    if (visible) {
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver,
      }).start();

      // Bouncing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver,
          }),
        ])
      ).start();
    } else {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  const translateY = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, dynamicStyles.bounceOffset],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        dynamicStyles.container,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      {/* Simple 2D Text Message */}
      <View style={[styles.messageContainer, dynamicStyles.messageContainer]}>
        <Text style={[styles.messageText, dynamicStyles.messageText]}>{message}</Text>
      </View>

      {/* 2D Arrow pointing down */}
      <Animated.View
        style={[
          styles.arrowContainer,
          dynamicStyles.arrowContainer,
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
    zIndex: 1000,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  arrowWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  arrowShaft: {
    backgroundColor: '#f97316',
  },
  arrowHead: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#f97316',
    marginTop: -1,
  },
  arrowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageContainer: {
    backgroundColor: 'rgba(249, 115, 22, 0.95)',
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
        elevation: 5,
      },
    }),
  },
  messageText: {
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
  },
});
