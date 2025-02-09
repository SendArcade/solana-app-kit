// File: /Users/bhuwantyagi/Desktop/sendAi/solana-social-starter/src/types/wallet.ts
import {
  Transaction,
  PublicKey,
  VersionedTransaction,
  SendOptions,
  TransactionSignature,
} from '@solana/web3.js';

/**
 * Interface representing a Solana wallet implementation.
 *
 * @interface BaseWallet
 * @description Defines the standard interface for interacting with a Solana wallet,
 * including transaction signing and (optionally) sending transactions.
 */
export interface BaseWallet {
  /**
   * The public key of the connected wallet.
   * @type {PublicKey}
   */
  readonly publicKey: PublicKey;

  /**
   * Signs a single transaction.
   * @template T - Transaction type (Transaction or VersionedTransaction)
   * @param {T} transaction - The transaction to be signed.
   * @returns {Promise<T>} Promise resolving to the signed transaction.
   */
  signTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
  ): Promise<T>;

  /**
   * Signs multiple transactions in batch.
   * @template T - Transaction type (Transaction or VersionedTransaction)
   * @param {T[]} transactions - Array of transactions to be signed.
   * @returns {Promise<T[]>} Promise resolving to an array of signed transactions.
   */
  signAllTransactions<T extends Transaction | VersionedTransaction>(
    transactions: T[],
  ): Promise<T[]>;

  /**
   * (Optional) Signs and sends a transaction to the network.
   * Implement this method later as needed.
   */
  // signAndSendTransaction<T extends Transaction | VersionedTransaction>(
  //   transaction: T,
  //   options?: SendOptions
  // ): Promise<{ signature: TransactionSignature }>;
}
