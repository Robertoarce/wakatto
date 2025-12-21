import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Types for usage tracking
interface UsageCheck {
  can_proceed: boolean;
  tier: 'free' | 'premium' | 'gold' | 'admin';
  tokens_used: number;
  token_limit: number;
  remaining_tokens: number;
  usage_percentage: number;
  period_end: string;
  warning_level: 'warning' | 'critical' | 'blocked' | null;
  reset_period_days: number;
}

// Allowed origins for CORS - production and development
const ALLOWED_ORIGINS = [
  'https://www.wakatto.com',
  'https://wakatto.com',
  'http://localhost:8080',
  'http://localhost:19006',
  'http://localhost:3000',
]

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || ''
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Handle warmup requests (no auth required) - prevents cold start latency
  if (req.method === 'POST') {
    try {
      const body = await req.clone().json()
      if (body.type === 'warmup') {
        console.log('[AI-Chat] Warmup ping received')
        return new Response(
          JSON.stringify({ status: 'warm', timestamp: Date.now() }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } catch {
      // Not JSON or no type field, continue to normal flow
    }
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

    // Create admin client for usage tracking (uses service role for database operations)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check usage limit before proceeding
    const { data: usageCheckData, error: usageError } = await supabaseAdmin.rpc(
      'check_usage_limit',
      { p_user_id: user.id }
    )

    if (usageError) {
      console.error('[AI-Chat] Usage check error:', usageError)
      // Continue anyway - don't block on usage check failures
    }

    const usageCheck: UsageCheck | null = usageCheckData?.[0] || null

    // Block if at limit (unless we couldn't check)
    if (usageCheck && !usageCheck.can_proceed) {
      console.log(`[AI-Chat] User ${user.id} blocked - token limit exceeded`)
      return new Response(
        JSON.stringify({
          error: 'Token limit exceeded',
          code: 'LIMIT_EXCEEDED',
          message: `You have used all ${usageCheck.token_limit.toLocaleString()} tokens for this period. Your limit resets on ${usageCheck.period_end}.`,
          usage: {
            tier: usageCheck.tier,
            tokens_used: usageCheck.tokens_used,
            token_limit: usageCheck.token_limit,
            remaining_tokens: 0,
            usage_percentage: 100,
            period_end: usageCheck.period_end,
            warning_level: 'blocked'
          }
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse request body
    const { messages, provider = 'anthropic', model, parameters = {}, stream = false, enablePromptCache = true } = await req.json()

    // Log only non-sensitive metadata
    console.log(`[AI-Chat] Provider: ${provider}, Stream: ${stream}, Messages: ${messages.length}`)

    // Handle streaming vs non-streaming
    // Support both 'anthropic' and 'anthropic_fast' providers
    const isAnthropic = provider === 'anthropic' || provider === 'anthropic_fast'

    if (stream && isAnthropic) {
      return await streamAnthropic(
        messages,
        model || 'claude-3-haiku-20240307',
        CLAUDE_API_KEY,
        parameters,
        corsHeaders,
        enablePromptCache,
        user.id,
        supabaseAdmin,
        usageCheck
      )
    }

    // Non-streaming response
    let response: { content: string; promptTokens: number; completionTokens: number }
    if (isAnthropic) {
      response = await callAnthropic(messages, model || 'claude-3-haiku-20240307', CLAUDE_API_KEY, parameters, enablePromptCache)
    } else if (provider === 'openai') {
      const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
      if (!OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY not configured')
      }
      response = await callOpenAI(messages, model || 'gpt-4', OPENAI_API_KEY, parameters)
    } else {
      throw new Error(`Unsupported provider: ${provider}`)
    }

    // Record token usage (skip for admin)
    let updatedUsage = usageCheck
    if (usageCheck && usageCheck.tier !== 'admin') {
      const { data: recordedUsage, error: recordError } = await supabaseAdmin.rpc(
        'record_token_usage',
        {
          p_user_id: user.id,
          p_prompt_tokens: response.promptTokens,
          p_completion_tokens: response.completionTokens
        }
      )
      if (recordError) {
        console.error('[AI-Chat] Failed to record usage:', recordError)
      } else {
        // Update usage info for response
        const totalUsed = (usageCheck.tokens_used || 0) + response.promptTokens + response.completionTokens
        const newPercentage = (totalUsed / usageCheck.token_limit) * 100
        updatedUsage = {
          ...usageCheck,
          tokens_used: totalUsed,
          remaining_tokens: Math.max(0, usageCheck.token_limit - totalUsed),
          usage_percentage: Math.round(newPercentage * 100) / 100,
          warning_level: newPercentage >= 100 ? 'blocked' :
                        newPercentage >= 90 ? 'critical' :
                        newPercentage >= 80 ? 'warning' : null
        }
      }
    }

    return new Response(
      JSON.stringify({
        content: response.content,
        usage: updatedUsage ? {
          tier: updatedUsage.tier,
          tokens_used: updatedUsage.tokens_used,
          token_limit: updatedUsage.token_limit,
          remaining_tokens: updatedUsage.remaining_tokens,
          usage_percentage: updatedUsage.usage_percentage,
          period_end: updatedUsage.period_end,
          warning_level: updatedUsage.warning_level,
          prompt_tokens: response.promptTokens,
          completion_tokens: response.completionTokens
        } : null
      }),
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

// ============================================
// Streaming Anthropic Response with Prompt Caching
// ============================================

async function streamAnthropic(
  messages: any[],
  model: string,
  apiKey: string,
  parameters: any,
  corsHeaders: Record<string, string>,
  enablePromptCache: boolean = true,
  userId?: string,
  supabaseAdmin?: any,
  usageCheck?: UsageCheck | null
): Promise<Response> {
  const systemMessage = messages.find(m => m.role === 'system')
  const conversationMessages = messages.filter(m => m.role !== 'system')

  // Build request body with optional prompt caching
  // Prompt caching marks the system prompt for caching to reduce processing time
  const requestBody: any = {
    model: model,
    max_tokens: parameters.maxTokens || 1000,
    messages: conversationMessages,
    stream: true,
  }

  // Add system prompt with cache control if enabled
  if (systemMessage?.content) {
    if (enablePromptCache) {
      // Use structured system format with cache_control for prompt caching
      // This caches the static animation instructions across requests
      requestBody.system = [
        {
          type: 'text',
          text: systemMessage.content,
          cache_control: { type: 'ephemeral' }  // Cache for session duration
        }
      ]
    } else {
      requestBody.system = systemMessage.content
    }
  }

  if (parameters.temperature !== undefined) requestBody.temperature = parameters.temperature
  if (parameters.topP !== undefined) requestBody.top_p = parameters.topP
  if (parameters.topK !== undefined) requestBody.top_k = parameters.topK

  // Build headers - add beta header for prompt caching
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
  }
  
  if (enablePromptCache) {
    headers['anthropic-beta'] = 'prompt-caching-2024-07-31'
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Anthropic API error: ${error}`)
  }

  // Create a TransformStream to process SSE events
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const encoder = new TextEncoder()

  // Process the stream in the background
  ;(async () => {
    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let promptTokens = 0
    let completionTokens = 0
    let accumulatedText = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)

              // Handle different event types
              if (parsed.type === 'content_block_delta') {
                const text = parsed.delta?.text
                if (text) {
                  accumulatedText += text
                  // Send as SSE event
                  await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'delta', text })}\n\n`))
                }
              } else if (parsed.type === 'message_stop') {
                // Record token usage at end of stream (skip for admin)
                if (userId && supabaseAdmin && usageCheck && usageCheck.tier !== 'admin') {
                  // Estimate tokens if not provided by API
                  // Anthropic typically provides usage in message_start/message_delta
                  const estimatedPromptTokens = promptTokens || Math.ceil(messages.reduce((acc, m) => acc + (m.content?.length || 0), 0) / 4)
                  const estimatedCompletionTokens = completionTokens || Math.ceil(accumulatedText.length / 4)

                  try {
                    await supabaseAdmin.rpc('record_token_usage', {
                      p_user_id: userId,
                      p_prompt_tokens: estimatedPromptTokens,
                      p_completion_tokens: estimatedCompletionTokens
                    })

                    // Calculate updated usage for response
                    const totalUsed = (usageCheck.tokens_used || 0) + estimatedPromptTokens + estimatedCompletionTokens
                    const newPercentage = (totalUsed / usageCheck.token_limit) * 100
                    const warningLevel = newPercentage >= 100 ? 'blocked' :
                                        newPercentage >= 90 ? 'critical' :
                                        newPercentage >= 80 ? 'warning' : null

                    // Send usage info before done
                    await writer.write(encoder.encode(`data: ${JSON.stringify({
                      type: 'usage',
                      usage: {
                        tier: usageCheck.tier,
                        tokens_used: totalUsed,
                        token_limit: usageCheck.token_limit,
                        remaining_tokens: Math.max(0, usageCheck.token_limit - totalUsed),
                        usage_percentage: Math.round(newPercentage * 100) / 100,
                        period_end: usageCheck.period_end,
                        warning_level: warningLevel,
                        prompt_tokens: estimatedPromptTokens,
                        completion_tokens: estimatedCompletionTokens
                      }
                    })}\n\n`))
                  } catch (e) {
                    console.error('[AI-Chat] Failed to record streaming usage:', e)
                  }
                }

                await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))
              } else if (parsed.type === 'message_start') {
                // Capture usage from message_start if available
                if (parsed.message?.usage) {
                  promptTokens = parsed.message.usage.input_tokens || 0
                }
                // Send timing info
                const startTime = Date.now()
                await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'start', timestamp: startTime })}\n\n`))
              } else if (parsed.type === 'message_delta') {
                // Capture final usage from message_delta
                if (parsed.usage) {
                  completionTokens = parsed.usage.output_tokens || 0
                }
              }
            } catch (e) {
              // Skip non-JSON lines
            }
          }
        }
      }
    } catch (error) {
      console.error('[AI-Chat] Stream error:', error)
      await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`))
    } finally {
      await writer.close()
    }
  })()

  return new Response(readable, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

// ============================================
// Non-streaming Anthropic with Prompt Caching
// ============================================

async function callAnthropic(
  messages: any[],
  model: string,
  apiKey: string,
  parameters: any = {},
  enablePromptCache: boolean = true
): Promise<{ content: string; promptTokens: number; completionTokens: number }> {
  // Separate system message from conversation messages
  const systemMessage = messages.find(m => m.role === 'system')
  const conversationMessages = messages.filter(m => m.role !== 'system')

  // Build request body with parameters
  const requestBody: any = {
    model: model,
    max_tokens: parameters.maxTokens || 1000,
    messages: conversationMessages,
  }

  // Add system prompt with cache control if enabled
  if (systemMessage?.content) {
    if (enablePromptCache) {
      // Use structured system format with cache_control
      requestBody.system = [
        {
          type: 'text',
          text: systemMessage.content,
          cache_control: { type: 'ephemeral' }
        }
      ]
    } else {
      requestBody.system = systemMessage.content
    }
  }

  // Add optional parameters if provided
  if (parameters.temperature !== undefined) requestBody.temperature = parameters.temperature
  if (parameters.topP !== undefined) requestBody.top_p = parameters.topP
  if (parameters.topK !== undefined) requestBody.top_k = parameters.topK

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
  }
  
  if (enablePromptCache) {
    headers['anthropic-beta'] = 'prompt-caching-2024-07-31'
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Anthropic API error: ${error}`)
  }

  const data = await response.json()

  // Extract actual token usage from API response
  const promptTokens = data.usage?.input_tokens || Math.ceil(messages.reduce((acc: number, m: any) => acc + (m.content?.length || 0), 0) / 4)
  const completionTokens = data.usage?.output_tokens || Math.ceil((data.content[0]?.text || '').length / 4)

  return {
    content: data.content[0]?.text || 'Sorry, I could not generate a response.',
    promptTokens,
    completionTokens
  }
}

// ============================================
// Non-streaming OpenAI
// ============================================

async function callOpenAI(messages: any[], model: string, apiKey: string, parameters: any = {}): Promise<{ content: string; promptTokens: number; completionTokens: number }> {
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

  // Extract token usage from OpenAI response
  const promptTokens = data.usage?.prompt_tokens || Math.ceil(messages.reduce((acc: number, m: any) => acc + (m.content?.length || 0), 0) / 4)
  const completionTokens = data.usage?.completion_tokens || Math.ceil((data.choices[0]?.message?.content || '').length / 4)

  return {
    content: data.choices[0]?.message?.content || 'Sorry, I could not generate a response.',
    promptTokens,
    completionTokens
  }
}
