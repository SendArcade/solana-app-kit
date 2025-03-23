/**
 * File: src/services/profileActions.ts
 *
 * Service for fetching and handling profile actions/transactions.
 */

import { HELIUS_API_KEY } from '@env';

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
    
    return data || [];
  } catch (err: any) {
    console.error('Error fetching actions:', err.message);
    throw new Error(err.message || 'Failed to fetch actions');
  }
}; 