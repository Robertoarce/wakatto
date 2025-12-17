/**
 * CharacterSpeechBubble - Speech bubble with multiple layout modes
 * Displays character speech with fading text effect (older lines fade out)
 */

import React, { useState, useRef, useEffect, memo } from 'react';
import { Animated, Platform, View, Text, StyleSheet } from 'react-native';
import { useResponsive } from '../../../constants/Layout';
import { wrapText, getLineOpacity } from '../utils/speechBubbleHelpers';
import { FadingLine } from './FadingLine';

interface CharacterSpeechBubbleProps {
  text: string;
  characterName: string;
  characterColor: string;
  position: 'left' | 'right';
  isTyping: boolean;
  isSpeaking: boolean;
  isSingleCharacter?: boolean;
  isMobileStacked?: boolean;
  stackIndex?: number;
  // Responsive props
  maxWidth?: number;
  maxHeight?: number;
  topOffset?: number;
  screenWidth?: number;
  characterIndex?: number;
}

export function CharacterSpeechBubble({
  text,
  characterName,
  characterColor,
  position,
  isTyping,
  isSpeaking,
  isSingleCharacter = false,
  isMobileStacked = false,
  stackIndex = 0,
  // Responsive props
  maxWidth = 280,
  maxHeight,
  topOffset = -60,
  screenWidth: bubbleScreenWidth,
  characterIndex = 0,
}: CharacterSpeechBubbleProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(false);
  const fadeOutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasStartedFadeOut = useRef(false);
  const lastTextRef = useRef('');
  const { fonts, isMobile, isMobileLandscape, spacing, width: viewportWidth, height: viewportHeight } = useResponsive();

  useEffect(() => {
    // Clear any existing fade out timer when speaking starts again
    if (isSpeaking || isTyping) {
      if (fadeOutTimerRef.current) {
        clearTimeout(fadeOutTimerRef.current);
        fadeOutTimerRef.current = null;
      }
      hasStartedFadeOut.current = false;
    }

    // Show bubble when there's text and character is speaking/typing
    if (text && text.length > 0 && (isSpeaking || isTyping)) {
      setShouldRender(true);
      lastTextRef.current = text;
      // Fade in quickly
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }
    // Start fade out when speaking stops (but only if we haven't already started)
    else if (!isSpeaking && !isTyping && lastTextRef.current && !hasStartedFadeOut.current) {
      hasStartedFadeOut.current = true;
      // Keep visible for 2 seconds, then fade out over 3 seconds
      fadeOutTimerRef.current = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: Platform.OS !== 'web',
        }).start(() => {
          setShouldRender(false);
          lastTextRef.current = '';
          hasStartedFadeOut.current = false;
        });
      }, 2000);
    }

    return () => {
      if (fadeOutTimerRef.current) {
        clearTimeout(fadeOutTimerRef.current);
      }
    };
  }, [text, isSpeaking, isTyping, fadeAnim]);

  // Cleanup fadeAnim on unmount
  useEffect(() => {
    return () => {
      fadeAnim.stopAnimation();
    };
  }, [fadeAnim]);

  if (!shouldRender && !text) return null;

  const fullText = text || lastTextRef.current;

  const allLines = wrapText(fullText);

  // Show only the last 7 lines with fading effect
  const maxVisibleLines = 7;
  const visibleLines = allLines.slice(-maxVisibleLines);

  // On mobile with stacked layout, use a simpler compact design
  if (isMobileStacked) {
    // Calculate safe width for stacked bubbles
    const stackedMaxWidth = Math.min(maxWidth, (viewportWidth || 400) - 24);
    const stackedMaxHeight = Math.min(120, (viewportHeight || 600) * 0.2);

    return (
      <Animated.View
        style={[
          styles.speechBubbleMobileStacked,
          {
            opacity: fadeAnim,
            borderColor: characterColor,
            // Stack bubbles with offset based on index
            top: stackIndex * 4,
            zIndex: 200 - stackIndex,
            pointerEvents: 'none',
            maxWidth: stackedMaxWidth,
            maxHeight: stackedMaxHeight,
            overflow: 'hidden',
          }
        ]}
      >
        <Text style={[styles.speechBubbleName, { color: characterColor, fontSize: fonts.md }]}>{characterName}</Text>
        <View style={styles.speechBubbleLinesContainer}>
          {visibleLines.slice(-3).map((line, index) => (
            <FadingLine
              key={`line-${index}`}
              text={line}
              opacity={getLineOpacity(index, visibleLines.slice(-3).length)}
              isLast={index === visibleLines.slice(-3).length - 1 && isTyping}
              characterColor={characterColor}
            />
          ))}
        </View>
      </Animated.View>
    );
  }

  // Calculate responsive position offsets with screen boundary clamping
  const getPositionStyles = () => {
    const padding = 16; // Minimum padding from screen edge
    const effectiveScreenWidth = bubbleScreenWidth || viewportWidth || 400;
    const effectiveScreenHeight = viewportHeight || 600;

    // Calculate safe max dimensions that fit within viewport
    const safeMaxWidth = Math.min(maxWidth, effectiveScreenWidth - padding * 2);
    const safeMaxHeight = isMobileLandscape
      ? Math.min(maxHeight || 200, effectiveScreenHeight * 0.5)
      : (maxHeight || effectiveScreenHeight * 0.4);

    // In landscape or constrained space, position bubbles more centrally
    if (isMobileLandscape) {
      return {
        left: padding,
        right: padding,
        top: topOffset,
        maxWidth: safeMaxWidth,
        maxHeight: safeMaxHeight,
      };
    }

    // Responsive offsets - scale with screen width (smaller on mobile)
    // At 320px: ~48px offset, at 768px+: ~80px max
    const responsiveOffset = Math.max(padding, Math.min(80, effectiveScreenWidth * 0.15));
    const responsiveTranslate = Math.max(10, Math.min(30, effectiveScreenWidth * 0.05));

    const baseOffset = position === 'left'
      ? { right: responsiveOffset }
      : { left: responsiveOffset };
    const translateX = position === 'left' ? responsiveTranslate : -responsiveTranslate;

    // For left position (bubble on right side of character), ensure it doesn't overflow right
    // For right position (bubble on left side of character), ensure it doesn't overflow left
    let clampedOffset = baseOffset;
    if (position === 'right') {
      // Ensure left + maxWidth doesn't exceed screen width
      const maxLeft = Math.max(padding, Math.min(responsiveOffset, effectiveScreenWidth - safeMaxWidth - padding));
      clampedOffset = { left: maxLeft };
    } else if (position === 'left') {
      // Ensure right + maxWidth doesn't exceed screen width
      const maxRight = Math.max(padding, Math.min(responsiveOffset, effectiveScreenWidth - safeMaxWidth - padding));
      clampedOffset = { right: maxRight };
    }

    return {
      ...clampedOffset,
      top: topOffset,
      transform: [{ translateX }],
      maxWidth: safeMaxWidth,
      maxHeight: safeMaxHeight,
    };
  };

  // Calculate safe dimensions that always fit viewport
  const safeBubbleWidth = Math.min(maxWidth, (viewportWidth || 400) - 16);
  const safeBubbleHeight = isMobileLandscape
    ? Math.min(maxHeight || 150, (viewportHeight || 300) * 0.45)
    : (maxHeight || (viewportHeight || 600) * 0.4);

  // Calculate single character centering - bubble should be centered above character
  const getSingleCharacterStyles = () => {
    const effectiveScreenWidth = bubbleScreenWidth || viewportWidth || 400;
    const padding = 16;

    // Center the bubble horizontally within the character wrapper
    // The wrapper has width: 100% (for single character), so center within that
    const bubbleWidth = Math.min(safeBubbleWidth, effectiveScreenWidth - padding * 2);

    // Calculate left position to center the bubble within the wrapper
    // For single character, wrapper width ≈ screen width
    const leftPosition = Math.max(padding, (effectiveScreenWidth - bubbleWidth) / 2);

    return {
      top: topOffset || -60,
      left: leftPosition,
      maxWidth: bubbleWidth,
      maxHeight: safeBubbleHeight,
    };
  };

  return (
    <Animated.View
      style={[
        styles.speechBubble,
        isSingleCharacter
          ? getSingleCharacterStyles()
          : getPositionStyles(),
        {
          opacity: fadeAnim,
          borderColor: characterColor,
          overflow: 'hidden', // Always clip overflow
          zIndex: 500, // Ensure bubbles are always on top of characters
          pointerEvents: 'none',
        },
        // Compact styles for landscape
        isMobileLandscape && styles.speechBubbleCompact,
      ]}
    >
      {/* Speech bubble tail - hide for single character (bubble is above) */}
      {!isSingleCharacter && (
        <View
          style={[
            styles.speechBubbleTail,
            position === 'left' ? styles.speechBubbleTailLeft : styles.speechBubbleTailRight,
          ]}
        >
          <View style={[styles.speechBubbleTailInner, { borderLeftColor: position === 'right' ? characterColor : 'transparent', borderRightColor: position === 'left' ? characterColor : 'transparent' }]} />
        </View>
      )}
      {/* Bottom tail for single character */}
      {isSingleCharacter && (
        <View style={styles.speechBubbleTailBottom}>
          <View style={[styles.speechBubbleTailBottomInner, { borderTopColor: characterColor }]} />
        </View>
      )}
      <Text style={[styles.speechBubbleName, { color: characterColor, fontSize: fonts.lg }]}>{characterName}</Text>

      {/* Fading lines - older text fades out */}
      <View style={styles.speechBubbleLinesContainer}>
        {visibleLines.map((line, index) => (
          <FadingLine
            key={`line-${index}`}
            text={line}
            opacity={getLineOpacity(index, visibleLines.length)}
            isLast={index === visibleLines.length - 1 && isTyping}
            characterColor={characterColor}
          />
        ))}
      </View>
    </Animated.View>
  );
}

// Memoize CharacterSpeechBubble for performance
export const MemoizedCharacterSpeechBubble = memo(CharacterSpeechBubble);

const styles = StyleSheet.create({
  speechBubble: {
    position: 'absolute',
    backgroundColor: 'rgba(30, 30, 40, 0.95)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 3,
    minWidth: 120,
    zIndex: 100,
  },
  speechBubbleCompact: {
    padding: 10,
    borderWidth: 2,
    borderRadius: 12,
  },
  speechBubbleMobileStacked: {
    position: 'relative',
    backgroundColor: 'rgba(30, 30, 40, 0.95)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 2,
    marginBottom: 4,
    alignSelf: 'stretch',
    width: '100%',
  },
  speechBubbleName: {
    fontFamily: 'Inter-Bold',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  speechBubbleLinesContainer: {
    flexDirection: 'column',
  },
  speechBubbleTail: {
    position: 'absolute',
    bottom: -10,
    width: 0,
    height: 0,
  },
  speechBubbleTailLeft: {
    right: 20,
  },
  speechBubbleTailRight: {
    left: 20,
  },
  speechBubbleTailInner: {
    width: 0,
    height: 0,
    borderTopWidth: 10,
    borderTopColor: 'transparent',
    borderBottomWidth: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
  },
  speechBubbleTailBottom: {
    position: 'absolute',
    bottom: -10,
    left: '50%',
    marginLeft: -10,
    width: 0,
    height: 0,
  },
  speechBubbleTailBottomInner: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderLeftColor: 'transparent',
    borderRightWidth: 10,
    borderRightColor: 'transparent',
    borderTopWidth: 10,
  },
});

export default CharacterSpeechBubble;
