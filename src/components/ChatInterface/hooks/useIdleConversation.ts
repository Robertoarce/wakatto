/**
 * useIdleConversation - Idle conversation manager integration
 * Characters talk to each other when user is away
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { OrchestrationScene } from '../../../services/animationOrchestration';
import { getPlaybackEngine } from '../../../services/animationPlaybackEngine';
import {
  IdleConversationManager,
  IdleConversationState,
  initIdleConversationManager,
  destroyIdleConversationManager,
  getIdleConversationManager
} from '../../../services/idleConversationService';

interface UseIdleConversationOptions {
  selectedCharacters: string[];
  conversationId: string | null | undefined;
  onSaveIdleMessage?: (characterId: string, content: string, metadata?: Record<string, any>) => void;
  isPlaying: boolean;
}

interface UseIdleConversationResult {
  idleConversationState: IdleConversationState;
  idleAnimationSceneOverride: OrchestrationScene | null;
  setIdleAnimationSceneOverride: React.Dispatch<React.SetStateAction<OrchestrationScene | null>>;
  handleIdleConversationComplete: () => Promise<void>;
  handleUserTyping: () => void;
}

export function useIdleConversation({
  selectedCharacters,
  conversationId,
  onSaveIdleMessage,
  isPlaying,
}: UseIdleConversationOptions): UseIdleConversationResult {
  const [idleConversationState, setIdleConversationState] = useState<IdleConversationState>('ACTIVE');
  const idleManagerRef = useRef<IdleConversationManager | null>(null);
  const [idleAnimationSceneOverride, setIdleAnimationSceneOverride] = useState<OrchestrationScene | null>(null);
  // PERFORMANCE: Batch pending messages to save after playback completes (prevents re-renders during playback)
  const pendingIdleMessagesRef = useRef<Array<{ characterId: string; content: string; metadata?: Record<string, any> }>>([]);

  // Handle idle conversation start - play the animation, defer message saves
  const handleIdleConversationStart = useCallback(async (scene: OrchestrationScene) => {
    // Set the scene to play - use override to not conflict with normal animationScene prop
    setIdleAnimationSceneOverride(scene);

    // Start playback
    const engine = getPlaybackEngine();
    engine.play(scene);

    // PERFORMANCE: Queue messages to save AFTER playback completes (not during)
    // This prevents Redux updates from triggering re-renders during animation
    if (onSaveIdleMessage && conversationId) {
      pendingIdleMessagesRef.current = scene.timelines
        .filter(timeline => timeline.content)
        .map(timeline => ({
          characterId: timeline.characterId,
          content: timeline.content,
          metadata: { is_idle_conversation: true }
        }));
    }
  }, [onSaveIdleMessage, conversationId]);

  // Handle idle conversation complete - now save all queued messages
  const handleIdleConversationComplete = useCallback(async () => {
    setIdleAnimationSceneOverride(null);

    // Save all pending messages in batch AFTER playback completes
    if (onSaveIdleMessage && pendingIdleMessagesRef.current.length > 0) {
      for (const msg of pendingIdleMessagesRef.current) {
        await onSaveIdleMessage(msg.characterId, msg.content, msg.metadata);
      }
      pendingIdleMessagesRef.current = []; // Clear the queue
    }

    // Notify the manager that we're done
    idleManagerRef.current?.onConversationComplete();
  }, [onSaveIdleMessage]);

  // Handle user return interruption
  const handleUserReturnInterruption = useCallback((scene: OrchestrationScene) => {
    // Play the interruption scene
    setIdleAnimationSceneOverride(scene);
    const engine = getPlaybackEngine();
    engine.play(scene);

    // PERFORMANCE: Queue interruption messages to save after playback (same as idle conversation)
    if (onSaveIdleMessage && conversationId) {
      const newMessages = scene.timelines
        .filter(timeline => timeline.content)
        .map(timeline => ({
          characterId: timeline.characterId,
          content: timeline.content,
          metadata: { is_idle_conversation: true }
        }));
      pendingIdleMessagesRef.current = [...pendingIdleMessagesRef.current, ...newMessages];
    }
  }, [onSaveIdleMessage, conversationId]);

  // Handle idle conversation state change
  const handleIdleStateChange = useCallback((state: IdleConversationState) => {
    setIdleConversationState(state);
  }, []);

  // Initialize idle conversation manager when characters change
  useEffect(() => {
    // DISABLED FOR NOW - idle conversations will be enabled later
    // To enable in the future, set ENABLE_IDLE_CONVERSATIONS to true below
    const ENABLE_IDLE_CONVERSATIONS = false; // <<<<<< BOOLEAN BOOL FLAG HERE 

    // Only enable if idle conversations are enabled, 2+ characters selected and we have a conversation
    if (ENABLE_IDLE_CONVERSATIONS && selectedCharacters.length >= 2 && conversationId) {
      idleManagerRef.current = initIdleConversationManager(
        selectedCharacters,
        {
          onStateChange: handleIdleStateChange,
          onConversationStart: handleIdleConversationStart,
          onConversationComplete: handleIdleConversationComplete,
          onUserReturnInterruption: handleUserReturnInterruption,
        }
      );

      // Start monitoring after a short delay to avoid triggering immediately
      setTimeout(() => {
        idleManagerRef.current?.start();
      }, 2000);

    } else if (idleManagerRef.current) {
      // Stop and destroy if we don't have enough characters or idle is disabled
      idleManagerRef.current.stop();
      idleManagerRef.current = null;
    }

    return () => {
      destroyIdleConversationManager();
      idleManagerRef.current = null;
    };
  }, [selectedCharacters, conversationId, handleIdleStateChange, handleIdleConversationStart, handleIdleConversationComplete, handleUserReturnInterruption]);

  // Update characters in the manager when selection changes
  useEffect(() => {
    if (idleManagerRef.current) {
      idleManagerRef.current.updateCharacters(selectedCharacters);
    }
  }, [selectedCharacters]);

  // Listen for playback completion to notify idle manager
  useEffect(() => {
    if (!isPlaying && idleAnimationSceneOverride) {
      // Playback ended - notify idle manager
      handleIdleConversationComplete();
    }
  }, [isPlaying, idleAnimationSceneOverride, handleIdleConversationComplete]);

  // Handle user typing - detect user return
  const handleUserTyping = useCallback(() => {
    const manager = getIdleConversationManager();
    if (manager) {
      manager.handleUserTyping();
    }
  }, []);

  return {
    idleConversationState,
    idleAnimationSceneOverride,
    setIdleAnimationSceneOverride,
    handleIdleConversationComplete,
    handleUserTyping,
  };
}

export default useIdleConversation;
