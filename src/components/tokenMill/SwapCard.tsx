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

interface Props {
  marketAddress: string;
  connection: Connection;
  publicKey: string;
  solanaWallet: any;
  setLoading: (val: boolean) => void;
}

export default function SwapCard({
  marketAddress,
  connection,
  publicKey,
  solanaWallet,
  setLoading,
}: Props) {
  const [swapType, setSwapType] = useState<'buy' | 'sell'>('buy');
  const [swapAmount, setSwapAmount] = useState('1000000');

  const onPressSwap = async () => {
    if (!marketAddress) {
      Alert.alert('Error', 'Market address is required.');
      return;
    }
    try {
      setLoading(true);
      const provider = await solanaWallet.getProvider();
      const txSig = await swapTokens({
        marketAddress,
        swapType,
        swapAmount: parseFloat(swapAmount),
        userPublicKey: publicKey,
        connection,
        provider,
      });
      Alert.alert('Swap Success', `Signature: ${txSig}`);
    } catch (err: any) {
      Alert.alert('Swap Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Swap (Buy/Sell)</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.swapBtn, swapType === 'buy' && styles.swapBtnActive]}
          onPress={() => setSwapType('buy')}>
          <Text
            style={[
              styles.swapBtnText,
              swapType === 'buy' && styles.swapBtnTextActive,
            ]}>
            Buy
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.swapBtn, swapType === 'sell' && styles.swapBtnActive]}
          onPress={() => setSwapType('sell')}>
          <Text
            style={[
              styles.swapBtnText,
              swapType === 'sell' && styles.swapBtnTextActive,
            ]}>
            Sell
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Swap Amount"
        value={swapAmount}
        onChangeText={setSwapAmount}
      />

      <TouchableOpacity style={styles.button} onPress={onPressSwap}>
        <Text style={styles.buttonText}>Swap</Text>
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
  row: {
    flexDirection: 'row',
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  swapBtn: {
    flex: 1,
    backgroundColor: '#eee',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  swapBtnActive: {
    backgroundColor: '#2a2a2a',
  },
  swapBtnText: {
    color: '#2a2a2a',
    fontWeight: '600',
  },
  swapBtnTextActive: {
    color: '#fff',
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
