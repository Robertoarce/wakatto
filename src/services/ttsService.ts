/**
 * Text-to-Speech Service
 * 
 * Handles converting text to speech using the browser's SpeechSynthesis API.
 * Supports different voices and pitch/rate adjustments for different characters.
 */

// Add global type definition for Web Speech API if not present in the environment
declare global {
    interface Window {
        speechSynthesis: SpeechSynthesis;
    }
}

interface TTSConfig {
    pitch: number;
    rate: number;
    voiceName?: string;
    lang?: string;
}

// Character voice presets
export const CHARACTER_VOICES: Record<string, TTSConfig> = {
    // Freud: Lower pitch, slower, authoritative
    'freud': { pitch: 0.8, rate: 0.9, lang: 'en-US' },

    // Jung: Soft, mystical
    'jung': { pitch: 1.0, rate: 0.95, lang: 'en-US' },

    // Adler: Energetic, direct
    'adler': { pitch: 1.1, rate: 1.1, lang: 'en-US' },

    // Default
    'default': { pitch: 1.0, rate: 1.0, lang: 'en-US' }
};

class TTSService {
    private synth: SpeechSynthesis | null = null;
    private voices: SpeechSynthesisVoice[] = [];
    private initialized: boolean = false;

    constructor() {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            this.synth = window.speechSynthesis;
            // Initialize voices
            this.loadVoices();
            if (window.speechSynthesis.onvoiceschanged !== undefined) {
                window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
            }
        } else {
            console.warn('SpeechSynthesis not supported in this environment');
        }
    }

    private loadVoices() {
        if (!this.synth) return;
        this.voices = this.synth.getVoices();
        this.initialized = true;
        console.log(`[TTS] Loaded ${this.voices.length} voices`);
    }

    public speak(text: string, characterId?: string, metadata?: { tone?: string, onStart?: () => void, onEnd?: () => void }) {
        if (!this.synth) return;

        // Cancel current speech
        this.synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Get character config
        const config = CHARACTER_VOICES[characterId?.toLowerCase() || 'default'] || CHARACTER_VOICES['default'];

        // Apply config
        utterance.pitch = config.pitch;
        utterance.rate = config.rate;

        // Adjust based on tone metadata
        if (metadata?.tone) {
            switch (metadata.tone.toLowerCase()) {
                case 'furious':
                case 'angry':
                    utterance.pitch += 0.2;
                    utterance.rate += 0.2;
                    break;
                case 'sad':
                case 'depressed':
                    utterance.pitch -= 0.2;
                    utterance.rate -= 0.2;
                    break;
                case 'excited':
                case 'happy':
                    utterance.pitch += 0.3;
                    utterance.rate += 0.1;
                    break;
                case 'whisper':
                case 'quiet':
                    utterance.volume = 0.5;
                    break;
            }
        }

        if (metadata?.onStart) {
            utterance.onstart = metadata.onStart;
        }

        if (metadata?.onEnd) {
            utterance.onend = metadata.onEnd;
        }

        // Select voice
        // Try to find a male/female voice based on character if possible, or use default
        // For now, just try to find a good English voice
        const preferredVoice = this.voices.find(v => v.lang === 'en-US' && !v.name.includes('Microsoft')); // Google voices often better
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        this.synth.speak(utterance);
    }

    public stop() {
        if (this.synth) {
            this.synth.cancel();
        }
    }
}

export const ttsService = new TTSService();
