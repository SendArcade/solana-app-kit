// File: src/components/pumpfun/PumpfunSellButton.tsx

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {usePumpfun} from '../../hooks/usePumpfun';

type SelectedToken = {
  mintPubkey: string;
  uiAmount: number;
};

interface PumpfunSellButtonProps {
  /** If provided, we skip address input and default to this token. */
  selectedToken?: SelectedToken | null;
}

/**
 * A reusable component that allows the user to sell a Pumpfun-based token.
 *
 * - If `selectedToken` is passed, we disable the token address input
 *   and show a "Max" button for the full token amount.
 */
export const PumpfunSellButton: React.FC<PumpfunSellButtonProps> = ({
  selectedToken,
}) => {
  const {sellToken} = usePumpfun();

  // If user selected a token from the parent screen, auto-fill
  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenAmount, setTokenAmount] = useState('0.0');

  // An optional "estimated fee" placeholder:
  const [estimatedFee, setEstimatedFee] = useState<number | null>(null);

  useEffect(() => {
    if (selectedToken) {
      setTokenAddress(selectedToken.mintPubkey);
    }
  }, [selectedToken]);

  // Example "fake" fee estimate
  useEffect(() => {
    // You could do real logic with `connection.getFeeForMessage()`, or external API
    const randomEstimateLamports = 5000 + Math.floor(Math.random() * 5000); // ~5K-10K lamports
    const estimateSol = randomEstimateLamports / 1e9;
    setEstimatedFee(estimateSol);
  }, [tokenAmount]);

  const handleSell = () => {
    if (!tokenAddress) {
      alert('Please enter or select a token address');
      return;
    }
    if (!tokenAmount || Number(tokenAmount) <= 0) {
      alert('Please enter a valid token amount');
      return;
    }
    sellToken({
      tokenAddress,
      tokenAmount: Number(tokenAmount),
    });
  };

  const handleMax = () => {
    if (!selectedToken) return;
    // fill in the user’s entire token balance
    setTokenAmount(String(selectedToken.uiAmount));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Sell Token</Text>

      {!selectedToken && (
        <>
          <Text style={styles.label}>Token Address</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 5tMi..."
            value={tokenAddress}
            onChangeText={setTokenAddress}
          />
        </>
      )}

      <View style={styles.amountRow}>
        <Text style={styles.label}>Amount to Sell</Text>
        {selectedToken && (
          <TouchableOpacity style={styles.maxButton} onPress={handleMax}>
            <Text style={styles.maxButtonText}>Max</Text>
          </TouchableOpacity>
        )}
      </View>
      <TextInput
        style={styles.input}
        placeholder="1.0"
        value={tokenAmount}
        onChangeText={setTokenAmount}
        keyboardType="decimal-pad"
      />

      {estimatedFee !== null && (
        <Text style={styles.feeEstimate}>
          Estimated Network Fee: ~{estimatedFee.toFixed(6)} SOL
        </Text>
      )}

      <TouchableOpacity style={styles.sellButton} onPress={handleSell}>
        <Text style={styles.sellButtonText}>
          {selectedToken ? 'Sell Selected Token' : 'Sell Token'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default PumpfunSellButton;

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
    marginBottom: 4,
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginVertical: 4,
  },
  sellButton: {
    marginTop: 12,
    backgroundColor: '#900',
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
  },
  sellButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  maxButton: {
    backgroundColor: '#eee',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  maxButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 12,
  },
  feeEstimate: {
    fontStyle: 'italic',
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});
