/**
 * Usage Meter Component
 * Displays token usage progress bar with tier information
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
  if (!usage) {
    return null;
  }

  // Admin doesn't need to see usage meter
  if (usage.tier === 'admin') {
    return compact ? null : (
      <View style={styles.container}>
        <View style={styles.tierBadge}>
          <Text style={[styles.tierText, { color: TIER_COLORS.admin }]}>
            {TIER_NAMES.admin}
          </Text>
        </View>
        <Text style={styles.unlimitedText}>Unlimited</Text>
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
        style={styles.compactContainer}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.compactBar}>
          <View
            style={[
              styles.compactProgress,
              { width: `${percentage}%`, backgroundColor: barColor },
            ]}
          />
        </View>
        <Text style={styles.compactText}>
          {formatTokens(usage.remainingTokens)} left
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {/* Header with tier badge */}
      <View style={styles.header}>
        <View style={[styles.tierBadge, { borderColor: TIER_COLORS[usage.tier] }]}>
          <Text style={[styles.tierText, { color: TIER_COLORS[usage.tier] }]}>
            {TIER_NAMES[usage.tier]}
          </Text>
        </View>
        <Text style={styles.resetText}>
          {usage.tier === 'trial' && usage.trialDaysRemaining !== undefined
            ? `${usage.trialDaysRemaining} days left in trial`
            : `Resets in ${daysUntilReset} ${daysUntilReset === 1 ? 'day' : 'days'}`}
        </Text>
      </View>

      {/* Trial warning message */}
      {trialMessage && usage.trialDaysRemaining !== undefined && usage.trialDaysRemaining <= 3 && (
        <View style={styles.trialWarning}>
          <Text style={styles.trialWarningText}>{trialMessage}</Text>
        </View>
      )}

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${percentage}%`, backgroundColor: barColor },
            ]}
          />
          {/* Threshold markers */}
          <View style={[styles.marker, { left: '80%' }]} />
          <View style={[styles.marker, { left: '90%' }]} />
        </View>
      </View>

      {/* Usage stats */}
      <View style={styles.statsRow}>
        <Text style={styles.usageText}>
          {formatTokens(usage.tokensUsed)} / {formatTokens(usage.tokenLimit)} tokens
        </Text>
        <Text style={[styles.percentageText, { color: barColor }]}>
          {percentage.toFixed(0)}%
        </Text>
      </View>

      {/* Remaining tokens */}
      <Text style={styles.remainingText}>
        {formatTokens(usage.remainingTokens)} tokens remaining
      </Text>

      {/* Daily message limit for free tier */}
      {dailyStatus && (
        <View style={styles.dailyLimitContainer}>
          <Text style={styles.dailyLimitText}>
            Daily messages: {dailyStatus.used}/{dailyStatus.limit}
          </Text>
          <View style={styles.dailyLimitBar}>
            <View
              style={[
                styles.dailyLimitFill,
                {
                  width: `${Math.min(100, (dailyStatus.used / dailyStatus.limit) * 100)}%`,
                  backgroundColor: dailyStatus.remaining === 0 ? '#EF4444' : '#3B82F6',
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
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tierBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tierText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  resetText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
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
    fontSize: 14,
    color: '#D1D5DB',
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '600',
  },
  remainingText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  unlimitedText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  // Trial warning styles
  trialWarning: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
  },
  trialWarningText: {
    fontSize: 12,
    color: '#93C5FD',
    textAlign: 'center',
  },
  // Daily limit styles
  dailyLimitContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  dailyLimitText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  dailyLimitBar: {
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    overflow: 'hidden',
  },
  dailyLimitFill: {
    height: '100%',
    borderRadius: 2,
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    overflow: 'hidden',
  },
  compactProgress: {
    height: '100%',
    borderRadius: 2,
  },
  compactText: {
    fontSize: 11,
    color: '#9CA3AF',
    minWidth: 50,
    textAlign: 'right',
  },
});

export default UsageMeter;
