/**
 * Blocked State Overlay Component
 * Shown when user has reached their token limit (100%)
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import {
  UsageInfo,
  formatTokens,
  getDaysUntilReset,
  formatPeriodEnd,
  TIER_NAMES,
  DAILY_MESSAGE_LIMITS,
} from '../services/usageTrackingService';
import { useResponsive } from '../constants/Layout';

interface BlockedStateOverlayProps {
  usage: UsageInfo;
  onUpgrade?: () => void;
  onDismiss?: () => void;
}

export const BlockedStateOverlay: React.FC<BlockedStateOverlayProps> = ({
  usage,
  onUpgrade,
  onDismiss,
}) => {
  const { width: viewportWidth } = useWindowDimensions();
  const { fonts, spacing, borderRadius, components, scalePx } = useResponsive();
  const daysUntilReset = getDaysUntilReset(usage.periodEnd);
  const resetDate = formatPeriodEnd(usage.periodEnd);

  // Responsive maxWidth - 90% of viewport, capped at 400px
  const contentMaxWidth = Math.min(scalePx(400), viewportWidth * 0.9);

  // Dynamic styles based on responsive values
  const dynamicStyles = useMemo(() => {
    const iconSize = components.iconSizes.xxl;
    return {
      container: {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        padding: spacing.xl,
        zIndex: 100,
      },
      content: {
        backgroundColor: '#1F2937',
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        width: '100%' as const,
        alignItems: 'center' as const,
      },
      iconContainer: {
        width: iconSize,
        height: iconSize,
        borderRadius: iconSize / 2,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        marginBottom: spacing.lg,
      },
      icon: {
        fontSize: fonts.xxxl,
        fontWeight: 'bold' as const,
        color: '#EF4444',
      },
      title: {
        fontSize: fonts.xl,
        fontWeight: '700' as const,
        color: '#F9FAFB',
        marginBottom: spacing.sm,
        textAlign: 'center' as const,
      },
      message: {
        fontSize: fonts.md,
        color: '#D1D5DB',
        textAlign: 'center' as const,
        lineHeight: scalePx(20),
        marginBottom: spacing.lg,
      },
      resetContainer: {
        backgroundColor: '#374151',
        borderRadius: borderRadius.sm,
        padding: spacing.lg,
        alignItems: 'center' as const,
        marginBottom: spacing.xl,
        width: '100%' as const,
      },
      resetLabel: {
        fontSize: fonts.xs,
        color: '#9CA3AF',
        marginBottom: spacing.xs,
      },
      resetDate: {
        fontSize: fonts.xxl,
        fontWeight: '700' as const,
        color: '#F9FAFB',
      },
      resetDays: {
        fontSize: fonts.xs,
        color: '#9CA3AF',
        marginTop: spacing.xs,
      },
      actions: {
        flexDirection: 'column' as const,
        gap: spacing.md,
        width: '100%' as const,
        marginBottom: spacing.lg,
      },
      upgradeButton: {
        backgroundColor: '#8B5CF6',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.sm,
        alignItems: 'center' as const,
      },
      upgradeText: {
        color: '#FFFFFF',
        fontSize: fonts.md,
        fontWeight: '600' as const,
      },
      dismissButton: {
        paddingVertical: spacing.sm,
        alignItems: 'center' as const,
      },
      dismissText: {
        color: '#9CA3AF',
        fontSize: fonts.md,
      },
      hint: {
        fontSize: fonts.xs,
        color: '#6B7280',
        textAlign: 'center' as const,
      },
    };
  }, [fonts, spacing, borderRadius, components, scalePx]);

  // Check if blocked due to daily message limit (free tier only)
  const isBlockedByDailyLimit = usage.tier === 'free' &&
    usage.dailyMessagesUsed !== undefined &&
    usage.dailyMessagesLimit !== undefined &&
    usage.dailyMessagesUsed >= usage.dailyMessagesLimit;

  const title = isBlockedByDailyLimit ? 'Daily Message Limit Reached' : 'Token Limit Reached';
  const message = isBlockedByDailyLimit
    ? `You've sent ${usage.dailyMessagesLimit} messages today, which is the daily limit for the ${TIER_NAMES[usage.tier]} plan.`
    : `You've used all ${formatTokens(usage.tokenLimit)} tokens included in your ${TIER_NAMES[usage.tier]} plan this period.`;
  const resetInfo = isBlockedByDailyLimit
    ? 'Your daily limit resets at midnight.'
    : `Resets on ${resetDate} (${daysUntilReset} ${daysUntilReset === 1 ? 'day' : 'days'} remaining)`;
  const dismissText = isBlockedByDailyLimit ? "I'll come back tomorrow" : "I'll wait for reset";

  return (
    <View style={dynamicStyles.container}>
      <View style={[dynamicStyles.content, { maxWidth: contentMaxWidth }]}>
        {/* Icon */}
        <View style={dynamicStyles.iconContainer}>
          <Text style={dynamicStyles.icon}>!</Text>
        </View>

        {/* Title */}
        <Text style={dynamicStyles.title}>{title}</Text>

        {/* Message */}
        <Text style={dynamicStyles.message}>{message}</Text>

        {/* Reset countdown */}
        <View style={dynamicStyles.resetContainer}>
          {isBlockedByDailyLimit ? (
            <>
              <Text style={dynamicStyles.resetLabel}>Daily limit</Text>
              <Text style={dynamicStyles.resetDate}>{usage.dailyMessagesLimit} messages</Text>
              <Text style={dynamicStyles.resetDays}>{resetInfo}</Text>
            </>
          ) : (
            <>
              <Text style={dynamicStyles.resetLabel}>Resets on</Text>
              <Text style={dynamicStyles.resetDate}>{resetDate}</Text>
              <Text style={dynamicStyles.resetDays}>
                ({daysUntilReset} {daysUntilReset === 1 ? 'day' : 'days'} remaining)
              </Text>
            </>
          )}
        </View>

        {/* Actions */}
        <View style={dynamicStyles.actions}>
          {onUpgrade && (
            <TouchableOpacity style={dynamicStyles.upgradeButton} onPress={onUpgrade}>
              <Text style={dynamicStyles.upgradeText}>Upgrade Plan</Text>
            </TouchableOpacity>
          )}
          {onDismiss && (
            <TouchableOpacity style={dynamicStyles.dismissButton} onPress={onDismiss}>
              <Text style={dynamicStyles.dismissText}>{dismissText}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tier comparison hint */}
        <Text style={dynamicStyles.hint}>
          {isBlockedByDailyLimit
            ? 'Upgrade to remove daily message limits'
            : 'Upgrade to get more tokens and unlock additional features'}
        </Text>
      </View>
    </View>
  );
};

/**
 * Inline blocked indicator for chat input area
 */
export const BlockedInputIndicator: React.FC<{
  usage: UsageInfo;
  onUpgrade?: () => void;
}> = ({ usage, onUpgrade }) => {
  const { fonts, spacing, borderRadius, scalePx } = useResponsive();
  const daysUntilReset = getDaysUntilReset(usage.periodEnd);

  // Check if blocked due to daily message limit (free tier only)
  const isBlockedByDailyLimit = usage.tier === 'free' &&
    usage.dailyMessagesUsed !== undefined &&
    usage.dailyMessagesLimit !== undefined &&
    usage.dailyMessagesUsed >= usage.dailyMessagesLimit;

  const title = isBlockedByDailyLimit ? 'Daily limit reached' : 'Token limit reached';
  const message = isBlockedByDailyLimit
    ? 'Come back tomorrow'
    : `Resets in ${daysUntilReset} ${daysUntilReset === 1 ? 'day' : 'days'}`;

  // Dynamic inline styles
  const inlineStyles = useMemo(() => {
    const iconSize = scalePx(24);
    return {
      inlineContainer: {
        backgroundColor: '#FEF2F2',
        borderTopWidth: scalePx(1),
        borderTopColor: '#FCA5A5',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
      },
      inlineContent: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: spacing.md,
      },
      inlineIcon: {
        width: iconSize,
        height: iconSize,
        borderRadius: iconSize / 2,
        backgroundColor: '#FCA5A5',
        color: '#991B1B',
        fontSize: fonts.md,
        fontWeight: 'bold' as const,
        textAlign: 'center' as const,
        lineHeight: iconSize,
      },
      inlineTextContainer: {
        flex: 1,
      },
      inlineTitle: {
        fontSize: fonts.sm,
        fontWeight: '600' as const,
        color: '#991B1B',
      },
      inlineMessage: {
        fontSize: fonts.xs,
        color: '#B91C1C',
      },
      inlineUpgrade: {
        backgroundColor: '#EF4444',
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.xs,
      },
      inlineUpgradeText: {
        color: '#FFFFFF',
        fontSize: fonts.xs,
        fontWeight: '600' as const,
      },
    };
  }, [fonts, spacing, borderRadius, scalePx]);

  return (
    <View style={inlineStyles.inlineContainer}>
      <View style={inlineStyles.inlineContent}>
        <Text style={inlineStyles.inlineIcon}>!</Text>
        <View style={inlineStyles.inlineTextContainer}>
          <Text style={inlineStyles.inlineTitle}>{title}</Text>
          <Text style={inlineStyles.inlineMessage}>{message}</Text>
        </View>
        {onUpgrade && (
          <TouchableOpacity style={inlineStyles.inlineUpgrade} onPress={onUpgrade}>
            <Text style={inlineStyles.inlineUpgradeText}>Upgrade</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Static styles kept for reference - most styles are now dynamic
const styles = StyleSheet.create({
  // Preserved for backwards compatibility
  tierHighlight: {
    color: '#A78BFA',
    fontWeight: '600',
  },
});

export default BlockedStateOverlay;
