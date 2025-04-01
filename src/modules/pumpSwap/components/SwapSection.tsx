import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Pool, Direction } from '@pump-fun/pump-swap-sdk';
import { usePumpSwap } from '../hooks/usePumpSwap';
import { PumpSwapSectionProps } from '../types';
import TokenInput from './TokenInput';
import PoolSelector from './PoolSelector';
import ActionButton from './ActionButton';
import { formatNumber, formatTokenAmount, calculatePriceImpact } from '../utils/pumpSwapUtils';

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
 * A section for swapping tokens using PumpSwap
 * @component
 */
const SwapSection: React.FC<PumpSwapSectionProps> = ({
    containerStyle,
    inputStyle,
    buttonStyle,
    swapButtonLabel = 'Swap Tokens'
}) => {
    const {
        pools,
        isLoading,
        swap,
        getSwapQuote,
        refreshPools
    } = usePumpSwap();

    // State variables
    const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
    const [inputAmount, setInputAmount] = useState('');
    const [outputAmount, setOutputAmount] = useState('');
    const [currentDirection, setCurrentDirection] = useState<Direction>('baseToQuote');
    const [slippage, setSlippage] = useState(DEFAULT_SLIPPAGE);
    const [priceImpact, setPriceImpact] = useState<number | null>(null);
    const [estimateLoading, setEstimateLoading] = useState(false);
    const [swapLoading, setSwapLoading] = useState(false);
    const [swapStatus, setSwapStatus] = useState('');

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

    // Toggle direction between base/quote
    const toggleDirection = useCallback(() => {
        setCurrentDirection(currentDirection === 'baseToQuote' ? 'quoteToBase' : 'baseToQuote');
        // Clear the input/output values
        setInputAmount('');
        setOutputAmount('');
        setPriceImpact(null);
    }, [currentDirection]);

    // Get input token info
    const getInputToken = useCallback(() => {
        if (!selectedPool) return null;

        const mintAddress = currentDirection === 'baseToQuote'
            ? (selectedPool as any).baseMint
            : (selectedPool as any).quoteMint;

        return tokenMap[mintAddress] || {
            symbol: 'Unknown',
            mint: mintAddress,
            decimals: 9
        };
    }, [selectedPool, currentDirection, tokenMap]);

    // Get output token info
    const getOutputToken = useCallback(() => {
        if (!selectedPool) return null;

        const mintAddress = currentDirection === 'baseToQuote'
            ? (selectedPool as any).quoteMint
            : (selectedPool as any).baseMint;

        return tokenMap[mintAddress] || {
            symbol: 'Unknown',
            mint: mintAddress,
            decimals: 9
        };
    }, [selectedPool, currentDirection, tokenMap]);

    // Update quote when input, pool, or direction changes
    useEffect(() => {
        const updateOutputAmount = async () => {
            if (!selectedPool || !inputAmount || parseFloat(inputAmount) <= 0) {
                setOutputAmount('');
                setPriceImpact(null);
                return;
            }

            try {
                setEstimateLoading(true);
                const parsedAmount = parseFloat(inputAmount);

                const result = await getSwapQuote({
                    pool: selectedPool,
                    inputAmount: parsedAmount,
                    direction: currentDirection,
                    slippage
                });

                setOutputAmount(result.toString());

                // Calculate price impact
                if (selectedPool) {
                    const impact = calculatePriceImpact(
                        parsedAmount,
                        result,
                        (selectedPool as any).price,
                        currentDirection === 'baseToQuote'
                    );
                    setPriceImpact(impact);
                }
            } catch (error) {
                console.error('Error getting swap quote:', error);
                Alert.alert('Error', 'Failed to get swap quote. Please try again.');
                setOutputAmount('');
                setPriceImpact(null);
            } finally {
                setEstimateLoading(false);
            }
        };

        updateOutputAmount();
    }, [selectedPool, inputAmount, currentDirection, slippage, getSwapQuote]);

    // Handle swap execution
    const handleSwap = async () => {
        if (!selectedPool || !inputAmount || parseFloat(inputAmount) <= 0) {
            Alert.alert('Error', 'Please enter a valid amount to swap.');
            return;
        }

        try {
            setSwapLoading(true);

            const parsedAmount = parseFloat(inputAmount);

            const txSignature = await swap({
                pool: selectedPool,
                amount: parsedAmount,
                direction: currentDirection,
                slippage,
                onStatusUpdate: (status) => setSwapStatus(status)
            });

            console.log('Swap transaction successful:', txSignature);

            // Reset form
            setInputAmount('');
            setOutputAmount('');
            setPriceImpact(null);

            // Refresh pools to get updated balances
            refreshPools();

            Alert.alert(
                'Swap Successful',
                `Your swap transaction was successful! Transaction signature: ${txSignature.slice(0, 8)}...${txSignature.slice(-8)}`
            );
        } catch (error) {
            console.error('Error during swap:', error);
            Alert.alert('Swap Failed', error instanceof Error ? error.message : 'An unknown error occurred');
        } finally {
            setSwapLoading(false);
            setSwapStatus('');
        }
    };

    // Get input and output tokens
    const inputToken = getInputToken();
    const outputToken = getOutputToken();

    // Determine if swap should be disabled
    const isSwapDisabled =
        !selectedPool ||
        !inputAmount ||
        parseFloat(inputAmount) <= 0 ||
        !outputAmount ||
        parseFloat(outputAmount) <= 0 ||
        swapLoading ||
        (priceImpact !== null && priceImpact > 10); // Disable if price impact is too high

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
                label="From"
                value={inputAmount}
                onChangeText={setInputAmount}
                token={inputToken || { symbol: 'Select', mint: '', decimals: 0 }}
                balance={inputToken?.balance}
                autoFocus
            />

            <View style={styles.swapDirectionContainer}>
                <View style={styles.swapIcon}>
                    <Text style={styles.swapIconText}>⇅</Text>
                </View>
                <Text
                    style={styles.swapDirectionText}
                    onPress={toggleDirection}
                >
                    {currentDirection === 'baseToQuote' ? 'Base → Quote' : 'Quote → Base'}
                </Text>
            </View>

            <TokenInput
                label="To (Estimated)"
                value={outputAmount}
                onChangeText={() => { }} // Read-only
                token={outputToken || { symbol: 'Select', mint: '', decimals: 0 }}
                readOnly={true}
                isLoading={estimateLoading}
            />

            {priceImpact !== null && (
                <View style={styles.priceImpactContainer}>
                    <Text style={styles.priceImpactLabel}>Price Impact:</Text>
                    <Text style={[
                        styles.priceImpactValue,
                        priceImpact > 5 ? styles.highImpact :
                            priceImpact > 1 ? styles.mediumImpact :
                                styles.lowImpact
                    ]}>
                        {formatNumber(priceImpact, 2)}%
                    </Text>
                </View>
            )}

            {selectedPool && (
                <View style={styles.exchangeRateContainer}>
                    <Text style={styles.exchangeRateLabel}>Exchange Rate:</Text>
                    <Text style={styles.exchangeRateValue}>
                        1 {currentDirection === 'baseToQuote' ?
                            (inputToken?.symbol || 'Base') :
                            (outputToken?.symbol || 'Quote')} = {' '}
                        {formatNumber((selectedPool as any).price, 6)}{' '}
                        {currentDirection === 'baseToQuote' ?
                            (outputToken?.symbol || 'Quote') :
                            (inputToken?.symbol || 'Base')}
                    </Text>
                </View>
            )}

            {swapStatus && (
                <View style={styles.statusContainer}>
                    <Text style={styles.statusText}>{swapStatus}</Text>
                </View>
            )}

            <ActionButton
                title={swapButtonLabel}
                onPress={handleSwap}
                disabled={isSwapDisabled}
                loading={swapLoading}
                style={[styles.swapButton, buttonStyle]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    swapDirectionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 8,
    },
    swapIcon: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    swapIconText: {
        fontSize: 18,
        color: '#64748B',
    },
    swapDirectionText: {
        fontSize: 14,
        color: '#6E56CF',
        fontWeight: '500',
    },
    priceImpactContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    priceImpactLabel: {
        fontSize: 14,
        color: '#64748B',
        marginRight: 4,
    },
    priceImpactValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    lowImpact: {
        color: '#10B981', // Green
    },
    mediumImpact: {
        color: '#F59E0B', // Amber
    },
    highImpact: {
        color: '#EF4444', // Red
    },
    exchangeRateContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        marginTop: 8,
    },
    exchangeRateLabel: {
        fontSize: 14,
        color: '#64748B',
        marginRight: 4,
    },
    exchangeRateValue: {
        fontSize: 14,
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
    swapButton: {
        marginTop: 24,
    },
});

export default SwapSection; 