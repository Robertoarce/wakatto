-- Migration: Fix ALL RLS Recursion Issues
-- Created: 2025-12-29
-- Description: Uses SECURITY DEFINER functions to break circular policy dependencies

-- ============================================
-- 1. CREATE HELPER FUNCTIONS (SECURITY DEFINER)
-- ============================================
-- These bypass RLS and break the recursion cycle

-- Check if user is owner of a conversation
CREATE OR REPLACE FUNCTION is_conversation_owner(conv_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM conversations
    WHERE id = conv_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is a participant in a conversation
CREATE OR REPLACE FUNCTION is_conversation_participant(conv_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = conv_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user has access to a conversation (owner OR participant)
CREATE OR REPLACE FUNCTION has_conversation_access(conv_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN is_conversation_owner(conv_id) OR is_conversation_participant(conv_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- 2. FIX CONVERSATIONS RLS POLICIES
-- ============================================
DROP POLICY IF EXISTS "conversations_select" ON conversations;
DROP POLICY IF EXISTS "conversations_insert" ON conversations;
DROP POLICY IF EXISTS "conversations_update" ON conversations;
DROP POLICY IF EXISTS "conversations_delete" ON conversations;

-- SELECT: Use helper function to avoid recursion
CREATE POLICY "conversations_select" ON conversations FOR SELECT USING (
  auth.uid() = user_id OR is_conversation_participant(id)
);

-- INSERT: Only authenticated users can create their own conversations
CREATE POLICY "conversations_insert" ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Only owner can update
CREATE POLICY "conversations_update" ON conversations FOR UPDATE
  USING (auth.uid() = user_id);

-- DELETE: Only owner can delete
CREATE POLICY "conversations_delete" ON conversations FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 3. FIX CONVERSATION_PARTICIPANTS RLS POLICIES
-- ============================================
DROP POLICY IF EXISTS "participants_select" ON conversation_participants;
DROP POLICY IF EXISTS "participants_insert" ON conversation_participants;
DROP POLICY IF EXISTS "participants_update" ON conversation_participants;
DROP POLICY IF EXISTS "participants_delete" ON conversation_participants;

-- SELECT: Owner can see all participants, participants can see their own row
CREATE POLICY "participants_select" ON conversation_participants FOR SELECT USING (
  is_conversation_owner(conversation_id) OR user_id = auth.uid()
);

-- INSERT: Only conversation owner can add participants
CREATE POLICY "participants_insert" ON conversation_participants FOR INSERT WITH CHECK (
  is_conversation_owner(conversation_id)
);

-- UPDATE: Only conversation owner can change roles
CREATE POLICY "participants_update" ON conversation_participants FOR UPDATE USING (
  is_conversation_owner(conversation_id)
);

-- DELETE: Owner can remove anyone, users can remove themselves (leave)
CREATE POLICY "participants_delete" ON conversation_participants FOR DELETE USING (
  is_conversation_owner(conversation_id) OR user_id = auth.uid()
);

-- ============================================
-- 4. FIX MESSAGES RLS POLICIES
-- ============================================
DROP POLICY IF EXISTS "messages_select" ON messages;
DROP POLICY IF EXISTS "messages_insert" ON messages;
DROP POLICY IF EXISTS "messages_update" ON messages;
DROP POLICY IF EXISTS "messages_delete" ON messages;

-- SELECT: Owner or participant can read messages
CREATE POLICY "messages_select" ON messages FOR SELECT USING (
  has_conversation_access(conversation_id)
);

-- INSERT: Owner or editor can send messages
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (
  is_conversation_owner(conversation_id) OR
  EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id
    AND cp.user_id = auth.uid()
    AND cp.role IN ('owner', 'editor')
  )
);

-- UPDATE: Only owner can edit messages
CREATE POLICY "messages_update" ON messages FOR UPDATE USING (
  is_conversation_owner(conversation_id)
);

-- DELETE: Only owner can delete messages
CREATE POLICY "messages_delete" ON messages FOR DELETE USING (
  is_conversation_owner(conversation_id)
);

-- ============================================
-- 5. FIX CONVERSATION_INVITES RLS POLICIES
-- ============================================
DROP POLICY IF EXISTS "invites_select" ON conversation_invites;
DROP POLICY IF EXISTS "invites_insert" ON conversation_invites;
DROP POLICY IF EXISTS "invites_update" ON conversation_invites;
DROP POLICY IF EXISTS "invites_delete" ON conversation_invites;

-- SELECT: Anyone can see invites (needed to join via code)
CREATE POLICY "invites_select" ON conversation_invites FOR SELECT USING (true);

-- INSERT: Only conversation owner can create invites
CREATE POLICY "invites_insert" ON conversation_invites FOR INSERT WITH CHECK (
  is_conversation_owner(conversation_id)
);

-- UPDATE: Only conversation owner can update invites
CREATE POLICY "invites_update" ON conversation_invites FOR UPDATE USING (
  is_conversation_owner(conversation_id)
);

-- DELETE: Only conversation owner can delete invites
CREATE POLICY "invites_delete" ON conversation_invites FOR DELETE USING (
  is_conversation_owner(conversation_id)
);

-- ============================================
-- 6. FIX CONVERSATION_PRESENCE RLS POLICIES
-- ============================================
DROP POLICY IF EXISTS "presence_select" ON conversation_presence;
DROP POLICY IF EXISTS "presence_insert" ON conversation_presence;
DROP POLICY IF EXISTS "presence_update" ON conversation_presence;
DROP POLICY IF EXISTS "presence_delete" ON conversation_presence;

-- SELECT: Anyone with access can see presence
CREATE POLICY "presence_select" ON conversation_presence FOR SELECT USING (
  has_conversation_access(conversation_id)
);

-- INSERT: Users can set their own presence if they have access
CREATE POLICY "presence_insert" ON conversation_presence FOR INSERT WITH CHECK (
  user_id = auth.uid() AND has_conversation_access(conversation_id)
);

-- UPDATE: Users can only update their own presence
CREATE POLICY "presence_update" ON conversation_presence FOR UPDATE USING (
  user_id = auth.uid()
);

-- DELETE: Users can only delete their own presence
CREATE POLICY "presence_delete" ON conversation_presence FOR DELETE USING (
  user_id = auth.uid()
);
