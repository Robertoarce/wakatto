-- Stripe Integration and Bob AI Tools Tables
-- Adds support for payment links, discount codes, and wakattor preview unlocks

-- ============================================
-- Add Stripe fields to tier_config
-- ============================================

ALTER TABLE tier_config 
ADD COLUMN IF NOT EXISTS stripe_payment_link TEXT,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- Update with placeholder values (replace with actual Stripe Payment Links)
UPDATE tier_config SET 
  stripe_payment_link = 'https://buy.stripe.com/test_premium_placeholder',
  stripe_price_id = 'price_premium_placeholder'
WHERE tier = 'premium';

UPDATE tier_config SET 
  stripe_payment_link = 'https://buy.stripe.com/test_gold_placeholder',
  stripe_price_id = 'price_gold_placeholder'
WHERE tier = 'gold';

-- ============================================
-- Stripe Customer Mapping
-- ============================================

CREATE TABLE IF NOT EXISTS stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_customers_user ON stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe ON stripe_customers(stripe_customer_id);

-- ============================================
-- Discount Codes (Bob's negotiation tool)
-- Must be created before payment_history (which references it)
-- ============================================

CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = global code
  discount_percent INTEGER NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  max_uses INTEGER DEFAULT 1, -- NULL = unlimited
  current_uses INTEGER DEFAULT 0,
  valid_for_tiers account_tier[] DEFAULT ARRAY['premium', 'gold']::account_tier[],
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ, -- For single-use codes
  created_by TEXT DEFAULT 'bob', -- 'bob', 'admin', 'promo'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discount_codes_user ON discount_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_expires ON discount_codes(expires_at);

-- ============================================
-- Payment History
-- ============================================

CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  tier_purchased account_tier NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed, refunded
  discount_code_id UUID REFERENCES discount_codes(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payment_history_user ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history(status);

-- ============================================
-- Wakattor Preview Unlocks (temporary access)
-- ============================================

CREATE TABLE IF NOT EXISTS wakattor_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  granted_by TEXT DEFAULT 'bob', -- 'bob', 'admin', 'promo'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, character_id)
);

CREATE INDEX IF NOT EXISTS idx_wakattor_unlocks_user ON wakattor_unlocks(user_id);
CREATE INDEX IF NOT EXISTS idx_wakattor_unlocks_expires ON wakattor_unlocks(expires_at);

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wakattor_unlocks ENABLE ROW LEVEL SECURITY;

-- Stripe Customers: Users can view their own, service role full access
CREATE POLICY "Users can view own stripe customer" ON stripe_customers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to stripe_customers" ON stripe_customers
  FOR ALL USING (auth.role() = 'service_role');

-- Payment History: Users can view their own
CREATE POLICY "Users can view own payment history" ON payment_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to payment_history" ON payment_history
  FOR ALL USING (auth.role() = 'service_role');

-- Discount Codes: Users can view their own or global codes
CREATE POLICY "Users can view own or global discount codes" ON discount_codes
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Service role full access to discount_codes" ON discount_codes
  FOR ALL USING (auth.role() = 'service_role');

-- Wakattor Unlocks: Users can view their own
CREATE POLICY "Users can view own wakattor unlocks" ON wakattor_unlocks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to wakattor_unlocks" ON wakattor_unlocks
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- Helper Functions
-- ============================================

-- Check if user has active unlock for a character
CREATE OR REPLACE FUNCTION has_wakattor_unlock(p_user_id UUID, p_character_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM wakattor_unlocks
    WHERE user_id = p_user_id
      AND character_id = p_character_id
      AND expires_at > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get valid discount code for user
CREATE OR REPLACE FUNCTION get_valid_discount(p_user_id UUID, p_code TEXT)
RETURNS TABLE (
  discount_id UUID,
  discount_percent INTEGER,
  valid_for_tiers account_tier[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dc.id,
    dc.discount_percent,
    dc.valid_for_tiers
  FROM discount_codes dc
  WHERE dc.code = p_code
    AND (dc.user_id = p_user_id OR dc.user_id IS NULL)
    AND dc.expires_at > NOW()
    AND (dc.max_uses IS NULL OR dc.current_uses < dc.max_uses)
    AND (dc.used_at IS NULL OR dc.max_uses > 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a discount code for Bob
CREATE OR REPLACE FUNCTION create_bob_discount(
  p_user_id UUID,
  p_discount_percent INTEGER,
  p_expires_hours INTEGER DEFAULT 24
)
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
BEGIN
  -- Generate a unique code
  v_code := 'BOB-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
  
  INSERT INTO discount_codes (code, user_id, discount_percent, expires_at, created_by)
  VALUES (v_code, p_user_id, p_discount_percent, NOW() + (p_expires_hours || ' hours')::INTERVAL, 'bob');
  
  RETURN v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant wakattor preview unlock
CREATE OR REPLACE FUNCTION grant_wakattor_preview(
  p_user_id UUID,
  p_character_id TEXT,
  p_hours INTEGER DEFAULT 24
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO wakattor_unlocks (user_id, character_id, expires_at, granted_by)
  VALUES (p_user_id, p_character_id, NOW() + (p_hours || ' hours')::INTERVAL, 'bob')
  ON CONFLICT (user_id, character_id) 
  DO UPDATE SET expires_at = GREATEST(wakattor_unlocks.expires_at, EXCLUDED.expires_at);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update user tier after successful payment
CREATE OR REPLACE FUNCTION upgrade_user_tier(
  p_user_id UUID,
  p_new_tier account_tier
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_profiles
  SET tier = p_new_tier,
      tier_updated_at = NOW(),
      updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE stripe_customers IS 'Maps Supabase users to Stripe customer IDs';
COMMENT ON TABLE payment_history IS 'Records of all payment attempts and completions';
COMMENT ON TABLE discount_codes IS 'Discount codes generated by Bob or admin for price negotiation';
COMMENT ON TABLE wakattor_unlocks IS 'Temporary preview access to locked wakattors';
COMMENT ON FUNCTION has_wakattor_unlock IS 'Check if user has active temporary unlock for a character';
COMMENT ON FUNCTION create_bob_discount IS 'Bob creates a personalized discount code for the user';
COMMENT ON FUNCTION grant_wakattor_preview IS 'Grant temporary access to a locked wakattor';
