import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, PanResponder, Dimensions, Animated, Easing } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setFullscreen } from '../store/actions/uiActions';
import { useCustomAlert } from './CustomAlert';
import { CharacterDisplay3D, AnimationState, ComplementaryAnimation, LookDirection, EyeState, MouthState } from './CharacterDisplay3D';
import { AnimatedArrowPointer } from './AnimatedArrowPointer';
import { DEFAULT_CHARACTER, getAllCharacters, getCharacter } from '../config/characters';
import { getCustomWakattors } from '../services/customWakattorsService';
import { getVoiceRecorder, RecordingState } from '../services/voiceRecording';
import { transcribeAudio, isWebSpeechSupported } from '../services/speechToText';
import { LiveSpeechRecognition, LiveTranscriptionResult } from '../services/speechToTextLive';
import { detectBrowser, getBrowserGuidance, isVoiceSupported } from '../utils/browserDetection';
import { getPlaybackEngine, PlaybackState, PlaybackStatus } from '../services/animationPlaybackEngine';
import { CharacterAnimationState, OrchestrationScene, CharacterTimeline, AnimationSegment, DEFAULT_TALKING_SPEED } from '../services/animationOrchestration';
import { generateProcessingScene } from '../services/processingAnimations';
import { getRandomGreeting } from '../services/characterGreetings';
import { useResponsive, BREAKPOINTS } from '../constants/Layout';

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
  const { fonts } = useResponsive();

  useEffect(() => {
    if (visible) {
      // Fade in quickly
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }).start();

      // Then fade out slowly after 2 seconds (3 second fade duration)
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: Platform.OS !== 'web',
        }).start();
      }, 2000);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.characterNameLabel, { opacity: fadeAnim }]}>
      <Text style={[styles.characterNameText, { color, fontSize: fonts.lg }]}>
        {name}
      </Text>
    </Animated.View>
  );
}

// Fading line component - older lines fade out progressively
const FadingLine = React.memo(function FadingLine({ 
  text, 
  opacity, 
  isLast,
  characterColor 
}: { 
  text: string; 
  opacity: number; 
  isLast: boolean;
  characterColor: string;
}) {
  const animatedOpacity = useRef(new Animated.Value(opacity)).current;
  const prevOpacity = useRef(opacity);
  const { fonts } = useResponsive();
  
  useEffect(() => {
    // Only animate if opacity actually changed
    if (prevOpacity.current !== opacity) {
      Animated.timing(animatedOpacity, {
        toValue: opacity,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
      prevOpacity.current = opacity;
    }
  }, [opacity, animatedOpacity]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      animatedOpacity.stopAnimation();
    };
  }, [animatedOpacity]);
  
  return (
    <Animated.Text 
      style={[
        styles.speechBubbleText, 
        { 
          opacity: animatedOpacity,
          fontSize: fonts.md, // Use medium font for better readability
        }
      ]}
    >
      {text}
      {isLast && <Text style={[styles.speechBubbleCursor, { color: characterColor }]}>|</Text>}
    </Animated.Text>
  );
});

// Character speech bubble component with fading lines (older text fades out)
function CharacterSpeechBubble({ 
  text, 
  characterName,
  characterColor, 
  position, 
  isTyping,
  isSpeaking,
  isSingleCharacter = false,
  isMobileStacked = false,
  stackIndex = 0,
  // Responsive props
  maxWidth = 280,
  maxHeight,
  topOffset = -60,
  screenWidth: bubbleScreenWidth,
  characterIndex = 0,
}: { 
  text: string; 
  characterName: string;
  characterColor: string; 
  position: 'left' | 'right'; 
  isTyping: boolean;
  isSpeaking: boolean;
  isSingleCharacter?: boolean;
  isMobileStacked?: boolean;
  stackIndex?: number;
  // Responsive props
  maxWidth?: number;
  maxHeight?: number;
  topOffset?: number;
  screenWidth?: number;
  characterIndex?: number;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(false);
  const fadeOutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasStartedFadeOut = useRef(false);
  const lastTextRef = useRef('');
  const { fonts, isMobile, isMobileLandscape, spacing, width: viewportWidth, height: viewportHeight } = useResponsive();

  useEffect(() => {
    // Clear any existing fade out timer when speaking starts again
    if (isSpeaking || isTyping) {
      if (fadeOutTimerRef.current) {
        clearTimeout(fadeOutTimerRef.current);
        fadeOutTimerRef.current = null;
      }
      hasStartedFadeOut.current = false;
    }

    // Show bubble when there's text and character is speaking/typing
    if (text && text.length > 0 && (isSpeaking || isTyping)) {
      setShouldRender(true);
      lastTextRef.current = text;
      // Fade in quickly
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }
    // Start fade out when speaking stops (but only if we haven't already started)
    else if (!isSpeaking && !isTyping && lastTextRef.current && !hasStartedFadeOut.current) {
      hasStartedFadeOut.current = true;
      // Keep visible for 2 seconds, then fade out over 3 seconds
      fadeOutTimerRef.current = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: Platform.OS !== 'web',
        }).start(() => {
          setShouldRender(false);
          lastTextRef.current = '';
          hasStartedFadeOut.current = false;
        });
      }, 2000);
    }

    return () => {
      if (fadeOutTimerRef.current) {
        clearTimeout(fadeOutTimerRef.current);
      }
    };
  }, [text, isSpeaking, isTyping, fadeAnim]);

  // Cleanup fadeAnim on unmount
  useEffect(() => {
    return () => {
      fadeAnim.stopAnimation();
    };
  }, [fadeAnim]);

  if (!shouldRender && !text) return null;

  const fullText = text || lastTextRef.current;
  
  // Split text into lines (by newlines or wrap at ~40 chars)
  const wrapText = (str: string, maxWidth: number = 45): string[] => {
    const lines: string[] = [];
    // First split by actual newlines
    const paragraphs = str.split('\n');
    
    for (const paragraph of paragraphs) {
      if (paragraph.length === 0) {
        lines.push('');
        continue;
      }
      
      const words = paragraph.split(' ');
      let currentLine = '';
      
      for (const word of words) {
        if (currentLine.length + word.length + 1 <= maxWidth) {
          currentLine += (currentLine ? ' ' : '') + word;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) lines.push(currentLine);
    }
    
    return lines;
  };
  
  const allLines = wrapText(fullText);
  
  // Show only the last 5 lines with fading effect
  const maxVisibleLines = 7;
  const visibleLines = allLines.slice(-maxVisibleLines);
  const totalLines = allLines.length;
  const startIndex = Math.max(0, totalLines - maxVisibleLines);
  
  // Calculate opacity for each line - older lines fade out
  // Bottom line (newest) = full opacity, top lines (older) fade progressively
  const getLineOpacity = (lineIndex: number): number => {
    const totalVisible = visibleLines.length;
    if (totalVisible <= 1) return 1;
    
    // lineIndex 0 = top (oldest), totalVisible-1 = bottom (newest)
    // Top line gets lowest opacity, bottom gets full
    const normalizedPosition = lineIndex / (totalVisible - 1); // 0 to 1
    // Opacity ranges from 0.15 (top) to 1.0 (bottom)
    return 0.15 + (normalizedPosition * 0.85);
  };

  // On mobile with stacked layout, use a simpler compact design
  if (isMobileStacked) {
    // Calculate safe width for stacked bubbles
    const stackedMaxWidth = Math.min(maxWidth, (viewportWidth || 400) - 24);
    const stackedMaxHeight = Math.min(120, (viewportHeight || 600) * 0.2);
    
    return (
      <Animated.View 
        style={[
          styles.speechBubbleMobileStacked,
          { 
            opacity: fadeAnim, 
            borderColor: characterColor,
            // Stack bubbles with offset based on index
            top: stackIndex * 4,
            zIndex: 200 - stackIndex,
            pointerEvents: 'none',
            maxWidth: stackedMaxWidth,
            maxHeight: stackedMaxHeight,
            overflow: 'hidden',
          }
        ]}
      >
        <Text style={[styles.speechBubbleName, { color: characterColor, fontSize: fonts.md }]}>{characterName}</Text>
        <View style={styles.speechBubbleLinesContainer}>
          {visibleLines.slice(-3).map((line, index) => (
            <FadingLine
              key={`line-${index}`}
              text={line}
              opacity={getLineOpacity(index)}
              isLast={index === visibleLines.slice(-3).length - 1 && isTyping}
              characterColor={characterColor}
            />
          ))}
        </View>
      </Animated.View>
    );
  }

  // Calculate responsive position offsets with screen boundary clamping
  const getPositionStyles = () => {
    const padding = 8; // Minimum padding from screen edge
    const effectiveScreenWidth = bubbleScreenWidth || viewportWidth || 400;
    const effectiveScreenHeight = viewportHeight || 600;
    
    // Calculate safe max dimensions that fit within viewport
    const safeMaxWidth = Math.min(maxWidth, effectiveScreenWidth - padding * 2);
    const safeMaxHeight = isMobileLandscape 
      ? Math.min(maxHeight || 200, effectiveScreenHeight * 0.5)
      : (maxHeight || effectiveScreenHeight * 0.4);
    
    // In landscape or constrained space, position bubbles more centrally
    if (isMobileLandscape) {
      return {
        left: padding,
        right: padding,
        top: topOffset,
        maxWidth: safeMaxWidth,
        maxHeight: safeMaxHeight,
      };
    }
    
    const baseOffset = position === 'left' ? { right: 70 } : { left: 80 };
    const translateX = position === 'left' ? 30 : -30;
    
    // For left position (bubble on right side of character), ensure it doesn't overflow right
    // For right position (bubble on left side of character), ensure it doesn't overflow left
    let clampedOffset = baseOffset;
    if (position === 'right' && bubbleScreenWidth) {
      // Ensure left + maxWidth doesn't exceed screen width
      const maxLeft = Math.max(padding, Math.min(80, effectiveScreenWidth - safeMaxWidth - padding));
      clampedOffset = { left: maxLeft };
    }
    
    return {
      ...clampedOffset,
      top: topOffset,
      transform: [{ translateX }],
      maxWidth: safeMaxWidth,
      maxHeight: safeMaxHeight,
    };
  };

  // Calculate safe dimensions that always fit viewport
  const safeBubbleWidth = Math.min(maxWidth, (viewportWidth || 400) - 16);
  const safeBubbleHeight = isMobileLandscape 
    ? Math.min(maxHeight || 150, (viewportHeight || 300) * 0.45)
    : (maxHeight || (viewportHeight || 600) * 0.4);

  return (
    <Animated.View 
      style={[
        styles.speechBubble,
        isSingleCharacter 
          ? styles.speechBubbleSingle 
          : getPositionStyles(),
        { 
          opacity: fadeAnim, 
          borderColor: characterColor,
          maxWidth: safeBubbleWidth,
          maxHeight: safeBubbleHeight,
          overflow: 'hidden', // Always clip overflow
          zIndex: 500, // Ensure bubbles are always on top of characters
          pointerEvents: 'none',
        },
        // Compact styles for landscape
        isMobileLandscape && styles.speechBubbleCompact,
      ]}
    >
      {/* Speech bubble tail - hide for single character (bubble is above) */}
      {!isSingleCharacter && (
        <View 
          style={[
            styles.speechBubbleTail,
            position === 'left' ? styles.speechBubbleTailLeft : styles.speechBubbleTailRight,
          ]} 
        >
          <View style={[styles.speechBubbleTailInner, { borderLeftColor: position === 'right' ? characterColor : 'transparent', borderRightColor: position === 'left' ? characterColor : 'transparent' }]} />
        </View>
      )}
      {/* Bottom tail for single character */}
      {isSingleCharacter && (
        <View style={styles.speechBubbleTailBottom}>
          <View style={[styles.speechBubbleTailBottomInner, { borderTopColor: characterColor }]} />
        </View>
      )}
      <Text style={[styles.speechBubbleName, { color: characterColor, fontSize: fonts.lg }]}>{characterName}</Text>
      
      {/* Fading lines - older text fades out */}
      <View style={styles.speechBubbleLinesContainer}>
        {visibleLines.map((line, index) => (
          <FadingLine
            key={`line-${index}`}
            text={line}
            opacity={getLineOpacity(index)}
            isLast={index === visibleLines.length - 1 && isTyping}
            characterColor={characterColor}
          />
        ))}
      </View>
    </Animated.View>
  );
}

// Memoize CharacterSpeechBubble for performance
const MemoizedCharacterSpeechBubble = React.memo(CharacterSpeechBubble);

// Floating animation wrapper for characters with hover name display
function FloatingCharacterWrapper({ 
  children, 
  index, 
  style, 
  characterName, 
  characterColor,
  entranceAnimation = false,
  entranceKey = 0,
  isLeftSide = false,
}: { 
  children: React.ReactNode; 
  index: number; 
  style?: any;
  characterName: string;
  characterColor: string;
  entranceAnimation?: boolean;
  entranceKey?: number;
  isLeftSide?: boolean;
}) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const hoverAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [isHovered, setIsHovered] = useState(false);
  const { fonts } = useResponsive();
  
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
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: floatDuration,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    
    // Rotation animation (slight pivot)
    const rotateAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: rotateDuration,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(rotateAnim, {
          toValue: -1,
          duration: rotateDuration * 2,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: rotateDuration,
          useNativeDriver: Platform.OS !== 'web',
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
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [isHovered]);
  
  // Handle entrance animation - slide in from left/right based on position
  useEffect(() => {
    if (entranceAnimation && entranceKey > 0) {
      // Start from off-screen position
      const startPosition = isLeftSide ? -300 : 300;
      slideAnim.setValue(startPosition);
      
      // Animate to final position with easing
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }
  }, [entranceKey, entranceAnimation, isLeftSide]);
  
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
            { translateX: slideAnim }, // Entrance slide animation
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
            pointerEvents: 'none',
          }
        ]}
      >
        <View style={[styles.hoverNameBubble, { backgroundColor: characterColor }]}>
          <Text style={[styles.hoverNameText, { fontSize: fonts.lg }]}>{characterName}</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

export function ChatInterface({ messages, onSendMessage, showSidebar, onToggleSidebar, isLoading = false, onEditMessage, onDeleteMessage, animationScene, earlyAnimationSetup, onGreeting }: ChatInterfaceProps) {
  const dispatch = useDispatch();
  const { isFullscreen } = useSelector((state: RootState) => state.ui);
  const { showAlert, AlertComponent } = useCustomAlert();
  const { fonts, spacing, layout, isMobile, isTablet, isDesktop, isMobileLandscape, width: screenWidth, height: screenHeight } = useResponsive();
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const voiceRecorderRef = useRef(getVoiceRecorder());
  const liveSpeechRef = useRef<LiveSpeechRecognition | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  // Set initial height based on screen size - now using responsive values
  const [characterHeight, setCharacterHeight] = useState(() => {
    const { height, width } = Dimensions.get('window');
    // Mobile: smaller height, Desktop: larger height
    if (width < BREAKPOINTS.tablet) {
      return Math.floor(height * 0.25); // 25% on mobile
    } else if (width < BREAKPOINTS.desktop) {
      return Math.floor(height * 0.3); // 30% on tablet
    } else {
      return Math.floor(height * 0.35); // 35% on desktop
    }
  });
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]); // Up to 5 characters, start empty
  const [showCharacterSelector, setShowCharacterSelector] = useState(false);
  const [isMobileView, setIsMobileView] = useState(isMobile);
  const [showCharacterNames, setShowCharacterNames] = useState(true); // Show names at start
  const [nameKey, setNameKey] = useState(0); // Key to trigger re-animation
  const [showArrowPointer, setShowArrowPointer] = useState(true); // Show arrow pointer initially
  const [availableCharacters, setAvailableCharacters] = useState(getAllCharacters()); // Load from Wakattors database
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(true);
  const [showChatHistory, setShowChatHistory] = useState(false); // Hidden by default
  
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
  
  // Character selector search and filter state
  const [characterSearchQuery, setCharacterSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string | null>(null);
  
  // Entrance animation state - triggered when conversation changes or new conversation is created
  const [showEntranceAnimation, setShowEntranceAnimation] = useState(false);
  const entranceAnimationKey = useRef(0);
  
  // Animation playback state
  const [playbackState, setPlaybackState] = useState<{
    isPlaying: boolean;
    characterStates: Map<string, CharacterAnimationState>;
  }>({ isPlaying: false, characterStates: new Map() });
  const playbackEngineRef = useRef(getPlaybackEngine());
  
  // Track which messages are being animated (by characterId -> messageId)
  const [animatingMessages, setAnimatingMessages] = useState<Map<string, string>>(new Map());

  // ============================================
  // RESPONSIVE CALCULATIONS FOR BUBBLES & CHARACTERS
  // ============================================
  const characterCount = selectedCharacters.length;
  
  // Bubble sizing - scales with screen, generous width for readability
  const bubbleMaxWidth = useMemo(() => {
    // In mobile landscape, use more horizontal space (wider bubbles)
    if (isMobileLandscape) {
      const landscapeWidth = screenWidth * 0.35; // 35% of wider screen
      return Math.min(landscapeWidth, 350);
    }
    // Base width: 55% on mobile, 40% on desktop (generous for text readability)
    const baseWidth = isMobile ? screenWidth * 0.55 : screenWidth * 0.4;
    // Only slightly reduce for more characters (min 220px for readability)
    const minWidth = 220;
    const scaledWidth = Math.max(minWidth, baseWidth - (characterCount - 1) * 15);
    return Math.min(scaledWidth, 420); // Cap at 420px
  }, [isMobile, isMobileLandscape, screenWidth, characterCount]);
  
  const bubbleMaxHeight = useMemo(() => {
    // In mobile landscape, severely limit height due to constrained vertical space
    if (isMobileLandscape) {
      return Math.floor(screenHeight * 0.4); // Max 40% of limited height
    }
    return Math.floor(screenHeight * 0.5); // Max 50% of screen height for better text visibility
  }, [isMobileLandscape, screenHeight]);
  
  // Character scale - smaller when more characters to leave room for bubbles
  const characterScaleFactor = useMemo(() => {
    // 1.0 for 1 char, 0.9 for 2, 0.8 for 3, etc. (min 0.6)
    return Math.max(0.6, 1 - (characterCount - 1) * 0.1);
  }, [characterCount]);
  
  // Input area protection - calculate safe zone for bubbles
  const inputAreaHeight = 120; // Approximate input container height
  const safeTopBoundary = 8; // Minimum distance from top
  
  // Calculate bubble vertical stagger to prevent overlap
  const getBubbleTopOffset = useCallback((index: number) => {
    // In mobile landscape, position bubbles lower (beside character, not above)
    if (isMobileLandscape) {
      // Much smaller offset in landscape - bubbles sit beside characters
      const baseOffset = -20;
      const staggerAmount = 15;
      return baseOffset - (index * staggerAmount / Math.max(1, characterCount * 0.5));
    }
    // Each bubble staggers higher based on index, scaled by character count
    // Position much higher above character (-140 base offset)
    const baseOffset = isMobile ? -120 : -140;
    const staggerAmount = isMobile ? 25 : 30;
    return baseOffset - (index * staggerAmount / Math.max(1, characterCount * 0.5));
  }, [isMobile, isMobileLandscape, characterCount]);

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

  // Start early "thinking" animation while streaming (before full scene is ready)
  // Uses varied processing animations for ALL selected characters
  useEffect(() => {
    if (earlyAnimationSetup?.canStartThinkingAnimation && !animationScene) {
      // Use all selected characters, not just detected ones from early setup
      const charactersToAnimate = selectedCharacters.length > 0 
        ? selectedCharacters 
        : earlyAnimationSetup.detectedCharacters;
      
      console.log('[ChatInterface] Starting varied processing animations for:', charactersToAnimate);
      
      // Generate varied processing animations for all characters
      const estimatedDuration = earlyAnimationSetup.estimatedDuration || 15000;
      const thinkingScene = generateProcessingScene(
        charactersToAnimate,
        estimatedDuration
      ) as OrchestrationScene;
      
      playbackEngineRef.current.play(thinkingScene);
    }
  }, [earlyAnimationSetup, animationScene, selectedCharacters]);

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

      // Update mobile view state using centralized breakpoints
      const isMobileDevice = width < BREAKPOINTS.tablet;
      setIsMobileView(isMobileDevice);

      // Update character height based on screen size and chat history visibility
      // When chat history is OPEN, characters get only 10% (chat gets 90%)
      // When chat history is CLOSED, characters fill the space
      let heightPercentage = showChatHistory ? 0.10 : 0.60; // Default desktop
      if (width < BREAKPOINTS.tablet) {
        heightPercentage = showChatHistory ? 0.10 : 0.50; // Mobile
      } else if (width < BREAKPOINTS.desktop) {
        heightPercentage = showChatHistory ? 0.10 : 0.55; // Tablet
      }
      const newHeight = Math.floor(height * heightPercentage);
      setCharacterHeight(newHeight);
    };

    updateResponsiveSettings();
    const subscription = Dimensions.addEventListener('change', updateResponsiveSettings);
    return () => subscription?.remove();
  }, [showChatHistory]);

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
  const hasTriggeredGreeting = useRef(false); // Prevent duplicate greetings

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

    // CLEANUP: Stop any running animations when conversation changes
    if (conversationChanged) {
      console.log('[ChatInterface] Conversation changed, stopping animations');
      playbackEngineRef.current.stop();
      setAnimatingMessages(new Map());
      setPlaybackState({ isPlaying: false, characterStates: new Map() });
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
        // New empty conversation or initial load with no assistant messages - set random character
        // Note: Greeting is handled by the second useEffect for brand new conversations
        console.log('[ChatInterface] Empty conversation, selecting random character');
        if (availableCharacters.length > 0) {
          const randomIndex = Math.floor(Math.random() * availableCharacters.length);
          const randomChar = availableCharacters[randomIndex];
          setSelectedCharacters([randomChar.id]);
        } else {
          setSelectedCharacters([DEFAULT_CHARACTER]);
        }
        hasRestoredInitialCharacters.current = true;
        userHasSelectedCharacters.current = false;
      }
    }

    // Reset flags when conversation changes
    if (conversationChanged) {
      hasRestoredInitialCharacters.current = false;
      hasTriggeredGreeting.current = false; // Allow new greeting for new conversation
    }

    // Update previous messages reference
    previousMessagesRef.current = messages;
  }, [messages, availableCharacters]);

  // Set random character for brand new conversations (no messages at all)
  // Only if we haven't restored characters yet
  // Also triggers an automatic greeting from the random character
  useEffect(() => {
    if (messages.length === 0 && selectedCharacters.length === 0 && availableCharacters.length > 0 && !hasRestoredInitialCharacters.current) {
      // Select a RANDOM character instead of the first one
      const randomIndex = Math.floor(Math.random() * availableCharacters.length);
      const randomChar = availableCharacters[randomIndex];
      console.log('[ChatInterface] New conversation with no messages, selecting random character:', randomChar.name);
      setSelectedCharacters([randomChar.id]);
      
      // Trigger entrance animation for new conversation
      entranceAnimationKey.current += 1;
      setShowEntranceAnimation(true);
      
      // Trigger greeting from the random character (after a short delay for entrance animation)
      // Only trigger if greeting hasn't been triggered yet
      if (onGreeting && !hasTriggeredGreeting.current) {
        hasTriggeredGreeting.current = true;
        setTimeout(() => {
          const greeting = getRandomGreeting(randomChar.id, randomChar.name);
          console.log('[ChatInterface] Triggering greeting from:', randomChar.name);
          onGreeting(randomChar.id, greeting);
        }, 1000); // Wait for entrance animation
      }
    }
  }, [messages.length, selectedCharacters.length, availableCharacters, onGreeting]);

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

  // Clear entrance animation after duration (800ms)
  useEffect(() => {
    if (showEntranceAnimation) {
      const timeout = setTimeout(() => {
        setShowEntranceAnimation(false);
      }, 800); // Match animation duration
      return () => clearTimeout(timeout);
    }
  }, [showEntranceAnimation]);

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
      setIsPaused(state.isPaused);
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
        // Transcription successful - no alert needed
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

      // Also check the liveTranscript state (shown in "Live:" card)
      // This ensures we capture text even if liveSpeech.stop() returns empty
      if (!finalTranscript.trim() && liveTranscript.trim()) {
        finalTranscript = liveTranscript;
      }

      // Use live transcript if available, otherwise transcribe recorded audio
      if (finalTranscript.trim()) {
        // We got live transcription - add it to the input field
        setInput((prev) => {
          const separator = prev.trim() ? ' ' : '';
          return prev + separator + finalTranscript.trim();
        });
        setLiveTranscript('');
        // Transcription successful - no alert needed
      } else {
        // Fall back to Whisper API with recorded audio
        setLiveTranscript('');
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

  const restartRecording = async () => {
    const voiceRecorder = voiceRecorderRef.current;
    const liveSpeech = liveSpeechRef.current;

    // Cancel current recording
    voiceRecorder.cancelRecording();
    if (liveSpeech) {
      liveSpeech.abort();
    }
    setLiveTranscript('');

    // Small delay to ensure cleanup
    await new Promise(resolve => setTimeout(resolve, 100));

    // Start new recording
    try {
      await voiceRecorder.startRecording();
      if (liveSpeech && liveSpeech.isSupported()) {
        try {
          liveSpeech.start();
        } catch (error) {
          console.error('[ChatInterface] Failed to restart live speech:', error);
        }
      }
    } catch (error: any) {
      console.error('[ChatInterface] Failed to restart recording:', error);
    }
  };

  const togglePause = () => {
    const voiceRecorder = voiceRecorderRef.current;
    if (isPaused) {
      voiceRecorder.resumeRecording();
    } else {
      voiceRecorder.pauseRecording();
    }
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

  // Test function to trigger all characters speaking at random times
  const handleTestSpeech = () => {
    if (selectedCharacters.length === 0) {
      showAlert('No Characters', 'Please select at least one Wakattor to test.');
      return;
    }

    const testText = `To the One Beyond the Horizon
Where goes the wind when day departs?
It carries, perhaps, our vanished dreams—
The faint perfume of your forgotten laughter,
The ashes of words that once burned like suns.

I see you still, beyond the edge of memory,
A light half-veiled by time’s weary hand.
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

    // Create timelines for each selected character
    const timelines: CharacterTimeline[] = selectedCharacters.map((characterId, index) => {
      // Random start delay between 0 and 3 seconds, staggered
      const baseDelay = index * 500; // 500ms stagger between characters
      const randomDelay = Math.random() * 500; // Plus 0-0.5s random
      const startDelay = baseDelay + randomDelay;

      // Create segments for speaking animation
      const segments: AnimationSegment[] = [
        {
          animation: 'talking' as AnimationState,
          duration: textDuration,
          complementary: {
            lookDirection: 'center' as LookDirection,
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
            lookDirection: 'center' as LookDirection,
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

    // Create the test scene
    const testScene: OrchestrationScene = {
      timelines,
      sceneDuration: maxEndTime,
      nonSpeakerBehavior: {},
    };

    console.log('[ChatInterface] Starting test speech playback', {
      characters: selectedCharacters.length,
      sceneDuration: maxEndTime,
    });

    // Start playback
    playbackEngineRef.current.play(testScene);
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
            isMobileView && styles.characterSelectorPanelMobile,
            { pointerEvents: 'box-none' }
          ]}
        >
          <View style={styles.characterSelectorHeader}>
            <Text style={[styles.characterSelectorTitle, { fontSize: fonts.sm }]}>Select Wakattors (Max 5)</Text>
            {isMobileView && (
              <TouchableOpacity onPress={() => setShowCharacterSelector(false)}>
                <Ionicons name="close" size={24} color="#ff6b35" />
              </TouchableOpacity>
            )}
          </View>

          {/* Search Input */}
          <View style={styles.characterSearchContainer}>
            <Ionicons name="search" size={16} color="#71717a" />
            <TextInput
              style={[styles.characterSearchInput, { fontSize: fonts.sm }]}
              placeholder="Search by name..."
              placeholderTextColor="#71717a"
              value={characterSearchQuery}
              onChangeText={setCharacterSearchQuery}
            />
            {characterSearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setCharacterSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color="#71717a" />
              </TouchableOpacity>
            )}
          </View>

          {/* Role Category Filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleFilterScroll}>
            <TouchableOpacity
              style={[
                styles.roleFilterChip,
                selectedRoleFilter === null && styles.roleFilterChipActive,
              ]}
              onPress={() => setSelectedRoleFilter(null)}
            >
              <Text style={[styles.roleFilterText, selectedRoleFilter === null && styles.roleFilterTextActive, { fontSize: fonts.xs }]}>
                All
              </Text>
            </TouchableOpacity>
            {Array.from(new Set(availableCharacters.map(c => c.role).filter(Boolean))).map((role) => (
              <TouchableOpacity
                key={role}
                style={[
                  styles.roleFilterChip,
                  selectedRoleFilter === role && styles.roleFilterChipActive,
                ]}
                onPress={() => setSelectedRoleFilter(selectedRoleFilter === role ? null : role)}
              >
                <Text style={[styles.roleFilterText, selectedRoleFilter === role && styles.roleFilterTextActive, { fontSize: fonts.xs }]}>
                  {role}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Selected Characters Section (at top with remove buttons) */}
          {selectedCharacters.length > 0 && (
            <>
              <Text style={[styles.characterSectionLabel, { fontSize: fonts.xs }]}>
                Selected ({selectedCharacters.length}/5)
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectedCharactersScroll}>
                {selectedCharacters.map((characterId) => {
                  const character = availableCharacters.find(c => c.id === characterId) || getCharacter(characterId);
                  const isConversationOnly = !availableCharacters.some(c => c.id === characterId);
                  return (
                    <View
                      key={characterId}
                      style={[
                        styles.selectedCharacterChip,
                        { borderColor: character.color },
                        isConversationOnly && styles.selectedCharacterChipConversationOnly,
                      ]}
                    >
                      <View style={[styles.characterSelectorIndicator, { backgroundColor: character.color }]} />
                      <Text style={[styles.selectedCharacterName, { fontSize: fonts.sm }]}>
                        {character.name}
                      </Text>
                      <TouchableOpacity
                        onPress={() => toggleCharacter(characterId)}
                        style={styles.removeCharacterButton}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="close" size={14} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </ScrollView>
              <View style={styles.characterSectionDivider} />
            </>
          )}

          {/* Available Characters Section */}
          <Text style={[styles.characterSectionLabel, { fontSize: fonts.xs }]}>
            Available
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.characterSelectorScroll}>
            {(() => {
              // Filter characters based on search and role
              const filteredCharacters = availableCharacters.filter((character) => {
                const matchesSearch = characterSearchQuery === '' || 
                  character.name.toLowerCase().includes(characterSearchQuery.toLowerCase());
                const matchesRole = selectedRoleFilter === null || character.role === selectedRoleFilter;
                const isNotSelected = !selectedCharacters.includes(character.id);
                return matchesSearch && matchesRole && isNotSelected;
              });

              if (filteredCharacters.length === 0) {
                return (
                  <View style={styles.noResultsContainer}>
                    <Text style={[styles.noResultsText, { fontSize: fonts.sm }]}>
                      {characterSearchQuery || selectedRoleFilter 
                        ? 'No matching characters' 
                        : 'All characters selected'}
                    </Text>
                  </View>
                );
              }

              return filteredCharacters.map((character) => (
                <TouchableOpacity
                  key={character.id}
                  style={styles.characterSelectorCard}
                  onPress={() => toggleCharacter(character.id)}
                >
                  <View style={[styles.characterSelectorIndicator, { backgroundColor: character.color }]} />
                  <Text style={[styles.characterSelectorName, { fontSize: fonts.sm }]}>
                    {character.name}
                  </Text>
                  <Ionicons name="add-circle" size={18} color={character.color} />
                </TouchableOpacity>
              ));
            })()}
          </ScrollView>
        </View>
      )}

      {/* 3D Character Display - Hidden in landscape when chat history is shown */}
      {!(isMobileLandscape && showChatHistory) && (
      <View style={[
        styles.characterDisplayContainer, 
        // In mobile landscape, always take full available space
        isMobileLandscape ? { flex: 1 } : (showChatHistory ? { height: characterHeight } : { flex: 1 })
      ]}>
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
          <Text style={[styles.characterSelectorText, { fontSize: fonts.sm }]}>
            {selectedCharacters.length} Wakattor{selectedCharacters.length !== 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>

        {/* Tell me a Poem Button */}
        <TouchableOpacity
          style={styles.testSpeechButton}
          onPress={handleTestSpeech}
          disabled={playbackState.isPlaying}
        >
          <Ionicons 
            name={playbackState.isPlaying ? "stop-circle" : "play-circle"} 
            size={20} 
            color={playbackState.isPlaying ? "#ef4444" : "#22c55e"} 
          />
          <Text style={[styles.testSpeechText, playbackState.isPlaying && styles.testSpeechTextActive, { fontSize: fonts.sm }]}>
            {playbackState.isPlaying ? 'Playing...' : 'Tell me a Poem'}
          </Text>
        </TouchableOpacity>

        {/* Sending Message Indicator - Top button when loading */}
        {isLoading && (
          <View style={styles.sendingMessageButton}>
            <ActivityIndicator size="small" color="#8b5cf6" />
            <Text style={[styles.sendingMessageText, { fontSize: fonts.sm }]}>Sending message...</Text>
          </View>
        )}

        {/* Mobile Speech Bubble Stack - Renders all active bubbles in a single container to avoid overlap */}
        {/* Protected from overflowing into input area via dynamic maxHeight */}
        {/* In mobile landscape, use side positioning instead of stacked */}
        {isMobile && selectedCharacters.length > 1 && !isMobileLandscape && (
          <View style={[styles.mobileBubbleStack, { maxHeight: Math.floor(characterHeight * 0.5) }]}>
            {Array.from(new Set(selectedCharacters)).map((characterId, index) => {
              const character = availableCharacters.find(c => c.id === characterId) || getCharacter(characterId);
              const charPlaybackState = playbackState.characterStates.get(characterId);
              const usePlayback = playbackState.isPlaying && charPlaybackState;
              const revealedText = usePlayback ? playbackEngineRef.current.getRevealedText(characterId) : '';
              const isSpeakingNow = usePlayback && charPlaybackState?.isTalking;
              const isTypingNow = usePlayback && revealedText && revealedText.length > 0;
              
              // Only render bubble if character is speaking
              if (!isSpeakingNow && !isTypingNow) return null;
              
              return (
                <MemoizedCharacterSpeechBubble
                  key={`mobile-bubble-${characterId}`}
                  text={revealedText || ''}
                  characterName={character.name}
                  characterColor={character.color}
                  position="left"
                  isTyping={!!isTypingNow}
                  isSpeaking={!!isSpeakingNow}
                  isSingleCharacter={false}
                  isMobileStacked={true}
                  stackIndex={index}
                  // Responsive props for mobile stacked bubbles
                  maxWidth={screenWidth - 32} // Full width minus padding
                  maxHeight={Math.floor(characterHeight * 0.4)} // Max 40% of character area
                  screenWidth={screenWidth}
                  characterIndex={index}
                />
              );
            })}
          </View>
        )}

        {/* Multiple Character Display - Semi-circle arrangement (table view) */}
        <View style={styles.charactersRow}>
          {selectedCharacters.length === 0 ? (
            <View style={styles.emptyCharacterState}>
              <Ionicons name="person-add" size={48} color="#666" />
              <Text style={[styles.emptyCharacterText, { fontSize: fonts.md }]}>Click "0 Wakattors" to select characters</Text>
            </View>
          ) : (
            Array.from(new Set(selectedCharacters)).map((characterId, index) => {
              // Get character from availableCharacters (includes custom wakattors) or fallback to built-in
              const character = availableCharacters.find(c => c.id === characterId) || getCharacter(characterId);
              const total = selectedCharacters.length;
              
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
              const horizontalOffset = Math.sin(angleRad) * 50; // 30% max offset from center (closer together)
              
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
              
              // For 5 characters, the center character should have bubble above (like single character)
              const isCenterCharacter = total === 5 && horizontalOffset === 0;
              
              // Get revealed text for this character's speech bubble
              const charPlaybackState = playbackState.characterStates.get(characterId);
              const usePlayback = playbackState.isPlaying && charPlaybackState;
              const revealedText = usePlayback ? playbackEngineRef.current.getRevealedText(characterId) : '';
              const isSpeaking = usePlayback && charPlaybackState?.isTalking;
              const isTyping = usePlayback && revealedText && revealedText.length > 0;
              
              return (
                <FloatingCharacterWrapper
                  key={characterId}
                  index={index}
                  characterName={character.name}
                  characterColor={character.color}
                  entranceAnimation={showEntranceAnimation}
                  entranceKey={entranceAnimationKey.current}
                  isLeftSide={horizontalOffset < 0}
                  style={[
                    styles.characterWrapper,
                    {
                      position: 'absolute',
                      left: `${50 + horizontalOffset - (100 / total / 2)}%`, // Centered
                      width: `${Math.max(100 / total, 25)}%`,
                      top: `${25 + (20 - verticalPosition)}%`, // Center higher up, edges lower
                      transform: [{ scale }],
                      zIndex: zIndex,
                    }
                  ]}
                >
                  {(() => {
                    // Use walking animation during entrance, otherwise use playback animation
                    const entranceWalkingAnimation = showEntranceAnimation ? 'walking' : undefined;
                    const finalAnimation = entranceWalkingAnimation || (usePlayback ? charPlaybackState.animation : undefined);
                    
                    return (
                      <CharacterDisplay3D
                        character={character}
                        isActive={(usePlayback && charPlaybackState.isActive) || showEntranceAnimation}
                        animation={finalAnimation}
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
                  {/* Speech Bubble - Comic book style, to the side of character (or above if single/center) */}
                  {/* On mobile portrait with multiple characters, use the stacked bubbles above instead */}
                  {/* In mobile landscape, always show bubbles beside characters */}
                  {(isMobileLandscape || !(isMobile && total > 1)) && (
                    <MemoizedCharacterSpeechBubble
                      text={revealedText || ''}
                      characterName={character.name}
                      characterColor={character.color}
                      position={bubblePosition}
                      isTyping={!!isTyping}
                      isSpeaking={!!isSpeaking}
                      isSingleCharacter={total === 1 || isCenterCharacter}
                      // Responsive props
                      maxWidth={bubbleMaxWidth}
                      maxHeight={bubbleMaxHeight}
                      topOffset={getBubbleTopOffset(index)}
                      screenWidth={screenWidth}
                      characterIndex={index}
                    />
                  )}
                </FloatingCharacterWrapper>
              );
            })
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
          ]}
        >
          <Ionicons 
            name={showChatHistory ? "chevron-down" : "chevron-up"} 
            size={16} 
            color={showChatHistory ? "#ffffff" : "#a1a1aa"} 
          />
          <Ionicons 
            name={showChatHistory ? "chatbubbles" : "chatbubbles-outline"} 
            size={18} 
            color={showChatHistory ? "#ffffff" : "#a1a1aa"} 
          />
          {messages.length > 0 && (
            <View style={[styles.dividerMessageBadge, showChatHistory && styles.dividerMessageBadgeActive]}>
              <Text style={[styles.dividerMessageBadgeText, showChatHistory && { color: '#8b5cf6' }, { fontSize: fonts.xs }]}>
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
          ]}
        >
          <Ionicons 
            name={showChatHistory ? "people" : "chatbubbles"} 
            size={24} 
            color="#ffffff" 
          />
          <Text style={[styles.landscapeToggleText, { fontSize: fonts.sm }]}>
            {showChatHistory ? 'Characters' : 'Chat'}
          </Text>
          {!showChatHistory && messages.length > 0 && (
            <View style={styles.landscapeToggleBadge}>
              <Text style={[styles.landscapeToggleBadgeText, { fontSize: fonts.xs }]}>
                {messages.length > 99 ? '99+' : messages.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Fullscreen Toggle Button (web only) */}
      {Platform.OS === 'web' && (
        <TouchableOpacity
          onPress={toggleFullscreen}
          style={[
            styles.fullscreenButton,
            isFullscreen && styles.fullscreenButtonActive,
          ]}
        >
          <Ionicons 
            name={isFullscreen ? "contract" : "expand"} 
            size={20} 
            color="#ffffff" 
          />
        </TouchableOpacity>
      )}


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
                            // Show cursor if text is still being revealed
                            const showCursor = revealedText.length < message.content.length;
                            return (
                              <Text style={[styles.messageText, { fontSize: fonts.md }]}>
                                {revealedText}
                                {showCursor && <Text style={styles.typingCursor}>|</Text>}
                              </Text>
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

      <View style={styles.inputContainer}>
        {/* Recording Status & Live Transcript */}
        {(isRecording || liveTranscript || isTranscribing) && (
          <View style={styles.recordingStatusContainer}>
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
                <ActivityIndicator size="small" color="#8b5cf6" />
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
            width: isMobile ? '95%' : isTablet ? '70%' : '50%',
            minWidth: isMobile ? 280 : 300,
            maxWidth: isMobile ? 9999 : 500,
            padding: spacing.md,
            gap: spacing.md,
          }
        ]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type in here.."
            placeholderTextColor="#71717a"
            style={[
              styles.textInput, 
              { 
                fontSize: fonts.md,
                minHeight: layout.inputMinHeight,
              }
            ]}
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
                { minWidth: layout.minTouchTarget, minHeight: layout.minTouchTarget }
              ]}
            >
              {isRecording ? <MaterialCommunityIcons name="microphone-off" size={isMobile ? 22 : 24} color="white" /> : <MaterialCommunityIcons name="microphone" size={isMobile ? 22 : 24} color="#a1a1aa" />}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSendMessagePress}
              disabled={!input.trim() || isLoading}
              style={[
                styles.iconButton,
                styles.sendButton,
                (!input.trim() || isLoading) && styles.sendButtonDisabled,
                { minWidth: layout.minTouchTarget, minHeight: layout.minTouchTarget }
              ]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
              <Ionicons name="send" size={isMobile ? 22 : 24} color="white" />
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
    paddingHorizontal: 14,
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
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
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
    backgroundColor: '#8b5cf6',
    zIndex: 100,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
      },
      ios: {
        shadowColor: '#8b5cf6',
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
    color: '#8b5cf6',
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
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  dividerMessageBadge: {
    backgroundColor: '#8b5cf6',
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
    fontSize: 10,
    fontWeight: '700',
  },
  sendingMessageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#8b5cf6',
    zIndex: 10,
  },
  sendingMessageText: {
    fontFamily: 'Inter-SemiBold',
    color: '#8b5cf6',
    fontSize: 13,
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
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
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
    fontFamily: 'Inter-Regular',
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
    borderTopWidth: 0,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    backgroundColor: '#171717',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    maxWidth: 500,
    width: '50%',
    minWidth: 300,
    alignSelf: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: 'transparent',
    fontFamily: 'Inter-Regular',
    color: 'white',
    fontSize: 15,
    minHeight: 40,
    maxHeight: 128,
    paddingHorizontal: 4,
    paddingVertical: 8,
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
    overflow: 'visible',
  },
  characterWrapper: {
    height: '85%',
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
    fontSize: 18,
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
    fontSize: 22,
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
    fontFamily: 'Poppins-SemiBold',
    color: '#ff6b35',
    fontSize: 14,
  },
  testSpeechButton: {
    position: 'absolute',
    bottom: 8,
    left: 160,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 15, 15, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#27272a',
    zIndex: 10,
  },
  testSpeechText: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '600',
  },
  testSpeechTextActive: {
    color: '#ef4444',
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
    fontSize: 14,
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
    fontSize: 14,
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
    fontSize: 14,
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
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  roleFilterText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: '500',
  },
  roleFilterTextActive: {
    color: 'white',
  },
  characterSectionLabel: {
    color: '#71717a',
    fontSize: 11,
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
    fontSize: 13,
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
    fontSize: 14,
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
  // Speech bubble styles
  speechBubble: {
    position: 'absolute',
    top: 10,
    maxWidth: 420, // Base max, can be overridden by dynamic prop
    minWidth: 200, // Minimum for text readability
    paddingHorizontal: 16,
    paddingVertical: 14,
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
  speechBubbleLeft: {
    right: 70,
    top: -140,
    transform: [{ translateX: 30 }], // moves bubble to the left
  },
  speechBubbleRight: {
    left: 80,
    top: -140,
    transform: [{ translateX: -30 }], // moves bubble to the right
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
    flexDirection: 'column',
    gap: 6,
    alignItems: 'flex-start',
    overflow: 'hidden', // Prevent bubbles from overflowing
  },
  // Mobile stacked bubble style - full width, compact
  speechBubbleMobileStacked: {
    position: 'relative',
    width: '100%',
    maxWidth: '100%',
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    fontSize: 14,
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
