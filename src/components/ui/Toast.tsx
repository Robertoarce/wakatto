import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, ViewStyle, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ToastVariant = 'success' | 'error' | 'warning' | 'info' | 'story';

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  visible: boolean;
  onDismiss?: () => void;
  duration?: number;
  customColor?: string; // Character theme color override
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

export function Toast({
  message,
  variant = 'info',
  visible,
  onDismiss,
  duration = 3000,
  customColor,
}: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animation values first
      translateY.setValue(-100);
      opacity.setValue(0);
      
      // Show animation
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
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
    ]).start(() => {
      if (onDismiss) onDismiss();
    });
  };

  const getVariantStyles = (): ViewStyle & { iconName: keyof typeof Ionicons.glyphMap; iconColor: string } => {
    const variants = {
      success: {
        backgroundColor: 'rgba(16, 185, 129, 0.95)',
        borderColor: '#10b981',
        iconName: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
        iconColor: '#ffffff',
      },
      error: {
        backgroundColor: 'rgba(239, 68, 68, 0.95)',
        borderColor: '#ef4444',
        iconName: 'close-circle' as keyof typeof Ionicons.glyphMap,
        iconColor: '#ffffff',
      },
      warning: {
        backgroundColor: 'rgba(251, 191, 36, 0.95)',
        borderColor: '#fbbf24',
        iconName: 'warning' as keyof typeof Ionicons.glyphMap,
        iconColor: '#000000',
      },
      info: {
        backgroundColor: 'rgba(59, 130, 246, 0.95)',
        borderColor: '#3b82f6',
        iconName: 'information-circle' as keyof typeof Ionicons.glyphMap,
        iconColor: '#ffffff',
      },
      story: {
        backgroundColor: 'rgba(30, 20, 50, 0.97)',
        borderColor: '#8b5cf6',
        iconName: 'book-outline' as keyof typeof Ionicons.glyphMap,
        iconColor: '#c4b5fd',
      },
    };
    return variants[variant];
  };

  if (!visible) return null;

  const variantStyles = getVariantStyles();

  // Use custom color if provided, otherwise use variant styles
  const backgroundColor = customColor ? hexToRgba(customColor, 0.95) : variantStyles.backgroundColor;
  const borderColor = customColor || variantStyles.borderColor;

  const isStory = variant === 'story';

  return (
    <Animated.View
      style={[
        styles.container,
        isStory && styles.storyContainer,
        {
          backgroundColor,
          borderColor,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <Ionicons
        name={variantStyles.iconName}
        size={isStory ? 28 : 24}
        color={isStory ? '#c4b5fd' : variantStyles.iconColor}
      />
      <Text
        style={[
          styles.message,
          variant === 'warning' && { color: '#000000' },
          isStory && styles.storyMessage,
        ]}
      >
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
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
    zIndex: 9999,
  },
  message: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  storyContainer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 2,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3), 0 4px 12px rgba(0, 0, 0, 0.4)',
      },
      ios: {
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  storyMessage: {
    fontSize: 16,
    fontStyle: 'italic',
    fontWeight: '500',
    color: '#e9d5ff',
    letterSpacing: 0.5,
  },
});
