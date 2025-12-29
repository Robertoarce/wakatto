-- Migration: Fix RLS Recursion in conversation_participants
-- Created: 2025-12-29
-- Description: Fixes infinite recursion in participants_select policy

-- ============================================
-- FIX: CONVERSATION_PARTICIPANTS RLS POLICIES
-- ============================================
-- The original policy caused infinite recursion because it checked
-- if user is a participant by querying conversation_participants itself.

-- Drop the problematic policies
DROP POLICY IF EXISTS "participants_select" ON conversation_participants;
DROP POLICY IF EXISTS "participants_insert" ON conversation_participants;
DROP POLICY IF EXISTS "participants_update" ON conversation_participants;
DROP POLICY IF EXISTS "participants_delete" ON conversation_participants;

-- SELECT: Simplified - can see if you're the owner OR you're directly in the table
-- This avoids recursion by not checking conversation_participants within itself
CREATE POLICY "participants_select" ON conversation_participants FOR SELECT USING (
  -- User is the conversation owner
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_participants.conversation_id
    AND c.user_id = auth.uid()
  )
  -- OR user is this participant row (direct check, no recursion)
  OR conversation_participants.user_id = auth.uid()
);

-- INSERT: Only conversation owner can add participants
CREATE POLICY "participants_insert" ON conversation_participants FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id AND c.user_id = auth.uid()
  )
);

-- UPDATE: Only conversation owner can change roles
CREATE POLICY "participants_update" ON conversation_participants FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_participants.conversation_id AND c.user_id = auth.uid()
  )
);

-- DELETE: Owner can remove anyone, users can remove themselves (leave)
CREATE POLICY "participants_delete" ON conversation_participants FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_participants.conversation_id AND c.user_id = auth.uid()
  ) OR conversation_participants.user_id = auth.uid()
);

-- ============================================
-- FIX: PRESENCE RLS POLICIES (same issue)
-- ============================================
DROP POLICY IF EXISTS "presence_select" ON conversation_presence;
DROP POLICY IF EXISTS "presence_insert" ON conversation_presence;

-- SELECT: Simplified - owner or own presence
CREATE POLICY "presence_select" ON conversation_presence FOR SELECT USING (
  -- User is the conversation owner
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_presence.conversation_id
    AND c.user_id = auth.uid()
  )
  -- OR this is the user's own presence
  OR conversation_presence.user_id = auth.uid()
);

-- INSERT: User can set their own presence if they're owner or participant
-- Use a simpler check to avoid recursion
CREATE POLICY "presence_insert" ON conversation_presence FOR INSERT WITH CHECK (
  conversation_presence.user_id = auth.uid() AND (
    -- User is owner
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
    -- OR user is a participant (direct join on participant's user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_presence.conversation_id
      AND cp.user_id = auth.uid()
    )
  )
);
