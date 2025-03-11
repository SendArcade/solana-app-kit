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
import {usePumpFun} from '../../hooks/usePumpFun';
import {PumpfunBuyStyles} from './Pumpfun.styles';
import PumpfunCard from './PumpfunCard';

/**
 * Props for the PumpfunBuySection component
 * @interface PumpfunBuySectionProps
 */
export interface PumpfunBuySectionProps {
  /** Optional style override for the container */
  containerStyle?: StyleProp<ViewStyle>;
  /** Optional style override for the input fields */
  inputStyle?: StyleProp<TextStyle>;
  /** Optional style override for the buy button */
  buttonStyle?: StyleProp<ViewStyle>;
  /** Custom label for the buy button (defaults to 'Buy via Pump.fun') */
  buyButtonLabel?: string;
}

/**
 * A component that provides a user interface for buying tokens through Pump.fun
 * 
 * @component
 * @description
 * PumpfunBuySection is a form component that allows users to purchase tokens
 * through the Pump.fun platform. It provides input fields for token address
 * and SOL amount, with clipboard integration for easy data entry.
 * 
 * Features:
 * - Token address input with paste functionality
 * - SOL amount input with decimal support
 * - Input validation
 * - Clipboard integration
 * - Customizable styling
 * - Error handling and user feedback
 * 
 * @example
 * ```tsx
 * <PumpfunBuySection
 *   containerStyle={styles.customContainer}
 *   inputStyle={styles.customInput}
 *   buttonStyle={styles.customButton}
 *   buyButtonLabel="Purchase Token"
 * />
 * ```
 */
export const PumpfunBuySection: React.FC<PumpfunBuySectionProps> = ({
  containerStyle,
  inputStyle,
  buttonStyle,
  buyButtonLabel = 'Buy via Pump.fun',
}) => {
  const {buyToken} = usePumpFun();

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
