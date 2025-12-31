import React from 'react';
import { Provider } from 'react-redux';
import { View, StyleSheet, ActivityIndicator, Text, Platform } from 'react-native';
import { useFonts } from 'expo-font';

// Suppress known React Native Web console warnings that spam the console
// These are internal RNW issues, not bugs in our code
if (Platform.OS === 'web') {
  // Filter out "Unexpected text node" errors from Animated interpolations
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const message = args[0];
    if (typeof message === 'string' && message.includes('Unexpected text node:')) {
      return; // Suppress this specific error
    }
    originalConsoleError.apply(console, args);
  };

  // Also filter console.warn for pointerEvents deprecation warnings
  const originalConsoleWarn = console.warn;
  console.warn = (...args: any[]) => {
    const message = args[0];
    if (typeof message === 'string' && message.includes('props.pointerEvents is deprecated')) {
      return; // Suppress this specific warning
    }
    originalConsoleWarn.apply(console, args);
  };
}
import { 
  Inter_400Regular, 
  Inter_500Medium, 
  Inter_600SemiBold, 
  Inter_700Bold 
} from '@expo-google-fonts/inter';
import { 
  Poppins_400Regular, 
  Poppins_500Medium, 
  Poppins_600SemiBold, 
  Poppins_700Bold 
} from '@expo-google-fonts/poppins';
import { 
  RobotoMono_400Regular, 
  RobotoMono_500Medium, 
  RobotoMono_700Bold 
} from '@expo-google-fonts/roboto-mono';
import { 
  SpaceMono_400Regular, 
  SpaceMono_700Bold 
} from '@expo-google-fonts/space-mono';
import AppNavigator from './src/navigation/AppNavigator';
import { store } from './src/store';
import { ErrorBoundary } from './src/components/ErrorBoundary';

export default function App() {
  const [fontsLoaded] = useFonts({
    // Inter - Clean modern for body text
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    // Poppins - Friendly geometric for headers
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
    // Roboto Mono - Clean monospace for terminal feel
    'RobotoMono-Regular': RobotoMono_400Regular,
    'RobotoMono-Medium': RobotoMono_500Medium,
    'RobotoMono-Bold': RobotoMono_700Bold,
    // Space Mono - Techy monospace for speech bubbles
    'SpaceMono-Regular': SpaceMono_400Regular,
    'SpaceMono-Bold': SpaceMono_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Loading fonts...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <View style={styles.container}>
          <AppNavigator />
        </View>
      </Provider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#0f0f0f',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f0f',
  },
  loadingText: {
    marginTop: 12,
    color: '#a1a1aa',
    fontSize: 14,
  },
});
