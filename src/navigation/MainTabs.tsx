import React, { useEffect, useState, useRef, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ChatInterface } from '../components/ChatInterface';
import { View, StyleSheet, Platform, TouchableOpacity, Text } from 'react-native';
import { useSelector, useDispatch, useStore } from 'react-redux';
import { RootState } from '../store';
import { Header } from '../components/Header';
import { ChatSidebar } from '../components/ChatSidebar';
import { useCustomAlert } from '../components/CustomAlert';
import { toggleSidebar, setSidebarOpen } from '../store/actions/uiActions';
import { useResponsive } from '../constants/Layout';
import {
  loadConversations,
  selectConversation,
  createConversation,
  createOrNavigateToTutorial,
  saveMessage,
  renameConversation,
  deleteConversation,
  updateMessage,
  deleteMessage,
} from '../store/actions/conversationActions';
import { getCharacter } from '../config/characters';
import { getBobGreeting } from '../services/characterGreetings';
import {
  generateSingleCharacterResponse,
  ConversationMessage
} from '../services/multiCharacterConversation';
import {
  generateAnimatedSceneOrchestration,
  generateAnimatedSceneOrchestrationStreaming,
  EarlyAnimationSetup
} from '../services/singleCallOrchestration';
import { OrchestrationScene, createFallbackScene, fillGapsForNonSpeakers } from '../services/animationOrchestration';
import { ORCHESTRATION_CONFIG } from '../config/llmConfig';
import { isStreamingSupported, warmupAuthCache, warmupEdgeFunction } from '../services/aiService';
import { generateConversationTitle } from '../services/conversationTitleGenerator';
import { getProfiler, PROFILE_OPS, ProfileSession } from '../services/profilingService';
import { ProfilingDashboard, useProfilingDashboard } from '../components/ProfilingDashboard';
import SettingsScreen from '../screens/SettingsScreen';
import LibraryScreen from '../screens/LibraryScreen';
import AnimationsScreen from '../screens/AnimationsScreen';
import CharacterSelectionScreen from '../screens/CharacterSelectionScreen';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const dispatch = useDispatch();
  const store = useStore();
  const { showAlert, AlertComponent } = useCustomAlert();
  const { conversations, currentConversation, messages } = useSelector((state: RootState) => state.conversations);
  const { showSidebar, isFullscreen } = useSelector((state: RootState) => state.ui);
  const { currentUsage } = useSelector((state: RootState) => state.usage);
  const { layout, isMobile, isMobileLandscape, spacing } = useResponsive();

  // Check if user is admin (for restricted features)
  const isAdmin = currentUsage?.tier === 'admin';
  
  // Ref to prevent duplicate greeting processing
  const isProcessingGreeting = useRef(false);

  // Ref to prevent duplicate tutorial creation
  const isCreatingTutorial = useRef(false);

  // Track if conversations have been loaded at least once
  const [conversationsLoaded, setConversationsLoaded] = useState(false);

  // State for character selection screen (new conversation flow)
  const [showCharacterSelection, setShowCharacterSelection] = useState(false);

  // State for active tab (custom tab bar since Tab.Navigator doesn't work on web)
  type TabName = 'Home' | 'Wakattors' | 'Library' | 'Animations' | 'Settings';
  const [activeTab, setActiveTab] = useState<TabName>('Home');

  // Hide sidebar by default
  useEffect(() => {
    dispatch(setSidebarOpen(false));
  }, [dispatch]);

  // Auto-hide sidebar in mobile landscape mode (limited vertical space)
  useEffect(() => {
    if (isMobileLandscape && showSidebar) {
      dispatch(setSidebarOpen(false));
    }
  }, [isMobileLandscape, showSidebar, dispatch]);

  // Load conversations on mount and warm up services
  useEffect(() => {
    dispatch(loadConversations() as any).then(() => {
      setConversationsLoaded(true);
    });

    // Warm up auth cache and edge function to reduce TTFT
    warmupAuthCache();
    warmupEdgeFunction();
  }, [dispatch]);

  // If no conversation is selected and we have conversations, select the first one
  useEffect(() => {
    // console.log('[MainTabs:AutoSelect] Effect triggered:', {
    //   hasCurrentConversation: !!currentConversation,
    //   currentConversationId: currentConversation?.id,
    //   currentConversationSelectedChars: currentConversation?.selected_characters,
    //   conversationsCount: conversations.length,
    // });
    if (!currentConversation && conversations.length > 0) {
      // console.log('[MainTabs:AutoSelect] Selecting first conversation:', conversations[0].id, 'selected_characters:', conversations[0].selected_characters);
      dispatch(selectConversation(conversations[0]) as any);
    }
  }, [conversations, currentConversation, dispatch]);

  // Create tutorial conversation for users with no conversations
  useEffect(() => {
    const createTutorialIfNeeded = async () => {
      // Only run after conversations are loaded and if there are none
      if (!conversationsLoaded || conversations.length > 0 || isCreatingTutorial.current) {
        return;
      }

      isCreatingTutorial.current = true;

      try {
        // Use unified tutorial creation action (handles greeting, is_tutorial flag, etc.)
        await dispatch(createOrNavigateToTutorial() as any);
      } catch (error) {
        console.error('[MainTabs] Failed to create tutorial:', error);
        isCreatingTutorial.current = false; // Allow retry on failure
      }
    };

    createTutorialIfNeeded();
  }, [conversationsLoaded, conversations.length, dispatch]);

  const onSelectConversation = (conversation: any) => {
    dispatch(selectConversation(conversation) as any);
  };
  
  const onToggleSidebar = () => {
    // Prevent opening sidebar in mobile landscape mode (limited vertical space)
    if (isMobileLandscape && !showSidebar) {
      return;
    }
    dispatch(toggleSidebar());
  };

  // Show character selection screen when starting a new conversation
  const onNewConversation = () => {
    setShowCharacterSelection(true);
  };

  // Start or navigate to tutorial conversation with Bob
  const onTutorial = async () => {
    // Prevent double-click issues
    if (isCreatingTutorial.current) return;

    isCreatingTutorial.current = true;

    try {
      await dispatch(createOrNavigateToTutorial() as any);

      // Close sidebar on mobile after navigation
      if (isMobile && showSidebar) {
        dispatch(setSidebarOpen(false));
      }
    } catch (error: any) {
      showAlert('Error', 'Failed to open tutorial: ' + error.message);
    } finally {
      isCreatingTutorial.current = false;
    }
  };

  // Handle starting conversation with selected characters
  const onStartConversationWithCharacters = async (selectedCharacterIds: string[]) => {
    try {
      await dispatch(createConversation('New Conversation', selectedCharacterIds) as any);
      setShowCharacterSelection(false);
    } catch (error: any) {
      showAlert('Error', 'Failed to create conversation: ' + error.message);
    }
  };

  // Cancel character selection and return to conversation list
  const onCancelCharacterSelection = () => {
    setShowCharacterSelection(false);
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
      await dispatch(deleteConversation(conversationId) as any);
    } catch (error: any) {
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

  // Characters are now fixed at conversation creation - no dynamic changes needed

  const [isLoadingAI, setIsLoadingAI] = React.useState(false);
  const [animationScene, setAnimationScene] = useState<OrchestrationScene | null>(null);
  const [lastProfileSession, setLastProfileSession] = useState<ProfileSession | null>(null);
  const [streamingProgress, setStreamingProgress] = useState<number>(0);
  const [useStreaming, setUseStreaming] = useState<boolean>(true); // Enable streaming by default
  const [earlyAnimationSetup, setEarlyAnimationSetup] = useState<EarlyAnimationSetup | null>(null);
  
  // Profiling dashboard (dev tool)
  const profilingDashboard = useProfilingDashboard();

  // Test poem for testing speech bubble and message list rendering
  const TEST_POEM = `In the quiet hours of the digital night,
Where pixels dance in pale moonlight,
The Wakattors gather, wise and true,
To share their thoughts with only you.

Each word appears like morning dew,
Line by line, the message grew.
No jumping words, no sudden shifts,
Just flowing text, a gentle gift.

This poem tests the bubbles well,
To see if words stay where they dwell.
Pre-calculated, line by line,
The typography should look just fine.

So watch the letters as they flow,
From start to finish, soft and slow.
If all goes well, you'll clearly see,
The text behaves as it should be.`;

  // Handle test poem button - triggers test poem without user input
  const handleTestPoem = useCallback(async () => {
    const conversation = currentConversation;
    if (!conversation) {
      showAlert('No Conversation', 'Please start a conversation first.');
      return;
    }

    // Get selected characters from current conversation
    const selectedChars = conversation.selected_characters || [];
    if (selectedChars.length === 0) {
      showAlert('No Wakattors', 'Please select at least one Wakattor.');
      return;
    }

    setIsLoadingAI(true);

    try {
      // Create test scene with the poem
      const testCharacter = selectedChars[0];
      const testScene = fillGapsForNonSpeakers(
        createFallbackScene([{ characterId: testCharacter, content: TEST_POEM }], selectedChars),
        selectedChars
      );
      setAnimationScene(testScene);

      // Save test poem as assistant message
      await dispatch(saveMessage(
        conversation.id,
        'assistant',
        TEST_POEM,
        testCharacter
      ) as any);
    } catch (error: any) {
      showAlert('Error', 'Failed to play test poem: ' + error.message);
    } finally {
      setIsLoadingAI(false);
    }
  }, [currentConversation, dispatch, showAlert]);

  const handleSendMessage = async (content: string, selectedCharacters: string[]) => {
    // Validate that at least one character is selected
    if (!selectedCharacters || selectedCharacters.length === 0) {
      showAlert('No Wakattors Selected', 'Please select at least one Wakattor before sending a message.');
      return;
    }

    // Start profiling session
    const profiler = getProfiler();
    profiler.startSession(`message_${Date.now()}`);
    const fullFlowTimer = profiler.start(PROFILE_OPS.FULL_MESSAGE_FLOW);

    setIsLoadingAI(true);
    try {
      // Conversations must have fixed characters - user must create one via character selection first
      let conversation = currentConversation;
      if (!conversation) {
        showAlert('No Conversation', 'Please start a new conversation first by selecting characters.');
        setIsLoadingAI(false);
        fullFlowTimer.stop();
        return;
      }

      if (conversation) {
        // Check if this is the first USER message (for title generation)
        // Count only user messages, not assistant greetings
        const userMessageCount = messages.filter(m => m.role === 'user').length;
        const isFirstUserMessage = userMessageCount === 0;

        // Save user message in BACKGROUND (non-blocking parallel save)
        // This allows AI generation to start immediately while message is being saved
        const saveUserMsgTimer = profiler.start(PROFILE_OPS.DB_SAVE_USER_MESSAGE);
        // Fire and forget - dispatch returns a promise but we don't await it
        dispatch(saveMessage(conversation.id, 'user', content) as any)
          .then(() => {
            saveUserMsgTimer.stop({ background: true });
          })
          .catch((err: any) => {
            saveUserMsgTimer.stop({ error: String(err), background: true });
            console.error('[Chat] Background user message save failed:', err);
          });

        // Generate conversation title in BACKGROUND (deferred - doesn't block AI response)
        // This saves 1-2 seconds on first message by not waiting for title generation
        // Also handle 'Tutorial' conversations that need renaming after first user message
        const needsTitleGeneration = isFirstUserMessage &&
          (conversation.title === 'New Conversation' || conversation.title === 'Tutorial');

        if (needsTitleGeneration) {
          const conversationId = conversation.id;

          // Run in background - don't await
          (async () => {
            const bgTitleTimer = profiler.start(PROFILE_OPS.TITLE_GENERATION);
            try {
              const generatedTitle = await generateConversationTitle(content);
              await dispatch(renameConversation(conversationId, generatedTitle) as any);
              bgTitleTimer.stop({ background: true });
            } catch (titleError) {
              bgTitleTimer.stop({ error: String(titleError), background: true });
            }
          })();
        }

        // Prepare conversation history for multi-character service
        // Include all existing messages (greetings, etc.) for context
        const conversationHistory: ConversationMessage[] = messages.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          characterId: msg.characterId,
          timestamp: new Date(msg.created_at || Date.now()).getTime(),
        }));

        try {
          // Clear previous animation scene
          setAnimationScene(null);

          // Use animated scene orchestration for all multi-character conversations
          if (selectedCharacters.length > 1) {
            // Multi-character mode: Animated scene orchestration
            // Generate animated scene with timelines
            // Use streaming for faster perceived response when supported
            const shouldUseStreaming = useStreaming && isStreamingSupported();
              
              let scene: OrchestrationScene;
              let characterResponses: any[];
              
              if (shouldUseStreaming) {
                // Streaming version - shows progress during generation
                setStreamingProgress(0);
                setEarlyAnimationSetup(null); // Clear previous early setup

                const result = await generateAnimatedSceneOrchestrationStreaming(
                  content,
                  selectedCharacters,
                  conversationHistory,
                  {
                    onStart: () => {
                      setStreamingProgress(5);
                    },
                    onProgress: (_, percentage) => {
                      setStreamingProgress(percentage);
                    },
                    onEarlySetup: (setup) => {
                      setEarlyAnimationSetup(setup);
                    },
                    onComplete: () => {
                      setStreamingProgress(100);
                      setEarlyAnimationSetup(null);
                    },
                    onError: () => {
                      setEarlyAnimationSetup(null);
                    },
                  }
                );
                scene = result.scene;
                characterResponses = result.responses;
              } else {
                // Non-streaming version
                const result = await generateAnimatedSceneOrchestration(
                  content,
                  selectedCharacters,
                  conversationHistory
                );
                scene = result.scene;
                characterResponses = result.responses;
              }

              // Profile animation setup for multi-character
              const animSetupTimer = profiler.start(PROFILE_OPS.ANIMATION_SETUP);
              // Start animation playback IMMEDIATELY (display first, save in background)
              setAnimationScene(scene);
              setStreamingProgress(0); // Reset progress
              animSetupTimer.stop({ characterCount: selectedCharacters.length, multiCharacter: true });

              // Save assistant responses in BACKGROUND (non-blocking parallel saves)
              // This allows the UI to show responses immediately while persisting to DB
              const saveAssistantTimer = profiler.start(PROFILE_OPS.DB_SAVE_ASSISTANT_MESSAGE);
              const savePromises = characterResponses.map(response =>
                dispatch(saveMessage(
                  conversation.id,
                  'assistant',
                  response.content,
                  response.characterId
                ) as any)
              );

              // Fire and forget - don't await
              Promise.all(savePromises)
                .then(() => {
                  saveAssistantTimer.stop({ responseCount: characterResponses.length, background: true });
                })
                .catch((err) => {
                  saveAssistantTimer.stop({ error: String(err), background: true });
                });

          } else {
            // Single character mode: traditional response with simple animation

            const aiResponse = await generateSingleCharacterResponse(
              content,
              selectedCharacters[0],
              conversationHistory
            );

            // Create simple animation scene for single character
            const animSetupTimer = profiler.start(PROFILE_OPS.ANIMATION_SETUP);
            const singleCharScene = fillGapsForNonSpeakers(
              createFallbackScene([{ characterId: selectedCharacters[0], content: aiResponse }], selectedCharacters),
              selectedCharacters
            );
            setAnimationScene(singleCharScene);
            animSetupTimer.stop();

            // Save single character response in BACKGROUND (non-blocking)
            const saveSingleTimer = profiler.start(PROFILE_OPS.DB_SAVE_ASSISTANT_MESSAGE);
            dispatch(saveMessage(
              conversation.id,
              'assistant',
              aiResponse,
              selectedCharacters[0]
            ) as any)
              .then(() => {
                saveSingleTimer.stop({ responseCount: 1, background: true });
              })
              .catch((err: any) => {
                saveSingleTimer.stop({ error: String(err), background: true });
              });
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
      
      // Stop full flow timer on success
      fullFlowTimer.stop({ characterCount: selectedCharacters.length });
    } catch (error: any) {
      fullFlowTimer.stop({ error: error.message });
      showAlert('Error', 'Failed to send message: ' + error.message);
    } finally {
      setIsLoadingAI(false);
      
      // End profiling session
      const session = profiler.endSession();
      if (session) {
        setLastProfileSession(session);
        profiler.logSession(session);
      }
      
      // Reload conversations to update character count in sidebar
      // Small delay to ensure background message saves complete
      setTimeout(() => {
        dispatch(loadConversations() as any);
      }, 500);
    }
  };

  // Handle character greeting for new conversations
  // Note: Removed isProcessingGreeting blocking to allow multiple character greetings to be saved
  const handleGreeting = useCallback(async (characterId: string, greetingMessage: string) => {

    try {
      // Get the LATEST state from the store (not stale closure value)
      let conversation = store.getState().conversations.currentConversation;

      // Retry up to 3 times if conversation not yet set (race condition with Redux)
      if (!conversation) {
        for (let i = 0; i < 3; i++) {
          await new Promise(resolve => setTimeout(resolve, 200));
          conversation = store.getState().conversations.currentConversation;
          if (conversation) {
            console.log('[MainTabs] Conversation found after retry', i + 1);
            break;
          }
        }
      }

      // Only save greeting if there's a current conversation
      if (!conversation) {
        console.warn('[MainTabs] No current conversation after retries, skipping greeting');
        return;
      }

      // Save the greeting as an assistant message with the character ID
      await dispatch(saveMessage(
        conversation.id,
        'assistant',
        greetingMessage,
        characterId
      ) as any);

      console.log('[MainTabs] Greeting saved successfully for', characterId);
    } catch (error: any) {
      console.error('[MainTabs] Failed to save greeting:', error);
    }
  }, [dispatch, store]);

  // Handle saving idle conversation messages (characters talking to each other)
  const handleSaveIdleMessage = useCallback(async (characterId: string, content: string, metadata?: Record<string, any>) => {
    console.log('[MainTabs] handleSaveIdleMessage called for character:', characterId);

    try {
      // Get the LATEST state from the store
      const state = store.getState() as RootState;
      const conversation = state.conversations.currentConversation;

      if (!conversation) {
        console.log('[MainTabs] No current conversation, skipping idle message save');
        return;
      }

      // Save the idle message as an assistant message with metadata
      await dispatch(saveMessage(
        conversation.id,
        'assistant',
        content,
        characterId,
        metadata
      ) as any);

      console.log('[MainTabs] Idle message saved successfully');
    } catch (error: any) {
      console.error('[MainTabs] Failed to save idle message:', error);
    }
  }, [dispatch, store]);

  // Show character selection screen for new conversation
  if (showCharacterSelection) {
    return (
      <View style={styles.fullContainer}>
        <AlertComponent />
        <CharacterSelectionScreen
          onStartConversation={onStartConversationWithCharacters}
          onCancel={onCancelCharacterSelection}
        />
      </View>
    );
  }

  return (
    <View style={styles.fullContainer}>
      <AlertComponent />
      {/* Sidebar rendered at root level to cover entire screen including header and tab bar */}
      {!isFullscreen && (
        <ChatSidebar
          conversations={conversations}
          currentConversation={currentConversation}
          onSelectConversation={onSelectConversation}
          onToggleSidebar={onToggleSidebar}
          isOpen={showSidebar}
          onNewConversation={onNewConversation}
          onTutorial={onTutorial}
          onRenameConversation={onRenameConversation}
          onDeleteConversation={onDeleteConversation}
        />
      )}
      {!isFullscreen && <Header />}
      <View style={styles.contentContainer}>
        <View style={[
          styles.mainContentWrapper,
          // Only add sidebar margin on non-mobile (mobile uses overlay) and not in fullscreen
          !isMobile && showSidebar && !isFullscreen && { marginLeft: layout.sidebarWidth },
        ]}>
        {/*
          KNOWN ISSUE (2025-12-31): Tab.Navigator from @react-navigation/bottom-tabs doesn't render content on web
          when nested inside custom navigation context (SimpleNavContext from AppNavigator).

          ISSUE: The Tab.Navigator mounts but never renders its screen content.
          WORKAROUND: Render screens directly with custom tab bar implementation.

          TODO: Investigate if this is fixable with proper linking config or by restructuring navigation.
          Date: 2025-12-31
        */}
        {/* Render active screen based on tab */}
        {activeTab === 'Home' && (
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            showSidebar={showSidebar}
            onToggleSidebar={onToggleSidebar}
            isLoading={isLoadingAI}
            onEditMessage={onEditMessage}
            onDeleteMessage={onDeleteMessage}
            animationScene={animationScene}
            earlyAnimationSetup={earlyAnimationSetup}
            onGreeting={handleGreeting}
            conversationId={currentConversation?.id}
            savedCharacters={currentConversation?.selected_characters}
            onSaveIdleMessage={handleSaveIdleMessage}
          />
        )}
        {activeTab === 'Library' && <LibraryScreen />}
        {activeTab === 'Animations' && <AnimationsScreen />}
        {activeTab === 'Settings' && <SettingsScreen />}
        </View>
      </View>

      {/* Custom Bottom Tab Bar - workaround for Tab.Navigator not working on web */}
      {!isFullscreen && (
        <View style={styles.customTabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'Home' && styles.tabItemActive]}
            onPress={() => setActiveTab('Home')}
          >
            <Ionicons
              name={activeTab === 'Home' ? 'chatbubbles' : 'chatbubbles-outline'}
              size={22}
              color={activeTab === 'Home' ? '#5398BE' : '#71717a'}
            />
            <Text style={[styles.tabLabel, activeTab === 'Home' && styles.tabLabelActive]}>
              Chat
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'Library' && styles.tabItemActive]}
            onPress={() => setActiveTab('Library')}
          >
            <Ionicons
              name={activeTab === 'Library' ? 'library' : 'library-outline'}
              size={22}
              color={activeTab === 'Library' ? '#5398BE' : '#71717a'}
            />
            <Text style={[styles.tabLabel, activeTab === 'Library' && styles.tabLabelActive]}>
              Library
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'Animations' && styles.tabItemActive]}
            onPress={() => setActiveTab('Animations')}
          >
            <MaterialCommunityIcons
              name={activeTab === 'Animations' ? 'animation-play' : 'animation-play-outline'}
              size={22}
              color={activeTab === 'Animations' ? '#5398BE' : '#71717a'}
            />
            <Text style={[styles.tabLabel, activeTab === 'Animations' && styles.tabLabelActive]}>
              Animations
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'Settings' && styles.tabItemActive]}
            onPress={() => setActiveTab('Settings')}
          >
            <Ionicons
              name={activeTab === 'Settings' ? 'settings' : 'settings-outline'}
              size={22}
              color={activeTab === 'Settings' ? '#5398BE' : '#71717a'}
            />
            <Text style={[styles.tabLabel, activeTab === 'Settings' && styles.tabLabelActive]}>
              Settings
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Profiling Dashboard - toggle with Ctrl/Cmd + Shift + P */}
      <ProfilingDashboard
        visible={profilingDashboard.visible}
        onClose={profilingDashboard.hide}
        session={lastProfileSession}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    // @ts-ignore - web-specific: minHeight 0 required for nested flex scrolling
    ...Platform.select({
      web: {
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      },
    }),
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    position: 'relative',
    // @ts-ignore - web specific
    ...Platform.select({
      web: {
        minHeight: 0,
        overflow: 'hidden',
        // Don't use height: '100%' here - let flex handle it so tab bar is respected
      },
    }),
  },
  mainContentWrapper: {
    flex: 1,
    position: 'relative',
    // @ts-ignore - web transition
    transition: 'margin-left 0.3s ease',
    // @ts-ignore - web specific
    ...Platform.select({
      web: {
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        // Don't use height: '100%' - let flex handle sizing
        // Don't use overflow: 'hidden' - characters need overflow: visible
      },
    }),
  },
  tabBar: {
    backgroundColor: '#171717',
    borderTopColor: '#27272a',
    borderTopWidth: 1,
  },
  // Custom bottom tab bar styles
  customTabBar: {
    flexDirection: 'row',
    backgroundColor: '#171717',
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 2,
  },
  tabItemActive: {
    // Active state styling handled by icon/text color
  },
  tabLabel: {
    fontSize: 11,
    color: '#71717a',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#5398BE',
    fontWeight: '600',
  },
});
