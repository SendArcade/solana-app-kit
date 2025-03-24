// File: src/screens/TokenMillScreen/components/SwapCard.tsx
import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import {Connection} from '@solana/web3.js';
import { swapTokens } from '../../services/tokenMill/tokenMillService';
import { StandardWallet } from '../../hooks/useAuth';

interface Props {
  marketAddress: string;
  connection: Connection;
  publicKey: string;
  solanaWallet: StandardWallet | any;
  setLoading: (val: boolean) => void;
}

export default function SwapCard({
  marketAddress,
  connection,
  publicKey,
  solanaWallet,
  setLoading,
}: Props) {
  const [amount, setAmount] = useState('1');
  const [swapType, setSwapType] = useState<'buy' | 'sell'>('buy');

  const onPressSwap = async () => {
    if (!marketAddress) {
      Alert.alert('No market', 'Please enter or create a market first!');
      return;
    }
    try {
      setLoading(true);
      const txSig = await swapTokens({
        marketAddress,
        swapType,
        swapAmount: parseFloat(amount),
        userPublicKey: publicKey,
        connection,
        solanaWallet,
      });
      Alert.alert('Swap Complete', `Tx: ${txSig}`);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Swap</Text>

      <TextInput
        style={styles.input}
        placeholder="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
      />

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, swapType === 'buy' && styles.selectedTab]}
          onPress={() => setSwapType('buy')}>
          <Text
            style={[
              styles.tabText,
              swapType === 'buy' && styles.selectedTabText,
            ]}>
            Buy
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, swapType === 'sell' && styles.selectedTab]}
          onPress={() => setSwapType('sell')}>
          <Text
            style={[
              styles.tabText,
              swapType === 'sell' && styles.selectedTabText,
            ]}>
            Sell
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={onPressSwap}>
        <Text style={styles.buttonText}>
          {swapType === 'buy' ? 'Buy Tokens' : 'Sell Tokens'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: '#2a2a2a',
  },
  input: {
    backgroundColor: '#fafafa',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 6,
    marginHorizontal: 2,
  },
  selectedTab: {
    backgroundColor: '#2a2a2a',
    borderColor: '#2a2a2a',
  },
  tabText: {
    color: '#2a2a2a',
    fontWeight: '600',
  },
  selectedTabText: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#2a2a2a',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
