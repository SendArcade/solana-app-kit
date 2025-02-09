import React, {useState, useEffect} from 'react';
import {View, Text, TouchableOpacity, TextInput} from 'react-native';
import Icons from '../../assets/svgs';
import {useAuth} from '../../hooks/useAuth';
import styles from '../../screens/LoginScreen/LoginScreen.styles';

export interface EmbeddedWalletAuthProps {
  provider?: 'privy' | 'dynamic' | 'turnkey';
  onWalletConnected: (info: {
    provider: 'privy' | 'dynamic' | 'turnkey';
    address: string;
  }) => void;
  authMode?: 'login' | 'signup';
}

const EmbeddedWalletAuth: React.FC<EmbeddedWalletAuthProps> = ({
  provider = 'privy',
  onWalletConnected,
  authMode = 'login',
}) => {
  const {status, loginWithGoogle, loginWithApple, loginWithEmail, user} =
    useAuth(provider);

  useEffect(() => {
    if (user && user.id && onWalletConnected) {
      onWalletConnected({ provider, address: user.id });
    }
  }, [user, onWalletConnected, provider]);

  return (
    <View style={styles.bottomButtonsContainer}>
      <TouchableOpacity style={styles.loginButton} onPress={loginWithGoogle}>
        <Icons.Google width={24} height={24} />
        <Text style={styles.buttonText}>Continue with Google</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.loginButton} onPress={loginWithApple}>
        <Icons.Apple width={24} height={24} />
        <Text style={styles.buttonText}>Continue with Apple</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.loginButton]}
        onPress={loginWithEmail}>
        <Icons.Device width={24} height={24} />
        <Text style={[styles.buttonText]}>Continue with Email</Text>
      </TouchableOpacity>
    </View>
  );
};

export default EmbeddedWalletAuth;
