-- Migration: Ensure Stephen Hawking has the iconic motorized wheelchair accessory
-- This wheelchair includes his voice synthesizer computer screen

-- Update Stephen Hawking's accessories to include wheelchair (if not already present)
UPDATE custom_wakattors 
SET customization = jsonb_set(
  customization,
  '{accessories}',
  CASE 
    -- If accessories array exists and doesn't already contain wheelchair, add it
    WHEN customization->'accessories' IS NOT NULL 
         AND NOT (customization->'accessories' @> '["wheelchair"]'::jsonb)
    THEN customization->'accessories' || '["wheelchair"]'::jsonb
    -- If accessories array exists and already has wheelchair, keep as is
    WHEN customization->'accessories' IS NOT NULL 
         AND (customization->'accessories' @> '["wheelchair"]'::jsonb)
    THEN customization->'accessories'
    -- If no accessories array exists, create one with glasses and wheelchair
    ELSE '["glasses", "wheelchair"]'::jsonb
  END
)
WHERE character_id = 'stephen_hawking';

-- Verify the update
SELECT character_id, name, customization->'accessories' as accessories 
FROM custom_wakattors 
WHERE character_id = 'stephen_hawking';

