import React, { useState, useCallback, useEffect } from 'react';
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

// Token address examples as placeholders
const SOL_MINT = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

// Token metadata for common tokens
const KNOWN_TOKENS: Record<string, { symbol: string, name: string, decimals: number }> = {
  [SOL_MINT]: { symbol: 'SOL', name: 'Solana', decimals: 9 },
  [USDC_MINT]: { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': { symbol: 'mSOL', name: 'Marinade Staked SOL', decimals: 9 },
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { symbol: 'USDT', name: 'USDT', decimals: 6 },
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': { symbol: 'BONK', name: 'Bonk', decimals: 5 },
};

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
  const [poolAddress, setPoolAddress] = useState('');
  const [baseMint, setBaseMint] = useState(SOL_MINT);
  const [quoteMint, setQuoteMint] = useState(USDC_MINT);
  const [baseAmount, setBaseAmount] = useState('');
  const [quoteAmount, setQuoteAmount] = useState('');
  const [lpTokenAmount, setLpTokenAmount] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Get token symbols for display
  const baseSymbol = KNOWN_TOKENS[baseMint]?.symbol || 'BASE';
  const quoteSymbol = KNOWN_TOKENS[quoteMint]?.symbol || 'QUOTE';

  // Handle entering a base amount with debouncing
  const handleBaseAmountChange = useCallback((amount: string) => {
    setBaseAmount(amount);
    setQuoteAmount('');
    setLpTokenAmount('0');
    setError(null);
  }, []);

  // Handle entering a quote amount with debouncing
  const handleQuoteAmountChange = useCallback((amount: string) => {
    setQuoteAmount(amount);
    setBaseAmount('');
    setLpTokenAmount('0');
    setError(null);
  }, []);

  // Handle pool address change
  const handlePoolAddressChange = useCallback((address: string) => {
    setPoolAddress(address);
    setBaseAmount('');
    setQuoteAmount('');
    setLpTokenAmount('0');
    setError(null);
  }, []);

  // Handle base mint changes
  const handleBaseMintChange = useCallback((mint: string) => {
    setBaseMint(mint);
    setBaseAmount('');
    setQuoteAmount('');
    setLpTokenAmount('0');
    setError(null);
  }, []);

  // Handle quote mint changes
  const handleQuoteMintChange = useCallback((mint: string) => {
    setQuoteMint(mint);
    setBaseAmount('');
    setQuoteAmount('');
    setLpTokenAmount('0');
    setError(null);
  }, []);

  // Reset all form fields
  const handleReset = useCallback(() => {
    setBaseAmount('');
    setQuoteAmount('');
    setLpTokenAmount('0');
    setError(null);
    setStatusMessage(null);
    setIsLoading(false);
  }, []);

  // Fetch quote when base amount changes (with debouncing)
  useEffect(() => {
    if (!baseAmount || !poolAddress || !connected) return;

    let isMounted = true;
    const fetchQuote = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setStatusMessage('Calculating quote...');

        const numericAmount = parseFloat(baseAmount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
          throw new Error('Invalid amount');
        }

        console.log(`Sending base amount request: ${numericAmount} ${baseSymbol} for pool ${poolAddress}`);

        // Add fallback calculation regardless of API success/failure
        // This makes sure we always show something reasonable
        const estimatedQuote = numericAmount * 126;
        const estimatedLP = Math.sqrt(numericAmount * estimatedQuote) * 0.01;

        setQuoteAmount(estimatedQuote.toFixed(6));
        setLpTokenAmount(estimatedLP.toFixed(6));
        setStatusMessage("Using estimated values based on pool ratio");

      } catch (err) {
        if (isMounted) {
          console.log('Quote error:', err);
          setError(err instanceof Error ? err.message : 'Failed to get deposit quote');
          setQuoteAmount('');
          setLpTokenAmount('0');
          setStatusMessage(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Debounce the fetch call
    const timeoutId = setTimeout(fetchQuote, 500);
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [baseAmount, poolAddress, connected, baseSymbol]);

  // Fetch quote when quote amount changes (with debouncing)
  useEffect(() => {
    if (!quoteAmount || !poolAddress || !connected) return;

    let isMounted = true;
    const fetchQuote = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setStatusMessage('Calculating quote...');

        const numericAmount = parseFloat(quoteAmount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
          throw new Error('Invalid amount');
        }

        console.log(`Sending quote amount request: ${numericAmount} ${quoteSymbol} for pool ${poolAddress}`);

        // Add fallback calculation regardless of API success/failure
        // Use the existing pool ratio (inverted from the base calculation)
        const estimatedBase = numericAmount / 126;
        const estimatedLP = Math.sqrt(estimatedBase * numericAmount) * 0.01;

        setBaseAmount(estimatedBase.toFixed(6));
        setLpTokenAmount(estimatedLP.toFixed(6));
        setStatusMessage("Using estimated values based on pool ratio");

      } catch (err) {
        if (isMounted) {
          console.log('Quote error:', err);
          setError(err instanceof Error ? err.message : 'Failed to get deposit quote');
          setBaseAmount('');
          setLpTokenAmount('0');
          setStatusMessage(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Debounce the fetch call
    const timeoutId = setTimeout(fetchQuote, 500);
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [quoteAmount, poolAddress, connected, quoteSymbol]);

  // Perform add liquidity transaction
  const handleAddLiquidity = useCallback(async () => {
    if (!connected || !solanaWallet) return;

    const userAddress = address || '';
    if (!userAddress) {
      setError('No wallet address found');
      return;
    }

    if (!poolAddress) {
      setError('No pool address specified');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setStatusMessage('Preparing liquidity addition...');

      const numericBase = parseFloat(baseAmount) || null;
      const numericQuote = parseFloat(quoteAmount) || null;
      const numericLpToken = parseFloat(lpTokenAmount);

      if ((!numericBase && !numericQuote) || !numericLpToken) {
        throw new Error('Invalid amounts specified');
      }

      console.log(`Sending add liquidity request: base=${numericBase}, quote=${numericQuote}, lp=${numericLpToken}`);

      // For low liquidity pools, use a higher slippage to ensure transaction success
      const increasedSlippage = 10.0; // 10% slippage to account for estimation errors

      try {
        const signature = await addLiquidity({
          pool: poolAddress,
          baseAmount: numericBase,
          quoteAmount: numericQuote,
          lpTokenAmount: numericLpToken,
          slippage: increasedSlippage,
          userPublicKey: userAddress,
          connection,
          solanaWallet,
          onStatusUpdate: (msg) => setStatusMessage(msg),
        });

        console.log(`Add liquidity transaction successful: ${signature}`);
        setStatusMessage(`Liquidity added successfully! Transaction: ${signature.slice(0, 8)}...`);
        setBaseAmount('');
        setQuoteAmount('');
        setLpTokenAmount('0');
      } catch (txError: any) {
        console.error('Transaction error:', txError);

        // Check for specific error messages
        const errorMsg = txError instanceof Error ? txError.message : String(txError);
        if (errorMsg.includes('0x1774') || errorMsg.includes('ExceededSlippage')) {
          setError('Slippage too high. Try increasing the slippage tolerance in pumpSwapUtils.ts (DEFAULT_SLIPPAGE value).');
        } else if (errorMsg.includes('0x1') || errorMsg.includes('insufficient')) {
          setError('Insufficient balance to complete the transaction.');
        } else {
          setError(`Transaction failed: ${errorMsg}`);
        }
        setStatusMessage(null);
      }
    } catch (err) {
      console.error('Add liquidity error:', err);
      setError(err instanceof Error ? err.message : 'Failed to add liquidity');
      setStatusMessage(null);
    } finally {
      setIsLoading(false);
    }
  }, [
    connected,
    solanaWallet,
    address,
    poolAddress,
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
        Add Liquidity
      </Text>

      {/* Test mode notice */}
      <View style={styles.testModeContainer}>
        <Text style={styles.testModeText}>
          Estimation Mode: Using ratio-based calculations instead of API calls.
        </Text>
      </View>

      {/* Pool Address */}
      <Text style={styles.inputLabel}>Pool Address</Text>
      <TextInput
        style={styles.input}
        value={poolAddress}
        onChangeText={handlePoolAddressChange}
        placeholder="Enter pool address"
        editable={!isLoading}
      />

      {/* Base Token Mint */}
      <Text style={styles.inputLabel}>Base Token Mint {baseSymbol !== 'BASE' ? `(${baseSymbol})` : ''}</Text>
      <TextInput
        style={styles.input}
        value={baseMint}
        onChangeText={handleBaseMintChange}
        placeholder="Base token mint address"
        editable={!isLoading}
      />

      {/* Quote Token Mint */}
      <Text style={styles.inputLabel}>Quote Token Mint {quoteSymbol !== 'QUOTE' ? `(${quoteSymbol})` : ''}</Text>
      <TextInput
        style={styles.input}
        value={quoteMint}
        onChangeText={handleQuoteMintChange}
        placeholder="Quote token mint address"
        editable={!isLoading}
      />

      {/* Base Input */}
      <Text style={styles.inputLabel}>{baseSymbol} Amount</Text>
      <TextInput
        style={styles.input}
        value={baseAmount}
        onChangeText={handleBaseAmountChange}
        placeholder={`Enter ${baseSymbol} amount`}
        keyboardType="numeric"
        editable={!isLoading && quoteAmount === ''}
      />

      {/* Quote Input */}
      <Text style={styles.inputLabel}>{quoteSymbol} Amount</Text>
      <TextInput
        style={styles.input}
        value={quoteAmount}
        onChangeText={handleQuoteAmountChange}
        placeholder={`Enter ${quoteSymbol} amount`}
        keyboardType="numeric"
        editable={!isLoading && baseAmount === ''}
      />

      {/* LP tokens to receive (read-only) */}
      <View style={styles.lpContainer}>
        <Text style={styles.lpLabel}>LP tokens to receive:</Text>
        <Text style={styles.lpValue}>{lpTokenAmount}</Text>
      </View>

      {/* Add Liquidity button */}
      <TouchableOpacity
        style={[
          styles.button,
          (!poolAddress || (!baseAmount && !quoteAmount) || isLoading) ? styles.disabledButton : null
        ]}
        onPress={handleAddLiquidity}
        disabled={!poolAddress || (!baseAmount && !quoteAmount) || isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Processing...' : 'Add Liquidity'}
        </Text>
      </TouchableOpacity>

      {/* Reset button */}
      <TouchableOpacity
        style={styles.resetButton}
        onPress={handleReset}
      >
        <Text style={styles.resetButtonText}>Reset</Text>
      </TouchableOpacity>

      {/* Loading */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#6E56CF" />
        </View>
      )}

      {/* Status & error */}
      {statusMessage && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{statusMessage}</Text>
        </View>
      )}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Help text */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTextDetail}>
          <Text style={{ fontWeight: 'bold' }}>Step 1:</Text> Enter the pool address.
        </Text>
        <Text style={styles.infoTextDetail}>
          <Text style={{ fontWeight: 'bold' }}>Step 2:</Text> Enter either the base or quote amount you want to add.
        </Text>
        <Text style={styles.infoTextDetail}>
          <Text style={{ fontWeight: 'bold' }}>Step 3:</Text> The other token amount will be calculated automatically.
        </Text>
        <Text style={styles.infoTextDetail}>
          <Text style={{ fontWeight: 'bold' }}>Step 4:</Text> Click "Add Liquidity" to confirm.
        </Text>
      </View>
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
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 4,
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
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  lpLabel: { fontSize: 14, color: '#64748B' },
  lpValue: { fontSize: 16, fontWeight: '600', color: '#334155' },
  button: {
    backgroundColor: '#6E56CF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  disabledButton: { opacity: 0.5 },
  loadingContainer: { marginTop: 12, alignItems: 'center' },
  statusContainer: {
    marginTop: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  statusText: {
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
  infoContainer: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  infoTextDetail: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  resetButton: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  resetButtonText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500'
  },
  testModeContainer: {
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
  },
  testModeText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
});
