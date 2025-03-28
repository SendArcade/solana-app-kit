import React, { useState, useEffect } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleProp,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { usePumpFun } from '../../hooks/usePumpFun';
import { PumpfunSellStyles } from './Pumpfun.styles';
import PumpfunCard from './PumpfunCard';
import { TransactionService } from '../../services/transaction/transactionService';

/**
 * Interface representing a token selected for selling
 * @interface SelectedToken
 */
export interface SelectedToken {
  /** The public key of the token's mint account */
  mintPubkey: string;
  /** The available token amount in UI format (decimal) */
  uiAmount: number;
}

/**
 * Props for the PumpfunSellSection component
 * @interface PumpfunSellSectionProps
 */
export interface PumpfunSellSectionProps {
  /** Optional pre-selected token to sell */
  selectedToken?: SelectedToken | null;
  /** Optional style override for the container */
  containerStyle?: StyleProp<ViewStyle>;
  /** Optional style override for the input fields */
  inputStyle?: StyleProp<TextStyle>;
  /** Optional style override for the sell button */
  buttonStyle?: StyleProp<ViewStyle>;
  /** Custom label for the sell button (defaults to 'Sell Token') */
  sellButtonLabel?: string;
}

/**
 * A component that provides a user interface for selling tokens through Pump.fun
 * 
 * @component
 * @description
 * PumpfunSellSection is a form component that allows users to sell tokens
 * through the Pump.fun platform. It supports both manual token address entry
 * and pre-selected tokens, with features for amount input and fee estimation.
 * 
 * Features:
 * - Manual token address input or pre-selected token support
 * - Token amount input with "Max" button for pre-selected tokens
 * - Network fee estimation
 * - Input validation
 * - Error handling and user feedback
 * - Customizable styling
 * 
 * @example
 * ```tsx
 * // With manual token input
 * <PumpfunSellSection
 *   containerStyle={styles.customContainer}
 *   sellButtonLabel="Sell Now"
 * />
 * 
 * // With pre-selected token
 * <PumpfunSellSection
 *   selectedToken={{
 *     mintPubkey: "5tMi...",
 *     uiAmount: 1000
 *   }}
 *   sellButtonLabel="Sell Token"
 * />
 * ```
 */
export const PumpfunSellSection: React.FC<PumpfunSellSectionProps> = ({
  selectedToken,
  containerStyle,
  inputStyle,
  buttonStyle,
  sellButtonLabel = 'Sell Token',
}) => {
  const { sellToken } = usePumpFun();

  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenAmount, setTokenAmount] = useState('0.0');
  const [estimatedFee, setEstimatedFee] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

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

  const handleSell = async () => {
    if (!tokenAddress) {
      Alert.alert('Error', 'Please enter or select a token address');
      return;
    }
    if (!tokenAmount || Number(tokenAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid token amount');
      return;
    }

    setIsLoading(true);
    setStatus('Preparing transaction...');

    try {
      await sellToken({
        tokenAddress,
        tokenAmount: Number(tokenAmount),
        onStatusUpdate: (newStatus) => {
          console.log('Sell token status:', newStatus);
          // Use TransactionService to filter raw error messages
          TransactionService.filterStatusUpdate(newStatus, setStatus);
        }
      });
      setStatus('Sale successful!');
      // Success message will be handled by TransactionService
    } catch (error) {
      console.error('Error selling token:', error);
      // Don't show raw error in UI
      setStatus('Transaction failed');
      // Error notification will be handled by TransactionService
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        setStatus(null);
      }, 2000);
    }
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
            editable={!isLoading}
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
        editable={!isLoading}
      />
      {selectedToken && (
        <TouchableOpacity
          style={[PumpfunSellStyles.maxButton, isLoading && { opacity: 0.5 }]}
          onPress={handleMax}
          disabled={isLoading}>
          <Text style={PumpfunSellStyles.maxButtonText}>Max</Text>
        </TouchableOpacity>
      )}

      {estimatedFee !== null && (
        <Text style={PumpfunSellStyles.feeEstimate}>
          Estimated Network Fee: ~{estimatedFee.toFixed(6)} SOL
        </Text>
      )}

      {status && (
        <Text style={PumpfunSellStyles.statusText}>{status}</Text>
      )}

      <TouchableOpacity
        style={[PumpfunSellStyles.sellButton, buttonStyle, isLoading && { opacity: 0.7 }]}
        onPress={handleSell}
        disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={PumpfunSellStyles.sellButtonText}>{sellButtonLabel}</Text>
        )}
      </TouchableOpacity>
    </PumpfunCard>
  );
};

export default PumpfunSellSection;
