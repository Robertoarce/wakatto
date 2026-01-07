import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useCustomAlert } from '../components/CustomAlert';
import { AnimatedBackground3D } from '../components/AnimatedBackground3D';
import { Button, Input } from '../components/ui';
import { useResponsive } from '../constants/Layout';
import { useSimpleNavigation } from '../navigation/AppNavigator';

export default function ResetPasswordScreen() {
  const { navigate } = useSimpleNavigation();
  const { showAlert, AlertComponent } = useCustomAlert();
  const { fonts, spacing, borderRadius, layout, isMobile } = useResponsive();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);

  // Check for password reset token in URL on mount
  useEffect(() => {
    const checkResetToken = async () => {
      if (Platform.OS === 'web') {
        // Parse the URL hash for access_token and type
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.replace('#', ''));
        const accessToken = params.get('access_token');
        const type = params.get('type');

        if (accessToken && type === 'recovery') {
          // Set the session with the recovery token
          try {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: params.get('refresh_token') || '',
            });

            if (error) {
              console.error('[ResetPassword] Token error:', error);
              showAlert('Invalid Link', 'This password reset link is invalid or has expired. Please request a new one.');
              setIsValidToken(false);
            } else {
              setIsValidToken(true);
            }
          } catch (err) {
            console.error('[ResetPassword] Error setting session:', err);
            setIsValidToken(false);
          }
        } else {
          // No valid token found
          showAlert('Invalid Link', 'No password reset token found. Please request a new password reset link.');
          setIsValidToken(false);
        }
      }
      setCheckingToken(false);
    };

    checkResetToken();
  }, []);

  const handleResetPassword = async () => {
    // Validation
    if (!newPassword) {
      showAlert('Validation Error', 'Please enter a new password.');
      return;
    }
    if (newPassword.length < 6) {
      showAlert('Validation Error', 'Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert('Validation Error', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      // Sign out after password reset to force fresh login
      await supabase.auth.signOut();

      showAlert(
        'Password Updated!',
        'Your password has been successfully updated. Please sign in with your new password.',
        [{ text: 'Go to Login', onPress: () => navigate('Login') }]
      );
    } catch (error: any) {
      let errorMessage = error.message;
      if (errorMessage.includes('same as')) {
        errorMessage = 'New password must be different from your current password.';
      }
      showAlert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('Login');
  };

  // Dynamic styles
  const cardMaxWidth = isMobile ? '100%' : 440;
  const cardPadding = isMobile ? spacing.lg : spacing.xl;

  if (checkingToken) {
    return (
      <View style={styles.container}>
        <AnimatedBackground3D />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { fontSize: fonts.md }]}>
            Verifying reset link...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AlertComponent />
      <AnimatedBackground3D />

      <View style={[styles.card, { maxWidth: cardMaxWidth, padding: cardPadding, borderRadius: borderRadius.xl }]}>
        {/* Logo */}
        <View style={[styles.logoContainer, { marginBottom: spacing.lg }]}>
          <View style={[styles.logoBackground, { width: 60, height: 60, borderRadius: borderRadius.lg }]}>
            <Ionicons name="key" size={30} color="white" />
          </View>
        </View>

        {/* Title */}
        <Text style={[styles.title, { fontSize: fonts.xl, marginBottom: spacing.sm }]}>
          Reset Password
        </Text>
        <Text style={[styles.subtitle, { fontSize: fonts.sm, marginBottom: spacing.xl }]}>
          {isValidToken 
            ? 'Enter your new password below'
            : 'This reset link is invalid or expired'}
        </Text>

        {isValidToken ? (
          <>
            {/* Password Form */}
            <Input
              label="New Password"
              placeholder="••••••••"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              showPasswordToggle
              icon="lock-closed-outline"
              helperText="Min 6 characters"
              containerStyle={{ marginBottom: spacing.md }}
            />

            <Input
              label="Confirm Password"
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              showPasswordToggle
              icon="checkmark-circle-outline"
              containerStyle={{ marginBottom: spacing.lg }}
            />

            <Button
              title={loading ? 'Updating...' : 'Update Password'}
              onPress={handleResetPassword}
              disabled={loading}
              loading={loading}
              fullWidth
              size="lg"
            />
          </>
        ) : (
          <>
            {/* Invalid Token State */}
            <View style={[styles.errorContainer, { padding: spacing.lg, borderRadius: borderRadius.md }]}>
              <Ionicons name="warning-outline" size={40} color="#ef4444" />
              <Text style={[styles.errorText, { fontSize: fonts.sm, marginTop: spacing.md }]}>
                This password reset link is invalid or has expired. Please go back to the login page and request a new password reset.
              </Text>
            </View>
          </>
        )}

        {/* Back to Login */}
        <Button
          title="Back to Login"
          onPress={handleBackToLogin}
          variant="secondary"
          fullWidth
          size="md"
          style={{ marginTop: spacing.lg }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#a1a1aa',
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
    backgroundColor: '#8b5cf6',
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
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
  },
  errorText: {
    color: '#fca5a5',
    textAlign: 'center',
    lineHeight: 22,
  },
});

