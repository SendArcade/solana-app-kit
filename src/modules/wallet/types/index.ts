import { Connection, Transaction, VersionedTransaction, PublicKey } from '@solana/web3.js';

/**
 * Supported wallet provider types
 */
export type WalletProviderType = 'privy' | 'dynamic' | 'turnkey' | 'mwa';

/**
 * Common wallet interface that all providers should implement
 */
export interface WalletAdapter {
  /** The provider name (privy, dynamic, etc) */
  provider: WalletProviderType;
  
  /** The wallet address as string */
  address: string | null;
  
  /** The public key of the wallet */
  publicKey: string | null;
  
  /** The raw provider-specific wallet object */
  rawWallet: any;
  
  /** Get wallet identifier info for debugging */
  getWalletInfo: () => { 
    walletType: string;
    address: string | null;
  };
  
  /** Get the provider instance for this wallet */
  getProvider: () => Promise<any>;
}

/**
 * Common provider status types
 */
export type ProviderStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Status update callback
 */
export type StatusCallback = (status: string) => void;

/**
 * Auth result from a successful login
 */
export interface AuthResult {
  provider: WalletProviderType;
  address: string;
  userInfo?: {
    profilePicUrl?: string;
    username?: string;
    description?: string;
  };
}

/**
 * Auth callback when wallet is connected
 */
export type AuthCallback = (result: AuthResult) => void;

/**
 * Login method types
 */
export type LoginMethod = 'email' | 'sms' | 'google' | 'apple' | 'wallet';

/**
 * Common login options for all providers
 */
export interface LoginOptions {
  loginMethod: LoginMethod;
  setStatusMessage?: StatusCallback;
  onSuccess?: AuthCallback;
  navigation?: any;
}

/**
 * Transaction type
 */
export type AnyTransaction = Transaction | VersionedTransaction;

/**
 * Transaction format options
 */
export type TransactionFormat = 
  | { type: 'transaction', transaction: AnyTransaction }
  | { type: 'base64', data: string };

/**
 * Options for sending a transaction
 */
export interface SendTransactionOptions {
  connection: Connection;
  confirmTransaction?: boolean;
  maxRetries?: number;
  statusCallback?: StatusCallback;
}

/**
 * Parameters for embedded wallet auth component
 */
export interface WalletAuthParams {
  onWalletConnected: AuthCallback;
  authMode?: 'login' | 'signup';
} 