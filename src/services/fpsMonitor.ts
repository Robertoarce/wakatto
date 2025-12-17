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
  private frameTimes: number[] = [];
  private lastTime = performance.now();
  private maxFrameHistory = 300; // Keep last 300 frames (~5 seconds at 60 FPS)
  private metricsCallback: ((metrics: FPSMetrics) => void) | null = null;
  private animationFrameId: number | null = null;

  /**
   * Start monitoring FPS
   */
  enable() {
    if (this.isEnabled) return;
    this.isEnabled = true;
    this.frameCount = 0;
    this.frameTimes = [];
    this.lastTime = performance.now();
    console.log('[FPSMonitor] Enabled - monitoring frame rate');
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
    console.log('[FPSMonitor] Disabled');
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

    this.frameTimes.push(fps);

    // Keep only recent frame times
    if (this.frameTimes.length > this.maxFrameHistory) {
      this.frameTimes.shift();
    }

    this.frameCount++;

    // Update metrics every 30 frames (~0.5 seconds at 60 FPS)
    if (this.frameCount % 30 === 0) {
      const metrics = this.calculateMetrics();
      if (this.metricsCallback) {
        this.metricsCallback(metrics);
      }

      // Log to console every 300 frames (~5 seconds at 60 FPS)
      if (this.frameCount % 300 === 0) {
        console.log(
          `[FPSMonitor] Current: ${metrics.currentFPS.toFixed(1)} FPS | ` +
          `Avg: ${metrics.averageFPS.toFixed(1)} | ` +
          `Min: ${metrics.minFPS.toFixed(1)} | ` +
          `Max: ${metrics.maxFPS.toFixed(1)} | ` +
          `Dropped: ${metrics.droppedFrames}`
        );
      }
    }

    this.animationFrameId = requestAnimationFrame(this.tick);
  };

  /**
   * Calculate FPS metrics from collected frame times
   */
  private calculateMetrics(): FPSMetrics {
    const currentFPS = this.frameTimes.length > 0
      ? this.frameTimes[this.frameTimes.length - 1]
      : 0;

    const averageFPS = this.frameTimes.length > 0
      ? this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
      : 0;

    const maxFPS = this.frameTimes.length > 0
      ? Math.max(...this.frameTimes)
      : 0;

    const minFPS = this.frameTimes.length > 0
      ? Math.min(...this.frameTimes)
      : 0;

    const droppedFrames = this.frameTimes.filter(fps => fps < 30).length;

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
