/**
 * File: src/services/swapTransactions.ts
 * 
 * Service for fetching and processing swap transactions for a user
 */

import { HELIUS_API_KEY } from '@env';
import { PublicKey } from '@solana/web3.js';

export interface TokenDetail {
  mint: string;
  symbol?: string;
  name?: string;
  amount: number;
  decimals: number;
  logoURI?: string;
}

export interface SwapTransaction {
  signature: string;
  timestamp: number;
  inputToken: TokenDetail;
  outputToken: TokenDetail;
  succeeded: boolean;
}

/**
 * Fetches recent swap transactions for a wallet address
 * 
 * @param walletAddress The wallet address to fetch swaps for
 * @param limit Number of swaps to fetch (default 15)
 * @returns Array of formatted swap transactions
 */
export const fetchRecentSwaps = async (walletAddress: string, limit: number = 15): Promise<SwapTransaction[]> => {
  if (!walletAddress) {
    throw new Error('Wallet address is required');
  }

  try {
    console.log('Fetching swap transactions for wallet:', walletAddress);
    const heliusUrl = `https://api.helius.xyz/v0/addresses/${walletAddress}/transactions?api-key=${HELIUS_API_KEY}&limit=50`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(heliusUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Helius fetch failed with status ${res.status}`);
    }

    const data = await res.json();
    console.log('Swap data received, total items:', data?.length || 0);
    
    // Filter swap transactions
    const swaps = data.filter((tx: any) => {
      // Check for swap events
      return tx.events?.swap || 
        (tx.type && tx.type.toLowerCase().includes('swap')) ||
        (tx.description && tx.description.toLowerCase().includes('swap'));
    });
    
    console.log('Swap transactions found:', swaps.length);
    
    // Process and format swap transactions
    const formattedSwaps = swaps
      .map((tx: any) => processSwapTransaction(tx, walletAddress))
      .filter(Boolean) // Remove null/undefined entries
      .slice(0, limit); // Limit to requested number
    
    return formattedSwaps;
  } catch (err: any) {
    console.error('Error fetching swap transactions:', err.message);
    throw new Error(err.message || 'Failed to fetch swap transactions');
  }
};

/**
 * Process a raw transaction to extract swap details
 */
function processSwapTransaction(tx: any, walletAddress: string): SwapTransaction | null {
  try {
    const swapEvent = tx.events?.swap;
    
    // Need to have a signature and timestamp
    if (!tx.signature || !tx.timestamp) {
      return null;
    }
    
    let inputToken: TokenDetail | null = null;
    let outputToken: TokenDetail | null = null;
    
    // Case 1: Token inputs/outputs from swap event
    if (swapEvent) {
      // Check token inputs
      if (swapEvent.tokenInputs && swapEvent.tokenInputs.length > 0) {
        const input = swapEvent.tokenInputs[0];
        if (input.userAccount === walletAddress && input.rawTokenAmount) {
          inputToken = {
            mint: input.mint,
            amount: parseFloat(input.rawTokenAmount.tokenAmount),
            decimals: parseInt(String(input.rawTokenAmount.decimals), 10),
          };
        }
      }
      
      // Check token outputs
      if (swapEvent.tokenOutputs && swapEvent.tokenOutputs.length > 0) {
        const output = swapEvent.tokenOutputs[0];
        if (output.userAccount === walletAddress && output.rawTokenAmount) {
          outputToken = {
            mint: output.mint,
            amount: parseFloat(output.rawTokenAmount.tokenAmount),
            decimals: parseInt(String(output.rawTokenAmount.decimals), 10),
          };
        }
      }
      
      // Check for native SOL input
      if (!inputToken && swapEvent.nativeInput && swapEvent.nativeInput.account === walletAddress) {
        const amount = typeof swapEvent.nativeInput.amount === 'string' 
          ? parseInt(swapEvent.nativeInput.amount, 10)
          : swapEvent.nativeInput.amount;
          
        inputToken = {
          mint: 'So11111111111111111111111111111111111111112', // wSOL
          symbol: 'SOL',
          name: 'Solana',
          amount: amount,
          decimals: 9,
        };
      }
      
      // Check for native SOL output
      if (!outputToken && swapEvent.nativeOutput && swapEvent.nativeOutput.account === walletAddress) {
        const amount = typeof swapEvent.nativeOutput.amount === 'string' 
          ? parseInt(swapEvent.nativeOutput.amount, 10)
          : swapEvent.nativeOutput.amount;
          
        outputToken = {
          mint: 'So11111111111111111111111111111111111111112', // wSOL
          symbol: 'SOL',
          name: 'Solana',
          amount: amount,
          decimals: 9,
        };
      }
    } 
    // Case 2: Try to extract from token transfers
    else if (tx.tokenTransfers && tx.tokenTransfers.length > 0) {
      // Find tokens sent and received by the wallet
      const sent = tx.tokenTransfers.find((t: any) => 
        t.fromUserAccount === walletAddress && t.tokenAmount > 0
      );
      
      const received = tx.tokenTransfers.find((t: any) => 
        t.toUserAccount === walletAddress && t.tokenAmount > 0
      );
      
      if (sent) {
        inputToken = {
          mint: sent.mint,
          symbol: sent.symbol,
          amount: sent.tokenAmount,
          decimals: 0, // Will be updated later through token info lookup
        };
      }
      
      if (received) {
        outputToken = {
          mint: received.mint,
          symbol: received.symbol,
          amount: received.tokenAmount,
          decimals: 0, // Will be updated later through token info lookup
        };
      }
    }
    
    // Need both input and output token for a valid swap
    if (!inputToken || !outputToken) {
      return null;
    }
    
    return {
      signature: tx.signature,
      timestamp: tx.timestamp,
      inputToken,
      outputToken,
      succeeded: true, // Assume succeeded since it's in the transaction history
    };
  } catch (err) {
    console.error('Error processing swap transaction:', err);
    return null;
  }
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

/**
 * Enriches swap transactions with token metadata
 */
export const enrichSwapTransactions = async (swaps: SwapTransaction[]): Promise<SwapTransaction[]> => {
  if (!swaps.length) return [];
  
  // Collect all unique token mints
  const tokenMints = new Set<string>();
  swaps.forEach(swap => {
    tokenMints.add(swap.inputToken.mint);
    tokenMints.add(swap.outputToken.mint);
  });
  
  // Fetch token metadata for all mints in parallel
  const tokenMetadataMap = new Map<string, any>();
  
  await Promise.all(
    Array.from(tokenMints).map(async (mint) => {
      const metadata = await fetchTokenMetadata(mint);
      if (metadata) {
        tokenMetadataMap.set(mint, metadata);
      }
    })
  );
  
  // Enrich swap transactions with token metadata
  return swaps.map(swap => {
    const inputMetadata = tokenMetadataMap.get(swap.inputToken.mint);
    const outputMetadata = tokenMetadataMap.get(swap.outputToken.mint);
    
    // Convert timestamp to milliseconds if needed
    // Most blockchain timestamps are in seconds, not milliseconds
    const timestamp = swap.timestamp < 10000000000 
      ? swap.timestamp * 1000  // Convert to milliseconds if in seconds
      : swap.timestamp;
      
    return {
      ...swap,
      timestamp, // Use the converted timestamp
      inputToken: {
        ...swap.inputToken,
        symbol: inputMetadata?.symbol || swap.inputToken.symbol || 'Unknown',
        name: inputMetadata?.name || swap.inputToken.name || 'Unknown Token',
        decimals: inputMetadata?.decimals || swap.inputToken.decimals,
        logoURI: inputMetadata?.logoURI || undefined,
      },
      outputToken: {
        ...swap.outputToken,
        symbol: outputMetadata?.symbol || swap.outputToken.symbol || 'Unknown',
        name: outputMetadata?.name || swap.outputToken.name || 'Unknown Token',
        decimals: outputMetadata?.decimals || swap.outputToken.decimals,
        logoURI: outputMetadata?.logoURI || undefined,
      }
    };
  });
}; 