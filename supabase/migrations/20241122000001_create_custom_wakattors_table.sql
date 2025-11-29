-- Custom Wakattors Table
-- Stores user-created AI characters for conversations

CREATE TABLE IF NOT EXISTS custom_wakattors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id TEXT UNIQUE NOT NULL, -- e.g., 'custom_einstein_20250122'
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL, -- Primary color hex code
  role TEXT NOT NULL, -- e.g., 'Scientist', 'Superhero', 'Philosopher'
  prompt_style TEXT NOT NULL, -- Therapeutic approach style
  system_prompt TEXT, -- Custom system prompt
  response_style TEXT NOT NULL, -- e.g., 'analytical', 'playful', 'wise'
  traits JSONB NOT NULL, -- {empathy: 8, directness: 7, formality: 5, ...}
  customization JSONB NOT NULL, -- {gender, skinTone, clothing, hair, accessory, colors}
  model3d JSONB NOT NULL, -- {bodyColor, accessoryColor, position}
  is_public BOOLEAN DEFAULT false, -- If true, visible to all users
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_custom_wakattors_user_id ON custom_wakattors(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_wakattors_character_id ON custom_wakattors(character_id);
CREATE INDEX IF NOT EXISTS idx_custom_wakattors_is_public ON custom_wakattors(is_public);
CREATE INDEX IF NOT EXISTS idx_custom_wakattors_created_at ON custom_wakattors(created_at DESC);

-- Enable Row Level Security
ALTER TABLE custom_wakattors ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own characters and public characters
CREATE POLICY "Users can view own and public characters"
  ON custom_wakattors FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

-- Users can only insert their own characters
CREATE POLICY "Users can insert own characters"
  ON custom_wakattors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own characters
CREATE POLICY "Users can update own characters"
  ON custom_wakattors FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own characters
CREATE POLICY "Users can delete own characters"
  ON custom_wakattors FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to auto-update updated_at timestamp
CREATE TRIGGER update_custom_wakattors_updated_at
  BEFORE UPDATE ON custom_wakattors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE custom_wakattors IS 'User-created AI characters with custom personalities and appearances';
COMMENT ON COLUMN custom_wakattors.character_id IS 'Unique identifier used in code (e.g., custom_einstein_20250122)';
COMMENT ON COLUMN custom_wakattors.traits IS 'Personality traits as JSON: {empathy, directness, formality, humor, creativity, patience, wisdom, energy}';
COMMENT ON COLUMN custom_wakattors.customization IS '3D appearance: {gender, skinTone, clothing, hair, accessory, bodyColor, accessoryColor, hairColor}';
COMMENT ON COLUMN custom_wakattors.model3d IS '3D model config: {bodyColor, accessoryColor, position}';
COMMENT ON COLUMN custom_wakattors.is_public IS 'If true, character is shared with all users (curated content)';
