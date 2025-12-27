/**
 * useAnimationPlayback - Animation playback engine state management
 * Subscribes to playback engine and manages playback state with smart updates
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { getPlaybackEngine, PlaybackState, PlaybackStatus } from '../../../services/animationPlaybackEngine';
import { CharacterAnimationState, OrchestrationScene } from '../../../services/animationOrchestration';
import { CharacterVoiceProfile } from '../../../config/voiceConfig';
import { Message } from '../types/chatInterface.types';
import { memDebug } from '../../../services/performanceLogger';

interface UseAnimationPlaybackResult {
  playbackState: {
    isPlaying: boolean;
    characterStates: Map<string, CharacterAnimationState>;
  };
  playbackEngineRef: React.MutableRefObject<ReturnType<typeof getPlaybackEngine>>;
  isPlayingRef: React.MutableRefObject<boolean>;
  animatingMessages: Map<string, string>;
  setAnimatingMessages: React.Dispatch<React.SetStateAction<Map<string, string>>>;
  playScene: (scene: OrchestrationScene, voiceProfiles?: Map<string, CharacterVoiceProfile>) => void;
  stopPlayback: () => void;
}

export function useAnimationPlayback(): UseAnimationPlaybackResult {
  const [playbackState, setPlaybackState] = useState<{
    isPlaying: boolean;
    characterStates: Map<string, CharacterAnimationState>;
  }>({ isPlaying: false, characterStates: new Map() });

  const playbackEngineRef = useRef(getPlaybackEngine());
  // Synchronous ref to track playback state without triggering re-renders
  const isPlayingRef = useRef(false);

  // Track which messages are being animated (by characterId -> messageId)
  const [animatingMessages, setAnimatingMessages] = useState<Map<string, string>>(new Map());

  // Subscribe to animation playback engine
  // Update on status changes and periodically during playback for text reveal
  useEffect(() => {
    memDebug.trackMount('useAnimationPlayback');
    console.log('[PLAYBACK-DEBUG] 🎬 Subscribing to animation playback engine');
    let updateCount = 0;

    const engine = playbackEngineRef.current;
    // Track previous state to detect significant changes
    let prevStatus: string | null = null;
    let prevTalkingMap = new Map<string, boolean>();
    let prevAnimationMap = new Map<string, string>();
    let lastUpdateTime = 0;
    const TEXT_REVEAL_UPDATE_INTERVAL = 50; // Update every 50ms during active playback for smooth text reveal

    const unsubscribe = engine.subscribe((state: PlaybackState) => {
      // Always update ref synchronously (used by effects to skip processing during playback)
      isPlayingRef.current = state.status === 'playing';

      // Check for significant changes
      let hasSignificantChange = false;

      // 1. Status changed (idle -> playing -> complete)
      if (state.status !== prevStatus) {
        hasSignificantChange = true;
        console.log(`[PLAYBACK-DEBUG] 📊 Status change: ${prevStatus} -> ${state.status} (chars: ${state.characterStates.size})`);
        prevStatus = state.status;
      }

      // 2. Any character's talking status changed
      for (const [charId, charState] of state.characterStates) {
        const wasTalking = prevTalkingMap.get(charId) || false;
        if (charState.isTalking !== wasTalking) {
          hasSignificantChange = true;
          prevTalkingMap.set(charId, charState.isTalking);
        }

        // 3. Any character's animation changed
        const prevAnimation = prevAnimationMap.get(charId) || '';
        if (charState.animation !== prevAnimation) {
          hasSignificantChange = true;
          prevAnimationMap.set(charId, charState.animation);
        }
      }

      // 4. During active playback with talking characters, update periodically for text reveal
      const now = performance.now();
      const hasActiveTalking = Array.from(state.characterStates.values()).some(s => s.isTalking);
      if (state.status === 'playing' && hasActiveTalking && (now - lastUpdateTime) >= TEXT_REVEAL_UPDATE_INTERVAL) {
        hasSignificantChange = true;
        lastUpdateTime = now;
      }

      // Only update React state if something significant changed
      if (hasSignificantChange) {
        updateCount++;
        // Log every 100th update to avoid console spam
        if (updateCount % 100 === 0) {
          console.log(`[PLAYBACK-DEBUG] 📈 ${updateCount} state updates so far`);
          memDebug.checkMemory('useAnimationPlayback');
        }
        setPlaybackState({
          isPlaying: state.status === 'playing',
          characterStates: state.characterStates
        });
      }
    });

    return () => {
      console.log(`[PLAYBACK-DEBUG] 🎬 Unsubscribing from animation playback engine (had ${updateCount} updates)`);
      memDebug.trackUnmount('useAnimationPlayback');
      unsubscribe();
    };
  }, []);

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

  // Play a scene with optional voice profiles
  const playScene = useCallback((scene: OrchestrationScene, voiceProfiles?: Map<string, CharacterVoiceProfile>) => {
    if (voiceProfiles) {
      playbackEngineRef.current.setCharacterVoiceProfiles(voiceProfiles);
    }
    playbackEngineRef.current.play(scene);
  }, []);

  // Stop current playback
  const stopPlayback = useCallback(() => {
    playbackEngineRef.current.stop();
    setPlaybackState({ isPlaying: false, characterStates: new Map() });
  }, []);

  return {
    playbackState,
    playbackEngineRef,
    isPlayingRef,
    animatingMessages,
    setAnimatingMessages,
    playScene,
    stopPlayback,
  };
}

export default useAnimationPlayback;
