/**
 * Usage Tracking Service
 * Handles token usage tracking and tier management for the account system
 */

import { supabase } from '../lib/supabase';

// Account tier types
export type AccountTier = 'free' | 'premium' | 'gold' | 'admin';
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
}

// User profile with tier information
export interface UserProfile {
  id: string;
  email: string;
  tier: AccountTier;
  tierUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
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
  free: 5000,
  premium: 25000,
  gold: 100000,
  admin: 0, // Unlimited
};

// Tier display names
export const TIER_NAMES: Record<AccountTier, string> = {
  free: 'Free',
  premium: 'Premium',
  gold: 'Gold',
  admin: 'Admin',
};

// Tier colors for UI
export const TIER_COLORS: Record<AccountTier, string> = {
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
export function getWarningMessage(warningLevel: WarningLevel, remainingTokens: number, periodEnd: string): string | null {
  const daysUntilReset = getDaysUntilReset(periodEnd);
  const resetText = daysUntilReset === 0 ? 'today' :
                    daysUntilReset === 1 ? 'tomorrow' :
                    `in ${daysUntilReset} days`;

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
 * Check if user can send a message (not blocked)
 */
export function canSendMessage(usage: UsageInfo | null): boolean {
  if (!usage) return true; // Allow if we can't check
  if (usage.tier === 'admin') return true; // Admin always allowed
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
  };
}
