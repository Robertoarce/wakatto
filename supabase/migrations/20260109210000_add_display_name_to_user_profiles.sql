-- Add display_name column to user_profiles
-- Allows users to have a friendly name instead of just email

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Create index for searching by display name
CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name ON user_profiles(display_name);

-- Update RLS policy to allow users to see other users' basic info (for participant lists)
-- Drop existing restrictive policy if it exists
DROP POLICY IF EXISTS "Users can view other profiles basic info" ON user_profiles;

-- Create policy that allows viewing basic info of other users (id, email, display_name)
-- This is needed for conversation participant lists
CREATE POLICY "Users can view other profiles basic info"
  ON user_profiles FOR SELECT
  USING (true);  -- Allow authenticated users to see profiles

-- Note: The "Users can view own profile" policy is still in place but this broader policy
-- takes precedence for SELECT operations

COMMENT ON COLUMN user_profiles.display_name IS 'Optional display name shown instead of email in conversations';

