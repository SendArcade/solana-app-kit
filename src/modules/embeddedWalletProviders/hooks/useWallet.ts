import { useAuth } from './useAuth';
import { useTransactionService } from '../services/transaction/transactionService';
import { Connection, Transaction, VersionedTransaction, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { isDynamicWallet } from '../services/walletProviders/dynamic';
import { useMemo, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../../hooks/useReduxHooks';
import { Platform } from 'react-native';
import { fetchUserProfile } from '../../../state/auth/reducer';
import { StandardWallet } from '../types';

/**
 * A hook that provides wallet and transaction capabilities
 * across different wallet providers (Privy, Dynamic, etc.)
 */
export function useWallet() {
  // Get Redux auth state
  const authState = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  
  // Get wallet from useAuth
  const { wallet, solanaWallet } = useAuth();
  const { 
    signAndSendTransaction,
    signAndSendInstructions,
    signAndSendBase64,
    currentProvider 
  } = useTransactionService();

  // Add an effect to ensure profile data is loaded if we have a wallet address
  // but no profile info (prevents "flashing" anonymous state)
  useEffect(() => {
    // We need a stable flag to track if we should fetch
    let shouldFetch = false;
    
    // Check if we need to fetch profile data
    if (authState.isLoggedIn && authState.address) {
      // Only fetch if we're missing profile data
      if (!authState.username || !authState.profilePicUrl) {
        shouldFetch = true;
      }
    }
    
    // Use a timeout to debounce multiple profile fetch requests
    // and avoid multiple fetches during app initialization
    if (shouldFetch) {
      const timer = setTimeout(() => {
        // Explicitly pass the current user's address to ensure we only fetch their profile
        // This prevents fetching other users' profiles
        const userAddress = authState.address;
        if (userAddress) {
          dispatch(fetchUserProfile(userAddress));
        }
      }, 300); // Small delay to allow for auth state to stabilize
      
      return () => clearTimeout(timer);
    }
  }, [authState.isLoggedIn, authState.address, authState.username, authState.profilePicUrl, dispatch]);

  // Create a standardized wallet object for MWA if needed
  const mwaWallet: StandardWallet | null = useMemo(() => {
    // Only create MWA wallet on Android
    if (authState.provider === 'mwa' && authState.address && Platform.OS === 'android') {
      return {
        provider: 'mwa',
        address: authState.address,
        publicKey: authState.address,
        rawWallet: { address: authState.address },
        getWalletInfo: () => ({
          walletType: 'MWA',
          address: authState.address,
        }),
        // For MWA, we don't have a provider as transactions are handled by the Phantom app
        getProvider: async () => {
          // Now we don't immediately throw, but return a special MWA provider
          return {
            type: 'mwa',
            provider: 'mwa',
            address: authState.address,
            // This will be used by transactionService
            isMWAProvider: true
          };
        }
      };
    }
    return null;
  }, [authState.provider, authState.address]);

  // Get the best available wallet - prefer StandardWallet but fall back to mwaWallet if available
  const getWallet = () => {
    if (wallet) return wallet;
    if (mwaWallet) return mwaWallet;
    if (solanaWallet) return solanaWallet;
    return null;
  };

  // Get the wallet that is currently in use
  const currentWallet = useMemo(() => {
    return getWallet();
  }, [wallet, mwaWallet, solanaWallet]);

  /**
   * Signs and sends a transaction using the current wallet
   */
  const sendTransaction = async (
    transaction: Transaction | VersionedTransaction,
    connection: Connection,
    options?: { confirmTransaction?: boolean; statusCallback?: (status: string) => void }
  ): Promise<string> => {
    const availableWallet = getWallet();
    if (!availableWallet) {
      throw new Error('No wallet connected');
    }

    return signAndSendTransaction(
      { type: 'transaction', transaction },
      availableWallet,
      { connection, ...options }
    );
  };

  /**
   * Signs and sends a transaction from instructions using the current wallet
   */
  const sendInstructions = async (
    instructions: TransactionInstruction[],
    feePayer: PublicKey,
    connection: Connection,
    options?: { confirmTransaction?: boolean; statusCallback?: (status: string) => void }
  ): Promise<string> => {
    const availableWallet = getWallet();
    if (!availableWallet) {
      throw new Error('No wallet connected');
    }

    return signAndSendInstructions(
      instructions,
      feePayer,
      availableWallet,
      connection,
      options
    );
  };

  /**
   * Signs and sends a base64-encoded transaction using the current wallet
   */
  const sendBase64Transaction = async (
    base64Tx: string,
    connection: Connection,
    options?: { confirmTransaction?: boolean; statusCallback?: (status: string) => void }
  ): Promise<string> => {
    const availableWallet = getWallet();
    if (!availableWallet) {
      throw new Error('No wallet connected');
    }

    return signAndSendBase64(
      base64Tx,
      availableWallet,
      connection,
      options
    );
  };

  // Helper to check if we're using Dynamic wallet
  const isDynamic = (): boolean => {
    if (wallet) {
      return wallet.provider === 'dynamic';
    }
    if (currentProvider) {
      return currentProvider === 'dynamic';
    }
    return false;
  };

  // Helper to check if we're using Privy wallet
  const isPrivy = (): boolean => {
    if (wallet) {
      return wallet.provider === 'privy';
    }
    if (currentProvider) {
      return currentProvider === 'privy';
    }
    return false;
  };
  
  // Helper to check if we're using MWA wallet
  const isMWA = (): boolean => {
    if (wallet?.provider === 'mwa') {
      return true;
    }
    return authState.provider === 'mwa';
  };

  // Convert string public key to PublicKey object when available
  const publicKey = useMemo(() => {
    // First try to get from StandardWallet
    if (wallet?.publicKey) {
      try {
        return new PublicKey(wallet.publicKey);
      } catch (e) {
        console.error('[useWallet] Invalid publicKey in StandardWallet:', e);
      }
    }
    
    // Then try from legacy wallet
    if (solanaWallet?.wallets?.[0]?.publicKey) {
      try {
        return new PublicKey(solanaWallet.wallets[0].publicKey);
      } catch (e) {
        console.error('[useWallet] Invalid publicKey in legacy wallet:', e);
      }
    }
    
    // Fallback to Redux state address (especially for MWA)
    if (authState.address) {
      try {
        return new PublicKey(authState.address);
      } catch (e) {
        console.error('[useWallet] Invalid publicKey in Redux state:', e);
      }
    }
    
    return null;
  }, [wallet, solanaWallet, authState.address]);
  
  // Get wallet address as string
  const address = useMemo(() => {
    return wallet?.address || 
           wallet?.publicKey || 
           solanaWallet?.wallets?.[0]?.publicKey || 
           solanaWallet?.wallets?.[0]?.address || 
           authState.address ||
           null;
  }, [wallet, solanaWallet, authState.address]);

  // Determine if a wallet is connected
  const connected = useMemo(() => {
    return !!wallet || !!solanaWallet || !!authState.address;
  }, [wallet, solanaWallet, authState.address]);

  return {
    wallet: currentWallet,    // The best available wallet (from any provider)
    solanaWallet,             // Legacy wallet (for backward compatibility)
    publicKey,
    address,
    connected,
    sendTransaction,          // Send transaction with current wallet
    sendInstructions,         // Send instructions with current wallet
    sendBase64Transaction,    // Send base64 transaction with current wallet
    provider: currentProvider || authState.provider,
    isDynamic,                // Check if using Dynamic
    isPrivy,                  // Check if using Privy
    isMWA,                    // Check if using MWA
  };
} 