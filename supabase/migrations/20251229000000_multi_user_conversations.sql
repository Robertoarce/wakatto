-- Migration: Multi-User Real-Time Conversations
-- Created: 2025-12-29
-- Description: Adds support for multiple users in the same conversation with real-time updates

-- ============================================
-- 1. CONVERSATION PARTICIPANTS TABLE
-- ============================================
-- Tracks which users have access to which conversations
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON conversation_participants(user_id);

-- ============================================
-- 2. CONVERSATION INVITES TABLE
-- ============================================
-- Manages invite links and room codes for joining conversations
CREATE TABLE IF NOT EXISTS conversation_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL, -- Short alphanumeric code (e.g., "ABC123")
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('editor', 'viewer')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ, -- NULL means never expires
  max_uses INT, -- NULL means unlimited
  use_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for code lookups
CREATE INDEX IF NOT EXISTS idx_invites_code ON conversation_invites(code);
CREATE INDEX IF NOT EXISTS idx_invites_conversation ON conversation_invites(conversation_id);

-- ============================================
-- 3. PRESENCE TRACKING TABLE
-- ============================================
-- Tracks who is online and typing in each conversation
CREATE TABLE IF NOT EXISTS conversation_presence (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_typing BOOLEAN DEFAULT FALSE,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

-- Index for conversation presence queries
CREATE INDEX IF NOT EXISTS idx_presence_conversation ON conversation_presence(conversation_id);

-- ============================================
-- 4. ADD VISIBILITY COLUMN TO CONVERSATIONS
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'visibility'
  ) THEN
    ALTER TABLE conversations ADD COLUMN visibility TEXT DEFAULT 'private';
    ALTER TABLE conversations ADD CONSTRAINT conversations_visibility_check
      CHECK (visibility IN ('private', 'shared'));
  END IF;
END $$;

-- ============================================
-- 5. UPDATE CONVERSATIONS RLS POLICIES
-- ============================================
-- Drop existing policies
DROP POLICY IF EXISTS "Enable read for users based on user_id" ON conversations;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON conversations;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON conversations;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON conversations;
DROP POLICY IF EXISTS "conversations_select" ON conversations;
DROP POLICY IF EXISTS "conversations_insert" ON conversations;
DROP POLICY IF EXISTS "conversations_update" ON conversations;
DROP POLICY IF EXISTS "conversations_delete" ON conversations;

-- SELECT: Owner OR participant can read
CREATE POLICY "conversations_select" ON conversations FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = conversations.id
    AND conversation_participants.user_id = auth.uid()
  )
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
-- 6. UPDATE MESSAGES RLS POLICIES
-- ============================================
-- Drop existing policies
DROP POLICY IF EXISTS "Enable read messages through conversation ownership" ON messages;
DROP POLICY IF EXISTS "Enable insert messages through conversation ownership" ON messages;
DROP POLICY IF EXISTS "Enable update messages through conversation ownership" ON messages;
DROP POLICY IF EXISTS "Enable delete messages through conversation ownership" ON messages;
DROP POLICY IF EXISTS "messages_select" ON messages;
DROP POLICY IF EXISTS "messages_insert" ON messages;
DROP POLICY IF EXISTS "messages_update" ON messages;
DROP POLICY IF EXISTS "messages_delete" ON messages;

-- SELECT: Owner or participant can read messages
CREATE POLICY "messages_select" ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id AND (
      c.user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM conversation_participants cp
        WHERE cp.conversation_id = c.id AND cp.user_id = auth.uid()
      )
    )
  )
);

-- INSERT: Owner or editor can send messages
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id AND (
      c.user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM conversation_participants cp
        WHERE cp.conversation_id = c.id
        AND cp.user_id = auth.uid()
        AND cp.role IN ('owner', 'editor')
      )
    )
  )
);

-- UPDATE: Only owner can edit messages
CREATE POLICY "messages_update" ON messages FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id AND c.user_id = auth.uid()
  )
);

-- DELETE: Only owner can delete messages
CREATE POLICY "messages_delete" ON messages FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id AND c.user_id = auth.uid()
  )
);

-- ============================================
-- 7. ENABLE RLS ON NEW TABLES
-- ============================================
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_presence ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. RLS POLICIES FOR CONVERSATION_PARTICIPANTS
-- ============================================
-- SELECT: Can see participants if you're owner or a participant
CREATE POLICY "participants_select" ON conversation_participants FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_participants.conversation_id AND (
      c.user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM conversation_participants cp
        WHERE cp.conversation_id = c.id AND cp.user_id = auth.uid()
      )
    )
  )
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
-- 9. RLS POLICIES FOR CONVERSATION_INVITES
-- ============================================
-- SELECT: Anyone can view invites (needed to accept them)
CREATE POLICY "invites_select" ON conversation_invites FOR SELECT USING (
  -- Owner can see all their conversation invites
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_invites.conversation_id AND c.user_id = auth.uid()
  )
  -- Anyone can see invites by code (for joining)
  OR TRUE
);

-- INSERT: Only conversation owner can create invites
CREATE POLICY "invites_insert" ON conversation_invites FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id AND c.user_id = auth.uid()
  )
);

-- UPDATE: Only conversation owner can update invites
CREATE POLICY "invites_update" ON conversation_invites FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_invites.conversation_id AND c.user_id = auth.uid()
  )
);

-- DELETE: Only conversation owner can delete invites
CREATE POLICY "invites_delete" ON conversation_invites FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_invites.conversation_id AND c.user_id = auth.uid()
  )
);

-- ============================================
-- 10. RLS POLICIES FOR CONVERSATION_PRESENCE
-- ============================================
-- SELECT: Participants can see presence in their conversations
CREATE POLICY "presence_select" ON conversation_presence FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_presence.conversation_id AND (
      c.user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM conversation_participants cp
        WHERE cp.conversation_id = c.id AND cp.user_id = auth.uid()
      )
    )
  )
);

-- INSERT: Participants can set their own presence
CREATE POLICY "presence_insert" ON conversation_presence FOR INSERT WITH CHECK (
  conversation_presence.user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id AND (
      c.user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM conversation_participants cp
        WHERE cp.conversation_id = c.id AND cp.user_id = auth.uid()
      )
    )
  )
);

-- UPDATE: Users can only update their own presence
CREATE POLICY "presence_update" ON conversation_presence FOR UPDATE USING (
  conversation_presence.user_id = auth.uid()
);

-- DELETE: Users can only delete their own presence
CREATE POLICY "presence_delete" ON conversation_presence FOR DELETE USING (
  conversation_presence.user_id = auth.uid()
);

-- ============================================
-- 11. ENABLE REALTIME FOR TABLES
-- ============================================
-- This allows Supabase Realtime to broadcast changes
DO $$
BEGIN
  -- Check if supabase_realtime publication exists
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    -- Add tables to realtime publication if not already added
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE messages;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = 'conversation_presence'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE conversation_presence;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = 'conversation_participants'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;
    END IF;
  END IF;
END $$;

-- ============================================
-- 12. HELPER FUNCTION: Generate Invite Code
-- ============================================
CREATE OR REPLACE FUNCTION generate_invite_code(length INT DEFAULT 6)
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Avoid confusing chars (0,O,I,1)
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INT, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 13. FUNCTION: Join Conversation via Invite
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

  -- Check if user is the owner
  IF EXISTS (
    SELECT 1 FROM conversations
    WHERE id = invite_record.conversation_id AND user_id = auth.uid()
  ) THEN
    RETURN json_build_object('success', false, 'error', 'You are the owner of this conversation');
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
