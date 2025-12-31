import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signUp } from '../services/supabaseService';
import { sendWelcomeEmail } from '../services/emailService';
import { useCustomAlert } from '../components/CustomAlert';
import { AnimatedBackground3D } from '../components/AnimatedBackground3D';
import { Button, Input } from '../components/ui';
import { useResponsive } from '../constants/Layout';
import { useSimpleNavigation } from '../navigation/AppNavigator';

export default function RegisterScreen() {
  const { navigate } = useSimpleNavigation();
  const { showAlert, AlertComponent } = useCustomAlert();
  const { fonts, spacing, borderRadius, layout, isMobile, isTablet } = useResponsive();
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();

  // Calculate scale factor based on screen height
  // Reference = form's natural height (~1050px). At 830px viewport, scale = 0.79
  const heightScale = Math.min(1, screenHeight / 1050);
  const isCompactScreen = heightScale < 0.78; // ~700px
  const isVeryCompactScreen = heightScale < 0.67; // ~600px

  // Scale a value proportionally to screen height (more aggressive for forms with many fields)
  const scaleHeight = (value: number) => Math.round(value * heightScale);

  // Card sizing - constrain width properly
  const cardMargin = scaleHeight(isMobile ? spacing.sm : spacing.md);
  const cardMaxWidth = isMobile ? Math.min(440, screenWidth - (cardMargin * 4)) : Math.min(520, layout.formContainerMaxWidth);

  // Responsive styles - scale proportionally to screen height
  // Use minimum values to ensure padding is always visible
  const minPadding = 16;
  const dynamicStyles = useMemo(() => ({
    scrollContent: {
      padding: Math.max(minPadding, scaleHeight(spacing.xl)),
      paddingVertical: Math.max(minPadding, scaleHeight(spacing.xl)),
    },
    card: {
      width: '100%' as const,
      maxWidth: cardMaxWidth,
      backgroundColor: '#2a2a2a',
      borderRadius: borderRadius.xl,
      padding: scaleHeight(isMobile ? spacing.xl : spacing.xxl),
      marginHorizontal: cardMargin,
      marginBottom: minPadding, // Ensure space below card
      borderWidth: 1,
      borderColor: '#3a3a3a',
    },
    logoContainer: {
      marginBottom: scaleHeight(spacing.xl),
    },
    logoBackground: {
      width: Math.max(40, scaleHeight(isMobile ? 60 : 80)),
      height: Math.max(40, scaleHeight(isMobile ? 60 : 80)),
      borderRadius: borderRadius.xl,
      backgroundColor: '#5b7ef6',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    title: {
      fontSize: Math.max(fonts.md, scaleHeight(fonts.xxl)),
      fontWeight: '600' as const,
      color: '#ffffff',
      textAlign: 'center' as const,
      marginBottom: scaleHeight(spacing.sm),
    },
    subtitle: {
      fontSize: Math.max(fonts.xs, scaleHeight(fonts.md)),
      color: '#9ca3af',
      textAlign: 'center' as const,
      marginBottom: scaleHeight(spacing.xl),
    },
    tabContainer: {
      borderRadius: borderRadius.md,
      padding: spacing.xs,
    },
    tab: {
      paddingVertical: scaleHeight(spacing.md),
      borderRadius: borderRadius.sm,
    },
    tabText: {
      fontSize: Math.max(fonts.xs, scaleHeight(fonts.md)),
      fontWeight: '500' as const,
      color: '#9ca3af',
    },
    formSpacing: {
      marginTop: scaleHeight(spacing.sm),
    },
    inputMargin: {
      marginBottom: scaleHeight(spacing.md),
    },
  }), [fonts, spacing, borderRadius, layout, isMobile, isTablet, heightScale, scaleHeight, cardMaxWidth, cardMargin]);
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

      // Send welcome email (fire and forget - don't block registration)
      sendWelcomeEmail(email.trim().toLowerCase(), name.trim()).catch((err) => {
        console.warn('[Register] Failed to send welcome email:', err);
      });

      showAlert(
        'Success!',
        'Account created successfully! Please check your email to confirm your account before signing in.',
        [{ text: 'Go to Login', onPress: () => navigate('Login') }]
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

  const handleTabSwitch = (tab: 'signIn' | 'signUp') => {
    setActiveTab(tab);
    if (tab === 'signIn') {
      navigate('Login');
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
              <Ionicons name="chatbubbles" size={Math.max(20, scaleHeight(isMobile ? 30 : 40))} color="white" />
            </View>
          </View>

          {/* Welcome Text */}
          <Text style={dynamicStyles.title}>Welcome to Wakatto</Text>
          <Text style={dynamicStyles.subtitle}>Organize social events with friends effortlessly</Text>

          {/* Tabs */}
          <View style={[styles.tabContainer, dynamicStyles.tabContainer, { marginBottom: scaleHeight(spacing.xl) }]}>
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
              containerStyle={dynamicStyles.inputMargin}
            />

            <Input
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              icon="mail-outline"
              containerStyle={dynamicStyles.inputMargin}
            />

            {/* Hide phone on compact screens - it's optional */}
            {!isCompactScreen && (
              <Input
                label="Phone (optional)"
                placeholder="+1 (555) 123-4567"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                icon="call-outline"
                containerStyle={dynamicStyles.inputMargin}
              />
            )}

            <Input
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              showPasswordToggle
              icon="lock-closed-outline"
              helperText={isVeryCompactScreen ? undefined : "Min 6 characters"}
              containerStyle={dynamicStyles.inputMargin}
            />

            <Button
              title={loading ? 'Creating Account...' : 'Sign Up'}
              onPress={signUpWithEmail}
              disabled={loading}
              loading={loading}
              fullWidth
              size={isVeryCompactScreen ? 'sm' : isCompactScreen ? 'md' : 'lg'}
              style={dynamicStyles.formSpacing}
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
