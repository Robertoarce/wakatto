/**
 * Profiling Service
 * 
 * Provides timing and performance measurement utilities for identifying
 * bottlenecks in the AI response pipeline.
 * 
 * Usage:
 *   const profiler = getProfiler();
 *   const timer = profiler.start('operation_name');
 *   // ... do work ...
 *   timer.stop({ tokens: 500 }); // optional metadata
 *   
 *   // Get results
 *   const session = profiler.getSession();
 */

// Cross-platform high-resolution timing
// Uses performance.now() when available (web), falls back to Date.now() (React Native)
const getTimestamp = (): number => {
  // Check for performance API availability (avoid direct reference for TypeScript)
  const perf = typeof globalThis !== 'undefined' ? (globalThis as any).performance : undefined;
  if (perf && typeof perf.now === 'function') {
    return perf.now() as number;
  }
  return Date.now();
};

export interface ProfileMetadata {
  promptTokens?: number;
  responseTokens?: number;
  model?: string;
  characterCount?: number;
  error?: string;
  [key: string]: any;
}

export interface ProfileResult {
  operation: string;
  durationMs: number;
  startTime: number;
  endTime: number;
  metadata?: ProfileMetadata;
}

export interface ProfileSession {
  id: string;
  startTime: number;
  endTime?: number;
  totalDurationMs?: number;
  results: ProfileResult[];
  summary: ProfileSummary;
}

export interface ProfileSummary {
  totalMs: number;
  operations: {
    [key: string]: {
      count: number;
      totalMs: number;
      avgMs: number;
      minMs: number;
      maxMs: number;
    };
  };
  breakdown: {
    operation: string;
    durationMs: number;
    percentage: number;
  }[];
}

export interface Timer {
  stop: (metadata?: ProfileMetadata) => ProfileResult;
  elapsed: () => number;
}

// Operation names for consistent naming
export const PROFILE_OPS = {
  // Full message flow
  FULL_MESSAGE_FLOW: 'full_message_flow',
  
  // Auth operations
  AUTH_SESSION: 'auth_session',
  AUTH_GET_USER: 'auth_get_user',
  
  // Prompt building
  PROMPT_BUILD: 'prompt_build',
  PROMPT_BUILD_CHARACTER_PROFILES: 'prompt_build_character_profiles',
  PROMPT_BUILD_ANIMATION_INSTRUCTIONS: 'prompt_build_animation_instructions',
  
  // API calls
  EDGE_FUNCTION_CALL: 'edge_function_call',
  LLM_INFERENCE: 'llm_inference',
  
  // Response processing
  JSON_PARSE: 'json_parse',
  SCENE_PARSE: 'scene_parse',
  RESPONSE_VALIDATION: 'response_validation',
  
  // Database operations
  DB_SAVE_USER_MESSAGE: 'db_save_user_message',
  DB_SAVE_ASSISTANT_MESSAGE: 'db_save_assistant_message',
  DB_CREATE_CONVERSATION: 'db_create_conversation',
  DB_UPDATE_CONVERSATION: 'db_update_conversation',
  
  // Title generation
  TITLE_GENERATION: 'title_generation',
  
  // Animation
  ANIMATION_SETUP: 'animation_setup',
  FALLBACK_SCENE_CREATE: 'fallback_scene_create',
} as const;

export type ProfileOperation = typeof PROFILE_OPS[keyof typeof PROFILE_OPS];

class Profiler {
  private currentSession: ProfileSession | null = null;
  private sessionHistory: ProfileSession[] = [];
  private enabled: boolean = true;
  private listeners: ((session: ProfileSession) => void)[] = [];
  private maxHistorySize: number = 50;

  /**
   * Enable or disable profiling
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Start a new profiling session
   */
  startSession(id?: string): ProfileSession {
    // End previous session if exists
    if (this.currentSession) {
      this.endSession();
    }

    this.currentSession = {
      id: id || `session_${Date.now()}`,
      startTime: getTimestamp(),
      results: [],
      summary: this.createEmptySummary(),
    };

    return this.currentSession;
  }

  /**
   * End the current session and compute summary
   */
  endSession(): ProfileSession | null {
    if (!this.currentSession) return null;

    this.currentSession.endTime = getTimestamp();
    this.currentSession.totalDurationMs = 
      this.currentSession.endTime - this.currentSession.startTime;
    this.currentSession.summary = this.computeSummary(this.currentSession);

    // Add to history
    this.sessionHistory.push(this.currentSession);
    if (this.sessionHistory.length > this.maxHistorySize) {
      this.sessionHistory.shift();
    }

    // Notify listeners
    this.notifyListeners(this.currentSession);

    const session = this.currentSession;
    this.currentSession = null;
    return session;
  }

  /**
   * Start timing an operation
   */
  start(operation: ProfileOperation | string): Timer {
    const startTime = getTimestamp();

    return {
      stop: (metadata?: ProfileMetadata): ProfileResult => {
        const endTime = getTimestamp();
        const result: ProfileResult = {
          operation,
          durationMs: endTime - startTime,
          startTime,
          endTime,
          metadata,
        };

        if (this.enabled && this.currentSession) {
          this.currentSession.results.push(result);
        }

        return result;
      },
      elapsed: (): number => {
        return getTimestamp() - startTime;
      },
    };
  }

  /**
   * Time an async operation
   */
  async time<T>(
    operation: ProfileOperation | string,
    fn: () => Promise<T>,
    metadata?: ProfileMetadata
  ): Promise<T> {
    const timer = this.start(operation);
    try {
      const result = await fn();
      timer.stop(metadata);
      return result;
    } catch (error) {
      timer.stop({ ...metadata, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Time a sync operation
   */
  timeSync<T>(
    operation: ProfileOperation | string,
    fn: () => T,
    metadata?: ProfileMetadata
  ): T {
    const timer = this.start(operation);
    try {
      const result = fn();
      timer.stop(metadata);
      return result;
    } catch (error) {
      timer.stop({ ...metadata, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Get current session
   */
  getSession(): ProfileSession | null {
    return this.currentSession;
  }

  /**
   * Get session history
   */
  getHistory(): ProfileSession[] {
    return [...this.sessionHistory];
  }

  /**
   * Get the last completed session
   */
  getLastSession(): ProfileSession | null {
    return this.sessionHistory[this.sessionHistory.length - 1] || null;
  }

  /**
   * Add a listener for session completion
   */
  addListener(listener: (session: ProfileSession) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Clear all history
   */
  clearHistory(): void {
    this.sessionHistory = [];
  }

  /**
   * Estimate token count from text (rough approximation)
   * ~4 chars per token for English text
   */
  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private createEmptySummary(): ProfileSummary {
    return {
      totalMs: 0,
      operations: {},
      breakdown: [],
    };
  }

  private computeSummary(session: ProfileSession): ProfileSummary {
    const operations: ProfileSummary['operations'] = {};

    // Aggregate by operation
    for (const result of session.results) {
      if (!operations[result.operation]) {
        operations[result.operation] = {
          count: 0,
          totalMs: 0,
          avgMs: 0,
          minMs: Infinity,
          maxMs: 0,
        };
      }
      const op = operations[result.operation];
      op.count++;
      op.totalMs += result.durationMs;
      op.minMs = Math.min(op.minMs, result.durationMs);
      op.maxMs = Math.max(op.maxMs, result.durationMs);
      op.avgMs = op.totalMs / op.count;
    }

    // Fix Infinity for unused
    for (const key of Object.keys(operations)) {
      if (operations[key].minMs === Infinity) {
        operations[key].minMs = 0;
      }
    }

    // Calculate total from session duration or sum of operations
    const totalMs = session.totalDurationMs || 
      Object.values(operations).reduce((sum, op) => sum + op.totalMs, 0);

    // Create breakdown sorted by duration
    const breakdown = Object.entries(operations)
      .map(([operation, stats]) => ({
        operation,
        durationMs: stats.totalMs,
        percentage: totalMs > 0 ? (stats.totalMs / totalMs) * 100 : 0,
      }))
      .sort((a, b) => b.durationMs - a.durationMs);

    return {
      totalMs,
      operations,
      breakdown,
    };
  }

  private notifyListeners(session: ProfileSession): void {
    for (const listener of this.listeners) {
      try {
        listener(session);
      } catch (error) {
        console.error('[Profiler] Listener error:', error);
      }
    }
  }

  /**
   * Format session for console logging
   */
  formatSession(session: ProfileSession): string {
    const lines: string[] = [
      `\n╔══════════════════════════════════════════════════════════════╗`,
      `║  PROFILING SESSION: ${session.id.substring(0, 35).padEnd(35)}    ║`,
      `╠══════════════════════════════════════════════════════════════╣`,
      `║  Total Duration: ${(session.summary.totalMs).toFixed(2).padStart(10)}ms                            ║`,
      `╠══════════════════════════════════════════════════════════════╣`,
      `║  BREAKDOWN BY OPERATION                                      ║`,
      `╟──────────────────────────────────────────────────────────────╢`,
    ];

    for (const item of session.summary.breakdown) {
      const opName = item.operation.substring(0, 30).padEnd(30);
      const duration = item.durationMs.toFixed(2).padStart(10);
      const pct = item.percentage.toFixed(1).padStart(5);
      lines.push(`║  ${opName} ${duration}ms  ${pct}% ║`);
    }

    lines.push(`╚══════════════════════════════════════════════════════════════╝\n`);

    return lines.join('\n');
  }

  /**
   * Log session to console
   */
  logSession(session?: ProfileSession): void {
    const s = session || this.getLastSession();
    if (s) {
      console.log(this.formatSession(s));
    }
  }
}

// Singleton instance
let profilerInstance: Profiler | null = null;

/**
 * Get the global profiler instance
 */
export function getProfiler(): Profiler {
  if (!profilerInstance) {
    profilerInstance = new Profiler();
  }
  return profilerInstance;
}

/**
 * Quick profiling helper - wraps an async function with profiling
 */
export async function profile<T>(
  operation: ProfileOperation | string,
  fn: () => Promise<T>,
  metadata?: ProfileMetadata
): Promise<T> {
  return getProfiler().time(operation, fn, metadata);
}

/**
 * Quick sync profiling helper
 */
export function profileSync<T>(
  operation: ProfileOperation | string,
  fn: () => T,
  metadata?: ProfileMetadata
): T {
  return getProfiler().timeSync(operation, fn, metadata);
}

