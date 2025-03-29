import { useCallback, useMemo } from 'react';
import { Connection, Transaction, VersionedTransaction, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { useAppSelector } from '../../../hooks/useReduxHooks';
import { Platform } from 'react-native';
import { walletProviders } from '../providers';
import { 
  WalletAdapter, 
  TransactionFormat, 
  SendTransactionOptions 
} from '../types';
import { TransactionService } from '../services';

/**
 * A hook that provides wallet and transaction capabilities
 * across different wallet providers
 */
export function useWallet() {
  // Get Redux auth state
  const authState = useAppSelector(state => state.auth);
  
  // Get the wallet adapter based on provider type
  const wallet = useMemo<WalletAdapter | null>(() => {
    if (!authState.provider || !authState.address) {
      return null;
    }
    
    // Check if the provider is registered
    const provider = walletProviders.getProvider(authState.provider);
    if (provider?.wallet) {
      return provider.wallet;
    }
    
    // Fallback for MWA wallets as they don't maintain a persistent connection
    if (authState.provider === 'mwa' && Platform.OS === 'android') {
      // Create a standardized wallet adapter for MWA
      const mwaAdapter: WalletAdapter = {
        provider: 'mwa',
        address: authState.address,
        publicKey: authState.address,
        rawWallet: { address: authState.address },
        getWalletInfo: () => ({
          walletType: 'MWA',
          address: authState.address,
        }),
        getProvider: async () => {
          // Return special MWA provider
          return {
            type: 'mwa',
            provider: 'mwa',
            address: authState.address,
            isMWAProvider: true
          };
        }
      };
      
      return mwaAdapter;
    }
    
    return null;
  }, [authState.provider, authState.address]);
  
  // Convert string public key to PublicKey object when available
  const publicKey = useMemo(() => {
    if (wallet?.publicKey) {
      try {
        return new PublicKey(wallet.publicKey);
      } catch (e) {
        console.error('[useWallet] Invalid publicKey:', e);
      }
    }
    
    if (authState.address) {
      try {
        return new PublicKey(authState.address);
      } catch (e) {
        console.error('[useWallet] Invalid address in auth state:', e);
      }
    }
    
    return null;
  }, [wallet, authState.address]);
  
  // Get wallet address as string
  const address = useMemo(() => {
    return wallet?.address || authState.address || null;
  }, [wallet, authState.address]);

  // Check if wallet is connected
  const connected = useMemo(() => {
    return !!wallet || !!authState.address;
  }, [wallet, authState.address]);

  /**
   * Signs and sends a transaction using the current wallet
   */
  const sendTransaction = useCallback(async (
    transaction: Transaction | VersionedTransaction,
    connection: Connection,
    options?: { confirmTransaction?: boolean; statusCallback?: (status: string) => void }
  ): Promise<string> => {
    if (!wallet) {
      throw new Error('No wallet connected');
    }

    return TransactionService.signAndSendTransaction(
      { type: 'transaction', transaction },
      wallet,
      { connection, ...options }
    );
  }, [wallet]);

  /**
   * Signs and sends a transaction from instructions using the current wallet
   */
  const sendInstructions = useCallback(async (
    instructions: TransactionInstruction[],
    feePayer: PublicKey,
    connection: Connection,
    options?: { confirmTransaction?: boolean; statusCallback?: (status: string) => void }
  ): Promise<string> => {
    if (!wallet) {
      throw new Error('No wallet connected');
    }

    // Create a transaction from instructions
    const tx = new Transaction();
    tx.add(...instructions);
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = feePayer;

    return sendTransaction(tx, connection, options);
  }, [wallet, sendTransaction]);

  /**
   * Signs and sends a base64-encoded transaction using the current wallet
   */
  const sendBase64Transaction = useCallback(async (
    base64Tx: string,
    connection: Connection,
    options?: { confirmTransaction?: boolean; statusCallback?: (status: string) => void }
  ): Promise<string> => {
    if (!wallet) {
      throw new Error('No wallet connected');
    }

    return TransactionService.signAndSendTransaction(
      { type: 'base64', data: base64Tx },
      wallet,
      { connection, ...options }
    );
  }, [wallet]);

  // Helper methods for provider identification
  const getProviderType = useCallback(() => {
    return authState.provider || null;
  }, [authState.provider]);

  const isMWA = useCallback(() => {
    return authState.provider === 'mwa' || wallet?.provider === 'mwa';
  }, [authState.provider, wallet]);

  const isPrivy = useCallback(() => {
    return authState.provider === 'privy' || wallet?.provider === 'privy';
  }, [authState.provider, wallet]);

  const isDynamic = useCallback(() => {
    return authState.provider === 'dynamic' || wallet?.provider === 'dynamic';
  }, [authState.provider, wallet]);

  return {
    wallet,                   // Current wallet adapter
    publicKey,                // PublicKey object  
    address,                  // Wallet address as string
    connected,                // Is wallet connected
    sendTransaction,          // Send transaction
    sendInstructions,         // Send instructions as transaction
    sendBase64Transaction,    // Send base64 transaction
    provider: getProviderType(),  // Current provider type
    isMWA: isMWA(),               // Is using MWA
    isPrivy: isPrivy(),           // Is using Privy
    isDynamic: isDynamic(),       // Is using Dynamic
  };
}

export default useWallet; 