-- Fix: Robust user registration trigger
-- This ensures new user registration always succeeds, even if profile creation has issues

-- First, ensure trial enum value exists (idempotent)
DO $$
BEGIN
  -- Check if 'trial' exists in the enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'trial'
    AND enumtypid = 'account_tier'::regtype
  ) THEN
    ALTER TYPE account_tier ADD VALUE 'trial';
  END IF;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Ensure trial_started_at column exists
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ;

-- Make INSERT policy more permissive for the trigger
DROP POLICY IF EXISTS "System can insert profiles" ON user_profiles;
CREATE POLICY "System can insert profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (true);

-- Create a robust handle_new_user function that never fails
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_tier account_tier;
  v_trial_start TIMESTAMPTZ;
BEGIN
  -- Determine tier
  IF NEW.email = 'roberto@briatti.com' THEN
    v_tier := 'admin'::account_tier;
    v_trial_start := NULL;
  ELSE
    -- Try to use 'trial', fallback to 'free' if trial doesn't exist
    BEGIN
      v_tier := 'trial'::account_tier;
      v_trial_start := NOW();
    EXCEPTION
      WHEN invalid_text_representation THEN
        v_tier := 'free'::account_tier;
        v_trial_start := NULL;
    END;
  END IF;

  -- Insert the profile with full error handling
  BEGIN
    INSERT INTO public.user_profiles (id, email, tier, trial_started_at)
    VALUES (
      NEW.id,
      COALESCE(NEW.email, ''),
      v_tier,
      v_trial_start
    )
    ON CONFLICT (id) DO UPDATE SET
      email = COALESCE(EXCLUDED.email, user_profiles.email);
  EXCEPTION
    WHEN undefined_column THEN
      -- trial_started_at doesn't exist, insert without it
      INSERT INTO public.user_profiles (id, email, tier)
      VALUES (NEW.id, COALESCE(NEW.email, ''), v_tier)
      ON CONFLICT (id) DO UPDATE SET
        email = COALESCE(EXCLUDED.email, user_profiles.email);
    WHEN others THEN
      -- Log but don't fail - user creation must succeed
      RAISE WARNING 'handle_new_user: Failed to create profile for user %: % (SQLSTATE: %)',
        NEW.id, SQLERRM, SQLSTATE;
  END;

  -- Always return NEW to allow user creation to succeed
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.user_profiles TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
GRANT INSERT ON public.user_profiles TO anon;
