/**
 * CollaborationPanel - Multi-user collaboration controls for conversations
 * Shows participant list with invite controls for admins
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import {
  loadParticipants,
  loadUserRole,
  removeParticipant,
  updateParticipantRole,
} from '../store/actions/conversationActions';
import { ParticipantList } from './ParticipantList';
import { InviteModal } from './InviteModal';
import { JoinConversation } from './JoinConversation';
import { TypingIndicator } from './TypingIndicator';
import { supabase } from '../lib/supabase';
import type { Participant } from '../services/participantService';

interface CollaborationPanelProps {
  conversationId: string | null;
  onJoinedConversation?: (conversationId: string) => void;
}

export function CollaborationPanel({
  conversationId,
  onJoinedConversation,
}: CollaborationPanelProps) {
  const dispatch = useDispatch();
  const { participants, typingUsers, userRole } = useSelector(
    (state: RootState) => state.conversations
  );
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const slideAnim = React.useRef(new Animated.Value(0)).current;

  // Get current user ID
  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getUserId();
  }, []);

  // Load participants when conversation changes
  useEffect(() => {
    if (conversationId) {
      setIsLoading(true);
      Promise.all([
        dispatch(loadParticipants(conversationId) as any),
        dispatch(loadUserRole(conversationId) as any),
      ]).finally(() => setIsLoading(false));
    }
  }, [conversationId, dispatch]);

  // Animate panel expansion
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isExpanded ? 1 : 0,
      useNativeDriver: false,
      tension: 50,
      friction: 8,
    }).start();
  }, [isExpanded, slideAnim]);

  const currentParticipants: Participant[] = conversationId
    ? participants[conversationId] || []
    : [];

  const currentTypingUsers = conversationId ? typingUsers[conversationId] || [] : [];

  // Get typing user details for display
  const typingUserDetails = currentTypingUsers
    .filter((userId) => userId !== currentUserId)
    .map((userId) => {
      const participant = currentParticipants.find((p) => p.user_id === userId);
      return {
        userId,
        email: participant?.email,
        name: participant?.display_name,
      };
    });

  const handleRemoveParticipant = async (userId: string) => {
    if (!conversationId) return;
    await dispatch(removeParticipant(conversationId, userId) as any);
  };

  const handleChangeRole = async (userId: string, role: 'editor' | 'viewer') => {
    if (!conversationId) return;
    await dispatch(updateParticipantRole(conversationId, userId, role) as any);
  };

  const handleInvite = () => {
    setShowInviteModal(true);
  };

  const handleJoined = (joinedConversationId: string) => {
    setShowJoinModal(false);
    onJoinedConversation?.(joinedConversationId);
  };

  const participantCount = currentParticipants.length;
  const isAdmin = userRole === 'admin';
  const isShared = participantCount > 1;

  // Calculate panel height
  const panelHeight = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 280],
  });

  if (!conversationId) return null;

  return (
    <View style={styles.container}>
      {/* Typing Indicator */}
      {typingUserDetails.length > 0 && (
        <TypingIndicator typingUsers={typingUserDetails} />
      )}

      {/* Collaboration Toggle Button */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleButton, isExpanded && styles.toggleButtonActive]}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <Ionicons
            name="people"
            size={16}
            color={isExpanded ? '#fff' : '#a855f7'}
          />
          <Text style={[styles.toggleText, isExpanded && styles.toggleTextActive]}>
            {participantCount} Participant{participantCount !== 1 ? 's' : ''}
          </Text>
          {isShared && (
            <View style={styles.sharedBadge}>
              <Ionicons name="link" size={10} color="#a855f7" />
            </View>
          )}
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={isExpanded ? '#fff' : '#9ca3af'}
          />
        </TouchableOpacity>

        {/* Quick actions */}
        {isAdmin && (
          <TouchableOpacity
            style={styles.quickInviteButton}
            onPress={handleInvite}
          >
            <Ionicons name="person-add" size={16} color="#a855f7" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.joinButton}
          onPress={() => setShowJoinModal(true)}
        >
          <Ionicons name="enter" size={16} color="#10b981" />
        </TouchableOpacity>
      </View>

      {/* Expandable Panel */}
      <Animated.View style={[styles.panel, { height: panelHeight }]}>
        <View style={styles.panelContent}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#a855f7" />
            </View>
          ) : (
            <ParticipantList
              participants={currentParticipants}
              currentUserId={currentUserId || ''}
              userRole={userRole}
              typingUsers={currentTypingUsers}
              onRemoveParticipant={handleRemoveParticipant}
              onChangeRole={handleChangeRole}
              onInvite={handleInvite}
            />
          )}
        </View>
      </Animated.View>

      {/* Modals */}
      <InviteModal
        visible={showInviteModal}
        conversationId={conversationId}
        onClose={() => setShowInviteModal(false)}
      />

      <JoinConversation
        visible={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onJoined={handleJoined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
  },
  toggleButtonActive: {
    backgroundColor: '#a855f7',
  },
  toggleText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#a855f7',
  },
  toggleTextActive: {
    color: '#fff',
  },
  sharedBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    padding: 4,
    borderRadius: 10,
  },
  quickInviteButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
  },
  joinButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  panel: {
    overflow: 'hidden',
  },
  panelContent: {
    flex: 1,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CollaborationPanel;
