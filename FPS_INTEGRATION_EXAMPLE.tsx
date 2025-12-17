/**
 * FPS Monitor Integration Example
 *
 * This file shows how to integrate the FPS Display component into your screens.
 * Copy these patterns into your existing components.
 */

import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView } from 'react-native';
import { FPSDisplay } from './src/components/FPSDisplay';
import { useFPSMonitor } from './src/hooks/useFPSMonitor';

/**
 * Example 1: Simple Toggle in Settings Screen
 *
 * Add this to your SettingsScreen component:
 */
export function SettingsScreenExample() {
  const [showFPSMonitor, setShowFPSMonitor] = useState(false);

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Existing settings... */}

        {/* Debug Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debug & Performance</Text>

          {/* FPS Monitor Toggle */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Show FPS Monitor</Text>
            <Switch
              value={showFPSMonitor}
              onValueChange={setShowFPSMonitor}
            />
          </View>

          <Text style={styles.settingDescription}>
            Monitor frame rate performance in real-time. Useful for testing multi-accessory rendering.
          </Text>
        </View>
      </ScrollView>

      {/* FPS Display Overlay */}
      {showFPSMonitor && (
        <FPSDisplay
          enabled={true}
          position="top-right"
        />
      )}
    </View>
  );
}

/**
 * Example 2: Always-on FPS Monitor in Character Display
 *
 * Add this to your ChatInterface or CharacterDisplay component:
 */
export function CharacterDisplayWithFPS() {
  const [enableFPSMonitoring, setEnableFPSMonitoring] = useState(false);

  return (
    <View style={styles.container}>
      {/* Your character display component */}
      <View style={styles.characterDisplay}>
        <Text>Character Display Here</Text>
      </View>

      {/* Show FPS metrics when rendering characters with accessories */}
      {enableFPSMonitoring && (
        <FPSDisplay
          enabled={true}
          position="bottom-right"
        />
      )}

      {/* Toggle button */}
      <View style={styles.toggleButton}>
        <Text
          onPress={() => setEnableFPSMonitoring(!enableFPSMonitoring)}
          style={styles.toggleText}
        >
          {enableFPSMonitoring ? '⏸ Pause Monitoring' : '▶ Monitor Performance'}
        </Text>
      </View>
    </View>
  );
}

/**
 * Example 3: Dedicated Performance Testing Screen
 *
 * Create a new screen for performance benchmarking:
 */
export function PerformanceTestingScreen() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<'top-right' | 'bottom-right'>('top-right');
  const metrics = useFPSMonitor(isMonitoring);

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Performance Testing</Text>

        {/* Control Panel */}
        <View style={styles.controlPanel}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Monitoring Active</Text>
            <Switch
              value={isMonitoring}
              onValueChange={setIsMonitoring}
            />
          </View>

          {/* Position Selector */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Monitor Position</Text>
            <View style={styles.buttonGroup}>
              {(['top-right', 'bottom-right'] as const).map((pos) => (
                <Text
                  key={pos}
                  onPress={() => setSelectedPosition(pos)}
                  style={[
                    styles.positionButton,
                    selectedPosition === pos && styles.positionButtonActive,
                  ]}
                >
                  {pos}
                </Text>
              ))}
            </View>
          </View>
        </View>

        {/* Live Metrics Display */}
        {isMonitoring && (
          <View style={styles.metricsPanel}>
            <Text style={styles.panelTitle}>Real-time Metrics</Text>

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Current FPS:</Text>
              <Text style={styles.metricValue}>{metrics.currentFPS.toFixed(1)}</Text>
            </View>

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Average FPS:</Text>
              <Text style={styles.metricValue}>{metrics.averageFPS.toFixed(1)}</Text>
            </View>

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Min FPS:</Text>
              <Text style={styles.metricValue}>{metrics.minFPS.toFixed(1)}</Text>
            </View>

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Max FPS:</Text>
              <Text style={styles.metricValue}>{metrics.maxFPS.toFixed(1)}</Text>
            </View>

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Dropped Frames:</Text>
              <Text
                style={[
                  styles.metricValue,
                  metrics.droppedFrames > 0 && { color: '#ef4444' },
                ]}
              >
                {metrics.droppedFrames}
              </Text>
            </View>

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Total Frames:</Text>
              <Text style={styles.metricValue}>{metrics.frameCount}</Text>
            </View>
          </View>
        )}

        {/* Test Instructions */}
        <View style={styles.instructionsPanel}>
          <Text style={styles.panelTitle}>Testing Guide</Text>
          <Text style={styles.instruction}>
            1. Enable monitoring above
          </Text>
          <Text style={styles.instruction}>
            2. Navigate to character screen
          </Text>
          <Text style={styles.instruction}>
            3. Load characters with various accessories
          </Text>
          <Text style={styles.instruction}>
            4. Check FPS in the corner for real-time performance
          </Text>
          <Text style={styles.instruction}>
            5. Watch for dropped frames (&lt;30 FPS)
          </Text>

          <Text style={[styles.instruction, styles.instructionBold]}>
            Expected Performance Targets:
          </Text>
          <Text style={styles.instruction}>
            • 60 FPS: Excellent performance
          </Text>
          <Text style={styles.instruction}>
            • 50 FPS: Good performance
          </Text>
          <Text style={styles.instruction}>
            • 30+ FPS: Acceptable performance
          </Text>
          <Text style={styles.instruction}>
            • &lt;30 FPS: Performance degradation
          </Text>
        </View>
      </ScrollView>

      {/* FPS Monitor Overlay */}
      {isMonitoring && (
        <FPSDisplay
          enabled={true}
          position={selectedPosition}
        />
      )}
    </View>
  );
}

/**
 * Example 4: Service-Level Integration
 *
 * Use the service directly for custom logic:
 */
export function CustomPerformanceIntegration() {
  import { fpsMonitor } from './src/services/fpsMonitor';

  const startPerfTest = () => {
    console.log('Starting performance test...');
    fpsMonitor.enable();

    // Register custom callback
    fpsMonitor.onMetrics((metrics) => {
      // Custom logic based on metrics
      if (metrics.averageFPS < 30) {
        console.warn('⚠️ Low FPS detected!', metrics);
        // Disable expensive features
      } else if (metrics.averageFPS > 55) {
        console.log('✓ Excellent performance', metrics);
        // Enable luxury features
      }
    });

    // Stop after 10 seconds
    setTimeout(() => {
      fpsMonitor.disable();
      console.log('Performance test complete');
    }, 10000);
  };

  return (
    <View>
      <Text onPress={startPerfTest}>Start Performance Test</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1a1a1a',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  characterDisplay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  toggleButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
  },
  toggleText: {
    color: '#fff',
    fontWeight: '600',
  },
  controlPanel: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    margin: 16,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  positionButton: {
    flex: 1,
    padding: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    textAlign: 'center',
    fontSize: 12,
  },
  positionButtonActive: {
    backgroundColor: '#3b82f6',
    color: '#fff',
  },
  metricsPanel: {
    margin: 16,
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1a1a1a',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  instructionsPanel: {
    margin: 16,
    padding: 16,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  instruction: {
    fontSize: 12,
    color: '#1565c0',
    marginBottom: 8,
  },
  instructionBold: {
    fontWeight: '600',
    marginTop: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 16,
    color: '#1a1a1a',
  },
});
