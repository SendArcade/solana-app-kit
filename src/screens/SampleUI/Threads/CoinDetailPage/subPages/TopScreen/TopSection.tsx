import React, { useState } from 'react'
import { View, Text, Image, TouchableOpacity, ScrollView, Modal, Dimensions } from 'react-native'
import { styles } from './TopSection.style'
import Icons from '../../../../../../assets/svgs/index'
import { FlatList } from 'react-native-gesture-handler'
import { SuggestionsCard, Tweet } from '../../../../../../components'
import LineGraph from './LineGraph'

const cardData = Array(10).fill({})
const tweetData = [
  {
    username: 'SendAI',
    handle: '@SendAI',
    time: '2h',
    tweetContent: 'Building the future of Solana with $SEND',
    quoteCount: 123,
    retweetCount: 456,
    reactionCount: 789,
    avatar: require('../../../../../../assets/images/Smiley.png'),
  },
  {
    username: 'SolanaBuilder',
    handle: '@SolanaBuilder',
    time: '4h',
    tweetContent:
      'Just bought more $SEND tokens! The ecosystem is growing fast 🚀',
    quoteCount: 245,
    retweetCount: 678,
    reactionCount: 912,
    avatar: require('../../../../../../assets/images/Smiley.png'),
  },
];



type Timeframe = '1H' | '1D' | '1W' | '1M' | 'All';

// Type the graphData object
const graphData: Record<Timeframe, number[]> = {
    '1H': [50, 48, 52, 51, 49, 53, 52, 50, 51, 52, 51, 53], // More subtle changes for hourly
    '1D': [45, 47, 46, 52, 50, 55, 58, 56, 60, 58, 62, 65], // Steady increase throughout the day
    '1W': [40, 45, 43, 48, 52, 50, 55, 58, 54, 60, 58, 63], // More volatility with overall upward trend
    '1M': [30, 35, 45, 42, 55, 52, 58, 65, 75, 72, 78, 85], // Significant growth over the month
    'All': [10, 15, 25, 35, 32, 45, 55, 65, 75, 85, 88, 95]  // Long-term exponential growth
}; 


export const TopScreen = () => {

    const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1D');
    const [modalVisible, setModalVisible] = useState(true);  // Add state for modal


    const renderCard = () => (
        <View style={styles.cardContainer}>
            <SuggestionsCard />
        </View>
    )
    return (
      <>
        <ScrollView style={styles.container}>
          <View style={styles.content}>
            <View style={styles.coin}>
              <View>
                <Image
                  source={require('../../../../../../assets/images/Smiley.png')}
                  style={styles.avatar}
                />
              </View>
              <Text style={styles.coinText}>$SEND</Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.mainPrice}>$0.129585</Text>
              <View style={styles.statsContainer}>
                <Text style={styles.statsText}>+$0.021113</Text>
                <Text style={styles.statsTextPercentage}>+477%</Text>
              </View>
            </View>
            <View style={styles.graphSection}>
              <LineGraph data={graphData[selectedTimeframe]} />
              <View style={styles.timeframeButtons}>
                {(['1H', '1D', '1W', '1M', 'All'] as const).map(timeframe => (
                  <TouchableOpacity
                    key={timeframe}
                    style={[
                      styles.timeButton,
                      selectedTimeframe === timeframe &&
                        styles.activeTimeButton,
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
            <View style={styles.tweetSection}>
              <Tweet data={tweetData} />
            </View>
          </View>
        </ScrollView>
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={e => e.stopPropagation()} // Prevent closing when clicking modal content
              style={styles.modalContainer}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                {/* Left Side */}
                <View style={styles.modalHeaderLeft}>
                  <Image
                    source={require('../../../../../../assets/images/Smiley.png')}
                    style={styles.modalAvatar}
                  />
                  <View style={styles.modalHeaderTexts}>
                    <Text style={styles.modalTitle}>$SEND</Text>
                    <Text style={styles.modalSubtitle}>$0.129585</Text>
                  </View>
                </View>

                {/* Right Side */}
                <View style={styles.modalHeaderRight}>
                  <View style={styles.modalPriceInfo}>
                    <Text style={styles.modalPriceLabel}>24h Price</Text>
                    <Text style={styles.modalPriceChange}>+477%</Text>
                  </View>
                </View>
              </View>

              {/* Graph */}
              <View style={styles.modalGraph}>
                <LineGraph
                  data={graphData[selectedTimeframe]}
                  width={Dimensions.get('window').width - 72}
                />
              </View>

              {/* Buttons */}
              <View style={styles.modalButtonsStack}>
                <TouchableOpacity style={styles.modalTopButton}>
                  <View style={styles.modalTopButtonContent}>
                    <Text style={styles.modalTopButtonText}>Held by</Text>
                    <View style={styles.modalAvatarStack}>
                      <Image
                        source={require('../../../../../../assets/images/Smiley.png')}
                        style={styles.modalStackAvatar1}
                      />
                      <Image
                        source={require('../../../../../../assets/images/thread-avatar-1.png')}
                        style={styles.modalStackAvatar2}
                      />
                      <Image
                        source={require('../../../../../../assets/images/thread-avatar-2.png')}
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
      </>
    );
}
