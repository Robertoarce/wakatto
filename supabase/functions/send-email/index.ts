import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

// Allowed origins for CORS
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

// Email types for different transactional emails
type EmailType = 'welcome' | 'password_reset' | 'notification' | 'invitation' | 'custom'

interface SendEmailRequest {
  to: string
  subject?: string
  html?: string
  text?: string
  type?: EmailType
  data?: Record<string, string> // Template variables
}

// Email templates - warm orange theme matching Wakatto branding
const templates: Record<EmailType, { subject: string; html: (data: Record<string, string>) => string }> = {
  welcome: {
    subject: 'Welcome to Wakatto!',
    html: (data) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Wakatto!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #fefce8 0%, #ffedd5 100%); min-height: 100vh;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 440px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <div style="width: 80px; height: 80px; background-color: #dcfce7; border-radius: 50%; display: inline-block; text-align: center; line-height: 80px; font-size: 40px;">
                      &#127881;
                    </div>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 16px;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1f2937;">
                      Welcome to Wakatto, ${data.name || 'friend'}!
                    </h1>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #4b5563;">
                      Your account is ready! Meet your Wakattors - unique AI companions with distinct personalities who are here to listen, support, and engage in meaningful conversations with you.
                    </p>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px 16px; background-color: #f9fafb; border-radius: 8px;">
                    <p style="margin: 0; font-size: 14px; color: #4b5563;">
                      <strong style="color: #ea580c;">&#10003;</strong>&nbsp;&nbsp;Chat with multiple AI personalities
                    </p>
                  </td>
                </tr>
                <tr><td style="height: 8px;"></td></tr>
                <tr>
                  <td style="padding: 12px 16px; background-color: #f9fafb; border-radius: 8px;">
                    <p style="margin: 0; font-size: 14px; color: #4b5563;">
                      <strong style="color: #ea580c;">&#10003;</strong>&nbsp;&nbsp;Watch them interact with 3D animations
                    </p>
                  </td>
                </tr>
                <tr><td style="height: 8px;"></td></tr>
                <tr>
                  <td style="padding: 12px 16px; background-color: #f9fafb; border-radius: 8px;">
                    <p style="margin: 0; font-size: 14px; color: #4b5563;">
                      <strong style="color: #ea580c;">&#10003;</strong>&nbsp;&nbsp;Get thoughtful, personalized responses
                    </p>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <a href="https://www.wakatto.com" style="display: inline-block; background-color: #ea580c; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                      Start Chatting
                    </a>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 0 0 24px 0;">
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0;" />
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <p style="margin: 0; font-size: 14px; color: #6b7280;">
                      Questions? <a href="https://www.wakatto.com/support" style="color: #ea580c; text-decoration: none;">We're here to help</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 440px;">
          <tr>
            <td align="center" style="padding: 24px 0;">
              <p style="margin: 0; font-size: 14px; font-weight: 600; color: #9ca3af;">Wakatto</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #9ca3af;">Your AI companions await</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
  password_reset: {
    subject: 'Reset your Wakatto password',
    html: (data) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - Wakatto</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #fefce8 0%, #ffedd5 100%); min-height: 100vh;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 440px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <div style="width: 80px; height: 80px; background-color: #fef3c7; border-radius: 50%; display: inline-block; text-align: center; line-height: 80px; font-size: 40px;">
                      &#128274;
                    </div>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 16px;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1f2937;">Reset Your Password</h1>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #4b5563;">
                      We received a request to reset your password for your <strong>wakatto.com</strong> account. Click the button below to create a new password.
                    </p>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <a href="${data.resetLink}" style="display: inline-block; background-color: #ea580c; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 16px; background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; margin-bottom: 24px;">
                    <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #92400e;">
                      <strong>This link expires in 1 hour.</strong> If you didn't request a password reset, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 16px; background-color: #f9fafb; border-radius: 8px; margin-top: 16px;">
                    <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #4b5563;">
                      <strong>Button not working?</strong> Copy and paste this link:
                    </p>
                    <p style="margin: 8px 0 0 0; font-size: 12px; line-height: 1.5; color: #6b7280; word-break: break-all;">
                      ${data.resetLink}
                    </p>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 24px 0;">
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0;" />
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <p style="margin: 0; font-size: 14px; color: #6b7280;">
                      Need help? <a href="https://www.wakatto.com/support" style="color: #ea580c; text-decoration: none;">Contact Support</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 440px;">
          <tr>
            <td align="center" style="padding: 24px 0;">
              <p style="margin: 0; font-size: 14px; font-weight: 600; color: #9ca3af;">Wakatto</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #9ca3af;">Your AI companions await</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
  notification: {
    subject: 'Wakatto Notification',
    html: (data) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notification - Wakatto</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #fefce8 0%, #ffedd5 100%); min-height: 100vh;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 440px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <div style="width: 80px; height: 80px; background-color: #dbeafe; border-radius: 50%; display: inline-block; text-align: center; line-height: 80px; font-size: 40px;">
                      &#128276;
                    </div>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 16px;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1f2937;">${data.title || 'Notification'}</h1>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #4b5563;">${data.message}</p>
                  </td>
                </tr>
              </table>
              ${data.actionUrl ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <a href="${data.actionUrl}" style="display: inline-block; background-color: #ea580c; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                      ${data.actionText || 'View'}
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 0 0 24px 0;">
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0;" />
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                      You're receiving this because you have notifications enabled.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 440px;">
          <tr>
            <td align="center" style="padding: 24px 0;">
              <p style="margin: 0; font-size: 14px; font-weight: 600; color: #9ca3af;">Wakatto</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #9ca3af;">Your AI companions await</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
  invitation: {
    subject: "You're invited to join Wakatto! 🎁",
    html: (data) => data.html || '', // HTML provided by client
  },
  custom: {
    subject: 'Message from Wakatto',
    html: (data) => data.html || '',
  },
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify API key is configured
    if (!RESEND_API_KEY) {
      console.error('[send-email] RESEND_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get auth header for user verification (optional - for authenticated endpoints)
    const authHeader = req.headers.get('Authorization')

    const { to, subject, html, text, type = 'custom', data = {} }: SendEmailRequest = await req.json()

    // Validate required fields
    if (!to) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: to' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get template or use custom content
    const template = templates[type]
    const emailSubject = subject || template.subject
    // For invitation and custom types, use the HTML provided directly
    const emailHtml = (type === 'custom' || type === 'invitation') 
      ? (html || template.html({ ...data, html })) 
      : template.html(data)

    console.log(`[send-email] Sending ${type} email to ${to}`)

    // Send via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Wakatto <noreply@wakatto.com>',
        to: [to],
        subject: emailSubject,
        html: emailHtml,
        text: text,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('[send-email] Resend API error:', result)
      return new Response(
        JSON.stringify({ error: result.message || 'Failed to send email' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[send-email] Email sent successfully: ${result.id}`)

    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[send-email] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
