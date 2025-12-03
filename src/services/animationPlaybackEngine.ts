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
  CharacterAnimationState
} from './animationOrchestration';
import {
  AnimationState,
  ComplementaryAnimation
} from '../components/CharacterDisplay3D';

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

  // ============================================
  // PUBLIC METHODS
  // ============================================

  /**
   * Start playing an orchestration scene
   */
  play(scene: OrchestrationScene): void {
    this.stop(); // Clean up any existing playback
    
    this.scene = scene;
    this.status = 'playing';
    this.startTime = performance.now();
    this.pausedAt = 0;
    
    console.log('[PlaybackEngine] Starting scene playback', {
      duration: scene.sceneDuration,
      characters: scene.timelines.map(t => t.characterId),
      nonSpeakers: Object.keys(scene.nonSpeakerBehavior)
    });
    
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
    
    console.log('[PlaybackEngine] Paused at', this.pausedAt, 'ms');
  }

  /**
   * Resume paused playback
   */
  resume(): void {
    if (this.status !== 'paused' || !this.scene) return;
    
    this.status = 'playing';
    this.startTime = performance.now() - this.pausedAt;
    
    console.log('[PlaybackEngine] Resumed from', this.pausedAt, 'ms');
    
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
    
    console.log('[PlaybackEngine] Stopped');
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
   */
  getCurrentStates(): Map<string, CharacterAnimationState> {
    const states = new Map<string, CharacterAnimationState>();
    
    if (!this.scene) return states;
    
    const elapsed = this.getElapsedTime();
    
    // Get states for speaking characters
    for (const timeline of this.scene.timelines) {
      states.set(timeline.characterId, this.getCharacterState(timeline, elapsed));
    }
    
    // Get states for non-speaking characters
    for (const [characterId, segments] of Object.entries(this.scene.nonSpeakerBehavior)) {
      states.set(characterId, this.getNonSpeakerState(characterId, segments, elapsed));
    }
    
    return states;
  }

  /**
   * Get revealed text for a specific character at current time
   */
  getRevealedText(characterId: string): string {
    if (!this.scene) return '';
    
    const timeline = this.scene.timelines.find(t => t.characterId === characterId);
    if (!timeline) return '';
    
    const elapsed = this.getElapsedTime();
    const characterElapsed = elapsed - timeline.startDelay;
    
    if (characterElapsed < 0) return '';
    if (characterElapsed >= timeline.totalDuration) return timeline.content;
    
    // Find current segment and calculate revealed text
    let segmentStartTime = 0;
    
    for (const segment of timeline.segments) {
      const segmentEndTime = segmentStartTime + segment.duration;
      
      if (characterElapsed < segmentEndTime) {
        // We're in this segment
        if (segment.textReveal) {
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
   * Subscribe to playback state changes
   */
  subscribe(callback: PlaybackCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
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
      console.log('[PlaybackEngine] Scene complete');
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
      return {
        characterId: timeline.characterId,
        animation: 'idle',
        complementary: { mouthState: 'smile' },
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
      speed: segment.complementary.speed
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

