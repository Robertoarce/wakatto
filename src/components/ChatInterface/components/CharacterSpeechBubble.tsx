/**
 * CharacterSpeechBubble - Speech bubble container with queue support
 * Displays 1-2 bubbles per character with animated transitions
 */

import React, { useState, useRef, useEffect, memo, useCallback, useMemo } from 'react';
import { Animated, Platform, View, Text, StyleSheet } from 'react-native';
import { useResponsive } from '../../../constants/Layout';
import { wrapTextWithReveal, getLineOpacity } from '../utils/speechBubbleHelpers';
import { getDynamicBubbleDimensions, BUBBLE_ANIMATION_TIMING } from '../utils/bubbleQueueHelpers';
import { FadingLine } from './FadingLine';
import { AnimatedBubble, BubbleState, BubbleAnimationState } from './AnimatedBubble';

interface CharacterSpeechBubbleProps {
  // NEW: Array of bubbles (1-2 bubbles per character)
  bubbles?: BubbleState[];
  // Revealed text (progressively typed characters)
  text?: string;
  // Full text for pre-calculated line wrapping (required - prevents words jumping between lines)
  fullText: string;
  characterName: string;
  characterColor: string;
  position: 'left' | 'right';
  isTyping: boolean;
  isSpeaking: boolean;
  isSingleCharacter?: boolean;
  isMobileStacked?: boolean;
  stackIndex?: number;
  // NEW: For dynamic sizing
  characterCount?: number;
  // Animation callbacks
  getAnimationState?: (bubbleId: string) => BubbleAnimationState;
  onAnimationComplete?: (bubbleId: string, animation: BubbleAnimationState) => void;
  // Responsive props
  maxWidth?: number;
  maxHeight?: number;
  topOffset?: number;
  screenWidth?: number;
  characterIndex?: number;
}

export function CharacterSpeechBubble({
  bubbles,
  text,
  fullText,
  characterName,
  characterColor,
  position,
  isTyping,
  isSpeaking,
  isSingleCharacter = false,
  isMobileStacked = false,
  stackIndex = 0,
  characterCount = 1,
  getAnimationState,
  onAnimationComplete,
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
  const { fonts, spacing, borderRadius, components, scalePx, isMobile, isMobileLandscape, width: viewportWidth, height: viewportHeight } = useResponsive();

  // Scale character name font size based on screen
  const nameFontSize = isMobile ? fonts.md : fonts.lg;

  // Dynamic styles based on responsive values
  const dynamicStyles = useMemo(() => ({
    speechBubble: {
      position: 'absolute' as const,
      backgroundColor: 'rgba(30, 30, 40, 0.95)',
      borderRadius: borderRadius.lg,
      padding: components.speechBubble.padding,
      borderWidth: components.speechBubble.borderWidth,
      minWidth: components.speechBubble.minWidth,
      zIndex: 100,
    },
    speechBubbleCompact: {
      padding: scalePx(10),
      borderWidth: scalePx(2),
      borderRadius: borderRadius.md,
    },
    speechBubbleMobileStacked: {
      position: 'relative' as const,
      backgroundColor: 'rgba(30, 30, 40, 0.95)',
      borderRadius: borderRadius.md,
      padding: scalePx(10),
      borderWidth: scalePx(2),
      marginBottom: spacing.xs,
      alignSelf: 'stretch' as const,
      width: '100%' as const,
    },
    speechBubbleName: {
      fontFamily: 'Inter-Bold',
      marginBottom: spacing.xs,
      letterSpacing: 0.5,
    },
    speechBubbleTail: {
      position: 'absolute' as const,
      bottom: -components.speechBubble.tailSize,
      width: 0,
      height: 0,
    },
    speechBubbleTailLeft: {
      right: scalePx(20),
    },
    speechBubbleTailRight: {
      left: scalePx(20),
    },
    speechBubbleTailInner: {
      width: 0,
      height: 0,
      borderTopWidth: components.speechBubble.tailSize,
      borderTopColor: 'transparent',
      borderBottomWidth: 0,
      borderLeftWidth: components.speechBubble.tailSize,
      borderRightWidth: components.speechBubble.tailSize,
    },
    speechBubbleTailBottom: {
      position: 'absolute' as const,
      bottom: -components.speechBubble.tailSize,
      left: '50%' as any, // Percentage positioning
      marginLeft: -components.speechBubble.tailSize,
      width: 0,
      height: 0,
    },
    speechBubbleTailBottomInner: {
      width: 0,
      height: 0,
      borderLeftWidth: components.speechBubble.tailSize,
      borderLeftColor: 'transparent',
      borderRightWidth: components.speechBubble.tailSize,
      borderRightColor: 'transparent',
      borderTopWidth: components.speechBubble.tailSize,
    },
    containerGap: scalePx(10),
  }), [borderRadius, components, spacing, scalePx]);

  // Check if we have bubbles to display
  const hasBubbles = bubbles && bubbles.length > 0;
  const hasText = text && text.length > 0;

  // Handle fade in/out for the entire container
  useEffect(() => {
    // Clear any existing fade out timer when speaking starts again
    if (isSpeaking || isTyping) {
      if (fadeOutTimerRef.current) {
        clearTimeout(fadeOutTimerRef.current);
        fadeOutTimerRef.current = null;
      }
      hasStartedFadeOut.current = false;
    }

    // Show container when there's content and character is speaking/typing
    if ((hasBubbles || hasText) && (isSpeaking || isTyping)) {
      setShouldRender(true);
      if (text) lastTextRef.current = text;
      // Fade in quickly
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }
    // Start fade out when speaking stops
    else if (!isSpeaking && !isTyping && (lastTextRef.current || hasBubbles) && !hasStartedFadeOut.current) {
      hasStartedFadeOut.current = true;
      fadeOutTimerRef.current = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: BUBBLE_ANIMATION_TIMING.FADE_OUT_DURATION,
          useNativeDriver: Platform.OS !== 'web',
        }).start(() => {
          setShouldRender(false);
          lastTextRef.current = '';
          hasStartedFadeOut.current = false;
        });
      }, BUBBLE_ANIMATION_TIMING.FADE_OUT_DELAY);
    }

    return () => {
      if (fadeOutTimerRef.current) {
        clearTimeout(fadeOutTimerRef.current);
      }
    };
  }, [text, bubbles, isSpeaking, isTyping, fadeAnim, hasBubbles, hasText]);

  // Cleanup fadeAnim on unmount
  useEffect(() => {
    return () => {
      fadeAnim.stopAnimation();
    };
  }, [fadeAnim]);

  // Handle animation complete callback
  const handleAnimationComplete = useCallback((bubbleId: string, animation: BubbleAnimationState) => {
    onAnimationComplete?.(bubbleId, animation);
  }, [onAnimationComplete]);

  if (!shouldRender && !hasBubbles && !hasText) return null;

  // Get bubble dimensions based on bubble count
  const bubbleCount = bubbles?.length || 1;
  const dimensions = getDynamicBubbleDimensions(
    characterCount,
    bubbleCount,
    viewportWidth || 340,
    viewportHeight || 600,
    isMobile,
    isMobileLandscape
  );

  // Container width for animations (used for slide calculations)
  const containerWidth = viewportWidth || 340;

  // ====================
  // MOBILE STACKED LAYOUT
  // ====================
  if (isMobileStacked) {
    const stackedMaxWidth = Math.min(dimensions.maxWidth, (viewportWidth || 340) - 24);
    const stackedMaxHeight = Math.min(120, (viewportHeight || 600) * 0.2);

    // For stacked layout - use pre-calculated wrapping
    const displayText = text || lastTextRef.current;
    const visibleLines = wrapTextWithReveal(fullText, displayText.length, 45).slice(-3);

    return (
      <Animated.View
        style={[
          dynamicStyles.speechBubbleMobileStacked,
          {
            opacity: fadeAnim,
            borderColor: characterColor,
            top: stackIndex * spacing.xs,
            zIndex: 200 - stackIndex,
            pointerEvents: 'none',
            maxWidth: stackedMaxWidth,
            maxHeight: stackedMaxHeight,
            overflow: 'hidden',
          }
        ]}
      >
        <Text style={[dynamicStyles.speechBubbleName, { color: characterColor, fontSize: nameFontSize }]}>
          {characterName}
        </Text>
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

  // ====================
  // NEW BUBBLE QUEUE LAYOUT
  // ====================
  if (hasBubbles && bubbles.length > 0) {
    // Calculate container positioning
    const effectiveScreenWidth = bubbleScreenWidth || viewportWidth || 340;
    const padding = 16;

    // Container styles for horizontal bubble layout
    const getContainerStyles = () => {
      if (isSingleCharacter) {
        // Check if this is a center character in a multi-character layout
        const isCenterInGroup = characterCount > 1;

        if (isCenterInGroup) {
          // Center within parent wrapper (not screen)
          return {
            position: 'absolute' as const,
            top: topOffset || -60,
            left: 0,
            right: 0,
            flexDirection: 'column' as const,
            alignItems: 'center' as const,
            gap: dynamicStyles.containerGap,
            zIndex: 500,
            pointerEvents: 'none' as const,
          };
        }

        // True single character - center on screen
        const totalWidth = bubbleCount === 1
          ? dimensions.maxWidth
          : (dimensions.maxWidth * 2 + spacing.sm); // 2 bubbles + gap
        const leftPosition = Math.max(padding, (effectiveScreenWidth - totalWidth) / 2);

        return {
          position: 'absolute' as const,
          top: topOffset || -60,
          left: leftPosition,
          flexDirection: 'column' as const,
          alignItems: 'center' as const,
          gap: dynamicStyles.containerGap,
          zIndex: 500,
          pointerEvents: 'none' as const,
        };
      }

      // Multi-character positioning
      const responsiveOffset = Math.max(padding, Math.min(scalePx(80), effectiveScreenWidth * 0.15));

      if (position === 'left') {
        return {
          position: 'absolute' as const,
          top: topOffset,
          right: responsiveOffset,
          flexDirection: 'column' as const,
          alignItems: 'center' as const,
          gap: dynamicStyles.containerGap,
          zIndex: 500,
          pointerEvents: 'none' as const,
        };
      } else {
        return {
          position: 'absolute' as const,
          top: topOffset,
          left: responsiveOffset,
          flexDirection: 'column' as const,
          alignItems: 'center' as const,
          gap: dynamicStyles.containerGap,
          zIndex: 500,
          pointerEvents: 'none' as const,
        };
      }
    };

    return (
      <Animated.View style={[getContainerStyles(), { opacity: fadeAnim }]}>
        {bubbles.map((bubble, index) => (
          <AnimatedBubble
            key={bubble.id}
            bubble={bubble}
            characterName={characterName}
            characterColor={characterColor}
            maxWidth={dimensions.maxWidth}
            maxHeight={dimensions.maxHeight}
            maxLines={dimensions.maxLines}
            maxChars={dimensions.maxChars}
            isTyping={isTyping && bubble.status === 'active' && index === bubbles.length - 1}
            animationState={getAnimationState?.(bubble.id) || 'idle'}
            onAnimationComplete={handleAnimationComplete}
            containerWidth={containerWidth}
          />
        ))}
      </Animated.View>
    );
  }

  // ====================
  // SINGLE BUBBLE LAYOUT
  // ====================
  const revealedText = text || lastTextRef.current;
  const maxVisibleLines = 4; // Reduced for faster line scrolling

  // Pre-calculated wrapping - lines calculated from fullText, revealed progressively
  const visibleLines = wrapTextWithReveal(fullText, revealedText.length, 45).slice(-maxVisibleLines);

  // Calculate responsive position offsets
  const getPositionStyles = () => {
    const padding = 16;
    const effectiveScreenWidth = bubbleScreenWidth || viewportWidth || 340;
    const effectiveScreenHeight = viewportHeight || 600;

    const safeMaxWidth = Math.min(maxWidth, effectiveScreenWidth - padding * 2);
    const safeMaxHeight = isMobileLandscape
      ? Math.min(maxHeight || 200, effectiveScreenHeight * 0.5)
      : (maxHeight || effectiveScreenHeight * 0.4);

    if (isMobileLandscape) {
      return {
        left: padding,
        right: padding,
        top: topOffset,
        maxWidth: safeMaxWidth,
        maxHeight: safeMaxHeight,
      };
    }

    const responsiveOffset = Math.max(padding, Math.min(80, effectiveScreenWidth * 0.15));
    const responsiveTranslate = Math.max(10, Math.min(30, effectiveScreenWidth * 0.05));

    const baseOffset = position === 'left'
      ? { right: responsiveOffset }
      : { left: responsiveOffset };
    const translateX = position === 'left' ? responsiveTranslate : -responsiveTranslate;

    let clampedOffset = baseOffset;
    if (position === 'right') {
      const maxLeft = Math.max(padding, Math.min(responsiveOffset, effectiveScreenWidth - safeMaxWidth - padding));
      clampedOffset = { left: maxLeft };
    } else if (position === 'left') {
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

  const safeBubbleWidth = Math.min(maxWidth, (viewportWidth || 340) - 16);
  const safeBubbleHeight = isMobileLandscape
    ? Math.min(maxHeight || 150, (viewportHeight || 300) * 0.45)
    : (maxHeight || (viewportHeight || 600) * 0.4);

  const getSingleCharacterStyles = () => {
    const effectiveScreenWidth = bubbleScreenWidth || viewportWidth || 340;
    const padding = 16;
    const bubbleWidth = Math.min(safeBubbleWidth, effectiveScreenWidth - padding * 2);

    // Check if this is a center character in a multi-character layout
    const isCenterInGroup = characterCount > 1;

    if (isCenterInGroup) {
      // Center within parent wrapper (not screen)
      return {
        top: topOffset || -60,
        left: 0,
        right: 0,
        alignSelf: 'center' as const,
        maxWidth: bubbleWidth,
        maxHeight: safeBubbleHeight,
      };
    }

    // True single character - center on screen
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
        dynamicStyles.speechBubble,
        isSingleCharacter ? getSingleCharacterStyles() : getPositionStyles(),
        {
          opacity: fadeAnim,
          borderColor: characterColor,
          overflow: 'hidden',
          zIndex: 500,
          pointerEvents: 'none',
        },
        isMobileLandscape && dynamicStyles.speechBubbleCompact,
      ]}
    >
      {/* Speech bubble tail */}
      {!isSingleCharacter && (
        <View
          style={[
            dynamicStyles.speechBubbleTail,
            position === 'left' ? dynamicStyles.speechBubbleTailLeft : dynamicStyles.speechBubbleTailRight,
          ]}
        >
          <View style={[
            dynamicStyles.speechBubbleTailInner,
            {
              borderLeftColor: position === 'right' ? characterColor : 'transparent',
              borderRightColor: position === 'left' ? characterColor : 'transparent'
            }
          ]} />
        </View>
      )}
      {/* Bottom tail for single character */}
      {isSingleCharacter && (
        <View style={dynamicStyles.speechBubbleTailBottom}>
          <View style={[dynamicStyles.speechBubbleTailBottomInner, { borderTopColor: characterColor }]} />
        </View>
      )}

      <Text style={[dynamicStyles.speechBubbleName, { color: characterColor, fontSize: nameFontSize }]}>
        {characterName}
      </Text>

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
  speechBubbleLinesContainer: {
    flexDirection: 'column',
  },
});

export default CharacterSpeechBubble;
