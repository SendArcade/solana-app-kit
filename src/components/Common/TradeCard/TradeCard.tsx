// File: src/components/TradeCard/TradeCard.tsx
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {createThreadStyles, getMergedTheme} from '../../thread/thread.styles';
import Icon from '../../../assets/svgs/index';

interface FetchedTokenData {
  avatar: string;
  name: string;
  currentPriceUsd: number; // Changed to number for calculations
}

export interface TradeData {
  inputMint: string;
  outputMint: string;
  inputAmountLamports?: string;
  outputAmountLamports?: string;
  aggregator?: string;

  // Fields stored at trade time:
  inputSymbol: string;
  inputQuantity: string; // e.g. "1.5"
  inputUsdValue?: string; // Optional now as we'll calculate it
  outputSymbol: string;
  outputQuantity: string; // e.g. "120"
  outputUsdValue?: string; // Optional now as we'll calculate it
}

export interface TradeCardProps {
  tradeData: TradeData;
  onTrade?: () => void;
  /** Optional theme overrides for styling */
  themeOverrides?: Partial<Record<string, any>>;
  /** Optional style overrides for specific elements */
  styleOverrides?: {[key: string]: object};
  /** Optional user-defined stylesheet */
  userStyleSheet?: {[key: string]: object};
}

async function fetchTokenRealtimeData(mint: string): Promise<FetchedTokenData> {
  try {
    // Real API call to the Jupiter Token API.
    const response = await fetch(`https://api.jup.ag/tokens/v1/token/${mint}`);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch token data for ${mint}: ${response.status}`,
      );
    }
    const data = await response.json();

    // Default price value if no price is available.
    let currentPriceUsd = 0;
    if (data.extensions && data.extensions.coingeckoId) {
      const cgId = data.extensions.coingeckoId;
      try {
        // Fetch current price from Coingecko.
        const priceResponse = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${cgId}&vs_currencies=usd`,
        );
        if (priceResponse.ok) {
          const priceData = await priceResponse.json();
          if (priceData[cgId] && priceData[cgId].usd !== undefined) {
            currentPriceUsd = priceData[cgId].usd;
          }
        }
      } catch (e) {
        console.error('Failed to fetch price from Coingecko', e);
      }
    }
    return {
      avatar: data.logoURI,
      name: data.name,
      currentPriceUsd,
    };
  } catch (error) {
    console.error('Error fetching token realtime data', error);
    return {
      avatar: 'https://example.com/default.png',
      name: 'Unknown Token',
      currentPriceUsd: 0,
    };
  }
}

// Helper function to format currency
function formatUSD(amount: number): string {
  return `$${amount.toFixed(2)}`;
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
  tradeData,
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

  const [inputTokenData, setInputTokenData] = useState<FetchedTokenData | null>(
    null,
  );
  const [outputTokenData, setOutputTokenData] =
    useState<FetchedTokenData | null>(null);
  const [loading, setLoading] = useState(true);

  // New state for real-time calculated values
  const [inputUsdValue, setInputUsdValue] = useState<string | undefined>(
    tradeData.inputUsdValue,
  );
  const [outputUsdValue, setOutputUsdValue] = useState<string | undefined>(
    tradeData.outputUsdValue,
  );

  useEffect(() => {
    async function loadTokenData() {
      setLoading(true);
      try {
        const inputData = await fetchTokenRealtimeData(tradeData.inputMint);
        const outputData = await fetchTokenRealtimeData(tradeData.outputMint);

        setInputTokenData(inputData);
        setOutputTokenData(outputData);

        // Calculate USD values based on current prices
        const inputQty = parseFloat(tradeData.inputQuantity);
        const outputQty = parseFloat(tradeData.outputQuantity);

        if (!isNaN(inputQty) && inputData.currentPriceUsd > 0) {
          const calculatedInputUSD = inputQty * inputData.currentPriceUsd;
          setInputUsdValue(formatUSD(calculatedInputUSD));
        }

        if (!isNaN(outputQty) && outputData.currentPriceUsd > 0) {
          const calculatedOutputUSD = outputQty * outputData.currentPriceUsd;
          setOutputUsdValue(formatUSD(calculatedOutputUSD));
        }
      } catch (error) {
        console.error('Failed to fetch token data', error);
      } finally {
        setLoading(false);
      }
    }
    loadTokenData();
  }, [
    tradeData.inputMint,
    tradeData.outputMint,
    tradeData.inputQuantity,
    tradeData.outputQuantity,
  ]);

  if (loading || !inputTokenData || !outputTokenData) {
    return (
      <View
        style={[
          styles.tradeCardContainer,
          {alignItems: 'center', justifyContent: 'center'},
        ]}>
        <ActivityIndicator size="small" color="#1d9bf0" />
      </View>
    );
  }

  return (
    <View style={styles.tradeCardContainer}>
      <View style={{position: 'relative'}}>
        {/* First block: Input (traded) token info */}
        <View style={styles.tradeCardCombinedSides}>
          <View style={styles.tradeCardLeftSide}>
            <Image
              source={{uri: inputTokenData.avatar}}
              style={styles.tradeCardTokenImage}
            />
            <View style={styles.tradeCardNamePriceContainer}>
              <Text style={styles.tradeCardTokenName}>
                {inputTokenData.name}
              </Text>
              <Text style={styles.tradeCardTokenPrice}>
                {formatUSD(inputTokenData.currentPriceUsd)}
              </Text>
            </View>
          </View>
          <View style={styles.tradeCardRightSide}>
            <Text style={[styles.tradeCardSolPrice, {color: '#00C851'}]}>
              {tradeData.inputQuantity} {tradeData.inputSymbol}
            </Text>
            <Text style={styles.tradeCardUsdPrice}>
              {inputUsdValue || 'Calculating...'}
            </Text>
          </View>
        </View>

        {/* Swap icon */}
        <View style={styles.tradeCardSwapIcon}>
          <Icon.SwapIcon />
        </View>

        {/* Second block: Output (received) token info */}
        <View style={styles.tradeCardCombinedSides}>
          <View style={styles.tradeCardLeftSide}>
            <Image
              source={{uri: outputTokenData.avatar}}
              style={styles.tradeCardTokenImage}
            />
            <View style={styles.tradeCardNamePriceContainer}>
              <Text style={styles.tradeCardTokenName}>
                {outputTokenData.name}
              </Text>
              <Text style={styles.tradeCardTokenPrice}>
                {formatUSD(outputTokenData.currentPriceUsd)}
              </Text>
            </View>
          </View>
          <View style={styles.tradeCardRightSide}>
            <Text style={[styles.tradeCardSolPrice, {color: '#00C851'}]}>
              {tradeData.outputQuantity} {tradeData.outputSymbol}
            </Text>
            <Text style={styles.tradeCardUsdPrice}>
              {outputUsdValue || 'Calculating...'}
            </Text>
          </View>
        </View>
      </View>
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
    </View>
  );
}
