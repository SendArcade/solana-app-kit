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
import Icon from '../../../../assets/svgs/index';
import { getMergedTheme } from '../../../../core/thread/components/thread.styles';
import styles from './TradeCard.style';
import { useCoingecko, Timeframe } from '../../../../hooks/useCoingecko';
import LineGraph from './LineGraph';
import TokenDetailsDrawer from '../TokenDetailsDrawer/TokenDetailsDrawer';
import { fetchJupiterTokenData } from '../../../../utils/tokenUtils';

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

// Cache moved to tokenUtils.ts
// const jupiterTokenCache = new Map();

// Function moved to tokenUtils.ts
// async function fetchJupiterTokenData(mint: string) {...}

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

  // --------------------------------------------------
  // Token USD price data
  // --------------------------------------------------
  const [inputUsdPrice, setInputUsdPrice] = useState<number | null>(null);
  const [outputUsdPrice, setOutputUsdPrice] = useState<number | null>(null);
  const [loadingPrices, setLoadingPrices] = useState(false);

  // --------------------------------------------------
  // Token Details Drawer state
  // --------------------------------------------------
  const [showInputTokenDrawer, setShowInputTokenDrawer] = useState(false);
  const [showOutputTokenDrawer, setShowOutputTokenDrawer] = useState(false);

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
      // Fetch both input and output token data
      const [inMeta, outMeta] = await Promise.all([
        fetchJupiterTokenData(tradeData.inputMint),
        fetchJupiterTokenData(tradeData.outputMint)
      ]);

      if (!canceled) {
        setInputTokenMeta(inMeta);
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

        // If we found coingecko IDs in metadata, attempt to fetch prices
        await fetchTokenPrices(inMeta, outMeta);
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

  // --------------------------------------------------
  // 2) Fetch token prices from CoinGecko
  // --------------------------------------------------
  const fetchTokenPrices = useCallback(async (inputMeta: any, outputMeta: any) => {
    // Skip if we already have USD values in the trade data
    if (tradeData.inputUsdValue && tradeData.outputUsdValue &&
      tradeData.inputUsdValue !== '$??' && tradeData.outputUsdValue !== '$??') {
      return;
    }

    setLoadingPrices(true);
    try {
      const ids: string[] = [];
      const idToTokenMap = new Map();

      // Add input token coingecko ID if available
      if (inputMeta?.extensions?.coingeckoId) {
        const id = inputMeta.extensions.coingeckoId.toLowerCase();
        ids.push(id);
        idToTokenMap.set(id, 'input');
      } else if (tradeData.inputSymbol.toLowerCase() === 'sol') {
        // Special case for SOL
        ids.push('solana');
        idToTokenMap.set('solana', 'input');
      }

      // Add output token coingecko ID if available
      if (outputMeta?.extensions?.coingeckoId) {
        const id = outputMeta.extensions.coingeckoId.toLowerCase();
        ids.push(id);
        idToTokenMap.set(id, 'output');
      }

      // If we have any IDs, fetch prices
      if (ids.length > 0) {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd`
        );
        const data = await response.json();

        // Update prices based on what we received
        for (const [id, type] of idToTokenMap.entries()) {
          if (data[id] && data[id].usd) {
            if (type === 'input') {
              setInputUsdPrice(data[id].usd);
            } else if (type === 'output') {
              setOutputUsdPrice(data[id].usd);
            }
          }
        }
      }

      // Try with token symbols as fallback
      if (!idToTokenMap.has('input') && tradeData.inputSymbol) {
        await fetchPriceBySymbol(tradeData.inputSymbol, 'input');
      }
      if (!idToTokenMap.has('output') && tradeData.outputSymbol) {
        await fetchPriceBySymbol(tradeData.outputSymbol, 'output');
      }
    } catch (err) {
      console.error('Error fetching token prices:', err);
    } finally {
      setLoadingPrices(false);
    }
  }, [tradeData]);

  // Helper function to fetch price by token symbol
  const fetchPriceBySymbol = useCallback(async (symbol: string, type: 'input' | 'output') => {
    try {
      // Special case for known tokens
      if (symbol.toUpperCase() === 'USDC' || symbol.toUpperCase() === 'USDT') {
        if (type === 'input') setInputUsdPrice(1);
        else setOutputUsdPrice(1);
        return;
      }

      // Try to fetch from CoinGecko using symbol as ID (works for some tokens)
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=usd`
      );
      const data = await response.json();

      if (data[symbol.toLowerCase()] && data[symbol.toLowerCase()].usd) {
        if (type === 'input') {
          setInputUsdPrice(data[symbol.toLowerCase()].usd);
        } else {
          setOutputUsdPrice(data[symbol.toLowerCase()].usd);
        }
      }
    } catch (err) {
      console.error(`Error fetching price for ${symbol}:`, err);
    }
  }, []);

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

      // Also refresh token prices when external trigger changes
      fetchTokenPrices(inputTokenMeta, outputTokenMeta);
    }
  }, [
    externalRefreshTrigger,
    showGraphForOutputToken,
    outputTokenMeta,
    inputTokenMeta,
    refreshCoinData,
    fetchTokenPrices,
  ]);

  // --------------------------------------------------
  // Calculate USD values from prices and quantities - MEMOIZED
  // --------------------------------------------------
  const {
    calculatedInputUsdValue,
    calculatedOutputUsdValue,
    currentOutputValue,
    executionPrice,
    executionTimestamp
  } = useMemo(() => {
    let executionPrice: number | undefined;
    let calculatedInputUsdValue = '';
    let calculatedOutputUsdValue = '';
    let currentOutputValue = '';

    // Calculate price if we have both input and output amounts
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

    // Calculate USD values if we have prices
    if (inputUsdPrice !== null && tradeData.inputQuantity) {
      const inputQty = parseFloat(tradeData.inputQuantity);
      calculatedInputUsdValue = `$${(inputQty * inputUsdPrice).toFixed(2)}`;
    }

    if (outputUsdPrice !== null && tradeData.outputQuantity) {
      const outputQty = parseFloat(tradeData.outputQuantity);
      calculatedOutputUsdValue = `$${(outputQty * outputUsdPrice).toFixed(2)}`;

      // Calculate current value of output tokens (may differ from trade time)
      currentOutputValue = `$${(outputQty * outputUsdPrice).toFixed(2)}`;
    }

    return {
      calculatedInputUsdValue,
      calculatedOutputUsdValue,
      currentOutputValue,
      executionPrice,
      executionTimestamp: tradeData.executionTimestamp,
    };
  }, [
    tradeData,
    inputUsdPrice,
    outputUsdPrice
  ]);

  // --------------------------------------------------
  // Calculate current price vs trade price difference if available
  // --------------------------------------------------
  const priceDifference = useMemo(() => {
    if (!tradeData.outputUsdValue || !currentOutputValue) return null;

    // Skip if we're using placeholders or empty values
    if (
      tradeData.outputUsdValue === '$??' ||
      tradeData.outputUsdValue === '' ||
      currentOutputValue === ''
    ) {
      return null;
    }

    try {
      // Parse values, removing the $ prefix
      const tradeValueStr = tradeData.outputUsdValue.replace('$', '').replace('~', '');
      const currentValueStr = currentOutputValue.replace('$', '');

      const tradeValue = parseFloat(tradeValueStr);
      const currentValueNum = parseFloat(currentValueStr);

      if (isNaN(tradeValue) || isNaN(currentValueNum) || tradeValue === 0) {
        return null;
      }

      const percentChange = ((currentValueNum - tradeValue) / tradeValue) * 100;

      return {
        percentChange,
        isPositive: percentChange > 0,
        formattedChange: `${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}%`
      };
    } catch (err) {
      console.error('Error calculating price difference:', err);
      return null;
    }
  }, [tradeData.outputUsdValue, currentOutputValue]);

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
    fetchTokenPrices(inputTokenMeta, outputTokenMeta);
  }, [refreshCoinData, fetchTokenPrices, inputTokenMeta, outputTokenMeta]);

  // --------------------------------------------------
  // Handlers for Token Detail Drawer
  // --------------------------------------------------
  const handleOpenInputTokenDetails = useCallback(() => {
    setShowInputTokenDrawer(true);
  }, []);

  const handleOpenOutputTokenDetails = useCallback(() => {
    setShowOutputTokenDrawer(true);
  }, []);

  // --------------------------------------------------
  // Render: Chart Mode
  // --------------------------------------------------
  const isOutputChartMode = !!showGraphForOutputToken;
  const isLoading = loadingMeta || loadingOHLC;

  if (isOutputChartMode) {
    return (
      <>
        <View style={styles.tradeCardContainer}>
          {/* Output token details row */}
          <TouchableOpacity
            style={styles.tradeCardCombinedSides}
            onPress={handleOpenOutputTokenDetails}
            activeOpacity={0.7}>
            <View style={styles.tradeCardLeftSide}>
              <Image
                source={
                  fallbackOutLogo
                    ? { uri: fallbackOutLogo }
                    : require('../../../../assets/images/SENDlogo.png')
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
                {tradeData.outputQuantity + ' ' + tradeData.outputSymbol}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.tradeCardUsdPrice}>
                  {tradeData.outputUsdValue && tradeData.outputUsdValue !== '$??'
                    ? tradeData.outputUsdValue
                    : calculatedOutputUsdValue}
                </Text>
                {priceDifference && (
                  <Text style={{
                    marginLeft: 4,
                    fontSize: 12,
                    color: priceDifference.isPositive ? '#00C851' : '#FF4136',
                    fontWeight: '600',
                  }}>
                    {priceDifference.formattedChange}
                  </Text>
                )}
              </View>
            </View>
          </TouchableOpacity>

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
              style={{
                marginLeft: 16,
                flexDirection: 'row',
                alignItems: 'center',
              }}
              onPress={handleRefresh}
              accessibilityLabel="Refresh Chart">
              <Icon.SwapIcon width={20} height={20} />
              <Text style={{ color: '#1d9bf0', marginLeft: 4 }}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {/* Chart container */}
          {coinError ? (
            <View style={{
              width: '100%',
              height: 220,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#FFFFFF',
            }}>
              <Text style={{ color: 'red', marginTop: 6 }}>
                Error: {coinError.toString()}
              </Text>
            </View>
          ) : graphData.length === 0 && !isLoading ? (
            <View style={{
              width: '100%',
              height: 220,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#FFFFFF',
            }}>
              <Text style={{ color: '#999', marginTop: 6 }}>
                No chart data found. Try a different timeframe or refresh.
              </Text>
            </View>
          ) : (
            <LineGraph
              data={graphData}
              width={Dimensions.get('window').width - 100}
              executionPrice={executionPrice}
              executionTimestamp={executionTimestamp}
              timestamps={timestamps}
              userAvatar={userAvatar}
              isLoading={isLoading}
            />
          )}

          {/* Current Price Indicator */}
          {timeframePrice > 0 && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 12,
              paddingVertical: 6,
              backgroundColor: '#F8FAFC',
              borderRadius: 6,
              marginTop: 8,
            }}>
              <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '500' }}>
                Current Price
              </Text>
              <Text style={{ fontSize: 14, color: '#1E293B', fontWeight: '600' }}>
                ${timeframePrice.toFixed(4)}
              </Text>
            </View>
          )}
        </View>

        {/* Token Details Drawer for output token */}
        <TokenDetailsDrawer
          visible={showOutputTokenDrawer}
          onClose={() => setShowOutputTokenDrawer(false)}
          tokenMint={tradeData.outputMint}
          initialData={{
            symbol: tradeData.outputSymbol,
            name: fallbackOutName,
            logoURI: fallbackOutLogo,
          }}
        />
      </>
    );
  }

  // --------------------------------------------------
  // Non-chart mode => standard "swap" view
  // --------------------------------------------------
  return (
    <>
      <View style={styles.tradeCardContainer}>
        {loadingMeta ? (
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="small" color="#1d9bf0" />
          </View>
        ) : (
          <>
            <View style={{ position: 'relative' }}>
              {/* Input token info */}
              <TouchableOpacity
                style={styles.tradeCardCombinedSides}
                onPress={handleOpenInputTokenDetails}
                activeOpacity={0.7}>
                <View style={styles.tradeCardLeftSide}>
                  <Image
                    source={
                      fallbackInLogo
                        ? { uri: fallbackInLogo }
                        : require('../../../../assets/images/SENDlogo.png')
                    }
                    style={styles.tradeCardTokenImage}
                  />
                  <View style={styles.tradeCardNamePriceContainer}>
                    <Text style={styles.tradeCardTokenName}>
                      {fallbackInName}
                    </Text>
                    <Text style={styles.tradeCardTokenPrice}>
                      {tradeData.inputUsdValue && tradeData.inputUsdValue !== '$??'
                        ? tradeData.inputUsdValue
                        : calculatedInputUsdValue}
                    </Text>
                  </View>
                </View>
                <View style={styles.tradeCardRightSide}>
                  <Text style={[styles.tradeCardSolPrice, { color: '#00C851' }]}>
                    {tradeData.inputQuantity}
                  </Text>
                  <Text style={styles.tradeCardUsdPrice}>
                    {tradeData.inputUsdValue && tradeData.inputUsdValue !== '$??'
                      ? tradeData.inputUsdValue
                      : calculatedInputUsdValue}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Center swap icon */}
              <View style={styles.tradeCardSwapIcon}>
                <Icon.SwapIcon />
              </View>

              {/* Output token info */}
              <TouchableOpacity
                style={styles.tradeCardCombinedSides}
                onPress={handleOpenOutputTokenDetails}
                activeOpacity={0.7}>
                <View style={styles.tradeCardLeftSide}>
                  <Image
                    source={
                      fallbackOutLogo
                        ? { uri: fallbackOutLogo }
                        : require('../../../../assets/images/SENDlogo.png')
                    }
                    style={styles.tradeCardTokenImage}
                  />
                  <View style={styles.tradeCardNamePriceContainer}>
                    <Text style={styles.tradeCardTokenName}>
                      {fallbackOutName}
                    </Text>
                    <Text style={styles.tradeCardTokenPrice}>
                      {tradeData.outputUsdValue && tradeData.outputUsdValue !== '$??'
                        ? tradeData.outputUsdValue
                        : calculatedOutputUsdValue}
                    </Text>
                  </View>
                </View>
                <View style={styles.tradeCardRightSide}>
                  <Text style={[styles.tradeCardSolPrice, { color: '#00C851' }]}>
                    {tradeData.outputQuantity + ' ' + tradeData.outputSymbol}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.tradeCardUsdPrice}>
                      {tradeData.outputUsdValue && tradeData.outputUsdValue !== '$??'
                        ? tradeData.outputUsdValue
                        : calculatedOutputUsdValue}
                    </Text>
                    {priceDifference && (
                      <Text style={{
                        marginLeft: 4,
                        fontSize: 12,
                        color: priceDifference.isPositive ? '#00C851' : '#FF4136',
                        fontWeight: '600',
                      }}>
                        {priceDifference.formattedChange}
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
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
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                  Trade Now
                </Text>
              </TouchableOpacity>
            )}

            {/* Current Price Indicator (in non-chart mode) */}
            {outputUsdPrice !== null && tradeData.outputQuantity && !showGraphForOutputToken && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: '#F8FAFC',
                borderRadius: 6,
                marginTop: 12,
                marginBottom: 4,
              }}>
                <View>
                  <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '500' }}>
                    Current {tradeData.outputSymbol} Price
                  </Text>
                  <Text style={{ fontSize: 14, color: '#1E293B', fontWeight: '600' }}>
                    ${outputUsdPrice.toFixed(4)} per {tradeData.outputSymbol}
                  </Text>
                </View>
                {priceDifference && (
                  <View style={{
                    backgroundColor: priceDifference.isPositive ? 'rgba(0, 200, 81, 0.1)' : 'rgba(255, 65, 54, 0.1)',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                  }}>
                    <Text style={{
                      fontSize: 12,
                      color: priceDifference.isPositive ? '#00C851' : '#FF4136',
                      fontWeight: '600',
                    }}>
                      {priceDifference.formattedChange} since trade
                    </Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </View>

      {/* Token Details Drawers */}
      <TokenDetailsDrawer
        visible={showInputTokenDrawer}
        onClose={() => setShowInputTokenDrawer(false)}
        tokenMint={tradeData.inputMint}
        initialData={{
          symbol: tradeData.inputSymbol,
          name: fallbackInName,
          logoURI: fallbackInLogo,
        }}
      />

      <TokenDetailsDrawer
        visible={showOutputTokenDrawer}
        onClose={() => setShowOutputTokenDrawer(false)}
        tokenMint={tradeData.outputMint}
        initialData={{
          symbol: tradeData.outputSymbol,
          name: fallbackOutName,
          logoURI: fallbackOutLogo,
        }}
      />
    </>
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
