/**
 * Secure Storage Service
 *
 * Provides a secure way to store sensitive data like API keys.
 * For web: Uses sessionStorage (cleared on browser close) with basic obfuscation
 * For mobile: Uses expo-secure-store (encrypted device keychain)
 *
 * IMPORTANT: This is still client-side storage. For production, move API keys
 * to backend/Supabase Edge Functions.
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

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
    // Use expo-secure-store for iOS/Android
    // Data is encrypted using device keychain (iOS) or KeyStore (Android)
    try {
      await SecureStore.setItemAsync(`secure_${key}`, value);
    } catch (error) {
      console.error('[SecureStorage] Failed to store item on mobile:', error);
      throw new Error('Failed to securely store data');
    }
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
    // Use expo-secure-store for iOS/Android
    try {
      const value = await SecureStore.getItemAsync(`secure_${key}`);
      return value;
    } catch (error) {
      console.error('[SecureStorage] Failed to retrieve item on mobile:', error);
      return null;
    }
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
    // Use expo-secure-store for iOS/Android
    try {
      await SecureStore.deleteItemAsync(`secure_${key}`);
    } catch (error) {
      console.error('[SecureStorage] Failed to delete item on mobile:', error);
    }
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
    // expo-secure-store doesn't have a clearAll, so we need to track known keys
    // For now, just delete the known keys we use
    const knownKeys = ['ai_api_key'];
    for (const key of knownKeys) {
      try {
        await SecureStore.deleteItemAsync(`secure_${key}`);
      } catch (error) {
        // Ignore errors for keys that don't exist
      }
    }
  }
}
