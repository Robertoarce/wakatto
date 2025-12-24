/**
 * Upgrade Prompt Modal Component
 * Shows upgrade options when user reaches 80% usage
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, useWindowDimensions } from 'react-native';
import {
  UsageInfo,
  AccountTier,
  formatTokens,
  getDaysUntilReset,
  TIER_NAMES,
  TIER_COLORS,
  TIER_LIMITS,
} from '../services/usageTrackingService';

interface UpgradePromptModalProps {
  visible: boolean;
  usage: UsageInfo;
  onUpgrade?: (tier: AccountTier) => void;
  onDismiss: () => void;
}

interface TierOption {
  tier: AccountTier;
  name: string;
  tokens: number;
  price: string;
  features: string[];
  recommended?: boolean;
}

const TIER_OPTIONS: TierOption[] = [
  {
    tier: 'premium',
    name: TIER_NAMES.premium,
    tokens: TIER_LIMITS.premium,
    price: '$9.99/mo',
    features: ['5x more tokens', 'Priority support', 'Advanced features'],
  },
  {
    tier: 'gold',
    name: TIER_NAMES.gold,
    tokens: TIER_LIMITS.gold,
    price: '$24.99/mo',
    features: ['20x more tokens', 'Premium support', 'All features', 'Early access'],
    recommended: true,
  },
];

export const UpgradePromptModal: React.FC<UpgradePromptModalProps> = ({
  visible,
  usage,
  onUpgrade,
  onDismiss,
}) => {
  const { width: viewportWidth } = useWindowDimensions();
  const daysUntilReset = getDaysUntilReset(usage.periodEnd);

  // Responsive maxWidth - 90% of viewport, capped at 500px
  const modalMaxWidth = Math.min(500, viewportWidth * 0.9);

  const getNextTierOptions = (): TierOption[] => {
    switch (usage.tier) {
      case 'free':
        return TIER_OPTIONS;
      case 'premium':
        return TIER_OPTIONS.filter(t => t.tier === 'gold');
      default:
        return [];
    }
  };

  const tierOptions = getNextTierOptions();

  if (tierOptions.length === 0) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { maxWidth: modalMaxWidth }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Running Low on Tokens</Text>
            <Text style={styles.subtitle}>
              You've used {usage.usagePercentage.toFixed(0)}% of your{' '}
              {TIER_NAMES[usage.tier]} plan tokens
            </Text>
          </View>

          {/* Current usage */}
          <View style={styles.usageBox}>
            <View style={styles.usageRow}>
              <Text style={styles.usageLabel}>Used</Text>
              <Text style={styles.usageValue}>
                {formatTokens(usage.tokensUsed)} / {formatTokens(usage.tokenLimit)}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(100, usage.usagePercentage)}%` },
                ]}
              />
            </View>
            <Text style={styles.resetText}>
              Resets in {daysUntilReset} {daysUntilReset === 1 ? 'day' : 'days'}
            </Text>
          </View>

          {/* Tier options */}
          <View style={styles.tiersContainer}>
            {tierOptions.map(option => (
              <TouchableOpacity
                key={option.tier}
                style={[
                  styles.tierCard,
                  option.recommended && styles.recommendedCard,
                ]}
                onPress={() => onUpgrade?.(option.tier)}
                disabled={!onUpgrade}
              >
                {option.recommended && (
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedText}>BEST VALUE</Text>
                  </View>
                )}
                <Text
                  style={[
                    styles.tierName,
                    { color: TIER_COLORS[option.tier] },
                  ]}
                >
                  {option.name}
                </Text>
                <Text style={styles.tierTokens}>
                  {formatTokens(option.tokens)} tokens/period
                </Text>
                <View style={styles.featuresList}>
                  {option.features.map((feature, idx) => (
                    <Text key={idx} style={styles.featureItem}>
                      + {feature}
                    </Text>
                  ))}
                </View>
                <Text style={styles.tierPrice}>{option.price}</Text>
                <View
                  style={[
                    styles.selectButton,
                    { backgroundColor: TIER_COLORS[option.tier] },
                  ]}
                >
                  <Text style={styles.selectText}>Upgrade</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Dismiss option */}
          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissText}>Remind me later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 24,
    // maxWidth applied dynamically for responsive sizing
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  usageBox: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  usageLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  usageValue: {
    fontSize: 12,
    color: '#D1D5DB',
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#4B5563',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },
  resetText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  tiersContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  tierCard: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  recommendedCard: {
    borderColor: '#F59E0B',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    left: '50%',
    transform: [{ translateX: -40 }],
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recommendedText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1F2937',
  },
  tierName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    marginTop: 8,
  },
  tierTokens: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  featuresList: {
    marginBottom: 12,
  },
  featureItem: {
    fontSize: 11,
    color: '#D1D5DB',
    marginBottom: 4,
  },
  tierPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 12,
  },
  selectButton: {
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  selectText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  dismissButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  dismissText: {
    color: '#6B7280',
    fontSize: 14,
  },
});

export default UpgradePromptModal;
