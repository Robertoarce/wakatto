# Fix Database Schema - Add character_id Column

## The Problem
Error: "Could not find the 'character_id' column of 'messages' in the schema cache"

The multi-character system requires a `character_id` column in the messages table, but it hasn't been added to your database yet.

## Solution 1: Supabase Dashboard (Quickest - 2 minutes)

1. **Go to Supabase SQL Editor:**
   https://supabase.com/dashboard/project/rddvqbxbmpilbimmppvu/editor

2. **Create new query and paste:**
   ```sql
   -- Add character_id column to messages table
   ALTER TABLE messages
   ADD COLUMN IF NOT EXISTS character_id TEXT;

   -- Add index for performance
   CREATE INDEX IF NOT EXISTS idx_messages_character_id ON messages(character_id);

   -- Add documentation
   COMMENT ON COLUMN messages.character_id IS 'ID of the character (Freud, Jung, Adler) that generated this message. NULL for user messages.';
   ```

3. **Click "Run" or press Ctrl+Enter**

4. **Verify:**
   - Go to Table Editor → messages table
   - You should see the new `character_id` column

5. **Refresh your app at http://localhost:3000**

---

## Solution 2: Supabase CLI (If you want to use migrations)

### Step 1: Install Supabase CLI

**Windows (using Scoop):**
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Or using npm:**
```bash
npm install -g supabase
```

### Step 2: Login to Supabase
```bash
supabase login
```
(This will open your browser to authenticate)

### Step 3: Link to your project
```bash
supabase link --project-ref rddvqbxbmpilbimmppvu
```

### Step 4: Run the migration
```bash
supabase db push
```

Or run the specific migration:
```bash
supabase migration up
```

---

## Verification

After running either solution:

1. **Check the database:**
   - Go to https://supabase.com/dashboard/project/rddvqbxbmpilbimmppvu/editor
   - Run: `SELECT * FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'character_id';`
   - Should return 1 row

2. **Test the app:**
   - Refresh http://localhost:3000
   - Try sending a message
   - Should work without errors!

---

## What This Does

The migration adds:
- `character_id` column (TEXT type, nullable)
- Index for faster queries when filtering by character
- Documentation comment

This enables:
- Multi-character conversations
- Tracking which character (Freud, Jung, Adler) sent each message
- Character-specific message history
