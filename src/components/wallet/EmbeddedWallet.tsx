// File: src/components/wallet/EmbeddedWallet.tsx
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import Icons from '../../assets/svgs';
import { useAuth } from '../../hooks/useAuth';
import styles from '../../screens/Common/LoginScreen/LoginScreen.styles';
import { useCustomization } from '../../CustomizationProvider';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { useAppDispatch } from '../../hooks/useReduxHooks';
import { loginSuccess } from '../../state/auth/reducer';

import type { Web3MobileWallet } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import type { PublicKey as SolanaPublicKey } from '@solana/web3.js';

type TransactFunction = <T>(
  callback: (wallet: Web3MobileWallet) => Promise<T>
) => Promise<T>;

let transact: TransactFunction | undefined;
let PublicKey: typeof SolanaPublicKey | undefined;
let Buffer: { from: (data: string, encoding: string) => Uint8Array } | undefined;

if (Platform.OS === 'android') {
  const mwaModule = require('@solana-mobile/mobile-wallet-adapter-protocol-web3js');
  transact = mwaModule.transact as TransactFunction;

  const web3Module = require('@solana/web3.js');
  PublicKey = web3Module.PublicKey;

  const bufferModule = require('buffer');
  Buffer = bufferModule.Buffer;
}

export interface EmbeddedWalletAuthProps {
  onWalletConnected: (info: {
    provider: 'privy' | 'dynamic' | 'turnkey' | 'mwa';
    address: string;
  }) => void;
  authMode?: 'login' | 'signup';
}

const EmbeddedWalletAuth: React.FC<EmbeddedWalletAuthProps> = ({
  onWalletConnected,
  authMode = 'login',
}) => {
  const {
    status,
    loginWithGoogle,
    loginWithApple,
    loginWithEmail,
    user,
    solanaWallet,
  } = useAuth();

  const { auth: authConfig } = useCustomization();
  const navigation = useAppNavigation();
  const dispatch = useAppDispatch();

  // For Dynamic, if user is already authenticated, trigger onWalletConnected immediately
  useEffect(() => {
    if (authConfig.provider === 'dynamic' && status === 'authenticated' && user?.id) {
      console.log('User already authenticated with Dynamic, triggering callback and navigating');
      onWalletConnected({ provider: 'dynamic', address: user.id });

      // Navigate to PlatformSelectionScreen after a short delay
      // The delay ensures the onWalletConnected callback has time to complete
      setTimeout(() => {
        navigation.navigate('MainTabs' as never);
      }, 100);
    }
  }, [authConfig.provider, status, user, onWalletConnected, navigation]);

  const loginWithMWA = async () => {
    if (Platform.OS !== 'android') {
      Alert.alert('Not Supported', 'Mobile Wallet Adapter is only available on Android devices');
      return;
    }
    if (!transact || !PublicKey || !Buffer) {
      Alert.alert('Error', 'Required modules for MWA not available');
      return;
    }

    const APP_IDENTITY = {
      name: 'React Native dApp',
      uri: 'https://yourdapp.com',
      icon: 'favicon.ico',
    };

    try {
      const authorizationResult = await transact(async (wallet: Web3MobileWallet) => {
        return await wallet.authorize({
          cluster: 'devnet',
          identity: APP_IDENTITY,
        });
      });

      if (authorizationResult?.accounts?.length) {
        // Convert base64 pubkey to a Solana PublicKey
        const encodedPublicKey = authorizationResult.accounts[0].address;
        const publicKeyBuffer = Buffer.from(encodedPublicKey, 'base64');
        const publicKey = new PublicKey(publicKeyBuffer);
        const base58Address = publicKey.toBase58();

        console.log('MWA connection successful, address:', base58Address);

        // First dispatch the loginSuccess action directly
        // This ensures the address is immediately available in the Redux store
        dispatch(
          loginSuccess({
            provider: 'mwa',
            address: base58Address,
          })
        );

        // Then call the onWalletConnected callback
        onWalletConnected({
          provider: 'mwa',
          address: base58Address,
        });

        // Navigate to MainTabs after a short delay
        setTimeout(() => {
          navigation.navigate('MainTabs' as never);
        }, 100);
      } else {
        Alert.alert('Connection Error', 'No accounts found in wallet');
      }
    } catch (error) {
      console.error('MWA connection error:', error);
      Alert.alert('Connection Error', 'Failed to connect to wallet');
    }
  };

  useEffect(() => {
    // If user + solanaWallet are present, it implies a Privy login
    if (authConfig.provider === 'privy' && user && solanaWallet && onWalletConnected) {
      const walletPublicKey =
        solanaWallet.wallets && solanaWallet.wallets.length > 0
          ? solanaWallet.wallets[0].publicKey
          : null;
      if (!solanaWallet || !walletPublicKey) {
        Alert.alert('Wallet Error', 'Wallet not connected');
        return;
      }
      onWalletConnected({ provider: 'privy', address: walletPublicKey });
    }
  }, [user, onWalletConnected, solanaWallet, authConfig.provider]);

  // Handle login with error handling
  const handleGoogleLogin = async () => {
    try {
      if (loginWithGoogle) {
        console.log('Logging in with Google and passing navigation');
        await loginWithGoogle();
        // Navigation will now be handled inside loginWithGoogle
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Authentication Error', 'Failed to authenticate with Google. Please try again.');
    }
  };

  const handleAppleLogin = async () => {
    try {
      if (loginWithApple) {
        console.log('Logging in with Apple and passing navigation');
        await loginWithApple();
        // Navigation will now be handled inside loginWithApple
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Authentication Error', 'Failed to authenticate with Apple. Please try again.');
    }
  };

  const handleEmailLogin = async () => {
    try {
      if (loginWithEmail) await loginWithEmail();
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Authentication Error', 'Failed to authenticate with Email. Please try again.');
    }
  };

  return (
    <View style={styles.bottomButtonsContainer}>
      {Platform.OS === 'android' && (
        <TouchableOpacity style={styles.loginButton} onPress={loginWithMWA}>
          <Icons.Google width={24} height={24} />
          <Text style={styles.buttonText}>Continue with MWA</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.loginButton} onPress={handleGoogleLogin}>
        <Icons.Google width={24} height={24} />
        <Text style={styles.buttonText}>Continue with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.loginButton} onPress={handleAppleLogin}>
        <Icons.Apple width={24} height={24} />
        <Text style={styles.buttonText}>Continue with Apple</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.loginButton]} onPress={handleEmailLogin}>
        <Icons.Device width={24} height={24} />
        <Text style={[styles.buttonText]}>Continue with Email</Text>
      </TouchableOpacity>
    </View>
  );
};

export default EmbeddedWalletAuth;
