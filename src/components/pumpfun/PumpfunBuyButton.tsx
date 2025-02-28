import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Clipboard,
  Alert,
} from 'react-native';
import {usePumpfun} from '../../hooks/usePumpFun';

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

  const pasteFromClipboard = async (field: 'token' | 'amount') => {
    try {
      const clipboardContent = await Clipboard.getString();
      if (field === 'token') {
        setTokenAddress(clipboardContent);
      } else {
        setSolAmount(clipboardContent);
      }
    } catch (error) {
      Alert.alert('Paste failed', 'Could not paste from clipboard');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Buy Token</Text>

      <Text style={styles.label}>Token Address</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="e.g. 5tMi..."
          value={tokenAddress}
          onChangeText={setTokenAddress}
          contextMenuHidden={false}
          textAlignVertical="center"
        />
        <TouchableOpacity
          style={styles.pasteButton}
          onPress={() => pasteFromClipboard('token')}>
          <Text style={styles.pasteButtonText}>Paste</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>SOL Amount</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="0.001"
          value={solAmount}
          onChangeText={setSolAmount}
          keyboardType="decimal-pad"
          contextMenuHidden={false}
          textAlignVertical="center"
        />
        <TouchableOpacity
          style={styles.pasteButton}
          onPress={() => pasteFromClipboard('amount')}>
          <Text style={styles.pasteButtonText}>Paste</Text>
        </TouchableOpacity>
      </View>

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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  pasteButton: {
    marginLeft: 8,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  pasteButtonText: {
    color: '#000',
    fontWeight: '500',
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
