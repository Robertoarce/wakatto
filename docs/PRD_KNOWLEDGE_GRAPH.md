# Product Requirements Document (PRD)
## Psychological Insight Knowledge Graph

**Version:** 1.0  
**Date:** November 5, 2025  
**Status:** Planning  

---

## 1. Overview

### 1.1 Purpose
Create an on-demand knowledge graph that visualizes psychological patterns, relationships, and themes from diary entries to provide users with deeper self-awareness and emotional insights.

### 1.2 Problem Statement
Users write diary entries containing complex emotional experiences, relationships, and recurring thoughts, but have no way to:
- Visualize patterns across multiple entries
- Understand how their thoughts/feelings evolve over time
- Identify triggers and correlations between events and emotions
- See the "bigger picture" of their mental/emotional landscape

### 1.3 Success Metrics
- **Engagement:** 30%+ of users generate at least one graph per week
- **Retention:** Users who use graph feature have 2x higher retention
- **Insights:** 80%+ of users report gaining at least one new self-insight
- **Performance:** Graph generation completes in <10 seconds
- **Accuracy:** 85%+ accuracy in entity/emotion extraction (user feedback)

---

## 2. User Stories

### Primary Users: Journal Writers Seeking Self-Understanding

**As a user, I want to:**
1. Generate a knowledge graph from my diary entries on-demand
2. See visual connections between people, places, emotions, and themes
3. Understand patterns in my emotional life (triggers, cycles, growth)
4. Track how my feelings about specific topics evolve over time
5. Identify recurring thought patterns or concerns
6. Explore relationships between different aspects of my life

**As a user, I need:**
1. Privacy and security (sensitive psychological data)
2. Clear, understandable visualizations (not overwhelming)
3. Actionable insights (not just pretty graphs)
4. Fast generation (won't wait >15 seconds)
5. Mobile-friendly viewing

---

## 3. Functional Requirements

### 3.1 Graph Generation Trigger

**FR-1: Generate Graph Button**
- **Location:** Bottom right of chat interface, outside chat input area
- **Appearance:** Floating action button (FAB) with graph icon
- **States:**
  - Default: Purple button with graph/network icon
  - Loading: Spinner animation
  - Error: Red with retry option
- **Visibility:** Always visible when user has ≥3 diary entries
- **Action:** Opens graph generation modal/screen

**FR-2: Generation Scope**
User can choose what to analyze:
- Current conversation only
- All conversations (last 30 days)
- All conversations (all time)
- Custom date range
- Specific conversations (multi-select)

**FR-3: Processing Indication**
- Progress indicator showing:
  - "Analyzing entries..." (0-30%)
  - "Extracting insights..." (30-60%)
  - "Building graph..." (60-90%)
  - "Finalizing..." (90-100%)
- Estimated time remaining
- Cancel option

### 3.2 AI-Powered Extraction

**FR-4: Entity Extraction**
Extract and categorize:
- **People:** Names, relationships (ex, friend, family, colleague)
- **Places:** Locations, venues, cities, countries
- **Organizations:** Companies, schools, groups
- **Concepts:** Abstract ideas (love, career, future, self-worth)
- **Events:** Specific occurrences (dream, conversation, argument)

**FR-5: Emotion Detection**
Identify and classify:
- **Primary emotions:** Joy, sadness, anger, fear, disgust, surprise
- **Complex emotions:** Longing, nostalgia, self-doubt, hope, anxiety
- **Intensity:** Scale 1-10
- **Target:** What/who the emotion is directed at
- **Polarity:** Positive, negative, neutral, mixed

**FR-6: Relationship Mapping**
Detect connections:
- **Direct:** "Sarah and I went to Paris" → User-Sarah, User-Paris, Sarah-Paris
- **Temporal:** "used to", "will", "hoping to"
- **Emotional:** "miss", "love", "worried about"
- **Causal:** "because", "made me feel", "triggered"
- **Comparative:** "like", "unlike", "better than"

**FR-7: Theme Identification**
Identify recurring topics:
- Self-worth / confidence
- Relationships / love
- Career / purpose
- Family dynamics
- Health / wellness
- Future / uncertainty
- Past / nostalgia

### 3.3 Graph Visualization

**FR-8: Graph Types**
User can switch between views:

**A. Relationship Network**
- Nodes: Entities (people, places, concepts)
- Edges: Relationships (knows, visited, dreams_of, compared_to)
- Size: Based on mention frequency
- Color: By entity type
- Layout: Force-directed (interactive)

**B. Emotion Map**
- Nodes: Topics/entities
- Color gradient: Emotion intensity (red=negative, green=positive)
- Connections: Emotional associations
- Timeline slider: See emotions change over time

**C. Theme Timeline**
- X-axis: Time
- Y-axis: Theme intensity/frequency
- Lines: Different themes
- Hover: Show specific entries
- Identify patterns (weekly cycles, triggers)

**D. Entity Detail View**
- Focus on one entity (person/place/topic)
- Show all mentions chronologically
- Emotion evolution graph
- Related entities (who else appears with them)
- Key quotes/excerpts

**FR-9: Interaction Features**
- **Zoom & Pan:** Mouse/touch gestures
- **Click Node:** Show details panel
- **Click Edge:** Show relationship context (quotes)
- **Filter:** By entity type, emotion, date range, theme
- **Search:** Find specific entities
- **Highlight:** Connected nodes when hovering
- **Export:** PNG, PDF, or JSON data

**FR-10: Insights Panel**
Automatically generated insights shown alongside graph:
- "Most mentioned: [Entity] (X times)"
- "Strongest emotion: [Emotion] toward [Entity]"
- "Recurring theme: [Theme] appears in X% of entries"
- "Pattern detected: [Theme] often co-occurs with [Theme]"
- "Emotional shift: Your feelings about [Entity] changed from [X] to [Y]"
- "Trigger identified: Mentions of [X] correlate with [Emotion]"

### 3.4 Data Storage

**FR-11: Graph Data Persistence**
- Store generated graphs in Supabase
- Cache last 5 generated graphs per user
- Metadata: generation_date, scope, entity_count, entry_count
- Regenerate option (fresh analysis with current AI model)
- Delete option (privacy)

**FR-12: Privacy & Security**
- All graph data encrypted at rest
- No sharing graphs externally (MVP)
- User can delete any graph
- User can exclude specific entries from analysis
- Clear indication of what data is being processed

---

## 4. Technical Requirements

### 4.1 Architecture

**TR-1: AI Integration**
- **Provider:** OpenAI GPT-4 or Anthropic Claude
- **Fallback:** Multiple provider support
- **Rate limiting:** Max 10 graph generations per day per user
- **Cost control:** Track tokens per request, alert at threshold
- **Error handling:** Graceful degradation if AI unavailable

**TR-2: Processing Pipeline**
```
User clicks "Generate Graph"
  ↓
1. Fetch diary entries (scope-based)
  ↓
2. Batch entries (max 20 at a time)
  ↓
3. Send to AI for extraction
  ↓
4. Parse AI response (entities, emotions, relationships)
  ↓
5. Build graph data structure
  ↓
6. Store in database
  ↓
7. Render visualization
```

**TR-3: Performance**
- Processing: <10 seconds for 50 entries
- Rendering: <2 seconds for 200 nodes
- Interaction: 60fps smooth animations
- Memory: <100MB graph data in memory

**TR-4: Database Schema**
```sql
-- Generated graphs
knowledge_graphs:
- id, user_id, title, scope, generated_at
- entry_count, entity_count, relationship_count
- graph_data (JSON), insights (JSON)
- metadata (JSON)

-- Extracted entities (for caching)
extracted_entities:
- id, user_id, entry_id, entity_name, entity_type
- attributes (JSON), confidence_score
- extracted_at

-- Relationships between entities
entity_relationships:
- id, graph_id, from_entity_id, to_entity_id
- relationship_type, strength (1-10)
- emotion_type, temporal_context
- evidence (array of entry excerpts)

-- Themes
extracted_themes:
- id, graph_id, theme_name, frequency
- intensity, related_entities (array)
- time_distribution (JSON)
```

**TR-5: Tech Stack**
- **Frontend:**
  - Graph: `react-force-graph` (web) or `react-native-svg` (native)
  - Alternative: `vis-network`, `cytoscape`
- **Backend:**
  - AI calls: OpenAI SDK / Anthropic SDK
  - Processing: Supabase Edge Functions (serverless)
- **Storage:** Supabase PostgreSQL + JSON fields

### 4.2 AI Prompt Engineering

**TR-6: Extraction Prompt Template**
```
System: You are a psychological insight analyst. Extract structured data 
from diary entries to help users understand their emotional patterns.

User: Analyze this diary entry and extract:
1. Entities (people, places, concepts, events)
2. Emotions (type, intensity, target, polarity)
3. Relationships (who/what connects to whom, type of connection)
4. Themes (recurring topics, concerns)
5. Temporal context (past/present/future references)

Entry: "[USER'S DIARY TEXT]"

Return ONLY valid JSON in this format:
{
  "entities": [...],
  "emotions": [...],
  "relationships": [...],
  "themes": [...],
  "temporal_context": {...}
}
```

---

## 5. UI/UX Requirements

### 5.1 Generate Button

**UX-1: Button Design**
```
┌─────────────────────────────────────┐
│                                     │
│  Chat Interface                     │
│                                     │
│  ┌──────────────────────────┐      │
│  │ [Type message...]         │      │
│  └──────────────────────────┘      │
│                                     │
│                        ┌──────┐    │
│                        │ 🕸️   │ ← Generate Graph FAB
│                        └──────┘    │
└─────────────────────────────────────┘
```

**States:**
- Default: Purple (#8b5cf6), graph icon, subtle shadow
- Hover: Scale 1.1, darker purple
- Disabled: Gray, "Not enough entries" tooltip
- Loading: Spinner replaces icon

**UX-2: Modal/Screen Flow**
```
Click Button
  ↓
Modal appears with:
- Title: "Generate Knowledge Graph"
- Scope selection (radio buttons)
- Entry count preview
- "Generate" button (primary)
- "Cancel" button (secondary)
  ↓
Processing screen:
- Progress bar
- Step indicators
- Cancel option
  ↓
Graph screen:
- Full screen visualization
- View type tabs at top
- Insights panel (collapsible)
- Export/Share buttons
- Close button
```

### 5.2 Graph Screen Layout

**Desktop:**
```
┌────────────────────────────────────────────────────┐
│ [← Back] Knowledge Graph    [Timeline|Network|Emotions] [Export] │
├────────────────────────────────────────────────────┤
│                                            ┌────────┐
│                                            │Insights│
│         Graph Visualization                │        │
│         (Interactive Canvas)               │• Most  │
│                                            │  mentioned│
│                                            │• Patterns│
│                                            │• Themes│
│                                            └────────┘
│                                                     │
│ [Filter: All | People | Places | Themes]           │
│ [Date Range: ───────●─────────]                    │
└────────────────────────────────────────────────────┘
```

**Mobile:**
```
┌─────────────────┐
│ [←] Graph  [⋮]  │
├─────────────────┤
│                 │
│   Interactive   │
│   Graph         │
│   (Zoomable)    │
│                 │
├─────────────────┤
│ 💡 Insights     │
│ [Tap to expand] │
└─────────────────┘
```

---

## 6. Non-Functional Requirements

### 6.1 Performance
- Graph generation: <10s for 50 entries, <30s for 200 entries
- Render time: <2s for graphs with <500 nodes
- Smooth 60fps interactions
- Background processing (don't block UI)

### 6.2 Scalability
- Support up to 1000 diary entries per user
- Handle graphs with 500+ nodes
- Efficient caching (don't re-analyze unchanged entries)

### 6.3 Privacy & Security
- All AI processing in secure environment
- No data sent to third parties except AI provider
- User consent required before first generation
- Option to exclude sensitive entries
- Compliance with GDPR, CCPA

### 6.4 Reliability
- 99.5% uptime
- Graceful error handling
- Auto-retry on transient failures
- Fallback to cached graphs if generation fails

### 6.5 Accessibility
- Screen reader compatible
- Keyboard navigation
- High contrast mode
- Text descriptions of visual relationships

---

## 7. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| AI costs too high | High | Medium | Rate limiting, caching, batch processing |
| Poor extraction accuracy | High | Medium | Prompt engineering, user feedback loop |
| Privacy concerns | Critical | Low | Clear consent, encryption, data deletion |
| Overwhelming visualization | Medium | High | Start with simple views, progressive disclosure |
| Slow generation time | Medium | Medium | Background processing, progress indication |
| Graph too complex (1000+ nodes) | Medium | Low | Clustering, filtering, zoom levels |

---

## 8. Development Phases

### Phase 1: Foundation (Week 1)
- [ ] AI integration setup
- [ ] Test AI extraction with sample entries
- [ ] Database schema creation
- [ ] Basic button placement

### Phase 2: Core Extraction (Week 2)
- [ ] Implement extraction pipeline
- [ ] Entity detection
- [ ] Emotion classification
- [ ] Relationship mapping
- [ ] Testing & prompt refinement

### Phase 3: Visualization (Week 3)
- [ ] Graph data structure builder
- [ ] Basic network visualization
- [ ] Node/edge interactions
- [ ] Filter & search

### Phase 4: Insights & Polish (Week 4)
- [ ] Insights generation
- [ ] Alternative views (timeline, emotion map)
- [ ] Export functionality
- [ ] Mobile optimization
- [ ] User testing & iteration

---

## 9. Success Criteria

**MVP Launch Criteria:**
- [ ] Button accessible and works
- [ ] Graph generates in <15 seconds
- [ ] At least 3 entity types extracted correctly
- [ ] Basic emotion detection working
- [ ] Relationship network view functional
- [ ] 3+ automatic insights generated
- [ ] Mobile responsive
- [ ] Privacy controls in place

**Post-Launch Metrics (30 days):**
- [ ] 20%+ feature adoption rate
- [ ] 4.0+ user satisfaction rating
- [ ] <5% error rate in generation
- [ ] AI costs <$0.10 per graph
- [ ] 0 privacy incidents

---

## 10. Future Enhancements (Post-MVP)

### V2 Features:
- Share graphs (with privacy controls)
- Compare graphs over time (monthly snapshots)
- AI-powered recommendations ("You might want to journal about X")
- Voice notes → graph integration
- Collaborative graphs (therapist view with permission)

### Advanced Analytics:
- Predictive insights (mood forecasting)
- Trigger warnings (pattern alerts)
- Growth tracking (emotional progress over months)
- Goal integration (track relationship with goals)

---

## 11. Appendix

### A. Example Entry → Graph Transformation

**Input:**
```
"im having dreams of my ex and i wonder if i would ever 
had a beautiful gf like her and if im actually made for 
having a gf"
```

**Extracted Data:**
```json
{
  "entities": [
    {"name": "You", "type": "self"},
    {"name": "Ex-girlfriend", "type": "person", "attributes": ["beautiful", "past"]},
    {"name": "Future girlfriend", "type": "concept"}
  ],
  "emotions": [
    {"type": "longing", "intensity": 7, "target": "Ex-girlfriend"},
    {"type": "self-doubt", "intensity": 8, "target": "self"},
    {"type": "uncertainty", "intensity": 6, "target": "future relationships"}
  ],
  "relationships": [
    {"from": "You", "to": "Ex-girlfriend", "type": "dreams_about"},
    {"from": "You", "to": "Future girlfriend", "type": "wonders_about"},
    {"from": "Ex-girlfriend", "to": "Future girlfriend", "type": "compared_to"}
  ],
  "themes": ["self-worth", "relationships", "comparison", "nostalgia"]
}
```

**Visual Graph:**
```
         YOU
        /  |  \
    dreams wondering self-doubt
      /    |       \
    Ex  Future-GF  Self-Worth
      \    /
     compared
```

---

**Document Status:** Ready for Review  
**Next Steps:** 
1. Stakeholder approval
2. AI connection testing
3. Technical spike (graph libraries)
4. Development kickoff

