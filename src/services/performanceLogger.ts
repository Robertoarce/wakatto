/**
 * Performance Logger
 * Tracks and logs performance metrics to identify FPS drops
 */

interface PerformanceStats {
  // Frame timing
  frameCount: number;
  avgFrameTime: number;
  maxFrameTime: number;

  // Memory (if available)
  heapUsed: number;
  heapTotal: number;

  // Counts
  activeAnimationLoops: number;
  activeCharacters: number;
  rafCallbacks: number;

  // Accumulation tracking
  mapSizes: Record<string, number>;
  arraySizes: Record<string, number>;
}

class PerformanceLogger {
  private enabled = false;
  private frameCount = 0;
  private frameTimes: number[] = [];
  private lastLogTime = 0;
  private logIntervalMs = 5000; // Log every 5 seconds

  // Tracking counters (components register themselves)
  private activeAnimationLoops = 0;
  private activeCharacters = 0;
  private rafCallbacks = 0;

  // Track sizes of data structures
  private mapSizes: Record<string, number> = {};
  private arraySizes: Record<string, number> = {};

  enable() {
    this.enabled = true;
    this.frameCount = 0;
    this.frameTimes = [];
    this.lastLogTime = performance.now();
    console.log('[PerfLogger] ========== PERFORMANCE LOGGING ENABLED ==========');
  }

  disable() {
    this.enabled = false;
    console.log('[PerfLogger] ========== PERFORMANCE LOGGING DISABLED ==========');
  }

  isEnabled() {
    return this.enabled;
  }

  // Call this at start of animation frame
  frameStart() {
    if (!this.enabled) return performance.now();
    return performance.now();
  }

  // Call this at end of animation frame
  frameEnd(startTime: number, source: string = 'unknown') {
    if (!this.enabled) return;

    const frameTime = performance.now() - startTime;
    this.frameTimes.push(frameTime);
    this.frameCount++;

    // Keep only last 60 frames
    if (this.frameTimes.length > 60) {
      this.frameTimes.shift();
    }

    // Log slow frames immediately
    if (frameTime > 50) {
      console.warn(`[PerfLogger] SLOW FRAME: ${frameTime.toFixed(1)}ms from ${source}`);
    }

    // Periodic logging
    const now = performance.now();
    if (now - this.lastLogTime > this.logIntervalMs) {
      this.logStats();
      this.lastLogTime = now;
    }
  }

  // Register/unregister animation loops
  registerAnimationLoop() {
    this.activeAnimationLoops++;
    if (this.enabled) {
      console.log(`[PerfLogger] Animation loop registered. Active: ${this.activeAnimationLoops}`);
    }
  }

  unregisterAnimationLoop() {
    this.activeAnimationLoops--;
    if (this.enabled) {
      console.log(`[PerfLogger] Animation loop unregistered. Active: ${this.activeAnimationLoops}`);
    }
  }

  // Track character count
  setActiveCharacters(count: number) {
    if (this.enabled && count !== this.activeCharacters) {
      console.log(`[PerfLogger] Active characters: ${count}`);
    }
    this.activeCharacters = count;
  }

  // Track RAF callback count
  setRAFCallbacks(count: number) {
    this.rafCallbacks = count;
  }

  // Track Map sizes
  trackMapSize(name: string, size: number) {
    const prev = this.mapSizes[name] || 0;
    this.mapSizes[name] = size;

    // Warn if growing
    if (this.enabled && size > prev && size > 10) {
      console.warn(`[PerfLogger] Map "${name}" growing: ${prev} -> ${size}`);
    }
  }

  // Track Array sizes
  trackArraySize(name: string, size: number) {
    const prev = this.arraySizes[name] || 0;
    this.arraySizes[name] = size;

    // Warn if growing significantly
    if (this.enabled && size > prev + 10 && size > 50) {
      console.warn(`[PerfLogger] Array "${name}" growing: ${prev} -> ${size}`);
    }
  }

  private logStats() {
    const avgFrameTime = this.frameTimes.length > 0
      ? this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
      : 0;

    const maxFrameTime = this.frameTimes.length > 0
      ? Math.max(...this.frameTimes)
      : 0;

    const fps = avgFrameTime > 0 ? 1000 / avgFrameTime : 0;

    // Get memory if available
    let heapUsed = 0;
    let heapTotal = 0;
    if ((performance as any).memory) {
      heapUsed = (performance as any).memory.usedJSHeapSize / 1024 / 1024;
      heapTotal = (performance as any).memory.totalJSHeapSize / 1024 / 1024;
    }

    console.log(`
[PerfLogger] ===== PERFORMANCE STATS =====
  FPS: ${fps.toFixed(1)} (avg frame: ${avgFrameTime.toFixed(1)}ms, max: ${maxFrameTime.toFixed(1)}ms)
  Memory: ${heapUsed.toFixed(1)}MB / ${heapTotal.toFixed(1)}MB
  Animation Loops: ${this.activeAnimationLoops}
  Characters: ${this.activeCharacters}
  RAF Callbacks: ${this.rafCallbacks}
  Maps: ${JSON.stringify(this.mapSizes)}
  Arrays: ${JSON.stringify(this.arraySizes)}
  Total Frames: ${this.frameCount}
====================================`);

    // Reset frame times for next period
    this.frameTimes = [];
  }
}

export const performanceLogger = new PerformanceLogger();

// Auto-enable in development
if (typeof window !== 'undefined') {
  (window as any).perfLogger = performanceLogger;
  console.log('[PerfLogger] Available as window.perfLogger - call perfLogger.enable() to start logging');
}
