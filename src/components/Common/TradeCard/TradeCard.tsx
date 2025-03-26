// FILE: src/components/Common/TradeCard/TradeCard.tsx

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
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
import { getMergedTheme } from '../../thread/thread.styles';
import styles from './TradeCard.style';
import { useCoingecko, Timeframe } from '../../../hooks/useCoingecko';
import LineGraph from './LineGraph';

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

// Cache for Jupiter token metadata to avoid duplicate fetches
const jupiterTokenCache = new Map();

async function fetchJupiterTokenData(mint: string) {
  // Return from cache if available
  if (jupiterTokenCache.has(mint)) {
    return jupiterTokenCache.get(mint);
  }
  
  try {
    const response = await fetch(`https://api.jup.ag/tokens/v1/token/${mint}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch token data for ${mint}`);
    }
    const data = await response.json();
    // Store in cache
    jupiterTokenCache.set(mint, data);
    return data;
  } catch (err) {
    console.error('Jupiter token fetch error:', err);
    return null;
  }
}

export interface TradeCardProps {
  tradeData: TradeData;
  /** Called when the user taps "Trade Now" (optional) */
  onTrade?: () => void;
  /** If true => show a chart for the output token */
  showGraphForOutputToken?: boolean;
  /** Theming overrides */
  themeOverrides?: Partial<Record<string, any>>;
  /** Style overrides for specific keys in the default style. */
  styleOverrides?: { [key: string]: object };
  /** For user-provided custom stylesheet merges */
  userStyleSheet?: { [key: string]: object };
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
  const mergedTheme = useMemo(() => getMergedTheme(themeOverrides), [themeOverrides]);

  // --------------------------------------------------
  // Jupiter metadata about input & output tokens
  // --------------------------------------------------
  const [inputTokenMeta, setInputTokenMeta] = useState<any>(null);
  const [outputTokenMeta, setOutputTokenMeta] = useState<any>(null);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [metaFetchFinished, setMetaFetchFinished] = useState(false);

  // For preventing duplicate fetch calls
  const prevMintPairRef = useRef<{ inputMint: string; outputMint: string }>({
    inputMint: '',
    outputMint: '',
  });

  // --------------------------------------------------
  // Coingecko hook
  // --------------------------------------------------
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
  } = useCoingecko();

  // Keep track of timeframe changes
  const prevTimeframeRef = useRef<Timeframe>(timeframe);

  // Keep track of external refresh changes
  const prevRefreshTriggerRef = useRef(externalRefreshTrigger);

  // --------------------------------------------------
  // 1) Fetch Jupiter output token metadata - OPTIMIZED
  // --------------------------------------------------
  const fetchTokenMetadata = useCallback(async () => {
    if (
      prevMintPairRef.current.inputMint === tradeData.inputMint &&
      prevMintPairRef.current.outputMint === tradeData.outputMint &&
      metaFetchFinished
    ) {
      return; // Already fetched this pair and completed
    }
    
    let canceled = false;
    setLoadingMeta(true);
    
    try {
      // Only output token fetch to reduce API calls
      const outMeta = await fetchJupiterTokenData(tradeData.outputMint);
      
      if (!canceled) {
        setOutputTokenMeta(outMeta);
        prevMintPairRef.current = {
          inputMint: tradeData.inputMint,
          outputMint: tradeData.outputMint,
        };
        setMetaFetchFinished(true);
        
        // If user wants a chart & there's a coingeckoId => set it & fetch data immediately
        if (showGraphForOutputToken && outMeta?.extensions?.coingeckoId) {
          setSelectedCoinId(outMeta.extensions.coingeckoId.toLowerCase());
        }
      }
    } catch (err) {
      console.error('TradeCard: jupiter token fetch error', err);
    } finally {
      if (!canceled) setLoadingMeta(false);
    }
    
    return () => {
      canceled = true;
    };
  }, [tradeData.outputMint, tradeData.inputMint, showGraphForOutputToken, setSelectedCoinId, metaFetchFinished]);

  useEffect(() => {
    fetchTokenMetadata();
  }, [fetchTokenMetadata]);

  // --------------------------------------------------
  // 2) Handle timeframe changes - OPTIMIZED
  // --------------------------------------------------
  useEffect(() => {
    if (!showGraphForOutputToken) return;
    const coinId = outputTokenMeta?.extensions?.coingeckoId;
    if (!coinId) return;

    // Only refresh if timeframe actually changed
    if (timeframe !== prevTimeframeRef.current) {
      prevTimeframeRef.current = timeframe;
      refreshCoinData();
    }
  }, [timeframe, showGraphForOutputToken, outputTokenMeta, refreshCoinData]);

  // --------------------------------------------------
  // 3) Handle external refresh triggers - OPTIMIZED
  // --------------------------------------------------
  useEffect(() => {
    if (!showGraphForOutputToken) return;
    const coinId = outputTokenMeta?.extensions?.coingeckoId;
    if (!coinId) return;

    if (externalRefreshTrigger !== prevRefreshTriggerRef.current) {
      prevRefreshTriggerRef.current = externalRefreshTrigger;
      refreshCoinData();
    }
  }, [
    externalRefreshTrigger,
    showGraphForOutputToken,
    outputTokenMeta,
    refreshCoinData,
  ]);

  // --------------------------------------------------
  // Compute the execution price from tradeData - MEMOIZED
  // --------------------------------------------------
  const { executionPrice, executionTimestamp } = useMemo(() => {
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
  }, [tradeData]);

  // --------------------------------------------------
  // Fallback name/logo from Jupiter metadata - MEMOIZED
  // --------------------------------------------------
  const { 
    fallbackInName, 
    fallbackInLogo, 
    fallbackOutName, 
    fallbackOutLogo 
  } = useMemo(() => {
    // Use token metadata if available, otherwise fallback to tradeData symbols
    return {
      fallbackInName: inputTokenMeta?.name ?? tradeData.inputSymbol,
      fallbackInLogo: inputTokenMeta?.logoURI ?? '',
      fallbackOutName: outputTokenMeta?.name ?? tradeData.outputSymbol,
      fallbackOutLogo: outputTokenMeta?.logoURI ?? '',
    };
  }, [
    inputTokenMeta, 
    outputTokenMeta, 
    tradeData.inputSymbol, 
    tradeData.outputSymbol
  ]);

  // Memoize the refresh handler to prevent unnecessary re-renders
  const handleRefresh = useCallback(() => {
    refreshCoinData();
  }, [refreshCoinData]);

  // --------------------------------------------------
  // Render: Chart Mode
  // --------------------------------------------------
  const isOutputChartMode = !!showGraphForOutputToken;
  const isLoading = loadingMeta || loadingOHLC;
  
  if (isOutputChartMode) {
    return (
      <View style={styles.tradeCardContainer}>
        {/* Output token details row */}
        <View style={styles.tradeCardCombinedSides}>
          <View style={styles.tradeCardLeftSide}>
            <Image
              source={
                fallbackOutLogo
                  ? { uri: fallbackOutLogo }
                  : require('../../../assets/images/SENDlogo.png')
              }
              style={styles.tradeCardTokenImage}
            />
            <View style={styles.tradeCardNamePriceContainer}>
              <Text style={styles.tradeCardTokenName}>{fallbackOutName}</Text>
              <Text style={styles.tradeCardTokenPrice}>
                {timeframePrice ? `$${timeframePrice.toFixed(4)}` : '$0.00'}
              </Text>
            </View>
          </View>
          <View style={styles.tradeCardRightSide}>
            <Text style={[styles.tradeCardSolPrice, { color: '#00C851' }]}>
              {tradeData.outputQuantity}
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
          }}
        >
          {(['1H', '1D', '1W', '1M', 'All'] as Timeframe[]).map(tf => (
            <TouchableOpacity
              key={tf}
              style={{
                marginHorizontal: 4,
                padding: 6,
                borderRadius: 6,
                backgroundColor: timeframe === tf ? '#D6FDFF' : 'transparent',
              }}
              onPress={() => setTimeframe(tf)}
            >
              <Text
                style={{
                  color: timeframe === tf ? '#32D4DE' : '#666666',
                  fontWeight: timeframe === tf ? '600' : '400',
                }}
              >
                {tf}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Refresh icon => re-fetch coin data */}
          <TouchableOpacity
            style={{ marginLeft: 16, flexDirection: 'row', alignItems: 'center' }}
            onPress={handleRefresh}
            accessibilityLabel="Refresh Chart"
          >
            <Icon.SwapIcon width={20} height={20} />
            <Text style={{ color: '#1d9bf0', marginLeft: 4 }}>Refresh</Text>
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
          ]}
        >
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
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginRight: 12,
                  }}
                >
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#318EF8',
                      marginRight: 4,
                    }}
                  />
                  <Text style={{ fontSize: 10 }}>Current</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#FF5722',
                      marginRight: 4,
                    }}
                  />
                  <Text style={{ fontSize: 10 }}>Trade Execution</Text>
                </View>
              </View>
            </>
          ) : coinError ? (
            <Text style={{ color: 'red', marginTop: 6 }}>
              Error: {coinError.toString()}
            </Text>
          ) : (
            <Text style={{ color: '#999', marginTop: 6 }}>
              No chart data found. Try a different timeframe or refresh.
            </Text>
          )}
        </View>
      </View>
    );
  }

  // --------------------------------------------------
  // Non-chart mode => standard "swap" view
  // --------------------------------------------------
  return (
    <View style={styles.tradeCardContainer}>
      {loadingMeta ? (
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="small" color="#1d9bf0" />
        </View>
      ) : (
        <>
          <View style={{ position: 'relative' }}>
            {/* Input token info */}
            <View style={styles.tradeCardCombinedSides}>
              <View style={styles.tradeCardLeftSide}>
                <Image
                  source={
                    fallbackInLogo
                      ? { uri: fallbackInLogo }
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
                <Text style={[styles.tradeCardSolPrice, { color: '#00C851' }]}>
                  {tradeData.inputQuantity}
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
                      ? { uri: fallbackOutLogo }
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
                <Text style={[styles.tradeCardSolPrice, { color: '#00C851' }]}>
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
              onPress={onTrade}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Trade Now</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

// Memo comparison to skip unnecessary re-renders - OPTIMIZED with deep prop checking
function arePropsEqual(prev: TradeCardProps, next: TradeCardProps) {
  if (prev.showGraphForOutputToken !== next.showGraphForOutputToken) return false;
  if (prev.externalRefreshTrigger !== next.externalRefreshTrigger) return false;

  // Deep compare tradeData objects
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
  
  // Compare theme and style references
  if (prev.themeOverrides !== next.themeOverrides) return false;
  if (prev.styleOverrides !== next.styleOverrides) return false;
  if (prev.userStyleSheet !== next.userStyleSheet) return false;
  
  // If avatar is a string (URI), compare as string
  if (typeof prev.userAvatar === 'string' || typeof next.userAvatar === 'string') {
    return prev.userAvatar === next.userAvatar;
  }
  
  // Otherwise compare avatar references
  return prev.userAvatar === next.userAvatar;
}

export default React.memo(TradeCard, arePropsEqual);
