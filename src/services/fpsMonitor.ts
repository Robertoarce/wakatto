/**
 * FPS Monitor Service
 *
 * Tracks rendering performance and frame rates.
 * Helps identify performance bottlenecks with accessories and 3D rendering.
 */

export interface FPSMetrics {
  currentFPS: number;
  averageFPS: number;
  maxFPS: number;
  minFPS: number;
  frameCount: number;
  droppedFrames: number; // Frames below 30 FPS
}

class FPSMonitor {
  private isEnabled = false;
  private frameCount = 0;
  // Use circular buffer instead of array shift (O(1) vs O(n))
  private frameTimes: Float32Array;
  private frameTimesIndex = 0;
  private frameTimesCount = 0;
  private lastTime = performance.now();
  private maxFrameHistory = 300; // Keep last 300 frames (~5 seconds at 60 FPS)
  private metricsCallback: ((metrics: FPSMetrics) => void) | null = null;
  private animationFrameId: number | null = null;

  constructor() {
    this.frameTimes = new Float32Array(this.maxFrameHistory);
  }

  /**
   * Start monitoring FPS
   */
  enable() {
    if (this.isEnabled) return;
    this.isEnabled = true;
    this.frameCount = 0;
    this.frameTimesIndex = 0;
    this.frameTimesCount = 0;
    this.frameTimes.fill(0);
    this.lastTime = performance.now();
    this.tick();
  }

  /**
   * Stop monitoring FPS
   */
  disable() {
    if (!this.isEnabled) return;
    this.isEnabled = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Register callback to receive metrics updates
   */
  onMetrics(callback: (metrics: FPSMetrics) => void) {
    this.metricsCallback = callback;
  }

  /**
   * Get current FPS metrics
   */
  getMetrics(): FPSMetrics {
    const metrics = this.calculateMetrics();
    return metrics;
  }

  /**
   * Internal tick function - called each frame
   */
  private tick = () => {
    if (!this.isEnabled) return;

    const now = performance.now();
    const deltaTime = now - this.lastTime;
    this.lastTime = now;

    // Calculate FPS from delta time (avoid division by zero)
    const fps = deltaTime > 0 ? 1000 / deltaTime : 60;

    // Use circular buffer (O(1) instead of O(n) shift)
    this.frameTimes[this.frameTimesIndex] = fps;
    this.frameTimesIndex = (this.frameTimesIndex + 1) % this.maxFrameHistory;
    if (this.frameTimesCount < this.maxFrameHistory) {
      this.frameTimesCount++;
    }

    this.frameCount++;

    // Update metrics every 30 frames (~0.5 seconds at 60 FPS)
    if (this.frameCount % 30 === 0 && this.metricsCallback) {
      const metrics = this.calculateMetrics();
      this.metricsCallback(metrics);
    }

    this.animationFrameId = requestAnimationFrame(this.tick);
  };

  /**
   * Calculate FPS metrics from collected frame times
   * Uses circular buffer for O(1) insertion
   */
  private calculateMetrics(): FPSMetrics {
    if (this.frameTimesCount === 0) {
      return {
        currentFPS: 0,
        averageFPS: 0,
        maxFPS: 0,
        minFPS: 0,
        frameCount: this.frameCount,
        droppedFrames: 0,
      };
    }

    // Get most recent FPS (previous index in circular buffer)
    const prevIndex = (this.frameTimesIndex - 1 + this.maxFrameHistory) % this.maxFrameHistory;
    const currentFPS = this.frameTimes[prevIndex];

    // Calculate stats over the circular buffer
    let sum = 0;
    let maxFPS = -Infinity;
    let minFPS = Infinity;
    let droppedFrames = 0;

    for (let i = 0; i < this.frameTimesCount; i++) {
      const fps = this.frameTimes[i];
      sum += fps;
      if (fps > maxFPS) maxFPS = fps;
      if (fps < minFPS) minFPS = fps;
      if (fps < 30) droppedFrames++;
    }

    const averageFPS = sum / this.frameTimesCount;

    return {
      currentFPS,
      averageFPS,
      maxFPS,
      minFPS,
      frameCount: this.frameCount,
      droppedFrames,
    };
  }

  /**
   * Get formatted FPS string for display
   */
  getFormattedFPS(): string {
    const metrics = this.getMetrics();
    return `${metrics.currentFPS.toFixed(1)} FPS (Avg: ${metrics.averageFPS.toFixed(1)})`;
  }
}

// Export singleton instance
export const fpsMonitor = new FPSMonitor();
