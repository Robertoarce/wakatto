/**
 * FPS Display Component
 *
 * Shows real-time FPS metrics overlay on screen.
 * Useful for performance profiling during development.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useFPSMonitor } from '../hooks/useFPSMonitor';
import { useResponsive } from '../constants/Layout';

interface FPSDisplayProps {
  enabled?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export function FPSDisplay({ enabled = false, position = 'top-right' }: FPSDisplayProps) {
  const [isVisible, setIsVisible] = useState(enabled);
  const metrics = useFPSMonitor(isVisible);
  const { fonts, spacing, borderRadius, scalePx } = useResponsive();

  const dynamicStyles = useMemo(() => ({
    container: {
      margin: spacing.sm,
    },
    collapsed: {
      width: scalePx(48),
      height: scalePx(48),
      borderRadius: scalePx(24),
    },
    collapsedText: {
      fontSize: scalePx(24),
    },
    expanded: {
      minWidth: scalePx(220),
    },
    background: {
      borderRadius: borderRadius.md,
      padding: spacing.md,
    },
    header: {
      marginBottom: spacing.md,
      paddingBottom: spacing.sm,
    },
    title: {
      fontSize: fonts.xs,
    },
    closeButton: {
      width: scalePx(24),
      height: scalePx(24),
    },
    closeButtonText: {
      fontSize: fonts.sm,
    },
    metricsGrid: {
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    metricBox: {
      borderRadius: spacing.sm,
      padding: spacing.sm,
    },
    metricLabel: {
      fontSize: scalePx(10),
      marginBottom: spacing.xs,
    },
    metricValue: {
      fontSize: fonts.lg,
      marginBottom: spacing.xs / 2,
    },
    metricUnit: {
      fontSize: scalePx(9),
    },
    stats: {
      borderRadius: spacing.sm,
      padding: spacing.sm,
      marginBottom: spacing.md,
    },
    statRow: {
      marginBottom: spacing.xs,
    },
    statLabel: {
      fontSize: scalePx(10),
    },
    statValue: {
      fontSize: scalePx(10),
    },
    statusBar: {
      paddingTop: spacing.sm,
    },
    statusIndicator: {
      width: scalePx(8),
      height: scalePx(8),
      borderRadius: scalePx(4),
      marginRight: spacing.sm,
    },
    statusText: {
      fontSize: scalePx(10),
    },
  }), [fonts, spacing, borderRadius, scalePx]);

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
        style={[styles.container, dynamicStyles.container, positionStyles[position], styles.collapsed, dynamicStyles.collapsed]}
        onPress={() => setIsVisible(true)}
      >
        <Text style={[styles.collapsedText, dynamicStyles.collapsedText]}>📊</Text>
      </Pressable>
    );
  }

  return (
    <View style={[styles.container, dynamicStyles.container, positionStyles[position], styles.expanded, dynamicStyles.expanded]}>
      <View
        style={[
          styles.background,
          dynamicStyles.background,
          { borderColor: warningColors[warningLevel] },
        ]}
      >
        {/* Header */}
        <View style={[styles.header, dynamicStyles.header]}>
          <Text style={[styles.title, dynamicStyles.title]}>Performance Monitor</Text>
          <Pressable onPress={() => setIsVisible(false)} style={[styles.closeButton, dynamicStyles.closeButton]}>
            <Text style={[styles.closeButtonText, dynamicStyles.closeButtonText]}>✕</Text>
          </Pressable>
        </View>

        {/* Metrics Grid */}
        <View style={[styles.metricsGrid, dynamicStyles.metricsGrid]}>
          {/* Current FPS */}
          <View style={[styles.metricBox, dynamicStyles.metricBox]}>
            <Text style={[styles.metricLabel, dynamicStyles.metricLabel]}>Current</Text>
            <Text
              style={[
                styles.metricValue,
                dynamicStyles.metricValue,
                {
                  color: metrics.currentFPS >= 50 ? '#10b981' : metrics.currentFPS >= 30 ? '#f59e0b' : '#ef4444',
                },
              ]}
            >
              {metrics.currentFPS.toFixed(1)}
            </Text>
            <Text style={[styles.metricUnit, dynamicStyles.metricUnit]}>fps</Text>
          </View>

          {/* Average FPS */}
          <View style={[styles.metricBox, dynamicStyles.metricBox]}>
            <Text style={[styles.metricLabel, dynamicStyles.metricLabel]}>Average</Text>
            <Text
              style={[
                styles.metricValue,
                dynamicStyles.metricValue,
                {
                  color: metrics.averageFPS >= 50 ? '#10b981' : metrics.averageFPS >= 30 ? '#f59e0b' : '#ef4444',
                },
              ]}
            >
              {metrics.averageFPS.toFixed(1)}
            </Text>
            <Text style={[styles.metricUnit, dynamicStyles.metricUnit]}>fps</Text>
          </View>

          {/* Min FPS */}
          <View style={[styles.metricBox, dynamicStyles.metricBox]}>
            <Text style={[styles.metricLabel, dynamicStyles.metricLabel]}>Min</Text>
            <Text style={[styles.metricValue, dynamicStyles.metricValue, { color: '#3b82f6' }]}>
              {metrics.minFPS.toFixed(1)}
            </Text>
            <Text style={[styles.metricUnit, dynamicStyles.metricUnit]}>fps</Text>
          </View>

          {/* Max FPS */}
          <View style={[styles.metricBox, dynamicStyles.metricBox]}>
            <Text style={[styles.metricLabel, dynamicStyles.metricLabel, { color: '#8b5cf6' }]}>Max</Text>
            <Text style={[styles.metricValue, dynamicStyles.metricValue, { color: '#8b5cf6' }]}>
              {metrics.maxFPS.toFixed(1)}
            </Text>
            <Text style={[styles.metricUnit, dynamicStyles.metricUnit]}>fps</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={[styles.stats, dynamicStyles.stats]}>
          <View style={[styles.statRow, dynamicStyles.statRow]}>
            <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Frames:</Text>
            <Text style={[styles.statValue, dynamicStyles.statValue]}>{metrics.frameCount}</Text>
          </View>
          <View style={[styles.statRow, dynamicStyles.statRow]}>
            <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Dropped:</Text>
            <Text style={[styles.statValue, dynamicStyles.statValue, { color: metrics.droppedFrames > 0 ? '#ef4444' : '#10b981' }]}>
              {metrics.droppedFrames}
            </Text>
          </View>
        </View>

        {/* Status Indicator */}
        <View style={[styles.statusBar, dynamicStyles.statusBar]}>
          <View
            style={[
              styles.statusIndicator,
              dynamicStyles.statusIndicator,
              { backgroundColor: warningColors[warningLevel] },
            ]}
          />
          <Text style={[styles.statusText, dynamicStyles.statusText]}>
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  collapsedText: {},
  expanded: {},
  background: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderWidth: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    color: '#fff',
    fontWeight: '600',
  },
  closeButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#999',
    fontWeight: 'bold',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metricBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  metricLabel: {
    color: '#999',
  },
  metricValue: {
    fontWeight: 'bold',
  },
  metricUnit: {
    color: '#666',
  },
  stats: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statLabel: {
    color: '#999',
  },
  statValue: {
    color: '#fff',
    fontWeight: '600',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusIndicator: {},
  statusText: {
    color: '#fff',
    fontWeight: '600',
  },
});
