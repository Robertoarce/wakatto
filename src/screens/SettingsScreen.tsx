import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { logout } from '../store/actions/authActions';
import { fetchUsage } from '../store/actions/usageActions';
import { configureAI, getAIConfig } from '../services/aiService';
import { TIER_NAMES, TIER_COLORS, formatTokens, getDaysUntilReset, getUsageColor } from '../services/usageTrackingService';
import { useSimpleNavigation } from '../navigation/AppNavigator';
import { runAllTests, TestResult } from '../services/aiConnectionTest';
import { useCustomAlert } from '../components/CustomAlert';
import { Button, Input, Card, Badge } from '../components/ui';
import { DisclaimerButton } from '../components/Disclaimer';
import { InviteButton } from '../components/InviteModal';
import { useResponsive } from '../constants/Layout';
import { runQuickBenchmark, runAnimationBenchmark, BenchmarkReport } from '../services/benchmarkService';
import { getProfiler } from '../services/profilingService';
// Temperature is now configured in code, not UI

type AIProvider = 'mock' | 'openai' | 'anthropic' | 'gemini';

const SettingsScreen = (): JSX.Element => {
  const { navigate } = useSimpleNavigation();
  const dispatch = useDispatch();
  const { showAlert, AlertComponent } = useCustomAlert();
  const { user } = useSelector((state: RootState) => state.auth);
  const { currentUsage, isLoading: usageLoading } = useSelector((state: RootState) => state.usage);
  const { fonts, spacing, layout, borderRadius, scalePx, isMobile } = useResponsive();

  // Dynamic styles for responsive typography
  const dynamicStyles = useMemo(() => ({
    section: { padding: spacing.lg },
    sectionTitle: { fontSize: fonts.lg, fontWeight: 'bold' as const, marginBottom: spacing.sm },
    label: { fontSize: fonts.sm, fontWeight: '600' as const, marginBottom: spacing.sm, marginTop: spacing.md },
    infoText: { fontSize: fonts.lg },
    aboutText: { fontSize: fonts.sm, marginBottom: spacing.sm },
    helperText: { fontSize: scalePx(11) },
    providerButtonText: { fontSize: fonts.sm, fontWeight: '600' as const },
    testResultLabel: { fontSize: fonts.sm, marginBottom: spacing.xs },
    testResultValue: { fontSize: fonts.lg, fontWeight: '600' as const, marginBottom: spacing.xs / 2 },
    infoRow: { gap: spacing.md, marginBottom: spacing.lg },
    providerButtons: { gap: spacing.sm, marginBottom: spacing.sm },
    providerButton: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      minHeight: layout.minTouchTarget,
      borderRadius: borderRadius.sm,
    },
    input: { fontSize: fonts.sm, borderRadius: borderRadius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.md },
    infoBox: { marginTop: spacing.md, padding: spacing.md, borderRadius: borderRadius.sm, gap: spacing.sm },
    infoBoxText: { fontSize: fonts.xs },
    warningBox: { marginTop: spacing.md, padding: spacing.md, borderRadius: borderRadius.sm, gap: spacing.sm },
    warningBoxText: { fontSize: fonts.xs },
    testResultsContainer: { marginTop: spacing.lg, padding: spacing.lg, borderRadius: borderRadius.sm },
    testResultsTitle: { fontSize: fonts.lg, marginBottom: spacing.md },
    testResult: { marginBottom: spacing.md, paddingBottom: spacing.md },
    testResultTime: { fontSize: fonts.xs },
    testError: { fontSize: fonts.xs, marginTop: spacing.xs },
    tierBadge: { borderRadius: borderRadius.xs, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs / 2 },
    usageProgressBar: { height: scalePx(8), borderRadius: borderRadius.xs },
    card: { borderRadius: borderRadius.md, padding: spacing.lg },
    logoutButton: { gap: spacing.sm, paddingVertical: spacing.md, borderRadius: borderRadius.sm },
    logoutButtonText: { fontSize: fonts.lg, fontWeight: '600' as const },
    saveButton: { paddingVertical: spacing.lg, borderRadius: borderRadius.sm, marginTop: spacing.lg },
    saveButtonText: { fontSize: fonts.lg },
    testButton: { paddingVertical: spacing.lg, borderRadius: borderRadius.sm, marginTop: spacing.md, gap: spacing.sm },
    testButtonText: { fontSize: fonts.lg, fontWeight: '600' as const },
    versionText: { fontSize: fonts.xs },
    }), [fonts, spacing, layout, borderRadius, scalePx]);

  const [aiProvider, setAIProvider] = useState<AIProvider>('anthropic');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('claude-3-haiku-20240307');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  
  // Benchmark state
  const [benchmarking, setBenchmarking] = useState(false);
  const [benchmarkReport, setBenchmarkReport] = useState<BenchmarkReport | null>(null);
  const [profilingEnabled, setProfilingEnabled] = useState(true);

  useEffect(() => {
    // Load current AI configuration
    const loadConfig = async () => {
      const config = await getAIConfig();
      setAIProvider(config.provider as AIProvider);
      setApiKey(config.apiKey || '');
      setModel(config.model || '');
    };
    loadConfig();
  }, []);

  // Fetch usage data on mount
  useEffect(() => {
    dispatch(fetchUsage() as any);
  }, [dispatch]);

  const handleSaveAISettings = async () => {
    await configureAI({
      provider: aiProvider,
      apiKey: apiKey,
      model: model || undefined,
    });
    showAlert('Success', 'AI settings saved securely!');
  };

  const handleTestConnection = async () => {
    if (!apiKey && aiProvider !== 'mock') {
      showAlert('Error', 'Please enter an API key first');
      return;
    }

    // Save settings first to ensure test uses latest config
    console.log('[Settings] Saving AI config before test:', {
      provider: aiProvider,
      hasApiKey: !!apiKey,
      model: model || 'default'
    });

    await configureAI({
      provider: aiProvider,
      apiKey: apiKey,
      model: model || undefined,
    });

    setTesting(true);
    setTestResults(null);

    try {
      console.log('[Settings] Starting AI tests...');
      const results = await runAllTests(apiKey, aiProvider as any);
      console.log('[Settings] Test results:', results);
      setTestResults(results);

      if (results.allPassed) {
        showAlert('Success', 'All AI tests passed! Ready for knowledge graph.');
      } else {
        showAlert('Tests Failed', 'Some tests failed. Check results below.');
      }
    } catch (error: any) {
      console.error('[Settings] Test error:', error);
      showAlert('Error', error.message || 'Failed to run tests');
      setTestResults({
        allPassed: false,
        results: {
          basicConnection: { success: false, error: error.message, provider: aiProvider, responseTime: 0 },
          entityExtraction: { success: false, error: 'Not run', provider: aiProvider, responseTime: 0 },
          emotionDetection: { success: false, error: 'Not run', provider: aiProvider, responseTime: 0 },
        }
      });
    } finally {
      setTesting(false);
    }
  };

  const handleLogout = () => {
    showAlert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await dispatch(logout() as any);
            navigate('Login');
          },
        },
      ]
    );
  };

  const getDefaultModel = (provider: AIProvider) => {
    switch (provider) {
      case 'openai': return 'gpt-4';
      case 'anthropic': return 'claude-3-sonnet-20240229';
      case 'gemini': return 'gemini-pro';
      default: return '';
    }
  };

  // Benchmark handler - uses animation-preserving strategies
  const handleRunBenchmark = async () => {
    if (aiProvider === 'mock') {
      showAlert('Info', 'Benchmark requires a real AI provider. Please configure API key first.');
      return;
    }

    setBenchmarking(true);
    setBenchmarkReport(null);

    try {
      console.log('[Settings] Starting animation-preserving benchmark...');
      // Use the new animation benchmark that keeps all animation features
      const report = await runAnimationBenchmark(2);
      console.log('[Settings] Benchmark complete:', report.summary);
      setBenchmarkReport(report);
      showAlert('Benchmark Complete', `Winner: ${report.winner.strategy} (${report.winner.improvement.toFixed(1)}% faster than baseline)`);
    } catch (error: any) {
      console.error('[Settings] Benchmark error:', error);
      showAlert('Error', 'Benchmark failed: ' + error.message);
    } finally {
      setBenchmarking(false);
    }
  };

  // Toggle profiling
  const handleToggleProfiling = () => {
    const profiler = getProfiler();
    const newState = !profilingEnabled;
    profiler.setEnabled(newState);
    setProfilingEnabled(newState);
    showAlert('Profiling', newState ? 'Profiling enabled. Press Ctrl+Shift+P to view dashboard.' : 'Profiling disabled.');
  };

  // Clear profiling history
  const handleClearProfilingHistory = () => {
    const profiler = getProfiler();
    profiler.clearHistory();
    showAlert('Cleared', 'Profiling history cleared.');
  };

  return (
    <ScrollView style={styles.container}>
      <AlertComponent />
      <View style={[styles.section, { padding: spacing.lg }]}>
        <Text style={[styles.sectionTitle, { fontSize: fonts.lg, marginBottom: spacing.md }]}>Account</Text>
        <Card variant="elevated">
          <View style={[styles.infoRow, { gap: spacing.md, marginBottom: spacing.lg }]}>
            <Ionicons name="person-outline" size={isMobile ? 18 : 20} color="#a1a1aa" />
            <Text style={[styles.infoText, { fontSize: fonts.md }]}>{user?.email || 'Not logged in'}</Text>
          </View>
          <Button
            title="Logout"
            onPress={handleLogout}
            variant="danger"
            icon="log-out-outline"
            fullWidth
            size="md"
          />
        </Card>
      </View>

      {/* Usage & Subscription Section */}
      <View style={[styles.section, { padding: spacing.lg }]}>
        <Text style={[styles.sectionTitle, { fontSize: fonts.lg, marginBottom: spacing.md }]}>Usage & Subscription</Text>
        <Card variant="elevated">
          {usageLoading ? (
            <View style={[styles.loadingContainer, { padding: spacing.xl }]}>
              <ActivityIndicator size="small" color="#8b5cf6" />
              <Text style={[styles.loadingText, { fontSize: fonts.sm, marginTop: spacing.sm }]}>Loading usage...</Text>
            </View>
          ) : currentUsage ? (
            <>
              {/* Tier Badge */}
              <View style={[styles.tierRow, { marginBottom: spacing.md }]}>
                <View style={[styles.tierBadge, { borderColor: TIER_COLORS[currentUsage.tier] }]}>
                  <Text style={[styles.tierText, { color: TIER_COLORS[currentUsage.tier], fontSize: fonts.sm }]}>
                    {TIER_NAMES[currentUsage.tier]}
                  </Text>
                </View>
                {currentUsage.tier === 'admin' ? (
                  <Text style={[styles.unlimitedText, { fontSize: fonts.sm }]}>Unlimited</Text>
                ) : (
                  <Text style={[styles.resetText, { fontSize: fonts.sm }]}>
                    Resets in {getDaysUntilReset(currentUsage.periodEnd)} days
                  </Text>
                )}
              </View>

              {/* Usage Progress Bar (not shown for admin) */}
              {currentUsage.tier !== 'admin' && (
                <>
                  <View style={styles.usageProgressContainer}>
                    <View style={styles.usageProgressBar}>
                      <View
                        style={[
                          styles.usageProgressFill,
                          {
                            width: `${Math.min(100, currentUsage.usagePercentage)}%`,
                            backgroundColor: getUsageColor(currentUsage.usagePercentage),
                          },
                        ]}
                      />
                      {/* Threshold markers */}
                      <View style={[styles.usageMarker, { left: '80%' }]} />
                      <View style={[styles.usageMarker, { left: '90%' }]} />
                    </View>
                  </View>

                  {/* Usage Stats */}
                  <View style={[styles.usageStatsRow, { marginTop: spacing.sm }]}>
                    <Text style={[styles.usageStatsText, { fontSize: fonts.sm }]}>
                      {formatTokens(currentUsage.tokensUsed)} / {formatTokens(currentUsage.tokenLimit)} tokens
                    </Text>
                    <Text
                      style={[
                        styles.usagePercentage,
                        { fontSize: fonts.sm, color: getUsageColor(currentUsage.usagePercentage) },
                      ]}
                    >
                      {currentUsage.usagePercentage.toFixed(0)}%
                    </Text>
                  </View>

                  {/* Remaining Tokens */}
                  <Text style={[styles.remainingText, { fontSize: fonts.xs, marginTop: spacing.xs }]}>
                    {formatTokens(currentUsage.remainingTokens)} tokens remaining
                  </Text>

                  {/* Warning Message */}
                  {currentUsage.warningLevel && (
                    <View
                      style={[
                        styles.warningBox,
                        {
                          marginTop: spacing.md,
                          padding: spacing.md,
                          backgroundColor:
                            currentUsage.warningLevel === 'blocked'
                              ? '#FEE2E2'
                              : currentUsage.warningLevel === 'critical'
                              ? '#FEF3C7'
                              : '#FEF9C3',
                        },
                      ]}
                    >
                      <Ionicons
                        name="warning-outline"
                        size={18}
                        color={
                          currentUsage.warningLevel === 'blocked'
                            ? '#991B1B'
                            : currentUsage.warningLevel === 'critical'
                            ? '#92400E'
                            : '#854D0E'
                        }
                      />
                      <Text
                        style={[
                          styles.warningText,
                          {
                            fontSize: fonts.xs,
                            color:
                              currentUsage.warningLevel === 'blocked'
                                ? '#991B1B'
                                : currentUsage.warningLevel === 'critical'
                                ? '#92400E'
                                : '#854D0E',
                          },
                        ]}
                      >
                        {currentUsage.warningLevel === 'blocked'
                          ? 'Token limit reached. Please wait for reset or upgrade.'
                          : currentUsage.warningLevel === 'critical'
                          ? 'Running low on tokens. Consider upgrading.'
                          : 'You\'re approaching your token limit.'}
                      </Text>
                    </View>
                  )}
                </>
              )}

              {/* Upgrade Button (not shown for admin or gold) */}
              {currentUsage.tier !== 'admin' && currentUsage.tier !== 'gold' && (
                <Button
                  title="Upgrade Plan"
                  onPress={() => showAlert('Coming Soon', 'Subscription upgrades will be available soon!')}
                  variant="primary"
                  icon="arrow-up-outline"
                  fullWidth
                  size="md"
                  style={{ marginTop: spacing.md }}
                />
              )}
            </>
          ) : (
            <Text style={[styles.errorText, { fontSize: fonts.sm }]}>Unable to load usage data</Text>
          )}
        </Card>
      </View>

      <View style={[styles.section, { padding: spacing.lg }]}>
        <Text style={[styles.sectionTitle, { fontSize: fonts.lg, marginBottom: spacing.md }]}>AI Configuration</Text>
        <Card variant="elevated">
          <Text style={[styles.label, { fontSize: fonts.sm, marginBottom: spacing.sm }]}>AI Provider</Text>
          <View style={[styles.providerButtons, { gap: spacing.sm }]}>
            {(['mock', 'openai', 'anthropic', 'gemini'] as AIProvider[]).map((provider) => (
              <TouchableOpacity
                key={provider}
                style={[
                  styles.providerButton,
                  aiProvider === provider && styles.providerButtonActive,
                  { 
                    paddingHorizontal: spacing.lg, 
                    paddingVertical: spacing.md,
                    minHeight: layout.minTouchTarget,
                  }
                ]}
                onPress={() => {
                  setAIProvider(provider);
                  if (provider !== 'mock' && !model) {
                    setModel(getDefaultModel(provider));
                  }
                }}
              >
                <Text
                  style={[
                    styles.providerButtonText,
                    { fontSize: fonts.sm },
                    aiProvider === provider && styles.providerButtonTextActive,
                  ]}
                >
                  {provider === 'mock' ? 'Mock (Dev)' : provider.charAt(0).toUpperCase() + provider.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {aiProvider === 'mock' && (
            <View style={[styles.infoBox, { marginTop: spacing.md, padding: spacing.md }]}>
              <Ionicons name="information-circle-outline" size={isMobile ? 18 : 20} color="#8b5cf6" />
              <Text style={[styles.infoBoxText, { fontSize: fonts.sm }]}>
                Mock mode uses simulated responses. No API key needed. Great for testing!
              </Text>
            </View>
          )}

          {aiProvider !== 'mock' && (
            <>
              <Input
                label="API Key"
                placeholder={`Enter your ${aiProvider} API key`}
                value={apiKey}
                onChangeText={setApiKey}
                secureTextEntry
                showPasswordToggle
                autoCapitalize="none"
                icon="key-outline"
              />

              <Input
                label="Model (Optional)"
                placeholder={getDefaultModel(aiProvider)}
                value={model}
                onChangeText={setModel}
                autoCapitalize="none"
                icon="cube-outline"
                helperText="Leave empty to use default model"
              />

              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={20} color="#c4b5fd" />
                <Text style={styles.infoBoxText}>
                  🔒 Your API key is stored locally in your browser only. It is never sent to our servers or saved in any database. Clear your browser data to remove it.
                </Text>
              </View>
            </>
          )}

          <Button
            title="Save AI Settings"
            onPress={handleSaveAISettings}
            variant="success"
            fullWidth
            size="md"
            icon="checkmark-circle-outline"
          />

          <Button
            title={testing ? "Testing..." : "Test AI Connection"}
            onPress={handleTestConnection}
            disabled={testing}
            loading={testing}
            variant="secondary"
            fullWidth
            size="md"
            icon="flask-outline"
            style={{ marginTop: 12 }}
          />

          {testResults && (
            <View style={styles.testResultsContainer}>
              <Text style={styles.testResultsTitle}>
                {testResults.allPassed ? '✅ All Tests Passed' : '⚠️ Some Tests Failed'}
              </Text>
              
              <View style={styles.testResult}>
                <Text style={styles.testResultLabel}>Basic Connection:</Text>
                <Text style={[styles.testResultValue, testResults.results.basicConnection.success ? styles.testSuccess : styles.testFail]}>
                  {testResults.results.basicConnection.success ? '✅ Success' : '❌ Failed'}
                </Text>
                <Text style={styles.testResultTime}>
                  {testResults.results.basicConnection.responseTime}ms
                </Text>
                {testResults.results.basicConnection.error && (
                  <Text style={styles.testError}>{testResults.results.basicConnection.error}</Text>
                )}
              </View>

              <View style={styles.testResult}>
                <Text style={styles.testResultLabel}>Entity Extraction:</Text>
                <Text style={[styles.testResultValue, testResults.results.entityExtraction.success ? styles.testSuccess : styles.testFail]}>
                  {testResults.results.entityExtraction.success ? '✅ Success' : '❌ Failed'}
                </Text>
                <Text style={styles.testResultTime}>
                  {testResults.results.entityExtraction.responseTime}ms
                </Text>
                {testResults.results.entityExtraction.error && (
                  <Text style={styles.testError}>{testResults.results.entityExtraction.error}</Text>
                )}
              </View>

              <View style={styles.testResult}>
                <Text style={styles.testResultLabel}>Emotion Detection:</Text>
                <Text style={[styles.testResultValue, testResults.results.emotionDetection.success ? styles.testSuccess : styles.testFail]}>
                  {testResults.results.emotionDetection.success ? '✅ Success' : '❌ Failed'}
                </Text>
                <Text style={styles.testResultTime}>
                  {testResults.results.emotionDetection.responseTime}ms
                </Text>
                {testResults.results.emotionDetection.error && (
                  <Text style={styles.testError}>{testResults.results.emotionDetection.error}</Text>
                )}
              </View>
            </View>
          )}
        </Card>
      </View>

      {/* Developer Tools Section - Only for admin */}
      {user?.email === 'roberto@briatti.com' && (
      <View style={[styles.section, { padding: spacing.lg }]}>
        <Text style={[styles.sectionTitle, { fontSize: fonts.lg, marginBottom: spacing.md }]}>
          🛠️ Developer Tools
        </Text>
        <Card variant="elevated">
          <View style={styles.infoBox}>
            <Ionicons name="speedometer-outline" size={20} color="#4ECDC4" />
            <Text style={styles.infoBoxText}>
              Performance profiling and benchmarking tools for response time optimization.
            </Text>
          </View>

          {/* Profiling Controls */}
          <View style={{ marginTop: spacing.md }}>
            <Text style={[styles.label, { fontSize: fonts.sm, marginBottom: spacing.sm }]}>
              Profiling
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button
                title={profilingEnabled ? "Profiling: ON" : "Profiling: OFF"}
                onPress={handleToggleProfiling}
                variant={profilingEnabled ? "success" : "secondary"}
                size="sm"
                icon={profilingEnabled ? "checkmark-circle" : "close-circle"}
              />
              <Button
                title="Clear History"
                onPress={handleClearProfilingHistory}
                variant="secondary"
                size="sm"
                icon="trash-outline"
              />
            </View>
            <Text style={[styles.helperText, { marginTop: spacing.xs }]}>
              Press Ctrl+Shift+P to toggle profiling dashboard
            </Text>
          </View>

          {/* Benchmark */}
          <View style={{ marginTop: spacing.lg }}>
            <Text style={[styles.label, { fontSize: fonts.sm, marginBottom: spacing.sm }]}>
              Animation Benchmark
            </Text>
            <Button
              title={benchmarking ? "Running Benchmark..." : "Run Animation Benchmark"}
              onPress={handleRunBenchmark}
              disabled={benchmarking || aiProvider === 'mock'}
              loading={benchmarking}
              variant="primary"
              fullWidth
              size="md"
              icon="analytics-outline"
            />
            <Text style={[styles.helperText, { marginTop: spacing.xs }]}>
              Tests strategies that KEEP animations (baseline vs compact-prompt vs compact-json)
            </Text>
          </View>

          {/* Benchmark Results */}
          {benchmarkReport && (
            <View style={[styles.testResultsContainer, { marginTop: spacing.md }]}>
              <Text style={styles.testResultsTitle}>
                🏆 Winner: {benchmarkReport.winner.strategy}
              </Text>
              <Text style={[styles.helperText, { marginTop: spacing.xs }]}>
                {benchmarkReport.winner.improvement.toFixed(1)}% faster than baseline
              </Text>
              
              {benchmarkReport.results.map((result, index) => (
                <View key={index} style={[styles.testResult, { marginTop: spacing.sm }]}>
                  <Text style={styles.testResultLabel}>
                    {result.config.strategy}:
                  </Text>
                  <Text style={[
                    styles.testResultValue, 
                    result.config.strategy === benchmarkReport.winner.strategy 
                      ? styles.testSuccess 
                      : { color: '#a1a1aa' }
                  ]}>
                    {result.avgDurationMs.toFixed(0)}ms avg
                  </Text>
                  <Text style={styles.testResultTime}>
                    ({result.iterations} runs)
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Card>
      </View>
      )}

      {/* Invite Friends Section */}
      <View style={[styles.section, { padding: spacing.lg }]}>
        <Text style={[styles.sectionTitle, { fontSize: fonts.lg, marginBottom: spacing.md }]}>Invite & Earn</Text>
        <InviteButton />
      </View>

      <View style={styles.section}>
        <Text style={dynamicStyles.sectionTitle}>About</Text>
        <Card variant="elevated">
          <Text style={dynamicStyles.aboutText}>Wakatto - AI Conversation Companions</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm }}>
            <Badge label="Version 0.1.0" variant="info" />
            <Badge label="Beta" variant="warning" />
          </View>
        </Card>
      </View>

      {/* Legal Section */}
      <View style={[styles.section, { padding: spacing.lg }]}>
        <Text style={[styles.sectionTitle, { fontSize: fonts.lg, marginBottom: spacing.md }]}>Legal</Text>
        <DisclaimerButton />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  section: {},
  sectionTitle: {
    fontWeight: 'bold',
    color: 'white',
  },
  card: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    color: '#a1a1aa',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  logoutButtonText: {
    color: '#ef4444',
  },
  label: {
    color: '#d4d4d8',
  },
  providerButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  providerButton: {
    backgroundColor: '#27272a',
    borderWidth: 2,
    borderColor: '#27272a',
  },
  providerButtonActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  providerButtonText: {
    color: '#a1a1aa',
  },
  providerButtonTextActive: {
    color: 'white',
  },
  input: {
    backgroundColor: '#27272a',
    color: 'white',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  inputWithIcon: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWithButton: {
    flex: 1,
    backgroundColor: '#27272a',
    color: 'white',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  eyeButton: {
    position: 'absolute',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#1e1b4b',
    borderWidth: 1,
    borderColor: '#4c1d95',
  },
  infoBoxText: {
    flex: 1,
    color: '#c4b5fd',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#422006',
    borderWidth: 1,
    borderColor: '#78350f',
  },
  warningBoxText: {
    flex: 1,
    color: '#fbbf24',
  },
  saveButton: {
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  testButton: {
    backgroundColor: '#06b6d4',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  testButtonDisabled: {
    opacity: 0.6,
  },
  testButtonText: {
    color: 'white',
  },
  testResultsContainer: {
    backgroundColor: '#27272a',
  },
  testResultsTitle: {
    color: 'white',
    fontWeight: 'bold',
  },
  testResult: {
    borderBottomWidth: 1,
    borderBottomColor: '#3f3f46',
  },
  testResultLabel: {
    color: '#a1a1aa',
  },
  testResultValue: {},
  testSuccess: {
    color: '#10b981',
  },
  testFail: {
    color: '#ef4444',
  },
  testResultTime: {
    color: '#71717a',
  },
  testError: {
    color: '#ef4444',
    fontStyle: 'italic',
  },
  aboutText: {
    color: '#a1a1aa',
  },
  versionText: {
    color: '#71717a',
  },
  helperText: {
    color: '#71717a',
  },
  // Usage section styles
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#71717a',
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tierBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tierText: {
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  unlimitedText: {
    color: '#9CA3AF',
  },
  resetText: {
    color: '#9CA3AF',
  },
  usageProgressContainer: {
    marginBottom: 4,
  },
  usageProgressBar: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  usageProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  usageMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  usageStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  usageStatsText: {
    color: '#D1D5DB',
  },
  usagePercentage: {
    fontWeight: '600',
  },
  remainingText: {
    color: '#9CA3AF',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 8,
  },
  warningText: {
    flex: 1,
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
  },
});

export default SettingsScreen;
