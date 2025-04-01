import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { Connection } from '@solana/web3.js';
import {
    getWithdrawalQuote,
    removeLiquidity
} from '../services/pumpSwapService';
import { DEFAULT_SLIPPAGE } from '../utils/pumpSwapUtils';
// Import our custom wallet hooks
import { useWallet } from '../../embeddedWalletProviders/hooks/useWallet';
import { StandardWallet } from '../../embeddedWalletProviders/types';

interface LiquidityRemoveSectionProps {
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

// Default tokens and pool
const DEFAULT_POOL = 'default_pool_address';
const DEFAULT_BASE_TOKEN = {
    symbol: 'SOL',
    decimals: 9,
};
const DEFAULT_QUOTE_TOKEN = {
    symbol: 'USDC',
    decimals: 6,
};

/**
 * A section for removing liquidity from PumpSwap pools
 * @component
 */
export function LiquidityRemoveSection({
    pool = DEFAULT_POOL,
    baseToken = DEFAULT_BASE_TOKEN,
    quoteToken = DEFAULT_QUOTE_TOKEN,
    connection,
    solanaWallet
}: LiquidityRemoveSectionProps) {
    // Use hook just for connected state and address
    const { publicKey, address, connected } = useWallet();

    const [lpTokenAmount, setLpTokenAmount] = useState<string>('');
    const [baseAmount, setBaseAmount] = useState<string>('');
    const [quoteAmount, setQuoteAmount] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    // Handle LP token amount change and get expected output
    const handleLpTokenAmountChange = useCallback(async (amount: string) => {
        if (!amount || !connected) return;

        try {
            setIsLoading(true);
            setError(null);
            setStatusMessage('Calculating expected tokens...');

            const numericAmount = parseFloat(amount);
            const withdrawalQuote = await getWithdrawalQuote(
                pool,
                numericAmount,
                DEFAULT_SLIPPAGE
            );

            setLpTokenAmount(amount);
            setBaseAmount(withdrawalQuote.base?.toString() || '0');
            setQuoteAmount(withdrawalQuote.quote?.toString() || '0');
            setStatusMessage(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to get withdrawal quote');
            setBaseAmount('');
            setQuoteAmount('');
        } finally {
            setIsLoading(false);
        }
    }, [pool, connected]);

    // Handle remove liquidity action
    const handleRemoveLiquidity = useCallback(async () => {
        if (!connected || !solanaWallet || !lpTokenAmount) return;

        try {
            setIsLoading(true);
            setError(null);

            const userAddress = address || publicKey?.toString() || '';
            if (!userAddress) {
                throw new Error('No wallet address found');
            }

            // Use updated removeLiquidity function with wallet integration
            await removeLiquidity({
                pool,
                lpTokenAmount: parseFloat(lpTokenAmount),
                slippage: DEFAULT_SLIPPAGE,
                userPublicKey: userAddress,
                connection,
                solanaWallet,
                onStatusUpdate: setStatusMessage
            });

            // Clear inputs after successful operation
            setLpTokenAmount('');
            setBaseAmount('');
            setQuoteAmount('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to remove liquidity');
            setStatusMessage(null);
        } finally {
            setIsLoading(false);
        }
    }, [pool, solanaWallet, address, publicKey, lpTokenAmount, connection, connected]);

    if (!connected) {
        return (
            <View style={styles.container}>
                <Text style={styles.connectMessage}>
                    Please connect your wallet to remove liquidity
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.input}
                value={lpTokenAmount}
                onChangeText={handleLpTokenAmountChange}
                placeholder="Enter LP token amount"
                keyboardType="numeric"
                editable={!isLoading}
            />

            <View style={styles.outputContainer}>
                <Text style={styles.outputLabel}>You'll receive:</Text>

                <View style={styles.tokenOutputRow}>
                    <Text style={styles.tokenLabel}>{baseToken.symbol}:</Text>
                    <Text style={styles.tokenAmount}>{baseAmount || '0'}</Text>
                </View>

                <View style={styles.tokenOutputRow}>
                    <Text style={styles.tokenLabel}>{quoteToken.symbol}:</Text>
                    <Text style={styles.tokenAmount}>{quoteAmount || '0'}</Text>
                </View>
            </View>

            <Text
                style={[
                    styles.removeButton,
                    (!lpTokenAmount || isLoading) && styles.disabledButton
                ]}
                onPress={handleRemoveLiquidity}
            >
                {isLoading ? 'Processing...' : 'Remove Liquidity'}
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
        marginBottom: 16,
    },
    outputContainer: {
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        padding: 16,
        marginVertical: 16,
    },
    outputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748B',
        marginBottom: 12,
    },
    tokenOutputRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 4,
    },
    tokenLabel: {
        fontSize: 16,
        color: '#334155',
        fontWeight: '500',
    },
    tokenAmount: {
        fontSize: 16,
        color: '#334155',
        fontWeight: '600',
    },
    removeButton: {
        backgroundColor: '#6E56CF',
        color: '#FFFFFF',
        padding: 16,
        borderRadius: 8,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 8,
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