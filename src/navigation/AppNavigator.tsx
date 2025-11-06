import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MainScreen from '../screens/MainScreen';
import { getSession } from '../services/supabaseService';
import { setSession, setLoading } from '../store/actions/authActions';
import { RootState } from '../store';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const dispatch = useDispatch();
  const { session, loading } = useSelector((state: RootState) => state.auth);
  const [initialRoute, setInitialRoute] = useState('Login');
  const [isReady, setIsReady] = useState(false);
  
  console.log('AppNavigator render - loading:', loading, 'isReady:', isReady, 'initialRoute:', initialRoute);

  // Check initial session on mount
  useEffect(() => {
    console.log('AppNavigator mounted, checking session...');
    async function checkSession() {
      try {
        const currentSession = await getSession();
        console.log('Session check result:', currentSession);
        if (currentSession) {
          dispatch(setSession(currentSession, currentSession.user));
          setInitialRoute('Main');
        } else {
          setInitialRoute('Login');
          dispatch(setLoading(false));
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setInitialRoute('Login');
        dispatch(setLoading(false));
      } finally {
        setIsReady(true);
      }
    }
    checkSession();
  }, [dispatch]);

  if (loading || !isReady) {
    console.log('🔄 Showing loading spinner...');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  console.log('✅ Rendering NavigationContainer with initialRoute:', initialRoute);
  
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={initialRoute} 
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Main" component={MainScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f0f',
  },
});