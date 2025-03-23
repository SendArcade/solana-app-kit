// FILE: src/hooks/useFetchNFTs.ts
import {useState, useEffect} from 'react';
import {fetchWithRetries, getRpcUrlForProvider} from '../utils/common/fetch';
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

interface FetchNFTsOptions {
  providerType?: 'privy' | 'dynamic' | 'turnkey' | 'mwa' | null;
  limit?: number;
}

export function useFetchNFTs(
  walletAddress?: string, 
  options: FetchNFTsOptions = {}
) {
  const [nfts, setNfts] = useState<NftItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { providerType = null, limit = 100 } = options;

  useEffect(() => {
    if (!walletAddress) {
      setNfts([]);
      return;
    }

    let isMounted = true;
    
    const fetchNFTs = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Use Tensor API which is less likely to have authorization issues
        const url = `${ENDPOINTS.tensorFlowBaseUrl}/api/v1/user/portfolio?wallet=${walletAddress}&includeUnverified=true&includeCompressed=true&includeFavouriteCount=true`;
        
        console.log(`Fetching NFTs for ${walletAddress}, provider: ${providerType || 'unknown'}`);
        
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
        
        if (!isMounted) return;
        
        const dataArray = Array.isArray(data) ? data : [];
        const parsed = dataArray
          .map((item: any) => {
            if (!item.setterMintMe) return null;
            return {
              mint: item.setterMintMe,
              name: item.name || 'Unnamed NFT',
              image: fixImageUrl(item.imageUri || ''),
              collection: item.slugDisplay || '',
              isCompressed: item.isCompressed || false
            };
          })
          .filter(Boolean) as NftItem[];
          
        setNfts(parsed);
      } catch (err: any) {
        console.error('Error fetching NFTs:', err);
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchNFTs();
    
    return () => {
      isMounted = false;
    };
  }, [walletAddress, providerType]);

  return {nfts, loading, error};
}
