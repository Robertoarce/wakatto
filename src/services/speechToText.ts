/**
 * Speech-to-Text Service
 *
 * Uses the native Web Speech API (built into browsers)
 * - Chrome, Edge, Safari: Works with network (sends to Google/Apple)
 * - Brave: Blocked by default for privacy (can enable in settings)
 * - Firefox: Limited support
 */

export type STTMethod = 'web-speech';

export interface TranscriptionResult {
  text: string;
  confidence?: number;
  method: STTMethod;
}

/**
 * Transcribe audio using Web Speech API (native browser API)
 */
export async function transcribeWithWebSpeech(audioBlob: Blob): Promise<TranscriptionResult> {
  return new Promise((resolve, reject) => {
    // Check if Web Speech API is supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      reject(new Error('Web Speech API is not supported in this browser. Try Chrome or Edge.'));
      return;
    }

    console.log('[WebSpeech] Starting transcription...');

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.lang = 'en-US'; // TODO: Make this configurable

      // Convert blob to audio and play through recognition
      const audioURL = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioURL);

      recognition.onresult = (event: any) => {
        const result = event.results[0][0];
        const text = result.transcript;
        const confidence = result.confidence;

        console.log('[WebSpeech] Transcription successful:', { text, confidence });

        URL.revokeObjectURL(audioURL);

        resolve({
          text,
          confidence,
          method: 'web-speech',
        });
      };

      recognition.onerror = (event: any) => {
        console.error('[WebSpeech] Error:', event.error);
        URL.revokeObjectURL(audioURL);

        let errorMessage = 'Speech recognition failed';
        if (event.error === 'no-speech') {
          errorMessage = 'No speech detected. Please try again and speak clearly.';
        } else if (event.error === 'audio-capture') {
          errorMessage = 'Microphone error. Please check your microphone connection.';
        } else if (event.error === 'not-allowed') {
          errorMessage = 'Microphone access denied. Please allow microphone access.';
        } else if (event.error === 'network') {
          errorMessage = 'Speech recognition blocked. In Brave, go to Settings > Privacy > Enable "Use Google services for push messaging", or use Chrome/Edge.';
        }

        reject(new Error(errorMessage));
      };

      recognition.onend = () => {
        console.log('[WebSpeech] Recognition ended');
      };

      // Play audio to trigger recognition
      audio.play();
      recognition.start();

      // Stop recognition when audio ends
      audio.onended = () => {
        setTimeout(() => {
          recognition.stop();
        }, 500);
      };

    } catch (error: any) {
      console.error('[WebSpeech] Setup error:', error);
      reject(new Error(`Failed to initialize speech recognition: ${error.message}`));
    }
  });
}

/**
 * Transcribe audio (uses native Web Speech API)
 */
export async function transcribeAudio(
  audioBlob: Blob,
  method: STTMethod = 'web-speech',
  enableFallback: boolean = true
): Promise<TranscriptionResult> {
  console.log(`[SpeechToText] Transcribing with native Web Speech API...`);
  return await transcribeWithWebSpeech(audioBlob);
}

/**
 * Check if Web Speech API is supported
 */
export function isWebSpeechSupported(): boolean {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  return !!SpeechRecognition;
}

/**
 * Get recommended STT method (only Web Speech available)
 */
export async function getRecommendedSTTMethod(): Promise<STTMethod> {
  if (!isWebSpeechSupported()) {
    throw new Error('Web Speech API not supported. Please use Chrome, Edge, or Safari.');
  }
  return 'web-speech';
}
