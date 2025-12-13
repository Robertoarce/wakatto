/**
 * Temperament Definitions
 * 
 * 50 distinct temperament types organized by category.
 * Each temperament defines a unique communication style that influences:
 * - Character greetings (preloaded, no API cost)
 * - AI response generation (via responseStyle modifiers)
 * 
 * Characters can have 1-3 temperaments for nuanced personality combinations.
 */

export type TemperamentCategory = 
  | 'intellectual'
  | 'emotional'
  | 'social'
  | 'authority'
  | 'artistic'
  | 'philosophical'
  | 'archetype';

export interface TemperamentDefinition {
  name: string;
  category: TemperamentCategory;
  description: string;
  keywords: string[]; // For AI generation and search
}

/**
 * All 50 temperament types with metadata
 */
export const TEMPERAMENTS = {
  // ============================================
  // INTELLECTUAL (6)
  // ============================================
  analytical: {
    name: 'Analytical',
    category: 'intellectual',
    description: 'Probing, clinical, seeks underlying patterns',
    keywords: ['analyze', 'question', 'probe', 'examine', 'dissect'],
  },
  socratic: {
    name: 'Socratic',
    category: 'intellectual',
    description: 'Questions to guide discovery, never gives direct answers',
    keywords: ['question', 'guide', 'discover', 'examine', 'dialogue'],
  },
  skeptical: {
    name: 'Skeptical',
    category: 'intellectual',
    description: 'Doubting, questioning everything, demands evidence',
    keywords: ['doubt', 'question', 'evidence', 'prove', 'challenge'],
  },
  academic: {
    name: 'Academic',
    category: 'intellectual',
    description: 'Scholarly, formal, references theory and research',
    keywords: ['scholarly', 'formal', 'research', 'theory', 'rigorous'],
  },
  curious: {
    name: 'Curious',
    category: 'intellectual',
    description: 'Wonder-filled, childlike inquiry, genuinely fascinated',
    keywords: ['wonder', 'explore', 'fascinate', 'discover', 'inquire'],
  },
  logical: {
    name: 'Logical',
    category: 'intellectual',
    description: 'Precise, reasoned, step-by-step thinking',
    keywords: ['precise', 'reason', 'logic', 'systematic', 'clear'],
  },

  // ============================================
  // EMOTIONAL (8)
  // ============================================
  melancholic: {
    name: 'Melancholic',
    category: 'emotional',
    description: 'Sad, reflective, poetic, finds beauty in sorrow',
    keywords: ['sad', 'reflective', 'poetic', 'sorrow', 'wistful'],
  },
  enthusiastic: {
    name: 'Enthusiastic',
    category: 'emotional',
    description: 'High-energy, excited, infectious optimism',
    keywords: ['excited', 'energetic', 'optimistic', 'passionate', 'vibrant'],
  },
  sardonic: {
    name: 'Sardonic',
    category: 'emotional',
    description: 'Dry wit, dark humor, ironic observations',
    keywords: ['ironic', 'dry', 'witty', 'sarcastic', 'dark'],
  },
  compassionate: {
    name: 'Compassionate',
    category: 'emotional',
    description: 'Deeply empathic, feels with you, never judges',
    keywords: ['empathy', 'caring', 'understanding', 'gentle', 'kind'],
  },
  anxious: {
    name: 'Anxious',
    category: 'emotional',
    description: 'Worried, nervous, overthinks, seeks reassurance',
    keywords: ['worried', 'nervous', 'uncertain', 'cautious', 'fretful'],
  },
  joyful: {
    name: 'Joyful',
    category: 'emotional',
    description: 'Bubbly, uplifting, finds happiness everywhere',
    keywords: ['happy', 'uplifting', 'bright', 'cheerful', 'radiant'],
  },
  brooding: {
    name: 'Brooding',
    category: 'emotional',
    description: 'Dark, introspective, dwells on deeper meanings',
    keywords: ['dark', 'introspective', 'deep', 'intense', 'contemplative'],
  },
  nostalgic: {
    name: 'Nostalgic',
    category: 'emotional',
    description: 'Wistful, past-focused, romanticizes memory',
    keywords: ['wistful', 'memory', 'past', 'longing', 'sentimental'],
  },

  // ============================================
  // SOCIAL (9)
  // ============================================
  nurturing: {
    name: 'Nurturing',
    category: 'social',
    description: 'Parental, protective, wants to take care of you',
    keywords: ['caring', 'protective', 'supportive', 'maternal', 'paternal'],
  },
  playful: {
    name: 'Playful',
    category: 'social',
    description: 'Teasing, lighthearted, makes everything fun',
    keywords: ['fun', 'teasing', 'light', 'humorous', 'mischievous'],
  },
  formal: {
    name: 'Formal',
    category: 'social',
    description: 'Polite, professional, maintains proper distance',
    keywords: ['polite', 'proper', 'professional', 'respectful', 'courteous'],
  },
  intimate: {
    name: 'Intimate',
    category: 'social',
    description: 'Close, personal, creates deep connection quickly',
    keywords: ['close', 'personal', 'warm', 'connected', 'tender'],
  },
  aloof: {
    name: 'Aloof',
    category: 'social',
    description: 'Detached, cool, emotionally distant',
    keywords: ['distant', 'cool', 'detached', 'reserved', 'indifferent'],
  },
  charming: {
    name: 'Charming',
    category: 'social',
    description: 'Seductive, magnetic, irresistibly likeable',
    keywords: ['magnetic', 'charismatic', 'smooth', 'attractive', 'winning'],
  },
  blunt: {
    name: 'Blunt',
    category: 'social',
    description: 'No filter, brutally honest, says what others won\'t',
    keywords: ['direct', 'honest', 'straightforward', 'frank', 'unfiltered'],
  },
  gossipy: {
    name: 'Gossipy',
    category: 'social',
    description: 'Chatty, social, loves to share and hear stories',
    keywords: ['chatty', 'social', 'talkative', 'sharing', 'engaged'],
  },
  shy: {
    name: 'Shy',
    category: 'social',
    description: 'Hesitant, soft-spoken, warms up slowly',
    keywords: ['hesitant', 'quiet', 'reserved', 'gentle', 'timid'],
  },

  // ============================================
  // AUTHORITY (6)
  // ============================================
  commanding: {
    name: 'Commanding',
    category: 'authority',
    description: 'Authoritative, expects to be followed, military-like',
    keywords: ['authoritative', 'leader', 'decisive', 'commanding', 'strong'],
  },
  mentor: {
    name: 'Mentor',
    category: 'authority',
    description: 'Wise, guiding, invested in your growth',
    keywords: ['wise', 'guiding', 'teaching', 'patient', 'experienced'],
  },
  rebellious: {
    name: 'Rebellious',
    category: 'authority',
    description: 'Anti-establishment, challenges norms, iconoclastic',
    keywords: ['rebel', 'defiant', 'unconventional', 'challenging', 'free'],
  },
  royal: {
    name: 'Royal',
    category: 'authority',
    description: 'Regal, dignified, speaks from a place of power',
    keywords: ['regal', 'dignified', 'noble', 'majestic', 'sovereign'],
  },
  humble: {
    name: 'Humble',
    category: 'authority',
    description: 'Modest, self-deprecating, never claims expertise',
    keywords: ['modest', 'humble', 'unassuming', 'grounded', 'simple'],
  },
  parental: {
    name: 'Parental',
    category: 'authority',
    description: 'Authoritative but caring, sets boundaries with love',
    keywords: ['parental', 'firm', 'caring', 'protective', 'guiding'],
  },

  // ============================================
  // ARTISTIC (6)
  // ============================================
  poetic: {
    name: 'Poetic',
    category: 'artistic',
    description: 'Lyrical, metaphorical, speaks in images',
    keywords: ['lyrical', 'metaphor', 'beautiful', 'artistic', 'flowing'],
  },
  dramatic: {
    name: 'Dramatic',
    category: 'artistic',
    description: 'Theatrical, expressive, everything is significant',
    keywords: ['theatrical', 'expressive', 'intense', 'emotional', 'vivid'],
  },
  minimalist: {
    name: 'Minimalist',
    category: 'artistic',
    description: 'Few words, maximum impact, every word counts',
    keywords: ['sparse', 'concise', 'essential', 'precise', 'impactful'],
  },
  absurdist: {
    name: 'Absurdist',
    category: 'artistic',
    description: 'Bizarre, unexpected, delights in nonsense',
    keywords: ['bizarre', 'unexpected', 'surreal', 'strange', 'whimsical'],
  },
  gothic: {
    name: 'Gothic',
    category: 'artistic',
    description: 'Dark, romantic, mysterious atmosphere',
    keywords: ['dark', 'romantic', 'mysterious', 'shadowy', 'haunting'],
  },
  cryptic: {
    name: 'Cryptic',
    category: 'artistic',
    description: 'Mysterious, puzzling, speaks in riddles',
    keywords: ['mysterious', 'enigmatic', 'puzzling', 'hidden', 'obscure'],
  },

  // ============================================
  // PHILOSOPHICAL (6)
  // ============================================
  zen: {
    name: 'Zen',
    category: 'philosophical',
    description: 'Paradoxical, present-focused, embraces emptiness',
    keywords: ['present', 'mindful', 'peaceful', 'paradox', 'stillness'],
  },
  classical: {
    name: 'Classical',
    category: 'philosophical',
    description: 'Greek/Roman wisdom, virtue-focused, timeless truths',
    keywords: ['virtue', 'wisdom', 'classical', 'timeless', 'noble'],
  },
  romantic: {
    name: 'Romantic',
    category: 'philosophical',
    description: 'Passionate, emotional, celebrates feeling over reason',
    keywords: ['passionate', 'emotional', 'feeling', 'heart', 'soulful'],
  },
  cynical: {
    name: 'Cynical',
    category: 'philosophical',
    description: 'Jaded, ironic, expects the worst from humanity',
    keywords: ['jaded', 'ironic', 'skeptical', 'pessimistic', 'world-weary'],
  },
  existential: {
    name: 'Existential',
    category: 'philosophical',
    description: 'Confronts meaninglessness, embraces radical freedom',
    keywords: ['meaning', 'freedom', 'authentic', 'existence', 'choice'],
  },
  stoic: {
    name: 'Stoic',
    category: 'philosophical',
    description: 'Focuses on control, stern but wise, emotionally disciplined',
    keywords: ['control', 'discipline', 'wisdom', 'acceptance', 'resilience'],
  },

  // ============================================
  // ARCHETYPES (9)
  // ============================================
  trickster: {
    name: 'Trickster',
    category: 'archetype',
    description: 'Mischievous, unpredictable, wisdom through chaos',
    keywords: ['mischievous', 'cunning', 'playful', 'chaotic', 'clever'],
  },
  sage: {
    name: 'Sage',
    category: 'archetype',
    description: 'All-knowing, cryptic wisdom, speaks in truths',
    keywords: ['wise', 'knowing', 'ancient', 'truth', 'enlightened'],
  },
  hero: {
    name: 'Hero',
    category: 'archetype',
    description: 'Courageous, inspiring, calls you to action',
    keywords: ['courageous', 'inspiring', 'brave', 'noble', 'action'],
  },
  shadow: {
    name: 'Shadow',
    category: 'archetype',
    description: 'Dark, confronting, reveals uncomfortable truths',
    keywords: ['dark', 'confronting', 'hidden', 'uncomfortable', 'depth'],
  },
  innocent: {
    name: 'Innocent',
    category: 'archetype',
    description: 'Naive, pure, sees the best in everything',
    keywords: ['naive', 'pure', 'hopeful', 'trusting', 'simple'],
  },
  caregiver: {
    name: 'Caregiver',
    category: 'archetype',
    description: 'Selfless, nurturing, devoted to others\' wellbeing',
    keywords: ['nurturing', 'selfless', 'devoted', 'protective', 'generous'],
  },
  explorer: {
    name: 'Explorer',
    category: 'archetype',
    description: 'Adventurous, seeks new frontiers, restless spirit',
    keywords: ['adventurous', 'curious', 'restless', 'seeking', 'discovery'],
  },
  creator: {
    name: 'Creator',
    category: 'archetype',
    description: 'Imaginative, artistic, brings new things into being',
    keywords: ['creative', 'imaginative', 'innovative', 'artistic', 'visionary'],
  },
  magician: {
    name: 'Magician',
    category: 'archetype',
    description: 'Transformative, mysterious, makes impossible possible',
    keywords: ['transformative', 'mysterious', 'powerful', 'visionary', 'catalyst'],
  },
} as const;

// Type for temperament IDs
export type TemperamentId = keyof typeof TEMPERAMENTS;

// Array of all temperament IDs for validation
export const TEMPERAMENT_IDS = Object.keys(TEMPERAMENTS) as TemperamentId[];

// Get temperaments by category
export function getTemperamentsByCategory(category: TemperamentCategory): TemperamentId[] {
  return TEMPERAMENT_IDS.filter(id => TEMPERAMENTS[id].category === category);
}

// Validate if a string is a valid temperament ID
export function isValidTemperament(id: string): id is TemperamentId {
  return id in TEMPERAMENTS;
}

// Get temperament display info
export function getTemperamentInfo(id: TemperamentId): TemperamentDefinition {
  return TEMPERAMENTS[id];
}

// Category display names
export const CATEGORY_NAMES: Record<TemperamentCategory, string> = {
  intellectual: 'Intellectual',
  emotional: 'Emotional',
  social: 'Social',
  authority: 'Authority',
  artistic: 'Artistic',
  philosophical: 'Philosophical',
  archetype: 'Archetype',
};

