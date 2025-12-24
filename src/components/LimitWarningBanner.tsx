/**
 * Limit Warning Banner Component
 * Shows warning messages at 80% and 90% token usage thresholds
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  UsageInfo,
  WarningLevel,
  formatTokens,
  getDaysUntilReset,
  getWarningMessage,
} from '../services/usageTrackingService';

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
    <View style={[styles.container, { backgroundColor, borderColor }]}>
      <View style={styles.content}>
        {/* Warning icon */}
        <View style={styles.iconContainer}>
          <Text style={[styles.icon, { color: iconColor }]}>
            {isCritical ? '!' : '!'}
          </Text>
        </View>

        {/* Message */}
        <View style={styles.messageContainer}>
          <Text style={[styles.title, { color: textColor }]}>
            {isCritical ? 'Running Low on Tokens' : 'Usage Warning'}
          </Text>
          <Text style={[styles.message, { color: textColor }]}>
            {message}
          </Text>
          <Text style={[styles.subtext, { color: textColor, opacity: 0.8 }]}>
            Resets in {daysUntilReset} {daysUntilReset === 1 ? 'day' : 'days'}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {onUpgrade && (
            <TouchableOpacity
              style={[styles.upgradeButton, { backgroundColor: iconColor }]}
              onPress={onUpgrade}
            >
              <Text style={styles.upgradeText}>Upgrade</Text>
            </TouchableOpacity>
          )}
          {onDismiss && (
            <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
              <Text style={[styles.dismissText, { color: textColor }]}>x</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Progress indicator */}
      <View style={styles.progressBar}>
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
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 12,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  messageContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
  },
  subtext: {
    fontSize: 11,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  upgradeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  upgradeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  dismissButton: {
    padding: 4,
  },
  dismissText: {
    fontSize: 18,
    fontWeight: '300',
    opacity: 0.6,
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  progressFill: {
    height: '100%',
  },
});

export default LimitWarningBanner;
