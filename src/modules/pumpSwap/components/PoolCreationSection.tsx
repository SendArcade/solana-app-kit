import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { usePumpSwap } from '../hooks/usePumpSwap';
import { PoolCreationSectionProps } from '../types';
import TokenInput from './TokenInput';
import ActionButton from './ActionButton';
import { formatNumber } from '../utils/pumpSwapUtils';

// Default pool index (would be calculated in real implementation)
const DEFAULT_POOL_INDEX = 0;

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
 * A section for creating new PumpSwap pools
 * @component
 */
const PoolCreationSection: React.FC<PoolCreationSectionProps> = ({
    containerStyle,
    inputStyle,
    buttonStyle,
    createPoolButtonLabel = 'Create Pool'
}) => {
    const { createPool, refreshPools } = usePumpSwap();

    // State variables
    const [baseMint, setBaseMint] = useState('');
    const [quoteMint, setQuoteMint] = useState('');
    const [baseAmount, setBaseAmount] = useState('');
    const [quoteAmount, setQuoteAmount] = useState('');
    const [poolIndex, setPoolIndex] = useState(DEFAULT_POOL_INDEX);
    const [initialPrice, setInitialPrice] = useState<number | null>(null);
    const [creationLoading, setCreationLoading] = useState(false);
    const [status, setStatus] = useState('');

    // Mock token selection - in a real app, this would come from a token service
    const tokenMap: TokenMap = {
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
        },
        // Add more tokens as needed
    };

    // Array of tokens for selection
    const availableTokens = Object.values(tokenMap);

    // Handle token selection for base and quote
    const [selectedBaseToken, setSelectedBaseToken] = useState<TokenInfo | null>(null);
    const [selectedQuoteToken, setSelectedQuoteToken] = useState<TokenInfo | null>(null);

    // Handle input changes
    const handleBaseAmountChange = (text: string) => {
        setBaseAmount(text);
        calculateInitialPrice();
    };

    const handleQuoteAmountChange = (text: string) => {
        setQuoteAmount(text);
        calculateInitialPrice();
    };

    // Calculate initial pool price
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

    // Select a token for base or quote
    const selectBaseToken = (token: TokenInfo) => {
        setSelectedBaseToken(token);
        setBaseMint(token.mint);

        // Prevent selecting the same token for both
        if (selectedQuoteToken?.mint === token.mint) {
            setSelectedQuoteToken(null);
            setQuoteMint('');
        }
    };

    const selectQuoteToken = (token: TokenInfo) => {
        setSelectedQuoteToken(token);
        setQuoteMint(token.mint);

        // Prevent selecting the same token for both
        if (selectedBaseToken?.mint === token.mint) {
            setSelectedBaseToken(null);
            setBaseMint('');
        }
    };

    // Handle pool creation
    const handleCreatePool = async () => {
        if (
            !baseMint ||
            !quoteMint ||
            !baseAmount ||
            !quoteAmount ||
            parseFloat(baseAmount) <= 0 ||
            parseFloat(quoteAmount) <= 0
        ) {
            Alert.alert('Error', 'Please provide all pool creation details.');
            return;
        }

        if (baseMint === quoteMint) {
            Alert.alert('Error', 'Base and quote tokens must be different.');
            return;
        }

        try {
            setCreationLoading(true);

            const txSignature = await createPool({
                index: poolIndex,
                baseMint,
                quoteMint,
                baseAmount: parseFloat(baseAmount),
                quoteAmount: parseFloat(quoteAmount),
                onStatusUpdate: (status) => setStatus(status)
            });

            console.log('Pool creation successful:', txSignature);

            // Reset form
            setBaseMint('');
            setQuoteMint('');
            setBaseAmount('');
            setQuoteAmount('');
            setInitialPrice(null);
            setSelectedBaseToken(null);
            setSelectedQuoteToken(null);

            // Increment pool index for next creation
            setPoolIndex(prev => prev + 1);

            // Refresh pools to include the new one
            refreshPools();

            Alert.alert(
                'Pool Created',
                `Your pool has been successfully created! Transaction signature: ${txSignature.slice(0, 8)}...${txSignature.slice(-8)}`
            );
        } catch (error) {
            console.error('Error creating pool:', error);
            Alert.alert('Pool Creation Failed', error instanceof Error ? error.message : 'An unknown error occurred');
        } finally {
            setCreationLoading(false);
            setStatus('');
        }
    };

    // Mock token selection UI - in a real app, this would be a modal with search
    const renderTokenSelection = (
        type: 'base' | 'quote',
        selectedToken: TokenInfo | null,
        onSelectToken: (token: TokenInfo) => void
    ) => {
        return (
            <View style={styles.tokenSelectionContainer}>
                <Text style={styles.tokenSelectionTitle}>
                    Select {type === 'base' ? 'Base' : 'Quote'} Token
                </Text>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tokenList}
                >
                    {availableTokens.map((token) => (
                        <ActionButton
                            key={token.mint}
                            title={token.symbol}
                            onPress={() => onSelectToken(token)}
                            style={[
                                styles.tokenButton,
                                selectedToken?.mint === token.mint && styles.selectedTokenButton
                            ]}
                            textStyle={selectedToken?.mint === token.mint ? styles.selectedTokenText : undefined}
                            variant={selectedToken?.mint === token.mint ? 'primary' : 'outline'}
                            fullWidth={false}
                        />
                    ))}
                </ScrollView>
            </View>
        );
    };

    // Determine if create pool should be disabled
    const isCreateDisabled =
        !baseMint ||
        !quoteMint ||
        !baseAmount ||
        !quoteAmount ||
        parseFloat(baseAmount) <= 0 ||
        parseFloat(quoteAmount) <= 0 ||
        baseMint === quoteMint ||
        creationLoading;

    return (
        <View style={[styles.container, containerStyle]}>
            {renderTokenSelection('base', selectedBaseToken, selectBaseToken)}

            {selectedBaseToken && (
                <TokenInput
                    label="Base Token Amount"
                    value={baseAmount}
                    onChangeText={handleBaseAmountChange}
                    token={selectedBaseToken}
                    balance={selectedBaseToken.balance}
                />
            )}

            {renderTokenSelection('quote', selectedQuoteToken, selectQuoteToken)}

            {selectedQuoteToken && (
                <TokenInput
                    label="Quote Token Amount"
                    value={quoteAmount}
                    onChangeText={handleQuoteAmountChange}
                    token={selectedQuoteToken}
                    balance={selectedQuoteToken.balance}
                />
            )}

            {initialPrice !== null && (
                <View style={styles.infoContainer}>
                    <Text style={styles.infoLabel}>Initial Pool Price:</Text>
                    <Text style={styles.infoValue}>
                        1 {selectedBaseToken?.symbol || 'Base'} = {formatNumber(initialPrice, 6)} {selectedQuoteToken?.symbol || 'Quote'}
                    </Text>
                </View>
            )}

            {status && (
                <View style={styles.statusContainer}>
                    <Text style={styles.statusText}>{status}</Text>
                </View>
            )}

            <ActionButton
                title={createPoolButtonLabel}
                onPress={handleCreatePool}
                disabled={isCreateDisabled}
                loading={creationLoading}
                style={[styles.createButton, buttonStyle]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    tokenSelectionContainer: {
        marginBottom: 16,
    },
    tokenSelectionTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748B',
        marginBottom: 8,
    },
    tokenList: {
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    tokenButton: {
        marginHorizontal: 4,
        paddingHorizontal: 16,
        height: 40,
    },
    selectedTokenButton: {
        backgroundColor: '#6E56CF',
    },
    selectedTokenText: {
        color: '#FFFFFF',
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        flexWrap: 'wrap',
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
    createButton: {
        marginTop: 24,
    },
});

export default PoolCreationSection; 