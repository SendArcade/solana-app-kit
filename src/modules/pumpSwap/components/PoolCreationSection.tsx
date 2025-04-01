import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { Connection } from '@solana/web3.js';
import { createPool } from '../services/pumpSwapService';
import { useWallet } from '../../embeddedWalletProviders/hooks/useWallet';
import { StandardWallet } from '../../embeddedWalletProviders/types';

interface PoolCreationSectionProps {
    baseToken?: {
        symbol: string;
        decimals: number;
        mint: string;
    };
    quoteToken?: {
        symbol: string;
        decimals: number;
        mint: string;
    };
    index?: number;
    connection: Connection;
    solanaWallet: StandardWallet | any;
}

// Default tokens
const DEFAULT_BASE_TOKEN = {
    symbol: 'SOL',
    decimals: 9,
    mint: 'So11111111111111111111111111111111111111112', // SOL mint address
};
const DEFAULT_QUOTE_TOKEN = {
    symbol: 'USDC',
    decimals: 6,
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC mint address
};
const DEFAULT_INDEX = 1;

/**
 * A section for creating new PumpSwap pools
 * @component
 */
export function PoolCreationSection({
    baseToken = DEFAULT_BASE_TOKEN,
    quoteToken = DEFAULT_QUOTE_TOKEN,
    index = DEFAULT_INDEX,
    connection,
    solanaWallet
}: PoolCreationSectionProps) {
    // Use hook just for connected state and address
    const { publicKey, address, connected } = useWallet();

    const [baseAmount, setBaseAmount] = useState<string>('');
    const [quoteAmount, setQuoteAmount] = useState<string>('');
    const [initialPrice, setInitialPrice] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    // Calculate initial pool price when inputs change
    const calculateInitialPrice = useCallback(() => {
        if (!baseAmount || !quoteAmount || parseFloat(baseAmount) <= 0 || parseFloat(quoteAmount) <= 0) {
            setInitialPrice(null);
            return;
        }

        const baseValue = parseFloat(baseAmount);
        const quoteValue = parseFloat(quoteAmount);

        // Price = quote / base
        setInitialPrice(quoteValue / baseValue);
    }, [baseAmount, quoteAmount]);

    // Handle input changes
    const handleBaseAmountChange = useCallback((text: string) => {
        setBaseAmount(text);
        // Calculate price after a small delay to allow for proper input validation
        setTimeout(() => calculateInitialPrice(), 100);
    }, [calculateInitialPrice]);

    const handleQuoteAmountChange = useCallback((text: string) => {
        setQuoteAmount(text);
        // Calculate price after a small delay to allow for proper input validation
        setTimeout(() => calculateInitialPrice(), 100);
    }, [calculateInitialPrice]);

    // Handle pool creation
    const handleCreatePool = useCallback(async () => {
        if (!connected || !solanaWallet || !baseAmount || !quoteAmount) return;

        try {
            setIsLoading(true);
            setError(null);

            const userAddress = address || publicKey?.toString() || '';
            if (!userAddress) {
                throw new Error('No wallet address found');
            }

            // Parse amounts to ensure they're numbers
            const baseValue = parseFloat(baseAmount);
            const quoteValue = parseFloat(quoteAmount);

            if (isNaN(baseValue) || isNaN(quoteValue) || baseValue <= 0 || quoteValue <= 0) {
                throw new Error('Invalid token amounts');
            }

            // Use updated createPool function with wallet integration
            await createPool({
                index,
                baseMint: baseToken.mint,
                quoteMint: quoteToken.mint,
                baseAmount: baseValue,
                quoteAmount: quoteValue,
                userPublicKey: userAddress,
                connection,
                solanaWallet,
                onStatusUpdate: setStatusMessage
            });

            // Clear inputs after successful operation
            setBaseAmount('');
            setQuoteAmount('');
            setInitialPrice(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create pool');
            setStatusMessage(null);
        } finally {
            setIsLoading(false);
        }
    }, [solanaWallet, address, publicKey, baseAmount, quoteAmount, baseToken.mint, quoteToken.mint, index, connection, connected]);

    if (!connected) {
        return (
            <View style={styles.container}>
                <Text style={styles.connectMessage}>
                    Please connect your wallet to create a pool
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Create a new {baseToken.symbol}/{quoteToken.symbol} pool</Text>

            <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{baseToken.symbol} Amount</Text>
                <TextInput
                    style={styles.input}
                    value={baseAmount}
                    onChangeText={handleBaseAmountChange}
                    placeholder={`Enter ${baseToken.symbol} amount`}
                    keyboardType="numeric"
                    editable={!isLoading}
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{quoteToken.symbol} Amount</Text>
                <TextInput
                    style={styles.input}
                    value={quoteAmount}
                    onChangeText={handleQuoteAmountChange}
                    placeholder={`Enter ${quoteToken.symbol} amount`}
                    keyboardType="numeric"
                    editable={!isLoading}
                />
            </View>

            {initialPrice !== null && (
                <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>Initial Pool Price:</Text>
                    <Text style={styles.priceValue}>
                        1 {baseToken.symbol} = {initialPrice.toFixed(6)} {quoteToken.symbol}
                    </Text>
                </View>
            )}

            <Text
                style={[
                    styles.createButton,
                    (!baseAmount || !quoteAmount || isLoading) && styles.disabledButton
                ]}
                onPress={handleCreatePool}
            >
                {isLoading ? 'Processing...' : 'Create Pool'}
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
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 16,
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748B',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    priceContainer: {
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        padding: 16,
        marginVertical: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748B',
    },
    priceValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#334155',
    },
    createButton: {
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
        marginTop: 16,
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