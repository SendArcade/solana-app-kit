// File: src/modules/pumpFun/hooks/usePumpFun.ts

import {useCallback} from 'react';
import {Alert} from 'react-native';
import {useAuth} from '../../../hooks/useAuth';
import {useWallet} from '../../../hooks/useWallet';
import {
  buyTokenViaPumpfun,
  sellTokenViaPumpfun,
  createAndBuyTokenViaPumpfun,
} from '../services/pumpfunService';
import { TransactionService } from '../../../services/transaction/transactionService';
import { PumpfunBuyParams, PumpfunSellParams, PumpfunLaunchParams } from '../types';

/**
 * Hook for interacting with Pump.fun platform
 * @returns Methods for buying, selling, and launching tokens on Pump.fun
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
   * Buy a token on Pump.fun
   * @param params Parameters for the token purchase 
   */
  const buyToken = useCallback(
    async ({
      tokenAddress,
      solAmount,
      onStatusUpdate,
    }: {
      tokenAddress: string;
      solAmount: number;
      onStatusUpdate?: (status: string) => void;
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
        
        onStatusUpdate?.('Preparing buy transaction...');
        
        const buyParams: PumpfunBuyParams = {
          buyerPublicKey: address || solanaWallet?.wallets?.[0]?.publicKey || '',
          tokenAddress,
          solAmount,
          solanaWallet: availableWallet,
          onStatusUpdate,
        };
        
        const txSignature = await buyTokenViaPumpfun(buyParams);
        
        // Show success notification via TransactionService
        TransactionService.showSuccess(txSignature, 'token');
      } catch (error: any) {
        console.error('[usePumpfun.buyToken] Error:', error);
        // Show error notification via TransactionService
        TransactionService.showError(error);
        throw error; // Re-throw for component-level handling
      }
    },
    [wallet, solanaWallet, address],
  );

  /**
   * Sell a token on Pump.fun
   * @param params Parameters for the token sale
   */
  const sellToken = useCallback(
    async ({
      tokenAddress,
      tokenAmount,
      onStatusUpdate,
    }: {
      tokenAddress: string;
      tokenAmount: number;
      onStatusUpdate?: (status: string) => void;
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
        
        onStatusUpdate?.('Preparing sell transaction...');
        
        const sellParams: PumpfunSellParams = {
          sellerPublicKey: address || solanaWallet?.wallets?.[0]?.publicKey || '',
          tokenAddress,
          tokenAmount,
          solanaWallet: availableWallet,
          onStatusUpdate,
        };
        
        const txSignature = await sellTokenViaPumpfun(sellParams);
        
        // Show success notification via TransactionService
        TransactionService.showSuccess(txSignature, 'token');
      } catch (error: any) {
        console.error('[usePumpfun.sellToken] Error:', error);
        // Show error notification via TransactionService
        TransactionService.showError(error);
        throw error; // Re-throw for component-level handling
      }
    },
    [wallet, solanaWallet, address],
  );

  /**
   * Launch a new token on Pump.fun
   * @param params Parameters for the token launch
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
      onStatusUpdate,
    }: {
      tokenName: string;
      tokenSymbol: string;
      description?: string;
      twitter?: string;
      telegram?: string;
      website?: string;
      imageUri: string;
      solAmount: number;
      onStatusUpdate?: (status: string) => void;
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
        
        onStatusUpdate?.('Preparing token launch...');
        
        const launchParams: PumpfunLaunchParams = {
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
          onStatusUpdate,
        };
        
        const result = await createAndBuyTokenViaPumpfun(launchParams);
        
        if (result) {
          // Show success notification via TransactionService
          TransactionService.showSuccess(result.txSignature, 'token');
        }
      } catch (error: any) {
        console.error('[usePumpfun.launchToken] Error:', error);
        // Show error notification via TransactionService
        TransactionService.showError(error);
        throw error; // Re-throw for component-level handling
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
