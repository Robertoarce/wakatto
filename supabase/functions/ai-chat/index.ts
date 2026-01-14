import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Types for usage tracking
interface UsageCheck {
  can_proceed: boolean;
  tier: 'trial' | 'free' | 'premium' | 'gold' | 'admin';
  tokens_used: number;
  token_limit: number;
  remaining_tokens: number;
  usage_percentage: number;
  period_end: string;
  warning_level: 'warning' | 'critical' | 'blocked' | null;
  reset_period_days: number;
  daily_messages_used?: number;
  daily_messages_limit?: number;
  trial_days_remaining?: number;
}

// ============================================
// UNIFIED TOOL TYPES (Provider-Agnostic)
// ============================================

interface UnifiedTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

interface ToolResult {
  toolCallId: string;
  result: any;
  error?: string;
}

// ============================================
// TOOL FORMAT CONVERTERS
// ============================================

function toClaudeTools(tools: UnifiedTool[]): any[] {
  return tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    input_schema: {
      type: 'object',
      properties: tool.parameters.properties,
      required: tool.parameters.required || [],
    },
  }));
}

function toOpenAITools(tools: UnifiedTool[]): any[] {
  return tools.map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object',
        properties: tool.parameters.properties,
        required: tool.parameters.required || [],
      },
    },
  }));
}

function toGeminiTools(tools: UnifiedTool[]): any[] {
  return [{
    functionDeclarations: tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object',
        properties: tool.parameters.properties,
        required: tool.parameters.required || [],
      },
    })),
  }];
}

// ============================================
// TOOL CALL PARSERS (normalize responses)
// ============================================

function parseClaudeToolCalls(response: any): ToolCall[] {
  if (!response.content || !Array.isArray(response.content)) return [];
  return response.content
    .filter((block: any) => block.type === 'tool_use')
    .map((block: any) => ({
      id: block.id,
      name: block.name,
      arguments: block.input || {},
    }));
}

function parseOpenAIToolCalls(response: any): ToolCall[] {
  const message = response.choices?.[0]?.message;
  if (!message?.tool_calls) return [];
  return message.tool_calls.map((tc: any) => ({
    id: tc.id,
    name: tc.function.name,
    arguments: JSON.parse(tc.function.arguments || '{}'),
  }));
}

function parseGeminiToolCalls(response: any): ToolCall[] {
  const functionCall = response.candidates?.[0]?.content?.parts?.[0]?.functionCall;
  if (!functionCall) return [];
  return [{
    id: `gemini-${Date.now()}`,
    name: functionCall.name,
    arguments: functionCall.args || {},
  }];
}

// ============================================
// TOOL RESULT FORMATTERS
// ============================================

function formatClaudeToolResults(results: ToolResult[]): any[] {
  return results.map(r => ({
    type: 'tool_result',
    tool_use_id: r.toolCallId,
    content: r.error ? JSON.stringify({ error: r.error }) : JSON.stringify(r.result),
  }));
}

function formatOpenAIToolResults(results: ToolResult[]): any[] {
  return results.map(r => ({
    role: 'tool',
    tool_call_id: r.toolCallId,
    content: r.error ? JSON.stringify({ error: r.error }) : JSON.stringify(r.result),
  }));
}

function formatGeminiToolResults(results: ToolResult[]): any {
  return {
    role: 'function',
    parts: results.map(r => ({
      functionResponse: {
        name: r.toolCallId,
        response: r.error ? { error: r.error } : r.result,
      },
    })),
  };
}

// ============================================
// BOB'S TOOLS (Provider-Agnostic Definitions)
// ============================================

const BOB_TOOLS: UnifiedTool[] = [
  {
    name: 'get_user_status',
    description: `Get the current user's subscription status, usage, and trial information. 
Use this to understand if the user is on trial, free, premium, or gold tier, 
how many tokens they've used, and when their trial expires.`,
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_payment_link',
    description: `Get a Stripe payment link for the user to upgrade their subscription.
Returns a URL that the user can click to complete the purchase.
Optionally apply a discount code if one was created for this user.`,
    parameters: {
      type: 'object',
      properties: {
        tier: {
          type: 'string',
          description: 'The tier to upgrade to: "premium" or "gold"',
        },
        discount_code: {
          type: 'string',
          description: 'Optional discount code to apply',
        },
      },
      required: ['tier'],
    },
  },
  {
    name: 'create_discount',
    description: `Create a personalized discount code for the user. Use this during price negotiation.
The discount is valid for a limited time (default 24 hours).
Be strategic: start with small discounts (10-20%) and only go higher if user pushes back.
Maximum discount is 50%.`,
    parameters: {
      type: 'object',
      properties: {
        discount_percent: {
          type: 'number',
          description: 'Discount percentage (10-50)',
        },
        expires_hours: {
          type: 'number',
          description: 'Hours until the discount expires (default 24)',
        },
      },
      required: ['discount_percent'],
    },
  },
  {
    name: 'unlock_wakattor_preview',
    description: `Grant the user temporary access to try a locked wakattor for free.
Use this to let hesitant users experience the product before buying.
Preview lasts 24 hours by default. Only unlock ONE wakattor at a time.`,
    parameters: {
      type: 'object',
      properties: {
        character_id: {
          type: 'string',
          description: 'The character ID to unlock (e.g., "freud", "einstein", "cleopatra")',
        },
        hours: {
          type: 'number',
          description: 'Hours of preview access (default 24, max 48)',
        },
      },
      required: ['character_id'],
    },
  },
  {
    name: 'show_upgrade_modal',
    description: `Display the upgrade modal with pricing options to the user.
Use this when the user is ready to see pricing or after creating a discount.
This is a CLIENT-SIDE tool - it will be executed in the user's browser.`,
    parameters: {
      type: 'object',
      properties: {
        highlight_tier: {
          type: 'string',
          description: 'Which tier to highlight/recommend: "premium" or "gold"',
        },
        show_discount: {
          type: 'boolean',
          description: 'Whether to show any active discount for this user',
        },
      },
      required: [],
    },
  },
];

// Client-side tools that need to be forwarded to the client
const CLIENT_SIDE_TOOLS = ['show_upgrade_modal'];

// ============================================
// SERVER-SIDE TOOL EXECUTION
// ============================================

interface UserStatusResult {
  tier: string;
  isSubscriber: boolean;
  isTrial: boolean;
  trialDaysRemaining: number | null;
  tokensUsed: number;
  tokenLimit: number;
  tokensRemaining: number;
  usagePercentage: number;
  periodEnd: string;
  dailyMessagesUsed?: number;
  dailyMessagesLimit?: number;
  hasActiveDiscount: boolean;
  activeDiscountPercent?: number;
  activeDiscountCode?: string;
  activeDiscountExpires?: string;
  unlockedWakattors: string[];
}

async function executeServerTool(
  toolCall: ToolCall,
  userId: string,
  supabaseAdmin: any,
  usageCheck: UsageCheck | null
): Promise<ToolResult> {
  const { id, name, arguments: args } = toolCall;

  try {
    switch (name) {
      case 'get_user_status': {
        // Get user's current status
        const subscriberTiers = ['premium', 'gold', 'admin'];
        const tier = usageCheck?.tier || 'free';
        
        // Get active discount
        const { data: discountData } = await supabaseAdmin
          .from('discount_codes')
          .select('code, discount_percent, expires_at')
          .eq('user_id', userId)
          .gt('expires_at', new Date().toISOString())
          .is('used_at', null)
          .order('created_at', { ascending: false })
          .limit(1);

        // Get unlocked wakattors
        const { data: unlocksData } = await supabaseAdmin
          .from('wakattor_unlocks')
          .select('character_id')
          .eq('user_id', userId)
          .gt('expires_at', new Date().toISOString());

        const result: UserStatusResult = {
          tier,
          isSubscriber: subscriberTiers.includes(tier),
          isTrial: tier === 'trial',
          trialDaysRemaining: usageCheck?.trial_days_remaining ?? null,
          tokensUsed: usageCheck?.tokens_used || 0,
          tokenLimit: usageCheck?.token_limit || 5000,
          tokensRemaining: usageCheck?.remaining_tokens || 0,
          usagePercentage: usageCheck?.usage_percentage || 0,
          periodEnd: usageCheck?.period_end || '',
          dailyMessagesUsed: usageCheck?.daily_messages_used,
          dailyMessagesLimit: usageCheck?.daily_messages_limit,
          hasActiveDiscount: !!discountData?.length,
          activeDiscountPercent: discountData?.[0]?.discount_percent,
          activeDiscountCode: discountData?.[0]?.code,
          activeDiscountExpires: discountData?.[0]?.expires_at,
          unlockedWakattors: unlocksData?.map((u: any) => u.character_id) || [],
        };

        return { toolCallId: id, result };
      }

      case 'get_payment_link': {
        const tier = args.tier as 'premium' | 'gold';
        const discountCode = args.discount_code as string | undefined;

        // Get payment link from tier_config
        const { data: tierConfig, error: tierError } = await supabaseAdmin
          .from('tier_config')
          .select('stripe_payment_link, stripe_price_id')
          .eq('tier', tier)
          .single();

        if (tierError || !tierConfig?.stripe_payment_link) {
          // Fallback to environment variable
          const envKey = tier === 'premium' 
            ? 'STRIPE_PAYMENT_LINK_PREMIUM' 
            : 'STRIPE_PAYMENT_LINK_GOLD';
          const envLink = Deno.env.get(envKey);
          
          if (!envLink) {
            return {
              toolCallId: id,
              result: null,
              error: `Payment link not configured for ${tier} tier`,
            };
          }

          // Add prefilled email and client reference
          const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('email')
            .eq('id', userId)
            .single();

          let paymentUrl = envLink;
          if (profile?.email) {
            paymentUrl += `?prefilled_email=${encodeURIComponent(profile.email)}&client_reference_id=${userId}`;
          }

          return {
            toolCallId: id,
            result: {
              paymentUrl,
              tier,
              discountApplied: !!discountCode,
              message: `Here's your payment link for ${tier}. Click to complete your upgrade!`,
            },
          };
        }

        // Build payment URL with user info
        const { data: profile } = await supabaseAdmin
          .from('user_profiles')
          .select('email')
          .eq('id', userId)
          .single();

        let paymentUrl = tierConfig.stripe_payment_link;
        const params = new URLSearchParams();
        if (profile?.email) {
          params.set('prefilled_email', profile.email);
        }
        params.set('client_reference_id', userId);
        if (discountCode) {
          params.set('prefilled_promo_code', discountCode);
        }

        if (params.toString()) {
          paymentUrl += (paymentUrl.includes('?') ? '&' : '?') + params.toString();
        }

        return {
          toolCallId: id,
          result: {
            paymentUrl,
            tier,
            discountApplied: !!discountCode,
            message: `Here's your payment link for ${tier}. Click to complete your upgrade!`,
          },
        };
      }

      case 'create_discount': {
        const discountPercent = Math.min(50, Math.max(10, args.discount_percent || 10));
        const expiresHours = Math.min(72, Math.max(1, args.expires_hours || 24));

        // Use the database function to create discount
        const { data: discountCode, error: discountError } = await supabaseAdmin.rpc(
          'create_bob_discount',
          {
            p_user_id: userId,
            p_discount_percent: discountPercent,
            p_expires_hours: expiresHours,
          }
        );

        if (discountError) {
          console.error('[AI-Chat] Failed to create discount:', discountError);
          return {
            toolCallId: id,
            result: null,
            error: 'Failed to create discount code',
          };
        }

        return {
          toolCallId: id,
          result: {
            code: discountCode,
            discountPercent,
            expiresIn: `${expiresHours} hours`,
            message: `Created a ${discountPercent}% discount code: ${discountCode}. Valid for ${expiresHours} hours.`,
          },
        };
      }

      case 'unlock_wakattor_preview': {
        const characterId = args.character_id as string;
        const hours = Math.min(48, Math.max(1, args.hours || 24));

        if (!characterId) {
          return {
            toolCallId: id,
            result: null,
            error: 'character_id is required',
          };
        }

        // Use the database function to grant preview
        const { data: success, error: unlockError } = await supabaseAdmin.rpc(
          'grant_wakattor_preview',
          {
            p_user_id: userId,
            p_character_id: characterId,
            p_hours: hours,
          }
        );

        if (unlockError) {
          console.error('[AI-Chat] Failed to unlock wakattor:', unlockError);
          return {
            toolCallId: id,
            result: null,
            error: 'Failed to unlock wakattor preview',
          };
        }

        return {
          toolCallId: id,
          result: {
            characterId,
            unlockedFor: `${hours} hours`,
            message: `Unlocked ${characterId} for ${hours} hours! The user can now try this wakattor.`,
          },
        };
      }

      default:
        // Check if it's a client-side tool
        if (CLIENT_SIDE_TOOLS.includes(name)) {
          return {
            toolCallId: id,
            result: {
              _clientSideTool: true,
              name,
              arguments: args,
            },
          };
        }

        return {
          toolCallId: id,
          result: null,
          error: `Unknown tool: ${name}`,
        };
    }
  } catch (error: any) {
    console.error(`[AI-Chat] Tool execution error (${name}):`, error);
    return {
      toolCallId: id,
      result: null,
      error: error.message || 'Tool execution failed',
    };
  }
}

// Tutorial conversations get 3x token limit
const TUTORIAL_TOKEN_MULTIPLIER = 3

// Allowed origins for CORS - production and development
const ALLOWED_ORIGINS = [
  'https://www.wakatto.com',
  'https://wakatto.com',
  'http://localhost:8080',
  'http://localhost:8081',
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

    // Parse request body first to get conversationId
    const { 
      messages, 
      provider = 'anthropic', 
      model, 
      parameters = {}, 
      stream = false, 
      enablePromptCache = true, 
      conversationId,
      enableTools = false,  // Enable Bob's AI tools
      toolResults = [],     // Results from client-side tools (for follow-up)
    } = await req.json()

    // Check if this is a tutorial conversation (gets 3x token limit)
    let isTutorial = false
    if (conversationId) {
      const { data: convData, error: convError } = await supabaseAdmin
        .from('conversations')
        .select('is_tutorial')
        .eq('id', conversationId)
        .eq('user_id', user.id)  // Security: verify conversation belongs to user
        .single()

      if (!convError && convData?.is_tutorial) {
        isTutorial = true
        console.log(`[AI-Chat] Tutorial conversation detected - applying ${TUTORIAL_TOKEN_MULTIPLIER}x token limit`)
      }
    }

    // Check usage limit before proceeding
    const { data: usageCheckData, error: usageError } = await supabaseAdmin.rpc(
      'check_usage_limit',
      { p_user_id: user.id }
    )

    if (usageError) {
      console.error('[AI-Chat] Usage check error:', usageError)
      // Continue anyway - don't block on usage check failures
    }

    let usageCheck: UsageCheck | null = usageCheckData?.[0] || null

    // Apply tutorial multiplier to token limit if applicable
    // Skip for admin tier (unlimited tokens, would cause division by zero)
    if (usageCheck && isTutorial && usageCheck.tier !== 'admin') {
      const adjustedLimit = usageCheck.token_limit * TUTORIAL_TOKEN_MULTIPLIER
      const adjustedRemaining = Math.max(0, adjustedLimit - usageCheck.tokens_used)
      const adjustedPercentage = (usageCheck.tokens_used / adjustedLimit) * 100
      const adjustedWarning = adjustedPercentage >= 100 ? 'blocked' :
                              adjustedPercentage >= 90 ? 'critical' :
                              adjustedPercentage >= 80 ? 'warning' : null
      
      usageCheck = {
        ...usageCheck,
        token_limit: adjustedLimit,
        remaining_tokens: adjustedRemaining,
        usage_percentage: adjustedPercentage,
        warning_level: adjustedWarning,
        can_proceed: adjustedPercentage < 100
      }
    }

    // Block if at limit (unless we couldn't check or user is admin)
    if (usageCheck && !usageCheck.can_proceed && usageCheck.tier !== 'admin') {
      console.log(`[AI-Chat] User ${user.id} blocked - token limit exceeded${isTutorial ? ' (tutorial 3x limit)' : ''}`)
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
        usageCheck,
        enableTools ? BOB_TOOLS : undefined
      )
    }

    // Non-streaming response
    let response: { content: string; promptTokens: number; completionTokens: number; toolCalls?: ToolCall[]; toolResults?: ToolResult[] }
    if (isAnthropic) {
      response = await callAnthropic(
        messages, 
        model || 'claude-3-haiku-20240307', 
        CLAUDE_API_KEY, 
        parameters, 
        enablePromptCache,
        enableTools ? BOB_TOOLS : undefined,
        user.id,
        supabaseAdmin,
        usageCheck
      )
    } else if (provider === 'openai') {
      const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
      if (!OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY not configured')
      }
      response = await callOpenAI(
        messages,
        model || 'gpt-4',
        OPENAI_API_KEY,
        parameters,
        enableTools ? BOB_TOOLS : undefined,
        user.id,
        supabaseAdmin,
        usageCheck
      )
    } else if (provider === 'gemini') {
      const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
      if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY not configured')
      }
      response = await callGemini(
        messages,
        model || 'gemini-1.5-flash',
        GEMINI_API_KEY,
        parameters,
        enableTools ? BOB_TOOLS : undefined,
        user.id,
        supabaseAdmin,
        usageCheck
      )
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
        } : null,
        // Include tool execution results
        toolResults: response.toolResults,
        clientToolCalls: response.clientToolCalls,
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
  usageCheck?: UsageCheck | null,
  tools?: UnifiedTool[]
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

  // Add tools if provided
  if (tools && tools.length > 0) {
    requestBody.tools = toClaudeTools(tools)
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
    let pendingToolCalls: ToolCall[] = []
    let currentToolCall: { id: string; name: string; inputJson: string } | null = null

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
              if (parsed.type === 'content_block_start') {
                // Check if this is a tool_use block
                if (parsed.content_block?.type === 'tool_use') {
                  currentToolCall = {
                    id: parsed.content_block.id,
                    name: parsed.content_block.name,
                    inputJson: '',
                  }
                }
              } else if (parsed.type === 'content_block_delta') {
                const text = parsed.delta?.text
                if (text) {
                  accumulatedText += text
                  // Send as SSE event
                  await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'delta', text })}\n\n`))
                }
                // Handle tool input JSON streaming
                if (parsed.delta?.type === 'input_json_delta' && currentToolCall) {
                  currentToolCall.inputJson += parsed.delta.partial_json || ''
                }
              } else if (parsed.type === 'content_block_stop') {
                // If we have a completed tool call, add it to pending
                if (currentToolCall) {
                  try {
                    const args = currentToolCall.inputJson ? JSON.parse(currentToolCall.inputJson) : {}
                    pendingToolCalls.push({
                      id: currentToolCall.id,
                      name: currentToolCall.name,
                      arguments: args,
                    })
                  } catch (e) {
                    console.error('[AI-Chat] Failed to parse tool arguments:', e)
                  }
                  currentToolCall = null
                }
              } else if (parsed.type === 'message_stop') {
                // Execute any pending tool calls
                if (pendingToolCalls.length > 0 && userId && supabaseAdmin) {
                  const toolResults: ToolResult[] = []
                  const clientToolCalls: ToolCall[] = []

                  for (const tc of pendingToolCalls) {
                    if (CLIENT_SIDE_TOOLS.includes(tc.name)) {
                      // Forward client-side tools to the client
                      clientToolCalls.push(tc)
                    } else {
                      // Execute server-side tools
                      const result = await executeServerTool(tc, userId, supabaseAdmin, usageCheck || null)
                      toolResults.push(result)
                    }
                  }

                  // Send tool results to client
                  if (toolResults.length > 0 || clientToolCalls.length > 0) {
                    await writer.write(encoder.encode(`data: ${JSON.stringify({
                      type: 'tool_results',
                      serverResults: toolResults,
                      clientToolCalls: clientToolCalls,
                    })}\n\n`))
                  }

                  pendingToolCalls = []
                }

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
  enablePromptCache: boolean = true,
  tools?: UnifiedTool[],
  userId?: string,
  supabaseAdmin?: any,
  usageCheck?: UsageCheck | null
): Promise<{ content: string; promptTokens: number; completionTokens: number; toolResults?: ToolResult[]; clientToolCalls?: ToolCall[] }> {
  // Separate system message from conversation messages
  const systemMessage = messages.find(m => m.role === 'system')
  const conversationMessages = messages.filter(m => m.role !== 'system')

  // Build request body with parameters
  const requestBody: any = {
    model: model,
    max_tokens: parameters.maxTokens || 1000,
    messages: conversationMessages,
  }

  // Add tools if provided
  if (tools && tools.length > 0) {
    requestBody.tools = toClaudeTools(tools)
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

  // Parse any tool calls
  const toolCalls = parseClaudeToolCalls(data)
  let toolResults: ToolResult[] = []
  let clientToolCalls: ToolCall[] = []

  if (toolCalls.length > 0 && userId && supabaseAdmin) {
    for (const tc of toolCalls) {
      if (CLIENT_SIDE_TOOLS.includes(tc.name)) {
        clientToolCalls.push(tc)
      } else {
        const result = await executeServerTool(tc, userId, supabaseAdmin, usageCheck || null)
        toolResults.push(result)
      }
    }
  }

  // Get text content (may be empty if only tool calls)
  const textContent = data.content
    .filter((block: any) => block.type === 'text')
    .map((block: any) => block.text)
    .join('')

  return {
    content: textContent || '',
    promptTokens,
    completionTokens,
    toolResults: toolResults.length > 0 ? toolResults : undefined,
    clientToolCalls: clientToolCalls.length > 0 ? clientToolCalls : undefined,
  }
}

// ============================================
// Non-streaming OpenAI with Tool Support
// ============================================

async function callOpenAI(
  messages: any[],
  model: string,
  apiKey: string,
  parameters: any = {},
  tools?: UnifiedTool[],
  userId?: string,
  supabaseAdmin?: any,
  usageCheck?: UsageCheck | null
): Promise<{ content: string; promptTokens: number; completionTokens: number; toolResults?: ToolResult[]; clientToolCalls?: ToolCall[] }> {
  // Build request body with parameters
  const requestBody: any = {
    model: model,
    messages: messages,
    temperature: parameters.temperature !== undefined ? parameters.temperature : 0.7,
    max_tokens: parameters.maxTokens || 1000,
  }

  // Add tools if provided
  if (tools && tools.length > 0) {
    requestBody.tools = toOpenAITools(tools)
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

  // Parse any tool calls
  const toolCalls = parseOpenAIToolCalls(data)
  let toolResults: ToolResult[] = []
  let clientToolCalls: ToolCall[] = []

  if (toolCalls.length > 0 && userId && supabaseAdmin) {
    for (const tc of toolCalls) {
      if (CLIENT_SIDE_TOOLS.includes(tc.name)) {
        clientToolCalls.push(tc)
      } else {
        const result = await executeServerTool(tc, userId, supabaseAdmin, usageCheck || null)
        toolResults.push(result)
      }
    }
  }

  return {
    content: data.choices[0]?.message?.content || '',
    promptTokens,
    completionTokens,
    toolResults: toolResults.length > 0 ? toolResults : undefined,
    clientToolCalls: clientToolCalls.length > 0 ? clientToolCalls : undefined,
  }
}

// ============================================
// Non-streaming Gemini with Tool Support
// ============================================

async function callGemini(
  messages: any[],
  model: string,
  apiKey: string,
  parameters: any = {},
  tools?: UnifiedTool[],
  userId?: string,
  supabaseAdmin?: any,
  usageCheck?: UsageCheck | null
): Promise<{ content: string; promptTokens: number; completionTokens: number; toolResults?: ToolResult[]; clientToolCalls?: ToolCall[] }> {
  // Convert messages to Gemini format
  const systemMessage = messages.find(m => m.role === 'system')
  const conversationMessages = messages.filter(m => m.role !== 'system')

  const contents = conversationMessages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const requestBody: any = {
    contents,
    generationConfig: {
      temperature: parameters.temperature ?? 0.7,
      maxOutputTokens: parameters.maxTokens || 1000,
    },
  }

  // Add system instruction if present
  if (systemMessage?.content) {
    requestBody.systemInstruction = { parts: [{ text: systemMessage.content }] }
  }

  // Add tools if provided
  if (tools && tools.length > 0) {
    requestBody.tools = toGeminiTools(tools)
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Gemini API error: ${error}`)
  }

  const data = await response.json()

  // Estimate tokens (Gemini doesn't always return usage)
  const promptTokens = data.usageMetadata?.promptTokenCount || 
    Math.ceil(messages.reduce((acc: number, m: any) => acc + (m.content?.length || 0), 0) / 4)
  const completionTokens = data.usageMetadata?.candidatesTokenCount || 
    Math.ceil((data.candidates?.[0]?.content?.parts?.[0]?.text || '').length / 4)

  // Parse any tool calls
  const toolCalls = parseGeminiToolCalls(data)
  let toolResults: ToolResult[] = []
  let clientToolCalls: ToolCall[] = []

  if (toolCalls.length > 0 && userId && supabaseAdmin) {
    for (const tc of toolCalls) {
      if (CLIENT_SIDE_TOOLS.includes(tc.name)) {
        clientToolCalls.push(tc)
      } else {
        const result = await executeServerTool(tc, userId, supabaseAdmin, usageCheck || null)
        toolResults.push(result)
      }
    }
  }

  // Get text content
  const textContent = data.candidates?.[0]?.content?.parts
    ?.filter((p: any) => p.text)
    ?.map((p: any) => p.text)
    ?.join('') || ''

  return {
    content: textContent,
    promptTokens,
    completionTokens,
    toolResults: toolResults.length > 0 ? toolResults : undefined,
    clientToolCalls: clientToolCalls.length > 0 ? clientToolCalls : undefined,
  }
}
