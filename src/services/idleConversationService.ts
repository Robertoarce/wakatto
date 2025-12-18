/**
 * Idle Conversation Service
 *
 * Manages "secret" character-to-character conversations when the user is inactive.
 * Characters talk to each other, face each other, and pretend nothing happened when
 * the user returns.
 */

import { OrchestrationScene, CharacterTimeline, AnimationSegment } from './animationOrchestration';
import { AnimationState } from '../components/CharacterDisplay3D';

// ============================================
// TYPE DEFINITIONS
// ============================================

export type IdleConversationState =
  | 'ACTIVE'              // User is interacting
  | 'IDLE_WAITING'        // Timer counting down to first conversation
  | 'IDLE_CONVERSATION_1' // First idle conversation playing
  | 'IDLE_COOLDOWN'       // 2 minute wait between conversations
  | 'IDLE_CONVERSATION_2' // Second idle conversation playing
  | 'IDLE_DONE';          // No more conversations, just idle animations

export interface IdleConversationConfig {
  enabled?: boolean;              // Enable/disable idle conversations (default: false)
  inactivityTimeout: number;      // Ms before first conversation (default: 10000)
  cooldownDuration: number;       // Ms between conversations (default: 120000)
  maxConversations: number;       // Max conversations per session (default: 2)
}

export interface IdleConversationCallbacks {
  onStateChange: (state: IdleConversationState) => void;
  onConversationStart: (scene: OrchestrationScene) => Promise<void>;
  onConversationComplete: () => void;
  onUserReturnInterruption: (scene: OrchestrationScene) => void;
}

// ============================================
// DEFAULT CONFIG
// ============================================

const DEFAULT_CONFIG: IdleConversationConfig = {
  enabled: false,             // DISABLED by default (will be enabled later)
  inactivityTimeout: 10000,   // 10 seconds
  cooldownDuration: 120000,   // 2 minutes
  maxConversations: 2,
};

// ============================================
// INTERRUPTION PHRASES
// ============================================

const INTERRUPTION_PHRASES = [
  "Shh! The user is back!",
  "Quick, act natural - they're typing!",
  "*whispers* Play it cool, they're here!",
  "Oh! We weren't talking about anything...",
  "Shhh! Act like nothing happened!",
  "Quiet! The human has returned!",
  "*clears throat* Ah, welcome back!",
  "Psst! Stop talking, they're here!",
];

// ============================================
// IDLE CONVERSATION MANAGER
// ============================================

export class IdleConversationManager {
  private state: IdleConversationState = 'ACTIVE';
  private lastActivityTime: number = Date.now();
  private inactivityTimerId: NodeJS.Timeout | null = null;
  private cooldownTimerId: NodeJS.Timeout | null = null;
  private conversationCount: number = 0;
  private selectedCharacters: string[];
  private callbacks: IdleConversationCallbacks;
  private config: IdleConversationConfig;
  private isStarted: boolean = false;
  private conversationInProgress: boolean = false;

  constructor(
    selectedCharacters: string[],
    callbacks: IdleConversationCallbacks,
    config: Partial<IdleConversationConfig> = {}
  ) {
    this.selectedCharacters = selectedCharacters;
    this.callbacks = callbacks;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get current state
   */
  getState(): IdleConversationState {
    return this.state;
  }

  /**
   * Get conversation count
   */
  getConversationCount(): number {
    return this.conversationCount;
  }

  /**
   * Check if a conversation is currently playing
   */
  isConversationPlaying(): boolean {
    return this.conversationInProgress;
  }

  /**
   * Record user activity (resets timers)
   */
  recordUserActivity(): void {
    this.lastActivityTime = Date.now();

    // If in any waiting state, reset to ACTIVE
    if (this.state === 'IDLE_WAITING' || this.state === 'IDLE_COOLDOWN') {
      this.transitionTo('ACTIVE');
    }

    // Restart inactivity timer if we haven't maxed out conversations
    if (this.isStarted && this.conversationCount < this.config.maxConversations &&
        this.state !== 'IDLE_CONVERSATION_1' && this.state !== 'IDLE_CONVERSATION_2') {
      this.startInactivityTimer();
    }
  }

  /**
   * Handle user typing - triggers interruption if in conversation
   * Returns true if an interruption was triggered
   */
  handleUserTyping(): boolean {
    // If in an active conversation, trigger interruption
    if (this.state === 'IDLE_CONVERSATION_1' || this.state === 'IDLE_CONVERSATION_2') {
      // Generate and play interruption scene
      const interruptionScene = this.generateUserReturnInterruption();
      this.callbacks.onUserReturnInterruption(interruptionScene);

      // Transition back to active
      this.conversationInProgress = false;
      this.transitionTo('ACTIVE');

      // Don't restart timers - wait for next recordUserActivity call
      return true;
    }

    // Otherwise just record activity
    this.recordUserActivity();
    return false;
  }

  /**
   * Start monitoring for inactivity
   */
  start(): void {
    if (this.isStarted) return;
    if (this.selectedCharacters.length < 2) return;

    this.isStarted = true;
    this.lastActivityTime = Date.now();

    // Start inactivity timer if we haven't maxed out conversations
    if (this.conversationCount < this.config.maxConversations) {
      this.startInactivityTimer();
    }
  }

  /**
   * Stop and reset
   */
  stop(): void {
    this.isStarted = false;
    this.clearTimers();
    this.conversationInProgress = false;
  }

  /**
   * Reset the manager (for new conversation or character changes)
   */
  reset(): void {
    this.stop();
    this.conversationCount = 0;
    this.transitionTo('ACTIVE');
  }

  /**
   * Fully destroy the manager and clean up all resources
   */
  destroy(): void {
    this.stop();
    this.conversationCount = 0;
    this.selectedCharacters = [];
    // Clear any references that could cause memory leaks
    this.callbacks = {
      onStateChange: () => {},
      onConversationStart: async () => {},
      onConversationComplete: () => {},
      onUserReturnInterruption: () => {},
    };
  }

  /**
   * Update characters (when selection changes)
   */
  updateCharacters(characters: string[]): void {
    const hadEnoughCharacters = this.selectedCharacters.length >= 2;
    this.selectedCharacters = characters;
    const hasEnoughCharacters = characters.length >= 2;

    // If we now have enough characters and didn't before, start
    if (!hadEnoughCharacters && hasEnoughCharacters && this.isStarted) {
      this.reset();
      this.start();
    }

    // If we no longer have enough characters, stop
    if (hadEnoughCharacters && !hasEnoughCharacters) {
      this.stop();
    }
  }

  /**
   * Mark current conversation as complete
   */
  onConversationComplete(): void {
    if (!this.conversationInProgress) return;

    this.conversationInProgress = false;
    this.conversationCount++;

    // Notify callback
    this.callbacks.onConversationComplete();

    // Check if we should start cooldown for another conversation
    if (this.conversationCount < this.config.maxConversations) {
      this.transitionTo('IDLE_COOLDOWN');
      this.startCooldownTimer();
    } else {
      // We're done with all conversations
      this.transitionTo('IDLE_DONE');
    }
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private transitionTo(newState: IdleConversationState): void {
    if (this.state === newState) return;
    this.state = newState;
    this.callbacks.onStateChange(newState);
  }

  private clearTimers(): void {
    if (this.inactivityTimerId) {
      clearTimeout(this.inactivityTimerId);
      this.inactivityTimerId = null;
    }
    if (this.cooldownTimerId) {
      clearTimeout(this.cooldownTimerId);
      this.cooldownTimerId = null;
    }
  }

  private startInactivityTimer(): void {
    this.clearTimers();

    this.transitionTo('IDLE_WAITING');

    this.inactivityTimerId = setTimeout(() => {
      if (this.isStarted && this.conversationCount < this.config.maxConversations) {
        this.triggerIdleConversation();
      }
    }, this.config.inactivityTimeout);
  }

  private startCooldownTimer(): void {
    this.clearTimers();

    this.cooldownTimerId = setTimeout(() => {
      if (this.isStarted && this.conversationCount < this.config.maxConversations) {
        this.triggerIdleConversation();
      }
    }, this.config.cooldownDuration);
  }

  /**
   * Manually trigger an idle conversation (for testing)
   */
  async triggerIdleConversation(): Promise<void> {
    if (this.conversationInProgress) return;
    if (this.selectedCharacters.length < 2) return;

    const conversationNumber = this.conversationCount + 1;

    // Update state
    this.transitionTo(
      conversationNumber === 1 ? 'IDLE_CONVERSATION_1' : 'IDLE_CONVERSATION_2'
    );
    this.conversationInProgress = true;

    // Generate and start conversation via callback
    // The callback is responsible for calling onConversationComplete when done
    try {
      // Import dynamically to avoid circular dependency
      const { generateIdleConversationScene } = await import('./idleConversationPrompts');
      const scene = await generateIdleConversationScene(
        this.selectedCharacters,
        conversationNumber
      );

      await this.callbacks.onConversationStart(scene);
    } catch (error) {
      console.error('[IdleConv] Error generating idle conversation:', error);
      this.conversationInProgress = false;
      this.transitionTo('ACTIVE');
    }
  }

  /**
   * Generate a pre-built interruption scene (no API call)
   */
  private generateUserReturnInterruption(): OrchestrationScene {
    // Pick random character to deliver the interruption
    const speakerIndex = Math.floor(Math.random() * this.selectedCharacters.length);
    const speakerId = this.selectedCharacters[speakerIndex];
    const phrase = INTERRUPTION_PHRASES[Math.floor(Math.random() * INTERRUPTION_PHRASES.length)];

    // Build speaker timeline
    const speakerTimeline: CharacterTimeline = {
      characterId: speakerId,
      content: phrase,
      totalDuration: 2500,
      startDelay: 0,
      segments: [
        {
          animation: 'surprise_jump' as AnimationState,
          duration: 500,
          isTalking: false,
          complementary: { lookDirection: 'center' }
        },
        {
          animation: 'talking' as AnimationState,
          duration: 2000,
          isTalking: true,
          textReveal: { startIndex: 0, endIndex: phrase.length },
          complementary: {
            lookDirection: 'center',
            mouthState: 'open',
            eyeState: 'open'
          }
        }
      ]
    };

    // Other characters: look surprised/nervous
    const otherTimelines: CharacterTimeline[] = this.selectedCharacters
      .filter(id => id !== speakerId)
      .map(charId => ({
        characterId: charId,
        content: '',
        totalDuration: 2500,
        startDelay: 0,
        segments: [{
          animation: 'nervous' as AnimationState,
          duration: 2500,
          isTalking: false,
          complementary: {
            lookDirection: 'center',
            eyeState: 'open',
            eyebrowState: 'raised'
          }
        }]
      }));

    return {
      timelines: [speakerTimeline, ...otherTimelines],
      sceneDuration: 2500,
      nonSpeakerBehavior: {}
    };
  }
}

// ============================================
// SINGLETON MANAGEMENT
// ============================================

let idleConversationManager: IdleConversationManager | null = null;

export function getIdleConversationManager(): IdleConversationManager | null {
  return idleConversationManager;
}

export function initIdleConversationManager(
  characters: string[],
  callbacks: IdleConversationCallbacks,
  config?: Partial<IdleConversationConfig>
): IdleConversationManager {
  // Destroy existing manager if any
  if (idleConversationManager) {
    idleConversationManager.stop();
  }

  idleConversationManager = new IdleConversationManager(characters, callbacks, config);
  return idleConversationManager;
}

export function destroyIdleConversationManager(): void {
  if (idleConversationManager) {
    idleConversationManager.destroy();
    idleConversationManager = null;
  }
}
