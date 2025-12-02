/**
 * Custom Wakattors Service
 *
 * CRUD operations for user-created AI characters stored in Supabase
 */

import { supabase } from '../lib/supabase';
import { CharacterBehavior } from '../config/characters';

export interface CustomWakattor {
  id: string;
  user_id: string;
  character_id: string;
  name: string;
  description: string;
  color: string;
  role: string;
  system_prompt: string;
  response_style: string;
  customization: Record<string, any>;
  model3d: Record<string, any>;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Convert CharacterBehavior to database format
 */
function characterToDBFormat(character: CharacterBehavior, userId: string): Omit<CustomWakattor, 'id' | 'created_at' | 'updated_at'> {
  return {
    user_id: userId,
    character_id: character.id,
    name: character.name,
    description: character.description,
    color: character.color,
    role: character.role,
    system_prompt: character.systemPrompt,
    response_style: character.responseStyle,
    customization: character.customization,
    model3d: character.model3D,
    is_public: false,
  };
}

/**
 * Convert database record to CharacterBehavior
 */
function dbToCharacterFormat(dbRecord: CustomWakattor): CharacterBehavior {
  return {
    id: dbRecord.character_id,
    name: dbRecord.name,
    description: dbRecord.description,
    color: dbRecord.color,
    role: dbRecord.role,
    systemPrompt: dbRecord.system_prompt,
    responseStyle: dbRecord.response_style,
    model3D: dbRecord.model3d as any,
    customization: dbRecord.customization as any,
  };
}

/**
 * Create a new custom wakattor
 */
export async function createCustomWakattor(character: CharacterBehavior): Promise<CharacterBehavior> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const dbData = characterToDBFormat(character, user.id);

  const { data, error } = await supabase
    .from('custom_wakattors')
    .insert(dbData)
    .select()
    .single();

  if (error) {
    console.error('[CustomWakattors] Create error:', error);
    throw new Error(`Failed to create character: ${error.message}`);
  }

  return dbToCharacterFormat(data);
}

/**
 * Get all custom wakattors (user's own + public ones)
 */
export async function getCustomWakattors(): Promise<CharacterBehavior[]> {
  const { data, error } = await supabase
    .from('custom_wakattors')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[CustomWakattors] Fetch error:', error);
    throw new Error(`Failed to fetch characters: ${error.message}`);
  }

  return data.map(dbToCharacterFormat);
}

/**
 * Get a specific custom wakattor by character_id
 */
export async function getCustomWakattor(characterId: string): Promise<CharacterBehavior | null> {
  const { data, error } = await supabase
    .from('custom_wakattors')
    .select('*')
    .eq('character_id', characterId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    console.error('[CustomWakattors] Fetch error:', error);
    throw new Error(`Failed to fetch character: ${error.message}`);
  }

  return dbToCharacterFormat(data);
}

/**
 * Update an existing custom wakattor
 */
export async function updateCustomWakattor(character: CharacterBehavior): Promise<CharacterBehavior> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const dbData = characterToDBFormat(character, user.id);

  const { data, error } = await supabase
    .from('custom_wakattors')
    .update(dbData)
    .eq('character_id', character.id)
    .select()
    .single();

  if (error) {
    console.error('[CustomWakattors] Update error:', error);
    throw new Error(`Failed to update character: ${error.message}`);
  }

  return dbToCharacterFormat(data);
}

/**
 * Delete a custom wakattor
 */
export async function deleteCustomWakattor(characterId: string): Promise<void> {
  const { error } = await supabase
    .from('custom_wakattors')
    .delete()
    .eq('character_id', characterId);

  if (error) {
    console.error('[CustomWakattors] Delete error:', error);
    throw new Error(`Failed to delete character: ${error.message}`);
  }
}

/**
 * Make a character public (share with all users)
 */
export async function makeCharacterPublic(characterId: string, isPublic: boolean): Promise<void> {
  const { error } = await supabase
    .from('custom_wakattors')
    .update({ is_public: isPublic })
    .eq('character_id', characterId);

  if (error) {
    console.error('[CustomWakattors] Update public status error:', error);
    throw new Error(`Failed to update character visibility: ${error.message}`);
  }
}

/**
 * Check if a character_id already exists
 */
export async function characterIdExists(characterId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('custom_wakattors')
    .select('character_id', { count: 'exact', head: true })
    .eq('character_id', characterId);

  if (error) {
    console.error('[CustomWakattors] Check existence error:', error);
    return false;
  }

  return (count || 0) > 0;
}

/**
 * Add a character from the library to user's wakattors
 * Converts CustomWakattor (library format) to user's collection
 */
export async function addCharacterToWakattors(libraryCharacter: CustomWakattor): Promise<{ success: boolean; characterId: string; alreadyExists?: boolean }> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Check if character already exists in user's collection
  const exists = await characterIdExists(libraryCharacter.character_id);
  if (exists) {
    return { success: true, characterId: libraryCharacter.character_id, alreadyExists: true };
  }

  // Add character to user's collection
  const dbData = {
    user_id: user.id,
    character_id: libraryCharacter.character_id,
    name: libraryCharacter.name,
    description: libraryCharacter.description,
    color: libraryCharacter.color,
    role: libraryCharacter.role,
    system_prompt: libraryCharacter.system_prompt,
    response_style: libraryCharacter.response_style,
    customization: libraryCharacter.customization,
    model3d: libraryCharacter.model3d,
    is_public: false,
  };

  const { data, error } = await supabase
    .from('custom_wakattors')
    .insert(dbData)
    .select()
    .single();

  if (error) {
    console.error('[CustomWakattors] Add to wakattors error:', error);
    throw new Error(`Failed to add character: ${error.message}`);
  }

  return { success: true, characterId: libraryCharacter.character_id };
}
