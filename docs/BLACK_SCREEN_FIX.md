# Black Screen Issue Fix - React Native Web

## Issue Description

**Date Discovered:** November 6, 2025  
**Severity:** Critical - Application rendered but was invisible to users

### Symptoms
- Application loaded successfully in the browser
- Console logs showed all components mounting correctly
- DOM inspection revealed all elements were present with correct styles
- Screen appeared completely black to users
- Brief flash of content visible on initial load before disappearing

### Root Cause

React Native Web requires the root DOM element to have explicit flexbox and dimension styles applied programmatically. Without these styles, the React Native component tree renders in the DOM but has no computed height/width, making it effectively invisible.

The issue was specifically in `index.web.js` where `AppRegistry.runApplication()` was called but the root element wasn't properly configured for React Native Web's rendering engine.

## Solution

### Code Changes

**File:** `index.web.js`

**Before (Not Working):**
```javascript
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
```

**After (Working):**
```javascript
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
```

### Key Changes

1. **Replaced `registerRootComponent` with direct `AppRegistry` usage**
   - `registerRootComponent` from Expo doesn't properly handle web platform initialization in some cases
   - Direct use of `AppRegistry.registerComponent` and `AppRegistry.runApplication` gives more control

2. **Added explicit root element styling**
   - `display: 'flex'` - Enables flexbox layout
   - `flex: '1'` - Allows element to grow
   - `height: '100vh'` - Full viewport height
   - `width: '100vw'` - Full viewport width

3. **Platform-specific initialization**
   - Only applies web-specific setup when `Platform.OS === 'web'`
   - Ensures compatibility with native platforms

## Why This Happened

React Native Web translates React Native components into web-compatible DOM elements. However, unlike native platforms where the root view automatically fills the screen, web requires explicit CSS styling on the container element. 

The Expo `registerRootComponent` helper is designed to work across platforms but doesn't always apply the necessary web-specific root element styles, especially in custom webpack configurations.

## Testing

After implementing the fix:
1. Build the web application: `npm run web:build`
2. Serve locally: `npm run web:serve`
3. Open browser and verify:
   - LoginScreen displays correctly
   - All UI elements are visible
   - Navigation works properly
   - No black screen issues

## Related Files Modified

- `index.web.js` - Main fix applied here
- `App.tsx` - Added explicit View wrapper with flex styles
- `src/navigation/AppNavigator.tsx` - Added container View with proper dimensions

## Prevention

For future React Native Web projects:
1. Always use explicit `AppRegistry.runApplication()` for web platform
2. Apply flexbox and viewport dimensions to root element
3. Test web build early in development to catch rendering issues
4. Consider adding these styles in `web/index.html` as inline styles on the root div

## Additional Notes

- This issue is specific to React Native Web and doesn't affect native iOS/Android builds
- The fix is backward compatible and doesn't break existing functionality
- Console logs and DOM inspection tools were crucial in diagnosing this issue
- The DOM showed all elements present, confirming it was a styling/visibility issue rather than a rendering problem

## References

- [React Native Web Documentation](https://necolas.github.io/react-native-web/)
- [AppRegistry API](https://reactnative.dev/docs/appregistry)
- [Expo Web Setup](https://docs.expo.dev/guides/customizing-webpack/)

