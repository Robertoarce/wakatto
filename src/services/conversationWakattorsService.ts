/**
 * Conversation Wakattors Service
 * Queries which wakattors (characters) have appeared in user's conversations
 */

import { supabase } from '../lib/supabase';
import { CharacterBehavior, getCharacter } from '../config/characters';
import { getCustomWakattors } from './customWakattorsService';

/**
 * Get unique character IDs that have appeared in user's conversations
 * Returns up to 50 most recent characters, sorted by last appearance
 */
export async function getWakattorsInConversations(): Promise<string[]> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('[ConversationWakattors] No authenticated user');
      return [];
    }

    // Query messages table for unique character IDs in user's conversations
    const { data, error } = await supabase.rpc('get_conversation_character_ids', {
      p_user_id: user.id
    });

    if (error) {
      console.error('[ConversationWakattors] RPC error:', error);

      // Fallback to direct query if RPC doesn't exist
      const { data: messages, error: queryError } = await supabase
        .from('messages')
        .select(`
          character_id,
          created_at,
          conversation:conversations!inner(user_id)
        `)
        .eq('conversation.user_id', user.id)
        .eq('role', 'assistant')
        .not('character_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(500); // Get last 500 messages to find unique characters

      if (queryError) {
        console.error('[ConversationWakattors] Query error:', queryError);
        return [];
      }

      // Extract unique character IDs and sort by most recent
      const characterMap = new Map<string, number>();
      messages?.forEach((msg: any) => {
        const charId = msg.character_id;
        const timestamp = new Date(msg.created_at).getTime();
        if (!characterMap.has(charId) || characterMap.get(charId)! < timestamp) {
          characterMap.set(charId, timestamp);
        }
      });

      // Sort by most recent and limit to 50
      const sortedCharacters = Array.from(characterMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 50)
        .map(([charId]) => charId);

      console.log(`[ConversationWakattors] Found ${sortedCharacters.length} unique characters`);
      return sortedCharacters;
    }

    // RPC succeeded
    const characterIds = data?.map((row: any) => row.character_id) || [];
    console.log(`[ConversationWakattors] Found ${characterIds.length} unique characters via RPC`);
    return characterIds;

  } catch (error) {
    console.error('[ConversationWakattors] Error:', error);
    return [];
  }
}

/**
 * Fetch full character data for multiple character IDs
 * Handles both built-in characters and custom wakattors
 */
export async function getCharactersByIds(characterIds: string[]): Promise<CharacterBehavior[]> {
  if (characterIds.length === 0) {
    return [];
  }

  try {
    const characters: CharacterBehavior[] = [];

    // Load all custom wakattors
    const customWakattors = await getCustomWakattors();
    const customWakattorsMap = new Map(customWakattors.map(c => [c.id, c]));

    // For each character ID, get the character data
    for (const charId of characterIds) {
      // Try custom wakattors first
      if (customWakattorsMap.has(charId)) {
        characters.push(customWakattorsMap.get(charId)!);
      } else {
        // Try built-in characters
        try {
          const builtInChar = getCharacter(charId);
          if (builtInChar) {
            characters.push(builtInChar);
          }
        } catch (error) {
          console.warn(`[ConversationWakattors] Character ${charId} not found`);
        }
      }
    }

    console.log(`[ConversationWakattors] Loaded ${characters.length}/${characterIds.length} characters`);
    return characters;

  } catch (error) {
    console.error('[ConversationWakattors] Error fetching characters:', error);
    return [];
  }
}

/**
 * Check if a character exists in user's collection
 */
export async function isCharacterInCollection(characterId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return false;
    }

    const { data, error } = await supabase
      .from('custom_wakattors')
      .select('id')
      .eq('character_id', characterId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('[ConversationWakattors] Error checking collection:', error);
      return false;
    }

    return !!data;

  } catch (error) {
    console.error('[ConversationWakattors] Error:', error);
    return false;
  }
}
