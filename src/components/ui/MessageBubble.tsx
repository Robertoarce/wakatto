import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, ViewStyle, TouchableOpacity, Platform } from 'react-native';

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
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

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
        style={[styles.bubble, getBubbleStyle()]}
      >
        {characterName && (
          <Text style={[styles.characterName, { color: characterColor || '#8b5cf6' }]}>
            {characterName}
          </Text>
        )}
        <Text style={styles.content}>{content}</Text>
        {timestamp && <Text style={styles.timestamp}>{timestamp}</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  characterName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'capitalize',
  },
  content: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 22,
  },
  timestamp: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
});
