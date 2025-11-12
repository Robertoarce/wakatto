-- Add character_id column to messages table for multi-character conversations
-- This allows each assistant message to be associated with a specific character

ALTER TABLE messages
ADD COLUMN IF NOT EXISTS character_id TEXT;

-- Add index for faster queries on character_id
CREATE INDEX IF NOT EXISTS idx_messages_character_id ON messages(character_id);

-- Add comment to document the column
COMMENT ON COLUMN messages.character_id IS 'ID of the character (from characters.ts config) that generated this message. NULL for user messages or single-character conversations.';
