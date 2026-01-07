import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, Dimensions, Animated, PanResponder, Platform, GestureResponderEvent, PanResponderGestureState } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCustomAlert } from './CustomAlert';
import { useResponsive } from '../constants/Layout';
import { shadows } from '../utils/shadow';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  characterCount?: number;
  is_tutorial?: boolean;
}

interface ChatSidebarProps {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
  onToggleSidebar: () => void;
  isOpen: boolean;
  onNewConversation?: () => void;
  onBecomePremium?: () => void;
  onJoinConversation?: () => void;
  onRenameConversation?: (conversationId: string, newTitle: string) => void;
  onDeleteConversation?: (conversationId: string) => void;
}

export function ChatSidebar({ conversations, currentConversation, onSelectConversation, onToggleSidebar, isOpen, onNewConversation, onBecomePremium, onJoinConversation, onRenameConversation, onDeleteConversation }: ChatSidebarProps) {
  const { showAlert, AlertComponent } = useCustomAlert();
  const { fonts, spacing, layout, isMobile, width: screenWidth } = useResponsive();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredConvId, setHoveredConvId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null); // Track which conversation is being deleted

  // Drag gesture state
  const sidebarWidth = isMobile ? screenWidth : layout.sidebarWidth;
  
  // Animated value for drag position (0 = closed, sidebarWidth = open)
  const dragPosition = useRef(new Animated.Value(isOpen ? 0 : -sidebarWidth)).current;
  const isDragging = useRef(false);
  const dragStartPosition = useRef(0);
  
  // Update drag position when isOpen changes externally
  useEffect(() => {
    if (!isDragging.current) {
      Animated.spring(dragPosition, {
        toValue: isOpen ? 0 : -sidebarWidth,
        useNativeDriver: Platform.OS !== 'web',
        tension: 65,
        friction: 11,
      }).start();
    }
  }, [isOpen, sidebarWidth]);

  // Edge drag zone width for opening sidebar
  const EDGE_DRAG_WIDTH = 30;
  // Minimum drag distance to trigger open/close
  const DRAG_THRESHOLD = sidebarWidth * 0.3;
  // Velocity threshold for quick swipes
  const VELOCITY_THRESHOLD = 0.5;

  // PanResponder for sidebar drag
  const sidebarPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal gestures
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderGrant: () => {
        isDragging.current = true;
        // @ts-ignore - _value is internal but works
        dragStartPosition.current = dragPosition._value || (isOpen ? 0 : -sidebarWidth);
        dragPosition.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        // Calculate new position
        let newPosition = dragStartPosition.current + gestureState.dx;
        // Clamp between -sidebarWidth (closed) and 0 (open)
        newPosition = Math.max(-sidebarWidth, Math.min(0, newPosition));
        dragPosition.setValue(newPosition);
      },
      onPanResponderRelease: (_, gestureState) => {
        isDragging.current = false;
        
        // Get current position
        // @ts-ignore
        const currentPosition = dragPosition._value || 0;
        
        // Determine if we should open or close based on:
        // 1. Current position past threshold
        // 2. Velocity of swipe
        const movedPastThreshold = currentPosition > -sidebarWidth + DRAG_THRESHOLD;
        const quickSwipeRight = gestureState.vx > VELOCITY_THRESHOLD;
        const quickSwipeLeft = gestureState.vx < -VELOCITY_THRESHOLD;
        
        let shouldOpen: boolean;
        if (quickSwipeRight) {
          shouldOpen = true;
        } else if (quickSwipeLeft) {
          shouldOpen = false;
        } else {
          shouldOpen = movedPastThreshold;
        }
        
        // Animate to final position
        Animated.spring(dragPosition, {
          toValue: shouldOpen ? 0 : -sidebarWidth,
          useNativeDriver: Platform.OS !== 'web',
          tension: 65,
          friction: 11,
        }).start(() => {
          // Update state if it changed
          if (shouldOpen !== isOpen) {
            onToggleSidebar();
          }
        });
      },
      onPanResponderTerminate: () => {
        isDragging.current = false;
        // Snap back to current state
        Animated.spring(dragPosition, {
          toValue: isOpen ? 0 : -sidebarWidth,
          useNativeDriver: Platform.OS !== 'web',
          tension: 65,
          friction: 11,
        }).start();
      },
    })
  ).current;

  // Edge pan responder for opening sidebar when closed
  const edgePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt: GestureResponderEvent) => {
        // Only capture if touch is near left edge and sidebar is closed
        return !isOpen && evt.nativeEvent.pageX < EDGE_DRAG_WIDTH;
      },
      onMoveShouldSetPanResponder: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        // Only respond to rightward horizontal gestures from left edge
        return !isOpen && 
               evt.nativeEvent.pageX < EDGE_DRAG_WIDTH + 20 &&
               gestureState.dx > 0 && 
               Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
               Math.abs(gestureState.dx) > 10;
      },
      onPanResponderGrant: () => {
        isDragging.current = true;
        dragStartPosition.current = -sidebarWidth;
        dragPosition.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        let newPosition = -sidebarWidth + gestureState.dx;
        newPosition = Math.max(-sidebarWidth, Math.min(0, newPosition));
        dragPosition.setValue(newPosition);
      },
      onPanResponderRelease: (_, gestureState) => {
        isDragging.current = false;
        
        // @ts-ignore
        const currentPosition = dragPosition._value || -sidebarWidth;
        const movedPastThreshold = currentPosition > -sidebarWidth + DRAG_THRESHOLD;
        const quickSwipeRight = gestureState.vx > VELOCITY_THRESHOLD;
        
        const shouldOpen = quickSwipeRight || movedPastThreshold;
        
        Animated.spring(dragPosition, {
          toValue: shouldOpen ? 0 : -sidebarWidth,
          useNativeDriver: Platform.OS !== 'web',
          tension: 65,
          friction: 11,
        }).start(() => {
          if (shouldOpen && !isOpen) {
            onToggleSidebar();
          }
        });
      },
      onPanResponderTerminate: () => {
        isDragging.current = false;
        Animated.spring(dragPosition, {
          toValue: -sidebarWidth,
          useNativeDriver: Platform.OS !== 'web',
          tension: 65,
          friction: 11,
        }).start();
      },
    })
  ).current;

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
    // Prevent double-click: if already deleting this conversation, ignore
    if (deletingId === conversation.id) {
      console.log('[ChatSidebar] Delete already in progress for:', conversation.id);
      return;
    }
    
    setMenuOpenId(null); // Close menu

    // Show custom alert instead of window.confirm
    showAlert(
      'Delete Conversation',
      `Are you sure you want to delete "${conversation.title}"?\n\nThis action cannot be undone.`,
      [
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (onDeleteConversation && deletingId !== conversation.id) {
              console.log('[ChatSidebar] Delete confirmed, calling onDeleteConversation');
              setDeletingId(conversation.id); // Mark as deleting
              try {
                await onDeleteConversation(conversation.id);
              } finally {
                setDeletingId(null); // Clear deleting state
              }
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

  return (
    <>
      <AlertComponent />
      {/* Burger button moved to Header component */}

      {/* Edge gesture zone for opening sidebar when closed */}
      {!isOpen && (
        <View
          {...edgePanResponder.panHandlers}
          style={styles.edgeGestureZone}
        />
      )}

      {/* Mobile overlay backdrop */}
      {isMobile && isOpen && (
        <TouchableOpacity
          style={styles.mobileBackdrop}
          activeOpacity={1}
          onPress={onToggleSidebar}
        />
      )}

      <Animated.View 
        style={[
          styles.sidebar,
          {
            width: sidebarWidth,
            transform: [{ translateX: dragPosition }],
          },
          isMobile && isOpen && styles.sidebarMobileOpen,
        ]}
      >
        {/* Drag handle on the right edge of sidebar */}
        <View
          {...sidebarPanResponder.panHandlers}
          style={styles.dragHandle}
        >
          <View style={styles.dragHandleIndicator} />
        </View>
        <View style={[styles.sidebarHeader, { padding: spacing.lg, gap: spacing.sm }]}>
          <TouchableOpacity
            style={[
              styles.newConversationButton,
              {
                minHeight: layout.minTouchTarget,
                paddingVertical: spacing.md,
              }
            ]}
            onPress={onNewConversation}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text style={[styles.newConversationButtonText, { fontSize: fonts.sm }]}>New Conversation</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.joinConversationButton,
              {
                minHeight: layout.minTouchTarget,
                paddingVertical: spacing.md,
              }
            ]}
            onPress={onJoinConversation}
          >
            <Ionicons name="enter-outline" size={20} color="#10b981" />
            <Text style={[styles.joinConversationButtonText, { fontSize: fonts.sm }]}>Join a Conversation</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.premiumButton,
              {
                minHeight: layout.minTouchTarget,
                paddingVertical: spacing.md,
              }
            ]}
            onPress={onBecomePremium}
          >
            <Ionicons name="star" size={20} color="#fbbf24" />
            <Text style={[styles.premiumButtonText, { fontSize: fonts.sm }]}>Become Premium!</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onToggleSidebar}
            style={[
              styles.toggleButton,
              styles.toggleButtonFullWidth,
              { minHeight: layout.minTouchTarget }
            ]}
            accessibilityLabel="Hide sidebar"
          >
            <Ionicons name="chevron-back" size={20} color="#a1a1aa" />
            <Text style={[styles.toggleButtonText, { fontSize: fonts.sm }]}>Hide</Text>
          </TouchableOpacity>
        </View>
        
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
        
        <View style={[styles.conversationsContainer, { paddingHorizontal: spacing.sm }]}>
          <Text style={[styles.recentText, { fontSize: fonts.xs, paddingHorizontal: spacing.sm }]}>Recent</Text>
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
                styles.conversationItemExpanded,
                { paddingVertical: spacing.md, paddingHorizontal: spacing.md },
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
            </TouchableOpacity>
            </View>
            ))
          )}
          </ScrollView>
        </View>
      </Animated.View>
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
    zIndex: 999, // Just below sidebar to cover header and tab bar
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  edgeGestureZone: {
    // @ts-ignore - web only: use fixed to cover entire viewport
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 30,
    zIndex: 35,
    backgroundColor: 'transparent',
  },
  dragHandle: {
    position: 'absolute',
    right: -12,
    top: 0,
    bottom: 0,
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 45,
    // @ts-ignore - web cursor
    cursor: 'ew-resize',
  },
  dragHandleIndicator: {
    width: 4,
    height: 40,
    backgroundColor: '#3f3f46',
    borderRadius: 2,
    opacity: 0.6,
  },
  burgerButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 50,
    backgroundColor: '#f92a82',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebar: {
    backgroundColor: '#171717',
    borderRightWidth: 1,
    borderRightColor: '#27272a',
    flexDirection: 'column',
    // @ts-ignore - web only: use fixed to cover entire viewport including header and tab bar
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 1000, // High z-index to cover header and tab bar
  },
  sidebarMobileOpen: {
    zIndex: 1000,
  },
  sidebarHeader: {
  },
  newConversationButton: {
    backgroundColor: '#10b981',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  newConversationButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  joinConversationButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  joinConversationButtonText: {
    color: '#10b981',
  },
  premiumButton: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  premiumButtonText: {
    color: '#fbbf24',
    fontWeight: '600',
  },
  toggleButton: {
    paddingVertical: 8,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
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
    ...shadows.dropdown,
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
