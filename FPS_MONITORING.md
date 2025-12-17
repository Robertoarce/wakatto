# FPS Performance Monitoring

This guide explains how to use the FPS monitoring system to track rendering performance, especially useful when testing the new multi-accessory system.

## Overview

The FPS Monitor tracks:
- **Current FPS**: Instantaneous frame rate
- **Average FPS**: Mean frame rate over recent frames
- **Min/Max FPS**: Range of frame rates
- **Dropped Frames**: Count of frames below 30 FPS
- **Frame Count**: Total frames rendered since monitoring started

## Quick Start

### 1. Add FPSDisplay Component to Your Screen

```tsx
import { FPSDisplay } from '../components/FPSDisplay';

export function MyScreen() {
  const [showFPS, setShowFPS] = useState(false);

  return (
    <View style={styles.container}>
      {/* Your content */}

      {showFPS && (
        <FPSDisplay
          enabled={true}
          position="top-right"
        />
      )}
    </View>
  );
}
```

### 2. Use the Hook Directly

```tsx
import { useFPSMonitor } from '../hooks/useFPSMonitor';

export function PerformanceTest() {
  const [monitoringEnabled, setMonitoringEnabled] = useState(false);
  const metrics = useFPSMonitor(monitoringEnabled);

  return (
    <View>
      <Text>Average FPS: {metrics.averageFPS.toFixed(1)}</Text>
      <Text>Dropped Frames: {metrics.droppedFrames}</Text>
    </View>
  );
}
```

### 3. Use Service Directly

```tsx
import { fpsMonitor } from '../services/fpsMonitor';

// Enable monitoring
fpsMonitor.enable();

// Get current metrics
const metrics = fpsMonitor.getMetrics();
console.log(`Current FPS: ${metrics.currentFPS.toFixed(1)}`);
console.log(`Average FPS: ${metrics.averageFPS.toFixed(1)}`);

// Register callback for updates
fpsMonitor.onMetrics((metrics) => {
  console.log(`Frame ${metrics.frameCount}: ${metrics.currentFPS.toFixed(1)} FPS`);
});

// Disable monitoring
fpsMonitor.disable();
```

## Testing Multi-Accessory Performance

### Recommended Test Cases

1. **Single Accessory** (baseline)
   - Freud with just monocle
   - Record average FPS

2. **Multiple Accessories** (new system)
   - Freud with monocle + beard
   - Jung with bowtie + beard + moustache
   - Record average FPS

3. **Complex Accessories** (stress test)
   - Blackbeard with all 6 pirate accessories
   - Multiple characters on screen with Blackbeard
   - Record min/max FPS and dropped frames

4. **Wheelchair Accessory** (most complex geometry)
   - Character with wheelchair (10+ meshes)
   - Test with multiple characters
   - Monitor for performance degradation

### Expected Performance Targets

- **60 FPS**: Excellent (target for smooth animations)
- **50 FPS**: Good (barely noticeable stuttering)
- **30 FPS**: Acceptable (visible but tolerable)
- **<30 FPS**: Poor (noticeable lag)

## Console Logging

The FPS Monitor logs metrics to the console automatically:

```
[FPSMonitor] Current: 58.3 FPS | Avg: 57.8 | Min: 52.1 | Max: 61.2 | Dropped: 0
[FPSMonitor] Current: 59.1 FPS | Avg: 58.2 | Min: 51.5 | Max: 62.3 | Dropped: 1
```

**Logging frequency:**
- Console logs every 300 frames (~5 seconds at 60 FPS)
- Metric callback updates every 30 frames (~0.5 seconds)

## FPS Display Component

The `FPSDisplay` component shows a visual overlay with:

### Position Options
- `top-left`
- `top-right` (default)
- `bottom-left`
- `bottom-right`

### Status Colors
- **Green (✓)**: Excellent performance (>50 FPS average)
- **Amber (⚠)**: Good performance (30-50 FPS average)
- **Red (✗)**: Low performance (<30 FPS average)

### Features
- **Collapsible**: Click the dashboard to collapse/expand
- **Close button**: ✕ to hide the monitor
- **Real-time updates**: Metrics update every ~500ms
- **Warning indicators**: Visual feedback on performance status

## Troubleshooting

### FPS Monitor Not Updating
- Ensure `enabled={true}` is passed to `FPSDisplay`
- Check that component is mounted
- Verify no errors in browser console

### Dropped Frames Spike
- Could indicate:
  - Multiple re-renders of complex components
  - Heavy computation on main thread
  - Too many Three.js geometries rendering simultaneously
  - Check with React DevTools Profiler

### Inconsistent FPS
- Normal variation due to:
  - JavaScript garbage collection
  - Image loading or network requests
  - Animation complexity variations
  - System background processes

## Performance Optimization Tips

If you see low FPS:

1. **Reduce accessory complexity** - Simpler geometries use fewer vertices
2. **Limit visible characters** - Fewer characters = fewer geometries to render
3. **Disable unused accessories** - Remove accessories not needed for scene
4. **Use LOD (Level of Detail)** - Render simpler geometry at distance
5. **Profile with React DevTools** - Identify re-render bottlenecks
6. **Check Three.js stats** - Use Three.js built-in performance monitor

## Development Integration

### Adding to Settings Screen

```tsx
import { useState } from 'react';
import { FPSDisplay } from '../components/FPSDisplay';

export function SettingsScreen() {
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);

  return (
    <View>
      <Switch
        value={showPerformanceMonitor}
        onValueChange={setShowPerformanceMonitor}
        label="Show FPS Monitor"
      />

      {showPerformanceMonitor && (
        <FPSDisplay enabled={true} position="top-right" />
      )}
    </View>
  );
}
```

### CI/CD Integration

For automated performance testing:

```tsx
import { fpsMonitor } from '../services/fpsMonitor';

async function measurePerformance() {
  fpsMonitor.enable();

  // Wait for 10 seconds of monitoring
  await new Promise(resolve => setTimeout(resolve, 10000));

  const metrics = fpsMonitor.getMetrics();

  // Assert performance requirements
  expect(metrics.averageFPS).toBeGreaterThan(50);
  expect(metrics.droppedFrames).toBeLessThan(10);

  fpsMonitor.disable();
}
```

## Browser DevTools Integration

Open Browser Console to see real-time logs:

```javascript
// In console:
// Check if FPS Monitor is running
window.location.href // Should show logs if monitoring is enabled
```

## Multi-Accessory Performance Impact

Based on geometry count:

| Setup | Meshes | Est. Impact |
|-------|--------|-------------|
| Single character, no accessories | ~40 | Baseline |
| + 1 accessory | +2-5 | Minimal (~2-5%) |
| + 2 accessories | +5-10 | Small (~5-10%) |
| Blackbeard (6 accessories) | +30-40 | Moderate (~15-20%) |
| 3 characters with Blackbeard | +100-120 | Significant (~30-40%) |
| 5+ characters + wheelchair | +200+ | Heavy (>50%) |

**Recommendation**: Most devices should handle 2-3 characters with multiple accessories at 30+ FPS smoothly.
