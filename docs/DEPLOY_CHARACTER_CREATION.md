# Deploy Character Creation Feature

This guide explains how to deploy the new LLM-assisted character creation feature.

## 1. Database Migration

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://supabase.com/dashboard/project/rddvqbxbmpilbimmppvu
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `supabase/migrations/create_custom_wakattors_table.sql`
5. Click **Run** to execute the migration

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref rddvqbxbmpilbimmppvu

# Run the migration
supabase db push
```

## 2. Verify Database Schema

After running the migration, verify the table was created:

```sql
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'custom_wakattors';
```

You should see columns:
- id (uuid)
- user_id (uuid)
- character_id (text)
- name (text)
- description (text)
- color (text)
- role (text)
- prompt_style (text)
- system_prompt (text)
- response_style (text)
- traits (jsonb)
- customization (jsonb)
- model3d (jsonb)
- is_public (boolean)
- created_at (timestamp)
- updated_at (timestamp)

## 3. Test the Feature

1. Start the web app:
   ```bash
   npm run web:serve
   ```

2. Navigate to the **Wakattors** tab

3. Click **Create New Wakattor**

4. Test the 3-step flow:
   - **Step 1**: Enter a character name (try "Albert Einstein" for a known character)
   - **Step 2**: Review the LLM-generated configuration
   - **Step 3**: Adjust traits if needed and save

5. Test with a fictional character:
   - **Step 1**: Enter "Incredible Man"
   - **Step 2**: Provide 2-3 traits (e.g., "brave", "strong", "kind")
   - **Step 3**: Review generated character and save

## 4. Features Implemented

### Character Creation Wizard
- 3-step LLM-assisted creation flow
- Supports both known characters (Einstein, Goku, etc.) and fictional characters
- Real-time 3D preview during creation
- Trait adjustment interface

### Database Integration
- Characters saved to Supabase `custom_wakattors` table
- Row-level security (users can only modify their own characters)
- Public character sharing capability (for curated content)

### Services
- `characterGenerationService.ts` - LLM-based character analysis and generation
- `customWakattorsService.ts` - CRUD operations for custom characters

### UI Components
- `CharacterCreationWizard.tsx` - Step-by-step character creation interface
- `WakattorsScreen.tsx` - Updated to load and display custom characters
- `CharacterDisplay3D.tsx` - Enhanced to support custom character objects

## 5. Known Character Examples

Test with these well-known characters:
- **Albert Einstein** - Physicist, wise, analytical
- **Barack Obama** - Leader, charismatic, articulate
- **Goku** - Hero, energetic, determined
- **Superman** - Superhero, strong, compassionate
- **Isaac Newton** - Scientist, methodical, curious
- **Spiderman** - Hero, witty, responsible

## 6. API Integration

The feature uses your existing AI service configuration:
- Supports Claude (Anthropic), OpenAI, and Gemini
- Uses Supabase Edge Function for API calls
- Character generation prompts are optimized for accurate personality extraction

## 7. Troubleshooting

### Error: "User not authenticated"
- Make sure you're logged in to the app
- Check Supabase authentication status

### Error: "Failed to analyze character"
- Verify AI API key is configured in Settings
- Check Supabase Edge Function is deployed
- Ensure edge function has proper API keys in secrets

### Character not displaying correctly
- Check browser console for errors
- Verify character data was saved to database
- Refresh the Wakattors screen

### 3D preview not showing
- Check Three.js dependencies are installed
- Verify WebGL is supported in your browser
- Clear browser cache and reload

## 8. Next Steps

### Potential Enhancements
1. **Image Generation**: Add face sprite generation using image AI (Gemini, DALL-E)
2. **Character Templates**: Pre-made templates for common archetypes
3. **Community Gallery**: Browse and import public characters
4. **Batch Import**: Upload multiple characters from JSON
5. **Character Stats**: Track usage and popularity
6. **Voice Selection**: Assign unique voices to characters
7. **Animation Customization**: Let users adjust animation speeds/styles

### Performance Optimizations
1. Cache character data in localStorage
2. Lazy load 3D models
3. Implement pagination for large character lists
4. Add search and filter capabilities

## 9. Files Changed

### New Files
- `supabase/migrations/create_custom_wakattors_table.sql`
- `src/services/characterGenerationService.ts`
- `src/services/customWakattorsService.ts`
- `src/components/CharacterCreationWizard.tsx`

### Modified Files
- `src/screens/WakattorsScreen.tsx`
- `src/components/CharacterDisplay3D.tsx`

## 10. Security Considerations

- Row-Level Security (RLS) is enabled on `custom_wakattors` table
- Users can only view/edit their own characters
- Public characters (is_public=true) are visible to all users
- Character validation prevents malformed data
- API keys are never exposed client-side
