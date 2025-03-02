import React, { useState } from 'react';
import { View, Text, SafeAreaView, StyleSheet, TouchableOpacity } from 'react-native';
import BuySection from './BuySection';
import SellSection from './SellSection';
import { styles } from './styles';
import { useAuth } from '../../../hooks/useAuth';



/**
 * Main NFT screen that shows two tabs: "Buy" and "Sell".
 * When "Buy" is active, it renders <BuySection/>; 
 * When "Sell" is active, it renders <SellSection/>.
 */
const NftScreen: React.FC = () => {
  const { solanaWallet } = useAuth();

  // For simplicity, using the first connected wallet
  const userPublicKey = solanaWallet?.wallets?.[0]?.publicKey || null;
  const userWallet = solanaWallet?.wallets?.[0] || null;

  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');

  if (!userPublicKey) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.warnText}>Please connect your wallet first!</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'buy' && styles.tabButtonActive]}
          onPress={() => setActiveTab('buy')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'buy' && styles.tabButtonTextActive]}>
            Buy
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'sell' && styles.tabButtonActive]}
          onPress={() => setActiveTab('sell')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'sell' && styles.tabButtonTextActive]}>
            Sell
          </Text>
        </TouchableOpacity>
      </View>

      {/* Conditional rendering of Buy or Sell sections */}
      {activeTab === 'buy' && (
        <BuySection userPublicKey={userPublicKey} userWallet={userWallet} />
      )}
      {activeTab === 'sell' && (
        <SellSection userPublicKey={userPublicKey} userWallet={userWallet} />
      )}
    </SafeAreaView>
  );
};

export default NftScreen;


