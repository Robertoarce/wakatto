import React, { useEffect, useState, createContext, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import MainScreen from '../screens/MainScreen';
import { getSession } from '../services/supabaseService';
import { clearInvalidSession, isRefreshTokenError } from '../lib/supabase';
import { setSession, setLoading } from '../store/actions/authActions';
import { RootState } from '../store';
import { ActivityIndicator, View, StyleSheet, Text, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { checkForJoinCode, checkForInviteCode, clearJoinCodeFromUrl, parseDeepLink } from '../utils/deepLinkHandler';
import { acceptInvitation, getInvitationByCode } from '../services/invitationService';

const Stack = createStackNavigator();

// Simple navigation context for web workaround
type SimpleNavScreen = 'Login' | 'Register' | 'ResetPassword' | 'Main';
interface SimpleNavContextType {
  navigate: (screen: SimpleNavScreen) => void;
  currentScreen: SimpleNavScreen;
  pendingJoinCode: string | null;
  consumeJoinCode: () => void;
  // Referral invitation code (from /invite/:code)
  pendingInviteCode: string | null;
  consumeInviteCode: () => void;
}
const SimpleNavContext = createContext<SimpleNavContextType | null>(null);

export const useSimpleNavigation = () => {
  const ctx = useContext(SimpleNavContext);
  if (!ctx) throw new Error('useSimpleNavigation must be used within SimpleNavContext');
  return ctx;
};

export default function AppNavigator() {
  const dispatch = useDispatch();
  const { session, loading } = useSelector((state: RootState) => state.auth);
  const [initialRoute, setInitialRoute] = useState('Login');
  const [isReady, setIsReady] = useState(false);
  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false);

  // Web workaround: Use simple state-based navigation instead of Stack.Navigator
  // Stack.Navigator has issues on web with React Navigation v7
  // IMPORTANT: This must be declared before any early returns to satisfy React hooks rules
  const [currentScreen, setCurrentScreen] = useState<SimpleNavScreen>('Login');
  
  // Deep link state - stores pending join code from URL (conversation collaboration)
  const [pendingJoinCode, setPendingJoinCode] = useState<string | null>(null);
  // Deep link state - stores pending invite code from URL (user referral)
  const [pendingInviteCode, setPendingInviteCode] = useState<string | null>(null);

  // Handle incoming deep link URL
  const handleDeepLinkUrl = (url: string | null) => {
    if (!url) return;
    
    const result = parseDeepLink(url);
    if (result.type === 'join' && result.inviteCode) {
      console.log('[AppNavigator] Found join code in deep link:', result.inviteCode);
      setPendingJoinCode(result.inviteCode);
    } else if (result.type === 'invite' && result.inviteCode) {
      console.log('[AppNavigator] Found invite code in deep link:', result.inviteCode);
      setPendingInviteCode(result.inviteCode);
    }
  };

  // Check for deep link on mount
  useEffect(() => {
    // Web: Check window.location
    if (Platform.OS === 'web') {
      // Check for password reset URL
      const pathname = window.location.pathname;
      const hash = window.location.hash;
      
      if (pathname === '/reset-password' || pathname.includes('reset-password')) {
        // Check if there's a recovery token in the hash
        if (hash && hash.includes('access_token') && hash.includes('type=recovery')) {
          console.log('[AppNavigator] Found password reset token, navigating to ResetPassword');
          setCurrentScreen('ResetPassword');
          return;
        }
      }

      // Check for join code (conversation collaboration)
      const joinCode = checkForJoinCode();
      if (joinCode) {
        console.log('[AppNavigator] Found join code in URL:', joinCode);
        setPendingJoinCode(joinCode);
        // Clear the URL so it doesn't trigger again on refresh
        clearJoinCodeFromUrl();
      }

      // Check for invite code (user referral)
      const inviteCode = checkForInviteCode();
      if (inviteCode) {
        console.log('[AppNavigator] Found invite code in URL:', inviteCode);
        setPendingInviteCode(inviteCode);
        // Clear the URL so it doesn't trigger again on refresh
        clearJoinCodeFromUrl();
      }
    } else {
      // Native: Check initial URL using Expo Linking
      const checkInitialUrl = async () => {
        try {
          const initialUrl = await Linking.getInitialURL();
          handleDeepLinkUrl(initialUrl);
        } catch (error) {
          console.error('[AppNavigator] Error getting initial URL:', error);
        }
      };
      checkInitialUrl();
    }
  }, []);

  // Listen for incoming deep links (native only)
  useEffect(() => {
    if (Platform.OS === 'web') return;

    // Set up listener for incoming URLs
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLinkUrl(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Check initial session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const currentSession = await getSession();
        if (currentSession) {
          // Email confirmation check disabled for now
          // TODO: Re-enable when SMTP is configured
          dispatch(setSession(currentSession, currentSession.user));
          setInitialRoute('Main');
          setCurrentScreen('Main');
        } else {
          setInitialRoute('Login');
          setCurrentScreen('Login');
          dispatch(setLoading(false));
        }
      } catch (error) {
        // Handle invalid refresh token errors by clearing session
        if (isRefreshTokenError(error)) {
          await clearInvalidSession();
        }
        setInitialRoute('Login');
        setCurrentScreen('Login');
        dispatch(setLoading(false));
      } finally {
        setIsReady(true);
      }
    }
    checkSession();
  }, [dispatch]);

  // Update screen when session changes
  useEffect(() => {
    if (session) {
      setCurrentScreen('Main');
    }
  }, [session]);

  // Handle invite code when user is logged in
  // NOTE: This hook must be before the early return to satisfy React's rules of hooks
  useEffect(() => {
    const handlePendingInvite = async () => {
      if (pendingInviteCode && session) {
        console.log('[AppNavigator] User logged in with pending invite, accepting:', pendingInviteCode);
        try {
          const success = await acceptInvitation(pendingInviteCode);
          if (success) {
            console.log('[AppNavigator] Invitation accepted successfully');
          } else {
            console.log('[AppNavigator] Invitation already used or expired');
          }
        } catch (error) {
          console.error('[AppNavigator] Error accepting invitation:', error);
        }
        setPendingInviteCode(null);
      }
    };
    handlePendingInvite();
  }, [pendingInviteCode, session]);

  if (loading || !isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  const consumeJoinCode = () => {
    setPendingJoinCode(null);
  };

  const consumeInviteCode = () => {
    setPendingInviteCode(null);
  };

  const simpleNav: SimpleNavContextType = {
    navigate: (screen) => setCurrentScreen(screen),
    currentScreen,
    pendingJoinCode,
    consumeJoinCode,
    pendingInviteCode,
    consumeInviteCode,
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Login':
        return <LoginScreen />;
      case 'Register':
        return <RegisterScreen />;
      case 'ResetPassword':
        return <ResetPasswordScreen />;
      case 'Main':
        return <MainScreen />;
      default:
        return <LoginScreen />;
    }
  };

  return (
    <SimpleNavContext.Provider value={simpleNav}>
      <View style={styles.container}>
        {renderScreen()}
      </View>
    </SimpleNavContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    minHeight: '100vh' as any,
    backgroundColor: '#0f0f0f',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f0f',
  },
});