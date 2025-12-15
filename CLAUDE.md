# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Wakatto is an AI-powered personal diary application featuring interactive 3D characters ("Wakattors"), intelligent conversation management, and multi-AI provider support. Built with Expo/React Native for cross-platform deployment (web, iOS, Android).

**Live at:** https://www.wakatto.com

## Common Commands

```bash
# Development
npm run web           # Start web dev server (Expo)
npm run web:dev       # Start with custom webpack config
npm run start         # Start Expo dev server (all platforms)
npm run ios           # Run on iOS
npm run android       # Run on Android

# Build
npm run web:build     # Export for web (expo export:web)
npm run web:build:webpack  # Build with custom webpack config

# Deployment
npm run deploy        # Deploy to GitHub Pages

# Quality
npm run lint          # ESLint
npm run type-check    # TypeScript type checking (tsc --noEmit)
npm run test          # Jest tests (watch mode)

# Supabase Edge Functions
supabase functions deploy ai-chat  # Deploy AI chat function
supabase secrets set CLAUDE_API_KEY=xxx  # Set API key
```

## Architecture

### State Management
Redux store with three reducers in `src/store/`:
- `authReducer` - Authentication state (session, user, loading)
- `conversationReducer` - Conversations and messages
- `uiReducer` - UI state

### Navigation Flow
```
App.tsx
└── ErrorBoundary
    └── Provider (Redux)
        └── AppNavigator
            ├── LoginScreen
            ├── RegisterScreen
            └── MainScreen (authenticated)
                └── MainTabs
                    ├── HomeScreen (chat interface)
                    ├── WakattorsScreen (character management)
                    ├── LibraryScreen
                    ├── AnimationsScreen
                    └── SettingsScreen
```

### AI Integration
AI calls are proxied through Supabase Edge Functions to avoid CORS:
1. Client (`src/services/aiService.ts`) → Edge Function (`supabase/functions/ai-chat/index.ts`) → AI Provider API
2. Supports OpenAI, Anthropic Claude (default), Google Gemini
3. Streaming responses supported for Anthropic
4. API keys stored server-side in Supabase secrets

### Key Services (src/services/)
- `aiService.ts` - Main AI communication with streaming support
- `multiCharacterConversation.ts` - Multi-Wakattor conversation orchestration
- `animationOrchestration.ts` - Character animation state management
- `supabaseService.ts` - Database operations (conversations, messages)
- `customWakattorsService.ts` - Custom character CRUD operations

### 3D Character System
- `CharacterDisplay3D.tsx` - Three.js character renderer using @react-three/fiber
- 7 animation states: idle, thinking, talking, confused, happy, excited, winning
- Character configs in `src/config/characters.ts`

### Web Build Configuration
Custom webpack config (`webpack.config.js`) handles:
- Node polyfills for Supabase (crypto, stream, buffer)
- Environment variable injection from `.env`
- Module replacements for React Navigation web compatibility

## Database

Supabase PostgreSQL with migrations in `supabase/migrations/`. Key tables:
- `conversations` - User conversations
- `messages` - Conversation messages with optional `character_id`
- `custom_wakattors` - User-created characters

## Environment Variables

For local development, create `.env`:
```
CLAUDE_API_KEY=sk-ant-xxx
```

For production, set secrets in Supabase:
```bash
supabase secrets set CLAUDE_API_KEY=xxx
supabase secrets set OPENAI_API_KEY=xxx
```
