import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { Connection } from '@solana/web3.js';
import {
    getDepositQuoteFromBase,
    getDepositQuoteFromQuote,
    addLiquidity
} from '../services/pumpSwapService';
import { DEFAULT_SLIPPAGE } from '../utils/pumpSwapUtils';
import { useWallet } from '../../embeddedWalletProviders/hooks/useWallet';
import { StandardWallet } from '../../embeddedWalletProviders/types';

interface LiquidityAddSectionProps {
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

export function LiquidityAddSection({
    pool = DEFAULT_POOL,
    baseToken = DEFAULT_BASE_TOKEN,
    quoteToken = DEFAULT_QUOTE_TOKEN,
    connection,
    solanaWallet
}: LiquidityAddSectionProps) {
    // Use hook just for connected state and address
    const { publicKey, address, connected } = useWallet();

    const [baseAmount, setBaseAmount] = useState<string>('');
    const [quoteAmount, setQuoteAmount] = useState<string>('');
    const [lpTokenAmount, setLpTokenAmount] = useState<string>('0');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const handleBaseAmountChange = useCallback(async (amount: string) => {
        if (!amount || !connected) return;

        try {
            setIsLoading(true);
            setError(null);
            setStatusMessage('Calculating quote...');

            const numericAmount = parseFloat(amount);
            const quoteResponse = await getDepositQuoteFromBase(
                pool,
                numericAmount,
                DEFAULT_SLIPPAGE
            );

            setBaseAmount(amount);
            setQuoteAmount(quoteResponse.quote?.toString() || '0');
            setLpTokenAmount(quoteResponse.lpToken?.toString() || '0');
            setStatusMessage(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to get deposit quote');
        } finally {
            setIsLoading(false);
        }
    }, [pool, connected]);

    const handleQuoteAmountChange = useCallback(async (amount: string) => {
        if (!amount || !connected) return;

        try {
            setIsLoading(true);
            setError(null);
            setStatusMessage('Calculating quote...');

            const numericAmount = parseFloat(amount);
            const baseResponse = await getDepositQuoteFromQuote(
                pool,
                numericAmount,
                DEFAULT_SLIPPAGE
            );

            setQuoteAmount(amount);
            setBaseAmount(baseResponse.base?.toString() || '0');
            setLpTokenAmount(baseResponse.lpToken?.toString() || '0');
            setStatusMessage(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to get deposit quote');
        } finally {
            setIsLoading(false);
        }
    }, [pool, connected]);

    const handleAddLiquidity = useCallback(async () => {
        if (!connected || !solanaWallet || !baseAmount || !quoteAmount) return;

        try {
            setIsLoading(true);
            setError(null);

            const userAddress = address || publicKey?.toString() || '';
            if (!userAddress) {
                throw new Error('No wallet address found');
            }

            // Use updated addLiquidity function with wallet integration
            await addLiquidity({
                pool,
                baseAmount: parseFloat(baseAmount),
                quoteAmount: parseFloat(quoteAmount),
                slippage: DEFAULT_SLIPPAGE,
                userPublicKey: userAddress,
                connection,
                solanaWallet,
                onStatusUpdate: setStatusMessage
            });

            // Clear inputs after successful operation
            setBaseAmount('');
            setQuoteAmount('');
            setLpTokenAmount('0');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add liquidity');
            setStatusMessage(null);
        } finally {
            setIsLoading(false);
        }
    }, [pool, solanaWallet, address, publicKey, baseAmount, quoteAmount, connection, connected]);

    if (!connected) {
        return (
            <View style={styles.container}>
                <Text style={styles.connectMessage}>
                    Please connect your wallet to add liquidity
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

            <TextInput
                style={styles.input}
                value={quoteAmount}
                onChangeText={handleQuoteAmountChange}
                placeholder={`Enter ${quoteToken.symbol} amount`}
                keyboardType="numeric"
                editable={!isLoading}
            />

            <View style={styles.lpTokenContainer}>
                <Text style={styles.lpTokenLabel}>LP tokens to receive:</Text>
                <Text style={styles.lpTokenValue}>{lpTokenAmount}</Text>
            </View>

            <Text
                style={[
                    styles.actionButton,
                    (!baseAmount || !quoteAmount || isLoading) && styles.disabledButton
                ]}
                onPress={handleAddLiquidity}
            >
                {isLoading ? 'Processing...' : 'Add Liquidity'}
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
    lpTokenContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 16,
        paddingHorizontal: 8,
    },
    lpTokenLabel: {
        fontSize: 14,
        color: '#64748B',
    },
    lpTokenValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#334155',
    },
    actionButton: {
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