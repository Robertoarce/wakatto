/**
 * Profiling Dashboard Component
 * 
 * A dev-only overlay that displays profiling metrics for the AI response pipeline.
 * Shows timing breakdown, token estimates, and performance history.
 * 
 * Toggle via keyboard shortcut (Ctrl/Cmd + Shift + P) or Settings screen.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Animated,
  Platform,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  getProfiler, 
  ProfileSession, 
  ProfileSummary,
  PROFILE_OPS 
} from '../services/profilingService';

interface ProfilingDashboardProps {
  visible: boolean;
  onClose: () => void;
  session?: ProfileSession | null;
}

// Color coding for operations
const OPERATION_COLORS: Record<string, string> = {
  [PROFILE_OPS.EDGE_FUNCTION_CALL]: '#FF6B6B',  // Red - usually the bottleneck
  [PROFILE_OPS.TITLE_GENERATION]: '#FFE66D',     // Yellow - optional cost
  [PROFILE_OPS.PROMPT_BUILD]: '#4ECDC4',         // Teal
  [PROFILE_OPS.AUTH_SESSION]: '#95E1D3',         // Light teal
  [PROFILE_OPS.DB_SAVE_USER_MESSAGE]: '#A8E6CF', // Light green
  [PROFILE_OPS.DB_SAVE_ASSISTANT_MESSAGE]: '#88D8B0', // Green
  [PROFILE_OPS.SCENE_PARSE]: '#B8B5FF',          // Purple
  [PROFILE_OPS.FULL_MESSAGE_FLOW]: '#667EEA',    // Blue
};

const getOperationColor = (operation: string): string => {
  return OPERATION_COLORS[operation] || '#888888';
};

// Format duration with appropriate precision
const formatDuration = (ms: number): string => {
  if (ms < 1) return '<1ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

// Operation display names
const OPERATION_NAMES: Record<string, string> = {
  [PROFILE_OPS.FULL_MESSAGE_FLOW]: 'Total Flow',
  [PROFILE_OPS.AUTH_SESSION]: 'Auth Session',
  [PROFILE_OPS.PROMPT_BUILD]: 'Build Prompt',
  [PROFILE_OPS.EDGE_FUNCTION_CALL]: 'LLM API Call',
  [PROFILE_OPS.SCENE_PARSE]: 'Parse Scene',
  [PROFILE_OPS.DB_SAVE_USER_MESSAGE]: 'Save User Msg',
  [PROFILE_OPS.DB_SAVE_ASSISTANT_MESSAGE]: 'Save AI Msg',
  [PROFILE_OPS.TITLE_GENERATION]: 'Title Gen',
  [PROFILE_OPS.DB_CREATE_CONVERSATION]: 'Create Conv',
  [PROFILE_OPS.ANIMATION_SETUP]: 'Animation Setup',
  [PROFILE_OPS.FALLBACK_SCENE_CREATE]: 'Fallback Scene',
};

const getOperationName = (operation: string): string => {
  return OPERATION_NAMES[operation] || operation.replace(/_/g, ' ');
};

// Progress bar component
function ProgressBar({ 
  value, 
  maxValue, 
  color, 
  label,
  duration 
}: { 
  value: number; 
  maxValue: number; 
  color: string;
  label: string;
  duration: string;
}) {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
  
  return (
    <View style={styles.progressBarContainer}>
      <View style={styles.progressLabelRow}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>{duration}</Text>
      </View>
      <View style={styles.progressBarTrack}>
        <View 
          style={[
            styles.progressBarFill, 
            { 
              width: `${Math.min(100, percentage)}%`,
              backgroundColor: color 
            }
          ]} 
        />
      </View>
      <Text style={styles.progressPercentage}>{percentage.toFixed(1)}%</Text>
    </View>
  );
}

// Session history item
function SessionHistoryItem({ 
  session, 
  isSelected,
  onSelect 
}: { 
  session: ProfileSession; 
  isSelected: boolean;
  onSelect: () => void;
}) {
  const time = new Date(session.startTime).toLocaleTimeString();
  const duration = formatDuration(session.summary.totalMs);
  
  return (
    <TouchableOpacity 
      style={[
        styles.historyItem, 
        isSelected && styles.historyItemSelected
      ]}
      onPress={onSelect}
    >
      <Text style={styles.historyTime}>{time}</Text>
      <Text style={styles.historyDuration}>{duration}</Text>
    </TouchableOpacity>
  );
}

export function ProfilingDashboard({ 
  visible, 
  onClose,
  session: externalSession 
}: ProfilingDashboardProps) {
  const [selectedSession, setSelectedSession] = useState<ProfileSession | null>(null);
  const [history, setHistory] = useState<ProfileSession[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  
  // Update history when sessions complete
  useEffect(() => {
    const profiler = getProfiler();
    
    const unsubscribe = profiler.addListener((session) => {
      setHistory(profiler.getHistory());
      setSelectedSession(session);
    });
    
    // Initialize with current history
    setHistory(profiler.getHistory());
    
    return unsubscribe;
  }, []);
  
  // Update selected session when external session changes
  useEffect(() => {
    if (externalSession) {
      setSelectedSession(externalSession);
    }
  }, [externalSession]);
  
  // Animate visibility
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: Platform.OS !== 'web', // Native driver not supported on web
    }).start();
  }, [visible, slideAnim]);
  
  // Handle keyboard shortcut
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + P
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        if (visible) {
          onClose();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, onClose]);
  
  if (!visible) return null;
  
  const displaySession = selectedSession || history[history.length - 1];
  const summary = displaySession?.summary;
  
  // Calculate max duration for scaling bars
  const maxDuration = summary 
    ? Math.max(...summary.breakdown.map(b => b.durationMs))
    : 0;
  
  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{
            translateY: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [300, 0],
            })
          }],
          opacity: slideAnim,
        }
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.expandButton}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <Ionicons 
            name={isExpanded ? 'chevron-down' : 'chevron-up'} 
            size={20} 
            color="#fff" 
          />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Ionicons name="speedometer-outline" size={18} color="#4ECDC4" />
          <Text style={styles.headerTitle}>Profiling</Text>
        </View>
        
        {summary && (
          <Text style={styles.totalDuration}>
            {formatDuration(summary.totalMs)}
          </Text>
        )}
        
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={20} color="#888" />
        </TouchableOpacity>
      </View>
      
      {isExpanded && (
        <View style={styles.content}>
          {/* Main metrics */}
          {summary ? (
            <ScrollView style={styles.metricsScroll}>
              <View style={styles.metricsContainer}>
                {summary.breakdown
                  .filter(b => b.operation !== PROFILE_OPS.FULL_MESSAGE_FLOW)
                  .map((item, index) => (
                    <ProgressBar
                      key={`${item.operation}-${index}`}
                      value={item.durationMs}
                      maxValue={maxDuration}
                      color={getOperationColor(item.operation)}
                      label={getOperationName(item.operation)}
                      duration={formatDuration(item.durationMs)}
                    />
                  ))
                }
              </View>
              
              {/* Token estimates */}
              {displaySession && (
                <View style={styles.tokenSection}>
                  <Text style={styles.sectionTitle}>Token Estimates</Text>
                  {displaySession.results
                    .filter(r => r.metadata?.promptTokens)
                    .map((r, i) => (
                      <View key={i} style={styles.tokenRow}>
                        <Text style={styles.tokenLabel}>
                          {getOperationName(r.operation)}
                        </Text>
                        <Text style={styles.tokenValue}>
                          ~{r.metadata?.promptTokens} prompt / ~{r.metadata?.responseTokens} response
                        </Text>
                      </View>
                    ))
                  }
                </View>
              )}
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="analytics-outline" size={40} color="#444" />
              <Text style={styles.emptyText}>No profiling data yet</Text>
              <Text style={styles.emptyHint}>Send a message to see metrics</Text>
            </View>
          )}
          
          {/* History */}
          {history.length > 1 && (
            <View style={styles.historySection}>
              <Text style={styles.sectionTitle}>History</Text>
              <ScrollView horizontal style={styles.historyScroll}>
                {history.slice(-10).map((session, index) => (
                  <SessionHistoryItem
                    key={session.id}
                    session={session}
                    isSelected={selectedSession?.id === session.id}
                    onSelect={() => setSelectedSession(session)}
                  />
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}
    </Animated.View>
  );
}

// Hook to manage profiling dashboard visibility
export function useProfilingDashboard() {
  const [visible, setVisible] = useState(false);
  const [session, setSession] = useState<ProfileSession | null>(null);
  
  const show = useCallback(() => setVisible(true), []);
  const hide = useCallback(() => setVisible(false), []);
  const toggle = useCallback(() => setVisible(v => !v), []);
  
  // Listen for keyboard shortcut
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + P
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        toggle();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);
  
  // Listen for session updates
  useEffect(() => {
    const profiler = getProfiler();
    const unsubscribe = profiler.addListener((s) => {
      setSession(s);
    });
    return unsubscribe;
  }, []);
  
  return {
    visible,
    show,
    hide,
    toggle,
    session,
  };
}

const { width: screenWidth } = Dimensions.get('window');
const dashboardWidth = Math.min(400, screenWidth - 32);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: dashboardWidth,
    backgroundColor: 'rgba(20, 20, 25, 0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
    zIndex: 9999,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(30, 30, 35, 0.9)',
  },
  expandButton: {
    padding: 4,
    marginRight: 8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  totalDuration: {
    color: '#4ECDC4',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 12,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    maxHeight: 350,
  },
  metricsScroll: {
    maxHeight: 250,
  },
  metricsContainer: {
    padding: 12,
  },
  progressBarContainer: {
    marginBottom: 10,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    color: '#aaa',
    fontSize: 11,
    textTransform: 'capitalize',
  },
  progressValue: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressPercentage: {
    color: '#666',
    fontSize: 9,
    marginTop: 2,
    textAlign: 'right',
  },
  tokenSection: {
    padding: 12,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  sectionTitle: {
    color: '#888',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  tokenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  tokenLabel: {
    color: '#aaa',
    fontSize: 11,
  },
  tokenValue: {
    color: '#888',
    fontSize: 11,
  },
  historySection: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  historyScroll: {
    flexDirection: 'row',
  },
  historyItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
    alignItems: 'center',
  },
  historyItemSelected: {
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    borderWidth: 1,
    borderColor: '#4ECDC4',
  },
  historyTime: {
    color: '#888',
    fontSize: 10,
  },
  historyDuration: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
    marginTop: 12,
  },
  emptyHint: {
    color: '#555',
    fontSize: 12,
    marginTop: 4,
  },
});

