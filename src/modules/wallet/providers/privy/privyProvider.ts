import {
  useLogin,
  usePrivy,
  useEmbeddedSolanaWallet,
  useRecoverEmbeddedWallet,
  isNotCreated,
  needsRecovery,
  useLoginWithOAuth
} from '@privy-io/expo';
import { Connection } from '@solana/web3.js';
import { WalletProvider } from '../base';
import { 
  WalletAdapter, 
  LoginOptions, 
  WalletProviderType,
  SendTransactionOptions,
  TransactionFormat,
  ProviderStatus
} from '../../types';
import { TransactionService } from '../../services/transactionService';

/**
 * Privy wallet provider implementation
 */
export class PrivyWalletProvider implements WalletProvider {
  name: WalletProviderType = 'privy';
  status: ProviderStatus = 'disconnected';
  user: any = null;
  wallet: WalletAdapter | null = null;
  
  private privyLogin: ReturnType<typeof useLogin>['login'] | null = null;
  private privyLogout: ReturnType<typeof usePrivy>['logout'] | null = null;
  private solanaWallet: ReturnType<typeof useEmbeddedSolanaWallet> | null = null;
  private oauthLogin: ReturnType<typeof useLoginWithOAuth>['login'] | null = null;
  private recover: ReturnType<typeof useRecoverEmbeddedWallet>['recover'] | null = null;
  private isReady: boolean = false;
  
  /**
   * Initialize with hooks from the component
   */
  initialize(params: {
    login: ReturnType<typeof useLogin>['login'];
    logout: ReturnType<typeof usePrivy>['logout'];
    solanaWallet: ReturnType<typeof useEmbeddedSolanaWallet>;
    oauthLogin: ReturnType<typeof useLoginWithOAuth>['login'];
    recover: ReturnType<typeof useRecoverEmbeddedWallet>['recover'];
    user: any;
    isReady: boolean;
  }): void {
    this.privyLogin = params.login;
    this.privyLogout = params.logout;
    this.solanaWallet = params.solanaWallet;
    this.oauthLogin = params.oauthLogin;
    this.recover = params.recover;
    this.user = params.user;
    this.isReady = params.isReady;
    
    if (params.user) {
      this.status = 'connected';
    }
    
    if (params.solanaWallet?.wallets?.length > 0) {
      this.createWalletAdapter();
    }
  }
  
  /**
   * Login with Privy
   */
  async login(options: LoginOptions): Promise<void> {
    if (!this.privyLogin && !this.oauthLogin) {
      throw new Error('Privy provider not properly initialized');
    }
    
    try {
      options.setStatusMessage?.(`Connecting with privy via ${options.loginMethod}...`);
      this.status = 'connecting';
      
      // Use OAuth for social logins
      if (options.loginMethod === 'google' || options.loginMethod === 'apple') {
        if (!this.oauthLogin) {
          throw new Error(`OAuth login not available for ${options.loginMethod}`);
        }
        
        await this.oauthLogin({ provider: options.loginMethod });
      } 
      // Use standard login for email
      else if (options.loginMethod === 'email' && this.privyLogin) {
        await this.privyLogin({
          loginMethods: [options.loginMethod],
          appearance: {logo: ''},
        });
      }
      else {
        throw new Error(`Unsupported login method: ${options.loginMethod}`);
      }
      
      // Wait for wallet to be created or connected
      await this.connectWallet(options.setStatusMessage);
      
      if (this.wallet && this.wallet.address) {
        options.setStatusMessage?.(`Connected to wallet: ${this.wallet.address}`);
        options.onSuccess?.({
          provider: this.name,
          address: this.wallet.address,
        });
      } else {
        throw new Error('Failed to connect wallet after login');
      }
    } catch (error: any) {
      this.status = 'error';
      options.setStatusMessage?.(`Connection failed: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Logout from Privy
   */
  async logout(callback?: (status: string) => void): Promise<void> {
    if (!this.privyLogout) {
      throw new Error('Privy provider not properly initialized');
    }
    
    try {
      await this.privyLogout();
      this.status = 'disconnected';
      this.wallet = null;
      this.user = null;
      callback?.('Logged out successfully');
    } catch (error: any) {
      callback?.(error.message || 'Logout failed');
      throw error;
    }
  }
  
  /**
   * Connect to Privy wallet
   */
  async connectWallet(callback?: (status: string) => void): Promise<WalletAdapter | null> {
    if (!this.solanaWallet || !this.isReady) {
      throw new Error('Privy provider not properly initialized');
    }
    
    try {
      // If we already have a provider and wallet, return it
      if (this.solanaWallet.getProvider && this.solanaWallet.wallets?.length > 0) {
        callback?.(`Connected to existing wallet: ${this.solanaWallet.wallets[0].publicKey}`);
        this.createWalletAdapter();
        return this.wallet;
      }
      
      // Handle wallet recovery if needed
      if (needsRecovery(this.solanaWallet)) {
        callback?.('Wallet needs recovery');
        return null;
      }
      
      // Create a new wallet if needed
      if (isNotCreated(this.solanaWallet)) {
        await this.solanaWallet.create();
        const newWallet = this.solanaWallet.wallets?.[0];
        
        if (newWallet) {
          callback?.(`Created wallet: ${newWallet.publicKey}`);
          this.createWalletAdapter();
          return this.wallet;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error connecting to Privy wallet:', error);
      throw error;
    }
  }
  
  /**
   * Create a standardized wallet adapter from Privy wallet
   */
  private createWalletAdapter(): void {
    if (!this.solanaWallet?.wallets?.length) {
      return;
    }
    
    const privy = this.solanaWallet;
    const walletObj = privy.wallets[0];
    
    this.wallet = {
      provider: 'privy',
      address: walletObj.publicKey,
      publicKey: walletObj.publicKey,
      rawWallet: walletObj,
      getWalletInfo: () => ({
        walletType: 'Privy',
        address: walletObj.publicKey,
      }),
      getProvider: async () => {
        if (privy.getProvider) {
          return privy.getProvider();
        }
        throw new Error('Privy wallet provider not available');
      },
    };
    
    this.status = 'connected';
  }
  
  /**
   * Sign and send transaction with Privy wallet
   */
  async signAndSendTransaction(
    transaction: TransactionFormat,
    connection: Connection,
    options?: SendTransactionOptions
  ): Promise<string> {
    if (!this.wallet) {
      throw new Error('No wallet connected');
    }
    
    try {
      return await TransactionService.signAndSendTransaction(
        transaction,
        this.wallet,
        { 
          connection,
          ...options
        }
      );
    } catch (error) {
      console.error('Error in Privy signAndSendTransaction:', error);
      throw error;
    }
  }
  
  /**
   * Handle wallet recovery (optional feature)
   */
  async recoverWallet(
    recoveryMethod: 'user-passcode' | 'google-drive' | 'icloud',
    password: string,
    callback?: (status: string) => void
  ): Promise<WalletAdapter | null> {
    if (!this.recover || !this.solanaWallet) {
      throw new Error('Privy provider not properly initialized for recovery');
    }
    
    try {
      callback?.('Recovering wallet...');
      await this.recover({ recoveryMethod, password });
      
      const provider = this.solanaWallet.getProvider
        ? await this.solanaWallet.getProvider().catch(() => null)
        : null;
        
      if (provider && this.solanaWallet.wallets?.length > 0) {
        callback?.(`Recovered wallet: ${this.solanaWallet.wallets[0].publicKey}`);
        this.createWalletAdapter();
        return this.wallet;
      } else {
        callback?.('Wallet recovery failed: Provider not available');
        return null;
      }
    } catch (error: any) {
      callback?.(`Wallet recovery failed: ${error.message}`);
      throw error;
    }
  }
}

// Export singleton instance
export const privyProvider = new PrivyWalletProvider(); 