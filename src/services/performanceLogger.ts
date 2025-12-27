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

// Component lifecycle tracking
interface ComponentTracker {
  mounted: number;
  unmounted: number;
  renderCount: number;
}

class MemoryDebugger {
  private enabled = true; // Always enabled for debugging
  private componentTrackers: Map<string, ComponentTracker> = new Map();
  private intervalRefs: Map<string, NodeJS.Timeout[]> = new Map();
  private timeoutRefs: Map<string, NodeJS.Timeout[]> = new Map();
  private rafRefs: Map<string, number[]> = new Map();
  private lastMemoryCheck = 0;
  private memoryHistory: number[] = [];

  // Track component mount/unmount
  trackMount(componentName: string) {
    const tracker = this.componentTrackers.get(componentName) || { mounted: 0, unmounted: 0, renderCount: 0 };
    tracker.mounted++;
    this.componentTrackers.set(componentName, tracker);
    console.log(`[MEM] 🟢 MOUNT: ${componentName} (total mounts: ${tracker.mounted}, unmounts: ${tracker.unmounted}, active: ${tracker.mounted - tracker.unmounted})`);
    this.checkForLeaks(componentName, tracker);
  }

  trackUnmount(componentName: string) {
    const tracker = this.componentTrackers.get(componentName) || { mounted: 0, unmounted: 0, renderCount: 0 };
    tracker.unmounted++;
    this.componentTrackers.set(componentName, tracker);
    console.log(`[MEM] 🔴 UNMOUNT: ${componentName} (total mounts: ${tracker.mounted}, unmounts: ${tracker.unmounted}, active: ${tracker.mounted - tracker.unmounted})`);
  }

  trackRender(componentName: string) {
    const tracker = this.componentTrackers.get(componentName) || { mounted: 0, unmounted: 0, renderCount: 0 };
    tracker.renderCount++;
    this.componentTrackers.set(componentName, tracker);
    // Only log every 10th render to reduce noise
    if (tracker.renderCount % 10 === 0) {
      console.log(`[MEM] 🔄 RENDER #${tracker.renderCount}: ${componentName}`);
    }
  }

  // Track intervals
  trackInterval(owner: string, intervalId: NodeJS.Timeout) {
    const refs = this.intervalRefs.get(owner) || [];
    refs.push(intervalId);
    this.intervalRefs.set(owner, refs);
    console.log(`[MEM] ⏰ INTERVAL SET: ${owner} (active intervals: ${refs.length})`);
  }

  trackIntervalClear(owner: string, intervalId: NodeJS.Timeout) {
    const refs = this.intervalRefs.get(owner) || [];
    const idx = refs.indexOf(intervalId);
    if (idx > -1) refs.splice(idx, 1);
    this.intervalRefs.set(owner, refs);
    console.log(`[MEM] ⏰ INTERVAL CLEAR: ${owner} (remaining: ${refs.length})`);
  }

  // Track timeouts
  trackTimeout(owner: string, timeoutId: NodeJS.Timeout) {
    const refs = this.timeoutRefs.get(owner) || [];
    refs.push(timeoutId);
    this.timeoutRefs.set(owner, refs);
    if (refs.length > 5) {
      console.warn(`[MEM] ⚠️ MANY TIMEOUTS: ${owner} has ${refs.length} active timeouts!`);
    }
  }

  trackTimeoutClear(owner: string, timeoutId: NodeJS.Timeout) {
    const refs = this.timeoutRefs.get(owner) || [];
    const idx = refs.indexOf(timeoutId);
    if (idx > -1) refs.splice(idx, 1);
    this.timeoutRefs.set(owner, refs);
  }

  // Track RAF
  trackRAF(owner: string, rafId: number) {
    const refs = this.rafRefs.get(owner) || [];
    refs.push(rafId);
    this.rafRefs.set(owner, refs);
    if (refs.length > 3) {
      console.warn(`[MEM] ⚠️ MANY RAF: ${owner} has ${refs.length} active RAFs!`);
    }
  }

  trackRAFCancel(owner: string, rafId: number) {
    const refs = this.rafRefs.get(owner) || [];
    const idx = refs.indexOf(rafId);
    if (idx > -1) refs.splice(idx, 1);
    this.rafRefs.set(owner, refs);
  }

  // Check memory usage
  checkMemory(context: string = '') {
    if ((performance as any).memory) {
      const now = Date.now();
      // Only check every 5 seconds
      if (now - this.lastMemoryCheck < 5000) return;
      this.lastMemoryCheck = now;

      const heapUsed = (performance as any).memory.usedJSHeapSize / 1024 / 1024;
      this.memoryHistory.push(heapUsed);

      // Keep last 20 readings
      if (this.memoryHistory.length > 20) {
        this.memoryHistory.shift();
      }

      // Check for memory growth trend
      if (this.memoryHistory.length >= 3) {
        const first = this.memoryHistory[0];
        const last = this.memoryHistory[this.memoryHistory.length - 1];
        const growth = last - first;

        if (growth > 50) { // >50MB growth
          console.error(`[MEM] 🚨 MEMORY LEAK DETECTED! Growth: ${growth.toFixed(1)}MB (${first.toFixed(1)} -> ${last.toFixed(1)}MB) ${context}`);
        } else if (growth > 20) {
          console.warn(`[MEM] ⚠️ Memory growing: ${growth.toFixed(1)}MB ${context}`);
        }
      }

      console.log(`[MEM] 📊 Heap: ${heapUsed.toFixed(1)}MB ${context}`);
    }
  }

  // Check for potential component leaks
  private checkForLeaks(componentName: string, tracker: ComponentTracker) {
    const active = tracker.mounted - tracker.unmounted;
    if (active > 10) {
      console.error(`[MEM] 🚨 COMPONENT LEAK: ${componentName} has ${active} active instances!`);
    }
  }

  // Log full status
  logStatus() {
    console.log('\n[MEM] ===== MEMORY DEBUG STATUS =====');
    console.log('[MEM] Components:');
    this.componentTrackers.forEach((tracker, name) => {
      const active = tracker.mounted - tracker.unmounted;
      console.log(`[MEM]   ${name}: ${active} active (${tracker.mounted} mounts, ${tracker.unmounted} unmounts, ${tracker.renderCount} renders)`);
    });

    console.log('[MEM] Intervals:');
    this.intervalRefs.forEach((refs, owner) => {
      if (refs.length > 0) console.log(`[MEM]   ${owner}: ${refs.length} active`);
    });

    console.log('[MEM] Timeouts:');
    this.timeoutRefs.forEach((refs, owner) => {
      if (refs.length > 0) console.log(`[MEM]   ${owner}: ${refs.length} active`);
    });

    console.log('[MEM] RAF:');
    this.rafRefs.forEach((refs, owner) => {
      if (refs.length > 0) console.log(`[MEM]   ${owner}: ${refs.length} active`);
    });

    this.checkMemory('(status check)');
    console.log('[MEM] ================================\n');
  }
}

export const memDebug = new MemoryDebugger();

// Auto-enable in development
if (typeof window !== 'undefined') {
  (window as any).perfLogger = performanceLogger;
  (window as any).memDebug = memDebug;
  console.log('[PerfLogger] Available as window.perfLogger - call perfLogger.enable() to start logging');
  console.log('[MemDebug] Available as window.memDebug - call memDebug.logStatus() to check status');

  // Log status every 30 seconds
  setInterval(() => {
    memDebug.logStatus();
  }, 30000);
}
