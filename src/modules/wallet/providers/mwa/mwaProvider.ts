import { Connection, PublicKey } from '@solana/web3.js';
import { Platform } from 'react-native';
import { WalletProvider } from '../base';
import { 
  WalletAdapter, 
  LoginOptions, 
  WalletProviderType,
  SendTransactionOptions,
  TransactionFormat,
  ProviderStatus 
} from '../../types';
import { TransactionService } from '../../services';

// Make MWA imports conditional to avoid errors on iOS
let mwa: {
  transact: any;
} | null = null;

// Only import MWA on Android
if (Platform.OS === 'android') {
  try {
    const mwaModule = require('@solana-mobile/mobile-wallet-adapter-protocol-web3js');
    mwa = {
      transact: mwaModule.transact,
    };
  } catch (e) {
    console.warn('Failed to import mobile-wallet-adapter:', e);
  }
}

/**
 * Mobile Wallet Adapter provider implementation 
 */
export class MWAWalletProvider implements WalletProvider {
  name: WalletProviderType = 'mwa';
  status: ProviderStatus = 'disconnected';
  user: any = null;
  wallet: WalletAdapter | null = null;
  private cluster: string;
  
  constructor(cluster = 'mainnet-beta') {
    this.cluster = cluster;
  }
  
  /**
   * Check if MWA is available
   */
  isAvailable(): boolean {
    return Platform.OS === 'android' && !!mwa?.transact;
  }
  
  /**
   * Login with MWA (connect to external wallet)
   */
  async login(options: LoginOptions): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Mobile Wallet Adapter is only available on Android devices');
    }
    
    try {
      options.setStatusMessage?.('Opening mobile wallet for approval...');
      this.status = 'connecting';
      
      const address = await this.connectWallet(options.setStatusMessage);
      
      if (address && this.wallet) {
        options.setStatusMessage?.(`Connected to wallet: ${address}`);
        options.onSuccess?.({
          provider: this.name,
          address: address as unknown as string,
        });
      } else {
        throw new Error('Failed to connect MWA wallet');
      }
    } catch (error: any) {
      this.status = 'error';
      options.setStatusMessage?.(`Connection failed: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Logout from MWA
   */
  async logout(callback?: (status: string) => void): Promise<void> {
    // MWA has no persistent connection, so just reset the state
    this.status = 'disconnected';
    this.wallet = null;
    this.user = null;
    callback?.('Disconnected from wallet');
  }
  
  /**
   * Connect to MWA wallet (authorize with external wallet)
   */
  async connectWallet(callback?: (status: string) => void): Promise<WalletAdapter | null> {
    if (!this.isAvailable()) {
      throw new Error('Mobile Wallet Adapter is only available on Android devices');
    }
    try {
      callback?.('Opening mobile wallet...');
      
      // Define app identity for authorization
      const APP_IDENTITY = {
        name: 'Solana App Kit',
        uri: 'https://solana-app-kit.dev',
        icon: 'favicon.ico',
      };
      
      // Transact with MWA
      return await mwa!.transact(async (wallet: any) => {
        try {
          callback?.('Requesting wallet authorization...');
          
          // Authorize with the wallet
          const authResult = await wallet.authorize({
            cluster: this.cluster,
            identity: APP_IDENTITY,
          });
          
          if (!authResult || !authResult.accounts || !authResult.accounts.length) {
            throw new Error('No accounts returned from wallet');
          }
          
          // Get the selected account
          const selectedAccount = authResult.accounts[0];
          let publicKeyStr = selectedAccount.address;
          
          // Convert base64 to PublicKey if needed
          try {
            // If Buffer is available
            if (Platform.OS === 'android') {
              const bufferModule = require('buffer');
              const Buffer = bufferModule.Buffer;
              
              try {
                // First try to interpret as a base58 string
                new PublicKey(publicKeyStr);
              } catch (e) {
                // If that fails, try to decode from base64
                try {
                  const userPubkeyBytes = Buffer.from(publicKeyStr, 'base64');
                  const publicKey = new PublicKey(userPubkeyBytes);
                  publicKeyStr = publicKey.toBase58();
                } catch (decodeError) {
                  console.error('Failed to decode pubkey from base64:', decodeError);
                  throw new Error(`Invalid account address format: ${publicKeyStr}`);
                }
              }
            }
          } catch (error) {
            console.error('Error processing public key:', error);
          }
          
          callback?.(`Wallet authorized: ${publicKeyStr}`);
          
          // Create the wallet adapter
          this.createWalletAdapter(publicKeyStr, authResult);
          
          return publicKeyStr;
        } catch (error: any) {
          console.error('MWA authorization error:', error);
          throw new Error(`MWA authorization failed: ${error.message}`);
        }
      });
    } catch (error: any) {
      console.error('MWA connection error:', error);
      throw error;
    }
  }
  
  /**
   * Create a standardized wallet adapter from MWA
   */
  private createWalletAdapter(publicKeyStr: string, authResult: any): void {
    this.wallet = {
      provider: 'mwa',
      address: publicKeyStr,
      publicKey: publicKeyStr,
      rawWallet: { 
        address: publicKeyStr,
        authResult
      },
      getWalletInfo: () => ({
        walletType: 'MWA',
        address: publicKeyStr,
      }),
      getProvider: async () => {
        // MWA doesn't have a traditional provider
        // Instead return a special provider that can be detected by TransactionService
        return {
          type: 'mwa',
          provider: 'mwa',
          address: publicKeyStr,
          isMWAProvider: true
        };
      },
    };
    
    this.status = 'connected';
    this.user = { id: publicKeyStr };
  }
  
  /**
   * Sign and send transaction with MWA
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
      console.error('Error in MWA signAndSendTransaction:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const mwaProvider = new MWAWalletProvider(); 