/**
 * File: src/services/profileActions.ts
 *
 * Service for fetching and handling profile actions/transactions.
 */

import { HELIUS_API_KEY } from '@env';
import { createAsyncThunk } from '@reduxjs/toolkit';

// Basic action interface
export interface Action {
  signature?: string;
  slot?: number | string;
  transactionType?: string;
  type?: string;
  instructions?: any[];
  description?: string;
  fee?: number;
  timestamp?: number; // in seconds
  feePayer?: string;
  source?: string;
  events?: any;
  amount?: number;
  tokenTransfers?: any[];
  nativeTransfers?: any[];
  accountData?: any[];
  enrichedType?: string;
  enrichedData?: {
    swapType?: 'TOKEN_TO_TOKEN' | 'SOL_TO_TOKEN' | 'TOKEN_TO_SOL';
    transferType?: 'SOL' | 'TOKEN';
    inputSymbol?: string;
    outputSymbol?: string;
    tokenSymbol?: string;
    inputAmount?: number;
    outputAmount?: number;
    amount?: number;
    direction?: 'IN' | 'OUT' | 'NEUTRAL';
    counterparty?: string;
    decimals?: number;
  };
}

/**
 * Redux thunk for fetching wallet actions
 */
export const fetchWalletActionsAsync = createAsyncThunk(
  'profile/fetchWalletActions',
  async (walletAddress: string, { rejectWithValue }) => {
    if (!walletAddress) {
      return rejectWithValue('Wallet address is required');
    }

    try {
      console.log('Fetching actions for wallet:', walletAddress);
      const heliusUrl = `https://api.helius.xyz/v0/addresses/${walletAddress}/transactions?api-key=${HELIUS_API_KEY}&limit=20`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(heliusUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Helius fetch failed with status ${res.status}`);
      }

      const data = await res.json();
      console.log('Data received, items:', data?.length || 0);
      
      // Enrich the data with better formatted information
      const enrichedData = await enrichActionTransactions(data, walletAddress);
      return enrichedData || [];
    } catch (err: any) {
      console.error('Error fetching actions:', err.message);
      return rejectWithValue(err.message || 'Failed to fetch actions');
    }
  }
);

/**
 * Fetch recent blockchain actions for a wallet
 * 
 * @param walletAddress The wallet address to fetch actions for
 * @param limit Number of actions to fetch (default 20)
 * @returns Array of action objects
 */
export const fetchWalletActions = async (walletAddress: string, limit: number = 20) => {
  if (!walletAddress) {
    throw new Error('Wallet address is required');
  }

  try {
    console.log('Fetching actions for wallet:', walletAddress);
    const heliusUrl = `https://api.helius.xyz/v0/addresses/${walletAddress}/transactions?api-key=${HELIUS_API_KEY}&limit=${limit}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(heliusUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Helius fetch failed with status ${res.status}`);
    }

    const data = await res.json();
    console.log('Data received, items:', data?.length || 0);
    
    // Enrich the data with better formatted information
    const enrichedData = await enrichActionTransactions(data, walletAddress);
    return enrichedData || [];
  } catch (err: any) {
    console.error('Error fetching actions:', err.message);
    throw new Error(err.message || 'Failed to fetch actions');
  }
}; 

/**
 * Enrich transaction data with more usable information
 */
export const enrichActionTransactions = async (actions: Action[], walletAddress: string) => {
  if (!actions || actions.length === 0) return [];
  
  return actions.map(action => {
    // Determine transaction type with more specificity
    let enrichedType = action.type || action.transactionType || 'UNKNOWN';
    
    // Process swap transactions
    if (action.events?.swap) {
      enrichedType = 'SWAP';
      
      // Extract swap details if available
      const swap = action.events.swap;
      const hasTokenInputs = swap.tokenInputs && swap.tokenInputs.length > 0;
      const hasTokenOutputs = swap.tokenOutputs && swap.tokenOutputs.length > 0;
      
      if (hasTokenInputs && hasTokenOutputs) {
        // Extract token symbols if available
        const inputToken = swap.tokenInputs[0];
        const outputToken = swap.tokenOutputs[0];
        
        const inputAmount = inputToken.rawTokenAmount?.tokenAmount 
          ? parseFloat(inputToken.rawTokenAmount.tokenAmount) / Math.pow(10, inputToken.rawTokenAmount.decimals || 0)
          : 0;
          
        const outputAmount = outputToken.rawTokenAmount?.tokenAmount
          ? parseFloat(outputToken.rawTokenAmount.tokenAmount) / Math.pow(10, outputToken.rawTokenAmount.decimals || 0)
          : 0;
          
        // Add enriched info
        action.enrichedData = {
          swapType: 'TOKEN_TO_TOKEN',
          inputSymbol: truncateAddress(inputToken.mint),
          outputSymbol: truncateAddress(outputToken.mint),
          inputAmount,
          outputAmount,
          direction: inputToken.userAccount === walletAddress ? 'OUT' : 'IN'
        };
      } else if (swap.nativeInput && hasTokenOutputs) {
        // SOL to token swap
        const outputToken = swap.tokenOutputs[0];
        const outputAmount = outputToken.rawTokenAmount?.tokenAmount
          ? parseFloat(outputToken.rawTokenAmount.tokenAmount) / Math.pow(10, outputToken.rawTokenAmount.decimals || 0)
          : 0;
          
        action.enrichedData = {
          swapType: 'SOL_TO_TOKEN',
          inputSymbol: 'SOL',
          outputSymbol: truncateAddress(outputToken.mint),
          inputAmount: swap.nativeInput.amount / 1_000_000_000, // lamports to SOL
          outputAmount,
          direction: swap.nativeInput.account === walletAddress ? 'OUT' : 'IN'
        };
      } else if (hasTokenInputs && swap.nativeOutput) {
        // Token to SOL swap
        const inputToken = swap.tokenInputs[0];
        const inputAmount = inputToken.rawTokenAmount?.tokenAmount
          ? parseFloat(inputToken.rawTokenAmount.tokenAmount) / Math.pow(10, inputToken.rawTokenAmount.decimals || 0)
          : 0;
          
        action.enrichedData = {
          swapType: 'TOKEN_TO_SOL',
          inputSymbol: truncateAddress(inputToken.mint),
          outputSymbol: 'SOL',
          inputAmount,
          outputAmount: swap.nativeOutput.amount / 1_000_000_000, // lamports to SOL
          direction: inputToken.userAccount === walletAddress ? 'OUT' : 'IN'
        };
      }
    }
    
    // Process transfer transactions
    else if (action.nativeTransfers && action.nativeTransfers.length > 0) {
      enrichedType = 'TRANSFER';
      const transfer = action.nativeTransfers[0];
      
      action.enrichedData = {
        transferType: 'SOL',
        amount: transfer.amount / 1_000_000_000, // lamports to SOL
        direction: transfer.fromUserAccount === walletAddress ? 'OUT' : 'IN',
        counterparty: transfer.fromUserAccount === walletAddress 
          ? truncateAddress(transfer.toUserAccount)
          : truncateAddress(transfer.fromUserAccount)
      };
    }
    
    // Process token transfers
    else if (action.tokenTransfers && action.tokenTransfers.length > 0) {
      enrichedType = 'TOKEN_TRANSFER';
      const transfer = action.tokenTransfers[0];
      
      action.enrichedData = {
        transferType: 'TOKEN',
        tokenSymbol: transfer.symbol || truncateAddress(transfer.mint),
        amount: transfer.tokenAmount,
        direction: transfer.fromUserAccount === walletAddress ? 'OUT' : 'IN',
        counterparty: transfer.fromUserAccount === walletAddress 
          ? truncateAddress(transfer.toUserAccount)
          : truncateAddress(transfer.fromUserAccount),
        decimals: transfer.decimals || 0
      };
    }
    
    return {
      ...action,
      enrichedType
    };
  });
};

/**
 * Helper to truncate addresses for display
 */
function truncateAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return address.slice(0, 4) + '...' + address.slice(-4);
} 