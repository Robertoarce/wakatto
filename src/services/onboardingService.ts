/**
 * Onboarding Service
 * 
 * Manages the free trial onboarding flow for new users:
 * - Tracks message exchanges with trial wakattors (5 free exchanges)
 * - Determines access to characters based on subscription status
 * - Handles the transition back to Bob when trial is exhausted
 * 
 * NOTE: Currently uses localStorage fallback when Supabase auth is not available
 */

import { supabase } from '../lib/supabase';
import { AccountTier } from './usageTrackingService';
import { Platform } from 'react-native';

// ============================================
// LOCAL STORAGE FALLBACK (when not authenticated)
// ============================================

const STORAGE_KEY = 'wakatto_onboarding_state';

interface LocalOnboardingState {
  messageCount: number;
  isComplete: boolean;
}

function getLocalState(): LocalOnboardingState {
  if (Platform.OS !== 'web') {
    // For native, we'd use AsyncStorage, but for now return default
    return { messageCount: 0, isComplete: false };
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('[Onboarding] Failed to read local state:', e);
  }
  return { messageCount: 0, isComplete: false };
}

function setLocalState(state: LocalOnboardingState): void {
  if (Platform.OS !== 'web') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('[Onboarding] Failed to save local state:', e);
  }
}

function clearLocalState(): void {
  if (Platform.OS !== 'web') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('[Onboarding] Failed to clear local state:', e);
  }
}

// Export for testing/debugging
export { clearLocalState as resetOnboardingState };

// ============================================
// FREE TRIAL WAKATTORS
// ============================================

/**
 * The 5 wakattors available during the free trial period
 * These can be used for up to 5 message exchanges total
 */
export const FREE_TRIAL_WAKATTOR_IDS = [
  'albert_einstein',
  'blackbeard',
  'marcus_aurelius',
  'stephen_hawking',
  'aristotle',
] as const;

export type FreeTrialWakattorId = typeof FREE_TRIAL_WAKATTOR_IDS[number];

/**
 * Maximum number of message exchanges allowed during free trial
 * One exchange = one user message + one AI response
 */
export const MAX_FREE_TRIAL_EXCHANGES = 5;

/**
 * Bob's tutorial character ID - always accessible
 */
export const BOB_CHARACTER_ID = 'bob-tutorial';

// ============================================
// TYPES
// ============================================

export interface OnboardingState {
  messageCount: number;
  isComplete: boolean;
  remainingMessages: number;
  tier: AccountTier;
}

export interface IncrementResult {
  newCount: number;
  isComplete: boolean;
  shouldRedirectToBob: boolean;
}

// ============================================
// STATE MANAGEMENT
// ============================================

/**
 * Get the current onboarding state for the authenticated user
 * Falls back to localStorage when not authenticated
 */
export async function getOnboardingState(): Promise<OnboardingState | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // FALLBACK: Use localStorage when not authenticated
    if (!user) {
      console.log('[Onboarding] No authenticated user, using local storage fallback');
      const localState = getLocalState();
      return {
        messageCount: localState.messageCount,
        isComplete: localState.isComplete,
        remainingMessages: Math.max(0, MAX_FREE_TRIAL_EXCHANGES - localState.messageCount),
        tier: 'trial' as AccountTier,
      };
    }

    const { data, error } = await supabase.rpc('get_onboarding_state', {
      p_user_id: user.id
    });

    if (error) {
      console.error('[Onboarding] Error getting state from DB, using local fallback:', error);
      // Fallback to local storage on DB error
      const localState = getLocalState();
      return {
        messageCount: localState.messageCount,
        isComplete: localState.isComplete,
        remainingMessages: Math.max(0, MAX_FREE_TRIAL_EXCHANGES - localState.messageCount),
        tier: 'trial' as AccountTier,
      };
    }

    if (!data || data.length === 0) {
      // User profile doesn't exist yet, return default state
      return {
        messageCount: 0,
        isComplete: false,
        remainingMessages: MAX_FREE_TRIAL_EXCHANGES,
        tier: 'trial' as AccountTier,
      };
    }

    const row = data[0];
    return {
      messageCount: row.message_count,
      isComplete: row.is_complete,
      remainingMessages: row.remaining_messages,
      tier: row.tier as AccountTier,
    };
  } catch (error) {
    console.error('[Onboarding] Exception getting state, using local fallback:', error);
    // Fallback to local storage on any exception
    const localState = getLocalState();
    return {
      messageCount: localState.messageCount,
      isComplete: localState.isComplete,
      remainingMessages: Math.max(0, MAX_FREE_TRIAL_EXCHANGES - localState.messageCount),
      tier: 'trial' as AccountTier,
    };
  }
}

/**
 * Increment the message count after a successful exchange with a trial wakattor
 * Returns the new state and whether to redirect to Bob
 * Falls back to localStorage when not authenticated
 */
export async function incrementMessageCount(): Promise<IncrementResult | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // FALLBACK: Use localStorage when not authenticated
    if (!user) {
      console.log('[Onboarding] No authenticated user, using local storage for increment');
      const localState = getLocalState();
      const newCount = localState.messageCount + 1;
      const isComplete = newCount >= MAX_FREE_TRIAL_EXCHANGES;
      
      setLocalState({ messageCount: newCount, isComplete });
      
      console.log(`[Onboarding] Local message count: ${newCount}/${MAX_FREE_TRIAL_EXCHANGES}, complete: ${isComplete}`);
      
      return {
        newCount,
        isComplete,
        shouldRedirectToBob: isComplete && newCount === MAX_FREE_TRIAL_EXCHANGES,
      };
    }

    const { data, error } = await supabase.rpc('increment_onboarding_message_count', {
      p_user_id: user.id
    });

    if (error) {
      console.error('[Onboarding] Error incrementing count in DB, using local fallback:', error);
      // Fallback to local storage on DB error
      const localState = getLocalState();
      const newCount = localState.messageCount + 1;
      const isComplete = newCount >= MAX_FREE_TRIAL_EXCHANGES;
      
      setLocalState({ messageCount: newCount, isComplete });
      
      return {
        newCount,
        isComplete,
        shouldRedirectToBob: isComplete && newCount === MAX_FREE_TRIAL_EXCHANGES,
      };
    }

    if (!data || data.length === 0) {
      console.warn('[Onboarding] No data returned from increment, using local fallback');
      const localState = getLocalState();
      const newCount = localState.messageCount + 1;
      const isComplete = newCount >= MAX_FREE_TRIAL_EXCHANGES;
      
      setLocalState({ messageCount: newCount, isComplete });
      
      return {
        newCount,
        isComplete,
        shouldRedirectToBob: isComplete && newCount === MAX_FREE_TRIAL_EXCHANGES,
      };
    }

    const row = data[0];
    const newCount = row.new_count;
    const isComplete = row.is_complete;

    console.log(`[Onboarding] Message count: ${newCount}/${MAX_FREE_TRIAL_EXCHANGES}, complete: ${isComplete}`);

    return {
      newCount,
      isComplete,
      shouldRedirectToBob: isComplete && newCount === MAX_FREE_TRIAL_EXCHANGES,
    };
  } catch (error) {
    console.error('[Onboarding] Exception incrementing count, using local fallback:', error);
    // Fallback to local storage on any exception
    const localState = getLocalState();
    const newCount = localState.messageCount + 1;
    const isComplete = newCount >= MAX_FREE_TRIAL_EXCHANGES;
    
    setLocalState({ messageCount: newCount, isComplete });
    
    return {
      newCount,
      isComplete,
      shouldRedirectToBob: isComplete && newCount === MAX_FREE_TRIAL_EXCHANGES,
    };
  }
}

// ============================================
// ACCESS CONTROL
// ============================================

/**
 * Check if a character ID is one of the free trial wakattors
 */
export function isTrialWakattor(characterId: string): boolean {
  return FREE_TRIAL_WAKATTOR_IDS.includes(characterId as FreeTrialWakattorId);
}

/**
 * Check if a character is Bob (tutorial character)
 */
export function isBobCharacter(characterId: string): boolean {
  return characterId === BOB_CHARACTER_ID;
}

/**
 * Determine if a user can access a specific wakattor
 * 
 * Access rules:
 * - Bob is always accessible
 * - Trial wakattors accessible if onboarding not complete OR user is subscriber
 * - Other wakattors only accessible to subscribers (premium, gold, admin)
 */
export function canAccessWakattor(
  characterId: string,
  onboardingState: OnboardingState | null,
): boolean {
  // Bob is always accessible
  if (isBobCharacter(characterId)) {
    return true;
  }

  // If no state, assume new user with trial access
  if (!onboardingState) {
    return isTrialWakattor(characterId);
  }

  // Subscribers (premium, gold, admin) have full access
  const subscriberTiers: AccountTier[] = ['premium', 'gold', 'admin'];
  if (subscriberTiers.includes(onboardingState.tier)) {
    return true;
  }

  // Trial/free users can only access trial wakattors if onboarding not complete
  if (isTrialWakattor(characterId)) {
    return !onboardingState.isComplete;
  }

  // Non-trial wakattors are locked for non-subscribers
  return false;
}

/**
 * Check if user should be redirected to Bob (trial exhausted)
 */
export function shouldRedirectToBob(onboardingState: OnboardingState | null): boolean {
  if (!onboardingState) return false;

  // Subscribers never get redirected
  const subscriberTiers: AccountTier[] = ['premium', 'gold', 'admin'];
  if (subscriberTiers.includes(onboardingState.tier)) {
    return false;
  }

  // Redirect if onboarding is complete (all 5 messages used)
  return onboardingState.isComplete;
}

/**
 * Check if user is a paying subscriber
 */
export function isSubscriber(tier: AccountTier): boolean {
  return ['premium', 'gold', 'admin'].includes(tier);
}

/**
 * Check if user is in free trial mode (can still send messages to trial wakattors)
 */
export function isInFreeTrial(onboardingState: OnboardingState | null): boolean {
  if (!onboardingState) return true; // Assume new user

  // Subscribers are not in trial
  if (isSubscriber(onboardingState.tier)) {
    return false;
  }

  // In trial if onboarding not complete
  return !onboardingState.isComplete;
}

// ============================================
// DISPLAY HELPERS
// ============================================

/**
 * Get a user-friendly name for a trial wakattor
 */
export const TRIAL_WAKATTOR_NAMES: Record<FreeTrialWakattorId, string> = {
  albert_einstein: 'Albert Einstein',
  blackbeard: 'Blackbeard',
  marcus_aurelius: 'Marcus Aurelius',
  stephen_hawking: 'Stephen Hawking',
  aristotle: 'Aristotle',
};

/**
 * Get remaining message count text
 */
export function getRemainingMessagesText(remaining: number): string {
  if (remaining <= 0) {
    return 'Trial complete';
  }
  if (remaining === 1) {
    return '1 message remaining';
  }
  return `${remaining} messages remaining`;
}
