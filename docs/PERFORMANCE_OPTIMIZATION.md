# Performance Optimization Guide

This document describes the performance profiling, benchmarking, and optimization work done to improve AI response times in the Wakatto app.

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Architecture Overview](#architecture-overview)
3. [Profiling Tools](#profiling-tools)
4. [Initial Benchmark Results](#initial-benchmark-results)
5. [Identified Bottlenecks](#identified-bottlenecks)
6. [Optimizations Implemented](#optimizations-implemented)
7. [Future Optimizations](#future-optimizations)

---

## Problem Statement

Character responses in the Wakatto app were taking **5-8+ seconds** to appear after the user sends a message. This created a poor user experience, especially for casual conversations.

**Goal**: Reduce perceived response time to under 2 seconds while maintaining the rich animated scene orchestration features.

---

## Architecture Overview

### Request Flow

```
User Message
     │
     ▼
┌─────────────────┐
│  MainTabs.tsx   │  ← Orchestrates message flow
│  handleSendMessage
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ singleCallOrchestration │  ← Builds animated scene prompt
│ generateAnimatedScene   │     (~800 tokens of instructions)
└────────────┬────────────┘
             │
             ▼
┌─────────────────┐
│  aiService.ts   │  ← API call wrapper
│ generateAIResponse
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ Supabase Edge Function  │  ← Proxy for API calls
│ /functions/v1/ai-chat   │
└────────────┬────────────┘
             │
             ▼
┌─────────────────┐
│ Anthropic API   │  ← Claude 3.5 Haiku
│ (Claude LLM)    │
└────────┬────────┘
         │
         ▼
    Response JSON
    (animated scene)
         │
         ▼
┌─────────────────────────┐
│ animationOrchestration  │  ← Parse scene, setup animations
│ parseOrchestrationScene │
└────────────┬────────────┘
             │
             ▼
┌─────────────────┐
│ ChatInterface   │  ← Display with 3D characters
│ + CharacterDisplay3D
└─────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `src/navigation/MainTabs.tsx` | Main message flow orchestration |
| `src/services/singleCallOrchestration.ts` | Builds animated scene prompts |
| `src/services/aiService.ts` | API calls to Edge Function |
| `src/services/animationOrchestration.ts` | Parses scene responses |
| `supabase/functions/ai-chat/index.ts` | Edge Function proxy |
| `src/components/ChatInterface.tsx` | UI rendering |

---

## Profiling Tools

### 1. Profiling Service (`profilingService.ts`)

A comprehensive timing service that wraps operations:

```typescript
import { getProfiler, PROFILE_OPS } from './profilingService';

const profiler = getProfiler();
profiler.startSession('my_session');

const timer = profiler.start(PROFILE_OPS.EDGE_FUNCTION_CALL);
await someOperation();
timer.stop({ metadata: 'optional' });

const session = profiler.endSession();
profiler.logSession(session);
```

**Features:**
- Session-based profiling with history
- Predefined operation constants
- Token estimation
- Formatted console output
- Event listeners for UI updates

### 2. Profiling Dashboard (`ProfilingDashboard.tsx`)

Visual overlay showing real-time metrics:
- Toggle with **Ctrl/Cmd + Shift + P**
- Shows timing breakdown by operation
- Displays token estimates
- Session history navigation

### 3. Benchmark Service (`benchmarkService.ts`)

Configurable benchmark runner:

```typescript
import { runQuickBenchmark } from './benchmarkService';

const report = await runQuickBenchmark(2); // 2 characters
console.log(report.summary);
```

**Strategies tested:**
- `full-prompt`: Current production approach
- `minimal-prompt`: Stripped-down instructions
- `haiku-model`: Minimal with explicit Haiku model

---

## Initial Benchmark Results

**Test Configuration:**
- 2 characters (Freud + Jung)
- Medium message: "I've been feeling a bit stressed lately about work. What do you think I should do?"
- 2 iterations per strategy (after 1 warmup)

### Results

| Strategy | Avg Time | Prompt Tokens | vs Baseline |
|----------|----------|---------------|-------------|
| full-prompt | 8,556ms | ~800 | baseline |
| minimal-prompt | 8,479ms | ~160 | -0.9% |
| haiku-model | 5,010ms | ~160 | -41.4% |

### Key Observations

1. **Auth caching works**: After first request, `[AI] Using cached auth session` appears
2. **Prompt size has minimal impact**: 160 vs 800 tokens = only 0.9% difference
3. **High variability**: full-prompt ranged from 4.7s to 12.4s
4. **Model is already optimal**: Already using Claude 3.5 Haiku (fastest)

### Critical Finding

The "faster" strategies (minimal-prompt, haiku-model) **removed essential animation instructions**. This is not a valid comparison for production use.

**The real baseline is 8.6 seconds** with full animation support.

---

## Identified Bottlenecks

### 1. LLM Inference Time (Primary - ~70%)
- Claude needs time to generate the response
- Complex JSON structure adds overhead
- Animation instructions require reasoning

### 2. Network Latency (~15%)
- Client → Supabase Edge Function: ~50-100ms
- Edge Function → Anthropic API: ~50-100ms
- Return path: ~50-100ms

### 3. Auth Session Fetch (~5%)
- **Solved**: Implemented 5-minute session caching
- Saves ~100-200ms per request

### 4. Title Generation (~10% on first message)
- **Solved**: Now runs in background, doesn't block response

### 5. Sequential Operations (~5%)
- DB saves happen after AI response
- Parsing happens after full response received

---

## Optimizations Implemented

### Phase 1 (Completed)

| Optimization | Impact | Status |
|--------------|--------|--------|
| Auth session caching | -100-200ms | ✅ Done |
| Deferred title generation | -1-2s (first msg) | ✅ Done |
| Profiling infrastructure | Visibility | ✅ Done |
| Benchmark tooling | Data collection | ✅ Done |
| Streaming support (backend) | Ready for UI | ✅ Done |

### Code Locations

- Auth caching: `src/services/aiService.ts` → `getCachedAuthSession()`
- Title deferral: `src/navigation/MainTabs.tsx` → background async
- Streaming: `supabase/functions/ai-chat/index.ts` → `streamAnthropic()`

---

## Phase 2 Optimizations (Implemented)

### 1. Streaming UI Integration ✅
Wired streaming backend to the UI:
- Uses `generateAnimatedSceneOrchestrationStreaming()` in `singleCallOrchestration.ts`
- Progress callbacks during generation
- Streaming enabled by default in MainTabs

### 2. Anthropic Prompt Caching ✅
Implemented in Edge Function (`supabase/functions/ai-chat/index.ts`):
```
Header: anthropic-beta: prompt-caching-2024-07-31
cache_control: { type: 'ephemeral' }
```
- Static animation instructions are cached across requests
- Reduces per-request processing time
- Enabled by default, can be disabled via `enablePromptCache: false`

### 3. Animation-Preserving Benchmark ✅
New strategies in `benchmarkService.ts`:
- `baseline`: Current full animation prompt
- `compact-prompt`: 40% fewer instruction tokens, same features
- `compact-json`: Shorter response field names

Run via Settings > Developer Tools > "Run Animation Benchmark"

### 4. Parallel DB Operations ✅
All DB saves now run in background (non-blocking):
- User message save: Fire-and-forget, AI generation starts immediately
- Assistant message saves: Parallel Promise.all, display shows immediately
- Single character saves: Background with error logging

**Code locations:**
- `src/navigation/MainTabs.tsx` → All `dispatch(saveMessage(...))` calls

### 5. Early Animation Setup ✅
Start "thinking" animations while streaming, before full JSON is parsed:
- `onEarlySetup` callback in streaming orchestration
- Partial JSON parsing to detect characters early
- Creates placeholder "thinking" scene

**Code locations:**
- `src/services/singleCallOrchestration.ts` → `tryDetectEarlyCharacters()`
- `src/components/ChatInterface.tsx` → Early animation useEffect

### Expected Combined Impact

| Metric | Before | After |
|--------|--------|-------|
| Perceived response | 8.6s | ~2s (streaming indicator) |
| Actual response | 8.6s | ~5-6s (caching + optimization) |
| First token | 8.6s | ~1s (streaming) |

---

## How to Use the Tools

### View Profiling Dashboard
1. Run the app
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Send a message
4. View timing breakdown

### Run Benchmarks
1. Go to Settings screen
2. Scroll to "Developer Tools"
3. Click "Run Quick Benchmark"
4. Wait ~30 seconds for results

### Console Monitoring
Open DevTools Console to see:
```
╔══════════════════════════════════════════════════════════════╗
║  PROFILING SESSION: message_1234567890                       ║
╠══════════════════════════════════════════════════════════════╣
║  Total Duration:    5234.56ms                                ║
╠══════════════════════════════════════════════════════════════╣
║  BREAKDOWN BY OPERATION                                      ║
╟──────────────────────────────────────────────────────────────╢
║  edge_function_call              4521.23ms   86.4% ║
...
```

---

## Deployment

### Deploy Edge Function with Prompt Caching and Streaming

The Edge Function (`supabase/functions/ai-chat/index.ts`) has been updated with:
- SSE streaming support for faster perceived responses
- Anthropic prompt caching for static animation instructions
- Parallel operations optimizations

To deploy:

```bash
# 1. Get your Supabase access token from:
#    https://supabase.com/dashboard/account/tokens

# 2. Set the environment variable
export SUPABASE_ACCESS_TOKEN=your_token_here

# 3. Run the deployment script
./deploy-edge-function.sh
```

### Verify Deployment

After deployment, check the Edge Function logs in Supabase Dashboard for:
- `[AI-Chat] Prompt caching ENABLED for system prompt` - confirms caching is active
- `[AI-Chat] Streaming response...` - confirms streaming is working

---

## References

- [Anthropic Prompt Caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)
- [Claude 3.5 Models](https://docs.anthropic.com/en/docs/about-claude/models)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

