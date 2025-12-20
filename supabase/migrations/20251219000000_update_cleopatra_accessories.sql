-- Migration: Update all Wakattors with thematic accessories
-- Date: 2025-12-19

-- ============================================
-- SCIENTISTS & INVENTORS (glasses, tie/bowtie)
-- ============================================

-- Albert Einstein - wild hair physicist
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["glasses", "moustache", "suspenders"]'::jsonb) WHERE character_id = 'albert_einstein';

-- Marie Curie - pioneering chemist
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["glasses", "necklace"]'::jsonb) WHERE character_id = 'marie_curie';

-- Isaac Newton - mathematician with wig era style
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["glasses", "cane"]'::jsonb) WHERE character_id = 'isaac_newton';

-- Nikola Tesla - eccentric inventor
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["moustache", "bowtie"]'::jsonb) WHERE character_id = 'nikola_tesla';

-- Stephen Hawking - cosmologist
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["glasses", "wheelchair"]'::jsonb) WHERE character_id = 'stephen_hawking';

-- Charles Darwin - naturalist with iconic beard
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["beard", "glasses", "hat"]'::jsonb) WHERE character_id = 'charles_darwin';

-- Ada Lovelace - first programmer, Victorian era
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["necklace", "hat"]'::jsonb) WHERE character_id = 'ada_lovelace';

-- Galileo Galilei - astronomer
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["beard", "glasses"]'::jsonb) WHERE character_id = 'galileo_galilei';

-- Leonardo da Vinci - Renaissance polymath
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["beard", "hat", "cape"]'::jsonb) WHERE character_id = 'leonardo_da_vinci';

-- Alan Turing - computer scientist
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["glasses", "tie"]'::jsonb) WHERE character_id = 'alan_turing';

-- Jane Goodall - primatologist
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["glasses", "backpack"]'::jsonb) WHERE character_id = 'jane_goodall';

-- Thomas Edison - inventor
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["glasses", "bowtie", "suspenders"]'::jsonb) WHERE character_id = 'thomas_edison';

-- Rosalind Franklin - chemist
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["glasses", "necklace"]'::jsonb) WHERE character_id = 'rosalind_franklin';

-- Carl Sagan - astronomer
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["glasses", "tie"]'::jsonb) WHERE character_id = 'carl_sagan';

-- Rachel Carson - marine biologist
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["glasses", "scarf"]'::jsonb) WHERE character_id = 'rachel_carson';

-- ============================================
-- PHILOSOPHERS (beard for ancients, glasses for modern)
-- ============================================

-- Socrates - ancient Greek
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["beard", "cape"]'::jsonb) WHERE character_id = 'socrates';

-- Confucius - Chinese sage
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["beard", "hat"]'::jsonb) WHERE character_id = 'confucius';

-- Simone de Beauvoir - French philosopher
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["glasses", "scarf", "necklace"]'::jsonb) WHERE character_id = 'simone_de_beauvoir';

-- Marcus Aurelius - Roman Emperor philosopher
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["beard", "crown", "cape"]'::jsonb) WHERE character_id = 'marcus_aurelius';

-- Laozi - Taoist sage
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["beard", "cane"]'::jsonb) WHERE character_id = 'laozi';

-- Hannah Arendt - political theorist
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["glasses", "necklace"]'::jsonb) WHERE character_id = 'hannah_arendt';

-- Aristotle - ancient Greek
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["beard", "cape"]'::jsonb) WHERE character_id = 'aristotle';

-- Immanuel Kant - German philosopher
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["glasses", "cane", "top_hat"]'::jsonb) WHERE character_id = 'immanuel_kant';

-- Buddha - spiritual teacher
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '[]'::jsonb) WHERE character_id = 'buddha';

-- Jean-Paul Sartre - existentialist
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["glasses", "scarf"]'::jsonb) WHERE character_id = 'jean_paul_sartre';

-- ============================================
-- LEADERS & POLITICIANS (tie, formal)
-- ============================================

-- Barack Obama - US President
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["tie"]'::jsonb) WHERE character_id = 'barack_obama';

-- Nelson Mandela - South African President
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["glasses", "cane"]'::jsonb) WHERE character_id = 'nelson_mandela';

-- Winston Churchill - British PM
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["bowtie", "hat", "cane"]'::jsonb) WHERE character_id = 'winston_churchill';

-- Abraham Lincoln - US President with iconic beard & hat
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["beard", "top_hat", "bowtie"]'::jsonb) WHERE character_id = 'abraham_lincoln';

-- Mahatma Gandhi - Indian leader
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["glasses", "cane"]'::jsonb) WHERE character_id = 'mahatma_gandhi';

-- ============================================
-- ROYALTY & MILITARY (crown, cape, armor)
-- ============================================

-- Cleopatra - Egyptian Pharaoh with lion
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["crown", "necklace", "lion"]'::jsonb) WHERE character_id = 'cleopatra';

-- Joan of Arc - French military leader
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["cape", "necklace"]'::jsonb) WHERE character_id = 'joan_of_arc';

-- Alexander the Great - King & Conqueror
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["crown", "cape"]'::jsonb) WHERE character_id = 'alexander_great';

-- ============================================
-- CIVIL RIGHTS ACTIVISTS
-- ============================================

-- Martin Luther King Jr.
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["tie", "glasses"]'::jsonb) WHERE character_id = 'martin_luther_king';

-- Rosa Parks
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["glasses", "hat", "necklace"]'::jsonb) WHERE character_id = 'rosa_parks';

-- ============================================
-- DEFAULT CHARACTERS (from characters.ts)
-- ============================================

-- Sigmund Freud - psychoanalyst with glasses & beard
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["glasses", "beard", "tie"]'::jsonb) WHERE character_id = 'freud';

-- Carl Jung - Swiss psychiatrist
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["glasses", "moustache", "tie"]'::jsonb) WHERE character_id = 'jung';

-- Alfred Adler - Austrian psychotherapist
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["glasses", "bowtie"]'::jsonb) WHERE character_id = 'adler';

-- Martin Seligman - positive psychology
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["glasses", "tie"]'::jsonb) WHERE character_id = 'seligman';

-- Brene Brown - researcher
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["glasses", "necklace", "scarf"]'::jsonb) WHERE character_id = 'brown';

-- Viktor Frankl - Holocaust survivor, psychiatrist
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["glasses", "tie"]'::jsonb) WHERE character_id = 'frankl';

-- Epictetus - Stoic philosopher
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["beard", "cape", "cane"]'::jsonb) WHERE character_id = 'epictetus';

-- Friedrich Nietzsche - philosopher with iconic moustache
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["moustache", "glasses"]'::jsonb) WHERE character_id = 'nietzsche';

-- Mihaly Csikszentmihalyi - flow psychologist
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["glasses", "bowtie"]'::jsonb) WHERE character_id = 'csikszentmihalyi';

-- Thich Nhat Hanh - Buddhist monk
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '[]'::jsonb) WHERE character_id = 'nhathanh';

-- Blackbeard - legendary pirate (full pirate gear!)
UPDATE custom_wakattors SET customization = jsonb_set(customization - 'accessory', '{accessories}', '["beard", "eye_patch", "hat", "parrot", "hook"]'::jsonb) WHERE character_id = 'blackbeard';
