import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Replace with your Supabase project URL and anon key
export const supabaseUrl = 'https://rddvqbxbmpilbimmppvu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkZHZxYnhibXBpbGJpbW1wcHZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODMyMDAsImV4cCI6MjA3Nzg1OTIwMH0.8y4fFG3WamhU2TTZ2albS50fQrMWldZV_bGXDy9vqMg';

const STORAGE_KEY = 'sb-rddvqbxbmpilbimmppvu-auth-token';

// Clear invalid session data from storage
export async function clearInvalidSession(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
    console.log('[Auth] Cleared invalid session data');
  } catch (e) {
    console.warn('[Auth] Failed to clear session:', e);
  }
}

// Check if an error is a refresh token error
export function isRefreshTokenError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { message?: string; name?: string };
  return (
    err.message?.includes('Refresh Token') ||
    err.message?.includes('refresh_token') ||
    err.name === 'AuthApiError'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

// Listen for auth errors and handle invalid refresh tokens
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('[Auth] Token refreshed successfully');
  } else if (event === 'SIGNED_OUT') {
    console.log('[Auth] User signed out');
  }
});
