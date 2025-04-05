/**
 * Re-exports all types from the embeddedWalletProviders module
 * This allows for clean imports like: import { StandardWallet } from '../types'
 */

import { VersionedTransaction, Transaction, Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';

// Wallet types
export * from './wallet';

// Transaction types
export * from './transaction';

// Auth types
export * from './auth';

// Provider-specific types
export * from './providers';

/**
 * Auth provider types
 */
export type AuthProvider = 'privy' | 'dynamic' | 'turnkey' | 'mwa';

/**
 * Standard wallet interface that all wallet providers should implement
 */
export interface StandardWallet {
  provider: AuthProvider;
  address: string;
  publicKey: string;
  rawWallet: any;
  getWalletInfo?: () => { walletType: string; address: string | null };
  getProvider: () => Promise<any>;
}

/**
 * Legacy wallet interface for backward compatibility
 */
export interface UnifiedWallet {
  wallets?: Array<{
    publicKey: string;
    address?: string;
  }>;
  getProvider?: () => Promise<any>;
  provider?: AuthProvider;
}

/**
 * Login method types
 */
export enum LoginMethod {
  Email = 'email',
  SMS = 'sms',
  Google = 'google',
  Apple = 'apple',
  Passkey = 'passkey',
  OAuth = 'oauth',
  Wallet = 'wallet',
  Phone = 'phone',
}

/**
 * Provider config types
 */
export interface PrivyConfig {
  appId: string;
  clientId: string;
}

export interface DynamicConfig {
  environmentId: string;
  appName?: string;
  appLogoUrl?: string;
}

export interface TurnkeyConfig {
  baseUrl: string;
  organizationId: string;
  rpId: string;
  rpName: string;
}

/**
 * Parameters for wallet monitoring
 */
export interface WalletMonitorParams {
  selectedProvider?: AuthProvider;
  setStatusMessage?: (message: string) => void;
  onWalletConnected?: (info: { provider: AuthProvider; address: string }) => void;
}

/**
 * Transaction formats that can be used with transaction service
 */
export type TransactionFormat =
  | { type: 'transaction'; transaction: Transaction | VersionedTransaction }
  | { type: 'base64'; data: string }
  | { 
      type: 'instructions'; 
      instructions: TransactionInstruction[]; 
      feePayer: PublicKey; 
      signers?: any[] 
    };

/**
 * Any transaction type (Transaction or VersionedTransaction)
 */
export type AnyTransaction = Transaction | VersionedTransaction;

/**
 * Wallet provider interface for transaction service
 */
export type WalletProvider =
  | { type: 'standard'; wallet: StandardWallet }
  | { type: 'privy'; provider: any }
  | { type: 'dynamic'; walletAddress: string }
  | { type: 'turnkey'; walletAddress: string }
  | { type: 'mwa'; walletAddress: string }
  | { type: 'autodetect'; provider: any; currentProvider?: string };

/**
 * Options for sending transactions
 */
export interface SendTransactionOptions {
  connection: Connection;
  confirmTransaction?: boolean;
  maxRetries?: number;
  statusCallback?: (status: string) => void;
} 