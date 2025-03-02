// File: src/hooks/useAuth.ts
import {useCallback} from 'react';
import {useDispatch} from 'react-redux';
import {loginSuccess, logoutSuccess} from '../state/auth/reducer';
import {usePrivyWalletLogic} from '../services/walletProviders/privy';
import {useDynamicWalletLogic} from './useDynamicWalletLogic';
import {useCustomization} from '../CustomizationProvider';

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

  /** PRIVY CASE */
  if (selectedProvider === 'privy') {
    const {
      handlePrivyLogin,
      handlePrivyLogout,
      monitorSolanaWallet,
      user,
      solanaWallet,
    } = usePrivyWalletLogic();

    const loginWithGoogle = useCallback(async () => {
      await handlePrivyLogin({
        loginMethod: 'google',
        setStatusMessage: () => {},
      });
      await monitorSolanaWallet({
        selectedProvider: 'privy',
        setStatusMessage: () => {},
        onWalletConnected: info => {
          dispatch(loginSuccess({provider: 'privy', address: info.address}));
        },
      });
    }, [handlePrivyLogin, monitorSolanaWallet, dispatch]);

    const loginWithApple = useCallback(async () => {
      await handlePrivyLogin({
        loginMethod: 'apple',
        setStatusMessage: () => {},
      });
      await monitorSolanaWallet({
        selectedProvider: 'privy',
        setStatusMessage: () => {},
        onWalletConnected: info => {
          dispatch(loginSuccess({provider: 'privy', address: info.address}));
        },
      });
    }, [handlePrivyLogin, monitorSolanaWallet, dispatch]);

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
        },
      });
    }, [handlePrivyLogin, monitorSolanaWallet, dispatch]);

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
      solanaWallet,
    };
  } else if (selectedProvider === 'dynamic') {
    /** DYNAMIC CASE */
    const {
      handleDynamicLogin,
      handleDynamicLogout,
      walletAddress,
      user,
      monitorDynamicWallet,
    } = useDynamicWalletLogic();

    const loginWithEmail = useCallback(async () => {
      await handleDynamicLogin({
        loginMethod: 'email',
        setStatusMessage: () => {},
      });
      if (walletAddress) {
        dispatch(loginSuccess({provider: 'dynamic', address: walletAddress}));
      }
    }, [handleDynamicLogin, dispatch, walletAddress]);

    const loginWithSMS = useCallback(async () => {
      await handleDynamicLogin({
        loginMethod: 'sms',
        setStatusMessage: () => {},
      });
      if (walletAddress) {
        dispatch(loginSuccess({provider: 'dynamic', address: walletAddress}));
      }
    }, [handleDynamicLogin, dispatch, walletAddress]);

    const loginWithGoogle = useCallback(async () => {
      await handleDynamicLogin({
        loginMethod: 'google',
        setStatusMessage: () => {},
      });
      if (walletAddress) {
        dispatch(loginSuccess({provider: 'dynamic', address: walletAddress}));
      }
    }, [handleDynamicLogin, dispatch, walletAddress]);

    const logout = useCallback(async () => {
      await handleDynamicLogout(() => {});
      dispatch(logoutSuccess());
    }, [handleDynamicLogout, dispatch]);

    return {
      status: '',
      loginWithEmail,
      loginWithSMS,
      loginWithGoogle,
      logout,
      user: walletAddress ? {id: walletAddress} : user,
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
    };
  }

  // If no recognized provider, just return empties
  return {status: '', logout: async () => {}};
}
