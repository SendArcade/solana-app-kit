/**
 * Hook for interacting with Pump Swap AMM
 */

import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { Connection } from '@solana/web3.js';
import { PumpAmmSdk, Direction, Pool } from '@pump-fun/pump-swap-sdk';
import { useAuth } from '../../../hooks/useAuth';
import { useWallet } from '../../../hooks/useWallet';
import { TransactionService } from '../../../services/transaction/transactionService';
import {
  swapTokens,
  addLiquidity,
  removeLiquidity,
  createPool,
  getSwapQuote,
  getLiquidityQuote,
  getPumpAmmSdk
} from '../services/pumpSwapService';
import { DEFAULT_SLIPPAGE } from '../utils/pumpSwapUtils';
import {
  SwapParams,
  AddLiquidityParams,
  RemoveLiquidityParams,
  CreatePoolParams
} from '../types';

/**
 * Hook for interacting with Pump Swap AMM
 * @returns Methods and state for interacting with Pump Swap AMM
 */
export function usePumpSwap() {
  const { wallet, solanaWallet } = useAuth();
  const { publicKey, address, connected } = useWallet();
  const [sdk, setSdk] = useState<PumpAmmSdk | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pools, setPools] = useState<Pool[]>([]);
  const [connection, setConnection] = useState<Connection | null>(null);

  // Initialize the SDK
  useEffect(() => {
    try {
      // In a real implementation, you would use a proper Solana connection
      // For demonstration, we're creating a simple instance
      const sdkInstance = getPumpAmmSdk();
      setSdk(sdkInstance);
      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing Pump Swap SDK:', error);
      setIsLoading(false);
    }
  }, []);

  // Fetch available pools
  useEffect(() => {
    if (sdk && !isLoading) {
      fetchPools();
    }
  }, [sdk, isLoading]);

  /**
   * Fetch available liquidity pools
   */
  const fetchPools = useCallback(async () => {
    try {
      setIsLoading(true);
      // In a real implementation, this would fetch actual pools from the chain
      // For demonstration, we'll set a mock pool list
      // This would typically use the SDK to query on-chain pools
      
      // Mock implementation - replace with actual SDK calls in production
      setTimeout(() => {
        setPools([]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching pools:', error);
      setIsLoading(false);
    }
  }, [sdk]);

  /**
   * Refresh the pools list
   */
  const refreshPools = useCallback(async () => {
    await fetchPools();
  }, [fetchPools]);

  /**
   * Swap tokens using Pump Swap AMM
   * @param params Swap parameters
   * @returns Transaction signature
   */
  const swap = useCallback(async ({
    pool,
    amount,
    direction,
    slippage = DEFAULT_SLIPPAGE,
    onStatusUpdate
  }: {
    pool: Pool;
    amount: number;
    direction: Direction;
    slippage?: number;
    onStatusUpdate?: (status: string) => void;
  }) => {
    // Use the best available wallet - prefer StandardWallet
    const availableWallet = wallet || solanaWallet;
    
    if (!availableWallet) {
      Alert.alert('Error', 'No Solana wallet found. Please connect first.');
      return '';
    }

    try {      
      console.log('[usePumpSwap.swap] Attempting to swap:', {
        amount,
        slippage,
        walletProvider: wallet?.provider || 'privy' // Default to privy for legacy wallet
      });
      
      onStatusUpdate?.('Preparing swap transaction...');
      
      const swapParams: SwapParams = {
        userPublicKey: address || solanaWallet?.wallets?.[0]?.publicKey || '',
        pool,
        amount,
        direction,
        slippage,
        solanaWallet: availableWallet,
        onStatusUpdate,
      };
      
      const txSignature = await swapTokens(swapParams);
      
      // Show success notification via TransactionService
      TransactionService.showSuccess(txSignature, 'swap');
      
      return txSignature;
    } catch (error: any) {
      console.error('[usePumpSwap.swap] Error:', error);
      // Show error notification via TransactionService
      TransactionService.showError(error);
      throw error; // Re-throw for component-level handling
    }
  }, [wallet, solanaWallet, address]);

  /**
   * Add liquidity to a pool
   * @param params Liquidity addition parameters
   * @returns Transaction signature
   */
  const addLiquidityToPool = useCallback(async ({
    pool,
    baseAmount,
    quoteAmount,
    lpTokenAmount,
    slippage = DEFAULT_SLIPPAGE,
    onStatusUpdate
  }: {
    pool: Pool;
    baseAmount: number;
    quoteAmount: number;
    lpTokenAmount: number;
    slippage?: number;
    onStatusUpdate?: (status: string) => void;
  }) => {
    // Use the best available wallet - prefer StandardWallet
    const availableWallet = wallet || solanaWallet;
    
    if (!availableWallet) {
      Alert.alert('Error', 'No Solana wallet found. Please connect first.');
      return '';
    }

    try {
      console.log('[usePumpSwap.addLiquidity] Attempting to add liquidity:', {
        baseAmount,
        quoteAmount,
        lpTokenAmount,
        slippage,
        walletProvider: wallet?.provider || 'privy' // Default to privy for legacy wallet
      });
      
      onStatusUpdate?.('Preparing liquidity addition transaction...');
      
      const addLiquidityParams: AddLiquidityParams = {
        userPublicKey: address || solanaWallet?.wallets?.[0]?.publicKey || '',
        pool,
        baseAmount,
        quoteAmount,
        lpTokenAmount,
        slippage,
        solanaWallet: availableWallet,
        onStatusUpdate,
      };
      
      const txSignature = await addLiquidity(addLiquidityParams);
      
      // Show success notification via TransactionService
      TransactionService.showSuccess(txSignature, 'swap'); // Using 'swap' as a valid type
      
      // Refresh pools after adding liquidity
      await refreshPools();
      
      return txSignature;
    } catch (error: any) {
      console.error('[usePumpSwap.addLiquidity] Error:', error);
      // Show error notification via TransactionService
      TransactionService.showError(error);
      throw error; // Re-throw for component-level handling
    }
  }, [wallet, solanaWallet, address, refreshPools]);

  /**
   * Remove liquidity from a pool
   * @param params Liquidity removal parameters
   * @returns Transaction signature
   */
  const removeLiquidityFromPool = useCallback(async ({
    pool,
    lpTokenAmount,
    slippage = DEFAULT_SLIPPAGE,
    onStatusUpdate
  }: {
    pool: Pool;
    lpTokenAmount: number;
    slippage?: number;
    onStatusUpdate?: (status: string) => void;
  }) => {
    // Use the best available wallet - prefer StandardWallet
    const availableWallet = wallet || solanaWallet;
    
    if (!availableWallet) {
      Alert.alert('Error', 'No Solana wallet found. Please connect first.');
      return '';
    }

    try {
      console.log('[usePumpSwap.removeLiquidity] Attempting to remove liquidity:', {
        lpTokenAmount,
        slippage,
        walletProvider: wallet?.provider || 'privy' // Default to privy for legacy wallet
      });
      
      onStatusUpdate?.('Preparing liquidity removal transaction...');
      
      const removeLiquidityParams: RemoveLiquidityParams = {
        userPublicKey: address || solanaWallet?.wallets?.[0]?.publicKey || '',
        pool,
        lpTokenAmount,
        slippage,
        solanaWallet: availableWallet,
        onStatusUpdate,
      };
      
      const txSignature = await removeLiquidity(removeLiquidityParams);
      
      // Show success notification via TransactionService
      TransactionService.showSuccess(txSignature, 'swap'); // Using 'swap' as a valid type
      
      // Refresh pools after removing liquidity
      await refreshPools();
      
      return txSignature;
    } catch (error: any) {
      console.error('[usePumpSwap.removeLiquidity] Error:', error);
      // Show error notification via TransactionService
      TransactionService.showError(error);
      throw error; // Re-throw for component-level handling
    }
  }, [wallet, solanaWallet, address, refreshPools]);

  /**
   * Create a new pool
   * @param params Pool creation parameters
   * @returns Transaction signature
   */
  const createNewPool = useCallback(async ({
    index,
    baseMint,
    quoteMint,
    baseAmount,
    quoteAmount,
    onStatusUpdate
  }: {
    index: number;
    baseMint: string;
    quoteMint: string;
    baseAmount: number;
    quoteAmount: number;
    onStatusUpdate?: (status: string) => void;
  }) => {
    // Use the best available wallet - prefer StandardWallet
    const availableWallet = wallet || solanaWallet;
    
    if (!availableWallet) {
      Alert.alert('Error', 'No Solana wallet found. Please connect first.');
      return '';
    }

    try {
      console.log('[usePumpSwap.createPool] Attempting to create pool:', {
        baseMint,
        quoteMint,
        baseAmount,
        quoteAmount,
        walletProvider: wallet?.provider || 'privy' // Default to privy for legacy wallet
      });
      
      onStatusUpdate?.('Preparing pool creation transaction...');
      
      const createPoolParams: CreatePoolParams = {
        userPublicKey: address || solanaWallet?.wallets?.[0]?.publicKey || '',
        index,
        baseMint,
        quoteMint,
        baseAmount,
        quoteAmount,
        solanaWallet: availableWallet,
        onStatusUpdate,
      };
      
      const txSignature = await createPool(createPoolParams);
      
      // Show success notification via TransactionService
      TransactionService.showSuccess(txSignature, 'token'); // Using 'token' as a valid type
      
      // Refresh pools after creating a new one
      await refreshPools();
      
      return txSignature;
    } catch (error: any) {
      console.error('[usePumpSwap.createPool] Error:', error);
      // Show error notification via TransactionService
      TransactionService.showError(error);
      throw error; // Re-throw for component-level handling
    }
  }, [wallet, solanaWallet, address, refreshPools]);

  /**
   * Get a quote for swapping tokens
   * @param params Quote parameters
   * @returns Expected output amount
   */
  const getExpectedSwapOutput = useCallback(async ({
    pool,
    inputAmount,
    direction,
    slippage = DEFAULT_SLIPPAGE,
  }: {
    pool: Pool;
    inputAmount: number;
    direction: Direction;
    slippage?: number;
  }) => {
    try {
      return await getSwapQuote(pool, inputAmount, direction, slippage);
    } catch (error) {
      console.error('[usePumpSwap.getExpectedSwapOutput] Error:', error);
      throw error;
    }
  }, []);

  /**
   * Get expected quotes for adding liquidity
   * @param params Quote parameters
   * @returns Expected output amounts
   */
  const getLiquidityOutputs = useCallback(async ({
    pool,
    baseAmount,
    quoteAmount,
    slippage = DEFAULT_SLIPPAGE,
  }: {
    pool: Pool;
    baseAmount?: number;
    quoteAmount?: number;
    slippage?: number;
  }) => {
    try {
      if (baseAmount && !quoteAmount) {
        return await getLiquidityQuote(pool, baseAmount, null, slippage);
      } else if (!baseAmount && quoteAmount) {
        return await getLiquidityQuote(pool, 0, quoteAmount, slippage);
      } else {
        throw new Error('Either baseAmount or quoteAmount must be provided, not both or neither');
      }
    } catch (error) {
      console.error('[usePumpSwap.getLiquidityOutputs] Error:', error);
      throw error;
    }
  }, []);

  return {
    sdk,
    isLoading,
    pools,
    wallet: wallet || solanaWallet,
    connection,
    swap,
    addLiquidity: addLiquidityToPool,
    removeLiquidity: removeLiquidityFromPool,
    createPool: createNewPool,
    getSwapQuote: getExpectedSwapOutput,
    getLiquidityQuote: getLiquidityOutputs,
    refreshPools,
  };
} 