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

