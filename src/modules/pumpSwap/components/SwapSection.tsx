import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { Connection } from '@solana/web3.js';
import {
    getSwapQuoteFromBase,
    getSwapQuoteFromQuote,
    swapTokens,
    Direction
} from '../services/pumpSwapService';
import { DEFAULT_SLIPPAGE } from '../utils/pumpSwapUtils';
import { useWallet } from '../../embeddedWalletProviders/hooks/useWallet';
import { StandardWallet } from '../../embeddedWalletProviders/types';

interface SwapSectionProps {
    pool?: string;
    baseToken?: {
        symbol: string;
        decimals: number;
    };
    quoteToken?: {
        symbol: string;
        decimals: number;
    };
    connection: Connection;
    solanaWallet: StandardWallet | any;
}

// Default tokens
const DEFAULT_POOL = 'default_pool_address';
const DEFAULT_BASE_TOKEN = {
    symbol: 'SOL',
    decimals: 9,
};
const DEFAULT_QUOTE_TOKEN = {
    symbol: 'USDC',
    decimals: 6,
};

export function SwapSection({
    pool = DEFAULT_POOL,
    baseToken = DEFAULT_BASE_TOKEN,
    quoteToken = DEFAULT_QUOTE_TOKEN,
    connection,
    solanaWallet
}: SwapSectionProps) {
    // Use hook just for connected state and address
    const { publicKey, address, connected } = useWallet();

    const [direction, setDirection] = useState<Direction>(Direction.BaseToQuote);
    const [baseAmount, setBaseAmount] = useState<string>('');
    const [quoteAmount, setQuoteAmount] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const handleBaseAmountChange = useCallback(async (amount: string) => {
        if (!amount || !connected) return;

        try {
            setIsLoading(true);
            setError(null);
            setStatusMessage('Getting quote...');

            const numericAmount = parseFloat(amount);
            const quoteAmount = await getSwapQuoteFromBase(
                pool,
                numericAmount,
                DEFAULT_SLIPPAGE
            );

            setBaseAmount(amount);
            setQuoteAmount(quoteAmount.toString());
            setStatusMessage(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to get quote');
        } finally {
            setIsLoading(false);
        }
    }, [pool, connected]);

    const handleQuoteAmountChange = useCallback(async (amount: string) => {
        if (!amount || !connected) return;

        try {
            setIsLoading(true);
            setError(null);
            setStatusMessage('Getting quote...');

            const numericAmount = parseFloat(amount);
            const baseAmount = await getSwapQuoteFromQuote(
                pool,
                numericAmount,
                DEFAULT_SLIPPAGE
            );

            setQuoteAmount(amount);
            setBaseAmount(baseAmount.toString());
            setStatusMessage(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to get quote');
        } finally {
            setIsLoading(false);
        }
    }, [pool, connected]);

    const handleSwap = useCallback(async () => {
        if (!connected || !solanaWallet || !baseAmount) return;

        try {
            setIsLoading(true);
            setError(null);

            const userAddress = address || publicKey?.toString() || '';
            if (!userAddress) {
                throw new Error('No wallet address found');
            }

            // Use updated swapTokens function with wallet integration
            await swapTokens({
                pool,
                amount: parseFloat(baseAmount),
                direction,
                slippage: DEFAULT_SLIPPAGE,
                userPublicKey: userAddress,
                connection,
                solanaWallet,
                onStatusUpdate: setStatusMessage
            });

            // Clear inputs after successful swap
            setBaseAmount('');
            setQuoteAmount('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to perform swap');
            setStatusMessage(null);
        } finally {
            setIsLoading(false);
        }
    }, [pool, baseAmount, direction, solanaWallet, address, publicKey, connection, connected]);

    const toggleDirection = useCallback(() => {
        setDirection(prev =>
            prev === Direction.BaseToQuote
                ? Direction.QuoteToBase
                : Direction.BaseToQuote
        );
        setBaseAmount('');
        setQuoteAmount('');
        setStatusMessage(null);
    }, []);

    if (!connected) {
        return (
            <View style={styles.container}>
                <Text style={styles.connectMessage}>
                    Please connect your wallet to use Swap
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.input}
                value={baseAmount}
                onChangeText={handleBaseAmountChange}
                placeholder={`Enter ${baseToken.symbol} amount`}
                keyboardType="numeric"
                editable={!isLoading}
            />

            <Text
                style={styles.directionButton}
                onPress={toggleDirection}
            >
                {direction === Direction.BaseToQuote ? '↓' : '↑'}
            </Text>

            <TextInput
                style={styles.input}
                value={quoteAmount}
                onChangeText={handleQuoteAmountChange}
                placeholder={`Enter ${quoteToken.symbol} amount`}
                keyboardType="numeric"
                editable={!isLoading}
            />

            <Text
                style={[
                    styles.swapButton,
                    (!baseAmount || !quoteAmount || isLoading) && styles.disabledButton
                ]}
                onPress={handleSwap}
            >
                {isLoading ? 'Processing...' : 'Swap'}
            </Text>

            {isLoading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#6E56CF" />
                    {statusMessage && (
                        <Text style={styles.statusText}>{statusMessage}</Text>
                    )}
                </View>
            )}

            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 8,
    },
    directionButton: {
        fontSize: 24,
        textAlign: 'center',
        marginVertical: 8,
        color: '#6E56CF',
    },
    swapButton: {
        backgroundColor: '#6E56CF',
        color: '#FFFFFF',
        padding: 16,
        borderRadius: 8,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 16,
    },
    disabledButton: {
        backgroundColor: '#CBD5E1',
    },
    errorContainer: {
        marginTop: 8,
        padding: 8,
        backgroundColor: '#ffebee',
        borderRadius: 4,
    },
    errorText: {
        color: '#c62828',
        fontSize: 14,
    },
    loadingContainer: {
        marginTop: 16,
        alignItems: 'center',
    },
    statusText: {
        marginTop: 8,
        fontSize: 14,
        color: '#64748B',
    },
    connectMessage: {
        textAlign: 'center',
        fontSize: 16,
        color: '#64748B',
        marginVertical: 20,
    },
}); 