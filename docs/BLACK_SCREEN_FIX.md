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

---

# Black Screen Issue Fix #2 - React Navigation require() Error

## Issue Description

**Date Discovered:** November 8, 2025
**Severity:** Critical - Application failed to load due to JavaScript error

### Symptoms
- Black screen displayed in browser
- Console error: `ReferenceError: require is not defined`
- Error originated from `@react-navigation/elements/lib/module/useFrameSize.js`
- Webpack compiled successfully but app crashed at runtime
- DevTools showed error at line 14 of useFrameSize.js

### Root Cause

The `@react-navigation/elements` package contains a module (`useFrameSize.js`) that uses CommonJS `require()` syntax to import `SafeAreaListener`:

```javascript
const SafeAreaListener = require('react-native-safe-area-context').SafeAreaListener;
```

This `require()` call doesn't work in browser environments because:
1. Webpack targets ES modules for web builds
2. The browser doesn't have a native `require()` function
3. Despite babel transpilation config, the module wasn't being properly replaced

The webpack configuration had an attempt to replace this module with a web-compatible patch, but the regex pattern wasn't matching correctly.

## Solution

### Code Changes

**File:** `webpack.config.js` (lines 77-83)

**Before (Not Working):**
```javascript
// Replace the problematic useFrameSize module with our web-compatible version
config.plugins.push(
  new webpack.NormalModuleReplacementPlugin(
    /@react-navigation\/elements.*useFrameSize/,
    path.resolve(__dirname, 'src/patches/useFrameSize.web.js')
  )
);
```

**After (Working):**
```javascript
// Replace the problematic useFrameSize module with our web-compatible version
config.plugins.push(
  new webpack.NormalModuleReplacementPlugin(
    /[\\/]@react-navigation[\\/]elements[\\/]lib[\\/]module[\\/]useFrameSize\.js$/,
    path.resolve(__dirname, 'src/patches/useFrameSize.web.js')
  )
);
```

### Key Changes

1. **Fixed regex pattern to match exact file path**
   - Added escaped backslashes `[\\/]` to match both forward and back slashes (cross-platform)
   - Added specific path segments: `lib/module/useFrameSize.js`
   - Added anchor `$` at the end to match the exact file
   - Previous pattern was too broad and wasn't matching at build time

2. **Web-compatible patch file** (`src/patches/useFrameSize.web.js`)
   - Replaces CommonJS `require()` with ES module imports
   - Implements the same functionality using browser-compatible APIs
   - Uses `ResizeObserver` instead of native listeners
   - No changes needed to this file - it already existed and works correctly

### Technical Details

The webpack `NormalModuleReplacementPlugin` intercepts module resolution during the build process. When webpack encounters a module that matches the regex pattern, it substitutes it with our web-compatible version.

The correct regex pattern must:
- Match the exact file path structure
- Account for both Windows (`\`) and Unix (`/`) path separators
- Be specific enough to only replace the intended module
- Match at build time before the bundle is created

## Why the Previous Fix Didn't Work

The original regex `/@react-navigation\/elements.*useFrameSize/` was too generic:
- Didn't account for path separators correctly
- Used `.*` which is too greedy
- Wasn't anchored to match the complete path
- May have matched during resolution but not replacement

## Testing

After implementing the fix:
1. Kill existing dev server processes
2. Run `npm run web` to start fresh development server
3. Open browser at `http://localhost:19006`
4. Verify:
   - No console errors
   - Login screen renders properly
   - All UI elements visible and interactive
   - No "require is not defined" errors

## Related Files

- `webpack.config.js:77-83` - Fixed regex pattern for module replacement
- `src/patches/useFrameSize.web.js` - Web-compatible replacement (already existed)
- `node_modules/@react-navigation/elements/lib/module/useFrameSize.js` - Problematic source file

## Prevention

For future development:
1. When using webpack module replacements, test the regex patterns thoroughly
2. Use specific path patterns with proper escaping for cross-platform compatibility
3. Verify webpack plugin replacements are working by checking build logs
4. Test web builds in browser immediately after webpack config changes
5. Use `NormalModuleReplacementPlugin` instead of aliases for more reliable replacements

## Debugging Tips

If you encounter similar issues:
1. Check browser console for the exact error and file location
2. Inspect the problematic node_modules file to understand what it's importing
3. Verify webpack config patterns are matching using console.log in the plugin
4. Use Chrome DevTools Sources tab to see which module version is loaded
5. Check that patch files use only web-compatible APIs (no Node.js built-ins)

## Additional Notes

- This is a common issue with React Native packages that have platform-specific code
- The `@react-navigation` team uses CommonJS imports for backwards compatibility
- Webpack module replacement is the recommended solution for handling platform-specific code
- This fix is complementary to Fix #1 - both are needed for proper web rendering

## References

- [Webpack NormalModuleReplacementPlugin](https://webpack.js.org/plugins/normal-module-replacement-plugin/)
- [React Navigation Elements](https://github.com/react-navigation/react-navigation/tree/main/packages/elements)
- [React Native Web Platform-Specific Extensions](https://necolas.github.io/react-native-web/docs/setup/#platform-specific-extensions)

