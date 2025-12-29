/**
 * ParticipantService - Manages conversation participants, invites, and user search
 *
 * Features:
 * - Get/add/remove participants
 * - Create and manage invite links
 * - Join conversations via invite code
 * - Search users by email
 */

import { supabase } from '../lib/supabase';

// Types
export type ParticipantRole = 'owner' | 'editor' | 'viewer';

export interface Participant {
  id: string;
  conversation_id: string;
  user_id: string;
  role: ParticipantRole;
  invited_by: string | null;
  joined_at: string;
  // Joined from user_profiles
  email?: string;
  display_name?: string;
}

export interface ConversationInvite {
  id: string;
  conversation_id: string;
  code: string;
  role: 'editor' | 'viewer';
  created_by: string;
  expires_at: string | null;
  max_uses: number | null;
  use_count: number;
  created_at: string;
}

export interface JoinResult {
  success: boolean;
  error?: string;
  conversation_id?: string;
  role?: ParticipantRole;
}

export interface UserSearchResult {
  id: string;
  email: string;
  display_name?: string;
}

// ============================
// PARTICIPANT MANAGEMENT
// ============================

/**
 * Get all participants for a conversation
 */
export async function getParticipants(conversationId: string): Promise<Participant[]> {
  try {
    // First get the conversation owner
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('user_id')
      .eq('id', conversationId)
      .single();

    if (convError) throw convError;

    // Get participants from the participants table
    const { data: participants, error: partError } = await supabase
      .from('conversation_participants')
      .select(`
        id,
        conversation_id,
        user_id,
        role,
        invited_by,
        joined_at
      `)
      .eq('conversation_id', conversationId);

    if (partError) throw partError;

    // Get user profiles for all users
    const userIds = [
      conversation.user_id,
      ...(participants || []).map((p) => p.user_id),
    ];

    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email')
      .in('id', userIds);

    if (profileError) {
      console.warn('[ParticipantService] Could not fetch profiles:', profileError);
    }

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    // Build result with owner first
    const result: Participant[] = [];

    // Add owner as first participant
    const ownerProfile = profileMap.get(conversation.user_id);
    result.push({
      id: 'owner',
      conversation_id: conversationId,
      user_id: conversation.user_id,
      role: 'owner',
      invited_by: null,
      joined_at: '', // Owner doesn't have a join date in participants table
      email: ownerProfile?.email,
    });

    // Add other participants
    for (const participant of participants || []) {
      const profile = profileMap.get(participant.user_id);
      result.push({
        ...participant,
        email: profile?.email,
      });
    }

    return result;
  } catch (error) {
    console.error('[ParticipantService] Error getting participants:', error);
    throw error;
  }
}

/**
 * Add a participant to a conversation (owner only)
 */
export async function addParticipant(
  conversationId: string,
  userId: string,
  role: 'editor' | 'viewer' = 'viewer'
): Promise<Participant> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('conversation_participants')
      .insert({
        conversation_id: conversationId,
        user_id: userId,
        role,
        invited_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Update conversation visibility to shared
    await supabase
      .from('conversations')
      .update({ visibility: 'shared' })
      .eq('id', conversationId);

    return data;
  } catch (error) {
    console.error('[ParticipantService] Error adding participant:', error);
    throw error;
  }
}

/**
 * Remove a participant from a conversation (owner can remove anyone, users can remove themselves)
 */
export async function removeParticipant(
  conversationId: string,
  userId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('conversation_participants')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    if (error) throw error;

    // Check if any participants remain
    const { count } = await supabase
      .from('conversation_participants')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId);

    // If no participants remain, set visibility back to private
    if (count === 0) {
      await supabase
        .from('conversations')
        .update({ visibility: 'private' })
        .eq('id', conversationId);
    }
  } catch (error) {
    console.error('[ParticipantService] Error removing participant:', error);
    throw error;
  }
}

/**
 * Update a participant's role (owner only)
 */
export async function updateParticipantRole(
  conversationId: string,
  userId: string,
  role: 'editor' | 'viewer'
): Promise<void> {
  try {
    const { error } = await supabase
      .from('conversation_participants')
      .update({ role })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('[ParticipantService] Error updating participant role:', error);
    throw error;
  }
}

/**
 * Leave a conversation (remove self)
 */
export async function leaveConversation(conversationId: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    await removeParticipant(conversationId, user.id);
  } catch (error) {
    console.error('[ParticipantService] Error leaving conversation:', error);
    throw error;
  }
}

// ============================
// INVITE MANAGEMENT
// ============================

/**
 * Generate a random invite code
 */
function generateInviteCode(length: number = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Create an invite link for a conversation (owner only)
 */
export async function createInvite(
  conversationId: string,
  options: {
    role?: 'editor' | 'viewer';
    expiresInHours?: number;
    maxUses?: number;
  } = {}
): Promise<ConversationInvite> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { role = 'viewer', expiresInHours, maxUses } = options;

    // Generate unique code
    let code: string;
    let attempts = 0;
    do {
      code = generateInviteCode();
      const { data: existing } = await supabase
        .from('conversation_invites')
        .select('id')
        .eq('code', code)
        .single();

      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      throw new Error('Could not generate unique invite code');
    }

    const expiresAt = expiresInHours
      ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString()
      : null;

    const { data, error } = await supabase
      .from('conversation_invites')
      .insert({
        conversation_id: conversationId,
        code,
        role,
        created_by: user.id,
        expires_at: expiresAt,
        max_uses: maxUses || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[ParticipantService] Error creating invite:', error);
    throw error;
  }
}

/**
 * Get all invites for a conversation (owner only)
 */
export async function getInvites(conversationId: string): Promise<ConversationInvite[]> {
  try {
    const { data, error } = await supabase
      .from('conversation_invites')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[ParticipantService] Error getting invites:', error);
    throw error;
  }
}

/**
 * Delete an invite (owner only)
 */
export async function deleteInvite(inviteId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('conversation_invites')
      .delete()
      .eq('id', inviteId);

    if (error) throw error;
  } catch (error) {
    console.error('[ParticipantService] Error deleting invite:', error);
    throw error;
  }
}

/**
 * Get invite details by code (for preview before joining)
 */
export async function getInviteByCode(code: string): Promise<{
  invite: ConversationInvite;
  conversationTitle: string;
  participantCount: number;
} | null> {
  try {
    const { data: invite, error } = await supabase
      .from('conversation_invites')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error || !invite) return null;

    // Get conversation title
    const { data: conversation } = await supabase
      .from('conversations')
      .select('title')
      .eq('id', invite.conversation_id)
      .single();

    // Get participant count
    const { count } = await supabase
      .from('conversation_participants')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', invite.conversation_id);

    return {
      invite,
      conversationTitle: conversation?.title || 'Untitled',
      participantCount: (count || 0) + 1, // +1 for owner
    };
  } catch (error) {
    console.error('[ParticipantService] Error getting invite by code:', error);
    return null;
  }
}

/**
 * Join a conversation via invite code
 */
export async function joinViaInvite(code: string): Promise<JoinResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Call the database function
    const { data, error } = await supabase.rpc('join_conversation_via_invite', {
      invite_code: code.toUpperCase(),
    });

    if (error) {
      console.error('[ParticipantService] RPC error:', error);
      return { success: false, error: error.message };
    }

    return data as JoinResult;
  } catch (error: any) {
    console.error('[ParticipantService] Error joining via invite:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

// ============================
// USER SEARCH
// ============================

/**
 * Search users by email (for inviting)
 */
export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  try {
    if (!query || query.length < 3) return [];

    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, email')
      .ilike('email', `%${query}%`)
      .limit(10);

    if (error) throw error;

    // Filter out current user
    const { data: { user } } = await supabase.auth.getUser();
    const filteredData = (data || []).filter((u) => u.id !== user?.id);

    return filteredData.map((u) => ({
      id: u.id,
      email: u.email,
    }));
  } catch (error) {
    console.error('[ParticipantService] Error searching users:', error);
    return [];
  }
}

/**
 * Check if current user is the owner of a conversation
 */
export async function isConversationOwner(conversationId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('conversations')
      .select('user_id')
      .eq('id', conversationId)
      .single();

    if (error) return false;
    return data.user_id === user.id;
  } catch (error) {
    console.error('[ParticipantService] Error checking ownership:', error);
    return false;
  }
}

/**
 * Get current user's role in a conversation
 */
export async function getUserRole(conversationId: string): Promise<ParticipantRole | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Check if owner
    const { data: conversation } = await supabase
      .from('conversations')
      .select('user_id')
      .eq('id', conversationId)
      .single();

    if (conversation?.user_id === user.id) {
      return 'owner';
    }

    // Check participants table
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('role')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .single();

    return participant?.role as ParticipantRole || null;
  } catch (error) {
    console.error('[ParticipantService] Error getting user role:', error);
    return null;
  }
}

// Export all functions
export default {
  getParticipants,
  addParticipant,
  removeParticipant,
  updateParticipantRole,
  leaveConversation,
  createInvite,
  getInvites,
  deleteInvite,
  getInviteByCode,
  joinViaInvite,
  searchUsers,
  isConversationOwner,
  getUserRole,
};
