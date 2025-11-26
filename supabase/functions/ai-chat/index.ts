import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the API key from environment variables (stored in Supabase)
    const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY')
    if (!CLAUDE_API_KEY) {
      throw new Error('CLAUDE_API_KEY not configured in Supabase secrets')
    }

    // Verify user authentication
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse request body
    const { messages, provider = 'anthropic', model, parameters = {} } = await req.json()

    console.log(`[AI-Chat] User: ${user.id}, Provider: ${provider}, Messages: ${messages.length}`)
    console.log(`[AI-Chat] Parameters:`, parameters)

    // Call the appropriate AI provider
    let response
    if (provider === 'anthropic') {
      response = await callAnthropic(messages, model || 'claude-3-haiku-20240307', CLAUDE_API_KEY, parameters)
    } else if (provider === 'openai') {
      const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
      if (!OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY not configured')
      }
      response = await callOpenAI(messages, model || 'gpt-4', OPENAI_API_KEY, parameters)
    } else {
      throw new Error(`Unsupported provider: ${provider}`)
    }

    return new Response(
      JSON.stringify({ content: response }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('[AI-Chat] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function callAnthropic(messages: any[], model: string, apiKey: string, parameters: any = {}): Promise<string> {
  // Separate system message from conversation messages
  const systemMessage = messages.find(m => m.role === 'system')
  const conversationMessages = messages.filter(m => m.role !== 'system')

  // Build request body with parameters
  const requestBody: any = {
    model: model,
    max_tokens: parameters.maxTokens || 1000,
    system: systemMessage?.content,
    messages: conversationMessages,
  }

  // Add optional parameters if provided
  if (parameters.temperature !== undefined) requestBody.temperature = parameters.temperature
  if (parameters.topP !== undefined) requestBody.top_p = parameters.topP
  if (parameters.topK !== undefined) requestBody.top_k = parameters.topK

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Anthropic API error: ${error}`)
  }

  const data = await response.json()
  return data.content[0]?.text || 'Sorry, I could not generate a response.'
}

async function callOpenAI(messages: any[], model: string, apiKey: string, parameters: any = {}): Promise<string> {
  // Build request body with parameters
  const requestBody: any = {
    model: model,
    messages: messages,
    temperature: parameters.temperature !== undefined ? parameters.temperature : 0.7,
    max_tokens: parameters.maxTokens || 1000,
  }

  // Add optional parameters if provided
  if (parameters.topP !== undefined) requestBody.top_p = parameters.topP
  if (parameters.frequencyPenalty !== undefined) requestBody.frequency_penalty = parameters.frequencyPenalty
  if (parameters.presencePenalty !== undefined) requestBody.presence_penalty = parameters.presencePenalty

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${error}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || 'Sorry, I could not generate a response.'
}
