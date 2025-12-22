/**
 * Unified Voice Recording Service
 *
 * Platform-agnostic wrapper that automatically uses:
 * - Web: MediaRecorder API (voiceRecording.ts)
 * - Mobile: expo-av (voiceRecordingMobile.ts)
 */

import { Platform } from 'react-native';
import { VoiceRecorder, RecordingState, getVoiceRecorder } from './voiceRecording';
import {
  MobileVoiceRecorder,
  MobileRecordingState,
  getMobileVoiceRecorder,
  isMobilePlatform,
} from './voiceRecordingMobile';

export interface UnifiedRecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number; // in milliseconds
  audioBlob?: Blob; // Web only
  audioUri?: string; // Mobile & web
}

/**
 * Unified Voice Recorder that works on both web and mobile
 */
export class UnifiedVoiceRecorder {
  private webRecorder: VoiceRecorder | null = null;
  private mobileRecorder: MobileVoiceRecorder | null = null;
  private isWeb: boolean;
  private onStateChange?: (state: UnifiedRecordingState) => void;
  private currentState: UnifiedRecordingState = {
    isRecording: false,
    isPaused: false,
    duration: 0,
  };

  constructor() {
    this.isWeb = Platform.OS === 'web';

    if (this.isWeb) {
      this.webRecorder = getVoiceRecorder();
      this.setupWebListener();
    } else {
      this.mobileRecorder = getMobileVoiceRecorder();
      this.setupMobileListener();
    }
  }

  /**
   * Setup web recorder state listener
   */
  private setupWebListener(): void {
    if (this.webRecorder) {
      this.webRecorder.setOnStateChange((state: RecordingState) => {
        this.updateState({
          isRecording: state.isRecording,
          isPaused: state.isPaused,
          duration: state.duration * 1000, // Convert to ms
          audioBlob: state.audioBlob,
          audioUri: state.audioURL,
        });
      });
    }
  }

  /**
   * Setup mobile recorder state listener
   */
  private setupMobileListener(): void {
    if (this.mobileRecorder) {
      this.mobileRecorder.setOnStateChange((state: MobileRecordingState) => {
        this.updateState({
          isRecording: state.isRecording,
          isPaused: state.isPaused,
          duration: state.duration,
          audioUri: state.audioUri,
        });
      });
    }
  }

  /**
   * Set callback for state changes
   */
  setOnStateChange(callback: (state: UnifiedRecordingState) => void): void {
    this.onStateChange = callback;
  }

  /**
   * Get current state
   */
  getState(): UnifiedRecordingState {
    return { ...this.currentState };
  }

  /**
   * Update state and notify listeners
   */
  private updateState(newState: Partial<UnifiedRecordingState>): void {
    this.currentState = { ...this.currentState, ...newState };
    if (this.onStateChange) {
      this.onStateChange(this.currentState);
    }
  }

  /**
   * Check if recording is supported on current platform
   */
  isSupported(): boolean {
    if (this.isWeb && this.webRecorder) {
      return this.webRecorder.isSupported();
    }
    if (!this.isWeb && this.mobileRecorder) {
      return this.mobileRecorder.isSupported();
    }
    return false;
  }

  /**
   * Start recording
   */
  async startRecording(): Promise<void> {
    if (this.isWeb && this.webRecorder) {
      await this.webRecorder.startRecording();
    } else if (this.mobileRecorder) {
      await this.mobileRecorder.startRecording();
    } else {
      throw new Error('No recorder available');
    }
  }

  /**
   * Stop recording and return result
   * Returns Blob on web, URI string on mobile
   */
  async stopRecording(): Promise<{ blob?: Blob; uri?: string }> {
    if (this.isWeb && this.webRecorder) {
      const blob = await this.webRecorder.stopRecording();
      const uri = blob ? URL.createObjectURL(blob) : undefined;
      return { blob, uri };
    } else if (this.mobileRecorder) {
      const uri = await this.mobileRecorder.stopRecording();
      return { uri };
    }
    return {};
  }

  /**
   * Pause recording
   */
  async pauseRecording(): Promise<void> {
    if (this.isWeb && this.webRecorder) {
      this.webRecorder.pauseRecording();
    } else if (this.mobileRecorder) {
      await this.mobileRecorder.pauseRecording();
    }
  }

  /**
   * Resume recording
   */
  async resumeRecording(): Promise<void> {
    if (this.isWeb && this.webRecorder) {
      this.webRecorder.resumeRecording();
    } else if (this.mobileRecorder) {
      await this.mobileRecorder.resumeRecording();
    }
  }

  /**
   * Cancel recording
   */
  async cancelRecording(): Promise<void> {
    if (this.isWeb && this.webRecorder) {
      this.webRecorder.cancelRecording();
    } else if (this.mobileRecorder) {
      await this.mobileRecorder.cancelRecording();
    }
  }

  /**
   * Release all resources
   */
  async dispose(): Promise<void> {
    if (this.isWeb && this.webRecorder) {
      this.webRecorder.dispose();
    } else if (this.mobileRecorder) {
      await this.mobileRecorder.dispose();
    }
  }

  /**
   * Get platform type
   */
  getPlatform(): 'web' | 'mobile' {
    return this.isWeb ? 'web' : 'mobile';
  }
}

// Singleton instance
let unifiedRecorderInstance: UnifiedVoiceRecorder | null = null;

/**
 * Get singleton unified voice recorder instance
 */
export function getUnifiedVoiceRecorder(): UnifiedVoiceRecorder {
  if (!unifiedRecorderInstance) {
    unifiedRecorderInstance = new UnifiedVoiceRecorder();
  }
  return unifiedRecorderInstance;
}

/**
 * Check if running on web platform
 */
export function isWebPlatform(): boolean {
  return Platform.OS === 'web';
}
