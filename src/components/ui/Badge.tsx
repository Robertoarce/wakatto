import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Badge({
  label,
  variant = 'default',
  size = 'md',
  icon,
  style,
  textStyle,
}: BadgeProps) {
  const getVariantStyles = (): ViewStyle => {
    const variants: Record<BadgeVariant, ViewStyle> = {
      default: {
        backgroundColor: '#3f3f46',
        borderColor: '#52525b',
      },
      primary: {
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        borderColor: '#8b5cf6',
      },
      secondary: {
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: '#6366f1',
      },
      success: {
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: '#10b981',
      },
      warning: {
        backgroundColor: 'rgba(251, 191, 36, 0.2)',
        borderColor: '#fbbf24',
      },
      danger: {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderColor: '#ef4444',
      },
      info: {
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: '#3b82f6',
      },
    };
    return variants[variant];
  };

  const getSizeStyles = (): ViewStyle & { fontSize: number } => {
    const sizes: Record<BadgeSize, ViewStyle & { fontSize: number }> = {
      sm: {
        paddingVertical: 2,
        paddingHorizontal: 6,
        fontSize: 11,
      },
      md: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        fontSize: 13,
      },
      lg: {
        paddingVertical: 6,
        paddingHorizontal: 14,
        fontSize: 15,
      },
    };
    return sizes[size];
  };

  const getTextColor = (): string => {
    const colors: Record<BadgeVariant, string> = {
      default: '#a1a1aa',
      primary: '#c4b5fd',
      secondary: '#a5b4fc',
      success: '#6ee7b7',
      warning: '#fde68a',
      danger: '#fca5a5',
      info: '#93c5fd',
    };
    return colors[variant];
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  const textColor = getTextColor();
  const iconSize = size === 'sm' ? 12 : size === 'md' ? 14 : 16;

  return (
    <View style={[styles.badge, variantStyles, sizeStyles, style]}>
      {icon && (
        <Ionicons name={icon} size={iconSize} color={textColor} style={styles.icon} />
      )}
      <Text style={[styles.text, { color: textColor, fontSize: sizeStyles.fontSize }, textStyle]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
  },
  icon: {
    marginRight: 4,
  },
});
