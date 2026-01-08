// App version configuration
// This is the single source of truth for the app version
export const APP_VERSION = '1.1.0';
export const BUILD_DATE = '2026-01-08';

export const getVersionString = () => `v${APP_VERSION}`;
export const getFullVersionString = () => `v${APP_VERSION} (${BUILD_DATE})`;

