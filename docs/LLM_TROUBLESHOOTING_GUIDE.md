# LLM Troubleshooting Guide for Wakatto AI Diary

**Last Updated:** November 6, 2025  
**For:** Future LLMs and AI assistants working on this codebase  
**Purpose:** Document known issues, solutions, and deployment workflow

---

## 🚨 CRITICAL ISSUES & SOLUTIONS

### Issue #1: Black Screen on Web (SOLVED)

**Date Discovered:** November 6, 2025  
**Severity:** CRITICAL - Application invisible to users  
**Status:** ✅ FIXED

#### Symptoms
- Application loads in browser
- Console shows all components mounting correctly
- DOM inspection shows all elements present with correct styles
- Screen appears completely black
- Brief flash of content visible on page load before disappearing
- No JavaScript errors in console

#### Root Cause
React Native Web requires explicit flexbox and viewport dimension styles applied **programmatically** to the root DOM element. The previous implementation using Expo's `registerRootComponent()` did not properly initialize these styles for the web platform.

#### The Fix (KEEP THIS CODE!)

**File:** `index.web.js`

```javascript
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
```

#### Why This Works
1. **Direct AppRegistry usage** gives full control over web initialization
2. **Explicit flexbox styles** ensure React Native components have proper layout
3. **Viewport dimensions** (100vh/100vw) make container fill entire screen
4. **Platform-specific code** ensures native platforms aren't affected

#### What NOT To Do
❌ Do NOT replace with `registerRootComponent(App)` - it causes black screen
❌ Do NOT remove the root element style assignments
❌ Do NOT rely on CSS-only solutions in `web/index.html`

#### How to Verify Fix Works
1. Build: `npm run web:build`
2. Serve: `npm run web:serve`
3. Open browser to `http://localhost:3000`
4. You should see:
   - Dark background (#0f0f0f)
   - "Welcome Back" header in white
   - Email and Password input fields
   - Purple login button
   - Orange "Quick Dev Login" button

#### Debugging Steps If Black Screen Returns

If you see black screen again, add this debug code temporarily:

```javascript
// In index.web.js, after AppRegistry.runApplication:
setTimeout(() => {
  console.log('🔍 DOM Check:');
  const root = document.getElementById('root');
  console.log('Root children:', root.children.length);
  if (root.children[0]) {
    const style = window.getComputedStyle(root.children[0]);
    console.log('First child height:', style.height);
    console.log('First child display:', style.display);
    console.log('First child visibility:', style.visibility);
    console.log('First child opacity:', style.opacity);
  }
}, 2000);
```

Look for:
- `height: "0px"` → Root styling not applied
- `display: "none"` or `visibility: "hidden"` → Component rendering issue
- `opacity: "0"` → Styling override problem

---

## 📦 DEPLOYMENT WORKFLOW

### Overview: How www.wakatto.com Works

This project uses **GitHub Pages** with a custom domain. Here's the complete flow:

```
[Source Code] → [Build Process] → [gh-pages branch] → [GitHub Pages] → [www.wakatto.com]
```

### Branch Architecture

#### Source Code Branches (where you work)
- **`main`** - Main production branch
- **`gemini-branch`** - Current active development branch
- **Other feature branches** - As needed

**Contains:**
- React Native source code
- TypeScript files
- Configuration files
- Documentation

#### Deployment Branch (auto-managed, DO NOT EDIT MANUALLY)
- **`gh-pages`** - Auto-generated deployment branch

**Contains:**
- Compiled HTML, CSS, JavaScript
- Static assets (images, fonts)
- Only the contents of `web-build/` folder
- Automatically created and updated by `gh-pages` npm package

### Deployment Commands

#### Full Deployment (Recommended)
```bash
npm run deploy
```

**What this does:**
1. Runs `predeploy` script: `expo export:web`
   - Compiles TypeScript → JavaScript
   - Bundles React Native → React Native Web
   - Optimizes assets
   - Outputs to `web-build/` directory
2. Runs `deploy` script: `gh-pages -d web-build`
   - Creates/switches to `gh-pages` branch
   - Copies `web-build/` contents
   - Commits changes
   - Pushes to `origin/gh-pages`
3. GitHub Pages automatically serves the updated content
4. www.wakatto.com updates (may take 1-5 minutes)

#### Manual Build (for testing)
```bash
npm run web:build          # Build to web-build/
npm run web:serve          # Serve locally on http://localhost:3000
```

### Step-by-Step Deployment Process

When you need to deploy changes to www.wakatto.com:

1. **Make your changes** on your working branch (e.g., `gemini-branch`)
   ```bash
   # Edit files, fix bugs, add features
   ```

2. **Test locally**
   ```bash
   npm run web:build
   npm run web:serve
   # Open http://localhost:3000 and verify everything works
   ```

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "Your descriptive commit message"
   git push origin gemini-branch
   ```

4. **Deploy to production**
   ```bash
   npm run deploy
   ```

5. **Verify deployment**
   - Wait 1-5 minutes for GitHub Pages to update
   - Visit https://www.wakatto.com
   - Hard refresh (Cmd+Shift+R / Ctrl+Shift+R) to clear cache
   - Test critical functionality

### Important Notes

#### You Can Deploy From Any Branch
```bash
# Deploy from gemini-branch
git checkout gemini-branch
npm run deploy  # ✅ This goes live on www.wakatto.com

# Deploy from main
git checkout main
npm run deploy  # ✅ This goes live on www.wakatto.com
```

⚠️ **WARNING:** Whatever branch you deploy from becomes the live site!

#### The gh-pages Branch
- **DO NOT** manually edit the `gh-pages` branch
- **DO NOT** merge other branches into `gh-pages`
- **DO NOT** commit directly to `gh-pages`
- It's automatically managed by the `gh-pages` npm package
- Think of it as a "build artifact" branch

#### Custom Domain Configuration
The custom domain (www.wakatto.com) is configured via:
1. **CNAME file** in repository root
   ```
   www.wakatto.com
   ```
2. **DNS settings** pointing to GitHub Pages
3. **GitHub repository settings** → Pages → Custom domain

The build process automatically copies the CNAME file to `web-build/` so it persists across deployments.

### Deployment Checklist

Before deploying to production:

- [ ] Code compiles without errors: `npm run web:build`
- [ ] App runs correctly locally: `npm run web:serve`
- [ ] No black screen issue (LoginScreen visible)
- [ ] Navigation works between screens
- [ ] Authentication flow works
- [ ] Console has no critical errors
- [ ] Changes committed to source branch
- [ ] Ready to go live

After deploying:

- [ ] Wait 1-5 minutes for GitHub Pages
- [ ] Visit www.wakatto.com
- [ ] Hard refresh browser (Cmd+Shift+R)
- [ ] Test critical user paths
- [ ] Check on mobile if UI changes were made
- [ ] Verify no broken links or missing assets

---

## 🔧 KNOWN ISSUES & WORKAROUNDS

### Issue: Build Warnings About Bundle Size

**Symptoms:**
```
asset size limit: The following asset(s) exceed the recommended size limit (586 KiB)
MaterialCommunityIcons.5d42b4e60858731e7b65.ttf (1.09 MiB)
```

**Status:** ⚠️ KNOWN, NON-CRITICAL

**Explanation:**
- Icon font files are large
- This is expected for React Native Web apps
- Does not break functionality
- Initial load time is still acceptable

**Future Fix (Optional):**
- Implement code splitting
- Use tree-shaking for icons
- Consider switching to SVG icons

### Issue: Windows Compatibility for Some Scripts

**Script:** `storycap:all`
```json
"storycap:all": "rm -rf ./__screenshots__ && yarn storycap..."
```

**Problem:** `rm -rf` is Unix-specific, won't work in Windows CMD/PowerShell

**Solution:** Use Git Bash on Windows, or replace with cross-platform `rimraf`:
```bash
npm install --save-dev rimraf
```
```json
"storycap:all": "rimraf ./__screenshots__ && yarn storycap..."
```

**Status:** ⚠️ KNOWN, LOW PRIORITY (main deployment scripts work on all platforms)

---

## 🎯 TESTING GUIDE

### Local Development Testing

1. **Start development server**
   ```bash
   npm start
   # or for web specifically:
   npm run web
   ```

2. **Test web build locally**
   ```bash
   npm run web:build
   npm run web:serve
   ```

3. **Access at:** http://localhost:3000

### What to Test Before Deploying

#### Critical Path Testing
1. **LoginScreen Visibility**
   - ✅ Screen is visible (not black)
   - ✅ "Welcome Back" header displays
   - ✅ Input fields are visible and functional
   - ✅ Buttons are clickable

2. **Authentication Flow**
   - ✅ Can type in email/password fields
   - ✅ Login button responds
   - ✅ Quick Dev Login works
   - ✅ Error messages display properly

3. **Navigation**
   - ✅ Can navigate to Register screen
   - ✅ Can navigate to Main screen after login
   - ✅ Tabs work on Main screen

4. **Console Check**
   - ✅ No critical errors
   - ✅ No infinite loops
   - ✅ No missing module warnings

### Debugging Tools

#### Browser DevTools
- **Console:** Check for errors
- **Elements:** Inspect DOM structure
- **Network:** Verify all assets load
- **Application → Local Storage:** Check stored data

#### React Native Debugger (for development)
```bash
npm start
# Press 'j' to open debugger
```

---

## 📚 ARCHITECTURE OVERVIEW

### Project Structure

```
/Users/i0557807/00 ALL/02 Me/15 Appys/02 Diary/
├── src/                          # Source code
│   ├── screens/                  # Screen components
│   │   ├── LoginScreen.tsx       # Login page
│   │   ├── MainScreen.tsx        # Main app screen
│   │   └── ...
│   ├── navigation/               # Navigation setup
│   │   ├── AppNavigator.tsx      # Root navigator
│   │   └── MainTabs.tsx          # Tab navigation
│   ├── components/               # Reusable components
│   ├── services/                 # API & services
│   │   ├── supabaseService.ts    # Supabase integration
│   │   └── aiService.ts          # AI/chat functionality
│   └── store/                    # Redux store
│
├── web/                          # Web-specific files
│   └── index.html                # HTML template
│
├── web-build/                    # Build output (gitignored)
│   └── [generated files]         # Deployed to gh-pages
│
├── docs/                         # Documentation
│   ├── BLACK_SCREEN_FIX.md       # Black screen issue details
│   ├── DEPLOYMENT_SUMMARY_2025-11-06.md
│   └── LLM_TROUBLESHOOTING_GUIDE.md  # This file
│
├── index.web.js                  # Web entry point (CRITICAL!)
├── App.tsx                       # Root component
├── package.json                  # Dependencies & scripts
└── webpack.config.js             # Custom webpack config
```

### Key Files for Deployment

| File | Purpose | Can Modify? |
|------|---------|-------------|
| `index.web.js` | Web entry point with black screen fix | ⚠️ Be careful |
| `App.tsx` | Root component | ✅ Yes |
| `package.json` | Scripts and dependencies | ✅ Yes |
| `web/index.html` | HTML template | ✅ Yes |
| `webpack.config.js` | Build configuration | ⚠️ Be careful |
| `CNAME` | Custom domain config | ❌ No (unless changing domain) |
| `web-build/*` | Build output | ❌ No (auto-generated) |

---

## 🤖 FOR LLMS: BEST PRACTICES

### When User Reports Black Screen

1. **First, check** `index.web.js`:
   - Does it use `AppRegistry.runApplication`?
   - Are root element styles applied?
   - Is Platform check present?

2. **If missing**, apply the fix from Issue #1 above

3. **Rebuild and test**:
   ```bash
   npm run web:build
   npm run web:serve
   ```

4. **Deploy when confirmed working**:
   ```bash
   npm run deploy
   ```

### When Making Changes to Web Code

1. Always test locally first
2. Check browser console for errors
3. Use DOM inspector to verify elements exist
4. Test with hard refresh (clear cache)
5. Only deploy when confirmed working

### When User Wants to Deploy

1. Verify which branch they're on: `git branch`
2. Ensure changes are committed
3. Run build locally first: `npm run web:build`
4. Test locally: `npm run web:serve`
5. Deploy: `npm run deploy`
6. Remind them to wait 1-5 minutes for GitHub Pages
7. Tell them to hard refresh when checking

### Communication Template

When deploying, tell the user:

```
✅ Deployment initiated!

The build is being deployed to www.wakatto.com via GitHub Pages.

Next steps:
1. Wait 1-5 minutes for GitHub Pages to update
2. Visit https://www.wakatto.com
3. Hard refresh your browser (Cmd+Shift+R or Ctrl+Shift+R)
4. Verify the changes are live

Note: The deployed version is from the [branch-name] branch.
If this isn't correct, checkout the desired branch and run 'npm run deploy' again.
```

---

## 🔍 DEBUGGING CHECKLIST

### Black Screen Debugging

If user reports black screen:

```bash
# 1. Check if index.web.js has the fix
cat index.web.js | grep "rootTag.style"

# 2. If missing, apply the fix (see Issue #1)

# 3. Rebuild
npm run web:build

# 4. Test locally
npm run web:serve

# 5. Check browser console for errors

# 6. Inspect DOM - root element should have styles:
#    - display: flex
#    - height: [viewport height]
#    - width: [viewport width]

# 7. If working, deploy
npm run deploy
```

### Deployment Not Showing Up

```bash
# 1. Check which branch was deployed
git log origin/gh-pages --oneline -5

# 2. Verify CNAME file exists in web-build
ls web-build/CNAME

# 3. Check GitHub Pages status
# Visit: https://github.com/Robertoarce/wakatto/settings/pages

# 4. Force rebuild
npm run web:build
npm run deploy

# 5. Clear browser cache completely
# Tell user to hard refresh or open incognito mode
```

### Build Errors

```bash
# 1. Clean install dependencies
rm -rf node_modules package-lock.json
npm install

# 2. Clear Expo cache
npx expo start -c

# 3. Try building again
npm run web:build

# 4. Check TypeScript errors
npm run type-check
```

---

## 📖 RESOURCES

### Documentation Files
- `docs/BLACK_SCREEN_FIX.md` - Detailed technical analysis of black screen issue
- `docs/DEPLOYMENT_GUIDE.md` - General deployment information
- `docs/DEPLOYMENT_SUMMARY_2025-11-06.md` - Latest deployment record

### External Resources
- [React Native Web](https://necolas.github.io/react-native-web/)
- [Expo Web](https://docs.expo.dev/guides/customizing-webpack/)
- [GitHub Pages](https://docs.github.com/en/pages)
- [gh-pages npm package](https://www.npmjs.com/package/gh-pages)

### Repository
- **GitHub:** https://github.com/Robertoarce/wakatto
- **Live Site:** https://www.wakatto.com
- **Main Branch:** `main`
- **Active Dev Branch:** `gemini-branch`

---

## 🎓 LEARNING POINTS

### Why This Project Is Special

1. **Cross-Platform:** Same codebase for iOS, Android, and Web
2. **React Native Web:** Requires special initialization for web
3. **GitHub Pages:** Free hosting with custom domain
4. **Branch-Based Deployment:** Any branch can deploy to production
5. **Auto-Generated Deployment Branch:** `gh-pages` is managed automatically

### Common Misconceptions

❌ **Wrong:** "I need to edit the gh-pages branch"
✅ **Right:** "gh-pages is auto-generated, edit source branches"

❌ **Wrong:** "The website serves from the main branch"
✅ **Right:** "The website serves from gh-pages, built from any source branch"

❌ **Wrong:** "registerRootComponent works for web"
✅ **Right:** "Need AppRegistry.runApplication with explicit styles for web"

❌ **Wrong:** "CSS in index.html is enough for layout"
✅ **Right:** "Need programmatic JavaScript styles on root element"

---

## 🚀 QUICK REFERENCE

### Common Commands

```bash
# Development
npm start                    # Start Expo dev server
npm run web                  # Start web dev mode
npm run web:build            # Build web version
npm run web:serve            # Serve built web version locally

# Deployment
npm run deploy               # Deploy to www.wakatto.com

# Testing
npm run type-check           # Check TypeScript errors
npm run lint                 # Run linter

# Git
git branch                   # Show current branch
git checkout main            # Switch to main
git checkout gemini-branch   # Switch to dev branch
```

### Quick Deploy Workflow

```bash
# Full workflow in one go:
git add . && \
git commit -m "Your message" && \
git push origin gemini-branch && \
npm run deploy
```

---

## 📝 CHANGELOG

| Date | Issue | Solution | Committed By |
|------|-------|----------|--------------|
| 2025-11-06 | Black screen on web | Fixed index.web.js with explicit root styles | Claude (via user) |
| 2025-11-06 | Deployment workflow unclear | Created comprehensive documentation | Claude (via user) |

---

## ✅ FINAL CHECKLIST FOR LLMS

Before closing a troubleshooting session:

- [ ] Issue is resolved and tested locally
- [ ] Changes are committed to git
- [ ] Deployed to www.wakatto.com (if needed)
- [ ] User knows how to verify the fix
- [ ] Relevant documentation updated
- [ ] User understands the deployment workflow
- [ ] No breaking changes introduced
- [ ] Console is free of critical errors

---

**Last Updated:** November 6, 2025  
**Maintained By:** Development Team & AI Assistants  
**Status:** ✅ PRODUCTION READY

**If you're an LLM reading this:** You now have everything you need to troubleshoot and deploy this application. The black screen issue is solved - DO NOT change `index.web.js` unless you have a very good reason!

