-- Psyche AI Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor to create all necessary tables

-- ============================================
-- CONVERSATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on conversations table
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own conversations
CREATE POLICY "Users can view own conversations" 
  ON conversations FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can only insert their own conversations
CREATE POLICY "Users can insert own conversations" 
  ON conversations FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own conversations
CREATE POLICY "Users can update own conversations" 
  ON conversations FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can only delete their own conversations
CREATE POLICY "Users can delete own conversations" 
  ON conversations FOR DELETE 
  USING (auth.uid() = user_id);

-- Enable RLS on messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can only see messages from their own conversations
CREATE POLICY "Users can view own messages" 
  ON messages FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

-- Users can only insert messages to their own conversations
CREATE POLICY "Users can insert own messages" 
  ON messages FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

-- Users can only update messages in their own conversations
CREATE POLICY "Users can update own messages" 
  ON messages FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

-- Users can only delete messages from their own conversations
CREATE POLICY "Users can delete own messages" 
  ON messages FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on conversations
CREATE TRIGGER update_conversations_updated_at 
  BEFORE UPDATE ON conversations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- OPTIONAL: ENTITIES & RELATIONSHIPS TABLES
-- (for Characters and Knowledge Graph features)
-- ============================================

-- Entities mentioned in diary (people, places, events, etc.)
CREATE TABLE IF NOT EXISTS entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT, -- 'person', 'place', 'event', 'topic', etc.
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entities_user_id ON entities(user_id);
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type);

-- Enable RLS on entities
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own entities" 
  ON entities FOR ALL 
  USING (auth.uid() = user_id);

-- Relationships between entities (for knowledge graph)
CREATE TABLE IF NOT EXISTS relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_from UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  entity_to UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  relationship_type TEXT,
  strength FLOAT DEFAULT 1.0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_relationships_entity_from ON relationships(entity_from);
CREATE INDEX IF NOT EXISTS idx_relationships_entity_to ON relationships(entity_to);
CREATE INDEX IF NOT EXISTS idx_relationships_user_id ON relationships(user_id);

-- Enable RLS on relationships
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own relationships" 
  ON relationships FOR ALL 
  USING (auth.uid() = user_id);

-- ============================================
-- SAMPLE QUERIES (for reference)
-- ============================================

-- Get all conversations for a user (ordered by most recent)
-- SELECT * FROM conversations WHERE user_id = auth.uid() ORDER BY updated_at DESC;

-- Get all messages for a conversation
-- SELECT * FROM messages WHERE conversation_id = 'your-conversation-id' ORDER BY created_at ASC;

-- Get conversation with message count
-- SELECT c.*, COUNT(m.id) as message_count 
-- FROM conversations c 
-- LEFT JOIN messages m ON c.id = m.conversation_id 
-- WHERE c.user_id = auth.uid() 
-- GROUP BY c.id 
-- ORDER BY c.updated_at DESC;

