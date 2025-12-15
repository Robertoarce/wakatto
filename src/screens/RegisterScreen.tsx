import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { signUp } from '../services/supabaseService';
import { setSession } from '../store/actions/authActions';
import { useCustomAlert } from '../components/CustomAlert';
import { AnimatedBackground3D } from '../components/AnimatedBackground3D';
import { Button, Input } from '../components/ui';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { showAlert, AlertComponent } = useCustomAlert();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'signIn' | 'signUp'>('signUp');

  async function signUpWithEmail() {
    // Validation
    if (!name.trim()) {
      showAlert('Validation Error', 'Please enter your name.');
      return;
    }
    if (!email.trim()) {
      showAlert('Validation Error', 'Please enter your email.');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      showAlert('Validation Error', 'Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      showAlert('Validation Error', 'Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const metadata = {
        name: name.trim(),
        phone: phone.trim() || undefined,
      };
      await signUp(email.trim().toLowerCase(), password, metadata);
      showAlert(
        'Success!',
        'Account created successfully! Please check your email to confirm your account before signing in.',
        [{ text: 'Go to Login', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error: any) {
      // Provide user-friendly error messages
      let errorMessage = error.message;
      if (errorMessage.includes('already registered')) {
        errorMessage = 'This email is already registered. Please sign in instead.';
      } else if (errorMessage.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (errorMessage.includes('Password')) {
        errorMessage = 'Password must be at least 6 characters long.';
      }
      showAlert('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  }

  function skipLoginWithDemo() {
    // Create a demo session without authentication
    const demoSession = {
      access_token: 'demo-token',
      refresh_token: 'demo-refresh-token',
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: 'demo-user-id',
        email: 'demo@wakatto.app',
        user_metadata: { name: 'Demo User' },
      },
    };

    const demoUser = {
      id: 'demo-user-id',
      email: 'demo@wakatto.app',
      user_metadata: { name: 'Demo User' },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };

    // Set demo session in Redux store
    dispatch(setSession(demoSession, demoUser));
    navigation.navigate('Main');
  }

  const handleTabSwitch = (tab: 'signIn' | 'signUp') => {
    setActiveTab(tab);
    if (tab === 'signIn') {
      navigation.navigate('Login');
    }
  };

  return (
    <View style={styles.container}>
      <AlertComponent />

      {/* 3D Animated Background */}
      <AnimatedBackground3D />

      {/* Register Card */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Logo Icon */}
          <View style={styles.logoContainer}>
            <View style={styles.logoBackground}>
              <Ionicons name="chatbubbles" size={40} color="white" />
            </View>
          </View>

          {/* Welcome Text */}
          <Text style={styles.title}>Welcome to Wakatto</Text>
          <Text style={styles.subtitle}>Organize social events with friends effortlessly</Text>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'signIn' && styles.activeTab]}
              onPress={() => handleTabSwitch('signIn')}
            >
              <Text style={[styles.tabText, activeTab === 'signIn' && styles.activeTabText]}>
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'signUp' && styles.activeTab]}
              onPress={() => handleTabSwitch('signUp')}
            >
              <Text style={[styles.tabText, activeTab === 'signUp' && styles.activeTabText]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Name"
              placeholder="Your name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              icon="person-outline"
            />

            <Input
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              icon="mail-outline"
            />

            <Input
              label="Phone (optional)"
              placeholder="+1 (555) 123-4567"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              icon="call-outline"
            />

            <Input
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              showPasswordToggle
              icon="lock-closed-outline"
              helperText="Must be at least 6 characters"
            />

            <Button
              title={loading ? 'Creating Account...' : 'Sign Up'}
              onPress={signUpWithEmail}
              disabled={loading}
              loading={loading}
              fullWidth
              size="lg"
              style={{ marginTop: 8 }}
            />

            {/* Skip Login Button */}
            <Button
              title="Skip Login, Use Demo Account"
              onPress={skipLoginWithDemo}
              disabled={loading}
              variant="outline"
              fullWidth
              size="md"
              icon="play-circle-outline"
              style={{ marginTop: 12 }}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: '100%',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#2a2a2a',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 24,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBackground: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#5b7ef6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#5b7ef6',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#9ca3af',
  },
  activeTabText: {
    color: '#ffffff',
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#d1d5db',
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    paddingHorizontal: 16,
    color: '#ffffff',
    fontSize: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  signUpButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#5b7ef6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  signUpButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  devButton: {
    width: '100%',
    height: 48,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  devButtonText: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: '600',
  },
  demoButton: {
    width: '100%',
    height: 48,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#f97316',
    flexDirection: 'row',
  },
  demoButtonText: {
    color: '#f97316',
    fontSize: 15,
    fontWeight: '500',
  },
  demoIcon: {
    marginRight: 8,
  },
});
