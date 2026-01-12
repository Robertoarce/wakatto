-- Migration: Add onboarding state tracking to user_profiles
-- This enables tracking of the free trial message count for new users

-- Add onboarding_message_count column (tracks exchanges with trial wakattors)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS onboarding_message_count INTEGER DEFAULT 0;

-- Add has_completed_onboarding column (true after hitting 5 messages)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT false;

-- Create index for quick lookups of users still in onboarding
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding 
ON user_profiles(has_completed_onboarding) 
WHERE has_completed_onboarding = false;

-- Function to increment onboarding message count
-- Returns the new count and whether onboarding is now complete
CREATE OR REPLACE FUNCTION increment_onboarding_message_count(p_user_id UUID)
RETURNS TABLE(new_count INTEGER, is_complete BOOLEAN) AS $$
DECLARE
  v_count INTEGER;
  v_complete BOOLEAN;
BEGIN
  -- Increment the count and get the new value
  UPDATE user_profiles
  SET 
    onboarding_message_count = onboarding_message_count + 1,
    has_completed_onboarding = CASE 
      WHEN onboarding_message_count + 1 >= 5 THEN true 
      ELSE has_completed_onboarding 
    END,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING onboarding_message_count, has_completed_onboarding
  INTO v_count, v_complete;

  RETURN QUERY SELECT v_count, v_complete;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current onboarding state
CREATE OR REPLACE FUNCTION get_onboarding_state(p_user_id UUID)
RETURNS TABLE(
  message_count INTEGER, 
  is_complete BOOLEAN, 
  remaining_messages INTEGER,
  tier TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(up.onboarding_message_count, 0)::INTEGER,
    COALESCE(up.has_completed_onboarding, false),
    GREATEST(0, 5 - COALESCE(up.onboarding_message_count, 0))::INTEGER,
    up.tier::TEXT
  FROM user_profiles up
  WHERE up.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_onboarding_message_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_onboarding_state(UUID) TO authenticated;

-- Comments
COMMENT ON COLUMN user_profiles.onboarding_message_count IS 'Number of message exchanges with trial wakattors (max 5 for free trial)';
COMMENT ON COLUMN user_profiles.has_completed_onboarding IS 'True when user has used all 5 free trial messages';
