import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { signUp, signIn } from '../services/supabaseService';
import { setSession } from '../store/actions/authActions';
import { useCustomAlert } from '../components/CustomAlert';

// Dev credentials for quick setup during development
const DEV_EMAIL = 'dev@phsyche.ai'; // Note: matches the user created in Supabase
const DEV_PASSWORD = 'devpass123';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { showAlert, AlertComponent } = useCustomAlert();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signUpWithEmail() {
    setLoading(true);
    try {
      await signUp(email, password);
      showAlert('Success', 'Please check your email for a confirmation link.');
      navigation.navigate('Login');
    } catch (error: any) {
      showAlert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function createDevUser() {
    setLoading(true);
    try {
      await signUp(DEV_EMAIL, DEV_PASSWORD);
      showAlert(
        'Dev User Created!',
        'Dev user created successfully. You can now use Quick Dev Login.',
        [{ text: 'Go to Login', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error: any) {
      // If user already exists, try to sign in
      if (error.message.includes('already registered')) {
        try {
          const data = await signIn(DEV_EMAIL, DEV_PASSWORD);
          // Update Redux store with session before navigating
          if (data.session && data.user) {
            dispatch(setSession(data.session, data.user));
          }
          navigation.navigate('Main');
        } catch (signInError: any) {
          showAlert('Error', 'Dev user exists but could not sign in: ' + signInError.message);
        }
      } else {
        showAlert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <AlertComponent />
      <Text style={styles.header}>Create Account</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={signUpWithEmail} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Loading...' : 'Sign Up'}</Text>
      </TouchableOpacity>

      {__DEV__ && (
        <TouchableOpacity style={styles.devButton} onPress={createDevUser} disabled={loading}>
          <Text style={styles.devButtonText}>⚡ Create Dev User</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.linkText}>Already have an account? Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f0f',
    padding: 20,
  },
  header: {
    fontSize: 28,
    color: 'white',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    paddingHorizontal: 15,
    color: 'white',
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#2e2e2e',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#8b5cf6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  devButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#fbbf24',
  },
  devButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkText: {
    color: '#a78bfa',
    marginTop: 20,
  },
});
