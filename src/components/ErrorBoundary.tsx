import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Responsive font scaling for class components (can't use hooks)
const { width: screenWidth } = Dimensions.get('window');
const BASE_WIDTH = 375;
const scaleFactor = Math.min(Math.max(screenWidth / BASE_WIDTH, 0.8), 1.4);
const scalePx = (px: number) => Math.round(px * scaleFactor);

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
  errorCount: number;
  lastErrorTime: number;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: 0
    };
  }

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      error,
      lastErrorTime: Date.now()
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
    };

    console.error('Error caught by boundary:', errorDetails);

    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorCount, lastErrorTime } = this.state;
      const formattedTime = new Date(lastErrorTime).toLocaleTimeString();

      return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="warning" size={64} color="#ef4444" />
          </View>

          <Text style={styles.title}>Something Went Wrong</Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Error Details:</Text>
            <Text style={styles.error}>{error?.message || 'Unknown error'}</Text>
            {errorCount > 1 && (
              <Text style={styles.warningText}>
                This error has occurred {errorCount} times
              </Text>
            )}
            <Text style={styles.timestamp}>Time: {formattedTime}</Text>
          </View>

          {errorInfo?.componentStack && (
            <View style={styles.stackBox}>
              <Text style={styles.stackTitle}>Component Stack:</Text>
              <Text style={styles.stack}>{errorInfo.componentStack}</Text>
            </View>
          )}

          {error?.stack && (
            <View style={styles.stackBox}>
              <Text style={styles.stackTitle}>Error Stack:</Text>
              <Text style={styles.stack}>{error.stack}</Text>
            </View>
          )}

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
              <Ionicons name="refresh" size={20} color="white" />
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.reloadButton} onPress={this.handleReload}>
              <Ionicons name="reload" size={20} color="white" />
              <Text style={styles.buttonText}>Reload App</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.helpText}>
            If this problem persists, please contact support with the error details above.
          </Text>
        </ScrollView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  contentContainer: {
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: 40,
    marginBottom: 20,
  },
  title: {
    fontSize: scalePx(24),
    color: '#ef4444',
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  infoBox: {
    width: '100%',
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  infoLabel: {
    fontSize: scalePx(14),
    color: '#a1a1aa',
    marginBottom: 8,
    fontWeight: '600',
  },
  error: {
    fontSize: scalePx(16),
    color: 'white',
    marginBottom: 8,
  },
  warningText: {
    fontSize: scalePx(14),
    color: '#f59e0b',
    marginTop: 8,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: scalePx(12),
    color: '#71717a',
    marginTop: 4,
  },
  stackBox: {
    width: '100%',
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    maxHeight: 200,
  },
  stackTitle: {
    fontSize: scalePx(12),
    color: '#a1a1aa',
    marginBottom: 8,
    fontWeight: '600',
  },
  stack: {
    fontSize: scalePx(11),
    color: '#71717a',
    fontFamily: 'monospace',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 20,
    width: '100%',
  },
  retryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#8b5cf6',
    paddingVertical: 14,
    borderRadius: 8,
  },
  reloadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#27272a',
    paddingVertical: 14,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: scalePx(16),
    fontWeight: '600',
  },
  helpText: {
    fontSize: scalePx(12),
    color: '#71717a',
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 20,
  },
});

