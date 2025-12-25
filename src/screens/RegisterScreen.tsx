import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { signUp } from '../services/supabaseService';
import { setSession } from '../store/actions/authActions';
import { useCustomAlert } from '../components/CustomAlert';
import { AnimatedBackground3D } from '../components/AnimatedBackground3D';
import { Button, Input } from '../components/ui';
import { useResponsive } from '../constants/Layout';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { showAlert, AlertComponent } = useCustomAlert();
  const { fonts, spacing, borderRadius, scalePx, isMobile, isTablet } = useResponsive();

  // Responsive styles
  const dynamicStyles = useMemo(() => ({
    scrollContent: {
      padding: spacing.xl,
    },
    card: {
      width: '100%' as const,
      maxWidth: isMobile ? scalePx(440) : isTablet ? scalePx(520) : scalePx(600),
      backgroundColor: '#2a2a2a',
      borderRadius: borderRadius.xl,
      padding: isMobile ? spacing.xl : spacing.xxl,
      borderWidth: 1,
      borderColor: '#3a3a3a',
    },
    logoContainer: {
      marginBottom: spacing.xl,
    },
    logoBackground: {
      width: isMobile ? scalePx(70) : scalePx(90),
      height: isMobile ? scalePx(70) : scalePx(90),
      borderRadius: borderRadius.xl,
      backgroundColor: '#5b7ef6',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    title: {
      fontSize: fonts.xxl,
      fontWeight: '600' as const,
      color: '#ffffff',
      textAlign: 'center' as const,
      marginBottom: spacing.sm,
    },
    subtitle: {
      fontSize: fonts.md,
      color: '#9ca3af',
      textAlign: 'center' as const,
      marginBottom: spacing.xl,
    },
    tabContainer: {
      borderRadius: borderRadius.md,
      padding: spacing.xs,
    },
    tab: {
      paddingVertical: spacing.md,
      borderRadius: borderRadius.sm,
    },
    tabText: {
      fontSize: fonts.md,
      fontWeight: '500' as const,
      color: '#9ca3af',
    },
  }), [fonts, spacing, borderRadius, scalePx, isMobile, isTablet]);
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
        contentContainerStyle={[styles.scrollContent, dynamicStyles.scrollContent]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, dynamicStyles.card]}>
          {/* Logo Icon */}
          <View style={[styles.logoContainer, dynamicStyles.logoContainer]}>
            <View style={dynamicStyles.logoBackground}>
              <Ionicons name="chatbubbles" size={isMobile ? scalePx(35) : scalePx(45)} color="white" />
            </View>
          </View>

          {/* Welcome Text */}
          <Text style={dynamicStyles.title}>Welcome to Wakatto</Text>
          <Text style={dynamicStyles.subtitle}>Organize social events with friends effortlessly</Text>

          {/* Tabs */}
          <View style={[styles.tabContainer, dynamicStyles.tabContainer, { marginBottom: spacing.xl }]}>
            <TouchableOpacity
              style={[styles.tab, dynamicStyles.tab, activeTab === 'signIn' && styles.activeTab]}
              onPress={() => handleTabSwitch('signIn')}
            >
              <Text style={[dynamicStyles.tabText, activeTab === 'signIn' && styles.activeTabText]}>
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, dynamicStyles.tab, activeTab === 'signUp' && styles.activeTab]}
              onPress={() => handleTabSwitch('signUp')}
            >
              <Text style={[dynamicStyles.tabText, activeTab === 'signUp' && styles.activeTabText]}>
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
              style={{ marginTop: spacing.sm }}
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
              style={{ marginTop: spacing.md }}
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
    minHeight: '100%',
  },
  card: {
    width: '100%',
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
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1f1f1f',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#5b7ef6',
  },
  activeTabText: {
    color: '#ffffff',
  },
  form: {
    width: '100%',
  },
});
