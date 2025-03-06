// File: src/components/wallet/EmbeddedWallet.tsx
import React, {useEffect} from 'react';
import {View, Text, TouchableOpacity, Alert} from 'react-native';
import Icons from '../../assets/svgs';
import {useAuth} from '../../hooks/useAuth';
import styles from '../../screens/Common/LoginScreen/LoginScreen.styles';

/**
 * Props for the EmbeddedWalletAuth component
 * @interface EmbeddedWalletAuthProps
 */
export interface EmbeddedWalletAuthProps {
  /** Callback function that receives wallet connection information */
  onWalletConnected: (info: {
    /** The authentication provider used */
    provider: 'privy' | 'dynamic' | 'turnkey';
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
