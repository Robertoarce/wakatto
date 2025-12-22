/**
 * Unified Text-to-Speech Service
 *
 * Platform-agnostic wrapper that automatically uses:
 * - Web: Web Speech Synthesis API (textToSpeech.ts)
 * - Mobile: expo-speech (textToSpeechMobile.ts)
 */

import { Platform } from 'react-native';
import { TextToSpeech, TTSState, TTSOptions, getTextToSpeech, isTTSSupported as isWebTTSSupported } from './textToSpeech';
import { MobileTextToSpeech, MobileTTSState, MobileTTSOptions, getMobileTextToSpeech } from './textToSpeechMobile';
import { CharacterVoiceProfile, SegmentVoice } from '../config/voiceConfig';

export interface UnifiedTTSState {
  isSpeaking: boolean;
  isPaused: boolean;
  currentText: string;
}

export interface UnifiedTTSOptions {
  voiceProfile?: CharacterVoiceProfile;
  segmentVoice?: SegmentVoice;
  voiceName?: string; // Web only
  language?: string; // Mobile preference
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Unified TTS that works on both web and mobile
 */
export class UnifiedTextToSpeech {
  private webTTS: TextToSpeech | null = null;
  private mobileTTS: MobileTextToSpeech | null = null;
  private isWeb: boolean;
  private onStateChange?: (state: UnifiedTTSState) => void;
  private currentState: UnifiedTTSState = {
    isSpeaking: false,
    isPaused: false,
    currentText: '',
  };

  constructor() {
    this.isWeb = Platform.OS === 'web';

    if (this.isWeb) {
      this.webTTS = getTextToSpeech();
      this.setupWebListener();
    } else {
      this.mobileTTS = getMobileTextToSpeech();
      this.setupMobileListener();
    }
  }

  /**
   * Setup web TTS state listener
   */
  private setupWebListener(): void {
    if (this.webTTS) {
      this.webTTS.setOnStateChange((state: TTSState) => {
        this.updateState({
          isSpeaking: state.isSpeaking,
          isPaused: state.isPaused,
          currentText: state.currentText,
        });
      });
    }
  }

  /**
   * Setup mobile TTS state listener
   */
  private setupMobileListener(): void {
    if (this.mobileTTS) {
      this.mobileTTS.setOnStateChange((state: MobileTTSState) => {
        this.updateState({
          isSpeaking: state.isSpeaking,
          isPaused: false, // Mobile doesn't track pause state the same way
          currentText: state.currentText,
        });
      });
    }
  }

  /**
   * Set callback for state changes
   */
  setOnStateChange(callback: (state: UnifiedTTSState) => void): void {
    this.onStateChange = callback;
  }

  /**
   * Update state and notify listeners
   */
  private updateState(newState: Partial<UnifiedTTSState>): void {
    this.currentState = { ...this.currentState, ...newState };
    if (this.onStateChange) {
      this.onStateChange(this.currentState);
    }
  }

  /**
   * Get current state
   */
  getState(): UnifiedTTSState {
    return { ...this.currentState };
  }

  /**
   * Check if TTS is supported on current platform
   */
  isSupported(): boolean {
    if (this.isWeb) {
      return isWebTTSSupported();
    }
    return this.mobileTTS?.isSupported() ?? false;
  }

  /**
   * Speak text with optional voice profile
   */
  async speak(text: string, options: UnifiedTTSOptions = {}): Promise<void> {
    if (this.isWeb && this.webTTS) {
      await this.webTTS.speak(text, {
        voiceProfile: options.voiceProfile,
        segmentVoice: options.segmentVoice,
        voiceName: options.voiceName,
        onStart: options.onStart,
        onEnd: options.onEnd,
        onError: options.onError,
      });
    } else if (this.mobileTTS) {
      await this.mobileTTS.speak(text, {
        voiceProfile: options.voiceProfile,
        segmentVoice: options.segmentVoice,
        language: options.language,
        onStart: options.onStart,
        onDone: options.onEnd,
        onError: options.onError,
      });
    } else {
      throw new Error('No TTS engine available');
    }
  }

  /**
   * Stop speaking
   */
  stop(): void {
    if (this.isWeb && this.webTTS) {
      this.webTTS.stop();
    } else if (this.mobileTTS) {
      this.mobileTTS.stop();
    }
  }

  /**
   * Pause speaking
   */
  pause(): void {
    if (this.isWeb && this.webTTS) {
      this.webTTS.pause();
    } else if (this.mobileTTS) {
      this.mobileTTS.pause();
    }
  }

  /**
   * Resume speaking
   */
  resume(): void {
    if (this.isWeb && this.webTTS) {
      this.webTTS.resume();
    } else if (this.mobileTTS) {
      this.mobileTTS.resume();
    }
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return this.currentState.isSpeaking;
  }

  /**
   * Get platform type
   */
  getPlatform(): 'web' | 'mobile' {
    return this.isWeb ? 'web' : 'mobile';
  }
}

// Singleton instance
let unifiedTTSInstance: UnifiedTextToSpeech | null = null;

/**
 * Get singleton unified TTS instance
 */
export function getUnifiedTextToSpeech(): UnifiedTextToSpeech {
  if (!unifiedTTSInstance) {
    unifiedTTSInstance = new UnifiedTextToSpeech();
  }
  return unifiedTTSInstance;
}

/**
 * Check if TTS is supported on current platform
 */
export function isUnifiedTTSSupported(): boolean {
  if (Platform.OS === 'web') {
    return isWebTTSSupported();
  }
  return Platform.OS === 'ios' || Platform.OS === 'android';
}
