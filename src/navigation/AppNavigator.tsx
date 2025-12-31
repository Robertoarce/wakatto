import React, { useEffect, useState } from 'react';
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
import { ActivityIndicator, View, StyleSheet } from 'react-native';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const dispatch = useDispatch();
  const { session, loading } = useSelector((state: RootState) => state.auth);
  const [initialRoute, setInitialRoute] = useState('Login');
  const [isReady, setIsReady] = useState(false);
  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false);

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
              console.log('[Auth] Email not confirmed for non-admin user, signing out');
              await signOut();
              setEmailConfirmationRequired(true);
              setInitialRoute('Login');
              dispatch(setLoading(false));
              setIsReady(true);
              return;
            }
            // Admin accounts can proceed without email confirmation
          }
          dispatch(setSession(currentSession, currentSession.user));
          setInitialRoute('Main');
        } else {
          setInitialRoute('Login');
          dispatch(setLoading(false));
        }
      } catch (error) {
        console.error('Error checking session:', error);
        // Handle invalid refresh token errors by clearing session
        if (isRefreshTokenError(error)) {
          console.warn('[Auth] Invalid session detected during init, clearing...');
          await clearInvalidSession();
        }
        setInitialRoute('Login');
        dispatch(setLoading(false));
      } finally {
        setIsReady(true);
      }
    }
    checkSession();
  }, [dispatch]);

  if (loading || !isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ unmountOnBlur: true }}
            initialParams={{ emailConfirmationRequired }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ unmountOnBlur: true }}
          />
          <Stack.Screen name="Main" component={MainScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#0f0f0f',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f0f',
  },
});