import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { logout } from '../store/actions/authActions';
import { configureAI, getAIConfig } from '../services/aiService';
import { useNavigation } from '@react-navigation/native';
import { runAllTests, TestResult } from '../services/aiConnectionTest';
import { useCustomAlert } from '../components/CustomAlert';
import { Button, Input, Card, Badge } from '../components/ui';
import { useResponsive } from '../constants/Layout';

type AIProvider = 'mock' | 'openai' | 'anthropic' | 'gemini';

const SettingsScreen = (): JSX.Element => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { showAlert, AlertComponent } = useCustomAlert();
  const { user } = useSelector((state: RootState) => state.auth);
  const { fonts, spacing, layout, isMobile } = useResponsive();

  const [aiProvider, setAIProvider] = useState<AIProvider>('anthropic');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('claude-3-haiku-20240307');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

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
            navigation.navigate('Login' as never);
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Card variant="elevated">
          <Text style={styles.aboutText}>Psyche AI - Your Personal Journal Companion</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <Badge label="Version 0.1.0" variant="info" />
            <Badge label="Beta" variant="warning" />
          </View>
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#171717',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  infoText: {
    color: '#a1a1aa',
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  logoutButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  label: {
    color: '#d4d4d8',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  providerButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  providerButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
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
    fontSize: 14,
    fontWeight: '600',
  },
  providerButtonTextActive: {
    color: 'white',
  },
  input: {
    backgroundColor: '#27272a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: 'white',
    fontSize: 14,
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
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingRight: 44,
    color: 'white',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  infoBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#1e1b4b',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#4c1d95',
  },
  infoBoxText: {
    flex: 1,
    color: '#c4b5fd',
    fontSize: 13,
  },
  warningBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#422006',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#78350f',
  },
  warningBoxText: {
    flex: 1,
    color: '#fbbf24',
    fontSize: 13,
  },
  saveButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  testButton: {
    backgroundColor: '#06b6d4',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  testButtonDisabled: {
    opacity: 0.6,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  testResultsContainer: {
    marginTop: 16,
    backgroundColor: '#27272a',
    borderRadius: 8,
    padding: 16,
  },
  testResultsTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  testResult: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3f3f46',
  },
  testResultLabel: {
    color: '#a1a1aa',
    fontSize: 14,
    marginBottom: 4,
  },
  testResultValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  testSuccess: {
    color: '#10b981',
  },
  testFail: {
    color: '#ef4444',
  },
  testResultTime: {
    color: '#71717a',
    fontSize: 12,
  },
  testError: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  aboutText: {
    color: '#a1a1aa',
    fontSize: 14,
    marginBottom: 8,
  },
  versionText: {
    color: '#71717a',
    fontSize: 12,
  },
});

export default SettingsScreen;
