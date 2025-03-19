// File: src/components/wallet/EmbeddedWallet.tsx
import React, {useEffect} from 'react';
import {View, Text, TouchableOpacity, Alert, Platform} from 'react-native';
import Icons from '../../assets/svgs';
import {useAuth} from '../../hooks/useAuth';
import styles from '../../screens/Common/LoginScreen/LoginScreen.styles';

// Import types for TypeScript even if we don't use the actual implementations on iOS
import type {
  Web3MobileWallet,
} from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import type { PublicKey as SolanaPublicKey } from '@solana/web3.js';

// Define types for our conditionally imported modules
type TransactFunction = <T>(
  callback: (wallet: Web3MobileWallet) => Promise<T>
) => Promise<T>;

// Only import MWA-related modules on Android
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

/**
 * Props for the EmbeddedWalletAuth component
 * @interface EmbeddedWalletAuthProps
 */
export interface EmbeddedWalletAuthProps {
  /** Callback function that receives wallet connection information */
  onWalletConnected: (info: {
    /** The authentication provider used */
    provider: 'privy' | 'dynamic' | 'turnkey' | 'mwa';
    /** The connected wallet's public key */
    address: string;
  }) => void;
  /** The authentication mode to use (defaults to 'login') */
  authMode?: 'login' | 'signup';
}

/**
 * A component that provides embedded wallet authentication functionality
 * 
 * @component
 * @description
 * EmbeddedWalletAuth is a component that handles wallet authentication through
 * various providers (Google, Apple, Email) and manages the connection state.
 * It provides a user interface for authentication and handles wallet connection
 * callbacks.
 * 
 * Features:
 * - Multiple authentication methods:
 *   - Google Sign-In
 *   - Apple Sign-In
 *   - Email Sign-In
 *   - Mobile Wallet Adapter (MWA) - Android only
 * - Automatic wallet connection handling
 * - Error handling and user feedback
 * - Provider-specific wallet management
 * 
 * @example
 * ```tsx
 * <EmbeddedWalletAuth
 *   onWalletConnected={({provider, address}) => {
 *     console.log(`Connected with ${provider}: ${address}`);
 *   }}
 *   authMode="login"
 * />
 * ```
 */
const EmbeddedWalletAuth: React.FC<EmbeddedWalletAuthProps> = ({
  onWalletConnected,
  authMode = 'login',
}) => {
  // Use the updated hook (no provider parameter)
  const {
    status,
    loginWithGoogle,
    loginWithApple,
    loginWithEmail,
    user,
    solanaWallet,
  } = useAuth();

  const loginWithMWA = async () => {
    // Only run on Android
    if (Platform.OS !== 'android') {
      Alert.alert("Not Supported", "Mobile Wallet Adapter is only available on Android devices");
      return;
    }
    
    // Check if the required modules are available
    if (!transact || !PublicKey || !Buffer) {
      Alert.alert("Error", "Required modules not available");
      return;
    }
    
    const APP_IDENTITY = {
      name: 'React Native dApp',
      uri: 'https://yourdapp.com',
      icon: "favicon.ico", // Full path resolves to https://yourdapp.com/favicon.ico
    };
    
    try {
      const authorizationResult = await transact(async (wallet: Web3MobileWallet) => {
        const authResult = await wallet.authorize({
          cluster: 'devnet',
          identity: APP_IDENTITY,
        });
      
        console.log(authResult);
        return authResult;
      });
      
      // Extract the public key from the first account
      if (authorizationResult && authorizationResult.accounts && authorizationResult.accounts.length > 0) {
        const encodedPublicKey = authorizationResult.accounts[0].address;
        
        // Convert the base64 encoded public key to a Solana PublicKey
        // First decode the base64 string to a buffer
        const publicKeyBuffer = Buffer.from(encodedPublicKey, 'base64');
        
        // Then create a PublicKey from the buffer
        const publicKey = new PublicKey(publicKeyBuffer);
        
        // Get the base58 encoded address
        const base58Address = publicKey.toBase58();
        
        console.log("Converted address:", base58Address);
        
        // Call the onWalletConnected callback with the properly formatted address
        onWalletConnected({
          provider: 'mwa',
          address: base58Address
        });
      } else {
        Alert.alert("Connection Error", "No accounts found in wallet");
      }
    } catch (error) {
      console.error("MWA connection error:", error);
      Alert.alert("Connection Error", "Failed to connect to wallet");
    }
  };

  /**
   * Effect hook to handle wallet connection and callback
   * Triggers when user, wallet, or callback changes
   */
  useEffect(() => {
    console.log(solanaWallet, 'solanaWallet');
    if (user && solanaWallet && onWalletConnected) {
      const walletPublicKey =
        solanaWallet.wallets && solanaWallet.wallets.length > 0
          ? solanaWallet.wallets[0].publicKey
          : null;
      if (!solanaWallet || !walletPublicKey) {
        Alert.alert('Wallet Error', 'Wallet not connected');
        return;
      }
      // In this example we assume "privy" as the provider (the default from customization)
      onWalletConnected({provider: 'privy', address: walletPublicKey});
    }
  }, [user, onWalletConnected, solanaWallet]);

  return (
    <View style={styles.bottomButtonsContainer}>
      {/* Only show MWA button on Android */}
      {Platform.OS === 'android' && (
        <TouchableOpacity style={styles.loginButton} onPress={loginWithMWA}>
          <Icons.Google width={24} height={24} />
          <Text style={styles.buttonText}>Continue with MWA</Text>
        </TouchableOpacity>
      )}
      
      <TouchableOpacity style={styles.loginButton} onPress={loginWithGoogle}>
        <Icons.Google width={24} height={24} />
        <Text style={styles.buttonText}>Continue with Google</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.loginButton} onPress={loginWithApple}>
        <Icons.Apple width={24} height={24} />
        <Text style={styles.buttonText}>Continue with Apple</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.loginButton]} onPress={loginWithEmail}>
        <Icons.Device width={24} height={24} />
        <Text style={[styles.buttonText]}>Continue with Email</Text>
      </TouchableOpacity>
    </View>
  );
};

export default EmbeddedWalletAuth;
