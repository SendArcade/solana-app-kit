import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { useWallet } from '../../embeddedWalletProviders/hooks/useWallet';
import { Connection } from '@solana/web3.js';
import {
  getWithdrawalQuote,
  removeLiquidity
} from '../services/pumpSwapService'; // <--- server calls only
import { DEFAULT_SLIPPAGE } from '../utils/pumpSwapUtils';


// Replace this with an actual pool address
const DEFAULT_POOL = '11111111111111111111111111111111';

// Example tokens for display
const DEFAULT_BASE_TOKEN = { symbol: 'SOL', decimals: 9 };
const DEFAULT_QUOTE_TOKEN = { symbol: 'USDC', decimals: 6 };

interface LiquidityRemoveSectionProps {
  connection: Connection;
  solanaWallet: any;
}

/**
 * LiquidityRemoveSection allows a user to remove liquidity from a pool
 */
export function LiquidityRemoveSection({
  connection,
  solanaWallet,
}: LiquidityRemoveSectionProps) {
  const { address, connected } = useWallet();

  // UI States
  const [lpTokenAmount, setLpTokenAmount] = useState('');
  const [baseAmount, setBaseAmount] = useState('');
  const [quoteAmount, setQuoteAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Handle entering an LP token amount
  const handleLpTokenAmountChange = useCallback(async (amount: string) => {
    setLpTokenAmount(amount);
    setBaseAmount('');
    setQuoteAmount('');

    if (!connected || !amount) return;

    try {
      setIsLoading(true);
      setError(null);
      setStatusMessage('Calculating expected tokens...');

      const numericAmount = parseFloat(amount);
      const quote = await getWithdrawalQuote(
        DEFAULT_POOL,
        numericAmount,
        DEFAULT_SLIPPAGE
      );

      setBaseAmount(quote.base?.toString() || '0');
      setQuoteAmount(quote.quote?.toString() || '0');
      setStatusMessage(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get withdrawal quote');
    } finally {
      setIsLoading(false);
    }
  }, [connected]);

  // Remove liquidity transaction
  const handleRemoveLiquidity = useCallback(async () => {
    if (!connected || !solanaWallet) return;

    const userAddress = address || '';
    if (!userAddress) {
      setError('No wallet address found');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const numericLp = parseFloat(lpTokenAmount);
      if (isNaN(numericLp) || numericLp <= 0) {
        throw new Error('Invalid LP token amount');
      }

      await removeLiquidity({
        pool: DEFAULT_POOL,
        lpTokenAmount: numericLp,
        slippage: DEFAULT_SLIPPAGE,
        userPublicKey: userAddress,
        connection,
        solanaWallet,
        onStatusUpdate: (msg) => setStatusMessage(msg),
      });

      setLpTokenAmount('');
      setBaseAmount('');
      setQuoteAmount('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove liquidity');
      setStatusMessage(null);
    } finally {
      setIsLoading(false);
    }
  }, [
    connected,
    solanaWallet,
    address,
    lpTokenAmount,
    connection
  ]);

  if (!connected) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>
          Please connect your wallet to remove liquidity
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        Remove Liquidity ({DEFAULT_BASE_TOKEN.symbol}/{DEFAULT_QUOTE_TOKEN.symbol})
      </Text>

      {/* LP Token input */}
      <TextInput
        style={styles.input}
        value={lpTokenAmount}
        onChangeText={handleLpTokenAmountChange}
        placeholder="Enter LP token amount"
        keyboardType="numeric"
        editable={!isLoading}
      />

      {/* Show expected base/quote amounts */}
      <View style={styles.outputContainer}>
        <Text style={styles.outputLabel}>Expected Output:</Text>
        <View style={styles.row}>
          <Text style={styles.tokenLabel}>{DEFAULT_BASE_TOKEN.symbol}:</Text>
          <Text style={styles.tokenValue}>{baseAmount || '0'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.tokenLabel}>{DEFAULT_QUOTE_TOKEN.symbol}:</Text>
          <Text style={styles.tokenValue}>{quoteAmount || '0'}</Text>
        </View>
      </View>

      {/* Remove liquidity button */}
      <TouchableOpacity
        style={[styles.button, isLoading ? styles.disabledButton : null]}
        onPress={handleRemoveLiquidity}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Processing...' : 'Remove Liquidity'}
        </Text>
      </TouchableOpacity>

      {/* Loading */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#6E56CF" />
        </View>
      )}

      {/* Status & error */}
      {statusMessage && <Text style={styles.statusText}>{statusMessage}</Text>}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  infoText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
    color: '#1E293B',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  outputContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
  },
  outputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  tokenLabel: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '500',
  },
  tokenValue: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#6E56CF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: { opacity: 0.5 },
  loadingContainer: { marginTop: 12, alignItems: 'center' },
  statusText: {
    marginTop: 10,
    fontSize: 14,
    color: '#64748B',
  },
  errorContainer: {
    marginTop: 10,
    backgroundColor: '#ffeef0',
    borderRadius: 6,
    padding: 8,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
});
