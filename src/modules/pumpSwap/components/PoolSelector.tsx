import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    FlatList,
    ActivityIndicator,
    Image
} from 'react-native';
import { Pool } from '@pump-fun/pump-swap-sdk';
import { formatNumber, shortenAddress } from '../utils/pumpSwapUtils';

interface TokenData {
    symbol: string;
    logo?: string;
    address: string;
}

interface PoolSelectorProps {
    pools: Pool[];
    selectedPool: Pool | null;
    onSelectPool: (pool: Pool) => void;
    isLoading: boolean;
    tokenMap: Record<string, TokenData>;
}

/**
 * A component for selecting a liquidity pool
 * @component
 */
const PoolSelector: React.FC<PoolSelectorProps> = ({
    pools,
    selectedPool,
    onSelectPool,
    isLoading,
    tokenMap
}) => {
    const [modalVisible, setModalVisible] = useState(false);

    // Format pool display data using token information from the token map
    const getPoolDisplayData = (pool: any) => {
        // Convert from SDK Pool type to our interface
        const baseToken = tokenMap[pool.baseMint] || {
            symbol: 'Unknown',
            address: pool.baseMint,
            logo: undefined
        };

        const quoteToken = tokenMap[pool.quoteMint] || {
            symbol: 'Unknown',
            address: pool.quoteMint,
            logo: undefined
        };

        return {
            baseToken,
            quoteToken,
            price: pool.price || 0,
            poolAddress: shortenAddress(pool.address || ''),
            poolPair: `${baseToken.symbol}/${quoteToken.symbol}`
        };
    };

    // Get display data for the selected pool
    const getSelectedPoolDisplay = () => {
        if (!selectedPool) return null;

        return getPoolDisplayData(selectedPool);
    };

    // Handle pool selection
    const handleSelectPool = (pool: Pool) => {
        onSelectPool(pool);
        setModalVisible(false);
    };

    // Render pool item in the list
    const renderPoolItem = ({ item }: { item: Pool }) => {
        const poolData = getPoolDisplayData(item);

        return (
            <TouchableOpacity
                style={styles.poolItem}
                onPress={() => handleSelectPool(item)}
            >
                <View style={styles.poolPairContainer}>
                    <View style={styles.tokenLogos}>
                        {poolData.baseToken.logo ? (
                            <Image
                                source={{ uri: poolData.baseToken.logo }}
                                style={styles.tokenLogo}
                            />
                        ) : (
                            <View style={[styles.tokenLogo, styles.placeholderLogo]}>
                                <Text style={styles.placeholderText}>
                                    {poolData.baseToken.symbol.charAt(0)}
                                </Text>
                            </View>
                        )}
                        {poolData.quoteToken.logo ? (
                            <Image
                                source={{ uri: poolData.quoteToken.logo }}
                                style={[styles.tokenLogo, styles.secondTokenLogo]}
                            />
                        ) : (
                            <View style={[styles.tokenLogo, styles.placeholderLogo, styles.secondTokenLogo]}>
                                <Text style={styles.placeholderText}>
                                    {poolData.quoteToken.symbol.charAt(0)}
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.poolInfo}>
                        <Text style={styles.poolPair}>{poolData.poolPair}</Text>
                        <Text style={styles.poolAddress}>{poolData.poolAddress}</Text>
                    </View>
                </View>

                <View style={styles.poolPriceContainer}>
                    <Text style={styles.poolPrice}>
                        {formatNumber(poolData.price, 6)}
                    </Text>
                    <Text style={styles.priceLabel}>Price</Text>
                </View>
            </TouchableOpacity>
        );
    };

    // Selected pool display
    const selectedPoolDisplay = getSelectedPoolDisplay();

    return (
        <>
            <View style={styles.container}>
                <Text style={styles.label}>Select Pool</Text>

                <TouchableOpacity
                    style={styles.selectorButton}
                    onPress={() => setModalVisible(true)}
                    disabled={isLoading || pools.length === 0}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#6E56CF" />
                    ) : selectedPool ? (
                        <View style={styles.selectedPoolInfo}>
                            <View style={styles.tokenLogos}>
                                {selectedPoolDisplay?.baseToken.logo ? (
                                    <Image
                                        source={{ uri: selectedPoolDisplay.baseToken.logo }}
                                        style={styles.tokenLogo}
                                    />
                                ) : (
                                    <View style={[styles.tokenLogo, styles.placeholderLogo]}>
                                        <Text style={styles.placeholderText}>
                                            {selectedPoolDisplay?.baseToken.symbol.charAt(0)}
                                        </Text>
                                    </View>
                                )}
                                {selectedPoolDisplay?.quoteToken.logo ? (
                                    <Image
                                        source={{ uri: selectedPoolDisplay.quoteToken.logo }}
                                        style={[styles.tokenLogo, styles.secondTokenLogo]}
                                    />
                                ) : (
                                    <View style={[styles.tokenLogo, styles.placeholderLogo, styles.secondTokenLogo]}>
                                        <Text style={styles.placeholderText}>
                                            {selectedPoolDisplay?.quoteToken.symbol.charAt(0)}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            <Text style={styles.selectedPoolPair}>
                                {selectedPoolDisplay?.poolPair}
                            </Text>

                            <View style={styles.priceContainer}>
                                <Text style={styles.price}>
                                    {formatNumber(selectedPoolDisplay?.price || 0, 6)}
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <Text style={styles.placeholderText}>
                            {pools.length === 0 ? 'No pools available' : 'Select a pool'}
                        </Text>
                    )}

                    <Text style={styles.dropdownIcon}>▼</Text>
                </TouchableOpacity>
            </View>

            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select a Pool</Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {pools.length > 0 ? (
                            <FlatList
                                data={pools}
                                renderItem={renderPoolItem}
                                keyExtractor={(item) => item.address || Math.random().toString()}
                                style={styles.poolList}
                            />
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No pools available</Text>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748B',
        marginBottom: 8,
    },
    selectorButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        backgroundColor: '#F8F9FA',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
    },
    selectedPoolInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    tokenLogos: {
        flexDirection: 'row',
        marginRight: 8,
        width: 40,
    },
    tokenLogo: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FFFFFF',
    },
    secondTokenLogo: {
        marginLeft: -12,
    },
    placeholderLogo: {
        backgroundColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedPoolPair: {
        fontSize: 16,
        fontWeight: '600',
        color: '#334155',
        flex: 1,
    },
    priceContainer: {
        marginLeft: 8,
    },
    price: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748B',
    },
    placeholderText: {
        fontSize: 14,
        color: '#94A3B8',
    },
    dropdownIcon: {
        fontSize: 10,
        color: '#64748B',
        marginLeft: 8,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
        paddingBottom: 40,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    closeButton: {
        padding: 8,
    },
    closeButtonText: {
        fontSize: 18,
        color: '#64748B',
    },
    poolList: {
        paddingHorizontal: 20,
    },
    poolItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    poolPairContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    poolInfo: {
        marginLeft: 8,
        flex: 1,
    },
    poolPair: {
        fontSize: 16,
        fontWeight: '600',
        color: '#334155',
    },
    poolAddress: {
        fontSize: 12,
        color: '#94A3B8',
    },
    poolPriceContainer: {
        alignItems: 'flex-end',
    },
    poolPrice: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
    },
    priceLabel: {
        fontSize: 12,
        color: '#94A3B8',
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#64748B',
    }
});

export default PoolSelector; 