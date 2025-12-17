# Copy-Paste FPS Monitor Integration Guide

## The Easiest Way: Add to Settings Screen

If you have a SettingsScreen component, copy this code:

### Step 1: Add Import at Top

```typescript
import { FPSDisplay } from '../components/FPSDisplay';
import { useState } from 'react';
```

### Step 2: Add State Variable

```typescript
const [showFPSMonitor, setShowFPSMonitor] = useState(false);
```

### Step 3: Add Toggle Switch (in your render)

```typescript
{/* Debug & Performance Section */}
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Debug & Performance</Text>

  <View style={styles.settingRow}>
    <Text style={styles.settingLabel}>Show FPS Monitor</Text>
    <Switch
      value={showFPSMonitor}
      onValueChange={setShowFPSMonitor}
    />
  </View>

  <Text style={styles.settingDescription}>
    Monitor frame rate performance in real-time. Useful for testing
    multi-accessory rendering with the new gadgets system.
  </Text>
</View>
```

### Step 4: Add Display Component (after your main content)

```typescript
{/* FPS Monitor Overlay */}
{showFPSMonitor && (
  <FPSDisplay
    enabled={true}
    position="top-right"
  />
)}
```

### Complete Example

```typescript
import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView } from 'react-native';
import { FPSDisplay } from '../components/FPSDisplay';

export function SettingsScreen() {
  const [showFPSMonitor, setShowFPSMonitor] = useState(false);

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Your existing settings... */}

        {/* NEW: Debug & Performance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debug & Performance</Text>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Show FPS Monitor</Text>
            <Switch
              value={showFPSMonitor}
              onValueChange={setShowFPSMonitor}
            />
          </View>

          <Text style={styles.settingDescription}>
            Real-time performance monitoring for rendering optimization.
          </Text>
        </View>
      </ScrollView>

      {/* FPS Monitor Overlay */}
      {showFPSMonitor && (
        <FPSDisplay
          enabled={true}
          position="top-right"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  section: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  settingLabel: { fontSize: 14, fontWeight: '500' },
  settingDescription: { fontSize: 12, color: '#999', marginTop: 8 },
});
```

---

## Alternative: Add to Character Display Screen

If you want monitoring while viewing characters:

```typescript
import { FPSDisplay } from '../components/FPSDisplay';
import { useState } from 'react';

export function ChatInterface() {
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);

  return (
    <View style={styles.container}>
      {/* Your character display */}
      <View style={styles.characterDisplay}>
        {/* Character Display Here */}
      </View>

      {/* Toggle Performance Monitor */}
      <Pressable
        style={styles.monitorButton}
        onPress={() => setShowPerformanceMonitor(!showPerformanceMonitor)}
      >
        <Text style={styles.monitorButtonText}>
          {showPerformanceMonitor ? '⏸ Hide FPS' : '▶ Show FPS'}
        </Text>
      </Pressable>

      {/* FPS Display Overlay */}
      {showPerformanceMonitor && (
        <FPSDisplay enabled={true} position="bottom-right" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  characterDisplay: { flex: 1 },
  monitorButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
  },
  monitorButtonText: { color: '#fff', fontWeight: '600' },
});
```

---

## Advanced: Use the Service Directly

For custom performance logic:

```typescript
import { fpsMonitor } from '../services/fpsMonitor';

// Enable monitoring
fpsMonitor.enable();

// Get metrics
const metrics = fpsMonitor.getMetrics();
console.log(`
  Current FPS: ${metrics.currentFPS.toFixed(1)}
  Average FPS: ${metrics.averageFPS.toFixed(1)}
  Min FPS: ${metrics.minFPS.toFixed(1)}
  Max FPS: ${metrics.maxFPS.toFixed(1)}
  Dropped Frames: ${metrics.droppedFrames}
`);

// Disable monitoring
fpsMonitor.disable();
```

---

## With React Hook (Simplest for Components)

```typescript
import { useFPSMonitor } from '../hooks/useFPSMonitor';

export function PerformanceInfo() {
  const [monitoring, setMonitoring] = useState(false);
  const metrics = useFPSMonitor(monitoring);

  return (
    <View>
      <Pressable onPress={() => setMonitoring(!monitoring)}>
        <Text>{monitoring ? 'Stop Monitoring' : 'Start Monitoring'}</Text>
      </Pressable>

      {monitoring && (
        <>
          <Text>Current: {metrics.currentFPS.toFixed(1)} FPS</Text>
          <Text>Average: {metrics.averageFPS.toFixed(1)} FPS</Text>
          <Text>Dropped: {metrics.droppedFrames}</Text>
        </>
      )}
    </View>
  );
}
```

---

## Console Output Example

When monitoring is enabled, you'll see console logs like:

```
[FPSMonitor] Enabled - monitoring frame rate
[FPSMonitor] Current: 58.3 FPS | Avg: 57.8 | Min: 52.1 | Max: 61.2 | Dropped: 0
[FPSMonitor] Current: 59.1 FPS | Avg: 58.2 | Min: 51.5 | Max: 62.3 | Dropped: 1
[FPSMonitor] Current: 57.5 FPS | Avg: 58.0 | Min: 50.8 | Max: 62.1 | Dropped: 2
```

Every ~5 seconds at 60 FPS

---

## What the UI Shows

The FPS Display component shows:

```
┌─────────────────────┐
│ Performance Monitor │
├─────────────────────┤
│ Current  58.3  fps  │
│ Average  57.8  fps  │
│ Min      52.1  fps  │
│ Max      61.2  fps  │
├─────────────────────┤
│ Frames: 1847        │
│ Dropped: 0          │
├─────────────────────┤
│ ✓ Excellent Perf.   │
└─────────────────────┘
```

**Colors:**
- 🟢 Green: >50 FPS average (excellent)
- 🟡 Amber: 30-50 FPS average (good)
- 🔴 Red: <30 FPS average (poor)

---

## Testing Workflow

1. Add FPS monitor to Settings screen (copy-paste above)
2. Run your app
3. Go to Settings
4. Toggle "Show FPS Monitor" ON
5. Navigate to character display
6. Load characters with new accessories
7. Watch FPS monitor in corner
8. Load Blackbeard with all 6 accessories
9. Check console for performance logs

---

## Expected Results

With New Accessories:

| Character | Accessories | Expected FPS |
|-----------|-------------|--------------|
| Freud | monocle + beard | 57-59 |
| Jung | bowtie + beard | 57-59 |
| Nietzsche | moustache + cane | 56-59 |
| Blackbeard | 6 pirate accessories | 50-56 |
| Multiple + Blackbeard | many accessories | 40-50 |

---

## Troubleshooting

### FPS Monitor Not Showing
- Check that `enabled={true}` is set
- Verify component is in render tree
- Check browser console for errors

### FPS is Low
- Note the Average FPS
- Check Dropped Frames count
- Try loading fewer characters
- Disable expensive accessories (wheelchair)

### Weird Numbers
- Normal - JavaScript GC runs occasionally
- Check average over 5 seconds
- Monitor for trends, not individual frames

---

## Quick Test Script

Run this in browser console:

```javascript
// Enable FPS monitoring
window.fpsMonitor && window.fpsMonitor.enable();

// Every second, log metrics
setInterval(() => {
  const metrics = window.fpsMonitor.getMetrics();
  console.log(`FPS: ${metrics.averageFPS.toFixed(1)} | Dropped: ${metrics.droppedFrames}`);
}, 1000);
```

---

## That's It!

You now have professional FPS monitoring integrated into your app!

Next: Test with the new multi-accessory characters and verify performance. 🚀
