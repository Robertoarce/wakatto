import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { signIn } from '../services/supabaseService';

// Web-compatible alert function
const showAlert = (title: string, message: string, buttons?: any[]) => {
  if (Platform.OS === 'web') {
    const fullMessage = `${title}\n\n${message}`;
    if (buttons && buttons.length > 1) {
      if (window.confirm(fullMessage)) {
        buttons[0].onPress?.();
      } else {
        buttons[1].onPress?.();
      }
    } else {
      window.alert(fullMessage);
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};

// Dev credentials for quick login during development
const DEV_EMAIL = 'dev@phsyche.ai'; // Note: matches the user created in Supabase
const DEV_PASSWORD = 'devpass123';

export default function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    setLoading(true);
    try {
      await signIn(email, password);
      navigation.navigate('Main');
    } catch (error: any) {
      showAlert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function quickDevLogin() {
    setLoading(true);
    try {
      await signIn(DEV_EMAIL, DEV_PASSWORD);
      navigation.navigate('Main');
    } catch (error: any) {
      // If dev user doesn't exist, show helpful error
      showAlert(
        'Dev User Not Found', 
        `Please create a test user with:\nEmail: ${DEV_EMAIL}\nPassword: ${DEV_PASSWORD}\n\nOr use the Register screen to create it.`,
        [
          { text: 'Go to Register', onPress: () => navigation.navigate('Register') },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Welcome Back</Text>
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
      <TouchableOpacity style={styles.button} onPress={signInWithEmail} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Loading...' : 'Login'}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.devButton} onPress={quickDevLogin} disabled={loading}>
        <Text style={styles.devButtonText}>⚡ Quick Dev Login</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
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
