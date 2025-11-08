# Deployment Workflow for www.wakatto.com

**Quick Reference Guide**

---

## 🚀 How Deployment Works

```
┌─────────────────────────────────────────────────────────────────┐
│                     DEPLOYMENT FLOW                             │
└─────────────────────────────────────────────────────────────────┘

  1. YOU WORK HERE                    2. BUILD PROCESS
     ┌──────────────┐                    ┌──────────────┐
     │              │                    │              │
     │    main      │                    │  npm run     │
     │     OR       │ ───────────────►   │  web:build   │
     │ gemini-branch│                    │              │
     │              │                    └──────┬───────┘
     └──────────────┘                           │
                                                │
                                                ▼
  4. GOES LIVE                       3. AUTO-DEPLOY
     ┌──────────────┐                    ┌──────────────┐
     │              │                    │              │
     │ www.wakatto  │ ◄──────────────    │  gh-pages    │
     │    .com      │   GitHub Pages     │   branch     │
     │              │                    │ (automated)  │
     └──────────────┘                    └──────────────┘
```

---

## 📋 Step-by-Step: Deploying Changes

### Step 1: Make Your Changes
Work on any branch (`main`, `gemini-branch`, or feature branches)

```bash
# Edit your code
vim src/screens/LoginScreen.tsx

# Check what branch you're on
git branch
# * gemini-branch  ← You're here
```

### Step 2: Test Locally

```bash
# Build the web version
npm run web:build

# Serve it locally
npm run web:serve

# Open browser to http://localhost:3000
# Test everything works!
```

### Step 3: Commit Your Changes

```bash
git add .
git commit -m "Fix: Your descriptive message"
git push origin gemini-branch
```

### Step 4: Deploy to Production

```bash
npm run deploy
```

**What happens behind the scenes:**
1. ✅ Runs `expo export:web` (builds to `web-build/`)
2. ✅ Switches to `gh-pages` branch
3. ✅ Copies `web-build/` contents there
4. ✅ Commits and pushes to GitHub
5. ✅ GitHub Pages automatically serves the new content

### Step 5: Verify Deployment

```bash
# Wait 1-5 minutes for GitHub Pages to update
# Then visit: https://www.wakatto.com
# Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

---

## 🌳 Understanding the Branches

### Source Branches (Your Code)
| Branch | Purpose | Deploys? |
|--------|---------|----------|
| `main` | Main production code | ✅ Can deploy from here |
| `gemini-branch` | Active development | ✅ Can deploy from here |
| `feature-xyz` | Feature branches | ✅ Can deploy from here |

### Deployment Branch (Auto-Managed)
| Branch | Purpose | Edit Manually? |
|--------|---------|----------------|
| `gh-pages` | Built files for GitHub Pages | ❌ NEVER - Auto-generated |

**Important:** The `gh-pages` branch is automatically created and updated by the `gh-pages` npm package. You should NEVER manually edit it.

---

## ⚡ Quick Commands

### One-Line Full Deploy
```bash
npm run deploy
```

### Test Before Deploying
```bash
npm run web:build && npm run web:serve
```

### Deploy After Committing
```bash
git add . && git commit -m "Your message" && git push && npm run deploy
```

### Check Current Branch
```bash
git branch
```

### Switch Branch Before Deploying
```bash
git checkout main         # Deploy main branch
npm run deploy

# OR

git checkout gemini-branch  # Deploy dev branch
npm run deploy
```

---

## 🎯 What Gets Deployed?

When you run `npm run deploy` from **any branch**, these files get built and deployed:

```
web-build/
├── index.html                     → Homepage
├── static/
│   ├── js/
│   │   ├── main.*.js             → Your app code
│   │   └── 897.*.js              → React Native Web
│   └── media/
│       ├── *.ttf                 → Icon fonts
│       └── *.png                 → Images
├── manifest.json                  → PWA config
├── favicon.ico                    → Website icon
└── CNAME                          → Custom domain config
```

**Source files NOT deployed:**
- `src/` folder
- `node_modules/`
- `package.json`
- TypeScript files (`.ts`, `.tsx`)
- Configuration files

Only the compiled/built files from `web-build/` are deployed.

---

## 🔍 Checking Deployment Status

### Via Git
```bash
# See what was last deployed
git log origin/gh-pages --oneline -5

# See when gh-pages was last updated
git show origin/gh-pages
```

### Via GitHub
Visit: https://github.com/Robertoarce/wakatto/deployments

### Via Website
Just visit: https://www.wakatto.com

---

## ⚠️ Common Mistakes

### ❌ Mistake #1: Trying to Edit gh-pages
```bash
git checkout gh-pages
# DON'T EDIT FILES HERE!
```

**Why it's wrong:** The `gh-pages` branch is auto-generated. Your edits will be overwritten on next deploy.

**Do this instead:** Edit your source branch, then deploy.

---

### ❌ Mistake #2: Forgetting Which Branch You're On
```bash
# Oops, deploying from the wrong branch!
git checkout old-buggy-branch
npm run deploy  # This goes live! 😱
```

**Do this instead:** Always check your branch first:
```bash
git branch              # Check current branch
git checkout main       # Switch if needed
npm run deploy          # Now deploy
```

---

### ❌ Mistake #3: Not Testing Before Deploying
```bash
# Deploying without testing
npm run deploy  # Hope it works! 🤞
```

**Do this instead:** Always test locally first:
```bash
npm run web:build       # Build first
npm run web:serve       # Test on localhost:3000
npm run deploy          # Deploy when confirmed working
```

---

## 🛠️ Troubleshooting

### "My Changes Aren't Showing Up!"

**Solution 1:** Wait longer (GitHub Pages can take up to 10 minutes)

**Solution 2:** Hard refresh your browser
- **Mac:** Cmd + Shift + R
- **Windows/Linux:** Ctrl + Shift + R
- **Or:** Open incognito/private window

**Solution 3:** Check which branch was deployed
```bash
git log origin/gh-pages --oneline -1
# Does this show your latest commit?
```

**Solution 4:** Re-deploy
```bash
npm run deploy
```

---

### "Build Failed!"

**Solution 1:** Clean install
```bash
rm -rf node_modules package-lock.json
npm install
npm run web:build
```

**Solution 2:** Check for TypeScript errors
```bash
npm run type-check
```

**Solution 3:** Clear Expo cache
```bash
npx expo start -c
```

---

### "Black Screen on Website!"

**This is fixed!** But if it happens again:

1. Check `index.web.js` has the proper root element styling
2. See `docs/BLACK_SCREEN_FIX.md` for details
3. See `docs/LLM_TROUBLESHOOTING_GUIDE.md` for full solution

---

## 📦 Package.json Scripts

Here are all the relevant scripts defined in `package.json`:

```json
{
  "scripts": {
    "web:build": "expo export:web",        // Build web version
    "web:serve": "npx serve web-build",    // Serve locally
    "predeploy": "expo export:web",        // Runs before deploy
    "deploy": "gh-pages -d web-build"      // Deploy to GitHub Pages
  }
}
```

**Order of execution when you run `npm run deploy`:**
1. `predeploy` runs first → builds to `web-build/`
2. `deploy` runs second → pushes `web-build/` to `gh-pages` branch

---

## 🌐 Custom Domain Setup

Your site uses a custom domain: **www.wakatto.com**

### How It's Configured

1. **DNS Settings** (at domain registrar)
   ```
   CNAME record: www.wakatto.com → robertoarce.github.io
   ```

2. **CNAME File** (in repository root)
   ```
   www.wakatto.com
   ```

3. **GitHub Repository Settings**
   - Repo → Settings → Pages
   - Custom domain: www.wakatto.com
   - Enforce HTTPS: ✅ Enabled

### The CNAME File is Critical

The `CNAME` file tells GitHub Pages what custom domain to use. It gets automatically copied to `web-build/` during build, so it persists across deployments.

**Don't delete it!** Or your site will only be accessible at:
`https://robertoarce.github.io/wakatto/`

---

## 🔐 Environment & Secrets

### Supabase Configuration
The app connects to Supabase for authentication and data storage.

**Configuration location:** `src/lib/supabase.ts`

**Environment variables:** (if using)
- Check if `.env` file exists
- Supabase URL and keys should be configured

### AI Service Configuration
**Configuration location:** `src/services/aiService.ts`

Check this file for any API keys or configuration needed for AI features.

---

## ✅ Pre-Deployment Checklist

Before running `npm run deploy`, verify:

- [ ] On the correct branch (`git branch`)
- [ ] All changes committed (`git status`)
- [ ] Build succeeds locally (`npm run web:build`)
- [ ] App works on localhost (`npm run web:serve`)
- [ ] No console errors in browser
- [ ] Black screen issue not present
- [ ] Ready to go live

---

## 📊 Deployment History

| Date | Deployed From | Changes | Result |
|------|---------------|---------|--------|
| 2025-11-06 | `gemini-branch` | Fixed black screen issue | ✅ Success |
| 2025-11-06 | `gemini-branch` | Added deployment documentation | ✅ Success |

---

## 🎓 Understanding GitHub Pages

### What is GitHub Pages?
Free web hosting service from GitHub that serves static websites directly from a repository.

### How Does It Work?
1. You push HTML/CSS/JS to a special branch (`gh-pages`)
2. GitHub automatically serves those files as a website
3. Your custom domain points to that website

### Limitations
- ✅ Perfect for: Static sites, React apps, documentation
- ❌ Not for: Server-side code, databases, APIs

Your app works because:
- React Native Web compiles to static HTML/JS/CSS
- Supabase provides the backend (hosted separately)
- AI services are external APIs

---

## 🚦 Deployment States

### Local (Development)
```
http://localhost:3000
```
- Served by: `npm run web:serve`
- Source: `web-build/` directory
- Changes: Require rebuild

### Production (Live Site)
```
https://www.wakatto.com
```
- Served by: GitHub Pages
- Source: `gh-pages` branch
- Changes: Require deploy + 1-5 min wait

---

## 🤝 Working With Multiple Developers

### Branch Strategy
```
main (stable)
  │
  ├─ gemini-branch (active development)
  │   │
  │   ├─ feature-1
  │   └─ feature-2
  │
  └─ gh-pages (auto-generated, don't touch)
```

### Deployment Coordination
**Before deploying to production:**
1. Discuss with team which branch should be live
2. Test thoroughly on staging/local
3. Communicate before running `npm run deploy`
4. Document what was deployed

**Multiple people can deploy, but:**
- Last deploy wins (overwrites previous)
- Always deploy from a branch you tested
- Coordinate to avoid conflicts

---

## 📞 Need Help?

### Documentation
- `docs/LLM_TROUBLESHOOTING_GUIDE.md` - Comprehensive troubleshooting
- `docs/BLACK_SCREEN_FIX.md` - Black screen issue details
- `docs/DEPLOYMENT_GUIDE.md` - General deployment info

### Resources
- [GitHub Pages Docs](https://docs.github.com/en/pages)
- [Expo Web Docs](https://docs.expo.dev/guides/customizing-webpack/)
- [gh-pages Package](https://www.npmjs.com/package/gh-pages)

### Repository
- **GitHub:** https://github.com/Robertoarce/wakatto
- **Live Site:** https://www.wakatto.com

---

**Last Updated:** November 6, 2025  
**Status:** ✅ PRODUCTION READY  
**Current Branch:** `gemini-branch`  
**Deployed Version:** Latest with black screen fix

