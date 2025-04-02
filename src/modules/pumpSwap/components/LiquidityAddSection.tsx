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
  getDepositQuoteFromBase,
  getDepositQuoteFromQuote,
  addLiquidity
} from '../services/pumpSwapService'; // <--- calls the server, not the SDK
import { DEFAULT_SLIPPAGE } from '../utils/pumpSwapUtils';


// Replace this with an actual pool address
const DEFAULT_POOL = '11111111111111111111111111111111';

// Example tokens: You can change these to match your real base/quote tokens
const DEFAULT_BASE_TOKEN = { symbol: 'SOL', decimals: 9 };
const DEFAULT_QUOTE_TOKEN = { symbol: 'USDC', decimals: 6 };

interface LiquidityAddSectionProps {
  connection: Connection;
  solanaWallet: any;
}

/**
 * LiquidityAddSection allows a user to add liquidity to an existing pool
 */
export function LiquidityAddSection({
  connection,
  solanaWallet,
}: LiquidityAddSectionProps) {
  const { address, connected } = useWallet();

  // UI States
  const [baseAmount, setBaseAmount] = useState('');
  const [quoteAmount, setQuoteAmount] = useState('');
  const [lpTokenAmount, setLpTokenAmount] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Handle entering a base amount
  const handleBaseAmountChange = useCallback(async (amount: string) => {
    setBaseAmount(amount);
    setQuoteAmount('');
    setLpTokenAmount('0');

    if (!connected || !amount) return;

    try {
      setIsLoading(true);
      setError(null);
      setStatusMessage('Calculating quote...');

      const numericAmount = parseFloat(amount);
      const result = await getDepositQuoteFromBase(
        DEFAULT_POOL,
        numericAmount,
        DEFAULT_SLIPPAGE
      );

      setQuoteAmount(result.quote?.toString() || '0');
      setLpTokenAmount(result.lpToken?.toString() || '0');
      setStatusMessage(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get deposit quote');
    } finally {
      setIsLoading(false);
    }
  }, [connected]);

  // Handle entering a quote amount
  const handleQuoteAmountChange = useCallback(async (amount: string) => {
    setQuoteAmount(amount);
    setBaseAmount('');
    setLpTokenAmount('0');

    if (!connected || !amount) return;

    try {
      setIsLoading(true);
      setError(null);
      setStatusMessage('Calculating quote...');

      const numericAmount = parseFloat(amount);
      const result = await getDepositQuoteFromQuote(
        DEFAULT_POOL,
        numericAmount,
        DEFAULT_SLIPPAGE
      );

      setBaseAmount(result.base?.toString() || '0');
      setLpTokenAmount(result.lpToken?.toString() || '0');
      setStatusMessage(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get deposit quote');
    } finally {
      setIsLoading(false);
    }
  }, [connected]);

  // Perform add liquidity transaction
  const handleAddLiquidity = useCallback(async () => {
    if (!connected || !solanaWallet) return;

    const userAddress = address || '';
    if (!userAddress) {
      setError('No wallet address found');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const numericBase = parseFloat(baseAmount) || null;
      const numericQuote = parseFloat(quoteAmount) || null;

      await addLiquidity({
        pool: DEFAULT_POOL,
        baseAmount: numericBase,
        quoteAmount: numericQuote,
        lpTokenAmount: parseFloat(lpTokenAmount),
        slippage: DEFAULT_SLIPPAGE,
        userPublicKey: userAddress,
        connection,
        solanaWallet,
        onStatusUpdate: (msg) => setStatusMessage(msg),
      });

      setBaseAmount('');
      setQuoteAmount('');
      setLpTokenAmount('0');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add liquidity');
      setStatusMessage(null);
    } finally {
      setIsLoading(false);
    }
  }, [
    connected,
    solanaWallet,
    address,
    baseAmount,
    quoteAmount,
    lpTokenAmount,
    connection
  ]);

  if (!connected) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>
          Please connect your wallet to add liquidity
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        Add Liquidity ({DEFAULT_BASE_TOKEN.symbol}/{DEFAULT_QUOTE_TOKEN.symbol})
      </Text>

      {/* Base Input */}
      <TextInput
        style={styles.input}
        value={baseAmount}
        onChangeText={handleBaseAmountChange}
        placeholder={`Enter ${DEFAULT_BASE_TOKEN.symbol} amount`}
        keyboardType="numeric"
        editable={!isLoading}
      />

      {/* Quote Input */}
      <TextInput
        style={styles.input}
        value={quoteAmount}
        onChangeText={handleQuoteAmountChange}
        placeholder={`Enter ${DEFAULT_QUOTE_TOKEN.symbol} amount`}
        keyboardType="numeric"
        editable={!isLoading}
      />

      {/* LP tokens to receive (read-only) */}
      <View style={styles.lpContainer}>
        <Text style={styles.lpLabel}>LP tokens to receive:</Text>
        <Text style={styles.lpValue}>{lpTokenAmount}</Text>
      </View>

      {/* Add Liquidity button */}
      <TouchableOpacity
        style={[styles.button, isLoading ? styles.disabledButton : null]}
        onPress={handleAddLiquidity}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Processing...' : 'Add Liquidity'}
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
  lpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  lpLabel: { fontSize: 14, color: '#64748B' },
  lpValue: { fontSize: 16, fontWeight: '600', color: '#334155' },
  button: {
    backgroundColor: '#6E56CF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
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
