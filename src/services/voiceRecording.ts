/**
 * Voice Recording Service
 *
 * Handles audio recording from microphone using MediaRecorder API (Web)
 * and expo-av (React Native mobile)
 */

export interface RecordingState {
  isRecording: boolean;
  duration: number; // in seconds
  audioBlob?: Blob;
  audioURL?: string;
}

export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private startTime: number = 0;
  private durationInterval: NodeJS.Timeout | null = null;
  private onStateChange?: (state: RecordingState) => void;
  private currentState: RecordingState = {
    isRecording: false,
    duration: 0,
  };

  /**
   * Set callback for state changes
   */
  setOnStateChange(callback: (state: RecordingState) => void) {
    this.onStateChange = callback;
  }

  /**
   * Get current state
   */
  getState(): RecordingState {
    return { ...this.currentState };
  }

  /**
   * Update state and notify listeners
   */
  private updateState(newState: Partial<RecordingState>) {
    this.currentState = { ...this.currentState, ...newState };
    if (this.onStateChange) {
      this.onStateChange(this.currentState);
    }
  }

  /**
   * Check if browser supports audio recording
   */
  isSupported(): boolean {
    return !!(typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia && typeof MediaRecorder !== 'undefined');
  }

  /**
   * Request microphone permission and start recording
   */
  async startRecording(): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Audio recording is not supported in this browser');
    }

    if (this.mediaRecorder && this.currentState.isRecording) {
      throw new Error('Already recording');
    }

    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: this.getSupportedMimeType(),
      });

      this.audioChunks = [];

      // Handle data available
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Handle recording stop
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const audioURL = URL.createObjectURL(audioBlob);

        this.updateState({
          isRecording: false,
          audioBlob,
          audioURL,
        });

        // Clean up
        this.cleanup();
      };

      // Start recording
      this.mediaRecorder.start(100); // Collect data every 100ms
      this.startTime = Date.now();

      // Start duration timer
      this.durationInterval = setInterval(() => {
        const duration = Math.floor((Date.now() - this.startTime) / 1000);
        this.updateState({ duration });
      }, 100);

      this.updateState({
        isRecording: true,
        duration: 0,
        audioBlob: undefined,
        audioURL: undefined,
      });

      console.log('[VoiceRecorder] Recording started');
    } catch (error: any) {
      console.error('[VoiceRecorder] Error starting recording:', error);
      this.cleanup();

      if (error.name === 'NotAllowedError') {
        throw new Error('Microphone access denied. Please allow microphone access in your browser settings.');
      } else if (error.name === 'NotFoundError') {
        throw new Error('No microphone found. Please connect a microphone and try again.');
      } else {
        throw new Error(`Failed to start recording: ${error.message}`);
      }
    }
  }

  /**
   * Stop recording
   */
  stopRecording(): void {
    if (this.mediaRecorder && this.currentState.isRecording) {
      this.mediaRecorder.stop();
      console.log('[VoiceRecorder] Recording stopped');
    }
  }

  /**
   * Cancel recording (stop without saving)
   */
  cancelRecording(): void {
    if (this.mediaRecorder && this.currentState.isRecording) {
      this.mediaRecorder.stop();
      this.audioChunks = [];
      this.updateState({
        isRecording: false,
        duration: 0,
        audioBlob: undefined,
        audioURL: undefined,
      });
      this.cleanup();
      console.log('[VoiceRecorder] Recording cancelled');
    }
  }

  /**
   * Get supported MIME type
   */
  private getSupportedMimeType(): string {
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4',
    ];

    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    }

    return 'audio/webm'; // Fallback
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  /**
   * Release all resources
   */
  dispose(): void {
    this.cancelRecording();
    this.cleanup();
    if (this.currentState.audioURL) {
      URL.revokeObjectURL(this.currentState.audioURL);
    }
  }
}

// Singleton instance
let voiceRecorderInstance: VoiceRecorder | null = null;

/**
 * Get singleton voice recorder instance
 */
export function getVoiceRecorder(): VoiceRecorder {
  if (!voiceRecorderInstance) {
    voiceRecorderInstance = new VoiceRecorder();
  }
  return voiceRecorderInstance;
}
