import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  ActivityIndicator,
  ScrollView,
  Linking,
  Dimensions,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { fetchJupiterTokenData } from '../../../utils/tokenUtils';
import { useCoingecko, Timeframe } from '../../../hooks/useCoingecko';
import LineGraph from '../TradeCard/LineGraph';
import { fetchUserAssets } from '../../../utils/common/fetch';
import { styles } from './TokenDetailsDrawer.styles';

const { width } = Dimensions.get('window');

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

const formatLargeNumber = (num: number): string => {
  if (num === null || num === undefined || isNaN(num)) return 'N/A';
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(2)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
};

const formatTokenAmount = (amount: number, decimals: number): string => {
  if (isNaN(amount) || isNaN(decimals)) return '0';
  const tokenAmount = amount / Math.pow(10, decimals);
  if (tokenAmount < 0.001 && tokenAmount > 0)
    return tokenAmount.toExponential(4);
  if (tokenAmount >= 1000) return tokenAmount.toFixed(2);
  if (tokenAmount >= 1) return tokenAmount.toFixed(4);
  return tokenAmount.toFixed(6);
};

const TokenDetailsDrawer: React.FC<TokenDetailsDrawerProps> = ({
  visible,
  onClose,
  tokenMint,
  loading,
  initialData,
}) => {
  const [tokenData, setTokenData] = useState<any>(null);
  const [heliusTokenData, setHeliusTokenData] = useState<any>(null);
  const [loadingTokenData, setLoadingTokenData] = useState(false);
  const [loadingHelius, setLoadingHelius] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'market'>('overview');

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
    timeframeChangePercent,
  } = useCoingecko();

  const isLoading = loading || loadingTokenData;

  useEffect(() => {
    if (visible && tokenMint) {
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
      setError('Failed to load token details');
    } finally {
      setLoadingTokenData(false);
    }
  };

  const fetchHeliusData = async () => {
    if (!tokenMint) return;
    setLoadingHelius(true);
    try {
      const dummyWallet = '11111111111111111111111111111111';
      const result = await fetchUserAssets(dummyWallet);
      const tokenInfo = result.items.find(
        (item: any) => item.id === tokenMint || item.mint === tokenMint,
      );
      if (tokenInfo) {
        setHeliusTokenData(tokenInfo);
      }
    } catch (err) {
      // handle error if needed
    } finally {
      setLoadingHelius(false);
    }
  };

  const openExplorer = () => {
    Linking.openURL(`https://solscan.io/token/${tokenMint}`);
  };

  const openTensor = () => {
    const base = 'https://www.tensor.trade';
    if (initialData?.isCollection) {
      const slug = initialData.collectionData?.slugDisplay || tokenMint;
      Linking.openURL(`${base}/trade/${slug}`);
    } else {
      Linking.openURL(`${base}/item/${tokenMint}`);
    }
  };

  const openMagicEden = () => {
    const base = 'https://magiceden.io';
    if (initialData?.isCollection) {
      const slug = initialData.collectionData?.slugMe || tokenMint;
      Linking.openURL(`${base}/marketplace/${slug}`);
    } else {
      Linking.openURL(`${base}/item-details/${tokenMint}`);
    }
  };

  const renderTabButtons = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === 'overview' && styles.activeTabButton,
        ]}
        onPress={() => setActiveTab('overview')}>
        <Text
          style={[
            styles.tabText,
            activeTab === 'overview' && styles.activeTabText,
          ]}>
          Overview
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === 'market' && styles.activeTabButton,
        ]}
        onPress={() => setActiveTab('market')}>
        <Text
          style={[
            styles.tabText,
            activeTab === 'market' && styles.activeTabText,
          ]}>
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
          onPress={() => setTimeframe(tf)}>
          <Text
            style={[
              styles.timeframeText,
              timeframe === tf && styles.activeTimeframeText,
            ]}>
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
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}>
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
                    <View style={styles.statBox}>
                      <Text style={styles.collectionStatLabel}>Listed</Text>
                      <Text style={styles.collectionStatValue}>
                        {initialData.collectionData.stats.numListed || '0'}
                      </Text>
                      <Text style={styles.statSubValue}>
                        {initialData.collectionData.stats.pctListed?.toFixed(
                          1,
                        ) || '0'}
                        %
                      </Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.collectionStatLabel}>24h Vol</Text>
                      <Text style={styles.collectionStatValue}>
                        {(
                          parseFloat(
                            initialData.collectionData.stats.volume24h || '0',
                          ) / 1_000_000_000
                        ).toFixed(1)}{' '}
                        SOL
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
                      {(
                        parseFloat(initialData.collectionData.stats.volume24h) /
                        1_000_000_000
                      ).toFixed(2)}{' '}
                      SOL
                    </Text>
                  </View>
                )}

                {initialData.collectionData.stats?.volume7d && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>7d Volume</Text>
                    <Text style={styles.detailValue}>
                      {(
                        parseFloat(initialData.collectionData.stats.volume7d) /
                        1_000_000_000
                      ).toFixed(2)}{' '}
                      SOL
                    </Text>
                  </View>
                )}

                {initialData.collectionData.stats?.volumeAll && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Total Volume</Text>
                    <Text style={styles.detailValue}>
                      {(
                        parseFloat(initialData.collectionData.stats.volumeAll) /
                        1_000_000_000
                      ).toFixed(2)}{' '}
                      SOL
                    </Text>
                  </View>
                )}

                {initialData.collectionData.stats?.numListed && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Listed</Text>
                    <Text style={styles.detailValue}>
                      {initialData.collectionData.stats.numListed} (
                      {initialData.collectionData.stats.pctListed?.toFixed(2)}%)
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
                  <View style={[styles.detailRow, { height: 44, alignItems: 'center' }]}>
                    <Text style={styles.detailLabel}>Discord</Text>
                    <TouchableOpacity
                      onPress={() =>
                        Linking.openURL(initialData.collectionData.discord)
                      }
                      style={{ flexShrink: 0, alignSelf: 'center' }}>
                      <Text style={[styles.detailValue, { color: '#5865F2', minWidth: 100, textAlign: 'right' }, styles.noWrap]}>
                        Join Discord
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {initialData.collectionData.twitter && (
                  <View style={[styles.detailRow, { height: 44, alignItems: 'center' }]}>
                    <Text style={styles.detailLabel}>Twitter</Text>
                    <TouchableOpacity
                      onPress={() =>
                        Linking.openURL(initialData.collectionData.twitter)
                      }
                      style={{ flexShrink: 0, alignSelf: 'center' }}>
                      <Text
                        style={[
                          styles.detailValue,
                          { color: '#1DA1F2', minWidth: 100, textAlign: 'right' },
                          styles.noWrap
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
                  <View style={[styles.detailRow, { height: 44, alignItems: 'center' }]}>
                    <Text style={styles.detailLabel}>Website</Text>
                    <TouchableOpacity
                      onPress={() =>
                        Linking.openURL(initialData.collectionData.website)
                      }
                      style={{ flexShrink: 0, alignSelf: 'center' }}>
                      <Text
                        style={[
                          styles.detailValue,
                          { color: '#007AFF', minWidth: 100, textAlign: 'right' },
                          styles.noWrap
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
                      #{initialData.nftData.rarityRankTN} of{' '}
                      {initialData.nftData.numMints || '?'}
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
                    <Text style={[styles.detailValue, { color: '#00C851' }]}>
                      {(
                        parseFloat(initialData.nftData.listing.price) /
                        1_000_000_000
                      ).toFixed(2)}{' '}
                      SOL
                    </Text>
                  </View>
                )}

                {initialData.nftData.lastSale?.price && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Last Sale</Text>
                    <Text style={styles.detailValue}>
                      {(
                        parseFloat(initialData.nftData.lastSale.price) /
                        1_000_000_000
                      ).toFixed(2)}{' '}
                      SOL
                    </Text>
                  </View>
                )}

                {initialData.nftData.attributes &&
                  initialData.nftData.attributes.length > 0 && (
                    <View style={styles.attributesContainer}>
                      <Text
                        style={[
                          styles.sectionTitle,
                          { marginTop: 16, marginBottom: 8 },
                        ]}>
                        Attributes
                      </Text>
                      {initialData.nftData.attributes.map(
                        (attr: any, idx: number) => (
                          <View key={idx} style={styles.attributeItem}>
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
                    { backgroundColor: '#E6F9FA', width: '48%', minWidth: 160 },
                  ]}
                  onPress={openTensor}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text
                      style={[
                        styles.marketplaceButtonText,
                        { color: '#32D4DE' },
                        styles.noWrap
                      ]}>
                      View on Tensor
                    </Text>
                    <FontAwesome5
                      name="external-link-alt"
                      size={12}
                      color="#32D4DE"
                      style={{ marginLeft: 4 }}
                    />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.marketplaceButton,
                    { backgroundColor: '#FCEDF4', width: '48%', minWidth: 160 },
                  ]}
                  onPress={openMagicEden}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text
                      style={[
                        styles.marketplaceButtonText,
                        { color: '#E42575' },
                        styles.noWrap
                      ]}>
                      View on Magic Eden
                    </Text>
                    <FontAwesome5
                      name="external-link-alt"
                      size={12}
                      color="#E42575"
                      style={{ marginLeft: 4 }}
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
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}>
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
            <Text
              style={styles.detailValue}
              numberOfLines={1}
              ellipsizeMode="middle">
              {tokenMint}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Decimals</Text>
            <Text style={styles.detailValue}>{tokenData?.decimals ?? '-'}</Text>
          </View>

          {heliusTokenData?.token_info && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Token Standard</Text>
              <Text style={styles.detailValue}>
                {heliusTokenData.token_info.token_program ===
                  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
                  ? 'SPL Token'
                  : heliusTokenData.token_info.token_program}
              </Text>
            </View>
          )}

          {tokenData?.tags && tokenData.tags.length > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tags</Text>
              <View style={styles.tagsContainer}>
                {tokenData.tags.map((tag: string, idx: number) => (
                  <View key={idx} style={styles.tagPill}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {tokenData?.extensions?.website && (
            <View style={[styles.detailRow, { height: 44, alignItems: 'center' }]}>
              <Text style={styles.detailLabel}>Website</Text>
              <TouchableOpacity
                style={{ flexShrink: 0, alignSelf: 'center' }}
                onPress={() => Linking.openURL(tokenData.extensions.website)}>
                <Text
                  style={[styles.detailValue, styles.linkText, styles.noWrap, { minWidth: 100, textAlign: 'right' }]}
                  numberOfLines={1}>
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
              <Text
                style={[
                  styles.statValue,
                  timeframeChangePercent > 0
                    ? styles.positiveChange
                    : timeframeChangePercent < 0
                      ? styles.negativeChange
                      : {},
                ]}>
                {timeframeChangePercent > 0 ? '+' : ''}
                {timeframeChangePercent.toFixed(2)}%
              </Text>
            </View>

            <View style={styles.statItem}>
            <Text style={styles.statLabel}>Market Cap</Text>

              <Text style={[styles.statValue, styles.statValueText]}>
                {formatLargeNumber(marketCap)}
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity style={[styles.explorerButton, { minWidth: 150 }]} onPress={openExplorer}>
          <Text style={[styles.explorerButtonText, styles.noWrap]}>View on Solscan</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderMarketTab = () => (
    <ScrollView
      style={styles.tabContent}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}>
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
          <Text
            style={[
              styles.detailValue,
              timeframeChangePercent > 0
                ? styles.positiveChange
                : timeframeChangePercent < 0
                  ? styles.negativeChange
                  : {},
            ]}>
            {timeframeChangePercent > 0 ? '+' : ''}
            {timeframeChangePercent.toFixed(2)}%
          </Text>
        </View>

        {heliusTokenData?.token_info?.price_info && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Recent Price</Text>
            <Text style={styles.detailValue}>
              $
              {heliusTokenData.token_info.price_info.price_per_token?.toFixed(
                6,
              ) || 'N/A'}
            </Text>
          </View>
        )}

        {tokenData?.extensions?.coingeckoId && (
          <>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Coingecko ID</Text>
              <Text style={styles.detailValue}>
                {tokenData.extensions.coingeckoId}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.coingeckoButton, { minWidth: 150 }]}
              onPress={() =>
                Linking.openURL(
                  `https://www.coingecko.com/en/coins/${tokenData.extensions.coingeckoId}`,
                )
              }>
              <Text style={[styles.coingeckoButtonText, styles.noWrap]}>View on Coingecko</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay} />
      </TouchableWithoutFeedback>

      <View style={styles.drawerContainer}>
        <View style={styles.drawerHeader}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>{'\u2715'}</Text>
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
            style={
              initialData?.isCollection || initialData?.nftData
                ? styles.nftImage
                : styles.tokenImage
            }
            resizeMode="cover"
          />
          <View style={styles.tokenNameContainer}>
            <Text style={styles.tokenName} numberOfLines={2}>
              {initialData?.name ||
                tokenData?.name ||
                initialData?.symbol ||
                tokenData?.symbol ||
                'Unknown Token'}
            </Text>
            {!initialData?.isCollection && !initialData?.nftData && (
              <Text style={styles.tokenSymbol}>
                {tokenData?.symbol || initialData?.symbol || ''}
              </Text>
            )}
            {timeframePrice &&
              !initialData?.isCollection &&
              !initialData?.nftData && (
                <View style={styles.priceContainer}>
                  <Text style={styles.tokenPrice}>
                    {timeframePrice ? `$${timeframePrice.toFixed(4)}` : '$0.00'}
                  </Text>
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
                    ]}>
                    {timeframeChangePercent > 0 ? '+' : ''}
                    {timeframeChangePercent.toFixed(2)}%
                  </Text>
                </View>
              )}
          </View>
        </View>

        {!initialData?.isCollection && !initialData?.nftData ? (
          <>
            {renderTabButtons()}
            {activeTab === 'overview' ? renderOverviewTab() : renderMarketTab()}
          </>
        ) : (
          renderOverviewTab()
        )}
      </View>
    </Modal>
  );
};

export default TokenDetailsDrawer;
