-- Migration: Rename Roles
-- Created: 2026-01-06
-- Description: Renames roles from owner/editor/viewer to admin/participant/viewer

-- ============================================
-- 1. DROP OLD CONSTRAINTS FIRST (must happen before data update)
-- ============================================
ALTER TABLE conversation_participants DROP CONSTRAINT IF EXISTS conversation_participants_role_check;
ALTER TABLE conversation_invites DROP CONSTRAINT IF EXISTS conversation_invites_role_check;

-- ============================================
-- 2. UPDATE EXISTING DATA IN conversation_participants
-- ============================================
UPDATE conversation_participants SET role = 'admin' WHERE role = 'owner';
UPDATE conversation_participants SET role = 'participant' WHERE role = 'editor';

-- ============================================
-- 3. UPDATE EXISTING DATA IN conversation_invites
-- ============================================
UPDATE conversation_invites SET role = 'participant' WHERE role = 'editor';

-- ============================================
-- 4. ADD NEW CHECK CONSTRAINTS
-- ============================================
ALTER TABLE conversation_participants ADD CONSTRAINT conversation_participants_role_check 
  CHECK (role IN ('admin', 'participant', 'viewer'));

ALTER TABLE conversation_invites ADD CONSTRAINT conversation_invites_role_check 
  CHECK (role IN ('participant', 'viewer'));

-- ============================================
-- 5. UPDATE RLS POLICIES FOR MESSAGES
-- ============================================
-- Drop the old insert policy that references 'owner' and 'editor'
DROP POLICY IF EXISTS "messages_insert" ON messages;

-- Recreate with new role names: admin and participant can send messages
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id AND (
      c.user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM conversation_participants cp
        WHERE cp.conversation_id = c.id
        AND cp.user_id = auth.uid()
        AND cp.role IN ('admin', 'participant')
      )
    )
  )
);

-- ============================================
-- 6. UPDATE join_conversation_via_invite FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION join_conversation_via_invite(invite_code TEXT)
RETURNS JSON AS $$
DECLARE
  invite_record RECORD;
  result JSON;
BEGIN
  -- Find the invite
  SELECT * INTO invite_record
  FROM conversation_invites
  WHERE code = invite_code;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid invite code');
  END IF;

  -- Check if expired
  IF invite_record.expires_at IS NOT NULL AND invite_record.expires_at < NOW() THEN
    RETURN json_build_object('success', false, 'error', 'Invite has expired');
  END IF;

  -- Check if max uses reached
  IF invite_record.max_uses IS NOT NULL AND invite_record.use_count >= invite_record.max_uses THEN
    RETURN json_build_object('success', false, 'error', 'Invite has reached maximum uses');
  END IF;

  -- Check if user already a participant
  IF EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = invite_record.conversation_id AND user_id = auth.uid()
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Already a participant');
  END IF;

  -- Check if user is the admin (conversation creator)
  IF EXISTS (
    SELECT 1 FROM conversations
    WHERE id = invite_record.conversation_id AND user_id = auth.uid()
  ) THEN
    RETURN json_build_object('success', false, 'error', 'You are the admin of this conversation');
  END IF;

  -- Add user as participant
  INSERT INTO conversation_participants (conversation_id, user_id, role, invited_by)
  VALUES (invite_record.conversation_id, auth.uid(), invite_record.role, invite_record.created_by);

  -- Increment use count
  UPDATE conversation_invites SET use_count = use_count + 1 WHERE id = invite_record.id;

  -- Update conversation visibility
  UPDATE conversations SET visibility = 'shared' WHERE id = invite_record.conversation_id;

  RETURN json_build_object(
    'success', true,
    'conversation_id', invite_record.conversation_id,
    'role', invite_record.role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. UPDATE POLICY COMMENTS (for documentation)
-- ============================================
-- Note: The RLS policies that check c.user_id = auth.uid() for "owner" access
-- don't need to change because they check the conversations.user_id field,
-- not the role field. The conversation creator (admin) is identified by 
-- conversations.user_id, not by a role in conversation_participants.

