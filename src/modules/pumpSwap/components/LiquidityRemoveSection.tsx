import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Pool } from '@pump-fun/pump-swap-sdk';
import { usePumpSwap } from '../hooks/usePumpSwap';
import { LiquidityRemoveSectionProps } from '../types';
import TokenInput from './TokenInput';
import PoolSelector from './PoolSelector';
import ActionButton from './ActionButton';
import { formatNumber } from '../utils/pumpSwapUtils';

// Default slippage tolerance percentage
const DEFAULT_SLIPPAGE = 0.5;

interface TokenInfo {
    symbol: string;
    logo?: string;
    mint: string;
    decimals: number;
    balance?: string;
}

interface TokenMap {
    [key: string]: TokenInfo;
}

/**
 * A section for removing liquidity from PumpSwap pools
 * @component
 */
const LiquidityRemoveSection: React.FC<LiquidityRemoveSectionProps> = ({
    containerStyle,
    inputStyle,
    buttonStyle,
    removeLiquidityButtonLabel = 'Remove Liquidity'
}) => {
    const {
        pools,
        isLoading,
        removeLiquidity,
        refreshPools
    } = usePumpSwap();

    // State variables
    const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
    const [lpTokenAmount, setLpTokenAmount] = useState('');
    const [expectedBaseAmount, setExpectedBaseAmount] = useState<number | null>(null);
    const [expectedQuoteAmount, setExpectedQuoteAmount] = useState<number | null>(null);
    const [slippage, setSlippage] = useState(DEFAULT_SLIPPAGE);
    const [removeLoading, setRemoveLoading] = useState(false);
    const [status, setStatus] = useState('');

    // Mock token map - in a real app, this would come from a token service
    const tokenMap: TokenMap = {
        // Add some example tokens - this would be populated from your token service
        'So11111111111111111111111111111111111111112': {
            symbol: 'SOL',
            logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
            mint: 'So11111111111111111111111111111111111111112',
            decimals: 9,
            balance: '10.5'
        },
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': {
            symbol: 'USDC',
            logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
            mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            decimals: 6,
            balance: '100'
        }
    };

    // Get LP token info
    const getLpToken = useCallback(() => {
        if (!selectedPool) return null;

        const mintAddress = (selectedPool as any).lpMint || 'UNKNOWN_LP';

        return {
            symbol: 'LP',
            mint: mintAddress,
            decimals: 9, // Typical for LP tokens
            balance: '5.0' // Mock LP token balance - in a real app, get from user's wallet
        };
    }, [selectedPool]);

    // Get base token info
    const getBaseToken = useCallback(() => {
        if (!selectedPool) return null;

        const mintAddress = (selectedPool as any).baseMint;

        return tokenMap[mintAddress] || {
            symbol: 'Unknown',
            mint: mintAddress,
            decimals: 9
        };
    }, [selectedPool, tokenMap]);

    // Get quote token info
    const getQuoteToken = useCallback(() => {
        if (!selectedPool) return null;

        const mintAddress = (selectedPool as any).quoteMint;

        return tokenMap[mintAddress] || {
            symbol: 'Unknown',
            mint: mintAddress,
            decimals: 9
        };
    }, [selectedPool, tokenMap]);

    // Calculate expected token amounts based on LP token amount
    const calculateExpectedAmounts = useCallback(() => {
        if (!selectedPool || !lpTokenAmount || parseFloat(lpTokenAmount) <= 0) {
            setExpectedBaseAmount(null);
            setExpectedQuoteAmount(null);
            return;
        }

        // In a real implementation, you would call the SDK to get accurate estimates
        // This is a simplified mock calculation based on pool reserves and LP amount
        const parsedAmount = parseFloat(lpTokenAmount);
        const pool = selectedPool as any;

        // Mock LP token total supply - in a real app, get from chain
        const lpTokenTotalSupply = 100;

        // Calculate percentage of pool being withdrawn
        const sharePercentage = parsedAmount / lpTokenTotalSupply;

        // Calculate token amounts based on pool reserves
        const baseReserve = parseFloat(pool.baseReserve || '0');
        const quoteReserve = parseFloat(pool.quoteReserve || '0');

        setExpectedBaseAmount(baseReserve * sharePercentage);
        setExpectedQuoteAmount(quoteReserve * sharePercentage);

    }, [selectedPool, lpTokenAmount]);

    // Update expected amounts when LP token amount changes
    const handleLpTokenAmountChange = (text: string) => {
        setLpTokenAmount(text);

        // Slight delay to ensure UI is responsive
        setTimeout(() => {
            calculateExpectedAmounts();
        }, 100);
    };

    // Handle remove liquidity action
    const handleRemoveLiquidity = async () => {
        if (!selectedPool || !lpTokenAmount || parseFloat(lpTokenAmount) <= 0) {
            Alert.alert('Error', 'Please enter a valid LP token amount.');
            return;
        }

        try {
            setRemoveLoading(true);

            const parsedAmount = parseFloat(lpTokenAmount);

            const txSignature = await removeLiquidity({
                pool: selectedPool,
                lpTokenAmount: parsedAmount,
                slippage,
                onStatusUpdate: (status) => setStatus(status)
            });

            console.log('Remove liquidity transaction successful:', txSignature);

            // Reset form
            setLpTokenAmount('');
            setExpectedBaseAmount(null);
            setExpectedQuoteAmount(null);

            // Refresh pools to get updated balances
            refreshPools();

            Alert.alert(
                'Liquidity Removed',
                `You've successfully removed liquidity from the pool! Transaction signature: ${txSignature.slice(0, 8)}...${txSignature.slice(-8)}`
            );
        } catch (error) {
            console.error('Error removing liquidity:', error);
            Alert.alert('Remove Liquidity Failed', error instanceof Error ? error.message : 'An unknown error occurred');
        } finally {
            setRemoveLoading(false);
            setStatus('');
        }
    };

    // Get tokens
    const lpToken = getLpToken();
    const baseToken = getBaseToken();
    const quoteToken = getQuoteToken();

    // Determine if remove liquidity should be disabled
    const isRemoveDisabled =
        !selectedPool ||
        !lpTokenAmount ||
        parseFloat(lpTokenAmount) <= 0 ||
        removeLoading;

    return (
        <View style={[styles.container, containerStyle]}>
            <PoolSelector
                pools={pools}
                selectedPool={selectedPool}
                onSelectPool={(pool) => {
                    setSelectedPool(pool);
                    setLpTokenAmount('');
                    setExpectedBaseAmount(null);
                    setExpectedQuoteAmount(null);
                }}
                isLoading={isLoading}
                tokenMap={tokenMap}
            />

            <TokenInput
                label="LP Token Amount"
                value={lpTokenAmount}
                onChangeText={handleLpTokenAmountChange}
                token={lpToken || { symbol: 'LP', mint: '', decimals: 0 }}
                balance={lpToken?.balance}
            />

            {(expectedBaseAmount !== null && expectedQuoteAmount !== null) && (
                <View style={styles.expectedOutputContainer}>
                    <Text style={styles.expectedOutputTitle}>Expected Output:</Text>

                    <View style={styles.tokenOutputRow}>
                        <View style={styles.tokenIcon}>
                            {baseToken?.logo ? (
                                <Text style={styles.tokenIconText}>
                                    {baseToken.symbol.charAt(0)}
                                </Text>
                            ) : (
                                <Text style={styles.tokenIconText}>B</Text>
                            )}
                        </View>
                        <Text style={styles.tokenAmount}>
                            {formatNumber(expectedBaseAmount, 6)} {baseToken?.symbol || 'Base'}
                        </Text>
                    </View>

                    <View style={styles.tokenOutputRow}>
                        <View style={styles.tokenIcon}>
                            {quoteToken?.logo ? (
                                <Text style={styles.tokenIconText}>
                                    {quoteToken.symbol.charAt(0)}
                                </Text>
                            ) : (
                                <Text style={styles.tokenIconText}>Q</Text>
                            )}
                        </View>
                        <Text style={styles.tokenAmount}>
                            {formatNumber(expectedQuoteAmount, 6)} {quoteToken?.symbol || 'Quote'}
                        </Text>
                    </View>
                </View>
            )}

            {status && (
                <View style={styles.statusContainer}>
                    <Text style={styles.statusText}>{status}</Text>
                </View>
            )}

            <ActionButton
                title={removeLiquidityButtonLabel}
                onPress={handleRemoveLiquidity}
                disabled={isRemoveDisabled}
                loading={removeLoading}
                style={[styles.removeButton, buttonStyle]}
                variant={isRemoveDisabled ? 'secondary' : 'danger'}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    expectedOutputContainer: {
        marginTop: 16,
        padding: 16,
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    expectedOutputTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 12,
    },
    tokenOutputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    tokenIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    tokenIconText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
    },
    tokenAmount: {
        fontSize: 15,
        fontWeight: '500',
        color: '#334155',
    },
    statusContainer: {
        marginTop: 16,
        padding: 12,
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
    },
    statusText: {
        fontSize: 14,
        color: '#334155',
        textAlign: 'center',
    },
    removeButton: {
        marginTop: 24,
    },
});

export default LiquidityRemoveSection; 