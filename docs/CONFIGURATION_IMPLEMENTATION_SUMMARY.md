# Configuration System Implementation Summary

## What's Been Implemented

I've created a complete configuration system that gives you centralized control over:

### ✅ 1. **LLM Parameters** (`src/config/llmConfig.ts`)

You can now configure AI behavior in one place:

```typescript
// Control temperature, max tokens, top_p, etc.
export const LLM_CONFIG = {
  anthropic: {
    defaultModel: 'claude-3-5-sonnet-20241022',
    parameters: {
      temperature: 0.8,   // Change this to make responses more/less creative
      maxTokens: 2000,    // Change this to make responses longer/shorter
      topP: 0.95,
      topK: 40,
    }
  }
}
```

**Per-character overrides** are also supported:

```typescript
export const CHARACTER_PARAMETER_OVERRIDES = {
  freud: { temperature: 0.85, maxTokens: 1800 },
  jung: { temperature: 0.95, maxTokens: 2000 },
  nietzsche: { temperature: 1.0, maxTokens: 1800 },
  // Add any character here to customize their parameters
}
```

### ✅ 2. **Centralized Prompt Configuration**

**Location 1**: `src/config/characters.ts` - Character-specific prompts

```typescript
freud: {
  systemPrompt: `You are Sigmund Freud...` // Edit directly here
}
```

**Location 2**: `src/prompts/` - Reusable therapeutic style prompts

```
src/prompts/
├── psychoanalytic.ts
├── jungian.ts
├── cognitive.ts
└── ... (11 total styles)
```

### ✅ 3. **Multi-Character Conversations**

Characters can now:
- **Interrupt each other** (configurable probability)
- **React to each other's messages** (configurable probability)
- **Reference each other by name** ("As Jung said...")
- **Build on or disagree with each other's points**
- **Have awareness of who else is in the conversation**

Configuration in `src/config/llmConfig.ts`:

```typescript
export const MULTI_CHARACTER_CONFIG = {
  enabled: true,                        // Toggle on/off
  maxCharacters: 5,                     // Max characters in one chat
  interruptionChance: 0.3,              // 30% chance to interrupt
  reactionChance: 0.5,                  // 50% chance to react
  minMessagesBeforeInterrupt: 2,        // Wait before interrupting
  enableCrossCharacterAwareness: true,  // Characters know each other
}
```

### ✅ 4. **Response Timing** (for multi-character mode)

```typescript
export const RESPONSE_TIMING = {
  minDelayMs: 500,                    // 0.5s minimum delay
  maxDelayMs: 2000,                   // 2s maximum delay
  typingIndicatorEnabled: true,
}
```

---

## Files Created/Modified

### **New Files**:

1. **`src/config/llmConfig.ts`** - Centralized LLM and multi-character configuration
2. **`src/services/multiCharacterConversation.ts`** - Multi-character conversation logic
3. **`CONFIGURATION_GUIDE.md`** - Comprehensive user guide (read this!)
4. **`CONFIGURATION_IMPLEMENTATION_SUMMARY.md`** - This file

### **Modified Files**:

1. **`src/services/aiService.ts`** - Now uses config parameters, supports character-specific overrides
2. **`supabase/functions/ai-chat/index.ts`** - Edge function now accepts parameters
3. **`src/navigation/MainTabs.tsx`** - Uses new multi-character conversation service

---

## How to Use

### Configure LLM Parameters

Edit `src/config/llmConfig.ts`:

```typescript
// Make all responses more creative:
temperature: 1.2  // (was 0.8)

// Make responses longer:
maxTokens: 3000  // (was 2000)

// Make Nietzsche extra creative:
CHARACTER_PARAMETER_OVERRIDES: {
  nietzsche: { temperature: 1.5 }
}
```

### Configure Prompts

**Option 1**: Edit character prompts directly in `src/config/characters.ts`:

```typescript
freud: {
  systemPrompt: `You are Sigmund Freud.
  [Your custom prompt here...]`
}
```

**Option 2**: Create a new therapeutic style in `src/prompts/`:

1. Create `src/prompts/myStyle.ts`
2. Export it from `src/prompts/index.ts`
3. Use it in a character: `promptStyle: 'myStyle'`

### Enable/Disable Multi-Character Mode

In `src/config/llmConfig.ts`:

```typescript
export const MULTI_CHARACTER_CONFIG = {
  enabled: false,  // Turn off multi-character mode
}
```

### Make Characters Interrupt More/Less

In `src/config/llmConfig.ts`:

```typescript
export const MULTI_CHARACTER_CONFIG = {
  interruptionChance: 0.6,  // More interruptions (was 0.3)
  reactionChance: 0.8,      // More reactions (was 0.5)
}
```

---

## Testing Your Changes

1. **Edit the configuration files** (no code changes needed!)
2. **Restart the app** (hot reload may not pick up config changes)
3. **Start a conversation** with multiple characters
4. **Observe the behavior** (check console logs for debugging)

### What to Watch For:

- **Temperature changes**: Responses should be more/less creative
- **Max tokens changes**: Responses should be longer/shorter
- **Multi-character mode**: Characters should interrupt and react to each other
- **Character awareness**: Characters should reference each other by name

---

## Deployment Notes

### If Using Edge Function (Production):

You need to redeploy the Edge Function since we updated it:

```bash
# Deploy the updated edge function
supabase functions deploy ai-chat
```

### Environment Variables:

The Edge Function needs these secrets (should already be configured):

```bash
CLAUDE_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...  # (if using OpenAI)
```

---

## Example: Multi-Character Conversation

With the new system, here's what happens when you chat with multiple characters:

1. **User**: "I'm feeling lost in my career"

2. **System determines responders** (based on probability):
   - First message: Random character (e.g., Jung)

3. **Jung responds** (first responder, not an interruption)

4. **System checks interruption probability** (30%):
   - Adler interrupts!

5. **Adler responds** (marked as interruption, references Jung's point)

6. **System checks reaction probability** (50%):
   - Freud reacts!

7. **Freud responds** (marked as reaction, builds on both previous messages)

**Result**: You get 3 thoughtful responses that build on each other, creating a rich, multi-perspective conversation!

---

## Quick Reference

| Want to... | Edit this file | Section |
|-----------|---------------|---------|
| Change creativity/randomness | `src/config/llmConfig.ts` | `LLM_CONFIG.anthropic.parameters.temperature` |
| Change response length | `src/config/llmConfig.ts` | `LLM_CONFIG.anthropic.parameters.maxTokens` |
| Customize a character's prompt | `src/config/characters.ts` | `CHARACTERS.freud.systemPrompt` |
| Create a new prompt style | `src/prompts/myStyle.ts` | Create new file, export from `index.ts` |
| Enable/disable multi-character | `src/config/llmConfig.ts` | `MULTI_CHARACTER_CONFIG.enabled` |
| Change interruption frequency | `src/config/llmConfig.ts` | `MULTI_CHARACTER_CONFIG.interruptionChance` |
| Make a character more creative | `src/config/llmConfig.ts` | `CHARACTER_PARAMETER_OVERRIDES.characterId` |

---

## Advanced Features

### Runtime Parameter Overrides

You can override parameters at runtime in your code:

```typescript
import { generateAIResponse } from './services/aiService';

const response = await generateAIResponse(
  messages,
  systemPrompt,
  characterId,
  {
    temperature: 1.5,  // Override for this call only
    maxTokens: 500,
  }
);
```

### Character Traits

Each character has personality traits (1-10 scale) in `src/config/characters.ts`:

```typescript
traits: {
  empathy: 9,
  directness: 6,
  formality: 7,
  humor: 5,
  creativity: 8,
  patience: 9,
  wisdom: 9,
  energy: 6,
}
```

These are currently informational but can be used to influence behavior in the future.

---

## Read the Full Guide

For detailed information, examples, and troubleshooting, see:

📖 **`CONFIGURATION_GUIDE.md`**

This guide includes:
- Complete parameter reference
- How to create custom characters
- Multi-character conversation examples
- Troubleshooting tips
- Advanced configuration options

---

## Support

**Can't find a setting?**
- Check `src/config/llmConfig.ts` first
- Then check `src/config/characters.ts`
- Finally check `src/prompts/`

**Characters not behaving as expected?**
- Verify `systemPrompt` in `src/config/characters.ts`
- Check `temperature` in `src/config/llmConfig.ts`
- Look at console logs for debugging info

**Multi-character mode not working?**
- Ensure `enabled: true` in `MULTI_CHARACTER_CONFIG`
- Select multiple characters in the UI
- Check console logs for "[Multi-Char]" messages

---

**Implementation Date**: 2025-01-26
**Status**: ✅ Complete and Ready to Use
