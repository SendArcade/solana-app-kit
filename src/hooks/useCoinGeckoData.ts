// FILE: src/hooks/useCoinGeckoData.ts

import {COINGECKO_API_KEY} from '@env';
import {useState, useEffect, useCallback} from 'react';

/** Timeframe type */
export type Timeframe = '1H' | '1D' | '1W' | '1M' | 'All';

/**
 * useCoinGeckoData:
 * - Fetches OHLC data (graphData) for different timeframes using the /ohlc endpoint.
 * - Computes timeframe-based price & changes from the OHLC data.
 * - Also fetches market stats (market cap, liquidity, FDV) using /coins/markets.
 * - Extracts coin's name/image from the same endpoint.
 *
 * This hook auto-fetches on:
 *   - Initial mount
 *   - timeframe changes
 *   - coinId changes
 *
 * It also exposes a `refreshCoinData()` method to re-fetch manually.
 */
export function useCoinGeckoData(coinId: string) {
  const CG_API_KEY = COINGECKO_API_KEY || '';

  // Timeframe
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');

  // Graph data (OHLC close values)
  const [graphData, setGraphData] = useState<number[]>([]);

  // Market stats
  const [marketCap, setMarketCap] = useState<number>(0);
  const [liquidityScore, setLiquidityScore] = useState<number>(0);
  const [fdv, setFdv] = useState<number>(0);

  // Coin details
  const [coinName, setCoinName] = useState<string>('');
  const [coinImage, setCoinImage] = useState<string>('');

  // Timeframe-based price & changes
  const [timeframePrice, setTimeframePrice] = useState<number>(0);
  const [timeframeChangeUsd, setTimeframeChangeUsd] = useState<number>(0);
  const [timeframeChangePercent, setTimeframeChangePercent] =
    useState<number>(0);

  // Loading states & error
  const [loadingStats, setLoadingStats] = useState<boolean>(false);
  const [loadingOHLC, setLoadingOHLC] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch market stats using the /coins/markets endpoint.
   * We get liquidity = (total_volume / market_cap)*100,
   * FDV from fully_diluted_valuation if present, otherwise fallback logic,
   * plus coinName & coinImage from the same response.
   */
  const fetchCoinStats = useCallback(async () => {
    if (!coinId) {
      // If no coinId, reset
      setCoinName('');
      setCoinImage('');
      setMarketCap(0);
      setLiquidityScore(0);
      setFdv(0);
      setError(null);
      return;
    }
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
        if (resp.status === 404) {
          setError(`No market data found for coinId: "${coinId}". (404)`);
          return;
        }
        throw new Error(`CoinGecko market data fetch failed: ${resp.status}`);
      }
      const data = await resp.json();
      if (!Array.isArray(data) || data.length === 0) {
        setError(
          `No market data available for the specified coin: "${coinId}".`,
        );
        return;
      }

      const coinData = data[0];
      setMarketCap(coinData.market_cap ?? 0);

      const calculatedLiquidity = coinData.market_cap
        ? (coinData.total_volume / coinData.market_cap) * 100
        : 0;
      setLiquidityScore(calculatedLiquidity);

      const calculatedFdv =
        coinData.fully_diluted_valuation !== null
          ? coinData.fully_diluted_valuation
          : coinData.total_supply
          ? coinData.total_supply * coinData.current_price
          : coinData.market_cap;
      setFdv(calculatedFdv);

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
   * Fetch OHLC data for the chosen timeframe from CoinGecko /ohlc endpoint.
   */
  const fetchOHLCData = useCallback(async () => {
    if (!coinId) {
      setGraphData([]);
      setTimeframePrice(0);
      setTimeframeChangeUsd(0);
      setTimeframeChangePercent(0);
      return;
    }
    try {
      setLoadingOHLC(true);
      setError(null);

      let days: string;
      switch (timeframe) {
        case '1H':
          // /ohlc lacks sub-day detail, fallback to 1 day
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
        if (resp.status === 404) {
          setError(`No OHLC data found for coinId: "${coinId}". (404)`);
          setGraphData([]);
          return;
        }
        throw new Error(`CoinGecko OHLC fetch failed: ${resp.status}`);
      }
      const rawData = await resp.json();
      if (!Array.isArray(rawData)) {
        setError('OHLC data is not an array.');
        setGraphData([]);
        return;
      }

      // each item => [timestamp, open, high, low, close]
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
   * Recompute timeframe-based price & changes whenever graphData updates.
   */
  useEffect(() => {
    if (graphData.length < 2) {
      // If 0 or 1 data points
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

  /**
   * Auto-fetch on mount, timeframe change, or coinId change.
   */
  useEffect(() => {
    fetchCoinStats();
    fetchOHLCData();
  }, [fetchCoinStats, fetchOHLCData, coinId, timeframe]);

  /**
   * A helper method to manually re-fetch everything on demand.
   */
  const refreshCoinData = useCallback(async () => {
    setError(null);
    await fetchCoinStats();
    await fetchOHLCData();
  }, [fetchCoinStats, fetchOHLCData]);

  return {
    timeframe,
    setTimeframe,
    graphData,
    timeframePrice,
    timeframeChangeUsd,
    timeframeChangePercent,
    marketCap,
    liquidityScore,
    fdv,
    coinName,
    coinImage,
    loadingStats,
    loadingOHLC,
    error,
    refreshCoinData, // <--- manual re-fetch on demand
  };
}
