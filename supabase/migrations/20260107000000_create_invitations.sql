-- Create invitations table to track user referrals
-- Users can invite others and be rewarded later

CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_email TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rewarded BOOLEAN NOT NULL DEFAULT FALSE,
  reward_amount INTEGER DEFAULT 0,
  rewarded_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_invitations_inviter_id ON invitations(inviter_id);
CREATE INDEX IF NOT EXISTS idx_invitations_invitee_email ON invitations(invitee_email);
CREATE INDEX IF NOT EXISTS idx_invitations_invite_code ON invitations(invite_code);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);

-- Enable RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own sent invitations
DROP POLICY IF EXISTS "Users can view own invitations" ON invitations;
CREATE POLICY "Users can view own invitations"
  ON invitations FOR SELECT
  USING (auth.uid() = inviter_id);

-- Policy: Users can create invitations
DROP POLICY IF EXISTS "Users can create invitations" ON invitations;
CREATE POLICY "Users can create invitations"
  ON invitations FOR INSERT
  WITH CHECK (auth.uid() = inviter_id);

-- Policy: Users can update their own pending invitations (e.g., cancel)
DROP POLICY IF EXISTS "Users can update own pending invitations" ON invitations;
CREATE POLICY "Users can update own pending invitations"
  ON invitations FOR UPDATE
  USING (auth.uid() = inviter_id AND status = 'pending')
  WITH CHECK (auth.uid() = inviter_id);

-- Policy: Anyone can view invitation by code (for accepting)
DROP POLICY IF EXISTS "Anyone can view invitation by code" ON invitations;
CREATE POLICY "Anyone can view invitation by code"
  ON invitations FOR SELECT
  USING (true);

-- Function to generate unique invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get invitation stats for a user
CREATE OR REPLACE FUNCTION get_invitation_stats(user_id UUID)
RETURNS TABLE (
  total_sent INTEGER,
  pending_count INTEGER,
  accepted_count INTEGER,
  total_rewards INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_sent,
    COUNT(*) FILTER (WHERE status = 'pending')::INTEGER as pending_count,
    COUNT(*) FILTER (WHERE status = 'accepted')::INTEGER as accepted_count,
    COALESCE(SUM(reward_amount) FILTER (WHERE rewarded = true), 0)::INTEGER as total_rewards
  FROM invitations
  WHERE inviter_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on table
COMMENT ON TABLE invitations IS 'Tracks user invitations for referral rewards program';

