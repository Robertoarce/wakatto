-- Update reset period to 3 days for all tiers and reset all usage
--
-- Changes:
-- 1. Update reset_period_days to 3 for all tiers
-- 2. Update default value for new tiers
-- 3. Reset all users' token usage so everyone starts fresh

-- ============================================
-- Step 1: Update reset period for all tiers
-- ============================================
UPDATE tier_config SET 
  reset_period_days = 3, 
  description = 'Free tier: 5,000 tokens per 3-day period' 
WHERE tier = 'free';

UPDATE tier_config SET 
  reset_period_days = 3, 
  description = 'Premium tier: 25,000 tokens per 3-day period' 
WHERE tier = 'premium';

UPDATE tier_config SET 
  reset_period_days = 3, 
  description = 'Gold tier: 100,000 tokens per 3-day period' 
WHERE tier = 'gold';

UPDATE tier_config SET 
  reset_period_days = 3, 
  description = 'Trial tier: 15,000 tokens per 3-day period, then converts to free' 
WHERE tier = 'trial';

-- Admin remains unlimited, but update period for consistency
UPDATE tier_config SET 
  reset_period_days = 3,
  description = 'Admin tier: Unlimited tokens'
WHERE tier = 'admin';

-- ============================================
-- Step 2: Update default value for new tiers
-- ============================================
ALTER TABLE tier_config ALTER COLUMN reset_period_days SET DEFAULT 3;

-- ============================================
-- Step 3: Reset all users' usage
-- ============================================
-- Reset token usage to 0 and set period_start to now
UPDATE usage_logs SET 
  tokens_used = 0,
  daily_messages_used = 0,
  last_message_date = NULL,
  period_start = CURRENT_DATE,
  updated_at = NOW();

-- Log this migration
DO $$
BEGIN
  RAISE NOTICE 'Migration complete: Reset period changed to 3 days for all tiers, all user usage reset';
END $$;

