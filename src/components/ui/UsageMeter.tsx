/**
 * Usage Meter Component
 * Displays token usage progress bar with tier information
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useResponsive } from '../../constants/Layout';
import {
  UsageInfo,
  formatTokens,
  getDaysUntilReset,
  getUsageColor,
  TIER_NAMES,
  TIER_COLORS,
  getTrialMessage,
  getDailyMessageStatus,
} from '../../services/usageTrackingService';

interface UsageMeterProps {
  usage: UsageInfo | null;
  compact?: boolean;
  onPress?: () => void;
}

export const UsageMeter: React.FC<UsageMeterProps> = ({
  usage,
  compact = false,
  onPress,
}) => {
  const { fonts, spacing, borderRadius, scalePx } = useResponsive();

  const dynamicStyles = useMemo(() => ({
    container: {
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      marginVertical: spacing.sm,
    },
    header: {
      marginBottom: spacing.md,
    },
    tierBadge: {
      borderRadius: borderRadius.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs / 2,
    },
    tierText: {
      fontSize: fonts.xs,
    },
    resetText: {
      fontSize: fonts.xs,
    },
    progressContainer: {
      marginBottom: spacing.sm,
    },
    progressBar: {
      height: scalePx(8),
      borderRadius: borderRadius.xs,
    },
    usageText: {
      fontSize: fonts.sm,
    },
    percentageText: {
      fontSize: fonts.sm,
    },
    remainingText: {
      fontSize: fonts.xs,
      marginTop: spacing.xs,
    },
    unlimitedText: {
      fontSize: fonts.sm,
      marginTop: spacing.xs,
    },
    trialWarning: {
      borderRadius: borderRadius.sm,
      padding: spacing.sm,
      marginBottom: spacing.md,
    },
    trialWarningText: {
      fontSize: fonts.xs,
    },
    dailyLimitContainer: {
      marginTop: spacing.md,
      paddingTop: spacing.md,
    },
    dailyLimitText: {
      fontSize: fonts.xs,
      marginBottom: spacing.xs,
    },
    dailyLimitBar: {
      height: scalePx(4),
      borderRadius: borderRadius.xs / 2,
    },
    compactContainer: {
      gap: spacing.sm,
    },
    compactBar: {
      height: scalePx(4),
      borderRadius: borderRadius.xs / 2,
    },
    compactText: {
      fontSize: fonts.xs,
      minWidth: scalePx(50),
    },
  }), [fonts, spacing, borderRadius, scalePx]);

  if (!usage) {
    return null;
  }

  // Admin doesn't need to see usage meter
  if (usage.tier === 'admin') {
    return compact ? null : (
      <View style={[styles.container, dynamicStyles.container]}>
        <View style={[styles.tierBadge, dynamicStyles.tierBadge]}>
          <Text style={[styles.tierText, dynamicStyles.tierText, { color: TIER_COLORS.admin }]}>
            {TIER_NAMES.admin}
          </Text>
        </View>
        <Text style={[styles.unlimitedText, dynamicStyles.unlimitedText]}>Unlimited</Text>
      </View>
    );
  }

  const percentage = Math.min(100, usage.usagePercentage);
  const barColor = getUsageColor(percentage);
  const daysUntilReset = getDaysUntilReset(usage.periodEnd);
  const trialMessage = getTrialMessage(usage);
  const dailyStatus = getDailyMessageStatus(usage);

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactContainer, dynamicStyles.compactContainer]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={[styles.compactBar, dynamicStyles.compactBar]}>
          <View
            style={[
              styles.compactProgress,
              { width: `${percentage}%`, backgroundColor: barColor, borderRadius: dynamicStyles.compactBar.borderRadius },
            ]}
          />
        </View>
        <Text style={[styles.compactText, dynamicStyles.compactText]}>
          {formatTokens(usage.remainingTokens)} left
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, dynamicStyles.container]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {/* Header with tier badge */}
      <View style={[styles.header, dynamicStyles.header]}>
        <View style={[styles.tierBadge, dynamicStyles.tierBadge, { borderColor: TIER_COLORS[usage.tier] }]}>
          <Text style={[styles.tierText, dynamicStyles.tierText, { color: TIER_COLORS[usage.tier] }]}>
            {TIER_NAMES[usage.tier]}
          </Text>
        </View>
        <Text style={[styles.resetText, dynamicStyles.resetText]}>
          {usage.tier === 'trial' && usage.trialDaysRemaining !== undefined
            ? `${usage.trialDaysRemaining} days left in trial`
            : `Resets in ${daysUntilReset} ${daysUntilReset === 1 ? 'day' : 'days'}`}
        </Text>
      </View>

      {/* Trial warning message */}
      {trialMessage && usage.trialDaysRemaining !== undefined && usage.trialDaysRemaining <= 3 && (
        <View style={[styles.trialWarning, dynamicStyles.trialWarning]}>
          <Text style={[styles.trialWarningText, dynamicStyles.trialWarningText]}>{trialMessage}</Text>
        </View>
      )}

      {/* Progress bar */}
      <View style={[styles.progressContainer, dynamicStyles.progressContainer]}>
        <View style={[styles.progressBar, dynamicStyles.progressBar]}>
          <View
            style={[
              styles.progressFill,
              { width: `${percentage}%`, backgroundColor: barColor, borderRadius: dynamicStyles.progressBar.borderRadius },
            ]}
          />
          {/* Threshold markers */}
          <View style={[styles.marker, { left: '80%' }]} />
          <View style={[styles.marker, { left: '90%' }]} />
        </View>
      </View>

      {/* Usage stats */}
      <View style={styles.statsRow}>
        <Text style={[styles.usageText, dynamicStyles.usageText]}>
          {formatTokens(usage.tokensUsed)} / {formatTokens(usage.tokenLimit)} tokens
        </Text>
        <Text style={[styles.percentageText, dynamicStyles.percentageText, { color: barColor }]}>
          {percentage.toFixed(0)}%
        </Text>
      </View>

      {/* Remaining tokens */}
      <Text style={[styles.remainingText, dynamicStyles.remainingText]}>
        {formatTokens(usage.remainingTokens)} tokens remaining
      </Text>

      {/* Daily message limit for free tier */}
      {dailyStatus && (
        <View style={[styles.dailyLimitContainer, dynamicStyles.dailyLimitContainer]}>
          <Text style={[styles.dailyLimitText, dynamicStyles.dailyLimitText]}>
            Daily messages: {dailyStatus.used}/{dailyStatus.limit}
          </Text>
          <View style={[styles.dailyLimitBar, dynamicStyles.dailyLimitBar]}>
            <View
              style={[
                styles.dailyLimitFill,
                {
                  width: `${Math.min(100, (dailyStatus.used / dailyStatus.limit) * 100)}%`,
                  backgroundColor: dailyStatus.remaining === 0 ? '#EF4444' : '#3B82F6',
                  borderRadius: dynamicStyles.dailyLimitBar.borderRadius,
                },
              ]}
            />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1F2937',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierBadge: {
    borderWidth: 1,
  },
  tierText: {
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  resetText: {
    color: '#9CA3AF',
  },
  progressContainer: {},
  progressBar: {
    backgroundColor: '#374151',
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
  },
  marker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  usageText: {
    color: '#D1D5DB',
  },
  percentageText: {
    fontWeight: '600',
  },
  remainingText: {
    color: '#9CA3AF',
  },
  unlimitedText: {
    color: '#9CA3AF',
  },
  // Trial warning styles
  trialWarning: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  trialWarningText: {
    color: '#93C5FD',
    textAlign: 'center',
  },
  // Daily limit styles
  dailyLimitContainer: {
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  dailyLimitText: {
    color: '#9CA3AF',
  },
  dailyLimitBar: {
    backgroundColor: '#374151',
    overflow: 'hidden',
  },
  dailyLimitFill: {
    height: '100%',
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactBar: {
    flex: 1,
    backgroundColor: '#374151',
    overflow: 'hidden',
  },
  compactProgress: {
    height: '100%',
  },
  compactText: {
    color: '#9CA3AF',
    textAlign: 'right',
  },
});

export default UsageMeter;
