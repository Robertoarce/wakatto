/**
 * useTextToSpeech - Text-to-speech management hook
 *
 * Provides TTS functionality for character responses with voice profile support.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { getTextToSpeech, TTSState, isTTSSupported } from '../../../services/textToSpeech';
import { CharacterVoiceProfile } from '../../../config/voiceConfig';
import { estimateTTSDuration } from '../../../services/ttsDurationEstimator';

// Declare window for React Native TypeScript compatibility
declare const window: any;

// Voice type for cross-platform compatibility
interface VoiceInfo {
  name: string;
  lang: string;
  localService: boolean;
}

interface UseTextToSpeechOptions {
  enabled?: boolean;
  voiceProfile?: CharacterVoiceProfile;
  voiceName?: string;
  onSpeakStart?: () => void;
  onSpeakEnd?: () => void;
  onError?: (error: Error) => void;
  onBoundary?: (charIndex: number, charLength: number) => void;
}

interface SpeakOptions {
  voiceProfile?: CharacterVoiceProfile;
  onBoundary?: (charIndex: number, charLength: number) => void;
}

interface UseTextToSpeechResult {
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
  ttsEnabled: boolean;
  ttsProgress: number; // 0-1 progress through current speech
  setTtsEnabled: (enabled: boolean) => void;
  speak: (text: string, options?: SpeakOptions | CharacterVoiceProfile) => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  availableVoices: VoiceInfo[];
  selectedVoiceName: string | null;
  setSelectedVoiceName: (name: string | null) => void;
  estimateDuration: (text: string, rate?: number) => number;
}

export function useTextToSpeech(options: UseTextToSpeechOptions = {}): UseTextToSpeechResult {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [ttsProgress, setTtsProgress] = useState(0);
  const [ttsEnabled, setTtsEnabled] = useState(options.enabled ?? false);
  const [availableVoices, setAvailableVoices] = useState<VoiceInfo[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string | null>(
    options.voiceName ?? null
  );

  const ttsRef = useRef(getTextToSpeech());
  const isSupported = isTTSSupported();

  // Setup TTS state listener
  useEffect(() => {
    const tts = ttsRef.current;

    tts.setOnStateChange((state: TTSState) => {
      setIsSpeaking(state.isSpeaking);
      setIsPaused(state.isPaused);
      setTtsProgress(state.progress);
    });

    // Load available voices
    const loadVoices = () => {
      const voices = tts.getVoices();
      setAvailableVoices(voices);

      // Set default voice if none selected
      if (!selectedVoiceName && voices.length > 0) {
        // Prefer English voices
        const englishVoices = voices.filter((v) => v.lang.startsWith('en'));
        if (englishVoices.length > 0) {
          setSelectedVoiceName(englishVoices[0].name);
        }
      }
    };

    // Initial load
    loadVoices();

    // Listen for voice changes (Chrome loads async)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      (window as any).speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      tts.stop();
    };
  }, []);

  const speak = useCallback(
    async (text: string, speakOptions?: SpeakOptions | CharacterVoiceProfile) => {
      if (!isSupported || !ttsEnabled) {
        console.log('[useTextToSpeech] TTS disabled or not supported');
        return;
      }

      const tts = ttsRef.current;

      // Handle both old format (just voiceProfile) and new format (options object)
      let voiceProfile: CharacterVoiceProfile | undefined;
      let onBoundary: ((charIndex: number, charLength: number) => void) | undefined;

      if (speakOptions) {
        if ('voiceProfile' in speakOptions || 'onBoundary' in speakOptions) {
          // New format: SpeakOptions object
          voiceProfile = (speakOptions as SpeakOptions).voiceProfile;
          onBoundary = (speakOptions as SpeakOptions).onBoundary;
        } else {
          // Old format: just CharacterVoiceProfile
          voiceProfile = speakOptions as CharacterVoiceProfile;
        }
      }

      try {
        await tts.speak(text, {
          voiceProfile: voiceProfile || options.voiceProfile,
          voiceName: selectedVoiceName || undefined,
          onStart: options.onSpeakStart,
          onEnd: options.onSpeakEnd,
          onError: options.onError,
          onBoundary: onBoundary || options.onBoundary,
        });
      } catch (error: any) {
        console.error('[useTextToSpeech] Error speaking:', error);
        options.onError?.(error);
      }
    },
    [isSupported, ttsEnabled, selectedVoiceName, options]
  );

  const stop = useCallback(() => {
    ttsRef.current.stop();
  }, []);

  const pause = useCallback(() => {
    ttsRef.current.pause();
  }, []);

  const resume = useCallback(() => {
    ttsRef.current.resume();
  }, []);

  // Memoized duration estimator
  const estimateDuration = useCallback((text: string, rate: number = 1.0): number => {
    return estimateTTSDuration(text, rate);
  }, []);

  return {
    isSpeaking,
    isPaused,
    isSupported,
    ttsEnabled,
    ttsProgress,
    setTtsEnabled,
    speak,
    stop,
    pause,
    resume,
    availableVoices,
    selectedVoiceName,
    setSelectedVoiceName,
    estimateDuration,
  };
}

export default useTextToSpeech;
