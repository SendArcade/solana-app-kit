import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Linking,
  Platform,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
// Import just fetchJupiterTokenData from tokenUtils
// @ts-ignore - Ignore TS error for now with the import (will be fixed in a proper build)
import { fetchJupiterTokenData } from '../../../utils/tokenUtils';
import { useCoingecko, Timeframe } from '../../../hooks/useCoingecko';
import LineGraph from '../TradeCard/LineGraph';
import { fetchUserAssets } from '../../../utils/common/fetch';

const { width, height } = Dimensions.get('window');

interface TokenDetailsDrawerProps {
  visible: boolean;
  onClose: () => void;
  tokenMint: string;
  initialData?: {
    symbol?: string;
    name?: string;
    logoURI?: string;
  };
}

// Helper for formatting large numbers with suffixes (K, M, B)
const formatLargeNumber = (num: number): string => {
  if (num === null || num === undefined || isNaN(num)) return 'N/A';
  
  if (num >= 1000000000) {
    return `$${(num / 1000000000).toFixed(2)}B`;
  } else if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(2)}M`;
  } else if (num >= 1000) {
    return `$${(num / 1000).toFixed(2)}K`;
  }
  return `$${num.toFixed(2)}`;
};

// Local implementation of formatTokenAmount 
const formatTokenAmount = (amount: number, decimals: number): string => {
  if (isNaN(amount) || isNaN(decimals)) return '0';
  
  const tokenAmount = amount / Math.pow(10, decimals);
  
  // For very small amounts, show more decimals
  if (tokenAmount < 0.001 && tokenAmount > 0) {
    return tokenAmount.toExponential(4);
  }
  
  // For larger amounts, limit decimals based on size
  if (tokenAmount >= 1000) {
    return tokenAmount.toFixed(2);
  } else if (tokenAmount >= 1) {
    return tokenAmount.toFixed(4);
  } else {
    return tokenAmount.toFixed(6);
  }
};

const TokenDetailsDrawer: React.FC<TokenDetailsDrawerProps> = ({
  visible,
  onClose,
  tokenMint,
  initialData,
}) => {
  const [tokenData, setTokenData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'market'>('overview');
  const [heliusTokenData, setHeliusTokenData] = useState<any>(null);
  const [loadingHelius, setLoadingHelius] = useState(false);

  // Coingecko hook for price chart data
  const {
    timeframe,
    setTimeframe,
    graphData,
    timestamps,
    timeframePrice,
    coinError,
    refreshCoinData,
    loadingOHLC,
    setSelectedCoinId,
    marketCap,
    fdv,
    liquidityScore,
    timeframeChangePercent
  } = useCoingecko();

  useEffect(() => {
    if (visible && tokenMint) {
      fetchTokenDetails();
      fetchHeliusData();
    }
  }, [visible, tokenMint]);

  const fetchTokenDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchJupiterTokenData(tokenMint);
      
      if (data) {
        setTokenData(data);
        
        // If token has coingecko ID, fetch price data
        if (data.extensions?.coingeckoId) {
          setSelectedCoinId(data.extensions.coingeckoId.toLowerCase());
        }
      } else {
        setError('Token data not found');
      }
    } catch (err) {
      console.error('Error fetching token details:', err);
      setError('Failed to load token details');
    } finally {
      setLoading(false);
    }
  };

  // Fetch additional token data from Helius
  const fetchHeliusData = async () => {
    if (!tokenMint) return;
    
    setLoadingHelius(true);
    try {
      // Use a demo wallet address to fetch token data
      // In a real app, this would be customized
      const dummyWallet = "11111111111111111111111111111111";
      const result = await fetchUserAssets(dummyWallet);
      
      // Find our token in the assets
      const tokenInfo = result.items.find((item: any) => 
        item.id === tokenMint || 
        item.mint === tokenMint
      );
      
      if (tokenInfo) {
        setHeliusTokenData(tokenInfo);
      }
    } catch (err) {
      console.error('Error fetching Helius token data:', err);
    } finally {
      setLoadingHelius(false);
    }
  };

  const openExplorer = () => {
    const url = `https://solscan.io/token/${tokenMint}`;
    Linking.openURL(url);
  };

  const renderTabButtons = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'overview' && styles.activeTabButton]}
        onPress={() => setActiveTab('overview')}
      >
        <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
          Overview
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'market' && styles.activeTabButton]}
        onPress={() => setActiveTab('market')}
      >
        <Text style={[styles.tabText, activeTab === 'market' && styles.activeTabText]}>
          Market
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderTimeframeSelector = () => (
    <View style={styles.timeframeContainer}>
      {(['1H', '1D', '1W', '1M', 'All'] as Timeframe[]).map(tf => (
        <TouchableOpacity
          key={tf}
          style={[
            styles.timeframeButton,
            timeframe === tf && styles.activeTimeframeButton,
          ]}
          onPress={() => setTimeframe(tf)}
        >
          <Text
            style={[
              styles.timeframeText,
              timeframe === tf && styles.activeTimeframeText,
            ]}
          >
            {tf}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.sectionText}>
          {tokenData?.extensions?.description || 'No description available.'}
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Token Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Token Address</Text>
          <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="middle">
            {tokenMint}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Decimals</Text>
          <Text style={styles.detailValue}>{tokenData?.decimals || '-'}</Text>
        </View>

        {/* Additional token details from Helius */}
        {heliusTokenData?.token_info && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Token Standard</Text>
            <Text style={styles.detailValue}>
              {heliusTokenData.token_info.token_program === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' 
                ? 'SPL Token' 
                : heliusTokenData.token_info.token_program}
            </Text>
          </View>
        )}

        {tokenData?.tags && tokenData.tags.length > 0 && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tags</Text>
            <View style={styles.tagsContainer}>
              {tokenData.tags.map((tag: string, index: number) => (
                <View key={index} style={styles.tagPill}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {tokenData?.extensions?.website && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Website</Text>
            <TouchableOpacity
              onPress={() => Linking.openURL(tokenData.extensions.website)}
            >
              <Text style={[styles.detailValue, styles.linkText]} numberOfLines={1}>
                {tokenData.extensions.website}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {/* Quick stats summary */}
      {timeframePrice > 0 && (
        <View style={styles.statsSummaryContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Price</Text>
            <Text style={styles.statValue}>${timeframePrice.toFixed(4)}</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>24h Change</Text>
            <Text style={[
              styles.statValue, 
              timeframeChangePercent > 0 ? styles.positiveChange : 
              timeframeChangePercent < 0 ? styles.negativeChange : {}
            ]}>
              {timeframeChangePercent > 0 ? '+' : ''}{timeframeChangePercent.toFixed(2)}%
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Market Cap</Text>
            <Text style={styles.statValue}>{formatLargeNumber(marketCap)}</Text>
          </View>
        </View>
      )}
      
      <TouchableOpacity style={styles.explorerButton} onPress={openExplorer}>
        <Text style={styles.explorerButtonText}>View on Solscan</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderMarketTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Graph */}
      {tokenData?.extensions?.coingeckoId && (
        <>
          {renderTimeframeSelector()}
          <View style={styles.chartContainer}>
            {loadingOHLC ? (
              <ActivityIndicator size="large" color="#1d9bf0" />
            ) : graphData.length > 0 ? (
              <LineGraph
                data={graphData}
                width={width - 80}
                timestamps={timestamps}
              />
            ) : (
              <Text style={styles.chartEmptyText}>No chart data available</Text>
            )}
          </View>
        </>
      )}
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Market Data</Text>
        
        <View style={styles.marketMetricsContainer}>
          <View style={styles.marketMetricItem}>
            <Text style={styles.marketMetricLabel}>Market Cap</Text>
            <Text style={styles.marketMetricValue}>{formatLargeNumber(marketCap)}</Text>
          </View>
          
          <View style={styles.marketMetricItem}>
            <Text style={styles.marketMetricLabel}>FDV</Text>
            <Text style={styles.marketMetricValue}>{formatLargeNumber(fdv)}</Text>
          </View>
          
          <View style={styles.marketMetricItem}>
            <Text style={styles.marketMetricLabel}>Liquidity</Text>
            <Text style={styles.marketMetricValue}>{liquidityScore.toFixed(2)}%</Text>
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Current Price</Text>
          <Text style={styles.detailValue}>
            {timeframePrice ? `$${timeframePrice.toFixed(6)}` : 'N/A'}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>24h Change</Text>
          <Text style={[
            styles.detailValue, 
            timeframeChangePercent > 0 ? styles.positiveChange : 
            timeframeChangePercent < 0 ? styles.negativeChange : {}
          ]}>
            {timeframeChangePercent > 0 ? '+' : ''}{timeframeChangePercent.toFixed(2)}%
          </Text>
        </View>
        
        {/* Additional Helius price data if available */}
        {heliusTokenData?.token_info?.price_info && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Recent Price</Text>
            <Text style={styles.detailValue}>
              ${heliusTokenData.token_info.price_info.price_per_token?.toFixed(6) || 'N/A'}
            </Text>
          </View>
        )}
        
        {tokenData?.extensions?.coingeckoId && (
          <>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Coingecko ID</Text>
              <Text style={styles.detailValue}>{tokenData.extensions.coingeckoId}</Text>
            </View>
            <TouchableOpacity
              style={styles.coingeckoButton}
              onPress={() => Linking.openURL(`https://www.coingecko.com/en/coins/${tokenData.extensions.coingeckoId}`)}
            >
              <Text style={styles.coingeckoButtonText}>View on Coingecko</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>
      
      <View style={styles.drawer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.handle} />
          
          <View style={styles.headerContent}>
            {/* Logo and name */}
            <View style={styles.tokenInfo}>
              <Image
                source={{ 
                  uri: tokenData?.logoURI || initialData?.logoURI || 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png'
                }}
                style={styles.tokenLogo}
                defaultSource={require('../../../assets/images/SENDlogo.png')}
              />
              <View>
                <Text style={styles.tokenSymbol}>
                  {tokenData?.symbol || initialData?.symbol || ''}
                </Text>
                <Text style={styles.tokenName}>
                  {tokenData?.name || initialData?.name || 'Loading...'}
                </Text>
              </View>
            </View>
            
            {/* Close button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Loading state */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1d9bf0" />
            <Text style={styles.loadingText}>Loading token details...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={fetchTokenDetails}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Price info with change percentage */}
            {timeframePrice ? (
              <View style={styles.priceContainer}>
                <Text style={styles.priceValue}>${timeframePrice.toFixed(4)}</Text>
                {timeframeChangePercent !== 0 && (
                  <Text style={[
                    styles.priceChange, 
                    timeframeChangePercent > 0 ? styles.positiveChange : styles.negativeChange
                  ]}>
                    {timeframeChangePercent > 0 ? '↑' : '↓'} {Math.abs(timeframeChangePercent).toFixed(2)}%
                  </Text>
                )}
              </View>
            ) : null}
            
            {/* Tab navigation */}
            {renderTabButtons()}
            
            {/* Tab content */}
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'market' && renderMarketTab()}
          </>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: height * 0.85,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  header: {
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tokenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#F0F0F0',
  },
  tokenSymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  tokenName: {
    fontSize: 14,
    color: '#666666',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#333333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  miniLoadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  priceContainer: {
    marginVertical: 16,
    alignItems: 'center',
  },
  priceValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
  },
  priceChange: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  positiveChange: {
    color: '#00C851',
  },
  negativeChange: {
    color: '#FF3B30',
  },
  tabContainer: {
    flexDirection: 'row',
    marginVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  tabText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  tagsContainer: {
    flex: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  tagPill: {
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 4,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#007AFF',
  },
  linkText: {
    color: '#007AFF',
  },
  explorerButton: {
    backgroundColor: '#000000',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 16,
  },
  explorerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  timeframeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  timeframeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  activeTimeframeButton: {
    backgroundColor: '#E6F2FF',
  },
  timeframeText: {
    fontSize: 14,
    color: '#666666',
  },
  activeTimeframeText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  chartContainer: {
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  chartEmptyText: {
    color: '#999999',
    fontSize: 14,
  },
  marketMetricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  marketMetricItem: {
    alignItems: 'center',
  },
  marketMetricLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  marketMetricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  statsSummaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  coingeckoButton: {
    backgroundColor: '#8DC647',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  coingeckoButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  }
});

export default TokenDetailsDrawer; 