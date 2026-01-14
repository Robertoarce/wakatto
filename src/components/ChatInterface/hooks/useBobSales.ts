/**
 * useBobSales - Bob sales pitch manager integration
 * Makes Bob start talking whenever he appears in the chat
 *
 * Triggers when:
 * - Bob is added to any conversation
 * - App starts with Bob selected
 * - User switches to a conversation with Bob
 * - User clicks "Become Premium" (premium pitch mode)
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { OrchestrationScene } from '../../../services/animationOrchestration';
import { getPlaybackEngine } from '../../../services/animationPlaybackEngine';
import {
  BobSalesManager,
  initBobSalesManager,
  destroyBobSalesManager,
  getBobSalesManager,
  BOB_CONFIG,
} from '../../../services/bobSalesPitchService';
import { generatePremiumPitchScene } from '../../../services/bobPremiumPitchService';

interface UseBobSalesOptions {
  selectedCharacters: string[];
  conversationId: string | null | undefined;
  onSaveMessage?: (characterId: string, content: string) => void;
  isPlaying: boolean;
  hasUserMessages: boolean;
  // External trigger for premium pitch (from "Become Premium" button)
  triggerPremiumPitch?: boolean;
  onPremiumPitchConsumed?: () => void;
}

interface UseBobSalesResult {
  isBobPitching: boolean;
  bobSceneOverride: OrchestrationScene | null;
  notifyUserResponse: () => void;
  // Premium pitch mode
  isPremiumPitch: boolean;
  triggerPremiumPitch: () => void;
}

export function useBobSales({
  selectedCharacters,
  conversationId,
  onSaveMessage,
  isPlaying,
  hasUserMessages,
  triggerPremiumPitch: externalPremiumTrigger,
  onPremiumPitchConsumed,
}: UseBobSalesOptions): UseBobSalesResult {
  const [isBobPitching, setIsBobPitching] = useState(false);
  const [bobSceneOverride, setBobSceneOverride] = useState<OrchestrationScene | null>(null);
  const [isPremiumPitch, setIsPremiumPitch] = useState(false);
  const bobManagerRef = useRef<BobSalesManager | null>(null);
  const pendingMessageRef = useRef<{ characterId: string; content: string } | null>(null);

  // Track Bob's presence to detect when he appears/disappears
  const wasBobSelectedRef = useRef(false);
  // Track if we've already pitched in this Bob session (resets when Bob leaves)
  const hasPitchedThisSessionRef = useRef(false);
  // Track if premium pitch was triggered
  const premiumPitchTriggeredRef = useRef(false);
  // Track previous isPlaying state to detect transitions (not initial state)
  const wasPlayingRef = useRef(false);

  // Handle Bob pitch start - play animation, queue message save
  const handlePitchStart = useCallback((scene: OrchestrationScene, message: string) => {
    setIsBobPitching(true);
    setBobSceneOverride(scene);

    // Start playback
    const engine = getPlaybackEngine();
    engine.play(scene);

    // Queue message to save after playback completes
    if (onSaveMessage && conversationId) {
      pendingMessageRef.current = {
        characterId: BOB_CONFIG.characterId,
        content: message,
      };
    }
  }, [onSaveMessage, conversationId]);

  // Handle Bob pitch complete - save queued message
  const handlePitchComplete = useCallback(() => {
    setIsBobPitching(false);
    setBobSceneOverride(null);

    // Save pending message
    if (onSaveMessage && pendingMessageRef.current) {
      onSaveMessage(pendingMessageRef.current.characterId, pendingMessageRef.current.content);
      pendingMessageRef.current = null;
    }
  }, [onSaveMessage]);

  // Initialize Bob sales manager when Bob appears in the chat
  useEffect(() => {
    const isBobSelected = selectedCharacters.includes(BOB_CONFIG.characterId);
    const bobJustAppeared = isBobSelected && !wasBobSelectedRef.current;
    const bobJustLeft = !isBobSelected && wasBobSelectedRef.current;

    // Update tracking ref
    wasBobSelectedRef.current = isBobSelected;

    // Bob just appeared - start his pitch!
    if (bobJustAppeared && conversationId && !hasPitchedThisSessionRef.current) {
      hasPitchedThisSessionRef.current = true;

      bobManagerRef.current = initBobSalesManager(
        {
          onPitchStart: handlePitchStart,
          onPitchComplete: handlePitchComplete,
        },
        conversationId  // For tutorial token limit multiplier (3x)
      );

      // Start Bob's pitch after a brief delay (let any animations settle)
      setTimeout(() => {
        bobManagerRef.current?.start();
      }, 1000);
    }

    // Bob left - reset for next time he appears
    if (bobJustLeft) {
      if (bobManagerRef.current) {
        bobManagerRef.current.stop();
        bobManagerRef.current = null;
      }
      hasPitchedThisSessionRef.current = false;
    }

  }, [selectedCharacters, conversationId, handlePitchStart, handlePitchComplete]);

  // Also start Bob if he's already selected when conversation loads
  useEffect(() => {
    const isBobSelected = selectedCharacters.includes(BOB_CONFIG.characterId);

    if (isBobSelected && conversationId && !hasPitchedThisSessionRef.current && !bobManagerRef.current) {
      // Bob is already here and we haven't pitched yet
      hasPitchedThisSessionRef.current = true;
      wasBobSelectedRef.current = true;

      bobManagerRef.current = initBobSalesManager(
        {
          onPitchStart: handlePitchStart,
          onPitchComplete: handlePitchComplete,
        },
        conversationId  // For tutorial token limit multiplier (3x)
      );

      // Start Bob's pitch after entrance animations
      setTimeout(() => {
        bobManagerRef.current?.start();
      }, 1500);
    }
  }, [conversationId, selectedCharacters, handlePitchStart, handlePitchComplete]);

  // Reset when conversation changes
  useEffect(() => {
    return () => {
      // Cleanup when conversation changes
      hasPitchedThisSessionRef.current = false;
      wasBobSelectedRef.current = false;
      destroyBobSalesManager();
      bobManagerRef.current = null;
    };
  }, [conversationId]);

  // Listen for playback completion to notify Bob manager
  // Only trigger when transitioning from playing=true to playing=false
  // This prevents false triggers when bobSceneOverride is set before playback starts
  useEffect(() => {
    const wasPlaying = wasPlayingRef.current;
    wasPlayingRef.current = isPlaying;
    
    // Only trigger onPitchComplete when we transition from playing to not playing
    // Not when isPlaying is initially false (before playback starts)
    if (wasPlaying && !isPlaying && bobSceneOverride && bobManagerRef.current) {
      bobManagerRef.current.onPitchComplete();
    }
  }, [isPlaying, bobSceneOverride]);

  // Stop follow-ups when user has responded (but Bob already started)
  useEffect(() => {
    if (hasUserMessages && bobManagerRef.current) {
      bobManagerRef.current.userResponded();
    }
  }, [hasUserMessages]);

  // Notify Bob that user is responding (typing)
  const notifyUserResponse = useCallback(() => {
    const manager = getBobSalesManager();
    if (manager) {
      manager.userResponded();
    }
  }, []);

  // Trigger premium pitch manually (turn-around animation)
  const triggerPremiumPitch = useCallback(() => {
    if (premiumPitchTriggeredRef.current || isBobPitching) {
      return; // Already triggered or currently pitching
    }

    premiumPitchTriggeredRef.current = true;
    setIsPremiumPitch(true);
    setIsBobPitching(true);

    // Generate and play the premium pitch scene
    const { scene, message } = generatePremiumPitchScene();
    setBobSceneOverride(scene);

    // Start playback
    const engine = getPlaybackEngine();
    engine.play(scene);

    // Queue message to save after playback completes
    if (onSaveMessage && conversationId) {
      pendingMessageRef.current = {
        characterId: BOB_CONFIG.characterId,
        content: message,
      };
    }
  }, [isBobPitching, onSaveMessage, conversationId]);

  // Handle external premium pitch trigger (from navigation/props)
  useEffect(() => {
    if (externalPremiumTrigger && !premiumPitchTriggeredRef.current) {
      // Delay to allow conversation to load
      setTimeout(() => {
        triggerPremiumPitch();
        onPremiumPitchConsumed?.();
      }, 800);
    }
  }, [externalPremiumTrigger, triggerPremiumPitch, onPremiumPitchConsumed]);

  // Handle premium pitch completion
  useEffect(() => {
    if (!isPlaying && isPremiumPitch && bobSceneOverride) {
      // Premium pitch playback completed
      setIsBobPitching(false);
      // Don't clear bobSceneOverride yet - keep buttons visible
      // The scene will be cleared when user interacts or sends a message
      
      // Save pending message
      if (onSaveMessage && pendingMessageRef.current) {
        onSaveMessage(pendingMessageRef.current.characterId, pendingMessageRef.current.content);
        pendingMessageRef.current = null;
      }
    }
  }, [isPlaying, isPremiumPitch, bobSceneOverride, onSaveMessage]);

  return {
    isBobPitching,
    bobSceneOverride,
    notifyUserResponse,
    isPremiumPitch,
    triggerPremiumPitch,
  };
}

export default useBobSales;
