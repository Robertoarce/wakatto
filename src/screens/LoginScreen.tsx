import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { signIn, signOut, resendConfirmationEmail } from '../services/supabaseService';
import { getCurrentUsage } from '../services/usageTrackingService';
import { setSession } from '../store/actions/authActions';
import { useCustomAlert } from '../components/CustomAlert';
import { AnimatedBackground3D } from '../components/AnimatedBackground3D';
import { Button, Input, Card } from '../components/ui';
import { useResponsive } from '../constants/Layout';

export default function LoginScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const { showAlert, AlertComponent } = useCustomAlert();
  const { fonts, spacing, layout, isMobile, isTablet, isDesktop, deviceType, width } = useResponsive();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [activeTab, setActiveTab] = useState<'signIn' | 'signUp'>('signIn');
  const [showConfirmationBanner, setShowConfirmationBanner] = useState(false);

  // Check if redirected due to unconfirmed email
  useEffect(() => {
    const params = route.params as { emailConfirmationRequired?: boolean } | undefined;
    if (params?.emailConfirmationRequired) {
      setShowConfirmationBanner(true);
    }
  }, [route.params]);

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
        // Check if email is confirmed (admin accounts bypass this check)
        if (!data.user.email_confirmed_at) {
          // Fetch user tier to check if admin
          const usage = await getCurrentUsage();
          if (usage?.tier !== 'admin') {
            // Not admin and email not confirmed - sign out and show error
            await signOut();
            showAlert(
              'Email Not Confirmed',
              'Please confirm your email address before signing in. Check your inbox for the confirmation link.'
            );
            return;
          }
          // Admin accounts can proceed without email confirmation
        }
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

  async function handleResendConfirmation() {
    if (!email.trim()) {
      showAlert('Email Required', 'Please enter your email address to resend the confirmation.');
      return;
    }
    if (!email.includes('@')) {
      showAlert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setResendingEmail(true);
    try {
      await resendConfirmationEmail(email.trim().toLowerCase());
      showAlert(
        'Confirmation Email Sent',
        'A new confirmation email has been sent. Please check your inbox and spam folder.'
      );
    } catch (error: any) {
      let errorMessage = error.message;
      if (errorMessage.includes('rate limit')) {
        errorMessage = 'Please wait a few minutes before requesting another confirmation email.';
      }
      showAlert('Failed to Send', errorMessage);
    } finally {
      setResendingEmail(false);
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

          {/* Email Confirmation Banner */}
          {showConfirmationBanner && (
            <View style={[styles.confirmationBanner, { borderRadius: layout.borderRadiusMd, padding: spacing.md, marginBottom: spacing.lg }]}>
              <View style={styles.confirmationBannerContent}>
                <Ionicons name="mail-unread-outline" size={24} color="#f59e0b" />
                <View style={styles.confirmationBannerTextContainer}>
                  <Text style={[styles.confirmationBannerTitle, { fontSize: fonts.md }]}>
                    Email Confirmation Required
                  </Text>
                  <Text style={[styles.confirmationBannerText, { fontSize: fonts.sm }]}>
                    Please confirm your email address to continue. Check your inbox for the confirmation link.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowConfirmationBanner(false)}
                style={styles.confirmationBannerClose}
              >
                <Ionicons name="close" size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          )}

          {/* Tabs */}
          <View style={[styles.tabContainer, { marginBottom: isNarrow ? spacing.md : spacing.lg, borderRadius: layout.borderRadiusMd, padding: spacing.xs }]}>
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

            {/* Resend Confirmation Email Link */}
            <TouchableOpacity
              onPress={handleResendConfirmation}
              disabled={resendingEmail || loading}
              style={[styles.resendLink, { marginTop: spacing.md }]}
            >
              <Ionicons name="mail-outline" size={16} color="#5b7ef6" style={{ marginRight: 6 }} />
              <Text style={[styles.resendLinkText, { fontSize: fonts.sm }, (resendingEmail || loading) && styles.resendLinkDisabled]}>
                {resendingEmail ? 'Sending...' : "Didn't receive confirmation email?"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// Static styles - responsive values applied inline via useResponsive
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
    // padding applied dynamically via spacing.xs
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
  // Email confirmation banner styles
  confirmationBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  confirmationBannerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  confirmationBannerTextContainer: {
    flex: 1,
  },
  confirmationBannerTitle: {
    color: '#f59e0b',
    fontWeight: '600',
    marginBottom: 4,
  },
  confirmationBannerText: {
    color: '#d4a574',
    lineHeight: 20,
  },
  confirmationBannerClose: {
    padding: 4,
    marginLeft: 8,
  },
  // Resend link styles
  resendLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  resendLinkText: {
    color: '#5b7ef6',
    fontWeight: '500',
  },
  resendLinkDisabled: {
    opacity: 0.5,
  },
});
