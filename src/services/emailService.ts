import { supabase } from '../lib/supabase';

export type EmailType = 'welcome' | 'password_reset' | 'notification' | 'custom';

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
