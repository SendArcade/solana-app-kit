import React, {useState, useEffect} from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {usePumpfun} from '../../hooks/usePumpFun';
import {PumpfunSellStyles} from './Pumpfun.styles';
import PumpfunCard from './PumpfunCard';

export interface SelectedToken {
  mintPubkey: string;
  uiAmount: number;
}

export interface PumpfunSellSectionProps {
  selectedToken?: SelectedToken | null;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  buttonStyle?: StyleProp<ViewStyle>;
  sellButtonLabel?: string;
}

/**
 * A reusable component that allows the user to sell a Pumpfun-based token.
 */
export const PumpfunSellSection: React.FC<PumpfunSellSectionProps> = ({
  selectedToken,
  containerStyle,
  inputStyle,
  buttonStyle,
  sellButtonLabel = 'Sell Token',
}) => {
  const {sellToken} = usePumpfun();

  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenAmount, setTokenAmount] = useState('0.0');
  const [estimatedFee, setEstimatedFee] = useState<number | null>(null);

  useEffect(() => {
    if (selectedToken) {
      setTokenAddress(selectedToken.mintPubkey);
    }
  }, [selectedToken]);

  useEffect(() => {
    // Simulated fee estimate for demonstration
    const randomEstimateLamports = 5000 + Math.floor(Math.random() * 5000);
    const estimateSol = randomEstimateLamports / 1e9;
    setEstimatedFee(estimateSol);
  }, [tokenAmount]);

  const handleSell = () => {
    if (!tokenAddress) {
      Alert.alert('Error', 'Please enter or select a token address');
      return;
    }
    if (!tokenAmount || Number(tokenAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid token amount');
      return;
    }
    sellToken({
      tokenAddress,
      tokenAmount: Number(tokenAmount),
    });
  };

  const handleMax = () => {
    if (selectedToken) {
      setTokenAmount(String(selectedToken.uiAmount));
    }
  };

  return (
    <PumpfunCard containerStyle={containerStyle}>
      <Text style={PumpfunSellStyles.sectionTitle}>Sell Token</Text>

      {!selectedToken && (
        <>
          <Text style={PumpfunSellStyles.label}>Token Address</Text>
          <TextInput
            style={[PumpfunSellStyles.input, inputStyle]}
            placeholder="e.g. 5tMi..."
            value={tokenAddress}
            onChangeText={setTokenAddress}
          />
        </>
      )}

      <Text style={PumpfunSellStyles.label}>Amount to Sell</Text>
      <TextInput
        style={[PumpfunSellStyles.input, inputStyle]}
        placeholder="1.0"
        value={tokenAmount}
        onChangeText={setTokenAmount}
        keyboardType="decimal-pad"
      />
      {selectedToken && (
        <TouchableOpacity
          style={PumpfunSellStyles.maxButton}
          onPress={handleMax}>
          <Text style={PumpfunSellStyles.maxButtonText}>Max</Text>
        </TouchableOpacity>
      )}

      {estimatedFee !== null && (
        <Text style={PumpfunSellStyles.feeEstimate}>
          Estimated Network Fee: ~{estimatedFee.toFixed(6)} SOL
        </Text>
      )}

      <TouchableOpacity
        style={[PumpfunSellStyles.sellButton, buttonStyle]}
        onPress={handleSell}>
        <Text style={PumpfunSellStyles.sellButtonText}>{sellButtonLabel}</Text>
      </TouchableOpacity>
    </PumpfunCard>
  );
};

export default PumpfunSellSection;
