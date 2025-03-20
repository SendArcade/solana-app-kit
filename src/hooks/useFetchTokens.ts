import {useState, useEffect} from 'react';
import {fetchTokenAccounts, TokenEntry} from '../utils/common/fetch';

export function useFetchTokens(walletAddress?: string) {
  const [tokens, setTokens] = useState<TokenEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress) {
      setTokens([]);
      return;
    }
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const tokenAccounts = await fetchTokenAccounts(walletAddress);
        setTokens(tokenAccounts);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch tokens');
      } finally {
        setLoading(false);
      }
    })();
  }, [walletAddress]);

  return {tokens, loading, error};
}
