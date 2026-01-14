/**
 * AI Tools Service
 *
 * Provider-agnostic tool definitions and execution for AI assistants.
 * Tools are defined once and converted to each provider's format (Claude, OpenAI, Gemini).
 *
 * Flow:
 * 1. Tools defined here in unified format
 * 2. Edge function converts to provider format before sending to AI
 * 3. AI returns tool_use response
 * 4. Edge function parses and executes server-side tools
 * 5. Client executes client-side tools (modals, navigation)
 * 6. Results sent back to AI for natural language response
 */

import { supabase } from '../lib/supabase';
import { AccountTier, UsageInfo } from './usageTrackingService';

// ============================================
// UNIFIED TOOL SCHEMA (Provider-Agnostic)
// ============================================

export interface UnifiedToolParameter {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  enum?: string[];
  items?: { type: string };
  default?: any;
}

export interface UnifiedTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, UnifiedToolParameter>;
    required?: string[];
  };
  /** Where the tool executes: 'server' (Edge Function) or 'client' (React app) */
  execution: 'server' | 'client';
}

// ============================================
// TOOL CALL TYPES
// ============================================

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface ToolResult {
  toolCallId: string;
  result: any;
  error?: string;
}

// ============================================
// BOB'S TOOL DEFINITIONS
// ============================================

export const BOB_TOOLS: UnifiedTool[] = [
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
    execution: 'server',
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
          description: 'The tier to upgrade to',
          enum: ['premium', 'gold'],
        },
        discount_code: {
          type: 'string',
          description: 'Optional discount code to apply',
        },
      },
      required: ['tier'],
    },
    execution: 'server',
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
          default: 24,
        },
      },
      required: ['discount_percent'],
    },
    execution: 'server',
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
          default: 24,
        },
      },
      required: ['character_id'],
    },
    execution: 'server',
  },
  {
    name: 'show_upgrade_modal',
    description: `Display the upgrade modal with pricing options to the user.
Use this when the user is ready to see pricing or after creating a discount.`,
    parameters: {
      type: 'object',
      properties: {
        highlight_tier: {
          type: 'string',
          description: 'Which tier to highlight/recommend',
          enum: ['premium', 'gold'],
        },
        show_discount: {
          type: 'boolean',
          description: 'Whether to show any active discount for this user',
        },
      },
      required: [],
    },
    execution: 'client',
  },
];

// ============================================
// ANIMATION TOOLS (for character expressions)
// ============================================

export const ANIMATION_TOOLS: UnifiedTool[] = [
  {
    name: 'express',
    description: `Set your facial expression and body animation. Use this INSTEAD of writing *action* text like *raises eyebrow*.
Your 3D avatar will animate based on these parameters. Call this before or during your response to show emotion.`,
    parameters: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'Facial expression preset',
          enum: [
            'joyful', 'happy', 'excited', 'loving', 'proud', 'playful', 'amused',
            'sad', 'angry', 'frustrated', 'annoyed', 'disappointed',
            'thoughtful', 'curious', 'confused', 'skeptical',
            'surprised', 'shocked', 'amazed',
            'nervous', 'worried', 'embarrassed', 'shy',
            'neutral', 'calm', 'serious', 'focused',
            'sleepy', 'bored', 'smug', 'mischievous',
            'sassy', 'unimpressed', 'judging', 'teasing'
          ],
        },
        animation: {
          type: 'string',
          description: 'Body animation to perform',
          enum: [
            'idle', 'thinking', 'talking', 'confused', 'happy', 'excited',
            'nod', 'shake_head', 'shrug', 'wave', 'point', 'clap', 'bow',
            'lean_back', 'lean_forward', 'cross_arms',
            'facepalm', 'laugh', 'cry', 'angry', 'nervous', 'celebrate',
            'head_tilt', 'chin_stroke'
          ],
        },
        look_at: {
          type: 'string',
          description: 'Where to look',
          enum: ['center', 'left', 'right', 'up', 'down', 'away'],
        },
      },
      required: ['expression'],
    },
    execution: 'client',
  },
];

// ============================================
// ANIMATION TOOL RESULT TYPE
// ============================================

export interface AnimationToolResult {
  expression?: string;
  animation?: string;
  look_at?: string;
}

// ============================================
// USER STATUS RESPONSE TYPE
// ============================================

export interface UserStatusResult {
  tier: AccountTier;
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
  activeDiscountExpires?: string;
  unlockedWakattors: string[];
}

// ============================================
// CLIENT-SIDE TOOL EXECUTOR
// ============================================

export interface ClientToolCallbacks {
  onShowUpgradeModal?: (highlightTier?: 'premium' | 'gold', showDiscount?: boolean) => void;
  onNavigateToWakattor?: (characterId: string) => void;
  onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
  /** Called when LLM uses the express() tool to set animation/expression */
  onExpress?: (result: AnimationToolResult) => void;
}

/**
 * Execute a client-side tool call
 * Returns the result to send back to the AI
 */
export function executeClientTool(
  toolCall: ToolCall,
  callbacks: ClientToolCallbacks
): ToolResult {
  const { id, name, arguments: args } = toolCall;

  try {
    switch (name) {
      case 'show_upgrade_modal':
        callbacks.onShowUpgradeModal?.(args.highlight_tier, args.show_discount);
        return {
          toolCallId: id,
          result: { success: true, message: 'Upgrade modal displayed to user' },
        };

      case 'navigate_to_wakattor':
        callbacks.onNavigateToWakattor?.(args.character_id);
        return {
          toolCallId: id,
          result: { success: true, message: `Navigated to ${args.character_id}` },
        };

      case 'express':
        // Handle animation/expression tool
        const animResult: AnimationToolResult = {
          expression: args.expression,
          animation: args.animation,
          look_at: args.look_at,
        };
        callbacks.onExpress?.(animResult);
        return {
          toolCallId: id,
          result: { 
            success: true, 
            message: `Expression set: ${args.expression}${args.animation ? `, animation: ${args.animation}` : ''}` 
          },
        };

      default:
        return {
          toolCallId: id,
          result: null,
          error: `Unknown client tool: ${name}`,
        };
    }
  } catch (error: any) {
    return {
      toolCallId: id,
      result: null,
      error: error.message || 'Tool execution failed',
    };
  }
}

// ============================================
// TOOL HELPERS
// ============================================

/**
 * Get only the tool names for filtering
 */
export function getBobToolNames(): string[] {
  return BOB_TOOLS.map(t => t.name);
}

/**
 * Get animation tool names
 */
export function getAnimationToolNames(): string[] {
  return ANIMATION_TOOLS.map(t => t.name);
}

/**
 * Get all tool names (Bob + Animation)
 */
export function getAllToolNames(): string[] {
  return [...BOB_TOOLS, ...ANIMATION_TOOLS].map(t => t.name);
}

/**
 * Check if a tool is client-side
 */
export function isClientTool(toolName: string): boolean {
  const allTools = [...BOB_TOOLS, ...ANIMATION_TOOLS];
  const tool = allTools.find(t => t.name === toolName);
  return tool?.execution === 'client';
}

/**
 * Get tools for a specific execution context
 */
export function getToolsByExecution(execution: 'server' | 'client'): UnifiedTool[] {
  return BOB_TOOLS.filter(t => t.execution === execution);
}

// ============================================
// FETCH USER'S ACTIVE UNLOCKS (for client)
// ============================================

export async function getActiveWakattorUnlocks(): Promise<string[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('wakattor_unlocks')
      .select('character_id')
      .eq('user_id', user.id)
      .gt('expires_at', new Date().toISOString());

    if (error) {
      console.error('[AITools] Error fetching unlocks:', error);
      return [];
    }

    return data?.map(row => row.character_id) || [];
  } catch (error) {
    console.error('[AITools] Exception fetching unlocks:', error);
    return [];
  }
}

/**
 * Check if user has a specific wakattor unlocked (temporary preview)
 */
export async function hasWakattorUnlock(characterId: string): Promise<boolean> {
  const unlocks = await getActiveWakattorUnlocks();
  return unlocks.includes(characterId);
}

// ============================================
// FETCH USER'S ACTIVE DISCOUNT (for client)
// ============================================

export interface ActiveDiscount {
  code: string;
  discountPercent: number;
  expiresAt: string;
  validForTiers: AccountTier[];
}

export async function getActiveDiscount(): Promise<ActiveDiscount | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('discount_codes')
      .select('code, discount_percent, expires_at, valid_for_tiers')
      .eq('user_id', user.id)
      .gt('expires_at', new Date().toISOString())
      .is('used_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      code: data.code,
      discountPercent: data.discount_percent,
      expiresAt: data.expires_at,
      validForTiers: data.valid_for_tiers,
    };
  } catch (error) {
    console.error('[AITools] Exception fetching discount:', error);
    return null;
  }
}
