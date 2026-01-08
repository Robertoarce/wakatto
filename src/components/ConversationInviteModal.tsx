/**
 * ConversationInviteModal - Share a conversation with others
 * Creates /join/:code links for conversation-specific sharing
 * 
 * This is different from InviteModal which handles user referrals (/invite/:code)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Platform,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCustomAlert } from './CustomAlert';
import {
  createInvite,
  getInvites,
  deleteInvite,
  type ConversationInvite,
} from '../services/participantService';
import { sendConversationInviteEmail } from '../services/emailService';

interface ConversationInviteModalProps {
  visible: boolean;
  conversationId: string;
  conversationTitle?: string;
  onClose: () => void;
}

export function ConversationInviteModal({
  visible,
  conversationId,
  conversationTitle,
  onClose,
}: ConversationInviteModalProps) {
  const { showAlert, AlertComponent } = useCustomAlert();
  
  const [invites, setInvites] = useState<ConversationInvite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  // New invite options
  const [selectedRole, setSelectedRole] = useState<'participant' | 'viewer'>('participant');
  const [expiresInHours, setExpiresInHours] = useState('');
  const [maxUses, setMaxUses] = useState('');
  
  // Email invite
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  // Load existing invites when modal opens
  useEffect(() => {
    if (visible && conversationId) {
      loadInvites();
    }
  }, [visible, conversationId]);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setShowEmailInput(false);
      setEmailAddress('');
      setGeneratedCode(null);
      setSelectedRole('participant');
      setExpiresInHours('');
      setMaxUses('');
    }
  }, [visible]);

  const loadInvites = async () => {
    setIsLoading(true);
    try {
      const data = await getInvites(conversationId);
      setInvites(data);
    } catch (error) {
      console.error('[ConversationInviteModal] Error loading invites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInvite = async () => {
    setIsCreating(true);
    try {
      const options: {
        role?: 'participant' | 'viewer';
        expiresInHours?: number;
        maxUses?: number;
      } = {
        role: selectedRole,
      };

      if (expiresInHours) {
        const hours = parseInt(expiresInHours, 10);
        if (!isNaN(hours) && hours > 0) {
          options.expiresInHours = hours;
        }
      }

      if (maxUses) {
        const uses = parseInt(maxUses, 10);
        if (!isNaN(uses) && uses > 0) {
          options.maxUses = uses;
        }
      }

      const invite = await createInvite(conversationId, options);
      setGeneratedCode(invite.code);
      await loadInvites();
      
      // Reset form
      setExpiresInHours('');
      setMaxUses('');
    } catch (error: any) {
      showAlert('Error', error.message || 'Failed to create invite');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(code);
        showAlert('Copied!', 'Invite code copied to clipboard');
      }
    } catch (error) {
      console.error('[ConversationInviteModal] Copy error:', error);
    }
  };

  const handleCopyLink = async (code: string) => {
    const joinUrl = `https://www.wakatto.com/join/${code}`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(joinUrl);
        showAlert('Copied!', 'Join link copied to clipboard');
      }
    } catch (error) {
      console.error('[ConversationInviteModal] Copy error:', error);
    }
  };

  const handleShare = async (code: string) => {
    const joinUrl = `https://www.wakatto.com/join/${code}`;
    const title = conversationTitle || 'a conversation';
    const message = `Join me in "${title}" on Wakatto! 🤖✨\n\n${joinUrl}\n\nOr use code: ${code}`;

    try {
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({
            title: `Join ${title} on Wakatto`,
            text: message,
            url: joinUrl,
          });
        } else {
          await handleCopyLink(code);
        }
      } else {
        await Share.share({ message });
      }
    } catch (error) {
      console.error('[ConversationInviteModal] Share error:', error);
    }
  };

  const handleSendEmail = async () => {
    if (!emailAddress.trim()) {
      showAlert('Email Required', 'Please enter an email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress.trim())) {
      showAlert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setIsSendingEmail(true);
    try {
      // Create a new invite if we don't have one
      let codeToSend = generatedCode;
      if (!codeToSend) {
        const invite = await createInvite(conversationId, { role: selectedRole });
        codeToSend = invite.code;
        setGeneratedCode(codeToSend);
        await loadInvites();
      }

      // Send the email
      const result = await sendConversationInviteEmail(emailAddress.trim(), {
        inviteCode: codeToSend,
        joinUrl: `https://www.wakatto.com/join/${codeToSend}`,
        conversationTitle: conversationTitle || 'a conversation',
      });

      if (result.success) {
        showAlert('Email Sent! 📧', `Invitation sent to ${emailAddress.trim()}`);
        setEmailAddress('');
        setShowEmailInput(false);
      } else {
        showAlert('Error', result.error || 'Failed to send email');
      }
    } catch (error: any) {
      showAlert('Error', error.message || 'Failed to send invitation email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleDeleteInvite = async (inviteId: string) => {
    showAlert(
      'Delete Invite?',
      'This will permanently delete this invite code. Anyone with this code will no longer be able to join.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteInvite(inviteId);
              await loadInvites();
            } catch (error) {
              showAlert('Error', 'Failed to delete invite');
            }
          },
        },
      ]
    );
  };

  const formatExpiry = (expiresAt: string | null) => {
    if (!expiresAt) return 'Never';
    const date = new Date(expiresAt);
    const now = new Date();
    if (date < now) return 'Expired';
    
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays}d left`;
    if (diffHours > 0) return `${diffHours}h left`;
    return 'Soon';
  };

  const isExpired = (invite: ConversationInvite) => {
    if (!invite.expires_at) return false;
    return new Date(invite.expires_at) < new Date();
  };

  const isMaxedOut = (invite: ConversationInvite) => {
    if (!invite.max_uses) return false;
    return invite.use_count >= invite.max_uses;
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <AlertComponent />
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="share-social" size={22} color="#a855f7" />
              <Text style={styles.headerTitle}>Share Conversation</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            {/* Info Banner */}
            <View style={styles.infoBanner}>
              <Ionicons name="information-circle" size={20} color="#3b82f6" />
              <Text style={styles.infoText}>
                Create a join link to invite others to this conversation. They'll need a Wakatto account to join.
              </Text>
            </View>

            {/* Generated Code Display */}
            {generatedCode && (
              <View style={styles.generatedSection}>
                <View style={styles.generatedHeader}>
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  <Text style={styles.generatedTitle}>Invite Created!</Text>
                </View>
                
                <View style={styles.codeDisplay}>
                  <Text style={styles.codeText}>{generatedCode}</Text>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleCopyCode(generatedCode)}
                  >
                    <Ionicons name="copy-outline" size={18} color="#a855f7" />
                    <Text style={styles.actionButtonText}>Code</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleCopyLink(generatedCode)}
                  >
                    <Ionicons name="link-outline" size={18} color="#3b82f6" />
                    <Text style={[styles.actionButtonText, { color: '#3b82f6' }]}>Link</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleShare(generatedCode)}
                  >
                    <Ionicons name="share-outline" size={18} color="#10b981" />
                    <Text style={[styles.actionButtonText, { color: '#10b981' }]}>Share</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => setShowEmailInput(true)}
                  >
                    <Ionicons name="mail-outline" size={18} color="#f59e0b" />
                    <Text style={[styles.actionButtonText, { color: '#f59e0b' }]}>Email</Text>
                  </TouchableOpacity>
                </View>

                {/* Email Input */}
                {showEmailInput && (
                  <View style={styles.emailSection}>
                    <TextInput
                      style={styles.emailInput}
                      value={emailAddress}
                      onChangeText={setEmailAddress}
                      placeholder="friend@example.com"
                      placeholderTextColor="#4b5563"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      style={[styles.sendButton, isSendingEmail && styles.sendButtonDisabled]}
                      onPress={handleSendEmail}
                      disabled={isSendingEmail}
                    >
                      {isSendingEmail ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Ionicons name="send" size={18} color="#fff" />
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.newInviteButton}
                  onPress={() => setGeneratedCode(null)}
                >
                  <Text style={styles.newInviteButtonText}>Create Another</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Create New Invite Form */}
            {!generatedCode && (
              <View style={styles.createSection}>
                <Text style={styles.sectionTitle}>Create Invite Link</Text>

                {/* Role Selection */}
                <Text style={styles.label}>Role</Text>
                <View style={styles.roleToggle}>
                  <TouchableOpacity
                    style={[styles.roleButton, selectedRole === 'participant' && styles.roleButtonActive]}
                    onPress={() => setSelectedRole('participant')}
                  >
                    <Ionicons
                      name="people"
                      size={16}
                      color={selectedRole === 'participant' ? '#fff' : '#9ca3af'}
                    />
                    <Text style={[styles.roleButtonText, selectedRole === 'participant' && styles.roleButtonTextActive]}>
                      Participant
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.roleButton, selectedRole === 'viewer' && styles.roleButtonActive]}
                    onPress={() => setSelectedRole('viewer')}
                  >
                    <Ionicons
                      name="eye"
                      size={16}
                      color={selectedRole === 'viewer' ? '#fff' : '#9ca3af'}
                    />
                    <Text style={[styles.roleButtonText, selectedRole === 'viewer' && styles.roleButtonTextActive]}>
                      Viewer
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.roleHint}>
                  {selectedRole === 'participant'
                    ? 'Can send messages and interact with the conversation'
                    : 'Can only read messages, cannot send any'}
                </Text>

                {/* Optional Settings */}
                <View style={styles.optionsRow}>
                  <View style={styles.optionField}>
                    <Text style={styles.optionLabel}>Expires in (hours)</Text>
                    <TextInput
                      style={styles.optionInput}
                      value={expiresInHours}
                      onChangeText={setExpiresInHours}
                      placeholder="Never"
                      placeholderTextColor="#4b5563"
                      keyboardType="number-pad"
                    />
                  </View>
                  <View style={styles.optionField}>
                    <Text style={styles.optionLabel}>Max uses</Text>
                    <TextInput
                      style={styles.optionInput}
                      value={maxUses}
                      onChangeText={setMaxUses}
                      placeholder="Unlimited"
                      placeholderTextColor="#4b5563"
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                {/* Create Button */}
                <TouchableOpacity
                  style={[styles.createButton, isCreating && styles.createButtonDisabled]}
                  onPress={handleCreateInvite}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="add-circle" size={20} color="#fff" />
                      <Text style={styles.createButtonText}>Generate Invite Link</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Existing Invites */}
            {invites.length > 0 && (
              <View style={styles.existingSection}>
                <Text style={styles.sectionTitle}>
                  Existing Invites ({invites.length})
                </Text>

                {invites.map((invite) => {
                  const expired = isExpired(invite);
                  const maxedOut = isMaxedOut(invite);
                  const disabled = expired || maxedOut;

                  return (
                    <View
                      key={invite.id}
                      style={[styles.inviteCard, disabled && styles.inviteCardDisabled]}
                    >
                      <View style={styles.inviteHeader}>
                        <View style={styles.inviteCodeContainer}>
                          <Text style={[styles.inviteCode, disabled && styles.inviteCodeDisabled]}>
                            {invite.code}
                          </Text>
                          <View
                            style={[
                              styles.roleBadge,
                              invite.role === 'participant' ? styles.roleBadgeParticipant : styles.roleBadgeViewer,
                            ]}
                          >
                            <Text style={styles.roleBadgeText}>{invite.role}</Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDeleteInvite(invite.id)}
                        >
                          <Ionicons name="trash-outline" size={16} color="#ef4444" />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.inviteStats}>
                        <View style={styles.statItem}>
                          <Ionicons name="people-outline" size={14} color="#6b7280" />
                          <Text style={styles.statText}>
                            {invite.use_count}{invite.max_uses ? `/${invite.max_uses}` : ''} uses
                          </Text>
                        </View>
                        <View style={styles.statItem}>
                          <Ionicons name="time-outline" size={14} color="#6b7280" />
                          <Text style={[styles.statText, expired && styles.statTextExpired]}>
                            {formatExpiry(invite.expires_at)}
                          </Text>
                        </View>
                      </View>

                      {!disabled && (
                        <View style={styles.inviteActions}>
                          <TouchableOpacity
                            style={styles.smallActionButton}
                            onPress={() => handleCopyLink(invite.code)}
                          >
                            <Ionicons name="link-outline" size={14} color="#a855f7" />
                            <Text style={styles.smallActionText}>Copy Link</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.smallActionButton}
                            onPress={() => handleShare(invite.code)}
                          >
                            <Ionicons name="share-outline" size={14} color="#3b82f6" />
                            <Text style={[styles.smallActionText, { color: '#3b82f6' }]}>Share</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {disabled && (
                        <View style={styles.disabledBadge}>
                          <Ionicons name="close-circle" size={14} color="#ef4444" />
                          <Text style={styles.disabledText}>
                            {expired ? 'Expired' : 'Max uses reached'}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Loading */}
            {isLoading && invites.length === 0 && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#a855f7" />
              </View>
            )}
          </ScrollView>
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
    maxWidth: 440,
    maxHeight: '85%',
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
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#93c5fd',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9ca3af',
    marginBottom: 8,
  },
  // Generated Code Section
  generatedSection: {
    padding: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    marginBottom: 16,
  },
  generatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  generatedTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#10b981',
  },
  codeDisplay: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  codeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#a855f7',
  },
  emailSection: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  emailInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sendButton: {
    width: 44,
    borderRadius: 8,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  newInviteButton: {
    alignItems: 'center',
    padding: 10,
  },
  newInviteButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
    textDecorationLine: 'underline',
  },
  // Create Section
  createSection: {
    marginBottom: 20,
  },
  roleToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 4,
    marginBottom: 8,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  roleButtonActive: {
    backgroundColor: '#a855f7',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
  },
  roleButtonTextActive: {
    color: '#fff',
  },
  roleHint: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  optionField: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9ca3af',
    marginBottom: 6,
  },
  optionInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 10,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    backgroundColor: '#a855f7',
    borderRadius: 10,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  // Existing Invites Section
  existingSection: {
    marginTop: 8,
  },
  inviteCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  inviteCardDisabled: {
    opacity: 0.5,
  },
  inviteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  inviteCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inviteCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  inviteCodeDisabled: {
    color: '#6b7280',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleBadgeParticipant: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  roleBadgeViewer: {
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9ca3af',
    textTransform: 'capitalize',
  },
  deleteButton: {
    padding: 6,
  },
  inviteStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#6b7280',
  },
  statTextExpired: {
    color: '#ef4444',
  },
  inviteActions: {
    flexDirection: 'row',
    gap: 12,
  },
  smallActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  smallActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#a855f7',
  },
  disabledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  disabledText: {
    fontSize: 12,
    color: '#ef4444',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
});

export default ConversationInviteModal;

