/**
 * JoinConversation - Accept invite flow for joining conversations
 * Handles invite code entry and preview before joining
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getInviteByCode,
  joinViaInvite,
  type ConversationInvite,
} from '../services/participantService';

interface JoinConversationProps {
  visible: boolean;
  initialCode?: string;
  onClose: () => void;
  onJoined: (conversationId: string) => void;
}

interface InvitePreview {
  invite: ConversationInvite;
  conversationTitle: string;
  participantCount: number;
}

export function JoinConversation({
  visible,
  initialCode = '',
  onClose,
  onJoined,
}: JoinConversationProps) {
  const [code, setCode] = useState(initialCode);
  const [isLoading, setIsLoading] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (visible) {
      setCode(initialCode);
      setPreview(null);
      setError(null);
      if (initialCode) {
        handleLookup(initialCode);
      }
    }
  }, [visible, initialCode]);

  const handleCodeChange = (text: string) => {
    // Auto-uppercase and limit to alphanumeric
    const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    setCode(cleaned);
    setError(null);
    setPreview(null);
  };

  const handleLookup = async (lookupCode?: string) => {
    const codeToUse = lookupCode || code;
    if (!codeToUse || codeToUse.length < 4) {
      setError('Please enter a valid invite code');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await getInviteByCode(codeToUse);
      if (!result) {
        setError('Invite not found or has expired');
        setPreview(null);
        return;
      }

      // Check if expired
      if (result.invite.expires_at && new Date(result.invite.expires_at) < new Date()) {
        setError('This invite has expired');
        setPreview(null);
        return;
      }

      // Check if max uses reached
      if (result.invite.max_uses && result.invite.use_count >= result.invite.max_uses) {
        setError('This invite has reached its maximum uses');
        setPreview(null);
        return;
      }

      setPreview(result);
    } catch (err) {
      setError('Failed to look up invite');
      console.error('[JoinConversation] Error looking up invite:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!preview) return;

    setIsJoining(true);
    setError(null);
    try {
      const result = await joinViaInvite(code);
      if (result.success && result.conversation_id) {
        onJoined(result.conversation_id);
      } else {
        setError(result.error || 'Failed to join conversation');
      }
    } catch (err) {
      setError('Failed to join conversation');
      console.error('[JoinConversation] Error joining:', err);
    } finally {
      setIsJoining(false);
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'editor':
        return 'You can send messages and participate in the conversation';
      case 'viewer':
        return 'You can read messages but cannot send any';
      default:
        return '';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="enter" size={20} color="#a855f7" />
              <Text style={styles.headerTitle}>Join Conversation</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* Code Input */}
            <Text style={styles.label}>Enter Invite Code</Text>
            <View style={styles.codeInputContainer}>
              <TextInput
                style={styles.codeInput}
                value={code}
                onChangeText={handleCodeChange}
                placeholder="ABC123"
                placeholderTextColor="#4b5563"
                maxLength={8}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[styles.lookupButton, (!code || isLoading) && styles.lookupButtonDisabled]}
                onPress={() => handleLookup()}
                disabled={!code || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="search" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Preview */}
            {preview && (
              <View style={styles.previewContainer}>
                <View style={styles.previewHeader}>
                  <Ionicons name="chatbubbles" size={24} color="#a855f7" />
                  <Text style={styles.previewTitle}>{preview.conversationTitle}</Text>
                </View>

                <View style={styles.previewDetails}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <Ionicons name="people-outline" size={16} color="#9ca3af" />
                      <Text style={styles.detailText}>
                        {preview.participantCount} participant{preview.participantCount !== 1 ? 's' : ''}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.roleBadge,
                        preview.invite.role === 'editor'
                          ? styles.roleBadgeEditor
                          : styles.roleBadgeViewer,
                      ]}
                    >
                      <Ionicons
                        name={preview.invite.role === 'editor' ? 'pencil' : 'eye'}
                        size={12}
                        color={preview.invite.role === 'editor' ? '#10b981' : '#6b7280'}
                      />
                      <Text
                        style={[
                          styles.roleBadgeText,
                          preview.invite.role === 'editor'
                            ? styles.roleBadgeTextEditor
                            : styles.roleBadgeTextViewer,
                        ]}
                      >
                        {preview.invite.role}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.roleDescription}>
                    {getRoleDescription(preview.invite.role)}
                  </Text>
                </View>

                {/* Join Button */}
                <TouchableOpacity
                  style={styles.joinButton}
                  onPress={handleJoin}
                  disabled={isJoining}
                >
                  {isJoining ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text style={styles.joinButtonText}>Join Conversation</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Help Text */}
            {!preview && !error && (
              <View style={styles.helpContainer}>
                <Ionicons name="information-circle-outline" size={18} color="#6b7280" />
                <Text style={styles.helpText}>
                  Enter the invite code you received to preview and join the conversation.
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
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
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#9ca3af',
    marginBottom: 8,
  },
  codeInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  codeInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    letterSpacing: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  lookupButton: {
    width: 56,
    borderRadius: 12,
    backgroundColor: '#a855f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lookupButtonDisabled: {
    backgroundColor: 'rgba(168, 85, 247, 0.3)',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    flex: 1,
  },
  previewContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(168, 85, 247, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  previewTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
  previewDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeEditor: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  roleBadgeViewer: {
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
  },
  roleBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textTransform: 'capitalize',
  },
  roleBadgeTextEditor: {
    color: '#10b981',
  },
  roleBadgeTextViewer: {
    color: '#9ca3af',
  },
  roleDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    fontStyle: 'italic',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    backgroundColor: '#10b981',
    borderRadius: 10,
  },
  joinButtonText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 20,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
  },
  helpText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    lineHeight: 18,
  },
});

export default JoinConversation;
