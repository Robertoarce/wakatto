-- Migration: Add Teddy Roosevelt and Rick Sanchez characters
-- Date: 2025-12-19

-- ============================================
-- TEDDY ROOSEVELT - American President, Rough Rider
-- Accessories: glasses (pince-nez), moustache, safari hat, medal
-- ============================================

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get the first user in the system for public characters
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;

  -- If no user exists, try current logged-in user
  IF v_user_id IS NULL THEN
    v_user_id := auth.uid();
  END IF;

  -- Insert Teddy Roosevelt
  INSERT INTO custom_wakattors (user_id, character_id, name, description, color, role, prompt_style, response_style, traits, customization, model3d, is_public) VALUES
  (v_user_id, 'teddy_roosevelt', 'Theodore Roosevelt', 'Bull Moose President, Rough Rider, conservationist, adventurer', '#10b981', 'President', 'positive', 'vigorous',
   '{"empathy":7,"directness":10,"formality":6,"humor":8,"creativity":7,"patience":6,"wisdom":8,"energy":10}'::jsonb,
   '{"gender":"male","skinTone":"light","clothing":"suit","hair":"short","accessories":["glasses","moustache","hat","medal"],"bodyColor":"#10b981","accessoryColor":"#059669","hairColor":"#78350f"}'::jsonb,
   '{"bodyColor":"#10b981","accessoryColor":"#059669","position":[0,0,0]}'::jsonb,
   true)
  ON CONFLICT (character_id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    color = EXCLUDED.color,
    role = EXCLUDED.role,
    prompt_style = EXCLUDED.prompt_style,
    response_style = EXCLUDED.response_style,
    traits = EXCLUDED.traits,
    customization = EXCLUDED.customization,
    model3d = EXCLUDED.model3d;

END $$;

-- ============================================
-- RICK SANCHEZ - Genius scientist from Rick and Morty
-- Accessories: portal_gun, lab coat (backpack), goggles, cigar (sometimes)
-- Spiky blue-gray hair, drool, drunk scientist vibes
-- ============================================

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get the first user in the system for public characters
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;

  -- If no user exists, try current logged-in user
  IF v_user_id IS NULL THEN
    v_user_id := auth.uid();
  END IF;

  -- Insert Rick Sanchez
  INSERT INTO custom_wakattors (user_id, character_id, name, description, color, role, prompt_style, response_style, traits, customization, model3d, is_public) VALUES
  (v_user_id, 'rick_sanchez', 'Rick Sanchez', 'Genius scientist, interdimensional traveler, cynical nihilist with a soft spot', '#06b6d4', 'Scientist', 'socratic', 'sarcastic',
   '{"empathy":4,"directness":10,"formality":2,"humor":9,"creativity":10,"patience":3,"wisdom":10,"energy":8}'::jsonb,
   '{"gender":"male","skinTone":"light","clothing":"casual","hair":"medium","accessories":["portal_gun","goggles","cigar"],"bodyColor":"#d4d4d4","accessoryColor":"#22ff22","hairColor":"#87CEEB"}'::jsonb,
   '{"bodyColor":"#d4d4d4","accessoryColor":"#22ff22","position":[0,0,0]}'::jsonb,
   true)
  ON CONFLICT (character_id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    color = EXCLUDED.color,
    role = EXCLUDED.role,
    prompt_style = EXCLUDED.prompt_style,
    response_style = EXCLUDED.response_style,
    traits = EXCLUDED.traits,
    customization = EXCLUDED.customization,
    model3d = EXCLUDED.model3d;

END $$;
