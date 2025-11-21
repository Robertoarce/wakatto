
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
  PanResponder,
  FlatList,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '../types';
import CharacterDisplay3D, { AnimationState } from './CharacterDisplay3D';
import { DEFAULT_CHARACTER, getAllCharacters, getCharacter } from '../config/characters';
import { getVoiceRecorder, RecordingState } from '../services/voiceRecording';
import { transcribeAudio } from '../services/speechToText';
import { LiveSpeechRecognition, LiveTranscriptionResult, isWebSpeechSupported } from '../services/speechToTextLive';
import { isVoiceSupported, detectBrowser, getBrowserGuidance } from '../utils/browserDetection';
import { ttsService } from '../services/ttsService';
import { MessageItem } from './MessageItem';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string, selectedCharacters: string[], options?: { useFastModel?: boolean }) => void;
  isLoading: boolean;
  selectedCharacters: string[];
  setSelectedCharacters: React.Dispatch<React.SetStateAction<string[]>>;
  onDeleteMessage?: (messageId: string) => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
}

export default function ChatInterface({
  messages,
  onSendMessage,
  isLoading,
  selectedCharacters,
  setSelectedCharacters,
  onDeleteMessage,
  onEditMessage,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const scrollViewRef = useRef<FlatList>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const liveSpeechRef = useRef<LiveSpeechRecognition | null>(null);
  const [characterHeight, setCharacterHeight] = useState(300); // Default height
  const [isMobileView, setIsMobileView] = useState(false);
  const [showCharacterSelector, setShowCharacterSelector] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [showCharacterNames, setShowCharacterNames] = useState(false);
  const [nameKey, setNameKey] = useState(0);
  const [showArrowPointer, setShowArrowPointer] = useState(true); // Show arrow pointer initially

  // Animation and TTS state
  const [characterAnimation, setCharacterAnimation] = useState<AnimationState>('idle');
  const [isCharacterTalking, setIsCharacterTalking] = useState(false);
  const [lastProcessedMessageId, setLastProcessedMessageId] = useState<string | null>(null);

  const availableCharacters = getAllCharacters();

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

  // Arrow pointer logic
  useEffect(() => {
    if (messages.length > 0 || showCharacterSelector || (selectedCharacters.length !== 1 || selectedCharacters[0] !== DEFAULT_CHARACTER)) {
      setShowArrowPointer(false);
      return;
    }
    const timer = setTimeout(() => setShowArrowPointer(false), 20000);
    return () => clearTimeout(timer);
  }, [messages.length, showCharacterSelector, selectedCharacters]);

  // Restore characters from messages when conversation is loaded
  useEffect(() => {
    if (messages.length > 0) {
      const characterIds = messages
        .filter(msg => msg.role === 'assistant' && msg.characterId)
        .map(msg => msg.characterId as string);

      const uniqueCharacterIds = Array.from(new Set(characterIds));

      if (uniqueCharacterIds.length > 0) {
        const currentIds = [...selectedCharacters].sort().join(',');
        const newIds = [...uniqueCharacterIds].sort().join(',');

        if (currentIds !== newIds) {
          setSelectedCharacters(uniqueCharacterIds);
        }
      }
    } else {
      if (selectedCharacters.length !== 1 || selectedCharacters[0] !== DEFAULT_CHARACTER) {
        setSelectedCharacters([DEFAULT_CHARACTER]);
      }
    }
  }, [messages]);

  // Show character names when characters change
  useEffect(() => {
    setShowCharacterNames(true);
    setNameKey(prev => prev + 1);
    const timer = setTimeout(() => setShowCharacterNames(false), 5000);
    return () => clearTimeout(timer);
  }, [selectedCharacters]);

  // Process new assistant messages for TTS and Animation
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];

    if (lastMessage && lastMessage.role === 'assistant' && lastMessage.id !== lastProcessedMessageId) {
      setLastProcessedMessageId(lastMessage.id);

      // Parse metadata
      const content = lastMessage.content;
      const actionMatch = content.match(/\[ACTION:\s*(\w+)\]/i);
      const toneMatch = content.match(/\[TONE:\s*(\w+)\]/i);

      const action = actionMatch ? actionMatch[1].toLowerCase() : 'idle';
      const tone = toneMatch ? toneMatch[1].toLowerCase() : undefined;

      // Set animation
      // Map action string to AnimationState type safely
      const validActions: AnimationState[] = ['idle', 'thinking', 'talking', 'confused', 'happy', 'excited', 'winning', 'walking', 'jump', 'surprise_jump', 'surprise_happy', 'furious', 'sad'];
      if (validActions.includes(action as AnimationState)) {
        setCharacterAnimation(action as AnimationState);
      }

      // Clean text for TTS
      const cleanText = content.replace(/\[ACTION:\s*\w+\]/gi, '').replace(/\[TONE:\s*\w+\]/gi, '').trim();

      // Trigger TTS
      ttsService.speak(cleanText, lastMessage.characterId, {
        tone,
        onStart: () => setIsCharacterTalking(true),
        onEnd: () => {
          setIsCharacterTalking(false);
          setCharacterAnimation('idle'); // Reset animation after talking
        }
      });
    }
  }, [messages, lastProcessedMessageId]);

  // Pan responder for resizable divider
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const newHeight = characterHeight + gestureState.dy;
        const { height: windowHeight, width: windowWidth } = Dimensions.get('window');
        let minPercent = windowWidth < 768 ? 0.15 : 0.2;
        let maxPercent = windowWidth < 768 ? 0.4 : 0.6;
        const minHeight = Math.floor(windowHeight * minPercent);
        const maxHeight = Math.floor(windowHeight * maxPercent);
        if (newHeight >= minHeight && newHeight <= maxHeight) {
          setCharacterHeight(newHeight);
        }
      },
    })
  ).current;

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // Cancel editing when AI starts responding
  useEffect(() => {
    if (isLoading && editingMessageId) {
      setEditingMessageId(null);
      setEditingContent('');
    }
  }, [isLoading, editingMessageId]);

  // Setup voice recorder and live speech recognition
  useEffect(() => {
    const voiceRecorder = getVoiceRecorder();

    voiceRecorder.setOnStateChange((state: RecordingState) => {
      setIsRecording(state.isRecording);
      setRecordingDuration(state.duration);
    });

    if (isWebSpeechSupported()) {
      const liveSpeech = new LiveSpeechRecognition();
      liveSpeech.setOnResult((result: LiveTranscriptionResult) => {
        setLiveTranscript(result.transcript);
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
    if (e.nativeEvent.key === 'Enter' && (e.nativeEvent.ctrlKey || e.nativeEvent.metaKey)) {
      e.preventDefault();
      handleSendMessagePress();
    }
  };

  const handleTranscription = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const result = await transcribeAudio(audioBlob, 'whisper', false);
      if (result.text.trim()) {
        onSendMessage(result.text.trim(), selectedCharacters, { useFastModel: true });
      } else {
        showAlert('No Speech Detected', 'Could not detect any speech.');
      }
    } catch (error: any) {
      showAlert('Transcription Failed', error.message);
    } finally {
      setIsTranscribing(false);
    }
  };

  const toggleRecording = async () => {
    const voiceRecorder = getVoiceRecorder();
    const liveSpeech = liveSpeechRef.current;

    const voiceSupport = isVoiceSupported();
    if (!voiceSupport.supported) {
      showAlert('Not Supported', voiceSupport.message);
      return;
    }

    if (isRecording) {
      voiceRecorder.stopRecording();
      let finalTranscript = '';
      if (liveSpeech && liveSpeech.isSupported()) {
        finalTranscript = liveSpeech.stop();
      }

      if (finalTranscript.trim()) {
        onSendMessage(finalTranscript.trim(), selectedCharacters, { useFastModel: true });
        setLiveTranscript('');
      } else {
        const state = voiceRecorder.getState();
        if (state.audioBlob) {
          await handleTranscription(state.audioBlob);
        }
      }
    } else {
      try {
        setLiveTranscript('');
        await voiceRecorder.startRecording();
        if (liveSpeech && liveSpeech.isSupported()) {
          liveSpeech.start();
        }
      } catch (error: any) {
        showAlert('Recording Error', error.message);
      }
    }
  };

  const showAlert = (title: string, message: string, buttons?: any[]) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  const startEditingMessage = (message: Message) => {
    setEditingMessageId(message.id);
    setEditingContent(message.content);
  };

  const saveEditedMessage = () => {
    if (isLoading) return;
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
    setSelectedCharacters(prev => {
      if (prev.includes(characterId)) {
        if (prev.length === 1) return prev;
        return prev.filter(id => id !== characterId);
      } else {
        if (prev.length >= 5) {
          showAlert('Maximum Reached', 'You can select up to 5 characters maximum.');
          return prev;
        }
        return [...prev, characterId];
      }
    });
  };

  const confirmDeleteMessage = (messageId: string) => {
    showAlert('Delete Message', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDeleteMessage && onDeleteMessage(messageId) },
    ]);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    return (
      <MessageItem
        message={item}
        isEditing={editingMessageId === item.id}
        editingContent={editingContent}
        onEditingContentChange={setEditingContent}
        onCancelEdit={cancelEditing}
        onSaveEdit={saveEditedMessage}
        onStartEdit={startEditingMessage}
        onDelete={confirmDeleteMessage}
        isLoading={isLoading}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* 3D Character Display */}
      <View style={[styles.characterDisplayContainer, { height: characterHeight }]}>
        <CharacterDisplay3D
          characterId={selectedCharacters[0]}
          isActive={true}
          animation={characterAnimation}
          isTalking={isCharacterTalking}
          showName={showCharacterNames}
          nameKey={nameKey}
        />

        {/* Character Selector Overlay */}
        {showCharacterSelector && (
          <View style={styles.characterSelectorOverlay}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.characterSelector}>
              {availableCharacters.map((char) => (
                <TouchableOpacity
                  key={char.id}
                  style={[
                    styles.characterOption,
                    selectedCharacters.includes(char.id) && styles.characterOptionSelected,
                    { borderColor: char.color }
                  ]}
                  onPress={() => toggleCharacter(char.id)}
                >
                  <View style={[styles.characterOptionColor, { backgroundColor: char.color }]} />
                  <Text style={styles.characterOptionName}>{char.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Toggle Selector Button */}
        <TouchableOpacity
          style={styles.selectorToggle}
          onPress={() => setShowCharacterSelector(!showCharacterSelector)}
        >
          <Ionicons name={showCharacterSelector ? "chevron-down" : "people"} size={24} color="white" />
        </TouchableOpacity>

        {/* Arrow Pointer */}
        {showArrowPointer && (
          <View style={styles.arrowPointer}>
            <Text style={styles.arrowText}>Chat with {getCharacter(selectedCharacters[0]).name}</Text>
            <Ionicons name="arrow-down" size={30} color="white" />
          </View>
        )}

        {/* Resizable Handle */}
        <View
          style={styles.resizeHandle}
          {...panResponder.panHandlers}
        >
          <View style={styles.resizeBar} />
        </View>
      </View>

      {/* Chat Area */}
      <View style={styles.chatArea}>
        <FlatList
          ref={scrollViewRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={isRecording ? (liveTranscript || 'Listening...') : input}
              onChangeText={setInput}
              placeholder={isRecording ? "Listening..." : "Type a message..."}
              placeholderTextColor="#9ca3af"
              multiline
              editable={!isRecording}
              onKeyPress={handleKeyPress}
            />

            <TouchableOpacity
              style={[styles.micButton, isRecording && styles.micButtonActive]}
              onPress={toggleRecording}
            >
              <Ionicons name={isRecording ? "stop" : "mic"} size={24} color="white" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() && !isRecording) && styles.sendButtonDisabled]}
            onPress={handleSendMessagePress}
            disabled={!input.trim() && !isRecording}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Ionicons name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>

        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>
              Recording {Math.floor(recordingDuration / 1000)}s
            </Text>
            <TouchableOpacity onPress={() => {
              const voiceRecorder = getVoiceRecorder();
              voiceRecorder.cancelRecording();
              if (liveSpeechRef.current) liveSpeechRef.current.abort();
              setLiveTranscript('');
            }}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  characterDisplayContainer: {
    width: '100%',
    backgroundColor: '#1f2937',
    position: 'relative',
    overflow: 'hidden',
  },
  characterSelectorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
  },
  characterSelector: {
    flexDirection: 'row',
  },
  characterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginRight: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    borderWidth: 1,
  },
  characterOptionSelected: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  characterOptionColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  characterOptionName: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  selectorToggle: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  arrowPointer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    color: 'white',
    marginBottom: 5,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10
  },
  resizeHandle: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  resizeBar: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 2,
  },
  chatArea: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  messageList: {
    padding: 16,
    paddingBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'flex-end',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 24,
    alignItems: 'center',
    paddingRight: 8,
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
    color: '#1f2937',
  },
  micButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#9ca3af',
  },
  micButtonActive: {
    backgroundColor: '#ef4444',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: '#fee2e2',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    marginRight: 8,
  },
  recordingText: {
    color: '#ef4444',
    fontWeight: '600',
    marginRight: 16,
  },
  cancelText: {
    color: '#6b7280',
    textDecorationLine: 'underline',
  },
});
