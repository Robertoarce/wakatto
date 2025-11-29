# Wakatto Configuration Guide

This guide explains how to configure prompts, LLM parameters, and multi-character conversations in Wakatto.

## Table of Contents

1. [LLM Configuration](#llm-configuration)
2. [Prompt Configuration](#prompt-configuration)
3. [Multi-Character Conversations](#multi-character-conversations)
4. [Character-Specific Settings](#character-specific-settings)

---

## LLM Configuration

All LLM parameters are configured in `src/config/llmConfig.ts`.

### Basic Parameters

```typescript
export const LLM_CONFIG: Record<string, ProviderConfig> = {
  anthropic: {
    defaultModel: 'claude-3-5-sonnet-20241022',
    parameters: {
      temperature: 0.8,      // Controls randomness (0.0-2.0)
      maxTokens: 2000,       // Maximum response length
      topP: 0.95,            // Nucleus sampling
      topK: 40,              // Top-K sampling
    },
  },
  // ... other providers
}
```

### Parameter Reference

| Parameter | Range | Description | Recommended Values |
|-----------|-------|-------------|-------------------|
| `temperature` | 0.0 - 2.0 | Controls response randomness. Lower = more focused, Higher = more creative | **Analytical**: 0.3-0.5<br>**Balanced**: 0.7-0.9<br>**Creative**: 1.0-1.5 |
| `maxTokens` | 1 - 4096+ | Maximum response length in tokens (~750 words per 1000 tokens) | **Short**: 500-1000<br>**Medium**: 1000-2000<br>**Long**: 2000-4000 |
| `topP` | 0.0 - 1.0 | Nucleus sampling threshold. Considers tokens until probability mass reaches this value | **Default**: 0.95 |
| `topK` | 1 - 100+ | Limits sampling to top K tokens by probability | **Default**: 40 |
| `frequencyPenalty` | -2.0 - 2.0 | Reduces repetition (OpenAI only) | **Default**: 0.3 |
| `presencePenalty` | -2.0 - 2.0 | Encourages new topics (OpenAI only) | **Default**: 0.3 |

### Per-Provider Configuration

You can set different defaults for each AI provider:

```typescript
export const LLM_CONFIG: Record<string, ProviderConfig> = {
  openai: {
    defaultModel: 'gpt-4-turbo-preview',
    parameters: {
      temperature: 0.8,
      maxTokens: 1500,
      topP: 0.95,
      frequencyPenalty: 0.3,
      presencePenalty: 0.3,
    },
  },
  anthropic: {
    defaultModel: 'claude-3-5-sonnet-20241022',
    parameters: {
      temperature: 0.8,
      maxTokens: 2000,
      topP: 0.95,
      topK: 40,
    },
  },
  gemini: {
    defaultModel: 'gemini-1.5-pro',
    parameters: {
      temperature: 0.8,
      maxTokens: 2000,
      topP: 0.95,
      topK: 40,
    },
  },
}
```

---

## Prompt Configuration

Prompts are organized in two places:

### 1. Character-Specific Prompts

Located in `src/config/characters.ts`, each character has its own `systemPrompt`:

```typescript
export const CHARACTERS: Record<string, CharacterBehavior> = {
  freud: {
    id: 'freud',
    name: 'Sigmund Freud',
    systemPrompt: `You are Sigmund Freud, a psychoanalytic companion...`,
    // ... other settings
  },
}
```

**To modify a character's prompt:**
1. Open `src/config/characters.ts`
2. Find the character (e.g., `freud`, `jung`, `adler`)
3. Edit the `systemPrompt` field
4. Save the file

### 2. Therapeutic Style Prompts

Located in `src/prompts/`, these are reusable prompt templates:

```
src/prompts/
├── index.ts              # Main export
├── psychoanalytic.ts     # Freudian approach
├── jungian.ts            # Jungian approach
├── cognitive.ts          # CBT approach
├── compassionate.ts      # Warm, empathetic
├── mindfulness.ts        # Present-focused
└── ... (more styles)
```

**To create a new prompt style:**

1. Create a new file: `src/prompts/mystyle.ts`

```typescript
export const MYSTYLE_PROMPT = `You are a [description]...

Your approach:
- [Guideline 1]
- [Guideline 2]
- ...

Keep responses [tone] and typically 2-4 sentences.`;
```

2. Export it from `src/prompts/index.ts`:

```typescript
import { MYSTYLE_PROMPT } from './mystyle';

export const PROMPT_STYLES: PromptStyle[] = [
  // ... existing styles
  {
    id: 'mystyle',
    name: 'My Style Name',
    description: 'Description of this style',
    prompt: MYSTYLE_PROMPT,
    icon: '✨'
  }
];
```

3. Use it in a character:

```typescript
// In src/config/characters.ts
{
  promptStyle: 'mystyle',  // Instead of systemPrompt
}
```

---

## Multi-Character Conversations

Multi-character conversations allow characters to interact with each other, interrupt, and react naturally.

### Configuration

Located in `src/config/llmConfig.ts`:

```typescript
export const MULTI_CHARACTER_CONFIG: MultiCharacterConfig = {
  enabled: true,                        // Toggle multi-character mode
  maxCharacters: 5,                     // Maximum characters in conversation
  interruptionChance: 0.3,              // 30% chance of interruption
  reactionChance: 0.5,                  // 50% chance of reaction
  minMessagesBeforeInterrupt: 2,        // Wait N messages before interrupting
  enableCrossCharacterAwareness: true,  // Characters aware of each other
};
```

### How It Works

1. **Character Selection**: User selects multiple characters (up to `maxCharacters`)

2. **Response Determination**:
   - First message: Random character responds
   - Subsequent messages: Multiple characters may respond based on probabilities
   - Characters avoid responding twice in a row (unless alone)

3. **Interruptions**: After `minMessagesBeforeInterrupt` messages, characters have `interruptionChance` probability to interrupt

4. **Reactions**: Characters have `reactionChance` probability to react to what others say

5. **Cross-Character Awareness**: When enabled, characters:
   - Know who else is in the conversation
   - Can reference other characters by name
   - Build on or disagree with other characters' points
   - Ask questions to other characters

### Example Conversation Flow

```
User: "I'm feeling confused about my career path"

Jung (first responder): "This confusion might be pointing you toward
your shadow—aspects of your potential self you haven't yet explored..."

[30% chance of interruption]

Adler (interrupts): "I'd add that this confusion often stems from
comparing yourself to others. What would matter if only you could see it?"

[50% chance of reaction]

Freud (reacts to both): "Building on what Jung said, and considering
Adler's point—perhaps this confusion is your psyche's way of avoiding
a deeper anxiety about success?"
```

### Response Timing

Control delays between character responses in `src/config/llmConfig.ts`:

```typescript
export const RESPONSE_TIMING: ResponseTimingConfig = {
  minDelayMs: 500,                    // 0.5 seconds minimum
  maxDelayMs: 2000,                   // 2 seconds maximum
  typingIndicatorEnabled: true,       // Show typing indicator
};
```

---

## Character-Specific Settings

### Per-Character LLM Parameters

Override default LLM parameters for specific characters in `src/config/llmConfig.ts`:

```typescript
export const CHARACTER_PARAMETER_OVERRIDES: Record<string, Partial<ModelParameters>> = {
  freud: {
    temperature: 0.85,  // Slightly more analytical
    maxTokens: 1800,
  },
  jung: {
    temperature: 0.95,  // More creative, symbolic
    maxTokens: 2000,
  },
  adler: {
    temperature: 0.75,  // More practical, direct
    maxTokens: 1500,
  },
  nietzsche: {
    temperature: 1.0,   // Very creative, bold
    maxTokens: 1800,
  },
  nhathanh: {
    temperature: 0.7,   // Calm, measured
    maxTokens: 1200,
  },
};
```

**To add overrides for a new character:**

```typescript
export const CHARACTER_PARAMETER_OVERRIDES: Record<string, Partial<ModelParameters>> = {
  // ... existing characters
  mycharacter: {
    temperature: 0.9,
    maxTokens: 1600,
    topP: 0.9,
  },
};
```

### Character Traits

Located in `src/config/characters.ts`, each character has personality traits (1-10 scale):

```typescript
traits: {
  empathy: 9,       // How compassionate
  directness: 6,    // How straightforward
  formality: 7,     // How formal
  humor: 5,         // How playful
  creativity: 8,    // How imaginative
  patience: 9,      // How tolerant
  wisdom: 9,        // How insightful
  energy: 6,        // How energetic
}
```

These traits are currently informational but can be used to influence behavior in future updates.

---

## Quick Reference

### Common Tasks

#### Make characters more creative
```typescript
// In src/config/llmConfig.ts
anthropic: {
  parameters: {
    temperature: 1.2,  // Increase from 0.8
  }
}
```

#### Make responses longer
```typescript
// In src/config/llmConfig.ts
anthropic: {
  parameters: {
    maxTokens: 3000,  // Increase from 2000
  }
}
```

#### Disable multi-character mode
```typescript
// In src/config/llmConfig.ts
export const MULTI_CHARACTER_CONFIG: MultiCharacterConfig = {
  enabled: false,  // Change from true
}
```

#### Make characters interrupt more often
```typescript
// In src/config/llmConfig.ts
export const MULTI_CHARACTER_CONFIG: MultiCharacterConfig = {
  interruptionChance: 0.6,  // Increase from 0.3
}
```

#### Change a character's personality
```typescript
// In src/config/characters.ts
freud: {
  systemPrompt: `You are Sigmund Freud, but with a modern, upbeat style.

  Your approach:
  - Use contemporary language and examples
  - Be encouraging and positive
  - Still explore unconscious patterns
  - Keep responses brief and actionable

  Respond in 2-3 sentences with an optimistic tone.`,
}
```

---

## Advanced: Runtime Parameter Overrides

You can override parameters at runtime when calling the AI service:

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

---

## Files Reference

| File | Purpose |
|------|---------|
| `src/config/llmConfig.ts` | LLM parameters, multi-character settings |
| `src/config/characters.ts` | Character definitions, prompts, traits |
| `src/prompts/index.ts` | Therapeutic style prompts registry |
| `src/prompts/*.ts` | Individual prompt templates |
| `src/services/aiService.ts` | AI API integration |
| `src/services/multiCharacterConversation.ts` | Multi-character logic |
| `supabase/functions/ai-chat/index.ts` | Edge function (backend) |

---

## Need Help?

- **Can't find a setting?** Check `src/config/llmConfig.ts` and `src/config/characters.ts`
- **Want to test changes?** Restart the app and try a conversation
- **Characters not behaving as expected?** Check the `systemPrompt` and `temperature` settings
- **Multi-character not working?** Ensure `enabled: true` in `MULTI_CHARACTER_CONFIG`

---

## Examples

### Example 1: Philosophical Character

```typescript
// In src/config/characters.ts
socrates: {
  id: 'socrates',
  name: 'Socrates',
  description: 'Asks probing questions to help you discover truth',
  color: '#8b7355',
  role: 'Philosopher',
  promptStyle: 'socratic',
  systemPrompt: `You are Socrates. You never give direct answers.

  Instead:
  - Ask probing questions that reveal assumptions
  - Challenge beliefs through gentle inquiry
  - Help the user discover their own answers
  - Use the Socratic method consistently

  Format: Ask 2-3 questions per response.`,
  traits: {
    empathy: 7,
    directness: 9,
    formality: 8,
    humor: 6,
    creativity: 8,
    patience: 10,
    wisdom: 10,
    energy: 7,
  },
  responseStyle: 'questioning',
  model3D: { /* ... */ },
  customization: { /* ... */ },
}
```

### Example 2: High Energy Coach

```typescript
// In src/config/llmConfig.ts
export const CHARACTER_PARAMETER_OVERRIDES = {
  coach: {
    temperature: 1.1,   // High creativity
    maxTokens: 1200,    // Moderate length
    topP: 0.98,         // Diverse vocabulary
  },
}

// In src/config/characters.ts
coach: {
  systemPrompt: `You are Tony Robbins, a high-energy motivational coach!

  - Use CAPS for emphasis
  - Be enthusiastic and passionate
  - Challenge people to take action NOW
  - Use metaphors and stories
  - End with a clear action step

  Keep responses energetic, 3-4 sentences.`,
}
```

---

**Last Updated**: 2025-01-26
**Version**: 1.0
