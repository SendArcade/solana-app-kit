// FILE: src/hooks/useCoingecko.ts

import {useState, useEffect, useCallback, useRef} from 'react';
import {
  getCoinList,
  getCoinMarkets,
  getCoinOHLC,
} from '../services/coingeckoService';

/** Timeframe type used for chart data */
export type Timeframe = '1H' | '1D' | '1W' | '1M' | 'All';

/**
 * A unified hook that:
 * 1) Fetches and caches the full CoinGecko coin list (with local searching).
 * 2) Allows selecting a single coin to fetch market data (market cap, FDV, liquidity, etc).
 * 3) Fetches OHLC data for that coin in a chosen timeframe.
 *
 * All fetch logic is delegated to `coingeckoService`.
 */
export function useCoingecko() {
  // ------------------------------------------------------------------
  // A) Full Coin List + Searching
  // ------------------------------------------------------------------
  const [coinList, setCoinList] = useState<
    Array<{
      id: string;
      symbol: string;
      name: string;
    }>
  >([]);
  const [loadingCoinList, setLoadingCoinList] = useState(false);
  const [coinListError, setCoinListError] = useState<string | null>(null);

  // The results we expose after searching
  const [searchResults, setSearchResults] = useState<
    Array<{id: string; symbol: string; name: string}>
  >([]);

  // Optionally, we can define "famous coins" to prioritize in search
  const famousCoins = new Set([
    'bitcoin',
    'ethereum',
    'solana',
    'tether',
    'binancecoin',
    'ripple',
    'cardano',
    'dogecoin',
    'usd-coin',
  ]);

  /** Fetch the entire coin list once */
  const fetchCoinList = useCallback(async () => {
    setLoadingCoinList(true);
    setCoinListError(null);
    try {
      const data = await getCoinList();
      setCoinList(data);
    } catch (err: any) {
      setCoinListError(err.message || 'Unknown error fetching coin list');
    } finally {
      setLoadingCoinList(false);
    }
  }, []);

  // Automatically fetch the coin list on mount
  useEffect(() => {
    fetchCoinList();
  }, [fetchCoinList]);

  /**
   * Allows local searching among `coinList` by name or symbol,
   * then sorts so "famous" coins appear first.
   */
  const searchCoins = useCallback(
    (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }
      const lower = query.toLowerCase();
      // Filter
      let filtered = coinList.filter(
        coin =>
          coin.name.toLowerCase().includes(lower) ||
          coin.symbol.toLowerCase().includes(lower),
      );
      // Sort to put "famous" coins first
      filtered.sort((a, b) => {
        const aFamous = famousCoins.has(a.id) ? 1 : 0;
        const bFamous = famousCoins.has(b.id) ? 1 : 0;
        if (bFamous !== aFamous) {
          return bFamous - aFamous; // descending => famous first
        }
        // fallback: alphabetical by name
        return a.name.localeCompare(b.name);
      });
      setSearchResults(filtered);
    },
    [coinList],
  );

  // ------------------------------------------------------------------
  // B) Single Coin + Timeframe
  // ------------------------------------------------------------------
  // Developer can specify the coin we want data for:
  const [selectedCoinId, setSelectedCoinId] = useState<string>('');
  // Timeframe for OHLC data
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');

  // Market data
  const [marketCap, setMarketCap] = useState(0);
  const [fdv, setFdv] = useState(0);
  const [liquidityScore, setLiquidityScore] = useState(0);

  // OHLC chart data
  const [graphData, setGraphData] = useState<number[]>([]);
  const [timestamps, setTimestamps] = useState<number[]>([]);

  // Price + Changes derived from OHLC
  const [timeframePrice, setTimeframePrice] = useState(0);
  const [timeframeChangeUsd, setTimeframeChangeUsd] = useState(0);
  const [timeframeChangePercent, setTimeframeChangePercent] = useState(0);

  // Loading states & error for the single coin flow
  const [loadingMarketData, setLoadingMarketData] = useState(false);
  const [loadingOHLC, setLoadingOHLC] = useState(false);
  const [coinError, setCoinError] = useState<string | null>(null);

  /**
   * Fetch market data for the chosen coin (price, FDV, liquidity, etc).
   */
  const fetchMarketData = useCallback(async (coinId: string) => {
    setLoadingMarketData(true);
    setCoinError(null);
    try {
      const market = await getCoinMarkets(coinId);
      setMarketCap(market.market_cap || 0);
      // FDV
      let computedFdv = market.fully_diluted_valuation;
      if (computedFdv == null) {
        if (market.total_supply && market.current_price) {
          computedFdv = market.total_supply * market.current_price;
        } else {
          computedFdv = market.market_cap;
        }
      }
      setFdv(computedFdv || 0);
      // Liquidity => (total_volume / market_cap) * 100
      if (market.market_cap && market.total_volume) {
        const liquidity = (market.total_volume / market.market_cap) * 100;
        setLiquidityScore(liquidity);
      } else {
        setLiquidityScore(0);
      }
    } catch (err: any) {
      setCoinError(err.message || 'Error fetching market data');
    } finally {
      setLoadingMarketData(false);
    }
  }, []);

  /**
   * Fetch OHLC data for the chosen coin/timeframe, then compute "price" & "change."
   */
  const fetchOhlcData = useCallback(
    async (coinId: string, selectedTf: Timeframe) => {
      setLoadingOHLC(true);
      setCoinError(null);

      // Map timeframe => 'days' param
      let days: string;
      switch (selectedTf) {
        case '1H':
        case '1D':
          days = '1';
          break;
        case '1W':
          days = '7';
          break;
        case '1M':
          days = '30';
          break;
        case 'All':
          days = 'max';
          break;
        default:
          days = '1';
          break;
      }

      try {
        const rawData = await getCoinOHLC(coinId, days);
        if (!rawData || rawData.length === 0) {
          setGraphData([]);
          setTimestamps([]);
          setTimeframePrice(0);
          setTimeframeChangeUsd(0);
          setTimeframeChangePercent(0);
          return;
        }
        // each item => [timestamp, open, high, low, close]
        const closeValues = rawData.map((arr: number[]) => arr[4]);
        const timeValues = rawData.map((arr: number[]) => arr[0]);

        // Don't update state if the component unmounted or if the request was canceled
        setGraphData(closeValues);
        setTimestamps(timeValues);

        if (closeValues.length > 1) {
          const openPrice = closeValues[0];
          const finalPrice = closeValues[closeValues.length - 1];
          const absChange = finalPrice - openPrice;
          const pctChange = openPrice === 0 ? 0 : (absChange / openPrice) * 100;

          setTimeframePrice(finalPrice);
          setTimeframeChangeUsd(absChange);
          setTimeframeChangePercent(pctChange);
        } else if (closeValues.length === 1) {
          // Only 1 data point
          setTimeframePrice(closeValues[0] || 0);
          setTimeframeChangeUsd(0);
          setTimeframeChangePercent(0);
        }
      } catch (err: any) {
        setCoinError(err.message || 'Error fetching OHLC data');
        // Don't reset graph data on error to prevent flickering
        // Only reset if there was no previous data
        if (graphData.length === 0) {
          setGraphData([]);
          setTimestamps([]);
        }
      } finally {
        setLoadingOHLC(false);
      }
    },
    // Add graphData to the dependency array to prevent resetting on errors
    [graphData],
  );

  // Add a debounce mechanism for selectedCoinId changes
  const [debouncedCoinId, setDebouncedCoinId] = useState<string>('');

  // Debounce the selectedCoinId changes to prevent rapid re-fetching
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCoinId(selectedCoinId);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [selectedCoinId]);

  // Use a useRef to track if we've already set up the initial coin
  const hasInitializedCoinRef = useRef(false);

  // Whenever debouncedCoinId or timeframe changes => fetch data
  useEffect(() => {
    // Skip the effect if no coin ID or if we're already loading
    if (!debouncedCoinId) {
      return;
    }
    
    // Make sure we don't create a loop with loadingMarketData or loadingOHLC
    if (loadingMarketData || loadingOHLC) {
      return;
    }
    
    // Don't run the effect again for the same coin ID and timeframe if we've already initialized
    if (hasInitializedCoinRef.current && debouncedCoinId === selectedCoinId) {
      return;
    }
    
    // Mark as initialized
    hasInitializedCoinRef.current = true;
    
    // Create a cancellation flag
    let isCancelled = false;
    
    const fetchData = async () => {
      try {
        await fetchMarketData(debouncedCoinId);
        if (!isCancelled) {
          await fetchOhlcData(debouncedCoinId, timeframe);
        }
      } catch (error) {
        console.error("Failed to fetch coin data:", error);
      }
    };
    
    fetchData();
    
    return () => {
      isCancelled = true;
    };
  }, [debouncedCoinId, timeframe, fetchMarketData, fetchOhlcData, loadingMarketData, loadingOHLC, selectedCoinId]);

  /**
   * For manually refreshing the single coin's data
   */
  const refreshCoinData = useCallback(async () => {
    if (!debouncedCoinId) return;
    
    // Set loading states without triggering re-renders that cause loops
    let loadingMarketDataWasSet = false;
    let loadingOHLCWasSet = false;
    
    if (!loadingMarketData) {
      loadingMarketDataWasSet = true;
      setLoadingMarketData(true);
    }
    
    setCoinError(null);
    
    try {
      await fetchMarketData(debouncedCoinId);
      
      if (!loadingOHLC) {
        loadingOHLCWasSet = true;
        setLoadingOHLC(true);
      }
      
      await fetchOhlcData(debouncedCoinId, timeframe);
    } catch (error) {
      console.error("Failed to refresh coin data:", error);
    } finally {
      // Only reset loading states if we set them
      if (loadingMarketDataWasSet) {
        setLoadingMarketData(false);
      }
      if (loadingOHLCWasSet) {
        setLoadingOHLC(false);
      }
    }
  }, [debouncedCoinId, timeframe, fetchMarketData, fetchOhlcData, loadingMarketData, loadingOHLC]);

  return {
    // (A) Coin list searching
    coinList,
    loadingCoinList,
    coinListError,
    searchResults,
    searchCoins,
    fetchCoinList,

    // (B) Single coin + timeframe
    selectedCoinId,
    setSelectedCoinId,

    timeframe,
    setTimeframe,

    // Market data
    marketCap,
    liquidityScore,
    fdv,

    // OHLC data + derived price changes
    graphData,
    timestamps,
    timeframePrice,
    timeframeChangeUsd,
    timeframeChangePercent,

    // Loading + error
    loadingMarketData,
    loadingOHLC,
    coinError,

    // Refresh
    refreshCoinData,
  };
}
