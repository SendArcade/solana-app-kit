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
} from 'react-native';
import {FlatList} from 'react-native-gesture-handler';
import Icons from '../../../assets/svgs/index';
import {defaultTopSectionStyles} from './CoinDetailTopSection.style';
import SuggestionsCard from '../suggestionsCard/suggestionsCard';
import { DEFAULT_IMAGES } from '../../../config/constants';
import Tweet from '../tweet/tweet';
import LineGraph from './LineGraph';

type Timeframe = '1H' | '1D' | '1W' | '1M' | 'All';

export interface CoinDetailTopSectionCustomStyles {
  container?: StyleProp<ViewStyle>;
  // Additional style overrides can be added here
}

interface CoinDetailTopSectionProps {
  graphData: Record<Timeframe, number[]>;
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
  currentPrice?: string;
  customStyles?: CoinDetailTopSectionCustomStyles;
}

/**
 * This component displays the "Top" tab of the Coin Detail page,
 * including price info, a line graph, sample tweet data, and
 * a modal with expanded info.
 */
export const CoinDetailTopSection: React.FC<CoinDetailTopSectionProps> = ({
  graphData,
  tweetData,
  currentPrice = '$0.129585',
  customStyles = {},
}) => {
  // Change initial state from false to true to show the modal on page load
  const [modalVisible, setModalVisible] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1D');

  const cardData = Array(10).fill({});
  const styles = defaultTopSectionStyles;

  const renderCard = () => <SuggestionsCard />;

  return (
    <View style={[styles.container, customStyles.container]}>
      <ScrollView>
        {/* Content */}
        <View style={styles.content}>
          <View style={styles.coin}>
            <Image source={DEFAULT_IMAGES.SENDlogo} style={styles.avatar} />
            <Text style={styles.coinText}>$SEND</Text>
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.mainPrice}>{currentPrice}</Text>
            <View style={styles.statsContainer}>
              <Text style={styles.statsText}>+$0.021113</Text>
              <Text style={styles.statsTextPercentage}>+477%</Text>
            </View>
          </View>

          {/* Graph */}
          <View style={styles.graphSection}>
            <LineGraph data={graphData[selectedTimeframe]} />
            <View style={styles.timeframeButtons}>
              {(['1H', '1D', '1W', '1M', 'All'] as const).map(timeframe => (
                <TouchableOpacity
                  key={timeframe}
                  style={[
                    styles.timeButton,
                    selectedTimeframe === timeframe && styles.activeTimeButton,
                  ]}
                  onPress={() => setSelectedTimeframe(timeframe)}>
                  <Text
                    style={[
                      styles.timeButtonText,
                      selectedTimeframe === timeframe &&
                        styles.activeTimeButtonText,
                    ]}>
                    {timeframe}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.swapButton}>
              <Icons.SwapIcon width={24} height={24} />
              <Text style={styles.swapButtonText}>Swap</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sendButton}>
              <Icons.Arrow width={24} height={24} fill="white" />
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>

          {/* About Section */}
          <View>
            <View style={styles.holdersHeader}>
              <Icons.infoIcon />
              <Text style={styles.holdersTitle}>About</Text>
            </View>
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionText}>
                An Ecosystem token empowering the builders of Solana
              </Text>
              <TouchableOpacity style={styles.showMoreButton}>
                <Text style={styles.showMoreText}>Show more</Text>
                <Icons.ArrowDown />
              </TouchableOpacity>
            </View>
          </View>

          {/* People who bought SEND */}
          <View style={styles.content}>
            <View style={styles.holdersHeader}>
              <Icons.infoIcon width={24} height={24} />
              <Text style={styles.holdersTitle}>
                People who recently bought SEND
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

      {/* Modal */}
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
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Image
                  source={DEFAULT_IMAGES.SENDlogo}
                  style={styles.modalAvatar}
                />
                <View style={styles.modalHeaderTexts}>
                  <Text style={styles.modalTitle}>$SEND</Text>
                  <Text style={styles.modalSubtitle}>{currentPrice}</Text>
                </View>
              </View>
              <View style={styles.modalHeaderRight}>
                <View style={styles.modalPriceInfo}>
                  <Text style={styles.modalPriceLabel}>24h Price</Text>
                  <Text style={styles.modalPriceChange}>+477%</Text>
                </View>
              </View>
            </View>

            {/* Graph in Modal */}
            <LineGraph
              data={graphData[selectedTimeframe]}
              width={Dimensions.get('window').width - 72}
            />

            {/* Modal Buttons */}
            <View style={styles.modalButtonsStack}>
              <TouchableOpacity style={styles.modalTopButton}>
                <View style={styles.modalTopButtonContent}>
                  <Text style={styles.modalTopButtonText}>Held by</Text>
                  <View style={styles.modalAvatarStack}>
                    <Image
                      source={DEFAULT_IMAGES.SENDlogo}
                      style={styles.modalStackAvatar1}
                    />
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
                <Text style={styles.modalBottomButtonText}>Get $SEND</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};
