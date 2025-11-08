// Web-compatible wrapper for react-native-safe-area-context
// Exports without using require() to avoid browser errors

export { useSafeAreaFrame, SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// SafeAreaListener is optional and may not exist in all versions
// On web, we don't need it anyway
export const SafeAreaListener = undefined;

