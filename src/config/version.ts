// App version configuration
// This is the single source of truth for the app version
// Auto-updated by scripts/bump-version.js on deploy
export const APP_VERSION = '1.1.9';
export const BUILD_DATE = '2026-01-08';

export const getVersionString = () => `v${APP_VERSION}`;
export const getFullVersionString = () => `v${APP_VERSION} (${BUILD_DATE})`;
