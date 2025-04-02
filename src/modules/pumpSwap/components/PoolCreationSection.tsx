import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    ActivityIndicator,
    TouchableOpacity,
    Alert
} from 'react-native';
import { useWallet } from '../../embeddedWalletProviders/hooks/useWallet';
import { Connection, PublicKey } from '@solana/web3.js';
import { createPool } from '../services/pumpSwapService'; // <--- calls the server only


// Default index for pool creation
const DEFAULT_INDEX = 1; // Index used by the server/SDK

// Token address examples as placeholders
const SOL_MINT = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

// Token metadata for common tokens
const KNOWN_TOKENS: Record<string, { symbol: string, name: string }> = {
    [SOL_MINT]: { symbol: 'SOL', name: 'Solana' },
    [USDC_MINT]: { symbol: 'USDC', name: 'USD Coin' },
    'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': { symbol: 'mSOL', name: 'Marinade Staked SOL' },
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { symbol: 'USDT', name: 'USDT' },
    'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': { symbol: 'BONK', name: 'Bonk' },
};

interface PoolCreationSectionProps {
    connection: Connection;
    solanaWallet: any;
}

/**
 * PoolCreationSection allows a user to create a brand new pool
 */
export function PoolCreationSection({
    connection,
    solanaWallet,
}: PoolCreationSectionProps) {
    const { address, connected } = useWallet();

    // UI States
    const [baseMint, setBaseMint] = useState(SOL_MINT);
    const [quoteMint, setQuoteMint] = useState(USDC_MINT);
    const [baseAmount, setBaseAmount] = useState('');
    const [quoteAmount, setQuoteAmount] = useState('');
    const [initialPrice, setInitialPrice] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    // Get token symbols for display
    const baseSymbol = KNOWN_TOKENS[baseMint]?.symbol || 'BASE';
    const quoteSymbol = KNOWN_TOKENS[quoteMint]?.symbol || 'QUOTE';

    // Recalculate initial pool price whenever amounts change
    const recalcPrice = useCallback((baseVal: string, quoteVal: string) => {
        const b = parseFloat(baseVal) || 0;
        const q = parseFloat(quoteVal) || 0;

        if (b > 0 && q > 0) {
            setInitialPrice(q / b);
        } else {
            setInitialPrice(null);
        }
    }, []);

    const handleBaseAmountChange = useCallback((val: string) => {
        setBaseAmount(val);
        recalcPrice(val, quoteAmount);
    }, [quoteAmount, recalcPrice]);

    const handleQuoteAmountChange = useCallback((val: string) => {
        setQuoteAmount(val);
        recalcPrice(baseAmount, val);
    }, [baseAmount, recalcPrice]);

    const handleBaseMintChange = useCallback((val: string) => {
        setBaseMint(val);
        // Reset the error when changing addresses
        setError(null);
    }, []);

    const handleQuoteMintChange = useCallback((val: string) => {
        setQuoteMint(val);
        // Reset the error when changing addresses
        setError(null);
    }, []);

    // Validate Solana public key format (simple check)
    const isValidPublicKey = useCallback((key: string): boolean => {
        return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(key);
    }, []);

    // Check if base/quote are the same token
    useEffect(() => {
        if (baseMint && quoteMint && baseMint === quoteMint) {
            setError('Base and quote tokens cannot be the same');
        } else if (error === 'Base and quote tokens cannot be the same') {
            setError(null);
        }
    }, [baseMint, quoteMint, error]);

    // Perform create pool transaction
    const handleCreatePool = useCallback(async () => {
        if (!connected || !solanaWallet) return;

        const userAddress = address || '';
        if (!userAddress) {
            setError('No wallet address found');
            return;
        }

        // Validate inputs
        if (!isValidPublicKey(baseMint)) {
            setError('Invalid base token mint address');
            return;
        }

        if (!isValidPublicKey(quoteMint)) {
            setError('Invalid quote token mint address');
            return;
        }

        if (baseMint === quoteMint) {
            setError('Base and quote tokens cannot be the same');
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            // Parse values as floating point with sufficient precision
            const b = parseFloat(baseAmount);
            const q = parseFloat(quoteAmount);
            if (isNaN(b) || isNaN(q) || b <= 0 || q <= 0) {
                throw new Error('Invalid token amounts');
            }

            // Define minimum amount thresholds
            const minBaseAmount = baseMint === SOL_MINT ? 0.01 : 0.01; // Increased SOL minimum back to 0.01
            const minQuoteAmount = quoteMint === SOL_MINT ? 0.01 : 0.01; // Increased SOL minimum back to 0.01

            // Calculate final amounts, ensuring minimums
            const finalBaseAmount = Math.max(Number(b.toFixed(9)), minBaseAmount);
            const finalQuoteAmount = Math.max(Number(q.toFixed(9)), minQuoteAmount);

            // Calculate price for display
            const displayPrice = (finalQuoteAmount / finalBaseAmount).toFixed(6);

            // Check if the user likely has enough SOL balance
            let warningMessage = '';
            try {
                const solBalance = await connection.getBalance(new PublicKey(userAddress));
                const solBalanceInSol = solBalance / 1_000_000_000;

                // Creating a pool requires at least ~0.03 SOL for account rent
                if (solBalanceInSol < 0.03) {
                    warningMessage = `\n\nWARNING: Your wallet has only ${solBalanceInSol.toFixed(6)} SOL, which may not be enough to cover the network fees required to create a pool. The transaction might fail.`;
                }
            } catch (balanceError) {
                console.log('Could not check SOL balance:', balanceError);
            }

            // Confirm with user before proceeding
            Alert.alert(
                'Create Pool',
                `You are about to create a new pool with:\n\n` +
                `${finalBaseAmount} ${baseSymbol} and ${finalQuoteAmount} ${quoteSymbol}\n\n` +
                `Initial price: 1 ${baseSymbol} = ${displayPrice} ${quoteSymbol}` +
                warningMessage +
                `\n\nContinue?`,
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: () => {
                            setIsLoading(false);
                        }
                    },
                    {
                        text: 'Create Pool',
                        onPress: async () => {
                            try {
                                setStatusMessage('Preparing transaction...');

                                // Use exact numeric values to avoid precision issues and ensure minimums
                                const signature = await createPool({
                                    index: DEFAULT_INDEX,
                                    baseMint: baseMint,
                                    quoteMint: quoteMint,
                                    baseAmount: finalBaseAmount,
                                    quoteAmount: finalQuoteAmount,
                                    userPublicKey: userAddress,
                                    connection,
                                    solanaWallet,
                                    onStatusUpdate: (msg) => setStatusMessage(msg),
                                });

                                setStatusMessage(`Pool created! Tx signature: ${signature}`);
                                // Reset amounts but keep mint addresses
                                setBaseAmount('');
                                setQuoteAmount('');
                                setInitialPrice(null);
                            } catch (err) {
                                setError(err instanceof Error ? err.message : 'Failed to create pool');
                                setStatusMessage(null);
                            } finally {
                                setIsLoading(false);
                            }
                        }
                    }
                ]
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create pool');
            setStatusMessage(null);
            setIsLoading(false);
        }
    }, [
        connected,
        solanaWallet,
        address,
        baseMint,
        quoteMint,
        baseAmount,
        quoteAmount,
        baseSymbol,
        quoteSymbol,
        isValidPublicKey,
        connection
    ]);

    if (!connected) {
        return (
            <View style={styles.container}>
                <Text style={styles.infoText}>
                    Please connect your wallet to create a pool
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Create a New Pool</Text>

            {/* Base Mint Address */}
            <Text style={styles.inputLabel}>Base Token Mint {baseSymbol !== 'BASE' ? `(${baseSymbol})` : ''}</Text>
            <TextInput
                style={styles.input}
                value={baseMint}
                onChangeText={handleBaseMintChange}
                placeholder="Base token mint address (e.g. SOL mint)"
                editable={!isLoading}
            />

            {/* Quote Mint Address */}
            <Text style={styles.inputLabel}>Quote Token Mint {quoteSymbol !== 'QUOTE' ? `(${quoteSymbol})` : ''}</Text>
            <TextInput
                style={styles.input}
                value={quoteMint}
                onChangeText={handleQuoteMintChange}
                placeholder="Quote token mint address (e.g. USDC mint)"
                editable={!isLoading}
            />

            {/* Base Amount */}
            <Text style={styles.inputLabel}>Base Token Amount ({baseSymbol})</Text>
            <TextInput
                style={styles.input}
                value={baseAmount}
                onChangeText={handleBaseAmountChange}
                placeholder={`Enter ${baseSymbol} amount`}
                keyboardType="numeric"
                editable={!isLoading}
            />

            {/* Quote Amount */}
            <Text style={styles.inputLabel}>Quote Token Amount ({quoteSymbol})</Text>
            <TextInput
                style={styles.input}
                value={quoteAmount}
                onChangeText={handleQuoteAmountChange}
                placeholder={`Enter ${quoteSymbol} amount`}
                keyboardType="numeric"
                editable={!isLoading}
            />

            {/* Show initial price if both amounts > 0 */}
            {initialPrice !== null && (
                <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>Initial Price:</Text>
                    <Text style={styles.priceValue}>
                        1 {baseSymbol} = {initialPrice.toFixed(6)} {quoteSymbol}
                    </Text>
                </View>
            )}

            {/* Pool creation info */}
            <View style={styles.infoContainer}>
                <Text style={styles.infoTextDetail}>
                    Creating a pool allows you to provide liquidity between two tokens and earn fees from trades.
                </Text>
                <Text style={styles.infoTextDetail}>
                    Note: You must have both tokens in your wallet to create a pool.
                </Text>
                {baseMint === SOL_MINT || quoteMint === SOL_MINT ? (
                    <Text style={styles.infoTextDetail}>
                        <Text style={{ fontWeight: 'bold' }}>Important:</Text> When using SOL in a pool, the minimum
                        amount required is 0.01 SOL (10,000,000 lamports). For other tokens, the minimum is 0.01 tokens.
                    </Text>
                ) : null}
                <Text style={[styles.infoTextDetail, { marginTop: 8, color: '#c75e16' }]}>
                    <Text style={{ fontWeight: 'bold' }}>Mainnet Notice:</Text> Creating a pool on mainnet requires enough SOL
                    to cover rent for new accounts. You need approximately 0.03-0.05 SOL (~$4-6) in your wallet to successfully
                    create a pool, in addition to the tokens you're providing as liquidity.
                </Text>
                <Text style={[styles.infoTextDetail, { marginTop: 8, color: '#c75e16' }]}>
                    <Text style={{ fontWeight: 'bold' }}>Devnet Notice:</Text> On devnet, you may encounter
                    "incorrect program id" errors due to differences in associated token accounts.
                </Text>
            </View>

            {/* Create pool button */}
            <TouchableOpacity
                style={[styles.button, isLoading ? styles.disabledButton : null]}
                onPress={handleCreatePool}
                disabled={isLoading}
            >
                <Text style={styles.buttonText}>
                    {isLoading ? 'Processing...' : 'Create Pool'}
                </Text>
            </TouchableOpacity>

            {/* Loading */}
            {isLoading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#6E56CF" />
                </View>
            )}

            {/* Status Message */}
            {statusMessage && (
                <View style={
                    statusMessage.includes('failed') || statusMessage.includes('Failed')
                        ? styles.errorContainer
                        : styles.statusContainer
                }>
                    <Text style={
                        statusMessage.includes('failed') || statusMessage.includes('Failed')
                            ? styles.errorText
                            : styles.statusText
                    }>
                        {statusMessage}
                    </Text>
                </View>
            )}

            {/* Error display */}
            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    {error.includes('Invalid account discriminator') && (
                        <Text style={styles.errorHint}>
                            The PumpSwap SDK couldn't find a valid pool. This can happen if the pool doesn't exist or the SDK is trying to use the wrong program ID.
                        </Text>
                    )}
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
        marginBottom: 12,
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
    priceContainer: {
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        padding: 16,
        marginVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    priceLabel: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    priceValue: {
        fontSize: 16,
        color: '#334155',
        fontWeight: '600',
    },
    button: {
        backgroundColor: '#6E56CF',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
    },
    buttonText: {
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
        marginVertical: 12,
    },
    infoTextDetail: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 8,
    },
    errorHint: {
        marginTop: 4,
        fontSize: 12,
        color: '#64748B',
        fontStyle: 'italic',
    },
});
