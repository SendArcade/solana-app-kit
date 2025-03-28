import {StyleSheet, Platform, Dimensions} from 'react-native';

// Get screen width for responsive sizing
const screenWidth = Dimensions.get('window').width;

export const chatBodyOverrides = StyleSheet.create({
  extraContentContainer: {
    marginVertical: 2,
    width: '100%',
  },
  threadItemText: {
    fontSize: 14,
    color: '#232324',
    flexWrap: 'wrap',
  },
  // Trade card specific overrides to prevent overflow
  tradeCardContainer: {
    width: '100%',
    padding: 0,
    marginBottom: 0,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tradeCardCombinedSides: {
    padding: 8,
    marginBottom: 4,
    borderRadius: 8,
  },
  // Hide token symbol in price display
  tradeCardSolPrice: {
    fontSize: 13,
    fontWeight: '500',
  },
  // LineGraph container styling
  threadPostCTAContainer: {
    width: '100%',
    marginTop: 2,
  },
  // Ensure any images/media in the chat have proper constraints
  threadItemImage: {
    width: '100%',
    height: undefined,
    aspectRatio: 1.5,
    borderRadius: 12,
    marginTop: 6,
  },
});

// Subtle color palette for a minimalist chat design
const colors = {
  background: '#F7F7F7',
  sentBubble: '#E6F3FF',
  receivedBubble: '#FFFFFF',
  primaryText: '#262626',
  secondaryText: '#757575',
  border: '#E0E0E0',
  accentLight: '#E8E8E8',
  accent: '#2558D4',
  chartBackground: '#FFFFFF',
};

export const styles = StyleSheet.create({
  chatScreenContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  messageWrapper: {
    marginVertical: 8,
    maxWidth: '90%', // Wider to accommodate TradeCard charts
  },

  receivedWrapper: {
    alignSelf: 'flex-start',
  },
  sentWrapper: {
    alignSelf: 'flex-end',
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingLeft: 2,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  usernameContainer: {
    justifyContent: 'center',
  },
  senderLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryText,
  },

  /* BUBBLE */
  bubbleContainer: {
    borderRadius: 18,
    padding: 12,
    paddingBottom: 8, // Less padding at bottom for timestamps
    minWidth: 60,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
    overflow: 'hidden', // Ensure content doesn't overflow bubble
  },
  receivedBubble: {
    backgroundColor: colors.receivedBubble,
    borderTopLeftRadius: 4,
    marginLeft: 4,
  },
  sentBubble: {
    backgroundColor: colors.sentBubble,
    borderTopRightRadius: 4,
  },

  timeStampText: {
    fontSize: 10,
    color: colors.secondaryText,
    marginTop: 6,
    alignSelf: 'flex-end',
    opacity: 0.8,
  },

  composerContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 12, 
    paddingBottom: Platform.OS === 'ios' ? 24 : 12, // More padding on iOS for better spacing
    backgroundColor: '#FFFFFF',
  },
  
  quoteReplyButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  quoteReplyText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Styles for quoted replies in messages
  quotedContentContainer: {
    backgroundColor: colors.accentLight,
    borderRadius: 12,
    padding: 8,
    marginTop: 4,
    marginBottom: 8,
    opacity: 0.9,
    maxWidth: '100%',
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  
  // Custom styles for charts in messages
  chartContainer: {
    backgroundColor: colors.chartBackground,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 4,
    overflow: 'hidden',
    width: '100%',
  },
  
  // Trade button in chat
  tradeButton: {
    backgroundColor: colors.accent,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignSelf: 'center',
    marginTop: 8,
  },
  tradeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export const androidStyles = StyleSheet.create({
  safeArea: {
    paddingTop: 50,
  },
});
