/**
 * File: src/services/swapTransactions.ts
 * 
 * Service for fetching and processing swap transactions for a user
 */

import { HELIUS_API_KEY, HELIUS_RPC_URL, CLUSTER } from '@env';
import { PublicKey, Connection, clusterApiUrl, Cluster } from '@solana/web3.js';
import { ENDPOINTS } from '../config/constants';

export interface TokenMetadata {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  amount: number;
  image?: string;
  price_info?: {
    price_per_token?: number;
    total_price?: number;
  };
}

export interface SwapTransaction {
  signature: string;
  timestamp: number;
  inputToken: TokenMetadata;
  outputToken: TokenMetadata;
  success: boolean;
  fee?: number;
}

/**
 * Fetches recent swap transactions for a wallet
 */
export const fetchRecentSwaps = async (walletAddress: string): Promise<SwapTransaction[]> => {
  try {
    if (!walletAddress) {
      return [];
    }

    // Use Helius API or fallback to cluster API URL
    const rpcUrl = HELIUS_RPC_URL || ENDPOINTS.helius || clusterApiUrl(CLUSTER as Cluster);
    
    // Get swap transaction signatures (adjust limit as needed)
    const params = {
      method: 'searchAssets',
      params: {
        ownerAddress: walletAddress,
        tokenType: 'all',
        displayOptions: {
          showGrandTotal: true
        }
      }
    };

    // Enhanced request to get swap transactions using Helius
    const swapsResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: '1',
        method: 'getSignaturesForAddress',
        params: [walletAddress, { limit: 20 }],
      }),
    });

    const swapsData = await swapsResponse.json();
    
    if (!swapsData.result || !Array.isArray(swapsData.result)) {
      return [];
    }

    // Filter for likely swap signatures and get transaction details
    const swapSignatures = swapsData.result
      .filter((tx: any) => !tx.err) // Filter out errors
      .map((tx: any) => ({
        signature: tx.signature,
        timestamp: tx.blockTime * 1000 // Convert to milliseconds
      }));

    if (swapSignatures.length === 0) {
      return [];
    }

    // Basic mapping of raw transactions to SwapTransaction objects
    const swaps: SwapTransaction[] = swapSignatures.map((sig: any) => ({
      signature: sig.signature,
      timestamp: sig.timestamp,
      inputToken: {
        mint: '', // Will be filled by enrichment
        symbol: 'Unknown',
        name: 'Unknown Token',
        decimals: 9,
        amount: 0
      },
      outputToken: {
        mint: '', // Will be filled by enrichment
        symbol: 'Unknown',
        name: 'Unknown Token',
        decimals: 9,
        amount: 0
      },
      success: true
    }));

    return swaps;
  } catch (error) {
    console.error('Error fetching recent swaps:', error);
    return [];
  }
};

/**
 * Enriches swap transactions with token metadata
 */
export const enrichSwapTransactions = async (swaps: SwapTransaction[]): Promise<SwapTransaction[]> => {
  try {
    if (swaps.length === 0) {
      return [];
    }

    // Collect all unique token mints
    const tokenMints = new Set<string>();
    swaps.forEach(swap => {
      if (swap.inputToken.mint) tokenMints.add(swap.inputToken.mint);
      if (swap.outputToken.mint) tokenMints.add(swap.outputToken.mint);
    });

    // Fetch metadata for all tokens at once
    const tokenMetadataMap = new Map<string, any>();
    await Promise.all(
      Array.from(tokenMints).map(async mint => {
        if (!mint) return;
        const metadata = await fetchTokenMetadata(mint);
        if (metadata) {
          tokenMetadataMap.set(mint, metadata);
        }
      })
    );

    // Here we would use a token list or API to get token metadata for each swap
    // This is a simplified implementation
    const enrichedSwaps = await Promise.all(
      swaps.map(async (swap) => {
        try {
          // For each swap, we would get detailed transaction information
          // and extract the input and output tokens
          const rpcUrl = HELIUS_RPC_URL || ENDPOINTS.helius || clusterApiUrl(CLUSTER as Cluster);
          
          const txResponse = await fetch(rpcUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: '1',
              method: 'getTransaction',
              params: [
                swap.signature,
                { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }
              ],
            }),
          });
          
          const txData = await txResponse.json();
          
          if (txData.result) {
            // This is simplified - in a real implementation, you would parse
            // the transaction to identify the swap inputs and outputs
            
            // Try to extract token information from instructions
            const enrichedSwap = parseSwapFromTransaction(txData.result, swap);
            
            // Enrich with token metadata if available
            if (enrichedSwap.inputToken.mint && tokenMetadataMap.has(enrichedSwap.inputToken.mint)) {
              const metadata = tokenMetadataMap.get(enrichedSwap.inputToken.mint);
              enrichedSwap.inputToken.symbol = metadata.symbol || enrichedSwap.inputToken.symbol;
              enrichedSwap.inputToken.name = metadata.name || enrichedSwap.inputToken.name;
              enrichedSwap.inputToken.decimals = metadata.decimals || enrichedSwap.inputToken.decimals;
              if (metadata.logoURI) {
                enrichedSwap.inputToken.image = metadata.logoURI;
              }
            }
            
            if (enrichedSwap.outputToken.mint && tokenMetadataMap.has(enrichedSwap.outputToken.mint)) {
              const metadata = tokenMetadataMap.get(enrichedSwap.outputToken.mint);
              enrichedSwap.outputToken.symbol = metadata.symbol || enrichedSwap.outputToken.symbol;
              enrichedSwap.outputToken.name = metadata.name || enrichedSwap.outputToken.name;
              enrichedSwap.outputToken.decimals = metadata.decimals || enrichedSwap.outputToken.decimals;
              if (metadata.logoURI) {
                enrichedSwap.outputToken.image = metadata.logoURI;
              }
            }
            
            return enrichedSwap;
          }
          
          return swap;
        } catch (error) {
          console.error(`Error enriching swap ${swap.signature}:`, error);
          return swap;
        }
      })
    );

    return enrichedSwaps;
  } catch (error) {
    console.error('Error enriching swap transactions:', error);
    return swaps;
  }
};

/**
 * Parse swap details from a transaction object
 * This is a simplified implementation that would need to be expanded
 */
function parseSwapFromTransaction(txData: any, swap: SwapTransaction): SwapTransaction {
  // In a real implementation, we would parse the transaction instructions
  // to identify the input and output tokens, amounts, etc.
  // For this example, we'll just use placeholder data
  
  // Sample implementation - you would replace this with actual parsing logic
  const updatedSwap = {
    ...swap,
    inputToken: {
      ...swap.inputToken,
      mint: 'So11111111111111111111111111111111111111112', // Example: SOL
      symbol: 'SOL',
      name: 'Solana',
      decimals: 9,
      amount: 100000000 // 0.1 SOL
    },
    outputToken: {
      ...swap.outputToken,
      mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // Example: USDC
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      amount: 1500000 // 1.5 USDC
    }
  };
  
  return updatedSwap;
}

/**
 * Fetch token metadata from Jupiter API
 */
export const fetchTokenMetadata = async (mint: string): Promise<any> => {
  try {
    if (!mint) return null;
    
    // wSOL is a special case
    if (mint === 'So11111111111111111111111111111111111111112') {
      return {
        mint,
        symbol: 'SOL',
        name: 'Solana',
        decimals: 9,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
      };
    }
    
    const response = await fetch(`https://api.jup.ag/tokens/v1/token/${mint}`);
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (err) {
    console.error(`Error fetching token metadata for ${mint}:`, err);
    return null;
  }
}; 