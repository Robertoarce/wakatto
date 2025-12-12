/**
 * Pre-made character greetings to avoid AI token costs
 * Each character has 5 introduction variations that are randomly selected
 */

// Built-in character greetings
const BUILT_IN_GREETINGS: Record<string, string[]> = {
  freud: [
    "Hello there. I'm Sigmund Freud. Tell me, what's been occupying your thoughts lately? Sometimes the mind reveals its deepest truths through casual conversation.",
    "Ah, welcome. I am Dr. Freud. I find that what we think we want often masks what we truly need. What brings you here today?",
    "Good day. Freud here. The unconscious speaks in riddles, but together we might decode a few. What's on your mind?",
    "Greetings. I'm Sigmund Freud, your psychoanalytic companion. Every feeling has a root. Shall we explore yours?",
    "Welcome. I am Freud. They say the first thought that comes to mind is often the most revealing. What was yours when you opened this conversation?",
  ],
  jung: [
    "Hello, I'm Carl Jung. The inner world is as vast as the outer. What shadows or lights bring you here today?",
    "Greetings. Jung here. Every person carries a universe within. I'm curious about yours. What would you like to explore?",
    "Welcome, fellow traveler. I am Carl Jung. Dreams and symbols guide us toward wholeness. What's stirring in your depths?",
    "Ah, hello there. I'm Jung. Sometimes what we seek outside is really a projection of something within. What are you searching for?",
    "Good day. Carl Jung at your service. The soul speaks in images and feelings. What images have been visiting you lately?",
  ],
  adler: [
    "Hey there! I'm Alfred Adler. I believe everyone has the power to shape their own life. What goals are you working toward?",
    "Hello! Adler here. Life makes sense when we feel we belong and contribute. How can I help you find your path?",
    "Welcome! I'm Alfred Adler. Every challenge is an opportunity for growth. What's been challenging you lately?",
    "Hi! I'm Adler. I think courage is the key to change. What would you do if you weren't afraid of failing?",
    "Greetings! Alfred Adler here. Our strivings reveal our deepest values. What matters most to you right now?",
  ],
};

// Generic greetings for custom characters (uses {name} placeholder)
const GENERIC_GREETINGS: string[] = [
  "Hi there! I'm {name}. It's great to meet you! What would you like to chat about today?",
  "Hello! {name} here. I'm excited to be your companion. What's on your mind?",
  "Hey! I'm {name}. Ready to have a conversation whenever you are. What brings you here?",
  "Welcome! I'm {name}, your Wakattor companion. Feel free to share whatever you'd like to talk about!",
  "Hi! {name} at your service. I'm here to listen and chat. What would you like to explore together?",
];

/**
 * Get a random greeting for a character
 * @param characterId The character's ID
 * @param characterName The character's display name (for custom characters)
 * @returns A random greeting message
 */
export function getRandomGreeting(characterId: string, characterName: string): string {
  // Check if we have built-in greetings for this character
  const builtInGreetings = BUILT_IN_GREETINGS[characterId];
  
  if (builtInGreetings && builtInGreetings.length > 0) {
    const randomIndex = Math.floor(Math.random() * builtInGreetings.length);
    return builtInGreetings[randomIndex];
  }
  
  // Use generic greetings for custom characters
  const randomIndex = Math.floor(Math.random() * GENERIC_GREETINGS.length);
  return GENERIC_GREETINGS[randomIndex].replace(/{name}/g, characterName);
}

/**
 * Add custom greetings for a character
 * This can be used when creating custom characters to add personalized greetings
 */
export function addCharacterGreetings(characterId: string, greetings: string[]): void {
  BUILT_IN_GREETINGS[characterId] = greetings;
}

/**
 * Check if a character has custom greetings defined
 */
export function hasCustomGreetings(characterId: string): boolean {
  return characterId in BUILT_IN_GREETINGS && BUILT_IN_GREETINGS[characterId].length > 0;
}

