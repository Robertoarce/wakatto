-- Migration: Fix accessories for renamed characters
-- Date: 2026-01-05
-- Issue: Previous accessories migration (20251219000002) used old character IDs,
--        but those characters were renamed in migration (20251230000000).
--        This migration updates accessories using the NEW character IDs.

-- ============================================
-- SUPERHEROES - Fix accessories with new IDs
-- ============================================

-- Star-Spangled Soldier (was captain_america) - shield, helmet
UPDATE custom_wakattors 
SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["shield", "helmet"]'::jsonb) 
WHERE character_id = 'star_spangled_soldier';

-- Amazon Warrior Princess (was wonder_woman) - tiara, shield, sword, cape
UPDATE custom_wakattors 
SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["tiara", "shield", "sword", "cape"]'::jsonb) 
WHERE character_id = 'amazon_warrior_princess';

-- Thunder God Warrior (was thor) - helmet, cape
UPDATE custom_wakattors 
SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["helmet", "cape"]'::jsonb) 
WHERE character_id = 'thunder_god_warrior';

-- Dark Knight Detective (was batman) - cape, sunglasses (cowl-like)
UPDATE custom_wakattors 
SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["cape", "sunglasses", "bat_mask"]'::jsonb) 
WHERE character_id = 'dark_knight_detective';

-- Sorcerer Supreme (was doctor_strange) - cape, staff
UPDATE custom_wakattors 
SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["cape", "staff"]'::jsonb) 
WHERE character_id = 'sorcerer_supreme';

-- Chaos Magic Wielder (was scarlet_witch) - tiara, cape
UPDATE custom_wakattors 
SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["tiara", "cape"]'::jsonb) 
WHERE character_id = 'chaos_magic_wielder';

-- Armored Tech Genius (was iron_man) - goggles
UPDATE custom_wakattors 
SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["goggles"]'::jsonb) 
WHERE character_id = 'armored_tech_genius';

-- Red Room Spy (was black_widow) - gun, sunglasses
UPDATE custom_wakattors 
SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["gun", "sunglasses"]'::jsonb) 
WHERE character_id = 'red_room_spy';

-- Green Gamma Giant (was hulk) - no accessories but fix format
UPDATE custom_wakattors 
SET customization = jsonb_set(customization - 'accessory', '{accessories}', '[]'::jsonb) 
WHERE character_id = 'green_gamma_giant';

-- Wakandan King (was black_panther) - cape, necklace
UPDATE custom_wakattors 
SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["cape", "necklace"]'::jsonb) 
WHERE character_id = 'wakandan_king';

-- Kryptonian Hero (was superman) - cape
UPDATE custom_wakattors 
SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["cape"]'::jsonb) 
WHERE character_id = 'kryptonian_hero';

-- Web-Slinging Hero (was spider_man) - no physical accessories
UPDATE custom_wakattors 
SET customization = jsonb_set(customization - 'accessory', '{accessories}', '[]'::jsonb) 
WHERE character_id = 'web_slinging_hero';

-- ============================================
-- ANIME/MANGA CHARACTERS - Fix with new IDs
-- ============================================

-- Saiyan Martial Artist (was goku) - bandana
UPDATE custom_wakattors 
SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["bandana"]'::jsonb) 
WHERE character_id = 'saiyan_martial_artist';

-- Determined Orange Ninja (was naruto) - bandana (headband)
UPDATE custom_wakattors 
SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["bandana"]'::jsonb) 
WHERE character_id = 'orange_ninja';

-- Short Alchemist Boy (was edward_elric) - cape
UPDATE custom_wakattors 
SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["cape"]'::jsonb) 
WHERE character_id = 'short_alchemist';

-- Elite Survey Soldier (was mikasa_ackerman) - cape, scarf
UPDATE custom_wakattors 
SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["cape", "scarf"]'::jsonb) 
WHERE character_id = 'elite_survey_soldier';

-- ============================================
-- MOVIE/TV CHARACTERS - Fix with new IDs
-- ============================================

-- Grey Wandering Wizard (was gandalf) - staff, hat, beard
UPDATE custom_wakattors 
SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["staff", "hat", "beard"]'::jsonb) 
WHERE character_id = 'grey_wandering_wizard';

-- Brightest Witch of Her Age (was hermione_granger) - wand, book
UPDATE custom_wakattors 
SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["wand", "book"]'::jsonb) 
WHERE character_id = 'brightest_witch';

-- Dark Lord in Black Armor (was darth_vader) - cape, helmet
UPDATE custom_wakattors 
SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["cape", "helmet", "vader_mask"]'::jsonb) 
WHERE character_id = 'dark_lord_armor';

-- Small Green Wise One (was yoda) - cane, staff
UPDATE custom_wakattors 
SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["cane", "staff"]'::jsonb) 
WHERE character_id = 'small_green_sage';

-- Suave British Spy (was james_bond) - gun, bowtie
UPDATE custom_wakattors 
SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["gun", "bowtie"]'::jsonb) 
WHERE character_id = 'suave_british_spy';

-- Alien-Fighting Space Officer (was ellen_ripley) - gun
UPDATE custom_wakattors 
SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["gun"]'::jsonb) 
WHERE character_id = 'alien_fighter';

-- Chemistry Teacher Gone Bad (was walter_white) - glasses, goggles
UPDATE custom_wakattors 
SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["glasses", "goggles"]'::jsonb) 
WHERE character_id = 'chemistry_teacher';

-- Mother of Dragons (was daenerys_targaryen) - cape, tiara
UPDATE custom_wakattors 
SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["cape", "tiara"]'::jsonb) 
WHERE character_id = 'mother_of_dragons';

-- ============================================
-- VIDEO GAME CHARACTERS - Fix with new IDs
-- ============================================

-- Italian Plumber Hero (was mario) - hat, moustache
UPDATE custom_wakattors 
SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["hat", "moustache"]'::jsonb) 
WHERE character_id = 'italian_plumber';

-- Green Armored Spartan (was master_chief) - helmet
UPDATE custom_wakattors 
SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["helmet"]'::jsonb) 
WHERE character_id = 'green_spartan';

-- Hyrulean Princess (was zelda) - tiara, necklace
UPDATE custom_wakattors 
SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["tiara", "necklace"]'::jsonb) 
WHERE character_id = 'hyrulean_princess';

-- ============================================
-- OTHER RENAMED CHARACTERS
-- ============================================

-- Handsome Hope President (was barack_obama) - tie
UPDATE custom_wakattors 
SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["tie"]'::jsonb) 
WHERE character_id = 'handsome_hope_president';

-- ============================================
-- Summary:
-- Fixed accessories for 28 renamed characters
-- All now use the new accessories array format
-- ============================================

