# Development Workflow

Complete guide for developing, testing, and deploying Wakatto.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                       DEVELOPMENT / TEST                         │
│  App: Expo Go / "Wakatto TEST" (com.wakatto.test)               │
│  Backend: Local Supabase (localhost:54321)                      │
│  Branch: feature/* or fix/*                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         PRODUCTION                               │
│  App: "Wakatto" (com.wakatto.app)                               │
│  Backend: Cloud Supabase (rddvqbxbmpilbimmppvu.supabase.co)     │
│  Branch: main                                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference

| Phase | Command | Backend | Branch |
|-------|---------|---------|--------|
| Start local backend | `supabase start` | Local | any |
| Run mobile dev | `expo start` | Local | feature/* |
| Run web dev | `npm run web` | Local | feature/* |
| Build TEST app | `npm run build:test:ios` | Local | feature/* |
| Build PROD app | `npm run build:prod:ios` | Cloud | main |
| Deploy web | `npm run deploy` | Cloud | main |
| Push DB migrations | `supabase db push` | Cloud | main |

---

## Development Workflow

### Step 1: Create a Feature Branch

```bash
git checkout main
git pull origin main
git checkout -b feature/my-new-feature
```

### Step 2: Start Local Supabase

```bash
supabase start
```

This starts:
- API: http://127.0.0.1:54321
- Studio (DB UI): http://127.0.0.1:54323
- Inbucket (Email testing): http://127.0.0.1:54324

Your local database has all migrations applied automatically.

### Step 3: Run the App Locally

**Mobile (simulator/emulator):**
```bash
expo start
# Press 'i' for iOS simulator
# Press 'a' for Android emulator
```

**Web:**
```bash
npm run web
```

The app automatically connects to local Supabase in development mode.

### Step 4: Make Changes and Iterate

- Edit code
- App hot-reloads automatically
- Test locally
- Repeat until feature is complete

### Step 5: Create Database Migrations (if needed)

If you changed the database schema:

```bash
# Create a new migration file
supabase migration new my_migration_name

# Edit the migration in supabase/migrations/
# Then restart to apply:
supabase db reset
```

### Step 6: Commit Your Changes

```bash
git add .
git commit -m "feat: description of changes"
git push origin feature/my-new-feature
```

---

## Testing on Physical Device

### Option A: Expo Go (Quick Testing)

1. Install Expo Go on your phone
2. Run `expo start`
3. Scan the QR code

Note: Device must be on same network as your computer.

### Option B: Build TEST App (Full Testing)

For testing features that require native builds:

```bash
# Build for iOS
npm run build:test:ios

# Build for Android
npm run build:test:android

# Build both
npm run build:test:all
```

This creates "Wakatto TEST" app with bundle ID `com.wakatto.test`.
Both TEST and PROD apps can be installed side-by-side.

**For device to connect to local Supabase:**

Update `src/config/environment.ts`:
```typescript
// Change localhost to your machine's IP
const LOCAL_SUPABASE_URL = 'http://192.168.1.XXX:54321';
```

Find your IP: `ipconfig getifaddr en0` (Mac)

---

## Production Deployment

### Step 1: Merge to Main

```bash
git checkout main
git pull origin main
git merge feature/my-new-feature
git push origin main
```

### Step 2: Push Database Migrations

```bash
# Link to production Supabase
supabase link --project-ref rddvqbxbmpilbimmppvu

# Push migrations to production
supabase db push

# Deploy edge functions if changed
supabase functions deploy ai-chat
supabase functions deploy send-email
supabase functions deploy transcribe-audio
supabase functions deploy text-to-speech
```

### Step 3: Deploy Web

```bash
npm run deploy
```

This builds the web app and deploys to GitHub Pages (wakatto.com).

### Step 4: Build Production Mobile Apps

```bash
# iOS
npm run build:prod:ios

# Android
npm run build:prod:android

# Both
npm run build:prod:all
```

### Step 5: Submit to App Stores

After EAS build completes:

```bash
# Submit to App Store
eas submit --platform ios --profile production

# Submit to Play Store
eas submit --platform android --profile production
```

---

## Environment Configuration

The app automatically detects which environment to use:

| Condition | Environment | Supabase |
|-----------|-------------|----------|
| `expo start` (development) | development | Local |
| EAS build with `--profile test` | test | Local |
| EAS build with `--profile production` | production | Cloud |

Configuration is in `src/config/environment.ts`.

---

## Useful Commands

### Supabase

```bash
supabase start          # Start local Supabase
supabase stop           # Stop local Supabase
supabase db reset       # Reset DB and apply all migrations
supabase migration new  # Create new migration
supabase db diff        # Show schema differences
supabase status         # Show local Supabase status
```

### EAS Build

```bash
eas build --profile test --platform ios        # Test iOS build
eas build --profile test --platform android    # Test Android build
eas build --profile production --platform ios  # Prod iOS build
eas build --profile production --platform android  # Prod Android build
```

### Git

```bash
git checkout -b feature/name   # Create feature branch
git checkout main              # Switch to main
git merge feature/name         # Merge feature to main
git branch -d feature/name     # Delete feature branch
```

---

## Troubleshooting

### App connects to wrong backend

1. Check `__DEV__` mode - should be true in development
2. Verify `APP_ENV` in `eas.json` for build profiles
3. Check console logs: `[Environment] Running in X mode`

### Local Supabase not starting

```bash
supabase stop
docker system prune -f
supabase start
```

### Device can't connect to local Supabase

1. Ensure device is on same WiFi network
2. Update `LOCAL_SUPABASE_URL` in `environment.ts` to your machine's IP
3. Check firewall allows connections on port 54321

### Migrations not applying

```bash
supabase db reset  # Resets and reapplies all migrations
```

---

## File Structure

```
src/
├── config/
│   └── environment.ts    # Environment switching logic
├── lib/
│   └── supabase.ts       # Supabase client (uses env config)
supabase/
├── config.toml           # Local Supabase config
├── migrations/           # Database migrations
└── functions/            # Edge functions
eas.json                  # EAS build profiles
app.config.js             # Dynamic app configuration
```

