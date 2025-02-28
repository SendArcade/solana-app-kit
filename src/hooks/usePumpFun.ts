// File: src/hooks/usePumpfun.ts

import {useCallback} from 'react';
import {Alert} from 'react-native';
import {useAuth} from './useAuth';
import {
  buyTokenViaPumpfun,
  sellTokenViaPumpfun,
  createAndBuyTokenViaPumpfun,
} from '../services/pumpfun/pumpfunService';

/**
 * usePumpfun hook: centralizes buy, sell, and launch logic for Pumpfun tokens.
 */
export function usePumpfun() {
  const {solanaWallet} = useAuth();

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
      if (!solanaWallet) {
        Alert.alert('Error', 'No Solana wallet found. Please connect first.');
        return;
      }
      try {
        console.log('[usePumpfun.buyToken] Attempting to buy token:', {
          tokenAddress,
          solAmount,
        });
        await buyTokenViaPumpfun({
          buyerPublicKey: solanaWallet.wallets?.[0]?.publicKey || '',
          tokenAddress,
          solAmount,
          solanaWallet,
        });
        Alert.alert('Success', `Bought token: ${tokenAddress}`);
      } catch (error: any) {
        console.error('[usePumpfun.buyToken] Error:', error);
        Alert.alert('Error Buying Token', error?.message || String(error));
      }
    },
    [solanaWallet],
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
      if (!solanaWallet) {
        Alert.alert('Error', 'No Solana wallet found. Please connect first.');
        return;
      }
      try {
        console.log('[usePumpfun.sellToken] Attempting to sell token:', {
          tokenAddress,
          tokenAmount,
        });
        await sellTokenViaPumpfun({
          sellerPublicKey: solanaWallet.wallets?.[0]?.publicKey || '',
          tokenAddress,
          tokenAmount,
          solanaWallet,
        });
        Alert.alert('Success', `Sold ${tokenAmount} tokens: ${tokenAddress}`);
      } catch (error: any) {
        console.error('[usePumpfun.sellToken] Error:', error);
        Alert.alert('Error Selling Token', error?.message || String(error));
      }
    },
    [solanaWallet],
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
      if (!solanaWallet) {
        Alert.alert('Error', 'No Solana wallet found. Please connect first.');
        return;
      }
      const userPublicKey = solanaWallet.wallets?.[0]?.publicKey || '';
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
          solanaWallet,
        });
        if (result?.success) {
          Alert.alert(
            'Success',
            `Launched token!\nMint: ${result.mintPublicKey}\nTx: ${result.txId}`,
          );
        }
      } catch (error: any) {
        console.error('[usePumpfun.launchToken] Error:', error);
        Alert.alert('Error Launching Token', error?.message || String(error));
      }
    },
    [solanaWallet],
  );

  return {
    buyToken,
    sellToken,
    launchToken,
  };
}
