import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, ViewStyle, Platform } from 'react-native';

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
  const translateX = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: value ? 1 : 0,
      useNativeDriver: true,
      damping: 15,
      stiffness: 200,
    }).start();
  }, [value]);

  const getSizeStyles = () => {
    const sizes = {
      sm: { width: 36, height: 20, thumbSize: 16, translateDistance: 16 },
      md: { width: 44, height: 24, thumbSize: 20, translateDistance: 20 },
      lg: { width: 52, height: 28, thumbSize: 24, translateDistance: 24 },
    };
    return sizes[size];
  };

  const sizeStyles = getSizeStyles();
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
            transform: [{ translateX: thumbTranslateX }],
          },
        ]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 9999,
    justifyContent: 'center',
  },
  thumb: {
    backgroundColor: '#ffffff',
    borderRadius: 9999,
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
