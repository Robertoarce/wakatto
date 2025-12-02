import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  visible: boolean;
  onDismiss?: () => void;
  duration?: number;
}

export function Toast({
  message,
  variant = 'info',
  visible,
  onDismiss,
  duration = 3000,
}: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
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
    };
    return variants[variant];
  };

  if (!visible) return null;

  const variantStyles = getVariantStyles();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: variantStyles.backgroundColor,
          borderColor: variantStyles.borderColor,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <Ionicons name={variantStyles.iconName} size={24} color={variantStyles.iconColor} />
      <Text style={[styles.message, variant === 'warning' && { color: '#000000' }]}>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  message: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
