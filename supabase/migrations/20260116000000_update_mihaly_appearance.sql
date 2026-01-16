-- Update Mihaly Csikszentmihalyi's appearance to elderly man with white beard and glasses
-- Changes: thin_beard instead of bowtie, updated appearance

-- Update accessories for Mihaly
UPDATE custom_wakattors 
SET customization = jsonb_set(
  jsonb_set(
    customization - 'accessory', 
    '{accessories}', 
    '["glasses", "thin_beard"]'::jsonb
  ),
  '{hairColor}',
  '"#e5e5e5"'::jsonb
)
WHERE character_id = 'csikszentmihalyi';

-- Also update clothing to jacket
UPDATE custom_wakattors 
SET customization = jsonb_set(customization, '{clothing}', '"jacket"'::jsonb)
WHERE character_id = 'csikszentmihalyi';
