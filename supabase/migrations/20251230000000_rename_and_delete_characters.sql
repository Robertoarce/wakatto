-- Migration: Rename trademarked characters and delete specified characters
-- Run: supabase db push

-- ============================================
-- STEP 1: DELETE specified characters
-- ============================================
DELETE FROM custom_wakattors WHERE character_id IN (
  'ash_ketchum',
  'atlas_strongheart',
  'captain_stardust',
  'cloud_strife',
  'jk_rowling',
  'jrr_tolkien',
  'jane_austen',
  'katniss_everdeen',
  'kratos',
  'lara_croft',
  'light_yagami',
  'link',
  'luna_whispermoon',
  'luffy',
  'sailor_moon',
  'simone_de_beauvoir',
  'sonic',
  'spike_spiegel',
  'totoro'
);

-- ============================================
-- STEP 2: RENAME trademarked characters
-- ============================================

-- Superheroes (DC/Marvel)
UPDATE custom_wakattors SET character_id = 'kryptonian_hero', name = 'Kryptonian Hero' WHERE character_id = 'superman';
UPDATE custom_wakattors SET character_id = 'dark_knight_detective', name = 'Dark Knight Detective' WHERE character_id = 'batman';
UPDATE custom_wakattors SET character_id = 'amazon_warrior_princess', name = 'Amazon Warrior Princess' WHERE character_id = 'wonder_woman';
UPDATE custom_wakattors SET character_id = 'web_slinging_hero', name = 'Web-Slinging Hero' WHERE character_id = 'spider_man';
UPDATE custom_wakattors SET character_id = 'armored_tech_genius', name = 'Armored Tech Genius' WHERE character_id = 'iron_man';
UPDATE custom_wakattors SET character_id = 'star_spangled_soldier', name = 'Star-Spangled Soldier' WHERE character_id = 'captain_america';
UPDATE custom_wakattors SET character_id = 'red_room_spy', name = 'Red Room Spy' WHERE character_id = 'black_widow';
UPDATE custom_wakattors SET character_id = 'thunder_god_warrior', name = 'Thunder God Warrior' WHERE character_id = 'thor';
UPDATE custom_wakattors SET character_id = 'green_gamma_giant', name = 'Green Gamma Giant' WHERE character_id = 'hulk';
UPDATE custom_wakattors SET character_id = 'wakandan_king', name = 'Wakandan King' WHERE character_id = 'black_panther';
UPDATE custom_wakattors SET character_id = 'sorcerer_supreme', name = 'Sorcerer Supreme' WHERE character_id = 'doctor_strange';
UPDATE custom_wakattors SET character_id = 'chaos_magic_wielder', name = 'Chaos Magic Wielder' WHERE character_id = 'scarlet_witch';

-- Anime/Manga
UPDATE custom_wakattors SET character_id = 'saiyan_martial_artist', name = 'Saiyan Martial Artist' WHERE character_id = 'goku';
UPDATE custom_wakattors SET character_id = 'orange_ninja', name = 'Determined Orange Ninja' WHERE character_id = 'naruto';
UPDATE custom_wakattors SET character_id = 'short_alchemist', name = 'Short Alchemist Boy' WHERE character_id = 'edward_elric';
UPDATE custom_wakattors SET character_id = 'elite_survey_soldier', name = 'Elite Survey Soldier' WHERE character_id = 'mikasa_ackerman';

-- Movie/TV
UPDATE custom_wakattors SET character_id = 'dark_lord_armor', name = 'Dark Lord in Black Armor' WHERE character_id = 'darth_vader';
UPDATE custom_wakattors SET character_id = 'small_green_sage', name = 'Small Green Wise One' WHERE character_id = 'yoda';
UPDATE custom_wakattors SET character_id = 'grey_wandering_wizard', name = 'Grey Wandering Wizard' WHERE character_id = 'gandalf';
UPDATE custom_wakattors SET character_id = 'brightest_witch', name = 'Brightest Witch of Her Age' WHERE character_id = 'hermione_granger';
UPDATE custom_wakattors SET character_id = 'suave_british_spy', name = 'Suave British Spy' WHERE character_id = 'james_bond';
UPDATE custom_wakattors SET character_id = 'alien_fighter', name = 'Alien-Fighting Space Officer' WHERE character_id = 'ellen_ripley';
UPDATE custom_wakattors SET character_id = 'chemistry_teacher', name = 'Chemistry Teacher Gone Bad' WHERE character_id = 'walter_white';
UPDATE custom_wakattors SET character_id = 'mother_of_dragons', name = 'Mother of Dragons' WHERE character_id = 'daenerys_targaryen';

-- Video Games
UPDATE custom_wakattors SET character_id = 'italian_plumber', name = 'Italian Plumber Hero' WHERE character_id = 'mario';
UPDATE custom_wakattors SET character_id = 'green_spartan', name = 'Green Armored Spartan' WHERE character_id = 'master_chief';
UPDATE custom_wakattors SET character_id = 'hyrulean_princess', name = 'Hyrulean Princess' WHERE character_id = 'zelda';

-- Recent Real People (funny descriptions)
UPDATE custom_wakattors SET character_id = 'handsome_hope_president', name = 'Handsome Hope President' WHERE character_id = 'barack_obama';

-- ============================================
-- STEP 3: Also update any message references
-- ============================================
-- Update character_id in messages table for renamed characters
UPDATE messages SET character_id = 'kryptonian_hero' WHERE character_id = 'superman';
UPDATE messages SET character_id = 'dark_knight_detective' WHERE character_id = 'batman';
UPDATE messages SET character_id = 'amazon_warrior_princess' WHERE character_id = 'wonder_woman';
UPDATE messages SET character_id = 'web_slinging_hero' WHERE character_id = 'spider_man';
UPDATE messages SET character_id = 'armored_tech_genius' WHERE character_id = 'iron_man';
UPDATE messages SET character_id = 'star_spangled_soldier' WHERE character_id = 'captain_america';
UPDATE messages SET character_id = 'red_room_spy' WHERE character_id = 'black_widow';
UPDATE messages SET character_id = 'thunder_god_warrior' WHERE character_id = 'thor';
UPDATE messages SET character_id = 'green_gamma_giant' WHERE character_id = 'hulk';
UPDATE messages SET character_id = 'wakandan_king' WHERE character_id = 'black_panther';
UPDATE messages SET character_id = 'sorcerer_supreme' WHERE character_id = 'doctor_strange';
UPDATE messages SET character_id = 'chaos_magic_wielder' WHERE character_id = 'scarlet_witch';
UPDATE messages SET character_id = 'saiyan_martial_artist' WHERE character_id = 'goku';
UPDATE messages SET character_id = 'orange_ninja' WHERE character_id = 'naruto';
UPDATE messages SET character_id = 'short_alchemist' WHERE character_id = 'edward_elric';
UPDATE messages SET character_id = 'elite_survey_soldier' WHERE character_id = 'mikasa_ackerman';
UPDATE messages SET character_id = 'dark_lord_armor' WHERE character_id = 'darth_vader';
UPDATE messages SET character_id = 'small_green_sage' WHERE character_id = 'yoda';
UPDATE messages SET character_id = 'grey_wandering_wizard' WHERE character_id = 'gandalf';
UPDATE messages SET character_id = 'brightest_witch' WHERE character_id = 'hermione_granger';
UPDATE messages SET character_id = 'suave_british_spy' WHERE character_id = 'james_bond';
UPDATE messages SET character_id = 'alien_fighter' WHERE character_id = 'ellen_ripley';
UPDATE messages SET character_id = 'chemistry_teacher' WHERE character_id = 'walter_white';
UPDATE messages SET character_id = 'mother_of_dragons' WHERE character_id = 'daenerys_targaryen';
UPDATE messages SET character_id = 'italian_plumber' WHERE character_id = 'mario';
UPDATE messages SET character_id = 'green_spartan' WHERE character_id = 'master_chief';
UPDATE messages SET character_id = 'hyrulean_princess' WHERE character_id = 'zelda';
UPDATE messages SET character_id = 'handsome_hope_president' WHERE character_id = 'barack_obama';

-- Delete message references to deleted characters
UPDATE messages SET character_id = NULL WHERE character_id IN (
  'ash_ketchum', 'atlas_strongheart', 'captain_stardust', 'cloud_strife',
  'jk_rowling', 'jrr_tolkien', 'jane_austen', 'katniss_everdeen', 'kratos',
  'lara_croft', 'light_yagami', 'link', 'luna_whispermoon', 'luffy',
  'sailor_moon', 'simone_de_beauvoir', 'sonic', 'spike_spiegel', 'totoro'
);

-- ============================================
-- Summary of changes:
-- - Deleted: 19 characters
-- - Renamed: 28 characters
-- - Remaining: ~81 characters
-- ============================================
