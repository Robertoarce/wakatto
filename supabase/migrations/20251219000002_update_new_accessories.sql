-- Migration: Update characters with new accessories (batch 2)
-- Date: 2025-12-19
-- New accessories: sunglasses, goggles, turban, beret, bandana, helmet, tiara, halo, horns,
--                  medal, stethoscope, badge, dog_tags, chain, sword, staff, wand, shield,
--                  book, gun, portal_gun, pipe, cigar, dog, cat, owl, snake, falcon, raven

-- ============================================
-- SUPERHEROES - Updated with new props
-- ============================================

-- Wonder Woman - tiara, shield, sword
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["tiara", "shield", "sword", "cape"]'::jsonb) WHERE character_id = 'wonder_woman';

-- Thor - cape, helmet (winged)
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["helmet", "cape"]'::jsonb) WHERE character_id = 'thor';

-- Captain America - shield
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["shield"]'::jsonb) WHERE character_id = 'captain_america';

-- Batman - cape, sunglasses (dark)
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["cape", "sunglasses"]'::jsonb) WHERE character_id = 'batman';

-- Doctor Strange - cape
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["cape", "staff"]'::jsonb) WHERE character_id = 'doctor_strange';

-- Scarlet Witch - tiara, cape
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["tiara", "cape"]'::jsonb) WHERE character_id = 'scarlet_witch';

-- Iron Man - goggles (tech)
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["goggles"]'::jsonb) WHERE character_id = 'iron_man';

-- Black Widow - gun, sunglasses
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["gun", "sunglasses"]'::jsonb) WHERE character_id = 'black_widow';

-- ============================================
-- ANIME/GAME CHARACTERS
-- ============================================

-- Goku - bandana (for training)
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["bandana"]'::jsonb) WHERE character_id = 'goku';

-- Naruto - bandana (headband)
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["bandana"]'::jsonb) WHERE character_id = 'naruto';

-- ============================================
-- HISTORICAL MILITARY LEADERS
-- ============================================

-- Joan of Arc - helmet, sword
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["helmet", "sword", "cape"]'::jsonb) WHERE character_id = 'joan_of_arc';

-- Alexander the Great - helmet, sword
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["helmet", "sword", "crown", "cape"]'::jsonb) WHERE character_id = 'alexander_great';

-- ============================================
-- WRITERS & ARTISTS - Updated props
-- ============================================

-- J.R.R. Tolkien - pipe, book
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["glasses", "pipe", "book"]'::jsonb) WHERE character_id = 'jrr_tolkien';

-- J.K. Rowling - book, wand
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["glasses", "book", "wand", "owl"]'::jsonb) WHERE character_id = 'jk_rowling';

-- Oscar Wilde - cane, sunflower (necklace as tie substitute)
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["cane", "scarf", "monocle"]'::jsonb) WHERE character_id = 'oscar_wilde';

-- Mark Twain - pipe, moustache
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["moustache", "pipe", "hat"]'::jsonb) WHERE character_id = 'mark_twain';

-- ============================================
-- PAINTERS - Unique props
-- ============================================

-- Frida Kahlo - necklace, parrot
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["necklace", "parrot"]'::jsonb) WHERE character_id = 'frida_kahlo';

-- Vincent van Gogh - pipe, hat
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["pipe", "hat", "bandana"]'::jsonb) WHERE character_id = 'vincent_van_gogh';

-- Pablo Picasso - beret
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["beret"]'::jsonb) WHERE character_id = 'pablo_picasso';

-- Michelangelo - beret, chisel (as cane)
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["beret", "beard"]'::jsonb) WHERE character_id = 'michelangelo';

-- ============================================
-- MUSICIANS
-- ============================================

-- Bob Marley - bandana
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["bandana", "sunglasses"]'::jsonb) WHERE character_id = 'bob_marley';

-- Mozart - monocle
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["monocle", "bowtie"]'::jsonb) WHERE character_id = 'wolfgang_mozart';

-- Beethoven - cape
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["cape", "scarf"]'::jsonb) WHERE character_id = 'ludwig_beethoven';

-- ============================================
-- RELIGIOUS/SPIRITUAL FIGURES
-- ============================================

-- Buddha - halo
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["halo"]'::jsonb) WHERE character_id = 'buddha';

-- ============================================
-- SCIENTISTS WITH NEW PROPS
-- ============================================

-- Nikola Tesla - goggles (inventor)
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["moustache", "bowtie", "goggles"]'::jsonb) WHERE character_id = 'nikola_tesla';

-- Thomas Edison - goggles
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["glasses", "bowtie", "suspenders", "goggles"]'::jsonb) WHERE character_id = 'thomas_edison';

-- ============================================
-- MEDICAL CHARACTERS (if any exist)
-- ============================================

-- Add stethoscope to any doctor characters in future

-- ============================================
-- FANTASY/MYTHOLOGY ARCHETYPES (for future)
-- ============================================

-- Merlin-type: staff, hat, beard, owl
-- Viking: helmet, horns, beard, sword, shield
-- Wizard: wand, book, staff
-- Knight: helmet, sword, shield, cape

-- ============================================
-- COMPANIONS FOR HISTORICAL FIGURES
-- ============================================

-- Jane Goodall - with companion animals
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["glasses", "backpack", "snake"]'::jsonb) WHERE character_id = 'jane_goodall';

-- Charles Darwin - with finch/raven
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["beard", "glasses", "hat", "raven"]'::jsonb) WHERE character_id = 'charles_darwin';

-- Edgar Allan Poe (if exists) - raven
-- Future character: Add raven companion

-- Athena/wisdom characters - owl companion

-- ============================================
-- PIRATE BLACKBEARD - Full gear update
-- ============================================

UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["beard", "eye_patch", "hat", "parrot", "hook", "sword", "gun"]'::jsonb) WHERE character_id = 'blackbeard';
