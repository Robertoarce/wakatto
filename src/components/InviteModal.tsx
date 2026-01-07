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
  getMyInvitations,
  getInvitationStats,
  cancelInvitation,
  copyInviteLink,
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
                        <Text style={[styles.inviteEmail, { fontSize: fonts.sm }]} numberOfLines={1}>
                          {invite.invitee_email}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(invite.status) + '20' }]}>
                          <Ionicons name={getStatusIcon(invite.status) as any} size={12} color={getStatusColor(invite.status)} />
                          <Text style={[styles.statusText, { color: getStatusColor(invite.status), fontSize: fonts.xs - 1 }]}>
                            {invite.status.charAt(0).toUpperCase() + invite.status.slice(1)}
                          </Text>
                        </View>
                      </View>
                      
                      <Text style={[styles.inviteDate, { fontSize: fonts.xs }]}>
                        Sent {formatDate(invite.created_at)}
                        {invite.accepted_at && ` • Joined ${formatDate(invite.accepted_at)}`}
                      </Text>

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
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleCancelInvite(invite.id)}
                          >
                            <Ionicons name="close-circle-outline" size={16} color="#ef4444" />
                            <Text style={[styles.actionText, { color: '#ef4444' }]}>Cancel</Text>
                          </TouchableOpacity>
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
});

export default InviteModal;
