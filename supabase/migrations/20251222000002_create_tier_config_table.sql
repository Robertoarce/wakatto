-- Tier Configuration Table
-- Stores configurable tier limits and settings for future modifications

CREATE TABLE IF NOT EXISTS tier_config (
  tier account_tier PRIMARY KEY,
  token_limit INTEGER NOT NULL,
  reset_period_days INTEGER NOT NULL DEFAULT 14,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default values
INSERT INTO tier_config (tier, token_limit, reset_period_days, description) VALUES
  ('free', 5000, 14, 'Free tier: 5,000 tokens per 2-week period'),
  ('premium', 25000, 14, 'Premium tier: 25,000 tokens per 2-week period'),
  ('gold', 100000, 14, 'Gold tier: 100,000 tokens per 2-week period'),
  ('admin', 0, 14, 'Admin tier: Unlimited tokens')
ON CONFLICT (tier) DO UPDATE SET
  token_limit = EXCLUDED.token_limit,
  reset_period_days = EXCLUDED.reset_period_days,
  description = EXCLUDED.description;

-- Enable RLS (read-only for all authenticated users)
ALTER TABLE tier_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tier config"
  ON tier_config FOR SELECT
  USING (true);

-- Only service role can modify (for admin dashboard later)
CREATE POLICY "Service role can modify tier config"
  ON tier_config FOR ALL
  USING (auth.role() = 'service_role');

-- Trigger: Auto-update updated_at
CREATE TRIGGER update_tier_config_updated_at
  BEFORE UPDATE ON tier_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Function: Get tier limit from config
-- (Updated check_usage_limit to use this)
-- ============================================
CREATE OR REPLACE FUNCTION get_tier_limit(p_tier account_tier)
RETURNS INTEGER AS $$
DECLARE
  v_limit INTEGER;
BEGIN
  SELECT token_limit INTO v_limit
  FROM tier_config
  WHERE tier = p_tier AND is_active = true;

  -- Fallback to hardcoded values if not found
  IF v_limit IS NULL THEN
    v_limit := CASE p_tier
      WHEN 'free' THEN 5000
      WHEN 'premium' THEN 25000
      WHEN 'gold' THEN 100000
      WHEN 'admin' THEN 0
      ELSE 5000
    END;
  END IF;

  RETURN v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function: Get reset period days from config
-- ============================================
CREATE OR REPLACE FUNCTION get_reset_period_days(p_tier account_tier DEFAULT 'free')
RETURNS INTEGER AS $$
DECLARE
  v_days INTEGER;
BEGIN
  SELECT reset_period_days INTO v_days
  FROM tier_config
  WHERE tier = p_tier AND is_active = true;

  -- Fallback to 14 days if not found
  IF v_days IS NULL THEN
    v_days := 14;
  END IF;

  RETURN v_days;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Update check_usage_limit to use config table
-- ============================================
-- Drop the existing function first to change return type
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
  reset_period_days INTEGER
) AS $$
DECLARE
  v_profile user_profiles;
  v_usage usage_logs;
  v_limit INTEGER;
  v_percentage NUMERIC;
  v_warning TEXT;
  v_reset_days INTEGER;
BEGIN
  -- Get user profile
  SELECT * INTO v_profile FROM user_profiles WHERE id = p_user_id;

  IF NOT FOUND THEN
    -- Create profile if missing (edge case)
    INSERT INTO user_profiles (id, email, tier)
    SELECT u.id, u.email, 'free'::account_tier
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
      v_reset_days;
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

  RETURN QUERY SELECT
    v_percentage < 100,
    v_profile.tier,
    v_usage.tokens_used,
    v_limit,
    GREATEST(0, v_limit - v_usage.tokens_used),
    ROUND(v_percentage, 2),
    v_usage.period_end,
    v_warning,
    v_reset_days;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE tier_config IS 'Configurable settings for each account tier';
COMMENT ON COLUMN tier_config.token_limit IS 'Maximum tokens per reset period (0 = unlimited for admin)';
COMMENT ON COLUMN tier_config.reset_period_days IS 'Days before usage resets (default 14 = 2 weeks)';
COMMENT ON FUNCTION get_tier_limit IS 'Gets token limit for a tier from config or fallback';
COMMENT ON FUNCTION get_reset_period_days IS 'Gets reset period days from config or fallback';
