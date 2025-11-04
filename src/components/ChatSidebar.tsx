import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface Conversation {
  id: string;
  title: string;
  timestamp: Date;
}

interface ChatSidebarProps {
  conversations: Conversation[];
  currentConversation: Conversation;
  onSelectConversation: (conversation: Conversation) => void;
  onToggleSidebar: () => void;
  isOpen: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function ChatSidebar({ conversations, currentConversation, onSelectConversation, onToggleSidebar, isOpen, isCollapsed = false, onToggleCollapse }: ChatSidebarProps) {
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {!isOpen && (
        <TouchableOpacity
          onPress={onToggleSidebar}
          style={styles.burgerButton}
          accessibilityLabel="Open sidebar"
        >
          <MaterialCommunityIcons name="menu" size={24} color="white" />
        </TouchableOpacity>
      )}

      <View 
        style={[
          styles.sidebar,
          isCollapsed ? styles.sidebarCollapsed : styles.sidebarExpanded,
          isOpen ? styles.sidebarOpen : styles.sidebarClosed,
        ]}
      >
        <View style={styles.sidebarHeader}>
          <TouchableOpacity style={[
            styles.newConversationButton,
            isCollapsed ? styles.newConversationButtonCollapsed : null
          ]}>
            <Ionicons name="add" size={20} color="white" />
            {!isCollapsed && <Text style={styles.newConversationButtonText}>New Conversation</Text>}
          </TouchableOpacity>
          <View style={styles.toggleButtonsContainer}>
            {onToggleCollapse && (
              <TouchableOpacity 
                onPress={onToggleCollapse}
                style={[
                  styles.toggleButton,
                  isCollapsed ? styles.toggleButtonCollapsed : styles.toggleButtonExpanded
                ]}
                accessibilityLabel={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isCollapsed ? <Ionicons name="chevron-forward" size={20} color="#a1a1aa" /> : <MaterialCommunityIcons name="arrow-collapse-left" size={20} color="#a1a1aa" />}
                {!isCollapsed && <Text style={styles.toggleButtonText}>Collapse</Text>}
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              onPress={onToggleSidebar}
              style={[
                styles.toggleButton,
                isCollapsed ? styles.toggleButtonCollapsed : (onToggleCollapse ? styles.toggleButtonExpanded : styles.toggleButtonFullWidth)
              ]}
              accessibilityLabel={isCollapsed ? 'Hide sidebar' : 'Hide sidebar'}
            >
              <Ionicons name="chevron-back" size={20} color="#a1a1aa" />
              {!isCollapsed && <Text style={styles.toggleButtonText}>Hide</Text>}
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.conversationsContainer}>
          {!isCollapsed && <Text style={styles.recentText}>Recent</Text>}
          {conversations.map((conv) => (
            <TouchableOpacity
              key={conv.id}
              onPress={() => onSelectConversation(conv)}
              style={[
                styles.conversationItem,
                isCollapsed ? styles.conversationItemCollapsed : styles.conversationItemExpanded,
                currentConversation.id === conv.id ? styles.conversationItemSelected : styles.conversationItemDefault,
              ]}
              accessibilityLabel={conv.title}
            >
              {isCollapsed ? (
                <View style={styles.conversationIconCollapsed}>
                  <MaterialCommunityIcons name="message-text-outline" size={20} color={currentConversation.id === conv.id ? 'white' : '#a1a1aa'} />
                </View>
              ) : (
                <View style={styles.conversationItemContent}>
                  <MaterialCommunityIcons name="message-text-outline" size={20} color={currentConversation.id === conv.id ? 'white' : '#a1a1aa'} />
                  <View style={styles.conversationTextContainer}>
                    <Text numberOfLines={1} style={[
                      styles.conversationTitle,
                      currentConversation.id === conv.id ? styles.conversationTitleSelected : null
                    ]}>{conv.title}</Text>
                    <Text style={styles.conversationTimestamp}>{formatDate(conv.timestamp)}</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  burgerButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 50,
    padding: 8,
    backgroundColor: '#27272a',
    borderRadius: 6,
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
  sidebarCollapsed: {
    width: 56,
  },
  sidebarExpanded: {
    width: 224,
  },
  sidebarOpen: {
    transform: [{ translateX: 0 }],
  },
  sidebarClosed: {
    transform: [{ translateX: -224 }], // Should match sidebarExpanded width
  },
  sidebarHeader: {
    padding: 16,
    gap: 8,
  },
  newConversationButton: {
    backgroundColor: '#27272a',
    paddingVertical: 10,
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
    fontSize: 14,
  },
  toggleButtonsContainer: {
    flexDirection: 'row',
    gap: 4,
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
    fontSize: 14,
  },
  conversationsContainer: {
    flex: 1,
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  recentText: {
    fontSize: 12,
    color: '#71717a',
    paddingHorizontal: 8,
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
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  conversationItemDefault: {
    backgroundColor: 'transparent',
  },
  conversationItemSelected: {
    backgroundColor: '#27272a',
  },
  conversationIconCollapsed: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationItemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  conversationTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  conversationTitle: {
    fontSize: 14,
    color: '#a1a1aa',
  },
  conversationTitleSelected: {
    color: 'white',
  },
  conversationTimestamp: {
    fontSize: 10,
    color: '#52525b',
    marginTop: 2,
  },
});
