# Wakatto AI Diary - Product Roadmap

**Last Updated**: November 9, 2025
**Status**: Active Development
**Current Version**: MVP 1.0

---

## Table of Contents
1. [Bugs to Fix](#bugs-to-fix)
2. [Quick Wins](#quick-wins)
3. [Short-term Features (1-2 Weeks)](#short-term-features-1-2-weeks)
4. [Medium-term Features (1 Month)](#medium-term-features-1-month)
5. [Long-term Vision (3+ Months)](#long-term-vision-3-months)
6. [Technical Debt](#technical-debt)
7. [Performance & UX](#performance--ux)
8. [Completed Tasks](#completed-tasks)

---

## Bugs to Fix

### Critical Priority 🔴
- [ ] None currently identified

### High Priority 🟡
- [ ] **Web Alert Dialogs**: Web platform uses basic `window.alert()` and `window.confirm()`. Replace with proper React Native Web modal component for better UX
- [ ] **API Key Security**: API keys stored in Redux state are visible in Redux DevTools. Move to secure storage or backend
- [ ] **Error Boundary Missing Context**: Error boundary could provide more context about what failed
- [ ] **Message Editing Race Condition**: If user edits message while AI is responding, could cause state conflicts

### Medium Priority 🟢
- [ ] **Supabase Credentials in Code**: Move from `src/lib/supabase.ts` to environment variables
- [ ] **No Network Error Handling**: App doesn't detect offline state or network errors gracefully
- [ ] **Session Expiry**: No handling for when Supabase session expires (8 hour default)
- [ ] **Conversation Delete Confirmation**: Uses generic Alert, should have custom modal with conversation preview

### Low Priority 🔵
- [ ] **TypeScript `any` Types**: Several components use `any` types (error handlers, Redux actions)
- [ ] **Console Logs in Production**: Remove debug console.logs before deployment (e.g., `MainTabs.tsx:81-82`)
- [ ] **Hardcoded Dev Credentials**: Dev email/password should be in environment variables (`LoginScreen.tsx:25-26`)

---

## Quick Wins

### 5-15 Minutes Each ⚡
- [ ] **Add Loading State to Sidebar**: Show skeleton while conversations load
- [ ] **Keyboard Shortcuts**: Document Ctrl+Enter to send in UI (currently only in placeholder)
- [ ] **Empty State Messages**: Add helpful text when no conversations exist ("Start your first conversation!")
- [ ] **Conversation Timestamps**: Show "Last active: 2 hours ago" in sidebar
- [ ] **Message Count Badge**: Show message count next to conversation titles
- [ ] **Copy Message Button**: Add button to copy message content to clipboard
- [ ] **Settings Form Validation**: Validate API key format before saving
- [ ] **Logout Loading State**: Add spinner to logout button while signing out
- [ ] **Auto-focus Input**: Focus message input when selecting a conversation
- [ ] **Scroll to Bottom Button**: Show "↓ New messages" button when scrolled up

### 30-60 Minutes Each ⚡⚡
- [ ] **Conversation Rename**: Add edit icon to conversation titles in sidebar
- [ ] **Message Character Count**: Show character count as user types (with limit indicator)
- [ ] **AI Response Streaming**: Show typing indicator with partial responses as they arrive
- [ ] **Dark/Light Theme Toggle**: Add theme selection to Settings (currently dark only)
- [ ] **Export Conversation**: Add button to export conversation as text/JSON
- [ ] **Conversation Sorting**: Add sort options (newest, oldest, most active, alphabetical)
- [ ] **Search Within Conversation**: Add search bar to filter messages in current chat
- [ ] **Conversation Archive**: Soft-delete instead of hard-delete with archive feature

---

## Short-term Features (1-2 Weeks)

### Week 1: Core UX Improvements
**Goal**: Polish the existing diary experience

#### Message Management
- [ ] **Edit Messages UI**: Long-press message → Edit option (already partially implemented)
  - Status: Edit function exists in actions, UI partially complete
  - File: `src/components/ChatInterface.tsx:71-87`
  - TODO: Test edit flow end-to-end

- [ ] **Delete Messages UI**: Long-press message → Delete option (already partially implemented)
  - Status: Delete function exists, needs better confirmation UX
  - File: `src/components/ChatInterface.tsx:89-107`

- [ ] **Message Reactions**: Add emoji reactions to messages (👍 ❤️ 😊 💡)

#### Conversation Enhancements
- [ ] **Conversation Folders/Tags**: Categorize conversations (Work, Personal, Therapy, etc.)
- [ ] **Pin Conversations**: Pin important conversations to top of sidebar
- [ ] **Conversation Preview**: Show last message preview in sidebar
- [ ] **Bulk Operations**: Select multiple conversations for delete/archive

#### Settings Improvements
- [ ] **Test AI Connection Button**: Add visual test for API connectivity
  - Reference: Already designed in `KNOWLEDGE_GRAPH_NEXT_STEPS.md`
  - UI: Cyan/teal button with progress indicator

- [ ] **API Usage Tracking**: Show estimated cost/tokens used per provider
- [ ] **Model Presets**: Quick-select presets (Fast, Balanced, Creative, etc.)

### Week 2: Mobile Experience
**Goal**: Optimize for iOS and Android

- [ ] **Pull to Refresh**: Add pull-to-refresh on conversation list
- [ ] **Swipe Actions**: Swipe conversation left to delete, right to archive
- [ ] **Haptic Feedback**: Add tactile feedback for actions on mobile
- [ ] **Share Sheet Integration**: Share to diary from other apps (iOS/Android)
- [ ] **Notification Support**: Local notifications for reminders (optional)
- [ ] **Biometric Lock**: Face ID/Touch ID/Fingerprint to lock app
- [ ] **iOS Keyboard Toolbar**: Add "Send" button above keyboard
- [ ] **Android Back Button**: Properly handle back navigation

---

## Medium-term Features (1 Month)

### Advanced AI Features
- [ ] **Voice Input**: Implement voice recording with transcription
  - Status: UI button exists, needs implementation
  - File: `src/components/ChatInterface.tsx:66-69`
  - Options: Expo Speech, OpenAI Whisper, Google Speech-to-Text

- [ ] **AI Personality Selection**: Choose diary assistant tone (Empathetic, Clinical, Casual, etc.)
- [ ] **Custom System Prompts**: Let users customize the AI's behavior
- [ ] **Multi-turn Prompting**: "Continue", "Tell me more", "Summarize" quick actions
- [ ] **Mood Detection**: Detect and log user's emotional state from entries
- [ ] **Writing Prompts**: Daily/weekly journal prompts suggested by AI

### Data & Insights
- [ ] **Search Across All Conversations**: Global search with filters
- [ ] **Weekly/Monthly Summaries**: AI-generated insights about your week/month
- [ ] **Export Options**: PDF, Markdown, JSON export with formatting
- [ ] **Import from Other Apps**: Import from Day One, Journey, other diary apps
- [ ] **Backup & Sync**: Automatic encrypted backups to cloud storage
- [ ] **Data Visualization**: Charts for writing frequency, mood trends, etc.

### Characters Screen (Phase 1)
**Goal**: Extract and display entities mentioned in diary

- [ ] **Entity Extraction**: Use AI to identify people, places, concepts
  - Reference: `src/services/entityExtraction.ts` (partially exists)
  - Database: `entities` table already in schema

- [ ] **Character Cards**: Display cards for each person mentioned
  - Show: Name, mention count, first/last appearance, relationship type

- [ ] **Place Cards**: Display locations mentioned
- [ ] **Timeline View**: When and where entities appeared
- [ ] **Manual Entity Creation**: Let users add entities manually
- [ ] **Entity Merging**: "Sarah" and "Sarah Smith" → merge duplicates

---

## Long-term Vision (3+ Months)

### Knowledge Graph Visualization
**Status**: PRD Complete, waiting for AI testing
**Reference**: `docs/PRD_KNOWLEDGE_GRAPH.md`, `docs/KNOWLEDGE_GRAPH_NEXT_STEPS.md`

#### Phase 1: Generation (Week 1)
- [ ] **Generate Graph Button**: FAB with modal to select scope
- [ ] **Scope Selection**: Current conversation / All conversations / Date range
- [ ] **Progress Indicator**: Show extraction progress

#### Phase 2: AI Processing (Week 2)
- [ ] **Entity Extraction**: People, places, concepts, emotions
- [ ] **Relationship Detection**: Who connects to whom and how
- [ ] **Theme Analysis**: Recurring topics and patterns
- [ ] **Database Storage**: Save to Supabase `entities` and `relationships` tables

#### Phase 3: Visualization (Week 3)
- [ ] **Interactive Graph**: Using `react-force-graph` or `vis-network`
- [ ] **Node Types**: People (purple), Places (cyan), Concepts (green)
- [ ] **Edge Types**: Relationships, emotions, co-occurrence
- [ ] **Interactions**: Click node → details, Hover → highlight connections
- [ ] **Filters**: By type, emotion, date range, strength

#### Phase 4: Insights (Week 4)
- [ ] **Auto-insights**: "Most mentioned: Sarah (15 times)"
- [ ] **Pattern Detection**: "Mentions of X correlate with feelings of Y"
- [ ] **Emotional Timeline**: How feelings about topics changed over time
- [ ] **Alternative Views**: Timeline view, Emotion heat map, Table view
- [ ] **Export**: Save graph as image/PDF

### Advanced Features
- [ ] **Collaborative Journaling**: Share entries with therapist/partner (with permissions)
- [ ] **Therapy Mode**: Specialized prompts for CBT, DBT, ACT techniques
- [ ] **Goal Tracking**: Set goals, track progress through diary entries
- [ ] **Habit Integration**: Connect with habit trackers (Habitica, Streaks, etc.)
- [ ] **Calendar Integration**: Link entries to calendar events
- [ ] **Photo Attachments**: Add photos to diary entries
- [ ] **Rich Text Formatting**: Markdown support for bold, italics, lists
- [ ] **Templates**: Pre-made journal templates (Gratitude, Dream log, etc.)
- [ ] **Reminders**: Schedule daily/weekly journal reminders
- [ ] **Privacy Zones**: Hide/encrypt specific entries or conversations

### Platform Expansion
- [ ] **Web App Polish**: Optimize for desktop browsers (responsive layout)
- [ ] **Desktop App**: Electron wrapper for Mac/Windows/Linux
- [ ] **Browser Extension**: Quick capture from any website
- [ ] **Apple Watch**: Quick voice journaling from watch
- [ ] **Siri/Google Assistant**: "Hey Siri, journal this..."

### Monetization (Future)
- [ ] **Free Tier**: Basic diary with limited AI calls
- [ ] **Pro Tier**: Unlimited AI, knowledge graph, advanced features
- [ ] **Therapist Tier**: Collaborative features for professionals
- [ ] **API Access**: Let developers build on top of the platform

---

## Technical Debt

### Code Quality
- [ ] **Remove Template Code**: Delete unused `HomeScreen.tsx` and related files
- [ ] **TypeScript Strictness**: Enable `strict` mode, fix all `any` types
- [ ] **ESLint Rules**: Add stricter rules, fix all warnings
- [ ] **PropTypes**: Add proper prop validation to all components
- [ ] **JSDoc Comments**: Document all public functions and components
- [ ] **Code Splitting**: Lazy load screens for faster initial load
- [ ] **Bundle Size**: Analyze and reduce bundle size (currently 1.1 MB)

### Testing
- [ ] **Unit Tests**: Achieve >80% coverage for utilities and services
  - Current: Limited tests exist
  - Priority: `aiService.ts`, `supabaseService.ts`, Redux actions/reducers

- [ ] **Component Tests**: Test all major components with React Testing Library
  - Priority: `ChatInterface`, `ChatSidebar`, `Header`

- [ ] **Integration Tests**: Test key user flows
  - Login → Create conversation → Send message → Receive response
  - Edit message → Delete message
  - Create conversation → Delete conversation

- [ ] **E2E Tests**: Playwright/Detox tests for critical paths
  - Full auth flow
  - Complete conversation lifecycle

- [ ] **Snapshot Tests**: Update and maintain component snapshots
- [ ] **Performance Tests**: Benchmark message rendering with large histories

### Architecture
- [ ] **Move AI to Backend**: Create Supabase Edge Functions for AI calls
  - Security: Keep API keys server-side
  - Cost Control: Rate limiting per user
  - Performance: Caching and optimization

- [ ] **Environment Variables**: Move all config to `.env`
  - Supabase URL and anon key
  - AI provider settings (for defaults)
  - Feature flags

- [ ] **Error Tracking**: Integrate Sentry or similar for crash reporting
- [ ] **Analytics**: Add privacy-friendly analytics (Plausible, Fathom)
- [ ] **Feature Flags**: Implement feature toggle system for gradual rollouts
- [ ] **Logging**: Structured logging with log levels (error, warn, info, debug)
- [ ] **API Versioning**: Version AI service and database APIs for backward compatibility

### Database
- [ ] **Migrations**: Set up proper migration system for schema changes
- [ ] **Indexing Audit**: Review all queries, add missing indexes
- [ ] **RLS Testing**: Test Row Level Security policies thoroughly
- [ ] **Backup Strategy**: Automated daily backups with restoration testing
- [ ] **Data Retention**: Policy for old data cleanup (GDPR compliance)

### Documentation
- [ ] **API Documentation**: Document all services and their methods
- [ ] **Component Storybook**: Complete Storybook stories for all components
- [ ] **Architecture Diagrams**: Create visual diagrams of system architecture
- [ ] **Onboarding Docs**: Guide for new developers joining the project
- [ ] **User Guide**: Help documentation for end users
- [ ] **Changelog**: Maintain CHANGELOG.md for version history

---

## Performance & UX

### Performance Optimizations
- [ ] **Message List Virtualization**: Use `FlatList` with `windowSize` optimization
  - Current: All messages rendered at once
  - Impact: Slow with 100+ messages in conversation

- [ ] **Image Optimization**: Optimize and lazy-load images (for future photo feature)
- [ ] **Memoization**: Use `React.memo`, `useMemo`, `useCallback` strategically
- [ ] **Redux Selectors**: Use reselect for derived state to prevent unnecessary re-renders
- [ ] **Bundle Splitting**: Code-split large libraries (AI SDKs, graph visualization)
- [ ] **Service Workers**: Add PWA support with offline caching (web)
- [ ] **Lazy Loading**: Defer loading of Settings, Characters, Graph tabs until accessed

### UX Improvements
- [ ] **Loading Skeletons**: Replace spinners with content-aware skeletons
- [ ] **Optimistic Updates**: Update UI immediately, sync in background
- [ ] **Error Recovery**: Retry failed operations automatically with backoff
- [ ] **Network Status Indicator**: Show banner when offline
- [ ] **Keyboard Navigation**: Full keyboard support for web (Tab, Enter, Esc)
- [ ] **Accessibility Audit**:
  - WCAG 2.1 AA compliance
  - Screen reader support
  - High contrast mode
  - Font size adjustment
  - Focus indicators

- [ ] **Animations**: Add smooth transitions between screens
- [ ] **Gesture Support**: Swipe gestures for mobile navigation
- [ ] **Responsive Design**: Optimize layouts for tablets and large screens
- [ ] **Reduced Motion**: Respect user's motion preferences

### Monitoring & Analytics
- [ ] **Performance Monitoring**: Track app load time, TTI, FCP
- [ ] **Error Rate Tracking**: Monitor error rates by screen/action
- [ ] **User Behavior Analytics**: Track feature usage (privacy-friendly)
- [ ] **A/B Testing**: Framework for testing UX changes
- [ ] **Session Replay**: Opt-in session recording for debugging (LogRocket, FullStory)

---

## Completed Tasks

### November 9, 2025
- [x] **Login Flow Fix**: Fixed chat history not loading after login
  - Issue: Redux store not updated with session after `signIn()`
  - Solution: Added `setSession()` dispatch in `LoginScreen` and `RegisterScreen`
  - Files: `src/screens/LoginScreen.tsx`, `src/screens/RegisterScreen.tsx`

### November 6, 2025
- [x] **Black Screen Fix**: Fixed React Native Web rendering issue
  - Issue: App loaded but showed black screen
  - Solution: Added explicit flex styles to root element in `index.web.js`
  - Documentation: `docs/BLACK_SCREEN_FIX.md`

- [x] **Comprehensive Documentation**: Created docs for future developers and LLMs
  - `docs/LLM_TROUBLESHOOTING_GUIDE.md`
  - `docs/DEPLOYMENT_WORKFLOW.md`
  - `docs/DEPLOYMENT_SUMMARY_2025-11-06.md`
  - `docs/SESSION_SUMMARY_2025-11-06.md`

### Earlier
- [x] Authentication system (login, register, logout)
- [x] Conversation management (create, select, delete)
- [x] Message persistence with Supabase
- [x] Multi-provider AI integration (OpenAI, Claude, Gemini, Mock)
- [x] Settings screen with AI configuration
- [x] Redux state management (auth, conversations, UI)
- [x] Dark theme UI with purple accents
- [x] Bottom tab navigation
- [x] Collapsible sidebar
- [x] Error boundary
- [x] Message editing/deletion actions (backend, partial UI)

---

## Priority Matrix

### Do First (High Impact, Low Effort)
1. Message editing/deletion UI completion
2. Conversation rename
3. Add loading states
4. Empty state messages
5. Keyboard shortcuts documentation

### Schedule (High Impact, High Effort)
1. Knowledge graph visualization
2. Voice input
3. Search functionality
4. Move AI to backend
5. Mobile optimizations

### Fill-in Tasks (Low Impact, Low Effort)
1. Remove console.logs
2. Fix TypeScript types
3. Add JSDoc comments
4. Loading skeletons
5. Conversation timestamps

### Postpone (Low Impact, High Effort)
1. Desktop app
2. Browser extension
3. Apple Watch app
4. Collaborative features
5. Monetization features

---

## How to Use This Roadmap

### For Product Decisions
- **Weekly Reviews**: Check off completed items, reprioritize
- **Feature Requests**: Add new items to appropriate section
- **Bug Reports**: Add to "Bugs to Fix" with priority label

### For Development
- **Sprint Planning**: Pick 3-5 items from "Quick Wins" or current phase
- **Story Points**: Estimate effort (⚡ = 1 point, ⚡⚡ = 2 points, etc.)
- **Blockers**: Note dependencies between tasks

### For Communication
- **User Updates**: Share progress from "Completed Tasks"
- **Investor Updates**: Highlight "Short-term" and "Medium-term" progress
- **Hiring**: Show "Long-term Vision" to attract contributors

---

## Contributing

Want to work on something? Here's how:

1. **Pick a Task**: Choose from "Quick Wins" or current phase
2. **Create Branch**: `git checkout -b feature/task-name`
3. **Implement**: Write code, tests, documentation
4. **Test**: Verify locally on web, iOS, Android (if applicable)
5. **PR**: Create pull request with task reference
6. **Move to Completed**: Once merged, update this roadmap

---

## Questions or Suggestions?

- **Found a bug?** Add it to the "Bugs to Fix" section
- **Have an idea?** Add it to the appropriate future section
- **Want to help?** Pick an unclaimed task and start coding!
- **Need clarification?** Check referenced docs or create an issue

---

**Last Updated**: November 9, 2025
**Next Review**: November 16, 2025
**Maintainer**: @Robertoarce
