import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../../constants/Layout';

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
  const { fonts, spacing, borderRadius, components } = useResponsive();
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
        paddingVertical: spacing.xs / 2,
        paddingHorizontal: spacing.sm,
        fontSize: fonts.xs,
      },
      md: {
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        fontSize: fonts.sm,
      },
      lg: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        fontSize: fonts.md,
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
  const iconSize = size === 'sm' ? components.iconSizes.xs : size === 'md' ? components.iconSizes.sm : components.iconSizes.md;

  return (
    <View style={[styles.badge, { borderRadius: borderRadius.full }, variantStyles, sizeStyles, style]}>
      {icon && (
        <Ionicons name={icon} size={iconSize} color={textColor} style={{ marginRight: spacing.xs }} />
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
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
  },
});
