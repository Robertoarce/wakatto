import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  showSidebar: boolean;
  onToggleSidebar: () => void;
}

export function ChatInterface({ messages, onSendMessage, showSidebar, onToggleSidebar }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSendMessagePress = () => {
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // In a real app, this would start/stop voice recording
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        <View style={styles.messagesContent}>
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageBubbleContainer,
                message.role === 'user' ? styles.userMessageContainer : styles.assistantMessageContainer,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  message.role === 'user' ? styles.userMessageBubble : styles.assistantMessageBubble,
                ]}
              >
                <Text style={styles.messageText}>{message.content}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type your message or use voice..."
            placeholderTextColor="#a1a1aa"
            style={styles.textInput}
            multiline
            onFocus={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          />
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={toggleRecording}
              style={[
                styles.iconButton,
                isRecording ? styles.recordButtonActive : styles.recordButtonInactive,
              ]}
            >
              {isRecording ? <MaterialCommunityIcons name="microphone-off" size={24} color="white" /> : <MaterialCommunityIcons name="microphone" size={24} color="#a1a1aa" />}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSendMessagePress}
              disabled={!input.trim()}
              style={[
                styles.iconButton,
                styles.sendButton,
                !input.trim() && styles.sendButtonDisabled,
              ]}
            >
              <Ionicons name="send" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
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
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  assistantMessageContainer: {
    justifyContent: 'flex-start',
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
    maxWidth: 768,
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
});
