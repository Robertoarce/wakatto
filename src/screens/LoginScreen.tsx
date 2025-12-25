import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { signIn } from '../services/supabaseService';
import { setSession } from '../store/actions/authActions';
import { useCustomAlert } from '../components/CustomAlert';
import { AnimatedBackground3D } from '../components/AnimatedBackground3D';
import { Button, Input, Card } from '../components/ui';
import { useResponsive } from '../constants/Layout';

export default function LoginScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { showAlert, AlertComponent } = useCustomAlert();
  const { fonts, spacing, layout, isMobile, isTablet, isDesktop, deviceType, width } = useResponsive();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'signIn' | 'signUp'>('signIn');

  // Responsive calculations based on device type
  const isNarrow = deviceType === 'narrow';
  const isUltrawide = deviceType === 'ultrawide' || deviceType === 'large';

  // Card sizing - uses layout system
  const cardPadding = isNarrow ? spacing.sm : isMobile ? spacing.md : isTablet ? spacing.lg : spacing.xl;
  const cardMargin = isNarrow ? spacing.xs : isMobile ? spacing.sm : spacing.md;
  // Constrain card width on mobile to prevent overflow (account for scroll padding + card margins)
  const cardMaxWidth = isMobile ? width - (cardMargin * 4) : layout.formContainerMaxWidth;
  const cardBorderRadius = isNarrow ? layout.borderRadiusMd : layout.borderRadiusLg + 4;

  // Logo sizing - scales with screen
  const logoSize = isNarrow ? 50 : isMobile ? 60 : isTablet ? 70 : isUltrawide ? 100 : 80;
  const iconSize = isNarrow ? 24 : isMobile ? 30 : isTablet ? 35 : isUltrawide ? 50 : 40;

  async function signInWithEmail() {
    // Validation
    if (!email.trim()) {
      showAlert('Validation Error', 'Please enter your email.');
      return;
    }
    if (!email.includes('@')) {
      showAlert('Validation Error', 'Please enter a valid email address.');
      return;
    }
    if (!password) {
      showAlert('Validation Error', 'Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const data = await signIn(email.trim().toLowerCase(), password);
      // Update Redux store with session before navigating
      if (data.session && data.user) {
        dispatch(setSession(data.session, data.user));
        navigation.navigate('Main');
      } else {
        showAlert('Sign In Failed', 'Could not establish session. Please try again.');
      }
    } catch (error: any) {
      // Provide user-friendly error messages
      let errorMessage = error.message;
      if (errorMessage.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (errorMessage.includes('Email not confirmed')) {
        errorMessage = 'Please confirm your email address before signing in. Check your inbox for the confirmation link.';
      } else if (errorMessage.includes('User not found')) {
        errorMessage = 'No account found with this email. Please sign up first.';
      }
      showAlert('Sign In Failed', errorMessage);
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
    if (tab === 'signUp') {
      navigation.navigate('Register');
    }
  };

  return (
    <View style={styles.container}>
      <AlertComponent />

      {/* 3D Animated Background */}
      <AnimatedBackground3D />

      {/* Login Card */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { padding: cardMargin }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[
          styles.card,
          {
            padding: cardPadding,
            maxWidth: cardMaxWidth,
            borderRadius: cardBorderRadius,
            marginHorizontal: cardMargin,
          }
        ]}>
          {/* Logo Icon */}
          <View style={[styles.logoContainer, { marginBottom: isNarrow ? spacing.md : spacing.lg }]}>
            <View style={[styles.logoBackground, { width: logoSize, height: logoSize, borderRadius: logoSize * 0.25 }]}>
              <Ionicons name="chatbubbles" size={iconSize} color="white" />
            </View>
          </View>

          {/* Welcome Text */}
          <Text style={[styles.title, { fontSize: isUltrawide ? fonts.xxl : fonts.xl, marginBottom: spacing.xs }]}>
            Welcome to Wakatto
          </Text>
          <Text style={[styles.subtitle, { fontSize: fonts.sm, marginBottom: isNarrow ? spacing.md : spacing.lg }]}>
            Organize social events with friends effortlessly
          </Text>

          {/* Tabs */}
          <View style={[styles.tabContainer, { marginBottom: isNarrow ? spacing.md : spacing.lg, borderRadius: layout.borderRadiusMd }]}>
            <TouchableOpacity
              style={[
                styles.tab,
                { paddingVertical: isNarrow ? spacing.xs : spacing.sm, borderRadius: layout.borderRadiusSm },
                activeTab === 'signIn' && styles.activeTab
              ]}
              onPress={() => handleTabSwitch('signIn')}
            >
              <Text style={[styles.tabText, { fontSize: fonts.md }, activeTab === 'signIn' && styles.activeTabText]}>
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                { paddingVertical: isNarrow ? spacing.xs : spacing.sm, borderRadius: layout.borderRadiusSm },
                activeTab === 'signUp' && styles.activeTab
              ]}
              onPress={() => handleTabSwitch('signUp')}
            >
              <Text style={[styles.tabText, { fontSize: fonts.md }, activeTab === 'signUp' && styles.activeTabText]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
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
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              showPasswordToggle
              icon="lock-closed-outline"
            />

            <Button
              title={loading ? 'Signing In...' : 'Sign In'}
              onPress={signInWithEmail}
              disabled={loading}
              loading={loading}
              fullWidth
              size={isNarrow ? 'md' : 'lg'}
              style={{ marginTop: spacing.sm }}
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
    backgroundColor: '#2a2a2a',
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
  },
  logoBackground: {
    backgroundColor: '#5b7ef6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  subtitle: {
    color: '#9ca3af',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1f1f1f',
    padding: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#5b7ef6',
  },
  tabText: {
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
  signInButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#5b7ef6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  signInButtonText: {
    color: '#ffffff',
    fontSize: 16,
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
