-- Fix: Add INSERT policy for user_profiles to allow trigger to work
-- The handle_new_user() trigger needs permission to insert profiles

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Allow trigger to insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON user_profiles;

-- Add policy allowing inserts via SECURITY DEFINER functions
-- This is needed because even SECURITY DEFINER functions respect RLS unless bypassed
CREATE POLICY "System can insert profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (true);

-- Also ensure the handle_new_user function has proper error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, tier)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    CASE
      WHEN NEW.email = 'roberto@briatti.com' THEN 'admin'::account_tier
      ELSE 'free'::account_tier
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, user_profiles.email);
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't fail user creation
    RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
