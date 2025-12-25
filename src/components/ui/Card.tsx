import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity, Platform } from 'react-native';
import { useResponsive } from '../../constants/Layout';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  onPress?: () => void;
  style?: ViewStyle;
}

export function Card({ children, title, description, variant = 'default', onPress, style }: CardProps) {
  const { fonts, spacing, borderRadius, isMobile } = useResponsive();

  const getVariantStyles = (): ViewStyle => {
    const shadowStyles = Platform.select({
      web: {
        default: { boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' },
        elevated: { boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)' },
      },
      ios: {
        default: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        elevated: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
        },
      },
      android: {
        default: { elevation: 2 },
        elevated: { elevation: 8 },
      },
    }) as Record<string, ViewStyle>;

    const variants: Record<string, ViewStyle> = {
      default: {
        backgroundColor: '#171717',
        borderWidth: 1,
        borderColor: '#27272a',
        ...shadowStyles?.default,
      },
      elevated: {
        backgroundColor: '#171717',
        borderWidth: 0,
        ...shadowStyles?.elevated,
      },
      outlined: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#3f3f46',
      },
      glass: {
        backgroundColor: 'rgba(23, 23, 23, 0.7)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
    };
    return variants[variant];
  };

  const content = (
    <>
      {(title || description) && (
        <View style={[styles.header, { marginBottom: spacing.md }]}>
          {title && (
            <Text style={[
              styles.title, 
              { fontSize: isMobile ? fonts.md : fonts.lg, marginBottom: spacing.xs }
            ]}>
              {title}
            </Text>
          )}
          {description && (
            <Text style={[styles.description, { fontSize: fonts.sm }]}>
              {description}
            </Text>
          )}
        </View>
      )}
      {children}
    </>
  );

  const cardPadding = isMobile ? spacing.lg : spacing.lg;

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={[styles.card, { padding: cardPadding, borderRadius: borderRadius.lg }, getVariantStyles(), style]}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, { padding: cardPadding, borderRadius: borderRadius.lg }, getVariantStyles(), style]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    // borderRadius applied dynamically via borderRadius.lg
  },
  header: {
  },
  title: {
    fontWeight: '700',
    color: '#ffffff',
  },
  description: {
    color: '#a1a1aa',
  },
});
