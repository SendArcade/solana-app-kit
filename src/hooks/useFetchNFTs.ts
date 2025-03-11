// FILE: src/hooks/useFetchNFTs.ts
import {useState, useEffect} from 'react';
import {fetchWithRetries} from '../utils/common/fetch';
import {TENSOR_API_KEY} from '@env';
import {fixImageUrl} from '../utils/common/fixUrl';
import { ENDPOINTS } from '../config/constants';

export interface NftItem {
  mint: string;
  name: string;
  image: string;
  collection?: string;
  isCompressed : boolean
}

export function useFetchNFTs(walletAddress?: string) {
  const [nfts, setNfts] = useState<NftItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress) {
      setNfts([]);
      return;
    }
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `${ENDPOINTS.tensorFlowBaseUrl}/api/v1/user/portfolio?wallet=${walletAddress}&includeUnverified=true&includeCompressed=true&includeFavouriteCount=true`;
        const resp = await fetchWithRetries(url, {
          method: 'GET',
          headers: {
            accept: 'application/json',
            'x-tensor-api-key': TENSOR_API_KEY,
          },
        });
        if (!resp.ok) {
          throw new Error(`Fetch NFTs failed: ${resp.status}`);
        }
        const data = await resp.json();
        const dataArray = Array.isArray(data) ? data : [];
        const parsed = dataArray
          .map((item: any) => {
            if (!item.setterMintMe) return null;
            return {
              mint: item.setterMintMe,
              name: item.name || 'Unnamed NFT',
              image: fixImageUrl(item.imageUri || ''),
              collection: item.slugDisplay || '',
            };
          })
          .filter(Boolean) as NftItem[];
        setNfts(parsed);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [walletAddress]);

  return {nfts, loading, error};
}
