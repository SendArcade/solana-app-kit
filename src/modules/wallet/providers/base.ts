import { Connection } from '@solana/web3.js';
import { 
  WalletAdapter, 
  LoginOptions, 
  ProviderStatus, 
  WalletProviderType,
  TransactionFormat,
  SendTransactionOptions
} from '../types';

/**
 * Base wallet provider interface that all wallet providers should implement
 */
export interface WalletProvider {
  /** Provider name */
  name: WalletProviderType;
  
  /** Current connection status */
  status: ProviderStatus;
  
  /** Get the current user's info (if connected) */
  user: any | null;
  
  /** Currently connected wallet (if any) */
  wallet: WalletAdapter | null;
  
  /** Standard login method */
  login: (options: LoginOptions) => Promise<void>;
  
  /** Standard logout method */
  logout: (callback?: (status: string) => void) => Promise<void>;
  
  /** Connect wallet and get adapter */
  connectWallet: (callback?: (status: string) => void) => Promise<WalletAdapter | null>;
  
  /** Sign and send transaction */
  signAndSendTransaction: (
    transaction: TransactionFormat,
    connection: Connection,
    options?: SendTransactionOptions
  ) => Promise<string>;
  
  /** Initialize the provider (if needed) */
  initialize?: () => Promise<void>;
}

/**
 * Registry for wallet providers
 */
class WalletProviderRegistry {
  private providers: Map<WalletProviderType, WalletProvider>;

  constructor() {
    this.providers = new Map();
  }

  /** Register a wallet provider */
  register(provider: WalletProvider): void {
    this.providers.set(provider.name, provider);
  }

  /** Get a specific wallet provider by name */
  getProvider(name: WalletProviderType): WalletProvider | undefined {
    return this.providers.get(name);
  }

  /** Get all registered providers */
  getAllProviders(): WalletProvider[] {
    return Array.from(this.providers.values());
  }

  /** Check if provider is registered */
  hasProvider(name: WalletProviderType): boolean {
    return this.providers.has(name);
  }
}

export const walletProviders = new WalletProviderRegistry(); 