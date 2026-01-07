/**
 * Deep Link Handler - Parses URLs to extract invite codes for join/invite flow
 * 
 * Supports both web and native (Expo) deep linking:
 * - Web: https://wakatto.com/join/ABC123 or https://wakatto.com/invite/ABC123
 * - Native: wakatto://join/ABC123 or wakatto://invite/ABC123
 * 
 * /join/:code - Join an existing conversation (collaboration)
 * /invite/:code - Accept a user referral invitation
 */

import { Platform } from 'react-native';

export interface DeepLinkResult {
  type: 'join' | 'invite' | 'unknown';
  inviteCode?: string;
}

/**
 * Parse a URL to extract deep link information
 * @param url The URL to parse (can be full URL or path)
 * @returns DeepLinkResult with type and optional invite code
 */
export function parseDeepLink(url: string): DeepLinkResult {
  if (!url) {
    return { type: 'unknown' };
  }

  try {
    // Handle both full URLs and paths
    let pathname: string;
    
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('wakatto://')) {
      const urlObj = new URL(url);
      pathname = urlObj.pathname;
    } else {
      pathname = url;
    }

    // Match /join/:code pattern (conversation collaboration)
    const joinMatch = pathname.match(/^\/join\/([A-Za-z0-9]+)$/);
    if (joinMatch && joinMatch[1]) {
      return {
        type: 'join',
        inviteCode: joinMatch[1].toUpperCase(),
      };
    }

    // Match /invite/:code pattern (user referral invitation)
    const inviteMatch = pathname.match(/^\/invite\/([A-Za-z0-9]+)$/);
    if (inviteMatch && inviteMatch[1]) {
      return {
        type: 'invite',
        inviteCode: inviteMatch[1].toUpperCase(),
      };
    }

    return { type: 'unknown' };
  } catch (error) {
    console.error('[DeepLinkHandler] Error parsing URL:', error);
    return { type: 'unknown' };
  }
}

/**
 * Get the initial URL on web platform
 * @returns The current URL path or null
 */
export function getInitialWebUrl(): string | null {
  if (Platform.OS !== 'web') {
    return null;
  }

  try {
    // eslint-disable-next-line no-undef
    if (typeof window !== 'undefined' && window.location) {
      return window.location.pathname + window.location.search;
    }
  } catch (error) {
    console.error('[DeepLinkHandler] Error getting web URL:', error);
  }

  return null;
}

/**
 * Check if the current URL contains a join invite code (web only)
 * For conversation collaboration
 * @returns The invite code if found, null otherwise
 */
export function checkForJoinCode(): string | null {
  const url = getInitialWebUrl();
  if (!url) {
    return null;
  }

  const result = parseDeepLink(url);
  if (result.type === 'join' && result.inviteCode) {
    return result.inviteCode;
  }

  return null;
}

/**
 * Check if the current URL contains a referral invite code (web only)
 * For user invitation/referral
 * @returns The invite code if found, null otherwise
 */
export function checkForInviteCode(): string | null {
  const url = getInitialWebUrl();
  if (!url) {
    return null;
  }

  const result = parseDeepLink(url);
  if (result.type === 'invite' && result.inviteCode) {
    return result.inviteCode;
  }

  return null;
}

/**
 * Clear the join/invite code from the URL (web only)
 * This prevents the modal from reopening on refresh
 */
export function clearJoinCodeFromUrl(): void {
  if (Platform.OS !== 'web') {
    return;
  }

  try {
    // eslint-disable-next-line no-undef
    if (typeof window !== 'undefined' && window.history && window.location) {
      const currentUrl = window.location.pathname;
      if (currentUrl.startsWith('/join/') || currentUrl.startsWith('/invite/')) {
        // Replace with root URL without reloading
        window.history.replaceState({}, '', '/');
      }
    }
  } catch (error) {
    console.error('[DeepLinkHandler] Error clearing URL:', error);
  }
}

/**
 * Alias for clearJoinCodeFromUrl - clears any deep link path from URL
 */
export function clearInviteCodeFromUrl(): void {
  clearJoinCodeFromUrl();
}

export default {
  parseDeepLink,
  getInitialWebUrl,
  checkForJoinCode,
  checkForInviteCode,
  clearJoinCodeFromUrl,
  clearInviteCodeFromUrl,
};

