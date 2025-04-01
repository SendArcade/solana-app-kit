import { Connection } from '@solana/web3.js';
import { useMemo } from 'react';
import { ENDPOINTS } from '../config/constants';
import { HELIUS_RPC_URL } from '@env';

/**
 * Hook to get a Solana Connection instance.
 * This automatically uses the best available RPC URL from environment variables or constants.
 */
export function useSolanaConnection(): Connection {
  return useMemo(() => {
    // First try to use Helius RPC URL from environment variables
    const rpcUrl = HELIUS_RPC_URL || ENDPOINTS.mainnet || 'https://api.mainnet-beta.solana.com';
    
    return new Connection(rpcUrl, 'confirmed');
  }, []);
} 