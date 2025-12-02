import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
    const sizes: Record<ButtonSize, ViewStyle & { fontSize: number }> = {
      sm: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        fontSize: 14,
      },
      md: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        fontSize: 16,
      },
      lg: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        fontSize: 18,
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

  const iconSize = size === 'sm' ? 16 : size === 'md' ? 20 : 24;

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
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon} size={iconSize} color={textColor} style={styles.iconLeft} />
          )}
          <Text style={[styles.text, { color: textColor, fontSize: sizeStyles.fontSize }, textStyle]}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon} size={iconSize} color={textColor} style={styles.iconRight} />
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
