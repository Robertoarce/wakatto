import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../../constants/Layout';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) {
  const { fonts, spacing, layout, isMobile } = useResponsive();

  const getVariantStyles = (): ViewStyle => {
    const variants: Record<ButtonVariant, ViewStyle> = {
      primary: {
        backgroundColor: '#8b5cf6',
        borderColor: '#8b5cf6',
      },
      secondary: {
        backgroundColor: '#6366f1',
        borderColor: '#6366f1',
      },
      outline: {
        backgroundColor: 'transparent',
        borderColor: '#8b5cf6',
      },
      ghost: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
      },
      danger: {
        backgroundColor: '#ef4444',
        borderColor: '#ef4444',
      },
      success: {
        backgroundColor: '#10b981',
        borderColor: '#10b981',
      },
    };
    return variants[variant];
  };

  const getSizeStyles = (): ViewStyle & { fontSize: number } => {
    // Ensure minimum touch target on mobile (44px)
    const minHeight = layout.minTouchTarget;
    
    const sizes: Record<ButtonSize, ViewStyle & { fontSize: number }> = {
      sm: {
        paddingVertical: isMobile ? spacing.md : spacing.sm,
        paddingHorizontal: spacing.md,
        fontSize: fonts.sm,
        minHeight: minHeight,
      },
      md: {
        paddingVertical: isMobile ? spacing.lg : spacing.md,
        paddingHorizontal: spacing.lg,
        fontSize: fonts.md,
        minHeight: minHeight,
      },
      lg: {
        paddingVertical: isMobile ? spacing.xl : spacing.lg,
        paddingHorizontal: spacing.xl,
        fontSize: fonts.lg,
        minHeight: minHeight + 8,
      },
    };
    return sizes[size];
  };

  const getTextColor = (): string => {
    if (variant === 'outline' || variant === 'ghost') {
      return '#8b5cf6';
    }
    return '#ffffff';
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  const textColor = getTextColor();

  const iconSize = size === 'sm' ? (isMobile ? 14 : 16) : size === 'md' ? (isMobile ? 18 : 20) : (isMobile ? 22 : 24);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.button,
        variantStyles,
        sizeStyles,
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <View style={[styles.content, { gap: spacing.sm }]}>
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon} size={iconSize} color={textColor} />
          )}
          <Text style={[styles.text, { color: textColor, fontSize: sizeStyles.fontSize }, textStyle]}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon} size={iconSize} color={textColor} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
});
