import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {usePumpfun} from '../../hooks/usePumpfun';

/**
 * A reusable component that allows the user to buy a Pumpfun-based token.
 */
export const PumpfunBuyButton = () => {
  const {buyToken} = usePumpfun();

  const [tokenAddress, setTokenAddress] = useState('');
  const [solAmount, setSolAmount] = useState('0.001');

  const handleBuy = () => {
    if (!tokenAddress) {
      alert('Please enter a token address');
      return;
    }
    buyToken({
      tokenAddress,
      solAmount: Number(solAmount),
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Buy Token</Text>

      <Text style={styles.label}>Token Address</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 5tMi..."
        value={tokenAddress}
        onChangeText={setTokenAddress}
      />

      <Text style={styles.label}>SOL Amount</Text>
      <TextInput
        style={styles.input}
        placeholder="0.001"
        value={solAmount}
        onChangeText={setSolAmount}
        keyboardType="decimal-pad"
      />

      <TouchableOpacity style={styles.buyButton} onPress={handleBuy}>
        <Text style={styles.buyButtonText}>Buy via Pump.fun</Text>
      </TouchableOpacity>
    </View>
  );
};

export default PumpfunBuyButton;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  label: {
    fontWeight: '500',
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginVertical: 4,
  },
  buyButton: {
    marginTop: 12,
    backgroundColor: '#000',
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
