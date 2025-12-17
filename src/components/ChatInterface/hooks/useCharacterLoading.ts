/**
 * useCharacterLoading - Load and merge built-in + custom characters
 */

import { useState, useEffect } from 'react';
import { getAllCharacters, registerCustomCharacters, CharacterBehavior } from '../../../config/characters';
import { getCustomWakattors } from '../../../services/customWakattorsService';

interface UseCharacterLoadingResult {
  availableCharacters: CharacterBehavior[];
  isLoadingCharacters: boolean;
}

export function useCharacterLoading(): UseCharacterLoadingResult {
  const [availableCharacters, setAvailableCharacters] = useState(getAllCharacters());
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(true);

  // Load ALL characters - combine built-in + database characters
  useEffect(() => {
    const loadAllCharacters = async () => {
      try {
        // Get built-in characters
        const builtInCharacters = getAllCharacters();

        // Get database characters (from Supabase)
        const dbCharacters = await getCustomWakattors();

        // Combine both, with database characters first (they include Marcus Aurelius, etc.)
        // Use a Map to deduplicate by ID (database versions take priority)
        const characterMap = new Map<string, CharacterBehavior>();

        // Add built-in first
        builtInCharacters.forEach(char => characterMap.set(char.id, char));

        // Then add database characters (overwrites duplicates)
        dbCharacters.forEach(char => characterMap.set(char.id, char));

        const allCharacters = Array.from(characterMap.values());

        // IMPORTANT: Register database characters to the global registry
        // This makes them available to getCharacter() for AI responses
        registerCustomCharacters(dbCharacters);
        console.log('[useCharacterLoading] Registered', dbCharacters.length, 'database characters to global registry');

        setAvailableCharacters(allCharacters);
        console.log('[useCharacterLoading] Loaded', allCharacters.length, 'characters (', builtInCharacters.length, 'built-in +', dbCharacters.length, 'from database)');
      } catch (error) {
        console.error('[useCharacterLoading] Failed to load characters:', error);
        // Fallback to built-in only
        setAvailableCharacters(getAllCharacters());
      } finally {
        setIsLoadingCharacters(false);
      }
    };

    loadAllCharacters();
  }, []);

  return {
    availableCharacters,
    isLoadingCharacters,
  };
}

export default useCharacterLoading;
