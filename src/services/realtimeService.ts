/**
 * RealtimeService - Manages Supabase Realtime subscriptions for multi-user conversations
 *
 * Features:
 * - Live message updates when other users send messages
 * - Typing indicators
 * - Presence tracking (who's online)
 * - Participant changes (join/leave)
 */

import { supabase } from '../lib/supabase';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Types
export interface RealtimeMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  character_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface PresenceState {
  user_id: string;
  is_typing: boolean;
  last_seen_at: string;
}

export interface ParticipantChange {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'admin' | 'participant' | 'viewer';
  joined_at: string;
}

export interface RealtimeCallbacks {
  onMessage?: (message: RealtimeMessage) => void;
  onMessageUpdate?: (message: RealtimeMessage) => void;
  onMessageDelete?: (messageId: string) => void;
  onTypingChange?: (userId: string, isTyping: boolean) => void;
  onPresenceSync?: (presenceStates: PresenceState[]) => void;
  onParticipantJoin?: (participant: ParticipantChange) => void;
  onParticipantLeave?: (userId: string) => void;
  onError?: (error: Error) => void;
}

class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private currentUserId: string | null = null;

  /**
   * Set the current user ID for filtering own events
   */
  setCurrentUser(userId: string | null) {
    this.currentUserId = userId;
  }

  /**
   * Subscribe to all real-time updates for a conversation
   */
  subscribeToConversation(conversationId: string, callbacks: RealtimeCallbacks): RealtimeChannel {
    const channelKey = `conversation:${conversationId}`;

    // Unsubscribe existing channel if any
    this.unsubscribe(conversationId);

    const channel = supabase
      .channel(channelKey, {
        config: {
          broadcast: { self: false }, // Don't receive own broadcasts
        },
      })
      // ============================
      // MESSAGE CHANGES
      // ============================
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: RealtimePostgresChangesPayload<RealtimeMessage>) => {
          if (payload.new && callbacks.onMessage) {
            // Map character_id to characterId for TypeScript compatibility
            const message = {
              ...payload.new,
              characterId: (payload.new as any).character_id,
            };
            callbacks.onMessage(message as RealtimeMessage);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: RealtimePostgresChangesPayload<RealtimeMessage>) => {
          if (payload.new && callbacks.onMessageUpdate) {
            callbacks.onMessageUpdate(payload.new as RealtimeMessage);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: RealtimePostgresChangesPayload<RealtimeMessage>) => {
          if (payload.old && callbacks.onMessageDelete) {
            callbacks.onMessageDelete((payload.old as any).id);
          }
        }
      )
      // ============================
      // PRESENCE/TYPING CHANGES
      // ============================
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_presence',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: RealtimePostgresChangesPayload<PresenceState>) => {
          if (payload.new && callbacks.onTypingChange) {
            const state = payload.new as PresenceState;
            // Don't notify about own typing
            if (state.user_id !== this.currentUserId) {
              callbacks.onTypingChange(state.user_id, state.is_typing);
            }
          }
        }
      )
      // ============================
      // PARTICIPANT CHANGES
      // ============================
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_participants',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: RealtimePostgresChangesPayload<ParticipantChange>) => {
          if (payload.new && callbacks.onParticipantJoin) {
            callbacks.onParticipantJoin(payload.new as ParticipantChange);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'conversation_participants',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: RealtimePostgresChangesPayload<ParticipantChange>) => {
          if (payload.old && callbacks.onParticipantLeave) {
            callbacks.onParticipantLeave((payload.old as any).user_id);
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] Subscribed to conversation: ${conversationId}`);
        } else if (status === 'CHANNEL_ERROR' && callbacks.onError) {
          callbacks.onError(err || new Error('Channel subscription failed'));
        }
      });

    this.channels.set(channelKey, channel);
    return channel;
  }

  /**
   * Unsubscribe from a conversation's real-time updates
   */
  unsubscribe(conversationId: string) {
    const channelKey = `conversation:${conversationId}`;
    const channel = this.channels.get(channelKey);

    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelKey);
      console.log(`[Realtime] Unsubscribed from conversation: ${conversationId}`);
    }

    // Clear any typing timeout for this conversation
    const typingKey = `${conversationId}:${this.currentUserId}`;
    const timeout = this.typingTimeouts.get(typingKey);
    if (timeout) {
      clearTimeout(timeout);
      this.typingTimeouts.delete(typingKey);
    }
  }

  /**
   * Unsubscribe from all conversations
   */
  unsubscribeAll() {
    this.channels.forEach((channel, key) => {
      supabase.removeChannel(channel);
      console.log(`[Realtime] Unsubscribed from: ${key}`);
    });
    this.channels.clear();

    // Clear all typing timeouts
    this.typingTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.typingTimeouts.clear();
  }

  /**
   * Set typing status for current user in a conversation
   * Automatically clears typing after 3 seconds of no updates
   */
  async setTyping(conversationId: string, isTyping: boolean): Promise<void> {
    if (!this.currentUserId) {
      console.warn('[Realtime] Cannot set typing: no current user');
      return;
    }

    const typingKey = `${conversationId}:${this.currentUserId}`;

    // Clear existing timeout
    const existingTimeout = this.typingTimeouts.get(typingKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.typingTimeouts.delete(typingKey);
    }

    try {
      await supabase.from('conversation_presence').upsert(
        {
          conversation_id: conversationId,
          user_id: this.currentUserId,
          is_typing: isTyping,
          last_seen_at: new Date().toISOString(),
        },
        {
          onConflict: 'conversation_id,user_id',
        }
      );

      // Auto-clear typing after 3 seconds
      if (isTyping) {
        const timeout = setTimeout(() => {
          this.setTyping(conversationId, false);
        }, 3000);
        this.typingTimeouts.set(typingKey, timeout);
      }
    } catch (error) {
      console.error('[Realtime] Error setting typing status:', error);
    }
  }

  /**
   * Update presence (last seen) for current user
   */
  async updatePresence(conversationId: string): Promise<void> {
    if (!this.currentUserId) return;

    try {
      await supabase.from('conversation_presence').upsert(
        {
          conversation_id: conversationId,
          user_id: this.currentUserId,
          last_seen_at: new Date().toISOString(),
        },
        {
          onConflict: 'conversation_id,user_id',
        }
      );
    } catch (error) {
      console.error('[Realtime] Error updating presence:', error);
    }
  }

  /**
   * Get current presence states for a conversation
   */
  async getPresence(conversationId: string): Promise<PresenceState[]> {
    try {
      const { data, error } = await supabase
        .from('conversation_presence')
        .select('*')
        .eq('conversation_id', conversationId)
        .gte('last_seen_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Active in last 5 minutes

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[Realtime] Error getting presence:', error);
      return [];
    }
  }

  /**
   * Leave a conversation (clear presence)
   */
  async leavePresence(conversationId: string): Promise<void> {
    if (!this.currentUserId) return;

    try {
      await supabase
        .from('conversation_presence')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', this.currentUserId);
    } catch (error) {
      console.error('[Realtime] Error leaving presence:', error);
    }
  }

  /**
   * Check if currently subscribed to a conversation
   */
  isSubscribed(conversationId: string): boolean {
    return this.channels.has(`conversation:${conversationId}`);
  }

  /**
   * Get count of active subscriptions
   */
  getSubscriptionCount(): number {
    return this.channels.size;
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();
export default realtimeService;
