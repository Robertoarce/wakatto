import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCustomAlert } from './CustomAlert';
import { useResponsive } from '../constants/Layout';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  characterCount?: number;
}

interface ChatSidebarProps {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
  onToggleSidebar: () => void;
  isOpen: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onNewConversation?: () => void;
  onRenameConversation?: (conversationId: string, newTitle: string) => void;
  onDeleteConversation?: (conversationId: string) => void;
}

export function ChatSidebar({ conversations, currentConversation, onSelectConversation, onToggleSidebar, isOpen, isCollapsed = false, onToggleCollapse, onNewConversation, onRenameConversation, onDeleteConversation }: ChatSidebarProps) {
  const { showAlert, AlertComponent } = useCustomAlert();
  const { fonts, spacing, layout, isMobile, width: screenWidth } = useResponsive();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredConvId, setHoveredConvId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const startEditing = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditingTitle(conversation.title);
  };

  const saveEdit = (conversationId: string) => {
    if (editingTitle.trim() && onRenameConversation) {
      onRenameConversation(conversationId, editingTitle.trim());
    }
    setEditingId(null);
    setEditingTitle('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const confirmDelete = (conversation: Conversation) => {
    setMenuOpenId(null); // Close menu

    // Show custom alert instead of window.confirm
    showAlert(
      'Delete Conversation',
      `Are you sure you want to delete "${conversation.title}"?\n\nThis action cannot be undone.`,
      [
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (onDeleteConversation) {
              console.log('[ChatSidebar] Delete confirmed, calling onDeleteConversation');
              onDeleteConversation(conversation.id);
            }
          }
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            console.log('[ChatSidebar] Delete cancelled');
          }
        }
      ]
    );
  };

  const toggleMenu = (convId: string, event?: any) => {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    setMenuOpenId(menuOpenId === convId ? null : convId);
  };

  const handleEdit = (conv: Conversation) => {
    console.log('[handleEdit] Called for:', conv.title);
    setMenuOpenId(null);
    startEditing(conv);
  };

  // Close menu when clicking elsewhere
  useEffect(() => {
    if (menuOpenId) {
      const handleClickOutside = () => {
        setMenuOpenId(null);
      };
      // For web, add event listener
      if (typeof window !== 'undefined') {
        document.addEventListener('click', handleClickOutside);
        return () => {
          document.removeEventListener('click', handleClickOutside);
        };
      }
    }
  }, [menuOpenId]);

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conv => 
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Responsive sidebar width
  const sidebarWidth = isMobile ? screenWidth : layout.sidebarWidth;
  const collapsedWidth = layout.sidebarCollapsedWidth;

  return (
    <>
      <AlertComponent />
      {!isOpen && (
        <TouchableOpacity
          onPress={onToggleSidebar}
          style={[
            styles.burgerButton,
            { 
              minWidth: layout.minTouchTarget, 
              minHeight: layout.minTouchTarget,
              padding: spacing.sm,
            }
          ]}
          accessibilityLabel="Open sidebar"
        >
          <MaterialCommunityIcons name="menu" size={isMobile ? 22 : 24} color="white" />
        </TouchableOpacity>
      )}

      {/* Mobile overlay backdrop */}
      {isMobile && isOpen && (
        <TouchableOpacity
          style={styles.mobileBackdrop}
          activeOpacity={1}
          onPress={onToggleSidebar}
        />
      )}

      <View 
        style={[
          styles.sidebar,
          {
            width: isCollapsed ? collapsedWidth : sidebarWidth,
          },
          isOpen ? styles.sidebarOpen : { transform: [{ translateX: -(isCollapsed ? collapsedWidth : sidebarWidth) }] },
          isMobile && isOpen && styles.sidebarMobileOpen,
        ]}
      >
        <View style={[styles.sidebarHeader, { padding: spacing.lg, gap: spacing.sm }]}>
          <TouchableOpacity 
            style={[
              styles.newConversationButton,
              isCollapsed ? styles.newConversationButtonCollapsed : null,
              { 
                minHeight: layout.minTouchTarget,
                paddingVertical: spacing.md,
              }
            ]}
            onPress={onNewConversation}
          >
            <Ionicons name="add" size={20} color="white" />
            {!isCollapsed && <Text style={[styles.newConversationButtonText, { fontSize: fonts.sm }]}>New Conversation</Text>}
          </TouchableOpacity>
          <View style={[styles.toggleButtonsContainer, { gap: spacing.xs }]}>
            {onToggleCollapse && !isMobile && (
              <TouchableOpacity 
                onPress={onToggleCollapse}
                style={[
                  styles.toggleButton,
                  isCollapsed ? styles.toggleButtonCollapsed : styles.toggleButtonExpanded,
                  { minHeight: layout.minTouchTarget }
                ]}
                accessibilityLabel={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isCollapsed ? <Ionicons name="chevron-forward" size={20} color="#a1a1aa" /> : <MaterialCommunityIcons name="arrow-collapse-left" size={20} color="#a1a1aa" />}
                {!isCollapsed && <Text style={[styles.toggleButtonText, { fontSize: fonts.sm }]}>Collapse</Text>}
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              onPress={onToggleSidebar}
              style={[
                styles.toggleButton,
                isCollapsed ? styles.toggleButtonCollapsed : (onToggleCollapse && !isMobile ? styles.toggleButtonExpanded : styles.toggleButtonFullWidth),
                { minHeight: layout.minTouchTarget }
              ]}
              accessibilityLabel={isCollapsed ? 'Hide sidebar' : 'Hide sidebar'}
            >
              <Ionicons name="chevron-back" size={20} color="#a1a1aa" />
              {!isCollapsed && <Text style={[styles.toggleButtonText, { fontSize: fonts.sm }]}>Hide</Text>}
            </TouchableOpacity>
          </View>
        </View>
        
        {!isCollapsed && (
          <View style={[
            styles.searchContainer,
            { 
              marginHorizontal: spacing.lg, 
              marginBottom: spacing.lg,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
            }
          ]}>
            <Ionicons name="search" size={16} color="#71717a" style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { fontSize: fonts.sm }]}
              placeholder="Search conversations..."
              placeholderTextColor="#71717a"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                onPress={() => setSearchQuery('')} 
                style={[styles.clearButton, { minWidth: layout.minTouchTarget, minHeight: layout.minTouchTarget }]}
              >
                <Ionicons name="close-circle" size={16} color="#71717a" />
              </TouchableOpacity>
            )}
          </View>
        )}
        
        <View style={[styles.conversationsContainer, { paddingHorizontal: spacing.sm }]}>
          {!isCollapsed && <Text style={[styles.recentText, { fontSize: fonts.xs, paddingHorizontal: spacing.sm }]}>Recent</Text>}
          <ScrollView
            style={styles.conversationsScrollView}
            showsVerticalScrollIndicator={false}
          >
            {filteredConversations.length === 0 && searchQuery.length > 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search" size={32} color="#52525b" />
                <Text style={[styles.emptyStateText, { fontSize: fonts.sm }]}>No conversations found</Text>
                <Text style={[styles.emptyStateSubtext, { fontSize: fonts.xs }]}>Try a different search term</Text>
              </View>
            ) : (
              filteredConversations.map((conv) => (
            <View
              key={conv.id}
              style={[
                styles.conversationItem,
                isCollapsed ? styles.conversationItemCollapsed : [styles.conversationItemExpanded, { paddingVertical: spacing.md, paddingHorizontal: spacing.md }],
                currentConversation?.id === conv.id ? styles.conversationItemSelected : styles.conversationItemDefault,
                menuOpenId === conv.id && styles.conversationItemWithOpenMenu,
                { minHeight: layout.minTouchTarget }
              ]}
              // @ts-ignore - onMouseEnter/onMouseLeave work on web
              onMouseEnter={() => setHoveredConvId(conv.id)}
              onMouseLeave={() => setHoveredConvId(null)}
            >
              <TouchableOpacity
                onPress={() => {
                  onSelectConversation(conv);
                  // Close sidebar on mobile after selection
                  if (isMobile) {
                    onToggleSidebar();
                  }
                }}
                style={styles.conversationClickable}
                accessibilityLabel={conv.title}
            >
              {isCollapsed ? (
                <View style={styles.conversationIconCollapsed}>
                  <MaterialCommunityIcons name="message-text-outline" size={20} color={currentConversation?.id === conv.id ? 'white' : '#a1a1aa'} />
                </View>
              ) : (
                <View style={[styles.conversationItemContent, { gap: spacing.sm }]}>
                  <MaterialCommunityIcons name="message-text-outline" size={20} color={currentConversation?.id === conv.id ? 'white' : '#a1a1aa'} />
                  <View style={styles.conversationTextContainer}>
                    {editingId === conv.id ? (
                      <View style={styles.editingContainer}>
                        <TextInput
                          style={[styles.editInput, { fontSize: fonts.sm }]}
                          value={editingTitle}
                          onChangeText={setEditingTitle}
                          onSubmitEditing={() => saveEdit(conv.id)}
                          onBlur={() => saveEdit(conv.id)}
                          autoFocus
                          placeholder="Conversation title"
                          placeholderTextColor="#71717a"
                        />
                      </View>
                    ) : (
                      <>
                    <Text numberOfLines={1} style={[
                      styles.conversationTitle,
                      { fontSize: fonts.sm },
                          currentConversation?.id === conv.id ? styles.conversationTitleSelected : null
                    ]}>{conv.title}</Text>
                        <View style={styles.conversationFooter}>
                          <View style={[styles.conversationMetadata, { gap: spacing.xs }]}>
                            <Text style={[styles.conversationTimestamp, { fontSize: fonts.xs }]}>{formatDate(conv.updated_at)}</Text>
                            {conv.characterCount !== undefined && conv.characterCount > 0 && (
                              <>
                                <Text style={[styles.metadataSeparator, { fontSize: fonts.xs }]}>•</Text>
                                <View style={styles.characterCountBadge}>
                                  <Ionicons name="people" size={10} color="#8b5cf6" />
                                  <Text style={[styles.characterCountText, { fontSize: fonts.xs }]}>{conv.characterCount}</Text>
                                </View>
                              </>
                            )}
                          </View>
                          {(hoveredConvId === conv.id || menuOpenId === conv.id || isMobile) && (
                            <View style={styles.conversationMenuContainer}>
                              <TouchableOpacity 
                                onPress={(e: any) => toggleMenu(conv.id, e)} 
                                style={[styles.menuButton, { minWidth: layout.minTouchTarget, minHeight: layout.minTouchTarget }]}
                              >
                                <Ionicons name="ellipsis-horizontal" size={16} color="#a1a1aa" />
                              </TouchableOpacity>
                              {menuOpenId === conv.id && (
                                <>
                                  <TouchableOpacity
                                    style={styles.menuBackdrop}
                                    onPress={() => setMenuOpenId(null)}
                                    activeOpacity={1}
                                  />
                                  <View style={styles.menuDropdown}>
                                    <TouchableOpacity 
                                      onPress={() => {
                                        console.log('[Menu] Rename clicked');
                                        handleEdit(conv);
                                      }} 
                                      style={[styles.menuItem, { minHeight: layout.minTouchTarget }]}
                                    >
                                      <Ionicons name="pencil" size={14} color="#a1a1aa" />
                                      <Text style={[styles.menuItemText, { fontSize: fonts.sm }]}>Rename</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                      onPress={() => {
                                        console.log('[Menu] Delete clicked');
                                        confirmDelete(conv);
                                      }} 
                                      style={[styles.menuItem, { minHeight: layout.minTouchTarget }]}
                                    >
                                      <Ionicons name="trash-outline" size={14} color="#dc2626" />
                                      <Text style={[styles.menuItemText, styles.menuItemTextDanger, { fontSize: fonts.sm }]}>Delete</Text>
                                    </TouchableOpacity>
                                  </View>
                                </>
                              )}
                            </View>
                          )}
                        </View>
                      </>
                    )}
                  </View>
                </View>
              )}
            </TouchableOpacity>
            </View>
            ))
          )}
          </ScrollView>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  menuBackdrop: {
    // @ts-ignore - web only
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1001,
    backgroundColor: 'transparent',
  },
  mobileBackdrop: {
    // @ts-ignore - web only
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 39,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  burgerButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 50,
    backgroundColor: '#27272a',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebar: {
    backgroundColor: '#171717',
    borderRightWidth: 1,
    borderRightColor: '#27272a',
    flexDirection: 'column',
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    zIndex: 40,
  },
  sidebarMobileOpen: {
    zIndex: 100,
  },
  sidebarOpen: {
    transform: [{ translateX: 0 }],
  },
  sidebarHeader: {
  },
  newConversationButton: {
    backgroundColor: '#27272a',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  newConversationButtonCollapsed: {
    paddingHorizontal: 8,
  },
  newConversationButtonText: {
    color: 'white',
  },
  toggleButtonsContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  toggleButton: {
    paddingVertical: 8,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  toggleButtonCollapsed: {
    width: '100%',
  },
  toggleButtonExpanded: {
    flex: 1,
  },
  toggleButtonFullWidth: {
    width: '100%',
  },
  toggleButtonText: {
    color: '#a1a1aa',
  },
  conversationsContainer: {
    flex: 1,
    paddingBottom: 16,
  },
  conversationsScrollView: {
    flex: 1,
  },
  recentText: {
    color: '#71717a',
    paddingVertical: 4,
  },
  conversationItem: {
    borderRadius: 6,
    marginBottom: 4,
  },
  conversationItemCollapsed: {
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationItemExpanded: {
  },
  conversationItemDefault: {
    backgroundColor: 'transparent',
  },
  conversationItemSelected: {
    backgroundColor: '#27272a',
  },
  conversationItemWithOpenMenu: {
    zIndex: 1000,
    position: 'relative',
  },
  conversationIconCollapsed: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationItemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  conversationTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  conversationTitle: {
    color: '#a1a1aa',
  },
  conversationTitleSelected: {
    color: 'white',
  },
  conversationTimestamp: {
    color: '#52525b',
  },
  conversationMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metadataSeparator: {
    color: '#52525b',
  },
  characterCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#8b5cf6' + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  characterCountText: {
    color: '#8b5cf6',
    fontWeight: '600',
  },
  conversationClickable: {
    flex: 1,
  },
  conversationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  conversationMenuContainer: {
    position: 'relative',
    zIndex: 1002,
  },
  menuButton: {
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuDropdown: {
    position: 'absolute',
    right: 0,
    top: 24,
    backgroundColor: '#27272a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3f3f46',
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1002,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  menuItemText: {
    color: '#d4d4d8',
  },
  menuItemTextDanger: {
    color: '#dc2626',
  },
  editingContainer: {
    flex: 1,
  },
  editInput: {
    backgroundColor: '#27272a',
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: 'white',
  },
  clearButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyStateText: {
    color: '#a1a1aa',
    fontWeight: '600',
    marginTop: 8,
  },
  emptyStateSubtext: {
    color: '#71717a',
    marginTop: 4,
  },
});
