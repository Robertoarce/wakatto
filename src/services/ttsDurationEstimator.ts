/**
 * TTS Duration Estimator
 *
 * Estimates how long text-to-speech will take to speak given text.
 * Used to synchronize animation timing with TTS playback.
 */

// Base estimate: ~350ms per word at normal TTS rate (approximately 170 words per minute)
const BASE_MS_PER_WORD = 350;

// Minimum duration to prevent too-fast animations
const MIN_DURATION_MS = 1000;

/**
 * Estimate TTS duration based on text and speech rate
 *
 * @param text - The text to be spoken
 * @param rate - TTS rate (0.8 = slow, 1.0 = normal, 1.3 = fast)
 * @returns Estimated duration in milliseconds
 */
export function estimateTTSDuration(text: string, rate: number = 1.0): number {
  if (!text || !text.trim()) {
    return MIN_DURATION_MS;
  }

  // Count words (split by whitespace)
  const words = text.trim().split(/\s+/).length;

  // Calculate base duration
  const baseDuration = words * BASE_MS_PER_WORD;

  // Adjust for rate (higher rate = shorter duration)
  // Rate 0.8 = 1.25x longer, Rate 1.3 = 0.77x shorter
  const adjustedDuration = Math.round(baseDuration / rate);

  // Ensure minimum duration
  return Math.max(adjustedDuration, MIN_DURATION_MS);
}

/**
 * Estimate TTS duration with additional padding for pauses
 *
 * @param text - The text to be spoken
 * @param rate - TTS rate
 * @param paddingPercent - Extra time as percentage (default 10%)
 * @returns Estimated duration with padding in milliseconds
 */
export function estimateTTSDurationWithPadding(
  text: string,
  rate: number = 1.0,
  paddingPercent: number = 10
): number {
  const baseDuration = estimateTTSDuration(text, rate);
  const padding = Math.round(baseDuration * (paddingPercent / 100));
  return baseDuration + padding;
}

/**
 * Calculate required animation speed (ms per character) to match TTS duration
 *
 * @param text - The text to animate
 * @param ttsDuration - Target TTS duration in milliseconds
 * @returns Milliseconds per character for animation
 */
export function calculateAnimationSpeed(text: string, ttsDuration: number): number {
  if (!text || text.length === 0) {
    return 60; // Default speed
  }
  return Math.round(ttsDuration / text.length);
}

/**
 * Get TTS rate value from voice pace setting
 */
export function paceToTTSRate(pace: 'slow' | 'normal' | 'fast'): number {
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
