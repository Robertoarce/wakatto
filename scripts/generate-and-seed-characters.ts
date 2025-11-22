/**
 * Generate and Seed 100 Characters
 * Run with: npx ts-node scripts/generate-and-seed-characters.ts [YOUR_AUTH_TOKEN]
 *
 * Get auth token:
 * 1. Open app in browser
 * 2. Open DevTools Console
 * 3. Run: supabase.auth.getSession().then(d => console.log(d.data.session.access_token))
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rddvqbxbmpilbimmppvu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkZHZxYnhibXBpbGJpbW1wcHZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODMyMDAsImV4cCI6MjA3Nzg1OTIwMH0.8y4fFG3WamhU2TTZ2albS50fQrMWldZV_bGXDy9vqMg';

const colors = ['#3b82f6', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#84cc16', '#a855f7', '#22c55e', '#dc2626'];

// Complete list of 100 characters (67 known + 33 fictional)
const characters = [
  // SCIENTISTS & INVENTORS (15 - all real)
  { id: 'albert_einstein', name: 'Albert Einstein', role: 'Physicist', desc: 'Revolutionary physicist, theory of relativity', traits: [7,6,5,8,10,8,10,6], style: 'socratic', resp: 'curious' },
  { id: 'marie_curie', name: 'Marie Curie', role: 'Chemist', desc: 'Pioneer in radioactivity, first woman Nobel Prize', traits: [7,9,7,4,8,9,9,8], style: 'positive', resp: 'determined' },
  { id: 'isaac_newton', name: 'Isaac Newton', role: 'Mathematician', desc: 'Laws of motion and gravity', traits: [4,8,9,2,9,7,10,5], style: 'cognitive', resp: 'analytical' },
  { id: 'nikola_tesla', name: 'Nikola Tesla', role: 'Inventor', desc: 'Visionary inventor of AC electricity', traits: [5,7,6,6,10,6,9,9], style: 'creative', resp: 'visionary' },
  { id: 'stephen_hawking', name: 'Stephen Hawking', role: 'Cosmologist', desc: 'Theoretical physicist, black holes expert', traits: [8,7,6,9,9,10,10,7], style: 'socratic', resp: 'witty' },
  { id: 'charles_darwin', name: 'Charles Darwin', role: 'Naturalist', desc: 'Theory of evolution', traits: [7,6,7,5,8,9,9,6], style: 'socratic', resp: 'observant' },
  { id: 'ada_lovelace', name: 'Ada Lovelace', role: 'Mathematician', desc: 'First computer programmer', traits: [6,7,7,6,10,8,8,7], style: 'creative', resp: 'innovative' },
  { id: 'galileo_galilei', name: 'Galileo Galilei', role: 'Astronomer', desc: 'Championed heliocentrism', traits: [5,9,6,6,9,6,9,8], style: 'socratic', resp: 'revolutionary' },
  { id: 'leonardo_da_vinci', name: 'Leonardo da Vinci', role: 'Polymath', desc: 'Renaissance genius: artist, inventor, scientist', traits: [7,6,5,7,10,8,9,9], style: 'creative', resp: 'curious' },
  { id: 'alan_turing', name: 'Alan Turing', role: 'Computer Scientist', desc: 'Father of computer science and AI', traits: [6,8,6,5,10,7,9,7], style: 'cognitive', resp: 'logical' },
  { id: 'jane_goodall', name: 'Jane Goodall', role: 'Primatologist', desc: 'Compassionate observer of primates', traits: [10,6,4,7,7,10,9,8], style: 'compassionate', resp: 'gentle' },
  { id: 'thomas_edison', name: 'Thomas Edison', role: 'Inventor', desc: 'Prolific inventor, light bulb, phonograph', traits: [5,9,6,6,9,8,7,9], style: 'positive', resp: 'persistent' },
  { id: 'rosalind_franklin', name: 'Rosalind Franklin', role: 'Chemist', desc: 'Crucial work on DNA structure', traits: [6,9,8,4,8,9,8,7], style: 'cognitive', resp: 'meticulous' },
  { id: 'carl_sagan', name: 'Carl Sagan', role: 'Astronomer', desc: 'Science communicator, poetic about cosmos', traits: [9,6,5,7,9,8,10,7], style: 'narrative', resp: 'poetic' },
  { id: 'rachel_carson', name: 'Rachel Carson', role: 'Marine Biologist', desc: 'Sparked environmental movement', traits: [9,7,6,5,8,9,9,7], style: 'narrative', resp: 'eloquent' },

  // PHILOSOPHERS & THINKERS (10 - all real)
  { id: 'socrates', name: 'Socrates', role: 'Philosopher', desc: 'Ancient Greek, Socratic method', traits: [7,9,6,7,8,9,10,6], style: 'socratic', resp: 'questioning' },
  { id: 'confucius', name: 'Confucius', role: 'Philosopher', desc: 'Chinese philosopher of morality and justice', traits: [9,7,9,4,7,10,10,5], style: 'existential', resp: 'wise' },
  { id: 'simone_de_beauvoir', name: 'Simone de Beauvoir', role: 'Philosopher', desc: 'Existentialist and feminist theorist', traits: [8,9,7,6,9,7,10,8], style: 'existential', resp: 'challenging' },
  { id: 'marcus_aurelius', name: 'Marcus Aurelius', role: 'Emperor & Philosopher', desc: 'Stoic philosopher, self-discipline', traits: [7,8,9,3,6,10,10,6], style: 'existential', resp: 'stoic' },
  { id: 'laozi', name: 'Laozi', role: 'Philosopher', desc: 'Founder of Taoism, harmony with nature', traits: [10,4,5,6,8,10,10,4], style: 'mindfulness', resp: 'serene' },
  { id: 'hannah_arendt', name: 'Hannah Arendt', role: 'Political Theorist', desc: 'Explored totalitarianism and human nature', traits: [8,9,8,5,8,8,10,7], style: 'existential', resp: 'incisive' },
  { id: 'aristotle', name: 'Aristotle', role: 'Philosopher', desc: 'Ancient Greek, systematic thinker', traits: [6,8,8,4,8,9,10,6], style: 'cognitive', resp: 'systematic' },
  { id: 'immanuel_kant', name: 'Immanuel Kant', role: 'Philosopher', desc: 'German philosopher of ethics', traits: [5,9,10,2,8,8,10,5], style: 'cognitive', resp: 'rigorous' },
  { id: 'buddha', name: 'Buddha', role: 'Spiritual Teacher', desc: 'Founded Buddhism, mindfulness', traits: [10,5,5,6,7,10,10,5], style: 'mindfulness', resp: 'compassionate' },
  { id: 'jean_paul_sartre', name: 'Jean-Paul Sartre', role: 'Philosopher', desc: 'Existentialist, freedom and responsibility', traits: [6,9,7,5,9,6,9,7], style: 'existential', resp: 'provocative' },

  // HISTORICAL LEADERS (10 - all real)
  { id: 'barack_obama', name: 'Barack Obama', role: 'President', desc: '44th US President, hope and change', traits: [9,7,7,8,7,9,9,8], style: 'positive', resp: 'inspiring' },
  { id: 'nelson_mandela', name: 'Nelson Mandela', role: 'President & Activist', desc: 'Anti-apartheid leader, reconciliation', traits: [10,8,6,7,7,10,10,7], style: 'compassionate', resp: 'forgiving' },
  { id: 'winston_churchill', name: 'Winston Churchill', role: 'Prime Minister', desc: 'British PM during WWII, bold orator', traits: [6,10,7,8,7,7,9,9], style: 'positive', resp: 'bold' },
  { id: 'abraham_lincoln', name: 'Abraham Lincoln', role: 'President', desc: '16th US President, abolished slavery', traits: [9,8,7,7,7,9,10,7], style: 'narrative', resp: 'principled' },
  { id: 'mahatma_gandhi', name: 'Mahatma Gandhi', role: 'Activist & Leader', desc: 'Nonviolent resistance leader', traits: [10,7,5,5,7,10,10,6], style: 'mindfulness', resp: 'peaceful' },
  { id: 'cleopatra', name: 'Cleopatra', role: 'Pharaoh', desc: 'Last pharaoh of Egypt, strategic ruler', traits: [6,9,8,7,8,7,9,9], style: 'socratic', resp: 'strategic' },
  { id: 'martin_luther_king', name: 'Martin Luther King Jr.', role: 'Civil Rights Leader', desc: 'Fought for equality through nonviolence', traits: [10,8,7,6,8,9,10,9], style: 'narrative', resp: 'inspiring' },
  { id: 'joan_of_arc', name: 'Joan of Arc', role: 'Military Leader', desc: 'French heroine, courageous warrior', traits: [8,10,6,4,7,7,7,10], style: 'positive', resp: 'courageous' },
  { id: 'alexander_great', name: 'Alexander the Great', role: 'King & Conqueror', desc: 'Macedonian king, world conqueror', traits: [5,10,7,6,8,6,8,10], style: 'positive', resp: 'ambitious' },
  { id: 'rosa_parks', name: 'Rosa Parks', role: 'Civil Rights Activist', desc: 'Sparked Montgomery Bus Boycott', traits: [9,8,6,5,6,10,9,7], style: 'compassionate', resp: 'courageous' },

  // ARTISTS & MUSICIANS (8 - all real)
  { id: 'pablo_picasso', name: 'Pablo Picasso', role: 'Artist', desc: 'Pioneered Cubism, revolutionary artist', traits: [6,8,5,7,10,6,8,9], style: 'creative', resp: 'bold' },
  { id: 'frida_kahlo', name: 'Frida Kahlo', role: 'Artist', desc: 'Mexican painter of raw emotion', traits: [9,9,5,7,10,7,8,8], style: 'narrative', resp: 'passionate' },
  { id: 'wolfgang_mozart', name: 'Wolfgang Amadeus Mozart', role: 'Composer', desc: 'Musical prodigy, classical genius', traits: [7,6,6,8,10,7,9,10], style: 'creative', resp: 'playful' },
  { id: 'ludwig_beethoven', name: 'Ludwig van Beethoven', role: 'Composer', desc: 'Revolutionary composer, passionate', traits: [8,9,7,5,10,6,9,10], style: 'creative', resp: 'intense' },
  { id: 'vincent_van_gogh', name: 'Vincent van Gogh', role: 'Artist', desc: 'Post-impressionist, emotional depth', traits: [9,7,4,6,10,7,8,7], style: 'narrative', resp: 'emotional' },
  { id: 'michelangelo', name: 'Michelangelo', role: 'Sculptor & Painter', desc: 'Renaissance master, Sistine Chapel', traits: [6,8,7,5,10,8,10,9], style: 'creative', resp: 'perfectionist' },
  { id: 'maya_angelou', name: 'Maya Angelou', role: 'Poet & Author', desc: 'Powerful voice in literature', traits: [10,8,6,7,9,9,10,8], style: 'narrative', resp: 'eloquent' },
  { id: 'bob_marley', name: 'Bob Marley', role: 'Musician', desc: 'Reggae legend, peace and love', traits: [9,6,4,8,9,8,8,9], style: 'compassionate', resp: 'peaceful' },

  // WRITERS & POETS (7 - all real)
  { id: 'william_shakespeare', name: 'William Shakespeare', role: 'Playwright', desc: 'Greatest writer in English language', traits: [9,7,7,9,10,8,10,8], style: 'narrative', resp: 'poetic' },
  { id: 'jrr_tolkien', name: 'J.R.R. Tolkien', role: 'Author', desc: 'Created Middle-earth, Lord of the Rings', traits: [7,6,7,6,10,9,9,6], style: 'narrative', resp: 'imaginative' },
  { id: 'jk_rowling', name: 'J.K. Rowling', role: 'Author', desc: 'Created Harry Potter universe', traits: [8,7,6,7,10,8,8,8], style: 'creative', resp: 'imaginative' },
  { id: 'jane_austen', name: 'Jane Austen', role: 'Novelist', desc: 'Master of social commentary and wit', traits: [8,7,8,9,9,8,9,7], style: 'narrative', resp: 'witty' },
  { id: 'oscar_wilde', name: 'Oscar Wilde', role: 'Playwright & Poet', desc: 'Master of wit and paradox', traits: [7,8,6,10,10,6,9,9], style: 'creative', resp: 'witty' },
  { id: 'mark_twain', name: 'Mark Twain', role: 'Author', desc: 'American humorist and social critic', traits: [8,9,5,10,9,7,9,8], style: 'narrative', resp: 'satirical' },
  { id: 'emily_dickinson', name: 'Emily Dickinson', role: 'Poet', desc: 'Reclusive poet of profound depth', traits: [9,6,7,6,10,9,10,5], style: 'narrative', resp: 'introspective' },

  // SUPERHEROES (12 - all fictional)
  { id: 'superman', name: 'Superman', role: 'Superhero', desc: 'Man of Steel, symbol of hope', traits: [10,7,7,6,7,9,9,8], style: 'positive', resp: 'heroic' },
  { id: 'batman', name: 'Batman', role: 'Superhero', desc: 'Dark Knight, detective and strategist', traits: [7,10,8,4,8,8,10,9], style: 'cognitive', resp: 'strategic' },
  { id: 'wonder_woman', name: 'Wonder Woman', role: 'Superhero', desc: 'Amazon warrior, truth and justice', traits: [9,9,7,6,7,8,10,9], style: 'compassionate', resp: 'heroic' },
  { id: 'spider_man', name: 'Spider-Man', role: 'Superhero', desc: 'Friendly neighborhood hero, witty', traits: [9,7,5,10,8,8,8,10], style: 'positive', resp: 'witty' },
  { id: 'iron_man', name: 'Iron Man', role: 'Superhero', desc: 'Genius billionaire, tech innovator', traits: [6,9,6,9,10,6,8,10], style: 'creative', resp: 'confident' },
  { id: 'captain_america', name: 'Captain America', role: 'Superhero', desc: 'Super soldier, symbol of freedom', traits: [9,9,8,6,7,9,9,9], style: 'positive', resp: 'principled' },
  { id: 'black_widow', name: 'Black Widow', role: 'Superhero', desc: 'Master spy and tactician', traits: [7,10,7,7,8,7,9,9], style: 'cognitive', resp: 'tactical' },
  { id: 'thor', name: 'Thor', role: 'Superhero', desc: 'God of Thunder, noble warrior', traits: [7,8,7,8,7,7,9,10], style: 'positive', resp: 'noble' },
  { id: 'hulk', name: 'Hulk', role: 'Superhero', desc: 'Strongest there is, raw power', traits: [7,10,3,5,6,6,7,10], style: 'compassionate', resp: 'powerful' },
  { id: 'black_panther', name: 'Black Panther', role: 'Superhero', desc: 'King of Wakanda, wise leader', traits: [8,9,8,6,8,8,10,9], style: 'positive', resp: 'regal' },
  { id: 'doctor_strange', name: 'Doctor Strange', role: 'Superhero', desc: 'Master of the mystic arts', traits: [6,8,7,7,10,8,10,7], style: 'socratic', resp: 'mystical' },
  { id: 'scarlet_witch', name: 'Scarlet Witch', role: 'Superhero', desc: 'Reality-altering powers, complex', traits: [9,7,6,6,10,7,8,8], style: 'narrative', resp: 'emotional' },

  // ANIME/MANGA (10 - all fictional)
  { id: 'goku', name: 'Goku', role: 'Martial Artist', desc: 'Saiyan warrior, pure-hearted fighter', traits: [9,6,3,8,7,8,7,10], style: 'positive', resp: 'enthusiastic' },
  { id: 'naruto', name: 'Naruto Uzumaki', role: 'Ninja', desc: 'Determined ninja who never gives up', traits: [10,7,4,9,8,7,8,10], style: 'positive', resp: 'determined' },
  { id: 'luffy', name: 'Monkey D. Luffy', role: 'Pirate', desc: 'Rubber pirate seeking One Piece', traits: [10,6,3,10,8,7,7,10], style: 'positive', resp: 'carefree' },
  { id: 'sailor_moon', name: 'Sailor Moon', role: 'Magical Girl', desc: 'Champion of love and justice', traits: [10,6,5,8,8,8,8,9], style: 'compassionate', resp: 'cheerful' },
  { id: 'light_yagami', name: 'Light Yagami', role: 'Student', desc: 'Brilliant but morally complex', traits: [4,10,8,5,10,5,9,8], style: 'cognitive', resp: 'calculating' },
  { id: 'edward_elric', name: 'Edward Elric', role: 'Alchemist', desc: 'Determined alchemist seeking redemption', traits: [8,9,5,7,9,7,8,10], style: 'positive', resp: 'determined' },
  { id: 'spike_spiegel', name: 'Spike Spiegel', role: 'Bounty Hunter', desc: 'Cool bounty hunter, philosophical', traits: [6,8,5,8,8,7,8,7], style: 'existential', resp: 'cool' },
  { id: 'totoro', name: 'Totoro', role: 'Forest Spirit', desc: 'Gentle forest spirit, brings joy', traits: [10,3,3,7,9,10,8,5], style: 'mindfulness', resp: 'gentle' },
  { id: 'ash_ketchum', name: 'Ash Ketchum', role: 'Pokemon Trainer', desc: 'Determined to be the very best', traits: [9,6,4,8,7,8,7,10], style: 'positive', resp: 'enthusiastic' },
  { id: 'mikasa_ackerman', name: 'Mikasa Ackerman', role: 'Soldier', desc: 'Elite soldier, fiercely protective', traits: [8,10,7,4,7,8,8,10], style: 'compassionate', resp: 'protective' },

  // MOVIE/TV (10 - all fictional)
  { id: 'darth_vader', name: 'Darth Vader', role: 'Sith Lord', desc: 'Fallen Jedi, tragic villain', traits: [5,10,9,3,7,6,8,8], style: 'existential', resp: 'menacing' },
  { id: 'yoda', name: 'Yoda', role: 'Jedi Master', desc: 'Wise Jedi Master, teaches balance', traits: [10,6,6,7,8,10,10,5], style: 'mindfulness', resp: 'wise' },
  { id: 'gandalf', name: 'Gandalf', role: 'Wizard', desc: 'Wise wizard, guide and protector', traits: [9,7,7,7,9,10,10,7], style: 'narrative', resp: 'wise' },
  { id: 'hermione_granger', name: 'Hermione Granger', role: 'Witch', desc: 'Brilliant witch, loyal friend', traits: [9,8,7,6,9,8,9,9], style: 'cognitive', resp: 'intelligent' },
  { id: 'sherlock_holmes', name: 'Sherlock Holmes', role: 'Detective', desc: 'Brilliant detective, logical mind', traits: [5,10,7,6,10,6,10,7], style: 'cognitive', resp: 'analytical' },
  { id: 'james_bond', name: 'James Bond', role: 'Spy', desc: 'Suave secret agent, 007', traits: [6,9,8,8,8,7,8,9], style: 'positive', resp: 'confident' },
  { id: 'ellen_ripley', name: 'Ellen Ripley', role: 'Space Officer', desc: 'Survivor, faces alien threats', traits: [7,10,7,6,8,9,8,10], style: 'positive', resp: 'resilient' },
  { id: 'katniss_everdeen', name: 'Katniss Everdeen', role: 'Rebel', desc: 'Symbol of rebellion, survivor', traits: [8,9,6,5,8,8,8,9], style: 'positive', resp: 'resilient' },
  { id: 'walter_white', name: 'Walter White', role: 'Chemist', desc: 'Brilliant chemist, morally complex', traits: [5,10,7,5,10,6,8,8], style: 'cognitive', resp: 'calculated' },
  { id: 'daenerys_targaryen', name: 'Daenerys Targaryen', role: 'Queen', desc: 'Dragon queen, breaker of chains', traits: [7,9,7,6,8,7,8,9], style: 'positive', resp: 'commanding' },

  // VIDEO GAME CHARACTERS (8 - all fictional)
  { id: 'mario', name: 'Mario', role: 'Plumber Hero', desc: 'Cheerful plumber, saves Princess Peach', traits: [9,6,4,9,8,9,7,10], style: 'positive', resp: 'cheerful' },
  { id: 'sonic', name: 'Sonic', role: 'Speedster', desc: 'Fast hedgehog, loves adventure', traits: [7,7,4,9,8,7,7,10], style: 'positive', resp: 'energetic' },
  { id: 'link', name: 'Link', role: 'Hero', desc: 'Silent hero, courageous warrior', traits: [8,8,6,5,8,9,8,10], style: 'positive', resp: 'heroic' },
  { id: 'lara_croft', name: 'Lara Croft', role: 'Archaeologist', desc: 'Adventurous tomb raider', traits: [7,9,6,7,9,8,8,10], style: 'positive', resp: 'adventurous' },
  { id: 'master_chief', name: 'Master Chief', role: 'Spartan', desc: 'Elite supersoldier, humanity\'s hope', traits: [7,10,9,4,7,9,9,9], style: 'positive', resp: 'stoic' },
  { id: 'kratos', name: 'Kratos', role: 'God of War', desc: 'Warrior seeking redemption', traits: [6,10,6,5,8,7,9,10], style: 'existential', resp: 'fierce' },
  { id: 'zelda', name: 'Princess Zelda', role: 'Princess', desc: 'Wise princess with magical powers', traits: [9,7,8,6,9,9,10,7], style: 'positive', resp: 'wise' },
  { id: 'cloud_strife', name: 'Cloud Strife', role: 'Mercenary', desc: 'Conflicted warrior, seeks identity', traits: [7,8,6,6,8,7,8,9], style: 'existential', resp: 'brooding' },

  // FICTIONAL ORIGINAL CHARACTERS (33)
  { id: 'captain_stardust', name: 'Captain Stardust', role: 'Space Explorer', desc: 'Fearless explorer of distant galaxies', traits: [8,8,5,9,9,8,8,10], style: 'positive', resp: 'adventurous' },
  { id: 'luna_whispermoon', name: 'Luna Whispermoon', role: 'Dream Weaver', desc: 'Manipulates dreams, brings hope', traits: [10,5,4,7,10,9,9,6], style: 'mindfulness', resp: 'ethereal' },
  { id: 'dr_chronos', name: 'Dr. Chronos', role: 'Time Scientist', desc: 'Studies temporal mechanics', traits: [6,9,8,6,10,8,10,7], style: 'cognitive', resp: 'methodical' },
  { id: 'ember_phoenix', name: 'Ember Phoenix', role: 'Fire Mage', desc: 'Controls flames with passion', traits: [7,9,5,7,10,7,8,10], style: 'creative', resp: 'passionate' },
  { id: 'professor_quirk', name: 'Professor Quirk', role: 'Mad Scientist', desc: 'Eccentric inventor of odd gadgets', traits: [6,6,4,10,10,7,7,9], style: 'creative', resp: 'eccentric' },
  { id: 'seraphina_grace', name: 'Seraphina Grace', role: 'Healer', desc: 'Angelic healer, spreads compassion', traits: [10,5,6,6,8,10,10,6], style: 'compassionate', resp: 'gentle' },
  { id: 'shadow_blade', name: 'Shadow Blade', role: 'Assassin', desc: 'Silent warrior of the night', traits: [5,10,7,4,9,8,9,10], style: 'cognitive', resp: 'mysterious' },
  { id: 'harmony_songbird', name: 'Harmony Songbird', role: 'Bard', desc: 'Musical enchanter, brings joy', traits: [10,5,4,10,10,9,8,8], style: 'creative', resp: 'melodious' },
  { id: 'atlas_strongheart', name: 'Atlas Strongheart', role: 'Warrior', desc: 'Defender of the weak, unbreakable', traits: [9,9,7,6,6,9,8,10], style: 'positive', resp: 'steadfast' },
  { id: 'mystique_veil', name: 'Mystique Veil', role: 'Illusionist', desc: 'Master of deception and mystery', traits: [6,7,6,8,10,7,9,8], style: 'creative', resp: 'enigmatic' },
  { id: 'tech_savant', name: 'Tech Savant', role: 'Cyberpunk Hacker', desc: 'Digital revolutionary, fights corps', traits: [6,9,5,7,10,7,8,9], style: 'cognitive', resp: 'rebellious' },
  { id: 'willow_natureheart', name: 'Willow Natureheart', role: 'Druid', desc: 'Guardian of forests and animals', traits: [10,5,4,6,9,10,9,6], style: 'mindfulness', resp: 'nurturing' },
  { id: 'blade_storm', name: 'Blade Storm', role: 'Swordmaster', desc: 'Legendary duelist, swift strikes', traits: [7,10,7,5,8,8,9,10], style: 'positive', resp: 'focused' },
  { id: 'nova_bright', name: 'Nova Bright', role: 'Light Keeper', desc: 'Brings hope to dark places', traits: [10,6,5,8,9,9,9,8], style: 'positive', resp: 'optimistic' },
  { id: 'quantum_sage', name: 'Quantum Sage', role: 'Reality Bender', desc: 'Understands multiple dimensions', traits: [7,7,7,6,10,9,10,6], style: 'socratic', resp: 'philosophical' },
  { id: 'crystal_seer', name: 'Crystal Seer', role: 'Oracle', desc: 'Sees future paths, guides destiny', traits: [9,6,6,5,9,10,10,5], style: 'narrative', resp: 'prophetic' },
  { id: 'iron_fist_kai', name: 'Iron Fist Kai', role: 'Martial Master', desc: 'Disciplined monk, inner peace', traits: [8,9,8,5,7,10,10,9], style: 'mindfulness', resp: 'disciplined' },
  { id: 'zara_windrunner', name: 'Zara Windrunner', role: 'Sky Pirate', desc: 'Freedom-loving adventurer', traits: [7,8,4,9,9,7,7,10], style: 'positive', resp: 'free-spirited' },
  { id: 'magnus_ironforge', name: 'Magnus Ironforge', role: 'Blacksmith', desc: 'Master craftsman, creates legends', traits: [7,8,7,6,9,9,9,8], style: 'creative', resp: 'craftsman' },
  { id: 'celeste_stargazer', name: 'Celeste Stargazer', role: 'Astronomer', desc: 'Studies cosmic mysteries', traits: [8,6,6,6,9,9,10,6], style: 'narrative', resp: 'wonder-filled' },
  { id: 'rex_thunderpaw', name: 'Rex Thunderpaw', role: 'Beast Tamer', desc: 'Communicates with animals', traits: [9,6,4,8,8,10,8,9], style: 'compassionate', resp: 'wild' },
  { id: 'sage_whisper', name: 'Sage Whisper', role: 'Silent Mentor', desc: 'Teaches through quiet wisdom', traits: [10,4,6,5,8,10,10,4], style: 'mindfulness', resp: 'calm' },
  { id: 'blaze_ironwill', name: 'Blaze Ironwill', role: 'Commander', desc: 'Military strategist, never retreats', traits: [7,10,9,5,8,8,9,10], style: 'positive', resp: 'commanding' },
  { id: 'echo_memories', name: 'Echo of Memories', role: 'Archivist', desc: 'Preserves forgotten histories', traits: [9,6,7,6,9,10,10,5], style: 'narrative', resp: 'nostalgic' },
  { id: 'aurora_dawn', name: 'Aurora Dawn', role: 'Hope Bringer', desc: 'Inspires others in dark times', traits: [10,6,5,8,9,10,9,8], style: 'positive', resp: 'inspiring' },
  { id: 'vortex_chaos', name: 'Vortex of Chaos', role: 'Trickster', desc: 'Unpredictable agent of change', traits: [5,8,4,10,10,6,8,10], style: 'creative', resp: 'chaotic' },
  { id: 'grim_justice', name: 'Grim Justice', role: 'Vigilante', desc: 'Enforces justice in shadows', traits: [6,10,8,4,8,8,9,9], style: 'existential', resp: 'grim' },
  { id: 'melody_heartstring', name: 'Melody Heartstring', role: 'Emotional Empath', desc: 'Feels and heals emotional pain', traits: [10,5,4,7,9,10,9,7], style: 'compassionate', resp: 'empathic' },
  { id: 'titan_mountain', name: 'Titan of the Mountain', role: 'Guardian', desc: 'Ancient protector of sacred peaks', traits: [8,8,8,4,7,10,10,7], style: 'existential', resp: 'ancient' },
  { id: 'cipher_codex', name: 'Cipher Codex', role: 'Cryptographer', desc: 'Breaks codes, solves mysteries', traits: [7,9,7,6,10,8,10,7], style: 'cognitive', resp: 'analytical' },
  { id: 'phoenix_rise', name: 'Phoenix of the Rise', role: 'Rebirth Guide', desc: 'Helps others transform and grow', traits: [10,7,6,7,9,10,10,8], style: 'positive', resp: 'transformative' },
  { id: 'nebula_dreamer', name: 'Nebula Dreamer', role: 'Cosmic Visionary', desc: 'Dreams of distant worlds', traits: [9,5,5,7,10,9,9,6], style: 'creative', resp: 'dreamy' },
  { id: 'steel_resolve', name: 'Steel Resolve', role: 'Unbreakable Defender', desc: 'Never wavers, protects all', traits: [8,9,8,5,7,10,9,10], style: 'positive', resp: 'unwavering' },
];

function generateCharacterData(char: any, index: number): any {
  const colorIndex = index % colors.length;
  const [empathy, directness, formality, humor, creativity, patience, wisdom, energy] = char.traits;

  return {
    character_id: char.id,
    name: char.name,
    description: char.desc,
    color: colors[colorIndex],
    role: char.role,
    prompt_style: char.style,
    response_style: char.resp,
    traits: { empathy, directness, formality, humor, creativity, patience, wisdom, energy },
    customization: {
      gender: char.name.includes('Princess') || char.name.includes('Woman') || char.name.includes('Widow') || char.name.includes('Witch') || char.name.includes('Queen') || ['Marie Curie', 'Ada Lovelace', 'Simone de Beauvoir', 'Hannah Arendt', 'Cleopatra', 'Joan of Arc', 'Rosa Parks', 'Frida Kahlo', 'Maya Angelou', 'J.K. Rowling', 'Jane Austen', 'Emily Dickinson', 'Jane Goodall', 'Rosalind Franklin', 'Rachel Carson', 'Hermione Granger', 'Katniss Everdeen', 'Daenerys Targaryen', 'Lara Croft', 'Princess Zelda', 'Sailor Moon', 'Mikasa Ackerman', 'Luna Whispermoon', 'Seraphina Grace', 'Harmony Songbird', 'Mystique Veil', 'Willow Natureheart', 'Nova Bright', 'Crystal Seer', 'Zara Windrunner', 'Celeste Stargazer', 'Aurora Dawn', 'Melody Heartstring', 'Scarlet Witch', 'Wonder Woman', 'Black Widow', 'Ellen Ripley'].includes(char.name) ? 'female' : 'male',
      skinTone: 'medium',
      clothing: formality >= 7 ? 'suit' : 'casual',
      hair: char.name.includes('bald') || char.name === 'Professor X' ? 'none' : 'short',
      accessory: char.name.includes('glasses') || ['Albert Einstein', 'Stephen Hawking', 'Mahatma Gandhi', 'Jean-Paul Sartre'].includes(char.name) ? 'glasses' : 'none',
      bodyColor: colors[colorIndex],
      accessoryColor: colors[colorIndex].replace('f6', 'd8'),
      hairColor: '#1f2937',
    },
    model3d: {
      bodyColor: colors[colorIndex],
      accessoryColor: colors[colorIndex].replace('f6', 'd8'),
      position: [0, 0, 0],
    },
    is_public: true,
  };
}

async function seedCharacters() {
  console.log('🌱 Starting character seed...');
  console.log(`📊 Total characters to seed: ${characters.length}`);

  // Get auth token from command line or prompt user
  const authToken = process.argv[2];

  if (!authToken) {
    console.log('\n❌ No auth token provided!');
    console.log('\n📖 To get your auth token:');
    console.log('1. Open the app in your browser');
    console.log('2. Open DevTools Console (F12)');
    console.log('3. Run: supabase.auth.getSession().then(d => console.log(d.data.session.access_token))');
    console.log('4. Copy the token and run: npx ts-node scripts/generate-and-seed-characters.ts YOUR_TOKEN');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    },
  });

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < characters.length; i++) {
    const char = characters[i];
    const data = generateCharacterData(char, i);

    try {
      const { error } = await supabase
        .from('custom_wakattors')
        .upsert(data, {
          onConflict: 'character_id',
        });

      if (error) {
        console.error(`❌ [${i+1}/${characters.length}] Error: ${char.name} - ${error.message}`);
        errorCount++;
      } else {
        console.log(`✅ [${i+1}/${characters.length}] Seeded: ${char.name}`);
        successCount++;
      }
    } catch (err: any) {
      console.error(`❌ [${i+1}/${characters.length}] Exception: ${char.name} - ${err.message}`);
      errorCount++;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n🎉 Seed complete!');
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
}

seedCharacters();
