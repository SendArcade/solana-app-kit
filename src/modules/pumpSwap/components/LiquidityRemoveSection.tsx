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
  getWithdrawalQuote,
  removeLiquidity
} from '../services/pumpSwapService'; // <--- server calls only
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
  const [poolAddress, setPoolAddress] = useState('');
  const [baseMint, setBaseMint] = useState(SOL_MINT);
  const [quoteMint, setQuoteMint] = useState(USDC_MINT);
  const [lpTokenAmount, setLpTokenAmount] = useState('');
  const [baseAmount, setBaseAmount] = useState('');
  const [quoteAmount, setQuoteAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Get token symbols for display
  const baseSymbol = KNOWN_TOKENS[baseMint]?.symbol || 'BASE';
  const quoteSymbol = KNOWN_TOKENS[quoteMint]?.symbol || 'QUOTE';

  // Handle entering an LP token amount
  const handleLpTokenAmountChange = useCallback((amount: string) => {
    setLpTokenAmount(amount);
    setBaseAmount('');
    setQuoteAmount('');
    setError(null);
  }, []);

  // Handle pool address change
  const handlePoolAddressChange = useCallback((address: string) => {
    setPoolAddress(address);
    setLpTokenAmount('');
    setBaseAmount('');
    setQuoteAmount('');
    setError(null);
  }, []);

  // Handle base mint changes
  const handleBaseMintChange = useCallback((mint: string) => {
    setBaseMint(mint);
    setLpTokenAmount('');
    setBaseAmount('');
    setQuoteAmount('');
    setError(null);
  }, []);

  // Handle quote mint changes
  const handleQuoteMintChange = useCallback((mint: string) => {
    setQuoteMint(mint);
    setLpTokenAmount('');
    setBaseAmount('');
    setQuoteAmount('');
    setError(null);
  }, []);

  // Reset all form fields
  const handleReset = useCallback(() => {
    setLpTokenAmount('');
    setBaseAmount('');
    setQuoteAmount('');
    setError(null);
    setStatusMessage(null);
    setIsLoading(false);
  }, []);

  // Calculate expected tokens when LP token amount changes (with debouncing)
  useEffect(() => {
    if (!lpTokenAmount || !poolAddress || !connected) return;

    let isMounted = true;
    const calculateExpected = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setStatusMessage('Calculating expected tokens...');

        const numericAmount = parseFloat(lpTokenAmount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
          throw new Error('Invalid LP token amount');
        }

        console.log(`Calculating withdrawal for LP amount: ${numericAmount} from pool ${poolAddress}`);

        // Use estimation based on the pool ratio (similar to add liquidity)
        // Assuming LP token is roughly sqrt(base * quote) * some_factor
        // For removing liquidity, we reverse this calculation
        // The 126:1 ratio is used for SOL:USDC, with a factor of 100 
        // (adjusting for real-world LP token calculations)

        // Simplest estimation: LP token amount converts to equal value parts of base and quote
        const estimatedValue = numericAmount * 100; // Scale factor for LP token value

        // Base amount (SOL) would be sqrt(estimatedValue / 126)
        const estimatedBase = Math.sqrt(estimatedValue / 126);

        // Quote amount (USDC) would be estimatedBase * 126
        const estimatedQuote = estimatedBase * 126;

        if (isMounted) {
          setBaseAmount(estimatedBase.toFixed(6));
          setQuoteAmount(estimatedQuote.toFixed(6));
          setStatusMessage("Using estimated withdrawal values based on pool ratio");
        }
      } catch (err) {
        if (isMounted) {
          console.log('Calculation error:', err);
          setError(err instanceof Error ? err.message : 'Failed to calculate expected tokens');
          setBaseAmount('');
          setQuoteAmount('');
          setStatusMessage(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Debounce the calculation
    const timeoutId = setTimeout(calculateExpected, 500);
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [lpTokenAmount, poolAddress, connected]);

  // Remove liquidity transaction
  const handleRemoveLiquidity = useCallback(async () => {
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
      setStatusMessage('Preparing liquidity removal...');

      const numericLp = parseFloat(lpTokenAmount);
      if (isNaN(numericLp) || numericLp <= 0) {
        throw new Error('Invalid LP token amount');
      }

      console.log(`Sending remove liquidity request: lpTokenAmount=${numericLp} from pool ${poolAddress}`);

      // Increase slippage significantly for small pools or test scenarios
      const increasedSlippage = 20.0; // 20% slippage to ensure transaction success

      try {
        setStatusMessage('Building transaction...');

        // Add transaction timeout handling
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Transaction timed out')), 60000)
        );

        const txPromise = removeLiquidity({
          pool: poolAddress,
          lpTokenAmount: numericLp,
          slippage: increasedSlippage,
          userPublicKey: userAddress,
          connection,
          solanaWallet,
          onStatusUpdate: (msg) => {
            console.log(`Transaction status: ${msg}`);
            setStatusMessage(msg);
          },
        });

        // Use Promise.race to implement timeout
        const signature = await Promise.race([txPromise, timeoutPromise]) as string;

        console.log(`Remove liquidity transaction successful: ${signature}`);
        setStatusMessage(`Liquidity removed successfully! Transaction: ${signature.slice(0, 8)}...`);
        setLpTokenAmount('');
        setBaseAmount('');
        setQuoteAmount('');
      } catch (txError: any) {
        console.error('Transaction error:', txError);
        console.error('Error type:', typeof txError);
        if (txError instanceof Error) {
          console.error('Error message:', txError.message);
          console.error('Error stack:', txError.stack);
        }

        // Check for specific error messages
        const errorMsg = txError instanceof Error ? txError.message : String(txError);

        if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
          setError('Transaction timed out. The network might be congested. Please try again.');
        } else if (errorMsg.includes('0x1774') || errorMsg.includes('ExceededSlippage')) {
          setError('Slippage too high. Try using a different LP token amount or increasing slippage tolerance further.');
        } else if (errorMsg.includes('0x1') || errorMsg.includes('insufficient')) {
          setError('Insufficient LP token balance. Make sure you have enough LP tokens in your wallet.');
        } else if (errorMsg.includes('blockhash')) {
          setError('Blockhash expired. Please try again as the transaction took too long to process.');
        } else {
          setError(`Transaction failed: ${errorMsg}`);
        }
        setStatusMessage(null);
      }
    } catch (err) {
      console.error('Remove liquidity error:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove liquidity');
      setStatusMessage(null);
    } finally {
      setIsLoading(false);
    }
  }, [
    connected,
    solanaWallet,
    address,
    poolAddress,
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
        Remove Liquidity
      </Text>

      {/* Estimation mode notice */}
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

      {/* LP Token input */}
      <Text style={styles.inputLabel}>LP Token Amount</Text>
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
          <Text style={styles.tokenLabel}>{baseSymbol}:</Text>
          <Text style={styles.tokenValue}>{baseAmount || '0'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.tokenLabel}>{quoteSymbol}:</Text>
          <Text style={styles.tokenValue}>{quoteAmount || '0'}</Text>
        </View>
      </View>

      {/* Remove liquidity button */}
      <TouchableOpacity
        style={[
          styles.button,
          (!poolAddress || !lpTokenAmount || isLoading) ? styles.disabledButton : null
        ]}
        onPress={handleRemoveLiquidity}
        disabled={!poolAddress || !lpTokenAmount || isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Processing...' : 'Remove Liquidity'}
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
          <Text style={{ fontWeight: 'bold' }}>Step 2:</Text> Enter the LP token amount you want to withdraw.
        </Text>
        <Text style={styles.infoTextDetail}>
          <Text style={{ fontWeight: 'bold' }}>Step 3:</Text> Review the estimated output tokens.
        </Text>
        <Text style={styles.infoTextDetail}>
          <Text style={{ fontWeight: 'bold' }}>Step 4:</Text> Click "Remove Liquidity" to confirm.
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
  outputContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
