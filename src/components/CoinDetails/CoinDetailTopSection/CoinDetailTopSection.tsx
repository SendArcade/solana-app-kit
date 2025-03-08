// File: src/components/CoinDetails/CoinDetailTopSection/CoinDetailTopSection.tsx
import React, {useState} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  ViewStyle,
  StyleProp,
  ActivityIndicator,
} from 'react-native';
import {FlatList} from 'react-native-gesture-handler';
import Icons from '../../../assets/svgs/index';
import {defaultTopSectionStyles} from './CoinDetailTopSection.style';
import SuggestionsCard from '../suggestionsCard/suggestionsCard';
import Tweet from '../tweet/tweet';
import LineGraph from './LineGraph';
import {Timeframe, useCoinGeckoData} from '../../../hooks/useCoinGeckoData';
import {
  formatAmount,
  formatLiquidityAsPercentage,
} from '../../../utils/common/format';
import {CoinDetailSearchBar} from '../CoinDetailSearchBar/CoinDetailSearchBar';

/**
 * Props for custom styling
 */
export interface CoinDetailTopSectionCustomStyles {
  container?: StyleProp<ViewStyle>;
}

/**
 * Props for the component
 */
interface CoinDetailTopSectionProps {
  tweetData: Array<{
    username: string;
    handle: string;
    time: string;
    tweetContent: string;
    quoteCount: number;
    retweetCount: number;
    reactionCount: number;
    avatar: any;
  }>;
  customStyles?: CoinDetailTopSectionCustomStyles;
}

/**
 * Main component for coin details top section.
 * Now includes a search bar that lets users pick a coin from CoinGecko's list.
 * Once a coin is selected, the entire area updates to show that coin's data.
 */
export const CoinDetailTopSection: React.FC<CoinDetailTopSectionProps> = ({
  tweetData,
  customStyles = {},
}) => {
  // State for the selected coin ID
  // Default to "bitcoin" as a fallback
  const [selectedCoinId, setSelectedCoinId] = useState<string>('bitcoin');

  // Use the coin gecko data for the selected coin
  const {
    timeframe,
    setTimeframe,
    graphData,
    timeframePrice,
    timeframeChangeUsd,
    timeframeChangePercent,
    marketCap,
    liquidityScore,
    fdv,
    loadingOHLC,
    error,
    coinName,
    coinImage,
  } = useCoinGeckoData(selectedCoinId);

  // For the modal
  const [modalVisible, setModalVisible] = useState(false);

  const styles = defaultTopSectionStyles;

  // Example for “recently bought” suggestions
  const cardData = Array(10).fill({});

  const renderCard = () => <SuggestionsCard />;

  // Timeframe selection
  const handleTimeframeChange = (tf: Timeframe) => {
    setTimeframe(tf);
  };

  // Format the timeframe-based price
  const displayedPrice = `$${timeframePrice.toFixed(6)}`;

  // Format the absolute change (timeframeChangeUsd)
  let absChangeStr =
    timeframeChangeUsd >= 0
      ? `+$${timeframeChangeUsd.toFixed(6)}`
      : `-$${Math.abs(timeframeChangeUsd).toFixed(6)}`;

  // Format the % change
  let pctChangeStr =
    timeframeChangePercent >= 0
      ? `+${timeframeChangePercent.toFixed(2)}%`
      : `-${Math.abs(timeframeChangePercent).toFixed(2)}%`;

  return (
    <View style={[styles.container, customStyles.container]}>
      {/* Coin Search Bar */}
      {/* <View style={{width: '90%', alignSelf: 'center', paddingTop: 16}}> */}
        <CoinDetailSearchBar
          onSelectCoinId={(coinId: string) => setSelectedCoinId(coinId)}
        />
      {/* </View> */}

      {/* If there's an error fetching data for the selected coin, show it. */}
      {error && (
        <Text style={{color: 'red', paddingHorizontal: 16}}>
          Error: {error}
        </Text>
      )}

      <ScrollView>
        <View style={styles.content}>
          {/* Coin Basic Info (uses coin image and name from API) */}
          <View style={styles.coin}>
            {coinImage ? (
              <Image source={{uri: coinImage}} style={styles.avatar} />
            ) : null}
            <Text style={styles.coinText}>
              {coinName || 'Select a coin to load...'}
            </Text>
          </View>

          {/* Price Section with overlay spinner for OHLC loading */}
          <View style={styles.priceContainer}>
            <Text style={styles.mainPrice}>{displayedPrice}</Text>
            <View style={styles.statsContainer}>
              <Text style={styles.statsText}>{absChangeStr}</Text>
              <Text style={styles.statsTextPercentage}>{pctChangeStr}</Text>
            </View>
            {loadingOHLC && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#318EF8" />
              </View>
            )}
          </View>

          {/* Graph Section */}
          <View style={styles.graphSection}>
            <LineGraph data={graphData} />
            <View style={styles.timeframeButtons}>
              {(['1H', '1D', '1W', '1M', 'All'] as const).map(tf => (
                <TouchableOpacity
                  key={tf}
                  style={[
                    styles.timeButton,
                    timeframe === tf && styles.activeTimeButton,
                  ]}
                  onPress={() => handleTimeframeChange(tf)}>
                  <Text
                    style={[
                      styles.timeButtonText,
                      timeframe === tf && styles.activeTimeButtonText,
                    ]}>
                    {tf}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Market Stats (always rendered once loaded) */}
          <View style={styles.marketStatsContainer}>
            <View style={styles.marketStatItem}>
              <Text style={styles.marketStatLabel}>Market Cap</Text>
              <Text style={styles.marketStatValue}>
                {formatAmount(marketCap)}
              </Text>
            </View>
            <View style={styles.marketStatItem}>
              <Text style={styles.marketStatLabel}>Liquidity</Text>
              <Text style={styles.marketStatValue}>
                {formatLiquidityAsPercentage(liquidityScore)}
              </Text>
            </View>
            <View style={styles.marketStatItem}>
              <Text style={styles.marketStatLabel}>FDV</Text>
              <Text style={styles.marketStatValue}>{formatAmount(fdv)}</Text>
            </View>
          </View>

          {/* Swap / Send Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.swapButton}>
              <Icons.SwapIcon width={24} height={24} />
              <Text style={styles.swapButtonText}>Swap</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sendButton}>
              <Icons.Arrow width={24} height={24} fill="transparent" />
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>

          {/* About */}
          <View>
            <View style={styles.holdersHeader}>
              <Icons.infoIcon />
              <Text style={styles.holdersTitle}>About</Text>
            </View>
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionText}>
                {coinName
                  ? `About ${coinName} - This is an example placeholder text.`
                  : 'Search and select a coin to see more info.'}
              </Text>
              <TouchableOpacity style={styles.showMoreButton}>
                <Text style={styles.showMoreText}>Show more</Text>
                <Icons.ArrowDown />
              </TouchableOpacity>
            </View>
          </View>

          {/* People who recently bought coin (example data) */}
          <View style={styles.content}>
            <View style={styles.holdersHeader}>
              <Icons.infoIcon width={24} height={24} />
              <Text style={styles.holdersTitle}>
                People who recently bought {coinName || '...'}
              </Text>
            </View>
          </View>
          <View>
            <FlatList
              horizontal
              data={cardData}
              renderItem={renderCard}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardList}
            />
          </View>

          <View style={styles.borderLine} />

          {/* Tweets */}
          <View style={styles.tweetSection}>
            <Tweet data={tweetData} />
          </View>
        </View>
      </ScrollView>

      {/* Modal for expanded view */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={e => e.stopPropagation()}
            style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                {coinImage ? (
                  <Image source={{uri: coinImage}} style={styles.modalAvatar} />
                ) : null}
                <View style={styles.modalHeaderTexts}>
                  <Text style={styles.modalTitle}>
                    {coinName || 'Loading...'}
                  </Text>
                  <Text style={styles.modalSubtitle}>{displayedPrice}</Text>
                </View>
              </View>
              <View style={styles.modalHeaderRight}>
                <View style={styles.modalPriceInfo}>
                  <Text style={styles.modalPriceLabel}>
                    {`${timeframe} Price`}
                  </Text>
                  <Text style={styles.modalPriceChange}>{pctChangeStr}</Text>
                </View>
              </View>
            </View>

            {/* Chart in Modal */}
            <LineGraph
              data={graphData}
              width={Dimensions.get('window').width - 72}
            />

            <View style={styles.modalButtonsStack}>
              <TouchableOpacity style={styles.modalTopButton}>
                <View style={styles.modalTopButtonContent}>
                  <Text style={styles.modalTopButtonText}>Held by</Text>
                  <View style={styles.modalAvatarStack}>
                    {coinImage ? (
                      <Image
                        source={{uri: coinImage}}
                        style={styles.modalStackAvatar1}
                      />
                    ) : null}
                    <Image
                      source={require('../../../assets/images/thread-avatar-1.png')}
                      style={styles.modalStackAvatar2}
                    />
                    <Image
                      source={require('../../../assets/images/thread-avatar-2.png')}
                      style={styles.modalStackAvatar3}
                    />
                  </View>
                  <Text style={styles.modalHoldersCount}>+1.6k</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalBottomButton}>
                <Text style={styles.modalBottomButtonText}>
                  Get {coinName || '$COIN'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};
