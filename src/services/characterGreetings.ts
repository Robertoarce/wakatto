/**
 * Character greetings to avoid AI token costs
 * Uses generic greetings with name placeholder
 */

// Generic greetings for all characters (uses {name} placeholder)
const GENERIC_GREETINGS: string[] = [
  "Hi there! I'm {name}. It's great to meet you! What would you like to chat about today?",
  "Hello! {name} here. I'm excited to be your companion. What's on your mind?",
  "Hey! I'm {name}. Ready to have a conversation whenever you are. What brings you here?",
  "Welcome! I'm {name}, your Wakattor companion. Feel free to share whatever you'd like to talk about!",
  "Hi! {name} at your service. I'm here to listen and chat. What would you like to explore together?",
];

/**
 * Get a random greeting for a character
 * @param characterName The character's display name
 * @returns A random greeting message
 */
export function getRandomGreeting(_characterId: string, characterName: string): string {
  const randomIndex = Math.floor(Math.random() * GENERIC_GREETINGS.length);
  return GENERIC_GREETINGS[randomIndex].replace(/{name}/g, characterName);
}
