import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  onPress?: () => void;
  style?: ViewStyle;
}

export function Card({ children, title, description, variant = 'default', onPress, style }: CardProps) {
  const getVariantStyles = (): ViewStyle => {
    const variants: Record<string, ViewStyle> = {
      default: {
        backgroundColor: '#171717',
        borderWidth: 1,
        borderColor: '#27272a',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
      elevated: {
        backgroundColor: '#171717',
        borderWidth: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
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
        <View style={styles.header}>
          {title && <Text style={styles.title}>{title}</Text>}
          {description && <Text style={styles.description}>{description}</Text>}
        </View>
      )}
      {children}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={[styles.card, getVariantStyles(), style]}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, getVariantStyles(), style]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#a1a1aa',
  },
});
