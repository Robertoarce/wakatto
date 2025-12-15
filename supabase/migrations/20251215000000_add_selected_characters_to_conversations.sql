-- Add selected_characters column to conversations table
-- This stores the user's explicitly selected characters for a conversation
-- as a JSONB array of character IDs

ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS selected_characters JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN conversations.selected_characters IS 'Array of character IDs explicitly selected by user for this conversation';
