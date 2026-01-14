/**
 * Bubble Debug Logging Configuration
 *
 * Set BUBBLE_DEBUG_ENABLED to true to enable detailed logging
 * of bubble rendering, playback timing, and text reveal.
 *
 * Set to false to disable all debug logs.
 */

export const BUBBLE_DEBUG_ENABLED = false; // <-- Toggle this to enable/disable (disabled to prevent console spam)

// Helper function that only logs when debug is enabled
export function bubbleDebugLog(
  category: string,
  message: string,
  data?: Record<string, any>
): void {
  if (!BUBBLE_DEBUG_ENABLED) return;

  const timestamp = performance.now().toFixed(1);
  console.log(`[${category}] ${timestamp}ms - ${message}`, data ?? "");
}

// Throttled version for high-frequency logs (e.g., tick loop)
let lastThrottledLog = 0;
const THROTTLE_MS = 200; // Only log every 200ms

export function bubbleDebugLogThrottled(
  category: string,
  message: string,
  data?: Record<string, any>
): void {
  if (!BUBBLE_DEBUG_ENABLED) return;

  const now = performance.now();
  if (now - lastThrottledLog < THROTTLE_MS) return;
  lastThrottledLog = now;

  bubbleDebugLog(category, message, data);
}
