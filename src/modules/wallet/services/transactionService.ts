import {
  Connection,
  Transaction,
  VersionedTransaction,
  PublicKey,
  TransactionInstruction,
  Signer,
} from '@solana/web3.js';
import { Buffer } from 'buffer';
import { Platform } from 'react-native';
import {
  WalletAdapter,
  TransactionFormat,
  SendTransactionOptions,
  AnyTransaction
} from '../types';

/**
 * Centralized transaction service for handling all transaction types and providers
 */
export class TransactionService {
  // Enable this for detailed logging
  static DEBUG = true;
  
  // Helper for debug logging
  private static log(...args: any[]) {
    if (this.DEBUG) {
      console.log('[TransactionService]', ...args);
    }
  }

  /**
   * Display a transaction success notification
   */
  static showSuccess(signature: string, type?: 'swap' | 'transfer' | 'stake' | 'nft' | 'token'): void {
    // This will be implemented by the app, possibly with Redux
    console.log(`Transaction success: ${signature}`);
  }

  /**
   * Display a transaction error notification with parsed message
   */
  static showError(error: any): void {
    // This will be implemented by the app, possibly with Redux
    console.error('Transaction error:', error.message || error);
  }

  /**
   * Helper to filter error messages from status updates
   * This prevents raw error messages from showing in the UI
   */
  static filterStatusUpdate(status: string, callback?: (status: string) => void): void {
    if (!callback) return;
    
    // Don't pass error messages to the UI status
    if (status.startsWith('Error:') || status.includes('failed:') || status.includes('Transaction failed')) {
      callback('Transaction failed');
    } else {
      callback(status);
    }
  }

  /**
   * Signs and sends a transaction using the provided wallet provider
   * @param txFormat - The transaction format (transaction object or base64 encoded)
   * @param wallet - The wallet adapter to use for signing
   * @param options - Additional options for sending the transaction
   * @returns A promise that resolves to the transaction signature
   */
  static async signAndSendTransaction(
    txFormat: TransactionFormat,
    wallet: WalletAdapter,
    options: SendTransactionOptions
  ): Promise<string> {
    const { connection, confirmTransaction = true, maxRetries = 3, statusCallback } = options;
    let transaction: AnyTransaction;

    // Create a filtered status callback that won't show raw errors
    const filteredStatusCallback = statusCallback 
      ? (status: string) => this.filterStatusUpdate(status, statusCallback)
      : undefined;

    // 1. Normalize transaction format
    try {
      if (txFormat.type === 'base64') {
        const txBuffer = Buffer.from(txFormat.data, 'base64');
        try {
          transaction = VersionedTransaction.deserialize(txBuffer);
        } catch {
          transaction = Transaction.from(txBuffer);
        }
      } else {
        transaction = txFormat.transaction;
      }
    } catch (error: any) {
      this.showError(error);
      throw error;
    }

    // 2. Sign and send transaction
    let signature: string;
    try {
      // Prepare wallet provider
      filteredStatusCallback?.('Sending transaction to wallet for signing...');
      
      // Handle wallet type specific signing
      switch (wallet.provider) {
        case 'mwa':
          filteredStatusCallback?.('Opening mobile wallet for transaction approval...');
          signature = await this.signAndSendWithMWA(
            transaction,
            connection,
            wallet.address!
          );
          break;
          
        case 'privy':
        case 'dynamic':
        case 'turnkey':
        default:
          // Get provider from wallet
          const provider = await wallet.getProvider();
          
          // Special handling for MWA provider detected in wallet.getProvider()
          if (provider?.isMWAProvider) {
            filteredStatusCallback?.('Opening mobile wallet for transaction approval...');
            signature = await this.signAndSendWithMWA(
              transaction,
              connection,
              wallet.address!
            );
          } else {
            // Standard provider signing
            signature = await this.signAndSendWithProvider(
              transaction,
              connection,
              provider,
              wallet.getWalletInfo?.()
            );
          }
          break;
      }
    } catch (error: any) {
      filteredStatusCallback?.(`Transaction signing failed: ${error.message}`);
      this.showError(error);
      throw error;
    }

    // 3. Confirm transaction if needed
    if (confirmTransaction) {
      filteredStatusCallback?.('Confirming transaction...');
      let retries = 0;
      while (retries < maxRetries) {
        try {
          await connection.confirmTransaction(signature, 'confirmed');
          filteredStatusCallback?.('Transaction confirmed!');
          this.showSuccess(signature);
          break;
        } catch (error) {
          retries++;
          if (retries >= maxRetries) {
            filteredStatusCallback?.('Transaction failed');
            this.showError(new Error('Transaction confirmation failed after maximum retries.'));
            throw new Error('Transaction confirmation failed after maximum retries.');
          }
          filteredStatusCallback?.(`Retrying confirmation (${retries}/${maxRetries})...`);
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    } else {
      // Show success even if we don't wait for confirmation
      this.showSuccess(signature);
    }

    return signature;
  }

  /**
   * Generic method to sign and send a transaction using any provider
   */
  private static async signAndSendWithProvider(
    transaction: AnyTransaction,
    connection: Connection,
    provider: any,
    walletInfo?: { walletType: string, address: string | null }
  ): Promise<string> {
    if (!provider) {
      throw new Error('Provider is null or undefined');
    }
    
    // If provider doesn't have a request method but has direct signing methods, create a wrapper
    if (typeof provider.request !== 'function') {
      this.log('Provider missing request method, creating wrapper provider');
      
      // Create enhanced provider with request method
      const enhancedProvider = {
        ...provider,
        request: async ({ method, params }: any) => {
          if (method === 'signAndSendTransaction') {
            const { transaction, connection } = params;
            
            // Check for direct signAndSendTransaction method
            if (typeof provider.signAndSendTransaction === 'function') {
              const result = await provider.signAndSendTransaction(transaction);
              return { signature: result.signature || result };
            } 
            // Fallback to manual sign+send
            else if (typeof provider.signTransaction === 'function') {
              // 1. Sign transaction
              const signedTx = await provider.signTransaction(transaction);
              
              // 2. Send raw transaction
              const rawTransaction = signedTx instanceof VersionedTransaction 
                ? signedTx.serialize()
                : signedTx.serialize();
                
              const signature = await connection.sendRawTransaction(rawTransaction, {
                skipPreflight: false, 
                preflightCommitment: 'confirmed',
                maxRetries: 3
              });
              
              return { signature };
            }
          }
          
          throw new Error(`Method ${method} not supported by enhanced provider`);
        }
      };
      
      provider = enhancedProvider;
    }

    // Now use the enhanced or original provider
    const { signature } = await provider.request({
      method: 'signAndSendTransaction',
      params: {
        transaction,
        connection,
      },
    });

    if (!signature) {
      throw new Error('No signature returned from provider');
    }
    
    return signature;
  }

  /**
   * Signs and sends a transaction using MWA (Mobile Wallet Adapter)
   */
  private static async signAndSendWithMWA(
    transaction: AnyTransaction,
    connection: Connection,
    walletAddress: string
  ): Promise<string> {
    if (Platform.OS !== 'android') {
      throw new Error('MWA is only supported on Android devices');
    }
    
    try {
      // Import MWA dynamically to avoid issues on iOS
      let mobileWalletAdapter;
      try {
        mobileWalletAdapter = require('@solana-mobile/mobile-wallet-adapter-protocol-web3js');
      } catch (importError) {
        console.error('Failed to import mobile-wallet-adapter:', importError);
        throw new Error('Mobile Wallet Adapter module not found. Make sure @solana-mobile/mobile-wallet-adapter-protocol-web3js is installed');
      }

      if (!mobileWalletAdapter || !mobileWalletAdapter.transact) {
        throw new Error('Mobile Wallet Adapter module is invalid or missing the transact function');
      }

      const { transact } = mobileWalletAdapter;
      const { Buffer } = require('buffer');

      return await transact(async (wallet: any) => {
        try {
          // Authorize with the wallet
          const authResult = await wallet.authorize({
            cluster: 'mainnet-beta', // This should be configurable
            identity: {
              name: 'Solana App Kit',
              uri: 'https://solana-app-kit.dev',
              icon: 'favicon.ico',
            },
          });
          
          if (!authResult || !authResult.accounts || !authResult.accounts.length) {
            throw new Error('No accounts returned from MWA authorization');
          }
          
          // Get authorized account
          const selectedAccount = authResult.accounts[0];
          const accountAddress = selectedAccount.address;
          
          // Convert base64 to PublicKey if needed
          let userPubkey: PublicKey;
          try {
            // First try to interpret as a base58 string
            userPubkey = new PublicKey(accountAddress);
          } catch (e) {
            // If that fails, try to decode from base64
            try {
              const userPubkeyBytes = Buffer.from(accountAddress, 'base64');
              userPubkey = new PublicKey(userPubkeyBytes);
            } catch (decodeError) {
              this.log('Failed to decode pubkey from base64:', decodeError);
              throw new Error(`Invalid account address format: ${accountAddress}`);
            }
          }
          
          // Get latest blockhash if transaction doesn't have one
          if (transaction instanceof Transaction && !transaction.recentBlockhash) {
            const { blockhash } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            
            // Make sure feePayer is set correctly for legacy transactions
            if (!transaction.feePayer) {
              transaction.feePayer = userPubkey;
            }
          }
          
          // Sign the transaction
          const signedTransactions = await wallet.signTransactions({
            transactions: [transaction],
          });
          
          if (!signedTransactions?.length) {
            throw new Error('No signed transactions returned from MWA');
          }
          
          // Send the signed transaction
          const signedTx = signedTransactions[0];
          const signature = await connection.sendRawTransaction(signedTx.serialize(), {
            skipPreflight: false,
            preflightCommitment: 'confirmed',
            maxRetries: 3
          });
          
          return signature;
        } catch (error: any) {
          this.log('MWA transaction error:', error);
          throw new Error(`MWA transaction failed: ${error.message}`);
        }
      });
    } catch (error: any) {
      this.log('MWA module error:', error);
      throw new Error(`MWA transaction failed: ${error.message}`);
    }
  }

  /**
   * Helper to check if a transaction has already been signed
   */
  private static isTransactionSigned(transaction: AnyTransaction): boolean {
    if (transaction instanceof VersionedTransaction) {
      // For versioned transactions, check if there are signatures
      return transaction.signatures.length > 0 && 
        transaction.signatures.some(sig => sig.length > 0);
    } else {
      // For legacy transactions, check the signatures array
      return transaction.signatures.length > 0 && 
        transaction.signatures.some(sig => sig.signature !== null);
    }
  }
}

// Export transaction service
export default TransactionService; 