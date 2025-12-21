/**
 * Blocked State Overlay Component
 * Shown when user has reached their token limit (100%)
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  UsageInfo,
  formatTokens,
  getDaysUntilReset,
  formatPeriodEnd,
  TIER_NAMES,
} from '../services/usageTrackingService';

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
  const daysUntilReset = getDaysUntilReset(usage.periodEnd);
  const resetDate = formatPeriodEnd(usage.periodEnd);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>!</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Token Limit Reached</Text>

        {/* Message */}
        <Text style={styles.message}>
          You've used all {formatTokens(usage.tokenLimit)} tokens included in your{' '}
          <Text style={styles.tierHighlight}>{TIER_NAMES[usage.tier]}</Text> plan this period.
        </Text>

        {/* Reset countdown */}
        <View style={styles.resetContainer}>
          <Text style={styles.resetLabel}>Resets on</Text>
          <Text style={styles.resetDate}>{resetDate}</Text>
          <Text style={styles.resetDays}>
            ({daysUntilReset} {daysUntilReset === 1 ? 'day' : 'days'} remaining)
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {onUpgrade && (
            <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
              <Text style={styles.upgradeText}>Upgrade Plan</Text>
            </TouchableOpacity>
          )}
          {onDismiss && (
            <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
              <Text style={styles.dismissText}>I'll wait for reset</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tier comparison hint */}
        <Text style={styles.hint}>
          Upgrade to get more tokens and unlock additional features
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
  const daysUntilReset = getDaysUntilReset(usage.periodEnd);

  return (
    <View style={styles.inlineContainer}>
      <View style={styles.inlineContent}>
        <Text style={styles.inlineIcon}>!</Text>
        <View style={styles.inlineTextContainer}>
          <Text style={styles.inlineTitle}>Token limit reached</Text>
          <Text style={styles.inlineMessage}>
            Resets in {daysUntilReset} {daysUntilReset === 1 ? 'day' : 'days'}
          </Text>
        </View>
        {onUpgrade && (
          <TouchableOpacity style={styles.inlineUpgrade} onPress={onUpgrade}>
            <Text style={styles.inlineUpgradeText}>Upgrade</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 100,
  },
  content: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 24,
    maxWidth: 400,
    width: '100%',
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#D1D5DB',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  tierHighlight: {
    color: '#A78BFA',
    fontWeight: '600',
  },
  resetContainer: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  resetLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  resetDate: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  resetDays: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
    marginBottom: 16,
  },
  upgradeButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dismissButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  dismissText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  hint: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Inline indicator styles
  inlineContainer: {
    backgroundColor: '#FEF2F2',
    borderTopWidth: 1,
    borderTopColor: '#FCA5A5',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  inlineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inlineIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FCA5A5',
    color: '#991B1B',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 24,
  },
  inlineTextContainer: {
    flex: 1,
  },
  inlineTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#991B1B',
  },
  inlineMessage: {
    fontSize: 11,
    color: '#B91C1C',
  },
  inlineUpgrade: {
    backgroundColor: '#EF4444',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  inlineUpgradeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default BlockedStateOverlay;
