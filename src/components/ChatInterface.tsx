import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, PanResponder, Dimensions, Animated, Easing } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setFullscreen } from '../store/actions/uiActions';
import { fetchUsage, dismissWarning, setupUsageListeners, shouldFetchUsage } from '../store/actions/usageActions';
import { useCustomAlert } from './CustomAlert';
import { canSendMessage, UsageInfo } from '../services/usageTrackingService';
import { LimitWarningBanner } from './LimitWarningBanner';
import { BlockedInputIndicator } from './BlockedStateOverlay';
import { UpgradePromptModal } from './UpgradePromptModal';
import { CharacterDisplay3D, AnimationState, ComplementaryAnimation, LookDirection, EyeState, MouthState } from './CharacterDisplay3D';
import { DEFAULT_CHARACTER, getAllCharacters, getCharacter, CharacterBehavior, registerCustomCharacters } from '../config/characters';
import { CharacterVoiceProfile } from '../config/voiceConfig';
import { getCustomWakattors } from '../services/customWakattorsService';
import { getVoiceRecorder, RecordingState } from '../services/voiceRecording';
import { transcribeAudio, isWebSpeechSupported } from '../services/speechToText';
import { LiveSpeechRecognition, LiveTranscriptionResult } from '../services/speechToTextLive';
import { detectBrowser, getBrowserGuidance, isVoiceSupported } from '../utils/browserDetection';
import { getPlaybackEngine, PlaybackState, PlaybackStatus } from '../services/animationPlaybackEngine';
import { CharacterAnimationState, OrchestrationScene, CharacterTimeline, AnimationSegment, DEFAULT_TALKING_SPEED, adjustTimelineToTargetDuration } from '../services/animationOrchestration';
import { estimateTTSDuration } from '../services/ttsDurationEstimator';
import { generateProcessingScene } from '../services/processingAnimations';
import { getRandomGreeting } from '../services/characterGreetings';
import { EntranceConfig, generateEntranceSequence, getTotalEntranceDuration } from '../services/entranceAnimations';
import { generateConversationStarter } from '../services/conversationStarterPrompts';
import { getRandomStory, Story } from '../services/storyLibrary';
import { setStoryContext, clearStoryContext } from '../store/actions/conversationActions';
import { useResponsive, BREAKPOINTS, CHARACTER_HEIGHT } from '../constants/Layout';
import { Toast } from './ui/Toast';
import { StorySpeechBubble } from './ui/StorySpeechBubble';
import { memDebug } from '../services/performanceLogger';
import {
  IdleConversationManager,
  IdleConversationState,
  initIdleConversationManager,
  destroyIdleConversationManager,
  getIdleConversationManager
} from '../services/idleConversationService';

// Import from extracted ChatInterface modules
// Types and utilities from sub-modules (avoid circular import)
import { IdleAnimationState as ExtractedIdleAnimationState } from './ChatInterface/types';
import {
  getRandomIdleAnimation as getRandomIdleAnimationUtil,
  getRandomIdleInterval as getRandomIdleIntervalUtil,
  formatTimestamp as formatTimestampUtil,
} from './ChatInterface/utils';
import {
  MemoizedCharacterSpeechBubble as ExtractedSpeechBubble,
  FloatingCharacterWrapper as ExtractedFloatingWrapper,
  FadingLine as ExtractedFadingLine,
} from './ChatInterface/components';
// Import extracted hooks
import {
  useCharacterLoading,
  useAnimationPlayback,
  useIdleAnimation,
  useIdleConversation,
  useEntranceAnimation,
  useResponsiveCharacters,
  useMessageEditing,
  useVoiceRecording,
  useBobSales,
  useBubbleQueue,
  useTextToSpeech,
} from './ChatInterface/hooks';
import { calculateCharacterPosition } from './ChatInterface/utils/characterPositioning';
import { wrapTextWithReveal } from './ChatInterface/utils/speechBubbleHelpers';
import { CollaborationPanel } from './CollaborationPanel';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
  characterId?: string; // Which character is speaking (for assistant messages)
}

// Early animation setup from streaming
interface EarlyAnimationSetup {
  detectedCharacters: string[];
  estimatedDuration?: number;
  canStartThinkingAnimation: boolean;
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (content: string, selectedCharacters: string[]) => void;
  showSidebar: boolean;
  onToggleSidebar: () => void;
  isLoading?: boolean;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  // Animation orchestration
  animationScene?: OrchestrationScene | null;
  // Early animation setup from streaming (before full scene is ready)
  earlyAnimationSetup?: EarlyAnimationSetup | null;
  // Callback for character greeting in new conversations
  onGreeting?: (characterId: string, greetingMessage: string) => void;
  // Conversation context for persistence
  conversationId?: string | null;
  // Saved characters from database (fixed at conversation creation, read-only)
  savedCharacters?: string[] | null;
  // Callback to save idle conversation messages
  onSaveIdleMessage?: (characterId: string, content: string, metadata?: Record<string, any>) => void;
}

// Export function to start animation playback from external components
export function startAnimationPlayback(scene: OrchestrationScene): void {
  const engine = getPlaybackEngine();
  engine.play(scene);
}

// Export function to stop animation playback
export function stopAnimationPlayback(): void {
  const engine = getPlaybackEngine();
  engine.stop();
}

// Use extracted idle animation utilities (type alias for local usage)
type IdleAnimationState = ExtractedIdleAnimationState;
const getRandomIdleAnimation = getRandomIdleAnimationUtil;
const getRandomIdleInterval = getRandomIdleIntervalUtil;

// Use extracted FadingLine component
const FadingLine = ExtractedFadingLine;

// Use extracted CharacterSpeechBubble component
const MemoizedCharacterSpeechBubble = ExtractedSpeechBubble;

// Shallow compare ComplementaryAnimation objects (all props are primitives)
const shallowCompareComplementary = (
  prev: typeof CharacterDisplay3D extends React.ComponentType<infer P> ? P['complementary'] : never,
  next: typeof CharacterDisplay3D extends React.ComponentType<infer P> ? P['complementary'] : never
): boolean => {
  if (prev === next) return true;
  if (!prev || !next) return prev === next;
  return (
    prev.lookDirection === next.lookDirection &&
    prev.eyeState === next.eyeState &&
    prev.eyebrowState === next.eyebrowState &&
    prev.headStyle === next.headStyle &&
    prev.mouthState === next.mouthState &&
    prev.faceState === next.faceState &&
    prev.noseState === next.noseState &&
    prev.cheekState === next.cheekState &&
    prev.foreheadState === next.foreheadState &&
    prev.jawState === next.jawState &&
    prev.effect === next.effect &&
    prev.effectColor === next.effectColor &&
    prev.speed === next.speed &&
    prev.transitionDuration === next.transitionDuration &&
    prev.blinkDuration === next.blinkDuration
  );
};

// Memoize CharacterDisplay3D to prevent re-renders when messages change
const MemoizedCharacterDisplay3D = memo(CharacterDisplay3D, (prevProps, nextProps) => {
  // Only re-render if these specific props change (not on every parent re-render)
  return (
    prevProps.character?.id === nextProps.character?.id &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.animation === nextProps.animation &&
    prevProps.isTalking === nextProps.isTalking &&
    prevProps.showName === nextProps.showName &&
    prevProps.nameKey === nextProps.nameKey &&
    // Shallow compare complementary properties (much faster than JSON.stringify)
    shallowCompareComplementary(prevProps.complementary, nextProps.complementary)
  );
});

// Use extracted FloatingCharacterWrapper component
const FloatingCharacterWrapper = ExtractedFloatingWrapper;

// ThinkingDots component - animated dots that pulse while AI is thinking
const ThinkingDots = memo(() => {
  const dot1Opacity = useRef(new Animated.Value(0.3)).current;
  const dot2Opacity = useRef(new Animated.Value(0.3)).current;
  const dot3Opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      );
    };

    const anim1 = animateDot(dot1Opacity, 0);
    const anim2 = animateDot(dot2Opacity, 200);
    const anim3 = animateDot(dot3Opacity, 400);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, []);

  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      <Animated.Text style={{ opacity: dot1Opacity, color: '#a855f7', fontSize: 16, fontWeight: 'bold' }}>.</Animated.Text>
      <Animated.Text style={{ opacity: dot2Opacity, color: '#a855f7', fontSize: 16, fontWeight: 'bold' }}>.</Animated.Text>
      <Animated.Text style={{ opacity: dot3Opacity, color: '#a855f7', fontSize: 16, fontWeight: 'bold' }}>.</Animated.Text>
    </View>
  );
});

export function ChatInterface({ messages, onSendMessage, showSidebar, onToggleSidebar, isLoading = false, onEditMessage, onDeleteMessage, animationScene, earlyAnimationSetup, onGreeting, conversationId, savedCharacters, onSaveIdleMessage }: ChatInterfaceProps) {
  const dispatch = useDispatch();
  const { isFullscreen } = useSelector((state: RootState) => state.ui);
  const { currentUsage, lastWarningDismissed, lastFetchedAt } = useSelector((state: RootState) => state.usage);
  const { showAlert, AlertComponent } = useCustomAlert();

  // Track ChatInterface lifecycle
  const renderCountRef = useRef(0);
  useEffect(() => {
    memDebug.trackMount('ChatInterface');
    memDebug.checkMemory('ChatInterface mount');

    return () => {
      memDebug.trackUnmount('ChatInterface');
    };
  }, []);

  // Track render count (silent)
  useEffect(() => {
    renderCountRef.current++;
  });

  // Upgrade prompt modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { fonts, spacing, layout, borderRadius, scalePx, isMobile, isTablet, isDesktop, isMobileLandscape, width: screenWidth, height: screenHeight } = useResponsive();

  // Responsive dynamic styles for text and spacing
  const dynamicStyles = useMemo(() => ({
    // Typography
    fullscreenTooltipText: { fontSize: fonts.xs },
    dividerMessageBadgeText: { fontSize: scalePx(10) },
    userSpeechText: { fontSize: fonts.xl, lineHeight: fonts.xl },
    characterName: { fontSize: fonts.lg },
    messageText: { fontSize: fonts.md },
    messageTimestamp: { fontSize: fonts.xs },
    loadingText: { fontSize: fonts.sm },
    textInput: { fontSize: fonts.md },
    editMessageInput: { fontSize: fonts.md, borderRadius: borderRadius.sm },
    cancelText: { fontSize: fonts.sm },
    saveText: { fontSize: fonts.sm },
    characterNameText: { fontSize: fonts.lg },
    hoverNameText: { fontSize: fonts.xl },
    characterSelectorText: { fontSize: fonts.sm },
    characterSelectorTitle: { fontSize: fonts.sm },
    characterSelectorName: { fontSize: fonts.sm },
    characterSearchInput: { fontSize: fonts.sm },
    roleFilterText: { fontSize: fonts.xs },
    characterSectionLabel: { fontSize: fonts.xs },
    selectedCharacterName: { fontSize: fonts.sm },
    recordingText: { fontSize: fonts.sm },
    transcribingText: { fontSize: fonts.sm },
    liveTranscriptLabel: { fontSize: fonts.xs },
    liveTranscriptText: { fontSize: fonts.sm },
    emptyCharacterText: { fontSize: fonts.md },
    speechBubbleName: { fontSize: fonts.sm },
    // Spacing & Layout
    messagesContainer: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    messageBubble: { borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    inputContainer: { padding: spacing.md, marginTop: spacing.sm },
    inputWrapper: { borderRadius: borderRadius.xl },
    iconButton: { width: scalePx(40), height: scalePx(40) },
  }), [fonts, spacing, borderRadius, scalePx]);

  // Helper for ultrawide-aware scaling (280px baseline, continues to 1920px)
  const scaleValue = (min: number, max: number) => {
    const range = 1920 - 280;
    return Math.min(max, min + ((screenWidth - 280) / range) * (max - min));
  };

  const [input, setInput] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  // Track user's preferred character display height percentage (for resize persistence)
  const userPreferredPercentRef = useRef<number>(CHARACTER_HEIGHT.DEFAULT_PERCENT);
  // Store animation data for replay (keyed by message content hash to match messages)
  const animationDataCacheRef = useRef<Map<string, { segments: AnimationSegment[]; totalDuration: number }>>(new Map());

  // Voice recording (hook handles state, refs, and all voice functions)
  const {
    isRecording,
    isPaused,
    recordingDuration,
    liveTranscript,
    isTranscribing,
    toggleRecording,
    cancelRecording,
    restartRecording,
    togglePause,
  } = useVoiceRecording({
    onTranscriptionComplete: (text) => {
      setInput((prev) => {
        const separator = prev.trim() ? ' ' : '';
        return prev + separator + text;
      });
    },
    showAlert,
  });
  // Message editing (hook handles edit/delete/long press logic)
  const {
    editingMessageId,
    editingContent,
    setEditingContent,
    startEditingMessage,
    saveEditedMessage,
    cancelEditing,
    confirmDeleteMessage,
    handleLongPressMessage,
  } = useMessageEditing({
    isLoading,
    onEditMessage,
    onDeleteMessage,
    showAlert,
  });
  // Text-to-speech for character responses
  const {
    isSpeaking,
    isPaused: isTTSPaused,
    isSupported: isTTSSupported,
    ttsEnabled,
    setTtsEnabled,
    speak,
    stop: stopTTS,
    pause: pauseTTS,
    resume: resumeTTS,
  } = useTextToSpeech({
    enabled: false, // TTS disabled
  });
  // Track actual available height from container layout (excludes header/tab bar)
  const [availableHeight, setAvailableHeight] = useState(0);
  const availableHeightRef = useRef(0); // Ref for panResponder to access latest value

  // Handle layout to get actual available height
  const handleContainerLayout = useCallback((event: { nativeEvent: { layout: { height: number } } }) => {
    const { height } = event.nativeEvent.layout;
    setAvailableHeight(height);
    availableHeightRef.current = height;
  }, []);

  // Set initial height based on available container height - using constants for consistency
  const [characterHeight, setCharacterHeight] = useState<number>(() => {
    // Start with a reasonable default, will be recalculated after layout
    return CHARACTER_HEIGHT.ABSOLUTE_MIN_PX as number;
  });
  const characterHeightRef = useRef(characterHeight); // Ref for panResponder to access latest value
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]); // Fixed characters from conversation creation
  const [isMobileView, setIsMobileView] = useState(isMobile);
  const [hoveredCharacterId, setHoveredCharacterId] = useState<string | null>(null); // Track which character is hovered
  const [isFullscreenHovered, setIsFullscreenHovered] = useState(false); // Track fullscreen button hover
  const lastCharacterTextRef = useRef<Map<string, { text: string; fullText: string }>>(new Map()); // Track last text for persistence
  const [nameKey, setNameKey] = useState(0); // Key to trigger re-animation
  // Character loading (hook handles loading from both built-in and database)
  const { availableCharacters, isLoadingCharacters } = useCharacterLoading();
  const [showChatHistory, setShowChatHistory] = useState(false); // Hidden by default
  
  // Toast state for character selection feedback
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<string | undefined>();

  // Story toast state (for conversation starters)
  const [storyToastVisible, setStoryToastVisible] = useState(false);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const storyInterruptedRef = useRef(false);

  // Pending user message (shown while waiting for wakattors to respond)
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(null);
  const [typedUserMessage, setTypedUserMessage] = useState<string>(''); // Animated typing effect

  // Typing animation effect for user message bubble
  useEffect(() => {
    if (!pendingUserMessage) {
      setTypedUserMessage('');
      return;
    }

    // Reset and start typing animation
    setTypedUserMessage('');
    let currentIndex = 0;
    const typingSpeed = 30; // ms per character (fast typing)

    const typingInterval = setInterval(() => {
      if (currentIndex < pendingUserMessage.length) {
        setTypedUserMessage(pendingUserMessage.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, typingSpeed);

    return () => clearInterval(typingInterval);
  }, [pendingUserMessage]);

  // Fetch usage data on mount and setup event listeners
  useEffect(() => {
    // Fetch usage if stale or not loaded
    if (shouldFetchUsage(lastFetchedAt)) {
      dispatch(fetchUsage() as any);
    }

    // Setup event listeners for usage updates from aiService
    const cleanup = dispatch(setupUsageListeners() as any);
    return cleanup;
  }, [dispatch, lastFetchedAt]);

  // Show upgrade modal when hitting 80% for the first time
  useEffect(() => {
    if (
      currentUsage &&
      currentUsage.warningLevel === 'warning' &&
      !lastWarningDismissed &&
      currentUsage.tier !== 'admin'
    ) {
      setShowUpgradeModal(true);
    }
  }, [currentUsage?.warningLevel, lastWarningDismissed]);

  // Check if user can send messages (not blocked)
  const isBlocked = currentUsage && !canSendMessage(currentUsage);

  // Handle upgrade button press
  const handleUpgradePress = useCallback(() => {
    setShowUpgradeModal(false);
    showAlert('Coming Soon', 'Subscription upgrades will be available soon!');
  }, [showAlert]);

  // Handle dismiss warning
  const handleDismissWarning = useCallback(() => {
    dispatch(dismissWarning());
    setShowUpgradeModal(false);
  }, [dispatch]);

  // In mobile landscape, default to characters view (not chat history)
  // This effect ensures chat history is hidden when rotating to landscape
  useEffect(() => {
    if (isMobileLandscape && showChatHistory) {
      setShowChatHistory(false);
    }
  }, [isMobileLandscape]);

  // Fullscreen toggle - sets Redux state (MainTabs handles UI hiding)
  const toggleFullscreen = useCallback(() => {
    if (Platform.OS !== 'web') return;
    dispatch(setFullscreen(!isFullscreen));
  }, [dispatch, isFullscreen]);

  // Exit fullscreen function for ESC key
  const exitFullscreen = useCallback(() => {
    if (Platform.OS !== 'web') return;
    if (isFullscreen) {
      dispatch(setFullscreen(false));
    }
  }, [dispatch, isFullscreen]);

  // Listen for ESC key to exit fullscreen
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        dispatch(setFullscreen(false));
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dispatch, isFullscreen]);
  
  // Entrance animation state - triggered when conversation changes or new conversation is created
  const [showEntranceAnimation, setShowEntranceAnimation] = useState(false);
  const entranceAnimationKey = useRef(0);
  // Entrance sequence - maps character ID to entrance config (type, duration, startDelay)
  const [entranceSequence, setEntranceSequence] = useState<Map<string, EntranceConfig>>(new Map());
  // Ref to track if conversation starter is being generated
  const conversationStarterInProgressRef = useRef(false);

  // Animation playback (hook handles subscription and state management)
  const {
    playbackState,
    playbackEngineRef,
    isPlayingRef,
    animatingMessages,
    setAnimatingMessages,
    stopPlayback,
  } = useAnimationPlayback();

  // Idle animations (hook handles per-character timers and state)
  const { idleAnimations, startIdleCycle, stopIdleCycle } = useIdleAnimation({
    selectedCharacters,
    isPlaying: playbackState.isPlaying,
    isLoading,
    showEntranceAnimation,
  });

  // Idle conversation (hook handles manager lifecycle and state)
  const {
    idleConversationState,
    idleAnimationSceneOverride,
    handleUserTyping,
  } = useIdleConversation({
    selectedCharacters,
    conversationId,
    onSaveIdleMessage,
    isPlaying: playbackState.isPlaying,
  });

  // Check if user has sent any messages (to stop Bob's sales pitch)
  const hasUserMessages = useMemo(() => {
    return messages.some(m => m.role === 'user');
  }, [messages]);

  // Bob sales pitch (for new conversations with Bob)
  const {
    isBobPitching,
    bobSceneOverride,
    notifyUserResponse,
  } = useBobSales({
    selectedCharacters,
    conversationId,
    onSaveMessage: onGreeting, // Use greeting callback to save Bob's messages
    isPlaying: playbackState.isPlaying,
    hasUserMessages,
  });

  // Handle user input change with idle conversation, Bob sales, and story interruption
  const handleInputChange = useCallback((text: string) => {
    setInput(text);
    handleUserTyping();
    notifyUserResponse(); // Let Bob know user is typing

    // If user starts typing during story conversation, trigger graceful stop
    if (text.length > 0 && currentStory && playbackEngineRef.current.getStatus() === 'playing') {
      storyInterruptedRef.current = true;
      setStoryToastVisible(false); // Hide toast immediately

      // Graceful stop - let current speaker finish their sentence
      playbackEngineRef.current.gracefulStop(() => {
        // Story conversation gracefully stopped
        console.log('[Story] User interrupted, graceful stop complete');
      });
    }
  }, [handleUserTyping, notifyUserResponse, currentStory]);

  // Responsive calculations for bubbles & characters (hook handles all calculations)
  const {
    bubbleMaxWidth,
    bubbleMaxHeight,
    characterScaleFactor,
    inputAreaHeight,
    safeTopBoundary,
    getBubbleTopOffset,
  } = useResponsiveCharacters({
    characterCount: selectedCharacters.length,
    screenWidth,
    screenHeight,
    isMobile,
    isMobileLandscape,
  });

  // Bubble queue for per-character speech bubble management
  const {
    getBubblesForCharacter,
    getAnimationState,
    updateCharacterText,
    onBubbleAnimationComplete,
    clearAllBubbles,
  } = useBubbleQueue({
    characterCount: selectedCharacters.length,
    screenWidth,
    screenHeight,
    isMobile,
    isMobileLandscape,
  });

  // Feed revealed text into bubble queue during playback
  useEffect(() => {
    if (playbackState.isPlaying) {
      selectedCharacters.forEach(characterId => {
        const charPlaybackState = playbackState.characterStates.get(characterId);
        const isTyping = charPlaybackState?.isTalking || false;
        const revealedText = playbackEngineRef.current.getRevealedText(characterId);
        const fullText = playbackEngineRef.current.getFullText(characterId);

        // Always save fullText to ref when available (for persistence after playback)
        // This ensures we capture the text even in TTS-driven mode where revealedText may lag
        if (fullText) {
          const currentRef = lastCharacterTextRef.current.get(characterId);
          // Only update if fullText changed (new content)
          if (currentRef?.fullText !== fullText) {
            lastCharacterTextRef.current.set(characterId, {
              text: revealedText || fullText,
              fullText: fullText
            });
          }
        }

        if (revealedText) {
          updateCharacterText(characterId, revealedText, isTyping, fullText);
        }
      });
    }
  }, [playbackState.isPlaying, playbackState.characterStates, selectedCharacters, updateCharacterText]);

  // Note: lastCharacterTextRef is NOT cleared automatically - bubbles persist until new content arrives

  // Track previous playback state for TTS trigger
  const prevPlayingRef = useRef(false);
  // Store text to speak after playback completes (used for poems and other direct playback)
  const pendingTTSTextRef = useRef<Map<string, string>>(new Map());

  // Trigger TTS when playback STARTS (synchronized with animation)
  // Uses voice-driven mode: TTS boundary events drive text reveal
  // Characters speak one at a time, sequentially in timeline order (by startDelay)
  useEffect(() => {
    const wasPlaying = prevPlayingRef.current;
    const isNowPlaying = playbackState.isPlaying;

    // Detect transition from stopped to playing (START of playback)
    if (!wasPlaying && isNowPlaying && ttsEnabled && isTTSSupported && animationScene) {
      // Enable TTS-driven mode: text reveal follows TTS position
      playbackEngineRef.current.setTTSDrivenMode(true);

      // Speak in timeline order (sorted by startDelay) - matches animation sequence
      // This ensures characters speak in the order determined by the LLM (ord field)
      const speakSequentially = async () => {
        // Sort timelines by startDelay to get correct speaking order
        const sortedTimelines = [...animationScene.timelines]
          .sort((a, b) => a.startDelay - b.startDelay);

        for (const timeline of sortedTimelines) {
          const characterId = timeline.characterId;
          const fullText = timeline.content;

          if (fullText && fullText.trim()) {
            // Signal this character is now speaking (for bubble visibility sync)
            playbackEngineRef.current.setTTSCurrentSpeaker(characterId);

            // Get character's voice profile for TTS
            try {
              const character = getCharacter(characterId);
              const voiceProfile = character?.voiceProfile;

              // Speak with onBoundary callback to drive text animation
              // await ensures we wait for this character to finish before next
              await speak(fullText, {
                voiceProfile,
                onBoundary: (charIndex: number) => {
                  // Update playback engine with TTS position
                  playbackEngineRef.current.setTTSCharPosition(characterId, charIndex);
                },
              });

              // When TTS completes, show full text
              playbackEngineRef.current.setTTSCharPosition(characterId, fullText.length);
            } catch (e) {
              // Character not found or speak failed, speak without voice profile
              await speak(fullText);
            }
          }
        }

        // All characters done speaking
        playbackEngineRef.current.setTTSCurrentSpeaker(null);
      };

      speakSequentially();
    }

    // Clear pending TTS text and disable TTS-driven mode when playback stops
    if (wasPlaying && !isNowPlaying) {
      pendingTTSTextRef.current.clear();
      playbackEngineRef.current.setTTSDrivenMode(false);
    }

    prevPlayingRef.current = isNowPlaying;
  }, [playbackState.isPlaying, ttsEnabled, isTTSSupported, animationScene, speak]);

  // Animation playback subscription is handled by useAnimationPlayback hook

  // Start early "thinking" animation while streaming (before full scene is ready)
  // Uses varied processing animations for ALL selected characters
  useEffect(() => {
    if (earlyAnimationSetup?.canStartThinkingAnimation && !animationScene) {
      // Use all selected characters, not just detected ones from early setup
      const charactersToAnimate = selectedCharacters.length > 0
        ? selectedCharacters
        : earlyAnimationSetup.detectedCharacters;

      // Generate varied processing animations for all characters
      const estimatedDuration = earlyAnimationSetup.estimatedDuration || 15000;
      const thinkingScene = generateProcessingScene(
        charactersToAnimate,
        estimatedDuration
      ) as OrchestrationScene;
      
      // Set voice profiles before playing
      const voiceProfiles = buildVoiceProfilesMap();
      playbackEngineRef.current.setCharacterVoiceProfiles(voiceProfiles);
      
      playbackEngineRef.current.play(thinkingScene);
    }
  }, [earlyAnimationSetup, animationScene, selectedCharacters, availableCharacters]);

  // Helper function to build voice profiles map for selected characters
  const buildVoiceProfilesMap = useCallback((): Map<string, CharacterVoiceProfile> => {
    const profiles = new Map<string, CharacterVoiceProfile>();
    
    for (const characterId of selectedCharacters) {
      try {
        const character = getCharacter(characterId);
        if (character?.voiceProfile) {
          profiles.set(characterId, character.voiceProfile);
        }
      } catch (e) {
        // Character not found, skip
      }
    }
    
    // Also check available characters (custom wakattors)
    for (const wakattor of availableCharacters) {
      if (selectedCharacters.includes(wakattor.id) && (wakattor as any).voiceProfile) {
        profiles.set(wakattor.id, (wakattor as any).voiceProfile);
      }
    }
    
    return profiles;
  }, [selectedCharacters, availableCharacters]);

  // Start animation playback when a new scene is provided
  useEffect(() => {
    if (animationScene) {
      // Clear pending user message when wakattors start responding
      setPendingUserMessage(null);

      // Set character voice profiles before playing
      const voiceProfiles = buildVoiceProfilesMap();
      playbackEngineRef.current.setCharacterVoiceProfiles(voiceProfiles);

      // Store animation data for each timeline for replay functionality
      // Also store text content for TTS synchronization
      pendingTTSTextRef.current.clear();
      for (const timeline of animationScene.timelines) {
        // Create a unique key based on characterId + content
        const cacheKey = `${timeline.characterId}:${timeline.content}`;
        if (!animationDataCacheRef.current.has(cacheKey)) {
          animationDataCacheRef.current.set(cacheKey, {
            segments: timeline.segments,
            totalDuration: timeline.totalDuration,
          });
        }
        // Store text for TTS - this enables voice-driven text sync
        if (timeline.content && timeline.content.trim()) {
          pendingTTSTextRef.current.set(timeline.characterId, timeline.content);
        }
      }

      playbackEngineRef.current.play(animationScene);
    }
  }, [animationScene, buildVoiceProfilesMap]);

  // Track which messages are being animated based on the current scene
  useEffect(() => {
    if (animationScene && messages.length > 0) {
      // Find the most recent messages for each character in the scene
      const newAnimatingMessages = new Map<string, string>();
      
      for (const timeline of animationScene.timelines) {
        // Find the most recent message from this character
        const charMessages = [...messages]
          .reverse()
          .filter(m => m.role === 'assistant' && m.characterId === timeline.characterId);
        
        if (charMessages.length > 0) {
          newAnimatingMessages.set(timeline.characterId, charMessages[0].id);
        }
      }
      
      setAnimatingMessages(newAnimatingMessages);
    }
  }, [animationScene, messages]);

  // Clear animating messages is handled by useAnimationPlayback hook

  // Character loading is handled by useCharacterLoading hook

  // Don't auto-select any wakattor - let user choose
  // useEffect(() => {
  //   if (!isLoadingCharacters && availableCharacters.length > 0 && selectedCharacters.length === 0) {
  //     // Select the first available character by default
  //     setSelectedCharacters([availableCharacters[0].id]);
  //   }
  // }, [isLoadingCharacters, availableCharacters, selectedCharacters.length]);

  // Update mobile view on window resize
  useEffect(() => {
    const updateResponsiveSettings = () => {
      const { width } = Dimensions.get('window');

      // Update mobile view state using centralized breakpoints
      const isMobileDevice = width < BREAKPOINTS.tablet;
      setIsMobileView(isMobileDevice);
    };

    updateResponsiveSettings();
    const subscription = Dimensions.addEventListener('change', updateResponsiveSettings);
    return () => subscription?.remove();
  }, []);

  // Calculate character height based on AVAILABLE container height (not window height)
  // This ensures content doesn't overflow under the tab bar
  useEffect(() => {
    if (availableHeight <= 0) return; // Wait for layout

    // Calculate character height using constants and user preference
    // When chat history is shown, use minimum (85%)
    // Otherwise, use user's preferred percentage (clamped to 85-90% range)
    const targetPercent = showChatHistory
      ? CHARACTER_HEIGHT.MIN_PERCENT
      : Math.max(
          CHARACTER_HEIGHT.MIN_PERCENT,
          Math.min(CHARACTER_HEIGHT.MAX_PERCENT, userPreferredPercentRef.current)
        );

    const calculatedHeight = Math.floor(availableHeight * targetPercent);
    const newHeight = Math.max(calculatedHeight, CHARACTER_HEIGHT.ABSOLUTE_MIN_PX);
    setCharacterHeight(newHeight);
  }, [availableHeight, showChatHistory]);

  // Keep characterHeightRef in sync with state (for panResponder to access latest value)
  useEffect(() => {
    characterHeightRef.current = characterHeight;
  }, [characterHeight]);

  // Characters are now fixed at conversation creation - no dynamic selector

  // Restore characters from savedCharacters when conversation is loaded
  const userHasSelectedCharacters = useRef(false);
  const previousMessagesRef = useRef(messages);
  const hasRestoredInitialCharacters = useRef(false);
  const hasTriggeredGreeting = useRef(false); // Prevent duplicate greetings

  // Reset greeting trigger when conversationId changes (handles new empty conversations)
  useEffect(() => {
    hasTriggeredGreeting.current = false;
    conversationStarterInProgressRef.current = false;
  }, [conversationId]);

  // Compute last messages per character synchronously (available immediately during render)
  // This is used as a fallback when lastCharacterTextRef hasn't been populated yet
  const lastMessagesFromConversation = useMemo(() => {
    const result = new Map<string, { text: string; fullText: string }>();
    if (!conversationId || messages.length === 0) return result;

    messages.forEach(msg => {
      if (msg.role === 'assistant' && msg.characterId) {
        result.set(msg.characterId, {
          text: msg.content,
          fullText: msg.content
        });
      }
    });
    return result;
  }, [conversationId, messages]);

  // Memoize the limited characters array to avoid re-creating on every render
  // This is used in multiple places in the render function
  const limitedCharacters = useMemo(() =>
    Array.from(new Set(selectedCharacters)).slice(0, 5),
    [selectedCharacters]
  );

  // Populate lastCharacterTextRef from DB messages
  // This handles cases where playback didn't run (errors, skipped messages, etc.)
  useEffect(() => {
    if (!playbackState.isPlaying && lastMessagesFromConversation.size > 0) {
      lastMessagesFromConversation.forEach((value, charId) => {
        const existingRef = lastCharacterTextRef.current.get(charId);
        // Update ref if:
        // 1. No existing data (empty ref)
        // 2. DB has DIFFERENT content than ref (newer message that wasn't played back)
        const needsUpdate = !existingRef || existingRef.fullText !== value.fullText;
        if (needsUpdate) {
          lastCharacterTextRef.current.set(charId, value);
        }
      });
    }
  }, [lastMessagesFromConversation, playbackState.isPlaying]);

  useEffect(() => {
    // Detect conversation change: first message ID changed or message array replaced
    const conversationChanged =
      messages.length > 0 &&
      previousMessagesRef.current.length > 0 &&
      messages[0]?.id !== previousMessagesRef.current[0]?.id;

    // Detect initial load: messages just appeared (were empty, now have content)
    const initialLoad =
      messages.length > 0 &&
      previousMessagesRef.current.length === 0 &&
      !hasRestoredInitialCharacters.current;

    // PERFORMANCE: Skip processing during active playback unless conversation actually changed
    // This prevents re-render cascades from message saves during idle conversation
    if (isPlayingRef.current && !conversationChanged && !initialLoad) {
      // Just update the reference without any other processing
      previousMessagesRef.current = messages;
      return;
    }

    // CLEANUP: Stop any running animations when conversation changes
    if (conversationChanged) {
      stopPlayback();
      setAnimatingMessages(new Map());
      // Clear old text refs so we don't show previous conversation's text
      lastCharacterTextRef.current.clear();
      // Trigger entrance animation for characters
      entranceAnimationKey.current += 1;
      setShowEntranceAnimation(true);
    }
    
    // Trigger entrance animation on initial load
    if (initialLoad) {
      entranceAnimationKey.current += 1;
      setShowEntranceAnimation(true);
    }

    // Update when:
    // 1. Conversation switched (different first message)
    // 2. Initial load (messages just appeared)
    // 3. Loading a conversation for the first time (has messages but no characters selected)
    // 4. savedCharacters from database are available but not yet applied
    const shouldRestoreCharacters =
      conversationChanged ||
      initialLoad ||
      (messages.length > 0 && selectedCharacters.length === 0 && !userHasSelectedCharacters.current) ||
      // Also restore if savedCharacters has values but selectedCharacters is empty
      (savedCharacters && savedCharacters.length > 0 && selectedCharacters.length === 0 && !hasRestoredInitialCharacters.current);

    if (shouldRestoreCharacters) {
      // PRIORITY 1: Use saved characters from database (user's explicit selection)
      if (savedCharacters && savedCharacters.length > 0) {
        setSelectedCharacters(savedCharacters);
        hasRestoredInitialCharacters.current = true;
        if (conversationChanged) {
          userHasSelectedCharacters.current = false;
        }
      } else {
        // PRIORITY 2: Extract unique character IDs from assistant messages (fallback)
        const characterIds = messages
          .filter(msg => msg.role === 'assistant' && msg.characterId)
          .map(msg => msg.characterId as string);

        const uniqueCharacterIds = Array.from(new Set(characterIds));

        // Restore characters from conversation history (limit to max 5)
        if (uniqueCharacterIds.length > 0) {
          setSelectedCharacters(uniqueCharacterIds);
          hasRestoredInitialCharacters.current = true;
          // Reset manual selection flag when switching conversations
          if (conversationChanged) {
            userHasSelectedCharacters.current = false;
          }
        } else if ((conversationChanged || initialLoad) && !userHasSelectedCharacters.current) {
          // New empty conversation or initial load with no assistant messages - set random character
          // Note: Greeting is handled by the second useEffect for brand new conversations
          if (availableCharacters.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableCharacters.length);
            const randomChar = availableCharacters[randomIndex];
            setSelectedCharacters([randomChar.id]);
          } else {
            setSelectedCharacters([DEFAULT_CHARACTER]);
          }
          hasRestoredInitialCharacters.current = true;
          userHasSelectedCharacters.current = false;
        } else if ((conversationChanged || initialLoad) && userHasSelectedCharacters.current) {
          // User manually selected characters - preserve their selection
          hasRestoredInitialCharacters.current = true;
        }
      }
    }

    // Reset flags when conversation changes
    if (conversationChanged) {
      hasRestoredInitialCharacters.current = false;
      hasTriggeredGreeting.current = false; // Allow new greeting for new conversation
    }

    // Update previous messages reference
    previousMessagesRef.current = messages;
  }, [messages, availableCharacters, savedCharacters]);

  // Set random character for brand new conversations (no messages at all)
  // Only if we haven't restored characters yet
  // Also triggers an automatic greeting from the random character
  // IMPORTANT: Use a debounce delay to ensure messages have had time to load from database
  // This prevents false "new conversation" detection during app reload
  useEffect(() => {
    // PERFORMANCE: Skip during active playback - no need to check for new conversation
    if (isPlayingRef.current) {
      return;
    }

    // Don't run while characters are still loading
    if (isLoadingCharacters) {
      return;
    }

    // Use a delay to give messages time to load from database
    // This prevents false positives when the app is reloading and messages haven't arrived yet
    const timer = setTimeout(() => {
      // Only select a random character for truly NEW conversations
      // NOT for existing conversations that are still loading their data
      const isNewConversation =
        messages.length === 0 &&
        selectedCharacters.length === 0 &&
        availableCharacters.length > 0 &&
        !hasRestoredInitialCharacters.current &&
        // If savedCharacters exists (even empty array from DB), this is an existing conversation
        savedCharacters !== undefined &&
        savedCharacters !== null &&
        savedCharacters.length === 0;

      if (isNewConversation && !conversationStarterInProgressRef.current) {
        // Always start with Bob (the tutorial/sales character)
        const bobChar = availableCharacters.find(c => c.id === 'bob-tutorial');
        const selectedChar = bobChar || availableCharacters[0];
        const selectedIds = [selectedChar.id];
        setSelectedCharacters(selectedIds);

        // Generate entrance sequence with random animation types
        const sequence = generateEntranceSequence(selectedIds);
        setEntranceSequence(sequence);
        const totalEntranceDuration = getTotalEntranceDuration(sequence);

        // Trigger entrance animation for new conversation
        entranceAnimationKey.current += 1;
        setShowEntranceAnimation(true);

        // Fire AI conversation starter request IN PARALLEL with entrance animation
        // Skip for Bob - useBobSales hook handles his opening pitch
        const isBobSelected = selectedIds.includes('bob-tutorial');
        if (onGreeting && !hasTriggeredGreeting.current && !isBobSelected) {
          hasTriggeredGreeting.current = true;
          conversationStarterInProgressRef.current = true;
          const entranceStartTime = Date.now();

          // Pick a random story for the conversation starter
          const story = getRandomStory(selectedIds);
          setCurrentStory(story);
          storyInterruptedRef.current = false;

          // Show the story toast
          setStoryToastVisible(true);

          // Fire API request immediately (parallel with animation)
          generateConversationStarter(selectedIds, undefined, story)
            .then(({ scene, responses, storyContext }) => {
              const elapsed = Date.now() - entranceStartTime;
              const remainingEntranceTime = Math.max(0, totalEntranceDuration - elapsed);

              // Wait for entrance to complete if API was faster
              setTimeout(() => {
                // Clear entrance animation
                setShowEntranceAnimation(false);
                setEntranceSequence(new Map());
                conversationStarterInProgressRef.current = false;

                // Hide story toast as characters start talking
                setStoryToastVisible(false);

                // Store story context in Redux for later reference
                if (storyContext) {
                  dispatch(setStoryContext(storyContext));
                }

                // Play conversation starter scene (if not interrupted by user)
                if (scene && responses.length > 0 && !storyInterruptedRef.current) {
                  // Set animation scene for playback
                  playbackEngineRef.current.play(scene);

                  // Save all messages to database
                  responses.forEach(r => {
                    onGreeting(r.characterId, r.content);
                  });
                }
              }, remainingEntranceTime);
            })
            .catch((error) => {
              console.error('[NewConversation] Starter generation failed:', error);
              conversationStarterInProgressRef.current = false;

              // Hide story toast on error
              setStoryToastVisible(false);
              setCurrentStory(null);

              // Fallback to static greeting after entrance completes
              const elapsed = Date.now() - entranceStartTime;
              const remainingTime = Math.max(0, totalEntranceDuration - elapsed);

              setTimeout(() => {
                setShowEntranceAnimation(false);
                setEntranceSequence(new Map());
                const greeting = getRandomGreeting(selectedChar.id, selectedChar.name);
                onGreeting(selectedChar.id, greeting);
              }, remainingTime);
            });
        }

        // For Bob: just clear entrance animation after it completes
        // useBobSales hook will handle his opening pitch
        if (isBobSelected) {
          setTimeout(() => {
            setShowEntranceAnimation(false);
            setEntranceSequence(new Map());
          }, totalEntranceDuration);
        }
      }
    }, 500); // Wait 500ms to allow messages to load from database

    return () => clearTimeout(timer);
  }, [messages.length, selectedCharacters.length, availableCharacters, onGreeting, isLoadingCharacters, savedCharacters, conversationId]);

  // Handle NEW conversations with PRE-SELECTED characters (from CharacterSelectionScreen)
  // These have savedCharacters populated but no messages yet
  // This is separate from the above useEffect which handles auto-selecting Bob for truly empty conversations
  useEffect(() => {
    // Skip during active playback
    if (isPlayingRef.current) {
      return;
    }

    // Don't run while characters are still loading
    if (isLoadingCharacters) {
      return;
    }

    // Use a delay to ensure messages have had time to load from database
    const timer = setTimeout(() => {
      const isNewWithPreselected =
        messages.length === 0 &&
        savedCharacters &&
        savedCharacters.length > 0 &&
        !hasTriggeredGreeting.current &&
        !conversationStarterInProgressRef.current;

      // Skip if Bob is the only selected character (handled by useBobSales hook)
      const isBobOnly = savedCharacters?.length === 1 && savedCharacters[0] === 'bob-tutorial';

      if (isNewWithPreselected && onGreeting && !isBobOnly) {
        hasTriggeredGreeting.current = true;
        conversationStarterInProgressRef.current = true;

        // Use saved characters (user's selection from CharacterSelectionScreen)
        const selectedIds = savedCharacters;
        setSelectedCharacters(selectedIds);

        // Generate entrance animation
        const sequence = generateEntranceSequence(selectedIds);
        setEntranceSequence(sequence);
        const totalEntranceDuration = getTotalEntranceDuration(sequence);
        entranceAnimationKey.current += 1;
        setShowEntranceAnimation(true);

        const entranceStartTime = Date.now();

        // Pick random story and show toast
        const story = getRandomStory(selectedIds);
        setCurrentStory(story);
        storyInterruptedRef.current = false;
        setStoryToastVisible(true);

        // Generate AI greeting (same as existing logic for non-Bob conversations)
        generateConversationStarter(selectedIds, undefined, story)
          .then(({ scene, responses, storyContext }) => {
            const elapsed = Date.now() - entranceStartTime;
            const remainingEntranceTime = Math.max(0, totalEntranceDuration - elapsed);

            // Wait for entrance to complete if API was faster
            setTimeout(() => {
              // Clear entrance animation
              setShowEntranceAnimation(false);
              setEntranceSequence(new Map());
              conversationStarterInProgressRef.current = false;

              // Hide story toast as characters start talking
              setStoryToastVisible(false);

              // Store story context in Redux for later reference
              if (storyContext) {
                dispatch(setStoryContext(storyContext));
              }

              // Play conversation starter scene (if not interrupted by user)
              if (scene && responses.length > 0 && !storyInterruptedRef.current) {
                // Set animation scene for playback
                playbackEngineRef.current.play(scene);

                // Save all messages to database
                responses.forEach(r => {
                  onGreeting(r.characterId, r.content);
                });
              }
            }, remainingEntranceTime);
          })
          .catch((error) => {
            console.error('[NewConversation] Pre-selected starter generation failed:', error);
            conversationStarterInProgressRef.current = false;

            // Hide story toast on error
            setStoryToastVisible(false);
            setCurrentStory(null);

            // Fallback to static greeting after entrance completes
            const elapsed = Date.now() - entranceStartTime;
            const remainingTime = Math.max(0, totalEntranceDuration - elapsed);

            setTimeout(() => {
              setShowEntranceAnimation(false);
              setEntranceSequence(new Map());
              // Get first character for fallback greeting
              const firstCharId = selectedIds[0];
              const firstChar = availableCharacters.find(c => c.id === firstCharId);
              if (firstChar) {
                const greeting = getRandomGreeting(firstChar.id, firstChar.name);
                onGreeting(firstChar.id, greeting);
              }
            }, remainingTime);
          });
      }
    }, 500); // Wait 500ms to allow messages to load from database

    return () => clearTimeout(timer);
  }, [messages.length, savedCharacters, availableCharacters, onGreeting, isLoadingCharacters, dispatch]);

  // Update name key when characters change (for animation reset)
  useEffect(() => {
    setNameKey(prev => prev + 1);
  }, [selectedCharacters]);

  // Characters are now fixed at conversation creation - no need to persist changes
  // The savedCharacters prop is read-only and set when conversation is created

  // Clear entrance animation after duration - fallback if not cleared by conversation starter
  // Uses entrance sequence duration if available, otherwise default 1200ms
  useEffect(() => {
    if (showEntranceAnimation && !conversationStarterInProgressRef.current) {
      const duration = entranceSequence.size > 0
        ? getTotalEntranceDuration(entranceSequence) + 200 // Add small buffer
        : 1200;
      const timeout = setTimeout(() => {
        setShowEntranceAnimation(false);
        setEntranceSequence(new Map());
      }, duration);
      return () => clearTimeout(timeout);
    }
  }, [showEntranceAnimation, entranceSequence]);

  // Pan responder for resizable divider - fixed 85-90% height constraints
  // Uses refs to get latest values (avoids stale closure issue)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const newHeight = characterHeightRef.current + gestureState.dy;
        // Use available container height, not window height
        const containerHeight = availableHeightRef.current || Dimensions.get('window').height;

        // Fixed 85-90% constraints based on available container height
        const minHeight = Math.max(
          Math.floor(containerHeight * CHARACTER_HEIGHT.MIN_PERCENT),
          CHARACTER_HEIGHT.ABSOLUTE_MIN_PX
        );
        const maxHeight = Math.floor(containerHeight * CHARACTER_HEIGHT.MAX_PERCENT);

        // Clamp to constraints
        const clampedHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
        setCharacterHeight(clampedHeight);
      },
      onPanResponderRelease: () => {
        // Save user's preferred percentage for resize persistence
        // Only save when chat is NOT shown - don't save the small "chat open" height as preference
        const containerHeight = availableHeightRef.current || Dimensions.get('window').height;
        const currentPercent = characterHeightRef.current / containerHeight;
        // Only update preference if it's above MIN_PERCENT (not the "chat shown" small height)
        if (currentPercent > CHARACTER_HEIGHT.MIN_PERCENT + 0.05) {
          userPreferredPercentRef.current = currentPercent;
        }
      },
    })
  ).current;

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // Cancel editing when loading is handled by useMessageEditing hook

  // Voice recorder setup is handled by useVoiceRecording hook

  const handleSendMessagePress = () => {
    // Check if user is blocked due to token limit
    if (isBlocked) {
      showAlert(
        'Token Limit Reached',
        'You have used all your tokens for this period. Please wait for the reset or upgrade your plan.'
      );
      return;
    }

    if (input.trim()) {
      setPendingUserMessage(input.trim()); // Show user message in speech bubble
      onSendMessage(input, selectedCharacters);
      setInput('');
    }
  };

  const handleKeyPress = (e: any) => {
    // Check for Ctrl+Enter (PC) or Cmd+Enter (Mac)
    if (e.nativeEvent.key === 'Enter' && (e.nativeEvent.ctrlKey || e.nativeEvent.metaKey)) {
      e.preventDefault();
      handleSendMessagePress();
    }
  };

  // Voice recording functions (toggleRecording, cancelRecording, restartRecording, togglePause) provided by useVoiceRecording hook

  // Message editing functions (startEditingMessage, saveEditedMessage, cancelEditing, confirmDeleteMessage, handleLongPressMessage) provided by useMessageEditing hook
  // Alias for backwards compatibility in JSX
  const handleLongPress = handleLongPressMessage;

  // Test function to trigger all characters speaking at random times
  const handleTestSpeech = () => {
    if (selectedCharacters.length === 0) {
      showAlert('No Characters', 'Please select at least one Wakattor to test.');
      return;
    }

    const testText = `To the One Beyond the Horizon..
Where goes the wind when day departs?
It carries, perhaps, our vanished dreams—
The faint perfume of your forgotten laughter,
The ashes of words that once burned like suns.

I see you still, beyond the edge of memory,
A light half-veiled by time's weary hand.
Your voice was a temple—vast, echoing,
Where my heart knelt and did not pray, but trembled.

Night lays its shadow upon my brow,
Yet your gaze, carved in the vast silence, endures.
Even the sea, in its mourning, repeats your name,
Folding each wave like a letter never sent.

O love, fierce phantom, sovereign of my soul—
You are absence that blooms like a dark rose,
Fragrance of the infinite, ache of the immortal,
Chalice filled with tears and constellations.

The stars, those patient witnesses of all vows,
Bend low above the ruins of my reverie,
And whisper: nothing ends, all transforms—
Even loss becomes a kind of eternity.

So I walk on—through the mists of days,
Your shadow hand in mine, unseen, untired.
Each breath I draw is half a prayer,
Each silence, a cathedral where you still reside.`;

    // Calculate text reveal timing using the shared DEFAULT_TALKING_SPEED constant
    const msPerChar = DEFAULT_TALKING_SPEED;
    const textDuration = testText.length * msPerChar;

    // Get screen width for position calculation
    const screenWidth = Dimensions.get('window').width;
    const totalCharacters = selectedCharacters.length;

    // Create timelines for each selected character
    const timelines: CharacterTimeline[] = selectedCharacters.map((characterId, index) => {
      // Random start delay between 0 and 3 seconds, staggered
      const baseDelay = index * 500; // 500ms stagger between characters
      const randomDelay = Math.random() * 500; // Plus 0-0.5s random
      const startDelay = baseDelay + randomDelay;

      // Determine character position and look direction for poem mode
      const position = calculateCharacterPosition(index, totalCharacters, screenWidth);

      let poemLookDirection: LookDirection;
      if (position.isCenterCharacter || position.horizontalOffset === 0) {
        // Center character looks left
        poemLookDirection = 'left' as LookDirection;
      } else if (position.horizontalOffset < 0) {
        // Left character looks at right (toward center)
        poemLookDirection = 'at_right_character' as LookDirection;
      } else {
        // Right character looks at left (toward center)
        poemLookDirection = 'at_left_character' as LookDirection;
      }

      // Create segments for speaking animation
      const segments: AnimationSegment[] = [
        {
          animation: 'talking' as AnimationState,
          duration: textDuration,
          complementary: {
            lookDirection: poemLookDirection,
            eyeState: 'normal' as EyeState,
            mouthState: 'talking' as MouthState,
          },
          isTalking: true,
          textReveal: {
            startIndex: 0,
            endIndex: testText.length,
          },
        },
        // Idle at the end
        {
          animation: 'idle' as AnimationState,
          duration: 2000,
          complementary: {
            lookDirection: poemLookDirection,
            eyeState: 'normal' as EyeState,
            mouthState: 'neutral' as MouthState,
          },
          isTalking: false,
        },
      ];

      return {
        characterId,
        content: testText,
        totalDuration: textDuration + 2000,
        segments,
        startDelay,
      };
    });

    // Calculate total scene duration
    const maxEndTime = Math.max(
      ...timelines.map(t => t.startDelay + t.totalDuration)
    );

    // Estimate TTS duration and adjust animation speed to match (if TTS is enabled)
    let adjustedTimelines = timelines;
    if (ttsEnabled && isTTSSupported) {
      const ttsDuration = estimateTTSDuration(testText, 1.0); // normal TTS rate
      adjustedTimelines = timelines.map(timeline =>
        adjustTimelineToTargetDuration(timeline, ttsDuration)
      );
    }

    // Recalculate scene duration with adjusted timelines
    const adjustedMaxEndTime = Math.max(
      ...adjustedTimelines.map(t => t.startDelay + t.totalDuration)
    );

    // Create the test scene with adjusted timelines
    const testScene: OrchestrationScene = {
      timelines: adjustedTimelines,
      sceneDuration: adjustedMaxEndTime,
      nonSpeakerBehavior: {},
    };

    // Set voice profiles before playing
    const voiceProfiles = buildVoiceProfilesMap();
    playbackEngineRef.current.setCharacterVoiceProfiles(voiceProfiles);

    // Store poem text for TTS BEFORE playing (TTS starts when playback begins)
    pendingTTSTextRef.current.clear();
    selectedCharacters.forEach(characterId => {
      pendingTTSTextRef.current.set(characterId, testText);
    });

    // Start playback (TTS will start simultaneously via useEffect)
    playbackEngineRef.current.play(testScene);
  };

  // Replay function - replays all character messages from the conversation
  // Uses stored animation data when available for authentic playback
  const handleReplay = () => {
    // Get only character messages (not user messages)
    const characterMessages = messages.filter(m => m.characterId && m.content);

    if (characterMessages.length === 0) {
      showAlert('No Messages', 'No messages to replay yet.');
      return;
    }

    // Replay all character messages
    const messagesToReplay = characterMessages;

    // Build timelines - USE STORED ANIMATION DATA if available
    const msPerChar = DEFAULT_TALKING_SPEED;
    let currentDelay = 0;

    const timelines: CharacterTimeline[] = messagesToReplay.map((message) => {
      const startDelay = currentDelay;

      // Try to get cached animation data
      const cacheKey = `${message.characterId}:${message.content}`;
      const cachedData = animationDataCacheRef.current.get(cacheKey);

      let segments: AnimationSegment[];
      let totalDuration: number;

      if (cachedData) {
        // Use original animations from cache
        segments = cachedData.segments;
        totalDuration = cachedData.totalDuration;
      } else {
        // Fallback to generic talking animation
        const textDuration = message.content.length * msPerChar;
        segments = [
          {
            animation: 'talking' as AnimationState,
            duration: textDuration,
            complementary: {
              lookDirection: 'center' as LookDirection,
              eyeState: 'open' as EyeState,
              mouthState: 'open' as MouthState,
            },
            isTalking: true,
            textReveal: {
              startIndex: 0,
              endIndex: message.content.length,
            },
          },
          {
            animation: 'idle' as AnimationState,
            duration: 500,
            complementary: {
              lookDirection: 'center' as LookDirection,
            },
            isTalking: false,
          },
        ];
        totalDuration = textDuration + 500;
      }

      // Add gap between messages (1 second)
      currentDelay += totalDuration + 1000;

      return {
        characterId: message.characterId!,
        content: message.content,
        totalDuration,
        segments,
        startDelay,
      };
    });

    const maxEndTime = Math.max(...timelines.map(t => t.startDelay + t.totalDuration));

    const replayScene: OrchestrationScene = {
      timelines,
      sceneDuration: maxEndTime,
      nonSpeakerBehavior: {},
    };

    // Set voice profiles before playing
    const voiceProfiles = buildVoiceProfilesMap();
    playbackEngineRef.current.setCharacterVoiceProfiles(voiceProfiles);

    // Store text for TTS - concatenate all messages per character for replay
    pendingTTSTextRef.current.clear();
    for (const timeline of timelines) {
      if (timeline.content && timeline.content.trim()) {
        const existing = pendingTTSTextRef.current.get(timeline.characterId);
        if (existing) {
          // Concatenate multiple messages from same character
          pendingTTSTextRef.current.set(timeline.characterId, existing + ' ' + timeline.content);
        } else {
          pendingTTSTextRef.current.set(timeline.characterId, timeline.content);
        }
      }
    }

    // Start playback
    playbackEngineRef.current.play(replayScene);
  };

  return (
    <>
      <AlertComponent />

      {/* Upgrade Prompt Modal - shown at 80% usage */}
      {currentUsage && (
        <UpgradePromptModal
          visible={showUpgradeModal}
          usage={currentUsage}
          onUpgrade={handleUpgradePress}
          onDismiss={handleDismissWarning}
        />
      )}

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        onLayout={handleContainerLayout}
      >
      {/* 3D Character Display - Hidden in landscape when chat history is shown */}
      {!(isMobileLandscape && showChatHistory) && (
      <View style={[
        styles.characterDisplayContainer,
        // In mobile landscape, take available space but cap at 35%
        // Otherwise use characterHeight (25-35% range, user can resize)
        isMobileLandscape
          ? { flex: 1, maxHeight: screenHeight * CHARACTER_HEIGHT.MAX_PERCENT }
          : { height: characterHeight }
      ]}>
        {/* Playback Control Buttons - Flex container for Replay and Stop/Play */}
        <View style={styles.playbackButtonsContainer}>
          {/* Replay Button - replays all messages */}
          {(() => {
            const btnPadH = scaleValue(6, 14);
            const btnPadV = scaleValue(4, 10);
            const btnGap = scaleValue(4, 10);
            const iconSize = scaleValue(14, 24);
            const fontSize = scaleValue(11, 16);

            return (
              <TouchableOpacity
                style={[
                  styles.playbackButton,
                  { paddingHorizontal: btnPadH, paddingVertical: btnPadV, gap: btnGap }
                ]}
                onPress={handleReplay}
              >
                <Ionicons name="refresh" size={iconSize} color="#3b82f6" />
                <Text style={[styles.playbackButtonText, { fontSize, color: '#3b82f6' }]}>
                  Replay
                </Text>
              </TouchableOpacity>
            );
          })()}

          {/* Stop / Play Button */}
          {(() => {
            const btnPadH = scaleValue(6, 14);
            const btnPadV = scaleValue(4, 10);
            const btnGap = scaleValue(4, 10);
            const iconSize = scaleValue(14, 24);
            const fontSize = scaleValue(11, 16);

            const isPlaying = playbackState.isPlaying;

            return (
              <TouchableOpacity
                style={[
                  styles.playbackButton,
                  { paddingHorizontal: btnPadH, paddingVertical: btnPadV, gap: btnGap }
                ]}
                onPress={isPlaying ? stopPlayback : handleTestSpeech}
              >
                <Ionicons
                  name={isPlaying ? "stop-circle" : "play-circle"}
                  size={iconSize}
                  color={isPlaying ? "#ef4444" : "#22c55e"}
                />
                <Text style={[styles.playbackButtonText, { fontSize, color: isPlaying ? "#ef4444" : "#22c55e" }]}>
                  {isPlaying ? 'Stop' : 'Poem'}
                </Text>
              </TouchableOpacity>
            );
          })()}
        </View>

        {/* User Speech Bubble - Shows user's message with typing animation */}
        {pendingUserMessage && (
          <View style={styles.userSpeechBubbleContainer}>
            <View style={styles.userSpeechBubble}>
              <Text style={[styles.userSpeechText, { fontSize: fonts.sm }]}>
                {typedUserMessage}
                {typedUserMessage.length < pendingUserMessage.length && (
                  <Text style={styles.typingCursor}>|</Text>
                )}
              </Text>
            </View>
          </View>
        )}

        {/* Thinking Indicator - Shows animated dots while AI is processing */}
        {isLoading && !playbackState.isPlaying && (
          <View style={styles.thinkingIndicatorContainer}>
            <View style={styles.thinkingIndicator}>
              <Ionicons name="chatbubble-ellipses" size={scaleValue(14, 20)} color="#a855f7" />
              <Text style={[styles.thinkingText, { fontSize: fonts.sm }]}>Thinking</Text>
              <ThinkingDots />
            </View>
          </View>
        )}

        {/* Mobile Speech Bubble Stack - Renders all active bubbles in a scrollable container */}
        {/* Protected from overflowing into input area via dynamic maxHeight with scroll */}
        {/* In mobile landscape, use side positioning instead of stacked */}
        {isMobile && selectedCharacters.length > 1 && !isMobileLandscape && (
          <ScrollView
            style={[styles.mobileBubbleStack, { maxHeight: Math.floor(characterHeight * 0.6) }]}
            contentContainerStyle={styles.mobileBubbleStackContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {limitedCharacters.map((characterId, index) => {
              const character = availableCharacters.find(c => c.id === characterId) || getCharacter(characterId);
              const charPlaybackState = playbackState.characterStates.get(characterId);
              const usePlayback = playbackState.isPlaying && charPlaybackState;

              // Get current text from playback, or fall back to last saved text for persistence
              // Use lastMessagesFromConversation as immediate fallback (computed synchronously)
              const lastSavedTextFromRef = lastCharacterTextRef.current.get(characterId);
              const lastSavedTextFromDB = lastMessagesFromConversation.get(characterId);
              const lastSavedText = lastSavedTextFromRef || lastSavedTextFromDB;
              // During playback: use revealed text. After playback: use fullText to prevent flickering to old partial text
              const playbackText = usePlayback ? playbackEngineRef.current.getRevealedText(characterId) : '';
              const revealedText = playbackText || lastSavedText?.fullText || lastSavedText?.text || '';
              const fullTextContent = usePlayback ? playbackEngineRef.current.getFullText(characterId) : (lastSavedText?.fullText || '');
              const isSpeakingNow = usePlayback && charPlaybackState?.isTalking;
              const isTypingNow = usePlayback && revealedText && revealedText.length > 0;


              // Get bubbles from queue (persists after playback ends)
              const characterBubbles = getBubblesForCharacter(characterId);

              // Render bubble if speaking, typing, has bubbles, OR has saved text to persist
              const hasBubbles = characterBubbles.length > 0;
              const hasPersistedText = lastSavedText?.text && lastSavedText.text.length > 0;
              if (!isSpeakingNow && !isTypingNow && !hasBubbles && !hasPersistedText) return null;

              return (
                <MemoizedCharacterSpeechBubble
                  key={`mobile-bubble-${characterId}`}
                  bubbles={hasBubbles ? characterBubbles : undefined}
                  text={revealedText || ''}
                  fullText={fullTextContent}
                  characterName={character.name}
                  characterColor={character.color}
                  position="left"
                  isTyping={!!isTypingNow}
                  isSpeaking={!!isSpeakingNow}
                  isSingleCharacter={false}
                  isMobileStacked={true}
                  stackIndex={index}
                  characterCount={selectedCharacters.length}
                  getAnimationState={(bubbleId) => getAnimationState(characterId, bubbleId)}
                  onAnimationComplete={(bubbleId, animation) => onBubbleAnimationComplete(characterId, bubbleId, animation)}
                  // Responsive props for mobile stacked bubbles
                  maxWidth={screenWidth - 32} // Full width minus padding
                  maxHeight={Math.floor(characterHeight * 0.4)} // Max 40% of character area
                  screenWidth={screenWidth}
                  characterIndex={index}
                />
              );
            })}
          </ScrollView>
        )}

        {/* Multiple Character Display - Semi-circle arrangement (table view) */}
        <View style={styles.charactersRow}>
          {selectedCharacters.length === 0 ? (
            <View style={styles.emptyCharacterState}>
              <Ionicons name="person-add" size={48} color="#666" />
              <Text style={[styles.emptyCharacterText, { fontSize: fonts.md }]}>Click "0 Wakattors" to select characters</Text>
            </View>
          ) : (
            (() => {
              // Using memoized limitedCharacters from component scope
              return limitedCharacters.map((characterId, index) => {
              // Get character from availableCharacters (includes custom wakattors) or fallback to built-in
              const character = availableCharacters.find(c => c.id === characterId) || getCharacter(characterId);
              const total = Math.min(selectedCharacters.length, 5);
              
              // Calculate semi-circle position (like sitting around a table)
              // Center character is furthest (top/back), side characters are closest (bottom/front)
              // Custom angle ranges per character count
              const angleRangeByCount: Record<number, number> = {
                1: 0,    // Centered
                2: 50,   // -25°, +25°
                3: 70,   // -35°, 0°, +35°
                4: 100,  // -50°, -16.7°, +16.7°, +50°
                5: 100,  // -50°, -25°, 0°, +25°, +50°
              };
              const angleRange = angleRangeByCount[total] ?? 100;
              const startAngle = -angleRange / 2;
              const angleStep = total > 1 ? angleRange / (total - 1) : 0;
              const angle = total === 1 ? 0 : startAngle + (index * angleStep);
              const angleRad = (angle * Math.PI) / 180;
              
              // Calculate horizontal position (percentage from center)
              // Proportional spread - scales with screen width (35% at 320px, 50% at 768px+)
              const minSpread = 30;
              const maxSpread = 50;
              const spreadFactor = Math.min(maxSpread, minSpread + ((screenWidth - 280) / (768 - 280)) * (maxSpread - minSpread));
              const horizontalOffset = Math.sin(angleRad) * spreadFactor;
              
              // Distance from center (0 = center, 1 = edges)
              // Handle single character case where angleRange is 0 to avoid NaN
              const distanceFromCenter = angleRange > 0 ? Math.abs(angle) / (angleRange / 2) : 0;
              
              // Vertical position: CENTER is higher (further back), EDGES are lower (closer)
              // cos(0) = 1 for center, cos(±70°) ≈ 0.34 for edges
              // Push characters lower when there are more, to leave room for speech bubbles
              const bubbleSpaceOffset = Math.max(0, (total - 1) * 3); // Extra offset per character
              const verticalPosition = Math.cos(angleRad) * 20 - bubbleSpaceOffset; // Center gets +20%, edges get less
              
              // Scale: CENTER is smaller (further away), EDGES are larger (closer)
              // Base scale increased for closer camera view
              // Apply characterScaleFactor to make characters smaller when there are more of them
              const baseScale = 0.8 + (distanceFromCenter * 0.3); // Center: 0.8, Edges: 1.1
              const scale = baseScale * characterScaleFactor; // Scale down based on character count
              
              // Z-index: EDGES have higher z-index (in front), CENTER has lower (behind)
              const zIndex = Math.round(distanceFromCenter * 10);
              
              // Determine speech bubble position based on character position in scene
              // Characters on the left side of center get bubbles on their right, and vice versa
              const bubblePosition = horizontalOffset < 0 ? 'right' : horizontalOffset > 0 ? 'left' : (index % 2 === 0 ? 'right' : 'left');
              
              // Center character (odd number of characters: 3 or 5) should have bubble above (like single character)
              const isCenterCharacter = horizontalOffset === 0 && total > 1;
              
              // Get revealed text for this character's speech bubble
              const charPlaybackState = playbackState.characterStates.get(characterId);
              const usePlayback = playbackState.isPlaying && charPlaybackState;
              // Get current text from playback, or fall back to last saved text for persistence
              // Use lastMessagesFromConversation as immediate fallback (computed synchronously)
              const lastSavedTextFromRef = lastCharacterTextRef.current.get(characterId);
              const lastSavedTextFromDB = lastMessagesFromConversation.get(characterId);
              const lastSavedText = lastSavedTextFromRef || lastSavedTextFromDB;
              // During playback: use revealed text. After playback: use fullText to prevent flickering to old partial text
              const playbackText = usePlayback ? playbackEngineRef.current.getRevealedText(characterId) : '';
              const revealedText = playbackText || lastSavedText?.fullText || lastSavedText?.text || '';
              const fullTextContent = usePlayback ? playbackEngineRef.current.getFullText(characterId) : (lastSavedText?.fullText || '');
              const isSpeaking = usePlayback && charPlaybackState?.isTalking;
              const isTyping = usePlayback && revealedText && revealedText.length > 0;


              // Get entrance config for this character (if in entrance animation)
              const charEntranceConfig = entranceSequence.get(characterId);

              return (
                <FloatingCharacterWrapper
                  key={characterId}
                  index={index}
                  characterName={character.name}
                  characterColor={character.color}
                  entranceAnimation={showEntranceAnimation}
                  entranceKey={entranceAnimationKey.current}
                  isLeftSide={horizontalOffset < 0}
                  entranceConfig={charEntranceConfig}
                  actionText={usePlayback ? playbackEngineRef.current.getActionText(characterId) : undefined}
                  onHoverChange={(isHovered) => setHoveredCharacterId(isHovered ? characterId : null)}
                  style={[
                    styles.characterWrapper,
                    {
                      position: 'absolute',
                      // Proportional positioning based on screen width
                      left: `${47 + horizontalOffset - (100 / total / 2)}%`,
                      width: `${Math.max(100 / total, 22)}%`,
                      top: `${15 + (20 - verticalPosition)}%`, // Center higher up, edges lower (lowered from 25% to 15%)
                      // Scale based on character count only - CharacterDisplay3D handles screen-width scaling
                      transform: [{ scale: scale }],
                      zIndex: zIndex,
                    }
                  ]}
                >
                  {(() => {
                    // Use entrance-specific animation based on entrance type, fallback to walking
                    const entranceBodyAnimation = showEntranceAnimation && charEntranceConfig
                      ? charEntranceConfig.bodyAnimation
                      : (showEntranceAnimation ? 'walking' : undefined);
                    
                    // Get idle state for this character (fallback when not playing)
                    const idleState = idleAnimations.get(characterId);

                    // Priority: entrance animation > playback animation > idle animation
                    const finalAnimation = entranceBodyAnimation
                      || (usePlayback ? charPlaybackState.animation : undefined)
                      || idleState?.animation;
                    
                    // Complementary: playback state > idle state complementary
                    const finalComplementary = usePlayback 
                      ? charPlaybackState.complementary 
                      : idleState?.complementary;
                    
                    const isHovered = hoveredCharacterId === characterId;
                    const finalIsActive = (usePlayback && charPlaybackState?.isActive) || showEntranceAnimation || !!idleState;
                    return (
                      <MemoizedCharacterDisplay3D
                        character={character}
                        isActive={finalIsActive}
                        animation={finalAnimation}
                        isTalking={usePlayback && charPlaybackState?.isTalking}
                        complementary={finalComplementary}
                        showName={isHovered}
                        nameKey={nameKey}
                      />
                    );
                  })()}
                  {/* Speech Bubble - Comic book style, to the side of character (or above if single/center) */}
                  {/* On mobile portrait with multiple characters, use the stacked bubbles above instead */}
                  {/* In mobile landscape, always show bubbles beside characters */}
                  {(isMobileLandscape || !(isMobile && total > 1)) && (() => {
                    // Get bubbles from queue for this character
                    const characterBubbles = getBubblesForCharacter(characterId);

                    return (
                      <MemoizedCharacterSpeechBubble
                        bubbles={characterBubbles.length > 0 ? characterBubbles : undefined}
                        text={revealedText || ''}
                        fullText={fullTextContent}
                        characterName={character.name}
                        characterColor={character.color}
                        position={bubblePosition}
                        isTyping={!!isTyping}
                        isSpeaking={!!isSpeaking}
                        isSingleCharacter={total === 1 || isCenterCharacter}
                        characterCount={total}
                        getAnimationState={(bubbleId) => getAnimationState(characterId, bubbleId)}
                        onAnimationComplete={(bubbleId, animation) => onBubbleAnimationComplete(characterId, bubbleId, animation)}
                        // Responsive props
                        maxWidth={bubbleMaxWidth}
                        maxHeight={bubbleMaxHeight}
                        topOffset={getBubbleTopOffset(index)}
                        screenWidth={screenWidth}
                        characterIndex={index}
                      />
                    );
                  })()}
                </FloatingCharacterWrapper>
              );
            });
            })()
          )}
        </View>
      </View>
      )}

      {/* Resizable Divider - Hidden in mobile landscape mode */}
      {!isMobileLandscape && (
      <View
        {...panResponder.panHandlers}
        style={styles.divider}
      >
        {/* Chat History Toggle Button - Centered, overflowing the divider */}
        <TouchableOpacity
          onPress={() => setShowChatHistory(!showChatHistory)}
          style={[
            styles.dividerToggleButton,
            showChatHistory && styles.dividerToggleButtonActive,
            {
              paddingHorizontal: scaleValue(12, 24),
              paddingVertical: scaleValue(6, 12),
              gap: scaleValue(3, 6),
              borderRadius: scaleValue(16, 28),
            }
          ]}
        >
          <Ionicons
            name={showChatHistory ? "chevron-down" : "chevron-up"}
            size={scaleValue(12, 22)}
            color={showChatHistory ? "#ffffff" : "#a1a1aa"}
          />
          <Ionicons
            name={showChatHistory ? "chatbubbles" : "chatbubbles-outline"}
            size={scaleValue(14, 24)}
            color={showChatHistory ? "#ffffff" : "#a1a1aa"}
          />
          {messages.length > 0 && (
            <View style={[
              styles.dividerMessageBadge,
              showChatHistory && styles.dividerMessageBadgeActive,
              {
                minWidth: scaleValue(16, 26),
                height: scaleValue(16, 26),
                borderRadius: scaleValue(8, 13),
                paddingHorizontal: scaleValue(4, 8),
              }
            ]}>
              <Text style={[styles.dividerMessageBadgeText, showChatHistory && { color: '#5398BE' }, { fontSize: fonts.xs }]}>
                {messages.length > 99 ? '99+' : messages.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      )}

      {/* Mobile Landscape Toggle - Prominent floating button */}
      {isMobileLandscape && (
        <TouchableOpacity
          onPress={() => setShowChatHistory(!showChatHistory)}
          style={[
            styles.landscapeToggleButton,
            showChatHistory && styles.landscapeToggleButtonActive,
            {
              paddingHorizontal: scaleValue(12, 24),
              paddingVertical: scaleValue(8, 16),
              gap: scaleValue(6, 12),
              borderRadius: scaleValue(18, 32),
            }
          ]}
        >
          <Ionicons
            name={showChatHistory ? "people" : "chatbubbles"}
            size={scaleValue(18, 32)}
            color="#ffffff"
          />
          <Text style={[styles.landscapeToggleText, { fontSize: fonts.sm }]}>
            {showChatHistory ? 'Characters' : 'Chat'}
          </Text>
          {!showChatHistory && messages.length > 0 && (
            <View style={[
              styles.landscapeToggleBadge,
              {
                minWidth: scaleValue(18, 28),
                height: scaleValue(18, 28),
                borderRadius: scaleValue(9, 14),
                paddingHorizontal: scaleValue(5, 9),
              }
            ]}>
              <Text style={[styles.landscapeToggleBadgeText, { fontSize: fonts.xs }]}>
                {messages.length > 99 ? '99+' : messages.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Fullscreen Toggle Button (web only) */}
      {Platform.OS === 'web' && (
        <View
          style={[
            styles.fullscreenButton,
            isFullscreen && styles.fullscreenButtonActive,
          ]}
          // @ts-ignore - onMouseEnter/Leave work on web
          onMouseEnter={() => setIsFullscreenHovered(true)}
          onMouseLeave={() => setIsFullscreenHovered(false)}
        >
          <TouchableOpacity
            onPress={toggleFullscreen}
            style={styles.fullscreenButtonInner}
            accessibilityLabel={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            <Ionicons
              name={isFullscreen ? "contract" : "expand"}
              size={20}
              color="#ffffff"
            />
          </TouchableOpacity>
          {/* Tooltip */}
          {isFullscreenHovered && (
            <View style={styles.fullscreenTooltip}>
              <Text style={styles.fullscreenTooltipText}>
                {isFullscreen ? 'Exit fullscreen (Esc)' : 'Enter fullscreen'}
              </Text>
            </View>
          )}
        </View>
      )}


      {/* Content area - always takes remaining space (eliminates need for spacer) */}
      <View style={{ flex: 1 }}>
        {/* Chat Messages - Only show when showChatHistory is true */}
        {showChatHistory && (
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.messagesContainer}
            style={[
              styles.chatScrollView,
              // In mobile landscape, chat takes full available height
              isMobileLandscape && { flex: 1 }
            ]}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
          <View style={styles.messagesContent}>
            {messages.map((message, index) => {
              const character = message.characterId ? getCharacter(message.characterId) : null;
              // Alternate character positions: even index = left, odd = right
              const characterPosition = message.role === 'assistant' ? (index % 2 === 0 ? 'left' : 'right') : null;

              // Check if this message is being animated and has no revealed text yet
              const isAnimating = message.characterId && 
                animatingMessages.get(message.characterId) === message.id &&
                playbackState.isPlaying;
              
              // Get revealed text for animated messages
              const revealedText = isAnimating && message.characterId 
                ? playbackEngineRef.current.getRevealedText(message.characterId) 
                : null;
              
              // Hide bubble completely if animating but no text revealed yet
              if (isAnimating && (!revealedText || revealedText.length === 0)) {
                return null;
              }

              return (
                <View
                  key={message.id}
                  style={[
                    styles.messageBubbleContainer,
                    message.role === 'user' && styles.userMessageContainer,
                    characterPosition === 'left' && styles.assistantMessageLeft,
                    characterPosition === 'right' && styles.assistantMessageRight,
                  ]}
                >
                  <TouchableOpacity
                    onLongPress={() => handleLongPress(message)}
                    activeOpacity={message.role === 'user' ? 0.7 : 1}
                    style={[
                      styles.messageBubble,
                      message.role === 'user' && styles.userMessageBubble,
                      message.role === 'assistant' && character && { backgroundColor: character.color + '20', borderColor: character.color, borderWidth: 2 },
                    ]}
                  >
                    {editingMessageId === message.id ? (
                      <View style={styles.editingMessageContainer}>
                        <TextInput
                          style={[styles.editMessageInput, { fontSize: fonts.md }]}
                          value={editingContent}
                          onChangeText={setEditingContent}
                          multiline
                          autoFocus
                          placeholder="Edit message..."
                          placeholderTextColor="#71717a"
                        />
                        <View style={styles.editActions}>
                          <TouchableOpacity onPress={cancelEditing} style={styles.editActionButton}>
                            <Text style={[styles.cancelText, { fontSize: fonts.sm }]}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={saveEditedMessage} style={[styles.editActionButton, styles.saveButton]}>
                            <Text style={[styles.saveText, { fontSize: fonts.sm }]}>Save</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <>
                        {/* Character Name for Assistant Messages */}
                        {message.role === 'assistant' && character && (
                          <Text style={[styles.characterName, { color: character.color, fontSize: fonts.lg }]}>
                            {character.name}
                          </Text>
                        )}
                        {(() => {
                          if (isAnimating && revealedText !== null) {
                            // Pre-calculated line wrapping - prevents words jumping between lines
                            const lines = wrapTextWithReveal(message.content, revealedText.length, 60);
                            const showCursor = revealedText.length < message.content.length;
                            return (
                              <View>
                                {lines.map((line, lineIndex) => (
                                  <Text key={lineIndex} style={[styles.messageText, { fontSize: fonts.md }]}>
                                    {line}
                                    {showCursor && lineIndex === lines.length - 1 && (
                                      <Text style={styles.messageTypingCursor}>|</Text>
                                    )}
                                  </Text>
                                ))}
                              </View>
                            );
                          }

                          // Show full text when not animating
                          return <Text style={[styles.messageText, { fontSize: fonts.md }]}>{message.content}</Text>;
                        })()}
                        {message.created_at && (
                          <Text style={[styles.messageTimestamp, { fontSize: fonts.xs }]}>
                            {formatTimestamp(message.created_at)}
                          </Text>
                        )}
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </ScrollView>
        )}
      </View>

      {/* Token Usage Warning Banner - shown at 90%+ usage */}
      {currentUsage &&
        currentUsage.warningLevel === 'critical' &&
        !lastWarningDismissed &&
        currentUsage.tier !== 'admin' && (
        <LimitWarningBanner
          usage={currentUsage}
          onDismiss={handleDismissWarning}
          onUpgrade={handleUpgradePress}
        />
      )}

      {/* Blocked Indicator - shown when at 100% usage */}
      {isBlocked && currentUsage && (
        <BlockedInputIndicator
          usage={currentUsage}
          onUpgrade={handleUpgradePress}
        />
      )}

      {/* Multi-user Collaboration Panel */}
      {conversationId && (
        <CollaborationPanel
          conversationId={conversationId}
        />
      )}

      <View style={[styles.inputContainer, { padding: screenWidth < 360 ? spacing.sm : spacing.md }]}>
        {/* Recording Status & Live Transcript */}
        {(isRecording || liveTranscript || isTranscribing) && (
          <View style={[styles.recordingStatusContainer, { paddingHorizontal: screenWidth < 360 ? spacing.sm : spacing.md }]}>
            {isRecording && (
              <View style={styles.recordingStatus}>
                <View style={[styles.recordingDot, isPaused && styles.recordingDotPaused]} />
                <Text style={[styles.recordingText, { fontSize: fonts.sm }]}>
                  {Math.floor(recordingDuration / 60)}:{String(recordingDuration % 60).padStart(2, '0')}
                </Text>
                {/* Pause/Resume button */}
                <TouchableOpacity onPress={togglePause} style={styles.recordingActionButton}>
                  <Ionicons name={isPaused ? "play" : "pause"} size={18} color="#a1a1aa" />
                </TouchableOpacity>
                {/* Restart button */}
                <TouchableOpacity onPress={restartRecording} style={styles.recordingActionButton}>
                  <Ionicons name="refresh" size={18} color="#a1a1aa" />
                </TouchableOpacity>
                {/* OK/Confirm button */}
                <TouchableOpacity onPress={toggleRecording} style={styles.recordingConfirmButton}>
                  <Ionicons name="checkmark" size={20} color="white" />
                </TouchableOpacity>
                {/* Delete/Cancel button */}
                <TouchableOpacity onPress={cancelRecording} style={styles.recordingActionButton}>
                  <Ionicons name="trash-outline" size={18} color="#a1a1aa" />
                </TouchableOpacity>
              </View>
            )}
            {isTranscribing && (
              <View style={styles.transcribingStatus}>
                <ActivityIndicator size="small" color="#5398BE" />
                <Text style={[styles.transcribingText, { fontSize: fonts.sm }]}>Transcribing...</Text>
              </View>
            )}
            {liveTranscript && (
              <View style={styles.liveTranscriptContainer}>
                <Text style={[styles.liveTranscriptLabel, { fontSize: fonts.xs }]}>Live:</Text>
                <Text style={[styles.liveTranscriptText, { fontSize: fonts.sm }]}>{liveTranscript}</Text>
              </View>
            )}
          </View>
        )}

        <View style={[
          styles.inputWrapper,
          {
            // Narrower input: 70% at 280px, scales down to 40% at 1920px (ultrawide)
            width: `${Math.max(40, 70 - ((screenWidth - 280) / (1920 - 280)) * 30)}%`,
            minWidth: Math.min(240, screenWidth - 24),
            maxWidth: scaleValue(650, 850),
            // Compact single-line padding (scales to ultrawide)
            paddingVertical: scaleValue(4, 8),
            paddingHorizontal: scaleValue(10, 20),
            gap: scaleValue(6, 12),
          }
        ]}>
          <TextInput
            value={input}
            onChangeText={handleInputChange}
            placeholder="Type in here.."
            placeholderTextColor="#71717a"
            style={[
              styles.textInput,
              {
                fontSize: fonts.md,
                height: scaleValue(32, 44), // Responsive single-line height
                minHeight: scaleValue(32, 44),
                maxHeight: scaleValue(32, 44),
                paddingVertical: 0,
              }
            ]}
            onFocus={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            onKeyPress={handleKeyPress}
          />
          <View style={[styles.actionButtons, { gap: scaleValue(3, 8) }]}>
            {/* Proportional button size: 28px at 280px, 44px at 1920px (ultrawide) */}
            {(() => {
              const buttonSize = scaleValue(28, 44);
              const iconSize = scaleValue(14, 24);
              return (
                <>
                  <TouchableOpacity
                    onPress={toggleRecording}
                    disabled={isTranscribing}
                    style={[
                      styles.iconButton,
                      isRecording ? styles.recordButtonActive : styles.recordButtonInactive,
                      isTranscribing && styles.buttonDisabled,
                      { width: buttonSize, height: buttonSize, minWidth: buttonSize, minHeight: buttonSize }
                    ]}
                  >
                    {isRecording ? <MaterialCommunityIcons name="microphone-off" size={iconSize} color="white" /> : <MaterialCommunityIcons name="microphone" size={iconSize} color="#a1a1aa" />}
                  </TouchableOpacity>
                  {/* TTS Toggle Button */}
                  {isTTSSupported && (
                    <TouchableOpacity
                      onPress={() => {
                        if (isSpeaking) {
                          stopTTS();
                        } else {
                          setTtsEnabled(!ttsEnabled);
                        }
                      }}
                      style={[
                        styles.iconButton,
                        ttsEnabled ? styles.ttsButtonActive : styles.ttsButtonInactive,
                        isSpeaking && styles.ttsButtonSpeaking,
                        { width: buttonSize, height: buttonSize, minWidth: buttonSize, minHeight: buttonSize }
                      ]}
                    >
                      {isSpeaking ? (
                        <MaterialCommunityIcons name="stop" size={iconSize} color="white" />
                      ) : (
                        <MaterialCommunityIcons
                          name={ttsEnabled ? "volume-high" : "volume-off"}
                          size={iconSize}
                          color={ttsEnabled ? "white" : "#a1a1aa"}
                        />
                      )}
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={handleSendMessagePress}
                    disabled={!input.trim() || isLoading}
                    style={[
                      styles.iconButton,
                      styles.sendButton,
                      (!input.trim() || isLoading) && styles.sendButtonDisabled,
                      { width: buttonSize, height: buttonSize, minWidth: buttonSize, minHeight: buttonSize }
                    ]}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Ionicons name="send" size={iconSize} color="white" />
                    )}
                  </TouchableOpacity>
                </>
              );
            })()}
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
      <Toast
        message={toastMessage}
        visible={toastVisible}
        customColor={toastColor}
        onDismiss={() => setToastVisible(false)}
        duration={2000}
      />
      {/* Story Speech Bubble - shown at start of new conversations */}
      {(() => {
        // Get first selected character for the speech bubble
        const firstCharId = selectedCharacters[0];
        const firstChar = firstCharId
          ? (availableCharacters.find(c => c.id === firstCharId) || getCharacter(firstCharId))
          : null;
        return (
          <StorySpeechBubble
            message={currentStory?.toastText || ''}
            characterName={firstChar?.name || 'Narrator'}
            characterColor={firstChar?.color || '#8b5cf6'}
            visible={storyToastVisible}
            onDismiss={() => setStoryToastVisible(false)}
            duration={6000}
          />
        );
      })()}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    overflow: 'visible',
  },
  characterDisplayContainer: {
    borderBottomWidth: 0,
    overflow: 'visible',
  },
  divider: {
    height: 1,
    backgroundColor: '#27272a',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
    zIndex: 50,
  },
  dividerToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#27272a',
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -18 }],
    zIndex: 51,
  },
  dividerToggleButtonActive: {
    backgroundColor: '#5398BE',
    borderColor: '#5398BE',
  },
  // Mobile Landscape Toggle Button Styles
  landscapeToggleButton: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#5398BE',
    zIndex: 100,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
      },
      ios: {
        shadowColor: '#5398BE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  landscapeToggleButtonActive: {
    backgroundColor: '#ff6b35',
  },
  landscapeToggleText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  landscapeToggleBadge: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 4,
  },
  landscapeToggleBadgeText: {
    color: '#5398BE',
    fontWeight: '700',
  },
  // Fullscreen Button Styles
  fullscreenButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      },
    }),
  },
  fullscreenButtonActive: {
    backgroundColor: '#5398BE',
    borderColor: '#5399beff',
  },
  fullscreenButtonInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenTooltip: {
    position: 'absolute',
    top: 44,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    zIndex: 101,
  },
  fullscreenTooltipText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  dividerMessageBadge: {
    backgroundColor: '#5398BE',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginLeft: 4,
  },
  dividerMessageBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  dividerMessageBadgeText: {
    color: 'white',
    fontWeight: '700',
  },
  userSpeechBubbleContainer: {
    position: 'absolute',
    bottom: 60,
    left: '15%',
    right: '15%',
    zIndex: 10,
    alignItems: 'center',
  },
  userSpeechBubble: {
    backgroundColor: '#8a5cf6ae',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 40,
    maxWidth: '100%',
    ...Platform.select({
      web: {
        boxShadow: '0 -3px 6px rgba(0, 0, 0, 0.25)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  userSpeechText: {
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
  },
  typingCursor: {
    color: '#ffffff',
    fontWeight: '300',
    opacity: 0.8,
  },
  // Thinking indicator styles
  thinkingIndicatorContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    zIndex: 15,
    alignItems: 'center',
  },
  thinkingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  thinkingText: {
    color: '#a855f7',
    fontFamily: 'Inter-Medium',
  },
  chatScrollView: {
    flex: 1,
    minHeight: 100,
    // @ts-ignore - web-specific scrollbar styling
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(82, 82, 91, 0.5) transparent',
  },
  messagesContainer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messagesContent: {
    width: '100%',
    maxWidth: '100%', // Full width, bubbles constrain themselves
    alignSelf: 'center',
    gap: 16,
  },
  messageBubbleContainer: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  userMessageContainer: {
    justifyContent: 'center', // Center user messages
  },
  assistantMessageLeft: {
    justifyContent: 'flex-start', // Character messages on left
  },
  assistantMessageRight: {
    justifyContent: 'flex-end', // Character messages on right
  },
  assistantMessageContainer: {
    justifyContent: 'flex-start',
  },
  characterName: {
    fontFamily: 'Poppins-Bold',
    marginBottom: 4,
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  userMessageBubble: {
    backgroundColor: '#5398BE',
  },
  assistantMessageBubble: {
    backgroundColor: '#27272a',
  },
  messageText: {
    fontFamily: 'Inter-Regular',
    color: 'white',
    marginBottom: 4,
  },
  messageTypingCursor: {
    color: '#5398BE',
    fontWeight: 'bold',
    opacity: 0.8,
  },
  messageTimestamp: {
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#a1a1aa',
    fontStyle: 'italic',
  },
  inputContainer: {
    borderTopWidth: 0,
    padding: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171717',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#27272a',
    alignSelf: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: 'transparent',
    fontFamily: 'Inter-Regular',
    color: 'white',
    paddingHorizontal: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    borderRadius: 9999,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonActive: {
    backgroundColor: '#dc2626',
  },
  recordButtonInactive: {
    backgroundColor: 'transparent',
  },
  ttsButtonActive: {
    backgroundColor: '#22c55e',
  },
  ttsButtonInactive: {
    backgroundColor: 'transparent',
  },
  ttsButtonSpeaking: {
    backgroundColor: '#3b82f6',
  },
  sendButton: {
    backgroundColor: '#5398BE',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  editingMessageContainer: {
    width: '100%',
  },
  editMessageInput: {
    backgroundColor: '#18181b',
    color: 'white',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#5398BE',
    minHeight: 60,
    marginBottom: 8,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  editActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  saveButton: {
    backgroundColor: '#5398BE',
  },
  cancelText: {
    color: '#a1a1aa',
  },
  saveText: {
    color: 'white',
    fontWeight: '600',
  },
  charactersRow: {
    flex: 1,
    position: 'relative',
    alignItems: 'flex-end',
    justifyContent: 'center',
    overflow: 'visible',
  },
  characterWrapper: {
    height: '95%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
  characterNameLabel: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  characterNameText: {
    fontWeight: '700',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    ...Platform.select({
      web: {
        textShadow: '0 1px 4px rgba(0, 0, 0, 0.8)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
      },
    }),
  },
  hoverNameContainer: {
    position: 'absolute',
    top: 5,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  hoverNameBubble: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  hoverNameText: {
    fontFamily: 'Poppins-SemiBold',
    color: 'white',
    textAlign: 'center',
    paddingVertical: 6,
    borderRadius: 8,
  },
  hoverMessageContainer: {
    position: 'absolute',
    top: -10,
    left: '50%',
    transform: [{ translateX: -120 }],
    width: 240,
    alignItems: 'center',
    zIndex: 200,
  },
  hoverMessageBubble: {
    backgroundColor: 'rgba(24, 24, 27, 0.95)',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    maxWidth: 240,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  hoverMessageName: {
    fontWeight: '700',
    marginBottom: 4,
  },
  hoverMessageText: {
    color: '#e4e4e7',
    lineHeight: 18,
  },
  characterSelectorButton: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15, 15, 15, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#27272a',
    zIndex: 10,
  },
  characterSelectorText: {
    fontFamily: 'Poppins-SemiBold',
    color: '#ff6b35',
  },
  // Playback buttons container (holds Replay and Stop/Play side by side)
  playbackButtonsContainer: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    gap: 6,
    zIndex: 10,
  },
  playbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 15, 15, 0.9)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  playbackButtonText: {
    fontWeight: '600',
  },
  characterSelectorBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    backgroundColor: 'transparent',
  },
  characterSelectorPanel: {
    position: 'absolute',
    top: 50,
    left: 8,
    right: 8,
    backgroundColor: '#171717',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 12,
    zIndex: 60,
    elevation: 60,
  },
  characterSelectorPanelMobile: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(23, 23, 23, 0.98)',
    borderRadius: 0,
    padding: 20,
    zIndex: 100,
    elevation: 100,
    justifyContent: 'center',
  },
  characterSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  characterSelectorTitle: {
    fontFamily: 'Poppins-SemiBold',
    color: 'white',
  },
  characterSelectorScroll: {
    maxHeight: 120,
  },
  characterSelectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#27272a',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  characterSelectorCardActive: {
    backgroundColor: '#3f3f46',
  },
  characterSelectorCardConversationOnly: {
    borderColor: '#ef4444',
    borderStyle: 'dashed',
  },
  characterSelectorIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  characterSelectorName: {
    fontFamily: 'Poppins-SemiBold',
    color: '#a1a1aa',
  },
  characterSelectorNameActive: {
    color: 'white',
  },
  // Character search and filter styles
  characterSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272a',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
    gap: 8,
  },
  characterSearchInput: {
    flex: 1,
    color: 'white',
    paddingVertical: 4,
  },
  roleFilterScroll: {
    marginBottom: 10,
    maxHeight: 32,
  },
  roleFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#27272a',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  roleFilterChipActive: {
    backgroundColor: '#5398BE',
    borderColor: '#5398BE',
  },
  roleFilterText: {
    color: '#a1a1aa',
    fontWeight: '500',
  },
  roleFilterTextActive: {
    color: 'white',
  },
  characterSectionLabel: {
    color: '#71717a',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  selectedCharactersScroll: {
    maxHeight: 40,
    marginBottom: 8,
  },
  selectedCharacterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderRadius: 20,
    borderWidth: 2,
  },
  selectedCharacterChipConversationOnly: {
    borderStyle: 'dashed',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  selectedCharacterName: {
    color: 'white',
    fontWeight: '600',
  },
  removeCharacterButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  characterSectionDivider: {
    height: 1,
    backgroundColor: '#3f3f46',
    marginVertical: 10,
  },
  noResultsContainer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  noResultsText: {
    color: '#71717a',
    fontStyle: 'italic',
  },
  recordingStatusContainer: {
    marginBottom: 8,
    gap: 8,
  },
  recordingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#27272a',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
  },
  recordingDotPaused: {
    backgroundColor: '#f59e0b',
    opacity: 0.6,
  },
  recordingText: {
    color: '#e5e5e5',
    fontWeight: '600',
    flex: 1,
  },
  recordingActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingConfirmButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transcribingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#27272a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  transcribingText: {
    color: '#5398BE',
    fontWeight: '600',
  },
  liveTranscriptContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#27272a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  liveTranscriptLabel: {
    color: '#5398BE',
    fontWeight: '700',
  },
  liveTranscriptText: {
    color: '#a1a1aa',
    flex: 1,
    fontStyle: 'italic',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  emptyCharacterState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emptyCharacterText: {
    color: '#666',
    textAlign: 'center',
  },
  // Speech bubble styles
  speechBubble: {
    position: 'absolute',
    top: 10,
    maxWidth: 420, // Base max, can be overridden by dynamic prop
    minWidth: 140, // Reduced minimum - dynamic styles handle small screens
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(23, 23, 23, 0.98)',
    borderRadius: 14,
    borderWidth: 2,
    zIndex: 500, // High z-index to ensure bubbles are always visible on top
    ...Platform.select({
      web: {
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.5)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  // Compact bubble style for landscape mode (applied via dynamic props)
  speechBubbleCompact: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 150,
  },
  speechBubbleSingle: {
    // For single character - position bubble above and centered
    top: -140, // Position higher above character
    // left: '40%',
    // transform: [{ translateX: -200 }], // Center a ~200px bubble
  },
  // Mobile bubble stack container - positioned at top of characters area
  // Protected from overflowing into input area via maxHeight and overflow
  mobileBubbleStack: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    zIndex: 300,
  },
  // Content container for scrollable bubble stack
  mobileBubbleStackContent: {
    flexDirection: 'column',
    gap: 6,
    alignItems: 'flex-start',
    paddingBottom: 4,
  },
  // Mobile stacked bubble style - full width, compact
  speechBubbleMobileStacked: {
    position: 'relative',
    width: '100%',
    maxWidth: '100%',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(23, 23, 23, 0.95)',
    borderRadius: 12,
    borderWidth: 2,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  speechBubbleTail: {
    position: 'absolute',
    top: 15,
  },
  speechBubbleTailLeft: {
    left: -16,
  },
  speechBubbleTailRight: {
    right: -16,
  },
  speechBubbleTailBottom: {
    position: 'absolute',
    bottom: -14,
    left: '50%',
    marginLeft: -8, // Center the 16px wide tail
  },
  speechBubbleTailBottomInner: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderLeftColor: 'transparent',
    borderRightWidth: 8,
    borderRightColor: 'transparent',
    borderTopWidth: 10,
  },
  speechBubbleTailInner: {
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderTopColor: 'transparent',
    borderBottomWidth: 8,
    borderBottomColor: 'transparent',
    borderLeftWidth: 8,
    borderRightWidth: 8,
  },
  speechBubbleName: {
    fontFamily: 'Poppins-Bold',
    marginBottom: 2,
  },
  speechBubbleText: {
    fontFamily: 'Poppins-Regular',
    color: '#e5e5e5',
    lineHeight: 22, // Consistent line height for readability
    marginBottom: 2,
  },
  speechBubbleLinesContainer: {
    overflow: 'hidden',
  },
  speechBubbleCursor: {
    fontWeight: 'bold',
    opacity: 0.8,
  },
});
