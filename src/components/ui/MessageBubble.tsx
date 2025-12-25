import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, ViewStyle, TouchableOpacity, Platform } from 'react-native';
import { useResponsive } from '../../constants/Layout';

interface MessageBubbleProps {
  content: string;
  role: 'user' | 'assistant';
  characterName?: string;
  characterColor?: string;
  timestamp?: string;
  onLongPress?: () => void;
  position?: 'left' | 'right' | 'center';
}

export function MessageBubble({
  content,
  role,
  characterName,
  characterColor,
  timestamp,
  onLongPress,
  position = 'center',
}: MessageBubbleProps) {
  const { fonts, spacing, borderRadius, scalePx } = useResponsive();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const dynamicStyles = useMemo(() => ({
    container: {
      marginBottom: spacing.md,
      paddingHorizontal: spacing.sm,
    },
    bubble: {
      borderRadius: borderRadius.xl,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    characterName: {
      fontSize: fonts.sm,
      marginBottom: spacing.sm,
    },
    content: {
      fontSize: fonts.md,
      lineHeight: scalePx(22),
    },
    timestamp: {
      fontSize: fonts.xs,
      marginTop: spacing.sm,
    },
  }), [fonts, spacing, borderRadius, scalePx]);

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getPositionStyle = (): ViewStyle => {
    if (role === 'user') {
      return { justifyContent: 'center' };
    }
    return position === 'left'
      ? { justifyContent: 'flex-start' }
      : { justifyContent: 'flex-end' };
  };

  const getBubbleStyle = (): ViewStyle => {
    if (role === 'user') {
      return {
        backgroundColor: '#8b5cf6',
        ...Platform.select({
          web: {
            boxShadow: '0 4px 8px rgba(139, 92, 246, 0.3)',
          },
          ios: {
            shadowColor: '#8b5cf6',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          },
          android: {
            elevation: 4,
          },
        }),
      };
    }

    if (characterColor) {
      return {
        backgroundColor: characterColor + '15',
        borderColor: characterColor + '50',
        borderWidth: 2,
        ...Platform.select({
          web: {
            boxShadow: `0 4px 8px ${characterColor}33`,
          },
          ios: {
            shadowColor: characterColor,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
          },
          android: {
            elevation: 3,
          },
        }),
      };
    }

    return {
      backgroundColor: '#27272a',
      borderColor: '#3f3f46',
      borderWidth: 1,
    };
  };

  return (
    <Animated.View
      style={[
        styles.container,
        dynamicStyles.container,
        getPositionStyle(),
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <TouchableOpacity
        onLongPress={onLongPress}
        activeOpacity={role === 'user' ? 0.7 : 1}
        style={[styles.bubble, dynamicStyles.bubble, getBubbleStyle()]}
      >
        {characterName && (
          <Text style={[styles.characterName, dynamicStyles.characterName, { color: characterColor || '#8b5cf6' }]}>
            {characterName}
          </Text>
        )}
        <Text style={[styles.content, dynamicStyles.content]}>{content}</Text>
        {timestamp && <Text style={[styles.timestamp, dynamicStyles.timestamp]}>{timestamp}</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  bubble: {
    maxWidth: '85%',
  },
  characterName: {
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  content: {
    color: '#ffffff',
  },
  timestamp: {
    color: 'rgba(255, 255, 255, 0.5)',
    alignSelf: 'flex-end',
  },
});
