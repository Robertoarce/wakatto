/**
 * Usage Actions
 * Actions for managing token usage and tier state
 */

import { Platform } from 'react-native';
import { Dispatch } from 'redux';
import { getCurrentUsage, UsageInfo } from '../../services/usageTrackingService';
import { USAGE_ACTIONS } from '../reducers/usageReducer';

// Action creators
export const setUsage = (usage: UsageInfo | null) => ({
  type: USAGE_ACTIONS.SET_USAGE as const,
  payload: usage,
});

export const setUsageLoading = (loading: boolean) => ({
  type: USAGE_ACTIONS.SET_USAGE_LOADING as const,
  payload: loading,
});

export const setUsageError = (error: string | null) => ({
  type: USAGE_ACTIONS.SET_USAGE_ERROR as const,
  payload: error,
});

export const dismissWarning = () => ({
  type: USAGE_ACTIONS.DISMISS_WARNING as const,
});

export const resetUsage = () => ({
  type: USAGE_ACTIONS.RESET_USAGE as const,
});

/**
 * Fetch current usage from the server
 */
export const fetchUsage = () => async (dispatch: Dispatch) => {
  dispatch(setUsageLoading(true));

  try {
    const usage = await getCurrentUsage();
    dispatch(setUsage(usage));
  } catch (error: any) {
    console.error('[Usage] Failed to fetch:', error);
    dispatch(setUsageError(error.message || 'Failed to fetch usage'));
  } finally {
    dispatch(setUsageLoading(false));
  }
};

/**
 * Update usage from an AI response
 * This is called after each AI response to update the local state
 */
export const updateUsageFromResponse = (usage: Partial<UsageInfo>) => (dispatch: Dispatch) => {
  // Convert partial usage to full UsageInfo if we have enough data
  if (
    usage.tier !== undefined &&
    usage.tokensUsed !== undefined &&
    usage.tokenLimit !== undefined &&
    usage.remainingTokens !== undefined &&
    usage.usagePercentage !== undefined &&
    usage.periodEnd !== undefined
  ) {
    dispatch(setUsage(usage as UsageInfo));
  }
};

/**
 * Setup event listeners for usage updates from aiService
 * Call this on app startup (web only - mobile uses callbacks directly)
 */
export const setupUsageListeners = () => (dispatch: Dispatch) => {
  // Only setup window event listeners on web platform
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;

  // Listen for usage updates
  const handleUsageUpdate = (event: CustomEvent) => {
    const usage = event.detail as Partial<UsageInfo>;
    dispatch(updateUsageFromResponse(usage) as any);
  };

  // Listen for limit warnings
  const handleLimitWarning = (event: CustomEvent) => {
    const { warningLevel, usage } = event.detail;
    console.log('[Usage] Limit warning:', warningLevel, usage);
    // The warning state is already updated via SET_USAGE
    // Components can read lastWarningLevel from state
  };

  // Listen for limit exceeded
  const handleLimitExceeded = (event: CustomEvent) => {
    const usage = event.detail as UsageInfo;
    console.log('[Usage] Limit exceeded:', usage);
    dispatch(setUsage(usage));
  };

  window.addEventListener('ai:usage-update', handleUsageUpdate as EventListener);
  window.addEventListener('ai:limit-warning', handleLimitWarning as EventListener);
  window.addEventListener('ai:limit-exceeded', handleLimitExceeded as EventListener);

  // Return cleanup function
  return () => {
    window.removeEventListener('ai:usage-update', handleUsageUpdate as EventListener);
    window.removeEventListener('ai:limit-warning', handleLimitWarning as EventListener);
    window.removeEventListener('ai:limit-exceeded', handleLimitExceeded as EventListener);
  };
};

/**
 * Check if we should fetch fresh usage data
 * Returns true if data is stale (> 5 minutes old) or doesn't exist
 */
export const shouldFetchUsage = (lastFetchedAt: number | null): boolean => {
  if (!lastFetchedAt) return true;
  const STALE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
  return Date.now() - lastFetchedAt > STALE_THRESHOLD;
};
