import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Platform, StyleSheet } from 'react-native';
import { useAuth } from '../hooks';
import { WalletAuthParams } from '../types';

/**
 * LoginOptions component provides UI for various login methods
 */
const LoginOptions: React.FC<WalletAuthParams> = ({ 
  onWalletConnected, 
  authMode = 'login' 
}) => {
  const {
    status,
    loginWithGoogle,
    loginWithApple,
    loginWithEmail,
    loginWithMWA,
    user,
  } = useAuth();

  // If already authenticated, trigger onWalletConnected
  useEffect(() => {
    if (status === 'authenticated' && user?.id) {
      console.log('User already authenticated, triggering callback');
      // Get provider from auth state
      const provider = useAuth().wallet?.provider || 'privy';
      onWalletConnected({ provider, address: user.id });
    }
  }, [status, user, onWalletConnected]);

  // Handle login with error handling
  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Authentication Error', 'Failed to authenticate with Google. Please try again.');
    }
  };

  const handleAppleLogin = async () => {
    try {
      await loginWithApple();
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Authentication Error', 'Failed to authenticate with Apple. Please try again.');
    }
  };

  const handleEmailLogin = async () => {
    try {
      await loginWithEmail();
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Authentication Error', 'Failed to authenticate with Email. Please try again.');
    }
  };

  const handleMWALogin = async () => {
    try {
      await loginWithMWA();
    } catch (error) {
      console.error('MWA login error:', error);
      Alert.alert('Authentication Error', 'Failed to connect with external wallet. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={handleGoogleLogin}>
        <Text style={styles.buttonText}>Continue with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleAppleLogin}>
        <Text style={styles.buttonText}>Continue with Apple</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleEmailLogin}>
        <Text style={styles.buttonText}>Continue with Email</Text>
      </TouchableOpacity>

      {Platform.OS === 'android' && (
        <TouchableOpacity style={styles.button} onPress={handleMWALogin}>
          <Text style={styles.buttonText}>Connect External Wallet</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 20,
  },
  button: {
    backgroundColor: '#9945FF',
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default LoginOptions; 