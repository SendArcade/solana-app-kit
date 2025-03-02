// File: src/components/wallet/EmbeddedWallet.tsx
import React, {useEffect} from 'react';
import {View, Text, TouchableOpacity, Alert} from 'react-native';
import Icons from '../../assets/svgs';
import {useAuth} from '../../hooks/useAuth';
import styles from '../../screens/Common/LoginScreen/LoginScreen.styles';

export interface EmbeddedWalletAuthProps {
  onWalletConnected: (info: {
    provider: 'privy' | 'dynamic' | 'turnkey';
    address: string;
  }) => void;
  authMode?: 'login' | 'signup';
}

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
