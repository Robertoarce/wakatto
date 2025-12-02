# Conversation Flow Documentation

## Overview

Wakatto uses a sophisticated multi-layer conversation system that enables dynamic AI character interactions with users. The system supports both single-character and multi-character conversations with intelligent response generation, character awareness, and database persistence.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                           │
│                      (ChatInterface.tsx)                         │
│                                                                   │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ Character  │  │   Message    │  │   Voice Input        │   │
│  │ Selector   │  │   Display    │  │   (Speech-to-Text)   │   │
│  └────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                     NAVIGATION LAYER                             │
│                      (MainTabs.tsx)                              │
│                                                                   │
│  - Message routing                                               │
│  - Conversation management                                       │
│  - Redux state coordination                                      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                   REDUX STATE MANAGEMENT                         │
│                  (conversationActions.ts)                        │
│                                                                   │
│  - Load conversations                                            │
│  - Create/Select conversation                                    │
│  - Save/Update/Delete messages                                   │
│  - Entity extraction                                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                   AI GENERATION LAYER                            │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │    Multi-Character Conversation Service                   │  │
│  │    (multiCharacterConversation.ts)                        │  │
│  │                                                            │  │
│  │  - Character selection logic                              │  │
│  │  - Interruption & reaction system                         │  │
│  │  - Cross-character awareness                              │  │
│  │  - Response timing & staggering                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            AI Service (aiService.ts)                      │  │
│  │                                                            │  │
│  │  - Provider routing (OpenAI/Claude/Gemini)               │  │
│  │  - Secure API key management                              │  │
│  │  - Supabase Edge Function proxy                           │  │
│  │  - Character-specific parameters                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                      PERSISTENCE LAYER                           │
│                    (Supabase Database)                           │
│                                                                   │
│  - conversations table                                           │
│  - messages table                                                │
│  - custom_wakattors table                                        │
│  - entities table (knowledge graph)                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Message Flow Sequence

### 1. User Sends Message

**Entry Point:** `ChatInterface.tsx:356-360`

```typescript
const handleSendMessagePress = () => {
  if (input.trim()) {
    onSendMessage(input, selectedCharacters);
    setInput('');
  }
};
```

**What happens:**
- User types message in text input
- Clicks send button or presses Ctrl+Enter
- Message content and selected character IDs are passed up

---

### 2. Message Routing

**Handler:** `MainTabs.tsx:114-200`

```typescript
const handleSendMessage = async (content: string, selectedCharacters: string[])
```

**Steps:**
1. **Validation:** Check if at least one character is selected
2. **Conversation Setup:**
   - If no current conversation exists, create one
   - Get conversation ID
3. **Save User Message:**
   - Dispatch `saveMessage()` action with user content
   - Store in database with `role: 'user'`
4. **Prepare History:**
   - Convert messages to `ConversationMessage[]` format
   - Include timestamps and character IDs
5. **AI Generation:**
   - Route to multi-character OR single-character mode
6. **Save AI Response(s):**
   - Store each character's response with their ID
   - Update conversation timestamp

---

### 3. Database Persistence

**Redux Action:** `conversationActions.ts:142-189`

```typescript
export const saveMessage = (conversationId, role, content, characterId)
```

**Database Schema:**

```sql
messages {
  id: uuid (primary key)
  conversation_id: uuid (foreign key)
  role: text ('user' | 'assistant')
  content: text
  character_id: text (nullable)
  created_at: timestamp
}
```

**Side Effects:**
- Updates conversation's `updated_at` timestamp
- Triggers entity extraction for user messages (async)
- Dispatches `ADD_MESSAGE` to Redux store

---

### 4. AI Response Generation

The system branches based on number of selected characters:

#### 4A. Single Character Mode

**Service:** `multiCharacterConversation.ts:269-292`

```typescript
generateSingleCharacterResponse(userMessage, characterId, messageHistory)
```

**Process:**
1. Get character configuration
2. Build system prompt from character's therapeutic style
3. Convert message history to AI format
4. Call `generateAIResponse()` with character-specific parameters
5. Return single response string

#### 4B. Multi-Character Mode

**Service:** `multiCharacterConversation.ts:182-264`

```typescript
generateMultiCharacterResponses(userMessage, selectedCharacters, messageHistory)
```

**Process:**

1. **Character Selection:**
   - `determineRespondingCharacters()` uses probability algorithms
   - Prevents same character responding twice in a row
   - Interruption chance: 30% (configurable)
   - Reaction chance: 40% (configurable)
   - Ensures at least 1, max 3 characters respond

2. **Context Building:**
   - Each character gets awareness of other participants
   - Recent conversation history included
   - Cross-character interaction guidelines
   - Maintains unique therapeutic perspective

3. **Response Generation:**
   - Sequential generation with staggered delays (300-1500ms)
   - Each character sees previous responses in loop
   - Character-specific LLM parameters applied
   - Responses marked as interruptions/reactions

4. **Return Format:**
   ```typescript
   {
     characterId: string,
     content: string,
     isInterruption: boolean,
     isReaction: boolean
   }[]
   ```

---

### 5. AI Provider Integration

**Service:** `aiService.ts:122-185`

```typescript
generateAIResponse(messages, systemPrompt, characterId, parameterOverrides)
```

**Architecture:**

```
┌─────────────────────────────────────────────────┐
│          Wakatto Client                         │
│          (Browser)                              │
└─────────────────────────────────────────────────┘
                    ↓ HTTPS + Auth Token
┌─────────────────────────────────────────────────┐
│      Supabase Edge Function                     │
│        (ai-chat)                                │
│                                                  │
│  - User authentication                          │
│  - Rate limiting (ready)                        │
│  - API key storage (server-side)                │
│  - Provider routing                             │
└─────────────────────────────────────────────────┘
                    ↓ Provider-specific API
┌──────────────┬──────────────┬──────────────────┐
│   OpenAI     │  Anthropic   │   Google         │
│   GPT-4      │  Claude      │   Gemini         │
└──────────────┴──────────────┴──────────────────┘
```

**Security Features:**
- API keys stored server-side in Supabase secrets
- Client uses Supabase auth token only
- CORS issues eliminated
- Ready for rate limiting per user

**Provider Support:**
- **OpenAI:** GPT-4, GPT-3.5-turbo
- **Anthropic:** Claude 3 Haiku, Sonnet, Opus
- **Google:** Gemini 1.5 Flash, Pro
- **Mock:** Development/testing mode

**Character-Specific Parameters:**
Each character can have unique:
- `temperature`: Randomness (0.0-1.0)
- `max_tokens`: Response length
- `top_p`: Nucleus sampling
- `frequency_penalty`: Repetition control

---

### 6. Response Display

**Component:** `ChatInterface.tsx:710-773`

**Message Rendering:**
- User messages: Centered, purple background
- Assistant messages: Alternating left/right positioning
- Character name labels with fade animation
- Timestamp formatting (relative time)
- Message editing/deletion support

**Features:**
- Long-press for edit/delete (user messages only)
- Inline editing with save/cancel
- Character color-coded borders
- Loading indicator during AI generation
- Auto-scroll to latest message

---

## Multi-Character Intelligence

### Character Selection Algorithm

**Location:** `multiCharacterConversation.ts:30-98`

**Decision Tree:**

```
Is this the first message in conversation?
├─ YES → Pick 1 random character
└─ NO  → For each selected character:
          │
          ├─ Did this character just speak?
          │  ├─ YES → 20% chance to continue (dominate conversation)
          │  └─ NO  → Continue to next check
          │
          ├─ Has conversation reached interruption threshold?
          │  ├─ YES → 30% chance to interrupt
          │  └─ NO  → Continue to next check
          │
          └─ Random reaction check
             └─ 40% chance to react

          If no characters selected:
          └─ Pick character who hasn't spoken in last 3 messages
             (or random if all recently spoke)
```

**Configuration:** `llmConfig.ts`

```typescript
MULTI_CHARACTER_CONFIG = {
  enabled: true,
  maxCharacters: 10,
  minMessagesBeforeInterrupt: 2,
  interruptionChance: 0.3,
  reactionChance: 0.4,
  enableCrossCharacterAwareness: true
}
```

---

### Cross-Character Awareness

**Feature:** Characters can reference and interact with each other

**Context Template:** `multiCharacterConversation.ts:125-155`

Each character receives:
1. **Other Participants:** Names and descriptions
2. **Interaction Guidelines:**
   - Build on others' points
   - Offer contrasting views
   - Ask other characters questions
   - Express agreement/disagreement
3. **Recent Conversation:** Last 5 messages with speaker labels
4. **Response Brevity:** Default 2-4 sentences

**Example Interactions:**
```
User: "I'm feeling overwhelmed at work"

Freud: "Your feelings of overwhelm may stem from unconscious
       conflicts between your desires and your sense of duty."

Jung: "Building on what Freud said, this overwhelm might also
      reflect a call from your Self to integrate neglected aspects
      of your psyche."

Adler: "I see it differently - perhaps you're struggling with
       feelings of inferiority or lack of belonging in your
       workplace community?"
```

---

## Response Timing

**Configuration:** `llmConfig.ts`

```typescript
RESPONSE_TIMING = {
  minDelayMs: 300,   // Minimum delay between characters
  maxDelayMs: 1500,  // Maximum delay between characters
  thinkingDelayMs: 500
}
```

**Purpose:**
- Creates natural conversation flow
- Prevents overwhelming user with simultaneous responses
- Simulates characters "thinking" and "listening"
- Each character gets updated context from previous speakers

---

## Character Configuration

**Location:** `characters.ts`

**Character Structure:**

```typescript
interface CharacterBehavior {
  id: string
  name: string
  description: string
  color: string
  bodyColor: string
  accessoryColor?: string
  promptStyleId: string
  position: { x: number, y: number, z: number }
  traits: {
    empathy: number         // 0-100
    directness: number      // 0-100
    formality: number       // 0-100
    humor: number           // 0-100
  }
}
```

**Built-in Characters:**
- **Freud:** Psychoanalytic approach, explores unconscious
- **Jung:** Analytical psychology, archetypes and individuation
- **Adler:** Individual psychology, social interest and belonging

**Custom Characters:**
- Users can create unlimited custom "Wakattors"
- Stored in `custom_wakattors` Supabase table
- Fully configurable traits and prompts
- Integrated seamlessly with built-in characters

---

## Prompt System Integration

**Prompt Styles:** 11 therapeutic approaches in `src/prompts/`

```typescript
PROMPT_STYLES = [
  'compassionate',      // Warm, empathetic support
  'psychoanalytic',     // Freudian unconscious exploration
  'jungian',            // Archetypes and individuation
  'adlerian',           // Social interest and belonging
  'cognitive',          // CBT thought examination
  'mindfulness',        // Present-focused awareness
  'socratic',           // Philosophical questioning
  'creative',           // Literary and expressive
  'existential',        // Meaning and purpose
  'positive',           // Strengths-based
  'narrative'           // Story re-authoring
]
```

**Character-Prompt Binding:**
- Each character has `promptStyleId` property
- `getCharacterPrompt()` retrieves the full system prompt
- Prompts define therapeutic style, tone, and approach
- Multi-character context appended dynamically

---

## Entity Extraction (Knowledge Graph)

**Trigger:** User messages only (async, non-blocking)

**Process:** `entityExtraction.ts`

```typescript
processMessageEntities(userId, messageId, content, conversationId)
```

**Extracted Entities:**
- **People:** Friends, family, colleagues mentioned
- **Places:** Locations discussed
- **Topics:** Themes, subjects, interests
- **Emotions:** Feelings expressed

**Storage:**
```sql
entities {
  id: uuid
  user_id: uuid
  entity_type: text
  entity_value: text
  source_message_id: uuid
  conversation_id: uuid
  created_at: timestamp
}
```

**Future Use:**
- Knowledge graph visualization
- Personalized insights
- Long-term memory for characters
- Pattern detection across conversations

---

## Voice Input Integration

**Features:** `ChatInterface.tsx:406-484`

**Two-Tier System:**

1. **Live Transcription (Web Speech API):**
   - Real-time display while speaking
   - Browser-native, instant results
   - Supported: Chrome, Edge, Safari, Brave

2. **Fallback (OpenAI Whisper API):**
   - Triggered when live speech unavailable or fails
   - Higher accuracy
   - Supports all browsers
   - Audio recorded and uploaded

**User Experience:**
- Red recording indicator with timer
- Live transcript preview
- Cancel recording option
- Automatic transcription on stop
- Text appended to input field (doesn't auto-send)

---

## Conversation Management

### Sidebar Features (`ChatSidebar.tsx`)

- **New Conversation:** Create blank conversation
- **Select Conversation:** Load messages from database
- **Rename:** Update conversation title
- **Delete:** Remove with CASCADE to messages
- **Character Count Badge:** Shows # of unique characters in conversation

### Conversation Persistence

**Auto-save:** Every message automatically saved
**Restoration:** Characters extracted from message history
**Timestamping:** Relative time display (e.g., "2m ago", "Yesterday")
**Character Memory:** Selected characters restored when reopening conversation

---

## Error Handling

### User-Facing Errors

1. **No Characters Selected:**
   ```
   "Please select at least one Wakattor before sending a message."
   ```

2. **API Errors:**
   - Fallback message saved to conversation
   - User notified without losing message
   - Conversation continuity maintained

3. **Editing During AI Response:**
   ```
   "Please wait for the AI to finish responding before editing."
   ```

4. **Voice Input Not Supported:**
   ```
   "Voice recording is not supported in [Browser].
    Please use Chrome, Edge, Brave, Firefox, or Safari."
   ```

### Backend Error Handling

- **Try-catch** around all async operations
- **Fallback responses** on AI failure
- **Entity extraction** errors logged but don't block
- **Database errors** surfaced with user-friendly messages

---

## Performance Optimizations

### Message Loading
- Order by `created_at ASC` for chronological display
- Pagination ready (currently loads all)
- Redux caching prevents redundant fetches

### Character Selection
- Prevents duplicate selections with defensive checks
- Maximum 10 characters enforced
- Efficient Set operations for uniqueness

### AI Response Generation
- Staggered delays prevent server overload
- Character parameters cached in config
- Edge Function reduces client-side computation

### UI Rendering
- Auto-scroll only on new messages
- Conditional re-renders with React.memo potential
- Character names fade after 5 seconds to reduce clutter

---

## Configuration Files

### `llmConfig.ts`
- Multi-character behavior settings
- Response timing parameters
- Provider-specific model configs
- Character-specific overrides

### `characters.ts`
- Built-in character definitions
- Default traits and colors
- Position coordinates for 3D display
- Prompt style mappings

### Supabase Schema
```sql
-- Core conversation storage
conversations (id, user_id, title, created_at, updated_at)
messages (id, conversation_id, role, content, character_id, created_at)

-- Custom characters
custom_wakattors (id, user_id, name, description, color, traits, prompt_id)

-- Knowledge graph
entities (id, user_id, entity_type, entity_value, source_message_id)

-- Chat menu (UI state)
chat_menu_characters (user_id, character_ids)
```

---

## Future Enhancements

### Planned Features
1. **Streaming Responses:** Real-time token streaming from AI
2. **Character Animations:** 3D characters animate while speaking
3. **Voice Output:** Text-to-Speech for character responses
4. **Knowledge Graph UI:** Visualize extracted entities
5. **Long-term Memory:** Characters remember past conversations
6. **Conversation Branching:** Fork conversation at any message
7. **Multi-modal Input:** Image analysis, file attachments

### Scalability Considerations
- **Rate Limiting:** Implement in Edge Function per user
- **Message Pagination:** Load conversations in chunks
- **Caching Layer:** Redis for frequently accessed data
- **WebSocket:** Real-time updates for multi-device sync

---

## Testing

### E2E Test Coverage
- **Playwright:** Browser automation tests
- **AI Connection:** Edge Function integration tests
- **Character Display:** 3D rendering validation
- **Deployment:** Post-deploy verification

### Manual Testing Checklist
- [ ] Single character conversation
- [ ] Multi-character conversation (2-10)
- [ ] Character interruptions and reactions
- [ ] Voice input (live + Whisper fallback)
- [ ] Message editing and deletion
- [ ] Conversation management (CRUD)
- [ ] Custom character creation
- [ ] Cross-browser compatibility

---

## Security Considerations

### API Key Management
- ✅ Stored server-side in Supabase secrets
- ✅ Never exposed to client
- ✅ Secure sessionStorage for client preferences (obfuscated)
- ✅ User authentication required for Edge Function

### Data Privacy
- User conversations encrypted in transit (HTTPS)
- Row-level security on Supabase tables
- Entity extraction opt-in (ready for future)
- No conversation data shared between users

### Input Validation
- Message content sanitized before database insert
- Character IDs validated against available characters
- Conversation ownership verified before operations
- SQL injection prevented by Supabase parameterized queries

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/components/ChatInterface.tsx` | Main chat UI, message display, voice input |
| `src/navigation/MainTabs.tsx` | Message routing, conversation orchestration |
| `src/store/actions/conversationActions.ts` | Redux actions, database operations |
| `src/services/aiService.ts` | AI provider integration, Edge Function calls |
| `src/services/multiCharacterConversation.ts` | Multi-character logic, response generation |
| `src/config/characters.ts` | Character definitions and configurations |
| `src/config/llmConfig.ts` | LLM parameters, multi-char settings |
| `src/prompts/index.ts` | Therapeutic prompt styles |
| `supabase/functions/ai-chat/index.ts` | Edge Function for AI API proxy |

---

## Support and Documentation

For questions about:
- **Architecture:** See this document
- **Prompts:** See `docs/PROMPTS_README.md`
- **Configuration:** See `docs/CONFIGURATION_GUIDE.md`
- **Deployment:** See `docs/EDGE_FUNCTION_DEPLOY.md`
- **UI Components:** See `docs/UI_COMPONENTS_README.md`

---

*Last Updated: 2025-11-29*
*Version: 1.0*
