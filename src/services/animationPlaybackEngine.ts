/**
 * Animation Playback Engine
 * 
 * Real-time playback engine for orchestrated animation scenes.
 * Uses requestAnimationFrame for smooth 60fps updates.
 */

import {
  OrchestrationScene,
  CharacterTimeline,
  AnimationSegment,
  CharacterAnimationState,
  DEFAULT_TALKING_SPEED
} from './animationOrchestration';
import {
  AnimationState,
  ComplementaryAnimation,
  MouthState,
  EyeState
} from '../components/CharacterDisplay3D';
import {
  CharacterVoiceProfile,
  SegmentVoice,
  getPaceMultiplier,
  mergeVoiceWithDefaults
} from '../config/voiceConfig';

// ============================================
// POST-SPEAKING EXPRESSIONS
// ============================================

// Varied expressions for after a character finishes speaking
const POST_SPEAKING_EXPRESSIONS: Array<{
  mouthState: MouthState;
  eyeState?: EyeState;
  weight: number; // Higher = more likely
}> = [
  { mouthState: 'smile', weight: 3 },           // Satisfied/friendly
  { mouthState: 'closed', weight: 4 },          // Neutral/thoughtful
  { mouthState: 'closed', eyeState: 'blink', weight: 2 }, // Relaxed blink
  { mouthState: 'open', weight: 1 },            // Curious/engaged
  { mouthState: 'smile', eyeState: 'open', weight: 2 },  // Alert and happy
];

/**
 * Get a random post-speaking expression with weighted selection
 */
function getRandomPostSpeakingExpression(): ComplementaryAnimation {
  const totalWeight = POST_SPEAKING_EXPRESSIONS.reduce((sum, e) => sum + e.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const expression of POST_SPEAKING_EXPRESSIONS) {
    random -= expression.weight;
    if (random <= 0) {
      const result: ComplementaryAnimation = { mouthState: expression.mouthState };
      if (expression.eyeState) {
        result.eyeState = expression.eyeState;
      }
      return result;
    }
  }
  
  // Fallback
  return { mouthState: 'closed' };
}

// ============================================
// TYPES
// ============================================

export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'complete';

export interface PlaybackState {
  status: PlaybackStatus;
  elapsedTime: number;
  characterStates: Map<string, CharacterAnimationState>;
}

export type PlaybackCallback = (state: PlaybackState) => void;

// ============================================
// PLAYBACK ENGINE CLASS
// ============================================

export class AnimationPlaybackEngine {
  private scene: OrchestrationScene | null = null;
  private status: PlaybackStatus = 'idle';
  private startTime: number = 0;
  private pausedAt: number = 0;
  private animationFrameId: number | null = null;
  private callbacks: Set<PlaybackCallback> = new Set();
  private lastUpdateTime: number = 0;
  private updateThrottleMs: number = 16; // ~60fps
  private characterVoiceProfiles: Map<string, CharacterVoiceProfile> = new Map();
  // Cache for post-speaking expressions to prevent flickering
  private postSpeakingExpressionCache: Map<string, ComplementaryAnimation> = new Map();
  // Maximum number of callbacks to prevent memory leaks
  private static readonly MAX_CALLBACKS = 10;
  // Cache for character states to prevent creating new Map every frame
  private cachedStates: Map<string, CharacterAnimationState> = new Map();
  private lastCachedElapsed: number = -1;
  private lastCachedStatus: PlaybackStatus = 'idle';

  // ============================================
  // PUBLIC METHODS
  // ============================================

  /**
   * Set character voice profiles for pace calculations
   * Call this before play() to apply character-specific base voice settings
   */
  setCharacterVoiceProfiles(profiles: Map<string, CharacterVoiceProfile>): void {
    this.characterVoiceProfiles = new Map(profiles);
  }

  /**
   * Start playing an orchestration scene
   */
  play(scene: OrchestrationScene): void {
    this.stop(); // Clean up any existing playback

    this.scene = scene;
    this.status = 'playing';
    this.startTime = performance.now();
    this.pausedAt = 0;
    // Clear cached expressions for new scene
    this.postSpeakingExpressionCache.clear();

    this.tick();
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (this.status !== 'playing') return;
    
    this.status = 'paused';
    this.pausedAt = performance.now() - this.startTime;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Resume paused playback
   */
  resume(): void {
    if (this.status !== 'paused' || !this.scene) return;

    this.status = 'playing';
    this.startTime = performance.now() - this.pausedAt;

    this.tick();
  }

  /**
   * Stop playback and reset
   */
  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.status = 'idle';
    this.scene = null;
    this.startTime = 0;
    this.pausedAt = 0;
    // Clear caches to prevent memory accumulation
    this.postSpeakingExpressionCache.clear();
    this.cachedStates.clear();
    this.lastCachedElapsed = -1;
    this.lastCachedStatus = 'idle';

    // Notify subscribers that playback has stopped
    this.notifyCallbacks();
  }

  /**
   * Get current playback status
   */
  getStatus(): PlaybackStatus {
    return this.status;
  }

  /**
   * Get current elapsed time in milliseconds
   */
  getElapsedTime(): number {
    if (this.status === 'idle') return 0;
    if (this.status === 'paused') return this.pausedAt;
    return performance.now() - this.startTime;
  }

  /**
   * Get current animation state for all characters
   * Handles multiple timelines per character (e.g., idle conversations with back-and-forth)
   * Uses caching to avoid creating new Map objects every frame
   */
  getCurrentStates(): Map<string, CharacterAnimationState> {
    if (!this.scene) {
      if (this.cachedStates.size > 0) {
        this.cachedStates.clear();
      }
      return this.cachedStates;
    }

    const elapsed = this.getElapsedTime();

    // Return cached states if elapsed time hasn't changed significantly (within 1ms)
    // This prevents creating new objects when nothing has changed
    if (Math.abs(elapsed - this.lastCachedElapsed) < 1 && this.status === this.lastCachedStatus) {
      return this.cachedStates;
    }

    this.lastCachedElapsed = elapsed;
    this.lastCachedStatus = this.status;

    // Clear cache and rebuild - reusing the same Map object
    this.cachedStates.clear();

    // Group timelines by character and find the currently active one for each
    const characterTimelines = new Map<string, CharacterTimeline[]>();
    for (const timeline of this.scene.timelines) {
      const existing = characterTimelines.get(timeline.characterId) || [];
      existing.push(timeline);
      characterTimelines.set(timeline.characterId, existing);
    }

    // For each character, find their currently active timeline
    for (const [characterId, timelines] of characterTimelines) {
      const activeTimeline = this.findActiveTimeline(timelines, elapsed);
      if (activeTimeline) {
        this.cachedStates.set(characterId, this.getCharacterState(activeTimeline, elapsed));
      } else {
        // No active timeline - character is idle
        this.cachedStates.set(characterId, {
          characterId,
          animation: 'idle',
          complementary: {},
          isTalking: false,
          revealedText: '',
          isActive: false,
          isComplete: false
        });
      }
    }

    // Get states for non-speaking characters
    for (const [characterId, segments] of Object.entries(this.scene.nonSpeakerBehavior)) {
      this.cachedStates.set(characterId, this.getNonSpeakerState(characterId, segments, elapsed));
    }

    return this.cachedStates;
  }

  /**
   * Find the currently active timeline for a character based on elapsed time
   * Returns the timeline that is currently playing (between startDelay and startDelay + totalDuration)
   */
  private findActiveTimeline(timelines: CharacterTimeline[], elapsed: number): CharacterTimeline | null {
    // Sort by startDelay to process in order
    const sorted = [...timelines].sort((a, b) => a.startDelay - b.startDelay);

    // Find the timeline that is currently active
    for (const timeline of sorted) {
      const timelineStart = timeline.startDelay;
      const timelineEnd = timeline.startDelay + timeline.totalDuration;

      if (elapsed >= timelineStart && elapsed < timelineEnd) {
        return timeline;
      }
    }

    // If no timeline is currently active, check if we're past all timelines
    // Return the last completed timeline so we can show its final state
    for (let i = sorted.length - 1; i >= 0; i--) {
      const timeline = sorted[i];
      if (elapsed >= timeline.startDelay + timeline.totalDuration) {
        return timeline; // Return last completed timeline
      }
    }

    return null;
  }

  /**
   * Get the effective pace multiplier for a segment, considering character base voice
   */
  private getEffectivePaceMultiplier(characterId: string, segmentVoice?: SegmentVoice): number {
    const baseVoice = this.characterVoiceProfiles.get(characterId);
    const mergedVoice = mergeVoiceWithDefaults(baseVoice, segmentVoice);
    return getPaceMultiplier(mergedVoice.pace);
  }

  /**
   * Get revealed text for a specific character at current time
   * Handles multiple timelines per character (finds the currently active one)
   * Applies voice pace multipliers for variable speech speed
   */
  getRevealedText(characterId: string): string {
    if (!this.scene) return '';

    const elapsed = this.getElapsedTime();

    // Find all timelines for this character and get the active one
    const characterTimelines = this.scene.timelines.filter(t => t.characterId === characterId);
    if (characterTimelines.length === 0) return '';

    const timeline = this.findActiveTimeline(characterTimelines, elapsed);
    if (!timeline) return '';

    const characterElapsed = elapsed - timeline.startDelay;

    if (characterElapsed < 0) return '';
    if (characterElapsed >= timeline.totalDuration) return timeline.content;

    // Find current segment and calculate revealed text with pace adjustment
    let segmentStartTime = 0;

    for (const segment of timeline.segments) {
      const segmentEndTime = segmentStartTime + segment.duration;

      if (characterElapsed < segmentEndTime) {
        // We're in this segment
        if (segment.textReveal) {
          // Calculate progress through segment - text syncs exactly with segment timing
          const segmentProgress = (characterElapsed - segmentStartTime) / segment.duration;

          const textProgress = segment.textReveal.startIndex +
            Math.floor((segment.textReveal.endIndex - segment.textReveal.startIndex) * segmentProgress);
          return timeline.content.substring(0, Math.min(textProgress, timeline.content.length));
        }
        break;
      }

      segmentStartTime = segmentEndTime;
    }

    // If no text reveal in current segment, find last revealed position
    let lastRevealedIndex = 0;
    segmentStartTime = 0;

    for (const segment of timeline.segments) {
      if (segmentStartTime > characterElapsed) break;

      if (segment.textReveal) {
        const segmentEndTime = segmentStartTime + segment.duration;
        if (characterElapsed >= segmentEndTime) {
          lastRevealedIndex = segment.textReveal.endIndex;
        } else {
          // Text syncs exactly with segment timing
          const progress = (characterElapsed - segmentStartTime) / segment.duration;

          lastRevealedIndex = segment.textReveal.startIndex +
            Math.floor((segment.textReveal.endIndex - segment.textReveal.startIndex) * progress);
        }
      }

      segmentStartTime += segment.duration;
    }

    return timeline.content.substring(0, Math.min(lastRevealedIndex, timeline.content.length));
  }

  /**
   * Get the full text content for a character's active timeline
   * Used for pre-calculating line breaks to prevent words jumping between lines
   */
  getFullText(characterId: string): string {
    if (!this.scene) return '';

    const elapsed = this.getElapsedTime();
    const characterTimelines = this.scene.timelines.filter(t => t.characterId === characterId);
    if (characterTimelines.length === 0) return '';

    const timeline = this.findActiveTimeline(characterTimelines, elapsed);
    if (!timeline) return '';

    return timeline.content;
  }

  /**
   * Get the current voice state for a character (merged base + segment voice)
   * Handles multiple timelines per character (finds the currently active one)
   * Useful for TTS integration or voice visualization
   */
  getCurrentVoice(characterId: string): SegmentVoice | null {
    if (!this.scene) return null;

    const elapsed = this.getElapsedTime();

    // Find all timelines for this character and get the active one
    const characterTimelines = this.scene.timelines.filter(t => t.characterId === characterId);
    if (characterTimelines.length === 0) return null;

    const timeline = this.findActiveTimeline(characterTimelines, elapsed);
    if (!timeline) return null;

    const characterElapsed = elapsed - timeline.startDelay;

    if (characterElapsed < 0 || characterElapsed >= timeline.totalDuration) {
      return null;
    }

    // Find current segment
    const currentSegment = this.findCurrentSegment(timeline.segments, characterElapsed);

    // Merge with character base voice
    const baseVoice = this.characterVoiceProfiles.get(characterId);
    return mergeVoiceWithDefaults(baseVoice, currentSegment.voice);
  }

  /**
   * Subscribe to playback state changes
   * Limited to MAX_CALLBACKS to prevent memory leaks
   */
  subscribe(callback: PlaybackCallback): () => void {
    // Warn and evict oldest callbacks if limit exceeded
    if (this.callbacks.size >= AnimationPlaybackEngine.MAX_CALLBACKS) {
      console.warn(`[PlaybackEngine] Max callbacks (${AnimationPlaybackEngine.MAX_CALLBACKS}) reached, clearing oldest`);
      // Remove first (oldest) callback
      const firstCallback = this.callbacks.values().next().value;
      if (firstCallback) {
        this.callbacks.delete(firstCallback);
      }
    }
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Clear all callbacks - useful for cleanup
   */
  clearCallbacks(): void {
    this.callbacks.clear();
  }

  /**
   * Check if a scene is currently loaded
   */
  hasScene(): boolean {
    return this.scene !== null;
  }

  /**
   * Get the scene duration
   */
  getSceneDuration(): number {
    return this.scene?.sceneDuration ?? 0;
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  /**
   * Main animation tick
   */
  private tick = (): void => {
    if (this.status !== 'playing' || !this.scene) return;

    const now = performance.now();
    const elapsed = now - this.startTime;

    // Throttle updates
    if (now - this.lastUpdateTime < this.updateThrottleMs) {
      this.animationFrameId = requestAnimationFrame(this.tick);
      return;
    }
    this.lastUpdateTime = now;
    
    // Check if scene is complete
    if (elapsed >= this.scene.sceneDuration) {
      this.status = 'complete';
      this.notifyCallbacks();
      return;
    }
    
    // Notify callbacks with current state
    this.notifyCallbacks();
    
    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.tick);
  };

  /**
   * Notify all subscribers of state change
   */
  private notifyCallbacks(): void {
    const state: PlaybackState = {
      status: this.status,
      elapsedTime: this.getElapsedTime(),
      characterStates: this.getCurrentStates()
    };
    
    for (const callback of this.callbacks) {
      try {
        callback(state);
      } catch (error) {
        console.error('[PlaybackEngine] Callback error:', error);
      }
    }
  }

  /**
   * Get animation state for a speaking character
   */
  private getCharacterState(
    timeline: CharacterTimeline,
    elapsed: number
  ): CharacterAnimationState {
    const characterElapsed = elapsed - timeline.startDelay;
    
    // Before character's turn
    if (characterElapsed < 0) {
      return {
        characterId: timeline.characterId,
        animation: 'idle',
        complementary: {},
        isTalking: false,
        revealedText: '',
        isActive: false,
        isComplete: false
      };
    }
    
    // After character's turn
    if (characterElapsed >= timeline.totalDuration) {
      // Use cached expression to prevent flickering, or generate and cache a new one
      let expression = this.postSpeakingExpressionCache.get(timeline.characterId);
      if (!expression) {
        expression = getRandomPostSpeakingExpression();
        this.postSpeakingExpressionCache.set(timeline.characterId, expression);
      }
      return {
        characterId: timeline.characterId,
        animation: 'idle',
        complementary: expression,
        isTalking: false,
        revealedText: timeline.content,
        isActive: false,
        isComplete: true
      };
    }
    
    // Find current segment
    const currentSegment = this.findCurrentSegment(timeline.segments, characterElapsed);
    
    return {
      characterId: timeline.characterId,
      animation: currentSegment.animation,
      complementary: this.buildComplementary(currentSegment),
      isTalking: currentSegment.isTalking ?? false,
      revealedText: this.getRevealedText(timeline.characterId),
      isActive: true,
      isComplete: false
    };
  }

  /**
   * Get animation state for a non-speaking character
   */
  private getNonSpeakerState(
    characterId: string,
    segments: AnimationSegment[],
    elapsed: number
  ): CharacterAnimationState {
    const currentSegment = this.findCurrentSegment(segments, elapsed);
    
    return {
      characterId,
      animation: currentSegment.animation,
      complementary: this.buildComplementary(currentSegment),
      isTalking: false,
      revealedText: '',
      isActive: true,
      isComplete: false
    };
  }

  /**
   * Find the current segment based on elapsed time
   */
  private findCurrentSegment(
    segments: AnimationSegment[],
    elapsed: number
  ): AnimationSegment {
    let segmentStartTime = 0;
    
    for (const segment of segments) {
      const segmentEndTime = segmentStartTime + segment.duration;
      
      if (elapsed < segmentEndTime) {
        return segment;
      }
      
      segmentStartTime = segmentEndTime;
    }
    
    // Return last segment if past all segments
    return segments[segments.length - 1] || {
      animation: 'idle' as AnimationState,
      duration: 1000,
      isTalking: false
    };
  }

  /**
   * Build ComplementaryAnimation from segment
   */
  private buildComplementary(segment: AnimationSegment): ComplementaryAnimation {
    if (!segment.complementary) return {};
    
    return {
      lookDirection: segment.complementary.lookDirection,
      eyeState: segment.complementary.eyeState,
      mouthState: segment.complementary.mouthState,
      effect: segment.complementary.effect,
      speed: segment.complementary.speed,
      blinkDuration: segment.complementary.blinkDuration,
      blinkPeriod: segment.complementary.blinkPeriod
    };
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let engineInstance: AnimationPlaybackEngine | null = null;

/**
 * Get the global playback engine instance
 */
export function getPlaybackEngine(): AnimationPlaybackEngine {
  if (!engineInstance) {
    engineInstance = new AnimationPlaybackEngine();
  }
  return engineInstance;
}

/**
 * Reset the global playback engine
 */
export function resetPlaybackEngine(): void {
  if (engineInstance) {
    engineInstance.stop();
  }
  engineInstance = new AnimationPlaybackEngine();
}

