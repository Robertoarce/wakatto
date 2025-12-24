/**
 * Platform Storage Service
 *
 * Cross-platform async storage for non-sensitive data.
 * Web: Uses localStorage
 * Mobile: Uses AsyncStorage
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_PREFIX = 'wakatto_';

/**
 * Store a value
 */
export async function setItem(key: string, value: string): Promise<void> {
  const fullKey = `${STORAGE_PREFIX}${key}`;

  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(fullKey, value);
    } catch (error) {
      console.error('[PlatformStorage] Failed to store item:', error);
    }
  } else {
    try {
      await AsyncStorage.setItem(fullKey, value);
    } catch (error) {
      console.error('[PlatformStorage] Failed to store item on mobile:', error);
    }
  }
}

/**
 * Retrieve a value
 */
export async function getItem(key: string): Promise<string | null> {
  const fullKey = `${STORAGE_PREFIX}${key}`;

  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(fullKey);
    } catch (error) {
      console.error('[PlatformStorage] Failed to retrieve item:', error);
      return null;
    }
  } else {
    try {
      return await AsyncStorage.getItem(fullKey);
    } catch (error) {
      console.error('[PlatformStorage] Failed to retrieve item on mobile:', error);
      return null;
    }
  }
}

/**
 * Remove a value
 */
export async function removeItem(key: string): Promise<void> {
  const fullKey = `${STORAGE_PREFIX}${key}`;

  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(fullKey);
    } catch (error) {
      console.error('[PlatformStorage] Failed to remove item:', error);
    }
  } else {
    try {
      await AsyncStorage.removeItem(fullKey);
    } catch (error) {
      console.error('[PlatformStorage] Failed to remove item on mobile:', error);
    }
  }
}

/**
 * Clear all wakatto storage items
 */
export async function clearAll(): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('[PlatformStorage] Failed to clear storage:', error);
    }
  } else {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const wakattorKeys = keys.filter(key => key.startsWith(STORAGE_PREFIX));
      await AsyncStorage.multiRemove(wakattorKeys);
    } catch (error) {
      console.error('[PlatformStorage] Failed to clear storage on mobile:', error);
    }
  }
}
