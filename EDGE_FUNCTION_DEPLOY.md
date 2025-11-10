# Edge Function Deployment Guide

## Why We Need This

The browser blocks direct API calls to Anthropic/OpenAI due to **CORS policy**. The solution is to proxy API calls through a Supabase Edge Function (serverless backend).

**Benefits:**
- ✅ No CORS issues
- ✅ API keys stay server-side (secure)
- ✅ Rate limiting per user
- ✅ Production-ready

## Quick Start

### Option 1: Automated Script (Recommended)

1. **Get Supabase Access Token:**
   - Go to: https://supabase.com/dashboard/account/tokens
   - Click "Generate new token"
   - Give it a name like "Wakatto Deploy"
   - Copy the token

2. **Run the deployment script:**
   ```bash
   export SUPABASE_ACCESS_TOKEN=your_token_here
   ./deploy-edge-function.sh
   ```

### Option 2: Manual Deployment

1. **Get Supabase Access Token** (same as above)

2. **Set environment variable:**
   ```bash
   export SUPABASE_ACCESS_TOKEN=your_token_here
   ```

3. **Link to project:**
   ```bash
   supabase link --project-ref rddvqbxbmpilbimmppvu
   ```

4. **Deploy function:**
   ```bash
   supabase functions deploy ai-chat --no-verify-jwt
   ```

5. **Set secrets:**
   ```bash
   source .env
   echo "$CLAUDE_API_KEY" | supabase secrets set CLAUDE_API_KEY
   ```

## Verify Deployment

Once deployed, your app will automatically use the edge function! The function is already integrated in `src/services/aiService.ts`.

**Test in the app:**
1. Refresh your browser at http://localhost:19006
2. Send a message in the chat
3. You should receive a response from Claude (no more CORS errors!)

## Function Details

**Endpoint:** `https://rddvqbxbmpilbimmppvu.supabase.co/functions/v1/ai-chat`

**What it does:**
- Receives: `{ messages, provider, model }`
- Validates: User authentication
- Calls: Anthropic/OpenAI API (server-side)
- Returns: AI response

**Security:**
- ✅ API keys stored in Supabase secrets (never exposed)
- ✅ User authentication required
- ✅ Server-side rate limiting

## Troubleshooting

### "Access token not found"
Run: `supabase login` and follow the browser auth flow, or use the token method above.

### "Function not found" error in app
Make sure you deployed the function successfully and the function name is `ai-chat`.

### "Unauthorized" error
Your Supabase session expired. Log out and log back in to the app.

### Still getting CORS errors
- Check browser console - it should show `[AI] Calling Edge Function`
- If it shows `[Anthropic]` instead, the code isn't using the edge function
- Clear browser cache and hard reload (Cmd+Shift+R)

## Next Steps

After successful deployment:
- ✅ CORS issue: FIXED
- ✅ Claude responses: WORKING
- ✅ API keys: SECURE

You can now use the app without any API call issues!

## Additional Configuration

To add OpenAI support, set the OpenAI API key secret:
```bash
echo "your_openai_key" | supabase secrets set OPENAI_API_KEY
```

Then change provider in Settings to "OpenAI".
