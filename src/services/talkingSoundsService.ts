/**
 * Talking Sounds Service
 * 
 * Generates and plays various "talking sounds" for wakattors when they speak.
 * Uses Web Audio API for web and expo-av for mobile platforms.
 * Creates charming, game-like sounds similar to Animal Crossing or Undertale.
 */

import { Platform } from 'react-native';
import { Audio } from 'expo-av';

// ============================================
// SOUND TYPES
// ============================================

export type TalkingSoundType = 
  | 'beep'        // Classic game-like beeps (Undertale style)
  | 'blip'        // Soft blips (Animal Crossing style)
  | 'bubble'      // Bubbly, friendly sounds
  | 'chime'       // Musical chime sounds
  | 'chirp'       // Bird-like chirps
  | 'squeak'      // Cute squeaky sounds
  | 'pop'         // Popping sounds
  | 'click'       // Mechanical clicking
  | 'whisper'     // Soft, airy sounds
  | 'robotic'     // Electronic/robot sounds
  | 'warm'        // Warm, resonant tones
  | 'crystal'     // Crystalline, sparkly sounds
  | 'deep'        // Deep, bass-heavy sounds
  | 'playful'     // Bouncy, playful sounds
  | 'mysterious'; // Mysterious, ethereal sounds

export interface TalkingSoundConfig {
  type: TalkingSoundType;
  baseFrequency?: number;     // Base frequency in Hz (overrides type default)
  frequencyVariation?: number; // Random variation in Hz
  volume?: number;            // 0-1 volume
  speed?: number;             // Playback speed multiplier
}

// Default configurations for each sound type
const SOUND_TYPE_CONFIGS: Record<TalkingSoundType, {
  baseFrequency: number;
  frequencyVariation: number;
  waveform: OscillatorType;
  attackTime: number;
  decayTime: number;
  sustainLevel: number;
  releaseTime: number;
  filterFreq?: number;
  filterQ?: number;
  modulation?: { freq: number; depth: number };
}> = {
  beep: {
    baseFrequency: 440,
    frequencyVariation: 80,
    waveform: 'square',
    attackTime: 0.005,
    decayTime: 0.02,
    sustainLevel: 0.3,
    releaseTime: 0.02,
  },
  blip: {
    baseFrequency: 600,
    frequencyVariation: 150,
    waveform: 'sine',
    attackTime: 0.002,
    decayTime: 0.03,
    sustainLevel: 0.4,
    releaseTime: 0.03,
    filterFreq: 2000,
  },
  bubble: {
    baseFrequency: 350,
    frequencyVariation: 100,
    waveform: 'sine',
    attackTime: 0.01,
    decayTime: 0.06,
    sustainLevel: 0.2,
    releaseTime: 0.08,
    modulation: { freq: 15, depth: 50 },
  },
  chime: {
    baseFrequency: 800,
    frequencyVariation: 200,
    waveform: 'sine',
    attackTime: 0.001,
    decayTime: 0.1,
    sustainLevel: 0.1,
    releaseTime: 0.15,
    filterFreq: 4000,
    filterQ: 2,
  },
  chirp: {
    baseFrequency: 1200,
    frequencyVariation: 400,
    waveform: 'sine',
    attackTime: 0.002,
    decayTime: 0.02,
    sustainLevel: 0.3,
    releaseTime: 0.03,
  },
  squeak: {
    baseFrequency: 900,
    frequencyVariation: 300,
    waveform: 'sine',
    attackTime: 0.003,
    decayTime: 0.04,
    sustainLevel: 0.25,
    releaseTime: 0.04,
    modulation: { freq: 30, depth: 100 },
  },
  pop: {
    baseFrequency: 250,
    frequencyVariation: 50,
    waveform: 'sine',
    attackTime: 0.001,
    decayTime: 0.02,
    sustainLevel: 0.0,
    releaseTime: 0.05,
    filterFreq: 800,
    filterQ: 5,
  },
  click: {
    baseFrequency: 1500,
    frequencyVariation: 200,
    waveform: 'square',
    attackTime: 0.001,
    decayTime: 0.01,
    sustainLevel: 0.1,
    releaseTime: 0.01,
    filterFreq: 3000,
  },
  whisper: {
    baseFrequency: 300,
    frequencyVariation: 100,
    waveform: 'sine',
    attackTime: 0.02,
    decayTime: 0.05,
    sustainLevel: 0.15,
    releaseTime: 0.1,
    filterFreq: 1500,
    filterQ: 0.5,
  },
  robotic: {
    baseFrequency: 200,
    frequencyVariation: 80,
    waveform: 'sawtooth',
    attackTime: 0.002,
    decayTime: 0.03,
    sustainLevel: 0.4,
    releaseTime: 0.02,
    filterFreq: 1200,
    filterQ: 8,
  },
  warm: {
    baseFrequency: 280,
    frequencyVariation: 60,
    waveform: 'triangle',
    attackTime: 0.01,
    decayTime: 0.06,
    sustainLevel: 0.35,
    releaseTime: 0.08,
    filterFreq: 1000,
  },
  crystal: {
    baseFrequency: 1000,
    frequencyVariation: 300,
    waveform: 'sine',
    attackTime: 0.001,
    decayTime: 0.15,
    sustainLevel: 0.05,
    releaseTime: 0.2,
    filterFreq: 6000,
    filterQ: 3,
  },
  deep: {
    baseFrequency: 150,
    frequencyVariation: 30,
    waveform: 'triangle',
    attackTime: 0.01,
    decayTime: 0.08,
    sustainLevel: 0.4,
    releaseTime: 0.1,
    filterFreq: 600,
    filterQ: 2,
  },
  playful: {
    baseFrequency: 500,
    frequencyVariation: 200,
    waveform: 'sine',
    attackTime: 0.003,
    decayTime: 0.04,
    sustainLevel: 0.3,
    releaseTime: 0.05,
    modulation: { freq: 20, depth: 80 },
  },
  mysterious: {
    baseFrequency: 350,
    frequencyVariation: 120,
    waveform: 'sine',
    attackTime: 0.02,
    decayTime: 0.1,
    sustainLevel: 0.2,
    releaseTime: 0.15,
    filterFreq: 2000,
    filterQ: 4,
    modulation: { freq: 5, depth: 30 },
  },
};

// ============================================
// WEB AUDIO IMPLEMENTATION
// ============================================

class WebTalkingSounds {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled: boolean = true;
  private lastPlayTime: number = 0;
  private minInterval: number = 40; // Minimum ms between sounds

  private getContext(): AudioContext | null {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0.15; // Master volume
        this.masterGain.connect(this.audioContext.destination);
      } catch (e) {
        console.warn('[TalkingSounds] Web Audio not supported');
        return null;
      }
    }
    return this.audioContext;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume)) * 0.3;
    }
  }

  /**
   * Play a talking sound
   */
  play(config: TalkingSoundConfig): void {
    if (!this.enabled) return;

    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    // Throttle sounds
    const now = performance.now();
    if (now - this.lastPlayTime < this.minInterval) return;
    this.lastPlayTime = now;

    // Resume context if suspended
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const typeConfig = SOUND_TYPE_CONFIGS[config.type];
    const baseFreq = config.baseFrequency ?? typeConfig.baseFrequency;
    const variation = config.frequencyVariation ?? typeConfig.frequencyVariation;
    const volume = config.volume ?? 1;
    const speed = config.speed ?? 1;

    // Calculate random frequency within range
    const frequency = baseFreq + (Math.random() - 0.5) * variation * 2;

    // Create oscillator
    const oscillator = ctx.createOscillator();
    oscillator.type = typeConfig.waveform;
    oscillator.frequency.value = frequency;

    // Create gain for envelope
    const gainNode = ctx.createGain();
    gainNode.gain.value = 0;

    // Apply filter if configured
    let lastNode: AudioNode = oscillator;
    if (typeConfig.filterFreq) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = typeConfig.filterFreq;
      filter.Q.value = typeConfig.filterQ ?? 1;
      oscillator.connect(filter);
      lastNode = filter;
    }

    // Apply modulation if configured
    if (typeConfig.modulation) {
      const modulator = ctx.createOscillator();
      const modGain = ctx.createGain();
      modulator.frequency.value = typeConfig.modulation.freq;
      modGain.gain.value = typeConfig.modulation.depth;
      modulator.connect(modGain);
      modGain.connect(oscillator.frequency);
      modulator.start();
      modulator.stop(ctx.currentTime + 0.2);
    }

    lastNode.connect(gainNode);
    gainNode.connect(this.masterGain);

    // Apply ADSR envelope
    const now2 = ctx.currentTime;
    const attack = typeConfig.attackTime / speed;
    const decay = typeConfig.decayTime / speed;
    const sustain = typeConfig.sustainLevel * volume;
    const release = typeConfig.releaseTime / speed;

    gainNode.gain.setValueAtTime(0, now2);
    gainNode.gain.linearRampToValueAtTime(volume, now2 + attack);
    gainNode.gain.linearRampToValueAtTime(sustain, now2 + attack + decay);
    gainNode.gain.linearRampToValueAtTime(0, now2 + attack + decay + release);

    // Play
    oscillator.start(now2);
    oscillator.stop(now2 + attack + decay + release + 0.01);

    // Cleanup
    oscillator.onended = () => {
      oscillator.disconnect();
      gainNode.disconnect();
    };
  }

  /**
   * Play a sequence of sounds for a word/syllable
   */
  playWord(config: TalkingSoundConfig, syllables: number = 1): void {
    if (!this.enabled) return;

    for (let i = 0; i < syllables; i++) {
      setTimeout(() => this.play(config), i * 60);
    }
  }

  cleanup(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.masterGain = null;
    }
  }
}

// ============================================
// MOBILE AUDIO IMPLEMENTATION (using expo-av)
// ============================================

class MobileTalkingSounds {
  private enabled: boolean = true;
  private volume: number = 0.5;
  private lastPlayTime: number = 0;
  private minInterval: number = 50;
  private soundPool: Map<TalkingSoundType, Audio.Sound[]> = new Map();

  async initialize(): Promise<void> {
    // Configure audio mode for mobile
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
    } catch (e) {
      console.warn('[TalkingSounds] Failed to set audio mode:', e);
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Play a simple tone using expo-av
   * Note: For mobile, we use a simpler approach with pre-generated audio data
   */
  async play(config: TalkingSoundConfig): Promise<void> {
    if (!this.enabled) return;

    const now = performance.now();
    if (now - this.lastPlayTime < this.minInterval) return;
    this.lastPlayTime = now;

    // For mobile, we'll use the Audio API with generated PCM data
    // This is a simplified version - you could also use pre-recorded sound files
    try {
      const typeConfig = SOUND_TYPE_CONFIGS[config.type];
      const baseFreq = config.baseFrequency ?? typeConfig.baseFrequency;
      const variation = config.frequencyVariation ?? typeConfig.frequencyVariation;
      const frequency = baseFreq + (Math.random() - 0.5) * variation * 2;

      // Generate simple beep using Audio object with data URI
      // This works for basic sounds - for better quality, use actual audio files
      const sampleRate = 44100;
      const duration = 0.05; // 50ms
      const numSamples = Math.floor(sampleRate * duration);
      const samples = new Float32Array(numSamples);

      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const envelope = Math.exp(-t * 30) * this.volume * (config.volume ?? 1);
        samples[i] = Math.sin(2 * Math.PI * frequency * t) * envelope;
      }

      // Convert to WAV format
      const wavData = this.createWav(samples, sampleRate);
      const base64 = this.arrayBufferToBase64(wavData);
      
      const { sound } = await Audio.Sound.createAsync(
        { uri: `data:audio/wav;base64,${base64}` },
        { shouldPlay: true, volume: this.volume }
      );

      // Auto-cleanup
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (e) {
      // Silently fail - sounds are optional
      console.debug('[TalkingSounds] Mobile play failed:', e);
    }
  }

  private createWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
    const numChannels = 1;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = samples.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // WAV header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Write samples
    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
      const sample = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }

    return buffer;
  }

  private writeString(view: DataView, offset: number, str: string): void {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  cleanup(): void {
    this.soundPool.clear();
  }
}

// ============================================
// UNIFIED SERVICE
// ============================================

export class TalkingSoundsService {
  private webSounds: WebTalkingSounds | null = null;
  private mobileSounds: MobileTalkingSounds | null = null;
  private isWeb: boolean;
  private characterSounds: Map<string, TalkingSoundConfig> = new Map();
  private defaultSoundType: TalkingSoundType = 'blip';

  constructor() {
    this.isWeb = Platform.OS === 'web';
    
    if (this.isWeb) {
      this.webSounds = new WebTalkingSounds();
    } else {
      this.mobileSounds = new MobileTalkingSounds();
      this.mobileSounds.initialize();
    }
  }

  /**
   * Set the sound configuration for a specific character
   */
  setCharacterSound(characterId: string, config: TalkingSoundConfig): void {
    this.characterSounds.set(characterId, config);
  }

  /**
   * Get the sound configuration for a character (or default)
   */
  getCharacterSound(characterId: string): TalkingSoundConfig {
    return this.characterSounds.get(characterId) ?? { type: this.defaultSoundType };
  }

  /**
   * Play a talking sound for a character
   */
  play(characterId: string): void {
    const config = this.getCharacterSound(characterId);
    
    if (this.isWeb && this.webSounds) {
      this.webSounds.play(config);
    } else if (this.mobileSounds) {
      this.mobileSounds.play(config);
    }
  }

  /**
   * Play a talking sound with a specific config (bypassing character config)
   */
  playDirect(config: TalkingSoundConfig): void {
    if (this.isWeb && this.webSounds) {
      this.webSounds.play(config);
    } else if (this.mobileSounds) {
      this.mobileSounds.play(config);
    }
  }

  /**
   * Enable or disable sounds
   */
  setEnabled(enabled: boolean): void {
    if (this.webSounds) this.webSounds.setEnabled(enabled);
    if (this.mobileSounds) this.mobileSounds.setEnabled(enabled);
  }

  /**
   * Check if sounds are enabled
   */
  isEnabled(): boolean {
    if (this.webSounds) return this.webSounds.isEnabled();
    if (this.mobileSounds) return this.mobileSounds.isEnabled();
    return false;
  }

  /**
   * Set master volume (0-1)
   */
  setVolume(volume: number): void {
    if (this.webSounds) this.webSounds.setVolume(volume);
    if (this.mobileSounds) this.mobileSounds.setVolume(volume);
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.webSounds) this.webSounds.cleanup();
    if (this.mobileSounds) this.mobileSounds.cleanup();
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let serviceInstance: TalkingSoundsService | null = null;

/**
 * Get the global talking sounds service instance
 */
export function getTalkingSoundsService(): TalkingSoundsService {
  if (!serviceInstance) {
    serviceInstance = new TalkingSoundsService();
  }
  return serviceInstance;
}

/**
 * Reset the global talking sounds service
 */
export function resetTalkingSoundsService(): void {
  if (serviceInstance) {
    serviceInstance.cleanup();
  }
  serviceInstance = new TalkingSoundsService();
}

// Export sound type list for UI/configuration
export const TALKING_SOUND_TYPES: TalkingSoundType[] = [
  'beep', 'blip', 'bubble', 'chime', 'chirp', 
  'squeak', 'pop', 'click', 'whisper', 'robotic',
  'warm', 'crystal', 'deep', 'playful', 'mysterious'
];

// Helper to get a recommended sound type based on character traits
export function getSuggestedSoundType(traits: {
  gender?: 'male' | 'female' | 'neutral';
  role?: string;
  personality?: string;
}): TalkingSoundType {
  const { gender, role, personality } = traits;
  
  // Role-based suggestions
  if (role) {
    const roleLower = role.toLowerCase();
    if (roleLower.includes('robot') || roleLower.includes('ai')) return 'robotic';
    if (roleLower.includes('mystic') || roleLower.includes('wizard')) return 'mysterious';
    if (roleLower.includes('child') || roleLower.includes('kid')) return 'squeak';
    if (roleLower.includes('scientist') || roleLower.includes('doctor')) return 'click';
  }
  
  // Personality-based
  if (personality) {
    const persLower = personality.toLowerCase();
    if (persLower.includes('playful') || persLower.includes('fun')) return 'playful';
    if (persLower.includes('calm') || persLower.includes('gentle')) return 'warm';
    if (persLower.includes('elegant') || persLower.includes('royal')) return 'chime';
    if (persLower.includes('mysterious') || persLower.includes('enigmatic')) return 'mysterious';
  }
  
  // Gender-based fallback
  if (gender === 'female') return 'chime';
  if (gender === 'male') return 'warm';
  
  return 'blip'; // Default
}

