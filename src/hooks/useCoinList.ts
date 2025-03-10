// File: src/hooks/useCoinList.ts
import {useEffect, useState, useCallback} from 'react';
import {COINGECKO_API_KEY} from '@env';

/**
 * Represents a single coin item from the CoinGecko list API
 */
export interface CoinListItem {
  id: string;
  symbol: string;
  name: string;
  // The 'platforms' object is omitted here, but can be added if needed
}

/**
 * Hook for fetching all coins from CoinGecko and providing a local search
 * by name or symbol.
 */
export function useCoinList() {
  const [coinList, setCoinList] = useState<CoinListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // fetch coin list on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);

      try {
        const url = 'https://pro-api.coingecko.com/api/v3/coins/list';
        const resp = await fetch(url, {
          headers: {
            accept: 'application/json',
            'x-cg-pro-api-key': COINGECKO_API_KEY || '',
          },
        });
        if (!resp.ok) {
          throw new Error(`CoinGecko list fetch failed: ${resp.status}`);
        }
        const data = await resp.json();
        if (mounted) {
          // data is an array of { id, symbol, name, platforms {} }
          setCoinList(data);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Local search function that filters coinList by name/symbol,
   * then sorts results so that famous coins appear first.
   */
  const searchCoins = useCallback(
    (query: string): CoinListItem[] => {
      if (!query.trim()) {
        return [];
      }
      const lowerQuery = query.toLowerCase();
      // Famous coins that should appear first
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

      const filtered = coinList.filter(
        coin =>
          coin.name.toLowerCase().includes(lowerQuery) ||
          coin.symbol.toLowerCase().includes(lowerQuery),
      );

      return filtered.sort((a, b) => {
        const aFamous = famousCoins.has(a.id) ? 1 : 0;
        const bFamous = famousCoins.has(b.id) ? 1 : 0;
        if (aFamous !== bFamous) {
          // Place famous coins first
          return bFamous - aFamous;
        }
        // Then sort by index of query in name (lower index = better match)
        const aIndex = a.name.toLowerCase().indexOf(lowerQuery);
        const bIndex = b.name.toLowerCase().indexOf(lowerQuery);
        if (aIndex !== bIndex) {
          return aIndex - bIndex;
        }
        // Fallback: sort alphabetically by name
        return a.name.localeCompare(b.name);
      });
    },
    [coinList],
  );

  return {coinList, searchCoins, loading, error};
}
