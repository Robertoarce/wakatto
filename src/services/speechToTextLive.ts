/**
 * Live Speech-to-Text Service (Real-time)
 *
 * Uses Web Speech API for real-time transcription during recording.
 * This is different from transcribing recorded audio files.
 */

export interface LiveTranscriptionResult {
  transcript: string;
  isFinal: boolean;
  confidence?: number;
}

export class LiveSpeechRecognition {
  private recognition: any = null;
  private onResult?: (result: LiveTranscriptionResult) => void;
  private onError?: (error: Error) => void;
  private onEnd?: () => void;
  private isActive: boolean = false;
  private finalTranscript: string = '';
  private interimTranscript: string = '';

  constructor() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true; // Keep recognizing
      this.recognition.interimResults = true; // Get interim results
      this.recognition.maxAlternatives = 1;
      this.recognition.lang = 'en-US'; // TODO: Make configurable

      this.setupHandlers();
    }
  }

  private setupHandlers() {
    if (!this.recognition) return;

    this.recognition.onresult = (event: any) => {
      this.interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;

        if (event.results[i].isFinal) {
          this.finalTranscript += transcript + ' ';
          if (this.onResult) {
            this.onResult({
              transcript: this.finalTranscript.trim(),
              isFinal: true,
              confidence,
            });
          }
        } else {
          this.interimTranscript += transcript;
          if (this.onResult) {
            this.onResult({
              transcript: this.finalTranscript.trim() + ' ' + this.interimTranscript,
              isFinal: false,
            });
          }
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('[LiveSpeechRecognition] Error:', event.error);

      let errorMessage = 'Speech recognition failed';
      if (event.error === 'no-speech') {
        errorMessage = 'No speech detected';
      } else if (event.error === 'audio-capture') {
        errorMessage = 'Microphone error';
      } else if (event.error === 'not-allowed') {
        errorMessage = 'Microphone access denied';
      } else if (event.error === 'network') {
        errorMessage = 'Network error. Speech recognition requires internet connection.';
      }

      if (this.onError) {
        this.onError(new Error(errorMessage));
      }
    };

    this.recognition.onend = () => {
      console.log('[LiveSpeechRecognition] Recognition ended');
      this.isActive = false;
      if (this.onEnd) {
        this.onEnd();
      }
    };
  }

  isSupported(): boolean {
    return !!this.recognition;
  }

  setOnResult(callback: (result: LiveTranscriptionResult) => void) {
    this.onResult = callback;
  }

  setOnError(callback: (error: Error) => void) {
    this.onError = callback;
  }

  setOnEnd(callback: () => void) {
    this.onEnd = callback;
  }

  start(): void {
    if (!this.recognition) {
      throw new Error('Web Speech API is not supported in this browser');
    }

    if (this.isActive) {
      console.warn('[LiveSpeechRecognition] Already active');
      return;
    }

    this.finalTranscript = '';
    this.interimTranscript = '';
    this.isActive = true;

    try {
      this.recognition.start();
      console.log('[LiveSpeechRecognition] Started');
    } catch (error: any) {
      console.error('[LiveSpeechRecognition] Start error:', error);
      this.isActive = false;
      throw error;
    }
  }

  stop(): string {
    if (this.recognition && this.isActive) {
      this.recognition.stop();
      console.log('[LiveSpeechRecognition] Stopped');
    }

    return this.finalTranscript.trim();
  }

  abort(): void {
    if (this.recognition && this.isActive) {
      this.recognition.abort();
      this.finalTranscript = '';
      this.interimTranscript = '';
      this.isActive = false;
      console.log('[LiveSpeechRecognition] Aborted');
    }
  }

  getFinalTranscript(): string {
    return this.finalTranscript.trim();
  }

  getFullTranscript(): string {
    return (this.finalTranscript + ' ' + this.interimTranscript).trim();
  }
}
