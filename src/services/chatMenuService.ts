/**
 * Chat Menu Service
 *
 * Manages which Wakattors are available in the chat character selector.
 * Users can have up to 20 Wakattors total, but only add specific ones to their chat menu (max 10).
 */

const CHAT_MENU_KEY = 'wakatto_chat_menu_characters';

/**
 * Get all character IDs that are in the chat menu
 */
export function getChatMenuCharacters(): string[] {
  try {
    const stored = localStorage.getItem(CHAT_MENU_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('[ChatMenu] Error loading chat menu:', error);
    return [];
  }
}

/**
 * Add a character to the chat menu (max 10)
 */
export function addToChatMenu(characterId: string): { success: boolean; error?: string } {
  try {
    const current = getChatMenuCharacters();

    // Check if already in chat menu
    if (current.includes(characterId)) {
      return { success: false, error: 'Character already in chat menu' };
    }

    // Check limit
    if (current.length >= 10) {
      return { success: false, error: 'Chat menu is full (max 10 characters)' };
    }

    current.push(characterId);
    localStorage.setItem(CHAT_MENU_KEY, JSON.stringify(current));

    // Dispatch custom event to notify ChatInterface
    window.dispatchEvent(new Event('chatMenuUpdated'));

    return { success: true };
  } catch (error) {
    console.error('[ChatMenu] Error adding to chat menu:', error);
    return { success: false, error: 'Failed to add character' };
  }
}

/**
 * Remove a character from the chat menu
 */
export function removeFromChatMenu(characterId: string): { success: boolean; error?: string } {
  try {
    const current = getChatMenuCharacters();
    const filtered = current.filter(id => id !== characterId);

    if (filtered.length === current.length) {
      return { success: false, error: 'Character not in chat menu' };
    }

    localStorage.setItem(CHAT_MENU_KEY, JSON.stringify(filtered));

    // Dispatch custom event to notify ChatInterface
    window.dispatchEvent(new Event('chatMenuUpdated'));

    return { success: true };
  } catch (error) {
    console.error('[ChatMenu] Error removing from chat menu:', error);
    return { success: false, error: 'Failed to remove character' };
  }
}

/**
 * Check if a character is in the chat menu
 */
export function isInChatMenu(characterId: string): boolean {
  const current = getChatMenuCharacters();
  return current.includes(characterId);
}

/**
 * Get count of characters in chat menu
 */
export function getChatMenuCount(): number {
  return getChatMenuCharacters().length;
}

/**
 * Clear all characters from chat menu
 */
export function clearChatMenu(): void {
  localStorage.removeItem(CHAT_MENU_KEY);
}
