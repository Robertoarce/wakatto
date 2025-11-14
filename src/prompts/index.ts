/**
 * Psyche AI System Prompts
 *
 * Collection of different therapeutic and conversational styles
 * for the AI journal companion.
 */

import { COMPASSIONATE_PROMPT } from './compassionate';
import { PSYCHOANALYTIC_PROMPT } from './psychoanalytic';
import { JUNGIAN_PROMPT } from './jungian';
import { ADLERIAN_PROMPT } from './adlerian';
import { COGNITIVE_PROMPT } from './cognitive';
import { MINDFULNESS_PROMPT } from './mindfulness';
import { SOCRATIC_PROMPT } from './socratic';
import { CREATIVE_PROMPT } from './creative';
import { EXISTENTIAL_PROMPT } from './existential';
import { POSITIVE_PROMPT } from './positive';
import { NARRATIVE_PROMPT } from './narrative';

/**
 * Prompt style metadata
 */
export interface PromptStyle {
  id: string;
  name: string;
  description: string;
  prompt: string;
  icon: string;
}

/**
 * Available prompt styles
 */
export const PROMPT_STYLES: PromptStyle[] = [
  {
    id: 'compassionate',
    name: 'Compassionate Companion',
    description: 'Warm, empathetic, and supportive. Best for general journaling and emotional support.',
    prompt: COMPASSIONATE_PROMPT,
    icon: '❤️'
  },
  {
    id: 'psychoanalytic',
    name: 'Psychoanalytic (Freudian)',
    description: 'Explores unconscious patterns, dreams, and deeper meanings. Influenced by Freud.',
    prompt: PSYCHOANALYTIC_PROMPT,
    icon: '🧠'
  },
  {
    id: 'jungian',
    name: 'Jungian (Analytical)',
    description: 'Focuses on archetypes, shadows, and individuation. Based on Carl Jung\'s work.',
    prompt: JUNGIAN_PROMPT,
    icon: '🌓'
  },
  {
    id: 'cognitive',
    name: 'Cognitive Behavioral (CBT)',
    description: 'Practical, solution-focused approach examining thoughts and behaviors.',
    prompt: COGNITIVE_PROMPT,
    icon: '🎯'
  },
  {
    id: 'mindfulness',
    name: 'Mindfulness',
    description: 'Present-focused awareness and acceptance. Gentle and grounding.',
    prompt: MINDFULNESS_PROMPT,
    icon: '🧘'
  },
  {
    id: 'socratic',
    name: 'Socratic Inquiry',
    description: 'Philosophical questioning that encourages deeper self-examination.',
    prompt: SOCRATIC_PROMPT,
    icon: '🤔'
  },
  {
    id: 'creative',
    name: 'Creative Writer',
    description: 'Literary and expressive approach. Nurtures storytelling and metaphor.',
    prompt: CREATIVE_PROMPT,
    icon: '✍️'
  },
  {
    id: 'adlerian',
    name: 'Adlerian (Individual)',
    description: 'Focuses on social interest, belonging, and life goals. Based on Alfred Adler.',
    prompt: ADLERIAN_PROMPT,
    icon: '🤝'
  },
  {
    id: 'existential',
    name: 'Existential',
    description: 'Explores meaning, purpose, freedom, and authentic existence.',
    prompt: EXISTENTIAL_PROMPT,
    icon: '🌌'
  },
  {
    id: 'positive',
    name: 'Positive Psychology',
    description: 'Strengths-based, gratitude-focused approach to well-being and flourishing.',
    prompt: POSITIVE_PROMPT,
    icon: '✨'
  },
  {
    id: 'narrative',
    name: 'Narrative Therapy',
    description: 'Re-authoring life stories and externalizing problems for empowerment.',
    prompt: NARRATIVE_PROMPT,
    icon: '📖'
  }
];

/**
 * Get prompt by ID
 */
export function getPromptById(id: string): string {
  const style = PROMPT_STYLES.find(s => s.id === id);
  return style?.prompt || COMPASSIONATE_PROMPT;
}

/**
 * Default prompt (Compassionate Companion)
 * Maintained for backward compatibility
 */
export const DIARY_SYSTEM_PROMPT = COMPASSIONATE_PROMPT;

// Named exports for direct import
export {
  COMPASSIONATE_PROMPT,
  PSYCHOANALYTIC_PROMPT,
  JUNGIAN_PROMPT,
  ADLERIAN_PROMPT,
  COGNITIVE_PROMPT,
  MINDFULNESS_PROMPT,
  SOCRATIC_PROMPT,
  CREATIVE_PROMPT,
  EXISTENTIAL_PROMPT,
  POSITIVE_PROMPT,
  NARRATIVE_PROMPT
};
