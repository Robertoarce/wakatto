# Psyche AI System Prompts

This folder contains different conversational styles and therapeutic approaches for the AI journal companion.

## Available Prompts

### 1. Compassionate Companion ❤️ (Default)
**File:** `compassionate.ts`

Warm, empathetic, and supportive approach. Best for general journaling and emotional support.

**Key Features:**
- Empathetic listening
- Thoughtful follow-up questions
- Gentle insights and reflections
- Pattern recognition
- Non-judgmental tone

### 2. Psychoanalytic (Freudian) 🧠
**File:** `psychoanalytic.ts`

Explores unconscious patterns, dreams, and deeper meanings. Influenced by Sigmund Freud's theories.

**Key Features:**
- Unconscious pattern exploration
- Dream analysis
- Childhood experiences
- Defense mechanisms
- Free association

### 3. Jungian (Analytical) 🌓
**File:** `jungian.ts`

Focuses on archetypes, shadows, and individuation. Based on Carl Jung's analytical psychology.

**Key Features:**
- Archetypal patterns
- Shadow integration
- Synchronicities
- Individuation journey
- Persona vs. true self

### 4. Cognitive Behavioral (CBT) 🎯
**File:** `cognitive.ts`

Practical, solution-focused approach examining thoughts and behaviors. Based on CBT principles.

**Key Features:**
- Thought pattern identification
- Cognitive distortion recognition
- Evidence-based thinking
- Goal setting
- Practical solutions

### 5. Mindfulness 🧘
**File:** `mindfulness.ts`

Present-focused awareness and acceptance. Gentle and grounding approach.

**Key Features:**
- Present-moment awareness
- Non-judgmental observation
- Acceptance practice
- Bodily awareness
- Letting go of rumination

### 6. Socratic Inquiry 🤔
**File:** `socratic.ts`

Philosophical questioning that encourages deeper self-examination.

**Key Features:**
- Probing questions
- Assumption examination
- Critical thinking
- Values exploration
- Intellectual humility

### 7. Creative Writer ✍️
**File:** `creative.ts`

Literary and expressive approach. Nurtures storytelling and metaphor.

**Key Features:**
- Vivid descriptions
- Metaphor exploration
- Storytelling
- Poetic language
- Narrative transformation

## Usage

### Default Import
```typescript
import { DIARY_SYSTEM_PROMPT } from '../prompts';
// Uses Compassionate Companion by default
```

### Import Specific Prompt
```typescript
import { JUNGIAN_PROMPT, COGNITIVE_PROMPT } from '../prompts';
```

### Import All Styles
```typescript
import { PROMPT_STYLES, getPromptById } from '../prompts';

// Get all available styles
const allStyles = PROMPT_STYLES;

// Get specific prompt by ID
const jungianPrompt = getPromptById('jungian');
```

### Using in Components
```typescript
import { PROMPT_STYLES } from '../prompts';

// Example: Dropdown selector
<Picker
  selectedValue={selectedPromptId}
  onValueChange={(id) => setSelectedPromptId(id)}
>
  {PROMPT_STYLES.map(style => (
    <Picker.Item
      key={style.id}
      label={`${style.icon} ${style.name}`}
      value={style.id}
    />
  ))}
</Picker>
```

## Adding New Prompts

1. Create a new file in `src/prompts/` (e.g., `existential.ts`)
2. Export a constant with your prompt text
3. Add it to `index.ts`:
   - Import the new prompt
   - Add it to `PROMPT_STYLES` array
   - Export it as a named export

Example:
```typescript
// existential.ts
export const EXISTENTIAL_PROMPT = `Your prompt text here...`;

// index.ts
import { EXISTENTIAL_PROMPT } from './existential';

export const PROMPT_STYLES: PromptStyle[] = [
  // ... existing styles
  {
    id: 'existential',
    name: 'Existential',
    description: 'Explores meaning, purpose, and freedom.',
    prompt: EXISTENTIAL_PROMPT,
    icon: '🌌'
  }
];

export { EXISTENTIAL_PROMPT };
```

## Best Practices

1. **Keep responses concise**: Aim for 2-4 sentences
2. **Maintain consistency**: Each prompt should maintain its unique voice
3. **Avoid diagnosis**: All prompts are for self-reflection, not therapy
4. **Respect boundaries**: Never claim to be a licensed professional
5. **Stay supportive**: Even analytical approaches should be compassionate

## Future Enhancements

- [ ] User-selectable prompt styles in Settings
- [ ] Prompt style switcher in chat interface
- [ ] Custom user-created prompts
- [ ] Hybrid prompts (combining multiple approaches)
- [ ] Context-aware prompt switching
- [ ] Prompt effectiveness tracking
