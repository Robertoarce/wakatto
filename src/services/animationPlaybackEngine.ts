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
import { performanceLogger } from './performanceLogger';
import { getTalkingSoundsService, TalkingSoundType } from './talkingSoundsService';

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
  // Cache for character timelines grouping - built once when scene starts, not every frame
  private characterTimelinesCache: Map<string, CharacterTimeline[]> = new Map();
  // Flag to track if cache needs rebuild (only on scene change)
  private timelinesCacheValid: boolean = false;

  // TTS-driven mode: character positions driven by voice feedback
  private ttsCharPositions: Map<string, number> = new Map();
  private ttsDrivenMode: boolean = false;
  // Track which character TTS is currently speaking (for bubble sync)
  private ttsCurrentSpeaker: string | null = null;
  // Throttle TTS updates to prevent excessive re-renders
  private lastTTSUpdateTime: number = 0;
  private ttsUpdateThrottleMs: number = 50; // Max 20 updates per second

  // Graceful stop: wait for current speaker to finish before stopping
  private gracefulStopRequested: boolean = false;
  private gracefulStopCallback: (() => void) | null = null;

  // Talking sounds
  private talkingSoundsEnabled: boolean = true;
  private lastSoundTimes: Map<string, number> = new Map();
  private lastRevealedLengths: Map<string, number> = new Map();
  private soundInterval: number = 65; // ms between sounds (roughly per character)

  // ============================================
  // PUBLIC METHODS
  // ============================================

  /**
   * Set character voice profiles for pace calculations
   * Call this before play() to apply character-specific base voice settings
   */
  setCharacterVoiceProfiles(profiles: Map<string, CharacterVoiceProfile>): void {
    this.characterVoiceProfiles = new Map(profiles);
    
    // Also set up talking sounds for each character
    const soundsService = getTalkingSoundsService();
    for (const [characterId, profile] of profiles) {
      if (profile.talkingSound) {
        soundsService.setCharacterSound(characterId, { type: profile.talkingSound });
      }
    }
  }

  /**
   * Enable or disable talking sounds
   */
  setTalkingSoundsEnabled(enabled: boolean): void {
    this.talkingSoundsEnabled = enabled;
    getTalkingSoundsService().setEnabled(enabled);
  }

  /**
   * Check if talking sounds are enabled
   */
  isTalkingSoundsEnabled(): boolean {
    return this.talkingSoundsEnabled;
  }

  /**
   * Set talking sounds volume (0-1)
   */
  setTalkingSoundsVolume(volume: number): void {
    getTalkingSoundsService().setVolume(volume);
  }

  /**
   * Enable or disable TTS-driven mode
   * When enabled, text reveal is controlled by setTTSCharPosition instead of time
   */
  setTTSDrivenMode(enabled: boolean): void {
    this.ttsDrivenMode = enabled;
    if (!enabled) {
      this.ttsCharPositions.clear();
      this.ttsCurrentSpeaker = null;
    }
  }

  /**
   * Check if TTS-driven mode is enabled
   */
  isTTSDrivenMode(): boolean {
    return this.ttsDrivenMode;
  }

  /**
   * Set character text position from TTS boundary event
   * This drives the text reveal when in TTS-driven mode
   * @param characterId - The character whose text position to set
   * @param charIndex - The character index in the text (from TTS onboundary event)
   */
  setTTSCharPosition(characterId: string, charIndex: number): void {
    this.ttsCharPositions.set(characterId, charIndex);
    // Throttle state updates to prevent excessive re-renders
    const now = performance.now();
    if (this.status === 'playing' && (now - this.lastTTSUpdateTime) >= this.ttsUpdateThrottleMs) {
      this.lastTTSUpdateTime = now;
      this.notifyCallbacks();
    }
  }

  /**
   * Get current TTS character position for a character
   */
  getTTSCharPosition(characterId: string): number {
    return this.ttsCharPositions.get(characterId) ?? 0;
  }

  /**
   * Clear TTS positions (call when TTS ends or stops)
   */
  clearTTSPositions(): void {
    this.ttsCharPositions.clear();
  }

  /**
   * Set which character TTS is currently speaking
   * Used to sync bubble visibility with actual speech
   * @param characterId - The character currently speaking, or null if none
   */
  setTTSCurrentSpeaker(characterId: string | null): void {
    this.ttsCurrentSpeaker = characterId;
    this.notifyCallbacks();
  }

  /**
   * Get which character TTS is currently speaking
   */
  getTTSCurrentSpeaker(): string | null {
    return this.ttsCurrentSpeaker;
  }

  /**
   * Start playing an orchestration scene
   */
  play(scene: OrchestrationScene): void {
    // Cancel any existing animation frame without full stop() to avoid chars: 0 flash
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Reset state without clearing cached states (prevents character disappearing during transition)
    this.scene = scene;
    this.status = 'playing';
    this.startTime = performance.now();
    this.pausedAt = 0;

    // Clear cached expressions for new scene
    this.postSpeakingExpressionCache.clear();
    // Invalidate timeline cache so it gets rebuilt
    this.timelinesCacheValid = false;
    this.lastCachedElapsed = -1;
    this.lastCachedStatus = 'idle';
    // Clear TTS state
    this.ttsCharPositions.clear();
    this.lastTTSUpdateTime = 0;
    this.gracefulStopRequested = false;
    this.gracefulStopCallback = null;
    // Clear sound state
    this.lastSoundTimes.clear();
    this.lastRevealedLengths.clear();

    // Build timeline cache once at start (not every frame)
    this.buildTimelinesCache();

    this.tick();
  }

  /**
   * Build the character timelines cache once when scene starts
   * Pre-sorts timelines to avoid sorting every frame
   */
  private buildTimelinesCache(): void {
    this.characterTimelinesCache.clear();
    this.timelinesCacheValid = false;

    if (!this.scene) return;

    // Group timelines by character
    for (const timeline of this.scene.timelines) {
      const existing = this.characterTimelinesCache.get(timeline.characterId);
      if (existing) {
        existing.push(timeline);
      } else {
        this.characterTimelinesCache.set(timeline.characterId, [timeline]);
      }
    }

    // Pre-sort each character's timelines by startDelay
    for (const [, timelines] of this.characterTimelinesCache) {
      timelines.sort((a, b) => a.startDelay - b.startDelay);
    }

    this.timelinesCacheValid = true;
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
    this.characterTimelinesCache.clear();
    this.timelinesCacheValid = false;
    this.lastCachedElapsed = -1;
    this.lastCachedStatus = 'idle';
    // Clear TTS-driven positions and reset throttle
    this.ttsCharPositions.clear();
    this.lastTTSUpdateTime = 0;
    // Reset graceful stop flag
    this.gracefulStopRequested = false;
    this.gracefulStopCallback = null;
    // Clear sound state
    this.lastSoundTimes.clear();
    this.lastRevealedLengths.clear();

    // Notify subscribers that playback has stopped
    this.notifyCallbacks();
  }

  /**
   * Gracefully stop playback - waits for current speaker to finish their segment
   * @param callback Optional callback to invoke when graceful stop completes
   */
  gracefulStop(callback?: () => void): void {
    if (this.status !== 'playing') {
      // If not playing, just stop immediately
      this.stop();
      callback?.();
      return;
    }

    this.gracefulStopRequested = true;
    this.gracefulStopCallback = callback || null;

    // Check immediately if we can stop (no one is talking)
    const states = this.getCurrentStates();
    let anyoneTalking = false;
    for (const state of states.values()) {
      if (state.isTalking) {
        anyoneTalking = true;
        break;
      }
    }

    if (!anyoneTalking) {
      // No one is talking, stop immediately
      const cb = this.gracefulStopCallback;
      this.stop();
      cb?.();
    }
    // Otherwise, tick() will check and stop when the current speaker finishes
  }

  /**
   * Check if graceful stop has been requested
   */
  isGracefulStopRequested(): boolean {
    return this.gracefulStopRequested;
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

    // Clear cached states and rebuild
    this.cachedStates.clear();

    // Rebuild timeline cache if invalidated (scene changed)
    if (!this.timelinesCacheValid) {
      this.buildTimelinesCache();
    }

    // For each character, find their currently active timeline
    // (timelines are pre-sorted in buildTimelinesCache)
    for (const [characterId, timelines] of this.characterTimelinesCache) {
      const activeTimeline = this.findActiveTimeline(timelines, elapsed);
      if (activeTimeline) {
        this.cachedStates.set(characterId, this.getCharacterState(activeTimeline, elapsed));
      } else {
        // No active timeline - character is idle but still visible during playback
        this.cachedStates.set(characterId, {
          characterId,
          animation: 'idle',
          complementary: {},
          isTalking: false,
          revealedText: '',
          isActive: true, // Keep visible during playback
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
   * Note: timelines are pre-sorted by startDelay in buildTimelinesCache()
   */
  private findActiveTimeline(timelines: CharacterTimeline[], elapsed: number): CharacterTimeline | null {
    // Timelines are already sorted by startDelay (done once in buildTimelinesCache)
    // Find the timeline that is currently active
    for (const timeline of timelines) {
      const timelineStart = timeline.startDelay;
      const timelineEnd = timeline.startDelay + timeline.totalDuration;

      if (elapsed >= timelineStart && elapsed < timelineEnd) {
        return timeline;
      }
    }

    // If no timeline is currently active, check if we're past all timelines
    // Return the last completed timeline so we can show its final state
    for (let i = timelines.length - 1; i >= 0; i--) {
      const timeline = timelines[i];
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
   * In TTS-driven mode, uses character position from TTS instead of time-based calculation
   */
  getRevealedText(characterId: string): string {
    if (!this.scene) return '';

    const elapsed = this.getElapsedTime();

    // Find all timelines for this character and get the active one
    const characterTimelines = this.scene.timelines.filter(t => t.characterId === characterId);
    if (characterTimelines.length === 0) return '';

    const timeline = this.findActiveTimeline(characterTimelines, elapsed);
    if (!timeline) return '';

    // TTS-driven mode: use character position from TTS boundary events
    if (this.ttsDrivenMode && this.ttsCharPositions.has(characterId)) {
      const ttsPos = this.ttsCharPositions.get(characterId)!;
      // Add a small buffer (next word) for smoother sync
      const bufferPos = Math.min(ttsPos + 10, timeline.content.length);
      return timeline.content.substring(0, bufferPos);
    }

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
   * Get the current action text for a character (comic-style overlay)
   * Returns action text from current segment's actionText field
   */
  getActionText(characterId: string): string {
    if (!this.scene) return '';

    const elapsed = this.getElapsedTime();
    const characterTimelines = this.scene.timelines.filter(t => t.characterId === characterId);
    if (characterTimelines.length === 0) return '';

    const timeline = this.findActiveTimeline(characterTimelines, elapsed);
    if (!timeline) return '';

    const characterElapsed = elapsed - timeline.startDelay;
    if (characterElapsed < 0) return '';

    // Find current segment and return its action text
    let segmentStartTime = 0;
    for (const segment of timeline.segments) {
      const segmentEndTime = segmentStartTime + segment.duration;
      if (characterElapsed < segmentEndTime) {
        return segment.actionText || '';
      }
      segmentStartTime = segmentEndTime;
    }

    return '';
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

    const perfStart = performanceLogger.frameStart();
    const now = performance.now();
    const elapsed = now - this.startTime;

    // Throttle updates
    if (now - this.lastUpdateTime < this.updateThrottleMs) {
      this.animationFrameId = requestAnimationFrame(this.tick);
      return;
    }
    this.lastUpdateTime = now;

    // Track cache sizes for debugging
    performanceLogger.trackMapSize('cachedStates', this.cachedStates.size);
    performanceLogger.trackMapSize('characterTimelinesCache', this.characterTimelinesCache.size);
    performanceLogger.trackMapSize('postSpeakingCache', this.postSpeakingExpressionCache.size);
    performanceLogger.setRAFCallbacks(this.callbacks.size);

    // Check if scene is complete
    if (elapsed >= this.scene.sceneDuration) {
      this.status = 'complete';
      this.notifyCallbacks();
      performanceLogger.frameEnd(perfStart, 'PlaybackEngine:complete');
      return;
    }

    // Check for graceful stop request
    if (this.gracefulStopRequested) {
      const states = this.getCurrentStates();
      let anyoneTalking = false;
      for (const state of states.values()) {
        if (state.isTalking) {
          anyoneTalking = true;
          break;
        }
      }

      if (!anyoneTalking) {
        // No one is talking, complete the graceful stop
        const cb = this.gracefulStopCallback;
        performanceLogger.frameEnd(perfStart, 'PlaybackEngine:gracefulStop');
        this.stop();
        cb?.();
        return;
      }
    }

    // Play talking sounds for active speakers
    this.playTalkingSounds();

    // Notify callbacks with current state
    this.notifyCallbacks();

    performanceLogger.frameEnd(perfStart, 'PlaybackEngine:tick');
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
    
    // Before character's turn - still visible but not yet talking
    if (characterElapsed < 0) {
      return {
        characterId: timeline.characterId,
        animation: 'idle',
        complementary: {},
        isTalking: false,
        revealedText: '',
        isActive: true, // Keep visible during playback
        isComplete: false
      };
    }
    
    // After character's turn - finished speaking but still visible
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
        isActive: true, // Keep visible during playback
        isComplete: true
      };
    }
    
    // Find current segment
    const currentSegment = this.findCurrentSegment(timeline.segments, characterElapsed);

    // In TTS-driven mode, isTalking follows who TTS is currently speaking
    // This ensures bubble visibility syncs with actual speech, not animation timing
    const isTalking = this.ttsDrivenMode
      ? this.ttsCurrentSpeaker === timeline.characterId
      : (currentSegment.isTalking ?? false);

    return {
      characterId: timeline.characterId,
      animation: currentSegment.animation,
      complementary: this.buildComplementary(currentSegment),
      isTalking,
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

  /**
   * Play talking sounds for characters that are currently speaking
   * Sounds are played based on text reveal progress, not just time
   */
  private playTalkingSounds(): void {
    if (!this.talkingSoundsEnabled || !this.scene) return;

    const soundsService = getTalkingSoundsService();
    const now = performance.now();

    // Check each character with an active timeline
    for (const [characterId, timelines] of this.characterTimelinesCache) {
      const elapsed = this.getElapsedTime();
      const timeline = this.findActiveTimeline(timelines, elapsed);
      
      if (!timeline) continue;

      const characterElapsed = elapsed - timeline.startDelay;
      
      // Only play sounds when character is actively talking
      if (characterElapsed < 0 || characterElapsed >= timeline.totalDuration) continue;

      // Find current segment and check if it's a talking segment
      const currentSegment = this.findCurrentSegment(timeline.segments, characterElapsed);
      if (!currentSegment.isTalking) continue;

      // Get revealed text length
      const revealedText = this.getRevealedText(characterId);
      const currentLength = revealedText.length;
      const lastLength = this.lastRevealedLengths.get(characterId) ?? 0;
      const lastSoundTime = this.lastSoundTimes.get(characterId) ?? 0;

      // Play sound if text has advanced and enough time has passed
      if (currentLength > lastLength && (now - lastSoundTime) >= this.soundInterval) {
        // Skip sounds for whitespace and punctuation
        const newChar = revealedText.charAt(currentLength - 1);
        if (newChar && !/[\s.,!?;:'"\-—()[\]{}]/.test(newChar)) {
          soundsService.play(characterId);
          this.lastSoundTimes.set(characterId, now);
        }
        this.lastRevealedLengths.set(characterId, currentLength);
      }
    }
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

