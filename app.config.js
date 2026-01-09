/**
 * Dynamic Expo Configuration
 * 
 * This file enables environment-specific app configuration.
 * - Production: com.wakatto.app, "Wakatto"
 * - Test: com.wakatto.test, "Wakatto TEST"
 * 
 * The APP_ENV is set in eas.json for each build profile.
 */

const IS_TEST = process.env.APP_ENV === 'test';

// Base configuration from app.json
const baseConfig = {
  name: IS_TEST ? 'Wakatto TEST' : 'Wakatto',
  slug: 'wakatto',
  privacy: 'public',
  platforms: ['ios', 'android', 'web'],
  version: '1.1.12',
  orientation: 'portrait',
  scheme: IS_TEST ? 'wakatto-test' : 'wakatto',
  icon: './src/assets/images/icon.png',
  splash: {
    image: './src/assets/images/splash.png',
    resizeMode: 'contain',
    backgroundColor: IS_TEST ? '#1a1a2e' : '#0f0f0f', // Slightly different splash for test
  },
  updates: {
    fallbackToCacheTimeout: 0,
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: IS_TEST ? 'com.wakatto.test' : 'com.wakatto.app',
    buildNumber: '1',
    icon: './src/assets/images/icon.png',
    infoPlist: {
      NSMicrophoneUsageDescription:
        'Wakatto needs microphone access for voice conversations with your characters.',
      NSSpeechRecognitionUsageDescription:
        'Wakatto uses speech recognition to transcribe your voice messages.',
      ITSAppUsesNonExemptEncryption: false,
      CFBundleAllowMixedLocalizations: true,
    },
    config: {
      usesNonExemptEncryption: false,
    },
    privacyManifests: {
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
          NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
        },
      ],
    },
    associatedDomains: IS_TEST 
      ? ['applinks:test.wakatto.com'] 
      : ['applinks:wakatto.com'],
  },
  android: {
    package: IS_TEST ? 'com.wakatto.test' : 'com.wakatto.app',
    icon: './src/assets/images/adaptive-icon.png',
    adaptiveIcon: {
      foregroundImage: './src/assets/images/adaptive-icon.png',
      backgroundColor: IS_TEST ? '#1a1a2e' : '#0f0f0f',
    },
    permissions: [
      'android.permission.RECORD_AUDIO',
      'android.permission.MODIFY_AUDIO_SETTINGS',
    ],
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          {
            scheme: 'https',
            host: IS_TEST ? 'test.wakatto.com' : 'wakatto.com',
            pathPrefix: '/join',
          },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  web: {
    favicon: './src/assets/images/favicon.png',
  },
  description:
    'Explore multiple perspectives with AI-powered conversations featuring diverse characters',
  extra: {
    APP_ENV: process.env.APP_ENV || 'development',
    eas: {
      projectId: '725b9fc5-0033-4e94-b237-4ffd2e8f41e8',
    },
  },
};

module.exports = {
  expo: baseConfig,
};

