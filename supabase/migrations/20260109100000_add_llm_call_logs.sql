-- Migration: Add LLM Call Logs Table
-- Created: 2026-01-09
-- Description: Tracks LLM API calls for cost monitoring and analytics

-- ============================================
-- 1. CREATE LLM CALL LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS llm_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  latency_ms INTEGER,
  estimated_cost_usd DECIMAL(10,6),
  -- Additional metadata for debugging/analytics
  streaming BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_llm_call_logs_conversation ON llm_call_logs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_llm_call_logs_user ON llm_call_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_llm_call_logs_created_at ON llm_call_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_llm_call_logs_provider ON llm_call_logs(provider);

-- ============================================
-- 3. ROW LEVEL SECURITY
-- ============================================
ALTER TABLE llm_call_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own LLM call logs
CREATE POLICY "Users can view own llm_call_logs"
  ON llm_call_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own LLM call logs
CREATE POLICY "Users can insert own llm_call_logs"
  ON llm_call_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all logs (for analytics)
CREATE POLICY "Admins can view all llm_call_logs"
  ON llm_call_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.tier = 'admin'
    )
  );

-- ============================================
-- 4. HELPER FUNCTION: Get user's total token usage
-- ============================================
CREATE OR REPLACE FUNCTION get_user_llm_usage(
  target_user_id UUID,
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_calls INTEGER,
  total_prompt_tokens BIGINT,
  total_completion_tokens BIGINT,
  total_tokens BIGINT,
  total_cost_usd DECIMAL(10,4),
  avg_latency_ms DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_calls,
    COALESCE(SUM(l.prompt_tokens), 0)::BIGINT as total_prompt_tokens,
    COALESCE(SUM(l.completion_tokens), 0)::BIGINT as total_completion_tokens,
    COALESCE(SUM(l.total_tokens), 0)::BIGINT as total_tokens,
    COALESCE(SUM(l.estimated_cost_usd), 0)::DECIMAL(10,4) as total_cost_usd,
    COALESCE(AVG(l.latency_ms), 0)::DECIMAL(10,2) as avg_latency_ms
  FROM llm_call_logs l
  WHERE l.user_id = target_user_id
    AND l.created_at >= NOW() - (days_back || ' days')::INTERVAL
    AND l.error_message IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. HELPER FUNCTION: Get conversation token usage
-- ============================================
CREATE OR REPLACE FUNCTION get_conversation_llm_usage(target_conversation_id UUID)
RETURNS TABLE (
  total_calls INTEGER,
  total_tokens BIGINT,
  total_cost_usd DECIMAL(10,4)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_calls,
    COALESCE(SUM(l.total_tokens), 0)::BIGINT as total_tokens,
    COALESCE(SUM(l.estimated_cost_usd), 0)::DECIMAL(10,4) as total_cost_usd
  FROM llm_call_logs l
  WHERE l.conversation_id = target_conversation_id
    AND l.error_message IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. COMMENTS
-- ============================================
COMMENT ON TABLE llm_call_logs IS 'Tracks all LLM API calls for cost monitoring and analytics';
COMMENT ON COLUMN llm_call_logs.provider IS 'LLM provider (claude, openai, gemini, etc.)';
COMMENT ON COLUMN llm_call_logs.model IS 'Model name (claude-3-5-sonnet, gpt-4, etc.)';
COMMENT ON COLUMN llm_call_logs.prompt_tokens IS 'Number of tokens in the prompt/input';
COMMENT ON COLUMN llm_call_logs.completion_tokens IS 'Number of tokens in the completion/output';
COMMENT ON COLUMN llm_call_logs.estimated_cost_usd IS 'Estimated cost in USD based on token pricing';
COMMENT ON COLUMN llm_call_logs.latency_ms IS 'Time from request to complete response in milliseconds';
COMMENT ON COLUMN llm_call_logs.streaming IS 'Whether streaming was used for this call';

