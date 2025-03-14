// FILE: src/services/coingeckoService.ts
import {COINGECKO_API_KEY} from '@env';

/**
 * A collection of asynchronous functions to interface with the CoinGecko API.
 * All fetch logic resides here to keep business logic separate from hooks/components.
 */

const BASE_URL = 'https://pro-api.coingecko.com/api/v3';

/**
 * Fetch the full coin list.
 * NOTE: The raw list can be large, so be mindful of performance.
 */
export async function getCoinList(): Promise<
  Array<{
    id: string;
    symbol: string;
    name: string;
  }>
> {
  const url = `${BASE_URL}/coins/list`;
  const resp = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'x-cg-pro-api-key': COINGECKO_API_KEY || '',
    },
  });
  if (!resp.ok) {
    throw new Error(`CoinGecko list fetch failed: ${resp.status}`);
  }
  const data = await resp.json();
  if (!Array.isArray(data)) {
    throw new Error('CoinGecko list response was not an array.');
  }
  return data;
}

/**
 * Fetch market data for a specific coin (price, market cap, FDV, image, etc).
 * Typically used for the "coin detail" screen.
 */
export async function getCoinMarkets(coinId: string) {
  const url = `${BASE_URL}/coins/markets?vs_currency=usd&ids=${coinId}`;
  const resp = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'x-cg-pro-api-key': COINGECKO_API_KEY || '',
    },
  });
  if (!resp.ok) {
    if (resp.status === 404) {
      throw new Error(`No market data found for coinId=${coinId} (404).`);
    }
    throw new Error(`CoinGecko market data fetch failed: ${resp.status}`);
  }

  const data = await resp.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`No market data available for coinId=${coinId}.`);
  }
  return data[0]; // Return the first (and likely only) object
}

/**
 * Fetch OHLC (open-high-low-close) data for the specified coin and time duration.
 * `days` can be '1', '7', '30', 'max', etc.
 */
export async function getCoinOHLC(coinId: string, days: string) {
  const url = `${BASE_URL}/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`;
  const resp = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'x-cg-pro-api-key': COINGECKO_API_KEY || '',
    },
  });
  if (!resp.ok) {
    if (resp.status === 404) {
      throw new Error(`No OHLC data found for coinId=${coinId} (404).`);
    }
    throw new Error(`CoinGecko OHLC fetch failed: ${resp.status}`);
  }
  const rawData = await resp.json();
  if (!Array.isArray(rawData)) {
    throw new Error(`OHLC data for coinId=${coinId} is not an array.`);
  }
  return rawData;
}
