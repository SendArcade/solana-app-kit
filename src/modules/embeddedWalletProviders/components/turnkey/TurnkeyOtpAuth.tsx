import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAppNavigation } from '../../../../hooks/useAppNavigation';
import { useTurnkeyWalletLogic } from '../../hooks/useTurnkeyWalletLogic';
import { useAppDispatch } from '../../../../hooks/useReduxHooks';
import { loginSuccess } from '../../../../state/auth/reducer';
import { PublicKey } from '@solana/web3.js';
import { SERVER_URL } from '@env';

interface TurnkeyOtpAuthProps {
  route: {
    params: {
      email: string;
      otpId: string;
      organizationId: string;
      onSuccess: (info: { provider: 'turnkey'; address: string }) => void;
    };
  };
}

const OTP_LENGTH = 6;

const TurnkeyOtpAuth: React.FC<TurnkeyOtpAuthProps> = ({ route }) => {
  const { email, otpId: routeOtpId, organizationId: routeOrgId, onSuccess } = route.params;
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpId, setOtpId] = useState(routeOtpId);
  const [organizationId, setOrganizationId] = useState(routeOrgId);
  const [targetPublicKey, setTargetPublicKey] = useState('');
  const navigation = useAppNavigation();
  const dispatch = useAppDispatch();
  const { handleTurnkeyOtpLogin } = useTurnkeyWalletLogic();
  const inputsRef = useRef<Array<TextInput | null>>([]);
  const [otpError, setOtpError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  // Generate a public key if not provided
  useEffect(() => {
    try {
      const keyPair = PublicKey.unique();
      setTargetPublicKey(keyPair.toBase58());
    } catch (error) {
      console.error('Failed to generate public key:', error);
    }
  }, []);

  // If otpId and organizationId are not provided, we need to get them from backend
  useEffect(() => {
    if ((!otpId || !organizationId) && email) {
      initializeOtpFlow();
    }
  }, [email, otpId, organizationId]);

  const initializeOtpFlow = async () => {
    if (!email) return;
    
    try {
      setIsLoading(true);
      
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
        throw new Error(`Failed to initialize OTP: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.otpId || !data.organizationId) {
        throw new Error('Invalid OTP initialization response');
      }
      
      setOtpId(data.otpId);
      setOrganizationId(data.organizationId);
    } catch (error) {
      console.error('Failed to initialize OTP flow:', error);
      Alert.alert('Error', 'Failed to send verification code. Please try again.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otpCode) {
      setOtpError('Please enter the verification code');
      return;
    }
    
    if (!otpId || !organizationId || !targetPublicKey) {
      Alert.alert('Error', 'Missing required authentication parameters');
      return;
    }

    setIsLoading(true);
    setOtpError('');

    try {
      const response = await fetch(`${SERVER_URL}/api/auth/otpAuth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          otpId,
          otpCode,
          organizationId,
          targetPublicKey,
          expirationSeconds: '86400', // 24 hours
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to verify OTP: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.credentialBundle) {
        throw new Error('Invalid OTP verification response');
      }

      // Store login info in Redux
      dispatch(loginSuccess({
        provider: 'turnkey',
        address: targetPublicKey, // Use the target public key as the wallet address for now
      }));

      // Call onSuccess callback
      onSuccess({ 
        provider: 'turnkey', 
        address: targetPublicKey 
      });

      // Navigate to main app
      navigation.navigate('MainTabs');
    } catch (error) {
      console.error('OTP verification error:', error);
      Alert.alert('Authentication Error', 'Failed to verify code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (text: string) => {
    // Only allow digits
    const cleaned = text.replace(/[^0-9]/g, '');
    setOtpCode(cleaned.substring(0, OTP_LENGTH));
    
    // Auto-fill the individual inputs
    for (let i = 0; i < OTP_LENGTH; i++) {
      if (inputsRef.current[i]) {
        inputsRef.current[i]!.setNativeProps({
          text: i < cleaned.length ? cleaned[i] : '',
        });
      }
    }
    
    // Move focus to the next input
    if (cleaned.length < OTP_LENGTH && inputsRef.current[cleaned.length]) {
      inputsRef.current[cleaned.length]!.focus();
    }
  };

  const resendOtp = async () => {
    try {
      setResendLoading(true);
      
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
        throw new Error(`Failed to resend OTP: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.otpId || !data.organizationId) {
        throw new Error('Invalid OTP resend response');
      }
      
      setOtpId(data.otpId);
      setOrganizationId(data.organizationId);
      Alert.alert('Success', 'Verification code has been resent.');
    } catch (error) {
      console.error('Failed to resend OTP:', error);
      Alert.alert('Error', 'Failed to resend verification code. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Verification Code</Text>
        <Text style={styles.subtitle}>
          We've sent a code to {email}. Please enter it below.
        </Text>
        
        <View style={styles.otpContainer}>
          {Array.from({ length: OTP_LENGTH }).map((_, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputsRef.current[index] = ref)}
              style={styles.otpInput}
              maxLength={1}
              keyboardType="number-pad"
              onChangeText={(text) => {
                const newOtp = otpCode.split('');
                newOtp[index] = text;
                handleOtpChange(newOtp.join(''));
                
                if (text && index < OTP_LENGTH - 1) {
                  inputsRef.current[index + 1]?.focus();
                }
              }}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace' && !otpCode[index] && index > 0) {
                  inputsRef.current[index - 1]?.focus();
                }
              }}
            />
          ))}
        </View>
        
        <TouchableOpacity 
          style={[styles.button, (otpCode.length !== OTP_LENGTH || isLoading) && styles.buttonDisabled]} 
          onPress={verifyOtp}
          disabled={otpCode.length !== OTP_LENGTH || isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Verifying...' : 'Verify'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.resendButton} onPress={resendOtp} disabled={resendLoading}>
          <Text style={styles.resendText}>Didn't receive a code? Resend</Text>
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
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#512da8',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#9e9e9e',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    width: '100%',
    alignItems: 'center',
  },
  resendText: {
    color: '#512da8',
    fontSize: 14,
  },
});

export default TurnkeyOtpAuth; 