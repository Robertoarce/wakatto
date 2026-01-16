import React, { useEffect, useState, useRef, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ChatInterface } from '../components/ChatInterface';
import { JoinConversation } from '../components/JoinConversation';
import { View, StyleSheet, Platform, TouchableOpacity, Text } from 'react-native';
import { useSelector, useDispatch, useStore } from 'react-redux';
import { RootState } from '../store';
import { Header } from '../components/Header';
import { ChatSidebar } from '../components/ChatSidebar';
import { useCustomAlert } from '../components/CustomAlert';
import { toggleSidebar, setSidebarOpen } from '../store/actions/uiActions';
import { useResponsive } from '../constants/Layout';
import { useSimpleNavigation } from './AppNavigator';
import {
  loadConversations,
  selectConversation,
  createConversation,
  createOrNavigateToTutorial,
  saveMessage,
  renameConversation,
  deleteConversation,
  deleteMessage,
} from '../store/actions/conversationActions';
import { getCharacter } from '../config/characters';
import { getBobGreeting, getBobPostTrialPitch } from '../services/characterGreetings';
import { ConversationMessage } from '../services/multiCharacterConversation';
import {
  generateAnimatedSceneOrchestration,
  generateAnimatedSceneOrchestrationStreaming,
  EarlyAnimationSetup
} from '../services/singleCallOrchestration';
import { OrchestrationScene, createFallbackScene, fillGapsForNonSpeakers } from '../services/animationOrchestration';
import { isStreamingSupported, warmupAuthCache, warmupEdgeFunction } from '../services/aiService';
import { generateConversationTitle } from '../services/conversationTitleGenerator';
import { getProfiler, PROFILE_OPS, ProfileSession } from '../services/profilingService';
import { 
  messageQueueService, 
  formatBatchedMessages, 
  hasMultipleUsers,
  type MessageBatch,
  type QueuedMessage 
} from '../services/messageQueueService';
import { supabase } from '../lib/supabase';
import { ProfilingDashboard, useProfilingDashboard } from '../components/ProfilingDashboard';
import SettingsScreen from '../screens/SettingsScreen';
import LibraryScreen from '../screens/LibraryScreen';
import AnimationsScreen from '../screens/AnimationsScreen';
import CharacterSelectionScreen from '../screens/CharacterSelectionScreen';
import { fetchOnboarding, incrementOnboardingMessageCount } from '../store/actions/usageActions';
import { 
  isTrialWakattor, 
  isBobCharacter,
  isSubscriber,
  BOB_CHARACTER_ID,
} from '../services/onboardingService';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const dispatch = useDispatch();
  const store = useStore();
  const { showAlert, AlertComponent } = useCustomAlert();
  const { conversations, currentConversation, messages } = useSelector((state: RootState) => state.conversations);
  const { showSidebar, isFullscreen } = useSelector((state: RootState) => state.ui);
  const { currentUsage, onboarding } = useSelector((state: RootState) => state.usage);
  const { layout, isMobile, isMobileLandscape, spacing } = useResponsive();
  
  // Deep link: Get pending join code from navigation context
  const { pendingJoinCode, consumeJoinCode } = useSimpleNavigation();

  // Check if user is admin (for restricted features)
  const isAdminUser = currentUsage?.tier === 'admin';
  
  // Ref to prevent duplicate greeting processing
  const isProcessingGreeting = useRef(false);

  // Ref to prevent duplicate tutorial creation
  const isCreatingTutorial = useRef(false);

  // Track if conversations have been loaded at least once
  const [conversationsLoaded, setConversationsLoaded] = useState(false);

  // State for character selection screen (new conversation flow)
  const [showCharacterSelection, setShowCharacterSelection] = useState(false);

  // State for join conversation modal (from sidebar)
  const [showJoinModalFromSidebar, setShowJoinModalFromSidebar] = useState(false);

  // State for premium pitch trigger (from "Become Premium" button)
  const [triggerPremiumPitch, setTriggerPremiumPitch] = useState(false);

  // State for multi-user message queue
  const [isQueueProcessing, setIsQueueProcessing] = useState(false);
  const currentUserRef = useRef<{ id: string; email?: string } | null>(null);

  // Track when we last finished generating to avoid re-animating our own messages
  // The real-time handler will skip animations for messages arriving within this grace period
  const lastGenerationTimestampRef = useRef<number>(0);
  const GENERATION_GRACE_PERIOD_MS = 5000; // 5 seconds grace period after our own generation

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

    // Fetch onboarding state
    dispatch(fetchOnboarding() as any);

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

  // Get current user for message queue
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        currentUserRef.current = { id: user.id, email: user.email || undefined };
      }
    };
    fetchUser();
  }, []);

  // Process a batch of messages (called by message queue)
  const processBatchedMessages = useCallback(async (batch: MessageBatch) => {
    if (!currentConversation) return;

    const profiler = getProfiler();
    profiler.startSession(`batch_${Date.now()}`);
    const fullFlowTimer = profiler.start(PROFILE_OPS.FULL_MESSAGE_FLOW);

    try {
      // Format batched messages for LLM
      const formattedContent = formatBatchedMessages(batch.messages);
      const isMultiUser = hasMultipleUsers(batch.messages);

      console.log('[MainTabs] Processing batch:', {
        messageCount: batch.messages.length,
        isMultiUser,
        characters: batch.selectedCharacters.length,
      });

      // Save each user message to DB (fire and forget)
      for (const msg of batch.messages) {
        dispatch(saveMessage(
          batch.conversationId,
          'user',
          msg.content,
          undefined,
          { sender_id: msg.userId, sender_email: msg.userEmail }
        ) as any).catch((err: any) => {
          console.error('[Chat] Failed to save batched user message:', err);
        });
      }

      // Prepare conversation history
      const conversationHistory: ConversationMessage[] = messages.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        characterId: msg.characterId,
        timestamp: new Date(msg.created_at || Date.now()).getTime(),
      }));

      // Generate response using single-call orchestration for all character counts
      setAnimationScene(null);

      const shouldUseStreaming = useStreaming && isStreamingSupported();

      let scene: OrchestrationScene;
      let characterResponses: any[];

      if (shouldUseStreaming) {
        setStreamingProgress(0);
        setEarlyAnimationSetup(null);

        const result = await generateAnimatedSceneOrchestrationStreaming(
          formattedContent,
          batch.selectedCharacters,
          conversationHistory,
          {
            onStart: () => setStreamingProgress(5),
            onProgress: (_, percentage) => setStreamingProgress(percentage),
            onEarlySetup: (setup) => setEarlyAnimationSetup(setup),
            onComplete: () => {
              setStreamingProgress(100);
              setEarlyAnimationSetup(null);
            },
            onError: () => setEarlyAnimationSetup(null),
          },
          undefined,
          batch.conversationId
        );
        scene = result.scene;
        characterResponses = result.responses;
      } else {
        const result = await generateAnimatedSceneOrchestration(
          formattedContent,
          batch.selectedCharacters,
          conversationHistory,
          undefined,
          batch.conversationId
        );
        scene = result.scene;
        characterResponses = result.responses;
      }

      setAnimationScene(scene);
      setStreamingProgress(0);

      // Save responses (fire and forget)
      const savePromises = characterResponses.map(response =>
        dispatch(saveMessage(
          batch.conversationId,
          'assistant',
          response.content,
          response.characterId
        ) as any)
      );
      Promise.all(savePromises).catch(console.error);

      fullFlowTimer.stop();
      lastGenerationTimestampRef.current = Date.now(); // Track when we finished generating
      setLastProfileSession(profiler.endSession());
    } catch (error: any) {
      console.error('[MainTabs] Batch processing error:', error);
      fullFlowTimer.stop({ error: error.message });
      lastGenerationTimestampRef.current = Date.now(); // Track even on error
      showAlert('Error', 'Failed to process messages: ' + error.message);
    }
  }, [currentConversation, messages, dispatch, showAlert, useStreaming]);

  // Initialize message queue when conversation changes
  useEffect(() => {
    if (currentConversation?.id) {
      const selectedChars = currentConversation.selected_characters || [];
      
      messageQueueService.initQueue(
        currentConversation.id,
        selectedChars,
        {
          onBatchReady: processBatchedMessages,
          onProcessingStart: () => setIsQueueProcessing(true),
          onProcessingEnd: () => setIsQueueProcessing(false),
          onError: (error) => {
            setIsQueueProcessing(false);
            console.error('[MessageQueue] Error:', error);
          },
        }
      );
    }

    return () => {
      if (currentConversation?.id) {
        messageQueueService.clearQueue(currentConversation.id);
      }
    };
  }, [currentConversation?.id, currentConversation?.selected_characters, processBatchedMessages]);

  // Handle real-time messages from other users - trigger character animations
  const prevMessagesRef = useRef<typeof messages>([]);
  const hasInitializedMessagesRef = useRef(false);
  
  useEffect(() => {
    if (!currentConversation || !messages || messages.length === 0) {
      prevMessagesRef.current = messages || [];
      hasInitializedMessagesRef.current = false;
      return;
    }

    const currentUserId = currentUserRef.current?.id;
    if (!currentUserId) {
      prevMessagesRef.current = messages || [];
      return;
    }

    // Skip animation on initial load - only animate NEW messages that arrive via real-time
    if (!hasInitializedMessagesRef.current) {
      prevMessagesRef.current = messages;
      hasInitializedMessagesRef.current = true;
      return;
    }

    // Find new messages that weren't in the previous state
    const prevIds = new Set(prevMessagesRef.current.map((m: any) => m.id));
    const newMessages = messages.filter((m: any) => !prevIds.has(m.id));
    
    // Filter for assistant messages from other users (not our own AI responses)
    // We detect "remote" messages by checking:
    // 1. We're NOT currently loading AI
    // 2. We're NOT within the grace period after our own generation
    const timeSinceLastGeneration = Date.now() - lastGenerationTimestampRef.current;
    const withinGracePeriod = timeSinceLastGeneration < GENERATION_GRACE_PERIOD_MS;
    
    // Log when grace period prevents animation (for debugging display order issues)
    if (newMessages.length > 0 && withinGracePeriod) {
      console.log(`[MainTabs] Grace period active (${timeSinceLastGeneration}ms ago), skipping real-time animation for ${newMessages.length} new messages`);
    }
    
    const newRemoteAssistantMessages = newMessages.filter((m: any) => 
      m.role === 'assistant' && 
      m.characterId && // Must have a character to animate
      !isLoadingAI && // If we're loading, these are our own responses
      !withinGracePeriod // Skip if we just finished our own generation
    );

    // Trigger animation for new remote assistant messages (limit to prevent spam)
    if (newRemoteAssistantMessages.length > 0 && newRemoteAssistantMessages.length <= 5) {
      const selectedChars = currentConversation.selected_characters || [];
      
      // Group messages by character for animation
      const responses = newRemoteAssistantMessages.map((m: any) => ({
        characterId: m.characterId,
        content: m.content,
      }));

      // Create animation scene for the remote messages
      const remoteScene = fillGapsForNonSpeakers(
        createFallbackScene(responses, selectedChars),
        selectedChars
      );
      
      console.log('[MainTabs] Animating real-time messages from other users:', responses.length);
      setAnimationScene(remoteScene);
    }

    // Update ref for next comparison
    prevMessagesRef.current = messages;
  }, [messages, currentConversation, isLoadingAI]);

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

  // Open premium upgrade flow - navigate to Bob's tutorial and trigger premium pitch
  const onBecomePremium = async () => {
    // Close sidebar on mobile
    if (isMobile && showSidebar) {
      dispatch(setSidebarOpen(false));
    }
    
    try {
      // Navigate to tutorial (creates one if doesn't exist, or opens existing)
      await dispatch(createOrNavigateToTutorial() as any);
      
      // Switch to Home tab if not already there
      setActiveTab('Home');
      
      // Trigger the premium pitch animation (Bob turns around)
      setTriggerPremiumPitch(true);
    } catch (error: any) {
      showAlert('Error', 'Failed to open premium consultation: ' + error.message);
    }
  };

  // Callback when premium pitch trigger is consumed
  const onPremiumPitchConsumed = useCallback(() => {
    setTriggerPremiumPitch(false);
  }, []);

  // Handle payment selection (placeholder for now)
  const onPaymentSelect = useCallback((tier: 'premium' | 'gold') => {
    const tierNames = { premium: 'Premium', gold: 'Gold' };
    const tierPrices = { premium: '$9.99/mo', gold: '$24.99/mo' };
    showAlert(
      'Payment Coming Soon! 🚀',
      `You selected ${tierNames[tier]} (${tierPrices[tier]})\n\nStripe payment integration will be available soon. Stay tuned!`,
      [{ text: 'OK' }]
    );
  }, [showAlert]);

  // Open join conversation modal from sidebar
  const onJoinConversation = () => {
    // Close sidebar on mobile
    if (isMobile && showSidebar) {
      dispatch(setSidebarOpen(false));
    }
    setShowJoinModalFromSidebar(true);
  };

  // Handle successful join from sidebar modal
  const handleJoinedFromSidebar = async (conversationId: string) => {
    setShowJoinModalFromSidebar(false);
    try {
      // Reload conversations to include the newly joined one
      await dispatch(loadConversations() as any);
      // Navigate to the joined conversation
      await dispatch(selectConversation(conversationId) as any);
    } catch (error: any) {
      showAlert('Error', 'Failed to load conversation: ' + error.message);
    }
  };

  // Handle successful join from ChatInterface (deep link)
  const handleJoinedFromChat = async (conversationId: string) => {
    try {
      // Reload conversations to include the newly joined one
      await dispatch(loadConversations() as any);
      // Navigate to the joined conversation
      await dispatch(selectConversation(conversationId) as any);
    } catch (error: any) {
      showAlert('Error', 'Failed to load conversation: ' + error.message);
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

  const onDeleteMessage = async (messageId: string) => {
    try {
      await dispatch(deleteMessage(messageId) as any);
    } catch (error: any) {
      showAlert('Error', 'Failed to delete message: ' + error.message);
    }
  };

  // Clear history - delete current conversation and create a new one with same characters
  const onClearHistory = async () => {
    if (!currentConversation) return;
    
    try {
      // Get the current characters before deleting
      const currentCharacters = currentConversation.selected_characters || selectedCharacters || [];
      
      // Delete the current conversation
      await dispatch(deleteConversation(currentConversation.id) as any);
      
      // Create a new conversation with the same characters
      if (currentCharacters.length > 0) {
        await dispatch(createConversation('New Conversation', currentCharacters) as any);
      }
    } catch (error: any) {
      showAlert('Error', 'Failed to clear history: ' + error.message);
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
      lastGenerationTimestampRef.current = Date.now(); // Track when we finished generating
    }
  }, [currentConversation, dispatch, showAlert]);

  const handleSendMessage = async (content: string, selectedCharacters: string[]) => {
    // Validate that at least one character is selected
    if (!selectedCharacters || selectedCharacters.length === 0) {
      showAlert('No Wakattors Selected', 'Please select at least one Wakattor before sending a message.');
      return;
    }

    // Check if conversation exists
    const conversation = currentConversation;
    if (!conversation) {
      showAlert('No Conversation', 'Please start a new conversation first by selecting characters.');
      return;
    }

    // For shared (multi-user) conversations, use the message queue for batching
    const isSharedConversation = conversation.visibility === 'shared';
    if (isSharedConversation && currentUserRef.current) {
      console.log('[MainTabs] Using message queue for shared conversation');
      
      // Update queue with current selected characters
      messageQueueService.updateSelectedCharacters(conversation.id, selectedCharacters);
      
      // Queue the message (it will be processed via processBatchedMessages callback)
      const queued = messageQueueService.queueMessage(
        conversation.id,
        currentUserRef.current.id,
        content,
        currentUserRef.current.email
      );

      if (queued) {
        // Show loading state based on queue processing
        setIsLoadingAI(isQueueProcessing || messageQueueService.isProcessing(conversation.id));
        return;
      }
      // If queue not initialized, fall through to direct processing
    }

    // Direct processing for single-user conversations or fallback
    // Start profiling session
    const profiler = getProfiler();
    profiler.startSession(`message_${Date.now()}`);
    const fullFlowTimer = profiler.start(PROFILE_OPS.FULL_MESSAGE_FLOW);

    setIsLoadingAI(true);
    try {
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
        // Note: 'awesome dude' is Bob's special conversation title - don't rename it
        const needsTitleGeneration = isFirstUserMessage &&
          conversation.title === 'New Conversation';

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

          // Use single-call orchestration for ALL character counts (1 or more)
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
              },
              undefined,        // config overrides
              conversation.id   // For tutorial token limit multiplier (3x)
            );
            scene = result.scene;
            characterResponses = result.responses;
          } else {
            // Non-streaming version
            const result = await generateAnimatedSceneOrchestration(
              content,
              selectedCharacters,
              conversationHistory,
              undefined,        // config overrides
              conversation.id   // For tutorial token limit multiplier (3x)
            );
            scene = result.scene;
            characterResponses = result.responses;
          }

          // Profile animation setup
          const animSetupTimer = profiler.start(PROFILE_OPS.ANIMATION_SETUP);
          // Start animation playback IMMEDIATELY (display first, save in background)
          setAnimationScene(scene);
          setStreamingProgress(0); // Reset progress
          animSetupTimer.stop({ characterCount: selectedCharacters.length });

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
          // ============================================
          // ONBOARDING: Track trial wakattor messages
          // ============================================
          // Check if this conversation uses trial wakattors (not Bob)
          const hasTrialWakattors = selectedCharacters.some(id => isTrialWakattor(id));
          const isNotBobConversation = !selectedCharacters.some(id => isBobCharacter(id));
          const userIsNotSubscriber = !onboarding || !isSubscriber(onboarding.tier);
          
          if (hasTrialWakattors && isNotBobConversation && userIsNotSubscriber) {
            // Increment the onboarding message count
            const shouldRedirect = await dispatch(incrementOnboardingMessageCount() as any);
            
            if (shouldRedirect) {
              console.log('[MainTabs] Trial limit reached, redirecting to Bob...');
              
              // Get the name of the last wakattor for personalized pitch
              const lastCharacter = selectedCharacters[0] ? getCharacter(selectedCharacters[0]) : null;
              const lastCharacterName = lastCharacter?.name;
              
              // Auto-switch to Bob's tutorial conversation after a short delay
              setTimeout(async () => {
                try {
                  const tutorialConv = await dispatch(createOrNavigateToTutorial() as any);
                  setActiveTab('Home');
                  
                  // Add Bob's post-trial pitch message
                  if (tutorialConv?.id) {
                    const pitchMessage = getBobPostTrialPitch(lastCharacterName);
                    await dispatch(saveMessage(
                      tutorialConv.id,
                      'assistant',
                      pitchMessage,
                      BOB_CHARACTER_ID
                    ) as any);
                    
                    // Reload messages to show the pitch
                    await dispatch(selectConversation(tutorialConv) as any);
                  }
                } catch (err) {
                  console.error('[MainTabs] Failed to redirect to Bob:', err);
                }
              }, 2000); // Give user time to see the last message
            }
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
      lastGenerationTimestampRef.current = Date.now(); // Track when we finished generating
      
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
    const saveStartTime = Date.now();
    console.log(`[MainTabs] handleGreeting called for ${characterId} at ${saveStartTime}`);

    // IMPORTANT: Update the generation timestamp to prevent real-time message detection
    // from treating conversation starter messages as "remote" and interrupting playback
    lastGenerationTimestampRef.current = Date.now();

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

      const saveEndTime = Date.now();
      console.log(`[MainTabs] Greeting saved successfully for ${characterId} (took ${saveEndTime - saveStartTime}ms)`);
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
      {/* Join conversation modal (from sidebar) */}
      <JoinConversation
        visible={showJoinModalFromSidebar}
        onClose={() => setShowJoinModalFromSidebar(false)}
        onJoined={handleJoinedFromSidebar}
      />
      {/* Sidebar rendered at root level to cover entire screen including header and tab bar */}
      {!isFullscreen && (
        <ChatSidebar
          conversations={conversations}
          currentConversation={currentConversation}
          onSelectConversation={onSelectConversation}
          onToggleSidebar={onToggleSidebar}
          isOpen={showSidebar}
          onNewConversation={onNewConversation}
          onBecomePremium={onBecomePremium}
          onJoinConversation={onJoinConversation}
          onRenameConversation={onRenameConversation}
          onDeleteConversation={onDeleteConversation}
        />
      )}
      {!isFullscreen && !isMobileLandscape && <Header />}
      <View style={[
        styles.contentContainer,
        // In mobile landscape, content takes 100% since no header/tab bar
        isMobileLandscape && { height: '100%' },
      ]}>
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
            onDeleteMessage={onDeleteMessage}
            animationScene={animationScene}
            earlyAnimationSetup={earlyAnimationSetup}
            onGreeting={handleGreeting}
            conversationId={currentConversation?.id}
            savedCharacters={currentConversation?.selected_characters}
            onSaveIdleMessage={handleSaveIdleMessage}
            initialJoinCode={pendingJoinCode}
            onConsumeJoinCode={consumeJoinCode}
            triggerPremiumPitch={triggerPremiumPitch}
            onPremiumPitchConsumed={onPremiumPitchConsumed}
            onPaymentSelect={onPaymentSelect}
            onJoinedConversation={handleJoinedFromChat}
            onClearHistory={onClearHistory}
          />
        )}
        {activeTab === 'Library' && <LibraryScreen />}
        {activeTab === 'Animations' && <AnimationsScreen onNavigateToChat={() => setActiveTab('Home')} />}
        {activeTab === 'Settings' && <SettingsScreen />}
        </View>
      </View>

      {/* Custom Bottom Tab Bar - workaround for Tab.Navigator not working on web */}
      {/* Hidden in landscape mode for fullscreen experience */}
      {!isFullscreen && !isMobileLandscape && (
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
