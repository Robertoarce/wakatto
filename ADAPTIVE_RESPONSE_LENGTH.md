# Adaptive Response Length Implementation

## What Was Changed

I've updated all character prompts to be **intelligent about response length**: brief by default, detailed only when necessary.

---

## The New Behavior

### **Default: SHORT (2-4 sentences)**

Characters will keep responses concise and impactful by default.

**Example**:
```
User: "I'm feeling anxious today"

Freud: "Your anxiety may be signaling unacknowledged desires seeking
expression. What feelings have you been avoiding lately?"
```

### **Expand Only When:**

1. **User explicitly asks for detail**
   - "Can you explain that in more detail?"
   - "Tell me more about..."
   - "Elaborate on..."

2. **Topic is genuinely complex**
   - Explaining the difference between Jung's shadow and Freud's unconscious
   - Describing a multi-step therapeutic technique
   - Unpacking a nuanced philosophical concept

3. **Introducing a new concept that needs context**
   - First time mentioning "the anima"
   - Explaining "flow state"
   - Introducing "logotherapy"

---

## What Was Updated

### ✅ All 10 Character Prompts

Added this instruction to every character in `src/config/characters.ts`:

```
**Response Length**: Keep responses brief (2-4 sentences) by default. Only expand with detail when:
- The user explicitly asks for elaboration or deeper analysis
- The topic is complex and requires nuanced explanation
- You're introducing a new psychological concept that needs context
Otherwise, favor concise, impactful insights.
```

**Characters updated:**
1. Freud (Psychoanalytic)
2. Jung (Jungian)
3. Adler (Individual Psychology)
4. Seligman (Positive Psychology)
5. Brené Brown (Vulnerability)
6. Viktor Frankl (Logotherapy)
7. Epictetus (Stoic)
8. Nietzsche (Existential)
9. Csikszentmihalyi (Flow)
10. Thich Nhat Hanh (Mindfulness)

### ✅ Multi-Character Conversations

Updated `src/services/multiCharacterConversation.ts` to include brevity guidance:

```
6. **Response brevity**: Keep responses brief (2-4 sentences) by default.
Only expand when the user explicitly requests detail, the topic is genuinely
complex, or you're introducing a concept that requires context. Multiple short
responses create better dialogue flow than one long monologue.
```

This ensures that in group conversations, characters don't dominate with long monologues.

---

## Examples

### ✅ Good: Brief by Default

**User**: "I can't stop thinking about my ex"

**Jung**: "This recurring thought may be your psyche's attempt to integrate an unfinished chapter. What part of yourself did you leave behind in that relationship?"

**Adler**: "Perhaps you're compensating for feelings of incompleteness. Would you still think of them if you felt whole on your own?"

---

### ✅ Good: Expands When Needed

**User**: "Can you explain what the 'shadow' is in Jungian psychology?"

**Jung**: "The shadow represents the parts of yourself you've rejected or hidden—traits you deem unacceptable. It forms early in life when you learn what's 'good' and 'bad,' pushing uncomfortable qualities into the unconscious. These rejected parts don't disappear; they influence you from below awareness, emerging in projections onto others or sudden emotional reactions. Integrating your shadow means acknowledging these hidden aspects with compassion, not judgment."

*(Longer response justified because user explicitly asked for an explanation)*

---

### ✅ Good: Complex Topic Gets Detail

**User**: "What's the difference between Freud's unconscious and Jung's collective unconscious?"

**Freud**: "The unconscious I described is personal—your repressed memories, desires, and unresolved conflicts unique to your life. It's shaped by your individual experiences."

**Jung**: "Building on that, the collective unconscious goes deeper—it's inherited, universal, shared across humanity. It contains archetypes like the Mother, the Hero, the Shadow, patterns that repeat in myths, dreams, and stories worldwide. Your personal unconscious sits above this deeper layer."

*(Both expand because the question requires nuanced explanation)*

---

### ❌ Bad: Unnecessarily Long

**User**: "I'm nervous about my presentation tomorrow"

**Bad Response**: "Your nervousness is a natural response to anticipated judgment, rooted in our evolutionary need for social acceptance. When facing evaluation, the amygdala triggers fight-or-flight responses while your prefrontal cortex tries to maintain rational thinking. This creates physiological symptoms like racing heart and sweating. Throughout human history, being ostracized from the group meant death, so we're wired to fear judgment. The key is to reframe this anxiety as excitement—both emotions share similar physiological markers. Practice deep breathing, visualize success, and remember that even if you stumble, it won't define your worth. What specific aspects of the presentation worry you most?"

**Good Response**: "Your nervousness is your mind anticipating judgment—an ancient survival mechanism. What specifically are you afraid might happen tomorrow?"

---

## Benefits

### 1. **Faster, More Engaging Conversations**
- Users get quick, actionable insights
- Less reading fatigue
- More back-and-forth dialogue

### 2. **Better Multi-Character Dynamics**
- Multiple short responses create natural conversation flow
- Characters can build on each other without walls of text
- Easier to follow multiple perspectives

### 3. **User Control**
- User decides when they want depth
- Can ask "tell me more" to get detail
- Respects user's time and attention

### 4. **Cost Efficiency**
- Shorter responses = fewer tokens
- Lower API costs
- Faster response times

---

## Testing

To verify this is working:

1. **Test brevity**: Ask a simple question
   - ✅ Expected: 2-4 sentence response

2. **Test expansion**: Ask "explain in detail..."
   - ✅ Expected: Longer, comprehensive response

3. **Test multi-character**: Chat with 3 characters
   - ✅ Expected: Multiple short responses, not three long paragraphs

4. **Test complex topic**: Ask about a psychological concept
   - ✅ Expected: Detailed explanation with context

---

## Configuration

The technical token limit remains unchanged:

```typescript
// src/config/llmConfig.ts
anthropic: {
  parameters: {
    maxTokens: 2000,  // Still allows long responses when needed
  }
}
```

This provides headroom for when the AI correctly determines a detailed response is warranted.

---

## Overriding (If Needed)

If you want to make responses even shorter or longer by default, edit the prompt instruction:

```typescript
// src/config/characters.ts

// For VERY brief responses (1-2 sentences):
**Response Length**: Keep responses extremely concise (1-2 sentences maximum).
Expand only when absolutely necessary.

// For longer default responses (3-6 sentences):
**Response Length**: Keep responses thoughtful and thorough (3-6 sentences).
Expand further only when the user explicitly requests it.
```

---

## Summary

✅ **Characters default to brief, impactful responses (2-4 sentences)**
✅ **Characters expand intelligently when truly needed**
✅ **Multi-character conversations flow naturally**
✅ **User can request detail whenever they want**
✅ **No code changes needed - just prompt engineering**

---

**Implementation Date**: 2025-01-26
**Files Modified**:
- `src/config/characters.ts` (all 10 characters)
- `src/services/multiCharacterConversation.ts`

**Status**: ✅ Complete
