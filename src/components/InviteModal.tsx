/**
 * InviteModal - Generate and manage conversation invite links
 * Allows owners to create invite codes with configurable roles and expiration
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
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  createInvite,
  getInvites,
  deleteInvite,
  type ConversationInvite,
} from '../services/participantService';

interface InviteModalProps {
  visible: boolean;
  conversationId: string;
  onClose: () => void;
}

export function InviteModal({ visible, conversationId, onClose }: InviteModalProps) {
  const [invites, setInvites] = useState<ConversationInvite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // New invite form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRole, setNewRole] = useState<'editor' | 'viewer'>('viewer');
  const [expiresInHours, setExpiresInHours] = useState<string>('24');
  const [maxUses, setMaxUses] = useState<string>('');

  useEffect(() => {
    if (visible && conversationId) {
      loadInvites();
    }
  }, [visible, conversationId]);

  const loadInvites = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getInvites(conversationId);
      setInvites(data);
    } catch (err) {
      setError('Failed to load invites');
      console.error('[InviteModal] Error loading invites:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInvite = async () => {
    setIsCreating(true);
    setError(null);
    try {
      const newInvite = await createInvite(conversationId, {
        role: newRole,
        expiresInHours: expiresInHours ? parseInt(expiresInHours, 10) : undefined,
        maxUses: maxUses ? parseInt(maxUses, 10) : undefined,
      });
      setInvites([newInvite, ...invites]);
      setShowCreateForm(false);
      // Reset form
      setNewRole('viewer');
      setExpiresInHours('24');
      setMaxUses('');
    } catch (err) {
      setError('Failed to create invite');
      console.error('[InviteModal] Error creating invite:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteInvite = async (inviteId: string) => {
    try {
      await deleteInvite(inviteId);
      setInvites(invites.filter((inv) => inv.id !== inviteId));
    } catch (err) {
      setError('Failed to delete invite');
      console.error('[InviteModal] Error deleting invite:', err);
    }
  };

  const copyToClipboard = async (code: string, inviteId: string) => {
    try {
      // Create invite URL
      // eslint-disable-next-line no-undef
      const globalWindow = typeof globalThis !== 'undefined' ? (globalThis as any) : {};
      const origin = globalWindow.window?.location?.origin || 'https://wakatto.com';
      const inviteUrl = `${origin}/join/${code}`;

      if (typeof navigator !== 'undefined' && (navigator as any).clipboard) {
        await (navigator as any).clipboard.writeText(inviteUrl);
        setCopiedId(inviteId);
        setTimeout(() => setCopiedId(null), 2000);
      } else {
        // Fallback: just show success (native apps may handle differently)
        setCopiedId(inviteId);
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch (err) {
      // Fallback: copy just the code
      try {
        if (typeof navigator !== 'undefined' && (navigator as any).clipboard) {
          await (navigator as any).clipboard.writeText(code);
        }
        setCopiedId(inviteId);
        setTimeout(() => setCopiedId(null), 2000);
      } catch {
        setError('Failed to copy');
      }
    }
  };

  const formatExpiry = (expiresAt: string | null) => {
    if (!expiresAt) return 'Never';
    const date = new Date(expiresAt);
    const now = new Date();
    if (date < now) return 'Expired';

    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h`;
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
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="link" size={20} color="#a855f7" />
              <Text style={styles.headerTitle}>Invite Links</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Create New Invite Button/Form */}
          {!showCreateForm ? (
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowCreateForm(true)}
            >
              <Ionicons name="add-circle" size={20} color="#a855f7" />
              <Text style={styles.createButtonText}>Create New Invite</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.createForm}>
              <Text style={styles.formLabel}>New Invite</Text>

              {/* Role Selection */}
              <Text style={styles.inputLabel}>Role for invitee</Text>
              <View style={styles.roleSelector}>
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    newRole === 'editor' && styles.roleOptionActive,
                  ]}
                  onPress={() => setNewRole('editor')}
                >
                  <Ionicons
                    name="pencil"
                    size={16}
                    color={newRole === 'editor' ? '#fff' : '#10b981'}
                  />
                  <Text
                    style={[
                      styles.roleOptionText,
                      newRole === 'editor' && styles.roleOptionTextActive,
                    ]}
                  >
                    Editor
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    newRole === 'viewer' && styles.roleOptionActive,
                  ]}
                  onPress={() => setNewRole('viewer')}
                >
                  <Ionicons
                    name="eye"
                    size={16}
                    color={newRole === 'viewer' ? '#fff' : '#6b7280'}
                  />
                  <Text
                    style={[
                      styles.roleOptionText,
                      newRole === 'viewer' && styles.roleOptionTextActive,
                    ]}
                  >
                    Viewer
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Expiry */}
              <Text style={styles.inputLabel}>Expires in (hours)</Text>
              <TextInput
                style={styles.input}
                value={expiresInHours}
                onChangeText={setExpiresInHours}
                placeholder="24 (leave empty for never)"
                placeholderTextColor="#6b7280"
                keyboardType="numeric"
              />

              {/* Max Uses */}
              <Text style={styles.inputLabel}>Max uses</Text>
              <TextInput
                style={styles.input}
                value={maxUses}
                onChangeText={setMaxUses}
                placeholder="Unlimited"
                placeholderTextColor="#6b7280"
                keyboardType="numeric"
              />

              {/* Form Actions */}
              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowCreateForm(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleCreateInvite}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={18} color="#fff" />
                      <Text style={styles.submitButtonText}>Create</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Existing Invites List */}
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Active Invites</Text>
            <Text style={styles.listCount}>{invites.length}</Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#a855f7" />
            </View>
          ) : invites.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="link-outline" size={40} color="#4b5563" />
              <Text style={styles.emptyText}>No invite links yet</Text>
              <Text style={styles.emptySubtext}>
                Create one to share this conversation
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {invites.map((invite) => {
                const expired = isExpired(invite);
                const maxedOut = isMaxedOut(invite);
                const isInactive = expired || maxedOut;

                return (
                  <View
                    key={invite.id}
                    style={[styles.inviteItem, isInactive && styles.inviteItemInactive]}
                  >
                    <View style={styles.inviteMain}>
                      {/* Code */}
                      <View style={styles.codeContainer}>
                        <Text style={[styles.code, isInactive && styles.codeInactive]}>
                          {invite.code}
                        </Text>
                        <TouchableOpacity
                          style={styles.copyButton}
                          onPress={() => copyToClipboard(invite.code, invite.id)}
                          disabled={isInactive}
                        >
                          <Ionicons
                            name={copiedId === invite.id ? 'checkmark' : 'copy'}
                            size={16}
                            color={copiedId === invite.id ? '#10b981' : '#a855f7'}
                          />
                        </TouchableOpacity>
                      </View>

                      {/* Info Row */}
                      <View style={styles.inviteInfo}>
                        {/* Role Badge */}
                        <View
                          style={[
                            styles.roleBadge,
                            invite.role === 'editor'
                              ? styles.roleBadgeEditor
                              : styles.roleBadgeViewer,
                          ]}
                        >
                          <Ionicons
                            name={invite.role === 'editor' ? 'pencil' : 'eye'}
                            size={10}
                            color={invite.role === 'editor' ? '#10b981' : '#6b7280'}
                          />
                          <Text
                            style={[
                              styles.roleBadgeText,
                              invite.role === 'editor'
                                ? styles.roleBadgeTextEditor
                                : styles.roleBadgeTextViewer,
                            ]}
                          >
                            {invite.role}
                          </Text>
                        </View>

                        {/* Stats */}
                        <View style={styles.statItem}>
                          <Ionicons name="people-outline" size={12} color="#6b7280" />
                          <Text style={styles.statText}>
                            {invite.use_count}
                            {invite.max_uses ? `/${invite.max_uses}` : ''}
                          </Text>
                        </View>

                        <View style={styles.statItem}>
                          <Ionicons name="time-outline" size={12} color="#6b7280" />
                          <Text
                            style={[
                              styles.statText,
                              expired && styles.statTextExpired,
                            ]}
                          >
                            {formatExpiry(invite.expires_at)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Delete Button */}
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteInvite(invite.id)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          )}

          {/* Help Text */}
          <View style={styles.helpContainer}>
            <Ionicons name="information-circle-outline" size={14} color="#6b7280" />
            <Text style={styles.helpText}>
              Share the invite link with others to let them join this conversation.
            </Text>
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
    maxWidth: 420,
    maxHeight: '80%',
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 12,
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
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: 12,
    padding: 14,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    borderStyle: 'dashed',
  },
  createButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#a855f7',
  },
  createForm: {
    margin: 12,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  formLabel: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#9ca3af',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  roleOptionActive: {
    backgroundColor: '#a855f7',
    borderColor: '#a855f7',
  },
  roleOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#9ca3af',
  },
  roleOptionTextActive: {
    color: '#fff',
  },
  formActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#9ca3af',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#a855f7',
  },
  submitButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  listTitle: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listCount: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    color: '#9ca3af',
  },
  emptySubtext: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  list: {
    maxHeight: 200,
    paddingHorizontal: 12,
  },
  inviteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  inviteItemInactive: {
    opacity: 0.5,
  },
  inviteMain: {
    flex: 1,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  code: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#a855f7',
    letterSpacing: 2,
  },
  codeInactive: {
    color: '#6b7280',
  },
  copyButton: {
    padding: 4,
  },
  inviteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  roleBadgeEditor: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  roleBadgeViewer: {
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
  },
  roleBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    textTransform: 'capitalize',
  },
  roleBadgeTextEditor: {
    color: '#10b981',
  },
  roleBadgeTextViewer: {
    color: '#9ca3af',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  statTextExpired: {
    color: '#ef4444',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  helpText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
});

export default InviteModal;
