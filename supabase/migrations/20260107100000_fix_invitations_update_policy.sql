-- Fix invitations UPDATE RLS policy
-- The original policy only had USING clause, but UPDATE also needs WITH CHECK
-- to validate the new row state after the update

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can update own pending invitations" ON invitations;

-- Create the fixed policy with both USING and WITH CHECK clauses
-- USING: checks the OLD row (before update) - must be owned by user and pending
-- WITH CHECK: checks the NEW row (after update) - must still be owned by user
CREATE POLICY "Users can update own pending invitations"
  ON invitations FOR UPDATE
  USING (auth.uid() = inviter_id AND status = 'pending')
  WITH CHECK (auth.uid() = inviter_id);

-- Also add a policy to allow accepting invitations (updating accepted_at, accepted_by, status)
-- This allows any authenticated user to accept an invitation by code
DROP POLICY IF EXISTS "Users can accept invitations" ON invitations;

CREATE POLICY "Users can accept invitations"
  ON invitations FOR UPDATE
  USING (status = 'pending')
  WITH CHECK (
    status = 'accepted' 
    AND accepted_by = auth.uid()
  );

