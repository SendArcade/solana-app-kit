import { useAuth, StandardWallet } from './useAuth';
import { useTransactionService } from '../services/transaction/transactionService';
import { Connection, Transaction, VersionedTransaction, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { isDynamicWallet } from '../services/walletProviders/dynamic';
import { useMemo } from 'react';

/**
 * A hook that provides wallet and transaction capabilities
 * across different wallet providers (Privy, Dynamic, etc.)
 */
export function useWallet() {
  const { wallet, solanaWallet } = useAuth();
  const { 
    signAndSendTransaction,
    signAndSendInstructions,
    signAndSendBase64,
    currentProvider 
  } = useTransactionService();

  // Get the best available wallet - prefer StandardWallet but fall back to legacy
  const getWallet = () => {
    if (wallet) return wallet;
    if (solanaWallet) return solanaWallet;
    return null;
  };

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
    
    return null;
  }, [wallet, solanaWallet]);
  
  // Get wallet address as string
  const address = useMemo(() => {
    return wallet?.address || 
           wallet?.publicKey || 
           solanaWallet?.wallets?.[0]?.publicKey || 
           solanaWallet?.wallets?.[0]?.address || 
           null;
  }, [wallet, solanaWallet]);

  return {
    wallet,                // StandardWallet interface (preferred)
    solanaWallet,          // Legacy wallet (for backward compatibility)
    publicKey,
    address,
    connected: !!wallet || !!solanaWallet,
    sendTransaction,       // Send transaction with current wallet
    sendInstructions,      // Send instructions with current wallet
    sendBase64Transaction, // Send base64 transaction with current wallet
    provider: currentProvider,
    isDynamic,             // Check if using Dynamic
    isPrivy,               // Check if using Privy
  };
} 