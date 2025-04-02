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


// Replace this with an actual pool address
const DEFAULT_POOL = '11111111111111111111111111111111';

// Example tokens: You can change these to match your real base/quote tokens
const DEFAULT_BASE_TOKEN = { symbol: 'SOL', decimals: 9 };
const DEFAULT_QUOTE_TOKEN = { symbol: 'USDC', decimals: 6 };

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
    const [baseAmount, setBaseAmount] = useState('');
    const [quoteAmount, setQuoteAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    // Fetch quote if user changes the base amount
    const handleBaseAmountChange = useCallback(async (amount: string) => {
        if (!amount || !connected) {
            setBaseAmount(amount);
            setQuoteAmount('');
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            setStatusMessage('Getting quote...');

            const numeric = parseFloat(amount);
            const result = await getSwapQuoteFromBase(
                DEFAULT_POOL,
                numeric,
                DEFAULT_SLIPPAGE
            );

            setBaseAmount(amount);
            setQuoteAmount(result.toString());
            setStatusMessage(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to get quote');
        } finally {
            setIsLoading(false);
        }
    }, [connected]);

    // Fetch quote if user changes the quote amount
    const handleQuoteAmountChange = useCallback(async (amount: string) => {
        if (!amount || !connected) {
            setQuoteAmount(amount);
            setBaseAmount('');
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            setStatusMessage('Getting quote...');

            const numeric = parseFloat(amount);
            const result = await getSwapQuoteFromQuote(
                DEFAULT_POOL,
                numeric,
                DEFAULT_SLIPPAGE
            );

            setQuoteAmount(amount);
            setBaseAmount(result.toString());
            setStatusMessage(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to get quote');
        } finally {
            setIsLoading(false);
        }
    }, [connected]);

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

        try {
            setIsLoading(true);
            setError(null);
            setStatusMessage('Building swap transaction...');

            // Amount is whichever side the user typed into. E.g. if direction=BaseToQuote, we rely on baseAmount
            const numericAmount = parseFloat(
                direction === Direction.BaseToQuote ? baseAmount : quoteAmount
            );
            if (isNaN(numericAmount) || numericAmount <= 0) {
                throw new Error('Invalid amount specified');
            }

            // Convert local Direction enum to a numeric value expected by the SDK
            const directionValue = direction === Direction.BaseToQuote ? 1 : 0;

            // Request server to build & return base64 transaction
            const signature = await swapTokens({
                pool: DEFAULT_POOL,
                amount: numericAmount,
                direction: directionValue as any, // Type cast to any to avoid type mismatch
                slippage: DEFAULT_SLIPPAGE,
                userPublicKey: userAddress,
                connection,
                solanaWallet,
                onStatusUpdate: (msg) => setStatusMessage(msg),
            });

            setStatusMessage(`Swap successful! Tx Signature: ${signature}`);
        } catch (err) {
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
        connection
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
                    ? `Swap ${DEFAULT_BASE_TOKEN.symbol} → ${DEFAULT_QUOTE_TOKEN.symbol}`
                    : `Swap ${DEFAULT_QUOTE_TOKEN.symbol} → ${DEFAULT_BASE_TOKEN.symbol}`
                }
            </Text>

            {/* Input for "base" token */}
            <TextInput
                style={styles.input}
                value={baseAmount}
                onChangeText={handleBaseAmountChange}
                placeholder={`Enter ${DEFAULT_BASE_TOKEN.symbol} amount`}
                keyboardType="numeric"
                editable={!isLoading && direction === Direction.BaseToQuote}
            />

            {/* Toggle direction button */}
            <TouchableOpacity onPress={toggleDirection} style={styles.toggleButton}>
                <Text style={styles.toggleButtonText}>⇅</Text>
            </TouchableOpacity>

            {/* Input for "quote" token */}
            <TextInput
                style={styles.input}
                value={quoteAmount}
                onChangeText={handleQuoteAmountChange}
                placeholder={`Enter ${DEFAULT_QUOTE_TOKEN.symbol} amount`}
                keyboardType="numeric"
                editable={!isLoading && direction === Direction.QuoteToBase}
            />

            {/* Swap button */}
            <TouchableOpacity
                style={[
                    styles.swapButton,
                    (!baseAmount && !quoteAmount) || isLoading ? styles.disabledButton : null
                ]}
                onPress={handleSwap}
                disabled={(!baseAmount && !quoteAmount) || isLoading}
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
