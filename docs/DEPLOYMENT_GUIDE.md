# Deployment Guide - GitHub Pages

## ✅ **Current Status: Ready to Deploy (with security fixes)**

Your Expo app **CAN** be deployed to GitHub Pages as a static web application.

---

## 🚨 **CRITICAL: Security Issues to Fix First**

### **Issue 1: AI API Keys Exposed in Client Code** ⚠️

**Current State:**
- API keys are stored in Redux state and `aiService.ts`
- Users enter API keys in Settings screen
- Keys are stored in browser memory (cleared on refresh)

**Risk Level:** 🔴 **HIGH** for public deployment

**Why it's a problem:**
- Anyone can open browser DevTools and steal API keys from Redux state
- If you hardcode keys, they'll be visible in the bundled JavaScript
- AI providers will bill YOUR account for ANY usage

**Solution Options:**

#### **Option A: User-Provided Keys (Current Approach)** ✅ SAFE
- Keep current implementation where users provide their own API keys
- Add clear warnings that keys are stored locally only
- Keys are never saved to database or sent anywhere except AI APIs
- **This is safe for public deployment** ✅

#### **Option B: Server-Side Proxy (Most Secure)** 🔒 RECOMMENDED
Move AI calls to Supabase Edge Functions:

```typescript
// Create: supabase/functions/ai-chat/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { messages, provider } = await req.json()
  
  // API key stored as Supabase secret (never exposed to client)
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  
  // Call OpenAI/Anthropic/Gemini from server
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'gpt-4', messages }),
  })
  
  return new Response(JSON.stringify(await response.json()))
})
```

Then update client:
```typescript
// Instead of calling OpenAI directly:
const response = await supabase.functions.invoke('ai-chat', {
  body: { messages, provider: 'openai' }
})
```

---

### **Issue 2: Supabase Keys** ℹ️

**Current State:**
- Supabase URL and anon key are hardcoded in `src/lib/supabase.ts`

**Risk Level:** 🟡 **MEDIUM** (acceptable for now)

**Why it's OK:**
- The "anon" key is meant to be public
- Row Level Security (RLS) policies protect your data
- Users can only access their own conversations/messages

**Optional Improvement:**
```bash
# Create .env file (add to .gitignore!)
EXPO_PUBLIC_SUPABASE_URL=https://rddvqbxbmpilbimmppvu.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

Update `src/lib/supabase.ts`:
```typescript
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
```

---

## 📦 **Deployment Steps**

### **1. Prepare for Production**

#### **Add Production Build Script**
Update `package.json`:
```json
{
  "scripts": {
    "web": "expo start --web",
    "web:build": "expo export:web",
    "deploy": "expo export:web && gh-pages -d web-build"
  }
}
```

#### **Install gh-pages**
```bash
npm install --save-dev gh-pages
```

---

### **2. Configure for GitHub Pages**

#### **Add `app.json` Configuration**
```json
{
  "expo": {
    "web": {
      "bundler": "metro",
      "output": "static"
    }
  }
}
```

#### **Configure Supabase Redirect URLs**
In Supabase Dashboard → Authentication → URL Configuration:
- Add: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME`
- Site URL: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME`

---

### **3. Build for Web**

```bash
# Build the web version
npx expo export:web

# This creates a 'web-build' folder with static files
```

---

### **4. Deploy to GitHub Pages**

#### **Method A: Using gh-pages (Recommended)**
```bash
# First time setup
npm run deploy

# This will:
# 1. Build the web version
# 2. Create/update gh-pages branch
# 3. Push to GitHub
```

#### **Method B: Manual Deploy**
```bash
# Build
npx expo export:web

# Push to gh-pages branch
git add web-build
git commit -m "Deploy web build"
git subtree push --prefix web-build origin gh-pages
```

---

### **5. Enable GitHub Pages**

1. Go to: `https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/settings/pages`
2. Source: **Deploy from a branch**
3. Branch: **gh-pages** / **/ (root)**
4. Click **Save**

Your app will be live at: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME`

---

## 🛠️ **Additional Configurations**

### **Handle React Router on GitHub Pages**

GitHub Pages doesn't handle SPA routing well. Add to `web-build/index.html`:

```html
<script>
  // Redirect 404s to index.html
  (function() {
    var redirect = sessionStorage.redirect;
    delete sessionStorage.redirect;
    if (redirect && redirect != location.href) {
      history.replaceState(null, null, redirect);
    }
  })();
</script>
```

Create `404.html` in root:
```html
<!DOCTYPE html>
<html>
  <head>
    <script>
      sessionStorage.redirect = location.href;
      location.replace('/YOUR_REPO_NAME/');
    </script>
  </head>
  <body></body>
</html>
```

---

### **Optimize Bundle Size**

```bash
# Analyze bundle
npx expo export:web --dump-sourcemap

# Use Metro bundler optimizations (already configured)
```

---

## ✅ **Pre-Deployment Checklist**

- [ ] **Security:**
  - [ ] User-provided API keys (current) OR Edge Functions implemented
  - [ ] Supabase RLS policies verified
  - [ ] No hardcoded secrets in code
  - [ ] `.env` files in `.gitignore`

- [ ] **Configuration:**
  - [ ] Supabase redirect URLs updated for production domain
  - [ ] `app.json` configured for static web export
  - [ ] Build scripts added to `package.json`

- [ ] **Testing:**
  - [ ] Test build locally: `npx expo export:web && npx serve web-build`
  - [ ] Test authentication flow
  - [ ] Test AI chat functionality
  - [ ] Test on mobile browsers

- [ ] **Documentation:**
  - [ ] README updated with live demo link
  - [ ] User instructions for providing their own API keys
  - [ ] Security warnings added to Settings screen

---

## 🎯 **Recommended Deployment Strategy**

### **Phase 1: MVP (Current State)** ✅ Ready Now
- Deploy with user-provided API keys
- Add clear warning in Settings:
  ```
  "⚠️ Your API key is stored locally in your browser only. 
   It is never sent to our servers. Clear your browser 
   data to remove it."
  ```
- This is **safe** and **ready to deploy**

### **Phase 2: Production (Later)**
- Implement Supabase Edge Functions for AI calls
- Add API key management in your Supabase backend
- Rate limiting per user
- Usage analytics

---

## 📝 **Quick Deploy Command**

```bash
# One-time setup
npm install --save-dev gh-pages

# Add to package.json scripts:
# "deploy": "expo export:web && gh-pages -d web-build"

# Deploy
npm run deploy
```

---

## 🔗 **Useful Resources**

- [Expo Web Deployment](https://docs.expo.dev/distribution/publishing-websites/)
- [GitHub Pages Docs](https://docs.github.com/en/pages)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [React Native Web](https://necolas.github.io/react-native-web/)

---

## 🚀 **You're Ready!**

With the current implementation (user-provided API keys), your app is:
- ✅ Secure for public deployment
- ✅ Functional on web
- ✅ Ready for GitHub Pages
- ✅ Mobile-responsive

**Just run:** `npm run deploy` (after adding the script)

**Your live app:** `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME` 🎉

