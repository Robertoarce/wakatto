/**
 * Usage Reducer
 * Manages token usage and tier information state
 */

import { UsageInfo, WarningLevel } from '../../services/usageTrackingService';

// Action types
export const USAGE_ACTIONS = {
  SET_USAGE: 'SET_USAGE',
  SET_USAGE_LOADING: 'SET_USAGE_LOADING',
  SET_USAGE_ERROR: 'SET_USAGE_ERROR',
  DISMISS_WARNING: 'DISMISS_WARNING',
  RESET_USAGE: 'RESET_USAGE',
} as const;

// State interface
export interface UsageState {
  currentUsage: UsageInfo | null;
  isLoading: boolean;
  error: string | null;
  lastWarningLevel: WarningLevel;
  lastWarningDismissed: boolean;
  lastFetchedAt: number | null;
}

// Initial state
const initialState: UsageState = {
  currentUsage: null,
  isLoading: false,
  error: null,
  lastWarningLevel: null,
  lastWarningDismissed: false,
  lastFetchedAt: null,
};

// Action types
interface SetUsageAction {
  type: typeof USAGE_ACTIONS.SET_USAGE;
  payload: UsageInfo | null;
}

interface SetUsageLoadingAction {
  type: typeof USAGE_ACTIONS.SET_USAGE_LOADING;
  payload: boolean;
}

interface SetUsageErrorAction {
  type: typeof USAGE_ACTIONS.SET_USAGE_ERROR;
  payload: string | null;
}

interface DismissWarningAction {
  type: typeof USAGE_ACTIONS.DISMISS_WARNING;
}

interface ResetUsageAction {
  type: typeof USAGE_ACTIONS.RESET_USAGE;
}

// Also handle sign out to clear usage state
interface SignOutAction {
  type: 'SIGN_OUT';
}

type UsageAction =
  | SetUsageAction
  | SetUsageLoadingAction
  | SetUsageErrorAction
  | DismissWarningAction
  | ResetUsageAction
  | SignOutAction;

// Reducer
export const usageReducer = (
  state: UsageState = initialState,
  action: UsageAction
): UsageState => {
  switch (action.type) {
    case USAGE_ACTIONS.SET_USAGE: {
      const newUsage = action.payload;
      const newWarningLevel = newUsage?.warningLevel || null;

      // Reset dismissed flag if warning level changed
      const shouldResetDismissed = newWarningLevel !== state.lastWarningLevel;

      return {
        ...state,
        currentUsage: newUsage,
        lastWarningLevel: newWarningLevel,
        lastWarningDismissed: shouldResetDismissed ? false : state.lastWarningDismissed,
        lastFetchedAt: Date.now(),
        error: null,
      };
    }

    case USAGE_ACTIONS.SET_USAGE_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case USAGE_ACTIONS.SET_USAGE_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case USAGE_ACTIONS.DISMISS_WARNING:
      return {
        ...state,
        lastWarningDismissed: true,
      };

    case USAGE_ACTIONS.RESET_USAGE:
    case 'SIGN_OUT':
      return initialState;

    default:
      return state;
  }
};

export default usageReducer;
