// File: src/hooks/useCoinGeckoData.ts
import {COINGECKO_API_KEY} from '@env';
import {useState, useEffect, useCallback} from 'react';

/** Timeframe type */
export type Timeframe = '1H' | '1D' | '1W' | '1M' | 'All';

/**
 * useCoinGeckoData:
 * - Fetches OHLC data (graphData) for different timeframes using the new /ohlc endpoint.
 * - Computes timeframe-based price & changes.
 * - Also fetches market stats (market cap, liquidity, FDV) using the /coins/markets API.
 * - Additionally, extracts the coin's name and image.
 */
export function useCoinGeckoData(coinId: string) {
  const CG_API_KEY = COINGECKO_API_KEY || '';

  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const [graphData, setGraphData] = useState<number[]>([]);

  // Market stats from the /coins/markets endpoint
  const [marketCap, setMarketCap] = useState<number>(0);
  const [liquidityScore, setLiquidityScore] = useState<number>(0);
  const [fdv, setFdv] = useState<number>(0);

  // New states for coin name and image URL
  const [coinName, setCoinName] = useState<string>('');
  const [coinImage, setCoinImage] = useState<string>('');

  // Timeframe-based price & changes (from OHLC data)
  const [timeframePrice, setTimeframePrice] = useState<number>(0);
  const [timeframeChangeUsd, setTimeframeChangeUsd] = useState<number>(0);
  const [timeframeChangePercent, setTimeframeChangePercent] =
    useState<number>(0);

  // Separate loading states
  const [loadingStats, setLoadingStats] = useState<boolean>(false);
  const [loadingOHLC, setLoadingOHLC] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch market stats using the /coins/markets endpoint.
   * Calculates liquidity as: (total_volume / market_cap) * 100.
   * For FDV, uses fully_diluted_valuation if available; otherwise calculates
   * as total_supply * current_price, or falls back to market_cap.
   * Also extracts coin name and image.
   */
  const fetchCoinStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      setError(null);
      const url = `https://pro-api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinId}`;
      const resp = await fetch(url, {
        headers: {
          accept: 'application/json',
          'x-cg-pro-api-key': CG_API_KEY,
        },
      });
      if (!resp.ok) {
        throw new Error(`CoinGecko market data fetch failed: ${resp.status}`);
      }
      const data = await resp.json();
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No market data available for the specified coin.');
      }
      const coinData = data[0];
      setMarketCap(coinData.market_cap ?? 0);
      // Calculate liquidity percentage: (total_volume / market_cap) * 100
      const calculatedLiquidity = coinData.market_cap
        ? (coinData.total_volume / coinData.market_cap) * 100
        : 0;
      setLiquidityScore(calculatedLiquidity);
      // Calculate FDV: use fully_diluted_valuation if available; otherwise use total_supply * current_price or fallback to market_cap.
      const calculatedFdv =
        coinData.fully_diluted_valuation !== null
          ? coinData.fully_diluted_valuation
          : coinData.total_supply
          ? coinData.total_supply * coinData.current_price
          : coinData.market_cap;
      setFdv(calculatedFdv);
      // Set coin name and image from API response.
      setCoinName(coinData.name || '');
      setCoinImage(coinData.image || '');
    } catch (err: any) {
      console.error(err);
      setError('Error fetching market data from CoinGecko.');
    } finally {
      setLoadingStats(false);
    }
  }, [coinId, CG_API_KEY]);

  /**
   * Fetch OHLC (open-high-low-close) data for the chosen timeframe using the new endpoint.
   */
  const fetchOHLCData = useCallback(async () => {
    try {
      setLoadingOHLC(true);
      setError(null);
      // Map timeframe to days parameter for the new endpoint.
      let days: string;
      switch (timeframe) {
        case '1H':
          days = '1';
          break;
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
      }
      const ohlcURL = `https://pro-api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`;
      const resp = await fetch(ohlcURL, {
        headers: {
          accept: 'application/json',
          'x-cg-pro-api-key': CG_API_KEY,
        },
      });
      if (!resp.ok) {
        throw new Error(`CoinGecko OHLC fetch failed: ${resp.status}`);
      }
      const rawData = await resp.json();
      if (!Array.isArray(rawData)) {
        throw new Error('OHLC data is not an array.');
      }
      // Each item: [timestamp, open, high, low, close]
      const closeData = rawData.map((item: number[]) => item[4] || 0);
      setGraphData(closeData);
    } catch (err: any) {
      console.error(err);
      setError('Error fetching OHLC data from CoinGecko.');
    } finally {
      setLoadingOHLC(false);
    }
  }, [coinId, CG_API_KEY, timeframe]);

  /**
   * Derive timeframe-based price & changes from graphData:
   * - timeframePrice = last close
   * - timeframeChangeUsd = last close - first close
   * - timeframeChangePercent = (change / first close) * 100
   */
  useEffect(() => {
    if (graphData.length < 2) {
      setTimeframePrice(graphData[0] || 0);
      setTimeframeChangeUsd(0);
      setTimeframeChangePercent(0);
      return;
    }
    const openPrice = graphData[0];
    const closePrice = graphData[graphData.length - 1];
    const absChange = closePrice - openPrice;
    const pctChange = openPrice === 0 ? 0 : (absChange / openPrice) * 100;
    setTimeframePrice(closePrice);
    setTimeframeChangeUsd(absChange);
    setTimeframeChangePercent(pctChange);
  }, [graphData]);

  // Fetch market stats only on mount.
  useEffect(() => {
    fetchCoinStats();
  }, [fetchCoinStats]);

  // Re-fetch OHLC data whenever timeframe changes.
  useEffect(() => {
    fetchOHLCData();
  }, [fetchOHLCData]);

  return {
    timeframe,
    setTimeframe,
    // Chart data
    graphData,
    // Timeframe-based results
    timeframePrice,
    timeframeChangeUsd,
    timeframeChangePercent,
    // Market stats
    marketCap,
    liquidityScore,
    fdv,
    // New coin details
    coinName,
    coinImage,
    // Loading states
    loadingStats,
    loadingOHLC,
    error,
  };
}
