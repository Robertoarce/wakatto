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
import SettingsScreen from '../screens/SettingsScreen';
import CharactersScreen from '../screens/CharactersScreen';
// import Model3DTestScreen from '../screens/Model3DTestScreen'; // Temporarily disabled - missing dependencies

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
  
  const handleSendMessage = async (content: string) => {
    setIsLoadingAI(true);
    try {
      // If no current conversation, create one
      let conversation = currentConversation;
      if (!conversation) {
        conversation = await dispatch(createConversation('New Conversation') as any);
      }

      if (conversation) {
        // Save user message
        await dispatch(saveMessage(conversation.id, 'user', content) as any);
        
        // Generate AI response
        try {
          // Prepare conversation history for AI
          const conversationHistory = messages.map(msg => ({
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content,
          }));
          
          // Add the new user message
          conversationHistory.push({ role: 'user', content });

          // Generate AI response
          const aiResponse = await generateAIResponse(conversationHistory, DIARY_SYSTEM_PROMPT);
          
          // Save AI response
          await dispatch(saveMessage(conversation.id, 'assistant', aiResponse) as any);
        } catch (aiError: any) {
          console.error('AI generation error:', aiError);
          // Save a fallback message if AI fails
          await dispatch(saveMessage(
            conversation.id, 
            'assistant', 
            "I'm having trouble connecting right now. Your message has been saved, and I'll be back soon!"
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
            name="Characters"
            component={CharactersScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="account-group-outline" color={color} size={size} />
              ),
            }}
          />
          {/* Temporarily disabled - missing 3D dependencies
          <Tab.Screen
            name="3D Models"
            component={Model3DTestScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="cube-outline" color={color} size={size} />
              ),
            }}
          />
          */}
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
