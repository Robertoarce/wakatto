-- Migration: Support for multiple accessories in customization
-- Date: 2025-12-17
--
-- This migration documents the change from single `accessory` field to `accessories` array.
-- No schema changes are needed since customization is stored as JSONB.
--
-- Old format: { ..., accessory: 'glasses', ... }
-- New format: { ..., accessories: ['glasses', 'beard'], ... }
--
-- Both formats will work with the current JSONB storage.
-- Old records will continue to work as-is.
-- New records will use the accessories array format.

-- Update the documentation comment for clarity
COMMENT ON COLUMN custom_wakattors.customization IS
'3D appearance customization as JSON object: {gender, skinTone, clothing, hair, accessories (array), bodyColor, accessoryColor, hairColor}.
New format uses accessories as array (e.g., ["glasses", "beard"]) instead of single accessory field.
Both formats are supported for backwards compatibility.';

-- No data migration needed - JSONB storage is backwards compatible
-- Existing records with single accessory will continue to work
-- New code uses accessories array format for multi-accessory support
