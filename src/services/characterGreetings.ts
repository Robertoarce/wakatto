/**
 * Character Greetings Service
 * 
 * Provides temperament-based greetings for characters.
 * Supports temperament combinations for nuanced personality expression.
 * 
 * Benefits:
 * - Zero API calls (all greetings preloaded)
 * - Instant display (0ms vs 500-2000ms API latency)
 * - Authentic character first impressions
 * - Offline capability for initial interaction
 */

import { TemperamentId, isValidTemperament } from '../config/temperaments';
import { GREETING_TEMPLATES, getGreetingFromTemperament } from './greetingTemplates';

// Fallback greetings when no temperament is defined
const FALLBACK_GREETINGS: string[] = [
  "Hello. What brings you here today?",
  "Welcome. I'm here to listen. What's on your mind?",
  "Hi there. Feel free to share whatever you'd like to talk about.",
  "Hello. I'm ready to hear what you have to say.",
  "Welcome. What would you like to explore together?",
];

/**
 * Get a random greeting based on character's temperaments
 * 
 * Algorithm:
 * - If temperaments defined: 70% primary, 30% secondary (if exists)
 * - If no temperaments: use fallback generic greeting
 * 
 * @param characterId - The character's unique ID (for logging)
 * @param characterName - The character's display name (for fallback)
 * @param temperaments - Array of temperament IDs (e.g., ['fierce', 'sardonic'])
 * @returns A greeting string appropriate to the character's temperament
 */
export function getRandomGreeting(
  characterId: string,
  characterName: string,
  temperaments?: string[]
): string {
  // If no temperaments defined, use fallback
  if (!temperaments || temperaments.length === 0) {
    console.log(`[Greetings] No temperaments for ${characterId}, using fallback`);
    return getFallbackGreeting(characterName);
  }

  // Validate temperaments
  const validTemperaments = temperaments.filter(t => isValidTemperament(t)) as TemperamentId[];

  if (validTemperaments.length === 0) {
    console.warn(`[Greetings] No valid temperaments for ${characterId}:`, temperaments);
    return getFallbackGreeting(characterName);
  }

  // Select temperament based on probability
  const selectedTemperament = selectTemperament(validTemperaments);

  // Get random greeting from selected temperament pool
  const greeting = getGreetingFromTemperament(selectedTemperament);

  console.log(`[Greetings] ${characterId}: selected ${selectedTemperament} temperament`);

  return greeting;
}

/**
 * Select a temperament from the array based on probability
 * Primary temperament: 70% chance
 * Secondary temperament: 30% chance (if exists)
 * Tertiary+ temperaments: Only if explicitly selected as secondary
 */
function selectTemperament(temperaments: TemperamentId[]): TemperamentId {
  if (temperaments.length === 1) {
    return temperaments[0];
  }

  // 70% chance for primary, 30% for secondary
  const random = Math.random();

  if (random < 0.7) {
    return temperaments[0]; // Primary
  } else if (temperaments.length === 2) {
    return temperaments[1]; // Secondary
  } else {
    // If 3+ temperaments, randomly pick from secondary onwards
    const secondaryIndex = 1 + Math.floor(Math.random() * (temperaments.length - 1));
    return temperaments[secondaryIndex];
  }
}

/**
 * Get a fallback greeting with character name placeholder
 */
function getFallbackGreeting(characterName: string): string {
  const randomIndex = Math.floor(Math.random() * FALLBACK_GREETINGS.length);
  const greeting = FALLBACK_GREETINGS[randomIndex];

  // If greeting needs a name, prepend it
  if (!greeting.toLowerCase().includes('hello') && !greeting.toLowerCase().includes('welcome')) {
    return `Hi, I'm ${characterName}. ${greeting}`;
  }

  return greeting;
}

/**
 * Get a specific temperament greeting (useful for testing or preview)
 */
export function getGreetingByTemperament(temperamentId: string): string | null {
  if (!isValidTemperament(temperamentId)) {
    return null;
  }

  return getGreetingFromTemperament(temperamentId as TemperamentId);
}

/**
 * Get all available greetings for a temperament (useful for UI preview)
 */
export function getAllGreetingsForTemperament(temperamentId: string): string[] {
  if (!isValidTemperament(temperamentId)) {
    return [];
  }

  return GREETING_TEMPLATES[temperamentId as TemperamentId] || [];
}

/**
 * Legacy compatibility: Get greeting by responseStyle
 * Maps old responseStyle values to temperament IDs
 */
const RESPONSE_STYLE_TO_TEMPERAMENT: Record<string, TemperamentId> = {
  // Existing responseStyle values from characters.ts
  'analytical': 'analytical',
  'symbolic': 'cryptic',      // Jung's symbolic style maps to cryptic
  'practical': 'blunt',       // Adler's practical style
  'hopeful': 'joyful',        // Seligman's hopeful style
  'vulnerable': 'compassionate', // Brown's vulnerable style
  'meaningful': 'existential',   // Frankl's meaning-focused style
  'stoic': 'stoic',           // Epictetus
  'fierce': 'rebellious',     // Nietzsche
  'engaging': 'enthusiastic', // Csikszentmihalyi's engaging style
  'peaceful': 'zen',          // Peaceful/mindful style
};

/**
 * Get greeting using legacy responseStyle field
 * For backward compatibility with characters that don't have temperaments array yet
 */
export function getGreetingByResponseStyle(
  characterId: string,
  characterName: string,
  responseStyle?: string
): string {
  if (!responseStyle) {
    return getFallbackGreeting(characterName);
  }

  // Try direct match first
  if (isValidTemperament(responseStyle)) {
    return getRandomGreeting(characterId, characterName, [responseStyle]);
  }

  // Try mapping
  const mappedTemperament = RESPONSE_STYLE_TO_TEMPERAMENT[responseStyle];
  if (mappedTemperament) {
    return getRandomGreeting(characterId, characterName, [mappedTemperament]);
  }

  // Fallback
  return getFallbackGreeting(characterName);
}

/**
 * Get Bob's tutorial greeting message
 * This is a fixed greeting for the tutorial character
 */
export function getBobGreeting(): string {
  return `Yooo! i'm Bob, your guide to Wakatto!.

so here's the deal—you're basically in a chat app where you can talk to different AI characters. each one has their own vibe and expertise.

right now though, we gotta talk business. the app ain't free (shocking, i know). but hey, someone has to pay for the bills`;
}

/**
 * Get Bob's post-trial pitch message
 * Shown when user returns after using all 5 free trial messages
 * @param lastCharacterName - Optional name of the last wakattor they were chatting with
 */
export function getBobPostTrialPitch(lastCharacterName?: string): string {
  const characterMention = lastCharacterName
    ? `hope you enjoyed chatting with ${lastCharacterName}! `
    : `hope you enjoyed the free trial! `;

  const pitches = [
    `hey, welcome back! ${characterMention}so, you've hit your 5 free messages. not bad, right? 

now here's the thing—there's a whole world of wakattors waiting for you. philosophers, scientists, coaches... and they all have way more to say.

ready to unlock the full experience? let's talk pricing. i promise i'm reasonable... mostly. 😏`,

    `yo! ${characterMention}that was your free trial—5 messages to get a taste.

the good news? you've barely scratched the surface. there's einstein, hawking, marcus aurelius, aristotle, blackbeard (yes, the pirate)... and they're all ready to chat.

so what do you say—wanna go premium? i'll make you a deal you can't refuse. well, maybe you can refuse it, but hear me out first.`,

    `back so soon? ${characterMention}look, i'll be real with you—those 5 free messages? that was just the appetizer.

the main course is unlimited access to every wakattor, deeper conversations, no interruptions from yours truly (unless you want me around).

so... ready to commit? or do you need more convincing? i've got time. well, technically infinite time. i'm an AI.`,
  ];

  // Pick a random pitch
  return pitches[Math.floor(Math.random() * pitches.length)];
}
