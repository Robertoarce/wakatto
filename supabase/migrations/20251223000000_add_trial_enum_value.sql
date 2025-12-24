-- Step 1: Add 'trial' to account_tier enum
-- This must be in a separate transaction before the value can be used
ALTER TYPE account_tier ADD VALUE IF NOT EXISTS 'trial' BEFORE 'free';
