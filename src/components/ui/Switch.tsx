import React, { useRef, useEffect, useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, ViewStyle, Platform } from 'react-native';
import { useResponsive } from '../../constants/Layout';

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  activeColor?: string;
  inactiveColor?: string;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export function Switch({
  value,
  onValueChange,
  disabled = false,
  activeColor = '#8b5cf6',
  inactiveColor = '#3f3f46',
  size = 'md',
  style,
}: SwitchProps) {
  const { scalePx, borderRadius } = useResponsive();
  const translateX = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: value ? 1 : 0,
      useNativeDriver: true,
      damping: 15,
      stiffness: 200,
    }).start();
  }, [value]);

  const getSizeStyles = useMemo(() => {
    const sizes = {
      sm: { width: scalePx(36), height: scalePx(20), thumbSize: scalePx(16), translateDistance: scalePx(16) },
      md: { width: scalePx(44), height: scalePx(24), thumbSize: scalePx(20), translateDistance: scalePx(20) },
      lg: { width: scalePx(52), height: scalePx(28), thumbSize: scalePx(24), translateDistance: scalePx(24) },
    };
    return sizes[size];
  }, [scalePx, size]);

  const sizeStyles = getSizeStyles;
  const thumbTranslateX = translateX.interpolate({
    inputRange: [0, 1],
    outputRange: [2, sizeStyles.translateDistance],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
      style={[
        styles.container,
        {
          width: sizeStyles.width,
          height: sizeStyles.height,
          backgroundColor: value ? activeColor : inactiveColor,
          borderRadius: borderRadius.full,
        },
        disabled && styles.disabled,
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.thumb,
          {
            width: sizeStyles.thumbSize,
            height: sizeStyles.thumbSize,
            borderRadius: borderRadius.full,
            transform: [{ translateX: thumbTranslateX }],
          },
        ]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  thumb: {
    backgroundColor: '#ffffff',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 3px rgba(0, 0, 0, 0.2)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  disabled: {
    opacity: 0.5,
  },
});
