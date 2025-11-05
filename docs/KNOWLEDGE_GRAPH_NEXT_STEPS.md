# Knowledge Graph - Next Steps

## ✅ Phase 1 & 2: COMPLETED

### 1. ✅ PRD Created
**File:** `docs/PRD_KNOWLEDGE_GRAPH.md`

Comprehensive Product Requirements Document covering:
- User stories & functional requirements
- AI extraction specifications
- Graph visualization types (Network, Emotion Map, Timeline, Detail View)
- Technical architecture
- Database schema
- UI/UX designs
- Success metrics
- Development phases (4 weeks)

### 2. ✅ AI Connection Test Suite Built
**File:** `src/services/aiConnectionTest.ts`

Complete testing utility with:
- `testOpenAI()` - Tests OpenAI GPT-4 connectivity
- `testAnthropic()` - Tests Claude connectivity
- `testGemini()` - Tests Gemini connectivity
- `testEntityExtraction()` - Tests entity detection for knowledge graph
- `testEmotionDetection()` - Tests emotion analysis for knowledge graph
- `runAllTests()` - Comprehensive test suite with detailed reporting

### 3. ✅ Test UI Added to Settings Screen
**File:** `src/screens/SettingsScreen.tsx`

New features:
- "Test AI Connection" button (cyan/teal colored)
- Live progress indicator during testing
- Test results display showing:
  - ✅/❌ Basic Connection status
  - ✅/❌ Entity Extraction status (needed for graph)
  - ✅/❌ Emotion Detection status (needed for graph)
  - Response times
  - Error messages if any fail

---

## 📋 Phase 3: TEST AI CONNECTION (DO THIS NOW)

### Step-by-Step Instructions:

#### 1. Get an API Key

**Option A: OpenAI (Recommended)**
- Go to: https://platform.openai.com/api-keys
- Sign up / Login
- Click "Create new secret key"
- Copy the key (starts with `sk-...`)
- Cost: ~$0.002 per test, ~$0.10 per knowledge graph generation

**Option B: Anthropic Claude**
- Go to: https://console.anthropic.com/
- Get API key
- Similar cost structure

**Option C: Google Gemini**
- Go to: https://makersuite.google.com/app/apikey
- Free tier available!
- Good for testing

#### 2. Configure & Test

1. **Open App** → Go to **Settings** tab
2. **Select AI Provider**:
   - Choose: OpenAI, Anthropic, or Gemini
3. **Enter API Key**:
   - Paste your API key
4. **Optional: Set Model**:
   - OpenAI: `gpt-4` (recommended) or `gpt-3.5-turbo` (cheaper)
   - Anthropic: `claude-3-sonnet-20240229`
   - Gemini: `gemini-pro`
5. **Click "Save AI Settings"**
6. **Click "Test AI Connection"** (cyan button)
7. **Wait ~5-15 seconds**
8. **Review Results:**

**✅ Success Looks Like:**
```
✅ All Tests Passed

Basic Connection: ✅ Success (1234ms)
Entity Extraction: ✅ Success (2456ms)
Emotion Detection: ✅ Success (2789ms)
```

**❌ Failure Looks Like:**
```
⚠️ Some Tests Failed

Basic Connection: ❌ Failed (543ms)
Error: Invalid API key

Entity Extraction: ❌ Failed
Emotion Detection: ❌ Failed
```

#### 3. Troubleshooting

**If tests fail:**

**Error: "Invalid API key"**
- Double-check you copied the entire key
- Make sure key hasn't been revoked
- Try generating a new key

**Error: "Network request failed"**
- Check internet connection
- Try again in a few seconds
- API service might be temporarily down

**Error: "Rate limit exceeded"**
- Wait 1 minute and try again
- You hit API rate limits

**Error: "AI did not return valid JSON"**
- The AI is working but prompt needs adjustment
- Still okay to proceed (we'll refine prompts in development)

---

## 🚀 Phase 4: DEVELOPMENT (After Tests Pass)

### What We'll Build:

#### Part 1: Generate Graph Button (Week 1)
- Floating action button (FAB) at bottom-right of chat
- Purple button with graph/network icon
- Click → Modal with options:
  - Scope: Current conversation / All conversations / Date range
  - "Generate" button
  - Progress indicator

#### Part 2: AI Processing Pipeline (Week 2)
- Fetch diary entries based on scope
- Send to AI for extraction:
  - Entities (people, places, concepts)
  - Emotions (type, intensity, target)
  - Relationships (who connects to whom)
  - Themes (recurring topics)
- Store in Supabase database
- Build graph data structure

#### Part 3: Graph Visualization (Week 3)
- Interactive network graph using `react-force-graph` or `vis-network`
- Node types: people (purple), places (cyan), concepts (green)
- Edge types: relationships, emotions
- Interactions:
  - Click node → see details
  - Hover → highlight connections
  - Zoom/pan with mouse/touch
- Filter by type, emotion, date

#### Part 4: Insights & Polish (Week 4)
- Auto-generated insights:
  - "Most mentioned: Sarah (15 times)"
  - "Pattern: mentions of ex correlate with self-doubt"
  - "Emotional shift: feelings about career changed from negative to positive"
- Alternative views: Timeline, Emotion Map
- Export as image/PDF
- Mobile optimization

---

## 📊 Example Flow (After Development)

```
User writes diary entry:
"I had coffee with Sarah at Starbucks. She told me about her new job at Google."

↓

User clicks Generate Graph button

↓

AI extracts:
- Entities: You, Sarah, Starbucks, Google
- Relationships: 
  - You → had_coffee_with → Sarah
  - Sarah → works_at → Google
  - Event → at_location → Starbucks
- Emotions: neutral, positive

↓

Graph displays:
        YOU
       /   \
  had coffee  
    /         \
  Sarah    Starbucks
    |
 works_at
    |
  Google

Click on "Sarah" → Shows all mentions of Sarah in diary
```

---

## 🎯 Current Status

- [x] PRD Complete
- [x] Test Suite Built
- [x] Test UI Added to Settings
- [ ] **→ YOU ARE HERE: Test AI Connection**
- [ ] Development Phase 1: Generate Button
- [ ] Development Phase 2: AI Extraction
- [ ] Development Phase 3: Visualization
- [ ] Development Phase 4: Insights & Polish

---

## 💰 Cost Estimates

Based on OpenAI GPT-4 pricing:

**Testing:** ~$0.002 per test run (negligible)

**Knowledge Graph Generation:**
- 10 diary entries: ~$0.02
- 50 diary entries: ~$0.08
- 100 diary entries: ~$0.15
- 500 diary entries: ~$0.75

**Monthly Usage** (assuming 10 graphs/month with 50 entries each):
- Cost: ~$0.80/month per user

**Recommendation:** Start with GPT-3.5-turbo for testing (10x cheaper), then use GPT-4 for production if needed.

---

## 🔒 Security Notes

**Current Setup:** API keys are stored in app (client-side)
- ⚠️ **FOR DEVELOPMENT ONLY**
- Keys visible in client code
- User could extract and abuse

**Production Setup** (Before Launch):
1. Move AI calls to Supabase Edge Functions (backend)
2. Store API keys in environment variables on server
3. Client calls your backend, backend calls AI
4. Rate limiting per user
5. Cost monitoring & alerts

---

## ❓ FAQ

**Q: Can I use the app without AI for knowledge graph?**
A: Yes! The diary works fully without it. Knowledge graph is an optional power feature.

**Q: Will my data be sent to OpenAI/Anthropic?**
A: Yes, when you generate a graph. We only send the diary entries you select. Your API key = you control what's sent.

**Q: Can I delete generated graphs?**
A: Yes! You'll be able to delete any graph from the UI.

**Q: How long does graph generation take?**
A: Target: <10 seconds for 50 entries, <30 seconds for 200 entries.

**Q: What if I don't want certain entries in the graph?**
A: You'll be able to exclude entries or only generate graphs from specific conversations.

---

## 📞 Next Actions

1. **Right now:** Test AI connection using Settings screen
2. **If tests pass:** Ready to start development! 
3. **If tests fail:** Troubleshoot using guide above
4. **Once ready:** Create branch, start Phase 4 (development)

---

**Status:** ✅ Ready for AI Testing  
**Last Updated:** November 5, 2025  
**Next Milestone:** Pass all 3 AI tests

