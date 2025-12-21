-- User Profiles Table
-- Stores user account tier information for token usage limits

-- Create account tier enum type
DO $$ BEGIN
  CREATE TYPE account_tier AS ENUM ('free', 'premium', 'gold', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create the user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  tier account_tier NOT NULL DEFAULT 'free',
  tier_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique index on email for fast admin lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_tier ON user_profiles(tier);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role can do everything (for Edge Functions)
CREATE POLICY "Service role full access"
  ON user_profiles FOR ALL
  USING (auth.role() = 'service_role');

-- Ensure update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function: Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, tier)
  VALUES (
    NEW.id,
    NEW.email,
    CASE
      WHEN NEW.email = 'roberto@briatti.com' THEN 'admin'::account_tier
      ELSE 'free'::account_tier
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Backfill existing users
INSERT INTO user_profiles (id, email, tier)
SELECT
  id,
  email,
  CASE
    WHEN email = 'roberto@briatti.com' THEN 'admin'::account_tier
    ELSE 'free'::account_tier
  END
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  tier = CASE
    WHEN EXCLUDED.email = 'roberto@briatti.com' THEN 'admin'::account_tier
    ELSE user_profiles.tier  -- Keep existing tier for non-admin users
  END;

-- Comments
COMMENT ON TABLE user_profiles IS 'User account profiles with tier information for token limits';
COMMENT ON COLUMN user_profiles.tier IS 'Account tier: free (5K tokens/2wk), premium (25K), gold (100K), admin (unlimited)';
COMMENT ON COLUMN user_profiles.tier_updated_at IS 'When the tier was last changed (for upgrade tracking)';
