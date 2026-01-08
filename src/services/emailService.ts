import { supabase } from '../lib/supabase';

export type EmailType = 'welcome' | 'password_reset' | 'notification' | 'invitation' | 'custom';

interface SendEmailOptions {
  to: string;
  type?: EmailType;
  subject?: string;
  html?: string;
  text?: string;
  data?: Record<string, string>;
}

interface EmailResponse {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Send a transactional email via the send-email edge function
 */
export async function sendEmail(options: SendEmailOptions): Promise<EmailResponse> {
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: options,
  });

  if (error) {
    console.error('[emailService] Error sending email:', error);
    return { success: false, error: error.message };
  }

  return data as EmailResponse;
}

/**
 * Send a welcome email to a new user
 */
export async function sendWelcomeEmail(to: string, name?: string): Promise<EmailResponse> {
  return sendEmail({
    to,
    type: 'welcome',
    data: { name: name || '' },
  });
}

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<EmailResponse> {
  return sendEmail({
    to,
    type: 'password_reset',
    data: { resetLink },
  });
}

/**
 * Send a notification email
 */
export async function sendNotificationEmail(
  to: string,
  options: {
    title: string;
    message: string;
    actionUrl?: string;
    actionText?: string;
  }
): Promise<EmailResponse> {
  return sendEmail({
    to,
    type: 'notification',
    data: {
      title: options.title,
      message: options.message,
      actionUrl: options.actionUrl || '',
      actionText: options.actionText || '',
    },
  });
}

/**
 * Send an invitation email
 */
export async function sendInvitationEmail(
  to: string,
  options: {
    inviterName?: string;
    inviterEmail?: string;
    inviteCode: string;
    inviteUrl: string;
  }
): Promise<EmailResponse> {
  const html = generateInvitationEmailHtml(options);
  
  return sendEmail({
    to,
    type: 'invitation',
    subject: "You're invited to join Wakatto! 🎁",
    html,
    data: {
      inviterName: options.inviterName || '',
      inviterEmail: options.inviterEmail || '',
      inviteCode: options.inviteCode,
      inviteUrl: options.inviteUrl,
    },
  });
}

/**
 * Generate invitation email HTML
 */
function generateInvitationEmailHtml(options: {
  inviterName?: string;
  inviterEmail?: string;
  inviteCode: string;
  inviteUrl: string;
}): string {
  const { inviterName, inviterEmail, inviteCode, inviteUrl } = options;
  const inviterDisplay = inviterName || inviterEmail || 'A friend';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to Wakatto!</title>
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
                    <div style="width: 80px; height: 80px; background-color: #ffedd5; border-radius: 50%; display: inline-block; text-align: center; line-height: 80px;">
                      <span style="font-size: 40px;">🎁</span>
                    </div>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 16px;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1f2937;">
                      You're Invited! 🎉
                    </h1>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #4b5563;">
                      <strong>${inviterDisplay}</strong> has invited you to join <strong>Wakatto</strong> — where AI companions listen, understand, and help you reflect on your thoughts.
                    </p>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding-bottom: 24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fefce8; border-radius: 12px; padding: 20px;">
                      <tr>
                        <td>
                          <p style="margin: 0 0 12px 0; font-size: 14px; color: #4b5563;">
                            ✨ <strong>Chat with AI Companions</strong> — Unique characters that truly listen
                          </p>
                          <p style="margin: 0 0 12px 0; font-size: 14px; color: #4b5563;">
                            📔 <strong>Personal Journaling</strong> — Reflect and grow with AI guidance
                          </p>
                          <p style="margin: 0; font-size: 14px; color: #4b5563;">
                            🎭 <strong>Multiple Wakattors</strong> — From philosophers to scientists
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <a href="${inviteUrl}" style="display: inline-block; background-color: #ea580c; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 16px; background-color: #f3f4f6; border-radius: 8px; text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">
                      Your Invite Code
                    </p>
                    <p style="margin: 0; font-size: 24px; font-weight: 700; color: #1f2937; letter-spacing: 3px;">
                      ${inviteCode}
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
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">
                      Questions? <a href="https://www.wakatto.com/support" style="color: #ea580c; text-decoration: none;">Contact Support</a>
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                      This invitation expires in 30 days.
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
              <p style="margin: 0; font-size: 14px; font-weight: 600; color: #9ca3af;">
                Wakatto
              </p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #9ca3af;">
                Your AI companions await
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Send a custom email with your own subject and HTML
 */
export async function sendCustomEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<EmailResponse> {
  return sendEmail({
    to,
    type: 'custom',
    subject,
    html,
    text,
  });
}

/**
 * Send a conversation invite email (for sharing a specific conversation)
 * Uses /join/:code links, NOT /invite/:code links
 */
export async function sendConversationInviteEmail(
  to: string,
  options: {
    inviteCode: string;
    joinUrl: string;
    conversationTitle?: string;
    inviterName?: string;
    inviterEmail?: string;
  }
): Promise<EmailResponse> {
  const html = generateConversationInviteEmailHtml(options);
  
  return sendEmail({
    to,
    type: 'custom',
    subject: `You're invited to join a conversation on Wakatto! 💬`,
    html,
    data: {
      inviteCode: options.inviteCode,
      joinUrl: options.joinUrl,
      conversationTitle: options.conversationTitle || '',
    },
  });
}

/**
 * Generate conversation invite email HTML
 */
function generateConversationInviteEmailHtml(options: {
  inviteCode: string;
  joinUrl: string;
  conversationTitle?: string;
  inviterName?: string;
  inviterEmail?: string;
}): string {
  const { inviteCode, joinUrl, conversationTitle, inviterName, inviterEmail } = options;
  const inviterDisplay = inviterName || inviterEmail || 'Someone';
  const title = conversationTitle || 'a conversation';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Join a Conversation on Wakatto</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); min-height: 100vh;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 440px; background-color: #1f1f3a; border-radius: 16px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3); border: 1px solid rgba(168, 85, 247, 0.2);">
          <tr>
            <td style="padding: 40px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #a855f7, #6366f1); border-radius: 50%; display: inline-block; text-align: center; line-height: 80px;">
                      <span style="font-size: 40px;">💬</span>
                    </div>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 16px;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #ffffff;">
                      Join the Conversation!
                    </h1>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #d1d5db;">
                      <strong style="color: #a855f7;">${inviterDisplay}</strong> has invited you to join <strong style="color: #ffffff;">"${title}"</strong> on Wakatto.
                    </p>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding-bottom: 24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: rgba(168, 85, 247, 0.1); border-radius: 12px; padding: 20px; border: 1px solid rgba(168, 85, 247, 0.2);">
                      <tr>
                        <td>
                          <p style="margin: 0 0 12px 0; font-size: 14px; color: #d1d5db;">
                            🗣️ <strong>Real-time collaboration</strong> — Chat together with AI companions
                          </p>
                          <p style="margin: 0 0 12px 0; font-size: 14px; color: #d1d5db;">
                            👥 <strong>Shared experience</strong> — See messages and responses in real-time
                          </p>
                          <p style="margin: 0; font-size: 14px; color: #d1d5db;">
                            🎭 <strong>Multiple Wakattors</strong> — Interact with unique AI personalities
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <a href="${joinUrl}" style="display: inline-block; background: linear-gradient(135deg, #a855f7, #6366f1); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                      Join Conversation
                    </a>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 16px; background-color: rgba(255, 255, 255, 0.05); border-radius: 8px; text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px;">
                      Your Join Code
                    </p>
                    <p style="margin: 0; font-size: 24px; font-weight: 700; color: #a855f7; letter-spacing: 3px;">
                      ${inviteCode}
                    </p>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 24px 0;">
                    <hr style="border: none; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 0;" />
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: #9ca3af;">
                      Don't have an account? <a href="https://www.wakatto.com" style="color: #a855f7; text-decoration: none;">Sign up free</a>
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #6b7280;">
                      Questions? <a href="https://www.wakatto.com/support" style="color: #a855f7; text-decoration: none;">Contact Support</a>
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
              <p style="margin: 0; font-size: 14px; font-weight: 600; color: #6b7280;">
                Wakatto
              </p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #4b5563;">
                AI companions that listen and understand
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
