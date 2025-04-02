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
    getSwapQuoteFromBase,
    getSwapQuoteFromQuote,
    swapTokens,
    Direction,
} from '../services/pumpSwapService'; // <--- These are your server-calling helpers
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

interface SwapSectionProps {
    connection: Connection;
    // The wallet object you use in your app (returned from useWallet, or whichever you prefer)
    solanaWallet: any;
}

/**
 * SwapSection allows a user to swap from Base -> Quote or Quote -> Base
 */
export function SwapSection({
    connection,
    solanaWallet,
}: SwapSectionProps) {
    // Pull out info from your custom wallet hook
    const { address, connected } = useWallet();

    // UI states
    const [direction, setDirection] = useState<Direction>(Direction.BaseToQuote);
    const [poolAddress, setPoolAddress] = useState('');
    const [baseMint, setBaseMint] = useState(SOL_MINT);
    const [quoteMint, setQuoteMint] = useState(USDC_MINT);
    const [baseAmount, setBaseAmount] = useState('');
    const [quoteAmount, setQuoteAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    // Get token symbols for display
    const baseSymbol = KNOWN_TOKENS[baseMint]?.symbol || 'BASE';
    const quoteSymbol = KNOWN_TOKENS[quoteMint]?.symbol || 'QUOTE';

    // Fetch quote if user changes the base amount
    const handleBaseAmountChange = useCallback((amount: string) => {
        setBaseAmount(amount);

        // Only try to get quote if there's a valid pool address and amount
        if (!amount || !poolAddress || !connected) {
            setQuoteAmount('');
            return;
        }

        const fetchQuote = async () => {
            try {
                setIsLoading(true);
                setError(null);
                setStatusMessage('Getting quote...');

                const numeric = parseFloat(amount);
                const result = await getSwapQuoteFromBase(
                    poolAddress,
                    numeric,
                    DEFAULT_SLIPPAGE
                );

                setQuoteAmount(result.toString());
                setStatusMessage(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to get quote');
                setQuoteAmount('');
            } finally {
                setIsLoading(false);
            }
        };

        // Use setTimeout to avoid too many API calls when typing fast
        const timeoutId = setTimeout(fetchQuote, 500);
        return () => clearTimeout(timeoutId);
    }, [poolAddress, connected]);

    // Fetch quote if user changes the quote amount
    const handleQuoteAmountChange = useCallback((amount: string) => {
        setQuoteAmount(amount);

        // Only try to get quote if there's a valid pool address and amount
        if (!amount || !poolAddress || !connected) {
            setBaseAmount('');
            return;
        }

        const fetchQuote = async () => {
            try {
                setIsLoading(true);
                setError(null);
                setStatusMessage('Getting quote...');

                const numeric = parseFloat(amount);
                const result = await getSwapQuoteFromQuote(
                    poolAddress,
                    numeric,
                    DEFAULT_SLIPPAGE
                );

                setBaseAmount(result.toString());
                setStatusMessage(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to get quote');
                setBaseAmount('');
            } finally {
                setIsLoading(false);
            }
        };

        // Use setTimeout to avoid too many API calls when typing fast
        const timeoutId = setTimeout(fetchQuote, 500);
        return () => clearTimeout(timeoutId);
    }, [poolAddress, connected]);

    // Handle mint changes
    const handleBaseMintChange = useCallback((mint: string) => {
        setBaseMint(mint);
        setBaseAmount('');
        setQuoteAmount('');
        setError(null);
    }, []);

    const handleQuoteMintChange = useCallback((mint: string) => {
        setQuoteMint(mint);
        setBaseAmount('');
        setQuoteAmount('');
        setError(null);
    }, []);

    const handlePoolAddressChange = useCallback((address: string) => {
        setPoolAddress(address);
        setBaseAmount('');
        setQuoteAmount('');
        setError(null);
    }, []);

    // Toggle direction (Base->Quote or Quote->Base)
    const toggleDirection = useCallback(() => {
        setDirection((prev) =>
            prev === Direction.BaseToQuote ? Direction.QuoteToBase : Direction.BaseToQuote
        );
        // Clear amounts whenever direction changes
        setBaseAmount('');
        setQuoteAmount('');
        setStatusMessage(null);
        setError(null);
    }, []);

    // Perform the swap transaction
    const handleSwap = useCallback(async () => {
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
            setStatusMessage('Building swap transaction...');

            // Amount is based on the direction
            const numericAmount = parseFloat(
                direction === Direction.BaseToQuote ? baseAmount : quoteAmount
            );

            if (isNaN(numericAmount) || numericAmount <= 0) {
                throw new Error('Invalid amount specified');
            }

            // Use direction value directly
            const directionValue = direction;

            // Request server to build & return base64 transaction
            const signature = await swapTokens({
                pool: poolAddress,
                amount: numericAmount,
                direction: directionValue,
                slippage: DEFAULT_SLIPPAGE,
                userPublicKey: userAddress,
                connection,
                solanaWallet,
                onStatusUpdate: (msg) => setStatusMessage(msg),
            });

            setStatusMessage(`Swap successful! Tx: ${signature.slice(0, 8)}...${signature.slice(-8)}`);

            // Reset amounts after successful swap
            setBaseAmount('');
            setQuoteAmount('');
        } catch (err) {
            console.error('Swap error:', err);
            setError(err instanceof Error ? err.message : 'Swap failed');
            setStatusMessage(null);
        } finally {
            setIsLoading(false);
        }
    }, [
        address,
        connected,
        solanaWallet,
        baseAmount,
        quoteAmount,
        direction,
        connection,
        poolAddress
    ]);

    if (!connected) {
        return (
            <View style={styles.container}>
                <Text style={styles.infoText}>
                    Please connect your wallet to perform swaps
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>
                {direction === Direction.BaseToQuote
                    ? `Swap ${baseSymbol} → ${quoteSymbol}`
                    : `Swap ${quoteSymbol} → ${baseSymbol}`
                }
            </Text>

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

            {/* Input for "base" token */}
            <Text style={styles.inputLabel}>Input {baseSymbol} Amount</Text>
            <TextInput
                style={styles.input}
                value={baseAmount}
                onChangeText={handleBaseAmountChange}
                placeholder={`Enter ${baseSymbol} amount`}
                keyboardType="numeric"
                editable={!isLoading && direction === Direction.BaseToQuote}
            />

            {/* Toggle direction button */}
            <TouchableOpacity onPress={toggleDirection} style={styles.toggleButton}>
                <Text style={styles.toggleButtonText}>⇅</Text>
            </TouchableOpacity>

            {/* Input for "quote" token */}
            <Text style={styles.inputLabel}>Input {quoteSymbol} Amount</Text>
            <TextInput
                style={styles.input}
                value={quoteAmount}
                onChangeText={handleQuoteAmountChange}
                placeholder={`Enter ${quoteSymbol} amount`}
                keyboardType="numeric"
                editable={!isLoading && direction === Direction.QuoteToBase}
            />

            {/* Swap button */}
            <TouchableOpacity
                style={[
                    styles.swapButton,
                    (!poolAddress || (!baseAmount && !quoteAmount) || isLoading) ? styles.disabledButton : null
                ]}
                onPress={handleSwap}
                disabled={!poolAddress || (!baseAmount && !quoteAmount) || isLoading}
            >
                <Text style={styles.swapButtonText}>
                    {isLoading ? 'Processing...' : 'Swap'}
                </Text>
            </TouchableOpacity>

            {/* Loading indicator */}
            {isLoading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#6E56CF" />
                </View>
            )}

            {/* Status and error messages */}
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
                    <Text style={{ fontWeight: 'bold' }}>Step 1:</Text> Enter the pool address first. This should be the address of an existing liquidity pool.
                </Text>
                <Text style={styles.infoTextDetail}>
                    <Text style={{ fontWeight: 'bold' }}>Step 2:</Text> Enter the base and quote token mint addresses (if different from default).
                </Text>
                <Text style={styles.infoTextDetail}>
                    <Text style={{ fontWeight: 'bold' }}>Step 3:</Text> Enter amount to swap and click Swap button.
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16 },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
        color: '#1E293B',
    },
    infoText: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
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
    toggleButton: {
        alignSelf: 'center',
        marginVertical: 8,
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
        padding: 8,
    },
    toggleButtonText: {
        fontSize: 18,
        color: '#6E56CF',
    },
    swapButton: {
        backgroundColor: '#6E56CF',
        borderRadius: 8,
        padding: 16,
        marginTop: 8,
        alignItems: 'center',
    },
    swapButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    disabledButton: {
        opacity: 0.5,
    },
    loadingContainer: {
        marginTop: 12,
        alignItems: 'center',
    },
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
});
