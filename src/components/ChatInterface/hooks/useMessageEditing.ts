/**
 * useMessageEditing - Message deletion functionality
 * (Edit functionality removed - only delete remains)
 */

import { useCallback } from 'react';
import { Message } from '../types/chatInterface.types';

interface UseMessageEditingOptions {
  isLoading: boolean;
  onDeleteMessage?: (messageId: string) => void;
  showAlert: (title: string, message: string, buttons?: any[]) => void;
}

interface UseMessageEditingResult {
  confirmDeleteMessage: (messageId: string) => void;
  handleLongPressMessage: (message: Message) => void;
}

export function useMessageEditing({
  isLoading,
  onDeleteMessage,
  showAlert,
}: UseMessageEditingOptions): UseMessageEditingResult {

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
    // Prevent deleting when AI is responding to avoid race conditions
    if (isLoading) {
      showAlert(
        'Action Not Available',
        'Please wait for the AI to finish responding before deleting messages.'
      );
      return;
    }

    // Only allow deleting user messages
    if (message.role === 'user') {
      confirmDeleteMessage(message.id);
    }
  }, [isLoading, showAlert, confirmDeleteMessage]);

  return {
    confirmDeleteMessage,
    handleLongPressMessage,
  };
}

export default useMessageEditing;
