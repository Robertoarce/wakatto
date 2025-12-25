/**
 * Limit Warning Banner Component
 * Shows warning messages at 80% and 90% token usage thresholds
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  UsageInfo,
  WarningLevel,
  formatTokens,
  getDaysUntilReset,
  getWarningMessage,
} from '../services/usageTrackingService';
import { useResponsive } from '../constants/Layout';

interface LimitWarningBannerProps {
  usage: UsageInfo;
  onDismiss?: () => void;
  onUpgrade?: () => void;
}

export const LimitWarningBanner: React.FC<LimitWarningBannerProps> = ({
  usage,
  onDismiss,
  onUpgrade,
}) => {
  const { fonts, spacing, borderRadius, scalePx } = useResponsive();

  const dynamicStyles = useMemo(() => ({
    container: {
      borderRadius: borderRadius.sm,
      marginHorizontal: spacing.lg,
      marginVertical: spacing.sm,
    },
    content: {
      padding: spacing.md,
      gap: spacing.md,
    },
    iconContainer: {
      width: scalePx(24),
      height: scalePx(24),
      borderRadius: scalePx(12),
    },
    title: {
      fontSize: fonts.sm,
      marginBottom: spacing.xs / 2,
    },
    message: {
      fontSize: fonts.xs,
      lineHeight: scalePx(18),
    },
    subtext: {
      fontSize: scalePx(11),
      marginTop: spacing.xs,
    },
    actions: {
      gap: spacing.sm,
    },
    upgradeButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.xs,
    },
    upgradeText: {
      fontSize: fonts.xs,
    },
    dismissButton: {
      padding: spacing.xs,
    },
    dismissText: {
      fontSize: fonts.lg,
    },
    progressBar: {
      height: scalePx(3),
    },
  }), [fonts, spacing, borderRadius, scalePx]);

  if (!usage.warningLevel || usage.warningLevel === 'blocked') {
    return null;
  }

  const isWarning = usage.warningLevel === 'warning';
  const isCritical = usage.warningLevel === 'critical';

  const backgroundColor = isCritical ? '#FEF2F2' : '#FFFBEB';
  const borderColor = isCritical ? '#FCA5A5' : '#FDE68A';
  const textColor = isCritical ? '#991B1B' : '#92400E';
  const iconColor = isCritical ? '#EF4444' : '#F59E0B';

  const message = getWarningMessage(usage.warningLevel, usage.remainingTokens, usage.periodEnd, usage);
  const daysUntilReset = getDaysUntilReset(usage.periodEnd);

  return (
    <View style={[styles.container, dynamicStyles.container, { backgroundColor, borderColor }]}>
      <View style={[styles.content, dynamicStyles.content]}>
        {/* Warning icon */}
        <View style={[styles.iconContainer, dynamicStyles.iconContainer]}>
          <Text style={[styles.icon, { color: iconColor }]}>
            {isCritical ? '!' : '!'}
          </Text>
        </View>

        {/* Message */}
        <View style={styles.messageContainer}>
          <Text style={[styles.title, dynamicStyles.title, { color: textColor }]}>
            {isCritical ? 'Running Low on Tokens' : 'Usage Warning'}
          </Text>
          <Text style={[styles.message, dynamicStyles.message, { color: textColor }]}>
            {message}
          </Text>
          <Text style={[styles.subtext, dynamicStyles.subtext, { color: textColor, opacity: 0.8 }]}>
            Resets in {daysUntilReset} {daysUntilReset === 1 ? 'day' : 'days'}
          </Text>
        </View>

        {/* Actions */}
        <View style={[styles.actions, dynamicStyles.actions]}>
          {onUpgrade && (
            <TouchableOpacity
              style={[styles.upgradeButton, dynamicStyles.upgradeButton, { backgroundColor: iconColor }]}
              onPress={onUpgrade}
            >
              <Text style={[styles.upgradeText, dynamicStyles.upgradeText]}>Upgrade</Text>
            </TouchableOpacity>
          )}
          {onDismiss && (
            <TouchableOpacity style={[styles.dismissButton, dynamicStyles.dismissButton]} onPress={onDismiss}>
              <Text style={[styles.dismissText, dynamicStyles.dismissText, { color: textColor }]}>x</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Progress indicator */}
      <View style={[styles.progressBar, dynamicStyles.progressBar]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.min(100, usage.usagePercentage)}%`,
              backgroundColor: iconColor,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontWeight: 'bold',
  },
  messageContainer: {
    flex: 1,
  },
  title: {
    fontWeight: '600',
  },
  message: {},
  subtext: {},
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upgradeButton: {},
  upgradeText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dismissButton: {},
  dismissText: {
    fontWeight: '300',
    opacity: 0.6,
  },
  progressBar: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  progressFill: {
    height: '100%',
  },
});

export default LimitWarningBanner;
