/**
 * Text-to-Speech Service
 *
 * Uses the Web Speech Synthesis API to speak character responses.
 * Maps CharacterVoiceProfile parameters to speech synthesis settings.
 */

import {
  CharacterVoiceProfile,
  SegmentVoice,
  VoicePitch,
  VoicePace,
  VoiceVolume,
  mergeVoiceWithDefaults,
} from '../config/voiceConfig';

export interface TTSState {
  isSpeaking: boolean;
  isPaused: boolean;
  currentText: string;
  progress: number; // 0-1 progress through current utterance
}

export interface TTSOptions {
  voiceProfile?: CharacterVoiceProfile;
  segmentVoice?: SegmentVoice;
  voiceName?: string; // Specific voice to use
  onStart?: () => void;
  onEnd?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onError?: (error: Error) => void;
  onBoundary?: (charIndex: number, charLength: number) => void;
}

/**
 * Map VoicePitch to SpeechSynthesis pitch value (0-2, default 1)
 */
function mapPitchToValue(pitch?: VoicePitch): number {
  switch (pitch) {
    case 'shrill':
      return 1.8;
    case 'high':
      return 1.4;
    case 'medium':
      return 1.0;
    case 'low':
      return 0.7;
    case 'deep':
      return 0.5;
    default:
      return 1.0;
  }
}

/**
 * Map VoicePace to SpeechSynthesis rate value (0.1-10, default 1)
 */
function mapPaceToRate(pace?: VoicePace): number {
  switch (pace) {
    case 'slow':
      return 0.8;
    case 'normal':
      return 1.0;
    case 'fast':
      return 1.3;
    default:
      return 1.0;
  }
}

/**
 * Map VoiceVolume to SpeechSynthesis volume value (0-1)
 */
function mapVolumeToValue(volume?: VoiceVolume): number {
  switch (volume) {
    case 'whispered':
      return 0.3;
    case 'soft':
      return 0.5;
    case 'normal':
      return 0.8;
    case 'loud':
      return 0.95;
    case 'booming':
      return 1.0;
    default:
      return 0.8;
  }
}

/**
 * Clean text for TTS - remove markdown, special characters, etc.
 */
function cleanTextForTTS(text: string): string {
  return text
    // Remove markdown bold/italic (* and _)
    .replace(/\*\*(.+?)\*\*/g, '$1')  // **bold**
    .replace(/\*(.+?)\*/g, '$1')       // *italic*
    .replace(/__(.+?)__/g, '$1')       // __bold__
    .replace(/_(.+?)_/g, '$1')         // _italic_
    // Remove markdown headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove markdown links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove markdown images ![alt](url)
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    // Remove markdown code blocks
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // Remove HTML tags
    .replace(/<[^>]+>/g, '')
    // Remove multiple spaces
    .replace(/\s+/g, ' ')
    // Remove special characters that sound odd when spoken
    .replace(/[•◦▪▫●○]/g, '')
    .replace(/[—–]/g, ', ')  // Em/en dash to pause
    .replace(/\.\.\./g, ', ')  // Ellipsis to pause
    // Clean up extra whitespace
    .trim();
}

export class TextToSpeech {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private voicesLoaded: boolean = false;
  private state: TTSState = {
    isSpeaking: false,
    isPaused: false,
    currentText: '',
    progress: 0,
  };
  private onStateChange?: (state: TTSState) => void;
  private speechQueue: Array<{ text: string; options: TTSOptions }> = [];
  private isProcessingQueue: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this.synth = window.speechSynthesis;
      this.loadVoices();

      // Chrome loads voices asynchronously
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  /**
   * Load available voices
   */
  private loadVoices(): void {
    if (!this.synth) return;

    this.voices = this.synth.getVoices();
    this.voicesLoaded = this.voices.length > 0;

    console.log('[TTS] Loaded voices:', this.voices.length);
    if (this.voices.length > 0) {
      console.log(
        '[TTS] Available voices:',
        this.voices.map((v) => `${v.name} (${v.lang})`).slice(0, 5)
      );
    }
  }

  /**
   * Check if TTS is supported
   */
  isSupported(): boolean {
    return this.synth !== null;
  }

  /**
   * Get current state
   */
  getState(): TTSState {
    return { ...this.state };
  }

  /**
   * Set state change callback
   */
  setOnStateChange(callback: (state: TTSState) => void): void {
    this.onStateChange = callback;
  }

  /**
   * Update state and notify listeners
   */
  private updateState(newState: Partial<TTSState>): void {
    this.state = { ...this.state, ...newState };
    if (this.onStateChange) {
      this.onStateChange(this.state);
    }
  }

  /**
   * Get available voices
   */
  getVoices(): SpeechSynthesisVoice[] {
    return [...this.voices];
  }

  /**
   * Get voices filtered by language
   */
  getVoicesByLanguage(lang: string): SpeechSynthesisVoice[] {
    return this.voices.filter((v) => v.lang.startsWith(lang));
  }

  /**
   * Find best voice for character based on voice profile
   * Always prefers English voices
   */
  findVoiceForProfile(
    profile?: CharacterVoiceProfile
  ): SpeechSynthesisVoice | null {
    if (this.voices.length === 0) return null;

    // Always filter by English language
    let candidates = this.voices.filter((v) => v.lang.startsWith('en'));
    if (candidates.length === 0) {
      candidates = this.voices;
    }

    // Try to find a voice that matches the pitch profile
    // Lower pitch voices often have "male" in name, higher pitch "female"
    if (profile?.pitch) {
      const isLowPitch = profile.pitch === 'low' || profile.pitch === 'deep';
      const preferMale = isLowPitch;

      const genderFiltered = candidates.filter((v) => {
        const nameLower = v.name.toLowerCase();
        if (preferMale) {
          return (
            nameLower.includes('male') ||
            nameLower.includes('daniel') ||
            nameLower.includes('james') ||
            nameLower.includes('david') ||
            nameLower.includes('guy')
          );
        } else {
          return (
            nameLower.includes('female') ||
            nameLower.includes('samantha') ||
            nameLower.includes('karen') ||
            nameLower.includes('victoria') ||
            nameLower.includes('fiona')
          );
        }
      });

      if (genderFiltered.length > 0) {
        candidates = genderFiltered;
      }
    }

    // Prefer local/offline voices for better quality
    const localVoices = candidates.filter((v) => v.localService);
    if (localVoices.length > 0) {
      return localVoices[0];
    }

    return candidates[0] || null;
  }

  /**
   * Speak text with optional voice profile
   */
  async speak(text: string, options: TTSOptions = {}): Promise<void> {
    if (!this.synth) {
      throw new Error('Text-to-speech is not supported in this browser');
    }

    if (!text.trim()) {
      console.log('[TTS] Empty text, skipping');
      return;
    }

    // Add to queue
    this.speechQueue.push({ text, options });

    // Process queue if not already processing
    if (!this.isProcessingQueue) {
      await this.processQueue();
    }
  }

  /**
   * Process speech queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.speechQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.speechQueue.length > 0) {
      const item = this.speechQueue.shift();
      if (item) {
        await this.speakImmediate(item.text, item.options);
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Speak text immediately (internal)
   */
  private speakImmediate(text: string, options: TTSOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synth) {
        reject(new Error('TTS not supported'));
        return;
      }

      // Cancel any current speech
      this.synth.cancel();

      // Get merged voice settings
      const voice = mergeVoiceWithDefaults(options.voiceProfile, options.segmentVoice);

      // Clean text for TTS - remove markdown, special characters
      const cleanedText = cleanTextForTTS(text);

      // Create utterance with cleaned text
      const utterance = new SpeechSynthesisUtterance(cleanedText);

      // Always use English
      utterance.lang = 'en-US';

      // Set voice
      if (options.voiceName) {
        const selectedVoice = this.voices.find((v) => v.name === options.voiceName);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      } else {
        const selectedVoice = this.findVoiceForProfile(options.voiceProfile);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }

      // Map voice profile to synthesis parameters
      utterance.pitch = mapPitchToValue(voice.pitch);
      utterance.rate = mapPaceToRate(voice.pace);
      utterance.volume = mapVolumeToValue(voice.volume);

      // Event handlers
      utterance.onstart = () => {
        console.log('[TTS] Started speaking:', text.substring(0, 50) + '...');
        this.updateState({
          isSpeaking: true,
          isPaused: false,
          currentText: text,
          progress: 0,
        });
        options.onStart?.();
      };

      utterance.onend = () => {
        console.log('[TTS] Finished speaking');
        this.updateState({
          isSpeaking: false,
          isPaused: false,
          currentText: '',
          progress: 1,
        });
        options.onEnd?.();
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('[TTS] Error:', event.error);
        this.updateState({
          isSpeaking: false,
          isPaused: false,
          currentText: '',
          progress: 0,
        });
        const error = new Error(`Speech synthesis error: ${event.error}`);
        options.onError?.(error);
        reject(error);
      };

      utterance.onpause = () => {
        this.updateState({ isPaused: true });
        options.onPause?.();
      };

      utterance.onresume = () => {
        this.updateState({ isPaused: false });
        options.onResume?.();
      };

      utterance.onboundary = (event) => {
        const progress = event.charIndex / cleanedText.length;
        this.updateState({ progress });
        // Scale charIndex from cleaned text to original text position
        // This ensures text reveal syncs even when markdown was removed
        const scaledCharIndex = Math.round((event.charIndex / cleanedText.length) * text.length);
        options.onBoundary?.(scaledCharIndex, event.charLength || 1);
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    });
  }

  /**
   * Stop speaking
   */
  stop(): void {
    if (!this.synth) return;

    // Clear queue
    this.speechQueue = [];
    this.isProcessingQueue = false;

    this.synth.cancel();
    this.currentUtterance = null;

    this.updateState({
      isSpeaking: false,
      isPaused: false,
      currentText: '',
      progress: 0,
    });

    console.log('[TTS] Stopped');
  }

  /**
   * Pause speaking
   */
  pause(): void {
    if (!this.synth || !this.state.isSpeaking) return;

    this.synth.pause();
    console.log('[TTS] Paused');
  }

  /**
   * Resume speaking
   */
  resume(): void {
    if (!this.synth || !this.state.isPaused) return;

    this.synth.resume();
    console.log('[TTS] Resumed');
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return this.state.isSpeaking;
  }

  /**
   * Check if paused
   */
  isPaused(): boolean {
    return this.state.isPaused;
  }
}

// Singleton instance
let ttsInstance: TextToSpeech | null = null;

/**
 * Get singleton TTS instance
 */
export function getTextToSpeech(): TextToSpeech {
  if (!ttsInstance) {
    ttsInstance = new TextToSpeech();
  }
  return ttsInstance;
}

/**
 * Check if TTS is supported in current browser
 */
export function isTTSSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}
