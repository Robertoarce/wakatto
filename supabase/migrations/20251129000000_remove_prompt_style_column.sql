-- Migration: Remove prompt_style column from custom_wakattors table
-- Date: 2025-11-29
-- Description: Removes the unused prompt_style column as all characters now use systemPrompt directly

-- Make system_prompt required (NOT NULL) and drop prompt_style
-- This migration ensures that all existing characters have a system_prompt before making it required

-- Step 1: Update any NULL system_prompt values with a default
UPDATE custom_wakattors
SET system_prompt = 'You are a helpful AI assistant.'
WHERE system_prompt IS NULL OR system_prompt = '';

-- Step 2: Make system_prompt NOT NULL
ALTER TABLE custom_wakattors
ALTER COLUMN system_prompt SET NOT NULL;

-- Step 3: Drop the prompt_style column
ALTER TABLE custom_wakattors
DROP COLUMN IF EXISTS prompt_style;

-- Update table comment to reflect changes
COMMENT ON COLUMN custom_wakattors.system_prompt IS 'Custom system prompt that defines character behavior (required)';
