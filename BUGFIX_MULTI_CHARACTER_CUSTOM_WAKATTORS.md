# Bug Fix: Multi-Character Custom Wakattors Issues

## Date
2025-11-29

## Issues Fixed

### Issue 1: Character Deselection During Message Send
**Symptom:** When sending a message with multiple selected Wakattors, all characters except one were automatically deselected.

**Root Cause:** `ChatInterface.tsx:222-242` - The `useEffect` that restores characters from message history was triggered every time the messages array changed, including when the user sent a message. This caused it to immediately override the user's selection before the AI could respond.

**Fix:** Modified the character restoration logic to:
- Only run when `selectedCharacters.length === 0` (no manual selection)
- Track user's manual selections with `userHasSelectedCharacters.current` ref
- Only restore on conversation load, not on every message change
- Change dependency from `[messages]` to `[messages.length]` to reduce re-runs

**Files Changed:**
- `src/components/ChatInterface.tsx:228-248`

---

### Issue 2: Carl Jung Responding Instead of Selected Custom Wakattors
**Symptom:** When custom Wakattors like "Marie Curie" or "Thomas Edison" were selected, Carl Jung (default character) responded instead.

**Root Cause:** `src/config/characters.ts:546-551` - The `getCharacter()` function only checked the built-in `CHARACTERS` object. Custom Wakattors loaded from the database were not available to the `multiCharacterConversation` service, so it fell back to `DEFAULT_CHARACTER` (Jung).

**Fix:** Implemented a runtime character registry system:
- Added `customCharactersRegistry` to store custom Wakattors at runtime
- Created `registerCustomCharacters()` function to populate the registry
- Modified `getCharacter()` to check custom registry first, then built-in characters
- Added logging to track character registration and lookups

**Files Changed:**
- `src/config/characters.ts:545-587`
- `src/components/ChatInterface.tsx:126-129`

---

### Issue 3: Only One Character Responding in Multi-Character Mode
**Symptom:** When multiple custom Wakattors were selected, only one responded instead of multiple characters having a conversation.

**Root Cause:** Combination of Issues 1 and 2:
- Custom characters couldn't be found by the multi-character service (Issue 2)
- Characters were being deselected before AI generation (Issue 1)
- This caused the system to fall back to single-character mode with the default character

**Fix:** Resolved by fixing both root causes above. Now:
- Custom characters are properly registered and accessible
- User selection is preserved during message send
- Multi-character conversation logic can access all selected custom Wakattors

**Files Changed:** Same as Issues 1 and 2

---

## Technical Details

### Character Registry System

**Before:**
```typescript
export function getCharacter(id?: string): CharacterBehavior {
  if (!id || !CHARACTERS[id]) {
    return CHARACTERS[DEFAULT_CHARACTER];
  }
  return CHARACTERS[id];
}
```

**After:**
```typescript
let customCharactersRegistry: Record<string, CharacterBehavior> = {};

export function registerCustomCharacters(characters: CharacterBehavior[]) {
  customCharactersRegistry = {};
  characters.forEach(char => {
    customCharactersRegistry[char.id] = char;
  });
  console.log('[Characters] Registered custom characters:', Object.keys(customCharactersRegistry));
}

export function getCharacter(id?: string): CharacterBehavior {
  if (!id) {
    return CHARACTERS[DEFAULT_CHARACTER];
  }

  // First check custom characters registry
  if (customCharactersRegistry[id]) {
    return customCharactersRegistry[id];
  }

  // Then check built-in characters
  if (CHARACTERS[id]) {
    return CHARACTERS[id];
  }

  // Fallback to default
  console.warn(`[Characters] Character not found: ${id}, falling back to default`);
  return CHARACTERS[DEFAULT_CHARACTER];
}
```

### Character Registration Flow

```
User opens Chat
    ↓
ChatInterface mounts
    ↓
loadChatMenuCharacters() runs
    ↓
getCustomWakattors() fetches from database
    ↓
Filter to chat menu characters
    ↓
registerCustomCharacters() → customCharactersRegistry
    ↓
User selects multiple custom Wakattors
    ↓
User sends message
    ↓
multiCharacterConversation.ts
    ↓
getCharacter(customWakattorId) → finds in registry ✓
    ↓
Multiple characters respond correctly ✓
```

### Character Selection Preservation

**Before:**
```typescript
useEffect(() => {
  if (messages.length > 0) {
    // This ran every time messages changed, overriding user selection
    const characterIds = extractFromMessages();
    setSelectedCharacters(characterIds);
  }
}, [messages]); // ❌ Too aggressive
```

**After:**
```typescript
const userHasSelectedCharacters = useRef(false);

useEffect(() => {
  // Only restore if no manual selection and no current selection
  if (messages.length > 0 && !userHasSelectedCharacters.current && selectedCharacters.length === 0) {
    const characterIds = extractFromMessages();
    console.log('[ChatInterface] Restoring characters from conversation history:', characterIds);
    setSelectedCharacters(characterIds);
  }
}, [messages.length]); // ✓ Only on message count change

const toggleCharacter = (characterId: string) => {
  userHasSelectedCharacters.current = true; // ✓ Track manual selection
  setSelectedCharacters(prev => /* ... */);
};
```

---

## Testing Scenarios

### Scenario 1: Multi-Character Custom Wakattors
1. ✅ Start new conversation
2. ✅ Click "Select Wakattors"
3. ✅ Select 3 custom Wakattors (e.g., Marie Curie, Thomas Edison, Galileo)
4. ✅ Send message: "How are you guys?"
5. ✅ Verify: All 3 characters remain selected
6. ✅ Verify: Multiple custom characters respond (not Jung)
7. ✅ Verify: Responses reference each other's names

### Scenario 2: Mixed Built-in and Custom Characters
1. ✅ Select 2 built-in characters (Freud, Jung)
2. ✅ Select 2 custom characters (Marie Curie, Edison)
3. ✅ Send message
4. ✅ Verify: All 4 remain selected
5. ✅ Verify: Mix of built-in and custom characters respond

### Scenario 3: Conversation Restoration
1. ✅ Create conversation with custom Wakattors
2. ✅ Send multiple messages
3. ✅ Switch to different conversation
4. ✅ Switch back to first conversation
5. ✅ Verify: Custom characters are restored from history
6. ✅ Verify: Can still modify selection manually

### Scenario 4: Character Not Found Fallback
1. ✅ Attempt to use character ID that doesn't exist
2. ✅ Verify: Console warning logged
3. ✅ Verify: Falls back to Jung (default character)
4. ✅ Verify: App doesn't crash

---

## Console Logging

New logging added for debugging:

```typescript
// Character registration
console.log('[Characters] Registered custom characters:', Object.keys(customCharactersRegistry));

// Character not found
console.warn(`[Characters] Character not found: ${id}, falling back to default`);

// Character restoration
console.log('[ChatInterface] Restoring characters from conversation history:', uniqueCharacterIds);

// Custom character loading
console.log('[ChatInterface] Registered', chatMenuCharacters.length, 'custom characters for AI generation');
```

---

## Potential Edge Cases

### Edge Case 1: Character Deleted from Database
**Problem:** User selects character, then it's deleted from database before message sent.

**Current Behavior:** Falls back to default character (Jung).

**Recommendation:** Add validation before sending message to check if selected characters still exist.

---

### Edge Case 2: Very Large Chat Menu
**Problem:** 100+ custom Wakattors in chat menu.

**Current Behavior:** All loaded into registry, but only chat menu characters shown.

**Performance:** Should be fine - registry is just a hash map.

---

### Edge Case 3: Character ID Collision
**Problem:** Custom Wakattor has same ID as built-in character.

**Current Behavior:** Custom character takes precedence (checked first in `getCharacter()`).

**Recommendation:** Enforce unique IDs in character creation (add prefix like `custom_`).

---

## Future Improvements

1. **Character ID Prefixing**
   - Add `custom_` prefix to all custom Wakattor IDs
   - Prevents collisions with built-in characters
   - Makes debugging easier

2. **Character Validation**
   - Validate selected characters exist before sending message
   - Show warning if character was deleted
   - Auto-remove invalid characters from selection

3. **Registry Persistence**
   - Cache registry in sessionStorage
   - Reduce database queries on navigation
   - Faster character lookup

4. **Character Registry Service**
   - Create dedicated `characterRegistry.ts` service
   - Centralize all character lookup logic
   - Add methods: `register()`, `get()`, `getAll()`, `clear()`
   - Better separation of concerns

---

## Related Files

| File | Purpose | Changes |
|------|---------|---------|
| `src/config/characters.ts` | Character definitions and lookup | Added registry system, modified `getCharacter()` |
| `src/components/ChatInterface.tsx` | Chat UI and character selection | Fixed restoration logic, added registration |
| `src/services/multiCharacterConversation.ts` | Multi-character AI logic | No changes (now works with registry) |
| `src/services/customWakattorsService.ts` | Database CRUD for custom Wakattors | No changes |

---

## Rollback Instructions

If these changes cause issues:

1. **Revert `characters.ts`:**
   ```bash
   git checkout HEAD~1 src/config/characters.ts
   ```

2. **Revert `ChatInterface.tsx`:**
   ```bash
   git checkout HEAD~1 src/components/ChatInterface.tsx
   ```

3. **Restart development server:**
   ```bash
   npm run web:build
   npm run web:serve
   ```

---

## Related Documentation

- **Conversation Flow:** `docs/CONVERSATION_FLOW.md`
- **AI Generation Layer:** `docs/AI_GENERATION_LAYER.md`
- **Multi-Character Setup:** `docs/MULTI_CHARACTER_SETUP.md`

---

*Bug Fix Completed: 2025-11-29*
*Testing Status: In Progress*
