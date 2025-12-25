/**
 * Upgrade Prompt Modal Component
 * Shows upgrade options when user reaches 80% usage
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, useWindowDimensions } from 'react-native';
import { useResponsive } from '../constants/Layout';
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
  const { fonts, spacing, borderRadius, scalePx } = useResponsive();
  const daysUntilReset = getDaysUntilReset(usage.periodEnd);

  // Responsive maxWidth - 90% of viewport, capped at 500px
  const modalMaxWidth = Math.min(scalePx(500), viewportWidth * 0.9);

  const dynamicStyles = useMemo(() => ({
    overlay: { padding: spacing.xl },
    modal: { borderRadius: borderRadius.lg, padding: spacing.xl },
    header: { marginBottom: spacing.xl },
    title: { fontSize: fonts.xl, marginBottom: spacing.sm },
    subtitle: { fontSize: fonts.sm },
    usageBox: { borderRadius: borderRadius.sm, padding: spacing.lg, marginBottom: spacing.xl },
    usageRow: { marginBottom: spacing.sm },
    usageLabel: { fontSize: fonts.xs },
    usageValue: { fontSize: fonts.xs },
    progressBar: { height: scalePx(6), borderRadius: borderRadius.xs / 2 },
    resetText: { fontSize: fonts.xs, marginTop: spacing.sm },
    tiersContainer: { gap: spacing.md, marginBottom: spacing.xl },
    tierCard: { borderRadius: borderRadius.md, padding: spacing.lg },
    recommendedBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs / 2, borderRadius: borderRadius.xs },
    recommendedText: { fontSize: scalePx(9) },
    tierName: { fontSize: fonts.lg, marginBottom: spacing.xs, marginTop: spacing.sm },
    tierTokens: { fontSize: fonts.xs, marginBottom: spacing.md },
    featuresList: { marginBottom: spacing.md },
    featureItem: { fontSize: fonts.xs, marginBottom: spacing.xs },
    tierPrice: { fontSize: fonts.xl, marginBottom: spacing.md },
    selectButton: { paddingVertical: spacing.md, borderRadius: borderRadius.sm },
    selectText: { fontSize: fonts.sm },
    dismissButton: { paddingVertical: spacing.md },
    dismissText: { fontSize: fonts.sm },
  }), [fonts, spacing, borderRadius, scalePx]);

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
      <View style={[styles.overlay, dynamicStyles.overlay]}>
        <View style={[styles.modal, dynamicStyles.modal, { maxWidth: modalMaxWidth }]}>
          {/* Header */}
          <View style={[styles.header, dynamicStyles.header]}>
            <Text style={[styles.title, dynamicStyles.title]}>Running Low on Tokens</Text>
            <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
              You've used {usage.usagePercentage.toFixed(0)}% of your{' '}
              {TIER_NAMES[usage.tier]} plan tokens
            </Text>
          </View>

          {/* Current usage */}
          <View style={[styles.usageBox, dynamicStyles.usageBox]}>
            <View style={[styles.usageRow, dynamicStyles.usageRow]}>
              <Text style={[styles.usageLabel, dynamicStyles.usageLabel]}>Used</Text>
              <Text style={[styles.usageValue, dynamicStyles.usageValue]}>
                {formatTokens(usage.tokensUsed)} / {formatTokens(usage.tokenLimit)}
              </Text>
            </View>
            <View style={[styles.progressBar, dynamicStyles.progressBar]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(100, usage.usagePercentage)}%`, borderRadius: dynamicStyles.progressBar.borderRadius },
                ]}
              />
            </View>
            <Text style={[styles.resetText, dynamicStyles.resetText]}>
              Resets in {daysUntilReset} {daysUntilReset === 1 ? 'day' : 'days'}
            </Text>
          </View>

          {/* Tier options */}
          <View style={[styles.tiersContainer, dynamicStyles.tiersContainer]}>
            {tierOptions.map(option => (
              <TouchableOpacity
                key={option.tier}
                style={[
                  styles.tierCard,
                  dynamicStyles.tierCard,
                  option.recommended && styles.recommendedCard,
                ]}
                onPress={() => onUpgrade?.(option.tier)}
                disabled={!onUpgrade}
              >
                {option.recommended && (
                  <View style={[styles.recommendedBadge, dynamicStyles.recommendedBadge]}>
                    <Text style={[styles.recommendedText, dynamicStyles.recommendedText]}>BEST VALUE</Text>
                  </View>
                )}
                <Text
                  style={[
                    styles.tierName,
                    dynamicStyles.tierName,
                    { color: TIER_COLORS[option.tier] },
                  ]}
                >
                  {option.name}
                </Text>
                <Text style={[styles.tierTokens, dynamicStyles.tierTokens]}>
                  {formatTokens(option.tokens)} tokens/period
                </Text>
                <View style={[styles.featuresList, dynamicStyles.featuresList]}>
                  {option.features.map((feature, idx) => (
                    <Text key={idx} style={[styles.featureItem, dynamicStyles.featureItem]}>
                      + {feature}
                    </Text>
                  ))}
                </View>
                <Text style={[styles.tierPrice, dynamicStyles.tierPrice]}>{option.price}</Text>
                <View
                  style={[
                    styles.selectButton,
                    dynamicStyles.selectButton,
                    { backgroundColor: TIER_COLORS[option.tier] },
                  ]}
                >
                  <Text style={[styles.selectText, dynamicStyles.selectText]}>Upgrade</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Dismiss option */}
          <TouchableOpacity style={[styles.dismissButton, dynamicStyles.dismissButton]} onPress={onDismiss}>
            <Text style={[styles.dismissText, dynamicStyles.dismissText]}>Remind me later</Text>
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
  },
  modal: {
    backgroundColor: '#1F2937',
    width: '100%',
  },
  header: {
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
    color: '#F9FAFB',
  },
  subtitle: {
    color: '#9CA3AF',
    textAlign: 'center',
  },
  usageBox: {
    backgroundColor: '#374151',
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  usageLabel: {
    color: '#9CA3AF',
  },
  usageValue: {
    color: '#D1D5DB',
    fontWeight: '600',
  },
  progressBar: {
    backgroundColor: '#4B5563',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
  },
  resetText: {
    color: '#9CA3AF',
    textAlign: 'center',
  },
  tiersContainer: {
    flexDirection: 'row',
  },
  tierCard: {
    flex: 1,
    backgroundColor: '#374151',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  recommendedCard: {
    borderColor: '#F59E0B',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    left: '50%' as any,
    transform: [{ translateX: -40 }],
    backgroundColor: '#F59E0B',
  },
  recommendedText: {
    fontWeight: '700',
    color: '#1F2937',
  },
  tierName: {
    fontWeight: '700',
  },
  tierTokens: {
    color: '#9CA3AF',
  },
  featuresList: {},
  featureItem: {
    color: '#D1D5DB',
  },
  tierPrice: {
    fontWeight: '700',
    color: '#F9FAFB',
  },
  selectButton: {
    alignItems: 'center',
  },
  selectText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dismissButton: {
    alignItems: 'center',
  },
  dismissText: {
    color: '#6B7280',
  },
});

export default UpgradePromptModal;
