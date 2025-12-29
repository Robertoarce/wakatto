import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { useResponsive } from '../../constants/Layout';

interface StorySpeechBubbleProps {
  message: string;
  characterName: string;
  characterColor?: string;
  visible: boolean;
  onDismiss?: () => void;
  duration?: number;
}

// Helper to convert hex color to rgba
function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function StorySpeechBubble({
  message,
  characterName,
  characterColor = '#8b5cf6',
  visible,
  onDismiss,
  duration = 5000,
}: StorySpeechBubbleProps) {
  const { fonts, spacing, borderRadius, scalePx } = useResponsive();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  const dynamicStyles = useMemo(() => ({
    wrapper: {
      top: scalePx(12),
    },
    bubble: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      paddingTop: spacing.xs,
      borderRadius: borderRadius.md,
    },
    characterName: {
      fontSize: fonts.xs,
    },
    message: {
      fontSize: fonts.sm,
      lineHeight: fonts.sm * 1.4,
    },
  }), [fonts, spacing, borderRadius, scalePx]);

  useEffect(() => {
    if (visible) {
      // Reset animation values first
      translateY.setValue(-100);
      opacity.setValue(0);
      scale.setValue(0.8);

      // Show animation with bounce
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onDismiss) onDismiss();
    });
  };

  if (!visible) return null;

  const bgColor = hexToRgba(characterColor, 0.95);
  const borderColor = characterColor;

  return (
    <View style={[styles.wrapper, dynamicStyles.wrapper]} pointerEvents="none">
      <Animated.View
        style={[
          styles.bubble,
          dynamicStyles.bubble,
          {
            backgroundColor: bgColor,
            borderColor: borderColor,
            transform: [
              { translateY },
              { scale },
            ],
            opacity,
          },
        ]}
      >
        {/* Character name label */}
        <Text style={[styles.characterName, dynamicStyles.characterName]}>
          {characterName}
        </Text>

        {/* Speech bubble message */}
        <Text style={[styles.message, dynamicStyles.message]}>
          "{message}"
        </Text>

        {/* Speech bubble tail */}
        <View style={[styles.tail, { borderTopColor: bgColor }]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  bubble: {
    maxWidth: 300,
    borderWidth: 2,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(139, 92, 246, 0.2)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  characterName: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  message: {
    color: '#ffffff',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  tail: {
    position: 'absolute',
    bottom: -8,
    left: 24,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#8b5cf6', // Will be overridden
  },
});
