/**
 * Environment Configuration
 * 
 * Manages environment-specific configuration for PROD and TEST environments.
 * Uses EAS build profile to determine which environment to use.
 */

import Constants from 'expo-constants';

// Environment types
export type Environment = 'production' | 'test' | 'development';

// Supabase configuration interface
interface SupabaseConfig {
  url: string;
  anonKey: string;
  storageKey: string;
}

// Full environment configuration
interface EnvironmentConfig {
  name: Environment;
  displayName: string;
  supabase: SupabaseConfig;
}

// ===========================================
// PRODUCTION ENVIRONMENT (current live app)
// ===========================================
const PRODUCTION_CONFIG: EnvironmentConfig = {
  name: 'production',
  displayName: 'Wakatto',
  supabase: {
    url: 'https://rddvqbxbmpilbimmppvu.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkZHZxYnhibXBpbGJpbW1wcHZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODMyMDAsImV4cCI6MjA3Nzg1OTIwMH0.8y4fFG3WamhU2TTZ2albS50fQrMWldZV_bGXDy9vqMg',
    storageKey: 'sb-rddvqbxbmpilbimmppvu-auth-token',
  },
};

// ===========================================
// LOCAL/TEST ENVIRONMENT (for development)
// ===========================================
// Uses local Supabase instance (run: supabase start)
// For device testing, replace localhost with your machine's IP address
const LOCAL_SUPABASE_URL = 'http://127.0.0.1:54321';
// Default local anon key from supabase start (same for all local instances)
const LOCAL_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const TEST_CONFIG: EnvironmentConfig = {
  name: 'test',
  displayName: 'Wakatto TEST',
  supabase: {
    url: LOCAL_SUPABASE_URL,
    anonKey: LOCAL_ANON_KEY,
    storageKey: 'sb-local-auth-token',
  },
};

// ===========================================
// Environment Detection
// ===========================================

/**
 * Detects the current environment based on EAS build profile or development mode.
 * 
 * Priority:
 * 1. EAS_BUILD_PROFILE from Constants.expoConfig.extra
 * 2. APP_ENV from Constants.expoConfig.extra
 * 3. __DEV__ flag (development if true, production otherwise)
 */
function detectEnvironment(): Environment {
  const extra = Constants.expoConfig?.extra || {};
  
  // Check for explicit APP_ENV setting (set in eas.json)
  const appEnv = extra.APP_ENV as string | undefined;
  if (appEnv === 'test') {
    return 'test';
  }
  if (appEnv === 'production') {
    return 'production';
  }
  
  // Check EAS build profile
  const buildProfile = extra.eas?.buildProfile as string | undefined;
  if (buildProfile === 'test') {
    return 'test';
  }
  if (buildProfile === 'production') {
    return 'production';
  }
  
  // Default: use development config (which points to test for safety)
  // In __DEV__ mode, we use test environment to avoid affecting production
  if (__DEV__) {
    return 'development';
  }
  
  // Fallback to production for unknown builds
  return 'production';
}

/**
 * Gets the configuration for a specific environment.
 */
function getConfigForEnvironment(env: Environment): EnvironmentConfig {
  switch (env) {
    case 'production':
      return PRODUCTION_CONFIG;
    case 'test':
    case 'development':
      // Development uses test config to avoid affecting production data
      return TEST_CONFIG;
    default:
      return PRODUCTION_CONFIG;
  }
}

// ===========================================
// Exports
// ===========================================

/** Current detected environment */
export const currentEnvironment = detectEnvironment();

/** Current environment configuration */
export const envConfig = getConfigForEnvironment(currentEnvironment);

/** Whether we're in a test/development environment */
export const isTestEnvironment = currentEnvironment === 'test' || currentEnvironment === 'development';

/** Whether we're in production */
export const isProduction = currentEnvironment === 'production';

// Log environment on startup (only in development)
if (__DEV__) {
  console.log(`[Environment] Running in ${currentEnvironment} mode`);
  console.log(`[Environment] Supabase: ${envConfig.supabase.url}`);
}

