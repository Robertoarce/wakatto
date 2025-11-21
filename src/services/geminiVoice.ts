import { generateAIResponse } from './aiService';
import { transcribeAudio } from './speechToText';

/**
 * Service to handle "Gemini Live" style voice interactions.
 * Uses Gemini 1.5 Flash for high-speed responses.
 */

export interface VoiceResponse {
    text: string;
    audioUrl?: string; // Placeholder for future TTS
}

export async function processVoiceInput(audioBlob: Blob, history: any[]): Promise<VoiceResponse> {
    try {
        // 1. Transcribe audio (fastest method)
        const transcription = await transcribeAudio(audioBlob, 'web-speech', true);

        if (!transcription.text.trim()) {
            throw new Error('No speech detected');
        }

        // 2. Generate fast response using Gemini Flash
        // We force the provider to be gemini and model to be flash for speed
        const responseText = await generateAIResponse(
            [...history, { role: 'user', content: transcription.text }],
            undefined // System prompt should be handled by the caller or embedded in history
        );

        return {
            text: responseText,
        };
    } catch (error) {
        console.error('Gemini Live processing error:', error);
        throw error;
    }
}
