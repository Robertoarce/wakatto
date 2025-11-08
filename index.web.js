// Web entry point
import { AppRegistry, Platform } from 'react-native';
import App from './App';

// Register the app
AppRegistry.registerComponent('main', () => App);

// For web, we need to run the application
if (Platform.OS === 'web') {
  const rootTag = document.getElementById('root');
  
  // CRITICAL: Ensure root has proper styles for React Native Web
  // Without these styles, the app renders but remains invisible (black screen)
  if (rootTag) {
    rootTag.style.display = 'flex';
    rootTag.style.flex = '1';
    rootTag.style.height = '100vh';
    rootTag.style.width = '100vw';
  }
  
  AppRegistry.runApplication('main', {
    rootTag: rootTag,
    initialProps: {},
  });
}

