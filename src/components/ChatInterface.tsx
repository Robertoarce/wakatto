import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, PanResponder, Dimensions, Animated } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCustomAlert } from './CustomAlert';
import { CharacterDisplay3D, AnimationState, ComplementaryAnimation } from './CharacterDisplay3D';
import { AnimatedArrowPointer } from './AnimatedArrowPointer';
import { DEFAULT_CHARACTER, getAllCharacters, getCharacter } from '../config/characters';
import { getCustomWakattors } from '../services/customWakattorsService';
import { getVoiceRecorder, RecordingState } from '../services/voiceRecording';
import { transcribeAudio, isWebSpeechSupported } from '../services/speechToText';
import { LiveSpeechRecognition, LiveTranscriptionResult } from '../services/speechToTextLive';
import { detectBrowser, getBrowserGuidance, isVoiceSupported } from '../utils/browserDetection';
import { getPlaybackEngine, PlaybackState, PlaybackStatus } from '../services/animationPlaybackEngine';
import { CharacterAnimationState, OrchestrationScene } from '../services/animationOrchestration';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
  characterId?: string; // Which character is speaking (for assistant messages)
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

// Character name label component with fade animation
function CharacterNameLabel({ name, color, visible }: { name: string; color: string; visible: boolean }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Fade in quickly
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Then fade out slowly after 2 seconds (3 second fade duration)
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }).start();
      }, 2000);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.characterNameLabel, { opacity: fadeAnim }]}>
      <Text style={[styles.characterNameText, { color }]}>
        {name}
      </Text>
    </Animated.View>
  );
}

// Floating animation wrapper for characters with hover name display
function FloatingCharacterWrapper({ 
  children, 
  index, 
  style, 
  characterName, 
  characterColor 
}: { 
  children: React.ReactNode; 
  index: number; 
  style?: any;
  characterName: string;
  characterColor: string;
}) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const hoverAnim = useRef(new Animated.Value(0)).current;
  const [isHovered, setIsHovered] = useState(false);
  
  useEffect(() => {
    // Different durations for different rhythms (2.5s to 4s based on index)
    const floatDuration = 2500 + (index * 400) + (Math.random() * 500);
    const rotateDuration = 3000 + (index * 500) + (Math.random() * 700);
    
    // Floating animation (up and down)
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: floatDuration,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: floatDuration,
          useNativeDriver: true,
        }),
      ])
    );
    
    // Rotation animation (slight pivot)
    const rotateAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: rotateDuration,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: -1,
          duration: rotateDuration * 2,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: rotateDuration,
          useNativeDriver: true,
        }),
      ])
    );
    
    floatAnimation.start();
    rotateAnimation.start();
    
    return () => {
      floatAnimation.stop();
      rotateAnimation.stop();
    };
  }, [index]);
  
  // Handle hover animation
  useEffect(() => {
    Animated.timing(hoverAnim, {
      toValue: isHovered ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isHovered]);
  
  // Interpolate values
  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8], // Float up 8 pixels
  });
  
  const rotateZ = rotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-3deg', '0deg', '3deg'], // Pivot up to 3 degrees
  });
  
  const nameOpacity = hoverAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  
  const nameTranslateY = hoverAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 0], // Slide down from above
  });
  
  return (
    <Animated.View
      style={[
        style,
        {
          transform: [
            ...(style?.transform || []),
            { translateY },
            { rotateZ },
          ],
        },
      ]}
      // @ts-ignore - web-specific props
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      {/* Hover name tooltip */}
      <Animated.View
        style={[
          styles.hoverNameContainer,
          {
            opacity: nameOpacity,
            transform: [{ translateY: nameTranslateY }],
          },
        ]}
        pointerEvents="none"
      >
        <View style={[styles.hoverNameBubble, { backgroundColor: characterColor }]}>
          <Text style={styles.hoverNameText}>{characterName}</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

export function ChatInterface({ messages, onSendMessage, showSidebar, onToggleSidebar, isLoading = false, onEditMessage, onDeleteMessage, animationScene }: ChatInterfaceProps) {
  const { showAlert, AlertComponent } = useCustomAlert();
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const voiceRecorderRef = useRef(getVoiceRecorder());
  const liveSpeechRef = useRef<LiveSpeechRecognition | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  // Set initial height based on screen size
  const [characterHeight, setCharacterHeight] = useState(() => {
    const { height, width } = Dimensions.get('window');
    // Mobile: smaller height, Desktop: larger height
    if (width < 768) {
      return Math.floor(height * 0.25); // 25% on mobile
    } else if (width < 1024) {
      return Math.floor(height * 0.3); // 30% on tablet
    } else {
      return Math.floor(height * 0.35); // 35% on desktop
    }
  });
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]); // Up to 5 characters, start empty
  const [showCharacterSelector, setShowCharacterSelector] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showCharacterNames, setShowCharacterNames] = useState(true); // Show names at start
  const [nameKey, setNameKey] = useState(0); // Key to trigger re-animation
  const [showArrowPointer, setShowArrowPointer] = useState(true); // Show arrow pointer initially
  const [availableCharacters, setAvailableCharacters] = useState(getAllCharacters()); // Load from Wakattors database
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(true);
  
  // Animation playback state
  const [playbackState, setPlaybackState] = useState<{
    isPlaying: boolean;
    characterStates: Map<string, CharacterAnimationState>;
  }>({ isPlaying: false, characterStates: new Map() });
  const playbackEngineRef = useRef(getPlaybackEngine());
  
  // Track which messages are being animated (by characterId -> messageId)
  const [animatingMessages, setAnimatingMessages] = useState<Map<string, string>>(new Map());

  // Subscribe to animation playback engine
  useEffect(() => {
    const engine = playbackEngineRef.current;
    
    const unsubscribe = engine.subscribe((state: PlaybackState) => {
      setPlaybackState({
        isPlaying: state.status === 'playing',
        characterStates: state.characterStates
      });
      
      // When playback completes, ensure we have all text revealed
      if (state.status === 'complete') {
        console.log('[ChatInterface] Animation playback complete');
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  // Start animation playback when a new scene is provided
  useEffect(() => {
    if (animationScene) {
      console.log('[ChatInterface] Starting animation scene playback', {
        duration: animationScene.sceneDuration,
        timelines: animationScene.timelines.length
      });
      playbackEngineRef.current.play(animationScene);
    }
  }, [animationScene]);

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
          console.log(`[ChatInterface] Animating message ${charMessages[0].id} for ${timeline.characterId}`);
        }
      }
      
      setAnimatingMessages(newAnimatingMessages);
    }
  }, [animationScene, messages]);

  // Clear animating messages when playback completes
  useEffect(() => {
    if (!playbackState.isPlaying && animatingMessages.size > 0) {
      // Give a small delay to ensure final state is rendered
      const timeout = setTimeout(() => {
        setAnimatingMessages(new Map());
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [playbackState.isPlaying, animatingMessages.size]);

  // Load characters from user's Wakattors collection (up to 20)
  useEffect(() => {
    const loadWakattorsCollection = async () => {
      try {
        // Load all custom wakattors from user's collection
        const customWakattors = await getCustomWakattors();

        if (customWakattors.length > 0) {
          setAvailableCharacters(customWakattors);
          // IMPORTANT: Register custom characters so multiCharacterConversation can find them
          const { registerCustomCharacters } = await import('../config/characters');
          console.log('[ChatInterface] About to register custom characters:', customWakattors.map(c => ({ id: c.id, name: c.name })));
          registerCustomCharacters(customWakattors);
          console.log('[ChatInterface] Registered', customWakattors.length, 'custom characters for AI generation');
        } else {
          // Fallback to default characters if no custom wakattors
          const defaultChars = getAllCharacters();
          setAvailableCharacters(defaultChars);
        }
      } catch (error) {
        console.error('[ChatInterface] Failed to load wakattors collection:', error);
        // Fallback to default characters on error
        setAvailableCharacters(getAllCharacters());
      } finally {
        setIsLoadingCharacters(false);
      }
    };

    loadWakattorsCollection();

    // Listen for custom events when wakattors collection changes
    const handleWakattorsUpdate = () => {
      console.log('[ChatInterface] Wakattors collection updated, reloading...');
      loadWakattorsCollection();
    };

    window.addEventListener('wakattorsUpdated', handleWakattorsUpdate);

    return () => {
      window.removeEventListener('wakattorsUpdated', handleWakattorsUpdate);
    };
  }, []);

  // Don't auto-select any wakattor - let user choose
  // useEffect(() => {
  //   if (!isLoadingCharacters && availableCharacters.length > 0 && selectedCharacters.length === 0) {
  //     // Select the first available character by default
  //     setSelectedCharacters([availableCharacters[0].id]);
  //   }
  // }, [isLoadingCharacters, availableCharacters, selectedCharacters.length]);

  // Update character height and mobile view on window resize
  useEffect(() => {
    const updateResponsiveSettings = () => {
      const { width, height } = Dimensions.get('window');

      // Update mobile view state
      const isMobile = width < 768;
      setIsMobileView(isMobile);

      // Update character height based on screen size
      let heightPercentage = 0.35; // Default desktop
      if (width < 768) {
        heightPercentage = 0.25; // Mobile
      } else if (width < 1024) {
        heightPercentage = 0.3; // Tablet
      }
      const newHeight = Math.floor(height * heightPercentage);
      setCharacterHeight(newHeight);
    };

    updateResponsiveSettings();
    const subscription = Dimensions.addEventListener('change', updateResponsiveSettings);
    return () => subscription?.remove();
  }, []);

  // Auto-hide character selector when switching to mobile view
  useEffect(() => {
    if (isMobileView && showCharacterSelector) {
      setShowCharacterSelector(false);
    }
  }, [isMobileView]);


  // Arrow pointer logic: hide after 20 seconds, or when user has conversation, or interacts with characters
  useEffect(() => {
    // Hide arrow if user has messages (conversation started)
    if (messages.length > 0) {
      setShowArrowPointer(false);
      return;
    }

    // Hide arrow if user opened character selector
    if (showCharacterSelector) {
      setShowArrowPointer(false);
      return;
    }

    // Hide arrow if user changed characters (not just the initial default)
    if (selectedCharacters.length !== 1 || selectedCharacters[0] !== DEFAULT_CHARACTER) {
      setShowArrowPointer(false);
      return;
    }

    // Hide arrow after 20 seconds
    const timer = setTimeout(() => {
      setShowArrowPointer(false);
    }, 20000); // 20 seconds

    return () => clearTimeout(timer);
  }, [messages.length, showCharacterSelector, selectedCharacters]);

  // Restore characters from messages when conversation is loaded
  const userHasSelectedCharacters = useRef(false);
  const previousMessagesRef = useRef(messages);
  const hasRestoredInitialCharacters = useRef(false);

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

    // Update when:
    // 1. Conversation switched (different first message)
    // 2. Initial load (messages just appeared)
    // 3. Loading a conversation for the first time (has messages but no characters selected)
    const shouldRestoreCharacters =
      conversationChanged ||
      initialLoad ||
      (messages.length > 0 && selectedCharacters.length === 0 && !userHasSelectedCharacters.current);

    if (shouldRestoreCharacters) {
      // Extract unique character IDs from assistant messages
      const characterIds = messages
        .filter(msg => msg.role === 'assistant' && msg.characterId)
        .map(msg => msg.characterId as string);

      const uniqueCharacterIds = Array.from(new Set(characterIds));

      // Restore characters from conversation history
      if (uniqueCharacterIds.length > 0) {
        console.log('[ChatInterface] Restoring characters from conversation history:', uniqueCharacterIds);
        setSelectedCharacters(uniqueCharacterIds);
        hasRestoredInitialCharacters.current = true;
        // Reset manual selection flag when switching conversations
        if (conversationChanged) {
          userHasSelectedCharacters.current = false;
        }
      } else if (conversationChanged || initialLoad) {
        // New empty conversation or initial load with no assistant messages - set default character
        console.log('[ChatInterface] Empty conversation, setting default character');
        const defaultChar = availableCharacters.length > 0 ? availableCharacters[0].id : DEFAULT_CHARACTER;
        setSelectedCharacters([defaultChar]);
        hasRestoredInitialCharacters.current = true;
        userHasSelectedCharacters.current = false;
      }
    }

    // Reset the initial restore flag when conversation changes
    if (conversationChanged) {
      hasRestoredInitialCharacters.current = false;
    }

    // Update previous messages reference
    previousMessagesRef.current = messages;
  }, [messages, availableCharacters]);

  // Set default character for brand new conversations (no messages at all)
  // Only if we haven't restored characters yet
  useEffect(() => {
    if (messages.length === 0 && selectedCharacters.length === 0 && availableCharacters.length > 0 && !hasRestoredInitialCharacters.current) {
      console.log('[ChatInterface] New conversation with no messages, setting default character');
      const defaultChar = availableCharacters[0].id;
      setSelectedCharacters([defaultChar]);
    }
  }, [messages.length, selectedCharacters.length, availableCharacters]);

  // Show character names when characters change or at conversation start
  useEffect(() => {
    setShowCharacterNames(true);
    setNameKey(prev => prev + 1); // Trigger re-animation

    // Keep visible for 5 seconds total (2s display + 3s fade)
    const timer = setTimeout(() => {
      setShowCharacterNames(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [selectedCharacters]);

  // Pan responder for resizable divider
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const newHeight = characterHeight + gestureState.dy;
        const { height: windowHeight, width: windowWidth } = Dimensions.get('window');
        // Responsive min/max constraints based on screen size
        let minPercent = 0.15;
        let maxPercent = 0.5;
        if (windowWidth < 768) {
          // Mobile: smaller range
          minPercent = 0.15;
          maxPercent = 0.4;
        } else if (windowWidth < 1024) {
          // Tablet
          minPercent = 0.2;
          maxPercent = 0.5;
        } else {
          // Desktop
          minPercent = 0.2;
          maxPercent = 0.6;
        }
        const minHeight = Math.floor(windowHeight * minPercent);
        const maxHeight = Math.floor(windowHeight * maxPercent);
        if (newHeight >= minHeight && newHeight <= maxHeight) {
          setCharacterHeight(newHeight);
        }
      },
      onPanResponderRelease: () => {
        // Optionally save to localStorage/AsyncStorage here
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

  // Cancel editing when AI starts responding to prevent race conditions
  useEffect(() => {
    if (isLoading && editingMessageId) {
      setEditingMessageId(null);
      setEditingContent('');
    }
  }, [isLoading, editingMessageId]);

  // Setup voice recorder and live speech recognition
  useEffect(() => {
    const voiceRecorder = voiceRecorderRef.current;

    voiceRecorder.setOnStateChange((state: RecordingState) => {
      setIsRecording(state.isRecording);
      setRecordingDuration(state.duration);
    });

    // Initialize live speech recognition if supported
    if (isWebSpeechSupported()) {
      const liveSpeech = new LiveSpeechRecognition();

      liveSpeech.setOnResult((result: LiveTranscriptionResult) => {
        setLiveTranscript(result.transcript);
      });

      liveSpeech.setOnError((error: Error) => {
        console.error('[ChatInterface] Live speech error:', error);
        // Don't show alert for interim errors, wait for final result
      });

      liveSpeechRef.current = liveSpeech;
    }

    return () => {
      voiceRecorder.dispose();
      if (liveSpeechRef.current) {
        liveSpeechRef.current.abort();
      }
    };
  }, []);

  const handleSendMessagePress = () => {
    if (input.trim()) {
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

  const handleTranscription = async (audioBlob: Blob) => {
    setIsTranscribing(true);

    try {
      console.log('[ChatInterface] Transcribing audio with Whisper API...');

      // Use Whisper API for recorded audio (fallback when live speech fails)
      const result = await transcribeAudio(audioBlob, 'whisper', false);

      console.log('[ChatInterface] Transcription result:', result);

      if (result.text.trim()) {
        // Add transcribed text to input
        setInput((prev) => {
          const separator = prev.trim() ? ' ' : '';
          return prev + separator + result.text.trim();
        });

        showAlert(
          'Transcription Complete',
          'Transcribed using OpenAI Whisper API'
        );
      } else {
        showAlert(
          'No Speech Detected',
          'Could not detect any speech in the recording. Please try again and speak clearly.'
        );
      }
    } catch (error: any) {
      console.error('[ChatInterface] Transcription error:', error);
      showAlert('Transcription Failed', error.message || 'Failed to transcribe audio. Please check your OpenAI API key in Settings.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const toggleRecording = async () => {
    const voiceRecorder = voiceRecorderRef.current;
    const liveSpeech = liveSpeechRef.current;

    // Check browser compatibility
    const voiceSupport = isVoiceSupported();
    if (!voiceSupport.supported) {
      showAlert('Not Supported', voiceSupport.message);
      return;
    }

    if (!voiceRecorder.isSupported()) {
      const browser = detectBrowser();
      showAlert(
        'Not Supported',
        `Voice recording is not supported in ${browser.name}. Please use Chrome, Edge, Brave, Firefox, or Safari.`
      );
      return;
    }

    if (isRecording) {
      // Stop recording
      voiceRecorder.stopRecording();

      // Stop live speech recognition if active
      let finalTranscript = '';
      if (liveSpeech && liveSpeech.isSupported()) {
        finalTranscript = liveSpeech.stop();
      }

      // Use live transcript if available, otherwise transcribe recorded audio
      if (finalTranscript.trim()) {
        // We got live transcription - use it directly
        setInput((prev) => {
          const separator = prev.trim() ? ' ' : '';
          return prev + separator + finalTranscript.trim();
        });
        setLiveTranscript('');

        showAlert(
          'Transcription Complete',
          'Transcribed using Web Speech API (live)'
        );
      } else {
        // Fall back to Whisper API with recorded audio
        const state = voiceRecorder.getState();
        if (state.audioBlob) {
          await handleTranscription(state.audioBlob);
        }
      }
    } else {
      // Start recording
      try {
        setLiveTranscript('');
        await voiceRecorder.startRecording();

        // Start live speech recognition if available
        if (liveSpeech && liveSpeech.isSupported()) {
          try {
            liveSpeech.start();
            const browser = detectBrowser();
            console.log(`[ChatInterface] Started live speech recognition (${browser.name})`);
          } catch (error: any) {
            console.error('[ChatInterface] Failed to start live speech:', error);
            // Continue with audio recording even if live speech fails
            const browser = detectBrowser();
            console.log(`[ChatInterface] Will use Whisper API fallback (${browser.name})`);
          }
        } else {
          const browser = detectBrowser();
          console.log(`[ChatInterface] Live speech not available in ${browser.name}, will use Whisper API`);
        }
      } catch (error: any) {
        const guidance = getBrowserGuidance('microphone');
        showAlert('Recording Error', `${error.message}\n\n${guidance}`);
      }
    }
  };

  const cancelRecording = () => {
    const voiceRecorder = voiceRecorderRef.current;
    const liveSpeech = liveSpeechRef.current;

    voiceRecorder.cancelRecording();

    if (liveSpeech) {
      liveSpeech.abort();
    }

    setLiveTranscript('');
  };

  const startEditingMessage = (message: Message) => {
    setEditingMessageId(message.id);
    setEditingContent(message.content);
  };

  const saveEditedMessage = () => {
    // Prevent saving edits when AI is responding to avoid race conditions
    if (isLoading) {
      showAlert(
        'Cannot Save Edit',
        'Please wait for the AI to finish responding before saving your edit.'
      );
      return;
    }

    if (editingMessageId && editingContent.trim() && onEditMessage) {
      onEditMessage(editingMessageId, editingContent.trim());
      setEditingMessageId(null);
      setEditingContent('');
    }
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const toggleCharacter = (characterId: string) => {
    // Mark that user has manually selected characters
    userHasSelectedCharacters.current = true;

    setSelectedCharacters(prev => {
      if (prev.includes(characterId)) {
        // Don't allow removing if only one left
        if (prev.length === 1) return prev;
        return prev.filter(id => id !== characterId);
      } else {
        // Don't allow more than 5 characters
        if (prev.length >= 5) {
          showAlert('Maximum Reached', 'You can select up to 5 Wakattors maximum.', [{ text: 'OK' }]);
          return prev;
        }
        // Defensive check: ensure no duplicates (should never happen, but extra safety)
        if (prev.includes(characterId)) return prev;
        return [...prev, characterId];
      }
    });
  };

  const confirmDeleteMessage = (messageId: string) => {
    showAlert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (onDeleteMessage) {
              onDeleteMessage(messageId);
            }
          },
        },
      ]
    );
  };

  const handleLongPress = (message: Message) => {
    // Prevent editing/deleting when AI is responding to avoid race conditions
    if (isLoading) {
      showAlert(
        'Action Not Available',
        'Please wait for the AI to finish responding before editing or deleting messages.'
      );
      return;
    }

    // Only allow editing user messages
    if (message.role === 'user') {
      showAlert(
        'Message Options',
        'What would you like to do?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Edit',
            onPress: () => startEditingMessage(message),
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => confirmDeleteMessage(message.id),
          },
        ]
      );
    }
  };

  return (
    <>
      <AlertComponent />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
      {/* Full-screen backdrop for character selector */}
      {showCharacterSelector && (
        <TouchableOpacity
          style={styles.characterSelectorBackdrop}
          activeOpacity={1}
          onPress={() => setShowCharacterSelector(false)}
        />
      )}

      {/* Character Selector Panel - Must be sibling to backdrop for zIndex to work */}
      {showCharacterSelector && (
        <View
          style={[
            styles.characterSelectorPanel,
            isMobileView && styles.characterSelectorPanelMobile
          ]}
          pointerEvents="box-none"
        >
          <View style={styles.characterSelectorHeader}>
            <Text style={styles.characterSelectorTitle}>Select Wakattors (Max 5)</Text>
            {isMobileView && (
              <TouchableOpacity onPress={() => setShowCharacterSelector(false)}>
                <Ionicons name="close" size={24} color="#ff6b35" />
              </TouchableOpacity>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.characterSelectorScroll}>
            {/* First show selected characters that are NOT in the collection (conversation-only) */}
            {selectedCharacters
              .filter(charId => !availableCharacters.some(c => c.id === charId))
              .map((characterId) => {
                const character = getCharacter(characterId);
                return (
                  <TouchableOpacity
                    key={characterId}
                    style={[
                      styles.characterSelectorCard,
                      styles.characterSelectorCardActive,
                      styles.characterSelectorCardConversationOnly,
                    ]}
                    onPress={() => toggleCharacter(characterId)}
                  >
                    <View style={[styles.characterSelectorIndicator, { backgroundColor: character.color }]} />
                    <Text style={[styles.characterSelectorName, styles.characterSelectorNameActive]}>
                      {character.name}
                    </Text>
                    <Ionicons name="close-circle" size={20} color="#ef4444" />
                  </TouchableOpacity>
                );
              })}
            {/* Then show all characters from the collection */}
            {availableCharacters.map((character) => {
              const isSelected = selectedCharacters.includes(character.id);
              return (
                <TouchableOpacity
                  key={character.id}
                  style={[
                    styles.characterSelectorCard,
                    isSelected && styles.characterSelectorCardActive,
                  ]}
                  onPress={() => toggleCharacter(character.id)}
                >
                  <View style={[styles.characterSelectorIndicator, { backgroundColor: character.color }]} />
                  <Text style={[styles.characterSelectorName, isSelected && styles.characterSelectorNameActive]}>
                    {character.name}
                  </Text>
                  {isSelected && <Ionicons name="checkmark-circle" size={20} color={character.color} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* 3D Character Display - Resizable */}
      <View style={[styles.characterDisplayContainer, { height: characterHeight }]}>
        {/* 3D Animated Arrow Pointer - Positioned near character selector button */}
        <AnimatedArrowPointer
          visible={showArrowPointer}
          message="Add more characters!"
        />

        {/* Character Selector Button */}
        <TouchableOpacity
          style={styles.characterSelectorButton}
          onPress={() => setShowCharacterSelector(!showCharacterSelector)}
        >
          <Ionicons name="people" size={20} color="#ff6b35" />
          <Text style={styles.characterSelectorText}>
            {selectedCharacters.length} Wakattor{selectedCharacters.length !== 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>

        {/* Multiple Character Display - Semi-circle arrangement (table view) */}
        <View style={styles.charactersRow}>
          {selectedCharacters.length === 0 ? (
            <View style={styles.emptyCharacterState}>
              <Ionicons name="person-add" size={48} color="#666" />
              <Text style={styles.emptyCharacterText}>Click "0 Wakattors" to select characters</Text>
            </View>
          ) : (
            Array.from(new Set(selectedCharacters)).map((characterId, index) => {
              // Get character from availableCharacters (includes custom wakattors) or fallback to built-in
              const character = availableCharacters.find(c => c.id === characterId) || getCharacter(characterId);
              const total = selectedCharacters.length;
              
              // Calculate semi-circle position (like sitting around a table)
              // Center character is furthest (top/back), side characters are closest (bottom/front)
              const angleRange = 100; // Tighter arc for closer grouping
              const startAngle = -angleRange / 2;
              const angleStep = total > 1 ? angleRange / (total - 1) : 0;
              const angle = total === 1 ? 0 : startAngle + (index * angleStep);
              const angleRad = (angle * Math.PI) / 180;
              
              // Calculate horizontal position (percentage from center)
              const horizontalOffset = Math.sin(angleRad) * 50; // 30% max offset from center (closer together)
              
              // Distance from center (0 = center, 1 = edges)
              const distanceFromCenter = Math.abs(angle) / (angleRange / 2);
              
              // Vertical position: CENTER is higher (further back), EDGES are lower (closer)
              // cos(0) = 1 for center, cos(±70°) ≈ 0.34 for edges
              const verticalPosition = Math.cos(angleRad) * 20; // Center gets +20%, edges get less
              
              // Scale: CENTER is smaller (further away), EDGES are larger (closer)
              // Base scale increased for closer camera view
              const scale = 0.8 + (distanceFromCenter * 0.3); // Center: 1.0, Edges: 1.3
              
              // Z-index: EDGES have higher z-index (in front), CENTER has lower (behind)
              const zIndex = Math.round(distanceFromCenter * 10);
              
              return (
                <FloatingCharacterWrapper
                  key={characterId}
                  index={index}
                  characterName={character.name}
                  characterColor={character.color}
                  style={[
                    styles.characterWrapper,
                    {
                      position: 'absolute',
                      left: `${45 + horizontalOffset - (100 / total / 2)}%`, // Shifted left by 5%
                      width: `${Math.max(100 / total, 25)}%`,
                      top: `${15 + (20 - verticalPosition)}%`, // Center higher up, edges lower
                      transform: [{ scale }],
                      zIndex: zIndex,
                    }
                  ]}
                >
                  {(() => {
                    // Check if we have playback state for this character
                    // Only animate AFTER response is received (via playback engine), not during loading
                    const charPlaybackState = playbackState.characterStates.get(characterId);
                    const usePlayback = playbackState.isPlaying && charPlaybackState;
                    
                    return (
                      <CharacterDisplay3D
                        character={character}
                        isActive={usePlayback && charPlaybackState.isActive}
                        animation={usePlayback ? charPlaybackState.animation : undefined}
                        isTalking={usePlayback && charPlaybackState.isTalking}
                        complementary={usePlayback ? charPlaybackState.complementary : undefined}
                        showName={showCharacterNames}
                        nameKey={nameKey}
                      />
                    );
                  })()}
                  {/* Character Name Label with Fade Animation */}
                  <CharacterNameLabel
                    key={`name-${nameKey}`}
                    name={character.name}
                    color={character.color}
                    visible={showCharacterNames}
                  />
                </FloatingCharacterWrapper>
              );
            })
          )}
        </View>
      </View>

      {/* Resizable Divider */}
      <View
        {...panResponder.panHandlers}
        style={styles.divider}
      >
        <View style={styles.dividerHandle} />
      </View>

      {/* Chat Messages - Remaining space */}
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.messagesContainer}
        style={styles.chatScrollView}
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
                        style={styles.editMessageInput}
                        value={editingContent}
                        onChangeText={setEditingContent}
                        multiline
                        autoFocus
                        placeholder="Edit message..."
                        placeholderTextColor="#71717a"
                      />
                      <View style={styles.editActions}>
                        <TouchableOpacity onPress={cancelEditing} style={styles.editActionButton}>
                          <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={saveEditedMessage} style={[styles.editActionButton, styles.saveButton]}>
                          <Text style={styles.saveText}>Save</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <>
                      {/* Character Name for Assistant Messages */}
                      {message.role === 'assistant' && character && (
                        <Text style={[styles.characterName, { color: character.color }]}>
                          {character.name}
                        </Text>
                      )}
                      {(() => {
                        if (isAnimating && revealedText !== null) {
                          // Show cursor if text is still being revealed
                          const showCursor = revealedText.length < message.content.length;
                          return (
                            <Text style={styles.messageText}>
                              {revealedText}
                              {showCursor && <Text style={styles.typingCursor}>|</Text>}
                            </Text>
                          );
                        }
                        
                        // Show full text when not animating
                        return <Text style={styles.messageText}>{message.content}</Text>;
                      })()}
                      {message.created_at && (
                        <Text style={styles.messageTimestamp}>
                          {formatTimestamp(message.created_at)}
                        </Text>
                      )}
                    </>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
          
          {isLoading && (
            <View style={[styles.messageBubbleContainer, styles.assistantMessageContainer]}>
              <View style={[styles.messageBubble, styles.assistantMessageBubble, styles.loadingBubble]}>
                <ActivityIndicator size="small" color="#8b5cf6" />
                <Text style={styles.loadingText}>AI is thinking...</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.inputContainer}>
        {/* Recording Status & Live Transcript */}
        {(isRecording || liveTranscript || isTranscribing) && (
          <View style={styles.recordingStatusContainer}>
            {isRecording && (
              <View style={styles.recordingStatus}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>
                  Recording... {Math.floor(recordingDuration / 60)}:{String(recordingDuration % 60).padStart(2, '0')}
                </Text>
                <TouchableOpacity onPress={cancelRecording} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
            {isTranscribing && (
              <View style={styles.transcribingStatus}>
                <ActivityIndicator size="small" color="#8b5cf6" />
                <Text style={styles.transcribingText}>Transcribing...</Text>
              </View>
            )}
            {liveTranscript && (
              <View style={styles.liveTranscriptContainer}>
                <Text style={styles.liveTranscriptLabel}>Live:</Text>
                <Text style={styles.liveTranscriptText}>{liveTranscript}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.inputWrapper}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type your message or use voice... (Ctrl+Enter to send)"
            placeholderTextColor="#a1a1aa"
            style={styles.textInput}
            multiline
            onFocus={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            onKeyPress={handleKeyPress}
          />
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={toggleRecording}
              disabled={isTranscribing}
              style={[
                styles.iconButton,
                isRecording ? styles.recordButtonActive : styles.recordButtonInactive,
                isTranscribing && styles.buttonDisabled,
              ]}
            >
              {isRecording ? <MaterialCommunityIcons name="microphone-off" size={24} color="white" /> : <MaterialCommunityIcons name="microphone" size={24} color="#a1a1aa" />}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSendMessagePress}
              disabled={!input.trim() || isLoading}
              style={[
                styles.iconButton,
                styles.sendButton,
                (!input.trim() || isLoading) && styles.sendButtonDisabled,
              ]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
              <Ionicons name="send" size={24} color="white" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  characterDisplayContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  divider: {
    height: 12,
    backgroundColor: '#171717',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#27272a',
  },
  dividerHandle: {
    width: 40,
    height: 2,
    backgroundColor: '#52525b',
    borderRadius: 2,
  },
  chatScrollView: {
    flex: 1,
    // @ts-ignore - web-specific scrollbar styling
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(82, 82, 91, 0.5) transparent',
  },
  messagesContainer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  messagesContent: {
    width: '100%',
    maxWidth: '100%', // Full width, bubbles constrain themselves
    alignSelf: 'center',
    gap: 16,
  },
  messageBubbleContainer: {
    flexDirection: 'row',
    marginBottom: 12,
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
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  userMessageBubble: {
    backgroundColor: '#8b5cf6',
  },
  assistantMessageBubble: {
    backgroundColor: '#27272a',
  },
  messageText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 4,
  },
  typingCursor: {
    color: '#8b5cf6',
    fontWeight: 'bold',
    opacity: 0.8,
  },
  messageTimestamp: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
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
    fontSize: 14,
    fontStyle: 'italic',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    padding: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    backgroundColor: '#171717',
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: '#27272a',
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: 'transparent',
    color: 'white',
    fontSize: 16,
    minHeight: 24,
    maxHeight: 128,
    paddingHorizontal: 0,
    paddingVertical: 0,
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
  sendButton: {
    backgroundColor: '#8b5cf6',
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
    fontSize: 16,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8b5cf6',
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
    backgroundColor: '#8b5cf6',
  },
  cancelText: {
    color: '#a1a1aa',
    fontSize: 14,
  },
  saveText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  charactersRow: {
    flex: 1,
    position: 'relative',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  characterWrapper: {
    height: '85%',
    alignItems: 'center',
    justifyContent: 'flex-end',
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
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  hoverNameText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 6,
    borderRadius: 8,
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
    color: '#ff6b35',
    fontSize: 14,
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
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
    color: '#a1a1aa',
    fontSize: 14,
    fontWeight: '600',
  },
  characterSelectorNameActive: {
    color: 'white',
  },
  recordingStatusContainer: {
    marginBottom: 8,
    gap: 8,
  },
  recordingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  recordingText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
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
    color: '#8b5cf6',
    fontSize: 14,
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
    color: '#8b5cf6',
    fontSize: 12,
    fontWeight: '700',
  },
  liveTranscriptText: {
    color: '#a1a1aa',
    fontSize: 14,
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
    fontSize: 16,
    textAlign: 'center',
  },
});
