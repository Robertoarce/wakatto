import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, PanResponder, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCustomAlert } from './CustomAlert';
import { CharacterDisplay3D } from './CharacterDisplay3D';
import { DEFAULT_CHARACTER, getAllCharacters, getCharacter } from '../config/characters';
import { getVoiceRecorder, RecordingState } from '../services/voiceRecording';
import { transcribeAudio, isWebSpeechSupported } from '../services/speechToText';
import { LiveSpeechRecognition, LiveTranscriptionResult } from '../services/speechToTextLive';
import { detectBrowser, getBrowserGuidance, isVoiceSupported } from '../utils/browserDetection';

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
}

export function ChatInterface({ messages, onSendMessage, showSidebar, onToggleSidebar, isLoading = false, onEditMessage, onDeleteMessage }: ChatInterfaceProps) {
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
  // Set initial height to 1/3 of viewport height
  const [characterHeight, setCharacterHeight] = useState(() => {
    const windowHeight = Dimensions.get('window').height;
    return Math.floor(windowHeight / 3);
  });
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([DEFAULT_CHARACTER]); // Up to 5 characters
  const [showCharacterSelector, setShowCharacterSelector] = useState(false);

  const availableCharacters = getAllCharacters();

  // Update character height on window resize
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      const newHeight = Math.floor(window.height / 3);
      setCharacterHeight(newHeight);
    });
    return () => subscription?.remove();
  }, []);

  // Pan responder for resizable divider
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const newHeight = characterHeight + gestureState.dy;
        const windowHeight = Dimensions.get('window').height;
        // Constrain height between 20% and 60% of viewport
        const minHeight = Math.floor(windowHeight * 0.2);
        const maxHeight = Math.floor(windowHeight * 0.6);
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
    setSelectedCharacters(prev => {
      if (prev.includes(characterId)) {
        // Don't allow removing if only one left
        if (prev.length === 1) return prev;
        return prev.filter(id => id !== characterId);
      } else {
        // Don't allow more than 5 characters
        if (prev.length >= 5) {
          showAlert('Maximum Reached', 'You can select up to 5 characters maximum.');
          return prev;
        }
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
      {/* 3D Character Display - Resizable */}
      <View style={[styles.characterDisplayContainer, { height: characterHeight }]}>
        {/* Character Selector Button */}
        <TouchableOpacity
          style={styles.characterSelectorButton}
          onPress={() => setShowCharacterSelector(!showCharacterSelector)}
        >
          <Ionicons name="people" size={20} color="#8b5cf6" />
          <Text style={styles.characterSelectorText}>
            {selectedCharacters.length} Character{selectedCharacters.length !== 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>

        {/* Character Selector Modal */}
        {showCharacterSelector && (
          <View style={styles.characterSelectorPanel}>
            <Text style={styles.characterSelectorTitle}>Select Characters (Max 5)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.characterSelectorScroll}>
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

        {/* Multiple Character Display */}
        <View style={styles.charactersRow}>
          {selectedCharacters.map((characterId, index) => (
            <View key={characterId} style={[styles.characterWrapper, { flex: 1 / selectedCharacters.length }]}>
              <CharacterDisplay3D
                characterId={characterId}
                isActive={isLoading}
              />
            </View>
          ))}
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
                      <Text style={styles.messageText}>{message.content}</Text>
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
    cursor: 'ns-resize',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#27272a',
  },
  dividerHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#52525b',
    borderRadius: 2,
  },
  chatScrollView: {
    flex: 1,
  },
  messagesContainer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  messagesContent: {
    width: '100%',
    maxWidth: 768,
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
    fontSize: 14,
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
    flexDirection: 'row',
    flex: 1,
  },
  characterWrapper: {
    height: '100%',
  },
  characterSelectorButton: {
    position: 'absolute',
    top: 8,
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
    color: '#8b5cf6',
    fontSize: 14,
    fontWeight: '600',
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
    zIndex: 10,
  },
  characterSelectorTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
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
});
