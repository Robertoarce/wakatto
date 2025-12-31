import React, { useEffect, useState, createContext, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MainScreen from '../screens/MainScreen';
import { getSession, signOut } from '../services/supabaseService';
import { clearInvalidSession, isRefreshTokenError } from '../lib/supabase';
import { getCurrentUsage } from '../services/usageTrackingService';
import { setSession, setLoading } from '../store/actions/authActions';
import { RootState } from '../store';
import { ActivityIndicator, View, StyleSheet, Text, Platform } from 'react-native';

const Stack = createStackNavigator();

// Simple navigation context for web workaround
type SimpleNavScreen = 'Login' | 'Register' | 'Main';
interface SimpleNavContextType {
  navigate: (screen: SimpleNavScreen) => void;
  currentScreen: SimpleNavScreen;
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

  // Check initial session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const currentSession = await getSession();
        if (currentSession) {
          // Check if email is confirmed (admin accounts bypass this check)
          if (!currentSession.user.email_confirmed_at) {
            // Fetch user tier to check if admin
            const usage = await getCurrentUsage();
            if (usage?.tier !== 'admin') {
              // Not admin and email not confirmed - sign out and show message
              await signOut();
              setEmailConfirmationRequired(true);
              setInitialRoute('Login');
              setCurrentScreen('Login');
              dispatch(setLoading(false));
              setIsReady(true);
              return;
            }
            // Admin accounts can proceed without email confirmation
          }
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

  if (loading || !isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  const simpleNav: SimpleNavContextType = {
    navigate: (screen) => setCurrentScreen(screen),
    currentScreen,
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Login':
        return <LoginScreen />;
      case 'Register':
        return <RegisterScreen />;
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