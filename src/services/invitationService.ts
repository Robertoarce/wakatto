/**
 * Invitation Service
 * 
 * Handles user invitations/referrals for Wakatto
 * - Create and send invitations
 * - Track invitation status
 * - Support for future rewards system
 */

import { supabase } from '../lib/supabase';
import { sendInvitationEmail } from './emailService';

export interface Invitation {
  id: string;
  inviter_id: string;
  invitee_email: string;
  invite_code: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  accepted_by: string | null;
  rewarded: boolean;
  reward_amount: number;
  rewarded_at: string | null;
  metadata: Record<string, any>;
}

export interface InvitationStats {
  total_sent: number;
  pending_count: number;
  accepted_count: number;
  total_rewards: number;
}

/**
 * Generate a unique 8-character invite code
 */
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Create a new invitation
 */
export async function createInvitation(inviteeEmail: string): Promise<{ invitation: Invitation; inviteUrl: string }> {
  // Validate email format
  const normalizedEmail = inviteeEmail.trim().toLowerCase();
  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    throw new Error('Please enter a valid email address');
  }

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to send invitations');
  }

  // Prevent self-invitation
  if (normalizedEmail === user.email?.toLowerCase()) {
    throw new Error("You can't invite yourself!");
  }

  // Check if user has already invited this email
  const { data: existing } = await supabase
    .from('invitations')
    .select('id, status')
    .eq('inviter_id', user.id)
    .eq('invitee_email', normalizedEmail)
    .eq('status', 'pending')
    .single();

  if (existing) {
    throw new Error('You have already sent an invitation to this email address');
  }

  // Generate unique invite code
  let inviteCode = generateInviteCode();
  let attempts = 0;
  const maxAttempts = 5;

  // Ensure code is unique
  while (attempts < maxAttempts) {
    const { data: codeExists } = await supabase
      .from('invitations')
      .select('id')
      .eq('invite_code', inviteCode)
      .single();

    if (!codeExists) break;
    
    inviteCode = generateInviteCode();
    attempts++;
  }

  // Create invitation record
  const { data: invitation, error } = await supabase
    .from('invitations')
    .insert({
      inviter_id: user.id,
      invitee_email: normalizedEmail,
      invite_code: inviteCode,
      status: 'pending',
      metadata: {
        inviter_email: user.email,
      },
    })
    .select()
    .single();

  if (error) {
    console.error('[Invitation] Error creating invitation:', error);
    throw new Error('Failed to create invitation. Please try again.');
  }

  const inviteUrl = `https://www.wakatto.com/invite/${inviteCode}`;

  // Send invitation email (fire and forget - don't block on email delivery)
  sendInvitationEmail(normalizedEmail, {
    inviterEmail: user.email || undefined,
    inviteCode,
    inviteUrl,
  }).then((result) => {
    if (result.success) {
      console.log('[Invitation] Email sent successfully to:', normalizedEmail);
    } else {
      console.warn('[Invitation] Failed to send email:', result.error);
    }
  }).catch((err) => {
    console.error('[Invitation] Email error:', err);
  });

  return {
    invitation: invitation as Invitation,
    inviteUrl,
  };
}

/**
 * Get all invitations sent by the current user
 */
export async function getMyInvitations(): Promise<Invitation[]> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to view invitations');
  }

  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('inviter_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Invitation] Error fetching invitations:', error);
    throw new Error('Failed to load invitations');
  }

  return data as Invitation[];
}

/**
 * Get invitation statistics for the current user
 */
export async function getInvitationStats(): Promise<InvitationStats> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return {
      total_sent: 0,
      pending_count: 0,
      accepted_count: 0,
      total_rewards: 0,
    };
  }

  const { data, error } = await supabase
    .rpc('get_invitation_stats', { user_id: user.id });

  if (error) {
    console.error('[Invitation] Error fetching stats:', error);
    return {
      total_sent: 0,
      pending_count: 0,
      accepted_count: 0,
      total_rewards: 0,
    };
  }

  return data[0] || {
    total_sent: 0,
    pending_count: 0,
    accepted_count: 0,
    total_rewards: 0,
  };
}

/**
 * Get invitation by code (for accepting)
 */
export async function getInvitationByCode(code: string): Promise<Invitation | null> {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('invite_code', code.toUpperCase())
    .single();

  if (error || !data) {
    return null;
  }

  return data as Invitation;
}

/**
 * Accept an invitation (called after user signs up)
 */
export async function acceptInvitation(code: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('[Invitation] No user to accept invitation');
    return false;
  }

  const { error } = await supabase
    .from('invitations')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      accepted_by: user.id,
    })
    .eq('invite_code', code.toUpperCase())
    .eq('status', 'pending');

  if (error) {
    console.error('[Invitation] Error accepting invitation:', error);
    return false;
  }

  return true;
}

/**
 * Cancel a pending invitation
 */
export async function cancelInvitation(invitationId: string): Promise<boolean> {
  console.log('[Invitation] Cancelling invitation:', invitationId);
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('[Invitation] No user logged in');
    throw new Error('You must be logged in to cancel invitations');
  }

  console.log('[Invitation] User ID:', user.id);

  const { data, error } = await supabase
    .from('invitations')
    .update({ status: 'cancelled' })
    .eq('id', invitationId)
    .eq('inviter_id', user.id)
    .eq('status', 'pending')
    .select();

  if (error) {
    console.error('[Invitation] Error cancelling invitation:', error);
    return false;
  }

  console.log('[Invitation] Cancel result:', data);
  
  if (!data || data.length === 0) {
    console.warn('[Invitation] No rows updated - invitation may not exist or already cancelled');
    return false;
  }

  console.log('[Invitation] Successfully cancelled invitation');
  return true;
}

/**
 * Resend an invitation (creates a new code)
 */
export async function resendInvitation(invitationId: string): Promise<{ invitation: Invitation; inviteUrl: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to resend invitations');
  }

  // Get existing invitation
  const { data: existing, error: fetchError } = await supabase
    .from('invitations')
    .select('*')
    .eq('id', invitationId)
    .eq('inviter_id', user.id)
    .single();

  if (fetchError || !existing) {
    throw new Error('Invitation not found');
  }

  // Cancel the old one
  await cancelInvitation(invitationId);

  // Create a new one
  return createInvitation(existing.invitee_email);
}

/**
 * Copy invite link to clipboard
 */
export async function copyInviteLink(inviteCode: string): Promise<boolean> {
  const inviteUrl = `https://www.wakatto.com/invite/${inviteCode}`;
  
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(inviteUrl);
      return true;
    }
    return false;
  } catch (error) {
    console.error('[Invitation] Error copying to clipboard:', error);
    return false;
  }
}

