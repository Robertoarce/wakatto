/**
 * SimpleSpeechBubble - A simple, stateless speech bubble component
 *
 * Design principle: Parent controls what text to display.
 * This component just renders it with fade animation.
 *
 * Positioned inside FloatingCharacterWrapper to inherit floating animation.
 * Centers itself within the wrapper.
 */

import React, { useRef, useEffect } from 'react';
import { Animated, Text, View, StyleSheet, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useResponsive } from '../constants/Layout';
import { PAYMENT_BUTTONS_MARKER, PremiumTierOption, PREMIUM_TIER_OPTIONS } from '../services/bobPremiumPitchService';

// Parse text to separate regular text from *action* text (long actions only - 3+ words)
type TextPart = { type: 'text' | 'action'; content: string };

function parseLongActionText(text: string): TextPart[] {
  const parts: TextPart[] = [];
  const regex = /(\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    // Only mark as action if it's a long action (3+ words)
    const wordCount = match[1].replace(/\*/g, '').trim().split(/\s+/).length;
    if (wordCount > 2) {
      parts.push({ type: 'action', content: match[1] });
    } else {
      // Short actions are already stripped, but just in case
      parts.push({ type: 'text', content: match[1] });
    }
    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return parts;
}

// Render text with bold styling for long action words
function renderTextWithBoldActions(
  line: string,
  textStyle: any,
  actionStyle: any
): React.ReactNode {
  const parts = parseLongActionText(line);
  
  if (parts.length === 1 && parts[0].type === 'text') {
    // No actions, just return plain text
    return parts[0].content;
  }

  return parts.map((part, index) => {
    if (part.type === 'action') {
      return (
        <Text key={index} style={actionStyle}>
          {part.content}
        </Text>
      );
    }
    return part.content;
  });
}

interface SimpleSpeechBubbleProps {
  text: string;
  characterName: string;
  characterColor: string;
  isVisible: boolean;
  maxLines?: number;
  isMobileStacked?: boolean;
  // Total number of characters - used to limit bubble width and prevent overlap
  characterCount?: number;
  // Payment button support
  onPaymentSelect?: (tier: 'premium' | 'gold') => void;
}

export function SimpleSpeechBubble({
  text,
  characterName,
  characterColor,
  isVisible,
  maxLines = 4,
  isMobileStacked = false,
  characterCount = 1,
  onPaymentSelect,
}: SimpleSpeechBubbleProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const {
    spacing,
    borderRadius,
    width: screenWidth,
    isMobile,
  } = useResponsive();

  // Single character mode: wider bubbles, more screen real estate
  const isSingleCharacter = characterCount === 1;

  // Calculate max bubble width based on character count to prevent overlap
  // Each character gets an equal slice of screen width, bubble uses 85% of that slice
  const sliceWidth = screenWidth / Math.max(1, characterCount);
  const maxSliceUsage = 0.85; // Use 85% of character's allocated space

  // Wider limits for single character
  const absoluteMaxWidth = isSingleCharacter ? 500 : 350;

  // Final bubble width: min of (slice limit, absolute max, percentage of screen)
  // Wider percentage for single character
  const bubbleWidthPercent = isSingleCharacter
    ? (isMobile ? 0.5 : 0.4)
    : (isMobile ? 0.38 : 0.28);
  const bubbleWidth = Math.min(
    sliceWidth * maxSliceUsage,
    absoluteMaxWidth,
    screenWidth * bubbleWidthPercent
  );

  // Stacked mode: wider bubbles
  const stackedWidth = Math.min(screenWidth - 32, screenWidth * 0.9);

  // Final width based on mode
  const finalWidth = isMobileStacked ? stackedWidth : bubbleWidth;

  // Simple font sizing
  const textFontSize = Math.max(12, Math.min(18, screenWidth * 0.012));
  const nameFontSize = Math.max(13, Math.min(20, screenWidth * 0.014));
  const paddingH = Math.max(10, Math.min(16, screenWidth * 0.015));
  const paddingV = Math.max(8, Math.min(12, screenWidth * 0.01));
  const lineHeight = Math.round(textFontSize * 1.4);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isVisible ? 1 : 0,
      duration: 200,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [isVisible, fadeAnim]);

  // Don't render if no text
  if (!text) return null;

  // Check if this message should show payment buttons
  const hasPaymentButtons = text.includes(PAYMENT_BUTTONS_MARKER);

  // Strip only SHORT action text (1-2 words) from bubble display
  // Long actions (3+ words) stay in the bubble and are rendered bold
  // Also strip the payment buttons marker (we'll render buttons separately)
  // Preserve newlines, only collapse consecutive spaces
  const strippedText = text
    .replace(PAYMENT_BUTTONS_MARKER, '') // Remove payment marker
    .replace(/\*[^*]+\*/g, (match) => {
      const wordCount = match.replace(/\*/g, '').trim().split(/\s+/).length;
      return wordCount <= 2 ? '' : match; // Keep long actions, remove short ones
    })
    .replace(/[^\S\n]+/g, ' ')   // Collapse spaces (but NOT newlines)
    .replace(/\n\s*/g, '\n')     // Clean up whitespace after newlines
    .trim();

  // Payment buttons component
  const PaymentButtons = () => {
    if (!hasPaymentButtons || !onPaymentSelect) return null;
    
    return (
      <View style={styles.paymentButtonsContainer}>
        {PREMIUM_TIER_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.tier}
            style={[
              styles.paymentButton,
              option.recommended && styles.paymentButtonRecommended,
            ]}
            onPress={() => onPaymentSelect(option.tier)}
            activeOpacity={0.8}
          >
            <View style={styles.paymentButtonContent}>
              <Text style={[
                styles.paymentButtonTier,
                option.recommended && styles.paymentButtonTierRecommended,
              ]}>
                {option.name}
              </Text>
              <Text style={styles.paymentButtonPrice}>
                {option.price}
              </Text>
              {option.recommended && (
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedBadgeText}>BEST VALUE</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Calculate characters per line for word wrap
  const avgCharWidth = textFontSize * 0.55;
  const usableWidth = finalWidth - (paddingH * 2);
  const charsPerLine = Math.max(20, Math.floor(usableWidth / avgCharWidth));

  // Limit bubble height to ~15 lines for readability
  // For multiple characters, use the smaller maxLines prop
  const effectiveMaxLines = isSingleCharacter ? 15 : maxLines;

  // Max height for scrollable content (based on ~15 lines)
  const maxContentHeight = lineHeight * effectiveMaxLines;

  // Ref for auto-scrolling to bottom
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-scroll to bottom when text changes
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: false });
    }
  }, [text]);

  // Word wrap function that respects explicit newlines
  const wrapText = (str: string, maxChars: number): string[] => {
    const allLines: string[] = [];

    // First split by explicit newlines
    const paragraphs = str.split('\n');

    for (const paragraph of paragraphs) {
      if (!paragraph.trim()) {
        // Empty line - preserve as blank line
        allLines.push('');
        continue;
      }

      // Word wrap each paragraph
      const words = paragraph.split(' ');
      let currentLine = '';

      for (const word of words) {
        if ((currentLine + ' ' + word).trim().length <= maxChars) {
          currentLine = (currentLine + ' ' + word).trim();
        } else {
          if (currentLine) allLines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) allLines.push(currentLine);
    }

    // Return all lines - scrolling handles overflow
    return allLines;
  };

  const lines = wrapText(strippedText || text, charsPerLine);

  // Mobile stacked layout (relative positioning)
  if (isMobileStacked) {
    return (
      <Animated.View
        style={[
          styles.bubbleMobileStacked,
          {
            opacity: fadeAnim,
            borderColor: characterColor,
            borderRadius: borderRadius.md,
            paddingHorizontal: paddingH,
            paddingVertical: paddingV,
            marginBottom: spacing.xs,
            maxWidth: finalWidth,
          }
        ]}
      >
        <Text style={[styles.name, { color: characterColor, fontSize: nameFontSize, marginBottom: 4 }]}>
          {characterName}
        </Text>
        <ScrollView
          ref={scrollViewRef}
          style={[styles.scrollContainer, { maxHeight: maxContentHeight }]}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
          // @ts-ignore - dataSet is valid for React Native Web
          dataSet={{ speechbubbleScroll: true }}
        >
          {lines.map((line, i) => (
            <Text key={i} style={[styles.text, { fontSize: textFontSize, lineHeight }]}>
              {renderTextWithBoldActions(
                line,
                [styles.text, { fontSize: textFontSize, lineHeight }],
                styles.boldActionText
              )}
            </Text>
          ))}
          <PaymentButtons />
        </ScrollView>
      </Animated.View>
    );
  }

  // Floating layout - positioned within wrapper (inherits floating animation)
  // Single character: offset to the right of center
  // Multiple characters: centered
  const horizontalPosition = isSingleCharacter ? '65%' : '50%';

  return (
    <Animated.View
      style={[
        styles.bubble,
        {
          opacity: fadeAnim,
          borderColor: characterColor,
          width: finalWidth,
          borderRadius: borderRadius.lg,
          paddingHorizontal: paddingH,
          paddingVertical: paddingV,
          // Position horizontally - right of center for single character
          left: horizontalPosition,
          top: -20,
          transform: [{ translateX: -finalWidth / 2 }],
        },
      ]}
    >
      <Text style={[styles.name, { color: characterColor, fontSize: nameFontSize, marginBottom: 4 }]}>
        {characterName}
      </Text>
      <ScrollView
        ref={scrollViewRef}
        style={[
          styles.scrollContainer,
          { maxHeight: maxContentHeight },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
        // @ts-ignore - dataSet is valid for React Native Web
        dataSet={{ speechbubbleScroll: true }}
      >
        {lines.map((line, i) => (
          <Text key={i} style={[styles.text, { fontSize: textFontSize, lineHeight }]}>
            {renderTextWithBoldActions(
              line,
              [styles.text, { fontSize: textFontSize, lineHeight }],
              styles.boldActionText
            )}
          </Text>
        ))}
        <PaymentButtons />
      </ScrollView>
    </Animated.View>
  );
}

// Helper to count words in an action (excluding asterisks)
function getActionWordCount(action: string): number {
  return action.replace(/\*/g, '').trim().split(/\s+/).length;
}

// Export helper to extract action text from a string
// Only returns SHORT actions (1-2 words) for floating display
export function extractActionText(text: string): string[] {
  const matches = text.match(/\*[^*]+\*/g);
  // Only return actions with 1-2 words (short actions float near character)
  return (matches || []).filter(action => getActionWordCount(action) <= 2);
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    backgroundColor: 'rgba(30, 30, 40, 0.85)',
    borderWidth: 2,
    zIndex: 100,
    pointerEvents: 'box-none', // Allow scroll interaction but don't block touches outside
  },
  bubbleMobileStacked: {
    position: 'relative',
    backgroundColor: 'rgba(30, 30, 40, 0.95)',
    borderWidth: 2,
    alignSelf: 'center',
    pointerEvents: 'box-none',
  },
  scrollContainer: {
    // Hide scrollbar on web (Firefox & IE/Edge)
    ...Platform.select({
      web: {
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      } as any,
      default: {},
    }),
  },
  name: {
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.3,
  },
  text: {
    fontFamily: 'Inter-Regular',
    color: '#ffffff',
  },
  boldActionText: {
    fontFamily: 'Inter-Bold',
    fontWeight: 'bold',
    color: '#ffffff',
  },
  actionText: {
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    fontStyle: 'italic',
    ...Platform.select({
      web: {
        display: 'inline-block',
        transform: 'rotate(-50deg)',
        transformOrigin: 'center',
        marginHorizontal: 4,
      } as any,
      default: {
        // Native doesn't support inline rotation well
      },
    }),
  },
  // Payment button styles
  paymentButtonsContainer: {
    marginTop: 12,
    gap: 8,
  },
  paymentButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  paymentButtonRecommended: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    borderColor: '#fbbf24',
    borderWidth: 2,
  },
  paymentButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentButtonTier: {
    fontFamily: 'Inter-Bold',
    color: '#3b82f6',
    fontSize: 14,
  },
  paymentButtonTierRecommended: {
    color: '#fbbf24',
  },
  paymentButtonPrice: {
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    fontSize: 14,
  },
  recommendedBadge: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recommendedBadgeText: {
    fontFamily: 'Inter-Bold',
    color: '#000000',
    fontSize: 9,
  },
});

export default SimpleSpeechBubble;
