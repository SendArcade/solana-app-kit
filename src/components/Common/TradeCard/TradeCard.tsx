// FILE: src/components/Common/TradeCard/TradeCard.tsx

import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StyleProp,
  ViewStyle,
  ImageSourcePropType,
} from 'react-native';
import Icon from '../../../assets/svgs/index';
import {getMergedTheme} from '../../thread/thread.styles';
import styles from './TradeCard.style';
import {useCoingecko, Timeframe} from '../../../hooks/useCoingecko';
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
  executionTimestamp?: any;
}

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
  /** Called when the user taps “Trade Now” (optional) */
  onTrade?: () => void;
  /** If true => show a chart for the output token */
  showGraphForOutputToken?: boolean;
  /** Theming overrides */
  themeOverrides?: Partial<Record<string, any>>;
  /** Style overrides for specific keys in the default style. */
  styleOverrides?: {[key: string]: object};
  /** For user-provided custom stylesheet merges */
  userStyleSheet?: {[key: string]: object};
  /** An optional user avatar to show on the chart for execution marker */
  userAvatar?: ImageSourcePropType;

  /**
   * A numeric (or string) value that changes when the parent wants to force a refresh.
   * E.g. you can pass a `refreshCounter` that increments each time
   * the user pulls to refresh in the Profile screen.
   */
  externalRefreshTrigger?: number;
}

/**
 * A card displaying trade info, with optional chart for the output token.
 */
function TradeCard({
  tradeData,
  onTrade,
  showGraphForOutputToken,
  themeOverrides,
  styleOverrides,
  userStyleSheet,
  userAvatar,
  externalRefreshTrigger,
}: TradeCardProps) {
  const mergedTheme = getMergedTheme(themeOverrides);

  // For Jupiter metadata about input & output tokens
  const [inputTokenMeta, setInputTokenMeta] = useState<any>(null);
  const [outputTokenMeta, setOutputTokenMeta] = useState<any>(null);
  const [loadingMeta, setLoadingMeta] = useState(false);

  // We store the last minted pair so we only fetch again if changed:
  const prevMintPairRef = useRef<{inputMint: string; outputMint: string}>({
    inputMint: '',
    outputMint: '',
  });

  // The Coingecko hook
  const {
    timeframe,
    setTimeframe,
    graphData,
    timestamps,
    timeframePrice,
    coinError,
    refreshCoinData,
    loadingOHLC,
    coinName,
    coinImage,
    setSelectedCoinId,
  } = useCoingecko();

  // We only want to fetch coingecko data on initial load, timeframe changes, or manual refresh
  const didInitialFetchRef = useRef(false);

  const coingeckoIdOutput = outputTokenMeta?.extensions?.coingeckoId || '';

  // --------------------------
  // Jupiter metadata fetch
  // --------------------------
  useEffect(() => {
    // If same inputMint + outputMint => skip
    if (
      prevMintPairRef.current.inputMint === tradeData.inputMint &&
      prevMintPairRef.current.outputMint === tradeData.outputMint
    ) {
      return;
    }
    // otherwise fetch
    let canceled = false;
    setLoadingMeta(true);
    (async () => {
      try {
        const [inMeta, outMeta] = await Promise.all([
          fetchJupiterTokenData(tradeData.inputMint),
          fetchJupiterTokenData(tradeData.outputMint),
        ]);
        if (!canceled) {
          setInputTokenMeta(inMeta);
          setOutputTokenMeta(outMeta);
          prevMintPairRef.current = {
            inputMint: tradeData.inputMint,
            outputMint: tradeData.outputMint,
          };
        }
      } catch (err) {
        console.error('TradeCard: jupiter token fetch error', err);
      } finally {
        if (!canceled) setLoadingMeta(false);
      }
    })();
    return () => {
      canceled = true;
    };
  }, [tradeData.inputMint, tradeData.outputMint]);

  // When the user specifically requests a chart for the output token,
  // we set the coingecko ID (once outputTokenMeta is available).
  useEffect(() => {
    if (showGraphForOutputToken && coingeckoIdOutput) {
      setSelectedCoinId(coingeckoIdOutput.toLowerCase());
    }
  }, [showGraphForOutputToken, coingeckoIdOutput, setSelectedCoinId]);

  // -----------
  // Force refresh from parent
  // -----------
  useEffect(() => {
    if (
      externalRefreshTrigger &&
      showGraphForOutputToken &&
      coingeckoIdOutput
    ) {
      refreshCoinData();
    }
  }, [
    externalRefreshTrigger,
    coingeckoIdOutput,
    showGraphForOutputToken,
    refreshCoinData,
  ]);

  // -----------
  // Timeframe changes => refresh if we’re in chart mode
  // -----------
  useEffect(() => {
    if (!showGraphForOutputToken || !coingeckoIdOutput) return;
    if (!didInitialFetchRef.current) {
      didInitialFetchRef.current = true;
      refreshCoinData();
      return;
    }
    // Otherwise, a changed timeframe => refetch
    refreshCoinData();
  }, [timeframe, coingeckoIdOutput, showGraphForOutputToken, refreshCoinData]);

  // Fallback name/logo from Jupiter metadata
  const fallbackInName = inputTokenMeta?.name ?? tradeData.inputSymbol;
  const fallbackInLogo = inputTokenMeta?.logoURI ?? '';
  const fallbackOutName = outputTokenMeta?.name ?? tradeData.outputSymbol;
  const fallbackOutLogo = outputTokenMeta?.logoURI ?? '';

  const isOutputChartMode = !!showGraphForOutputToken;

  function calculateExecutionInfo() {
    let executionPrice: number | undefined;
    if (tradeData.inputAmountLamports && tradeData.outputAmountLamports) {
      const inputLamports = parseFloat(tradeData.inputAmountLamports);
      const outputLamports = parseFloat(tradeData.outputAmountLamports);
      if (inputLamports > 0 && outputLamports > 0) {
        executionPrice = inputLamports / outputLamports;
      }
    } else if (tradeData.inputQuantity && tradeData.outputQuantity) {
      const inputQty = parseFloat(tradeData.inputQuantity);
      const outputQty = parseFloat(tradeData.outputQuantity);
      if (inputQty > 0 && outputQty > 0) {
        executionPrice = inputQty / outputQty;
      }
    }
    return {
      executionPrice,
      executionTimestamp: tradeData.executionTimestamp,
    };
  }
  const {executionPrice, executionTimestamp} = calculateExecutionInfo();

  // ---------------------------------------
  // If in "chart mode" => show chart
  // ---------------------------------------
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
          {(['1H', '1D', '1W', '1M', 'All'] as Timeframe[]).map(tf => (
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
          {/* Refresh icon => re-fetch coin data */}
          <TouchableOpacity
            style={{marginLeft: 16, flexDirection: 'row', alignItems: 'center'}}
            onPress={refreshCoinData}
            accessibilityLabel="Refresh Chart">
            <Icon.SwapIcon width={20} height={20} />
            <Text style={{color: '#1d9bf0', marginLeft: 4}}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* Chart container */}
        <View
          style={[
            {
              width: '100%',
              height: 220,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#FFFFFF',
            } as StyleProp<ViewStyle>,
          ]}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#1d9bf0" />
          ) : graphData.length > 0 ? (
            <>
              <LineGraph
                data={graphData}
                width={Dimensions.get('window').width - 70}
                executionPrice={executionPrice}
                executionTimestamp={executionTimestamp}
                timestamps={timestamps}
                userAvatar={userAvatar}
              />
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  marginTop: 5,
                  opacity: 0.7,
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginRight: 12,
                  }}>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#318EF8',
                      marginRight: 4,
                    }}
                  />
                  <Text style={{fontSize: 10}}>Current</Text>
                </View>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#FF5722',
                      marginRight: 4,
                    }}
                  />
                  <Text style={{fontSize: 10}}>Trade Execution</Text>
                </View>
              </View>
            </>
          ) : coinError ? (
            <Text style={{color: 'red', marginTop: 6}}>
              Error: {coinError.toString()}
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

  // ---------------------------------------
  // If not chart mode => standard “swap” view
  // ---------------------------------------
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
            {/* Input token info */}
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

            {/* Center swap icon */}
            <View style={styles.tradeCardSwapIcon}>
              <Icon.SwapIcon />
            </View>

            {/* Output token info */}
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

// Memo comparison to skip unnecessary re-renders
function arePropsEqual(prev: TradeCardProps, next: TradeCardProps) {
  if (prev.showGraphForOutputToken !== next.showGraphForOutputToken)
    return false;
  if (prev.externalRefreshTrigger !== next.externalRefreshTrigger) return false;

  const p = prev.tradeData;
  const n = next.tradeData;
  if (
    p.inputMint !== n.inputMint ||
    p.outputMint !== n.outputMint ||
    p.inputQuantity !== n.inputQuantity ||
    p.outputQuantity !== n.outputQuantity ||
    p.inputSymbol !== n.inputSymbol ||
    p.outputSymbol !== n.outputSymbol ||
    p.inputUsdValue !== n.inputUsdValue ||
    p.outputUsdValue !== n.outputUsdValue ||
    p.aggregator !== n.aggregator ||
    p.inputAmountLamports !== n.inputAmountLamports ||
    p.outputAmountLamports !== n.outputAmountLamports
  ) {
    return false;
  }
  return true;
}

export default React.memo(TradeCard, arePropsEqual);
