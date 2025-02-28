import React, { useState } from 'react';
import { View, Text, SafeAreaView, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import BuySection from './BuySection';
import SellSection from './SellSection';


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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 12,
  },
  warnText: {
    color: 'red',
    marginTop: 40,
    textAlign: 'center',
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    justifyContent: 'space-around',
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    padding: 4,
  },
  tabButton: {
    flex: 1,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#32D4DE',
  },
  tabButtonText: {
    color: '#2a2a2a',
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: '#ffffff',
  },
});
