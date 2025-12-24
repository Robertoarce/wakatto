/**
 * Cloud Text-to-Speech Service
 *
 * Uses Google Cloud TTS via Supabase Edge Function
 * Provides high-quality neural voices for all platforms
 */

import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import { supabase, supabaseUrl } from '../lib/supabase';

export interface CloudTTSOptions {
  characterId?: string;
  voice?: string;
  languageCode?: string;
  speakingRate?: number;
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

export interface CloudTTSState {
  isSpeaking: boolean;
  isLoading: boolean;
  currentText: string;
}

/**
 * Cloud-based Text-to-Speech using Google Cloud TTS
 */
export class CloudTextToSpeech {
  private sound: Audio.Sound | null = null;
  private webAudio: HTMLAudioElement | null = null;
  private currentState: CloudTTSState = {
    isSpeaking: false,
    isLoading: false,
    currentText: '',
  };
  private onStateChange?: (state: CloudTTSState) => void;

  constructor() {
    // Initialize audio mode for mobile
    if (Platform.OS !== 'web') {
      this.initMobileAudio();
    }
  }

  /**
   * Initialize mobile audio settings
   */
  private async initMobileAudio(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
    } catch (error) {
      console.error('[CloudTTS] Failed to init audio mode:', error);
    }
  }

  /**
   * Set callback for state changes
   */
  setOnStateChange(callback: (state: CloudTTSState) => void): void {
    this.onStateChange = callback;
  }

  /**
   * Update state and notify listeners
   */
  private updateState(newState: Partial<CloudTTSState>): void {
    this.currentState = { ...this.currentState, ...newState };
    if (this.onStateChange) {
      this.onStateChange(this.currentState);
    }
  }

  /**
   * Get current state
   */
  getState(): CloudTTSState {
    return { ...this.currentState };
  }

  /**
   * Check if cloud TTS is available (requires authentication)
   */
  async isAvailable(): Promise<boolean> {
    const { data } = await supabase.auth.getSession();
    return !!data?.session;
  }

  /**
   * Speak text using Google Cloud TTS
   */
  async speak(text: string, options: CloudTTSOptions = {}): Promise<void> {
    if (!text || text.trim().length === 0) {
      return;
    }

    // Stop any current playback
    await this.stop();

    this.updateState({ isLoading: true, currentText: text });

    try {
      // Get auth session
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;

      if (!session) {
        throw new Error('User not authenticated');
      }

      // Call edge function to synthesize speech
      const response = await fetch(`${supabaseUrl}/functions/v1/text-to-speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          text,
          characterId: options.characterId,
          voice: options.voice,
          languageCode: options.languageCode || 'en-US',
          speakingRate: options.speakingRate || 1.0,
          pitch: options.pitch || 0.0,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'TTS synthesis failed');
      }

      const data = await response.json();

      if (!data.audioContent) {
        throw new Error('No audio content returned');
      }

      // Play the audio
      await this.playAudio(data.audioContent, options);
    } catch (error: any) {
      console.error('[CloudTTS] Error:', error);
      this.updateState({ isLoading: false, isSpeaking: false });
      options.onError?.(error);
      throw error;
    }
  }

  /**
   * Play base64-encoded audio
   */
  private async playAudio(base64Audio: string, options: CloudTTSOptions): Promise<void> {
    if (Platform.OS === 'web') {
      await this.playWebAudio(base64Audio, options);
    } else {
      await this.playMobileAudio(base64Audio, options);
    }
  }

  /**
   * Play audio on web using HTML5 Audio
   */
  private async playWebAudio(base64Audio: string, options: CloudTTSOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Create audio element from base64
        const audioData = `data:audio/mp3;base64,${base64Audio}`;
        this.webAudio = new Audio(audioData);

        this.webAudio.onplay = () => {
          this.updateState({ isLoading: false, isSpeaking: true });
          options.onStart?.();
        };

        this.webAudio.onended = () => {
          this.updateState({ isSpeaking: false, currentText: '' });
          options.onEnd?.();
          resolve();
        };

        this.webAudio.onerror = (e) => {
          const error = new Error('Audio playback failed');
          this.updateState({ isLoading: false, isSpeaking: false });
          options.onError?.(error);
          reject(error);
        };

        this.webAudio.play().catch(reject);
      } catch (error: any) {
        reject(error);
      }
    });
  }

  /**
   * Play audio on mobile using expo-av
   */
  private async playMobileAudio(base64Audio: string, options: CloudTTSOptions): Promise<void> {
    try {
      // Unload previous sound if exists
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }

      // Create sound from base64
      const { sound } = await Audio.Sound.createAsync(
        { uri: `data:audio/mp3;base64,${base64Audio}` },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            if (status.isPlaying && !this.currentState.isSpeaking) {
              this.updateState({ isLoading: false, isSpeaking: true });
              options.onStart?.();
            }
            if (status.didJustFinish) {
              this.updateState({ isSpeaking: false, currentText: '' });
              options.onEnd?.();
            }
          }
        }
      );

      this.sound = sound;
    } catch (error: any) {
      console.error('[CloudTTS] Mobile playback error:', error);
      this.updateState({ isLoading: false, isSpeaking: false });
      options.onError?.(error);
      throw error;
    }
  }

  /**
   * Stop current playback
   */
  async stop(): Promise<void> {
    if (Platform.OS === 'web') {
      if (this.webAudio) {
        this.webAudio.pause();
        this.webAudio.currentTime = 0;
        this.webAudio = null;
      }
    } else {
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }
    }

    this.updateState({ isSpeaking: false, isLoading: false, currentText: '' });
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return this.currentState.isSpeaking;
  }

  /**
   * Check if loading
   */
  isLoading(): boolean {
    return this.currentState.isLoading;
  }

  /**
   * Dispose resources
   */
  async dispose(): Promise<void> {
    await this.stop();
  }
}

// Singleton instance
let cloudTTSInstance: CloudTextToSpeech | null = null;

/**
 * Get singleton cloud TTS instance
 */
export function getCloudTextToSpeech(): CloudTextToSpeech {
  if (!cloudTTSInstance) {
    cloudTTSInstance = new CloudTextToSpeech();
  }
  return cloudTTSInstance;
}

/**
 * Check if cloud TTS is available
 */
export async function isCloudTTSAvailable(): Promise<boolean> {
  const tts = getCloudTextToSpeech();
  return tts.isAvailable();
}
