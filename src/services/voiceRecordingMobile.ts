/**
 * Mobile Voice Recording Service using expo-av
 *
 * Handles audio recording on iOS/Android using Expo's Audio API.
 * This is the mobile counterpart to voiceRecording.ts (web).
 */

import { Audio } from 'expo-av';
import { Platform } from 'react-native';

export interface MobileRecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number; // in milliseconds
  audioUri?: string;
  mimeType?: string;
}

// Recording preset optimized for speech
const RECORDING_OPTIONS: Audio.RecordingOptions = {
  isMeteringEnabled: true,
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: '.m4a',
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};

export class MobileVoiceRecorder {
  private recording: Audio.Recording | null = null;
  private sound: Audio.Sound | null = null;
  private durationInterval: NodeJS.Timeout | null = null;
  private startTime: number = 0;
  private onStateChange?: (state: MobileRecordingState) => void;
  private currentState: MobileRecordingState = {
    isRecording: false,
    isPaused: false,
    duration: 0,
  };

  /**
   * Set callback for state changes
   */
  setOnStateChange(callback: (state: MobileRecordingState) => void) {
    this.onStateChange = callback;
  }

  /**
   * Get current state
   */
  getState(): MobileRecordingState {
    return { ...this.currentState };
  }

  /**
   * Update state and notify listeners
   */
  private updateState(newState: Partial<MobileRecordingState>) {
    this.currentState = { ...this.currentState, ...newState };
    if (this.onStateChange) {
      this.onStateChange(this.currentState);
    }
  }

  /**
   * Check if platform supports audio recording
   */
  isSupported(): boolean {
    // expo-av supports iOS, Android, and web
    return Platform.OS === 'ios' || Platform.OS === 'android' || Platform.OS === 'web';
  }

  /**
   * Request microphone permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('[MobileVoiceRecorder] Permission request error:', error);
      return false;
    }
  }

  /**
   * Start recording
   */
  async startRecording(): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Audio recording is not supported on this platform');
    }

    if (this.currentState.isRecording) {
      throw new Error('Already recording');
    }

    try {
      // Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Microphone permission denied. Please allow microphone access in your device settings.');
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Create and prepare recording
      const { recording } = await Audio.Recording.createAsync(RECORDING_OPTIONS);
      this.recording = recording;
      this.startTime = Date.now();

      // Start duration timer
      this.durationInterval = setInterval(() => {
        const duration = Date.now() - this.startTime;
        this.updateState({ duration });
      }, 100);

      this.updateState({
        isRecording: true,
        isPaused: false,
        duration: 0,
        audioUri: undefined,
      });

      console.log('[MobileVoiceRecorder] Recording started');
    } catch (error: any) {
      console.error('[MobileVoiceRecorder] Error starting recording:', error);
      this.cleanup();
      throw new Error(`Failed to start recording: ${error.message}`);
    }
  }

  /**
   * Stop recording and return audio file URI
   */
  async stopRecording(): Promise<string | undefined> {
    if (!this.recording || !this.currentState.isRecording) {
      console.log('[MobileVoiceRecorder] Not recording, nothing to stop');
      return undefined;
    }

    try {
      await this.recording.stopAndUnloadAsync();

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
      });

      const uri = this.recording.getURI();
      const status = await this.recording.getStatusAsync();

      this.updateState({
        isRecording: false,
        isPaused: false,
        audioUri: uri || undefined,
        mimeType: Platform.OS === 'ios' ? 'audio/m4a' : 'audio/mp4',
      });

      this.cleanup();

      console.log('[MobileVoiceRecorder] Recording stopped, URI:', uri);
      return uri || undefined;
    } catch (error: any) {
      console.error('[MobileVoiceRecorder] Error stopping recording:', error);
      this.cleanup();
      throw new Error(`Failed to stop recording: ${error.message}`);
    }
  }

  /**
   * Pause recording
   */
  async pauseRecording(): Promise<void> {
    if (!this.recording || !this.currentState.isRecording || this.currentState.isPaused) {
      return;
    }

    try {
      await this.recording.pauseAsync();

      if (this.durationInterval) {
        clearInterval(this.durationInterval);
        this.durationInterval = null;
      }

      this.updateState({ isPaused: true });
      console.log('[MobileVoiceRecorder] Recording paused');
    } catch (error: any) {
      console.error('[MobileVoiceRecorder] Error pausing recording:', error);
    }
  }

  /**
   * Resume recording
   */
  async resumeRecording(): Promise<void> {
    if (!this.recording || !this.currentState.isRecording || !this.currentState.isPaused) {
      return;
    }

    try {
      await this.recording.startAsync();

      // Resume duration timer
      const pausedDuration = this.currentState.duration;
      this.startTime = Date.now() - pausedDuration;
      this.durationInterval = setInterval(() => {
        const duration = Date.now() - this.startTime;
        this.updateState({ duration });
      }, 100);

      this.updateState({ isPaused: false });
      console.log('[MobileVoiceRecorder] Recording resumed');
    } catch (error: any) {
      console.error('[MobileVoiceRecorder] Error resuming recording:', error);
    }
  }

  /**
   * Cancel recording (stop without saving)
   */
  async cancelRecording(): Promise<void> {
    if (!this.recording || !this.currentState.isRecording) {
      return;
    }

    try {
      await this.recording.stopAndUnloadAsync();

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
      });
    } catch (error) {
      console.error('[MobileVoiceRecorder] Error cancelling recording:', error);
    }

    this.updateState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioUri: undefined,
    });

    this.cleanup();
    console.log('[MobileVoiceRecorder] Recording cancelled');
  }

  /**
   * Play recorded audio
   */
  async playRecording(): Promise<void> {
    if (!this.currentState.audioUri) {
      throw new Error('No recording to play');
    }

    try {
      // Unload previous sound if exists
      if (this.sound) {
        await this.sound.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: this.currentState.audioUri },
        { shouldPlay: true }
      );

      this.sound = sound;
      console.log('[MobileVoiceRecorder] Playing recording');
    } catch (error: any) {
      console.error('[MobileVoiceRecorder] Error playing recording:', error);
      throw new Error(`Failed to play recording: ${error.message}`);
    }
  }

  /**
   * Stop playback
   */
  async stopPlayback(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.stopAsync();
        console.log('[MobileVoiceRecorder] Playback stopped');
      } catch (error) {
        console.error('[MobileVoiceRecorder] Error stopping playback:', error);
      }
    }
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }

    this.recording = null;
  }

  /**
   * Release all resources
   */
  async dispose(): Promise<void> {
    await this.cancelRecording();

    if (this.sound) {
      try {
        await this.sound.unloadAsync();
      } catch (error) {
        console.error('[MobileVoiceRecorder] Error disposing sound:', error);
      }
      this.sound = null;
    }

    this.cleanup();
  }
}

// Singleton instance
let mobileVoiceRecorderInstance: MobileVoiceRecorder | null = null;

/**
 * Get singleton mobile voice recorder instance
 */
export function getMobileVoiceRecorder(): MobileVoiceRecorder {
  if (!mobileVoiceRecorderInstance) {
    mobileVoiceRecorderInstance = new MobileVoiceRecorder();
  }
  return mobileVoiceRecorderInstance;
}

/**
 * Check if we're running on mobile (iOS/Android)
 */
export function isMobilePlatform(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}
