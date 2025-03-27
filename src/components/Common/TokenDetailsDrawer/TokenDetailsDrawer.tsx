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
  loading?: boolean;
  initialData?: {
    symbol?: string;
    name?: string;
    logoURI?: string;
    isCollection?: boolean;
    collectionData?: any;
    nftData?: any;
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

  if (tokenAmount < 0.001 && tokenAmount > 0) {
    return tokenAmount.toExponential(4);
  }

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
  loading,
  initialData,
}) => {
  const [tokenData, setTokenData] = useState<any>(null);
  const [loadingTokenData, setLoadingTokenData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'market'>('overview');
  const [heliusTokenData, setHeliusTokenData] = useState<any>(null);
  const [loadingHelius, setLoadingHelius] = useState(false);

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

  // Show loading overlay if explicitly set or when fetching data
  const isLoading = loading || loadingTokenData;

  useEffect(() => {
    if (visible && tokenMint) {
      // Only fetch Jupiter token data if not an NFT or collection
      if (!initialData?.isCollection && !initialData?.nftData) {
        fetchTokenDetails();
      }
      fetchHeliusData();
    }
  }, [visible, tokenMint, initialData]);

  const fetchTokenDetails = async () => {
    setLoadingTokenData(true);
    setError(null);

    try {
      const data = await fetchJupiterTokenData(tokenMint);

      if (data) {
        setTokenData(data);

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
      setLoadingTokenData(false);
    }
  };

  const fetchHeliusData = async () => {
    if (!tokenMint) return;

    setLoadingHelius(true);
    try {
      const dummyWallet = "11111111111111111111111111111111";
      const result = await fetchUserAssets(dummyWallet);

      const tokenInfo = result.items.find((item: any) =>
        item.id === tokenMint || item.mint === tokenMint
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

  const openTensor = () => {
    const url = initialData?.isCollection
      ? `https://www.tensor.trade/trade/${initialData?.collectionData?.slugDisplay || tokenMint}`
      : `https://www.tensor.trade/item/${tokenMint}`;
    Linking.openURL(url);
  };

  const openMagicEden = () => {
    const url = initialData?.isCollection
      ? `https://magiceden.io/marketplace/${initialData?.collectionData?.slugMe || tokenMint}`
      : `https://magiceden.io/item-details/${tokenMint}`;
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

  const renderOverviewTab = () => {
    const isNftOrCollection = initialData?.isCollection || initialData?.nftData;

    if (isNftOrCollection) {
      return (
        <ScrollView
          style={styles.tabContent}
          contentContainerStyle={{flexGrow: 1, paddingBottom: 40}}
          showsVerticalScrollIndicator={true}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.sectionText}>
              {initialData?.isCollection
                ? initialData?.collectionData?.description ||
                  'No description available.'
                : initialData?.nftData?.description ||
                  'No description available.'}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {initialData?.isCollection ? 'Collection Details' : 'NFT Details'}
            </Text>

            {initialData?.isCollection && initialData?.collectionData && (
              <>
                {initialData.collectionData.stats && (
                  <View style={styles.collectionStatsContainer}>
                    <View style={styles.statBox}>
                      <Text style={styles.collectionStatLabel}>Floor</Text>
                      <Text style={styles.collectionStatValue}>
                        {initialData.collectionData.floorPrice?.toFixed(2)} SOL
                      </Text>
                    </View>

                    {/* <View style={styles.statBox}>
                      <Text style={styles.collectionStatLabel}>Items</Text>
                      <Text style={styles.collectionStatValue}>
                        {initialData.collectionData.numMints || initialData.collectionData.tokenCount || '?'}
                      </Text>
                    </View> */}

                    <View style={styles.statBox}>
                      <Text style={styles.collectionStatLabel}>Listed</Text>
                      <Text style={styles.collectionStatValue}>
                        {initialData.collectionData.stats.numListed || '0'}
                      </Text>
                      <Text style={styles.statSubValue}>
                        {initialData.collectionData.stats.pctListed?.toFixed(1) || '0'}%
                      </Text>
                    </View>

                    <View style={styles.statBox}>
                      <Text style={styles.collectionStatLabel}>24h Vol</Text>
                      <Text style={styles.collectionStatValue}>
                        {(parseFloat(initialData.collectionData.stats.volume24h || '0') / 1_000_000_000).toFixed(1)} SOL
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Address</Text>
                  <Text
                    style={styles.detailValue}
                    numberOfLines={1}
                    ellipsizeMode="middle">
                    {tokenMint}
                  </Text>
                </View>

                {initialData.collectionData.tokenCount && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Items</Text>
                    <Text style={styles.detailValue}>
                      {initialData.collectionData.numMints ||
                        initialData.collectionData.tokenCount}
                    </Text>
                  </View>
                )}

                {initialData.collectionData.floorPrice && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Floor Price</Text>
                    <Text style={styles.detailValue}>
                      {initialData.collectionData.floorPrice.toFixed(2)} SOL
                    </Text>
                  </View>
                )}

                {initialData.collectionData.stats?.volume24h && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>24h Volume</Text>
                    <Text style={styles.detailValue}>
                      {(parseFloat(initialData.collectionData.stats.volume24h) / 1_000_000_000).toFixed(2)} SOL
                    </Text>
                  </View>
                )}

                {initialData.collectionData.stats?.volume7d && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>7d Volume</Text>
                    <Text style={styles.detailValue}>
                      {(parseFloat(initialData.collectionData.stats.volume7d) / 1_000_000_000).toFixed(2)} SOL
                    </Text>
                  </View>
                )}

                {initialData.collectionData.stats?.volumeAll && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Total Volume</Text>
                    <Text style={styles.detailValue}>
                      {(parseFloat(initialData.collectionData.stats.volumeAll) / 1_000_000_000).toFixed(2)} SOL
                    </Text>
                  </View>
                )}

                {initialData.collectionData.stats?.numListed && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Listed</Text>
                    <Text style={styles.detailValue}>
                      {initialData.collectionData.stats.numListed} ({initialData.collectionData.stats.pctListed?.toFixed(2)}%)
                    </Text>
                  </View>
                )}

                {initialData.collectionData.stats?.salesAll && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Total Sales</Text>
                    <Text style={styles.detailValue}>
                      {initialData.collectionData.stats.salesAll}
                    </Text>
                  </View>
                )}

                {initialData.collectionData.tensorVerified && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Verified</Text>
                    <Text style={styles.detailValue}>✅ Tensor Verified</Text>
                  </View>
                )}

                {initialData.collectionData.discord && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Discord</Text>
                    <TouchableOpacity
                      onPress={() =>
                        Linking.openURL(initialData.collectionData.discord)
                      }>
                      <Text style={[styles.detailValue, {color: '#5865F2'}]}>
                        Join Discord
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {initialData.collectionData.twitter && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Twitter</Text>
                    <TouchableOpacity
                      onPress={() =>
                        Linking.openURL(initialData.collectionData.twitter)
                      }>
                      <Text
                        style={[
                          styles.detailValue,
                          {color: '#1DA1F2'},
                          styles.noWrap,
                        ]}>
                        @
                        {initialData.collectionData.twitter
                          .replace('https://www.twitter.com/', '')
                          .replace('https://twitter.com/', '')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {initialData.collectionData.website && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Website</Text>
                    <TouchableOpacity
                      onPress={() =>
                        Linking.openURL(initialData.collectionData.website)
                      }>
                      <Text
                        style={[
                          styles.detailValue,
                          {color: '#007AFF'},
                          styles.noWrap,
                        ]}>
                        Visit Website
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}

            {initialData?.nftData && (
              <>
                {initialData.nftData.collName && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Collection</Text>
                    <Text style={styles.detailValue}>
                      {initialData.nftData.collName}
                    </Text>
                  </View>
                )}

                {initialData.nftData.rarityRankTN && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Rarity Rank</Text>
                    <Text style={styles.detailValue}>
                      #{initialData.nftData.rarityRankTN} of {initialData.nftData.numMints || '?'}
                    </Text>
                  </View>
                )}

                {initialData.nftData.owner && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Owner</Text>
                    <Text
                      style={styles.detailValue}
                      numberOfLines={1}
                      ellipsizeMode="middle">
                      {initialData.nftData.owner}
                    </Text>
                  </View>
                )}

                {initialData.nftData.listing?.price && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Listed Price</Text>
                    <Text style={[styles.detailValue, {color: '#00C851'}]}>
                      {(parseFloat(initialData.nftData.listing.price) / 1_000_000_000).toFixed(2)} SOL
                    </Text>
                  </View>
                )}

                {initialData.nftData.lastSale?.price && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Last Sale</Text>
                    <Text style={styles.detailValue}>
                      {(parseFloat(initialData.nftData.lastSale.price) / 1_000_000_000).toFixed(2)} SOL
                    </Text>
                  </View>
                )}

                {initialData.nftData.attributes &&
                  initialData.nftData.attributes.length > 0 && (
                    <View style={styles.attributesContainer}>
                      <Text
                        style={[
                          styles.sectionTitle,
                          {marginTop: 16, marginBottom: 8},
                        ]}>
                        Attributes
                      </Text>
                      {initialData.nftData.attributes.map(
                        (attr: any, index: number) => (
                          <View key={index} style={styles.attributeItem}>
                            <Text style={styles.attributeLabel}>
                              {attr.trait_type}
                            </Text>
                            <Text style={styles.attributeValue}>
                              {attr.value}
                            </Text>
                          </View>
                        ),
                      )}
                    </View>
                  )}
              </>
            )}

            {(initialData?.isCollection || initialData?.nftData) && (
              <View style={styles.marketplacesContainer}>
                <TouchableOpacity
                  style={[
                    styles.marketplaceButton,
                    {backgroundColor: '#E6F9FA', width: '48%'},
                  ]}
                  onPress={openTensor}>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Text
                      style={[
                        styles.marketplaceButtonText,
                        {color: '#32D4DE'},
                      ]}>
                      View on Tensor
                    </Text>
                    <FontAwesome5
                      name="external-link-alt"
                      size={12}
                      color="#32D4DE"
                      style={{marginLeft: 4}}
                    />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.marketplaceButton,
                    {backgroundColor: '#FCEDF4', width: '48%'},
                  ]}
                  onPress={openMagicEden}>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Text
                      style={[
                        styles.marketplaceButtonText,
                        {color: '#E42575'},
                      ]}>
                      View on Magic Eden
                    </Text>
                    <FontAwesome5
                      name="external-link-alt"
                      size={12}
                      color="#E42575"
                      style={{marginLeft: 4}}
                    />
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      );
    }

    return (
      <ScrollView
        style={styles.tabContent}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        showsVerticalScrollIndicator={true}
      >
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
                <Text style={[styles.detailValue, styles.linkText, styles.noWrap]} numberOfLines={1}>
                  {tokenData.extensions.website}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {timeframePrice > 0 && (
          <View style={styles.statsSummaryContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Price</Text>
              <Text style={styles.statValue}>
                {timeframePrice > 0 ? `$${timeframePrice.toFixed(4)}` : 'N/A'}
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statLabel}>24h Change</Text>
              <Text style={[
                styles.statValue,
                timeframeChangePercent > 0 ? styles.positiveChange :
                  timeframeChangePercent < 0 ? styles.negativeChange : {}
              ]}>
                {timeframeChangePercent > 0 ? '+' : ''}
                {timeframeChangePercent.toFixed(2)}
                %
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statValue, styles.statValueText]} numberOfLines={1} ellipsizeMode="tail">
                {formatLargeNumber(marketCap)}
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.explorerButton} onPress={openExplorer}>
          <Text style={styles.explorerButtonText}>View on Solscan</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderMarketTab = () => (
    <ScrollView
      style={styles.tabContent}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
      showsVerticalScrollIndicator={true}
    >
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
            <Text style={styles.marketMetricValue}>
              {formatLargeNumber(marketCap)}
            </Text>
          </View>

          <View style={styles.marketMetricItem}>
            <Text style={styles.marketMetricLabel}>FDV</Text>
            <Text style={styles.marketMetricValue}>
              {formatLargeNumber(fdv)}
            </Text>
          </View>

          <View style={styles.marketMetricItem}>
            <Text style={styles.marketMetricLabel}>Liquidity</Text>
            <Text style={styles.marketMetricValue}>
              {liquidityScore.toFixed(2)}%
            </Text>
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
            {timeframeChangePercent > 0 ? '+' : ''}
            {timeframeChangePercent.toFixed(2)}
            %
          </Text>
        </View>

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
              <Text style={styles.detailValue}><Text>{tokenData.extensions.coingeckoId}</Text></Text>
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
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay} />
      </TouchableWithoutFeedback>

      <View style={styles.drawerContainer}>
        <View style={styles.drawerHeader}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#32D4DE" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}

        <View style={styles.tokenInfoContainer}>
          <Image
            source={
              initialData?.logoURI
                ? { uri: initialData.logoURI }
                : tokenData?.logoURI
                  ? { uri: tokenData.logoURI }
                  : require('../../../assets/images/SENDlogo.png')
            }
            style={initialData?.isCollection || initialData?.nftData ? styles.nftImage : styles.tokenImage}
            resizeMode="cover"
          />
          <View style={styles.tokenNameContainer}>
            <Text style={styles.tokenName} numberOfLines={2}>
              {initialData?.name || tokenData?.name || initialData?.symbol || tokenData?.symbol || 'Unknown Token'}
            </Text>
            {!initialData?.isCollection && !initialData?.nftData && (
              <Text style={styles.tokenSymbol}>
                {tokenData?.symbol || initialData?.symbol || ''}
              </Text>
            )}
            {timeframePrice && !initialData?.isCollection && !initialData?.nftData && (
              <View style={styles.priceContainer}>
                <Text style={styles.tokenPrice}>{timeframePrice ? `$${timeframePrice.toFixed(4)}` : '$0.00'}</Text>
                <Text
                  style={[
                    styles.priceChange,
                    {
                      color:
                        timeframeChangePercent > 0
                          ? '#00C851'
                          : timeframeChangePercent < 0
                            ? '#FF5252'
                            : '#666666',
                    },
                  ]}
                >
                  {timeframeChangePercent > 0 ? '+' : ''}
                  {timeframeChangePercent.toFixed(2)}
                  %
                </Text>
              </View>
            )}
          </View>
        </View>

        {(!initialData?.isCollection && !initialData?.nftData) ? (
          <>
            {renderTabButtons()}
            {activeTab === 'overview' ? (
              renderOverviewTab()
            ) : (
              renderMarketTab()
            )}
          </>
        ) : (
          renderOverviewTab()
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.85,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  drawerContent: {
    paddingBottom: 20,
  },
  drawerHeader: {
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#333333',
  },
  statValueText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#14171A',
    flexShrink: 1,
    flexWrap: 'nowrap',
    textAlign: 'center',
  },


  tokenInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 8,
  },
  tokenImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#F0F0F0',
  },
  nftImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
    marginRight: 16,
    backgroundColor: '#F0F0F0',
  },
  tokenNameContainer: {
    flex: 1,
  },
  tokenName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  tokenSymbol: {
    fontSize: 14,
    color: '#666666',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  tokenPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginRight: 8,
  },
  priceChange: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    marginVertical: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#1d9bf0',
  },
  tabText: {
    fontSize: 16,
    color: '#999999',
  },
  activeTabText: {
    color: '#1d9bf0',
    fontWeight: '500',
  },
  tabContent: {
    // Removed flex: 1 here as contentContainerStyle handles the growth
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#000000',
  },
  sectionText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  timeframeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  timeframeButton: {
    padding: 8,
    borderRadius: 4,
  },
  activeTimeframeButton: {
    backgroundColor: '#E8F5FE',
  },
  timeframeText: {
    fontSize: 14,
    color: '#666666',
  },
  activeTimeframeText: {
    color: '#1d9bf0',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
  },
  detailValue: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  tokenStatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '31%',
    backgroundColor: '#F5F8FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#657786',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#14171A',
    flexShrink: 1,
    flexWrap: 'nowrap',
    textAlign: 'center',
  },
  explorerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 10,
    backgroundColor: '#E8F5FE',
    borderRadius: 8,
  },
  explorerButtonText: {
    color: '#4F8EF7',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagPill: {
    backgroundColor: '#E8F5FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: '#1d9bf0',
    fontSize: 12,
  },
  attributesContainer: {
    marginTop: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  attributeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  attributeLabel: {
    fontSize: 14,
    color: '#666666',
  },
  attributeValue: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  linkText: {
    color: '#007AFF',
  },
  statsSummaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  positiveChange: {
    color: '#00C851',
  },
  negativeChange: {
    color: '#FF5252',
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
  marketplacesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 10,
  },
  marketplaceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    width: '48%',
  },
  marketplaceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 20,
  },
  collectionStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statBox: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  collectionStatLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  collectionStatValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#14171A',
  },
  statSubValue: {
    fontSize: 12,
    color: '#666666',
  },
  noWrap: {
    flexShrink: 1,
    maxWidth: undefined,
    flexWrap: 'nowrap',
  },
});

export default TokenDetailsDrawer;
