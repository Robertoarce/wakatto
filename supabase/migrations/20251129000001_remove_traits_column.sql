-- Migration: Remove traits column from custom_wakattors table
-- Date: 2025-11-29
-- Description: Removes the traits JSONB column as traits are no longer used in the system

-- Drop the traits column
ALTER TABLE custom_wakattors
DROP COLUMN IF EXISTS traits;

-- Update table comment
COMMENT ON TABLE custom_wakattors IS 'User-created AI characters with custom personalities and appearances. Character behavior is defined solely by system_prompt.';
