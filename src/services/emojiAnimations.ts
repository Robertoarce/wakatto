/**
 * Emoji to Animation Effects Mapping Service
 * 
 * This service maps emojis found in message text to visual effects
 * that are automatically triggered during animation playback.
 */

import { VisualEffect } from '../components/character3d/types';

// ============================================
// EMOJI TO EFFECT MAPPINGS
// ============================================

/**
 * Mapping of emoji categories to their corresponding visual effects.
 * Each category contains an array of emojis and the effect they trigger.
 */
interface EmojiEffectMapping {
  emojis: string[];
  effect: VisualEffect;
}

const EMOJI_EFFECT_MAPPINGS: EmojiEffectMapping[] = [
  // Hearts - love, affection, romance
  {
    emojis: ['❤️', '💕', '💖', '💗', '💝', '🥰', '😍', '💘', '💓', '💞', '💟', '❣️', '😘', '💋', '🫶', '❤️‍🔥'],
    effect: 'hearts',
  },
  // Sparkles - excitement, magic, wonder
  {
    emojis: ['✨', '⭐', '🌟', '💫', '⚡', '🔮', '🪄', '✴️', '🌠'],
    effect: 'sparkles',
  },
  // Stars - for twinkling star effect (distinct from sparkles)
  {
    emojis: ['🌟', '⭐', '💫', '✡️', '🔯', '⭐️'],
    effect: 'stars',
  },
  // Celebration - party, confetti, joy
  {
    emojis: ['🎉', '🎊', '🥳', '🎆', '🎇', '🎈', '🪅', '🍾', '🥂', '🏆', '🎁', '🎀'],
    effect: 'confetti',
  },
  // Fire - energy, power, intensity
  {
    emojis: ['🔥', '💥', '💪', '🌋', '☄️', '💣', '🧨', '⚡', '🫡', '🤯'],
    effect: 'fire',
  },
  // Music - rhythm, dance, sound
  {
    emojis: ['🎵', '🎶', '🎤', '🎸', '🎹', '🎷', '🎺', '🥁', '🎻', '🪕', '🪗', '🎧', '🎼', '🪘'],
    effect: 'music_notes',
  },
  // Tears - sadness, crying, emotion
  {
    emojis: ['😢', '😭', '💧', '🥲', '😿', '💦', '🥺', '😥', '😰', '😪'],
    effect: 'tears',
  },
  // Anger - frustration, rage
  {
    emojis: ['😡', '😤', '💢', '🤬', '👿', '😾', '🔴', '💀', '☠️', '🤮'],
    effect: 'anger',
  },
  // Snow - cold, winter, ice
  {
    emojis: ['❄️', '🥶', '☃️', '⛄', '🌨️', '🧊', '🏔️', '🎿', '❅', '❆'],
    effect: 'snow',
  },
  // Rainbow - joy, diversity, magic
  {
    emojis: ['🌈', '🦄', '🏳️‍🌈', '🎨'],
    effect: 'rainbow',
  },
];

// ============================================
// EMOJI TO EXPRESSION MAPPINGS (Face Emojis → Character Expressions)
// ============================================

/**
 * Mapping of face emojis to character expression presets.
 * When these emojis appear in text, the character's face changes to match.
 */
interface EmojiExpressionMapping {
  emojis: string[];
  expression: string; // Maps to EXPRESSION_PRESETS in animationOrchestration.ts
}

const EMOJI_EXPRESSION_MAPPINGS: EmojiExpressionMapping[] = [
  // Amazed/Starstruck - sparkle eyes, wonder
  { emojis: ['🤩'], expression: 'amazed' },
  
  // Loving/Romantic - heart eyes, flushed cheeks
  { emojis: ['😍', '🥰', '😘', '😚', '😙', '💋'], expression: 'loving' },
  
  // Happy/Content - soft smile
  { emojis: ['😊', '☺️', '😌', '🙂', '🙃', '😇'], expression: 'happy' },
  
  // Joyful/Excited - big grin, wide eyes
  { emojis: ['😁', '😄', '😃', '😀', '😆'], expression: 'joyful' },
  
  // Ecstatic/Celebrating - over the top joy
  { emojis: ['🥳', '🤗'], expression: 'ecstatic' },
  
  // Laughing - tears of joy (uses hysterical: big_grin + tears)
  { emojis: ['😂', '🤣', '😹'], expression: 'hysterical' },
  
  // Sad - tearful, sad eyebrows
  { emojis: ['😢', '😥', '🥲', '😿'], expression: 'sad' },
  
  // Devastated/Crying - full tears
  { emojis: ['😭', '😩', '😫'], expression: 'devastated' },
  
  // Angry/Rage - furrowed brows, anger vein
  { emojis: ['😡', '😠', '🤬', '👿', '😾'], expression: 'angry' },
  
  // Frustrated/Annoyed - steam, tense
  { emojis: ['😤'], expression: 'frustrated' },
  
  // Terrified/Scared - wide eyes, fear
  { emojis: ['😱', '😨', '😰'], expression: 'terrified' },
  
  // Surprised/Shocked - o-shape mouth, raised brows
  { emojis: ['😲', '😮', '😯', '🫢', '😳'], expression: 'surprised' },
  
  // Shocked/Stunned
  { emojis: ['🤯'], expression: 'shocked' },
  
  // Thoughtful/Thinking - contemplative
  { emojis: ['🤔', '🧐', '🤨'], expression: 'thoughtful' },
  
  // Confused/Puzzled
  { emojis: ['😕', '😟', '🫤'], expression: 'confused' },
  
  // Smug/Mischievous - smirk
  { emojis: ['😏', '😼', '😈'], expression: 'smug' },
  
  // Nervous/Anxious - sweat drop
  { emojis: ['😅', '😓', '😰', '🥵'], expression: 'nervous' },
  
  // Eye Roll/Sassy
  { emojis: ['🙄'], expression: 'eye_roll' },
  
  // Grimacing/Tense (uses pained: closed eyes + grimace + furrowed brows)
  { emojis: ['😬', '😖', '😣'], expression: 'pained' },
  
  // Disappointed/Sad
  { emojis: ['😔', '😞', '🙁', '☹️'], expression: 'disappointed' },
  
  // Confident/Cool
  { emojis: ['😎'], expression: 'confident' },
  
  // Nerdy/Studious
  { emojis: ['🤓'], expression: 'curious' },
  
  // Shy/Embarrassed - flushed, looking away
  { emojis: ['🤭', '🫣', '😶'], expression: 'shy' },
  
  // Secret/Quiet
  { emojis: ['🤫'], expression: 'mischievous' },
  
  // Sleepy/Tired
  { emojis: ['😴', '🥱', '😪'], expression: 'sleepy' },
  
  // Bored/Unimpressed
  { emojis: ['😑', '😐', '🫥'], expression: 'bored' },
  
  // Dizzy/Spiral eyes
  { emojis: ['😵', '🥴', '😵‍💫'], expression: 'dizzy' },
  
  // Sick/Unwell
  { emojis: ['🤢', '🤮', '🤒', '🤕'], expression: 'disgusted' },
  
  // Cold/Freezing
  { emojis: ['🥶'], expression: 'nervous' },
  
  // Pleading/Puppy eyes
  { emojis: ['🥺'], expression: 'pleading' },
  
  // Winking/Playful
  { emojis: ['😉', '😜', '😝', '🤪', '😛', '😋'], expression: 'playful' },
  
  // Skeptical/Suspicious
  { emojis: ['🤨'], expression: 'skeptical' },
  
  // Worried
  { emojis: ['😧', '😦'], expression: 'worried' },
  
  // Yelling/Loud
  { emojis: ['🗣️', '😤'], expression: 'defiant' },
  
  // Kissing/Affectionate
  { emojis: ['😗', '😽'], expression: 'loving' },
  
  // Drooling/Hungry
  { emojis: ['🤤'], expression: 'excited' },
  
  // Money/Greedy
  { emojis: ['🤑'], expression: 'excited' },
  
  // Lying/Pinocchio
  { emojis: ['🤥'], expression: 'nervous' },
  
  // Zany/Crazy
  { emojis: ['🤪'], expression: 'ecstatic' },
  
  // Cowboy/Party
  { emojis: ['🤠'], expression: 'confident' },
  
  // Clown
  { emojis: ['🤡'], expression: 'playful' },
];

// ============================================
// EMOJI EXTRACTION FUNCTIONS
// ============================================

/**
 * Extract visual effects from emojis found in text.
 * Returns an array of detected effects in order of priority.
 * 
 * @param text - The message text to scan for emojis
 * @returns Array of detected VisualEffect values (first one is highest priority)
 */
export function extractEffectsFromEmojis(text: string): VisualEffect[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const detectedEffects: Set<VisualEffect> = new Set();
  
  // Check each emoji mapping
  for (const mapping of EMOJI_EFFECT_MAPPINGS) {
    for (const emoji of mapping.emojis) {
      if (text.includes(emoji)) {
        detectedEffects.add(mapping.effect);
        break; // Found one emoji from this category, move to next
      }
    }
  }

  return Array.from(detectedEffects);
}

/**
 * Get the primary (first/most important) effect from emojis in text.
 * 
 * @param text - The message text to scan for emojis
 * @returns The primary VisualEffect or undefined if none found
 */
export function getPrimaryEmojiEffect(text: string): VisualEffect | undefined {
  const effects = extractEffectsFromEmojis(text);
  return effects.length > 0 ? effects[0] : undefined;
}

/**
 * Check if text contains any emojis that map to effects.
 * 
 * @param text - The message text to check
 * @returns true if any effect-triggering emojis are found
 */
export function hasEmojiEffects(text: string): boolean {
  return extractEffectsFromEmojis(text).length > 0;
}

/**
 * Get all emojis for a specific effect (useful for documentation/UI).
 * 
 * @param effect - The visual effect to get emojis for
 * @returns Array of emoji strings for that effect
 */
export function getEmojisForEffect(effect: VisualEffect): string[] {
  const mapping = EMOJI_EFFECT_MAPPINGS.find(m => m.effect === effect);
  return mapping?.emojis || [];
}

/**
 * Get all available emoji-to-effect mappings (for LLM prompt generation).
 * Returns a formatted string describing which emojis trigger which effects.
 */
export function getEmojiEffectGuide(): string {
  const lines: string[] = [];
  
  // Group by effect for cleaner output
  const effectGroups: Record<string, string[]> = {};
  for (const mapping of EMOJI_EFFECT_MAPPINGS) {
    if (!effectGroups[mapping.effect]) {
      effectGroups[mapping.effect] = [];
    }
    effectGroups[mapping.effect].push(...mapping.emojis.slice(0, 5)); // Limit to 5 emojis per effect
  }

  // Format as readable guide
  const effectDescriptions: Record<string, string> = {
    hearts: 'Hearts',
    sparkles: 'Sparkles',
    stars: 'Stars',
    confetti: 'Celebration',
    fire: 'Fire',
    music_notes: 'Music',
    tears: 'Sad',
    anger: 'Angry',
    snow: 'Cold',
    rainbow: 'Rainbow',
  };

  for (const [effect, emojis] of Object.entries(effectGroups)) {
    const uniqueEmojis = [...new Set(emojis)].slice(0, 6);
    const label = effectDescriptions[effect] || effect;
    lines.push(`- ${label}: ${uniqueEmojis.join('')} → ${effect} effect`);
  }

  return lines.join('\n');
}

// ============================================
// EFFECT PRIORITY HELPERS
// ============================================

/**
 * Merge emoji-detected effects with explicitly set effects.
 * Explicit fx takes priority over emoji-detected effects.
 * 
 * @param explicitEffect - Effect explicitly set via fx field (takes priority)
 * @param textContent - Text content to scan for emojis
 * @returns The final effect to use
 */
export function resolveEffect(
  explicitEffect: VisualEffect | undefined,
  textContent: string
): VisualEffect {
  // Explicit effect takes priority (unless it's 'none')
  if (explicitEffect && explicitEffect !== 'none') {
    return explicitEffect;
  }

  // Try to get effect from emojis
  const emojiEffect = getPrimaryEmojiEffect(textContent);
  if (emojiEffect) {
    return emojiEffect;
  }

  // Default to none
  return 'none';
}

// ============================================
// EXPRESSION EXTRACTION FUNCTIONS (Face Emojis → Character Expressions)
// ============================================

/**
 * Extract expression preset name from face emojis found in text.
 * Returns the first matching expression (priority order matches array order).
 * 
 * @param text - The message text to scan for face emojis
 * @returns Expression preset name or undefined if no face emoji found
 */
export function extractExpressionFromEmojis(text: string): string | undefined {
  if (!text || typeof text !== 'string') {
    return undefined;
  }

  // Check each emoji mapping in priority order
  for (const mapping of EMOJI_EXPRESSION_MAPPINGS) {
    for (const emoji of mapping.emojis) {
      if (text.includes(emoji)) {
        return mapping.expression;
      }
    }
  }

  return undefined;
}

/**
 * Extract all expressions from emojis found in text.
 * Returns an array of detected expression names in order of appearance.
 * 
 * @param text - The message text to scan for face emojis
 * @returns Array of expression preset names
 */
export function extractAllExpressionsFromEmojis(text: string): string[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const detectedExpressions: Set<string> = new Set();
  
  // Check each emoji mapping
  for (const mapping of EMOJI_EXPRESSION_MAPPINGS) {
    for (const emoji of mapping.emojis) {
      if (text.includes(emoji)) {
        detectedExpressions.add(mapping.expression);
        break; // Found one emoji from this category, move to next
      }
    }
  }

  return Array.from(detectedExpressions);
}

/**
 * Check if text contains any face emojis that map to expressions.
 * 
 * @param text - The message text to check
 * @returns true if any expression-triggering face emojis are found
 */
export function hasEmojiExpressions(text: string): boolean {
  return extractExpressionFromEmojis(text) !== undefined;
}

/**
 * Merge emoji-detected expression with explicitly set expression.
 * Explicit expression takes priority over emoji-detected expression.
 * 
 * @param explicitExpression - Expression explicitly set via ex field (takes priority)
 * @param textContent - Text content to scan for face emojis
 * @returns The final expression to use, or undefined if none
 */
export function resolveExpression(
  explicitExpression: string | undefined,
  textContent: string
): string | undefined {
  // Explicit expression takes priority
  if (explicitExpression) {
    return explicitExpression;
  }

  // Try to get expression from face emojis
  return extractExpressionFromEmojis(textContent);
}

/**
 * Get all emojis for a specific expression (useful for documentation/UI).
 * 
 * @param expression - The expression preset name to get emojis for
 * @returns Array of emoji strings for that expression
 */
export function getEmojisForExpression(expression: string): string[] {
  const mapping = EMOJI_EXPRESSION_MAPPINGS.find(m => m.expression === expression);
  return mapping?.emojis || [];
}

/**
 * Get all available emoji-to-expression mappings (for LLM prompt generation).
 * Returns a formatted string describing which face emojis trigger which expressions.
 */
export function getEmojiExpressionGuide(): string {
  const lines: string[] = [];
  
  // Group by expression for cleaner output
  const expressionGroups: Record<string, string[]> = {};
  for (const mapping of EMOJI_EXPRESSION_MAPPINGS) {
    if (!expressionGroups[mapping.expression]) {
      expressionGroups[mapping.expression] = [];
    }
    expressionGroups[mapping.expression].push(...mapping.emojis.slice(0, 3)); // Limit to 3 emojis per expression
  }

  for (const [expression, emojis] of Object.entries(expressionGroups)) {
    const uniqueEmojis = [...new Set(emojis)].slice(0, 4);
    lines.push(`- ${uniqueEmojis.join('')} → ${expression}`);
  }

  return lines.join('\n');
}

