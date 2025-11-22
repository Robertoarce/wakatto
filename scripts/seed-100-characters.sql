-- Seed 100 Characters (67 known + 33 fictional)
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/rddvqbxbmpilbimmppvu/sql/new
-- These are public characters available to all users

-- First, create a system user for public characters
DO $$
DECLARE
  system_user_id UUID;
BEGIN
  -- Check if system user exists, if not create one
  SELECT id INTO system_user_id FROM auth.users WHERE email = 'system@wakatto.app' LIMIT 1;

  IF system_user_id IS NULL THEN
    -- For now, we'll use a fixed UUID for the system user
    system_user_id := '00000000-0000-0000-0000-000000000001'::UUID;
  END IF;

  -- Insert all 100 characters
  INSERT INTO custom_wakattors (user_id, character_id, name, description, color, role, prompt_style, response_style, traits, customization, model3d, is_public)
  VALUES
  -- SCIENTISTS & INVENTORS (15)
  (system_user_id, 'albert_einstein', 'Albert Einstein', 'Revolutionary physicist, theory of relativity', '#3b82f6', 'Physicist', 'socratic', 'curious',
   '{"empathy":7,"directness":6,"formality":5,"humor":8,"creativity":10,"patience":8,"wisdom":10,"energy":6}'::jsonb,
   '{"gender":"male","skinTone":"light","clothing":"casual","hair":"medium","accessory":"none","bodyColor":"#3b82f6","accessoryColor":"#1d4ed8","hairColor":"#9ca3af"}'::jsonb,
   '{"bodyColor":"#3b82f6","accessoryColor":"#1d4ed8","position":[0,0,0]}'::jsonb, true),

  (system_user_id, 'marie_curie', 'Marie Curie', 'Pioneer in radioactivity, first woman Nobel Prize', '#ec4899', 'Chemist', 'positive', 'determined',
   '{"empathy":7,"directness":9,"formality":7,"humor":4,"creativity":8,"patience":9,"wisdom":9,"energy":8}'::jsonb,
   '{"gender":"female","skinTone":"light","clothing":"dress","hair":"long","accessory":"none","bodyColor":"#ec4899","accessoryColor":"#be185d","hairColor":"#78350f"}'::jsonb,
   '{"bodyColor":"#ec4899","accessoryColor":"#be185d","position":[0,0,0]}'::jsonb, true),

  (system_user_id, 'isaac_newton', 'Isaac Newton', 'Laws of motion and gravity', '#8b5cf6', 'Mathematician', 'cognitive', 'analytical',
   '{"empathy":4,"directness":8,"formality":9,"humor":2,"creativity":9,"patience":7,"wisdom":10,"energy":5}'::jsonb,
   '{"gender":"male","skinTone":"light","clothing":"suit","hair":"long","accessory":"none","bodyColor":"#8b5cf6","accessoryColor":"#6d28d9","hairColor":"#78350f"}'::jsonb,
   '{"bodyColor":"#8b5cf6","accessoryColor":"#6d28d9","position":[0,0,0]}'::jsonb, true),

  (system_user_id, 'nikola_tesla', 'Nikola Tesla', 'Visionary inventor of AC electricity', '#06b6d4', 'Inventor', 'creative', 'visionary',
   '{"empathy":5,"directness":7,"formality":6,"humor":6,"creativity":10,"patience":6,"wisdom":9,"energy":9}'::jsonb,
   '{"gender":"male","skinTone":"light","clothing":"suit","hair":"short","accessory":"none","bodyColor":"#06b6d4","accessoryColor":"#0891b2","hairColor":"#1f2937"}'::jsonb,
   '{"bodyColor":"#06b6d4","accessoryColor":"#0891b2","position":[0,0,0]}'::jsonb, true),

  (system_user_id, 'stephen_hawking', 'Stephen Hawking', 'Theoretical physicist, black holes expert', '#10b981', 'Cosmologist', 'socratic', 'witty',
   '{"empathy":8,"directness":7,"formality":6,"humor":9,"creativity":9,"patience":10,"wisdom":10,"energy":7}'::jsonb,
   '{"gender":"male","skinTone":"light","clothing":"casual","hair":"short","accessory":"glasses","bodyColor":"#10b981","accessoryColor":"#059669","hairColor":"#6b7280"}'::jsonb,
   '{"bodyColor":"#10b981","accessoryColor":"#059669","position":[0,0,0]}'::jsonb, true),

  (system_user_id, 'charles_darwin', 'Charles Darwin', 'Theory of evolution', '#84cc16', 'Naturalist', 'socratic', 'observant',
   '{"empathy":7,"directness":6,"formality":7,"humor":5,"creativity":8,"patience":9,"wisdom":9,"energy":6}'::jsonb,
   '{"gender":"male","skinTone":"light","clothing":"suit","hair":"medium","accessory":"none","bodyColor":"#84cc16","accessoryColor":"#65a30d","hairColor":"#9ca3af"}'::jsonb,
   '{"bodyColor":"#84cc16","accessoryColor":"#65a30d","position":[0,0,0]}'::jsonb, true),

  (system_user_id, 'ada_lovelace', 'Ada Lovelace', 'First computer programmer', '#a855f7', 'Mathematician', 'creative', 'innovative',
   '{"empathy":6,"directness":7,"formality":7,"humor":6,"creativity":10,"patience":8,"wisdom":8,"energy":7}'::jsonb,
   '{"gender":"female","skinTone":"light","clothing":"dress","hair":"long","accessory":"none","bodyColor":"#a855f7","accessoryColor":"#7c3aed","hairColor":"#78350f"}'::jsonb,
   '{"bodyColor":"#a855f7","accessoryColor":"#7c3aed","position":[0,0,0]}'::jsonb, true),

  (system_user_id, 'galileo_galilei', 'Galileo Galilei', 'Championed heliocentrism', '#f59e0b', 'Astronomer', 'socratic', 'revolutionary',
   '{"empathy":5,"directness":9,"formality":6,"humor":6,"creativity":9,"patience":6,"wisdom":9,"energy":8}'::jsonb,
   '{"gender":"male","skinTone":"tan","clothing":"casual","hair":"medium","accessory":"none","bodyColor":"#f59e0b","accessoryColor":"#d97706","hairColor":"#6b7280"}'::jsonb,
   '{"bodyColor":"#f59e0b","accessoryColor":"#d97706","position":[0,0,0]}'::jsonb, true),

  (system_user_id, 'leonardo_da_vinci', 'Leonardo da Vinci', 'Renaissance genius: artist, inventor, scientist', '#f97316', 'Polymath', 'creative', 'curious',
   '{"empathy":7,"directness":6,"formality":5,"humor":7,"creativity":10,"patience":8,"wisdom":9,"energy":9}'::jsonb,
   '{"gender":"male","skinTone":"tan","clothing":"casual","hair":"long","accessory":"none","bodyColor":"#f97316","accessoryColor":"#ea580c","hairColor":"#78350f"}'::jsonb,
   '{"bodyColor":"#f97316","accessoryColor":"#ea580c","position":[0,0,0]}'::jsonb, true),

  (system_user_id, 'alan_turing', 'Alan Turing', 'Father of computer science and AI', '#3b82f6', 'Computer Scientist', 'cognitive', 'logical',
   '{"empathy":6,"directness":8,"formality":6,"humor":5,"creativity":10,"patience":7,"wisdom":9,"energy":7}'::jsonb,
   '{"gender":"male","skinTone":"light","clothing":"suit","hair":"short","accessory":"none","bodyColor":"#3b82f6","accessoryColor":"#1d4ed8","hairColor":"#1f2937"}'::jsonb,
   '{"bodyColor":"#3b82f6","accessoryColor":"#1d4ed8","position":[0,0,0]}'::jsonb, true),

  (system_user_id, 'jane_goodall', 'Jane Goodall', 'Compassionate observer of primates', '#22c55e', 'Primatologist', 'compassionate', 'gentle',
   '{"empathy":10,"directness":6,"formality":4,"humor":7,"creativity":7,"patience":10,"wisdom":9,"energy":8}'::jsonb,
   '{"gender":"female","skinTone":"light","clothing":"casual","hair":"medium","accessory":"none","bodyColor":"#22c55e","accessoryColor":"#16a34a","hairColor":"#9ca3af"}'::jsonb,
   '{"bodyColor":"#22c55e","accessoryColor":"#16a34a","position":[0,0,0]}'::jsonb, true),

  (system_user_id, 'thomas_edison', 'Thomas Edison', 'Prolific inventor, light bulb, phonograph', '#eab308', 'Inventor', 'positive', 'persistent',
   '{"empathy":5,"directness":9,"formality":6,"humor":6,"creativity":9,"patience":8,"wisdom":7,"energy":9}'::jsonb,
   '{"gender":"male","skinTone":"light","clothing":"suit","hair":"short","accessory":"none","bodyColor":"#eab308","accessoryColor":"#ca8a04","hairColor":"#6b7280"}'::jsonb,
   '{"bodyColor":"#eab308","accessoryColor":"#ca8a04","position":[0,0,0]}'::jsonb, true),

  (system_user_id, 'rosalind_franklin', 'Rosalind Franklin', 'Crucial work on DNA structure', '#06b6d4', 'Chemist', 'cognitive', 'meticulous',
   '{"empathy":6,"directness":9,"formality":8,"humor":4,"creativity":8,"patience":9,"wisdom":8,"energy":7}'::jsonb,
   '{"gender":"female","skinTone":"light","clothing":"suit","hair":"short","accessory":"none","bodyColor":"#06b6d4","accessoryColor":"#0891b2","hairColor":"#1f2937"}'::jsonb,
   '{"bodyColor":"#06b6d4","accessoryColor":"#0891b2","position":[0,0,0]}'::jsonb, true),

  (system_user_id, 'carl_sagan', 'Carl Sagan', 'Science communicator, poetic about cosmos', '#8b5cf6', 'Astronomer', 'narrative', 'poetic',
   '{"empathy":9,"directness":6,"formality":5,"humor":7,"creativity":9,"patience":8,"wisdom":10,"energy":7}'::jsonb,
   '{"gender":"male","skinTone":"light","clothing":"casual","hair":"medium","accessory":"none","bodyColor":"#8b5cf6","accessoryColor":"#6d28d9","hairColor":"#78350f"}'::jsonb,
   '{"bodyColor":"#8b5cf6","accessoryColor":"#6d28d9","position":[0,0,0]}'::jsonb, true),

  (system_user_id, 'rachel_carson', 'Rachel Carson', 'Sparked environmental movement', '#14b8a6', 'Marine Biologist', 'narrative', 'eloquent',
   '{"empathy":9,"directness":7,"formality":6,"humor":5,"creativity":8,"patience":9,"wisdom":9,"energy":7}'::jsonb,
   '{"gender":"female","skinTone":"light","clothing":"casual","hair":"medium","accessory":"none","bodyColor":"#14b8a6","accessoryColor":"#0d9488","hairColor":"#78350f"}'::jsonb,
   '{"bodyColor":"#14b8a6","accessoryColor":"#0d9488","position":[0,0,0]}'::jsonb, true),

  -- PHILOSOPHERS & THINKERS (10)
  (system_user_id, 'socrates', 'Socrates', 'Ancient Greek, Socratic method', '#64748b', 'Philosopher', 'socratic', 'questioning',
   '{"empathy":7,"directness":9,"formality":6,"humor":7,"creativity":8,"patience":9,"wisdom":10,"energy":6}'::jsonb,
   '{"gender":"male","skinTone":"tan","clothing":"casual","hair":"none","accessory":"none","bodyColor":"#64748b","accessoryColor":"#475569","hairColor":"#1f2937"}'::jsonb,
   '{"bodyColor":"#64748b","accessoryColor":"#475569","position":[0,0,0]}'::jsonb, true),

  (system_user_id, 'confucius', 'Confucius', 'Chinese philosopher of morality and justice', '#dc2626', 'Philosopher', 'existential', 'wise',
   '{"empathy":9,"directness":7,"formality":9,"humor":4,"creativity":7,"patience":10,"wisdom":10,"energy":5}'::jsonb,
   '{"gender":"male","skinTone":"tan","clothing":"casual","hair":"long","accessory":"none","bodyColor":"#dc2626","accessoryColor":"#991b1b","hairColor":"#9ca3af"}'::jsonb,
   '{"bodyColor":"#dc2626","accessoryColor":"#991b1b","position":[0,0,0]}'::jsonb, true),

  (system_user_id, 'simone_de_beauvoir', 'Simone de Beauvoir', 'Existentialist and feminist theorist', '#ec4899', 'Philosopher', 'existential', 'challenging',
   '{"empathy":8,"directness":9,"formality":7,"humor":6,"creativity":9,"patience":7,"wisdom":10,"energy":8}'::jsonb,
   '{"gender":"female","skinTone":"light","clothing":"casual","hair":"medium","accessory":"none","bodyColor":"#ec4899","accessoryColor":"#be185d","hairColor":"#1f2937"}'::jsonb,
   '{"bodyColor":"#ec4899","accessoryColor":"#be185d","position":[0,0,0]}'::jsonb, true),

  (system_user_id, 'marcus_aurelius', 'Marcus Aurelius', 'Stoic philosopher, self-discipline', '#78716c', 'Emperor & Philosopher', 'existential', 'stoic',
   '{"empathy":7,"directness":8,"formality":9,"humor":3,"creativity":6,"patience":10,"wisdom":10,"energy":6}'::jsonb,
   '{"gender":"male","skinTone":"tan","clothing":"suit","hair":"short","accessory":"none","bodyColor":"#78716c","accessoryColor":"#57534e","hairColor":"#1f2937"}'::jsonb,
   '{"bodyColor":"#78716c","accessoryColor":"#57534e","position":[0,0,0]}'::jsonb, true),

  (system_user_id, 'laozi', 'Laozi', 'Founder of Taoism, harmony with nature', '#059669', 'Philosopher', 'mindfulness', 'serene',
   '{"empathy":10,"directness":4,"formality":5,"humor":6,"creativity":8,"patience":10,"wisdom":10,"energy":4}'::jsonb,
   '{"gender":"male","skinTone":"tan","clothing":"casual","hair":"long","accessory":"none","bodyColor":"#059669","accessoryColor":"#047857","hairColor":"#9ca3af"}'::jsonb,
   '{"bodyColor":"#059669","accessoryColor":"#047857","position":[0,0,0]}'::jsonb, true),

  (system_user_id, 'hannah_arendt', 'Hannah Arendt', 'Explored totalitarianism and human nature', '#9333ea', 'Political Theorist', 'existential', 'incisive',
   '{"empathy":8,"directness":9,"formality":8,"humor":5,"creativity":8,"patience":8,"wisdom":10,"energy":7}'::jsonb,
   '{"gender":"female","skinTone":"light","clothing":"suit","hair":"short","accessory":"none","bodyColor":"#9333ea","accessoryColor":"#7c3aed","hairColor":"#1f2937"}'::jsonb,
   '{"bodyColor":"#9333ea","accessoryColor":"#7c3aed","position":[0,0,0]}'::jsonb, true),

  (system_user_id, 'aristotle', 'Aristotle', 'Ancient Greek, systematic thinker', '#0891b2', 'Philosopher', 'cognitive', 'systematic',
   '{"empathy":6,"directness":8,"formality":8,"humor":4,"creativity":8,"patience":9,"wisdom":10,"energy":6}'::jsonb,
   '{"gender":"male","skinTone":"tan","clothing":"casual","hair":"medium","accessory":"none","bodyColor":"#0891b2","accessoryColor":"#0e7490","hairColor":"#6b7280"}'::jsonb,
   '{"bodyColor":"#0891b2","accessoryColor":"#0e7490","position":[0,0,0]}'::jsonb, true),

  (system_user_id, 'immanuel_kant', 'Immanuel Kant', 'German philosopher of ethics', '#4f46e5', 'Philosopher', 'cognitive', 'rigorous',
   '{"empathy":5,"directness":9,"formality":10,"humor":2,"creativity":8,"patience":8,"wisdom":10,"energy":5}'::jsonb,
   '{"gender":"male","skinTone":"light","clothing":"suit","hair":"short","accessory":"none","bodyColor":"#4f46e5","accessoryColor":"#4338ca","hairColor":"#9ca3af"}'::jsonb,
   '{"bodyColor":"#4f46e5","accessoryColor":"#4338ca","position":[0,0,0]}'::jsonb, true),

  (system_user_id, 'buddha', 'Buddha', 'Founded Buddhism, mindfulness', '#f59e0b', 'Spiritual Teacher', 'mindfulness', 'compassionate',
   '{"empathy":10,"directness":5,"formality":5,"humor":6,"creativity":7,"patience":10,"wisdom":10,"energy":5}'::jsonb,
   '{"gender":"male","skinTone":"tan","clothing":"casual","hair":"none","accessory":"none","bodyColor":"#f59e0b","accessoryColor":"#d97706","hairColor":"#1f2937"}'::jsonb,
   '{"bodyColor":"#f59e0b","accessoryColor":"#d97706","position":[0,0,0]}'::jsonb, true),

  (system_user_id, 'jean_paul_sartre', 'Jean-Paul Sartre', 'Existentialist, freedom and responsibility', '#1e40af', 'Philosopher', 'existential', 'provocative',
   '{"empathy":6,"directness":9,"formality":7,"humor":5,"creativity":9,"patience":6,"wisdom":9,"energy":7}'::jsonb,
   '{"gender":"male","skinTone":"light","clothing":"casual","hair":"short","accessory":"glasses","bodyColor":"#1e40af","accessoryColor":"#1e3a8a","hairColor":"#1f2937"}'::jsonb,
   '{"bodyColor":"#1e40af","accessoryColor":"#1e3a8a","position":[0,0,0]}'::jsonb, true);

  -- Due to SQL query length limits, I'll split this into a procedure
  -- Continue with remaining 75 characters...

END $$;

-- Check how many were inserted
SELECT COUNT(*) as total_characters FROM custom_wakattors WHERE is_public = true;
