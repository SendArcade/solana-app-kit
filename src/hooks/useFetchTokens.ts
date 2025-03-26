import {useState, useEffect} from 'react';
import {HELIUS_API_KEY} from '@env';
import {fetchUserAssets} from '../utils/common/fetch';

// Utility function to extract the best available image from an asset
export const extractAssetImage = (asset: any): string | undefined => {
  // Check all possible image sources in order of priority
  if (asset.content?.files && asset.content.files.length > 0) {
    // Check if there are files with uri/image_url in the content
    for (const file of asset.content.files) {
      if (file.uri && file.type?.includes('image')) return file.uri;
      if (file.image_url) return file.image_url;
    }
  }
  
  // Check for image in content metadata
  if (asset.content?.metadata?.image) return asset.content.metadata.image;
  
  // Check links
  if (asset.content?.links?.image) return asset.content.links.image;
  if (asset.links?.image) return asset.links.image;
  
  // Direct image property
  if (asset.image) return asset.image;
  
  // For NFTs, check JSON URI content
  if (asset.content?.json_uri) {
    // For optimal performance, we would fetch the JSON here
    // But to avoid extra requests, we'll return the JSON URI as a backup image source
    return asset.content.json_uri;
  }
  
  return undefined;
};

// Helper function to fix common image URI issues
export const fixImageUrl = (url: string): string => {
  if (!url) return '';
  
  // Convert ipfs:// URLs to HTTPS gateway URLs
  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
  }
  
  // Fix local arweave links
  if (url.startsWith('ar://')) {
    return url.replace('ar://', 'https://arweave.net/');
  }
  
  // Handle Solana on-chain data URLs
  if (url.startsWith('data:')) {
    return url;
  }
  
  // Add HTTPS if needed
  if (url.startsWith('//')) {
    return `https:${url}`;
  }
  
  if (!url.startsWith('http')) {
    return `https://${url}`;
  }
  
  return url;
};

// Function to determine the true asset type
export const determineAssetType = (asset: any): 'token' | 'nft' | 'cnft' => {
  // Explicit check for compressed NFTs
  if (asset.compression?.compressed) {
    return 'cnft';
  }

  // Check for fungible tokens
  if (
    asset.interface === 'FungibleToken' || 
    (asset.token_info && 
     (!asset.content?.metadata?.attributes || asset.content?.metadata?.token_standard === 'Fungible'))
  ) {
    return 'token';
  }

  // Check for regular NFTs
  if (
    asset.interface === 'V1_NFT' || 
    asset.interface === 'ProgrammableNFT' ||
    asset.content?.metadata?.token_standard === 'NonFungible' ||
    asset.content?.metadata?.token_standard === 'ProgrammableNonFungible'
  ) {
    return 'nft';
  }

  // Default fallback - if it has token info but no attributes, treat as token
  if (asset.token_info && !asset.content?.metadata?.attributes) {
    return 'token';
  }

  // Last resort, check decimals - fungible tokens typically have 6+
  if (asset.token_info?.decimals >= 6) {
    return 'token';
  }

  // If nothing else matches, assume it's an NFT
  return 'nft';
};

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
    price_info?: {
      price_per_token?: number;
      total_price?: number;
    };
  };
  inscription?: any;
  spl20?: any;
  assetType?: 'token' | 'nft' | 'cnft'; // Add new field to track determined type
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
        // Use the utility function to fetch assets from Helius DAS API
        const result = await fetchUserAssets(walletAddress);
        
        // Process the data to add image URLs and improve item data
        const processedItems = result.items.map((item: AssetItem) => {
          // Extract the best available image URL
          const imageUrl = extractAssetImage(item);
          
          // If no image was found through standard extraction, 
          // try other paths specific to this asset type
          let finalImageUrl = imageUrl;
          
          if (!finalImageUrl) {
            // For tokens, try to check for a known logo
            if (item.interface === 'FungibleToken' || item.token_info) {
              const symbol = (item.token_info?.symbol || item.symbol || '').toLowerCase();
              if (symbol === 'sol') {
                finalImageUrl = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png';
              } else if (symbol === 'usdc') {
                finalImageUrl = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/assets/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png';
              }
            }
          }
          
          // Set the image URL on the item
          item.image = finalImageUrl;
          
          // Make sure name and symbol are set properly
          item.name = item.content?.metadata?.name || item.token_info?.symbol || item.name || 'Unknown Asset';
          item.symbol = item.token_info?.symbol || item.content?.metadata?.symbol || item.symbol || '';
          
          // Determine and store the asset type
          item.assetType = determineAssetType(item);
          
          return item;
        });

        setPortfolio({
          items: processedItems,
          nativeBalance: result.nativeBalance,
          total: result.total,
          limit: result.limit,
          page: result.page,
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
  const tokens = portfolio.items.filter(item => item.assetType === 'token');
  
  return {tokens, loading, error};
}
