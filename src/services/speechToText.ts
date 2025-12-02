/**
 * Speech-to-Text Service
 *
 * Supports two methods:
 * 1. Web Speech API (free, browser-based, good accuracy)
 * 2. OpenAI Whisper API (best accuracy, costs $0.006/minute)
 */

import { getSecureItem } from './secureStorage';

export type STTMethod = 'web-speech' | 'whisper';

export interface TranscriptionResult {
  text: string;
  confidence?: number;
  method: STTMethod;
}

/**
 * Transcribe audio using Web Speech API (browser-based, free)
 */
export async function transcribeWithWebSpeech(audioBlob: Blob): Promise<TranscriptionResult> {
  return new Promise((resolve, reject) => {
    // Check if Web Speech API is supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      reject(new Error('Web Speech API is not supported in this browser. Try Chrome or Edge, or use Whisper API instead.'));
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
          errorMessage = 'Network error. Web Speech API requires internet connection.';
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
 * Transcribe audio using OpenAI Whisper API (costs money, best accuracy)
 */
export async function transcribeWithWhisper(audioBlob: Blob): Promise<TranscriptionResult> {
  console.log('[Whisper] Starting transcription...', {
    size: audioBlob.size,
    type: audioBlob.type,
  });

  // Get API key from secure storage
  const apiKey = await getSecureItem('ai_api_key');

  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Please add your API key in Settings.');
  }

  try {
    // Create FormData with audio file
    const formData = new FormData();

    // Convert webm to a format Whisper accepts (webm, mp4, mp3, wav, etc.)
    const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
    formData.append('file', audioFile);
    formData.append('model', 'whisper-1');
    formData.append('language', 'en'); // TODO: Make this configurable
    formData.append('response_format', 'json');

    console.log('[Whisper] Sending request to OpenAI...');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Whisper] API error:', errorText);

      let error;
      try {
        error = JSON.parse(errorText);
      } catch (e) {
        throw new Error(`Whisper API error (${response.status}): ${errorText}`);
      }

      throw new Error(`Whisper API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('[Whisper] Transcription successful:', data);

    return {
      text: data.text,
      method: 'whisper',
    };

  } catch (error: any) {
    console.error('[Whisper] Error:', error);
    throw error;
  }
}

/**
 * Transcribe audio using the specified method
 * Falls back to Web Speech if Whisper fails
 */
export async function transcribeAudio(
  audioBlob: Blob,
  method: STTMethod = 'web-speech',
  fallbackToWebSpeech: boolean = true
): Promise<TranscriptionResult> {
  console.log(`[SpeechToText] Transcribing with method: ${method}`);

  try {
    if (method === 'whisper') {
      return await transcribeWithWhisper(audioBlob);
    } else {
      return await transcribeWithWebSpeech(audioBlob);
    }
  } catch (error: any) {
    console.error(`[SpeechToText] ${method} failed:`, error);

    // Fallback to Web Speech if Whisper fails and fallback is enabled
    if (method === 'whisper' && fallbackToWebSpeech) {
      console.log('[SpeechToText] Falling back to Web Speech API...');
      try {
        return await transcribeWithWebSpeech(audioBlob);
      } catch (fallbackError: any) {
        throw new Error(`Both Whisper and Web Speech failed. Last error: ${fallbackError.message}`);
      }
    }

    throw error;
  }
}

/**
 * Check if Web Speech API is supported
 */
export function isWebSpeechSupported(): boolean {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  return !!SpeechRecognition;
}

/**
 * Get recommended STT method based on availability
 */
export async function getRecommendedSTTMethod(): Promise<STTMethod> {
  const apiKey = await getSecureItem('ai_api_key');
  const hasWhisperAccess = !!apiKey;
  const hasWebSpeech = isWebSpeechSupported();

  // Prefer Web Speech (free) if available
  if (hasWebSpeech) {
    return 'web-speech';
  }

  // Fall back to Whisper if API key is configured
  if (hasWhisperAccess) {
    return 'whisper';
  }

  throw new Error('No speech-to-text method available. Please use Chrome/Edge browser or add OpenAI API key.');
}
