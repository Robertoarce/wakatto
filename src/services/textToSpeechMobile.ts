/**
 * Mobile Text-to-Speech Service using expo-speech
 *
 * Provides TTS functionality on iOS/Android using Expo's Speech API.
 */

import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import {
  CharacterVoiceProfile,
  SegmentVoice,
  VoicePitch,
  VoicePace,
  VoiceVolume,
  mergeVoiceWithDefaults,
} from '../config/voiceConfig';

export interface MobileTTSState {
  isSpeaking: boolean;
  currentText: string;
}

export interface MobileTTSOptions {
  voiceProfile?: CharacterVoiceProfile;
  segmentVoice?: SegmentVoice;
  language?: string;
  onStart?: () => void;
  onDone?: () => void;
  onStopped?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Map VoicePitch to expo-speech pitch value (0.5-2.0)
 */
function mapPitchToValue(pitch?: VoicePitch): number {
  switch (pitch) {
    case 'shrill':
      return 1.8;
    case 'high':
      return 1.4;
    case 'medium':
      return 1.0;
    case 'low':
      return 0.7;
    case 'deep':
      return 0.5;
    default:
      return 1.0;
  }
}

/**
 * Map VoicePace to expo-speech rate value (0.1-2.0)
 */
function mapPaceToRate(pace?: VoicePace): number {
  switch (pace) {
    case 'slow':
      return 0.8;
    case 'normal':
      return 1.0;
    case 'fast':
      return 1.3;
    default:
      return 1.0;
  }
}

/**
 * Map VoiceVolume to expo-speech volume value (0-1)
 * Note: Volume control may not be available on all platforms
 */
function mapVolumeToValue(volume?: VoiceVolume): number {
  switch (volume) {
    case 'whispered':
      return 0.3;
    case 'soft':
      return 0.5;
    case 'normal':
      return 0.8;
    case 'loud':
      return 0.95;
    case 'booming':
      return 1.0;
    default:
      return 0.8;
  }
}

export class MobileTextToSpeech {
  private currentState: MobileTTSState = {
    isSpeaking: false,
    currentText: '',
  };
  private onStateChange?: (state: MobileTTSState) => void;
  private speechQueue: Array<{ text: string; options: MobileTTSOptions }> = [];
  private isProcessingQueue: boolean = false;

  /**
   * Set callback for state changes
   */
  setOnStateChange(callback: (state: MobileTTSState) => void): void {
    this.onStateChange = callback;
  }

  /**
   * Update state and notify listeners
   */
  private updateState(newState: Partial<MobileTTSState>): void {
    this.currentState = { ...this.currentState, ...newState };
    if (this.onStateChange) {
      this.onStateChange(this.currentState);
    }
  }

  /**
   * Get current state
   */
  getState(): MobileTTSState {
    return { ...this.currentState };
  }

  /**
   * Check if TTS is supported
   */
  isSupported(): boolean {
    return Platform.OS === 'ios' || Platform.OS === 'android';
  }

  /**
   * Get available voices
   */
  async getVoices(): Promise<Speech.Voice[]> {
    try {
      return await Speech.getAvailableVoicesAsync();
    } catch (error) {
      console.error('[MobileTTS] Error getting voices:', error);
      return [];
    }
  }

  /**
   * Check if currently speaking
   */
  async isSpeaking(): Promise<boolean> {
    try {
      return await Speech.isSpeakingAsync();
    } catch (error) {
      return false;
    }
  }

  /**
   * Speak text with optional voice profile
   */
  async speak(text: string, options: MobileTTSOptions = {}): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Text-to-speech is not supported on this platform');
    }

    if (!text.trim()) {
      console.log('[MobileTTS] Empty text, skipping');
      return;
    }

    // Add to queue
    this.speechQueue.push({ text, options });

    // Process queue if not already processing
    if (!this.isProcessingQueue) {
      await this.processQueue();
    }
  }

  /**
   * Process speech queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.speechQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.speechQueue.length > 0) {
      const item = this.speechQueue.shift();
      if (item) {
        await this.speakImmediate(item.text, item.options);
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Speak text immediately (internal)
   */
  private speakImmediate(text: string, options: MobileTTSOptions = {}): Promise<void> {
    return new Promise((resolve) => {
      // Get merged voice settings
      const voice = mergeVoiceWithDefaults(options.voiceProfile, options.segmentVoice);

      // Map voice profile to speech options - always use English
      const speechOptions: Speech.SpeechOptions = {
        language: 'en-US',
        pitch: mapPitchToValue(voice.pitch),
        rate: mapPaceToRate(voice.pace),
        volume: mapVolumeToValue(voice.volume),
        onStart: () => {
          console.log('[MobileTTS] Started speaking');
          this.updateState({
            isSpeaking: true,
            currentText: text,
          });
          options.onStart?.();
        },
        onDone: () => {
          console.log('[MobileTTS] Finished speaking');
          this.updateState({
            isSpeaking: false,
            currentText: '',
          });
          options.onDone?.();
          resolve();
        },
        onStopped: () => {
          console.log('[MobileTTS] Stopped');
          this.updateState({
            isSpeaking: false,
            currentText: '',
          });
          options.onStopped?.();
          resolve();
        },
        onError: (error) => {
          console.error('[MobileTTS] Error:', error);
          this.updateState({
            isSpeaking: false,
            currentText: '',
          });
          options.onError?.(new Error(String(error)));
          resolve();
        },
      };

      Speech.speak(text, speechOptions);
    });
  }

  /**
   * Stop speaking
   */
  stop(): void {
    // Clear queue
    this.speechQueue = [];
    this.isProcessingQueue = false;

    Speech.stop();

    this.updateState({
      isSpeaking: false,
      currentText: '',
    });

    console.log('[MobileTTS] Stopped');
  }

  /**
   * Pause speaking (iOS only)
   */
  async pause(): Promise<void> {
    if (Platform.OS === 'ios') {
      try {
        await Speech.pause();
        console.log('[MobileTTS] Paused');
      } catch (error) {
        console.error('[MobileTTS] Error pausing:', error);
      }
    } else {
      console.warn('[MobileTTS] Pause is only supported on iOS');
    }
  }

  /**
   * Resume speaking (iOS only)
   */
  async resume(): Promise<void> {
    if (Platform.OS === 'ios') {
      try {
        await Speech.resume();
        console.log('[MobileTTS] Resumed');
      } catch (error) {
        console.error('[MobileTTS] Error resuming:', error);
      }
    } else {
      console.warn('[MobileTTS] Resume is only supported on iOS');
    }
  }
}

// Singleton instance
let mobileTTSInstance: MobileTextToSpeech | null = null;

/**
 * Get singleton mobile TTS instance
 */
export function getMobileTextToSpeech(): MobileTextToSpeech {
  if (!mobileTTSInstance) {
    mobileTTSInstance = new MobileTextToSpeech();
  }
  return mobileTTSInstance;
}
