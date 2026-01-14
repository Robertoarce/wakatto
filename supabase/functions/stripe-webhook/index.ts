import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Stripe Webhook Handler
 *
 * Handles Stripe payment events and updates user tiers accordingly.
 * 
 * Events handled:
 * - checkout.session.completed: Upgrade user tier after successful payment
 * - customer.subscription.deleted: Downgrade user tier when subscription cancelled
 * 
 * Setup:
 * 1. Add STRIPE_WEBHOOK_SECRET to Supabase secrets
 * 2. Configure Stripe webhook endpoint to: https://[project].supabase.co/functions/v1/stripe-webhook
 * 3. Add events: checkout.session.completed, customer.subscription.deleted
 */

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://www.wakatto.com',
  'https://wakatto.com',
]

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || ''
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  }
}

// Verify Stripe webhook signature
async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder()
    
    // Parse signature header
    const parts = signature.split(',')
    const timestamp = parts.find(p => p.startsWith('t='))?.slice(2)
    const v1Signature = parts.find(p => p.startsWith('v1='))?.slice(3)
    
    if (!timestamp || !v1Signature) {
      console.error('[Stripe-Webhook] Missing timestamp or signature')
      return false
    }

    // Create signed payload
    const signedPayload = `${timestamp}.${payload}`
    
    // Import the secret key
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    // Sign the payload
    const signatureBytes = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(signedPayload)
    )
    
    // Convert to hex
    const expectedSignature = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    
    // Compare signatures (timing-safe would be better in production)
    return v1Signature === expectedSignature
  } catch (error) {
    console.error('[Stripe-Webhook] Signature verification error:', error)
    return false
  }
}

// Map Stripe price IDs to account tiers
function getTierFromPriceId(priceId: string): 'premium' | 'gold' | null {
  // These should match your Stripe price IDs
  const premiumPriceIds = [
    Deno.env.get('STRIPE_PRICE_ID_PREMIUM'),
    'price_premium_placeholder',
  ].filter(Boolean)

  const goldPriceIds = [
    Deno.env.get('STRIPE_PRICE_ID_GOLD'),
    'price_gold_placeholder',
  ].filter(Boolean)

  if (premiumPriceIds.includes(priceId)) return 'premium'
  if (goldPriceIds.includes(priceId)) return 'gold'
  
  // Try to infer from metadata or name
  const lowerPriceId = priceId.toLowerCase()
  if (lowerPriceId.includes('gold')) return 'gold'
  if (lowerPriceId.includes('premium')) return 'premium'
  
  return null
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    
    if (!STRIPE_WEBHOOK_SECRET) {
      console.error('[Stripe-Webhook] STRIPE_WEBHOOK_SECRET not configured')
      throw new Error('Webhook secret not configured')
    }

    // Get the raw body and signature
    const payload = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      console.error('[Stripe-Webhook] Missing stripe-signature header')
      return new Response(
        JSON.stringify({ error: 'Missing signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the webhook signature
    const isValid = await verifyStripeSignature(payload, signature, STRIPE_WEBHOOK_SECRET)
    
    if (!isValid) {
      console.error('[Stripe-Webhook] Invalid signature')
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse the event
    const event = JSON.parse(payload)
    console.log(`[Stripe-Webhook] Received event: ${event.type}`)

    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        
        // Get user ID from client_reference_id (we set this in the payment link)
        const userId = session.client_reference_id
        const customerEmail = session.customer_email || session.customer_details?.email
        const customerId = session.customer
        const amountTotal = session.amount_total
        const currency = session.currency

        console.log(`[Stripe-Webhook] Checkout completed for user: ${userId}, customer: ${customerId}`)

        if (!userId) {
          console.error('[Stripe-Webhook] No client_reference_id in session')
          // Try to find user by email
          if (customerEmail) {
            const { data: profile } = await supabaseAdmin
              .from('user_profiles')
              .select('id')
              .eq('email', customerEmail)
              .single()
            
            if (profile) {
              console.log(`[Stripe-Webhook] Found user by email: ${profile.id}`)
              // Continue with this user
            } else {
              return new Response(
                JSON.stringify({ error: 'User not found' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              )
            }
          } else {
            return new Response(
              JSON.stringify({ error: 'No user identifier in session' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
        }

        // Determine the tier from the line items
        let newTier: 'premium' | 'gold' | null = null
        
        // Check line items for price ID
        if (session.line_items?.data) {
          for (const item of session.line_items.data) {
            const priceId = item.price?.id
            if (priceId) {
              newTier = getTierFromPriceId(priceId)
              if (newTier) break
            }
          }
        }

        // Fallback: check metadata
        if (!newTier && session.metadata?.tier) {
          newTier = session.metadata.tier as 'premium' | 'gold'
        }

        // Fallback: infer from amount
        if (!newTier) {
          // Assuming premium is ~$10 (1000 cents) and gold is ~$25 (2500 cents)
          if (amountTotal >= 2000) {
            newTier = 'gold'
          } else {
            newTier = 'premium'
          }
        }

        console.log(`[Stripe-Webhook] Upgrading user ${userId} to tier: ${newTier}`)

        // Update user tier
        const { error: upgradeError } = await supabaseAdmin.rpc('upgrade_user_tier', {
          p_user_id: userId,
          p_new_tier: newTier,
        })

        if (upgradeError) {
          console.error('[Stripe-Webhook] Failed to upgrade tier:', upgradeError)
          throw new Error('Failed to upgrade user tier')
        }

        // Save Stripe customer ID mapping
        if (customerId) {
          const { error: customerError } = await supabaseAdmin
            .from('stripe_customers')
            .upsert({
              user_id: userId,
              stripe_customer_id: customerId,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' })

          if (customerError) {
            console.warn('[Stripe-Webhook] Failed to save customer mapping:', customerError)
          }
        }

        // Record payment history
        const { error: paymentError } = await supabaseAdmin
          .from('payment_history')
          .insert({
            user_id: userId,
            stripe_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent,
            amount_cents: amountTotal,
            currency: currency,
            tier_purchased: newTier,
            status: 'completed',
            completed_at: new Date().toISOString(),
            metadata: {
              customer_email: customerEmail,
              stripe_customer_id: customerId,
            },
          })

        if (paymentError) {
          console.warn('[Stripe-Webhook] Failed to record payment:', paymentError)
        }

        // Mark any discount codes as used
        if (session.discount?.coupon?.id) {
          // Find discount code by the coupon
          await supabaseAdmin
            .from('discount_codes')
            .update({ 
              used_at: new Date().toISOString(),
              current_uses: 1,
            })
            .eq('user_id', userId)
            .is('used_at', null)
        }

        console.log(`[Stripe-Webhook] Successfully processed checkout for user ${userId}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const customerId = subscription.customer

        console.log(`[Stripe-Webhook] Subscription deleted for customer: ${customerId}`)

        // Find user by Stripe customer ID
        const { data: customerMapping } = await supabaseAdmin
          .from('stripe_customers')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (customerMapping) {
          // Downgrade user to free tier
          await supabaseAdmin.rpc('upgrade_user_tier', {
            p_user_id: customerMapping.user_id,
            p_new_tier: 'free',
          })

          console.log(`[Stripe-Webhook] Downgraded user ${customerMapping.user_id} to free tier`)
        }
        break
      }

      case 'customer.subscription.updated': {
        // Handle subscription updates (tier changes, renewals, etc.)
        const subscription = event.data.object
        console.log(`[Stripe-Webhook] Subscription updated: ${subscription.id}`)
        break
      }

      default:
        console.log(`[Stripe-Webhook] Unhandled event type: ${event.type}`)
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('[Stripe-Webhook] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    )
  }
})
