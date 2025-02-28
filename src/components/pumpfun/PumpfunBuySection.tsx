import React, {useState} from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  Clipboard,
  Alert,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {usePumpfun} from '../../hooks/usePumpfun';
import {PumpfunBuyStyles} from './Pumpfun.styles';
import PumpfunCard from './PumpfunCard';

export interface PumpfunBuySectionProps {
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  buttonStyle?: StyleProp<ViewStyle>;
  buyButtonLabel?: string;
}

/**
 * A reusable component that allows the user to buy a Pumpfun-based token.
 */
export const PumpfunBuySection: React.FC<PumpfunBuySectionProps> = ({
  containerStyle,
  inputStyle,
  buttonStyle,
  buyButtonLabel = 'Buy via Pump.fun',
}) => {
  const {buyToken} = usePumpfun();

  const [tokenAddress, setTokenAddress] = useState('');
  const [solAmount, setSolAmount] = useState('0.001');

  const handleBuy = () => {
    if (!tokenAddress) {
      Alert.alert('Error', 'Please enter a token address');
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
    <PumpfunCard containerStyle={containerStyle}>
      <Text style={PumpfunBuyStyles.sectionTitle}>Buy Token</Text>

      <Text style={PumpfunBuyStyles.label}>Token Address</Text>
      <TextInput
        style={[PumpfunBuyStyles.input, inputStyle]}
        placeholder="e.g. 5tMi..."
        value={tokenAddress}
        onChangeText={setTokenAddress}
        textAlignVertical="center"
      />
      <TouchableOpacity
        style={PumpfunBuyStyles.pasteButton}
        onPress={() => pasteFromClipboard('token')}>
        <Text style={PumpfunBuyStyles.pasteButtonText}>Paste</Text>
      </TouchableOpacity>

      <Text style={PumpfunBuyStyles.label}>SOL Amount</Text>
      <TextInput
        style={[PumpfunBuyStyles.input, inputStyle]}
        placeholder="0.001"
        value={solAmount}
        onChangeText={setSolAmount}
        keyboardType="decimal-pad"
        textAlignVertical="center"
      />
      <TouchableOpacity
        style={PumpfunBuyStyles.pasteButton}
        onPress={() => pasteFromClipboard('amount')}>
        <Text style={PumpfunBuyStyles.pasteButtonText}>Paste</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[PumpfunBuyStyles.buyButton, buttonStyle]}
        onPress={handleBuy}>
        <Text style={PumpfunBuyStyles.buyButtonText}>{buyButtonLabel}</Text>
      </TouchableOpacity>
    </PumpfunCard>
  );
};

export default PumpfunBuySection;
