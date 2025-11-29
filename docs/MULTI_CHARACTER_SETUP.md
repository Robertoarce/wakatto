# Multi-Character Conversation Setup

## Overview

The Wakatto app now supports multi-character conversations! You can select up to 5 characters to participate in the same conversation, and each character will respond with their unique personality.

## Features

- **Character Selection**: Choose 1-5 characters from the available Wakattors
- **Multi-Character Display**: All selected characters appear side-by-side in the 3D view
- **Character-Specific Responses**: Each character responds with their own personality using their unique system prompt
- **Visual Differentiation**:
  - User messages are centered
  - Character messages alternate between left and right positions
  - Each character's messages have their signature color
  - Character names are displayed on their messages

## Database Migration Required

Before using the multi-character feature, you need to add the `character_id` column to your messages table.

### Option 1: Using Supabase CLI

```bash
# Make sure you're logged in and linked to your project
supabase db push
```

This will apply the migration file at `supabase/migrations/add_character_id_to_messages.sql`.

### Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the following SQL:

```sql
-- Add character_id column to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS character_id TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_character_id ON messages(character_id);

-- Add documentation comment
COMMENT ON COLUMN messages.character_id IS 'ID of the character (from characters.ts config) that generated this message. NULL for user messages or single-character conversations.';
```

## How to Use

1. **Start the app**: Run `npm run web` to start the development server
2. **Open the Chat tab**: Navigate to the Chat interface
3. **Select Characters**:
   - Click the character selector button in the top-left of the 3D character display
   - It shows the current number of selected characters (e.g., "2 Characters")
   - A panel will appear with all available characters
   - Click characters to toggle their selection (minimum 1, maximum 5)
   - Selected characters have a checkmark and highlighted background
4. **Send a Message**: Type your message and press send
5. **View Responses**: Each selected character will respond in order with their unique perspective

## Character Personalities

### Freud (Purple)
- Analytical and introspective
- Focuses on unconscious motivations
- Direct but compassionate observations
- Classic psychoanalytic approach

### Jung (Cyan)
- Explores symbolic meanings and archetypes
- Interested in dreams and spirituality
- Holistic view of personal growth
- Warm and supportive tone

### Adler (Green)
- Practical and solution-focused
- Emphasizes strengths and personal power
- Goal-oriented and empowering
- Optimistic approach

## Technical Details

### Modified Files

1. **src/components/ChatInterface.tsx**
   - Added character selection UI
   - Updated message layout (centered user, alternating characters)
   - Added character colors and names to messages
   - Updated `onSendMessage` to pass `selectedCharacters`

2. **src/navigation/MainTabs.tsx**
   - Updated `handleSendMessage` to accept `selectedCharacters` parameter
   - Implemented loop to generate responses from each character
   - Each character uses their own system prompt from `characters.ts`
   - Proper error handling for individual character failures

3. **src/store/actions/conversationActions.ts**
   - Added optional `characterId` parameter to `saveMessage`
   - Database inserts now include `character_id` field
   - Message loading maps `character_id` to `characterId` for TypeScript
   - Added message in `addMessage` dispatch

4. **src/config/characters.ts**
   - Character configuration with unique system prompts
   - Each character has distinct traits and response styles

### Message Flow

1. User sends a message
2. Message is saved to database with role='user' (no character_id)
3. For each selected character:
   - System retrieves character config
   - Generates AI response using character's system prompt
   - Saves message with role='assistant' and character_id
4. UI displays messages with character-specific colors and positions

### Database Schema

The `messages` table now includes:
- `id`: UUID (primary key)
- `conversation_id`: UUID (foreign key)
- `role`: TEXT ('user' or 'assistant')
- `content`: TEXT
- `character_id`: TEXT (nullable, stores character ID from config)
- `created_at`: TIMESTAMP

## Testing the Feature

1. **Single Character** (baseline):
   - Select only one character
   - Verify responses work as before

2. **Two Characters**:
   - Select two characters (e.g., Freud and Jung)
   - Send a message like "I had a strange dream about flying"
   - Verify both characters respond with their unique perspectives
   - Check that messages alternate left/right
   - Verify colors match each character

3. **Five Characters** (maximum):
   - Select all available characters
   - Send a message
   - Verify all characters respond
   - Check 3D display shows all 5 characters side-by-side

4. **Character Switching**:
   - Start with one character selected
   - Send a message
   - Add more characters
   - Send another message
   - Verify new characters join the conversation

## Troubleshooting

### Issue: Characters not responding
- Check that the database migration was applied successfully
- Verify API key is configured in Settings
- Check browser console for error messages
- Ensure Supabase Edge Function is deployed

### Issue: Messages not showing character names
- Clear browser cache and reload
- Check that `character_id` is being saved to database
- Verify message mapping in `conversationActions.ts`

### Issue: 3D characters overlapping
- Check that character display uses flexbox layout
- Verify `flex: 1 / selectedCharacters.length` is applied correctly

## Future Enhancements

Potential improvements for the multi-character system:
- Character turn-taking logic (round-robin vs. all-at-once)
- Character-to-character dialogue
- Custom character creation in the UI
- Voice selection per character
- Animation states triggered by character mood
- Character memory and conversation context
