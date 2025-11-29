import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ChatInterface } from '../components/ChatInterface';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { Header } from '../components/Header';
import { ChatSidebar } from '../components/ChatSidebar';
import { useCustomAlert } from '../components/CustomAlert';
import { toggleSidebar, toggleSidebarCollapse } from '../store/actions/uiActions';
import { 
  loadConversations, 
  selectConversation, 
  createConversation,
  saveMessage,
  renameConversation,
  deleteConversation,
  updateMessage,
  deleteMessage
} from '../store/actions/conversationActions';
import { generateAIResponse, DIARY_SYSTEM_PROMPT } from '../services/aiService';
import { getCharacter } from '../config/characters';
import {
  generateMultiCharacterResponses,
  generateSingleCharacterResponse,
  ConversationMessage
} from '../services/multiCharacterConversation';
import SettingsScreen from '../screens/SettingsScreen';
import LibraryScreen from '../screens/LibraryScreen';
import WakattorsScreenEnhanced from '../screens/WakattorsScreenEnhanced';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const dispatch = useDispatch();
  const { showAlert, AlertComponent } = useCustomAlert();
  const { conversations, currentConversation, messages } = useSelector((state: RootState) => state.conversations);
  const { showSidebar, sidebarCollapsed } = useSelector((state: RootState) => state.ui);

  // Load conversations on mount
  useEffect(() => {
    dispatch(loadConversations() as any);
  }, [dispatch]);

  // If no conversation is selected and we have conversations, select the first one
  useEffect(() => {
    if (!currentConversation && conversations.length > 0) {
      dispatch(selectConversation(conversations[0]) as any);
    }
  }, [conversations, currentConversation, dispatch]);

  const onSelectConversation = (conversation: any) => {
    dispatch(selectConversation(conversation) as any);
  };
  
  const onToggleSidebar = () => {
    dispatch(toggleSidebar());
  };
  
  const onToggleCollapse = () => {
    dispatch(toggleSidebarCollapse());
  };

  const onNewConversation = async () => {
    try {
      await dispatch(createConversation('New Conversation') as any);
    } catch (error: any) {
      showAlert('Error', 'Failed to create conversation: ' + error.message);
    }
  };

  const onRenameConversation = async (conversationId: string, newTitle: string) => {
    try {
      await dispatch(renameConversation(conversationId, newTitle) as any);
    } catch (error: any) {
      showAlert('Error', 'Failed to rename conversation: ' + error.message);
    }
  };

  const onDeleteConversation = async (conversationId: string) => {
    try {
      console.log('[MainTabs] Deleting conversation:', conversationId);
      await dispatch(deleteConversation(conversationId) as any);
      console.log('[MainTabs] Delete complete');
    } catch (error: any) {
      console.error('[MainTabs] Delete failed:', error);
      showAlert(
        'Delete Failed',
        error.message || 'Failed to delete conversation. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const onEditMessage = async (messageId: string, newContent: string) => {
    try {
      await dispatch(updateMessage(messageId, newContent) as any);
    } catch (error: any) {
      showAlert('Error', 'Failed to edit message: ' + error.message);
    }
  };

  const onDeleteMessage = async (messageId: string) => {
    try {
      await dispatch(deleteMessage(messageId) as any);
    } catch (error: any) {
      showAlert('Error', 'Failed to delete message: ' + error.message);
    }
  };

  const [isLoadingAI, setIsLoadingAI] = React.useState(false);

  const handleSendMessage = async (content: string, selectedCharacters: string[]) => {
    console.log('[MainTabs] handleSendMessage called with selectedCharacters:', selectedCharacters);

    // Validate that at least one character is selected
    if (!selectedCharacters || selectedCharacters.length === 0) {
      showAlert('No Wakattors Selected', 'Please select at least one Wakattor before sending a message.');
      return;
    }

    setIsLoadingAI(true);
    try {
      // If no current conversation, create one
      let conversation = currentConversation;
      if (!conversation) {
        conversation = await dispatch(createConversation('New Conversation') as any);
      }

      if (conversation) {
        // Save user message (no character ID for user messages)
        await dispatch(saveMessage(conversation.id, 'user', content) as any);

        // Prepare conversation history for multi-character service
        const conversationHistory: ConversationMessage[] = messages.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          characterId: msg.characterId,
          timestamp: new Date(msg.created_at || Date.now()).getTime(),
        }));

        try {
          // Use multi-character conversation service for intelligent responses
          if (selectedCharacters.length > 1) {
            // Multi-character mode: characters can interrupt and react
            console.log('[Chat] Using multi-character mode with:', selectedCharacters);

            const characterResponses = await generateMultiCharacterResponses(
              content,
              selectedCharacters,
              conversationHistory
            );

            // Save each character's response
            for (const response of characterResponses) {
              console.log(`[Chat] Saving message for character ${response.characterId}:`, response.content.substring(0, 50) + '...');
              await dispatch(saveMessage(
                conversation.id,
                'assistant',
                response.content,
                response.characterId
              ) as any);
            }

            console.log(`[Chat] Generated ${characterResponses.length} responses from characters:`, characterResponses.map(r => r.characterId));
          } else {
            // Single character mode: traditional response
            console.log('[Chat] Using single character mode:', selectedCharacters[0]);

            const aiResponse = await generateSingleCharacterResponse(
              content,
              selectedCharacters[0],
              conversationHistory
            );

            await dispatch(saveMessage(
              conversation.id,
              'assistant',
              aiResponse,
              selectedCharacters[0]
            ) as any);
          }
        } catch (aiError: any) {
          console.error('AI generation error:', aiError);
          // Save a fallback message if AI fails completely
          await dispatch(saveMessage(
            conversation.id,
            'assistant',
            "I'm having trouble connecting right now. Your message has been saved, and I'll be back soon!",
            selectedCharacters[0] // Use first selected character for fallback
          ) as any);
        }
      }
    } catch (error: any) {
      showAlert('Error', 'Failed to send message: ' + error.message);
    } finally {
      setIsLoadingAI(false);
    }
  };

  return (
    <View style={styles.fullContainer}>
      <AlertComponent />
      <Header />
      <View style={styles.contentContainer}>
        <ChatSidebar 
          conversations={conversations}
          currentConversation={currentConversation}
          onSelectConversation={onSelectConversation}
          onToggleSidebar={onToggleSidebar}
          isOpen={showSidebar}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={onToggleCollapse}
          onNewConversation={onNewConversation}
          onRenameConversation={onRenameConversation}
          onDeleteConversation={onDeleteConversation}
        />
        <View style={[
          styles.mainContentWrapper,
          showSidebar && !sidebarCollapsed && styles.mainContentWithSidebar,
          showSidebar && sidebarCollapsed && styles.mainContentWithCollapsedSidebar,
        ]}>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: styles.tabBar,
            tabBarActiveTintColor: '#8b5cf6',
            tabBarInactiveTintColor: '#a1a1aa',
            tabBarLabelStyle: styles.tabBarLabel,
            unmountOnBlur: true, // Unmount inactive screens to stop 3D rendering
          }}
        >
          <Tab.Screen 
            name="Chat"
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="chatbox-outline" color={color} size={size} />
              ),
            }}
          >
            {() => (
              <ChatInterface 
                messages={messages}
                onSendMessage={handleSendMessage}
                showSidebar={showSidebar}
                onToggleSidebar={onToggleSidebar}
                isLoading={isLoadingAI}
                onEditMessage={onEditMessage}
                onDeleteMessage={onDeleteMessage}
              />
            )}
          </Tab.Screen>
          <Tab.Screen
            name="Library"
            component={LibraryScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="library" color={color} size={size} />
              ),
            }}
          />
          <Tab.Screen
            name="Wakattors"
            component={WakattorsScreenEnhanced}
            options={{
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="emoticon-happy-outline" color={color} size={size} />
              ),
            }}
          />
          <Tab.Screen 
            name="Settings"
            component={SettingsScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="settings-outline" color={color} size={size} />
              ),
            }}
          />
        </Tab.Navigator>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    position: 'relative',
  },
  mainContentWrapper: {
    flex: 1,
    position: 'relative',
    transition: 'margin-left 0.3s ease',
  },
  mainContentWithSidebar: {
    marginLeft: 224, // Width of expanded sidebar
  },
  mainContentWithCollapsedSidebar: {
    marginLeft: 56, // Width of collapsed sidebar
  },
  tabBar: {
    backgroundColor: '#171717',
    borderTopColor: '#27272a',
  },
  tabBarLabel: {
    fontSize: 12,
  },
});
