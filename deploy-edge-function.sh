#!/bin/bash

# Wakatto Edge Function Deployment Script
# This script deploys the AI chat edge function to Supabase

echo "🚀 Wakatto Edge Function Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if SUPABASE_ACCESS_TOKEN is set
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo ""
    echo "❌ SUPABASE_ACCESS_TOKEN not found!"
    echo ""
    echo "📝 To get your access token:"
    echo "   1. Go to: https://supabase.com/dashboard/account/tokens"
    echo "   2. Click 'Generate new token'"
    echo "   3. Copy the token"
    echo "   4. Run: export SUPABASE_ACCESS_TOKEN=your_token_here"
    echo ""
    exit 1
fi

echo "✅ Access token found"

# Link to project
echo ""
echo "🔗 Linking to Supabase project..."
supabase link --project-ref rddvqbxbmpilbimmppvu

if [ $? -ne 0 ]; then
    echo "❌ Failed to link project"
    exit 1
fi

echo "✅ Project linked successfully"

# Deploy the function
echo ""
echo "📦 Deploying edge function..."
supabase functions deploy ai-chat --no-verify-jwt

if [ $? -ne 0 ]; then
    echo "❌ Failed to deploy function"
    exit 1
fi

echo "✅ Function deployed successfully!"

# Set secrets
echo ""
echo "🔐 Setting secrets..."

if [ -f .env ]; then
    source .env
    if [ -n "$CLAUDE_API_KEY" ]; then
        echo "$CLAUDE_API_KEY" | supabase secrets set CLAUDE_API_KEY
        echo "✅ CLAUDE_API_KEY secret set"
    else
        echo "⚠️  CLAUDE_API_KEY not found in .env file"
    fi
else
    echo "⚠️  .env file not found"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment complete!"
echo ""
echo "🌐 Function URL:"
echo "   https://rddvqbxbmpilbimmppvu.supabase.co/functions/v1/ai-chat"
echo ""
echo "🧪 Test it with:"
echo "   curl -X POST https://rddvqbxbmpilbimmppvu.supabase.co/functions/v1/ai-chat \\"
echo "     -H 'Authorization: Bearer YOUR_USER_TOKEN' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"messages\":[{\"role\":\"user\",\"content\":\"Hello!\"}],\"provider\":\"anthropic\"}'"
echo ""
