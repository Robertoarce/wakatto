import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ChatInterface } from '../components/ChatInterface';
import { View, StyleSheet } from 'react-native';
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
  saveMessage,
  renameConversation,
  deleteConversation,
  updateMessage,
  deleteMessage,
  saveSelectedCharacters
} from '../store/actions/conversationActions';
import { getCharacter } from '../config/characters';
import {
  generateSingleCharacterResponse,
  ConversationMessage
} from '../services/multiCharacterConversation';
import { generateHybridResponse } from '../services/hybridOrchestration';
import { 
  generateAnimatedSceneOrchestration,
  generateAnimatedSceneOrchestrationStreaming,
  EarlyAnimationSetup
} from '../services/singleCallOrchestration';
import { OrchestrationScene, createFallbackScene, fillGapsForNonSpeakers } from '../services/animationOrchestration';
import { ORCHESTRATION_CONFIG } from '../config/llmConfig';
import { isStreamingSupported } from '../services/aiService';
import { generateConversationTitle } from '../services/conversationTitleGenerator';
import { getProfiler, PROFILE_OPS, ProfileSession } from '../services/profilingService';
import { ProfilingDashboard, useProfilingDashboard } from '../components/ProfilingDashboard';
import SettingsScreen from '../screens/SettingsScreen';
import LibraryScreen from '../screens/LibraryScreen';
import AnimationsScreen from '../screens/AnimationsScreen';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const dispatch = useDispatch();
  const store = useStore();
  const { showAlert, AlertComponent } = useCustomAlert();
  const { conversations, currentConversation, messages } = useSelector((state: RootState) => state.conversations);
  const { showSidebar, isFullscreen } = useSelector((state: RootState) => state.ui);
  const { fonts, layout, isMobile, isMobileLandscape, spacing } = useResponsive();
  
  // Ref to prevent duplicate greeting processing
  const isProcessingGreeting = useRef(false);

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
    // Prevent opening sidebar in mobile landscape mode (limited vertical space)
    if (isMobileLandscape && !showSidebar) {
      return;
    }
    dispatch(toggleSidebar());
  };

  const onNewConversation = async () => {
    try {
      // Check if there's already an empty "New Conversation" we can reuse
      // An empty conversation has no messages at all (messageCount === 0)
      const existingEmptyConversation = conversations.find((conv: any) => 
        conv.title === 'New Conversation' && 
        (conv.messageCount === 0 || conv.messageCount === undefined)
      );

      if (existingEmptyConversation) {
        // Just switch to the existing empty conversation - user can change Wakatto there
        console.log('[MainTabs] Reusing existing empty conversation:', existingEmptyConversation.id);
        dispatch(selectConversation(existingEmptyConversation) as any);
        return;
      }

      // No empty conversation found, create a new one
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

  // Handle character selection changes - persist to database
  const handleCharacterSelectionChange = useCallback((characterIds: string[]) => {
    if (currentConversation?.id) {
      console.log('[MainTabs] Saving character selection:', characterIds, 'for conversation:', currentConversation.id);
      dispatch(saveSelectedCharacters(currentConversation.id, characterIds) as any);
    }
  }, [currentConversation?.id, dispatch]);

  const [isLoadingAI, setIsLoadingAI] = React.useState(false);
  const [animationScene, setAnimationScene] = useState<OrchestrationScene | null>(null);
  const [lastProfileSession, setLastProfileSession] = useState<ProfileSession | null>(null);
  const [streamingProgress, setStreamingProgress] = useState<number>(0);
  const [useStreaming, setUseStreaming] = useState<boolean>(true); // Enable streaming by default
  const [earlyAnimationSetup, setEarlyAnimationSetup] = useState<EarlyAnimationSetup | null>(null);
  
  // Profiling dashboard (dev tool)
  const profilingDashboard = useProfilingDashboard();

  const handleSendMessage = async (content: string, selectedCharacters: string[]) => {
    console.log('[MainTabs] handleSendMessage called with selectedCharacters:', selectedCharacters);

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
      // If no current conversation, create one
      let conversation = currentConversation;
      if (!conversation) {
        const createTimer = profiler.start(PROFILE_OPS.DB_CREATE_CONVERSATION);
        conversation = await dispatch(createConversation('New Conversation') as any);
        createTimer.stop();
      }

      if (conversation) {
        // Check if this is the first user message (for title generation)
        const isFirstMessage = messages.length === 0;

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
        if (isFirstMessage && conversation.title === 'New Conversation') {
          console.log('[Chat] Deferring title generation to background');
          const conversationId = conversation.id;
          
          // Run in background - don't await
          (async () => {
            const bgTitleTimer = profiler.start(PROFILE_OPS.TITLE_GENERATION);
            try {
              const generatedTitle = await generateConversationTitle(content);
              console.log('[Chat] Background title generated:', generatedTitle);
              await dispatch(renameConversation(conversationId, generatedTitle) as any);
              bgTitleTimer.stop({ background: true });
            } catch (titleError) {
              bgTitleTimer.stop({ error: String(titleError), background: true });
              console.error('[Chat] Background title generation failed:', titleError);
            }
          })();
        }

        // Prepare conversation history for multi-character service
        // CRITICAL: For first message (new conversation), use empty history to prevent
        // stale messages from previous conversations bleeding through due to React re-render timing
        const conversationHistory: ConversationMessage[] = isFirstMessage ? [] : messages.map(msg => ({
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
            console.log('[Chat] Using animated scene orchestration with:', selectedCharacters);
            console.log('[Chat] Orchestration config:', {
              mode: ORCHESTRATION_CONFIG.mode,
              maxResponders: ORCHESTRATION_CONFIG.singleCall.maxResponders,
              includeGestures: ORCHESTRATION_CONFIG.singleCall.includeGestures,
              includeInterruptions: ORCHESTRATION_CONFIG.singleCall.includeInterruptions
            });

            try {
              // Generate animated scene with timelines
              // Use streaming for faster perceived response when supported
              const shouldUseStreaming = useStreaming && isStreamingSupported();
              console.log('[Chat] Using streaming:', shouldUseStreaming);
              
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
                      console.log('[Chat] Streaming started');
                      setStreamingProgress(5);
                    },
                    onProgress: (_, percentage) => {
                      setStreamingProgress(percentage);
                    },
                    onEarlySetup: (setup) => {
                      // Start animations early while still streaming
                      console.log('[Chat] Early animation setup:', {
                        characters: setup.detectedCharacters,
                        estimatedDuration: setup.estimatedDuration
                      });
                      setEarlyAnimationSetup(setup);
                    },
                    onComplete: (completedScene) => {
                      console.log('[Chat] Streaming complete, scene duration:', completedScene.sceneDuration);
                      setStreamingProgress(100);
                      setEarlyAnimationSetup(null); // Clear early setup once we have real scene
                    },
                    onError: (error) => {
                      console.error('[Chat] Streaming error:', error);
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

              console.log('[Chat] Generated animated scene:', {
                duration: scene.sceneDuration,
                timelines: scene.timelines.length,
                nonSpeakers: Object.keys(scene.nonSpeakerBehavior).length
              });

              // Start animation playback IMMEDIATELY (display first, save in background)
              setAnimationScene(scene);
              setStreamingProgress(0); // Reset progress

              console.log(`[Chat] Generated ${characterResponses.length} animated responses - saving in background`);

              // Save assistant responses in BACKGROUND (non-blocking parallel saves)
              // This allows the UI to show responses immediately while persisting to DB
              const saveAssistantTimer = profiler.start(PROFILE_OPS.DB_SAVE_ASSISTANT_MESSAGE);
              const savePromises = characterResponses.map(response => {
                console.log(`[Chat] Background save for ${response.characterId}:`, {
                  content: response.content.substring(0, 50) + '...',
                  gesture: response.gesture
                });
                return dispatch(saveMessage(
                  conversation.id,
                  'assistant',
                  response.content,
                  response.characterId
                ) as any);
              });
              
              // Fire and forget - don't await, but log completion
              Promise.all(savePromises)
                .then(() => {
                  saveAssistantTimer.stop({ responseCount: characterResponses.length, background: true });
                  console.log('[Chat] Background assistant saves completed');
                })
                .catch((err) => {
                  saveAssistantTimer.stop({ error: String(err), background: true });
                  console.error('[Chat] Background assistant saves failed:', err);
                });

            } catch (animError) {
              console.warn('[Chat] Animated orchestration failed, falling back to hybrid:', animError);
              
              // Fallback to hybrid orchestration
              const characterResponses = await generateHybridResponse(
                content,
                selectedCharacters,
                conversationHistory
              );

              // Create fallback scene for animation
              const fallbackResponses = characterResponses.map(r => ({
                characterId: r.characterId,
                content: r.content
              }));
              const fallbackScene = fillGapsForNonSpeakers(
                createFallbackScene(fallbackResponses, selectedCharacters),
                selectedCharacters
              );
              setAnimationScene(fallbackScene);

              // Save responses in BACKGROUND (non-blocking)
              const saveFallbackTimer = profiler.start(PROFILE_OPS.DB_SAVE_ASSISTANT_MESSAGE);
              const fallbackSavePromises = characterResponses.map(response =>
                dispatch(saveMessage(
                  conversation.id,
                  'assistant',
                  response.content,
                  response.characterId
                ) as any)
              );
              
              Promise.all(fallbackSavePromises)
                .then(() => {
                  saveFallbackTimer.stop({ responseCount: characterResponses.length, fallback: true, background: true });
                })
                .catch((err) => {
                  saveFallbackTimer.stop({ error: String(err), fallback: true, background: true });
                  console.error('[Chat] Background fallback saves failed:', err);
                });
            }
          } else {
            // Single character mode: traditional response with simple animation
            console.log('[Chat] Using single character mode:', selectedCharacters[0]);

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
                console.error('[Chat] Background single character save failed:', err);
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
      
      // End profiling session and log results
      const session = profiler.endSession();
      if (session) {
        setLastProfileSession(session);
        profiler.logSession(session);
        console.log('[Profiling] Session summary:', session.summary);
      }
      
      // Reload conversations to update character count in sidebar
      // Small delay to ensure background message saves complete
      setTimeout(() => {
        dispatch(loadConversations() as any);
      }, 500);
    }
  };

  // Handle character greeting for new conversations
  const handleGreeting = useCallback(async (characterId: string, greetingMessage: string) => {
    // Prevent duplicate greeting processing
    if (isProcessingGreeting.current) {
      console.log('[MainTabs] Already processing greeting, skipping');
      return;
    }
    
    isProcessingGreeting.current = true;
    console.log('[MainTabs] handleGreeting called for character:', characterId);
    
    try {
      // Get the LATEST state from the store (not stale closure value)
      const state = store.getState() as RootState;
      const conversation = state.conversations.currentConversation;
      
      // Only save greeting if there's already a current conversation
      // Do NOT automatically create new conversations - this was causing unwanted "Chat with..." chats
      if (!conversation) {
        console.log('[MainTabs] No current conversation, skipping greeting (prevents auto-creation)');
        return;
      }
      
      // Save the greeting as an assistant message with the character ID
      await dispatch(saveMessage(
        conversation.id, 
        'assistant', 
        greetingMessage, 
        characterId
      ) as any);
      
      console.log('[MainTabs] Greeting saved successfully');
      
      // Reload conversations to update character count in sidebar
      await dispatch(loadConversations() as any);
    } catch (error: any) {
      console.error('[MainTabs] Failed to save greeting:', error);
    } finally {
      isProcessingGreeting.current = false;
    }
  }, [dispatch, store]);

  return (
    <View style={styles.fullContainer}>
      <AlertComponent />
      {!isFullscreen && <Header />}
      <View style={styles.contentContainer}>
        {!isFullscreen && (
          <ChatSidebar 
            conversations={conversations}
            currentConversation={currentConversation}
            onSelectConversation={onSelectConversation}
            onToggleSidebar={onToggleSidebar}
            isOpen={showSidebar}
            onNewConversation={onNewConversation}
            onRenameConversation={onRenameConversation}
            onDeleteConversation={onDeleteConversation}
          />
        )}
        <View style={[
          styles.mainContentWrapper,
          // Only add sidebar margin on non-mobile (mobile uses overlay) and not in fullscreen
          !isMobile && showSidebar && !isFullscreen && { marginLeft: layout.sidebarWidth },
        ]}>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: [
              styles.tabBar,
              { 
                paddingBottom: isMobile ? spacing.xs : spacing.sm,
                paddingTop: isMobile ? spacing.xs : spacing.sm,
              },
              // Hide tab bar in fullscreen mode
              isFullscreen && { display: 'none' },
            ],
            tabBarActiveTintColor: '#8b5cf6',
            tabBarInactiveTintColor: '#a1a1aa',
            tabBarLabelStyle: { fontSize: isMobile ? fonts.xs : fonts.sm },
            tabBarIconStyle: { marginBottom: isMobile ? 2 : 4 },
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
                animationScene={animationScene}
                earlyAnimationSetup={earlyAnimationSetup}
                onGreeting={handleGreeting}
                conversationId={currentConversation?.id}
                savedCharacters={currentConversation?.selected_characters}
                onCharacterSelectionChange={handleCharacterSelectionChange}
              />
            )}
          </Tab.Screen>
          <Tab.Screen
            name="Wakattors"
            component={LibraryScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="emoticon-happy-outline" color={color} size={size} />
              ),
            }}
          />
          <Tab.Screen
            name="Animations"
            component={AnimationsScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="animation-play-outline" color={color} size={size} />
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
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    position: 'relative',
  },
  mainContentWrapper: {
    flex: 1,
    position: 'relative',
    // @ts-ignore - web transition
    transition: 'margin-left 0.3s ease',
  },
  tabBar: {
    backgroundColor: '#171717',
    borderTopColor: '#27272a',
    borderTopWidth: 1,
  },
});
