/**
 * Hybrid Orchestration Service
 *
 * Intelligently switches between single-call and multi-call orchestration
 * based on configuration, fallback logic, and runtime conditions.
 *
 * FEATURES:
 * - Automatic fallback from single-call to multi-call on failure
 * - Configurable default mode
 * - Performance monitoring
 * - Cost tracking
 * - A/B testing support
 */

import {
  generateMultiCharacterResponses,
  generateSingleCharacterResponse,
  ConversationMessage,
  CharacterResponse
} from './multiCharacterConversation';
import {
  generateSingleCallOrchestration,
  OrchestrationConfig,
  estimateCostComparison
} from './singleCallOrchestration';

export type OrchestrationMode = 'single-call' | 'multi-call' | 'auto';

export interface HybridConfig {
  defaultMode: OrchestrationMode;
  enableFallback: boolean; // Fallback to multi-call if single-call fails
  enableCostTracking: boolean;
  enablePerformanceTracking: boolean;
  singleCallConfig?: Partial<OrchestrationConfig>;
}

const DEFAULT_HYBRID_CONFIG: HybridConfig = {
  defaultMode: 'single-call',
  enableFallback: true,
  enableCostTracking: true,
  enablePerformanceTracking: true,
  singleCallConfig: {
    maxResponders: 3,
    includeGestures: true,
    includeInterruptions: true,
    verbosity: 'balanced'
  }
};

interface PerformanceMetrics {
  mode: 'single-call' | 'multi-call';
  responseTime: number; // milliseconds
  characterCount: number;
  responseCount: number;
  success: boolean;
  error?: string;
  timestamp: number;
}

// Global metrics storage (in production, use proper analytics)
const metrics: PerformanceMetrics[] = [];

/**
 * Main entry point for hybrid orchestration
 *
 * Automatically chooses between single-call and multi-call based on config
 */
export async function generateHybridResponse(
  userMessage: string,
  selectedCharacters: string[],
  messageHistory: ConversationMessage[],
  config: Partial<HybridConfig> = {}
): Promise<CharacterResponse[]> {
  const finalConfig = { ...DEFAULT_HYBRID_CONFIG, ...config };
  const startTime = Date.now();

  console.log(`[Hybrid] Starting orchestration in ${finalConfig.defaultMode} mode`);

  // Handle single character separately (no orchestration needed)
  if (selectedCharacters.length === 1) {
    return handleSingleCharacter(userMessage, selectedCharacters[0], messageHistory);
  }

  // Determine which mode to use
  const mode = determineOrchestrationMode(finalConfig, selectedCharacters);

  try {
    let responses: CharacterResponse[];

    if (mode === 'single-call') {
      // Try single-call orchestration
      responses = await attemptSingleCallOrchestration(
        userMessage,
        selectedCharacters,
        messageHistory,
        finalConfig
      );
    } else {
      // Use multi-call orchestration
      responses = await generateMultiCharacterResponses(
        userMessage,
        selectedCharacters,
        messageHistory
      );
    }

    // Track successful performance
    if (finalConfig.enablePerformanceTracking) {
      trackPerformance({
        mode,
        responseTime: Date.now() - startTime,
        characterCount: selectedCharacters.length,
        responseCount: responses.length,
        success: true,
        timestamp: Date.now()
      });
    }

    console.log(`[Hybrid] Successfully generated ${responses.length} responses in ${mode} mode`);
    return responses;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Hybrid] Error in ${mode} mode:`, errorMessage);

    // Track failed attempt
    if (finalConfig.enablePerformanceTracking) {
      trackPerformance({
        mode,
        responseTime: Date.now() - startTime,
        characterCount: selectedCharacters.length,
        responseCount: 0,
        success: false,
        error: errorMessage,
        timestamp: Date.now()
      });
    }

    // Attempt fallback if enabled and we were using single-call
    if (finalConfig.enableFallback && mode === 'single-call') {
      console.log('[Hybrid] Falling back to multi-call mode');
      return attemptMultiCallFallback(
        userMessage,
        selectedCharacters,
        messageHistory,
        finalConfig,
        startTime
      );
    }

    // No fallback available or fallback disabled
    throw error;
  }
}

/**
 * Attempt single-call orchestration
 */
async function attemptSingleCallOrchestration(
  userMessage: string,
  selectedCharacters: string[],
  messageHistory: ConversationMessage[],
  config: HybridConfig
): Promise<CharacterResponse[]> {
  console.log('[Hybrid] Attempting single-call orchestration');

  return await generateSingleCallOrchestration(
    userMessage,
    selectedCharacters,
    messageHistory,
    config.singleCallConfig
  );
}

/**
 * Fallback to multi-call orchestration
 */
async function attemptMultiCallFallback(
  userMessage: string,
  selectedCharacters: string[],
  messageHistory: ConversationMessage[],
  config: HybridConfig,
  originalStartTime: number
): Promise<CharacterResponse[]> {
  const fallbackStartTime = Date.now();

  try {
    const responses = await generateMultiCharacterResponses(
      userMessage,
      selectedCharacters,
      messageHistory
    );

    // Track successful fallback
    if (config.enablePerformanceTracking) {
      trackPerformance({
        mode: 'multi-call',
        responseTime: Date.now() - fallbackStartTime,
        characterCount: selectedCharacters.length,
        responseCount: responses.length,
        success: true,
        timestamp: Date.now()
      });
    }

    console.log('[Hybrid] Fallback to multi-call successful');
    return responses;

  } catch (fallbackError) {
    const errorMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
    console.error('[Hybrid] Fallback also failed:', errorMessage);

    // Track failed fallback
    if (config.enablePerformanceTracking) {
      trackPerformance({
        mode: 'multi-call',
        responseTime: Date.now() - fallbackStartTime,
        characterCount: selectedCharacters.length,
        responseCount: 0,
        success: false,
        error: errorMessage,
        timestamp: Date.now()
      });
    }

    throw new Error(`Both single-call and multi-call orchestration failed. Original error: ${errorMessage}`);
  }
}

/**
 * Handle single character (no orchestration needed)
 */
async function handleSingleCharacter(
  userMessage: string,
  characterId: string,
  messageHistory: ConversationMessage[]
): Promise<CharacterResponse[]> {
  console.log('[Hybrid] Single character mode, skipping orchestration');

  const content = await generateSingleCharacterResponse(
    userMessage,
    characterId,
    messageHistory
  );

  return [{
    characterId,
    content,
    isInterruption: false,
    isReaction: false
  }];
}

/**
 * Determine which orchestration mode to use
 */
function determineOrchestrationMode(
  config: HybridConfig,
  selectedCharacters: string[]
): 'single-call' | 'multi-call' {
  if (config.defaultMode !== 'auto') {
    return config.defaultMode;
  }

  // Auto mode: Choose based on conditions

  // For 2 characters, prefer single-call (simpler, faster)
  if (selectedCharacters.length === 2) {
    return 'single-call';
  }

  // For 3+ characters, check recent success rates
  const recentMetrics = getRecentMetrics(20); // Last 20 calls
  const singleCallSuccessRate = calculateSuccessRate(recentMetrics, 'single-call');

  // If single-call success rate is high, use it
  if (singleCallSuccessRate > 0.8) {
    return 'single-call';
  }

  // Otherwise, use multi-call for reliability
  return 'multi-call';
}

/**
 * Track performance metrics
 */
function trackPerformance(metric: PerformanceMetrics): void {
  metrics.push(metric);

  // Keep only last 100 metrics
  if (metrics.length > 100) {
    metrics.shift();
  }

  console.log(`[Hybrid] Tracked metric: ${metric.mode} - ${metric.success ? 'SUCCESS' : 'FAILED'} - ${metric.responseTime}ms`);
}

/**
 * Get recent metrics
 */
function getRecentMetrics(count: number): PerformanceMetrics[] {
  return metrics.slice(-count);
}

/**
 * Calculate success rate for a mode
 */
function calculateSuccessRate(
  metrics: PerformanceMetrics[],
  mode: 'single-call' | 'multi-call'
): number {
  const modeMetrics = metrics.filter(m => m.mode === mode);
  if (modeMetrics.length === 0) return 1.0; // Assume success if no data

  const successCount = modeMetrics.filter(m => m.success).length;
  return successCount / modeMetrics.length;
}

/**
 * Get performance statistics
 */
export function getPerformanceStats(): {
  singleCall: { successRate: number; avgResponseTime: number; count: number };
  multiCall: { successRate: number; avgResponseTime: number; count: number };
  totalCalls: number;
} {
  const allMetrics = getRecentMetrics(100);

  const singleCallMetrics = allMetrics.filter(m => m.mode === 'single-call');
  const multiCallMetrics = allMetrics.filter(m => m.mode === 'multi-call');

  return {
    singleCall: {
      successRate: calculateSuccessRate(allMetrics, 'single-call'),
      avgResponseTime: calculateAvgResponseTime(singleCallMetrics),
      count: singleCallMetrics.length
    },
    multiCall: {
      successRate: calculateSuccessRate(allMetrics, 'multi-call'),
      avgResponseTime: calculateAvgResponseTime(multiCallMetrics),
      count: multiCallMetrics.length
    },
    totalCalls: allMetrics.length
  };
}

/**
 * Calculate average response time
 */
function calculateAvgResponseTime(metrics: PerformanceMetrics[]): number {
  if (metrics.length === 0) return 0;

  const sum = metrics.reduce((acc, m) => acc + m.responseTime, 0);
  return Math.round(sum / metrics.length);
}

/**
 * Get cost comparison for given usage
 */
export function getCostComparison(
  conversationsPerDay: number,
  avgCharactersSelected: number,
  avgResponsesPerConversation: number
): {
  singleCallCostPerDay: number;
  multiCallCostPerDay: number;
  savingsPerDay: number;
  savingsPerMonth: number;
  savingsPerYear: number;
} {
  const estimate = estimateCostComparison(avgCharactersSelected, avgResponsesPerConversation);

  const singleCallCostPerDay = conversationsPerDay * estimate.singleCall;
  const multiCallCostPerDay = conversationsPerDay * estimate.multiCall;
  const savingsPerDay = multiCallCostPerDay - singleCallCostPerDay;

  return {
    singleCallCostPerDay,
    multiCallCostPerDay,
    savingsPerDay,
    savingsPerMonth: savingsPerDay * 30,
    savingsPerYear: savingsPerDay * 365
  };
}

/**
 * Export metrics for analysis
 */
export function exportMetrics(): PerformanceMetrics[] {
  return [...metrics];
}

/**
 * Reset metrics (useful for testing)
 */
export function resetMetrics(): void {
  metrics.length = 0;
  console.log('[Hybrid] Metrics reset');
}

/**
 * Check if hybrid orchestration is ready
 */
export function isHybridOrchestrationReady(): boolean {
  return true; // Always ready
}
