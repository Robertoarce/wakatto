/**
 * ParticipantList - Shows all participants in a conversation
 * Displays roles, online status, and management controls for admins
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Participant } from '../services/participantService';

interface ParticipantListProps {
  participants: Participant[];
  currentUserId: string;
  userRole: 'admin' | 'participant' | 'viewer' | null;
  typingUsers?: string[];
  onRemoveParticipant?: (userId: string) => Promise<void>;
  onChangeRole?: (userId: string, role: 'participant' | 'viewer') => Promise<void>;
  onInvite?: () => void;
  onClose?: () => void;
  isLoading?: boolean;
}

export function ParticipantList({
  participants,
  currentUserId,
  userRole,
  typingUsers = [],
  onRemoveParticipant,
  onChangeRole,
  onInvite,
  onClose,
  isLoading = false,
}: ParticipantListProps) {
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isAdmin = userRole === 'admin';

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return '#f59e0b'; // Amber
      case 'participant':
        return '#10b981'; // Green
      case 'viewer':
        return '#6b7280'; // Gray
      default:
        return '#6b7280';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return 'shield';
      case 'participant':
        return 'people';
      case 'viewer':
        return 'eye';
      default:
        return 'person';
    }
  };

  const handleRemove = async (userId: string) => {
    if (!onRemoveParticipant) return;
    setActionLoading(userId);
    try {
      await onRemoveParticipant(userId);
    } finally {
      setActionLoading(null);
      setExpandedUserId(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'participant' | 'viewer') => {
    if (!onChangeRole) return;
    setActionLoading(userId);
    try {
      await onChangeRole(userId, newRole);
    } finally {
      setActionLoading(null);
    }
  };

  const getDisplayName = (participant: Participant) => {
    // Prefer display_name if available
    if (participant.display_name) {
      return participant.display_name;
    }
    // Fall back to email username
    if (participant.email) {
      return participant.email.split('@')[0];
    }
    return 'Unknown User';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="people" size={20} color="#a855f7" />
          <Text style={styles.headerTitle}>Participants</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{participants.length}</Text>
          </View>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Invite Button */}
      {isAdmin && onInvite && (
        <TouchableOpacity style={styles.inviteButton} onPress={onInvite}>
          <Ionicons name="person-add" size={18} color="#a855f7" />
          <Text style={styles.inviteButtonText}>Invite People</Text>
        </TouchableOpacity>
      )}

      {/* Participant List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#a855f7" />
        </View>
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {participants.map((participant) => {
            const isCurrentUser = participant.user_id === currentUserId;
            const isTyping = typingUsers.includes(participant.user_id);
            const isExpanded = expandedUserId === participant.user_id;
            const isActionLoading = actionLoading === participant.user_id;

            return (
              <View key={participant.user_id}>
                <TouchableOpacity
                  style={[
                    styles.participantRow,
                    isExpanded && styles.participantRowExpanded,
                  ]}
                  onPress={() => {
                    if (isAdmin && !isCurrentUser && participant.role !== 'admin') {
                      setExpandedUserId(isExpanded ? null : participant.user_id);
                    }
                  }}
                  disabled={!isAdmin || isCurrentUser || participant.role === 'admin'}
                >
                  {/* Avatar */}
                  <View style={[styles.avatar, { borderColor: getRoleColor(participant.role) }]}>
                    <Text style={styles.avatarText}>
                      {getDisplayName(participant)[0].toUpperCase()}
                    </Text>
                    {isTyping && (
                      <View style={styles.typingDot} />
                    )}
                  </View>

                  {/* Info */}
                  <View style={styles.participantInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.participantName}>
                        {getDisplayName(participant)}
                        {isCurrentUser && ' (you)'}
                      </Text>
                      {isTyping && (
                        <Text style={styles.typingText}>typing...</Text>
                      )}
                    </View>
                    <View style={styles.roleRow}>
                      <Ionicons
                        name={getRoleIcon(participant.role) as any}
                        size={12}
                        color={getRoleColor(participant.role)}
                      />
                      <Text style={[styles.roleText, { color: getRoleColor(participant.role) }]}>
                        {participant.role.charAt(0).toUpperCase() + participant.role.slice(1)}
                      </Text>
                    </View>
                  </View>

                  {/* Expand Indicator */}
                  {isAdmin && !isCurrentUser && participant.role !== 'admin' && (
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color="#6b7280"
                    />
                  )}
                </TouchableOpacity>

                {/* Expanded Actions */}
                {isExpanded && (
                  <View style={styles.actionsContainer}>
                    {isActionLoading ? (
                      <ActivityIndicator color="#a855f7" size="small" />
                    ) : (
                      <>
                        {/* Role Change Buttons */}
                        <View style={styles.roleButtons}>
                          <TouchableOpacity
                            style={[
                              styles.roleButton,
                              participant.role === 'participant' && styles.roleButtonActive,
                            ]}
                            onPress={() => handleRoleChange(participant.user_id, 'participant')}
                          >
                            <Ionicons name="people" size={14} color={participant.role === 'participant' ? '#fff' : '#10b981'} />
                            <Text style={[
                              styles.roleButtonText,
                              participant.role === 'participant' && styles.roleButtonTextActive,
                            ]}>Participant</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.roleButton,
                              participant.role === 'viewer' && styles.roleButtonActive,
                            ]}
                            onPress={() => handleRoleChange(participant.user_id, 'viewer')}
                          >
                            <Ionicons name="eye" size={14} color={participant.role === 'viewer' ? '#fff' : '#6b7280'} />
                            <Text style={[
                              styles.roleButtonText,
                              participant.role === 'viewer' && styles.roleButtonTextActive,
                            ]}>Viewer</Text>
                          </TouchableOpacity>
                        </View>

                        {/* Remove Button */}
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => handleRemove(participant.user_id)}
                        >
                          <Ionicons name="person-remove" size={14} color="#ef4444" />
                          <Text style={styles.removeButtonText}>Remove</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
  countBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#a855f7',
  },
  closeButton: {
    padding: 4,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: 12,
    padding: 12,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    borderStyle: 'dashed',
  },
  inviteButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#a855f7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  list: {
    flex: 1,
    padding: 8,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  participantRowExpanded: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
  typingDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#1a1a2e',
  },
  participantInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  participantName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#fff',
  },
  typingText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#10b981',
    fontStyle: 'italic',
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  roleText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  actionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  roleButtonActive: {
    backgroundColor: '#a855f7',
    borderColor: '#a855f7',
  },
  roleButtonText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#9ca3af',
  },
  roleButtonTextActive: {
    color: '#fff',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  removeButtonText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#ef4444',
  },
});

export default ParticipantList;
