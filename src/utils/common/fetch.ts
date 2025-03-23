// File: src/utils/common/fetch.ts

import {CLUSTER, HELIUS_API_KEY} from '@env';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';

// Helper function to get the correct RPC URL based on provider
export function getRpcUrlForProvider(provider: string | null = null) {
  // If no provider is explicitly passed, try to get from Redux (requires hook context)
  const heliusUrl = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
  
  return heliusUrl;
}

export async function fetchWithRetries(
  url: string,
  options: RequestInit = {},
  maxRetries = 2,
  baseDelay = 500,
): Promise<Response> {
  let attempt = 0;
  let lastError: any;

  while (attempt < maxRetries) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        // e.g. 429, 5xx
        const bodyText = await res.text();
        throw new Error(`HTTP status ${res.status}, body=${bodyText}`);
      }
      return res;
    } catch (err: any) {
      lastError = err;
      attempt++;
      if (attempt >= maxRetries) break;

      // Exponential backoff
      const delayMs = baseDelay * Math.pow(2, attempt - 1);
      console.warn(
        `[fetchWithRetries] Attempt ${attempt} failed: ${err.message}.\nRetrying after ${delayMs}ms...`,
      );
      await new Promise(res => setTimeout(res, delayMs));
    }
  }
  throw new Error(
    `[fetchWithRetries] All ${maxRetries} attempts failed. Last error: ${
      lastError?.message ?? lastError
    }`,
  );
}

// Fetch user's SOL balance
export async function fetchSolBalance(
  userPublicKey: string,
): Promise<number | null> {
  try {
    const url = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
    const body = {
      jsonrpc: '2.0',
      id: 'get-balance-1',
      method: 'getBalance',
      params: [userPublicKey],
    };
    const res = await fetchWithRetries(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data?.result?.value) {
      return data.result.value;
    } else {
      console.warn('No "value" in getBalance result', data);
      return null;
    }
  } catch (err) {
    console.error('Error in fetchSolBalance:', err);
    return null;
  }
}

export type TokenEntry = {
  accountPubkey: string;
  mintPubkey: string;
  uiAmount: number;
  decimals: number;
};

// Fetch user's assets via Helius DAS API (includes tokens, NFTs, and cNFTs)
export async function fetchUserAssets(walletAddress: string) {
  try {
    const url = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
    const response = await fetchWithRetries(url, {
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
      throw new Error(data.error.message || 'Failed to fetch assets');
    }
    
    return data.result;
  } catch (err) {
    console.error('Error fetching user assets:', err);
    throw err;
  }
}

// Legacy fetch token accounts (for backward compatibility)
export async function fetchTokenAccounts(
  userPublicKey: string,
): Promise<TokenEntry[]> {
  try {
    // Try to use the Helius DAS API first
    const assets = await fetchUserAssets(userPublicKey);
    const tokenItems = assets.items.filter(
      (item: any) => 
        item.interface === 'V1_TOKEN' || 
        item.interface === 'FungibleToken' ||
        (item.token_info && item.token_info.balance)
    );
    
    // Convert to the legacy TokenEntry format
    return tokenItems.map((item: any) => {
      const decimals = item.token_info?.decimals || 0;
      const balance = item.token_info?.balance || '0';
      
      return {
        accountPubkey: item.token_info?.associated_token_address || '',
        mintPubkey: item.id || item.mint,
        uiAmount: parseInt(balance) / Math.pow(10, decimals),
        decimals,
      };
    });
  } catch (err) {
    console.error('Error in fetchTokenAccounts:', err);
    
    // Fall back to legacy method if Helius fails
    try {
      const url = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
      const body = {
        jsonrpc: '2.0',
        id: 'get-tkn-accs-1',
        method: 'getTokenAccountsByOwner',
        params: [
          userPublicKey,
          {programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'},
          {encoding: 'jsonParsed'},
        ],
      };

      const res = await fetchWithRetries(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!data?.result?.value) {
        console.warn('No token accounts found for user');
        return [];
      }

      const rawAccounts = data.result.value;
      const tokenEntries: TokenEntry[] = [];

      for (const acct of rawAccounts) {
        const accountPubkey = acct.pubkey;
        const mintPubkey = acct?.account?.data?.parsed?.info?.mint || '';

        // Now fetch each token account's balance
        const balObj = await fetchTokenAccountBalance(accountPubkey);
        if (balObj.uiAmount && balObj.uiAmount > 0) {
          tokenEntries.push({
            accountPubkey,
            mintPubkey,
            uiAmount: balObj.uiAmount,
            decimals: balObj.decimals,
          });
        }
      }
      return tokenEntries;
    } catch (fallbackErr) {
      console.error('Fallback method also failed:', fallbackErr);
      return [];
    }
  }
}

// For each token account, get its balance via getTokenAccountBalance
export async function fetchTokenAccountBalance(tokenAccount: string) {
  try {
    const url = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
    const body = {
      jsonrpc: '2.0',
      id: 'token-balance-1',
      method: 'getTokenAccountBalance',
      params: [tokenAccount],
    };
    const res = await fetchWithRetries(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data?.result?.value) {
      // returns { uiAmount, decimals, amount, uiAmountString, ...}
      return data.result.value;
    }
    return {uiAmount: 0, decimals: 0};
  } catch (err) {
    console.warn(`Error in fetchTokenAccountBalance for ${tokenAccount}:`, err);
    return {uiAmount: 0, decimals: 0};
  }
}

// File: src/utils/solanaWithRetries.ts
import {Connection, PublicKey} from '@solana/web3.js';

export async function getBalanceWithRetries(
  connection: Connection,
  pubkey: PublicKey,
  maxRetries = 3,
  baseDelay = 1000,
): Promise<number> {
  let attempt = 0;
  let lastError: any;
  while (attempt < maxRetries) {
    try {
      return await connection.getBalance(pubkey);
    } catch (err: any) {
      lastError = err;
      attempt++;
      if (attempt >= maxRetries) break;

      const delayMs = baseDelay * Math.pow(2, attempt - 1);
      console.warn(
        `[getBalanceWithRetries] Attempt ${attempt} failed: ${err.message}. Retrying after ${delayMs}ms...`,
      );
      await new Promise(res => setTimeout(res, delayMs));
    }
  }
  throw new Error(
    `[getBalanceWithRetries] All ${maxRetries} attempts failed. Last error: ${
      lastError?.message || lastError
    }`,
  );
}
