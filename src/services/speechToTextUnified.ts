/**
 * Unified Speech-to-Text Service
 *
 * Platform-agnostic wrapper that automatically uses:
 * - Web: Web Speech API (native browser API)
 * - Mobile: Backend transcription via Supabase Edge Function (Whisper API)
 */

import { Platform } from 'react-native';
import { supabase, supabaseUrl } from '../lib/supabase';

export type STTMethod = 'web-speech' | 'backend-whisper';

export interface TranscriptionResult {
  text: string;
  confidence?: number;
  method: STTMethod;
}

/**
 * Check if we're on a mobile platform
 */
export function isMobilePlatform(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

/**
 * Check if Web Speech API is supported (web only)
 */
export function isWebSpeechSupported(): boolean {
  if (Platform.OS !== 'web') return false;

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  return !!SpeechRecognition;
}

/**
 * Transcribe audio using Web Speech API (web only)
 */
async function transcribeWithWebSpeech(audioBlob: Blob): Promise<TranscriptionResult> {
  return new Promise((resolve, reject) => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      reject(new Error('Web Speech API is not supported in this browser.'));
      return;
    }

    console.log('[WebSpeech] Starting transcription...');

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.lang = 'en-US';

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
          errorMessage = 'Speech recognition requires internet connection.';
        }

        reject(new Error(errorMessage));
      };

      recognition.onend = () => {
        console.log('[WebSpeech] Recognition ended');
      };

      audio.play();
      recognition.start();

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
 * Transcribe audio using backend Whisper API (mobile)
 * Sends the audio file to Supabase Edge Function for transcription
 */
async function transcribeWithBackend(audioUri: string): Promise<TranscriptionResult> {
  console.log('[BackendSTT] Starting transcription via backend...');

  try {
    // Get auth session
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (!session) {
      throw new Error('User not authenticated');
    }

    // Read the audio file and convert to base64
    const response = await fetch(audioUri);
    const blob = await response.blob();

    // Convert blob to base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    // Send to Edge Function for transcription
    const transcribeResponse = await fetch(`${supabaseUrl}/functions/v1/transcribe-audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        audio: base64,
        mimeType: blob.type || 'audio/m4a',
      }),
    });

    if (!transcribeResponse.ok) {
      const error = await transcribeResponse.json();
      throw new Error(error.error || 'Transcription failed');
    }

    const data = await transcribeResponse.json();
    console.log('[BackendSTT] Transcription successful:', data.text);

    return {
      text: data.text,
      confidence: data.confidence,
      method: 'backend-whisper',
    };
  } catch (error: any) {
    console.error('[BackendSTT] Error:', error);
    throw new Error(`Transcription failed: ${error.message}`);
  }
}

/**
 * Transcribe audio using the appropriate method for the platform
 *
 * @param audioInput - Blob (web) or URI string (mobile)
 */
export async function transcribeAudio(
  audioInput: Blob | string
): Promise<TranscriptionResult> {
  if (Platform.OS === 'web') {
    // Web: Use Web Speech API
    if (typeof audioInput === 'string') {
      // Convert URI to Blob if needed
      const response = await fetch(audioInput);
      const blob = await response.blob();
      return transcribeWithWebSpeech(blob);
    }
    return transcribeWithWebSpeech(audioInput);
  } else {
    // Mobile: Use backend transcription
    if (typeof audioInput !== 'string') {
      throw new Error('Mobile transcription requires a URI string');
    }
    return transcribeWithBackend(audioInput);
  }
}

/**
 * Get recommended STT method for current platform
 */
export function getRecommendedSTTMethod(): STTMethod {
  if (Platform.OS === 'web' && isWebSpeechSupported()) {
    return 'web-speech';
  }
  return 'backend-whisper';
}

/**
 * Check if speech-to-text is available on current platform
 */
export function isSpeechToTextAvailable(): boolean {
  if (Platform.OS === 'web') {
    return isWebSpeechSupported();
  }
  // Mobile always has backend transcription available (if authenticated)
  return true;
}
