// File: src/hooks/useAuth.ts
import {useCallback, useEffect} from 'react';
import {useDispatch} from 'react-redux';
import {
  loginSuccess, 
  logoutSuccess,
  fetchUserWallets,
  addWallet,
  setPrimaryWallet,
  removeWallet,
  switchWallet,
  Wallet
} from '../state/auth/reducer';
import {usePrivyWalletLogic} from '../services/walletProviders/privy';
import {useDynamicWalletLogic} from './useDynamicWalletLogic';
import {useCustomization} from '../CustomizationProvider';
import {useAppNavigation} from './useAppNavigation';
import {getDynamicClient} from '../services/walletProviders/dynamic';
import {useAppSelector, useAppDispatch} from './useReduxHooks';
import {VersionedTransaction, PublicKey} from '@solana/web3.js';

/**
 * Interface for a standardized wallet object returned by useAuth
 * This ensures that regardless of provider, components get a consistent interface
 */
export interface StandardWallet {
  provider: 'privy' | 'dynamic' | 'turnkey' | 'mwa' | string;
  address: string | null;
  publicKey: string | null;
  /**
   * The raw provider-specific wallet object.
   * This is useful if you need to access provider-specific features.
   */
  rawWallet: any;
  /**
   * Get the provider instance for this wallet
   * This is used for signing transactions
   */
  getProvider: () => Promise<any>;
  /**
   * Get wallet identifier info for debugging
   */
  getWalletInfo: () => { 
    walletType: string;
    address: string | null;
  };
}

/**
 * Summarized usage:
 *  1) Read which provider is set from config.
 *  2) If 'privy', we handle via `usePrivyWalletLogic`.
 *  3) If 'dynamic', we handle via `useDynamicWalletLogic`.
 *  4) If 'turnkey', we do not have a full usage example, but we show how you might do it.
 */
export function useAuth() {
  const {auth: authConfig} = useCustomization();
  const selectedProvider = authConfig.provider;
  const dispatch = useAppDispatch();
  const navigation = useAppNavigation();
  const authState = useAppSelector(state => state.auth);

  // Get wallet address and provider from Redux state
  const storedAddress = authState.address;
  const storedProvider = authState.provider;
  const storedUserId = authState.userId;
  const storedWallets = authState.wallets;

  // Fetch wallets when userId is available
  useEffect(() => {
    if (storedUserId && authState.isLoggedIn && storedWallets.length === 0) {
      dispatch(fetchUserWallets(storedUserId))
        .catch((err: Error) => {
          console.error('Error fetching user wallets:', err);
        });
    }
  }, [storedUserId, authState.isLoggedIn, storedWallets.length, dispatch]);

  /** PRIVY CASE */
  if (selectedProvider === 'privy') {
    const {
      handlePrivyLogin,
      handlePrivyLogout,
      monitorSolanaWallet,
      user,
      solanaWallet,
    } = usePrivyWalletLogic();

    // Create a standardized wallet object for Privy
    const standardWallet: StandardWallet | null = solanaWallet?.wallets?.[0] ? {
      provider: 'privy',
      address: solanaWallet.wallets[0].publicKey,
      publicKey: solanaWallet.wallets[0].publicKey,
      rawWallet: solanaWallet.wallets[0],
      getWalletInfo: () => ({
        walletType: 'Privy',
        address: solanaWallet.wallets?.[0]?.publicKey || null,
      }),
      getProvider: async () => {
        if (solanaWallet?.getProvider) {
          return solanaWallet.getProvider();
        }
        throw new Error('Privy wallet provider not available');
      },
    } : null;

    const loginWithGoogle = useCallback(async () => {
      await handlePrivyLogin({
        loginMethod: 'google',
        setStatusMessage: () => {},
      });
      await monitorSolanaWallet({
        selectedProvider: 'privy',
        setStatusMessage: () => {},
        onWalletConnected: info => {
          // Store both user ID and wallet
          const userId = user?.id || info.address;
          const walletObj: Wallet = {
            user_id: userId,
            wallet_address: info.address,
            provider: 'privy',
            name: 'Privy Wallet',
            is_primary: true
          };
          
          dispatch(loginSuccess({
            provider: 'privy', 
            address: info.address, 
            userId: userId,
            wallet: walletObj
          }));
          
          // Add the wallet to database
          dispatch(addWallet({
            userId: userId,
            walletAddress: info.address,
            provider: 'privy',
            name: 'Privy Wallet',
          }))
            .unwrap()
            .catch((error: Error) => {
              console.error('Error adding wallet:', error);
            });
          
          navigation.navigate('MainTabs');
        },
      });
    }, [handlePrivyLogin, monitorSolanaWallet, dispatch, navigation, user]);

    const loginWithApple = useCallback(async () => {
      await handlePrivyLogin({
        loginMethod: 'apple',
        setStatusMessage: () => {},
      });
      await monitorSolanaWallet({
        selectedProvider: 'privy',
        setStatusMessage: () => {},
        onWalletConnected: info => {
          // Store both user ID and wallet
          const userId = user?.id || info.address;
          const walletObj: Wallet = {
            user_id: userId,
            wallet_address: info.address,
            provider: 'privy',
            name: 'Privy Wallet',
            is_primary: true
          };
          
          dispatch(loginSuccess({
            provider: 'privy', 
            address: info.address, 
            userId: userId,
            wallet: walletObj
          }));
          
          // Add the wallet to database
          dispatch(addWallet({
            userId: userId,
            walletAddress: info.address,
            provider: 'privy',
            name: 'Privy Wallet',
          }))
            .unwrap()
            .catch((error: Error) => {
              console.error('Error adding wallet:', error);
            });
          
          navigation.navigate('MainTabs');
        },
      });
    }, [handlePrivyLogin, monitorSolanaWallet, dispatch, navigation, user]);

    const loginWithEmail = useCallback(async () => {
      await handlePrivyLogin({
        loginMethod: 'email',
        setStatusMessage: () => {},
      });
      await monitorSolanaWallet({
        selectedProvider: 'privy',
        setStatusMessage: () => {},
        onWalletConnected: info => {
          // Store both user ID and wallet
          const userId = user?.id || info.address;
          const walletObj: Wallet = {
            user_id: userId,
            wallet_address: info.address,
            provider: 'privy',
            name: 'Privy Wallet',
            is_primary: true
          };
          
          dispatch(loginSuccess({
            provider: 'privy', 
            address: info.address, 
            userId: userId,
            wallet: walletObj
          }));
          
          // Add the wallet to database
          dispatch(addWallet({
            userId: userId,
            walletAddress: info.address,
            provider: 'privy',
            name: 'Privy Wallet',
          }))
            .unwrap()
            .catch((error: Error) => {
              console.error('Error adding wallet:', error);
            });
          
          navigation.navigate('MainTabs');
        },
      });
    }, [handlePrivyLogin, monitorSolanaWallet, dispatch, navigation, user]);

    const logout = useCallback(async () => {
      await handlePrivyLogout(() => {});
      dispatch(logoutSuccess());
    }, [handlePrivyLogout, dispatch]);

    // Add function to create a new wallet
    const createNewWallet = useCallback(async (name?: string) => {
      if (!user?.id) {
        throw new Error('User is not authenticated');
      }
      
      try {
        // This would need to be implemented in Privy's SDK
        // For now, we'll just log that this isn't implemented
        console.warn('Creating new wallets with Privy is not implemented in this demo');
        return null;
      } catch (error) {
        console.error('Error creating new wallet:', error);
        throw error;
      }
    }, [user?.id]);

    // Switch between wallets
    const handleSwitchWallet = useCallback((walletAddress: string) => {
      dispatch(switchWallet(walletAddress));
    }, [dispatch]);

    // Set a wallet as primary
    const handleSetPrimaryWallet = useCallback((walletAddress: string) => {
      if (!storedUserId) {
        throw new Error('User ID not available');
      }
      dispatch(setPrimaryWallet({
        userId: storedUserId,
        walletAddress,
      }))
        .unwrap()
        .catch((error: Error) => {
          console.error('Error setting primary wallet:', error);
        });
    }, [dispatch, storedUserId]);

    // Remove a wallet
    const handleRemoveWallet = useCallback((walletAddress: string) => {
      if (!storedUserId) {
        throw new Error('User ID not available');
      }
      dispatch(removeWallet({
        userId: storedUserId,
        walletAddress,
      }))
        .unwrap()
        .catch((error: Error) => {
          console.error('Error removing wallet:', error);
        });
    }, [dispatch, storedUserId]);

    return {
      status: '',
      loginWithGoogle,
      loginWithApple,
      loginWithEmail,
      logout,
      user,
      solanaWallet, // Keep for backward compatibility
      wallet: standardWallet, // Add standardized wallet
      wallets: storedWallets, // Return all wallets
      createNewWallet, // Function to create a new wallet
      switchWallet: handleSwitchWallet, // Function to switch wallets
      setPrimaryWallet: handleSetPrimaryWallet, // Function to set primary wallet
      removeWallet: handleRemoveWallet, // Function to remove a wallet
    };
  } else if (selectedProvider === 'dynamic') {
    /** DYNAMIC CASE */
    const {
      handleDynamicLogin,
      handleDynamicLogout,
      walletAddress,
      user,
      isAuthenticated,
      monitorDynamicWallet,
    } = useDynamicWalletLogic();

    // Create a standardized wallet object for Dynamic
    let standardWallet: StandardWallet | null = null;
    
    try {
      // Try to get the Dynamic client and user wallets
      const dynamicClient = getDynamicClient();
      if (dynamicClient?.wallets?.userWallets?.length > 0) {
        const wallet = dynamicClient.wallets.userWallets[0];
        standardWallet = {
          provider: 'dynamic',
          address: wallet.address,
          publicKey: wallet.address,
          rawWallet: wallet,
          getWalletInfo: () => ({
            walletType: 'Dynamic',
            address: wallet.address,
          }),
          getProvider: async () => {
            try {
              // Use the proper Dynamic SDK method to get a signer if available
              if (dynamicClient.solana && typeof dynamicClient.solana.getSigner === 'function') {
                // Get the signer
                const signer = await dynamicClient.solana.getSigner({ wallet });
                
                // Create a custom provider that uses signTransaction + manual send
                // instead of signAndSendTransaction (which shows UI)
                return {
                  _dynamicSdk: true, // Marker to help identify this as a Dynamic provider
                  wallet: wallet,
                  address: wallet.address,
                  _signer: signer, // Store original signer for reference
                  request: async ({ method, params }: any) => {
                    if (method === 'signAndSendTransaction') {
                      const { transaction, connection } = params;
                      
                      console.log('Dynamic custom provider: signAndSendTransaction called');
                      
                      try {
                        // Try to use the direct signAndSendTransaction method from Dynamic SDK
                        console.log('Using Dynamic Solana extension signAndSendTransaction directly');
                        const result = await signer.signAndSendTransaction(transaction, {
                          skipPreflight: false,
                          preflightCommitment: 'confirmed',
                          maxRetries: 3
                        });
                        
                        console.log('Dynamic custom provider: Transaction sent with signature:', result.signature);
                        return { signature: result.signature };
                      } catch (directSignError) {
                        console.error('Direct signAndSendTransaction failed, falling back to manual flow:', directSignError);
                        
                        // 1. Sign the transaction without sending
                        // Only sign if not already signed
                        let signedTx = transaction;
                        const isAlreadySigned = transaction instanceof VersionedTransaction 
                          ? transaction.signatures.length > 0 && transaction.signatures.some((sig: Uint8Array) => sig.length > 0)
                          : transaction.signatures.length > 0 && transaction.signatures.some((sig: any) => sig.signature !== null);
                            
                        if (!isAlreadySigned) {
                          console.log('Dynamic custom provider: Transaction not signed, signing now');
                          try {
                            // Make sure legacy transactions have blockhash and feePayer
                            if (!(transaction instanceof VersionedTransaction)) {
                              console.log('Signing legacy transaction');
                              // Make sure feePayer is set correctly
                              if (!transaction.feePayer) {
                                transaction.feePayer = new PublicKey(wallet.address);
                              }
                              
                              // Make sure recent blockhash is set
                              if (!transaction.recentBlockhash) {
                                const { blockhash } = await connection.getLatestBlockhash('confirmed');
                                transaction.recentBlockhash = blockhash;
                              }
                            } else {
                              console.log('Signing versioned transaction');
                            }
                            
                            signedTx = await signer.signTransaction(transaction);
                            console.log('Transaction signed successfully');
                          } catch (signError: any) {
                            console.error('Dynamic custom provider: Error during transaction signing:', signError);
                            throw signError;
                          }
                        } else {
                          console.log('Transaction already signed, using as is');
                        }
                        
                        // 2. Send the signed transaction ourselves
                        console.log('Dynamic custom provider: Sending signed transaction');
                        try {
                          // Serialize the transaction
                          const rawTransaction = signedTx instanceof VersionedTransaction 
                            ? signedTx.serialize()
                            : signedTx.serialize();
                            
                          // 3. Send the signed transaction with explicit options
                          const signature = await connection.sendRawTransaction(rawTransaction, {
                            skipPreflight: false, 
                            preflightCommitment: 'confirmed',
                            maxRetries: 3
                          });
                          
                          console.log('Dynamic custom provider: Transaction sent with signature:', signature);
                          return { signature };
                        } catch (sendError: any) {
                          console.error('Dynamic custom provider: Error sending transaction:', sendError);
                          if (sendError.logs) {
                            console.error('Transaction logs:', sendError.logs);
                          }
                          throw sendError;
                        }
                      }
                    }
                    throw new Error(`Method ${method} not supported by Dynamic signer`);
                  }
                };
              }
              
              // Fallback to wallet's own getProvider if available
              if (wallet.getProvider && typeof wallet.getProvider === 'function') {
                return wallet.getProvider();
              }
              
              throw new Error('Dynamic wallet provider not available');
            } catch (error) {
              console.error('Error getting Dynamic wallet provider:', error);
              throw error;
            }
          }
        };
      } else if (walletAddress) {
        // Fallback if we have walletAddress but can't access userWallets directly
        standardWallet = {
          provider: 'dynamic',
          address: walletAddress,
          publicKey: walletAddress,
          rawWallet: {
            address: walletAddress
          },
          getWalletInfo: () => ({
            walletType: 'Dynamic',
            address: walletAddress,
          }),
          getProvider: async () => {
            try {
              const client = getDynamicClient();
              if (!client) throw new Error('Dynamic client not initialized');
              
              // First try to find the wallet in userWallets
              const wallets = client.wallets?.userWallets || [];
              const wallet = wallets.find((w: any) => w.address === walletAddress);
              
              if (wallet) {
                // Use the proper Dynamic SDK method to get a signer if available
                if (client.solana && typeof client.solana.getSigner === 'function') {
                  const signer = await client.solana.getSigner({ wallet });
                  return {
                    _dynamicSdk: true, // Marker to help identify this as a Dynamic provider
                    wallet: wallet,
                    address: wallet.address,
                    _signer: signer, // Store original signer for reference
                    request: async ({ method, params }: any) => {
                      if (method === 'signAndSendTransaction') {
                        const { transaction, connection } = params;
                        
                        console.log('Dynamic custom provider: signAndSendTransaction called');
                        
                        try {
                          // Try to use the direct signAndSendTransaction method from Dynamic SDK
                          console.log('Using Dynamic Solana extension signAndSendTransaction directly');
                          const result = await signer.signAndSendTransaction(transaction, {
                            skipPreflight: false,
                            preflightCommitment: 'confirmed',
                            maxRetries: 3
                          });
                          
                          console.log('Dynamic custom provider: Transaction sent with signature:', result.signature);
                          return { signature: result.signature };
                        } catch (directSignError) {
                          console.error('Direct signAndSendTransaction failed, falling back to manual flow:', directSignError);
                          
                          // 1. Sign the transaction without sending
                          // Only sign if not already signed
                          let signedTx = transaction;
                          const isAlreadySigned = transaction instanceof VersionedTransaction 
                            ? transaction.signatures.length > 0 && transaction.signatures.some((sig: Uint8Array) => sig.length > 0)
                            : transaction.signatures.length > 0 && transaction.signatures.some((sig: any) => sig.signature !== null);
                            
                          if (!isAlreadySigned) {
                            console.log('Dynamic custom provider: Transaction not signed, signing now');
                            try {
                              // Make sure legacy transactions have blockhash and feePayer
                              if (!(transaction instanceof VersionedTransaction)) {
                                console.log('Signing legacy transaction');
                                // Make sure feePayer is set correctly
                                if (!transaction.feePayer) {
                                  transaction.feePayer = new PublicKey(wallet.address);
                                }
                                
                                // Make sure recent blockhash is set
                                if (!transaction.recentBlockhash) {
                                  const { blockhash } = await connection.getLatestBlockhash('confirmed');
                                  transaction.recentBlockhash = blockhash;
                                }
                              } else {
                                console.log('Signing versioned transaction');
                              }
                              
                              signedTx = await signer.signTransaction(transaction);
                              console.log('Transaction signed successfully');
                            } catch (signError: any) {
                              console.error('Dynamic custom provider: Error during transaction signing:', signError);
                              throw signError;
                            }
                          } else {
                            console.log('Transaction already signed, using as is');
                          }
                          
                          // 2. Send the signed transaction ourselves
                          console.log('Dynamic custom provider: Sending signed transaction');
                          try {
                            // Serialize the transaction
                            const rawTransaction = signedTx instanceof VersionedTransaction 
                              ? signedTx.serialize()
                              : signedTx.serialize();
                              
                            // 3. Send the signed transaction with explicit options
                            const signature = await connection.sendRawTransaction(rawTransaction, {
                              skipPreflight: false, 
                              preflightCommitment: 'confirmed',
                              maxRetries: 3
                            });
                            
                            console.log('Dynamic custom provider: Transaction sent with signature:', signature);
                            return { signature };
                          } catch (sendError: any) {
                            console.error('Dynamic custom provider: Error sending transaction:', sendError);
                            if (sendError.logs) {
                              console.error('Transaction logs:', sendError.logs);
                            }
                            throw sendError;
                          }
                        }
                      }
                      throw new Error(`Method ${method} not supported by Dynamic signer`);
                    }
                  };
                }
                
                // Fallback to wallet's own getProvider if available
                if (wallet.getProvider && typeof wallet.getProvider === 'function') {
                  return wallet.getProvider();
                }
              }
              
              throw new Error('No wallet found with this address or provider not available');
            } catch (error) {
              console.error('Error getting Dynamic wallet provider:', error);
              throw error;
            }
          }
        };
      }
    } catch (e) {
      // Don't throw here, just return null for wallet
      console.warn('Failed to initialize Dynamic wallet:', e);
    }

    const handleSuccessfulLogin = useCallback((info: {provider: 'dynamic', address: string}) => {
      const userId = user?.id || info.address;
      const walletObj: Wallet = {
        user_id: userId,
        wallet_address: info.address,
        provider: 'dynamic',
        name: 'Dynamic Wallet',
        is_primary: true
      };
      
      dispatch(loginSuccess({
        provider: 'dynamic', 
        address: info.address, 
        userId: userId,
        wallet: walletObj
      }));
      
      // Also add as a wallet
      dispatch(addWallet({
        userId: userId,
        walletAddress: info.address,
        provider: 'dynamic',
        name: 'Dynamic Wallet',
      }))
        .unwrap()
        .catch((error: Error) => {
          console.error('Error adding wallet:', error);
        });
      
      navigation.navigate('MainTabs');
    }, [dispatch, navigation, user]);

    const loginWithEmail = useCallback(async () => {
      await handleDynamicLogin({
        loginMethod: 'email',
        setStatusMessage: () => {},
        onSuccess: handleSuccessfulLogin,
      });
    }, [handleDynamicLogin, handleSuccessfulLogin]);

    const loginWithSMS = useCallback(async () => {
      await handleDynamicLogin({
        loginMethod: 'sms',
        setStatusMessage: () => {},
        onSuccess: handleSuccessfulLogin,
      });
    }, [handleDynamicLogin, handleSuccessfulLogin]);

    const loginWithGoogle = useCallback(async () => {
      await handleDynamicLogin({
        loginMethod: 'google',
        setStatusMessage: () => {},
        onSuccess: handleSuccessfulLogin,
        navigation,
      });
    }, [handleDynamicLogin, handleSuccessfulLogin, navigation]);

    const loginWithApple = useCallback(async () => {
      await handleDynamicLogin({
        loginMethod: 'apple',
        setStatusMessage: () => {},
        onSuccess: handleSuccessfulLogin,
        navigation,
      });
    }, [handleDynamicLogin, handleSuccessfulLogin, navigation]);

    const logout = useCallback(async () => {
      await handleDynamicLogout(() => {});
      dispatch(logoutSuccess());
    }, [handleDynamicLogout, dispatch]);

    // Add function to create a new embedded wallet
    const createNewWallet = useCallback(async (name?: string) => {
      if (!storedUserId) {
        throw new Error('User is not authenticated');
      }

      try {
        const dynamicClient = getDynamicClient();
        if (!dynamicClient || !dynamicClient.wallets) {
          throw new Error('Dynamic client not initialized');
        }

        // Create a new embedded wallet using Dynamic SDK
        console.log('Creating new embedded wallet...');
        const newWallet = await dynamicClient.wallets.createEmbeddedWallet({
          waitForSigner: true
        });

        if (!newWallet || !newWallet.address) {
          throw new Error('Failed to create new wallet');
        }

        console.log('New wallet created with address:', newWallet.address);

        // Save the wallet in our database
        const walletName = name || `Dynamic Wallet ${storedWallets.length + 1}`;
        await dispatch(addWallet({
          userId: storedUserId,
          walletAddress: newWallet.address,
          provider: 'dynamic',
          name: walletName,
        })).unwrap();

        return newWallet;
      } catch (error) {
        console.error('Error creating new wallet:', error);
        throw error;
      }
    }, [storedUserId, storedWallets.length, dispatch]);

    // Switch between wallets
    const handleSwitchWallet = useCallback((walletAddress: string) => {
      dispatch(switchWallet(walletAddress));
    }, [dispatch]);

    // Set a wallet as primary
    const handleSetPrimaryWallet = useCallback((walletAddress: string) => {
      if (!storedUserId) {
        throw new Error('User ID not available');
      }
      dispatch(setPrimaryWallet({
        userId: storedUserId,
        walletAddress,
      }))
        .unwrap()
        .catch((error: Error) => {
          console.error('Error setting primary wallet:', error);
        });
    }, [dispatch, storedUserId]);

    // Remove a wallet
    const handleRemoveWallet = useCallback((walletAddress: string) => {
      if (!storedUserId) {
        throw new Error('User ID not available');
      }
      dispatch(removeWallet({
        userId: storedUserId,
        walletAddress,
      }))
        .unwrap()
        .catch((error: Error) => {
          console.error('Error removing wallet:', error);
        });
    }, [dispatch, storedUserId]);

    // Create a solanaWallet object that mimics the Privy structure for compatibility
    const solanaWallet = standardWallet ? {
      wallets: [{
        publicKey: standardWallet.address,
        address: standardWallet.address
      }],
      getProvider: standardWallet.getProvider
    } : null;

    return {
      status: isAuthenticated ? 'authenticated' : '',
      loginWithEmail,
      loginWithSMS,
      loginWithGoogle,
      loginWithApple,
      logout,
      user: walletAddress ? {id: walletAddress} : user,
      solanaWallet, // Add compatibility object
      wallet: standardWallet, // Add standardized wallet
      wallets: storedWallets, // Return all wallets
      createNewWallet, // Function to create a new wallet
      switchWallet: handleSwitchWallet, // Function to switch wallets
      setPrimaryWallet: handleSetPrimaryWallet, // Function to set primary wallet
      removeWallet: handleRemoveWallet, // Function to remove a wallet
    };
  } else if (selectedProvider === 'turnkey') {
    /** TURNKEY CASE */
    // Example: you would implement the Turnkey logic similarly to above
    const logout = useCallback(async () => {
      // For Turnkey, you might do some session reset
      dispatch(logoutSuccess());
    }, [dispatch]);

    const createNewWallet = useCallback(async (name?: string) => {
      if (!storedUserId) {
        throw new Error('User is not authenticated');
      }
      console.warn('Creating new wallets with Turnkey is not implemented in this demo');
      return null;
    }, [storedUserId]);

    // Switch between wallets
    const handleSwitchWallet = useCallback((walletAddress: string) => {
      dispatch(switchWallet(walletAddress));
    }, [dispatch]);

    // Set a wallet as primary
    const handleSetPrimaryWallet = useCallback((walletAddress: string) => {
      if (!storedUserId) {
        throw new Error('User ID not available');
      }
      dispatch(setPrimaryWallet({
        userId: storedUserId,
        walletAddress,
      }))
        .unwrap()
        .catch((error: Error) => {
          console.error('Error setting primary wallet:', error);
        });
    }, [dispatch, storedUserId]);

    // Remove a wallet
    const handleRemoveWallet = useCallback((walletAddress: string) => {
      if (!storedUserId) {
        throw new Error('User ID not available');
      }
      dispatch(removeWallet({
        userId: storedUserId,
        walletAddress,
      }))
        .unwrap()
        .catch((error: Error) => {
          console.error('Error removing wallet:', error);
        });
    }, [dispatch, storedUserId]);

    return {
      status: '',
      loginWithEmail: async () => {
        // Turnkey login not fully implemented in this example
      },
      logout,
      user: null,
      solanaWallet: null,
      wallet: null,
      wallets: storedWallets,
      createNewWallet,
      switchWallet: handleSwitchWallet,
      setPrimaryWallet: handleSetPrimaryWallet,
      removeWallet: handleRemoveWallet,
    };
  }

  // ADDED: If we're here, check for MWA wallet in Redux state
  if (storedProvider === 'mwa' && storedAddress) {
    // Create standardized wallet object for MWA
    const mwaWallet: StandardWallet = {
      provider: 'mwa',
      address: storedAddress,
      publicKey: storedAddress,
      rawWallet: { address: storedAddress },
      getWalletInfo: () => ({
        walletType: 'MWA',
        address: storedAddress,
      }),
      // For MWA, we don't have a provider as transactions are handled by the Phantom app
      getProvider: async () => {
        // Throw error with useful message about MWA not having a provider
        throw new Error('MWA uses external wallet for signing. This is expected behavior.');
      }
    };

    // Create a solanaWallet object for backward compatibility
    const solanaWallet = {
      wallets: [{
        publicKey: storedAddress,
        address: storedAddress
      }],
      // Same behavior as the standardized wallet
      getProvider: mwaWallet.getProvider
    };

    // Add function to create a new MWA wallet
    const createNewWallet = useCallback(async (name?: string) => {
      if (!storedUserId) {
        throw new Error('User is not authenticated');
      }
      console.warn('Creating new MWA wallets requires the Phantom app and is not implemented in this demo');
      return null;
    }, [storedUserId]);

    // Switch between wallets
    const handleSwitchWallet = useCallback((walletAddress: string) => {
      dispatch(switchWallet(walletAddress));
    }, [dispatch]);

    // Set a wallet as primary
    const handleSetPrimaryWallet = useCallback((walletAddress: string) => {
      if (!storedUserId) {
        throw new Error('User ID not available');
      }
      dispatch(setPrimaryWallet({
        userId: storedUserId,
        walletAddress,
      }))
        .unwrap()
        .catch((error: Error) => {
          console.error('Error setting primary wallet:', error);
        });
    }, [dispatch, storedUserId]);

    // Remove a wallet
    const handleRemoveWallet = useCallback((walletAddress: string) => {
      if (!storedUserId) {
        throw new Error('User ID not available');
      }
      dispatch(removeWallet({
        userId: storedUserId,
        walletAddress,
      }))
        .unwrap()
        .catch((error: Error) => {
          console.error('Error removing wallet:', error);
        });
    }, [dispatch, storedUserId]);

    return {
      status: 'authenticated',
      logout: async () => {
        dispatch(logoutSuccess());
      },
      user: { id: storedUserId || storedAddress },
      solanaWallet,
      wallet: mwaWallet,
      wallets: storedWallets,
      createNewWallet,
      switchWallet: handleSwitchWallet,
      setPrimaryWallet: handleSetPrimaryWallet,
      removeWallet: handleRemoveWallet,
    };
  }

  // If no recognized provider, just return empties with necessary functions
  const createNewWallet = useCallback(async (name?: string) => {
    if (!storedUserId) {
      throw new Error('User is not authenticated');
    }
    console.warn('Creating wallets requires logging in first');
    return null;
  }, [storedUserId]);

  return {
    status: '', 
    logout: async () => {},
    solanaWallet: null,
    wallet: null,
    wallets: [],
    createNewWallet,
    switchWallet: () => {},
    setPrimaryWallet: () => {},
    removeWallet: () => {},
  };
}
