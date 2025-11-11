import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Link, useRouter } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();
  const router = useRouter();

  // Debug: log when user state changes
  useEffect(() => {
    console.log('🔍 LoginScreen - user state changed:', user?.name);
    if (user) {
      console.log('✅ LoginScreen - User detected, should redirect automatically');
    }
  }, [user]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔄 LoginScreen - Calling login function...');
      await login(email, password);
      console.log('✅ LoginScreen - Login function completed');
      
      // Force a check after login
      setTimeout(() => {
        console.log('🔄 LoginScreen - Manual redirect check');
        if (user) {
          console.log('🚀 LoginScreen - Manual redirect to users');
          router.replace('/(tabs)/users');
        }
      }, 1000);
      
    } catch (error: any) {
      console.error('❌ LoginScreen - Login failed:', error);
      Alert.alert('Error', error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  console.log('🔍 LoginScreen render - isLoading:', isLoading);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chat App</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!isLoading}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!isLoading}
      />
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={handleLogin} 
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>
      <Link href="/(auth)/register" asChild>
        <TouchableOpacity style={styles.linkButton} disabled={isLoading}>
          <Text style={styles.linkText}>Don't have an account? Register</Text>
        </TouchableOpacity>
      </Link>
      
      {/* Debug info
      <View style={styles.debugContainer}>
        <Text style={styles.debugText}>Debug Info:</Text>
        <Text style={styles.debugText}>Loading: {isLoading ? 'Yes' : 'No'}</Text>
        <Text style={styles.debugText}>User: {user ? user.name : 'None'}</Text>
      </View> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 16,
  },
  debugContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
  },
});