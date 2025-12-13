-- Add temperaments column to custom_wakattors table
-- This stores an array of temperament IDs for greeting and response style selection

-- Add the temperaments column as a TEXT array with default empty array
ALTER TABLE custom_wakattors 
ADD COLUMN IF NOT EXISTS temperaments TEXT[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN custom_wakattors.temperaments IS 
  'Array of temperament IDs for greeting/response style selection. Order matters: first is primary (70% weight), second is secondary (30% weight). Valid IDs: analytical, socratic, skeptical, academic, curious, logical, melancholic, enthusiastic, sardonic, compassionate, anxious, joyful, brooding, nostalgic, nurturing, playful, formal, intimate, aloof, charming, blunt, gossipy, shy, commanding, mentor, rebellious, royal, humble, parental, poetic, dramatic, minimalist, absurdist, gothic, cryptic, zen, classical, romantic, cynical, existential, stoic, trickster, sage, hero, shadow, innocent, caregiver, explorer, creator, magician';

-- Create index for potential filtering by temperament (using GIN for array containment queries)
CREATE INDEX IF NOT EXISTS idx_custom_wakattors_temperaments 
ON custom_wakattors USING GIN (temperaments);

-- Migrate existing response_style values to temperaments array for existing records
-- This preserves backward compatibility by populating temperaments based on response_style
UPDATE custom_wakattors 
SET temperaments = CASE response_style
  WHEN 'analytical' THEN ARRAY['analytical']
  WHEN 'symbolic' THEN ARRAY['cryptic']
  WHEN 'practical' THEN ARRAY['blunt']
  WHEN 'hopeful' THEN ARRAY['joyful']
  WHEN 'vulnerable' THEN ARRAY['compassionate']
  WHEN 'meaningful' THEN ARRAY['existential']
  WHEN 'stoic' THEN ARRAY['stoic']
  WHEN 'fierce' THEN ARRAY['fierce']
  WHEN 'engaging' THEN ARRAY['enthusiastic']
  WHEN 'peaceful' THEN ARRAY['zen']
  ELSE ARRAY[response_style]::TEXT[]
END
WHERE temperaments = '{}' OR temperaments IS NULL;

