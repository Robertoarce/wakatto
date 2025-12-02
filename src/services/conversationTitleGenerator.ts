/**
 * Conversation Title Generator
 *
 * Generates a discreet, respectful title for a conversation based on the first user message.
 */

import { generateAIResponse } from './aiService';

/**
 * Generate a conversation title from the first user message
 *
 * @param userMessage The first message in the conversation
 * @returns A short, discreet title (3-5 words)
 */
export async function generateConversationTitle(userMessage: string): Promise<string> {
  const titlePrompt = `You are a title generator for a therapy/counseling conversation app.

Generate a SHORT, DISCREET title (3-5 words maximum) for a conversation that starts with this user message:

"${userMessage}"

IMPORTANT GUIDELINES:
- Keep it SHORT (3-5 words max)
- Be DISCREET and RESPECTFUL of user privacy
- Do NOT reveal sensitive details
- Use general themes, not specific content
- Examples of GOOD titles:
  * "Managing Work Stress"
  * "Relationship Concerns"
  * "Personal Growth Journey"
  * "Anxiety and Coping"
  * "Career Decisions"

- Examples of BAD titles (too specific):
  * "Argument with spouse about money" ❌
  * "Fear of losing my job at Amazon" ❌
  * "My depression after breakup" ❌

Respond with ONLY the title, nothing else. No quotes, no explanation.`;

  try {
    const title = await generateAIResponse(
      [{ role: 'user', content: titlePrompt }],
      'You are a helpful assistant that generates short, discreet conversation titles.',
      'title-generator'
    );

    // Clean up the title (remove quotes, trim, limit length)
    let cleanedTitle = title.trim()
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/\n/g, ' ') // Remove newlines
      .trim();

    // Ensure it's not too long (max 50 characters)
    if (cleanedTitle.length > 50) {
      cleanedTitle = cleanedTitle.substring(0, 47) + '...';
    }

    // If title is empty or too short, use a generic fallback
    if (cleanedTitle.length < 3) {
      return 'New Conversation';
    }

    return cleanedTitle;

  } catch (error) {
    console.error('[TitleGenerator] Failed to generate title:', error);
    // Fallback to generic title on error
    return 'New Conversation';
  }
}
