/**
 * FPS Display Component
 *
 * Shows real-time FPS metrics overlay on screen.
 * Useful for performance profiling during development.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useFPSMonitor } from '../hooks/useFPSMonitor';

interface FPSDisplayProps {
  enabled?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export function FPSDisplay({ enabled = false, position = 'top-right' }: FPSDisplayProps) {
  const [isVisible, setIsVisible] = useState(enabled);
  const metrics = useFPSMonitor(isVisible);

  const [warningLevel, setWarningLevel] = React.useState<'good' | 'warning' | 'critical'>('good');

  useEffect(() => {
    // Determine warning level based on average FPS
    if (metrics.averageFPS >= 50) {
      setWarningLevel('good');
    } else if (metrics.averageFPS >= 30) {
      setWarningLevel('warning');
    } else {
      setWarningLevel('critical');
    }
  }, [metrics.averageFPS]);

  const positionStyles = {
    'top-left': styles.topLeft,
    'top-right': styles.topRight,
    'bottom-left': styles.bottomLeft,
    'bottom-right': styles.bottomRight,
  };

  const warningColors = {
    good: '#10b981', // Green
    warning: '#f59e0b', // Amber
    critical: '#ef4444', // Red
  };

  if (!isVisible) {
    return (
      <Pressable
        style={[styles.container, positionStyles[position], styles.collapsed]}
        onPress={() => setIsVisible(true)}
      >
        <Text style={styles.collapsedText}>📊</Text>
      </Pressable>
    );
  }

  return (
    <View style={[styles.container, positionStyles[position], styles.expanded]}>
      <View
        style={[
          styles.background,
          { borderColor: warningColors[warningLevel] },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Performance Monitor</Text>
          <Pressable onPress={() => setIsVisible(false)} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          {/* Current FPS */}
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Current</Text>
            <Text
              style={[
                styles.metricValue,
                {
                  color: metrics.currentFPS >= 50 ? '#10b981' : metrics.currentFPS >= 30 ? '#f59e0b' : '#ef4444',
                },
              ]}
            >
              {metrics.currentFPS.toFixed(1)}
            </Text>
            <Text style={styles.metricUnit}>fps</Text>
          </View>

          {/* Average FPS */}
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Average</Text>
            <Text
              style={[
                styles.metricValue,
                {
                  color: metrics.averageFPS >= 50 ? '#10b981' : metrics.averageFPS >= 30 ? '#f59e0b' : '#ef4444',
                },
              ]}
            >
              {metrics.averageFPS.toFixed(1)}
            </Text>
            <Text style={styles.metricUnit}>fps</Text>
          </View>

          {/* Min FPS */}
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Min</Text>
            <Text style={[styles.metricValue, { color: '#3b82f6' }]}>
              {metrics.minFPS.toFixed(1)}
            </Text>
            <Text style={styles.metricUnit}>fps</Text>
          </View>

          {/* Max FPS */}
          <View style={styles.metricBox}>
            <Text style={[styles.metricLabel, { color: '#8b5cf6' }]}>Max</Text>
            <Text style={[styles.metricValue, { color: '#8b5cf6' }]}>
              {metrics.maxFPS.toFixed(1)}
            </Text>
            <Text style={styles.metricUnit}>fps</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Frames:</Text>
            <Text style={styles.statValue}>{metrics.frameCount}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Dropped:</Text>
            <Text style={[styles.statValue, { color: metrics.droppedFrames > 0 ? '#ef4444' : '#10b981' }]}>
              {metrics.droppedFrames}
            </Text>
          </View>
        </View>

        {/* Status Indicator */}
        <View style={styles.statusBar}>
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: warningColors[warningLevel] },
            ]}
          />
          <Text style={styles.statusText}>
            {warningLevel === 'good'
              ? '✓ Excellent Performance'
              : warningLevel === 'warning'
              ? '⚠ Good Performance'
              : '✗ Low Performance'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 9999,
    margin: 8,
  },
  topLeft: {
    top: 0,
    left: 0,
  },
  topRight: {
    top: 0,
    right: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
  },
  collapsed: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  collapsedText: {
    fontSize: 24,
  },
  expanded: {
    minWidth: 220,
  },
  background: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#999',
    fontSize: 14,
    fontWeight: 'bold',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  metricBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  metricLabel: {
    color: '#999',
    fontSize: 10,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  metricUnit: {
    color: '#666',
    fontSize: 9,
  },
  stats: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statLabel: {
    color: '#999',
    fontSize: 10,
  },
  statValue: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
});
