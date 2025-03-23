import {useState, useEffect} from 'react';
import {HELIUS_API_KEY} from '@env';
import {extractAssetImage} from '../utils/common/fixUrl';

export interface AssetItem {
  id: string;
  content?: {
    json_uri?: string;
    metadata?: any;
    files?: any[];
    links?: any;
  };
  authorities?: any[];
  compression?: {
    compressed: boolean;
    data_hash: string;
    creator_hash: string;
    eligible: boolean;
    leaf_id: number;
    tree_id: string;
  };
  grouping?: any[];
  royalty?: {
    basis_points: number;
    primary_sale_happened: boolean;
    target: string;
  };
  creators?: any[];
  ownership?: {
    owner: string;
    delegate: string;
    delegated: boolean;
    burnt: boolean;
    supply: number;
    mutable: boolean;
  };
  uses?: any;
  supply?: any;
  interface: string;
  links?: any;
  mint: string;
  name: string;
  symbol: string;
  collection?: {
    name?: string;
    family?: string;
  };
  attributes?: any[];
  image?: string;
  description?: string;
  token_info?: {
    symbol: string;
    balance: string;
    decimals: number;
    token_program: string;
  };
  inscription?: any;
  spl20?: any;
}

export interface PortfolioData {
  items: AssetItem[];
  nativeBalance?: {
    lamports: number;
  };
  total: number;
  limit: number;
  page: number;
  error?: string;
}

export function useFetchPortfolio(walletAddress?: string) {
  const [portfolio, setPortfolio] = useState<PortfolioData>({
    items: [],
    total: 0,
    limit: 0,
    page: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress) {
      setPortfolio({
        items: [],
        total: 0,
        limit: 0,
        page: 1,
      });
      return;
    }

    const fetchPortfolio = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 'portfolio-fetch',
            method: 'getAssetsByOwner',
            params: {
              ownerAddress: walletAddress,
              page: 1,
              limit: 1000,
              displayOptions: {
                showFungible: true,
                showNativeBalance: true,
                showInscription: true,
              },
            },
          }),
        });

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error.message || 'Failed to fetch portfolio');
        }

        // Process the data to add image URLs if they're missing
        const processedItems = data.result.items.map((item: AssetItem) => {
          // Extract image URL using our improved function
          if (!item.image) {
            item.image = extractAssetImage(item);
          }
          
          return item;
        });

        setPortfolio({
          items: processedItems,
          nativeBalance: data.result.nativeBalance,
          total: data.result.total,
          limit: data.result.limit,
          page: data.result.page,
        });
      } catch (err: any) {
        console.error('Portfolio fetch error:', err);
        setError(err.message || 'Failed to fetch portfolio');
        setPortfolio(prev => ({...prev, error: err.message}));
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, [walletAddress]);

  return {portfolio, loading, error};
}

// Keep the original hook for backwards compatibility
export function useFetchTokens(walletAddress?: string) {
  const {portfolio, loading, error} = useFetchPortfolio(walletAddress);
  
  // Filter out just the fungible tokens from the portfolio
  const tokens = portfolio.items.filter(item => 
    item.interface === 'V1_TOKEN' || 
    (item.token_info && item.token_info.balance)
  );
  
  return {tokens, loading, error};
}
