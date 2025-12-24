-- Trial Tier and Daily Message Limits Migration (Part 2)
--
-- PREREQUISITE: Run 20251223000000_add_trial_enum_value.sql first!
--
-- Changes:
-- 1. Add trial_started_at to user_profiles
-- 2. Add daily message tracking to usage_logs
-- 3. New users get 'trial' tier (15k tokens, 15 days)
-- 4. Free tier has 5 messages/day limit + 5k tokens

-- ============================================
-- Step 1: Add trial_started_at to user_profiles
-- ============================================
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ;

-- ============================================
-- Step 2: Add daily message tracking columns
-- ============================================
ALTER TABLE usage_logs
ADD COLUMN IF NOT EXISTS daily_messages_used INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_message_date DATE;

-- ============================================
-- Step 3: Add trial tier to tier_config
-- ============================================
INSERT INTO tier_config (tier, token_limit, reset_period_days, description) VALUES
  ('trial', 15000, 15, 'Trial tier: 15,000 tokens for 15 days, then converts to free')
ON CONFLICT (tier) DO UPDATE SET
  token_limit = EXCLUDED.token_limit,
  reset_period_days = EXCLUDED.reset_period_days,
  description = EXCLUDED.description;

-- ============================================
-- Step 4: Update handle_new_user to assign trial
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, tier, trial_started_at)
  VALUES (
    NEW.id,
    NEW.email,
    CASE
      WHEN NEW.email = 'roberto@briatti.com' THEN 'admin'::account_tier
      ELSE 'trial'::account_tier
    END,
    CASE
      WHEN NEW.email = 'roberto@briatti.com' THEN NULL
      ELSE NOW()
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Step 5: Function to check and expire trials
-- ============================================
CREATE OR REPLACE FUNCTION check_and_expire_trial(p_user_id UUID)
RETURNS account_tier AS $$
DECLARE
  v_profile user_profiles;
  v_days_since_trial INTEGER;
BEGIN
  SELECT * INTO v_profile FROM user_profiles WHERE id = p_user_id;

  IF NOT FOUND OR v_profile.tier != 'trial' THEN
    RETURN COALESCE(v_profile.tier, 'free'::account_tier);
  END IF;

  -- Calculate days since trial started
  v_days_since_trial := EXTRACT(DAY FROM (NOW() - v_profile.trial_started_at));

  -- If trial expired (15 days), downgrade to free
  IF v_days_since_trial >= 15 THEN
    UPDATE user_profiles
    SET tier = 'free', tier_updated_at = NOW()
    WHERE id = p_user_id;
    RETURN 'free'::account_tier;
  END IF;

  RETURN 'trial'::account_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Step 6: Function to track daily messages
-- ============================================
CREATE OR REPLACE FUNCTION increment_daily_message(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_usage usage_logs;
  v_today DATE := CURRENT_DATE;
  v_reset_days INTEGER := 14;
BEGIN
  -- Get current usage
  v_usage := get_or_create_current_usage(p_user_id, v_reset_days);

  -- Reset daily count if new day
  IF v_usage.last_message_date IS NULL OR v_usage.last_message_date < v_today THEN
    UPDATE usage_logs
    SET daily_messages_used = 1, last_message_date = v_today
    WHERE id = v_usage.id
    RETURNING daily_messages_used INTO v_usage.daily_messages_used;
  ELSE
    UPDATE usage_logs
    SET daily_messages_used = daily_messages_used + 1
    WHERE id = v_usage.id
    RETURNING daily_messages_used INTO v_usage.daily_messages_used;
  END IF;

  RETURN v_usage.daily_messages_used;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Step 7: Function to check daily message limit
-- ============================================
CREATE OR REPLACE FUNCTION check_daily_message_limit(p_user_id UUID)
RETURNS TABLE (
  can_send BOOLEAN,
  messages_used INTEGER,
  messages_limit INTEGER,
  tier account_tier
) AS $$
DECLARE
  v_profile user_profiles;
  v_usage usage_logs;
  v_today DATE := CURRENT_DATE;
  v_reset_days INTEGER := 14;
  v_daily_limit INTEGER;
  v_current_count INTEGER;
BEGIN
  -- Check and update trial status first
  PERFORM check_and_expire_trial(p_user_id);

  -- Get updated profile
  SELECT * INTO v_profile FROM user_profiles WHERE id = p_user_id;

  -- Only free tier has daily message limit
  IF v_profile.tier != 'free' THEN
    RETURN QUERY SELECT TRUE, 0, 999999, v_profile.tier;
    RETURN;
  END IF;

  -- Free tier: 5 messages per day
  v_daily_limit := 5;

  -- Get current usage
  v_usage := get_or_create_current_usage(p_user_id, v_reset_days);

  -- Check if it's a new day
  IF v_usage.last_message_date IS NULL OR v_usage.last_message_date < v_today THEN
    v_current_count := 0;
  ELSE
    v_current_count := v_usage.daily_messages_used;
  END IF;

  RETURN QUERY SELECT
    v_current_count < v_daily_limit,
    v_current_count,
    v_daily_limit,
    v_profile.tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Step 8: Update check_usage_limit to include trial + daily limits
-- ============================================
DROP FUNCTION IF EXISTS check_usage_limit(UUID);

CREATE OR REPLACE FUNCTION check_usage_limit(p_user_id UUID)
RETURNS TABLE (
  can_proceed BOOLEAN,
  tier account_tier,
  tokens_used INTEGER,
  token_limit INTEGER,
  remaining_tokens INTEGER,
  usage_percentage NUMERIC,
  period_end DATE,
  warning_level TEXT,
  reset_period_days INTEGER,
  daily_messages_used INTEGER,
  daily_messages_limit INTEGER,
  trial_days_remaining INTEGER
) AS $$
DECLARE
  v_profile user_profiles;
  v_usage usage_logs;
  v_limit INTEGER;
  v_percentage NUMERIC;
  v_warning TEXT;
  v_reset_days INTEGER;
  v_can_proceed BOOLEAN;
  v_daily_count INTEGER;
  v_daily_limit INTEGER;
  v_trial_remaining INTEGER := NULL;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Check and update trial status first
  PERFORM check_and_expire_trial(p_user_id);

  -- Get user profile
  SELECT * INTO v_profile FROM user_profiles WHERE id = p_user_id;

  IF NOT FOUND THEN
    -- Create profile if missing (edge case)
    INSERT INTO user_profiles (id, email, tier, trial_started_at)
    SELECT u.id, u.email, 'trial'::account_tier, NOW()
    FROM auth.users u WHERE u.id = p_user_id
    ON CONFLICT (id) DO NOTHING;

    SELECT * INTO v_profile FROM user_profiles WHERE id = p_user_id;
  END IF;

  -- Get reset period from config
  v_reset_days := get_reset_period_days(v_profile.tier);

  -- Admin has no limit
  IF v_profile.tier = 'admin' THEN
    RETURN QUERY SELECT
      TRUE,
      'admin'::account_tier,
      0,
      0,
      999999999,
      0.0::NUMERIC,
      (CURRENT_DATE + v_reset_days)::DATE,
      NULL::TEXT,
      v_reset_days,
      0,
      999999,
      NULL::INTEGER;
    RETURN;
  END IF;

  -- Get token limit from config
  v_limit := get_tier_limit(v_profile.tier);

  -- Get current usage
  v_usage := get_or_create_current_usage(p_user_id, v_reset_days);

  -- Calculate percentage
  v_percentage := (v_usage.tokens_used::NUMERIC / v_limit::NUMERIC) * 100;

  -- Determine warning level
  v_warning := CASE
    WHEN v_percentage >= 100 THEN 'blocked'
    WHEN v_percentage >= 90 THEN 'critical'
    WHEN v_percentage >= 80 THEN 'warning'
    ELSE NULL
  END;

  -- Check daily message limit for free tier
  IF v_profile.tier = 'free' THEN
    v_daily_limit := 5;
    IF v_usage.last_message_date IS NULL OR v_usage.last_message_date < v_today THEN
      v_daily_count := 0;
    ELSE
      v_daily_count := v_usage.daily_messages_used;
    END IF;

    -- Block if daily limit reached (even if tokens available)
    IF v_daily_count >= v_daily_limit THEN
      v_warning := 'blocked';
    END IF;
  ELSE
    v_daily_count := 0;
    v_daily_limit := 999999;
  END IF;

  -- Calculate trial days remaining
  IF v_profile.tier = 'trial' AND v_profile.trial_started_at IS NOT NULL THEN
    v_trial_remaining := 15 - EXTRACT(DAY FROM (NOW() - v_profile.trial_started_at))::INTEGER;
    v_trial_remaining := GREATEST(0, v_trial_remaining);
  END IF;

  -- Determine if can proceed
  v_can_proceed := v_percentage < 100 AND
    (v_profile.tier != 'free' OR v_daily_count < v_daily_limit);

  RETURN QUERY SELECT
    v_can_proceed,
    v_profile.tier,
    v_usage.tokens_used,
    v_limit,
    GREATEST(0, v_limit - v_usage.tokens_used),
    ROUND(v_percentage, 2),
    v_usage.period_end,
    v_warning,
    v_reset_days,
    v_daily_count,
    v_daily_limit,
    v_trial_remaining;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Step 9: Update record_token_usage to track daily messages
-- ============================================
CREATE OR REPLACE FUNCTION record_token_usage(
  p_user_id UUID,
  p_prompt_tokens INTEGER,
  p_completion_tokens INTEGER
)
RETURNS usage_logs AS $$
DECLARE
  v_usage usage_logs;
  v_total_tokens INTEGER;
  v_reset_days INTEGER := 14;
  v_today DATE := CURRENT_DATE;
BEGIN
  v_total_tokens := p_prompt_tokens + p_completion_tokens;

  -- Get current period (creates if needed)
  v_usage := get_or_create_current_usage(p_user_id, v_reset_days);

  -- Update usage including daily message count
  UPDATE usage_logs
  SET
    tokens_used = tokens_used + v_total_tokens,
    prompt_tokens = prompt_tokens + p_prompt_tokens,
    completion_tokens = completion_tokens + p_completion_tokens,
    request_count = request_count + 1,
    last_request_at = NOW(),
    daily_messages_used = CASE
      WHEN last_message_date IS NULL OR last_message_date < v_today THEN 1
      ELSE daily_messages_used + 1
    END,
    last_message_date = v_today
  WHERE id = v_usage.id
  RETURNING * INTO v_usage;

  RETURN v_usage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Comments
-- ============================================
COMMENT ON COLUMN user_profiles.trial_started_at IS 'When the trial period started (NULL for non-trial users)';
COMMENT ON COLUMN usage_logs.daily_messages_used IS 'Number of messages sent today (resets daily for free tier limit)';
COMMENT ON COLUMN usage_logs.last_message_date IS 'Date of last message (for daily reset tracking)';
COMMENT ON FUNCTION check_and_expire_trial IS 'Checks if trial has expired and downgrades to free if so';
COMMENT ON FUNCTION check_daily_message_limit IS 'Checks if free tier user has reached 5 messages/day limit';
COMMENT ON FUNCTION increment_daily_message IS 'Increments daily message counter, resets if new day';
