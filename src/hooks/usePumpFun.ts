// File: src/hooks/usePumpfun.ts

import {useCallback} from 'react';
import {Alert} from 'react-native';
import {useAuth} from './useAuth';
import {useWallet} from './useWallet';
import {
  buyTokenViaPumpfun,
  sellTokenViaPumpfun,
  createAndBuyTokenViaPumpfun,
} from '../services/pumpfun/pumpfunService';

/**
 * usePumpfun hook: centralizes buy, sell, and launch logic for Pumpfun tokens.
 */
export function usePumpFun() {
  const {wallet, solanaWallet} = useAuth();
  // Also use the new useWallet hook which provides standard transaction methods
  const {publicKey, address, connected} = useWallet();
  
  console.log("[usePumpFun] Wallet:", {
    hasWallet: !!wallet,
    hasLegacyWallet: !!solanaWallet,
    walletType: wallet?.provider || 'none',
    publicKey: wallet?.publicKey || solanaWallet?.wallets?.[0]?.publicKey || 'none',
    connected
  });

  /**
   * BUY
   */
  const buyToken = useCallback(
    async ({
      tokenAddress,
      solAmount,
    }: {
      tokenAddress: string;
      solAmount: number;
    }) => {
      // Use the best available wallet - prefer StandardWallet
      const availableWallet = wallet || solanaWallet;
      
      if (!availableWallet) {
        Alert.alert('Error', 'No Solana wallet found. Please connect first.');
        return;
      }
      try {
        console.log('[usePumpfun.buyToken] Attempting to buy token:', {
          tokenAddress,
          solAmount,
          walletProvider: wallet?.provider || 'privy' // Default to privy for legacy wallet
        });
        await buyTokenViaPumpfun({
          // Use the best available address
          buyerPublicKey: address || solanaWallet?.wallets?.[0]?.publicKey || '',
          tokenAddress,
          solAmount,
          solanaWallet: availableWallet,
        });
        Alert.alert('Success', `Bought token: ${tokenAddress}`);
      } catch (error: any) {
        console.error('[usePumpfun.buyToken] Error:', error);
        Alert.alert('Error Buying Token', error?.message || String(error));
      }
    },
    [wallet, solanaWallet, address],
  );

  /**
   * SELL
   */
  const sellToken = useCallback(
    async ({
      tokenAddress,
      tokenAmount,
    }: {
      tokenAddress: string;
      tokenAmount: number;
    }) => {
      // Use the best available wallet - prefer StandardWallet
      const availableWallet = wallet || solanaWallet;
      
      if (!availableWallet) {
        Alert.alert('Error', 'No Solana wallet found. Please connect first.');
        return;
      }
      try {
        console.log('[usePumpfun.sellToken] Attempting to sell token:', {
          tokenAddress,
          tokenAmount,
          walletProvider: wallet?.provider || 'privy' // Default to privy for legacy wallet
        });
        await sellTokenViaPumpfun({
          // Use the best available address
          sellerPublicKey: address || solanaWallet?.wallets?.[0]?.publicKey || '',
          tokenAddress,
          tokenAmount,
          solanaWallet: availableWallet,
        });
        Alert.alert('Success', `Sold ${tokenAmount} tokens: ${tokenAddress}`);
      } catch (error: any) {
        console.error('[usePumpfun.sellToken] Error:', error);
        Alert.alert('Error Selling Token', error?.message || String(error));
      }
    },
    [wallet, solanaWallet, address],
  );

  /**
   * LAUNCH
   * (create + buy tokens at launch)
   */
  const launchToken = useCallback(
    async ({
      tokenName,
      tokenSymbol,
      description = '',
      twitter = '',
      telegram = '',
      website = '',
      imageUri,
      solAmount,
    }: {
      tokenName: string;
      tokenSymbol: string;
      description?: string;
      twitter?: string;
      telegram?: string;
      website?: string;
      imageUri: string;
      solAmount: number;
    }) => {
      // Use the best available wallet - prefer StandardWallet
      const availableWallet = wallet || solanaWallet;
      
      if (!availableWallet) {
        Alert.alert('Error', 'No Solana wallet found. Please connect first.');
        return;
      }
      
      // Use the best available address
      const userPublicKey = address || solanaWallet?.wallets?.[0]?.publicKey || '';
      
      try {
        console.log('[usePumpfun.launchToken] Creating + Buying token:', {
          tokenName,
          tokenSymbol,
          description,
          twitter,
          telegram,
          website,
          imageUri,
          solAmount,
          walletProvider: wallet?.provider || 'privy' // Default to privy for legacy wallet
        });
        const result = await createAndBuyTokenViaPumpfun({
          userPublicKey,
          tokenName,
          tokenSymbol,
          description,
          twitter,
          telegram,
          website,
          imageUri,
          solAmount,
          solanaWallet: availableWallet,
        });
        if (result) {
          Alert.alert(
            'Success',
            `Launched token!\nMint: ${result.mint}\nTx: ${result.txSignature}`,
          );
        }
      } catch (error: any) {
        console.error('[usePumpfun.launchToken] Error:', error);
        Alert.alert('Error Launching Token', error?.message || String(error));
      }
    },
    [wallet, solanaWallet, address],
  );

  return {
    buyToken,
    sellToken,
    launchToken,
  };
}
