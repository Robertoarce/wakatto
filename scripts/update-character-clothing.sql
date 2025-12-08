-- Update Character Clothing & Accessories
-- Run this in Supabase SQL Editor to update all characters with appropriate clothing/accessories

-- SCIENTISTS & INVENTORS
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"labcoat"'), '{accessory}', '"glasses"') WHERE character_id = 'albert_einstein';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"labcoat"'), '{accessory}', '"necklace"') WHERE character_id = 'marie_curie';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"suit"'), '{accessory}', '"cape"') WHERE character_id = 'isaac_newton';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"vest"'), '{accessory}', '"bowtie"') WHERE character_id = 'nikola_tesla';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"casual"'), '{accessory}', '"glasses"') WHERE character_id = 'stephen_hawking';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"suit"'), '{accessory}', '"hat"') WHERE character_id = 'charles_darwin';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"dress"'), '{accessory}', '"necklace"') WHERE character_id = 'ada_lovelace';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"casual"'), '{accessory}', '"glasses"') WHERE character_id = 'galileo_galilei';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"casual"'), '{accessory}', '"hat"') WHERE character_id = 'leonardo_da_vinci';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"suit"'), '{accessory}', '"tie"') WHERE character_id = 'alan_turing';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"casual"'), '{accessory}', '"scarf"') WHERE character_id = 'jane_goodall';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"vest"'), '{accessory}', '"bowtie"') WHERE character_id = 'thomas_edison';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"labcoat"'), '{accessory}', '"none"') WHERE character_id = 'rosalind_franklin';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"jacket"'), '{accessory}', '"none"') WHERE character_id = 'carl_sagan';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"casual"'), '{accessory}', '"scarf"') WHERE character_id = 'rachel_carson';

-- PHILOSOPHERS
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"casual"'), '{accessory}', '"cape"') WHERE character_id = 'socrates';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"casual"'), '{accessory}', '"hat"') WHERE character_id = 'confucius';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"jacket"'), '{accessory}', '"scarf"') WHERE character_id = 'simone_de_beauvoir';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"suit"'), '{accessory}', '"cape"') WHERE character_id = 'marcus_aurelius';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"casual"'), '{accessory}', '"scarf"') WHERE character_id = 'laozi';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"suit"'), '{accessory}', '"glasses"') WHERE character_id = 'hannah_arendt';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"casual"'), '{accessory}', '"cape"') WHERE character_id = 'aristotle';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"suit"'), '{accessory}', '"bowtie"') WHERE character_id = 'immanuel_kant';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"casual"'), '{accessory}', '"scarf"') WHERE character_id = 'buddha';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"jacket"'), '{accessory}', '"glasses"') WHERE character_id = 'jean_paul_sartre';

-- HISTORICAL LEADERS
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"suit"'), '{accessory}', '"tie"') WHERE character_id = 'barack_obama';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"suit"'), '{accessory}', '"necklace"') WHERE character_id = 'nelson_mandela';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"suit"'), '{accessory}', '"bowtie"') WHERE character_id = 'winston_churchill';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"suit"'), '{accessory}', '"hat"') WHERE character_id = 'abraham_lincoln';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"casual"'), '{accessory}', '"glasses"') WHERE character_id = 'mahatma_gandhi';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"dress"'), '{accessory}', '"crown"') WHERE character_id = 'cleopatra';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"suit"'), '{accessory}', '"tie"') WHERE character_id = 'martin_luther_king';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"suit"'), '{accessory}', '"cape"') WHERE character_id = 'joan_of_arc';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"suit"'), '{accessory}', '"crown"') WHERE character_id = 'alexander_great';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"dress"'), '{accessory}', '"hat"') WHERE character_id = 'rosa_parks';

-- ARTISTS & MUSICIANS
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"casual"'), '{accessory}', '"scarf"') WHERE character_id = 'pablo_picasso';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"dress"'), '{accessory}', '"necklace"') WHERE character_id = 'frida_kahlo';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"suit"'), '{accessory}', '"bowtie"') WHERE character_id = 'wolfgang_mozart';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"suit"'), '{accessory}', '"scarf"') WHERE character_id = 'ludwig_beethoven';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"casual"'), '{accessory}', '"hat"') WHERE character_id = 'vincent_van_gogh';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"apron"'), '{accessory}', '"scarf"') WHERE character_id = 'michelangelo';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"casual"'), '{accessory}', '"necklace"') WHERE character_id = 'maya_angelou';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"casual"'), '{accessory}', '"headphones"') WHERE character_id = 'bob_marley';

-- WRITERS
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"vest"'), '{accessory}', '"cape"') WHERE character_id = 'william_shakespeare';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"suit"'), '{accessory}', '"tie"') WHERE character_id = 'jrr_tolkien';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"casual"'), '{accessory}', '"scarf"') WHERE character_id = 'jk_rowling';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"dress"'), '{accessory}', '"necklace"') WHERE character_id = 'jane_austen';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"suit"'), '{accessory}', '"bowtie"') WHERE character_id = 'oscar_wilde';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"vest"'), '{accessory}', '"bowtie"') WHERE character_id = 'mark_twain';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"dress"'), '{accessory}', '"necklace"') WHERE character_id = 'emily_dickinson';

-- SUPERHEROES
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"suit"'), '{accessory}', '"cape"') WHERE character_id = 'superman';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"suit"'), '{accessory}', '"cape"') WHERE character_id = 'batman';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"suit"'), '{accessory}', '"crown"') WHERE character_id = 'wonder_woman';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"suit"'), '{accessory}', '"backpack"') WHERE character_id = 'spider_man';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"suit"'), '{accessory}', '"glasses"') WHERE character_id = 'iron_man';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"suit"'), '{accessory}', '"backpack"') WHERE character_id = 'captain_america';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"suit"'), '{accessory}', '"necklace"') WHERE character_id = 'black_widow';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"suit"'), '{accessory}', '"cape"') WHERE character_id = 'thor';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"casual"'), '{accessory}', '"none"') WHERE character_id = 'hulk';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"suit"'), '{accessory}', '"necklace"') WHERE character_id = 'black_panther';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"cape"'), '{accessory}', '"cape"') WHERE character_id = 'doctor_strange';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"suit"'), '{accessory}', '"crown"') WHERE character_id = 'scarlet_witch';

-- ANIME/MANGA
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"casual"'), '{accessory}', '"backpack"') WHERE character_id = 'goku';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"hoodie"'), '{accessory}', '"headphones"') WHERE character_id = 'naruto';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"vest"'), '{accessory}', '"hat"') WHERE character_id = 'luffy';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"dress"'), '{accessory}', '"crown"') WHERE character_id = 'sailor_moon';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"suit"'), '{accessory}', '"tie"') WHERE character_id = 'light_yagami';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"jacket"'), '{accessory}', '"cape"') WHERE character_id = 'edward_elric';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"suit"'), '{accessory}', '"tie"') WHERE character_id = 'spike_spiegel';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"casual"'), '{accessory}', '"none"') WHERE character_id = 'totoro';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"jacket"'), '{accessory}', '"hat"') WHERE character_id = 'ash_ketchum';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"suit"'), '{accessory}', '"scarf"') WHERE character_id = 'mikasa_ackerman';

-- MOVIE/TV
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"suit"'), '{accessory}', '"cape"') WHERE character_id = 'darth_vader';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"casual"'), '{accessory}', '"cape"') WHERE character_id = 'yoda';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"casual"'), '{accessory}', '"hat"') WHERE character_id = 'gandalf';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"casual"'), '{accessory}', '"scarf"') WHERE character_id = 'hermione_granger';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"jacket"'), '{accessory}', '"hat"') WHERE character_id = 'sherlock_holmes';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"suit"'), '{accessory}', '"bowtie"') WHERE character_id = 'james_bond';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"suit"'), '{accessory}', '"none"') WHERE character_id = 'ellen_ripley';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"jacket"'), '{accessory}', '"backpack"') WHERE character_id = 'katniss_everdeen';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"labcoat"'), '{accessory}', '"glasses"') WHERE character_id = 'walter_white';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"dress"'), '{accessory}', '"crown"') WHERE character_id = 'daenerys_targaryen';

-- VIDEO GAMES
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"casual"'), '{accessory}', '"hat"') WHERE character_id = 'mario';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"casual"'), '{accessory}', '"backpack"') WHERE character_id = 'sonic';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"casual"'), '{accessory}', '"hat"') WHERE character_id = 'link';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"casual"'), '{accessory}', '"backpack"') WHERE character_id = 'lara_croft';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"suit"'), '{accessory}', '"backpack"') WHERE character_id = 'master_chief';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"casual"'), '{accessory}', '"cape"') WHERE character_id = 'kratos';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"dress"'), '{accessory}', '"crown"') WHERE character_id = 'zelda';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"casual"'), '{accessory}', '"backpack"') WHERE character_id = 'cloud_strife';

-- FICTIONAL ORIGINALS
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"suit"'), '{accessory}', '"cape"') WHERE character_id = 'captain_stardust';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"dress"'), '{accessory}', '"wings"') WHERE character_id = 'luna_whisper';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"labcoat"'), '{accessory}', '"glasses"') WHERE character_id = 'dr_chronos';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"casual"'), '{accessory}', '"cape"') WHERE character_id = 'ember_phoenix';
UPDATE custom_wakattors SET customization = jsonb_set(jsonb_set(customization, '{clothing}', '"suit"'), '{accessory}', '"cape"') WHERE character_id = 'atlas_strongheart';

-- Verify updates
SELECT character_id, name, 
  customization->>'clothing' as clothing,
  customization->>'accessory' as accessory
FROM custom_wakattors 
WHERE is_public = true 
ORDER BY name;

