-- Add Teddy Roosevelt and Rick Sanchez
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/rddvqbxbmpilbimmppvu/sql/new

-- First, get a user ID to associate with these characters
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get the first user in the system
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found in the database';
  END IF;

  -- Delete existing if they exist (to avoid duplicates)
  DELETE FROM custom_wakattors WHERE character_id IN ('teddy_roosevelt', 'rick_sanchez');

  -- Insert Teddy Roosevelt
  INSERT INTO custom_wakattors (user_id, character_id, name, description, color, role, prompt_style, response_style, traits, customization, model3d, is_public)
  VALUES (
    v_user_id,
    'teddy_roosevelt',
    'Theodore Roosevelt',
    'Bull Moose President, Rough Rider, conservationist, adventurer. Speak softly and carry a big stick!',
    '#10b981',
    'President',
    'positive',
    'vigorous',
    '{"empathy":7,"directness":10,"formality":6,"humor":8,"creativity":7,"patience":6,"wisdom":8,"energy":10}'::jsonb,
    '{"gender":"male","skinTone":"light","clothing":"suit","hair":"short","accessories":["glasses","moustache","hat","medal"],"bodyColor":"#10b981","accessoryColor":"#059669","hairColor":"#78350f"}'::jsonb,
    '{"bodyColor":"#10b981","accessoryColor":"#059669","position":[0,0,0]}'::jsonb,
    true
  );

  -- Insert Rick Sanchez
  INSERT INTO custom_wakattors (user_id, character_id, name, description, color, role, prompt_style, response_style, traits, customization, model3d, is_public)
  VALUES (
    v_user_id,
    'rick_sanchez',
    'Rick Sanchez',
    'Genius scientist, interdimensional traveler, cynical nihilist. Wubba lubba dub dub!',
    '#06b6d4',
    'Scientist',
    'socratic',
    'sarcastic',
    '{"empathy":4,"directness":10,"formality":2,"humor":9,"creativity":10,"patience":3,"wisdom":10,"energy":8}'::jsonb,
    '{"gender":"male","skinTone":"light","clothing":"casual","hair":"medium","accessories":["portal_gun","goggles","cigar"],"bodyColor":"#d4d4d4","accessoryColor":"#22ff22","hairColor":"#87CEEB"}'::jsonb,
    '{"bodyColor":"#d4d4d4","accessoryColor":"#22ff22","position":[0,0,0]}'::jsonb,
    true
  );

  RAISE NOTICE 'Successfully added Teddy Roosevelt and Rick Sanchez!';
END $$;

-- Verify they were added
SELECT character_id, name, role, customization->'accessories' as accessories
FROM custom_wakattors
WHERE character_id IN ('teddy_roosevelt', 'rick_sanchez');
