-- Add is_tutorial flag to conversations table
-- This identifies the special tutorial conversation with BOB
-- Only ONE tutorial conversation is allowed per user

-- Add the is_tutorial column
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS is_tutorial BOOLEAN DEFAULT FALSE;

-- Create unique partial index to ensure only ONE tutorial per user
-- This prevents race conditions when multiple tabs/sessions try to create tutorials
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_tutorial_per_user
ON conversations (user_id)
WHERE is_tutorial = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN conversations.is_tutorial IS 'Flag indicating this is the special tutorial conversation with BOB. Only one allowed per user.';
