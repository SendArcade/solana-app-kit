import {
  Connection,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js';
import { TransactionService } from '../../services/transaction/transactionService';
import { StandardWallet } from '../../hooks/useAuth';

/**
 * This file provides backward compatibility with the old transaction signing methods
 * while using the new centralized TransactionService internally.
 * It allows for a gradual migration of the codebase to use the new service.
 */

/**
 * Compatibility function for legacy signAndSendWithPrivy
 * @deprecated Use TransactionService or useTransactionService hook instead
 */
export async function signAndSendWithPrivy(
  transaction: Transaction | VersionedTransaction,
  connection: Connection,
  provider: any,
): Promise<string> {
  console.warn('signAndSendWithPrivy is deprecated. Please use TransactionService instead.');
  
  // Pass provider directly - TransactionService will handle type detection
  return TransactionService.signAndSendTransaction(
    { type: 'transaction', transaction },
    provider,
    { connection }
  );
}

/**
 * Compatibility function for legacy signAndSendWithDynamic
 * @deprecated Use TransactionService or useTransactionService hook instead
 */
export async function signAndSendWithDynamic(
  transaction: Transaction | VersionedTransaction,
  connection: Connection,
  walletAddressOrProvider: string | any,
): Promise<string> {
  console.warn('signAndSendWithDynamic is deprecated. Please use TransactionService instead.');
  
  // If walletAddressOrProvider is a string, it's a wallet address, otherwise pass it directly
  return TransactionService.signAndSendTransaction(
    { type: 'transaction', transaction },
    typeof walletAddressOrProvider === 'string' 
      ? { type: 'dynamic', walletAddress: walletAddressOrProvider }
      : walletAddressOrProvider,
    { connection }
  );
}

/**
 * Compatibility function for legacy signAndSendBase64Tx
 * @deprecated Use TransactionService or useTransactionService hook instead
 */
export async function signAndSendBase64Tx(
  base64Tx: string,
  connection: Connection,
  provider: any,
): Promise<string> {
  console.warn('signAndSendBase64Tx is deprecated. Please use TransactionService instead.');
  
  // If provider is a string (currentProvider), create minimal wrapper
  const normalizedProvider = typeof provider === 'string'
    ? { type: 'autodetect', currentProvider: provider }
    : provider;
    
  return TransactionService.signAndSendTransaction(
    { type: 'base64', data: base64Tx },
    normalizedProvider,
    { connection }
  );
} 