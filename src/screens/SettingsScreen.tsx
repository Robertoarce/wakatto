import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { logout } from '../store/actions/authActions';
import { configureAI, getAIConfig } from '../services/aiService';
import { useNavigation } from '@react-navigation/native';

type AIProvider = 'mock' | 'openai' | 'anthropic' | 'gemini';

const SettingsScreen = (): JSX.Element => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [aiProvider, setAIProvider] = useState<AIProvider>('mock');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');

  useEffect(() => {
    // Load current AI configuration
    const config = getAIConfig();
    setAIProvider(config.provider as AIProvider);
    setApiKey(config.apiKey || '');
    setModel(config.model || '');
  }, []);

  const handleSaveAISettings = () => {
    configureAI({
      provider: aiProvider,
      apiKey: apiKey,
      model: model || undefined,
    });
    Alert.alert('Success', 'AI settings saved successfully!');
  };

  const handleLogout = () => {
    Alert.alert(
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
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color="#a1a1aa" />
            <Text style={styles.infoText}>{user?.email || 'Not logged in'}</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Configuration</Text>
        <View style={styles.card}>
          <Text style={styles.label}>AI Provider</Text>
          <View style={styles.providerButtons}>
            {(['mock', 'openai', 'anthropic', 'gemini'] as AIProvider[]).map((provider) => (
              <TouchableOpacity
                key={provider}
                style={[
                  styles.providerButton,
                  aiProvider === provider && styles.providerButtonActive,
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
                    aiProvider === provider && styles.providerButtonTextActive,
                  ]}
                >
                  {provider === 'mock' ? 'Mock (Dev)' : provider.charAt(0).toUpperCase() + provider.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {aiProvider === 'mock' && (
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color="#8b5cf6" />
              <Text style={styles.infoBoxText}>
                Mock mode uses simulated responses. No API key needed. Great for testing!
              </Text>
            </View>
          )}

          {aiProvider !== 'mock' && (
            <>
              <Text style={styles.label}>API Key</Text>
              <TextInput
                style={styles.input}
                placeholder={`Enter your ${aiProvider} API key`}
                placeholderTextColor="#71717a"
                value={apiKey}
                onChangeText={setApiKey}
                secureTextEntry
                autoCapitalize="none"
              />

              <Text style={styles.label}>Model (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder={getDefaultModel(aiProvider)}
                placeholderTextColor="#71717a"
                value={model}
                onChangeText={setModel}
                autoCapitalize="none"
              />

              <View style={styles.warningBox}>
                <Ionicons name="warning-outline" size={20} color="#f59e0b" />
                <Text style={styles.warningBoxText}>
                  ⚠️ Storing API keys in the app is not secure for production. Use at your own risk for development only.
                </Text>
              </View>
            </>
          )}

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveAISettings}>
            <Text style={styles.saveButtonText}>Save AI Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <Text style={styles.aboutText}>Psyche AI - Your Personal Journal Companion</Text>
          <Text style={styles.versionText}>Version 0.1.0</Text>
        </View>
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
