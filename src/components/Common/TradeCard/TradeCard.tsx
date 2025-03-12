// FILE: src/components/Common/TradeCard/TradeCard.tsx

import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Icon from '../../../assets/svgs/index';
import {getMergedTheme} from '../../thread/thread.styles';
import styles from './TradeCard.style';
import {useCoinGeckoData, Timeframe} from '../../../hooks/useCoinGeckoData';
import LineGraph from '../../CoinDetails/CoinDetailTopSection/LineGraph';

export interface TradeData {
  inputMint: string;
  outputMint: string;
  inputAmountLamports?: string;
  outputAmountLamports?: string;
  aggregator?: string;

  inputSymbol: string;
  inputQuantity: string;
  inputUsdValue?: string;
  outputSymbol: string;
  outputQuantity: string;
  outputUsdValue?: string;
}

/**
 * Fetches Jupiter token info to get a name/logo.
 */
async function fetchJupiterTokenData(mint: string) {
  try {
    const response = await fetch(`https://api.jup.ag/tokens/v1/token/${mint}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch token data for ${mint}`);
    }
    return await response.json();
  } catch (err) {
    console.error('Jupiter token fetch error:', err);
    return null;
  }
}

export interface TradeCardProps {
  tradeData: TradeData;
  onTrade?: () => void;
  showGraphForOutputToken?: boolean;
  themeOverrides?: Partial<Record<string, any>>;
  styleOverrides?: {[key: string]: object};
  userStyleSheet?: {[key: string]: object};
}

/**
 * A card that displays basic trade info.
 * If `showGraphForOutputToken` is true, we display a chart for the output token.
 */
function TradeCard({
  tradeData,
  onTrade,
  showGraphForOutputToken,
  themeOverrides,
  styleOverrides,
  userStyleSheet,
}: TradeCardProps) {
  const mergedTheme = getMergedTheme(themeOverrides);

  // For Jupiter metadata
  const [inputTokenMeta, setInputTokenMeta] = useState<any>(null);
  const [outputTokenMeta, setOutputTokenMeta] = useState<any>(null);
  const [loadingMeta, setLoadingMeta] = useState(false);

  // Use coin gecko data for the *output* token
  const coingeckoIdOutput = outputTokenMeta?.extensions?.coingeckoId || '';

  const {
    timeframe,
    setTimeframe,
    graphData,
    timeframePrice,
    loadingOHLC,
    error,
    refreshCoinData,
    coinName,
    coinImage,
  } = useCoinGeckoData(coingeckoIdOutput);

  // On mount, fetch the jupiter metadata for input & output tokens
  useEffect(() => {
    let canceled = false;
    (async () => {
      setLoadingMeta(true);
      try {
        const [inMeta, outMeta] = await Promise.all([
          fetchJupiterTokenData(tradeData.inputMint),
          fetchJupiterTokenData(tradeData.outputMint),
        ]);
        if (!canceled) {
          setInputTokenMeta(inMeta);
          setOutputTokenMeta(outMeta);
        }
      } catch (err) {
        console.error(
          'Failed to fetch jupiter token data for trade card.',
          err,
        );
      } finally {
        if (!canceled) setLoadingMeta(false);
      }
    })();
    return () => {
      canceled = true;
    };
  }, [tradeData.inputMint, tradeData.outputMint]);

  // Fallback naming
  const fallbackInName = inputTokenMeta?.name ?? tradeData.inputSymbol;
  const fallbackInLogo = inputTokenMeta?.logoURI ?? '';
  const fallbackOutName = outputTokenMeta?.name ?? tradeData.outputSymbol;
  const fallbackOutLogo = outputTokenMeta?.logoURI ?? '';

  // Are we in "chart mode" or "combined swap info" mode?
  const isOutputChartMode = !!showGraphForOutputToken;

  /**
   * To avoid flicker, we fix the chart container height.
   */
  const chartContainer: StyleProp<ViewStyle> = {
    width: '100%',
    height: 220, // Enough space for chart or spinner
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  };

  if (isOutputChartMode) {
    const isLoading = loadingMeta || loadingOHLC;

    return (
      <View style={styles.tradeCardContainer}>
        {/* Output token details row */}
        <View style={styles.tradeCardCombinedSides}>
          <View style={styles.tradeCardLeftSide}>
            <Image
              source={
                coinImage
                  ? {uri: coinImage}
                  : fallbackOutLogo
                  ? {uri: fallbackOutLogo}
                  : require('../../../assets/images/SENDlogo.png')
              }
              style={styles.tradeCardTokenImage}
            />
            <View style={styles.tradeCardNamePriceContainer}>
              <Text style={styles.tradeCardTokenName}>
                {coinName || fallbackOutName}
              </Text>
              <Text style={styles.tradeCardTokenPrice}>
                {timeframePrice ? `$${timeframePrice.toFixed(4)}` : '$0.00'}
              </Text>
            </View>
          </View>
          <View style={styles.tradeCardRightSide}>
            <Text style={[styles.tradeCardSolPrice, {color: '#00C851'}]}>
              {tradeData.outputQuantity} {tradeData.outputSymbol}
            </Text>
            <Text style={styles.tradeCardUsdPrice}>
              {tradeData.outputUsdValue ?? ''}
            </Text>
          </View>
        </View>

        {/* Timeframe Row + Refresh Button */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginVertical: 8,
          }}>
          {(['1H', '1D', '1W', '1M', 'All'] as const).map(tf => (
            <TouchableOpacity
              key={tf}
              style={{
                marginHorizontal: 4,
                padding: 6,
                borderRadius: 6,
                backgroundColor: timeframe === tf ? '#D6FDFF' : 'transparent',
              }}
              onPress={() => setTimeframe(tf)}>
              <Text
                style={{
                  color: timeframe === tf ? '#32D4DE' : '#666666',
                  fontWeight: timeframe === tf ? '600' : '400',
                }}>
                {tf}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Refresh icon to manually re-fetch */}
          <TouchableOpacity
            style={{marginLeft: 16, flexDirection: 'row', alignItems: 'center'}}
            onPress={refreshCoinData}
            accessibilityLabel="Refresh Chart">
            <Icon.SwapIcon width={20} height={20} />
            <Text style={{color: '#1d9bf0', marginLeft: 4}}>Refresh</Text>
          </TouchableOpacity>  
        </View>

        {/* Chart container with fixed height */}
        <View style={chartContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#1d9bf0" />
          ) : graphData.length > 0 ? (
            <LineGraph
              data={graphData}
              width={Dimensions.get('window').width - 70}
            />
          ) : error ? (
            <Text style={{color: 'red', marginTop: 6}}>
              Error: {error.toString()}
            </Text>
          ) : (
            <Text style={{color: '#999', marginTop: 6}}>
              No chart data found. Try a different timeframe or refresh.
            </Text>
          )}
        </View>
      </View>
    );
  }

  // Otherwise, the "swap" view (no chart)
  const isLoading = loadingMeta;

  return (
    <View style={styles.tradeCardContainer}>
      {isLoading ? (
        <View style={{alignItems: 'center', justifyContent: 'center'}}>
          <ActivityIndicator size="small" color="#1d9bf0" />
        </View>
      ) : (
        <>
          <View style={{position: 'relative'}}>
            {/* First block: Input token */}
            <View style={styles.tradeCardCombinedSides}>
              <View style={styles.tradeCardLeftSide}>
                <Image
                  source={
                    fallbackInLogo
                      ? {uri: fallbackInLogo}
                      : require('../../../assets/images/SENDlogo.png')
                  }
                  style={styles.tradeCardTokenImage}
                />
                <View style={styles.tradeCardNamePriceContainer}>
                  <Text style={styles.tradeCardTokenName}>
                    {fallbackInName}
                  </Text>
                  <Text style={styles.tradeCardTokenPrice}>
                    {tradeData.inputUsdValue ?? ''}
                  </Text>
                </View>
              </View>
              <View style={styles.tradeCardRightSide}>
                <Text style={[styles.tradeCardSolPrice, {color: '#00C851'}]}>
                  {tradeData.inputQuantity} {tradeData.inputSymbol}
                </Text>
                <Text style={styles.tradeCardUsdPrice}>
                  {tradeData.inputUsdValue ?? ''}
                </Text>
              </View>
            </View>

            {/* Swap icon in the middle */}
            <View style={styles.tradeCardSwapIcon}>
              <Icon.SwapIcon />
            </View>

            {/* Second block: Output token */}
            <View style={styles.tradeCardCombinedSides}>
              <View style={styles.tradeCardLeftSide}>
                <Image
                  source={
                    fallbackOutLogo
                      ? {uri: fallbackOutLogo}
                      : require('../../../assets/images/SENDlogo.png')
                  }
                  style={styles.tradeCardTokenImage}
                />
                <View style={styles.tradeCardNamePriceContainer}>
                  <Text style={styles.tradeCardTokenName}>
                    {fallbackOutName}
                  </Text>
                  <Text style={styles.tradeCardTokenPrice}>
                    {tradeData.outputUsdValue ?? ''}
                  </Text>
                </View>
              </View>
              <View style={styles.tradeCardRightSide}>
                <Text style={[styles.tradeCardSolPrice, {color: '#00C851'}]}>
                  {tradeData.outputQuantity} {tradeData.outputSymbol}
                </Text>
                <Text style={styles.tradeCardUsdPrice}>
                  {tradeData.outputUsdValue ?? ''}
                </Text>
              </View>
            </View>
          </View>

          {/* Optional CTA button */}
          {onTrade && (
            <TouchableOpacity
              style={{
                marginTop: 10,
                backgroundColor: '#1d9bf0',
                padding: 10,
                borderRadius: 5,
                alignItems: 'center',
              }}
              onPress={onTrade}>
              <Text style={{color: '#fff', fontWeight: 'bold'}}>Trade Now</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

/**
 * Custom comparison to prevent unnecessary re-renders.
 * Re-render only if tradeData or showGraphForOutputToken changes.
 */
function arePropsEqual(prev: TradeCardProps, next: TradeCardProps) {
  // If toggling chart mode, re-render.
  if (prev.showGraphForOutputToken !== next.showGraphForOutputToken) {
    return false;
  }

  // Compare tradeData fields
  const p = prev.tradeData;
  const n = next.tradeData;
  if (p.inputMint !== n.inputMint) return false;
  if (p.outputMint !== n.outputMint) return false;
  if (p.inputQuantity !== n.inputQuantity) return false;
  if (p.outputQuantity !== n.outputQuantity) return false;
  if (p.inputSymbol !== n.inputSymbol) return false;
  if (p.outputSymbol !== n.outputSymbol) return false;
  if (p.inputUsdValue !== n.inputUsdValue) return false;
  if (p.outputUsdValue !== n.outputUsdValue) return false;
  // aggregator + lamports rarely change but let's be safe
  if (p.aggregator !== n.aggregator) return false;
  if (p.inputAmountLamports !== n.inputAmountLamports) return false;
  if (p.outputAmountLamports !== n.outputAmountLamports) return false;

  // If we reached here, props are effectively the same => skip re-render
  return true;
}

export default React.memo(TradeCard, arePropsEqual);
