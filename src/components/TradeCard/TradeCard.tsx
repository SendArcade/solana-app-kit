import React from 'react';
import {View, Text, Image, TouchableOpacity} from 'react-native';
import {createThreadStyles, getMergedTheme} from '../thread/thread.styles';
import Icon from '../../assets/svgs/index';

/**
 * Props for the token information displayed in the TradeCard
 */
interface TokenInfo {
  /** Image source for the token's avatar */
  avatar: any;
  /** Name of the token */
  name: string;
  /** Price of the token in USD */
  priceUsd: string;
  /** Price of the token in SOL (only required for token2) */
  priceSol?: string;
}

/**
 * Props for the TradeCard component
 */
interface TradeCardProps {
  /** Information about the first token in the trading pair */
  token1: TokenInfo;
  /** Information about the second token in the trading pair */
  token2: TokenInfo & { priceSol: string };
  /** Optional callback function when trade button is pressed */
  onTrade?: () => void;
  /** Optional theme overrides for styling */
  themeOverrides?: Partial<Record<string, any>>;
  /** Optional style overrides for specific elements */
  styleOverrides?: {[key: string]: object};
  /** Optional user-defined stylesheet */
  userStyleSheet?: {[key: string]: object};
}

/**
 * A component that displays a trading card interface for token pairs
 * 
 * @component
 * @description
 * TradeCard provides a user interface for displaying and comparing two tokens
 * in a trading pair. It shows token information including avatars, names,
 * and prices in both USD and SOL. The component features a swap icon between
 * the tokens and supports customizable styling through various override props.
 * 
 * The component is designed to be flexible with customizable themes and styles,
 * making it adaptable to different design requirements.
 * 
 * @example
 * ```tsx
 * <TradeCard
 *   token1={{
 *     avatar: require('./token1.png'),
 *     name: 'SOL',
 *     priceUsd: '$100'
 *   }}
 *   token2={{
 *     avatar: require('./token2.png'),
 *     name: 'USDC',
 *     priceUsd: '$1',
 *     priceSol: '0.01'
 *   }}
 *   onTrade={() => console.log('Trade initiated')}
 * />
 * ```
 */
export default function TradeCard({
  token1,
  token2,
  onTrade,
  themeOverrides,
  styleOverrides,
  userStyleSheet,
}: TradeCardProps) {
  const mergedTheme = getMergedTheme(themeOverrides);
  const styles = createThreadStyles(
    mergedTheme,
    styleOverrides,
    userStyleSheet,
  );

  return (
    <View style={styles.tradeCardContainer}>
      <View style={{position: 'relative'}}>
        <View style={styles.tradeCardCombinedSides}>
          <View style={styles.tradeCardLeftSide}>
            <Image source={token1.avatar} style={styles.tradeCardTokenImage} />
            <View style={styles.tradeCardNamePriceContainer}>
              <Text style={styles.tradeCardTokenName}>{token1.name}</Text>
              <Text style={styles.tradeCardTokenPrice}>{token1.priceUsd}</Text>
            </View>
          </View>
          <View style={styles.tradeCardRightSide}>
            <Text style={styles.tradeCardSolPrice}>{token2.priceSol}</Text>
            <Text style={styles.tradeCardUsdPrice}>{token2.priceUsd}</Text>
          </View>
        </View>
        <View style={styles.tradeCardSwapIcon}>
          <Icon.SwapIcon />
        </View>
        <View style={styles.tradeCardCombinedSides}>
          <View style={styles.tradeCardLeftSide}>
            <Image source={token2.avatar} style={styles.tradeCardTokenImage} />
            <View style={styles.tradeCardNamePriceContainer}>
              <Text style={styles.tradeCardTokenName}>{token2.name}</Text>
              <Text style={styles.tradeCardTokenPrice}>{token2.priceUsd}</Text>
            </View>
          </View>
          <View style={styles.tradeCardRightSide}>
            <Text style={styles.tradeCardSolPrice}>{token2.priceSol}</Text>
            <Text style={styles.tradeCardUsdPrice}>{token2.priceUsd}</Text>
          </View>
        </View>
      </View>
      {/* {tradeAction && (
        <TouchableOpacity
          style={{
            marginTop: 10,
            backgroundColor: '#1d9bf0',
            padding: 10,
            borderRadius: 5,
            alignItems: 'center',
          }}
          onPress={tradeAction}>
          <Text style={{color: '#fff', fontWeight: 'bold'}}>Trade Now</Text>
        </TouchableOpacity>
      )} */}
    </View>
  );
}
