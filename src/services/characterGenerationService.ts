/**
 * Character Generation Service
 *
 * Uses LLM to analyze character names and generate full character configurations.
 * Supports both known characters (Einstein, Goku) and fictional characters.
 */

import { generateAIResponse } from './aiService';
import { CharacterBehavior } from '../config/characters';

// Step 2: LLM analyzes character name
export interface CharacterAnalysis {
  isKnown: boolean;
  characterConfig?: Partial<CharacterBehavior>;
  needsMoreInfo?: boolean;
  suggestedQuestions?: string[];
}

// Step 3: User provides additional info for fictional characters
export interface CharacterDescription {
  keyTraits: string[]; // e.g., ["brave", "intelligent", "humorous"]
  description?: string; // Optional longer description
}

/**
 * Step 2: Analyze character name using LLM
 * Determines if character is known and generates initial config
 */
export async function analyzeCharacterName(name: string): Promise<CharacterAnalysis> {
  const systemPrompt = `You are a character analysis AI. Your job is to analyze character names and determine if they are well-known characters (real people, fictional characters from movies/books/games, etc.).

If the character is KNOWN:
- Respond with JSON containing full character configuration
- Include: name, description, role, personality traits (1-10 scale), physical appearance, colors, response style

If the character is UNKNOWN or FICTIONAL:
- Set isKnown: false
- Ask 2-3 questions to help generate the character

Response format (JSON only, no markdown):
{
  "isKnown": true/false,
  "characterConfig": { /* if known */ },
  "needsMoreInfo": true/false,
  "suggestedQuestions": ["question1", "question2"]
}`;

  const userMessage = `Analyze this character name: "${name}"

If this is a well-known character, provide:
1. Brief description (1-2 sentences)
2. Role (e.g., "Physicist", "Superhero", "Philosopher")
3. Personality traits (1-10 scale): empathy, directness, formality, humor, creativity, patience, wisdom, energy
4. Physical appearance: gender (male/female/neutral), skinTone (light/medium/tan/dark), clothing (suit/tshirt/dress/casual), hair (short/long/none/medium), accessory (glasses/none/hat/tie)
5. Colors: primary color (hex), bodyColor (hex), accessoryColor (hex), hairColor (hex)
6. Response style: one word (e.g., "analytical", "playful", "wise", "heroic")
7. Prompt style: choose from (compassionate, psychoanalytic, jungian, cognitive, mindfulness, socratic, creative, adlerian, existential, positive, narrative)

If unknown or needs clarification, ask 2-3 questions to help create the character.

Respond with ONLY valid JSON, no markdown formatting.`;

  try {
    const response = await generateAIResponse(
      [{ role: 'user', content: userMessage }],
      systemPrompt
    );

    // Parse LLM response
    const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const analysis: CharacterAnalysis = JSON.parse(cleanedResponse);

    return analysis;
  } catch (error) {
    console.error('[CharGen] Error analyzing character:', error);
    throw new Error('Failed to analyze character. Please try again.');
  }
}

/**
 * Step 3b: Generate character config from user description (for fictional characters)
 */
export async function generateCharacterFromDescription(
  name: string,
  description: CharacterDescription
): Promise<Partial<CharacterBehavior>> {
  const systemPrompt = `You are a character design AI. Generate a complete character configuration based on the user's description.

Response format (JSON only, no markdown):
{
  "name": "Character Name",
  "description": "Brief description (1-2 sentences)",
  "role": "Character's role",
  "customization": {
    "gender": "male/female/neutral",
    "skinTone": "light/medium/tan/dark",
    "clothing": "suit/tshirt/dress/casual",
    "hair": "short/long/none/medium",
    "accessory": "glasses/none/hat/tie",
    "bodyColor": "#hex",
    "accessoryColor": "#hex",
    "hairColor": "#hex"
  },
  "color": "#hex",
  "responseStyle": "one word style"
}`;

  const traitsText = description.keyTraits.join(', ');
  const descText = description.description || '';

  const userMessage = `Create a character named "${name}" with these traits: ${traitsText}.
${descText ? `Additional description: ${descText}` : ''}

Generate a complete character configuration including:
1. Description (1-2 sentences capturing their essence)
2. Role (what they represent or do)
3. Physical appearance (gender, skin tone, clothing style, hair, accessories)
4. Colors (primary color, body color, accessory color, hair color - all as hex codes)
5. Response style (one word: analytical, playful, wise, fierce, compassionate, etc.)

Respond with ONLY valid JSON, no markdown formatting.`;

  try {
    const response = await generateAIResponse(
      [{ role: 'user', content: userMessage }],
      systemPrompt
    );

    // Parse LLM response
    const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const config = JSON.parse(cleanedResponse);

    return config;
  } catch (error) {
    console.error('[CharGen] Error generating character:', error);
    throw new Error('Failed to generate character. Please try again.');
  }
}

/**
 * Create a full CharacterBehavior object from partial config
 */
export function buildCharacterBehavior(
  partialConfig: Partial<CharacterBehavior>,
  userId: string
): CharacterBehavior {
  const timestamp = Date.now();
  const characterId = `custom_${partialConfig.name?.toLowerCase().replace(/\s+/g, '_')}_${timestamp}`;

  // Provide defaults for any missing fields
  const character: CharacterBehavior = {
    id: characterId,
    name: partialConfig.name || 'Unnamed Character',
    description: partialConfig.description || 'A custom AI character',
    color: partialConfig.color || '#8b5cf6',
    role: partialConfig.role || 'Assistant',
    systemPrompt: partialConfig.systemPrompt || 'You are a helpful AI assistant.',
    responseStyle: partialConfig.responseStyle || 'balanced',
    model3D: {
      bodyColor: partialConfig.model3D?.bodyColor || partialConfig.customization?.bodyColor || '#8b5cf6',
      accessoryColor: partialConfig.model3D?.accessoryColor || partialConfig.customization?.accessoryColor || '#6d28d9',
      position: partialConfig.model3D?.position || [0, 0, 0],
    },
    customization: {
      gender: 'neutral',
      skinTone: 'medium',
      clothing: 'casual',
      hair: 'short',
      accessory: 'none',
      bodyColor: '#8b5cf6',
      accessoryColor: '#6d28d9',
      hairColor: '#3a2a1a',
      ...partialConfig.customization,
    },
  };

  return character;
}

/**
 * Validate character configuration
 */
export function validateCharacterConfig(character: CharacterBehavior): string[] {
  const errors: string[] = [];

  if (!character.name || character.name.trim().length === 0) {
    errors.push('Character name is required');
  }

  if (!character.role || character.role.trim().length === 0) {
    errors.push('Character role is required');
  }

  // Validate color hex codes
  const hexPattern = /^#[0-9A-Fa-f]{6}$/;
  if (!hexPattern.test(character.color)) {
    errors.push('Primary color must be a valid hex code');
  }

  return errors;
}
