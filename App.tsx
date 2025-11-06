import React from 'react';
import { Provider } from 'react-redux';
import { View, Text, StyleSheet } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { store } from './src/store';
import { ErrorBoundary } from './src/components/ErrorBoundary';

export default function App() {
  console.log('App is rendering...');
  console.log('React Native View:', View);
  console.log('Store:', store);
  
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <View style={styles.testContainer}>
          <View style={styles.testBox}>
            <Text style={styles.testText}>✅ APP LOADED</Text>
          </View>
          <AppNavigator />
        </View>
      </Provider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  testContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  testBox: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#00ff00',
    padding: 20,
    zIndex: 99999,
  },
  testText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
});
