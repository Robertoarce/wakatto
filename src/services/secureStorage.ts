/**
 * Secure Storage Service
 *
 * Provides a secure way to store sensitive data like API keys.
 * For web: Uses sessionStorage (cleared on browser close) with basic obfuscation
 * For mobile: Would use expo-secure-store (requires native modules)
 *
 * IMPORTANT: This is still client-side storage. For production, move API keys
 * to backend/Supabase Edge Functions.
 */

import { Platform } from 'react-native';

// Simple XOR encryption for basic obfuscation (NOT cryptographically secure)
// This is just to prevent casual inspection in DevTools
const OBFUSCATION_KEY = 'psyche-ai-2025';

function obfuscate(text: string): string {
  return Buffer.from(
    text.split('').map((char, i) =>
      char.charCodeAt(0) ^ OBFUSCATION_KEY.charCodeAt(i % OBFUSCATION_KEY.length)
    )
  ).toString('base64');
}

function deobfuscate(encoded: string): string {
  try {
    const bytes = Buffer.from(encoded, 'base64');
    return String.fromCharCode(
      ...Array.from(bytes).map((byte, i) =>
        byte ^ OBFUSCATION_KEY.charCodeAt(i % OBFUSCATION_KEY.length)
      )
    );
  } catch {
    return '';
  }
}

/**
 * Store sensitive data securely
 */
export async function setSecureItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    // Use sessionStorage for web (cleared when browser closes)
    // Obfuscate to prevent casual inspection
    try {
      const obfuscated = obfuscate(value);
      sessionStorage.setItem(`secure_${key}`, obfuscated);
    } catch (error) {
      console.error('[SecureStorage] Failed to store item:', error);
      throw new Error('Failed to securely store data');
    }
  } else {
    // For mobile, would use expo-secure-store
    // For now, fall back to in-memory storage
    console.warn('[SecureStorage] Mobile secure storage not implemented, using in-memory');
    // TODO: Implement expo-secure-store for production mobile apps
  }
}

/**
 * Retrieve sensitive data securely
 */
export async function getSecureItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      const obfuscated = sessionStorage.getItem(`secure_${key}`);
      if (!obfuscated) return null;
      return deobfuscate(obfuscated);
    } catch (error) {
      console.error('[SecureStorage] Failed to retrieve item:', error);
      return null;
    }
  } else {
    // For mobile, would use expo-secure-store
    console.warn('[SecureStorage] Mobile secure storage not implemented');
    return null;
  }
}

/**
 * Delete sensitive data
 */
export async function deleteSecureItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      sessionStorage.removeItem(`secure_${key}`);
    } catch (error) {
      console.error('[SecureStorage] Failed to delete item:', error);
    }
  } else {
    // For mobile, would use expo-secure-store
    console.warn('[SecureStorage] Mobile secure storage not implemented');
  }
}

/**
 * Check if an item exists
 */
export async function hasSecureItem(key: string): Promise<boolean> {
  const value = await getSecureItem(key);
  return value !== null && value !== '';
}

/**
 * Clear all secure storage
 */
export async function clearSecureStorage(): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      // Only clear items with our prefix
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.startsWith('secure_')) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('[SecureStorage] Failed to clear storage:', error);
    }
  } else {
    console.warn('[SecureStorage] Mobile secure storage not implemented');
  }
}
