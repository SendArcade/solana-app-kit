// FILE: src/hooks/useCoingecko.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getCoinList,
  getCoinMarkets,
  getCoinOHLC,
} from '../services/coingeckoService';

/** Timeframe type used for chart data */
export type Timeframe = '1H' | '1D' | '1W' | '1M' | 'All';

export function useCoingecko() {
  // ------------------------------------------
  // A) Full Coin List + Searching
  // ------------------------------------------
  const [coinList, setCoinList] = useState<
    Array<{
      id: string;
      symbol: string;
      name: string;
    }>
  >([]);
  const [loadingCoinList, setLoadingCoinList] = useState(false);
  const [coinListError, setCoinListError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<
    Array<{ id: string; symbol: string; name: string }>
  >([]);

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

  // Fetch full coin list once
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

  useEffect(() => {
    fetchCoinList();
  }, [fetchCoinList]);

  // Local search among coinList
  const searchCoins = useCallback(
    (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }
      const lower = query.toLowerCase();
      let filtered = coinList.filter(
        coin =>
          coin.name.toLowerCase().includes(lower) ||
          coin.symbol.toLowerCase().includes(lower),
      );
      // Sort => "famous" first
      filtered.sort((a, b) => {
        const aFamous = famousCoins.has(a.id) ? 1 : 0;
        const bFamous = famousCoins.has(b.id) ? 1 : 0;
        if (bFamous !== aFamous) {
          return bFamous - aFamous;
        }
        return a.name.localeCompare(b.name);
      });
      setSearchResults(filtered);
    },
    [coinList],
  );

  // ------------------------------------------
  // B) Single Coin + Timeframe
  // ------------------------------------------
  const [selectedCoinId, setSelectedCoinId] = useState<string>('');
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');

  // Market data
  const [marketCap, setMarketCap] = useState(0);
  const [fdv, setFdv] = useState(0);
  const [liquidityScore, setLiquidityScore] = useState(0);

  // OHLC chart data
  const [graphData, setGraphData] = useState<number[]>([]);
  const [timestamps, setTimestamps] = useState<number[]>([]);
  const [timeframePrice, setTimeframePrice] = useState(0);
  const [timeframeChangeUsd, setTimeframeChangeUsd] = useState(0);
  const [timeframeChangePercent, setTimeframeChangePercent] = useState(0);

  // Loading states & errors
  const [loadingMarketData, setLoadingMarketData] = useState(false);
  const [loadingOHLC, setLoadingOHLC] = useState(false);
  const [coinError, setCoinError] = useState<string | null>(null);

  // ------------------------------------------
  // Fetch logic
  // ------------------------------------------
  const fetchMarketData = useCallback(async (coinId: string) => {
    setLoadingMarketData(true);
    setCoinError(null);
    try {
      const market = await getCoinMarkets(coinId);
      setMarketCap(market.market_cap || 0);
      let computedFdv = market.fully_diluted_valuation;
      if (computedFdv == null) {
        if (market.total_supply && market.current_price) {
          computedFdv = market.total_supply * market.current_price;
        } else {
          computedFdv = market.market_cap;
        }
      }
      setFdv(computedFdv || 0);

      // Example liquidity = total_volume / market_cap * 100
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

  const fetchOhlcData = useCallback(
    async (coinId: string, selectedTf: Timeframe) => {
      setLoadingOHLC(true);
      setCoinError(null);

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
        const closeValues = rawData.map((arr: number[]) => arr[4]);
        const timeValues = rawData.map((arr: number[]) => arr[0]);

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
        } else {
          // Only 1 data point
          setTimeframePrice(closeValues[0] || 0);
          setTimeframeChangeUsd(0);
          setTimeframeChangePercent(0);
        }
      } catch (err: any) {
        setCoinError(err.message || 'Error fetching OHLC data');
        // If we want to preserve old data on error, do nothing else here
      } finally {
        setLoadingOHLC(false);
      }
    },
    [],
  );

  // ------------------------------------------
  // Debounce the selectedCoinId changes
  // ------------------------------------------
  const [debouncedCoinId, setDebouncedCoinId] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCoinId(selectedCoinId);
    }, 300); // 300ms

    return () => clearTimeout(timer);
  }, [selectedCoinId]);

  // ------------------------------------------
  // Automatic fetch on coin/timeframe changes
  // ------------------------------------------
  useEffect(() => {
    if (!debouncedCoinId) return;

    // We fetch market data & then OHLC data
    let cancelled = false;
    const fetchAll = async () => {
      await fetchMarketData(debouncedCoinId);
      if (!cancelled) {
        await fetchOhlcData(debouncedCoinId, timeframe);
      }
    };
    fetchAll();

    return () => {
      cancelled = true;
    };
  }, [debouncedCoinId, timeframe, fetchMarketData, fetchOhlcData]);

  // ------------------------------------------
  // Manual refresh
  // ------------------------------------------
  const refreshCoinData = useCallback(async () => {
    if (!debouncedCoinId) return;

    try {
      await fetchMarketData(debouncedCoinId);
      await fetchOhlcData(debouncedCoinId, timeframe);
    } catch (error) {
      console.error('Failed to refresh coin data:', error);
    }
  }, [debouncedCoinId, timeframe, fetchMarketData, fetchOhlcData]);

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

    // OHLC data + derived
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
