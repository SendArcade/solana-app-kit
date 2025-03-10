import {StyleSheet} from 'react-native';

// Define the theme object
const theme = {
  '--thread-bg-secondary': '#F5F5F5',
  '--thread-text-primary': '#333333',
};

export const styles = StyleSheet.create({
  /* TradeCard */
  tradeCardContainer: {
    width: '100%',
    gap: 10,
    padding: 4,
    flex: 1,
    marginBottom: -8,
  },

  tradeCardCombinedSides: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme['--thread-bg-secondary'],
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },

  tradeCardLeftSide: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  tradeCardTokenImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },

  tradeCardNamePriceContainer: {
    flexDirection: 'column',
  },

  tradeCardTokenName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
    color: theme['--thread-text-primary'],
  },

  tradeCardTokenPrice: {
    fontSize: 14,
    color: '#999999',
    fontWeight: '500',
  },

  tradeCardRightSide: {
    alignItems: 'flex-end',
  },

  tradeCardSolPrice: {
    color: '#32DE6B',
    fontSize: 14,
    fontWeight: '600',
  },

  tradeCardUsdPrice: {
    fontSize: 13,
    color: '#777',
  },

  tradeCardSwapIcon: {
    backgroundColor: theme['--thread-bg-secondary'],
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: '50%',
    top: '50%',
    borderWidth: 8,
    borderColor: '#FFFFFF',
    zIndex: 10,
    transform: [{translateX: -15}, {translateY: -15}],
  },
});

export default styles;
