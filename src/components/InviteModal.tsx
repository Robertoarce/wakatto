/**
 * Invite Modal Component
 * 
 * Allows users to invite friends to Wakatto
 * Tracks invitations for future rewards
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../constants/Layout';
import { Button, Input } from './ui';
import { useCustomAlert } from './CustomAlert';
import {
  createInvitation,
  createOpenInvite,
  getMyInvitations,
  getInvitationStats,
  cancelInvitation,
  deleteInvitation,
  updateInviteLimit,
  copyInviteLink,
  copyInviteCode,
  Invitation,
  InvitationStats,
} from '../services/invitationService';

interface InviteModalProps {
  visible: boolean;
  onClose: () => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({ visible, onClose }) => {
  const { fonts, spacing, borderRadius, isMobile } = useResponsive();
  const { showAlert, AlertComponent } = useCustomAlert();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [stats, setStats] = useState<InvitationStats | null>(null);
  const [activeTab, setActiveTab] = useState<'invite' | 'history'>('invite');
  
  // Open invite state
  const [inviteMode, setInviteMode] = useState<'email' | 'open'>('email');
  const [maxUses, setMaxUses] = useState('');
  const [creatingOpenInvite, setCreatingOpenInvite] = useState(false);
  const [generatedInvite, setGeneratedInvite] = useState<{ code: string; url: string } | null>(null);
  
  // Limit editing state
  const [editingLimitId, setEditingLimitId] = useState<string | null>(null);
  const [editingLimitValue, setEditingLimitValue] = useState('');

  // Load invitations and stats when modal opens
  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invites, statistics] = await Promise.all([
        getMyInvitations(),
        getInvitationStats(),
      ]);
      setInvitations(invites);
      setStats(statistics);
    } catch (error) {
      console.error('[InviteModal] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    
    if (!trimmedEmail) {
      showAlert('Email Required', 'Please enter an email address to invite.');
      return;
    }

    // Proper email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      showAlert('Invalid Email', 'Please enter a valid email address (e.g., friend@example.com).');
      return;
    }

    // Check for common typos
    const invalidDomains = ['@gmial.com', '@gmal.com', '@gamil.com', '@hotmal.com', '@yahooo.com'];
    if (invalidDomains.some(typo => trimmedEmail.includes(typo))) {
      showAlert('Check Email', 'Did you mean gmail.com, hotmail.com, or yahoo.com? Please check for typos.');
      return;
    }

    setSendingInvite(true);
    try {
      const { invitation, inviteUrl } = await createInvitation(trimmedEmail);
      
      showAlert(
        'Invitation Sent! 🎉',
        `An invitation has been sent to ${trimmedEmail}. You'll be rewarded when they join!`,
        [{ text: 'Great!' }]
      );

      setEmail('');
      await loadData(); // Refresh the list
    } catch (error: any) {
      showAlert('Error', error.message || 'Failed to send invitation. Please try again.');
    } finally {
      setSendingInvite(false);
    }
  };

  const handleCopyLink = async (inviteCode: string) => {
    const success = await copyInviteLink(inviteCode);
    if (success) {
      showAlert('Copied!', 'Invite link copied to clipboard.');
    } else {
      showAlert('Error', 'Failed to copy link. Please try manually.');
    }
  };

  const handleShare = async (inviteCode: string) => {
    const inviteUrl = `https://www.wakatto.com/invite/${inviteCode}`;
    const message = `Join me on Wakatto - AI companions that listen and understand! 🤖✨\n\n${inviteUrl}`;

    try {
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({
            title: 'Join Wakatto',
            text: message,
            url: inviteUrl,
          });
        } else {
          await copyInviteLink(inviteCode);
          showAlert('Link Copied!', 'Share this link with your friend.');
        }
      } else {
        await Share.share({ message });
      }
    } catch (error) {
      console.error('[InviteModal] Share error:', error);
    }
  };

  const handleCancelInvite = async (invitationId: string) => {
    showAlert(
      'Cancel Invitation?',
      'Are you sure you want to cancel this invitation?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            const success = await cancelInvitation(invitationId);
            if (success) {
              await loadData();
            }
          },
        },
      ]
    );
  };

  const handleCreateOpenInvite = async () => {
    setCreatingOpenInvite(true);
    try {
      const maxUsesNum = maxUses ? parseInt(maxUses, 10) : undefined;
      if (maxUses && (isNaN(maxUsesNum!) || maxUsesNum! < 1)) {
        showAlert('Invalid Limit', 'Please enter a valid number for the usage limit.');
        return;
      }

      const { inviteCode, inviteUrl } = await createOpenInvite({ 
        maxUses: maxUsesNum 
      });
      
      setGeneratedInvite({ code: inviteCode, url: inviteUrl });
      setMaxUses('');
      await loadData(); // Refresh the list
    } catch (error: any) {
      showAlert('Error', error.message || 'Failed to create invite code. Please try again.');
    } finally {
      setCreatingOpenInvite(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    const success = await copyInviteCode(code);
    if (success) {
      showAlert('Copied!', 'Invite code copied to clipboard.');
    } else {
      showAlert('Error', 'Failed to copy code. Please try manually.');
    }
  };

  const handleDeleteOpenInvite = async (invitationId: string) => {
    showAlert(
      'Delete Open Invite?',
      'This will permanently delete the invite code. It cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteInvitation(invitationId);
            if (success) {
              await loadData();
            } else {
              showAlert('Error', 'Failed to delete invite. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleUpdateLimit = async (invitationId: string) => {
    const newLimit = editingLimitValue ? parseInt(editingLimitValue, 10) : null;
    if (editingLimitValue && (isNaN(newLimit!) || newLimit! < 1)) {
      showAlert('Invalid Limit', 'Please enter a valid number or leave empty for unlimited.');
      return;
    }

    const success = await updateInviteLimit(invitationId, newLimit);
    if (success) {
      setEditingLimitId(null);
      setEditingLimitValue('');
      await loadData();
    } else {
      showAlert('Error', 'Failed to update limit. Please try again.');
    }
  };

  const startEditingLimit = (invite: Invitation) => {
    setEditingLimitId(invite.id);
    setEditingLimitValue(invite.max_uses?.toString() || '');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'expired': return '#6b7280';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return 'checkmark-circle';
      case 'pending': return 'time';
      case 'expired': return 'close-circle';
      case 'cancelled': return 'ban';
      default: return 'help-circle';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <AlertComponent />
      <View style={styles.overlay}>
        <View style={[
          styles.container,
          {
            maxWidth: isMobile ? '100%' : 500,
            maxHeight: isMobile ? '95%' : '85%',
            margin: isMobile ? 0 : spacing.xl,
            borderRadius: isMobile ? 0 : 16,
          }
        ]}>
          {/* Header */}
          <View style={[styles.header, { padding: spacing.lg }]}>
            <View style={styles.headerContent}>
              <Ionicons name="gift" size={28} color="#ea580c" />
              <Text style={[styles.title, { fontSize: fonts.xl, marginLeft: spacing.sm }]}>
                Invite Friends
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#a1a1aa" />
            </TouchableOpacity>
          </View>

          {/* Stats Bar */}
          {stats && (
            <View style={[styles.statsBar, { padding: spacing.md }]}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { fontSize: fonts.lg }]}>{stats.total_sent}</Text>
                <Text style={[styles.statLabel, { fontSize: fonts.xs }]}>Sent</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { fontSize: fonts.lg }]}>{stats.pending_count}</Text>
                <Text style={[styles.statLabel, { fontSize: fonts.xs }]}>Pending</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { fontSize: fonts.lg, color: '#10b981' }]}>{stats.accepted_count}</Text>
                <Text style={[styles.statLabel, { fontSize: fonts.xs }]}>Joined</Text>
              </View>
            </View>
          )}

          {/* Tabs */}
          <View style={[styles.tabs, { padding: spacing.sm }]}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'invite' && styles.tabActive]}
              onPress={() => setActiveTab('invite')}
            >
              <Ionicons 
                name="paper-plane" 
                size={18} 
                color={activeTab === 'invite' ? '#ea580c' : '#71717a'} 
              />
              <Text style={[
                styles.tabText, 
                { fontSize: fonts.sm },
                activeTab === 'invite' && styles.tabTextActive
              ]}>
                Send Invite
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'history' && styles.tabActive]}
              onPress={() => setActiveTab('history')}
            >
              <Ionicons 
                name="list" 
                size={18} 
                color={activeTab === 'history' ? '#ea580c' : '#71717a'} 
              />
              <Text style={[
                styles.tabText, 
                { fontSize: fonts.sm },
                activeTab === 'history' && styles.tabTextActive
              ]}>
                History ({invitations.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} contentContainerStyle={{ padding: spacing.lg }}>
            {activeTab === 'invite' ? (
              <>
                {/* Invite Form */}
                <View style={[styles.rewardBanner, { borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.lg }]}>
                  <Ionicons name="gift" size={24} color="#ea580c" />
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={[styles.rewardTitle, { fontSize: fonts.sm }]}>
                      Earn Rewards! 🎁
                    </Text>
                    <Text style={[styles.rewardText, { fontSize: fonts.xs }]}>
                      Invite friends and earn rewards when they join Wakatto.
                    </Text>
                  </View>
                </View>

                {/* Mode Toggle */}
                <View style={[styles.modeToggle, { marginBottom: spacing.lg }]}>
                  <TouchableOpacity
                    style={[
                      styles.modeButton,
                      inviteMode === 'email' && styles.modeButtonActive,
                      { borderRadius: borderRadius.sm }
                    ]}
                    onPress={() => {
                      setInviteMode('email');
                      setGeneratedInvite(null);
                    }}
                  >
                    <Ionicons 
                      name="mail" 
                      size={16} 
                      color={inviteMode === 'email' ? '#fff' : '#71717a'} 
                    />
                    <Text style={[
                      styles.modeButtonText, 
                      { fontSize: fonts.sm },
                      inviteMode === 'email' && styles.modeButtonTextActive
                    ]}>
                      By Email
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modeButton,
                      inviteMode === 'open' && styles.modeButtonActive,
                      { borderRadius: borderRadius.sm }
                    ]}
                    onPress={() => {
                      setInviteMode('open');
                      setGeneratedInvite(null);
                    }}
                  >
                    <Ionicons 
                      name="link" 
                      size={16} 
                      color={inviteMode === 'open' ? '#fff' : '#71717a'} 
                    />
                    <Text style={[
                      styles.modeButtonText, 
                      { fontSize: fonts.sm },
                      inviteMode === 'open' && styles.modeButtonTextActive
                    ]}>
                      Open Code
                    </Text>
                  </TouchableOpacity>
                </View>

                {inviteMode === 'email' ? (
                  <>
                    <Input
                      label="Friend's Email"
                      placeholder="friend@example.com"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      icon="mail-outline"
                      containerStyle={{ marginBottom: spacing.lg }}
                    />

                    <Button
                      title={sendingInvite ? 'Sending...' : 'Send Invitation'}
                      onPress={handleSendInvite}
                      disabled={sendingInvite}
                      loading={sendingInvite}
                      fullWidth
                      size="lg"
                      icon="paper-plane"
                    />

                    <Text style={[styles.helperText, { fontSize: fonts.xs, marginTop: spacing.lg }]}>
                      Your friend will receive an email with a link to join Wakatto. 
                      You'll be notified when they sign up!
                    </Text>
                  </>
                ) : (
                  <>
                    {/* Open Invite Creation */}
                    {generatedInvite ? (
                      <View style={[styles.generatedCodeCard, { borderRadius: borderRadius.md, padding: spacing.lg }]}>
                        <View style={styles.generatedCodeHeader}>
                          <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                          <Text style={[styles.generatedCodeTitle, { fontSize: fonts.md, marginLeft: spacing.sm }]}>
                            Invite Code Created!
                          </Text>
                        </View>
                        
                        <View style={[styles.codeDisplay, { marginTop: spacing.md, borderRadius: borderRadius.sm }]}>
                          <Text style={[styles.codeText, { fontSize: fonts.xl }]}>
                            {generatedInvite.code}
                          </Text>
                        </View>

                        <View style={[styles.codeActions, { marginTop: spacing.md }]}>
                          <TouchableOpacity
                            style={[styles.codeActionButton, { borderRadius: borderRadius.sm }]}
                            onPress={() => handleCopyCode(generatedInvite.code)}
                          >
                            <Ionicons name="copy-outline" size={18} color="#8b5cf6" />
                            <Text style={[styles.codeActionText, { fontSize: fonts.sm }]}>Copy Code</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.codeActionButton, { borderRadius: borderRadius.sm }]}
                            onPress={() => handleCopyLink(generatedInvite.code)}
                          >
                            <Ionicons name="link-outline" size={18} color="#3b82f6" />
                            <Text style={[styles.codeActionText, { color: '#3b82f6', fontSize: fonts.sm }]}>Copy Link</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.codeActionButton, { borderRadius: borderRadius.sm }]}
                            onPress={() => handleShare(generatedInvite.code)}
                          >
                            <Ionicons name="share-outline" size={18} color="#10b981" />
                            <Text style={[styles.codeActionText, { color: '#10b981', fontSize: fonts.sm }]}>Share</Text>
                          </TouchableOpacity>
                        </View>

                        <Button
                          title="Create Another"
                          onPress={() => setGeneratedInvite(null)}
                          variant="outline"
                          fullWidth
                          size="md"
                          style={{ marginTop: spacing.lg }}
                        />
                      </View>
                    ) : (
                      <>
                        <Text style={[styles.sectionLabel, { fontSize: fonts.sm, marginBottom: spacing.sm }]}>
                          Create a shareable invite code
                        </Text>
                        <Text style={[styles.helperText, { fontSize: fonts.xs, marginBottom: spacing.lg, textAlign: 'left' }]}>
                          Generate a code or link that you can share with anyone. 
                          Optionally set a limit on how many times it can be used.
                        </Text>

                        <Input
                          label="Usage Limit (optional)"
                          placeholder="Leave empty for unlimited"
                          value={maxUses}
                          onChangeText={setMaxUses}
                          keyboardType="number-pad"
                          icon="people-outline"
                          containerStyle={{ marginBottom: spacing.lg }}
                        />

                        <Button
                          title={creatingOpenInvite ? 'Creating...' : 'Generate Invite Code'}
                          onPress={handleCreateOpenInvite}
                          disabled={creatingOpenInvite}
                          loading={creatingOpenInvite}
                          fullWidth
                          size="lg"
                          icon="link"
                        />
                      </>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                {/* Invitation History */}
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#ea580c" />
                  </View>
                ) : invitations.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="mail-unread-outline" size={48} color="#3f3f46" />
                    <Text style={[styles.emptyText, { fontSize: fonts.md, marginTop: spacing.md }]}>
                      No invitations yet
                    </Text>
                    <Text style={[styles.emptySubtext, { fontSize: fonts.sm }]}>
                      Start inviting friends to earn rewards!
                    </Text>
                  </View>
                ) : (
                  invitations.map((invite) => (
                    <View key={invite.id} style={[styles.inviteCard, { borderRadius: borderRadius.md, marginBottom: spacing.md }]}>
                      <View style={styles.inviteHeader}>
                        {invite.invite_type === 'open' ? (
                          <View style={styles.openInviteLabel}>
                            <Ionicons name="link" size={14} color="#8b5cf6" />
                            <Text style={[styles.inviteCode, { fontSize: fonts.sm, marginLeft: 4 }]}>
                              {invite.invite_code}
                            </Text>
                          </View>
                        ) : (
                          <Text style={[styles.inviteEmail, { fontSize: fonts.sm }]} numberOfLines={1}>
                            {invite.invitee_email}
                          </Text>
                        )}
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(invite.status) + '20' }]}>
                          <Ionicons name={getStatusIcon(invite.status) as any} size={12} color={getStatusColor(invite.status)} />
                          <Text style={[styles.statusText, { color: getStatusColor(invite.status), fontSize: fonts.xs - 1 }]}>
                            {invite.status.charAt(0).toUpperCase() + invite.status.slice(1)}
                          </Text>
                        </View>
                      </View>

                      {/* Type badge */}
                      <View style={[styles.typeBadgeRow, { marginTop: spacing.xs }]}>
                        <View style={[styles.typeBadge, { backgroundColor: invite.invite_type === 'open' ? '#8b5cf620' : '#3b82f620' }]}>
                          <Text style={[styles.typeBadgeText, { color: invite.invite_type === 'open' ? '#8b5cf6' : '#3b82f6', fontSize: fonts.xs - 2 }]}>
                            {invite.invite_type === 'open' ? 'Open Code' : 'Email Invite'}
                          </Text>
                        </View>
                        
                        {/* Usage stats for open invites */}
                        {invite.invite_type === 'open' && (
                          <View style={styles.usageStats}>
                            <Ionicons name="people-outline" size={12} color="#71717a" />
                            <Text style={[styles.usageText, { fontSize: fonts.xs - 1 }]}>
                              {invite.use_count}{invite.max_uses ? `/${invite.max_uses}` : ''} uses
                            </Text>
                          </View>
                        )}
                      </View>
                      
                      <Text style={[styles.inviteDate, { fontSize: fonts.xs }]}>
                        Created {formatDate(invite.created_at)}
                        {invite.invite_type === 'email' && invite.accepted_at && ` • Joined ${formatDate(invite.accepted_at)}`}
                      </Text>

                      {/* Limit editing for open invites */}
                      {invite.invite_type === 'open' && invite.status === 'pending' && editingLimitId === invite.id && (
                        <View style={[styles.limitEditRow, { marginTop: spacing.sm }]}>
                          <Input
                            placeholder="Unlimited"
                            value={editingLimitValue}
                            onChangeText={setEditingLimitValue}
                            keyboardType="number-pad"
                            containerStyle={{ flex: 1, marginBottom: 0 }}
                          />
                          <TouchableOpacity
                            style={[styles.limitSaveButton, { marginLeft: spacing.sm }]}
                            onPress={() => handleUpdateLimit(invite.id)}
                          >
                            <Ionicons name="checkmark" size={20} color="#10b981" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.limitCancelButton, { marginLeft: spacing.xs }]}
                            onPress={() => {
                              setEditingLimitId(null);
                              setEditingLimitValue('');
                            }}
                          >
                            <Ionicons name="close" size={20} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      )}

                      {invite.status === 'pending' && (
                        <View style={[styles.inviteActions, { marginTop: spacing.sm }]}>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleCopyLink(invite.invite_code)}
                          >
                            <Ionicons name="copy-outline" size={16} color="#8b5cf6" />
                            <Text style={styles.actionText}>Copy Link</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleShare(invite.invite_code)}
                          >
                            <Ionicons name="share-outline" size={16} color="#3b82f6" />
                            <Text style={[styles.actionText, { color: '#3b82f6' }]}>Share</Text>
                          </TouchableOpacity>
                          
                          {invite.invite_type === 'open' ? (
                            <>
                              {editingLimitId !== invite.id && (
                                <TouchableOpacity
                                  style={styles.actionButton}
                                  onPress={() => startEditingLimit(invite)}
                                >
                                  <Ionicons name="options-outline" size={16} color="#f59e0b" />
                                  <Text style={[styles.actionText, { color: '#f59e0b' }]}>Limit</Text>
                                </TouchableOpacity>
                              )}
                              <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => handleDeleteOpenInvite(invite.id)}
                              >
                                <Ionicons name="trash-outline" size={16} color="#ef4444" />
                                <Text style={[styles.actionText, { color: '#ef4444' }]}>Delete</Text>
                              </TouchableOpacity>
                            </>
                          ) : (
                            <TouchableOpacity
                              style={styles.actionButton}
                              onPress={() => handleCancelInvite(invite.id)}
                            >
                              <Ionicons name="close-circle-outline" size={16} color="#ef4444" />
                              <Text style={[styles.actionText, { color: '#ef4444' }]}>Cancel</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}

                      {invite.status === 'accepted' && invite.rewarded && (
                        <View style={[styles.rewardedBadge, { marginTop: spacing.sm }]}>
                          <Ionicons name="trophy" size={14} color="#f59e0b" />
                          <Text style={styles.rewardedText}>
                            +{invite.reward_amount} tokens earned!
                          </Text>
                        </View>
                      )}
                    </View>
                  ))
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Invite Button - Use this to open the invite modal
 */
export const InviteButton: React.FC<{ style?: any }> = ({ style }) => {
  const [showModal, setShowModal] = useState(false);
  const { fonts, spacing } = useResponsive();

  return (
    <>
      <TouchableOpacity
        style={[styles.inviteButton, style]}
        onPress={() => setShowModal(true)}
      >
        <Ionicons name="gift-outline" size={18} color="#ea580c" />
        <Text style={[styles.inviteButtonText, { fontSize: fonts.sm }]}>
          Invite Friends
        </Text>
        <Ionicons name="chevron-forward" size={18} color="#71717a" />
      </TouchableOpacity>
      <InviteModal
        visible={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#171717',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#1f1f1f',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: '#fff',
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#71717a',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#27272a',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#ea580c',
  },
  tabText: {
    color: '#71717a',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#ea580c',
  },
  content: {
    flex: 1,
  },
  rewardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffedd520',
    borderWidth: 1,
    borderColor: '#ea580c30',
  },
  rewardTitle: {
    color: '#ea580c',
    fontWeight: '600',
  },
  rewardText: {
    color: '#a1a1aa',
    marginTop: 2,
  },
  helperText: {
    color: '#71717a',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#71717a',
    fontWeight: '500',
  },
  emptySubtext: {
    color: '#52525b',
    marginTop: 4,
  },
  inviteCard: {
    backgroundColor: '#1f1f1f',
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  inviteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inviteEmail: {
    color: '#fff',
    fontWeight: '500',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontWeight: '500',
  },
  inviteDate: {
    color: '#71717a',
    marginTop: 6,
  },
  inviteActions: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    color: '#8b5cf6',
    fontWeight: '500',
    fontSize: 13,
  },
  rewardedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardedText: {
    color: '#f59e0b',
    fontWeight: '600',
    fontSize: 13,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffedd520',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ea580c30',
    gap: 10,
  },
  inviteButtonText: {
    color: '#ea580c',
    flex: 1,
    fontWeight: '500',
  },
  // Mode toggle styles
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#27272a',
    borderRadius: 8,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  modeButtonActive: {
    backgroundColor: '#ea580c',
  },
  modeButtonText: {
    color: '#71717a',
    fontWeight: '500',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  // Generated code display
  generatedCodeCard: {
    backgroundColor: '#10b98110',
    borderWidth: 1,
    borderColor: '#10b98130',
  },
  generatedCodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  generatedCodeTitle: {
    color: '#10b981',
    fontWeight: '600',
  },
  codeDisplay: {
    backgroundColor: '#27272a',
    padding: 16,
    alignItems: 'center',
  },
  codeText: {
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  codeActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  codeActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#27272a',
    gap: 6,
  },
  codeActionText: {
    color: '#8b5cf6',
    fontWeight: '500',
  },
  sectionLabel: {
    color: '#fff',
    fontWeight: '600',
  },
  // Open invite in history
  openInviteLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  inviteCode: {
    color: '#8b5cf6',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  typeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontWeight: '500',
  },
  usageStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  usageText: {
    color: '#71717a',
  },
  // Limit editing
  limitEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  limitSaveButton: {
    padding: 8,
    backgroundColor: '#10b98120',
    borderRadius: 6,
  },
  limitCancelButton: {
    padding: 8,
    backgroundColor: '#ef444420',
    borderRadius: 6,
  },
});

export default InviteModal;
