-- Migration: Add sender_id to messages table
-- This allows tracking which user sent a message in shared conversations
-- For user messages, sender_id is the user who sent the message
-- For assistant messages, sender_id is NULL (AI generated)

-- Add sender_id column to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES auth.users(id);

-- Create index for faster queries on sender_id
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

-- Add sender_name to metadata for display purposes in shared conversations
-- This is optional - we can also look up the name from user_profiles
COMMENT ON COLUMN messages.sender_id IS 'User ID of the sender for user messages. NULL for assistant/system messages.';

