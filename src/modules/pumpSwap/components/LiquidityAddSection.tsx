import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Pool } from '@pump-fun/pump-swap-sdk';
import { usePumpSwap } from '../hooks/usePumpSwap';
import { LiquidityAddSectionProps } from '../types';
import TokenInput from './TokenInput';
import PoolSelector from './PoolSelector';
import ActionButton from './ActionButton';
import { formatNumber, formatTokenAmount } from '../utils/pumpSwapUtils';

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
 * A section for adding liquidity to PumpSwap pools
 * @component
 */
const LiquidityAddSection: React.FC<LiquidityAddSectionProps> = ({
    containerStyle,
    inputStyle,
    buttonStyle,
    addLiquidityButtonLabel = 'Add Liquidity'
}) => {
    const {
        pools,
        isLoading,
        addLiquidity,
        getLiquidityQuote,
        refreshPools
    } = usePumpSwap();

    // State variables
    const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
    const [baseAmount, setBaseAmount] = useState('');
    const [quoteAmount, setQuoteAmount] = useState('');
    const [lpTokenAmount, setLpTokenAmount] = useState<number>(0);
    const [slippage, setSlippage] = useState(DEFAULT_SLIPPAGE);
    const [baseQuoteRatio, setBaseQuoteRatio] = useState<number | null>(null);
    const [lastEdited, setLastEdited] = useState<'base' | 'quote' | null>(null);
    const [estimateLoading, setEstimateLoading] = useState(false);
    const [addLiquidityLoading, setAddLiquidityLoading] = useState(false);
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

    // Handle base amount change
    const handleBaseAmountChange = (text: string) => {
        setBaseAmount(text);
        setLastEdited('base');
    };

    // Handle quote amount change
    const handleQuoteAmountChange = (text: string) => {
        setQuoteAmount(text);
        setLastEdited('quote');
    };

    // Update other amount based on last edited field
    useEffect(() => {
        const updateAmounts = async () => {
            if (!selectedPool || !lastEdited) return;

            try {
                setEstimateLoading(true);

                if (lastEdited === 'base' && baseAmount) {
                    if (parseFloat(baseAmount) <= 0) {
                        setQuoteAmount('');
                        setLpTokenAmount(0);
                        return;
                    }

                    const result = await getLiquidityQuote({
                        pool: selectedPool,
                        baseAmount: parseFloat(baseAmount),
                        quoteAmount: undefined,
                        slippage
                    });

                    if (result && typeof result.quote === 'number') {
                        setQuoteAmount(result.quote.toString());
                        setLpTokenAmount(result.lpToken);
                        setBaseQuoteRatio(result.quote / parseFloat(baseAmount));
                    }
                } else if (lastEdited === 'quote' && quoteAmount) {
                    if (parseFloat(quoteAmount) <= 0) {
                        setBaseAmount('');
                        setLpTokenAmount(0);
                        return;
                    }

                    const result = await getLiquidityQuote({
                        pool: selectedPool,
                        baseAmount: undefined,
                        quoteAmount: parseFloat(quoteAmount),
                        slippage
                    });

                    if (result && typeof result.base === 'number') {
                        setBaseAmount(result.base.toString());
                        setLpTokenAmount(result.lpToken);
                        setBaseQuoteRatio(parseFloat(quoteAmount) / result.base);
                    }
                }
            } catch (error) {
                console.error('Error getting liquidity quote:', error);
                Alert.alert('Error', 'Failed to get liquidity quote. Please try again.');

                if (lastEdited === 'base') {
                    setQuoteAmount('');
                } else {
                    setBaseAmount('');
                }

                setLpTokenAmount(0);
            } finally {
                setEstimateLoading(false);
            }
        };

        updateAmounts();
    }, [selectedPool, baseAmount, quoteAmount, lastEdited, slippage, getLiquidityQuote]);

    // Handle add liquidity
    const handleAddLiquidity = async () => {
        if (
            !selectedPool ||
            !baseAmount ||
            !quoteAmount ||
            parseFloat(baseAmount) <= 0 ||
            parseFloat(quoteAmount) <= 0 ||
            lpTokenAmount <= 0
        ) {
            Alert.alert('Error', 'Please enter valid amounts for both tokens.');
            return;
        }

        try {
            setAddLiquidityLoading(true);

            const txSignature = await addLiquidity({
                pool: selectedPool,
                baseAmount: parseFloat(baseAmount),
                quoteAmount: parseFloat(quoteAmount),
                lpTokenAmount: lpTokenAmount,
                slippage,
                onStatusUpdate: (status) => setStatus(status)
            });

            console.log('Add liquidity transaction successful:', txSignature);

            // Reset form
            setBaseAmount('');
            setQuoteAmount('');
            setLpTokenAmount(0);
            setLastEdited(null);

            // Refresh pools to get updated balances
            refreshPools();

            Alert.alert(
                'Liquidity Added',
                `You've successfully added liquidity to the pool! Transaction signature: ${txSignature.slice(0, 8)}...${txSignature.slice(-8)}`
            );
        } catch (error) {
            console.error('Error adding liquidity:', error);
            Alert.alert('Add Liquidity Failed', error instanceof Error ? error.message : 'An unknown error occurred');
        } finally {
            setAddLiquidityLoading(false);
            setStatus('');
        }
    };

    // Get tokens
    const baseToken = getBaseToken();
    const quoteToken = getQuoteToken();

    // Determine if add liquidity should be disabled
    const isAddLiquidityDisabled =
        !selectedPool ||
        !baseAmount ||
        !quoteAmount ||
        parseFloat(baseAmount) <= 0 ||
        parseFloat(quoteAmount) <= 0 ||
        lpTokenAmount <= 0 ||
        addLiquidityLoading;

    return (
        <View style={[styles.container, containerStyle]}>
            <PoolSelector
                pools={pools}
                selectedPool={selectedPool}
                onSelectPool={setSelectedPool}
                isLoading={isLoading}
                tokenMap={tokenMap}
            />

            <TokenInput
                label="Base Token Amount"
                value={baseAmount}
                onChangeText={handleBaseAmountChange}
                token={baseToken || { symbol: 'Select', mint: '', decimals: 0 }}
                balance={baseToken?.balance}
                isLoading={lastEdited === 'quote' && estimateLoading}
            />

            <TokenInput
                label="Quote Token Amount"
                value={quoteAmount}
                onChangeText={handleQuoteAmountChange}
                token={quoteToken || { symbol: 'Select', mint: '', decimals: 0 }}
                balance={quoteToken?.balance}
                isLoading={lastEdited === 'base' && estimateLoading}
            />

            {lpTokenAmount > 0 && (
                <View style={styles.infoContainer}>
                    <Text style={styles.infoLabel}>You will receive:</Text>
                    <Text style={styles.infoValue}>{formatNumber(lpTokenAmount, 6)} LP tokens</Text>
                </View>
            )}

            {baseQuoteRatio !== null && (
                <View style={styles.infoContainer}>
                    <Text style={styles.infoLabel}>Ratio:</Text>
                    <Text style={styles.infoValue}>
                        1 {baseToken?.symbol || 'Base'} = {formatNumber(baseQuoteRatio, 6)} {quoteToken?.symbol || 'Quote'}
                    </Text>
                </View>
            )}

            {status && (
                <View style={styles.statusContainer}>
                    <Text style={styles.statusText}>{status}</Text>
                </View>
            )}

            <ActionButton
                title={addLiquidityButtonLabel}
                onPress={handleAddLiquidity}
                disabled={isAddLiquidityDisabled}
                loading={addLiquidityLoading}
                style={[styles.addLiquidityButton, buttonStyle]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    infoLabel: {
        fontSize: 14,
        color: '#64748B',
        marginRight: 4,
    },
    infoValue: {
        fontSize: 14,
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
    addLiquidityButton: {
        marginTop: 24,
    },
});

export default LiquidityAddSection;