/**
 * Usage Tracking Service
 * Handles token usage tracking and tier management for the account system
 */

import { supabase } from '../lib/supabase';

// Account tier types
export type AccountTier = 'trial' | 'free' | 'premium' | 'gold' | 'admin';
export type WarningLevel = 'warning' | 'critical' | 'blocked' | null;

// Usage information returned from the server
export interface UsageInfo {
  tier: AccountTier;
  tokensUsed: number;
  tokenLimit: number;
  remainingTokens: number;
  usagePercentage: number;
  periodEnd: string;
  warningLevel: WarningLevel;
  resetPeriodDays?: number;
  promptTokens?: number;
  completionTokens?: number;
  // Daily message limits (free tier)
  dailyMessagesUsed?: number;
  dailyMessagesLimit?: number;
  // Trial tier
  trialDaysRemaining?: number;
}

// User profile with tier information
export interface UserProfile {
  id: string;
  email: string;
  tier: AccountTier;
  tierUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
  trialStartedAt?: string;
}

// Tier configuration from database
export interface TierConfig {
  tier: AccountTier;
  tokenLimit: number;
  resetPeriodDays: number;
  description: string;
}

// Token limits for each tier (fallback values)
export const TIER_LIMITS: Record<AccountTier, number> = {
  trial: 15000,
  free: 5000,
  premium: 25000,
  gold: 100000,
  admin: 0, // Unlimited
};

// Daily message limits (only free tier has limit)
export const DAILY_MESSAGE_LIMITS: Record<AccountTier, number> = {
  trial: 999999, // No daily limit
  free: 5, // 5 messages per day
  premium: 999999, // No daily limit
  gold: 999999, // No daily limit
  admin: 999999, // No daily limit
};

// Trial duration in days
export const TRIAL_DURATION_DAYS = 15;

// Tier display names
export const TIER_NAMES: Record<AccountTier, string> = {
  trial: 'Trial',
  free: 'Free',
  premium: 'Premium',
  gold: 'Gold',
  admin: 'Admin',
};

// Tier colors for UI
export const TIER_COLORS: Record<AccountTier, string> = {
  trial: '#3B82F6',   // Blue (trial)
  free: '#6B7280',    // Gray
  premium: '#8B5CF6', // Purple
  gold: '#F59E0B',    // Amber/Gold
  admin: '#EF4444',   // Red
};

/**
 * Get current usage status for the authenticated user
 */
export async function getCurrentUsage(): Promise<UsageInfo | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('[Usage] No authenticated user');
      return null;
    }

    const { data, error } = await supabase.rpc('check_usage_limit', {
      p_user_id: user.id
    });

    if (error) {
      console.error('[Usage] Failed to check usage:', error);
      return null;
    }

    if (!data || data.length === 0) {
      console.warn('[Usage] No usage data returned');
      return null;
    }

    const row = data[0];
    return {
      tier: row.tier,
      tokensUsed: row.tokens_used,
      tokenLimit: row.token_limit,
      remainingTokens: row.remaining_tokens,
      usagePercentage: row.usage_percentage,
      periodEnd: row.period_end,
      warningLevel: row.warning_level,
      resetPeriodDays: row.reset_period_days,
      dailyMessagesUsed: row.daily_messages_used,
      dailyMessagesLimit: row.daily_messages_limit,
      trialDaysRemaining: row.trial_days_remaining,
    };
  } catch (error) {
    console.error('[Usage] Error getting current usage:', error);
    return null;
  }
}

/**
 * Get user profile with tier information
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('[Usage] Failed to get profile:', error);
      return null;
    }

    return {
      id: data.id,
      email: data.email,
      tier: data.tier,
      tierUpdatedAt: data.tier_updated_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      trialStartedAt: data.trial_started_at,
    };
  } catch (error) {
    console.error('[Usage] Error getting user profile:', error);
    return null;
  }
}

/**
 * Get tier configuration from database
 */
export async function getTierConfig(): Promise<TierConfig[]> {
  try {
    const { data, error } = await supabase
      .from('tier_config')
      .select('*')
      .order('token_limit', { ascending: true });

    if (error) {
      console.error('[Usage] Failed to get tier config:', error);
      return [];
    }

    return data.map(row => ({
      tier: row.tier,
      tokenLimit: row.token_limit,
      resetPeriodDays: row.reset_period_days,
      description: row.description,
    }));
  } catch (error) {
    console.error('[Usage] Error getting tier config:', error);
    return [];
  }
}

/**
 * Format token count for display (e.g., 5000 -> "5K")
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(tokens >= 10000 ? 0 : 1)}K`;
  }
  return tokens.toString();
}

/**
 * Calculate days until usage resets
 */
export function getDaysUntilReset(periodEnd: string): number {
  const end = new Date(periodEnd);
  const now = new Date();
  // Set both to midnight for accurate day calculation
  end.setHours(23, 59, 59, 999);
  now.setHours(0, 0, 0, 0);
  const diffTime = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

/**
 * Format period end date for display
 */
export function formatPeriodEnd(periodEnd: string): string {
  const date = new Date(periodEnd);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get usage bar color based on percentage
 */
export function getUsageColor(percentage: number): string {
  if (percentage >= 100) return '#EF4444'; // Red - blocked
  if (percentage >= 90) return '#F97316';  // Orange - critical
  if (percentage >= 80) return '#F59E0B';  // Amber - warning
  if (percentage >= 60) return '#EAB308';  // Yellow - approaching
  return '#22C55E'; // Green - good
}

/**
 * Get warning message based on usage level
 */
export function getWarningMessage(
  warningLevel: WarningLevel,
  remainingTokens: number,
  periodEnd: string,
  usage?: UsageInfo | null
): string | null {
  const daysUntilReset = getDaysUntilReset(periodEnd);
  const resetText = daysUntilReset === 0 ? 'today' :
                    daysUntilReset === 1 ? 'tomorrow' :
                    `in ${daysUntilReset} days`;

  // Check if blocked due to daily message limit (free tier)
  if (usage?.tier === 'free' && usage.dailyMessagesUsed !== undefined && usage.dailyMessagesLimit !== undefined) {
    if (usage.dailyMessagesUsed >= usage.dailyMessagesLimit) {
      return `You've reached your daily message limit (${usage.dailyMessagesLimit}/day). Come back tomorrow or upgrade to remove this limit.`;
    }
  }

  switch (warningLevel) {
    case 'blocked':
      return `You've reached your token limit. Your usage resets ${resetText}.`;
    case 'critical':
      return `Only ${formatTokens(remainingTokens)} tokens remaining. Consider upgrading to continue chatting.`;
    case 'warning':
      return `You're at 80% of your token limit. ${formatTokens(remainingTokens)} tokens remaining.`;
    default:
      return null;
  }
}

/**
 * Get trial status message
 */
export function getTrialMessage(usage: UsageInfo | null): string | null {
  if (!usage || usage.tier !== 'trial') return null;

  const daysRemaining = usage.trialDaysRemaining ?? 0;

  if (daysRemaining <= 0) {
    return 'Your trial has ended. Upgrade to continue with full access.';
  }

  if (daysRemaining <= 3) {
    return `Trial ends in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}. Upgrade to keep premium features.`;
  }

  return `${daysRemaining} days left in your free trial.`;
}

/**
 * Get daily message status for free tier
 */
export function getDailyMessageStatus(usage: UsageInfo | null): { used: number; limit: number; remaining: number } | null {
  if (!usage || usage.tier !== 'free') return null;

  const used = usage.dailyMessagesUsed ?? 0;
  const limit = usage.dailyMessagesLimit ?? DAILY_MESSAGE_LIMITS.free;
  const remaining = Math.max(0, limit - used);

  return { used, limit, remaining };
}

/**
 * Check if user can send a message (not blocked)
 */
export function canSendMessage(usage: UsageInfo | null): boolean {
  if (!usage) return true; // Allow if we can't check
  if (usage.tier === 'admin') return true; // Admin always allowed

  // Check daily message limit for free tier
  if (usage.tier === 'free') {
    const dailyUsed = usage.dailyMessagesUsed ?? 0;
    const dailyLimit = usage.dailyMessagesLimit ?? DAILY_MESSAGE_LIMITS.free;
    if (dailyUsed >= dailyLimit) return false;
  }

  return usage.warningLevel !== 'blocked';
}

/**
 * Parse usage info from AI response
 */
export function parseUsageFromResponse(responseData: any): Partial<UsageInfo> | null {
  if (!responseData?.usage) return null;

  const u = responseData.usage;
  return {
    tier: u.tier,
    tokensUsed: u.tokens_used,
    tokenLimit: u.token_limit,
    remainingTokens: u.remaining_tokens,
    usagePercentage: u.usage_percentage,
    periodEnd: u.period_end,
    warningLevel: u.warning_level,
    promptTokens: u.prompt_tokens,
    completionTokens: u.completion_tokens,
    dailyMessagesUsed: u.daily_messages_used,
    dailyMessagesLimit: u.daily_messages_limit,
    trialDaysRemaining: u.trial_days_remaining,
  };
}

/**
 * Check if this is a limit exceeded error from the API
 */
export function isLimitExceededError(error: any): boolean {
  return error?.code === 'LIMIT_EXCEEDED' || error?.status === 429;
}

/**
 * Extract usage info from limit exceeded error
 */
export function getUsageFromLimitError(error: any): UsageInfo | null {
  if (!error?.usage) return null;

  const u = error.usage;
  return {
    tier: u.tier,
    tokensUsed: u.tokens_used,
    tokenLimit: u.token_limit,
    remainingTokens: u.remaining_tokens || 0,
    usagePercentage: u.usage_percentage || 100,
    periodEnd: u.period_end,
    warningLevel: 'blocked',
    dailyMessagesUsed: u.daily_messages_used,
    dailyMessagesLimit: u.daily_messages_limit,
    trialDaysRemaining: u.trial_days_remaining,
  };
}
