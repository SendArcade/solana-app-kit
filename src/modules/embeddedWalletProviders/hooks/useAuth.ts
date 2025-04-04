import {useCallback} from 'react';
import {useDispatch} from 'react-redux';
import {loginSuccess, logoutSuccess} from '../../../state/auth/reducer';
import {usePrivyWalletLogic} from '../services/walletProviders/privy';
import {useCustomization} from '../../../CustomizationProvider';
import {useAppNavigation} from '../../../hooks/useAppNavigation';
import {getDynamicClient} from '../services/walletProviders/dynamic';
import {useAppSelector} from '../../../hooks/useReduxHooks';
import {VersionedTransaction, PublicKey} from '@solana/web3.js';
import {useLoginWithOAuth} from '@privy-io/expo';
import { useDynamicWalletLogic } from './useDynamicWalletLogic';
import { StandardWallet, LoginMethod, WalletMonitorParams } from '../types';

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
  const dispatch = useDispatch();
  const navigation = useAppNavigation();
  const authState = useAppSelector(state => state.auth);

  // Get wallet address and provider from Redux state
  const storedAddress = authState.address;
  const storedProvider = authState.provider;

  /** PRIVY CASE */
  if (selectedProvider === 'privy') {
    const {
      handlePrivyLogin,
      handlePrivyLogout,
      monitorSolanaWallet,
      user,
      solanaWallet,
    } = usePrivyWalletLogic();
    
    // Get the direct Privy OAuth login hook
    const {login: loginWithOAuth} = useLoginWithOAuth();

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
      try {
        // Use direct OAuth login instead of handlePrivyLogin
        await loginWithOAuth({ provider: 'google' });
        
        // Continue monitoring the wallet after login
        await monitorSolanaWallet({
          selectedProvider: 'privy',
          setStatusMessage: () => {},
          onWalletConnected: info => {
            dispatch(loginSuccess({provider: 'privy', address: info.address}));
            navigation.navigate('MainTabs');
          },
        });
      } catch (error) {
        console.error('Google login error:', error);
      }
    }, [loginWithOAuth, monitorSolanaWallet, dispatch, navigation]);

    const loginWithApple = useCallback(async () => {
      try {
        // Use direct OAuth login instead of handlePrivyLogin
        await loginWithOAuth({ provider: 'apple' });
        
        // Continue monitoring the wallet after login
        await monitorSolanaWallet({
          selectedProvider: 'privy',
          setStatusMessage: () => {},
          onWalletConnected: info => {
            dispatch(loginSuccess({provider: 'privy', address: info.address}));
            navigation.navigate('MainTabs');
          },
        });
      } catch (error) {
        console.error('Apple login error:', error);
      }
    }, [loginWithOAuth, monitorSolanaWallet, dispatch, navigation]);

    const loginWithEmail = useCallback(async () => {
      await handlePrivyLogin({
        loginMethod: 'email',
        setStatusMessage: () => {},
      });
      await monitorSolanaWallet({
        selectedProvider: 'privy',
        setStatusMessage: () => {},
        onWalletConnected: info => {
          dispatch(loginSuccess({provider: 'privy', address: info.address}));
          navigation.navigate('MainTabs');
        },
      });
    }, [handlePrivyLogin, monitorSolanaWallet, dispatch, navigation]);

    const logout = useCallback(async () => {
      await handlePrivyLogout(() => {});
      dispatch(logoutSuccess());
    }, [handlePrivyLogout, dispatch]);

    return {
      status: '',
      loginWithGoogle,
      loginWithApple,
      loginWithEmail,
      logout,
      user,
      solanaWallet, // Keep for backward compatibility
      wallet: standardWallet, // Add standardized wallet
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
      dispatch(loginSuccess({provider: 'dynamic', address: info.address}));
      navigation.navigate('MainTabs');
    }, [dispatch, navigation]);

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
    };
  } else if (selectedProvider === 'turnkey') {
    /** TURNKEY CASE */
    // Example: you would implement the Turnkey logic similarly to above
    const logout = useCallback(async () => {
      // For Turnkey, you might do some session reset
      dispatch(logoutSuccess());
    }, [dispatch]);

    return {
      status: '',
      loginWithEmail: async () => {
        // Turnkey login not fully implemented in this example
      },
      logout,
      user: null,
      solanaWallet: null,
      wallet: null,
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

    return {
      status: 'authenticated',
      logout: async () => {
        dispatch(logoutSuccess());
      },
      user: { id: storedAddress },
      solanaWallet,
      wallet: mwaWallet,
    };
  }

  // If no recognized provider, just return empties
  return {
    status: '', 
    logout: async () => {},
    solanaWallet: null,
    wallet: null
  };
}
