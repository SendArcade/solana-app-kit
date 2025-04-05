import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAppNavigation } from '../../../../hooks/useAppNavigation';
import { useTurnkeyWalletLogic } from '../../hooks/useTurnkeyWalletLogic';
import { SERVER_URL } from '@env';

interface TurnkeyEmailAuthProps {
  onSuccess: (info: { provider: 'turnkey'; address: string }) => void;
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const TurnkeyEmailAuth: React.FC<TurnkeyEmailAuthProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const navigation = useAppNavigation();
  const { handleTurnkeyOtpLogin } = useTurnkeyWalletLogic();

  const handleSubmit = async () => {
    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setEmailError('');

    try {
      // Call the backend API to initiate OTP flow
      const response = await fetch(`${SERVER_URL}/api/auth/initOtpAuth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          otpType: 'OTP_TYPE_EMAIL', 
          contact: email 
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to initiate OTP process: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.otpId || !data.organizationId) {
        throw new Error('Invalid response from server');
      }

      // Navigate to OTP verification screen
      navigation.navigate('TurnkeyOtpAuth', {
        email,
        otpId: data.otpId,
        organizationId: data.organizationId,
        onSuccess: onSuccess,
      });
    } catch (error: any) {
      console.error('Error initiating OTP:', error);
      setEmailError(`Failed to start verification: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Sign in with Email</Text>
        <Text style={styles.subtitle}>Enter your email to receive a verification code</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Email address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
        
        <TouchableOpacity 
          style={[styles.button, (isLoading) && styles.buttonDisabled]} 
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    color: '#666',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#512da8',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#9e9e9e',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TurnkeyEmailAuth; 