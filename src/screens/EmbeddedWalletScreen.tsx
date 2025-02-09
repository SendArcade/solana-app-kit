import React, {useState, useCallback} from 'react';
import {View, Text, SafeAreaView} from 'react-native';
import EmbeddedWallet from '../components/wallet/EmbeddedWallet';

const EmbeddedWalletScreen: React.FC = () => {
  const [walletInfo, setWalletInfo] = useState<{
    provider: 'privy' | 'dynamic' | 'turnkey';
    address: string;
  } | null>(null);

  const handleWalletConnected = useCallback(
    (info: {provider: 'privy' | 'dynamic' | 'turnkey'; address: string}) => {
      setWalletInfo(info);
    },
    [],
  );

  return (
    <SafeAreaView style={{flex: 1}}>
      <EmbeddedWallet
        provider="privy"
        onWalletConnected={handleWalletConnected}
        // themeOverrides, styleOverrides, userStyleSheet, etc. if you want them
      />
      {walletInfo && (
        <View style={{padding: 16, alignItems: 'center'}}>
          <Text style={{fontSize: 16, fontWeight: '600'}}>
            Wallet Connected!
          </Text>
          <Text style={{fontSize: 14}}>
            Provider: {walletInfo.provider.toUpperCase()}
          </Text>
          <Text style={{fontSize: 14}}>Address: {walletInfo.address}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default EmbeddedWalletScreen;
