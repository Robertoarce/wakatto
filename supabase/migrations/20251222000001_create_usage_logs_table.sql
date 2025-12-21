-- Usage Logs Table
-- Tracks token usage per user with configurable reset periods (default: 2 weeks)

CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  request_count INTEGER NOT NULL DEFAULT 0,
  last_request_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one record per user per period
  CONSTRAINT unique_user_period UNIQUE (user_id, period_start)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_period ON usage_logs(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_period ON usage_logs(user_id, period_start DESC);

-- Enable RLS
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own usage"
  ON usage_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Only Edge Function (service role) can insert/update
CREATE POLICY "Service role can insert usage"
  ON usage_logs FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update usage"
  ON usage_logs FOR UPDATE
  USING (auth.role() = 'service_role');

-- Trigger: Auto-update updated_at
CREATE TRIGGER update_usage_logs_updated_at
  BEFORE UPDATE ON usage_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Function: Get or create current period usage
-- ============================================
CREATE OR REPLACE FUNCTION get_or_create_current_usage(p_user_id UUID, p_reset_days INTEGER DEFAULT 14)
RETURNS usage_logs AS $$
DECLARE
  v_period_start DATE;
  v_period_end DATE;
  v_usage usage_logs;
  v_last_period_start DATE;
BEGIN
  -- Find the most recent period for this user
  SELECT period_start INTO v_last_period_start
  FROM usage_logs
  WHERE user_id = p_user_id
  ORDER BY period_start DESC
  LIMIT 1;

  IF v_last_period_start IS NULL THEN
    -- First usage ever: start today
    v_period_start := CURRENT_DATE;
    v_period_end := CURRENT_DATE + p_reset_days - 1;
  ELSIF CURRENT_DATE > v_last_period_start + p_reset_days - 1 THEN
    -- Current period expired: start new period
    v_period_start := CURRENT_DATE;
    v_period_end := CURRENT_DATE + p_reset_days - 1;
  ELSE
    -- Within existing period
    v_period_start := v_last_period_start;
    v_period_end := v_last_period_start + p_reset_days - 1;
  END IF;

  -- Get or create usage record for this period
  INSERT INTO usage_logs (user_id, period_start, period_end, tokens_used, request_count)
  VALUES (p_user_id, v_period_start, v_period_end, 0, 0)
  ON CONFLICT (user_id, period_start)
  DO UPDATE SET updated_at = NOW()
  RETURNING * INTO v_usage;

  RETURN v_usage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function: Record token usage
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
BEGIN
  v_total_tokens := p_prompt_tokens + p_completion_tokens;

  -- Get current period (creates if needed)
  v_usage := get_or_create_current_usage(p_user_id, v_reset_days);

  -- Update usage
  UPDATE usage_logs
  SET
    tokens_used = tokens_used + v_total_tokens,
    prompt_tokens = prompt_tokens + p_prompt_tokens,
    completion_tokens = completion_tokens + p_completion_tokens,
    request_count = request_count + 1,
    last_request_at = NOW()
  WHERE id = v_usage.id
  RETURNING * INTO v_usage;

  RETURN v_usage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function: Check if user can make request
-- Returns usage info with warning levels
-- ============================================
CREATE OR REPLACE FUNCTION check_usage_limit(p_user_id UUID)
RETURNS TABLE (
  can_proceed BOOLEAN,
  tier account_tier,
  tokens_used INTEGER,
  token_limit INTEGER,
  remaining_tokens INTEGER,
  usage_percentage NUMERIC,
  period_end DATE,
  warning_level TEXT
) AS $$
DECLARE
  v_profile user_profiles;
  v_usage usage_logs;
  v_limit INTEGER;
  v_percentage NUMERIC;
  v_warning TEXT;
  v_reset_days INTEGER := 14;
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
      NULL::TEXT;
    RETURN;
  END IF;

  -- Get token limit based on tier
  v_limit := CASE v_profile.tier
    WHEN 'free' THEN 5000
    WHEN 'premium' THEN 25000
    WHEN 'gold' THEN 100000
    ELSE 5000
  END;

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
    v_warning;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE usage_logs IS 'Tracks AI token usage per user with bi-weekly reset periods';
COMMENT ON FUNCTION get_or_create_current_usage IS 'Gets or creates usage record for the current period';
COMMENT ON FUNCTION record_token_usage IS 'Records prompt and completion tokens for a request';
COMMENT ON FUNCTION check_usage_limit IS 'Checks if user can proceed with AI request based on tier limits';
