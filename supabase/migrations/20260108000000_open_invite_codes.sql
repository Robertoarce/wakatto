-- Migration: Add support for open invite codes
-- Open invites are shareable codes not tied to a specific email address

-- Make invitee_email nullable for open invites
ALTER TABLE invitations ALTER COLUMN invitee_email DROP NOT NULL;

-- Add invite_type column to distinguish between email and open invites
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS invite_type TEXT NOT NULL DEFAULT 'email' 
  CHECK (invite_type IN ('email', 'open'));

-- Add max_uses for limiting how many times an open invite can be used
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS max_uses INTEGER;

-- Add use_count to track how many times an open invite has been used
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS use_count INTEGER NOT NULL DEFAULT 0;

-- Add constraint: email invites must have an email, open invites must not
ALTER TABLE invitations DROP CONSTRAINT IF EXISTS check_invite_type_email;
ALTER TABLE invitations ADD CONSTRAINT check_invite_type_email 
  CHECK (
    (invite_type = 'email' AND invitee_email IS NOT NULL) OR
    (invite_type = 'open' AND invitee_email IS NULL)
  );

-- Create index for invite_type queries
CREATE INDEX IF NOT EXISTS idx_invitations_invite_type ON invitations(invite_type);

-- Drop the existing function first (required when changing return type)
DROP FUNCTION IF EXISTS get_invitation_stats(UUID);

-- Recreate get_invitation_stats function with open invite stats
CREATE OR REPLACE FUNCTION get_invitation_stats(user_id UUID)
RETURNS TABLE (
  total_sent INTEGER,
  pending_count INTEGER,
  accepted_count INTEGER,
  total_rewards INTEGER,
  open_invite_count INTEGER,
  total_open_uses INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_sent,
    COUNT(*) FILTER (WHERE status = 'pending')::INTEGER as pending_count,
    COUNT(*) FILTER (WHERE status = 'accepted')::INTEGER as accepted_count,
    COALESCE(SUM(reward_amount) FILTER (WHERE rewarded = true), 0)::INTEGER as total_rewards,
    COUNT(*) FILTER (WHERE invite_type = 'open' AND status = 'pending')::INTEGER as open_invite_count,
    COALESCE(SUM(use_count) FILTER (WHERE invite_type = 'open'), 0)::INTEGER as total_open_uses
  FROM invitations
  WHERE inviter_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy: Users can delete their own open invites (hard delete)
DROP POLICY IF EXISTS "Users can delete own open invites" ON invitations;
CREATE POLICY "Users can delete own open invites"
  ON invitations FOR DELETE
  USING (auth.uid() = inviter_id AND invite_type = 'open');

-- Function to accept/use an open invite (increments use_count)
CREATE OR REPLACE FUNCTION use_open_invite(invite_code_param TEXT, user_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  invite_record RECORD;
BEGIN
  -- Get the invitation
  SELECT * INTO invite_record
  FROM invitations
  WHERE invite_code = invite_code_param
    AND invite_type = 'open'
    AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Check if max_uses is set and reached
  IF invite_record.max_uses IS NOT NULL AND invite_record.use_count >= invite_record.max_uses THEN
    RETURN FALSE;
  END IF;

  -- Increment use_count
  UPDATE invitations
  SET use_count = use_count + 1,
      metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{used_by}',
        COALESCE(metadata->'used_by', '[]'::jsonb) || to_jsonb(json_build_object('user_id', user_id_param, 'used_at', NOW()))
      )
  WHERE id = invite_record.id;

  -- If max_uses is reached after this use, mark as expired
  IF invite_record.max_uses IS NOT NULL AND invite_record.use_count + 1 >= invite_record.max_uses THEN
    UPDATE invitations
    SET status = 'expired'
    WHERE id = invite_record.id;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment updates
COMMENT ON COLUMN invitations.invite_type IS 'Type of invitation: email (sent to specific address) or open (shareable code)';
COMMENT ON COLUMN invitations.max_uses IS 'Maximum number of times an open invite can be used (NULL = unlimited)';
COMMENT ON COLUMN invitations.use_count IS 'Number of times an open invite has been used';

