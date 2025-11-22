# Seed 100 Characters - Quick Start Guide

## 🎯 What You're Getting

**100 diverse characters:**
- **67 Known Characters**: Einstein, Marie Curie, Goku, Superman, Batman, Socrates, Obama, Shakespeare, and more
- **33 Fictional Characters**: Original creations like Captain Stardust, Luna Whispermoon, Ember Phoenix

All characters are **public** and will be available to all users of your app.

## 🚀 Quick Setup (2 Steps)

### Step 1: Run the Database Migration

First, make sure the `custom_wakattors` table exists:

1. Go to: https://supabase.com/dashboard/project/rddvqbxbmpilbimmppvu/sql/new
2. Copy the contents of: `supabase/migrations/create_custom_wakattors_table.sql`
3. Click **Run**

### Step 2: Seed the 100 Characters

1. Go to: https://supabase.com/dashboard/project/rddvqbxbmpilbimmppvu/sql/new
2. Copy **ALL** contents of: `scripts/seed-100-characters-complete.sql`
3. Click **Run**
4. Wait 5-10 seconds for completion

**Done!** All 100 characters are now in your database.

## ✅ Verify It Worked

Run this query in Supabase SQL Editor:

```sql
SELECT COUNT(*) as total FROM custom_wakattors WHERE is_public = true;
```

You should see: **total: 100**

## 📋 Character Categories

### Scientists & Inventors (15)
- Albert Einstein, Marie Curie, Isaac Newton, Nikola Tesla, Stephen Hawking
- Charles Darwin, Ada Lovelace, Galileo, Leonardo da Vinci, Alan Turing
- Jane Goodall, Thomas Edison, Rosalind Franklin, Carl Sagan, Rachel Carson

### Philosophers & Thinkers (10)
- Socrates, Confucius, Simone de Beauvoir, Marcus Aurelius, Laozi
- Hannah Arendt, Aristotle, Immanuel Kant, Buddha, Jean-Paul Sartre

### Historical Leaders (10)
- Barack Obama, Nelson Mandela, Winston Churchill, Abraham Lincoln
- Mahatma Gandhi, Cleopatra, Martin Luther King Jr., Joan of Arc
- Alexander the Great, Rosa Parks

### Artists & Musicians (8)
- Pablo Picasso, Frida Kahlo, Wolfgang Mozart, Ludwig Beethoven
- Vincent van Gogh, Michelangelo, Maya Angelou, Bob Marley

### Writers & Poets (7)
- William Shakespeare, J.R.R. Tolkien, J.K. Rowling, Jane Austen
- Oscar Wilde, Mark Twain, Emily Dickinson

### Superheroes (12) 🦸
- Superman, Batman, Wonder Woman, Spider-Man, Iron Man
- Captain America, Black Widow, Thor, Hulk, Black Panther
- Doctor Strange, Scarlet Witch

### Anime/Manga (10) 🎌
- Goku, Naruto, Luffy, Sailor Moon, Light Yagami
- Edward Elric, Spike Spiegel, Totoro, Ash Ketchum, Mikasa

### Movie/TV Characters (10) 🎬
- Darth Vader, Yoda, Gandalf, Hermione Granger, Sherlock Holmes
- James Bond, Ellen Ripley, Katniss Everdeen, Walter White, Daenerys

### Video Game Characters (8) 🎮
- Mario, Sonic, Link, Lara Croft, Master Chief
- Kratos, Princess Zelda, Cloud Strife

### Fictional Originals (5) ✨
- Captain Stardust (Space Explorer)
- Luna Whispermoon (Dream Weaver)
- Dr. Chronos (Time Scientist)
- Ember Phoenix (Fire Mage)
- Atlas Strongheart (Unbreakable Defender)

## 🔍 How to Use Them

### In the App

1. Go to the **Wakattors** tab
2. Scroll through the character grid
3. Click **Edit** on any character to view details
4. Add characters to conversations from the **Characters** tab

### Character Features

Each character has:
- ✅ **Unique personality** with 8 traits (empathy, directness, formality, humor, creativity, patience, wisdom, energy)
- ✅ **3D blocky model** with custom colors
- ✅ **Therapeutic approach** (socratic, mindfulness, cognitive, narrative, etc.)
- ✅ **Response style** (witty, heroic, wise, analytical, etc.)
- ✅ **7-state animation system** (idle, thinking, talking, confused, happy, excited, winning)

## 🎨 Character Details Examples

**Albert Einstein**
- Traits: Empathy 7, Creativity 10, Wisdom 10
- Style: Socratic questioning, curious responses
- Role: Physicist

**Goku**
- Traits: Empathy 9, Energy 10, Humor 8
- Style: Positive, enthusiastic
- Role: Martial Artist

**Batman**
- Traits: Directness 10, Wisdom 10, Formality 8
- Style: Cognitive, strategic
- Role: Superhero

**Luna Whispermoon** (Fictional)
- Traits: Empathy 10, Creativity 10, Patience 9
- Style: Mindfulness, ethereal
- Role: Dream Weaver

## 🛠️ Troubleshooting

### Issue: "User ID not found"
**Solution**: The script uses `auth.uid()` to get the current logged-in user. If you're not logged in:

1. Option A: Log into your app first, then run the script
2. Option B: Manually replace `auth.uid()` in the SQL with your user ID:
   ```sql
   SELECT id FROM auth.users WHERE email = 'your-email@example.com';
   ```
   Then replace `v_user_id UUID := auth.uid();` with:
   ```sql
   v_user_id UUID := 'your-actual-user-id-here'::UUID;
   ```

### Issue: "Characters not showing up"
**Solution**:
1. Refresh the Wakattors page
2. Check the console for errors
3. Verify in Supabase:
   ```sql
   SELECT COUNT(*) FROM custom_wakattors WHERE is_public = true;
   ```

### Issue: "Table doesn't exist"
**Solution**: Run the migration first (`create_custom_wakattors_table.sql`)

## 🔄 Reset/Re-seed

To clear and re-seed:

```sql
-- Delete all public characters
DELETE FROM custom_wakattors WHERE is_public = true;

-- Then run the seed script again
```

## 📊 Database Stats

After seeding, you should have:
- **100 total characters**
- **All marked as public** (`is_public = true`)
- **Distributed across 9 categories**
- **67 real-world figures**
- **33 fictional characters**

## 🎉 Next Steps

1. **Test the characters**: Go to Wakattors tab and browse them
2. **Create conversations**: Add multiple characters to a chat
3. **Create your own**: Use "Create New Wakattor" to add more
4. **Share with users**: All public characters are available to everyone

## 📝 Notes

- Characters are stored in `custom_wakattors` table
- Row-level security (RLS) is enabled
- Public characters (`is_public = true`) are visible to all users
- Each character has a unique `character_id`
- 3D models use blocky Minecraft-style aesthetics

---

**Need help?** Check the deployment guide: `DEPLOY_CHARACTER_CREATION.md`
