/**
 * useMessageEditing - Message editing and deletion functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { Message } from '../types/chatInterface.types';

interface UseMessageEditingOptions {
  isLoading: boolean;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  showAlert: (title: string, message: string, buttons?: any[]) => void;
}

interface UseMessageEditingResult {
  editingMessageId: string | null;
  editingContent: string;
  setEditingContent: React.Dispatch<React.SetStateAction<string>>;
  startEditingMessage: (message: Message) => void;
  saveEditedMessage: () => void;
  cancelEditing: () => void;
  confirmDeleteMessage: (messageId: string) => void;
  handleLongPressMessage: (message: Message) => void;
}

export function useMessageEditing({
  isLoading,
  onEditMessage,
  onDeleteMessage,
  showAlert,
}: UseMessageEditingOptions): UseMessageEditingResult {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  // Cancel editing when AI starts responding to prevent race conditions
  useEffect(() => {
    if (isLoading && editingMessageId) {
      setEditingMessageId(null);
      setEditingContent('');
    }
  }, [isLoading, editingMessageId]);

  const startEditingMessage = useCallback((message: Message) => {
    setEditingMessageId(message.id);
    setEditingContent(message.content);
  }, []);

  const saveEditedMessage = useCallback(() => {
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
  }, [isLoading, editingMessageId, editingContent, onEditMessage, showAlert]);

  const cancelEditing = useCallback(() => {
    setEditingMessageId(null);
    setEditingContent('');
  }, []);

  const confirmDeleteMessage = useCallback((messageId: string) => {
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
  }, [onDeleteMessage, showAlert]);

  const handleLongPressMessage = useCallback((message: Message) => {
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
  }, [isLoading, showAlert, startEditingMessage, confirmDeleteMessage]);

  return {
    editingMessageId,
    editingContent,
    setEditingContent,
    startEditingMessage,
    saveEditedMessage,
    cancelEditing,
    confirmDeleteMessage,
    handleLongPressMessage,
  };
}

export default useMessageEditing;
